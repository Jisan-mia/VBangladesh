// The rewrite: the statechart's bug paths replayed against the pure code (lib/session.ts, lib/progress.ts, lib/play.ts),
// the level ladder and its bots, the table's layout and animation, and the old links and saved progress.
// See ai_docs/statecharts/chhobir-tukro/README.md.
import assert from "node:assert/strict";
import test from "node:test";
import { unlockedLevel } from "../../../shared/game-core";
import { homeX, homeY, layoutFor, makeAnim, slotAt, slotX, slotY, Mode } from "../lib/anim";
import { fitsCut, isEdge, makePuzzle, parFor, pieceCount, planOf, sidesOf, startTable, toPlace, LEVEL_COUNT } from "../lib/game";
import { infoOf, isFinale, LEVEL_INFO, WORLDS } from "../lib/levels";
import { clearLine, parseShared, sharedHash } from "../lib/link";
import { nameFor, paintingFor } from "../lib/painting";
import { dropPiece, left, startPlay, turnOne, type Play } from "../lib/play";
import { afterClear, neighbourLevel, playable, readUnlock, recommended } from "../lib/progress";
import * as session from "../lib/session";
import { countAt, flash, hold, puff, rest, snapHome, stepAnim, SNAP_MS } from "../lib/table.hot";
import { rate, runBot, CASUAL, FIRST_TIMER, STEADY } from "./bot";

const SIZE = 360;
const at = (n: number, cell: number) => [(cell % n + 0.5) * (SIZE / n), (Math.floor(cell / n) + 0.5) * (SIZE / n)] as const;
/** Puts every waiting piece home, upright: the whole picture. */
function solveAll(play: Play) {
  for (let guard = 0; guard < 200 && left(play); guard++) {
    const id = play.table.slots.find(slot => slot >= 0)!;
    while (play.table.turns[id] % 4) play = turnOne(play, id);
    play = dropPiece(play, id, ...at(play.puzzle.n, id), SIZE).play;
  }
  return play;
}

test("bug 1, ClockStillWhileAway / PausedWhenBlurred: another window stops the clock, and it starts again only on চালিয়ে যাও", () => {
  // A new table: খেলো, the pieces land (640 ms), and the clock runs.
  let s = session.begin(session.title(), 1000, false, false);
  assert.equal(s.phase, "playing");
  assert.equal(session.elapsed(s, 1000 + session.SCATTER_MS), 0, "the clock waits for the pieces to land");
  assert.equal(session.canPlay(s, 1200), false, "no drops during the scatter");
  const landed = 1000 + session.SCATTER_MS;
  // You tap a piece at +2 s, then click into another window (blur pauses: the game listens for blur and pagehide).
  s = session.pause(s, landed + 2000, "away");
  assert.equal(s.phase, "paused");
  assert.equal(session.elapsed(s, landed + 2000), 2000);
  // Twelve seconds in another window: the clock doesn't move (before: ০:০০ → ০:১২).
  assert.equal(session.elapsed(s, landed + 14000), 2000);
  assert.equal(session.canPlay(s, landed + 14000), false);
  // Coming back from the sheet doesn't resume an away pause, and a second away changes nothing.
  assert.equal(session.resume(s, landed + 14000, "sheet"), s);
  assert.equal(session.pause(s, landed + 15000, "away").base, 2000);
  s = session.resume(s, landed + 20000, "away");
  assert.equal(s.phase, "playing");
  assert.equal(session.elapsed(s, landed + 21000), 3000);
  // The sheet is a choice moment: it pauses too, and an away pause on top of it doesn't close it.
  s = session.pause(s, landed + 21000, "sheet");
  s = session.pause(s, landed + 22000, "away");
  assert.equal(s.why, "sheet");
  assert.equal(session.resume(s, landed + 23000, "away"), s, "চালিয়ে যাও doesn't close the sheet under it");
  s = session.resume(s, landed + 23000, "sheet");
  assert.equal(session.elapsed(s, landed + 24000), 4000);
  // A pause during the scatter keeps the rest of the flight for later.
  let early = session.again(0, false);
  early = session.pause(early, 200, "away");
  early = session.resume(early, 5000, "away");
  assert.equal(session.canPlay(early, 5000 + session.SCATTER_MS - 250), false);
  assert.equal(session.canPlay(early, 5000 + session.SCATTER_MS - 200), true);
  assert.equal(session.elapsed(early, 6000 + session.SCATTER_MS - 200), 1000, "the clock starts when the rest of the flight lands");
  // Slow mode: no flight, the clock starts at once.
  assert.equal(session.canPlay(session.again(0, true), 0), true);
});

