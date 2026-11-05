// The statechart's bug paths (ai_docs/statecharts/antenna-thik-koro/), replayed against the pure session and rules.
import assert from "node:assert/strict";
import test from "node:test";
import { createGame, nextAhead, openLevel, type Game } from "../lib/antenna";
import * as S from "../lib/session";
import { stepGame } from "../lib/step.hot";

const DT = 1 / 60;
/** What the component's step() does: nothing unless the game ticks, then the hold, the rules and the loops. */
function frames(s: S.Session, game: Game, loops: S.Loops, seconds: number) {
  for (let i = 0; i < Math.round(seconds / DT); i++) {
    if (!S.ticking(s)) continue;
    S.holdStep(s, DT, false);
    stepGame(game, S.takeTurn(s), DT);
    S.syncLoops(s, game, loops);
  }
}
function audio() {
  const playing = new Set<string>(), log: string[] = [];
  return { playing, log, loops: { start: (kind: string) => { playing.add(kind); log.push(`start ${kind}`); }, stop: (kind: string) => { playing.delete(kind); log.push(`stop ${kind}`); } } as S.Loops };
}
function playing(sound = true) {
  const s = S.createSession(sound), game = createGame(48213, 1), out = audio();
  S.goTo(s, "play");
  S.syncLoops(s, game, out.loops);
  return { s, game, out };
}

test("statechart DialStillWhileAway: hold →, click into another window, and the dial stays where you left it", () => {
  const { s, game, out } = playing();
  assert.ok(S.press(s, 1, 2));
  frames(s, game, out.loops, 1);
  const at = game.dial;
  assert.ok(at > 30, "holding turned it");
  // The window blurs (the keyup never comes), and the player opens its menu.
  S.blur(s); S.pause(s); S.syncLoops(s, game, out.loops);
  assert.equal(s.hold, 0);
  frames(s, game, out.loops, 3);
  assert.equal(game.dial, at, "no turning while away");
  // Back, and চালিয়ে যাও: the hand is still off, so the dial still doesn't move.
  S.focus(s); S.resume(s); S.syncLoops(s, game, out.loops);
  frames(s, game, out.loops, 2);
  assert.equal(game.dial, at);
  assert.equal(S.press(s, 1, 2), true, "a fresh press works again");
});

test("statechart DialStillWhileAway: even without the menu (before you've touched the page), a blur lets go and freezes the game", () => {
  const { s, game, out } = playing();
  S.press(s, -1, 2);
  S.blur(s); S.syncLoops(s, game, out.loops);
  const at = game.dial, clock = game.time;
  frames(s, game, out.loops, 2);
  assert.equal(game.dial, at);
  assert.equal(game.time, clock, "no clock, no spawns while away");
  assert.equal(S.press(s, 1, 2), false, "keys while away are ignored");
  assert.equal(out.playing.has("hiss"), false, "the static stops while away");
});

test("statechart StaticWhileSearching: sound off, start, sound on, and the static comes back", () => {
  const { s, game, out } = playing(false);
  S.press(s, 1, 2);
  frames(s, game, out.loops, 0.5);
  assert.equal(game.phase, "search");
  assert.equal(out.playing.has("hiss"), false, "silent with sound off");
  S.setSound(s, true); S.syncLoops(s, game, out.loops);
  assert.equal(out.playing.has("hiss"), true, "back at once");
  assert.ok(S.wantHiss(s, game));
});

test("statechart LoopComesBack: the static stops in the menu and comes back on চালিয়ে যাও, and is never on a locked picture or the card", () => {
  const { s, game, out } = playing();
  assert.equal(out.playing.has("hiss"), true, "the snow hisses before the first turn");
  S.blur(s); S.pause(s); S.syncLoops(s, game, out.loops);
  assert.equal(out.playing.has("hiss"), false);
  S.setSound(s, false); S.setSound(s, true); S.syncLoops(s, game, out.loops);
  assert.equal(out.playing.has("hiss"), false, "turning sound on in the menu starts nothing yet");
  S.focus(s); S.resume(s); S.syncLoops(s, game, out.loops);
  assert.equal(out.playing.has("hiss"), true);
  // Lock the first channel.
  s.pending += ((game.rounds[0].sweet - game.angle + 540) % 360) - 180;
  frames(s, game, out.loops, 0.6);
  assert.equal(game.phase, "got");
  assert.equal(out.playing.has("hiss"), false, "quiet on a locked picture");
  S.goTo(s, "over", 10); S.syncLoops(s, game, out.loops);
  assert.equal(out.playing.has("hiss"), false);
});

test("statechart HiddenMeansPaused: hiding the tab lets go and stops the game, the static and the wind", () => {
  const s = S.createSession(true), game = createGame(5, 5), out = audio();
  S.goTo(s, "play"); S.syncLoops(s, game, out.loops);
  assert.deepEqual([...out.playing].sort(), ["hiss", "wind"]);
  S.press(s, 1, 2);
  S.hide(s); S.pause(s); S.syncLoops(s, game, out.loops);
  assert.equal(out.playing.size, 0);
  assert.equal(S.ticking(s), false);
  S.show(s); S.syncLoops(s, game, out.loops);
  assert.equal(out.playing.size, 0, "still paused until চালিয়ে যাও");
  S.resume(s); S.syncLoops(s, game, out.loops);
  assert.deepEqual([...out.playing].sort(), ["hiss", "wind"]);
});

test("result keys need a fresh press: a key held through the last lock, or its repeats, never skip the card", () => {
  const s = S.createSession(true);
  S.goTo(s, "over", 1000);
  assert.equal(S.freshResultKey(s, { timeStamp: 990, repeat: false }), false, "pressed before the card appeared");
  assert.equal(S.freshResultKey(s, { timeStamp: 1200, repeat: true }), false, "an auto-repeat of a held key");
  assert.equal(S.freshResultKey(s, { timeStamp: 1200, repeat: false }), true);
  S.pause(s);
  assert.equal(S.freshResultKey(s, { timeStamp: 1300, repeat: false }), false, "not under the menu");
});

test("input counts only on the play screen with the menu shut", () => {
  const s = S.createSession(true);
  assert.equal(S.press(s, 1, 2), false, "title");
  S.goTo(s, "play");
  S.pause(s);
  assert.equal(S.press(s, 1, 2), false, "menu open");
  S.nudge(s, 30);
  assert.equal(s.pending, 0);
  S.resume(s);
  assert.equal(S.press(s, 1, 2), true);
  S.release(s, -1);
  assert.equal(s.hold, 1, "letting go of the other key keeps this one");
  S.release(s, 1);
  assert.equal(s.hold, 0);
});

test("statechart FriendOpensNoGap: clearing a friend's level 9 from level 2 doesn't open 3–8", () => {
  const stars = { 1: 3, 2: 1 }, ahead = nextAhead(stars, [], 9);
  assert.equal(openLevel({ ...stars, 9: 2 }, ahead), 3);
});
