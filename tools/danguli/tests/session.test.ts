// The statechart's bug paths (ai_docs/statecharts/danguli/), replayed against the pure session and round.
// `page()` does what components/game.tsx does: the loop steps the round only when S.step says so, play keys pass through
// S.keyDown, result keys through S.freshResultKey, coming back wakes the round with a breath, and the wind follows syncLoops.
import assert from "node:assert/strict";
import test from "node:test";
import { seedFor, type Shared } from "../lib/challenge";
import { createRound, popTimeAt, press, AIM, DONE, K_FALL, POP, REST, SWEET, type Round } from "../lib/round";
import * as S from "../lib/session";
import { advance } from "../lib/step.hot";

function page(level = 1, { sound = true, focused = true } = {}) {
  const s = S.createSession(sound, focused);
  let wind = 0;
  const loops: S.Loops = { start: () => { wind++; }, stop: () => { wind = Math.max(0, wind - 1); } };
  const p = {
    s, r: createRound(4242, level) as Round, loopMounted: true,
    get wind() { return wind; },
    sync() { S.syncLoops(s, loops); },
    start() { p.r = createRound(4242, level); S.goTo(s, "play", 0, p.r.def.wind > 0); p.sync(); },
    /** `count` frames of the loop (useGameLoop calls step once a frame while mounted). */
    frames(count: number) { for (let i = 0; i < count; i++) { if (p.loopMounted && S.step(s) && p.r.phase !== DONE) advance(p.r); p.sync(); } },
    /** A tap: a finger on the board, or a fresh key (the component's tap()). */
    tap() { return S.canTap(s) ? press(p.r) : 0; },
    key(repeat = false) { return S.keyDown(s, repeat) ? press(p.r) : 0; },
    blur() { S.blur(s); p.sync(); }, focus() { S.focus(s); S.wake(s); p.sync(); },
    hide() { S.hide(s); p.sync(); }, show() { S.show(s); S.wake(s); p.sync(); },
    /** The site-wide switch: turning it off stops every loop in the kit, so the mock's wind goes silent with it. */
    sound(on: boolean) { if (!on) wind = 0; S.setSound(s, on); p.sync(); },
    pause() { S.pause(s); p.sync(); }, resume() { S.resume(s); S.wake(s); p.sync(); },
  };
  return p;
}

test("statechart PausedWhenBlurred (bug 1): a glance at another window with the কাঠি up never lands it as a miss", () => {
  const p = page(1);
  p.start();
  assert.equal(p.tap(), 1, "the flick");
  p.frames(20);
  assert.equal(p.r.phase, POP);
  const t = p.r.t;
  p.blur();
  assert.equal(S.ticking(p.s), false);
  p.frames(150);
  assert.equal(p.r.t, t, "the কাঠি hangs while you're away");
  assert.equal(p.r.kinds[0], -1, "no ফসকে recorded");
  p.focus();
  assert.equal(p.tap(), 0, "the click that brings the window back is not a swing");
  p.frames(S.BREATH);
  assert.equal(p.r.t, t, "a breath before it falls again");
  // Then it falls, and you can still meet it in the band.
  while (p.r.t + 1 / 60 <= popTimeAt(p.r, SWEET)) p.frames(1);
  assert.equal(p.tap(), 2, "a strike, not a miss");
});

test("statechart HeldKeyActsOnce (bug 2): holding Space flicks once and never swings by itself", () => {
  const p = page(1);
  p.start();
  assert.equal(p.key(), 1, "the press flicks");
  for (let i = 0; i < 120; i++) { p.frames(2); assert.equal(p.key(true), 0, "an auto-repeat does nothing"); }
  assert.notEqual(p.r.kinds[0], -1);
  assert.equal(p.r.kinds[0], K_FALL, "the কাঠি landed untouched: no swing came from the held key");
  S.keyUp(p.s);
  for (let i = 0; i < 200 && p.r.phase !== AIM; i++) p.frames(1);
  assert.equal(p.key(), 1, "a fresh press after letting go flicks the next");
});