test("bug 2, PieceDroppedWhenAway: a piece in the hand goes back to the tray on blur, and a buttonless move never carries it", () => {
  // The table's cancel (on blur, the player's pause, pointercancel, or a mouse move with no button) puts the piece back.
  const l = layoutFor(388, 640, 4), a = makeAnim(16);
  rest(a, 5, slotX(l, 2), slotY(l, 2), l.trayScale, 0);
  a.x[5] = slotX(l, 2); a.y[5] = slotY(l, 2); a.s[5] = l.trayScale;
  hold(a, 5, 200, 300);
  assert.equal(a.held, 5);
  for (let t = 0; t < 10; t++) stepAnim(a, 16);
  assert.ok(Math.abs(a.x[5] - 200) < 3, "the piece follows the finger within a few frames");
  // you click into another window: cancel
  rest(a, 5, slotX(l, 2), slotY(l, 2), l.trayScale, 0);
  assert.equal(a.held, -1);
  assert.equal(a.mode[5], Mode.Tray);
  for (let t = 0; t < 60; t++) stepAnim(a, 16);
  assert.ok(Math.abs(a.x[5] - slotX(l, 2)) < 0.5 && Math.abs(a.s[5] - l.trayScale) < 0.01, "back in its slot, at tray size");
  // Nothing was dropped: the round's table is untouched by a cancel (no drop reaches lib/play.ts).
  const play = startPlay(5, l.slots);
  assert.equal(play.wrong, 0);
  // And the first press after coming back only resumes: canPlay is false until চালিয়ে যাও (the component's wake()).
  const paused = session.pause(session.again(0, true), 100, "away");
  assert.equal(session.canPlay(paused, 200), false);
});

test("bug 3, CheerOnlyOnTheResult: the round ends once; a second finish or a late drop changes nothing", () => {
  let play = solveAll(startPlay(1, 12));
  assert.equal(left(play), 0);
  // The minor bug: Enter and the mouse both settling the last piece. A drop on a finished table is refused.
  const again = dropPiece(play, 0, ...at(3, 0), SIZE);
  assert.equal(again.landed, "none");
  assert.equal(again.play, play);
  let s = session.again(0, true);
  s = session.finish(s, 5000);
  assert.equal(s.phase, "over");
  assert.equal(session.finish(s, 6000), s, "finish runs once");
  assert.equal(session.pause(s, 6000, "away"), s, "the result never pauses or resumes");
  // The celebration timers live in one list, cleared on every new table and on unmount (components/tukro-game.tsx
  // later()/clearTimers()); the fanfare itself is scheduled on the audio clock, which the player's pause cuts.
  play = startPlay(2, 12);
  assert.equal(left(play), 9, "পরের লেভেল: a fresh table with nothing left over");
});

test("bug 4, OpenLevelsAreEarned: a friend's far-ahead level opens nothing in between; your own clears open one at a time", () => {
  const first = readUnlock(null, {}, LEVEL_COUNT);
  assert.deepEqual(first, { unlock: 1, migrated: true });
  let unlock = first.unlock;
  const stars: Record<number, number> = {};
  // #s=…&l=5: level 5 is playable for this visit, 2–4 stay shut.
  assert.equal(playable(5, unlock, stars, 5), true);
  for (let level = 2; level <= 4; level++) assert.equal(playable(level, unlock, stars, 5), false, `level ${level}`);
  // Cleared it: the stars are kept, nothing in between opens (before: levels 1–6 all open).
  stars[5] = 3;
  unlock = afterClear(unlock, 5, LEVEL_COUNT);
  assert.equal(unlock, 1);
  assert.equal(playable(5, unlock, stars, 0), true, "a level with stars stays playable");
  assert.equal(playable(3, unlock, stars, 0), false);
  assert.equal(recommended(unlock, stars), 1, "it suggests your own level 1, not level 6");
  // Your own clears open the next level, one at a time, and the unlock only grows.
  let before = unlock;
  for (const level of [1, 2, 2, 9, 3]) { unlock = afterClear(unlock, level, LEVEL_COUNT); assert.ok(unlock >= before); before = unlock; }
  assert.equal(unlock, 4);
  assert.equal(afterClear(30, 30, LEVEL_COUNT), 30);
  // ‹ › on the title skip shut levels and reach the friend's.
  assert.equal(neighbourLevel(4, 1, 4, {}, 9, LEVEL_COUNT), 9);
  assert.equal(neighbourLevel(1, -1, 4, {}, 0, LEVEL_COUNT), 0);
});

