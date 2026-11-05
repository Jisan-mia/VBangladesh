// The statechart's bug paths (ai_docs/statecharts/latim/), replayed against the pure session and top.
// `page()` does what components/game.tsx does: the loop steps the top only when S.step says so, play keys pass through
// S.keyDown, a hand lets go when the round stops stepping, result keys pass through S.freshResultKey, coming back wakes the
// round with a breath, and the hum and wind follow syncLoops.
import assert from "node:assert/strict";
import test from "node:test";
import { seedFor } from "../lib/challenge";
import { afterClear, playable } from "../lib/progress";
import * as S from "../lib/session";
import { advance } from "../lib/step.hot";
import {
  beginWind, canLift, createTop, endWind, lift, nudge, releaseInput, throwTop,
  DT, E_FALL, E_PALM, E_THROW, P_DONE, P_FALL, P_READY, P_SPIN, type Top,
} from "../lib/top";

function page(level = 1, { sound = true, focused = true } = {}) {
  const s = S.createSession(sound, focused);
  const count = { hum: 0, wind: 0 };
  const loops: S.Loops = {
    startHum: () => { count.hum++; }, stopHum: () => { count.hum = Math.max(0, count.hum - 1); },
    startWind: () => { count.wind++; }, stopWind: () => { count.wind = Math.max(0, count.wind - 1); },
  };
  const p = {
    s, t: createTop(4242, level) as Top, count, loopMounted: true, nudged: 0, lifted: 0,
    sync() { S.syncLoops(s, loops); },
    /** handleEvents(): the throw starts the hum, the fall and the palm end it. */
    events() {
      for (let e = 0; e < p.t.evN; e++) {
        const type = p.t.evType[e];
        if (type === E_THROW) S.setSpinning(s, true);
        else if (type === E_FALL || type === E_PALM) S.setSpinning(s, false);
      }
      p.t.evN = 0;
      p.sync();
    },
    start() { p.t = createTop(4242, level); S.goTo(s, "play", 0, p.t.def.wind > 0); p.sync(); },
    /** `count` frames of the loop (useGameLoop calls step once a frame while mounted). */
    frames(n: number) { for (let i = 0; i < n; i++) { if (p.loopMounted && S.step(s) && p.t.phase !== P_DONE) advance(p.t, DT); p.events(); } },
    /** A key or the pad: wind in the hand, nudge while it spins. */
    key(repeat = false) {
      if (!S.keyDown(s, repeat)) return false;
      if (p.t.phase === P_READY) beginWind(p.t); else if (p.t.phase === P_SPIN && nudge(p.t) >= 0) p.nudged++;
      p.events();
      return true;
    },
    keyUp() { S.keyUp(s); if (S.ticking(s)) { endWind(p.t); p.events(); } },
    /** A finger on the stage or pad (the component's tapNudge / tryLift). */
    tap() { if (!S.canTap(s)) return -1; const r = nudge(p.t); p.events(); return r; },
    lift() { if (!S.canTap(s)) return -1; const r = lift(p.t); p.events(); return r; },
    away(change: () => void) { change(); if (!S.ticking(s)) releaseInput(p.t); p.sync(); },
    blur() { p.away(() => S.blur(s)); }, focus() { S.focus(s); S.wake(s); p.sync(); },
    hide() { p.away(() => S.hide(s)); }, show() { S.show(s); S.wake(s); p.sync(); },
    pause() { p.away(() => S.pause(s)); }, resume() { S.resume(s); S.wake(s); p.sync(); },
    openList() { p.away(() => S.openSheet(s)); }, closeList() { S.closeSheet(s); S.wake(s); p.sync(); },
    sound(on: boolean) { if (!on) { count.hum = 0; count.wind = 0; } S.setSound(s, on); p.sync(); },
    throwIt() { throwTop(p.t, 0.9, 0.9); p.events(); },
  };
  return p;
}

test("statechart InputReleasedWhenAway (bug 1): a hold survives a blur no longer, and nothing is thrown by itself", () => {
  const p = page(1);
  p.start();
  assert.equal(p.key(), true, "Space down winds");
  p.frames(24);
  assert.equal(p.t.winding, true);
  assert.ok(p.t.held > 0.3);
  p.blur();
  assert.equal(p.t.winding, false, "the hold is dropped");
  assert.equal(p.t.held, 0);
  p.frames(120);
  assert.equal(p.t.held, 0, "no winding while away");
  p.focus();
  p.frames(S.BREATH + 120);
  assert.equal(p.t.held, 0, "hands off: it does not wind by itself");
  assert.equal(p.t.phase, P_READY);
  p.keyUp();
  assert.equal(p.t.phase, P_READY, "the keyup that lands now throws nothing");
  assert.equal(p.key(), true, "Space winds again");
  p.frames(30);
  p.keyUp();
  assert.equal(p.t.phase, P_SPIN, "a fresh hold and release throws");
});

