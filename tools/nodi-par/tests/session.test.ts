// Each statechart path (ai_docs/statecharts/nodi-par/README.md) replayed against the pure session and the river the component runs.
import assert from "node:assert/strict";
import test from "node:test";
import { afterClear, playable, readUnlock, recommended } from "../lib/progress";
import { makeRiver, UP } from "../lib/river";
import { createRun } from "../lib/run";
import {
  again, away, back, canHop, cheerMayPlay, choiceOk, createSession, finish, loopStep, moving, pause, pick, reset, resume, start, storyDone, BREATH_MS, GUARD_MS,
} from "../lib/session";
import { act, stepRun } from "../lib/step.hot";

const playing = (at = 0) => { const s = createSession(); start(s, false, at); return s; };
/** What the component does each frame: step the river only while the session lets it move. */
const frames = (s: ReturnType<typeof createSession>, run: ReturnType<typeof createRun>, from: number, count: number) => {
  for (let i = 0; i < count; i++) if (moving(s, from + i * 16)) stepRun(run, 1 / 60);
};

test("bug 4 · PausedWhenBlurred + WaterOnlyWhileCrossing: clicking into another window pauses the river, the water stops, and the clock holds", () => {
  const s = playing(), run = createRun(makeRiver(3));
  frames(s, run, 1000, 120);
  assert.equal(loopStep(false, moving(s, 9000), true), "start");
  away(s, "blur");
  assert.equal(s.phase, "paused");
  assert.equal(loopStep(true, moving(s, 9000), true), "stop", "the water stops on blur");
  const t = run.t, x = run.x;
  frames(s, run, 10000, 400);
  assert.deepEqual([run.t, run.x], [t, x], "six seconds in another window move nothing");
  back(s, "focus");
  assert.equal(s.phase, "paused", "coming back shows the pause; it doesn't resume by itself");
  assert.equal(canHop(s), false, "the click that brings you back is no hop");
  assert.ok(resume(s, 20000));
  assert.ok(!moving(s, 20000 + BREATH_MS - 1), "a breath before the river moves again");
  assert.ok(moving(s, 20000 + BREATH_MS));
  away(s, "hide");
  assert.deepEqual([s.phase, s.visible, s.focused], ["paused", false, false]);
  assert.equal(resume(s, 21000), false, "can't resume onto a hidden tab");
});

test("LoopComesBack: sound off and on brings a new water loop; muted, paused or on the card, no loop", () => {
  assert.equal(loopStep(false, true, true), "start");
  assert.equal(loopStep(true, true, false), "stop", "sound off stops it");
  assert.equal(loopStep(false, true, false), "keep", "no stub is made while muted");
  assert.equal(loopStep(false, true, true), "start", "sound back on: a fresh loop, never the old stub");
  assert.equal(loopStep(true, false, true), "stop");
  const s = playing();
  finish(s, 1000);
  assert.equal(moving(s, 2000), false, "the card: no water wanted");
});

test("bug 5 · LevelPickerFreezesPlay: সব নদী pauses the crossing; nothing resumes under it", () => {
  const s = playing(), run = createRun(makeRiver(2));
  frames(s, run, 1000, 60);
  const t = run.t;
  pick(s, true);
  assert.equal(s.phase, "paused");
  frames(s, run, 9000, 400);
  assert.equal(run.t, t, "with the list open the clock holds");
  assert.ok(!moving(s, 20000) && !canHop(s));
  assert.equal(resume(s, 20000), false, "can't resume under the list");
  pick(s, false);
  assert.ok(resume(s, 20100));
  pause(s);
  assert.equal(canHop(s), false, "while paused a tap is no hop (the component resumes instead)");
  const hops = run.hops;
  if (canHop(s)) act(run, UP);
  assert.equal(run.hops, hops);
  assert.ok(resume(s, 20200));
  assert.ok(canHop(s), "the hands work during the breath; only the river waits");
});

