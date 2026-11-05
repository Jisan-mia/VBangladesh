// The statechart's bug paths (ai_docs/statecharts/golokdhadha/), replayed against the pure session, the walker and the choices.
import assert from "node:assert/strict";
import test from "node:test";
import { choiceForKey, endChoices } from "../lib/choices";
import { DIRS, passable } from "../lib/board";
import { createGame, tenthsOf, type Game } from "../lib/game";
import { parOf, starsOf } from "../lib/levels";
import { parseShared, sharedHash } from "../lib/link";
import * as Sess from "../lib/session";
import { stepGame, steer } from "../lib/step.hot";

const DT = 1 / 60;
/** What the component's step() does: nothing unless the session ticks. */
function frames(s: Sess.Session, game: Game, seconds: number) {
  for (let i = 0; i < Math.round(seconds / DT); i++) if (Sess.ticking(s)) stepGame(game, DT);
}
/** Swipes the first open side from home. */
const go = (game: Game) => steer(game, DIRS.find(dir => passable(game.board, game.at, dir, 0))!);
function playing(level = 1) {
  const s = Sess.createSession(), game = createGame({ level, seed: 0, old: false }, "n", false);
  Sess.goTo(s, "play");
  return { s, game };
}

test("statechart NoProgressWhileAway / PausedWhenBlurred: click into another window mid-walk, and the clock and walker freeze", () => {
  const { s, game } = playing(6);
  go(game);
  frames(s, game, 0.3);
  const clock = game.elapsed, at = game.at, progress = game.progress;
  assert.ok(clock > 0);
  Sess.blur(s);
  frames(s, game, 3);
  assert.equal(game.elapsed, clock, "the clock holds while away");
  assert.equal(game.at, at); assert.equal(game.progress, progress);
  // Even before the player's menu opens (a page nobody has touched), the blur alone freezes it; the menu then holds it too.
  Sess.pause(s); Sess.focus(s, 10_000);
  frames(s, game, 2);
  assert.equal(game.elapsed, clock, "the menu holds it after focus comes back");
  Sess.resume(s);
  frames(s, game, 0.1);
  assert.ok(game.elapsed > clock, "চালিয়ে যাও carries on from the same time");
});

test("statechart PausedWhenHidden: a hidden tab freezes the run", () => {
  const { s, game } = playing(3);
  go(game);
  frames(s, game, 0.2);
  const clock = game.elapsed;
  Sess.hide(s);
  frames(s, game, 2);
  assert.equal(game.elapsed, clock);
  Sess.show(s, 5000);
  frames(s, game, 0.1);
  assert.ok(game.elapsed > clock);
});

test("statechart InputReleasedWhenAway / NoSteeringWithoutAPress: the mouse let go in another window never steers on return", () => {
  const { s } = playing();
  assert.equal(Sess.pointerDown(s, 1, 100), "steer");
  assert.equal(s.drag, 1);
  Sess.blur(s);
  assert.equal(s.drag, null, "blur lets go");
  Sess.focus(s, 3000);
  assert.equal(Sess.pointerMoves(s, 1, true, 0), false, "a plain mouse move with no button is not a swipe");
  assert.equal(Sess.pointerMoves(s, 1, true, 1), false, "and the old pointer no longer counts at all");
  // Even with the pointer still recorded, a mouse with no button held never steers.
  assert.equal(Sess.pointerDown(s, 2, 9000), "steer");
  assert.equal(Sess.pointerMoves(s, 2, true, 0), false);
  assert.equal(Sess.pointerMoves(s, 2, true, 1), true);
  assert.equal(Sess.pointerMoves(s, 2, false, 0), true, "a finger has no buttons, and counts");
});

test("statechart ClickBackIsNotAMove: the click that brings the window back only wakes the game", () => {
  const { s } = playing();
  Sess.blur(s);
  Sess.focus(s, 5000);
  assert.equal(Sess.pointerDown(s, 1, 5030), "wake");
  assert.equal(s.drag, null);
  assert.equal(Sess.pointerDown(s, 1, 5400), "steer", "the next press counts");
  // Coming back by keyboard (alt-tab), a swipe seconds later is a real swipe.
  Sess.blur(s); Sess.focus(s, 8000);
  assert.equal(Sess.pointerDown(s, 3, 11_000), "steer");
  // The menu takes the click on চালিয়ে যাও, so nothing is left to wake.
  Sess.blur(s); Sess.pause(s); Sess.focus(s, 20_000); Sess.resume(s);
  assert.equal(Sess.pointerDown(s, 4, 20_050), "steer");
});