test("saved progress migrates once: an old player keeps every level the old rule opened", () => {
  const old = { 1: 3, 2: 2, 3: 1, 4: 3, 5: 2 };
  assert.deepEqual(readUnlock(null, old, LEVEL_COUNT), { unlock: unlockedLevel(old, LEVEL_COUNT), migrated: true });
  assert.equal(readUnlock(null, old, LEVEL_COUNT).unlock, 6);
  assert.deepEqual(readUnlock("6", old, LEVEL_COUNT), { unlock: 6, migrated: false });
  assert.deepEqual(readUnlock("99", old, LEVEL_COUNT), { unlock: 30, migrated: false });
  for (const junk of ["", "x", "0", "-2", "1.5"]) assert.equal(readUnlock(junk, old, LEVEL_COUNT).migrated, true, junk);
  assert.equal(recommended(6, old), 6);
  assert.equal(recommended(5, old), 2);
});

test("result keys need a fresh press after the result appears", () => {
  const over = session.finish(session.again(0, true), 1000);
  assert.equal(session.resultKey(over, 1100, false), false, "Enter held through the last drop does nothing");
  assert.equal(session.resultKey(over, 1000 + session.RESULT_GUARD_MS, true), false, "an auto-repeat does nothing");
  assert.equal(session.resultKey(over, 1000 + session.RESULT_GUARD_MS, false), true);
  assert.equal(session.resultKey(session.again(0, true), 9999, false), false);
  // The HUD clock and the result use one rounding (before: ০:০৯ on the clock, ১০ সেকেন্ড on the result).
  const s = session.finish(session.again(0, true), 9400);
  assert.equal(session.seconds(s, 99999), 9);
  assert.equal(session.seconds(session.finish(session.again(0, true), 100), 100), 1, "a result is never 0 seconds");
});

test("a drop says what happened: in, the right cell turned, knobs that fit the wrong cell, wrong, or off the board", () => {
  const level = 26, play = startPlay(level, 18), n = play.puzzle.n;
  const id = play.table.slots.find(slot => slot >= 0 && play.table.turns[slot] % 4 !== 0)!;
  assert.ok(id !== undefined);
  assert.equal(dropPiece(play, id, ...at(n, id), SIZE).landed, "turn");
  let upright = play;
  while (upright.table.turns[id] % 4) upright = turnOne(upright, id);
  assert.equal(upright.turned, (4 - (play.table.turns[id] % 4)) % 4);
  const inPlace = dropPiece(upright, id, ...at(n, id), SIZE);
  assert.equal(inPlace.landed, "snap");
  assert.equal(inPlace.play.streak, 1);
  assert.equal(dropPiece(upright, id, -100, 40, SIZE).landed, "away");
  assert.equal(dropPiece(upright, id, -100, 40, SIZE).play.wrong, 0, "off the board is no mistake");
  // A cell whose knobs match the piece (same sides): "fits"; any other empty cell: "wrong".
  const { edges } = play.puzzle;
  let fits = -1, other = -1;
  for (let cell = 0; cell < n * n; cell++) {
    if (cell === id) continue;
    if (fitsCut(edges, n, id, 0, cell) && fits < 0) fits = cell;
    if (!fitsCut(edges, n, id, 0, cell) && other < 0) other = cell;
  }
  assert.ok(other >= 0);
  assert.equal(dropPiece(upright, id, ...at(n, other), SIZE).landed, "wrong");
  if (fits >= 0) assert.equal(dropPiece(upright, id, ...at(n, fits), SIZE).landed, "fits");
  assert.equal(dropPiece(upright, id, ...at(n, other), SIZE).play.wrong, 1);
  // fitsCut is about knobs: a piece always fits its own cell upright, and a turned piece fits it only turned back.
  for (let cell = 0; cell < n * n; cell++) assert.ok(fitsCut(edges, n, cell, 0, cell));
  const corner = 0, [top, , , leftSide] = sidesOf(edges, n, corner);
  assert.ok(top === 0 && leftSide === 0 && isEdge(n, corner) && !isEdge(n, n + 1));
});