test("statechart InputReleasedWhenAway (bug 1): the menu and the level list drop the hold too", () => {
  for (const open of ["pause", "openList", "hide"] as const) {
    const p = page(1);
    p.start();
    p.key(); p.frames(20);
    assert.equal(p.t.winding, true);
    p[open]();
    assert.equal(p.t.winding, false, open);
    assert.equal(p.s.key, false, open);
  }
});

test("statechart PausedWhenBlurred + HumOnlyWhileSpinning (bug 2): blur stops the hum and freezes the top; the click back is not a knock", () => {
  const p = page(1);
  p.start();
  p.throwIt();
  p.frames(60);
  assert.equal(p.count.hum, 1, "the hum sounds while it spins");
  const t = p.t.t, wobble = p.t.wobble;
  p.blur();
  assert.equal(p.count.hum, 0, "no hum while frozen");
  p.frames(180);
  assert.equal(p.t.t, t, "the top hangs while you're away");
  assert.equal(p.t.wobble, wobble);
  p.focus();
  assert.equal(p.tap(), -1, "the click that brings the window back is not a touch");
  p.frames(S.BREATH - 1);
  assert.equal(p.t.t, t, "a breath before it moves again");
  assert.equal(p.tap(), -1, "still catching its breath");
  p.frames(2);
  assert.ok(p.t.t > t);
  assert.equal(p.count.hum, 1, "the hum is back with the spin");
  assert.equal(p.nudged, 0);
});

test("statechart HumOnlyWhileSpinning: not in the hand, not after the fall, not on the result, never while paused", () => {
  const p = page(1);
  p.start();
  p.frames(30);
  assert.equal(p.count.hum, 0, "nothing hums in the hand");
  p.throwIt();
  assert.equal(p.count.hum, 1);
  p.pause();
  assert.equal(p.count.hum, 0);
  p.resume();
  p.frames(S.BREATH + 5);
  assert.equal(p.count.hum, 1);
  p.t.omega = 0.2; p.t.wobble = 0.3;
  assert.equal(p.lift(), 1, "lifting works");
  assert.equal(p.count.hum, 0, "the hum stops as it lands on the palm");
  for (let i = 0; i < 200 && p.t.phase !== P_DONE; i++) p.frames(1);
  assert.equal(p.t.phase, P_DONE);
  S.goTo(p.s, "over", 100); p.sync();
  assert.equal(p.count.hum, 0);
});

test("statechart HumComesBack: turning sound off and on again gives a fresh hum, never a stub made while muted", () => {
  const p = page(1);
  p.start(); p.throwIt();
  assert.equal(p.count.hum, 1);
  p.sound(false);
  assert.equal(p.count.hum, 0);
  p.frames(30);
  assert.equal(p.count.hum, 0, "stays off while muted");
  p.sound(true);
  assert.equal(p.count.hum, 1, "comes back");
  // muted at the start: a throw makes no loop at all; switching sound on starts it
  const q = page(1, { sound: false });
  q.start(); q.throwIt();
  assert.equal(q.count.hum, 0);
  q.sound(true);
  assert.equal(q.count.hum, 1);
});

test("the wind loop belongs to windy levels only, and follows the hum's rules", () => {
  const calm = page(9), windy = page(10);
  for (const p of [calm, windy]) { p.start(); p.throwIt(); }
  assert.equal(calm.count.wind, 0);
  assert.equal(windy.count.wind, 1);
  windy.blur();
  assert.equal(windy.count.wind, 0);
  windy.focus();
  assert.equal(windy.count.wind, 1);
});

test("statechart NothingMovesWhilePaused (bug 3): হাতে তোলো does nothing under the menu", () => {
  const p = page(1);
  p.start(); p.throwIt();
  p.t.omega = 0.2; p.t.wobble = 0.3;
  assert.ok(canLift(p.t));
  p.pause();
  const t = p.t.t;
  assert.equal(p.lift(), -1, "the button is ignored while paused");
  assert.equal(p.tap(), -1);
  assert.equal(p.t.phase, P_SPIN);
  assert.equal(p.t.bonus, 0);
  p.frames(120);
  assert.equal(p.t.t, t);
  p.resume();
  p.frames(S.BREATH + 1);
  assert.equal(p.lift(), 1, "after চালিয়ে যাও it works");
  assert.equal(p.t.phase, 3);
});

