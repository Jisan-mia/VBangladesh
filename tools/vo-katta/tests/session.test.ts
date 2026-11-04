// The statechart's bug paths (ai_docs/statecharts/vo-katta/), replayed against the pure session and rules.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createGame, E, steerTo, type Game } from "../lib/kite";
import { nextAhead, openLevel } from "../lib/levels";
import * as S from "../lib/session";
import { stepGame } from "../lib/step.hot";

const DT = 1 / 60;
/** What the component's step() does: nothing unless the game ticks, then the hand, the rules and the loops. */
function frames(s: S.Session, game: Game, loops: S.Loops, seconds: number) {
  const seen: number[] = [];
  for (let i = 0; i < Math.round(seconds / DT); i++) {
    if (!S.ticking(s) || S.breathing(s, DT)) continue;
    stepGame(game, S.applyInput(s, game, DT), DT);
    for (let e = 0; e < game.evCount; e++) seen.push(game.ev[e]);
    game.evCount = 0;
    S.syncLoops(s, game, loops);
  }
  return seen;
}
function audio() {
  const playing = new Set<string>();
  return { playing, loops: { start: (kind: string) => { playing.add(kind); }, stop: (kind: string) => { playing.delete(kind); } } as S.Loops };
}
function playing(level = 3, sound = true) {
  const s = S.createSession(sound), game = createGame(48213, level), out = audio();
  S.goTo(s, "play");
  S.syncLoops(s, game, out.loops);
  return { s, game, out };
}
const moving = (game: Game) => [game.time, game.total, game.you.x, game.you.y, game.rivals[0].x, game.rivals[0].y, game.tug];

test("statechart PausedWhenBlurred / NoProgressWhileAway: hold টান, click into another window, and the evening stands still", () => {
  const { s, game, out } = playing();
  assert.ok(S.pointerDown(s, 1, 100, 300));
  frames(s, game, out.loops, 1.5);
  assert.equal(game.phase, "fly");
  assert.ok(game.time > 1, "the clock ran while you played");
  // The window blurs: the pointerup never comes. Even before the player's menu opens, nothing moves.
  S.blur(s); S.syncLoops(s, game, out.loops);
  assert.equal(s.pointer, null, "the finger is let go");
  assert.equal(S.pulling(s), false);
  const before = moving(game);
  frames(s, game, out.loops, 30);
  assert.deepEqual(moving(game), before, "no clock, no rivals, no wind while away");
  assert.equal(game.lost, 0, "nobody cut your kite while you were away");
  assert.equal(out.playing.size, 0, "the wind stops while away");
  // The player opens its menu (blur once engaged), then চালিয়ে যাও: fresh hands, and the sky moves again.
  S.pause(s); S.focus(s); S.resume(s); S.syncLoops(s, game, out.loops);
  assert.equal(S.pulling(s), false, "nothing carried over from before");
  frames(s, game, out.loops, S.BREATH - 0.05);
  assert.equal(game.time, before[0], "a short breath before the sky moves");
  frames(s, game, out.loops, 0.5);
  assert.ok(game.time > before[0], "back to playing");
  assert.ok(out.playing.has("wind"));
});

test("statechart OffScreenMeansPaused: with the player's menu open (scrolled away, hidden, Escape), nothing moves and no button resumes behind it", () => {
  const { s, game, out } = playing();
  S.pointerDown(s, 1, 100, 300);
  frames(s, game, out.loops, 1);
  S.pause(s); S.syncLoops(s, game, out.loops);
  const before = moving(game);
  assert.equal(S.pointerDown(s, 2, 100, 300), false, "a tap on the sky under the menu is no move");
  assert.equal(S.keyDown(s, "space"), false, "nor is Space");
  frames(s, game, out.loops, 10);
  assert.deepEqual(moving(game), before);
  // Hidden, then shown: still paused until চালিয়ে যাও.
  S.hide(s); S.show(s); S.syncLoops(s, game, out.loops);
  frames(s, game, out.loops, 2);
  assert.deepEqual(moving(game), before);
  assert.equal(out.playing.size, 0);
});

test("statechart OffScreenMeansPaused: resumed with the sky scrolled away (the bar's button), the evening still waits until it is back on screen", () => {
  const { s, game, out } = playing();
  S.pointerDown(s, 1, 100, 300);
  frames(s, game, out.loops, 1);
  // The player pauses when the stage scrolls away; you press play on the bar below it while the sky is still off screen.
  S.pause(s); S.setInView(s, false); S.resume(s); S.syncLoops(s, game, out.loops);
  const before = moving(game);
  frames(s, game, out.loops, 5);
  assert.deepEqual(moving(game), before, "nothing runs off screen");
  assert.equal(out.playing.size, 0);
  assert.equal(S.pointerDown(s, 2, 0, 0), false);
  S.setInView(s, true); S.syncLoops(s, game, out.loops);
  frames(s, game, out.loops, 0.5);
  assert.ok(game.total > before[1], "back on screen, back to flying");
});

test("statechart TheClickBackIsNotAMove: the click that brings focus back never pulls or steers", () => {
  const { s, game, out } = playing();
  S.pointerDown(s, 1, 100, 300); frames(s, game, out.loops, 0.5); S.pointerUp(s, 1, 0, 0);
  S.blur(s);
  const aim = [game.aimX, game.aimY];
  assert.equal(S.pointerDown(s, 3, 50, 50), false, "the pointerdown before the focus is ignored");
  S.pointerUp(s, 3, 10, 10);
  S.focus(s);
  assert.deepEqual([game.aimX, game.aimY], aim, "no tap was queued");
  assert.equal(s.tap, false);
  assert.equal(S.pulling(s), false);
});

