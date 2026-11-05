// Each statechart path (ai_docs/statecharts/moshar-raat/README.md) replayed against the pure session and night the component runs.
import assert from "node:assert/strict";
import test from "node:test";
import { createGame, FLY } from "../lib/game";
import { afterClear } from "../lib/progress";
import {
  again, away, back, canSwing, cheerMayPlay, choiceOk, createSession, finish, loopStep, moving, pause, pick, reset, resume, start, storyDone, BREATH_MS, GUARD_MS,
} from "../lib/session";
import { stepGame, swing } from "../lib/step.hot";

const playing = (at = 0) => { const s = createSession(); start(s, false, at); return s; };

test("bug 1 · PausedWhenBlurred + LoopOnlyWhenMeaningful: clicking into another window pauses the night and stops the whine; focus never resumes by itself", () => {
  const s = playing(), game = createGame(1, 3, 3);
  for (let i = 0; i < 240; i++) if (moving(s, 1000 + i * 16)) stepGame(game, 1 / 60);
  assert.ok(game.near >= 0, "a mosquito flies: the whine is wanted");
  assert.equal(loopStep(false, moving(s, 5000) && game.near >= 0, true), "start");
  away(s, "blur");
  assert.equal(s.phase, "paused");
  assert.equal(loopStep(true, moving(s, 5000) && game.near >= 0, true), "stop", "the whine stops on blur");
  const t = game.t;
  for (let i = 0; i < 300; i++) if (moving(s, 6000 + i * 16)) stepGame(game, 1 / 60);
  assert.equal(game.t, t, "five seconds in another window move nothing");
  back(s, "focus");
  assert.equal(s.phase, "paused", "coming back shows the pause; it doesn't resume by itself");
  assert.ok(resume(s, 12000));
  assert.ok(!moving(s, 12000 + BREATH_MS - 1), "a breath before the night moves again");
  assert.ok(moving(s, 12000 + BREATH_MS));
  away(s, "hide");
  assert.deepEqual([s.phase, s.visible, s.focused], ["paused", false, false]);
  assert.equal(resume(s, 13000), false, "can't resume onto a hidden tab");
});

test("LoopComesBack: sound off and on mid-night brings a new whine; muted, paused or on the card, no loop", () => {
  assert.equal(loopStep(false, true, true), "start");
  assert.equal(loopStep(true, true, false), "stop", "sound off stops it");
  assert.equal(loopStep(false, true, false), "keep", "no stub is made while muted");
  assert.equal(loopStep(false, true, true), "start", "sound back on: a fresh loop, never the old stub");
  assert.equal(loopStep(true, false, true), "stop");
  assert.equal(loopStep(true, true, true), "keep");
  const s = playing();
  finish(s, 1000);
  assert.equal(moving(s, 2000), false, "the card: no whine wanted");
});

test("ChoiceFreezesPlay and the first tap back: সব রাত pauses; nothing resumes under it; a tap on the cover only resumes and never swings", () => {
  const s = playing();
  pick(s, true);
  assert.equal(s.phase, "paused");
  assert.ok(!moving(s, 1000) && !canSwing(s));
  assert.equal(resume(s, 100), false);
  pick(s, false);
  assert.ok(resume(s, 200));
  pause(s);
  assert.equal(canSwing(s), false, "while paused a tap is no swing (the component resumes instead)");
  assert.ok(resume(s, 300));
  assert.ok(canSwing(s), "the bat works during the breath; only the mosquitoes wait");
});

test("NoDoubleResult and CelebrationOnItsOwnCard: a night ends once; a fanfare queued for a card never plays over the next night", () => {
  const s = playing();
  assert.ok(finish(s, 1000));
  assert.equal(finish(s, 1001), false, "ends once");
  const run = s.run;
  assert.ok(cheerMayPlay(s, run));
  assert.ok(again(s, 1000 + GUARD_MS));
  assert.equal(cheerMayPlay(s, run), false, "the next night is on");
  finish(s, 9000);
  assert.equal(cheerMayPlay(s, run), false, "nor on the next card");
  reset(s);
  assert.equal(cheerMayPlay(s, s.run), false);
});

test("HeldKeyNeverSkips: the end screen takes only a fresh press after it appeared, after the guard", () => {
  const s = playing();
  finish(s, 1000);
  assert.equal(choiceOk(s, 1000 + GUARD_MS - 1), false, "too soon after the end");
  assert.equal(choiceOk(s, 1000 + GUARD_MS, { at: 900, repeat: false }), false, "a key pressed before the card");
  assert.equal(choiceOk(s, 1000 + GUARD_MS, { at: 1500, repeat: true }), false, "a key held through the end repeats");
  assert.ok(choiceOk(s, 1000 + GUARD_MS, { at: 1600, repeat: false }));
  assert.ok(again(s, 1000 + GUARD_MS, { at: 1600, repeat: false }));
});

test("ReplayIsExact: a friend's link opened mid-night stops it and shows their night; their seed is their night", () => {
  const s = playing();
  reset(s);
  assert.equal(s.phase, "title");
  assert.ok(!moving(s, 1000));
  assert.deepEqual([...createGame(9, 777, 3).biteAt], [...createGame(9, 777, 3).biteAt]);
});

test("the story: first run only, freezes on pause, then the night", () => {
  const s = createSession();
  assert.ok(start(s, true, 0));
  assert.equal(s.phase, "story");
  assert.ok(!moving(s, 5000) && !canSwing(s), "no night time passes during the story");
  pause(s);
  assert.ok(resume(s, 100));
  assert.equal(s.phase, "story");
  assert.ok(storyDone(s, 200));
  assert.equal(s.phase, "playing");
});

test("a swing only while the night is on: none on the title, the card or under the pause", () => {
  const s = createSession(), game = createGame(1, 5, 3);
  assert.equal(canSwing(s), false);
  start(s, false, 0);
  for (let i = 0; i < 200; i++) stepGame(game, 1 / 60);
  const i = Array.from(game.state).indexOf(FLY);
  assert.ok(i >= 0 && canSwing(s));
  assert.equal(swing(game, game.x[i], game.y[i]), 1);
  finish(s, 100);
  assert.equal(canSwing(s), false);
});

test("OpenLevelsAreEarned: only your own furthest clear opens the next রাত", () => {
  let unlock = 1;
  unlock = afterClear(unlock, 1); assert.equal(unlock, 2);
  unlock = afterClear(unlock, 9); assert.equal(unlock, 2, "a friend's রাত 9");
  unlock = afterClear(unlock, 2); assert.equal(unlock, 3);
});
