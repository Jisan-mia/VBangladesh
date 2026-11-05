// The statechart's paths, replayed against the pure code: the round's phase and clock (lib/session.ts), the unlock
// (lib/progress.ts) and the finger on a vehicle (lib/motion.hot.ts). See ai_docs/statecharts/jam-chharao/README.md.
import assert from "node:assert/strict";
import test from "node:test";
import { unlockedLevel } from "../../../shared/game-core";
import { reachOf, slide, startGame } from "../lib/game";
import { makeDrag, makeMotion, settle } from "../lib/motion";
import { landing, moveDrag, pressDrag, releaseDrag, STRETCH } from "../lib/motion.hot";
import { afterClear, migratedUnlock, neighbourLevel, playable, readUnlock, recommended } from "../lib/progress";
import * as session from "../lib/session";
import { LEVEL_COUNT } from "../lib/worlds";

const CELL = 50;

/** Jam 1: your CNG is in column 1 under a rickshaw in row 1 (cols 0–1). The rickshaw, car 1, slides right. */
function holdTheRickshaw() {
  const game = startGame(1), m = makeMotion(), d = makeDrag();
  settle(m, game.lay, game.pos);
  const [low, high] = reachOf(game, 1);
  pressDrag(d, 7, 1, 0, m.x[1], low, high, 100, 100, 0);
  return { game, m, d, low, high };
}

test("bug 1, InputReleasedWhenAway: after blur, hide or the player's pause, no vehicle stays stuck to the pointer", () => {
  const { game, m, d } = holdTheRickshaw();
  moveDrag(d, m, 100 + CELL, 100, 16, CELL);
  assert.equal(m.t[1], game.pos[1] + 1, "the vehicle follows the finger");
  // The window blurs: the street lets go (street.tsx drop()) and the vehicle glides back to its cell.
  releaseDrag(d);
  m.t[1] = game.pos[1];
  assert.equal(d.id, -1);
  // The finger comes back and moves: nothing follows it (before: pos 0 → 2 landed as a move).
  assert.equal(moveDrag(d, m, 100 + CELL * 3, 100, 40, CELL), 0);
  assert.equal(m.t[1], game.pos[1], "the vehicle stays in its cell");
  assert.equal(d.car, -1);
});

test("bug 2, NothingMovesWhilePaused: while the pause screen shows, no move is made or taken back", () => {
  const t0 = 1000;
  for (const why of ["away", "sheet"] as const) {
    let s = session.again(t0);
    assert.equal(session.canMove(s), true);
    s = session.pause(s, t0 + 500, why);
    assert.equal(s.phase, "paused");
    assert.equal(session.canMove(s), false, `${why}: slide, take-back, hint and tap all check live()`);
    s = session.resume(s, t0 + 900, why);
    assert.equal(session.canMove(s), true);
  }
  assert.equal(session.canMove(session.title()), false, "the title is not a live jam");
  const story = session.begin(session.title(), t0, true);
  assert.equal(story.phase, "story");
  assert.equal(session.canMove(story), false);
});

test("bug 3, NoDropCountsWhilePaused: a vehicle held when the pause came down never lands behind it", () => {
  const { game, m, d } = holdTheRickshaw();
  moveDrag(d, m, 100 + CELL * 2, 100, 16, CELL);
  assert.equal(landing(d), game.pos[1] + 2);
  // The tab hides: the street drops the drag first, so the lift that follows has nothing to land.
  let s = session.again(0);
  s = session.pause(s, 300, "away");
  releaseDrag(d);
  m.t[1] = game.pos[1];
  assert.equal(session.canMove(s), false);
  assert.equal(d.id, -1, "pointerup finds no drag (street.tsx ignores a pointer that isn't the held one)");
  // And even a drop that slipped through is refused by the live() check before slide() is called.
  assert.equal(session.canMove(s) ? slide(game, 1, landing(d)) : null, null);
});

