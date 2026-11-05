// The statechart's paths, replayed against the pure code: the round's phase and clock (lib/session.ts), the unlock
// (lib/progress.ts) and the finger on the plate (lib/drag.hot.ts). See ai_docs/statecharts/ponero-ghor/README.md.
import assert from "node:assert/strict";
import test from "node:test";
import { unlockedLevel } from "../../../shared/game-core";
import { solvedBoard, step } from "../lib/board";
import { moveDrag, pressDrag, releaseDrag, releaseOf, swipeDir, Release, COMMIT_AT } from "../lib/drag.hot";
import { cellAt, lineOf, makeDrag } from "../lib/input";
import { afterClear, neighbourLevel, playable, readUnlock, recommended } from "../lib/progress";
import * as session from "../lib/session";
import { LEVEL_COUNT } from "../lib/game";

const CELL = 100;
/** A press on a ঘুঁটি in the gap's line of the solved ৪×৪ plate (gap in cell 15): cell 14 moves right. */
function pressRight(d = makeDrag(), at = 0) {
  const line = lineOf(solvedBoard(4), 14)!;
  pressDrag(d, 1, 14, line.axis, line.sign, line.cells.length, 250, 350, at);
  return d;
}

test("bug 1, UnlockNeverShrinks: a second friend's link never locks a level, and a link opens only its own level", () => {
  // Storage cleared: your own unlock is 1, written once.
  const first = readUnlock(null, {}, LEVEL_COUNT);
  assert.deepEqual(first, { unlock: 1, migrated: true });
  let unlock = first.unlock, visit = 8;
  const stars: Record<number, number> = {};
  // #l=8: level 8 is playable for this visit, and 2–7 stay shut (before: all of 1–8 opened).
  assert.equal(playable(8, unlock, stars, visit), true);
  for (let level = 2; level <= 7; level++) assert.equal(playable(level, unlock, stars, visit), false, `level ${level}`);
  // #l=3: a lower link. Your own unlock is untouched (before: "open" dropped from 8 to 3 and level 8 read "বন্ধ").
  visit = 3;
  assert.equal(unlock, 1);
  // Clearing the friend's far-ahead level 8 records its stars and opens nothing in between; it stays playable for good.
  stars[8] = 3;
  unlock = afterClear(unlock, 8, LEVEL_COUNT);
  assert.equal(unlock, 1);
  assert.equal(playable(8, unlock, stars, 0), true, "a level with stars stays open");
  assert.equal(playable(5, unlock, stars, 0), false);
  // Your own clears open the next level, one at a time, and the unlock only grows.
  let before = unlock;
  for (const level of [1, 2, 2, 3, 9, 1]) { unlock = afterClear(unlock, level, LEVEL_COUNT); assert.ok(unlock >= before); before = unlock; }
  assert.equal(unlock, 4);
  assert.equal(afterClear(30, 30, LEVEL_COUNT), 30, "never past the last level");
});

test("migration: an old player keeps every level the old rule opened, once", () => {
  const old = { 1: 3, 2: 2, 3: 1, 4: 3, 5: 2 };
  assert.deepEqual(readUnlock(null, old, LEVEL_COUNT), { unlock: unlockedLevel(old, LEVEL_COUNT), migrated: true });
  assert.equal(readUnlock(null, old, LEVEL_COUNT).unlock, 6);
  assert.deepEqual(readUnlock("6", old, LEVEL_COUNT), { unlock: 6, migrated: false }, "the second visit reads what was written");
  assert.deepEqual(readUnlock("99", old, LEVEL_COUNT), { unlock: 30, migrated: false });
  for (const junk of ["", "x", "0", "-2", "1.5"]) assert.equal(readUnlock(junk, old, LEVEL_COUNT).migrated, true, junk);
  assert.equal(recommended(6, old), 6, "the first open level without stars");
  assert.equal(recommended(5, old), 2, "else the first short of three stars");
  assert.equal(recommended(2, { 1: 3, 2: 3 }), 2);
  assert.equal(neighbourLevel(3, 1, 4, {}, 9, LEVEL_COUNT), 4);
  assert.equal(neighbourLevel(4, 1, 4, {}, 9, LEVEL_COUNT), 9, "› jumps to the friend's level");
  assert.equal(neighbourLevel(9, 1, 4, {}, 9, LEVEL_COUNT), 0);
  assert.equal(neighbourLevel(1, -1, 4, {}, 0, LEVEL_COUNT), 0);
});

test("bug 2, InputReleasedWhenAway: a press from before you left never moves a ঘুঁটি when you come back", () => {
  const d = pressRight();
  moveDrag(d, 260, 350, 16, CELL);
  // you leave: blur, a hidden tab, the player's pause or pointercancel all release the finger
  releaseDrag(d);
  assert.equal(d.id, -1);
  // you come back, and the old release arrives: nothing lands, nothing is tapped
  assert.equal(releaseOf(d), Release.None);
  assert.equal(moveDrag(d, 400, 350, 900, CELL), 0, "and a late move doesn't drag anything");
});

