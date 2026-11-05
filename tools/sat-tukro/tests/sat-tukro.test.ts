import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { site, parentNote } from "../content";
import { share } from "../share";
import { FIGURES, PRINT_IDS } from "../lib/figures";
import { HINT_AFTER, LOST_AFTER, drop, figureView, flipPiece, hintFor, newRound, solutionOf, starsOf, tapPiece, toModel, toView, turnPiece, type Round } from "../lib/game";
import { LEVEL_COUNT } from "../lib/levels";
import { AREA, SET, cellsOf, corners, makeBoard, sameTurn, solve, type Point, type Pose } from "../lib/tangram";

const sorted = (list: readonly string[]) => [...list].sort().join("");

/** Two pieces touch when a corner of one lies on an edge of the other. */
function touching(a: Point[], b: Point[]) {
  const onEdge = ([px, py]: Point, poly: Point[]) => poly.some(([ax, ay], k) => {
    const [bx, by] = poly[(k + 1) % poly.length], cross = (bx - ax) * (py - ay) - (by - ay) * (px - ax);
    const dot = (px - ax) * (bx - ax) + (py - ay) * (by - ay), length = (bx - ax) ** 2 + (by - ay) ** 2;
    return Math.abs(cross) < 1e-6 && dot >= -1e-6 && dot <= length + 1e-6;
  });
  return a.some(p => onEdge(p, b)) || b.some(p => onEdge(p, a));
}

test("every silhouette is one full set, on the lattice, with no overlap, filling 16 square units, in one piece", () => {
  assert.equal(FIGURES.length, 22);
  assert.equal(new Set(FIGURES.map(f => f.id)).size, FIGURES.length, "duplicate id");
  assert.equal(new Set(FIGURES.map(f => f.name)).size, FIGURES.length, "duplicate name");
  for (const figure of FIGURES) {
    assert.equal(figure.name, figure.name.normalize("NFC"), `${figure.id}: name not NFC`);
    assert.equal(sorted(figure.pieces.map(p => p.kind)), sorted(SET), `${figure.id}: not exactly one set`);
    const solution = solutionOf(figure), seen = new Set<number>();
    for (const pose of solution) {
      const cells = cellsOf(corners(pose));
      assert.ok(cells, `${figure.id}: ${pose.kind} is off the lattice`);
      assert.equal(cells.length, AREA[pose.kind] * 4, `${figure.id}: ${pose.kind} covers the wrong area`);
      for (const cell of cells) { assert.ok(!seen.has(cell), `${figure.id}: pieces overlap`); seen.add(cell); }
    }
    assert.equal(seen.size, 64, `${figure.id}: silhouette area`);
    assert.deepEqual(makeBoard(solution).cells, [...seen].sort((a, b) => a - b));
    const shapes = solution.map(corners), reached = new Set([0]);
    for (let again = true; again;) {
      again = false;
      shapes.forEach((shape, index) => { if (!reached.has(index) && [...reached].some(other => touching(shape, shapes[other]))) { reached.add(index); again = true; } });
    }
    assert.equal(reached.size, 7, `${figure.id}: a piece floats free`);
  }
});

test("the solver finds a way to build every silhouette from scratch", () => {
  for (const figure of FIGURES) assert.equal(solve(makeBoard(solutionOf(figure)), new Set(), SET).length, 1, figure.id);
});

test("the mix: Bangladeshi and world pictures, including the ones parents asked for", () => {
  const names = FIGURES.map(f => f.name);
  for (const name of ["নৌকা", "রিকশা", "মাছ", "বিড়াল", "ঘর", "রকেট", "হাঁস", "মানুষ দৌড়াচ্ছে", "তিমি"]) assert.ok(names.includes(name.normalize("NFC")), name);
  const bd = FIGURES.filter(f => f.bd).length;
  assert.ok(bd >= 8 && FIGURES.length - bd >= 8, `bd ${bd}`);
  for (const id of PRINT_IDS) assert.ok(FIGURES.some(f => f.id === id), id);
});

