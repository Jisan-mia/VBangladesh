// The statechart's bug paths (ai_docs/statecharts/al-dhore-hati/), replayed against the pure session, the walk and the link rules.
import assert from "node:assert/strict";
import test from "node:test";
import { centreAt } from "../lib/field";
import { LEVELS, LEVEL_COUNT, showsIntro, type Run } from "../lib/levels";
import { rivalFits, retrySeed, parseCard, type Card } from "../lib/link";
import { createGame, PH_WALK, start, type Game } from "../lib/rules";
import * as S from "../lib/session";
import { stepGame } from "../lib/step.hot";

const DT = 1 / 60;
const run = (level: number, seed = 4242): Run => ({ seed, kind: "level", level, mode: "n" });
/** What the component's step() does: nothing unless the session ticks, then the rules and the loop. */
function frames(s: S.Session, game: Game, loops: S.Loops, seconds: number) {
  for (let i = 0; i < Math.round(seconds / DT); i++) {
    const hold = S.holdOf(s);
    game.dir = hold.dir;
    if (!hold.dragging) game.dragging = false;
    if (!S.ticking(s)) continue;
    stepGame(game, DT, 1);
    game.events = 0;
    S.syncLoops(s, game, loops);
  }
}
function audio() {
  const playing = { count: 0, started: 0 };
  return { playing, loops: { start: () => { playing.count++; playing.started++; }, stop: () => { playing.count = Math.max(0, playing.count - 1); } } as S.Loops };
}
function playing(level = 1, sound = true) {
  const s = S.createSession(sound), game = createGame(run(level)), out = audio();
  start(game);
  S.goTo(s, "play");
  S.syncLoops(s, game, out.loops);
  return { s, game, out };
}

test("statechart InputReleasedWhenAway: hold ←, click into another window, come back: nothing walks into the mud", () => {
  const { s, game, out } = playing();
  S.keyDown(s, "ArrowLeft");
  frames(s, game, out.loops, 0.2);
  assert.equal(game.dir, -1);
  S.blur(s);
  frames(s, game, out.loops, 3);
  assert.equal(s.left, false);
  assert.equal(game.dir, 0, "the held side is let go with the blur");
  S.focus(s, 10_000);
  const x = game.x;
  frames(s, game, out.loops, 1);
  assert.equal(game.dir, 0, "nothing steers after you come back");
  assert.ok(Math.abs(game.x - x) < 15, "the feet drift only with the field, not off on their own");
  assert.equal(game.slips, 0);
  // the same for a finger and for a hidden tab
  assert.equal(S.press(s, 1, 1, 100, 20_000), true);
  S.hide(s);
  assert.equal(S.holdOf(s).dir, 0);
  assert.equal(s.presses.size, 0);
});

test("statechart PausedWhenBlurred: the walk waits while you're in another window", () => {
  const { s, game, out } = playing();
  frames(s, game, out.loops, 0.5);
  const d = game.d, clock = game.clock;
  S.blur(s);
  frames(s, game, out.loops, 5);
  assert.equal(game.d, d);
  assert.equal(game.clock, clock);
  S.focus(s, 9000);
  frames(s, game, out.loops, 0.3);
  assert.ok(game.d > d);
});

test("statechart PausedWhenHidden: hiding the tab stops the walk and lets go of everything", () => {
  const { s, game, out } = playing();
  S.keyDown(s, "d");
  const d = game.d;
  S.hide(s);
  frames(s, game, out.loops, 3);
  assert.equal(game.d, d);
  assert.equal(s.right, false);
  S.show(s, 5000);
  frames(s, game, out.loops, 0.2);
  assert.ok(game.d > d);
});