test("the finger: follows one to one inside the road, gives a little past a stop, never more than STRETCH", () => {
  const { game, m, d, low, high } = holdTheRickshaw();
  assert.equal(low, 0);
  assert.ok(high >= 2);
  assert.equal(moveDrag(d, m, 100 + CELL, 100, 16, CELL), 0);
  assert.ok(Math.abs(m.t[1] - (game.pos[1] + 1)) < 1e-6);
  const far = moveDrag(d, m, 100 + CELL * (high + 3), 100, 32, CELL);
  assert.ok(far > 1, "the finger is well past the stop");
  assert.ok(m.t[1] > high && m.t[1] <= high + STRETCH + 1e-6, `the vehicle stretches ${m.t[1] - high}`);
  moveDrag(d, m, 100 - CELL * 4, 100, 48, CELL);
  assert.ok(m.t[1] < low && m.t[1] >= low - STRETCH - 1e-6);
  assert.equal(landing(d), low, "let go past a stop: it lands on the stop");
  assert.ok(d.moved > CELL * 3);
});

test("a slow drag lands on the nearest cell; a short fast flick carries on one more", () => {
  const { game, m, d } = holdTheRickshaw();
  moveDrag(d, m, 100 + CELL * 0.4, 100, 600, CELL);
  assert.equal(landing(d), game.pos[1], "under half a cell, slowly: it springs back");
  moveDrag(d, m, 100 + CELL * 0.6, 100, 1200, CELL);
  assert.equal(landing(d), game.pos[1] + 1);
  const second = holdTheRickshaw();
  moveDrag(second.d, second.m, 100 + CELL * 0.3, 100, 20, CELL);
  assert.ok(second.d.speed > 0.004, `a fast flick: ${second.d.speed}`);
  assert.equal(landing(second.d), second.game.pos[1] + 1, "…a flick of a third of a cell carries it to the next");
});

test("the clock is a stat: it runs exactly while playing, banks on pause and keeps the end time", () => {
  let s = session.again(1000);
  assert.equal(session.elapsed(s, 3500), 2500);
  s = session.pause(s, 3500, "away");
  assert.equal(session.elapsed(s, 9000), 2500, "paused: the clock holds");
  s = session.resume(s, 9000, "away");
  assert.equal(session.elapsed(s, 9500), 3000);
  s = session.finish(s, 10000);
  assert.equal(s.phase, "over");
  assert.equal(session.elapsed(s, 99999), 3500, "over: the clock is stopped for good");
  assert.equal(session.finish(s, 20000), s, "a clear is recorded once");
});

test("a sheet pause outranks an away pause, and each is ended only by its own action", () => {
  let s = session.again(0);
  s = session.pause(s, 100, "away");
  s = session.pause(s, 150, "sheet");
  assert.equal(s.why, "sheet");
  assert.equal(session.resume(s, 200, "away"), s, "coming back from another window doesn't close the sheet");
  s = session.resume(s, 250, "sheet");
  assert.equal(s.phase, "playing");
  assert.equal(session.pause(session.title(), 0, "away").phase, "title", "only a started jam pauses");
});

test("a key held through the win never skips the result: only a fresh press after the guard counts", () => {
  let s = session.again(0);
  s = session.finish(s, 5000);
  assert.equal(session.resultKey(s, 5100, false), false, "too soon");
  assert.equal(session.resultKey(s, 5000 + session.RESULT_GUARD_MS, true), false, "a repeat never counts");
  assert.equal(session.resultKey(s, 5000 + session.RESULT_GUARD_MS, false), true);
  assert.equal(session.resultKey(session.again(0), 99999, false), false, "not on a jam in play");
});

test("the story plays through খেলো only, and a fresh jam skips it", () => {
  assert.equal(session.begin(session.title(), 10, false).phase, "playing");
  const story = session.begin(session.title(), 10, true);
  assert.equal(story.phase, "story");
  assert.equal(session.storyDone(story, 20).phase, "playing");
  assert.equal(session.storyDone(session.again(5), 20).phase, "playing");
  assert.equal(session.begin(session.again(5), 20, true).phase, "playing", "begin only works from the title");
});

