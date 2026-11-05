// The statechart's bug paths (ai_docs/statecharts/jhalmuri-sap/README.md), replayed against the pure session and progress code.
import assert from "node:assert/strict";
import test from "node:test";
import { recordLevel, unlockedLevel } from "../../../shared/game-core";
import { afterClear, playable, readUnlock, recommended } from "../lib/progress";
import { again, away, back, cheerMayPlay, createSession, finish, moving, pause, pick, reset, resume, start, storyDone, GUARD_MS } from "../lib/session";

test("bug 1, PausedWhenBlurred: start, click into another window, and the snake stops until চালিয়ে যাও", () => {
  const s = createSession();
  assert.ok(start(s, false));
  assert.ok(moving(s));
  away(s, "blur");
  assert.equal(s.phase, "paused");
  assert.equal(moving(s), false);
  assert.equal(resume(s), false, "nothing resumes while another window has focus");
  back(s, "focus");
  assert.equal(s.phase, "paused", "coming back alone doesn't move the snake");
  assert.ok(resume(s));
  assert.ok(moving(s));
  away(s, "hide");
  assert.equal(moving(s), false);
});

test("bug 2, PausedWhenScrolledAway: a run can't start, or start again, while the stage is off-screen", () => {
  const s = createSession();
  away(s, "scroll");
  assert.equal(start(s, false), false, "শুরু refused off-screen");
  back(s, "scroll");
  assert.ok(start(s, false));
  assert.ok(finish(s, 1000));
  away(s, "scroll");
  assert.equal(again(s, 1000 + GUARD_MS + 100), false, "আরেকবার refused off-screen");
  back(s, "scroll");
  assert.ok(again(s, 1000 + GUARD_MS + 100));
  away(s, "scroll");
  assert.equal(s.phase, "paused");
});

test("bug 3, CelebrationOnItsOwnCard: a chime queued at the end never plays after পরের লেভেল, a level pick or a restart", () => {
  for (const moveOn of [
    (s: ReturnType<typeof createSession>) => again(s, 1000 + 764),
    (s: ReturnType<typeof createSession>) => { reset(s); return true; },
  ]) {
    const s = createSession();
    start(s, false);
    finish(s, 1000);
    const run = s.run;
    assert.ok(cheerMayPlay(s, run), "on its own card it plays");
    assert.ok(moveOn(s));
    assert.equal(cheerMayPlay(s, run), false, "after moving on it is dropped");
    if (s.phase === "playing") { finish(s, 3000); assert.equal(cheerMayPlay(s, run), false, "even on the next run's card"); }
  }
});

test("result keys need a fresh press: a key held through the crash, or pressed before the card, never starts the next run", () => {
  const s = createSession();
  start(s, false);
  finish(s, 5000);
  assert.equal(again(s, 5100, { at: 5100, repeat: false }), false, "inside the 0.7 s guard");
  assert.equal(again(s, 6000, { at: 6000, repeat: true }), false, "a held key's repeat");
  assert.equal(again(s, 6000, { at: 4990, repeat: false }), false, "a press from before the card");
  assert.ok(again(s, 6000, { at: 6000, repeat: false }));
});

test("ChoiceFreezesPlay: the level list opens only on the title or the end screen, and nothing starts under it", () => {
  const s = createSession();
  start(s, false);
  assert.equal(pick(s, true), false, "not mid-run");
  finish(s, 100);
  assert.ok(pick(s, true));
  assert.equal(again(s, 5000), false);
  reset(s);
  assert.equal(s.picking, false);
  pick(s, true);
  assert.equal(start(s, false), false);
  pick(s, false);
  assert.ok(start(s, true));
  assert.equal(s.phase, "story");
  assert.equal(moving(s), false, "the story doesn't move the snake");
  away(s, "blur");
  assert.equal(s.phase, "paused");
  back(s, "focus");
  assert.ok(resume(s));
  assert.equal(s.phase, "story", "resume returns to the story");
  assert.ok(storyDone(s));
  assert.ok(moving(s));
});

test("friend links: clearing a friend's far-ahead level records its stars but opens nothing in between", () => {
  let stars = recordLevel({}, 1, 3);
  stars = recordLevel(stars, 2, 2);
  let { unlock, migrated } = readUnlock(null, stars, 12);
  assert.deepEqual([unlock, migrated], [3, true], "migrated once from the shared rule");
  stars = recordLevel(stars, 9, 2);
  unlock = afterClear(unlock, 9, 12);
  assert.equal(unlock, 3, "level 9 from a link doesn't open 4–8");
  assert.equal(unlockedLevel(stars, 12), 10, "(the shared rule would have)");
  assert.ok(playable(9, unlock, stars), "the friend's level stays playable: it has stars");
  assert.equal(playable(6, unlock, stars), false);
  assert.ok(playable(11, unlock, stars, 11), "the friend's level on this link");
  assert.equal(afterClear(unlock, 3, 12), 4, "clearing your own furthest level opens the next");
  assert.equal(afterClear(12, 12, 12), 12);
  assert.deepEqual(readUnlock("3", stars, 12), { unlock: 3, migrated: false }, "after the migration the saved number wins");
  assert.deepEqual(readUnlock("junk", { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 }, 12).unlock, 6, "a broken value migrates again, never below the old rule");
  assert.equal(recommended(unlock, stars), 3);
  assert.equal(recommended(3, { 1: 3, 2: 1, 3: 2 }), 2);
});

test("UnlockNeverShrinks: whatever is cleared, in any order, the unlock only grows", () => {
  let unlock = 1;
  for (const level of [1, 5, 2, 2, 12, 3, 4, 9, 5, 6, 1]) {
    const next = afterClear(unlock, level, 12);
    assert.ok(next >= unlock);
    unlock = next;
  }
  assert.equal(unlock, 7);
});