test("statechart LoopOnlyWhenMeaningful: the wind blows on a windy field only while you walk on a focused page with sound on", () => {
  const { s, game, out } = playing(11);
  frames(s, game, out.loops, 0.5);
  assert.equal(out.playing.count, 1, "walking on a windy field: wind");
  S.blur(s); S.syncLoops(s, game, out.loops);
  assert.equal(out.playing.count, 0, "another window: quiet");
  S.focus(s, 4000); S.syncLoops(s, game, out.loops);
  assert.equal(out.playing.count, 1, "back: wind");
  S.hide(s); S.syncLoops(s, game, out.loops);
  assert.equal(out.playing.count, 0, "hidden tab: quiet");
  S.show(s, 5000);
  S.pause(s); S.syncLoops(s, game, out.loops);
  assert.equal(out.playing.count, 0, "menu open: quiet");
  S.resume(s, 6000); S.syncLoops(s, game, out.loops);
  assert.equal(out.playing.count, 1);
  S.openSheet(s); S.syncLoops(s, game, out.loops);
  assert.equal(out.playing.count, 0, "the level list: quiet");
  S.closeSheet(s, 7000);
  S.goTo(s, "over"); S.syncLoops(s, game, out.loops);
  assert.equal(out.playing.count, 0, "the end screen: quiet");
  const calm = playing(2);
  frames(calm.s, calm.game, calm.out.loops, 0.5);
  assert.equal(calm.out.playing.started, 0, "no wind on a calm field");
  const gusty = playing(12);
  frames(gusty.s, gusty.game, gusty.out.loops, 0.2);
  assert.equal(gusty.out.playing.count, 1, "gusts count as wind");
});

test("statechart LoopComesBack: turning sound off and on again brings a real wind back (never a silent stub)", () => {
  const { s, game, out } = playing(11, false);
  frames(s, game, out.loops, 0.5);
  assert.equal(out.playing.started, 0, "muted: nothing starts");
  S.setSound(s, true); S.syncLoops(s, game, out.loops);
  assert.equal(out.playing.started, 1, "sound on: the wind starts now, as a real loop");
  S.setSound(s, false);
  assert.equal(s.wind, false);
  S.syncLoops(s, game, out.loops);
  S.setSound(s, true); S.syncLoops(s, game, out.loops);
  assert.equal(out.playing.started, 2, "and again each time it comes back");
});

test("statechart FocusClickIsNotAMove: the press that brings you back only wakes the game", () => {
  const { s } = playing();
  S.pause(s);
  S.resume(s, 2000);
  assert.equal(S.press(s, 1, 1, 100, 2000 + S.RESUME_GUARD - 1), false);
  assert.equal(s.presses.size, 0);
  assert.equal(S.press(s, 1, 1, 100, 2000 + S.RESUME_GUARD), true);
  S.release(s, 1);
  S.blur(s); S.focus(s, 9000);
  assert.equal(S.press(s, 2, -1, 50, 9100), false, "the click that refocuses the window");
  const sheet = playing();
  S.openSheet(sheet.s); S.closeSheet(sheet.s, 3000);
  assert.equal(S.press(sheet.s, 1, 1, 10, 3100), false);
});

test("statechart ChoiceFreezesPlay: the level list and the player's menu stop the walk; keys do nothing under them", () => {
  const { s, game, out } = playing();
  frames(s, game, out.loops, 0.3);
  S.openSheet(s);
  const d = game.d;
  frames(s, game, out.loops, 2);
  assert.equal(game.d, d);
  assert.equal(S.keyDown(s, "ArrowLeft"), true, "the key is recognised but does not count");
  assert.equal(s.left, false);
  assert.equal(S.press(s, 1, 1, 10, 99_999), false);
  S.closeSheet(s, 100);
  S.pause(s);
  frames(s, game, out.loops, 2);
  assert.equal(game.d, d);
});