test("statechart StarsMatchYourSpeed: ধীরে খেলো turned on mid-run changes nothing until the next run", () => {
  const where = { level: 1, seed: 0, old: false };
  const fast = createGame(where, "n", false);
  assert.equal(fast.speed, 14);
  // The menu's toggle doesn't reach a running game: its speed and par stay what they were at the start.
  const par = parOf(fast.where, fast.mode, fast.slow);
  assert.deepEqual(par, parOf(where, "n", false));
  assert.ok(parOf(where, "n", true).three > par.three);
  // A time at the slow par is graded against the run's own (fast) par.
  const tenths = parOf(where, "n", true).three;
  assert.equal(starsOf(tenths, par, "n"), 2);
  // And a link claiming slow stars for a fast run is refused; one that says w=1 must match the slow par exactly.
  const base = { level: 1, seed: fast.board.seed, tenths, clean: true, name: "", mode: "n" as const, old: false };
  assert.equal(parseShared(sharedHash({ ...base, stars: 3, slow: false })), null);
  assert.ok(parseShared(sharedHash({ ...base, stars: 3, slow: true })));
  assert.equal(createGame(where, "n", true).speed, 7, "the next run walks slowly");
});

test("statechart EnterDoesWhatTheButtonSays: on today's maze, Enter and the marked button both go back to the levels", () => {
  const daily = endChoices({ level: 0, seed: 20261104, old: false }, 5, { 1: 3, 2: 3, 3: 1, 4: 2 }, []);
  assert.equal(daily[0].label, "লেভেলে ফেরো");
  assert.equal(daily[0].kind, "level");
  assert.equal(daily[0].level, 5);
  assert.equal(choiceForKey("Enter"), 0, "Enter runs the marked choice");
  assert.equal(choiceForKey(" "), 0);
  assert.equal(choiceForKey("2"), 1); assert.equal(choiceForKey("r"), 1); assert.equal(choiceForKey("3"), 2); assert.equal(choiceForKey("x"), -1);
  const level = endChoices({ level: 4, seed: 0, old: false }, 5, { 1: 3, 2: 3, 3: 1, 4: 2 }, []);
  assert.deepEqual(level.map(choice => choice.label), ["পরের লেভেল", "আবার খেলো", "সব লেভেল"]);
  assert.equal(endChoices({ level: 30, seed: 0, old: false }, 30, {}, [])[0].kind, "daily");
  // A friend's far level: the next one isn't open, so the first choice is your own next level.
  assert.equal(endChoices({ level: 20, seed: 0, old: false }, 3, { 1: 3, 2: 3, 20: 2 }, [20])[0].level, 3);
});

test("result keys need a fresh press: a key held through the arrival never skips the card", () => {
  const s = Sess.createSession();
  Sess.goTo(s, "over", 1000);
  assert.equal(Sess.freshResultKey(s, { timeStamp: 990, repeat: false }), false, "pressed before the card");
  assert.equal(Sess.freshResultKey(s, { timeStamp: 1200, repeat: true }), false, "auto-repeat of a held key");
  assert.equal(Sess.freshResultKey(s, { timeStamp: 1200, repeat: false }), true);
  Sess.openSheet(s);
  assert.equal(Sess.freshResultKey(s, { timeStamp: 1300, repeat: false }), false, "not while the list is open");
});

test("ChoiceFreezesPlay: the level list stops the walker and the clock", () => {
  const { s, game } = playing(2);
  go(game);
  frames(s, game, 0.1);
  const clock = game.elapsed;
  Sess.openSheet(s);
  assert.equal(Sess.canSteer(s), false);
  frames(s, game, 1);
  assert.equal(game.elapsed, clock);
  Sess.closeSheet(s);
  assert.ok(Sess.ticking(s));
});

test("the clock and the card agree: one rounding for both", () => {
  for (const seconds of [3.64, 3.65, 3.66, 0.04, 12.349]) assert.equal(tenthsOf(seconds), Math.round(seconds * 10));
});