test("the frame chime: the last edge piece reports the frame whole, once", () => {
  let play = startPlay(15, 18);
  const n = play.puzzle.n, edges: number[] = [];
  for (let id = 0; id < n * n; id++) if (isEdge(n, id)) edges.push(id);
  let frames = 0;
  // Place the edges first, in queue order (the tray refills as you go).
  for (let guard = 0; guard < 200 && edges.some(id => !play.table.placed[id]); guard++) {
    const id = play.table.slots.find(slot => slot >= 0 && isEdge(n, slot)) ?? play.table.slots.find(slot => slot >= 0)!;
    const result = dropPiece(play, id, ...at(n, id), SIZE);
    if (result.frame) frames++;
    play = result.play;
  }
  assert.equal(frames, 1);
  assert.equal(solveAll(play).table.placed.every(Boolean), true);
});

test("levels: 3 worlds, one lesson each, a named finale per world, level 1 starts nearly whole", () => {
  assert.equal(LEVEL_INFO.length, LEVEL_COUNT);
  assert.deepEqual(WORLDS.map(world => [world.from, world.to]), [[1, 10], [11, 20], [21, 30]]);
  for (const world of WORLDS) {
    assert.ok(isFinale(world.to), `${world.name} ends on a finale`);
    assert.equal(infoOf(world.to).name, world.finale);
    assert.equal(infoOf(world.to).ghost, 0, "a finale has no picture on the board");
    assert.equal(nameFor(world.to), world.finale);
    assert.ok(paintingFor(world.to).extra, "a finale paints its own scene");
    assert.ok(clearLine(world.to, true).length > 10 && clearLine(world.to, true) !== clearLine(world.to, false));
  }
  assert.equal(LEVEL_INFO.filter(info => info.finale).length, 3);
  // Every new grid size or the first turned level is marked নতুন, and says so in its lesson.
  for (let level = 2; level <= LEVEL_COUNT; level++) {
    const now = planOf(level), was = planOf(level - 1);
    if (now.n !== was.n || (now.rotate && !was.rotate)) assert.ok(infoOf(level).fresh || isFinale(level), `level ${level} brings something new`);
  }
  for (const info of LEVEL_INFO) assert.ok(info.teach.length >= 20 && info.teach.length <= 110 && info.name.length >= 3, info.name);
  assert.equal(new Set(LEVEL_INFO.filter(info => !info.finale).map(info => info.teach)).size, LEVEL_COUNT - 3, "each lesson is its own");
  // The world's idea arrives on its first level: turned pieces at 11, the look-alike night sky at 21.
  assert.ok(planOf(11).rotate && !planOf(10).rotate);
  assert.match(infoOf(21).teach, /খাঁজ/);
  // Level 1: five of nine already in; a first win within seconds.
  const one = startTable(makePuzzle(1), 12);
  assert.equal(one.placed.filter(Boolean).length, 5);
  assert.equal(toPlace(1), 4);
  assert.ok(one.placed[0] && one.placed[2] && one.placed[6] && one.placed[8] && one.placed[4], "the corners and the middle");
  assert.equal(pieceCount(1), 9);
  // The picture fades along each world, and par grows.
  for (const world of WORLDS) for (let level = world.from + 1; level < world.to; level++) assert.ok(infoOf(level).ghost <= infoOf(world.from).ghost);
});

test("bots: a first-timer wins level 1 inside 10 s; a steady player three-stars every level; a casual one always two", () => {
  assert.ok(rate(1, FIRST_TIMER, 200, run => run.done && run.seconds <= 10) >= 0.95, "level 1 inside 10 s");
  const casualThree: number[] = [];
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    assert.ok(rate(level, STEADY, 60, run => run.stars === 3) >= 0.85, `steady, level ${level}`);
    assert.ok(rate(level, CASUAL, 60, run => run.done && run.stars >= 2) >= 0.8, `casual, level ${level}`);
    casualThree.push(rate(level, CASUAL, 60, run => run.stars === 3));
  }
  // Three stars take more thought as the worlds go on, and most on a finale.
  for (const world of WORLDS) {
    const opening = casualThree.slice(world.from - 1, world.from + 4).reduce((sum, value) => sum + value, 0) / 5;
    assert.ok(casualThree[world.to - 1] < opening, `${world.name}: the finale is the hardest three stars`);
  }
  assert.ok(casualThree[0] >= 0.9, "level 1 three-stars for nearly everyone");
  // Same seed, same run.
  assert.deepEqual(runBot(12, CASUAL, 99), runBot(12, CASUAL, 99));
});