test("statechart ChoiceFreezesPlay: opening the level list pauses the evening, and picking a level never runs behind it", () => {
  const { s, game, out } = playing();
  S.pointerDown(s, 1, 100, 300); frames(s, game, out.loops, 1);
  S.openSheet(s); S.syncLoops(s, game, out.loops);
  assert.equal(S.ticking(s), false);
  assert.equal(s.pointer, null);
  const before = moving(game);
  frames(s, game, out.loops, 5);
  assert.deepEqual(moving(game), before);
  assert.equal(out.playing.size, 0, "the wind is quiet under the list");
  S.closeSheet(s); S.syncLoops(s, game, out.loops);
  assert.ok(out.playing.has("wind"));
});

test("statechart LoopComesBack and LoopOnlyWhenMeaningful: the wind plays while flying with sound on, the hum only inside a প্যাঁচ", () => {
  const { s, game, out } = playing(1, false);
  S.pointerDown(s, 1, 100, 300);
  frames(s, game, out.loops, 0.3);
  assert.equal(out.playing.size, 0, "silent with sound off");
  S.setSound(s, true); S.syncLoops(s, game, out.loops);
  assert.ok(out.playing.has("wind"), "turning sound on brings the wind back at once");
  assert.equal(out.playing.has("hum"), false, "no hum without a প্যাঁচ");
  for (let i = 0; i < 600 && game.hooked < 0; i++) { steerTo(game, 330, 150); frames(s, game, out.loops, DT); }
  assert.ok(game.hooked >= 0);
  assert.ok(out.playing.has("hum"), "the string hums while hooked");
  S.setSound(s, false);
  assert.equal(s.wind || s.hum, false);
  S.setSound(s, true); S.syncLoops(s, game, out.loops);
  assert.ok(out.playing.has("hum") && out.playing.has("wind"), "both come back");
  S.goTo(s, "over", 10); S.syncLoops(s, game, out.loops);
  assert.equal(out.playing.size, 0, "the card is quiet");
});

test("statechart NoDoubleResult: an evening ends once, and the WIN event fires once", () => {
  const { s, game, out } = playing(1);
  const seen: number[] = [];
  S.pointerDown(s, 1, 100, 300);
  for (let i = 0; i < 60 * 90 && game.phase !== "over"; i++) {
    if (game.hooked < 0) steerTo(game, game.rivals[0].hx > 180 ? 330 : 30, 120);
    s.pointer = game.hooked >= 0 && game.you.t > 0.7 ? null : 1;
    seen.push(...frames(s, game, out.loops, DT));
  }
  assert.equal(game.phase, "over");
  assert.equal(seen.filter(kind => kind === E.WIN).length, 1);
  seen.push(...frames(s, game, out.loops, 3));
  assert.equal(seen.filter(kind => kind === E.WIN || kind === E.FAIL).length, 1, "nothing ends twice");
});

test("result keys need a fresh press: a key held through the last cut, or its repeats, never skip the card", () => {
  const s = S.createSession(true);
  S.goTo(s, "over", 1000);
  assert.equal(S.freshResultKey(s, { timeStamp: 990, repeat: false }), false, "pressed before the card appeared");
  assert.equal(S.freshResultKey(s, { timeStamp: 1200, repeat: true }), false, "an auto-repeat of a held key");
  assert.equal(S.freshResultKey(s, { timeStamp: 1200, repeat: false }), true);
  S.pause(s);
  assert.equal(S.freshResultKey(s, { timeStamp: 1300, repeat: false }), false, "not under the menu");
});

test("input counts only on the play screen with the menu and the list shut; a still tap is a short tug", () => {
  const s = S.createSession(true), game = createGame(4, 1);
  assert.equal(S.pointerDown(s, 1, 0, 0), false, "title");
  assert.equal(S.keyDown(s, "left"), false);
  S.goTo(s, "play");
  assert.equal(S.pointerDown(s, 1, 100, 100), true);
  assert.equal(S.pointerDown(s, 2, 100, 100), false, "one finger at a time");
  S.pointerUp(s, 1, 250, 60);
  assert.equal(s.tap, true);
  assert.equal(S.applyInput(s, game, DT), true, "the tap tugs");
  assert.deepEqual([game.aimX, game.aimY], [250, 60], "towards the spot it touched");
  for (let i = 0; i < 20; i++) S.applyInput(s, game, DT);
  assert.equal(S.applyInput(s, game, DT), false, "and only briefly");
  S.pointerDown(s, 4, 100, 100); S.pointerMove(s, 4, 160, 100, 1.5); S.pointerUp(s, 4, 0, 0);
  assert.equal(s.tap, false, "a slide is not a tap");
});

test("statechart FriendOpensNoGap: clearing a friend's level 9 from level 2 doesn't open 3–8", () => {
  const stars = { 1: 3, 2: 1 }, ahead = nextAhead(stars, [], 9);
  assert.deepEqual(ahead, [9]);
  assert.equal(openLevel({ ...stars, 9: 2 }, ahead), 3);
  assert.equal(openLevel({ 1: 3, 2: 2 }, []), 3, "old saved progress opens what it always did");
  // Once your own play reaches 8 and clears it, 9 is yours and 10 opens.
  assert.equal(openLevel({ 1: 3, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 2 }, ahead), 10);
});

test("celebrations are scheduled tones, never timers that outlive the card", () => {
  const source = readFileSync(new URL("../components/vo-katta.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /setTimeout|setInterval/, "the game schedules nothing with timers");
  assert.match(source, /silenceScheduled\(\)/, "begin() cuts what the last card queued");
  assert.match(source, /player\.requestPause\(\)/, "P opens the player's own menu");
});
