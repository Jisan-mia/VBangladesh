// Each statechart path (ai_docs/statecharts/churui-tarao/README.md) replayed against the pure session and afternoon the component runs.
import assert from "node:assert/strict";
import test from "node:test";
import { createGame } from "../lib/afternoon";
import { afterClear } from "../lib/progress";
import {
  again, away, back, canClap, cheerMayPlay, choiceOk, createSession, finish, loopStep, moving, pause, pick, reset, resume, start, storyDone, BREATH_MS, GUARD_MS,
} from "../lib/session";
import { clap, eating, stepGame } from "../lib/step.hot";
import { SITTING } from "../lib/states";

const playing = (at = 0) => { const s = createSession(); start(s, false, at); return s; };
/** What the component does each frame: step the afternoon only while the session lets it move. */
const frames = (s: ReturnType<typeof createSession>, game: ReturnType<typeof createGame>, from: number, count: number) => {
  for (let i = 0; i < count; i++) if (moving(s, from + i * 16)) stepGame(game, 1 / 60);
};

test("bug 1 · PausedWhenBlurred + NoProgressWhileAway: clicking into another window pauses the afternoon, the rustle stops, and nothing is eaten", () => {
  const s = playing(), game = createGame(2, 3, 1);
  frames(s, game, 1000, 400);
  assert.ok(eating(game) > 0, "a bird is at the grain: the rustle is wanted");
  assert.equal(loopStep(false, moving(s, 9000) && eating(game) > 0, true), "start");
  away(s, "blur");
  assert.equal(s.phase, "paused");
  assert.equal(loopStep(true, moving(s, 9000) && eating(game) > 0, true), "stop", "the rustle stops on blur");
  const [t, grain] = [game.t, game.grain];
  frames(s, game, 10000, 400);
  assert.deepEqual([game.t, game.grain], [t, grain], "six seconds in another window move nothing and eat nothing");
  back(s, "focus");
  assert.equal(s.phase, "paused", "coming back shows the pause; it doesn't resume by itself");
  assert.ok(resume(s, 20000));
  assert.ok(!moving(s, 20000 + BREATH_MS - 1), "a breath before the birds move again");
  assert.ok(moving(s, 20000 + BREATH_MS));
  away(s, "hide");
  assert.deepEqual([s.phase, s.visible, s.focused], ["paused", false, false]);
  assert.equal(resume(s, 21000), false, "can't resume onto a hidden tab");
});

test("LoopComesBack: sound off and on brings a new rustle; muted, paused or on the card, no loop", () => {
  assert.equal(loopStep(false, true, true), "start");
  assert.equal(loopStep(true, true, false), "stop", "sound off stops it");
  assert.equal(loopStep(false, true, false), "keep", "no stub is made while muted");
  assert.equal(loopStep(false, true, true), "start", "sound back on: a fresh loop, never the old stub");
  assert.equal(loopStep(true, false, true), "stop");
  assert.equal(loopStep(true, true, true), "keep");
  const s = playing();
  finish(s, 1000);
  assert.equal(moving(s, 2000), false, "the card: no rustle wanted");
});

test("bug 2 · ChoiceFreezesPlay: সব ক্ষেত pauses the afternoon; nothing resumes under it; the first tap back only resumes and never claps", () => {
  const s = playing(), game = createGame(2, 5, 1);
  frames(s, game, 1000, 300);
  const [t, grain] = [game.t, game.grain];
  pick(s, true);
  assert.equal(s.phase, "paused");
  frames(s, game, 9000, 400);
  assert.deepEqual([game.t, game.grain], [t, grain], "with the list open the field is frozen");
  assert.ok(!moving(s, 20000) && !canClap(s));
  assert.equal(resume(s, 20000), false, "can't resume under the list");
  pick(s, false);
  assert.ok(resume(s, 20100));
  pause(s);
  assert.equal(canClap(s), false, "while paused a tap is no clap (the component resumes instead)");
  const claps = game.claps;
  if (canClap(s)) clap(game, 180, 400);
  assert.equal(game.claps, claps);
  assert.ok(resume(s, 20200));
  assert.ok(canClap(s), "the hands work during the breath; only the birds wait");
});

test("bug 3 · NoFanfareAfterMovingOn: a cheer queued for a card never plays over the next afternoon or card", () => {
  const s = playing();
  assert.ok(finish(s, 1000));
  assert.equal(finish(s, 1001), false, "ends once");
  const run = s.run;
  assert.ok(cheerMayPlay(s, run));
  assert.ok(again(s, 1000 + GUARD_MS));
  assert.equal(cheerMayPlay(s, run), false, "আবার খেলো: the new afternoon is on");
  finish(s, 9000);
  assert.equal(cheerMayPlay(s, run), false, "nor on the next card");
  const run2 = s.run;
  pick(s, true);
  assert.equal(cheerMayPlay(s, run2), false, "nor under সব ক্ষেত");
  pick(s, false);
  reset(s);
  assert.equal(cheerMayPlay(s, run2), false, "a friend's link or a new ক্ষেত drops it");
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

test("ReplayIsExact: a friend's link opened mid-round stops it and shows their ক্ষেত; their seed is their afternoon", () => {
  const s = playing();
  reset(s);
  assert.equal(s.phase, "title");
  assert.ok(!moving(s, 1000));
  assert.deepEqual([...createGame(9, 777, 1).x], [...createGame(9, 777, 1).x]);
  assert.deepEqual([...createGame(9, 777, 1).land], [...createGame(9, 777, 0).land]);
});

test("the story: first run only, freezes on pause, then the afternoon", () => {
  const s = createSession();
  assert.ok(start(s, true, 0));
  assert.equal(s.phase, "story");
  assert.ok(!moving(s, 5000) && !canClap(s), "no time passes during the story");
  pause(s);
  assert.ok(resume(s, 100));
  assert.equal(s.phase, "story");
  assert.ok(storyDone(s, 200));
  assert.equal(s.phase, "playing");
});

test("a clap only while the afternoon is on: none on the title, the card or under the pause", () => {
  const s = createSession(), game = createGame(1, 5, 1);
  assert.equal(canClap(s), false);
  start(s, false, 0);
  for (let i = 0; i < 300; i++) stepGame(game, 1 / 60);
  const i = Array.from(game.state).indexOf(SITTING);
  assert.ok(i >= 0 && canClap(s));
  assert.equal(clap(game, game.x[i], game.y[i]), 1);
  finish(s, 100);
  assert.equal(canClap(s), false);
});

test("a start needs a focused, shown window; the very first Enter on the title is the only start", () => {
  const s = createSession();
  away(s, "blur");
  assert.equal(start(s, false, 0), false, "no start from another window");
  back(s, "focus");
  assert.ok(start(s, false, 10));
  assert.equal(start(s, false, 20), false, "already started");
});

test("OpenLevelsAreEarned: only your own furthest clear opens the next ক্ষেত", () => {
  let unlock = 1;
  unlock = afterClear(unlock, 1); assert.equal(unlock, 2);
  unlock = afterClear(unlock, 9); assert.equal(unlock, 2, "a friend's ক্ষেত 9");
  unlock = afterClear(unlock, 2); assert.equal(unlock, 3);
});
