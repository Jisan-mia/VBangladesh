// Each statechart path (ai_docs/statecharts/kagojer-urojahaj/README.md) replayed against the pure session and step the
// component runs. The component steps the flight only while moving(), and holds the nose only while holding().
import assert from "node:assert/strict";
import test from "node:test";
import { makeCourse } from "../lib/course";
import { createGame } from "../lib/flight";
import { STEP } from "../lib/physics";
import { afterClear } from "../lib/progress";
import {
  again, away, back, cheerMayPlay, createSession, finish, holding, moving, pause, pick, press, reset, resume, start, storyDone, windStep, BREATH_MS, GUARD_MS,
} from "../lib/session";
import { stepGame } from "../lib/step.hot";

const flying = (at = 0) => { const s = createSession(); start(s, false, at); return s; };

test("bug 1 · PlaneMovesOnlyWhenHeld / InputReleasedWhenAway: hold, click into another window, let go there, come back: the nose is not held", () => {
  const s = flying(), game = createGame(makeCourse(1, 1), 3);
  press(s, true);
  assert.ok(holding(s, 1000));
  away(s, "blur");
  assert.equal(s.held, false, "blur lets go of the hold");
  // The keyup is lost in the other window. Coming back:
  back(s, "focus");
  assert.equal(s.held, false);
  assert.ok(resume(s, 2000));
  const before = game.a;
  for (let k = 0; k < 60; k++) if (moving(s, 2000 + BREATH_MS + k * 16)) stepGame(game, holding(s, 2000 + BREATH_MS + k * 16), STEP);
  assert.ok(game.a < before || game.a < 0, "with nothing held the nose goes down, not up");
  assert.equal(game.hold, false);
});

test("bug 2 · LoopOnlyWhenMeaningful: the wind loop stops on blur (pause) and comes back with sound; never a stub", () => {
  const s = flying();
  assert.equal(windStep(false, moving(s, 1000), true), "start");
  away(s, "blur");
  assert.equal(windStep(true, moving(s, 1000), true), "stop", "clicked into another window: the wind stops");
  back(s, "focus"); resume(s, 2000);
  assert.equal(windStep(false, moving(s, 2000 + BREATH_MS), true), "start");
  assert.equal(windStep(true, true, false), "stop", "sound off stops it");
  assert.equal(windStep(false, true, false), "keep", "no stub is made while muted");
  assert.equal(windStep(false, true, true), "start", "sound back: a fresh loop");
});

test("bug 3 · PausedWhenBlurred: clicking into another window pauses; coming back waits for চালিয়ে যাও", () => {
  const s = flying(), game = createGame(makeCourse(1, 2), 3);
  away(s, "blur");
  assert.equal(s.phase, "paused");
  for (let k = 0; k < 120; k++) if (moving(s, 1000 + k * 16)) stepGame(game, false, STEP);
  assert.equal(game.t, 0, "the flight does not move while away");
  back(s, "focus");
  assert.equal(s.phase, "paused", "focus alone does not resume");
  assert.ok(resume(s, 5000));
  assert.ok(!moving(s, 5000 + BREATH_MS - 1) && moving(s, 5000 + BREATH_MS), "a breath before it moves");
  away(s, "hide");
  assert.equal(resume(s, 6000), false, "never resumes onto a hidden tab");
});

test("the tap that brings you back only resumes: it never lifts the nose", () => {
  const s = flying();
  pause(s);
  resume(s, 1000);
  assert.equal(s.held, false);
  assert.ok(!holding(s, 1000));
});

test("choices freeze play: the level list and the story pause; a list pick lands on a title", () => {
  const s = flying();
  pick(s, true);
  assert.deepEqual([s.phase, s.picking, s.held], ["paused", true, false]);
  assert.ok(!moving(s, 1000));
  press(s, true);
  assert.equal(s.held, false, "no hold while the list is open");
  reset(s);
  assert.deepEqual([s.phase, s.picking], ["title", false]);
  const story = createSession();
  start(story, true, 0);
  assert.equal(story.phase, "story");
  assert.ok(!moving(story, 1000), "no flight time passes during the story");
  storyDone(story, 1000);
  assert.ok(moving(story, 2000));
});

test("result keys need a fresh press after the screen appears, and the guard", () => {
  const s = flying();
  finish(s, 1000);
  assert.equal(again(s, 1200), false, "too soon");
  assert.equal(again(s, 1000 + GUARD_MS, { at: 900, repeat: false }), false, "a key pressed before the end");
  assert.equal(again(s, 1000 + GUARD_MS, { at: 1100, repeat: true }), false, "a held key's repeat");
  assert.ok(again(s, 1000 + GUARD_MS, { at: 1100, repeat: false }));
});

test("a celebration timer only plays on its own run's end screen", () => {
  const s = flying();
  finish(s, 1000);
  const run = s.run;
  assert.ok(cheerMayPlay(s, run));
  again(s, 1000 + GUARD_MS);
  assert.equal(cheerMayPlay(s, run), false);
  reset(s);
  assert.equal(cheerMayPlay(s, run), false);
});

test("friend links: landing a friend's far-ahead flight records stars but opens nothing in between", () => {
  assert.equal(afterClear(2, 9), 2);
  assert.equal(afterClear(2, 2), 3);
  assert.equal(afterClear(12, 12), 12);
});
