import assert from "node:assert/strict";
import test from "node:test";
import { readLevels, recordLevel, totalStars, unlockedLevel } from "../../../shared/game-core";
import { site } from "../content";
import { share } from "../share";
import {
  cellAt, ghostOf, isDone, isUpright, judgeDrop, levelSeed, makePuzzle, parFor, pieceCount, placePiece, planOf, reslot, shortBy, sidesOf, snapReach,
  startLevel, startTable, starsFor, turnPiece, worldOf, LEVEL_COUNT, type Table,
} from "../lib/game";
import { bannerNote, caption, cardLine, clearLine, compareLine, feat, gridText, nearMiss, paintingName, parseShared, previewTitle, sharedHash, timeText, MAX_SECONDS } from "../lib/link";
import { drawPainting, paintingOf, riverAt } from "../lib/painting";
import { tracePiece, MARGIN, TAB } from "../lib/pieces";

const levels = Array.from({ length: LEVEL_COUNT }, (_, index) => index + 1);
const home = (n: number, id: number, size: number) => [(id % n + 0.5) * (size / n), (Math.floor(id / n) + 0.5) * (size / n)] as const;

/** Plays a whole level the way a careful player would: turn each tray piece upright, then drop it home. Returns the moves made. */
function solve(level: number, slotCount: number, size = 358) {
  const puzzle = makePuzzle(level);
  let table: Table = startTable(puzzle, slotCount), moves = 0;
  while (!isDone(table)) {
    const id = table.slots.find(slot => slot >= 0);
    assert.ok(id !== undefined, `level ${level}: tray empty before the picture is done`);
    for (let turns = 0; !isUpright(table.turns[id!]); turns++) { assert.ok(turns < 4); table = turnPiece(table, id!); moves++; }
    assert.equal(judgeDrop(puzzle.n, id!, table.turns[id!], ...home(puzzle.n, id!, size), size), "snap");
    table = placePiece(table, id!); moves++;
  }
  return { table, moves };
}

test("the same level gives the same cut, turns, tray order and painting on every phone", () => {
  for (const level of [1, 12, 30]) {
    assert.deepEqual(makePuzzle(level), makePuzzle(level));
    assert.deepEqual(paintingOf(levelSeed(level), worldOf(level)), paintingOf(levelSeed(level), worldOf(level)));
  }
  assert.notDeepEqual(makePuzzle(5).order, makePuzzle(6).order);
  const specs = new Set(levels.map(level => JSON.stringify(paintingOf(levelSeed(level), worldOf(level)))));
  assert.equal(specs.size, LEVEL_COUNT, "every level is its own painting");
});

test("30 levels climb one step at a time: 3×3 to 6×6, turned pieces after each new size", () => {
  let last = { n: 3, rotate: false };
  for (const level of levels) {
    const plan = planOf(level);
    assert.ok(plan.n === last.n || (plan.n === last.n + 1 && !plan.rotate), `level ${level} jumps`);
    last = plan;
  }
  assert.deepEqual(planOf(1), { n: 3, rotate: false });
  assert.deepEqual(planOf(30), { n: 6, rotate: true });
  assert.equal(levels.filter(level => planOf(level).rotate)[0], 11);
  assert.ok(levels.every(level => !planOf(level).rotate || makePuzzle(level).turns.some(turns => turns > 0)), "a turned level has turned pieces");
  assert.ok(levels.every(level => planOf(level).rotate || makePuzzle(level).turns.every(turns => turns === 0)));
  assert.ok(ghostOf(1) > ghostOf(11) && ghostOf(11) > ghostOf(21) && ghostOf(21) > 0);
});

test("every cut fits together: neighbours' tabs and blanks match, the frame is flat, every inner side has a knob", () => {
  for (const level of levels) {
    const { n, edges } = makePuzzle(level);
    for (let cell = 0; cell < n * n; cell++) {
      const [top, right, bottom, leftSide] = sidesOf(edges, n, cell), row = Math.floor(cell / n), col = cell % n;
      assert.equal(top === 0, row === 0); assert.equal(bottom === 0, row === n - 1);
      assert.equal(leftSide === 0, col === 0); assert.equal(right === 0, col === n - 1);
      if (col < n - 1) assert.equal(right, -sidesOf(edges, n, cell + 1)[3]);
      if (row < n - 1) assert.equal(bottom, -sidesOf(edges, n, cell + n)[0]);
    }
  }
});

