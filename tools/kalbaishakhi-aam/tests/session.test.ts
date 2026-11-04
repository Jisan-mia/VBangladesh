// Each statechart path (ai_docs/statecharts/kalbaishakhi-aam/README.md) replayed against the pure session the component runs.
import assert from "node:assert/strict";
import test from "node:test";
import { createGame } from "../lib/game";
import { makeLevelStorm } from "../lib/gen";
import { afterClear } from "../lib/progress";
import { again, away, back, cheerMayPlay, createSession, finish, moving, pause, pick, reset, resume, start, storyDone, windStep, BREATH_MS, GUARD_MS } from "../lib/session";
import { stepGame } from "../lib/step.hot";

const playing = (at = 0) => { const s = createSession(); start(s, false, at); return s; };

test("bug 1 · PausedWhenBlurred: clicking into another window pauses the storm; it stays still until you resume", () => {
  const s = playing(), game = createGame(makeLevelStorm(1, 3), 3);
  assert.ok(moving(s, 1000));
  away(s, "blur");
  assert.equal(s.phase, "paused");
  // The component steps the storm only while moving(): two seconds in the other window move nothing.
  for (let i = 0; i < 120; i++) if (moving(s, 2000 + i * 16)) stepGame(game, 1 / 60, 0, 5);
  assert.equal(game.t, 0);
  back(s, "focus");
  assert.equal(s.phase, "paused", "coming back does not resume by itself");
  assert.ok(resume(s, 5000));
  assert.ok(!moving(s, 5000 + BREATH_MS - 1), "a breath before the storm moves again");
  assert.ok(moving(s, 5000 + BREATH_MS));
  away(s, "hide");
  assert.deepEqual([s.phase, s.visible, s.focused], ["paused", false, false]);
  assert.equal(resume(s, 6000), false, "can't resume onto a hidden tab");
});

test("bug 2 · WindComesBack: sound off and on mid-storm brings a new wind loop; muted or still, no loop", () => {
  assert.equal(windStep(false, true, true), "start", "a storm with sound on and no live loop starts one");
  assert.equal(windStep(true, true, false), "stop", "sound off stops it");
  assert.equal(windStep(false, true, false), "keep", "no stub is made while muted");
  assert.equal(windStep(false, true, true), "start", "sound back on: a fresh loop, not the old stub");
  assert.equal(windStep(true, false, true), "stop", "paused, picking or over: no wind");
  assert.equal(windStep(true, true, true), "keep");
});

test("bug 3 · WindOnlyInTheStorm: picking a storm from সব ঝড় mid-storm pauses, then lands on its title with no wind", () => {
  const s = playing();
  pick(s, true);
  assert.equal(s.phase, "paused", "the list is a choice screen: it pauses");
  assert.ok(!moving(s, 1000));
  reset(s);
  assert.deepEqual([s.phase, s.picking], ["title", false]);
  assert.equal(windStep(true, moving(s, 2000), true), "stop");
});

test("bug 4 · CelebrationOnItsOwnCard: a fanfare queued for a card never plays over the next storm", () => {
  const s = playing();
  assert.ok(finish(s, 1000));
  const run = s.run;
  assert.ok(cheerMayPlay(s, run));
  assert.ok(again(s, 1000 + GUARD_MS));
  assert.equal(cheerMayPlay(s, run), false, "the next storm is falling");
  finish(s, 9000);
  assert.equal(cheerMayPlay(s, run), false, "nor on the next card");
  reset(s);
  assert.equal(cheerMayPlay(s, s.run), false);
});

test("bug 5 · ReplayIsExact: a friend's link opened mid-storm stops it and shows their storm's title", () => {
  const s = playing();
  // The component's load() for the link: reset to the title of the friend's storm with their seed.
  reset(s);
  assert.equal(s.phase, "title");
  assert.ok(!moving(s, 1000));
  assert.deepEqual(makeLevelStorm(12345, 4), makeLevelStorm(12345, 4), "their seed and storm number give their storm");
});

test("ChoiceFreezesPlay and the first tap back: the list pauses; closing it or a tap on the cover only resumes", () => {
  const s = playing();
  pick(s, true);
  assert.equal(resume(s, 100), false, "nothing resumes under the open list");
  pick(s, false);
  assert.ok(resume(s, 200));
  pause(s);
  assert.ok(resume(s, 300), "the tap that brings you back resumes");
  assert.equal(s.phase, "playing");
});

test("HeldKeyNeverSkips: the end screen takes only a fresh press after it appeared, after the guard", () => {
  const s = playing();
  finish(s, 1000);
  assert.equal(again(s, 1000 + GUARD_MS - 1), false, "too soon after the end");
  assert.equal(again(s, 1000 + GUARD_MS, { at: 900, repeat: false }), false, "a key pressed before the card");
  assert.equal(again(s, 1000 + GUARD_MS, { at: 1500, repeat: true }), false, "a key held through the end repeats");
  assert.ok(again(s, 1000 + GUARD_MS, { at: 1600, repeat: false }));
});

test("the story: first run only, freezes on pause, then the storm", () => {
  const s = createSession();
  assert.ok(start(s, true, 0));
  assert.equal(s.phase, "story");
  assert.ok(!moving(s, 5000), "no storm time passes during the story");
  pause(s);
  assert.ok(resume(s, 100));
  assert.equal(s.phase, "story");
  assert.ok(storyDone(s, 200));
  assert.equal(s.phase, "playing");
});

test("OpenLevelsAreEarned: only your own furthest clear opens the next storm", () => {
  let unlock = 1;
  unlock = afterClear(unlock, 1); assert.equal(unlock, 2);
  unlock = afterClear(unlock, 7); assert.equal(unlock, 2, "a friend's storm 7");
  unlock = afterClear(unlock, 2); assert.equal(unlock, 3);
});