test("statechart ResultStaysUntilYouChoose (bug 3): a key held through the last hit never skips the result", () => {
  const s = S.createSession(true);
  S.goTo(s, "over", 1000);
  assert.equal(S.freshResultKey(s, { timeStamp: 1200, repeat: true }), false, "the held key's auto-repeat");
  assert.equal(S.freshResultKey(s, { timeStamp: 990, repeat: false }), false, "pressed before the screen appeared");
  assert.equal(S.freshResultKey(s, { timeStamp: 1200, repeat: false }), true, "a fresh press after it works");
  S.pause(s);
  assert.equal(S.freshResultKey(s, { timeStamp: 1300, repeat: false }), false, "not under the menu");
  // Ten seconds of a held key over a whole round: one flick, and the round still ends on the result, never past it.
  const p = page(1);
  p.start();
  p.key();
  let skipped = 0;
  for (let i = 0; i < 600 * 2 && p.r.phase !== DONE; i++) { p.frames(1); p.key(true); }
  if (p.r.phase === DONE) { S.goTo(p.s, "over", 50); for (let i = 0; i < 60; i++) if (S.freshResultKey(p.s, { timeStamp: 60 + i, repeat: true })) skipped++; }
  assert.equal(skipped, 0);
});

test("statechart ReplayIsExact (bug 4): the friend's own level from the list keeps the friend's field", () => {
  const friend: Shared = { level: 3, seed: 12345, total: 30, hits: ["10", "12", "8"], name: "রাফি", mode: "n", old: 0 };
  assert.equal(seedFor(friend, 3, "n", 999), 12345, "their level, their field");
  assert.equal(seedFor(friend, 4, "n", 999), 999, "another level is a fresh field");
  assert.equal(seedFor(friend, 3, "h", 999), 999, "another mode is a fresh field");
  assert.equal(seedFor(null, 3, "n", 999), 999);
});

test("statechart NoProgressWhileAway: a loop mounted while another window has focus never steps the round", () => {
  const p = page(1, { focused: false });
  p.start(); p.tap();
  assert.equal(p.r.phase, AIM, "a tap on a window without focus is not a flick");
  p.loopMounted = false; p.frames(10); p.loopMounted = true;
  p.frames(180);
  assert.equal(p.r.clock, 0);
});

test("statechart ChoiceFreezesPlay: the level list and the player's menu stop the round, and a breath follows", () => {
  const p = page(1);
  p.start(); p.tap(); p.frames(10);
  const t = p.r.t;
  S.openSheet(p.s); p.sync(); p.frames(120);
  assert.equal(p.r.t, t);
  S.closeSheet(p.s); S.wake(p.s); p.frames(S.BREATH);
  assert.equal(p.r.t, t, "a breath after the list too");
  p.pause(); p.frames(120);
  assert.equal(p.r.t, t);
  assert.equal(p.tap(), 0, "no tap under the menu");
});

test("statechart LoopOnlyWhenMeaningful and LoopComesBack: the চর's wind blows only while the round runs in front of you", () => {
  const p = page(5);
  p.start(); p.frames(5);
  assert.equal(p.wind, 1);
  p.blur(); assert.equal(p.wind, 0, "stops on blur");
  p.focus(); assert.equal(p.wind, 1, "a fresh one on return");
  p.pause(); assert.equal(p.wind, 0);
  p.resume(); assert.equal(p.wind, 1);
  p.sound(false);
  assert.equal(p.s.wind, false, "muting counts the kit's stopped loop as stopped");
  assert.equal(p.wind, 0);
  p.sound(true);
  assert.equal(p.wind, 1, "sound back on starts a fresh one, never a stub");
  S.goTo(p.s, "over", 9); p.sync();
  assert.equal(p.s.wind, false, "and it stops on the result");
  const calm = page(1);
  calm.start(); calm.frames(10);
  assert.equal(calm.wind, 0, "no wind on the পাড়ার মাঠ");
});

test("statechart NoDoubleResult: a round ends once, and nothing steps after it", () => {
  const p = page(1);
  p.start();
  let dones = 0;
  for (let i = 0; i < 60 * 60 && p.r.phase !== DONE; i++) {
    if (p.r.phase === AIM || p.r.phase === REST) p.tap();
    p.frames(1);
    for (let e = 0; e < p.r.evN; e++) if (p.r.evType[e] === 11) dones++;
    p.r.evN = 0;
  }
  assert.equal(p.r.phase, DONE);
  const clock = p.r.clock;
  p.frames(120);
  assert.equal(p.r.clock, clock);
  assert.equal(dones, 1);
  assert.notEqual(p.r.phase, REST);
});