test("the table's layout fits a phone, a laptop and a 320 px phone, with the tray on screen", () => {
  for (const [w, h] of [[388, 640], [536, 560], [300, 470], [560, 820]]) for (const n of [3, 4, 5, 6]) {
    const l = layoutFor(w, h, n);
    assert.ok(l.ox >= 0 && l.ox + l.board <= w + 0.5, `fits across ${w}×${h} n${n}`);
    assert.ok(l.trayTop + l.rows * l.slot <= h + 0.5, `the tray is on screen ${w}×${h} n${n}`);
    assert.ok(l.slots >= 8 && l.cell >= 40, `${w}×${h} n${n}: cell ${l.cell}`);
    assert.ok(l.trayScale * l.piece >= 40, "a tray piece is bigger than a fingertip");
    assert.equal(slotAt(l, slotX(l, 3), slotY(l, 3)), 3);
    assert.equal(slotAt(l, l.ox - 5, slotY(l, 0)), -1);
    assert.ok(homeX(l, 0) > l.ox && homeY(l, n * n - 1) < l.oy + l.board);
  }
  assert.equal(layoutFor(388, 700, 6).rows, 3, "a tall phone gets three tray rows");
  // A 6×6 tray on a phone holds 18 pieces; old 12-slot tables still reslot cleanly.
  assert.equal(layoutFor(388, 700, 6).slots, 18);
});

test("the hot animation: a snap lands once, dust settles, a still table stops asking for frames", () => {
  const l = layoutFor(388, 640, 3), a = makeAnim(9);
  for (let id = 0; id < 9; id++) { a.mode[id] = Mode.Tray; rest(a, id, slotX(l, id), slotY(l, id), l.trayScale, 0); a.x[id] = a.tx[id]; a.y[id] = a.ty[id]; a.s[id] = a.ts[id]; }
  assert.equal(stepAnim(a, 16), 0, "nothing moves, no frames");
  hold(a, 2, 100, 100);
  snapHome(a, 2, homeX(l, 2), homeY(l, 2), 0);
  let landed = 0;
  for (let t = 0; t < 40; t++) { stepAnim(a, 16); landed += a.landedCount; }
  assert.equal(landed, 1);
  assert.equal(a.mode[2], Mode.In);
  assert.equal(a.held, -1);
  puff(a, 50, 50, 20); flash(a, 3, 1);
  assert.equal(stepAnim(a, 16), 1);
  for (let t = 0; t < 80; t++) stepAnim(a, 16);
  assert.equal(stepAnim(a, 16), 0, "dust and flashes fade, frames stop");
  // A slow frame (50 ms) never blows the scale spring up.
  rest(a, 4, slotX(l, 4), slotY(l, 4), 1, 0);
  for (let t = 0; t < 30; t++) stepAnim(a, 50);
  assert.ok(Math.abs(a.s[4] - 1) < 0.05, String(a.s[4]));
  // Calm: no dust, no overshoot.
  const calm = makeAnim(9);
  calm.calm = true;
  puff(calm, 50, 50, 20);
  assert.equal(stepAnim(calm, 16), 0);
  assert.ok(SNAP_MS <= 200, "a drop answers fast");
  assert.equal(countAt(40, 1), 40);
  assert.equal(countAt(40, 0), 0);
});

test("old links still parse and point at the same cut; the par only counts the pieces you place", () => {
  // A link made before the rewrite (same keys, same seed per level).
  for (const level of [1, 10, 17, 30]) {
    const hash = sharedHash({ level, seconds: 77, name: "রাফি" });
    assert.deepEqual(parseShared(`#${hash}`), { level, seconds: 77, name: "রাফি" });
    assert.deepEqual(makePuzzle(level), makePuzzle(level));
  }
  assert.deepEqual(parseShared("#s=71037&t=40&l=1&n=Rafi"), { level: 1, seconds: 40, name: "Rafi" });
  assert.deepEqual(parseShared("#s=71185&t=40&l=5&n=Rafi"), { level: 5, seconds: 40, name: "Rafi" });
  assert.deepEqual(planOf(11), { n: 4, rotate: true }, "the grid sizes and turned levels are unchanged");
  assert.deepEqual(planOf(21), { n: 6, rotate: false });
  for (let level = 1; level <= LEVEL_COUNT; level++) assert.ok(parFor(level) >= toPlace(level) * 2.5);
});

test("a frame stamped before the kick that asked for it keeps the frames coming (the scatter froze in headless Chrome)", () => {
  const a = makeAnim(4);
  a.mode[1] = Mode.Tray; a.wait[1] = 60; a.tx[1] = 10;
  assert.equal(stepAnim(a, -3), 1, "a negative dt asks for another frame");
  assert.equal(a.wait[1], 60, "and moves nothing");
  assert.equal(stepAnim(a, 16), 1);
  assert.equal(a.wait[1], 44);
});