test("the drag: a tap, a slow drag past halfway, a flick, a short drag that springs back, and a swipe", () => {
  // a tap: under 10 px
  let d = pressRight();
  moveDrag(d, 254, 352, 40, CELL);
  assert.equal(releaseOf(d), Release.Tap);
  // past halfway, slowly: it lands
  d = pressRight();
  for (let t = 1; t <= 10; t++) moveDrag(d, 250 + t * 5, 350, t * 50, CELL);
  assert.ok(d.offset >= COMMIT_AT);
  assert.equal(releaseOf(d), Release.Land);
  // a third of a cell, slowly: it springs back
  d = pressRight();
  for (let t = 1; t <= 10; t++) moveDrag(d, 250 + t * 3, 350, t * 60, CELL);
  assert.equal(releaseOf(d), Release.None);
  // a fifth of a cell, fast: a flick lands it
  d = pressRight();
  moveDrag(d, 262, 350, 4, CELL);
  moveDrag(d, 272, 350, 8, CELL);
  assert.equal(releaseOf(d), Release.Land);
  // the line follows the finger one to one, resists backwards, and stops at one cell
  d = pressRight();
  assert.equal(moveDrag(d, 300, 350, 10, CELL), 0.5);
  assert.ok(moveDrag(d, 100, 350, 20, CELL) >= -0.08);
  assert.ok(moveDrag(d, 600, 350, 30, CELL) <= 1.04);
  // across the line: a swipe, and the finger's way is read
  d = pressRight();
  moveDrag(d, 252, 300, 20, CELL);
  assert.equal(releaseOf(d), Release.Swipe);
  assert.equal(swipeDir(d), 0, "up");
});

test("which line a press drags: its axis, its way and its cells; and the cell under a point", () => {
  const board = solvedBoard(4);
  assert.deepEqual(lineOf(board, 12), { axis: 0, sign: 1, cells: [12, 13, 14], steps: [2, 2, 2] });
  assert.deepEqual(lineOf(board, 3), { axis: 1, sign: 1, cells: [3, 7, 11], steps: [0, 0, 0] });
  assert.equal(lineOf(board, 5), null);
  const moved = step(step(board, 0)!, 0)!; // gap up to cell 7
  assert.deepEqual(lineOf(moved, 15)?.sign, -1, "below the gap, the line moves up");
  assert.equal(cellAt(4, 50, 50, 0, 0, 400, 400), 0);
  assert.equal(cellAt(4, 399, 399, 0, 0, 400, 400), 15);
  assert.equal(cellAt(4, 401, 10, 0, 0, 400, 400), -1);
});

test("the round: story once, the shuffle holds moves, pause stops the clock, the sheet outranks away", () => {
  let s = session.title();
  assert.equal(session.canMove(s, 0), false, "no move on the title");
  s = session.begin(s, 1000, true, false);
  assert.equal(s.phase, "story");
  s = session.storyDone(s, 2000, false);
  assert.equal(s.phase, "playing");
  assert.equal(session.canMove(s, 2000 + session.SHUFFLE_MS - 1), false, "the ঘুঁটি are still flying");
  assert.equal(session.canMove(s, 2000 + session.SHUFFLE_MS), true);
  assert.equal(session.canMove(session.again(5000, true), 5000), true, "slow mode: no flight, no wait");
  // NoProgressWhileAway: blur at 3 s, back at 60 s: the clock says 1 s of play
  s = session.pause(s, 3000, "away");
  assert.equal(s.phase, "paused");
  assert.equal(session.canMove(s, 4000), false, "no move while paused");
  assert.equal(session.elapsed(s, 60_000), 1000);
  // ChoiceFreezesPlay: the sheet opened over an away pause takes it over; চালিয়ে যাও doesn't close it
  s = session.pause(s, 60_000, "sheet");
  assert.equal(session.resume(s, 61_000, "away"), s);
  s = session.resume(s, 62_000, "sheet");
  assert.equal(s.phase, "playing");
  assert.equal(session.elapsed(s, 63_000), 2000);
  assert.equal(session.resume(s, 63_000, "away"), s, "resuming what isn't paused does nothing");
  s = session.finish(s, 64_000);
  assert.equal(s.phase, "over");
  assert.equal(session.elapsed(s, 99_000), 3000, "the clock stops for good");
  assert.equal(session.pause(s, 99_000, "away"), s, "a finished plate never pauses");
  assert.equal(session.finish(s, 99_000), s, "and ends once");
});

test("HeldKeyNeverSkips: Enter held through the win, or pressed too soon, never skips the result", () => {
  let s = session.again(0, true);
  s = session.finish(s, 10_000);
  assert.equal(session.resultKey(s, 10_050, true), false, "a held key's repeat");
  assert.equal(session.resultKey(s, 10_100, false), false, "a fresh press, but before the result has settled");
  assert.equal(session.resultKey(s, 10_000 + session.RESULT_GUARD_MS, false), true);
  assert.equal(session.resultKey(session.again(0, true), 99_000, false), false, "only on the result");
});