test("UnlockNeverShrinks: a friend's link never locks a jam, and a link opens only its own jam", () => {
  const first = readUnlock(null, null, null);
  assert.deepEqual(first, { unlock: 1, migrated: true });
  let unlock = first.unlock, visit = 8;
  const stars: Record<number, number> = {};
  assert.equal(playable(8, unlock, stars, visit), true);
  for (let level = 2; level <= 7; level++) assert.equal(playable(level, unlock, stars, visit), false, `jam ${level}`);
  visit = 3;
  assert.equal(unlock, 1);
  stars[8] = 3;
  unlock = afterClear(unlock, 8);
  assert.equal(unlock, 1, "clearing a friend's far-ahead jam opens nothing in between");
  assert.equal(playable(8, unlock, stars, 0), true, "a jam with stars stays open");
  assert.equal(playable(5, unlock, stars, 0), false);
  let before = unlock;
  for (const level of [1, 2, 2, 3, 9, 1]) { unlock = afterClear(unlock, level); assert.ok(unlock >= before); before = unlock; }
  assert.equal(unlock, 4);
  assert.equal(afterClear(LEVEL_COUNT, LEVEL_COUNT), LEVEL_COUNT, "never past the last jam");
});

test("migration: a phone with old progress keeps its place on the ladder, once", () => {
  // No old data: jam 1.
  assert.equal(migratedUnlock(null, null), 1);
  // Old stars for the first 20 jams of 40 (unlocked 21): about half way, 17 of 32.
  const stars = JSON.stringify(Object.fromEntries(Array.from({ length: 20 }, (_, i) => [i + 1, 2])));
  assert.equal(migratedUnlock(stars, null), Math.round((20 * 32) / 40) + 1);
  // The progress record (level → fewest moves) counts too, even where the stars key was never written.
  assert.equal(migratedUnlock(null, '{"1":3,"2":5,"3":0,"10":11}'), Math.round((10 * 32) / 40) + 1);
  // Everything cleared: the last jam, never beyond.
  const all = JSON.stringify(Object.fromEntries(Array.from({ length: 40 }, (_, i) => [i + 1, 3])));
  assert.equal(migratedUnlock(all, null), LEVEL_COUNT);
  // Junk is ignored.
  assert.equal(migratedUnlock("not json", "[1,2]"), 1);
  assert.equal(migratedUnlock('{"999":3}', '{"x":1,"41":2}'), 1);
  // Written once: the second visit reads what was kept.
  assert.deepEqual(readUnlock(null, stars, null), { unlock: migratedUnlock(stars, null), migrated: true });
  assert.deepEqual(readUnlock("6", stars, null), { unlock: 6, migrated: false });
  assert.deepEqual(readUnlock("99", stars, null), { unlock: LEVEL_COUNT, migrated: false });
  for (const junk of ["", "x", "0", "-2", "1.5"]) assert.equal(readUnlock(junk, null, null).migrated, true, junk);
  assert.equal(unlockedLevel({ 1: 3 }, 40), 2, "the shared rule is untouched");
});

test("the title's suggestions: the first open jam without stars, then one short of three, and ‹ › skip closed jams", () => {
  const old = { 1: 3, 2: 2, 3: 1, 4: 3, 5: 2 };
  assert.equal(recommended(6, old), 6);
  assert.equal(recommended(5, old), 2);
  assert.equal(recommended(2, { 1: 3, 2: 3 }), 2);
  assert.equal(neighbourLevel(3, 1, 4, {}, 9), 4);
  assert.equal(neighbourLevel(4, 1, 4, {}, 9), 9, "› jumps to the friend's jam");
  assert.equal(neighbourLevel(9, 1, 4, {}, 9), 0);
  assert.equal(neighbourLevel(1, -1, 4, {}, 0), 0);
});