test("bug 3 · CheerOnlyOnTheCard: a cheer queued for a card never plays over the next crossing or card", () => {
  const s = playing();
  assert.ok(finish(s, 1000));
  assert.equal(finish(s, 1001), false, "ends once");
  const run = s.run;
  assert.ok(cheerMayPlay(s, run));
  assert.ok(again(s, 1000 + GUARD_MS));
  assert.equal(cheerMayPlay(s, run), false, "আবার খেলো: the new crossing is on");
  finish(s, 9000);
  assert.equal(cheerMayPlay(s, run), false, "nor on the next card");
  const run2 = s.run;
  pick(s, true);
  assert.equal(cheerMayPlay(s, run2), false, "nor under সব নদী");
  pick(s, false);
  reset(s);
  assert.equal(cheerMayPlay(s, run2), false, "a friend's link or a new river drops it");
});

test("bug 2 · CardNeedsAFreshPress: the card takes only a fresh press after it appeared, after the guard", () => {
  const s = playing();
  finish(s, 1000);
  assert.equal(choiceOk(s, 1000 + GUARD_MS - 1), false, "too soon after the end");
  assert.equal(choiceOk(s, 1000 + GUARD_MS, { at: 900, repeat: false }), false, "a key pressed before the card");
  assert.equal(choiceOk(s, 1000 + GUARD_MS, { at: 1500, repeat: true }), false, "Space held through the last hop repeats");
  assert.ok(choiceOk(s, 1000 + GUARD_MS, { at: 1600, repeat: false }));
  assert.ok(again(s, 1000 + GUARD_MS, { at: 1600, repeat: false }));
});

test("bug 1 · ShownRiverIsTheOneCrossed + SavedUnderTheRiverCrossed: a friend's link mid-crossing ends it; its river is the friend's, nothing is saved for it", () => {
  const s = playing(), mine = createRun(makeRiver(1));
  frames(s, mine, 1000, 30);
  reset(s); // hashchange → load(friend's river): the title of river 5 shows
  assert.equal(s.phase, "title");
  assert.ok(!moving(s, 2000), "the old crossing no longer runs");
  assert.equal(finish(s, 2100), false, "a result can't arrive for a crossing that was dropped");
  assert.equal(mine.river.level, 1, "and a crossing that did finish would still be keyed to its own river");
  // Far-ahead friend river: stars would be recorded, the next rivers stay shut.
  let unlock = 1;
  unlock = afterClear(unlock, 5);
  assert.equal(unlock, 1, "clearing a friend's river 5 opens nothing in between");
  unlock = afterClear(unlock, 1); assert.equal(unlock, 2);
  assert.equal(playable(5, unlock, { 1: 3 }, 5), true, "the friend's river itself can be played");
  assert.equal(playable(5, unlock, { 1: 3 }, 0), false);
  assert.equal(playable(3, unlock, {}, 5), false, "river 3 stays shut");
});

test("the story: first run only, freezes on pause, then the crossing", () => {
  const s = createSession();
  assert.ok(start(s, true, 0));
  assert.equal(s.phase, "story");
  assert.ok(!moving(s, 5000) && !canHop(s), "no time passes during the story");
  pause(s);
  assert.ok(resume(s, 100));
  assert.equal(s.phase, "story");
  assert.ok(storyDone(s, 200));
  assert.equal(s.phase, "playing");
});

test("a start needs a focused, shown window; the very first Enter on the title is the only start", () => {
  const s = createSession();
  away(s, "blur");
  assert.equal(start(s, false, 0), false, "no start from another window");
  back(s, "focus");
  assert.ok(start(s, false, 10));
  assert.equal(start(s, false, 20), false, "already started");
});

test("progress: your own unlock migrates once from the stars, then rises only by clearing the furthest open river", () => {
  assert.deepEqual(readUnlock(null, { 1: 3, 2: 1, 7: 2 }), { unlock: 8, migrated: true });
  assert.deepEqual(readUnlock("4", { 1: 3 }), { unlock: 4, migrated: false });
  assert.deepEqual(readUnlock("garbage", {}), { unlock: 1, migrated: true });
  assert.equal(recommended(4, { 1: 3, 2: 3 }), 3);
  assert.equal(recommended(3, { 1: 3, 2: 3, 3: 3 }), 3, "all three-starred: the furthest open one");
  assert.equal(recommended(3, { 1: 3, 2: 1, 3: 3 }), 2, "then the first with fewer than three");
});