test("every level is solvable from any tray size, and each piece goes in exactly once", () => {
  for (const level of levels) for (const slots of [10, 12]) {
    const { table, moves } = solve(level, slots);
    assert.ok(table.placed.every(Boolean) && table.queue.length === 0 && table.slots.every(slot => slot === -1));
    assert.ok(moves >= pieceCount(level) && moves <= pieceCount(level) * 4);
  }
});

test("the tray refills from the queue and survives a resize without losing or doubling a piece", () => {
  const puzzle = makePuzzle(26);
  let table = startTable(puzzle, 12);
  assert.equal(table.slots.length, 12); assert.equal(table.queue.length, 24);
  const first = table.slots[3], next = table.queue[0];
  table = placePiece(table, first);
  assert.equal(table.slots[3], next, "the next waiting piece takes the empty slot");
  assert.equal(placePiece(table, first), table, "placing twice changes nothing");
  table = reslot(table, 10);
  const waiting = [...table.slots.filter(id => id >= 0), ...table.queue].sort((a, b) => a - b);
  assert.deepEqual(waiting, Array.from({ length: 36 }, (_, id) => id).filter(id => id !== first));
  assert.equal(table.slots.length, 10);
  assert.equal(turnPiece(table, 0).turns[0], table.turns[0] + 1);
  assert.ok(isUpright(0) && isUpright(8) && !isUpright(3));
});

test("drops snap generously, even 6×6 on a 320px phone, and say why a near miss failed", () => {
  const size = 288, n = 6, cell = size / n, reach = snapReach(cell);
  assert.ok(reach >= 24 && reach >= cell * 0.5, `reach ${reach}`);
  const [x, y] = home(n, 14, size);
  assert.equal(judgeDrop(n, 14, 0, x + reach - 1, y, size), "snap");
  assert.equal(judgeDrop(n, 14, 4, x, y + reach - 1, size), "snap");
  assert.equal(judgeDrop(n, 14, 0, x + reach + 1, y, size), "wrong");
  assert.equal(judgeDrop(n, 14, 1, x, y, size), "turn");
  assert.equal(judgeDrop(n, 14, 0, x, size + cell, size), "away");
  assert.equal(judgeDrop(n, 14, 0, Number.NaN, y, size), "away");
  assert.equal(judgeDrop(3, 0, 0, 22, 22, 358), "snap", "3×3 forgives a drop well off centre");
  assert.equal(cellAt(n, x, y, size), 14);
  assert.equal(cellAt(n, -1, 5, size), -1);
  assert.equal(cellAt(n, size, 5, size), -1);
});

test("piece outlines: knobs stay inside the canvas margin, the frame side is straight", () => {
  const { edges, n } = makePuzzle(30), size = 60, points: [number, number][] = [];
  const recorder = {
    moveTo: (x: number, y: number) => points.push([x, y]), lineTo: (x: number, y: number) => points.push([x, y]),
    bezierCurveTo: (...values: number[]) => { for (let index = 0; index < 6; index += 2) points.push([values[index], values[index + 1]]); }, closePath: () => {},
  };
  for (let cell = 0; cell < n * n; cell++) {
    points.length = 0;
    tracePiece(recorder, edges, n, cell, 100, 100, size);
    for (const [x, y] of points) {
      assert.ok(x >= 100 - size * MARGIN && x <= 100 + size + size * MARGIN && y >= 100 - size * MARGIN && y <= 100 + size + size * MARGIN, `cell ${cell} pokes out`);
    }
    if (cell < n) assert.ok(points.every(([, y]) => y >= 100 - 1e-9), "the top row's top side is flat");
  }
  assert.ok(TAB < MARGIN);
});

test("stars come from time: par per level, twice par for 2, a finished picture always earns 1", () => {
  assert.equal(parFor(1), 23);
  assert.equal(starsFor(1, 23), 3); assert.equal(starsFor(1, 24), 2); assert.equal(starsFor(1, 46), 2); assert.equal(starsFor(1, 47), 1); assert.equal(starsFor(1, 5999), 1);
  for (const level of levels) {
    assert.ok(parFor(level) >= pieceCount(level) * 2, `level ${level} par too tight`);
    if (level > 1) assert.ok(parFor(level) >= parFor(level - 1) || planOf(level).n === planOf(level - 1).n, `level ${level} par drops`);
  }
  assert.ok(parFor(11) > parFor(10), "turned pieces get more time");
  assert.equal(shortBy(1, 20), null);
  assert.deepEqual(shortBy(1, 30), { stars: 3, seconds: 7 });
  assert.deepEqual(shortBy(1, 50), { stars: 2, seconds: 4 });
  assert.equal(nearMiss(1, 30), "আর ৭ সেকেন্ড আগে পারলে ৩ তারা।");
  assert.equal(nearMiss(1, 10), "");
});

