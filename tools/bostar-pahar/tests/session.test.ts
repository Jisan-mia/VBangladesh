// The statechart's bug paths (ai_docs/statecharts/bostar-pahar/), replayed against the pure session and rules.
import assert from "node:assert/strict";
import test from "node:test";
import { nextAhead, openLevel } from "../lib/levels";
import { createGame, MIN_SWING, type Game } from "../lib/rules";
import * as S from "../lib/session";
import { stepGame, tap } from "../lib/step.hot";

const DT = 1 / 60;
/** What the component's step() does: nothing unless the game ticks, then the rules and the loop. */
function frames(s: S.Session, game: Game, loops: S.Loops, seconds: number) {
  for (let i = 0; i < Math.round(seconds / DT); i++) {
    if (!S.ticking(s)) continue;
    stepGame(game, DT);
    game.events = 0;
    S.syncLoops(s, game, loops);
  }
}
function audio() {
  const playing = new Set<string>();
  return { playing, loops: { start: (kind: string) => { playing.add(kind); }, stop: (kind: string) => { playing.delete(kind); } } as S.Loops };
}
function playing(level = 1, sound = true) {
  const s = S.createSession(sound), game = createGame(48213, "level", level), out = audio();
  S.goTo(s, "play");
  S.syncLoops(s, game, out.loops);
  return { s, game, out };
}
/** A keydown as the component forwards it: drops only when the session says so. */
function key(s: S.Session, game: Game, at: number, repeat = false) { return S.keyDown(s, { repeat, timeStamp: at }) && tap(game); }

test("statechart EveryDropIsATap: holding Space drops one sack, never more on the browser's auto-repeat", () => {
  const { s, game, out } = playing();
  frames(s, game, out.loops, MIN_SWING + 0.1);
  assert.equal(key(s, game, 1000), true, "the press drops");
  let drops = 1, now = 1000;
  // Chrome repeats a held key every ~33 ms; five seconds of it.
  for (let i = 0; i < 150; i++) {
    now += 33;
    frames(s, game, out.loops, 0.033);
    if (key(s, game, now, true)) drops++;
  }
  assert.equal(drops, 1, "no sack dropped on a repeat");
  assert.ok(game.n <= 2, "only the pressed sack landed");
  S.keyUp(s);
  frames(s, game, out.loops, 1);
  assert.equal(key(s, game, now + 1500), true, "a fresh press works again");
});

test("statechart EveryDropIsATap: a keydown that isn't flagged repeat but arrives while the key is still held does nothing", () => {
  const { s, game, out } = playing();
  frames(s, game, out.loops, 0.5);
  assert.equal(key(s, game, 500), true);
  frames(s, game, out.loops, 1);
  assert.equal(key(s, game, 1600), false);
});

test("statechart NoTapPastResult: a press as the pile falls, or held through it, never skips the end screen", () => {
  const s = S.createSession(true);
  S.goTo(s, "over", 5000);
  assert.equal(S.freshResultKey(s, { timeStamp: 5150, repeat: false }), false, "150 ms after: ignored");
  assert.equal(S.freshResultKey(s, { timeStamp: 6000, repeat: true }), false, "a held key's repeat: ignored");
  assert.equal(S.freshResultKey(s, { timeStamp: 6000, repeat: false }), true, "a fresh press later: accepted");
  S.pause(s);
  assert.equal(S.freshResultKey(s, { timeStamp: 7000, repeat: false }), false, "nothing while the menu is open");
});

test("statechart PausedWhenBlurred: a sack in the air waits while you're in another window, and the run isn't over when you return", () => {
  const { s, game, out } = playing();
  frames(s, game, out.loops, 0.5);
  key(s, game, 500);
  assert.equal(game.phase, "drop");
  S.blur(s); S.pause(s); S.syncLoops(s, game, out.loops);
  frames(s, game, out.loops, 5);
  assert.equal(game.phase, "drop", "frozen mid-air");
  assert.equal(s.held, false, "the key no longer counts as held");
  S.focus(s); S.resume(s, 10_000);
  frames(s, game, out.loops, 1);
  assert.notEqual(game.phase, "over");
  // Without the menu (never touched the page): the blur alone still stops the game.
  const other = playing();
  frames(other.s, other.game, other.out.loops, 0.4);
  const t = other.game.t;
  S.blur(other.s);
  frames(other.s, other.game, other.out.loops, 3);
  assert.equal(other.game.t, t);
});

test("statechart PausedWhenHidden: hiding the tab stops the swing and lets go of the key", () => {
  const { s, game, out } = playing();
  frames(s, game, out.loops, 0.4);
  S.keyDown(s, { repeat: false, timeStamp: 400 });
  const t = game.t;
  S.hide(s);
  frames(s, game, out.loops, 3);
  assert.equal(game.t, t);
  assert.equal(s.held, false);
  S.show(s);
  frames(s, game, out.loops, 0.1);
  assert.ok(game.t > t);
});

test("statechart FocusClickIsNotADrop: the tap that brings you back from the menu only wakes the game", () => {
  const { s, game, out } = playing();
  frames(s, game, out.loops, 0.5);
  S.pause(s);
  S.resume(s, 2000);
  assert.equal(S.canDrop(s, 2000 + S.RESUME_GUARD - 1), false);
  assert.equal(S.canDrop(s, 2000 + S.RESUME_GUARD), true);
  assert.equal(game.phase, "ready");
});

test("statechart LoopOnlyWhenMeaningful and LoopComesBack: the wind blows on gusty levels only while you play with sound on", () => {
  const { s, game, out } = playing(6, false);
  frames(s, game, out.loops, 0.5);
  key(s, game, 500);
  frames(s, game, out.loops, 1);
  assert.equal(out.playing.size, 0, "muted: no wind");
  S.setSound(s, true); S.syncLoops(s, game, out.loops);
  assert.ok(out.playing.has("wind"), "sound on brings the wind back");
  S.pause(s); S.syncLoops(s, game, out.loops);
  assert.equal(out.playing.size, 0, "paused: quiet");
  S.resume(s, 9000); S.syncLoops(s, game, out.loops);
  assert.ok(out.playing.has("wind"), "resume brings it back");
  S.goTo(s, "over"); S.syncLoops(s, game, out.loops);
  assert.equal(out.playing.size, 0, "the end screen is quiet");
  const calm = playing(2);
  frames(calm.s, calm.game, calm.out.loops, 0.5);
  key(calm.s, calm.game, 500);
  frames(calm.s, calm.game, calm.out.loops, 1);
  assert.equal(calm.out.playing.size, 0, "no wind on a calm level");
});

test("statechart FriendOpensNoGap: clearing a friend's level 9 from level 2 keeps its stars but opens nothing in between", () => {
  const stars = { 1: 3, 2: 1 };
  const ahead = nextAhead(stars, [], 9);
  const after = { ...stars, 9: 2 };
  assert.equal(openLevel(after, ahead), 3);
  // Once your own play reaches 8 and clears it, 9 counts as yours and 10 opens.
  const own = { ...after, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1 };
  assert.equal(openLevel(own, nextAhead(after, ahead, 8)), 10);
});