test("view and model frames round-trip, and the tray sits under the picture", () => {
  for (const point of [[1, 2], [-3.5, 7]] as Point[]) {
    const back = toModel(true, toView(true, point));
    assert.ok(Math.abs(back[0] - point[0]) < 1e-9 && Math.abs(back[1] - point[1]) < 1e-9);
  }
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const round = newRound(level, level), [left, top, width, height] = round.layout.box;
    for (const piece of round.pieces.filter(p => !p.done)) {
      const [x, y] = toView(round.upright, piece.home);
      assert.ok(x > left && x < left + width && y > round.layout.trayTop && y < top + height, `level ${level}: piece ${piece.id} outside the tray`);
    }
    assert.ok(width < 11 && height < 17, `level ${level}: board ${width}×${height}`);
  }
});

/** Turn a piece by taps until it matches the slot, then drop it a little off the spot (generous snapping). */
export function place(round: Round, slot: Pose): Round {
  const piece = round.pieces.find(p => !p.done && p.kind === slot.kind)!;
  round = tapPiece(round, piece.id).round;
  for (let taps = 0; !sameTurn(slot, { ...slot, rot: round.pieces[piece.id].rot, flip: round.pieces[piece.id].flip }); taps++) {
    if (slot.kind === "P" && round.pieces[piece.id].flip !== slot.flip) round = flipPiece(round, piece.id).round;
    else round = tapPiece(round, piece.id).round;
    assert.ok(taps < 12, "never matched the turn");
  }
  const result = drop(round, piece.id, slot.x + 0.5, slot.y - 0.4);
  assert.ok(result.outcome === "fit" || result.outcome === "done", `${slot.kind}: ${result.outcome}`);
  return result.round;
}

test("a whole round on every level: follow the shown spots, piece by piece, and it finishes with three stars", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    let round = newRound(level, 100 + level);
    while (round.shown.length) round = place(round, round.shown[0]);
    assert.ok(round.pieces.every(p => p.done), `level ${level}`);
    assert.equal(round.filled.length, 64);
    assert.equal(starsOf(round.misses), 3);
  }
});

test("a wrong spot sends the piece home and counts; three in a row light up the right spot (two after a hard round)", () => {
  for (const ease of [0, 1]) {
    let round = newRound(11, 3, ease);
    while (round.shown.length > 1) round = place(round, round.shown[0]);
    const last = round.shown[0], piece = round.pieces.find(p => !p.done)!;
    const far = round.solution.map(pose => ({ pose, d: Math.hypot(pose.x - last.x, pose.y - last.y) })).sort((a, b) => b.d - a.d)[0].pose;
    const need = ease ? HINT_AFTER - 1 : HINT_AFTER;
    for (let i = 0; i < need; i++) {
      assert.equal(hintFor(round), null, `hint too early (${i})`);
      const result = drop(round, piece.id, far.x, far.y);
      assert.equal(result.outcome, "miss");
      round = result.round;
      assert.ok(round.pieces[piece.id].inTray);
    }
    assert.equal(round.misses, need);
    assert.equal(hintFor(round)?.kind, piece.kind);
    round = place(round, last);
    assert.equal(round.missRun, 0);
    assert.equal(hintFor(round), null);
  }
});

test("gap 5 (a lost child): pieces let go on nothing, and a long quiet, also light the spot", () => {
  let round = newRound(1, 4);
  const piece = round.pieces.find(p => !p.done)!, [left, top] = round.layout.box;
  const aside = toModel(round.upright, [left + 0.4, top + 0.4]);
  assert.equal(hintFor(round, true)?.kind !== undefined, true, "idle hint");
  for (let i = 0; i < LOST_AFTER; i++) {
    assert.equal(hintFor(round), null);
    const result = drop(round, piece.id, ...aside);
    assert.equal(result.outcome, "park");
    round = result.round;
  }
  assert.equal(round.misses, 0, "a drop on nothing is not a wrong try");
  assert.ok(hintFor(round));
});