test("statechart ResultKeyNeedsAFreshPress: a key held through the end, or pressed as it ended, never skips the result or the ready card", () => {
  const s = S.createSession(true);
  S.goTo(s, "over", 5000);
  assert.equal(S.freshKey(s, "over", { timeStamp: 5150, repeat: false }), false, "150 ms after: ignored");
  assert.equal(S.freshKey(s, "over", { timeStamp: 6000, repeat: true }), false, "auto-repeat: ignored");
  assert.equal(S.freshKey(s, "over", { timeStamp: 6000, repeat: false }), true);
  S.pause(s);
  assert.equal(S.freshKey(s, "over", { timeStamp: 7000, repeat: false }), false, "nothing while the menu is open");
  const r = S.createSession(true);
  S.goTo(r, "ready", 100);
  assert.equal(S.freshKey(r, "ready", { timeStamp: 300, repeat: false }), false);
  assert.equal(S.freshKey(r, "ready", { timeStamp: 900, repeat: false }), true);
  assert.equal(S.freshKey(r, "over", { timeStamp: 900, repeat: false }), false, "only on its own screen");
});

test("statechart ReplayIsExact: a friend's field keeps its seed on both the won card's and the fell card's retry; anything else gets a fresh seed", () => {
  const friend: Card = { seed: 4242, level: 4, slips: 0, dry: 42, name: "রাফি", kind: "level", mode: "n" };
  const mine = run(4, 4242);
  assert.equal(rivalFits(friend, mine), true);
  assert.equal(retrySeed(friend, mine, 777), 4242, "আবার খেলো after a win");
  assert.equal(retrySeed(friend, mine, 888), 4242, "and after a fall");
  assert.equal(retrySeed(friend, run(4, 9999), 777), 777, "a field of your own gets a new seed");
  assert.equal(retrySeed(friend, run(5, 4242), 777), 777, "another level does not");
  assert.equal(retrySeed(friend, { ...mine, mode: "h" }, 777), 777, "another mode does not");
  assert.equal(retrySeed(null, mine, 777), 777);
  // the same field really is the same field
  const a = createGame(mine), b = createGame(run(4, retrySeed(friend, mine, 1)));
  assert.deepEqual(a.field.obstacles, b.field.obstacles);
  assert.deepEqual(parseCard("s=4242&t=0&m=42&l=4&v=2")?.seed, 4242);
});

test("statechart IntroForEveryNewLevel: reaching an unseen level by পরের লেভেল or the list shows its card, a seen one goes straight in", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    assert.equal(showsIntro(level, []), true, `level ${level} has an intro to show`);
    assert.equal(showsIntro(level, [level]), false);
    assert.ok(LEVELS[level - 1].teach.length > 0);
  }
  assert.equal(showsIntro(5, [1, 2, 3, 4]), true);
  assert.equal(showsIntro(0, []), false);
  assert.equal(showsIntro(21, []), false);
  // and the walk never starts on its own while the card is up: a new game stays READY
  const g = createGame(run(7));
  stepGame(g, DT, 1);
  assert.equal(g.d, 0);
  assert.notEqual(g.phase, PH_WALK);
});

test("sessions: only the play screen ticks; a held key with the menu open is not held when it closes", () => {
  const s = S.createSession(true);
  assert.equal(S.ticking(s), false);
  for (const screen of ["title", "intro", "ready", "over"] as const) { S.goTo(s, screen); assert.equal(S.ticking(s), false, screen); }
  S.goTo(s, "play");
  assert.equal(S.ticking(s), true);
  S.keyDown(s, "a"); S.keyDown(s, "d");
  assert.equal(S.holdOf(s).dir, 0, "← and → together cancel");
  S.pause(s);
  assert.equal(s.left || s.right, false);
  assert.equal(S.holdOf(s).dir, 0);
  S.resume(s, 100);
  // a finger drags, another holds a side: the drag steers alone
  S.press(s, 1, 1, 100, 1000); S.press(s, 2, -1, 50, 1000);
  assert.deepEqual(S.holdOf(s), { dir: 0, dragging: false }, "two sides cancel");
  assert.equal(S.move(s, 1, 104), null, "under 8 px is not a drag yet");
  assert.equal(S.move(s, 1, 130), 30);
  assert.deepEqual(S.holdOf(s), { dir: 0, dragging: true });
  S.release(s, 1);
  assert.deepEqual(S.holdOf(s), { dir: -1, dragging: false });
  assert.ok(centreAt(createGame(run(1)).field, 0) === 180);
});