test("a headless run: a scripted player with think time and a few wrong drops ends sanely", () => {
  for (const level of [1, 11, 26]) {
    const puzzle = makePuzzle(level), size = 358;
    let table = startTable(puzzle, 12), seconds = 0, wrong = 0, step = 0;
    while (!isDone(table) && step < 500) {
      step++;
      const id = table.slots.find(slot => slot >= 0)!;
      seconds += 1.6;
      if (step % 5 === 0) {
        // A wrong drop: one cell to the side. It costs time, never the piece.
        const [x, y] = home(puzzle.n, id, size), other = id % puzzle.n ? -size / puzzle.n : size / puzzle.n;
        assert.notEqual(judgeDrop(puzzle.n, id, table.turns[id], x + other, y, size), "snap");
        wrong++; seconds += 1.5;
      }
      while (!isUpright(table.turns[id])) { table = turnPiece(table, id); seconds += 0.4; }
      assert.equal(judgeDrop(puzzle.n, id, table.turns[id], ...home(puzzle.n, id, size), size), "snap");
      table = placePiece(table, id);
    }
    assert.ok(isDone(table), `level ${level} finished`);
    assert.equal(step, pieceCount(level));
    const stars = starsFor(level, Math.round(seconds));
    assert.ok(stars >= 2, `level ${level}: a steady player earns at least 2 stars (${Math.round(seconds)}s, par ${parFor(level)})`);
    assert.ok(wrong > 0);
  }
});

test("progress on the phone goes through readLevels and recordLevel, and opens at the right level", () => {
  let stars = readLevels('{"1":3,"2":2,"3":"x","40":3,"0":1}', LEVEL_COUNT);
  assert.deepEqual(stars, { 1: 3, 2: 2 });
  assert.deepEqual(readLevels("not json", LEVEL_COUNT), {});
  stars = recordLevel(stars, 2, 1);
  assert.equal(stars[2], 2, "a worse run never lowers the stars");
  stars = recordLevel(stars, 3, 3);
  assert.equal(unlockedLevel(stars, LEVEL_COUNT), 4);
  assert.equal(totalStars(stars), 8);
  assert.equal(startLevel(stars, 4), 4);
  assert.equal(startLevel({ 1: 3, 2: 3 }, 3), 3);
  assert.equal(startLevel({ 1: 3, 2: 1 }, 2), 2);
  assert.equal(startLevel({}, 1), 1);
});

test("paintings: the hut stays on dry land, the sky always has something in it, everything stays in the frame", () => {
  for (const level of levels) {
    const painting = paintingOf(levelSeed(level), worldOf(level)), { hut, horizon } = painting;
    const at = riverAt(painting, (hut.y - horizon) / (1 - horizon));
    assert.ok(Math.abs(hut.x - at.x) >= at.half + hut.w * 0.5, `level ${level}: hut in the river`);
    assert.ok(hut.x - hut.w * 0.66 >= 0 && hut.x + hut.w * 0.66 <= 1, `level ${level}: hut off the edge`);
    assert.ok(horizon >= 0.4 && horizon <= 0.48);
    assert.ok(painting.clouds.length >= 2);
    assert.ok(painting.palms.some(palm => palm.y - palm.h < horizon - 0.1), `level ${level}: no palm reaches into the sky`);
    assert.ok(painting.orb.y + painting.orb.r < horizon);
    assert.ok(paintingName(level).length > 4);
    assert.equal(painting.world === 2, painting.stars.length > 0);
  }
});

test("drawPainting runs on any 2D context without touching the DOM", () => {
  let calls = 0;
  const gradient = { addColorStop: () => { calls++; } };
  const context = new Proxy({}, {
    get: (_, key) => key === "createLinearGradient" || key === "createRadialGradient" ? () => gradient : () => { calls++; },
    set: () => true,
  }) as unknown as CanvasRenderingContext2D;
  for (const level of [1, 15, 29]) drawPainting(context, paintingOf(levelSeed(level), worldOf(level)), 0, 0, 400);
  assert.ok(calls > 1000);
});