test("let go away from the picture: the piece waits there; in the tray it goes home; turning it into place clicks it in", () => {
  let round = newRound(8, 5);
  const piece = round.pieces[0], [left, top] = round.layout.box;
  const aside = toModel(round.upright, [left + 0.4, top + 0.4]);
  let result = drop(round, piece.id, ...aside);
  assert.equal(result.outcome, "park");
  result = drop(round, piece.id, ...piece.home);
  assert.equal(result.outcome, "home");
  const slot = round.shown.find(s => s.kind === "L")!;
  round = { ...round, pieces: round.pieces.map(p => p.id === piece.id ? { ...p, rot: slot.rot + 1 } : p) };
  result = drop(round, piece.id, slot.x, slot.y);
  assert.equal(result.outcome, "turn");
  round = result.round;
  for (let i = 0; i < 7 && !round.pieces[piece.id].done; i++) round = turnPiece(round, piece.id).round;
  assert.ok(round.pieces[piece.id].done);
  assert.ok(round.turned >= 1);
});

test("stars: 0–2 wrong tries → 3, up to 5 → 2, more → 1; never from time", () => {
  assert.deepEqual([0, 2, 3, 5, 6, 20].map(starsOf), [3, 3, 2, 2, 1, 1]);
});

test("thumbnails start at the origin and keep the figure's size", () => {
  for (const figure of FIGURES) {
    const view = figureView(figure);
    assert.equal(view.shapes.length, 7);
    assert.equal(new Set(view.shapes.map(s => s.color)).size, 7, `${figure.id}: two pieces share a colour`);
    assert.ok(view.width > 3 && view.width < 10 && view.height > 3 && view.height < 10, `${figure.id}: ${view.width}×${view.height}`);
  }
});

test("share: no link state and no tally", () => {
  assert.equal(share.normalize("level=1"), null);
  assert.equal(share.normalize(""), null);
  assert.equal(share.tally, undefined);
});

function files(dir: string): string[] {
  return readdirSync(dir).flatMap(name => { const path = join(dir, name); return statSync(path).isDirectory() ? (name === "tests" ? [] : files(path)) : [path]; });
}

test("the tool never calls the network, the share client or speech", () => {
  const root = join(import.meta.dirname, "..");
  for (const path of [...files(root), join(root, "../../app/sat-tukro/page.tsx")]) {
    const source = readFileSync(path, "utf8");
    assert.ok(!/\bfetch\s*\(/.test(source), `${path} calls fetch`);
    assert.ok(!/share-client|\/api\//.test(source), `${path} reaches the share client or an API`);
    assert.ok(!/\bspeak\(|SpeakButton|speechSynthesis|useBanglaVoice/.test(source), `${path} uses a voice`);
  }
});

test("content: SEO limits, six or more FAQs, the homework answer first", () => {
  assert.ok(site.title.length <= 45, `title ${site.title.length}`);
  assert.ok(site.title.startsWith("ট্যানগ্রাম"));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, `description ${site.description.length}`);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.faq[0].answer.startsWith("ট্যানগ্রামে টুকরো ৭টা"));
  for (const ask of ["কোন বয়সের জন্য?", "ইন্টারনেট লাগে?", "কোনো তথ্য নেওয়া হয়?", "কতক্ষণ খেলবে?"]) assert.ok(site.faq.some(item => item.question === ask), ask);
  assert.equal(site.privacy.length, 1);
  const texts = [site.title, site.description, site.headline!, site.lead, ...site.steps, ...site.privacy, ...Object.values(parentNote), ...site.faq.flatMap(item => [item.question, item.answer])];
  for (const text of texts) assert.equal(text, text.normalize("NFC"), text);
});
