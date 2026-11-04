// Each statechart path (ai_docs/statecharts/marble-sinri/README.md) replayed against the pure modules the component runs:
// lib/session.ts (when anything may move), lib/hands.ts (what counts as held) and lib/step.hot.ts (the marble).
import assert from "node:assert/strict";
import test from "node:test";
import { makeFloor } from "../lib/gen";
import { createGame } from "../lib/game";
import { direction, makeHands, press, release } from "../lib/hands";
import { afterClear } from "../lib/progress";
import { STEP } from "../lib/physics";
import { again, away, back, cheerMayPlay, createSession, finish, humStep, menu, moving, pause, pick, reset, resume, start, storyDone, BREATH_MS, GUARD_MS } from "../lib/session";
import { stepGame } from "../lib/step.hot";

const playing = (at = 0) => { const s = createSession(); start(s, false, at); return s; };
/** The component's step: the stairs move only while moving(), with the side the hands hold. */
function frames(s: ReturnType<typeof createSession>, game: ReturnType<typeof createGame>, hands: ReturnType<typeof makeHands>, from: number, count: number) {
  for (let i = 0; i < count; i++) if (moving(s, from + i * 16)) stepGame(game, STEP, direction(hands));
}

test("bug 1 · MarbleRollsOnlyWhenHeld, InputReleasedWhenAway: hold →, click away, let go there, come back: the marble doesn't roll on its own", () => {
  const s = playing(), rows = makeFloor(3, 2), game = createGame(3, rows, rows.length - 1, 3), hands = makeHands();
  press(hands, "key1", 1);
  frames(s, game, hands, 1000, 12);
  assert.ok(game.vx > 0);
  // The window blurs: the component releases every key and finger (the keyup will be lost) and pauses.
  release(hands); away(s, "blur");
  assert.equal(direction(hands), 0, "nothing counts as held after a blur");
  const x = game.x, t = game.t;
  frames(s, game, hands, 2000, 120);
  assert.deepEqual([game.x, game.t], [x, t], "two seconds away move nothing");
  back(s, "focus");
  assert.equal(s.phase, "paused", "coming back does not resume by itself");
  assert.ok(resume(s, 5000));
  frames(s, game, hands, 5000, 60);
  assert.equal(direction(hands), 0);
  assert.ok(game.vx === 0 && game.x - x < 30, `only its own momentum, then grip stops it: ${(game.x - x).toFixed(1)} units`);
});

test("bug 2 · LoopOnlyWhenMeaningful: clicking into another window stops the roll hum", () => {
  const s = playing();
  assert.equal(humStep(false, moving(s, 1000), true), "start");
  away(s, "blur");
  assert.equal(humStep(true, moving(s, 1100), true), "stop", "paused by the blur: no hum");
  away(s, "hide");
  assert.equal(humStep(true, moving(s, 1200), true), "stop");
});

test("bug 3 · PausedWhenBlurred: clicking into another window pauses the stairs; they wait for চালিয়ে যাও and a breath", () => {
  const s = playing();
  assert.ok(moving(s, 1000));
  away(s, "blur");
  assert.equal(s.phase, "paused");
  back(s, "focus");
  assert.ok(!moving(s, 3000));
  assert.ok(resume(s, 5000));
  assert.ok(!moving(s, 5000 + BREATH_MS - 1), "a breath before the stairs move again");
  assert.ok(moving(s, 5000 + BREATH_MS));
  away(s, "hide");
  assert.deepEqual([s.phase, s.visible, s.focused], ["paused", false, false]);
  assert.equal(resume(s, 6000), false, "can't resume onto a hidden tab");
});

test("bug 4 · LoopComesBack: sound off, start, sound on: a new hum, never the muted stub", () => {
  assert.equal(humStep(false, true, false), "keep", "no stub is made while muted");
  assert.equal(humStep(false, true, true), "start", "sound back on: a fresh loop");
  assert.equal(humStep(true, true, false), "stop", "sound off stops it");
  assert.equal(humStep(true, false, true), "stop", "paused, picking or over: no hum");
  assert.equal(humStep(true, true, true), "keep");
});

test("bug 5 · NoChimeAfterLeaving: a floor's fanfare plays only on its own end screen, never under the pause menu or a new run", () => {
  const s = playing();
  assert.ok(finish(s, 1000));
  const run = s.run;
  assert.ok(cheerMayPlay(s, run));
  menu(s, true);
  assert.equal(cheerMayPlay(s, run), false, "the player's pause menu is open over the end screen");
  menu(s, false);
  away(s, "blur");
  assert.equal(cheerMayPlay(s, run), false, "another window has focus");
  back(s, "focus");
  assert.ok(again(s, 1000 + GUARD_MS));
  assert.equal(cheerMayPlay(s, run), false, "the next run is rolling");
  finish(s, 9000);
  assert.equal(cheerMayPlay(s, run), false, "nor on the next card");
  reset(s);
  assert.equal(cheerMayPlay(s, s.run), false, "a floor's title");
});

test("ChoiceFreezesPlay and the first tap back: সব তলা pauses; closing it or a tap on the cover only resumes", () => {
  const s = playing();
  pick(s, true);
  assert.equal(s.phase, "paused", "the list is a choice screen");
  assert.ok(!moving(s, 1000));
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

test("the story: first run only, freezes on pause, then the stairs", () => {
  const s = createSession();
  assert.ok(start(s, true, 0));
  assert.equal(s.phase, "story");
  assert.ok(!moving(s, 5000), "no time passes on the stairs during the story");
  pause(s);
  assert.ok(resume(s, 100));
  assert.equal(s.phase, "story");
  assert.ok(storyDone(s, 200));
  assert.equal(s.phase, "playing");
});

test("OpenLevelsAreEarned: only your own furthest clear opens the next floor", () => {
  let unlock = 1;
  unlock = afterClear(unlock, 1); assert.equal(unlock, 2);
  unlock = afterClear(unlock, 7); assert.equal(unlock, 2, "a friend's floor 7");
  unlock = afterClear(unlock, 2); assert.equal(unlock, 3);
});

test("ReplayIsExact: a friend's link gives their floor's exact stairs", () => {
  assert.deepEqual(makeFloor(12345, 8), makeFloor(12345, 8));
  const s = playing();
  reset(s);
  assert.equal(s.phase, "title");
  assert.ok(!moving(s, 1000), "a link opened mid-floor stops it on the friend's title");
});