test("statechart LevelPickerFreezesPlay (bug 4): the top does not spin on behind the level list", () => {
  const p = page(1);
  p.start(); p.throwIt(); p.frames(5);
  const t = p.t.t;
  p.openList();
  p.frames(360);
  assert.equal(p.t.t, t, "frozen behind the list");
  assert.equal(p.count.hum, 0);
  assert.equal(p.tap(), -1);
  p.closeList();
  p.frames(S.BREATH);
  assert.equal(p.t.t, t, "a breath after it closes");
  p.frames(2);
  assert.ok(p.t.t > t);
});

test("statechart HeldKeyActsOnce: holding Space nudges once, never again by itself", () => {
  const p = page(1);
  p.start();
  p.key(); p.frames(30); p.keyUp();
  assert.equal(p.t.phase, P_SPIN);
  p.frames(S.BREATH * 0 + 30);
  assert.equal(p.key(), true, "a fresh press nudges");
  const n = p.t.nudges;
  for (let i = 0; i < 120; i++) { p.frames(2); assert.equal(p.key(true), false, "an auto-repeat does nothing"); }
  assert.equal(p.t.nudges, n);
  p.keyUp();
  p.frames(20);
  assert.equal(p.key(), true);
  assert.equal(p.t.nudges, n + 1);
});

test("statechart ResultStaysUntilYouChoose: a key held through the end never skips the result or starts the next run", () => {
  const s = S.createSession(true);
  S.goTo(s, "over", 1000);
  assert.equal(S.freshResultKey(s, { timeStamp: 1200, repeat: true }), false, "the held key's auto-repeat");
  assert.equal(S.freshResultKey(s, { timeStamp: 990, repeat: false }), false, "pressed before the screen appeared");
  assert.equal(S.freshResultKey(s, { timeStamp: 1200, repeat: false }), true, "a fresh press after it works");
  S.pause(s);
  assert.equal(S.freshResultKey(s, { timeStamp: 1300, repeat: false }), false, "not under the menu");
  // a hold begun in the hand cannot run on into the next spin: after the result, nothing is winding
  const p = page(1);
  p.start(); p.key(); p.frames(10); p.keyUp();
  for (let i = 0; i < 60 * 150 && p.t.phase !== P_DONE; i++) { p.frames(1); p.key(true); }
  assert.equal(p.t.phase, P_DONE);
  assert.equal(p.t.winding, false);
});

test("statechart NoDoubleResult: the top reports DONE once, and stepping a finished round changes nothing", () => {
  const p = page(1);
  p.start(); p.throwIt();
  let done = 0;
  for (let i = 0; i < 60 * 150; i++) {
    if (S.step(p.s) && p.t.phase !== P_DONE) advance(p.t, DT);
    for (let e = 0; e < p.t.evN; e++) if (p.t.evType[e] === 9) done++;
    p.events();
  }
  assert.equal(done, 1);
  assert.ok(p.t.phase === P_DONE || p.t.phase === P_FALL);
});

test("the click that brings focus back never hops a pull or a hold: begin and release both need a ticking, unbreathing page", () => {
  const p = page(1);
  p.start();
  p.blur();
  assert.equal(S.canTap(p.s), false);
  assert.equal(p.key(), false, "no wind-up while away");
  p.focus();
  assert.equal(p.key(), false, "none during the breath either");
  assert.equal(p.t.winding, false);
  p.frames(S.BREATH + 1);
  assert.equal(p.key(), true);
});

test("friend links: clearing a far-ahead level records its stars but opens nothing in between", () => {
  assert.equal(afterClear(1, 9), 1, "level 9 cleared from a friend's link opens nothing");
  assert.equal(afterClear(3, 3), 4);
  assert.equal(afterClear(3, 2), 3, "an older level never lowers it");
  assert.equal(afterClear(12, 12), 12);
  assert.equal(playable(9, 1, {}, 9), true, "the friend's level can be played");
  assert.equal(playable(8, 1, {}, 9), false);
  assert.equal(playable(8, 1, { 8: 2 }), true, "a level with stars stays playable");
  assert.equal(seedFor({ level: 9, seed: 77, mode: "n" }, 9, "n", 5), 77, "the friend's own floor");
  assert.equal(seedFor({ level: 9, seed: 77, mode: "n" }, 8, "n", 5), 5);
  assert.equal(seedFor({ level: 9, seed: 77, mode: "n" }, 9, "h", 5), 5, "another mode is another floor");
});

test("a fall ends the hum, and a lift that slips is a fall too", () => {
  const p = page(1);
  p.start(); p.throwIt();
  p.t.omega = 0.2; p.t.wobble = 0.8;
  assert.equal(p.lift(), 0);
  assert.equal(p.t.phase, P_FALL);
  assert.equal(p.count.hum, 0);
});