test("challenge links round-trip, cap, and read naturally", () => {
  const hash = sharedHash({ level: 17, seconds: 130, name: "রাফি" });
  assert.match(hash, /^s=\d+&t=130&l=17&n=/);
  const parsed = parseShared(`#${hash}`);
  assert.deepEqual(parsed, { level: 17, seconds: 130, name: "রাফি" });
  assert.equal(previewTitle(parsed!), "রাফি ২৫ টুকরোর ছবি ২ মিনিট ১০ সেকেন্ডে জোড়া লাগিয়েছে। তুমি পারবে?");
  assert.equal(feat({ level: 1, seconds: 9, name: "" }), "এক বন্ধু ৯ টুকরোর ছবি ৯ সেকেন্ডে জোড়া লাগিয়েছে");
  assert.equal(parseShared(sharedHash({ level: 1, seconds: 99999, name: "" }))!.seconds, MAX_SECONDS);
  assert.equal(parseShared(sharedHash({ level: 1, seconds: 0, name: "" }))!.seconds, 1);
  assert.equal(share.normalize(hash), hash);
  assert.match(share.preview(hash).title, /রাফি/);
  assert.match(bannerNote(parsed!), /রাফির নিজের ফোনের হিসাব/);
  assert.equal(compareLine(100, 130, "রাফি"), "রাফির চেয়ে ৩০ সেকেন্ড আগে!");
  assert.equal(compareLine(135, 130, "রাফি"), "আর একটু হলেই! মাত্র ৫ সেকেন্ড পিছিয়ে।");
  assert.match(compareLine(130, 130, ""), /একদম সমান/);
  assert.match(compareLine(200, 130, "মিম"), /মিম এখনো ১ মিনিট ১০ সেকেন্ড এগিয়ে/);
  assert.equal(timeText(60), "১ মিনিট");
  assert.equal(gridText(26), "৬×৬, ৩৬ টুকরো, ঘোরানো");
  for (const level of levels) {
    assert.ok(clearLine(level).length > 10 && caption({ level, seconds: 40 }).includes("টুকরো"));
    for (const seconds of [5, 60, 900]) assert.ok(cardLine({ level, seconds }).length > 10);
  }
  assert.match(clearLine(30), /৩০টা ছবিই/);
});

test("forged, broken or hostile links are refused", () => {
  const good = new URLSearchParams(sharedHash({ level: 1, seconds: 30, name: "মিম" }));
  const variant = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(good);
    for (const [key, value] of Object.entries(changes)) value === null ? params.delete(key) : params.set(key, value);
    return params.toString();
  };
  for (const bad of [
    variant({ t: "0" }), variant({ t: String(MAX_SECONDS + 1) }), variant({ t: "1.5" }), variant({ t: "-3" }),
    variant({ l: "31" }), variant({ l: "0" }), variant({ l: "01" }), variant({ l: "2" }), variant({ l: null }), variant({ l: "1e1" }),
    variant({ s: String(levelSeed(2)) }), variant({ s: "-1" }), variant({ s: "abc" }),
    "", "#", "garbage", "s=1&t=1", `#${"a".repeat(700)}`, "<script>alert(1)</script>",
  ]) {
    assert.equal(parseShared(bad), null, bad);
    assert.equal(share.normalize(bad), null);
  }
  const hostileName = parseShared(variant({ n: "‮রাফি\u0000" + "ক".repeat(40) }))!;
  assert.ok(hostileName.name.length <= 20 && !hostileName.name.includes("‮") && !hostileName.name.includes("\u0000"));
  assert.ok(share.preview("junk").title.length > 0);
});

test("content meets the SEO limits and speaks তুমি", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.match(site.title, /^জিগস পাজল/);
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.headline && site.headline !== site.title);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.faq.some(item => item.question === "কয়টা লেভেল আছে?"));
  assert.ok(site.faq.some(item => /১৫ ঘরের ধাঁধা|ছবি ফোটাও/.test(item.answer)));
  for (const word of ["নাম", "সময়", "লেভেল", "ছবির নম্বর"]) assert.match(site.privacy.join(" "), new RegExp(word));
  const all = JSON.stringify(site);
  assert.doesNotMatch(all, /আপনি|করুন|দেখুন|অসাধারণ|দারুণ|সহজেই/);
  assert.ok((site.lead.match(/!/g) ?? []).length <= 1);
});
