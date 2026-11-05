// The statechart's bug paths (ai_docs/statecharts/chhip-felo/README.md), replayed against the pure session and trip.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { afterClear, playable, readUnlock, recommended } from "../lib/levels";
import * as S from "../lib/session";
import { stepTrip } from "../lib/step.hot";
import { createTrip, floatState, P, SWING, type Trip } from "../lib/trip";

const DT = 1 / 60;
const loops = () => { const log = { starts: 0, stops: 0 }; return { log, hum: { start: () => { log.starts++; }, stop: () => { log.stops++; } } }; };
/** One step the way the component runs it. */
function tick(s: S.Session, trip: Trip, hum: S.Hum) {
  if (S.ticking(s) && !S.breathing(s, DT)) stepTrip(trip, S.held(s), S.takePress(s), DT);
  S.syncHum(s, trip, hum);
}
function playing() {
  const s = S.createSession(true), trip = createTrip(21, 3), { log, hum } = loops();
  S.goTo(s, "play");
  return { s, trip, log, hum };
}
function toReel(s: S.Session, trip: Trip, hum: S.Hum) {
  assert.ok(S.pointerDown(s, 1));
  while (trip.charging || trip.phase === P.AIM) { tick(s, trip, hum); if (trip.power >= trip.spot || trip.charge > SWING / 2) S.pointerUp(s, 1); }
  while (trip.phase !== P.WAIT) tick(s, trip, hum);
  while (floatState(trip) !== 2) tick(s, trip, hum);
  assert.ok(S.pointerDown(s, 1));
  tick(s, trip, hum);
  assert.equal(trip.phase, P.REEL);
}

test("bug 1, InputReleasedWhenAway: hold to reel, click into another window, come back: nothing is still held", () => {
  const { s, trip, hum } = playing();
  toReel(s, trip, hum);
  assert.ok(S.held(s));
  S.blur(s);
  assert.equal(S.held(s), false, "the finger's pointerup went to the other app; blur let go");
  const tension = trip.tension;
  for (let i = 0; i < 120; i++) tick(s, trip, hum);
  assert.equal(trip.tension, tension, "nothing moves while away");
  S.focus(s);
  for (let i = 0; i < 30; i++) tick(s, trip, hum);
  assert.ok(trip.tension < tension, "after coming back the line slackens: no one is holding it");
  // Space the same way.
  const other = playing();
  toReel(other.s, other.trip, other.hum);
  S.pointerUp(other.s, 1);
  assert.ok(S.keyDown(other.s));
  S.blur(other.s);
  assert.equal(S.held(other.s), false);
});

test("bug 2, PausedWhenBlurred: the tap that brings you back to the window never strikes", () => {
  const { s, trip, hum } = playing();
  assert.ok(S.pointerDown(s, 1));
  while (trip.phase === P.AIM) { tick(s, trip, hum); if (trip.power >= trip.spot) S.pointerUp(s, 1); }
  while (trip.phase !== P.WAIT) tick(s, trip, hum);
  const t = trip.t;
  S.blur(s);
  for (let i = 0; i < 180; i++) tick(s, trip, hum);
  assert.equal(trip.t, t, "the float waits while you're away");
  S.focus(s);
  assert.equal(S.pointerDown(s, 2), false, "the first tap back only wakes the game");
  tick(s, trip, hum);
  assert.equal(trip.phase, P.WAIT, "no early strike");
  assert.ok(S.pointerDown(s, 2), "the next tap counts");
  // And when the player's menu took the pause, চালিয়ে যাও is the wake-up, so the next tap counts at once.
  const other = playing();
  S.blur(other.s); S.pause(other.s); S.focus(other.s); S.resume(other.s);
  assert.ok(S.pointerDown(other.s, 1));
});

test("bug 3, LoopOnlyWhenMeaningful: the reel hum stops while away and on pause, and comes back with sound and resume", () => {
  const { s, trip, log, hum } = playing();
  toReel(s, trip, hum);
  assert.deepEqual(log, { starts: 1, stops: 0 });
  S.blur(s); tick(s, trip, hum);
  assert.deepEqual(log, { starts: 1, stops: 1 }, "away: the hum stops");
  S.focus(s); tick(s, trip, hum);
  assert.equal(log.starts, 2, "back: it plays again");
  S.pause(s); tick(s, trip, hum);
  assert.equal(log.stops, 2);
  S.resume(s); tick(s, trip, hum);
  assert.equal(log.starts, 3);
  S.setSound(s, false); tick(s, trip, hum);
  assert.equal(s.hum, false);
  S.setSound(s, true); tick(s, trip, hum);
  assert.equal(log.starts, 4, "sound back on brings the hum back (a fresh loop, never the silent stub)");
  S.hide(s); tick(s, trip, hum);
  assert.equal(s.hum, false);
  S.show(s); S.openSheet(s); tick(s, trip, hum);
  assert.equal(s.hum, false, "a choice screen stops it too");
});

test("bug 4, FanfareOnlyOnTheResult: the component schedules every celebration as tones and keeps no timers", () => {
  const source = readFileSync(new URL("../components/chhip-felo.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /setTimeout|setInterval/, "no timer can outlive the result");
  assert.match(source, /silenceScheduled\(\)/, "a new level cuts whatever the last result had scheduled");
});

test("bug 5, OpenLevelsAreEarned: clearing a friend's far level keeps its stars but opens nothing in between", () => {
  const { unlock, migrated } = readUnlock(null, {});
  assert.equal(unlock, 1); assert.ok(migrated);
  assert.equal(afterClear(1, 9), 1, "a friend's level 9 cleared on a fresh phone");
  assert.ok(playable(9, 1, { 9: 3 }), "it stays playable: it has stars");
  assert.ok(!playable(5, 1, { 9: 3 }), "the levels in between stay shut");
  assert.ok(playable(7, 1, {}, 7), "a friend's level is playable for the visit");
  assert.equal(afterClear(1, 1), 2);
  assert.equal(afterClear(4, 3), 4);
  // The one-time migration keeps what the old game opened (it relies on the shared unlockedLevel).
  assert.equal(readUnlock(null, { 1: 3, 2: 2, 3: 1 }).unlock, 4);
  assert.deepEqual(readUnlock("6", { 1: 3 }), { unlock: 6, migrated: false });
  assert.equal(readUnlock("junk", { 1: 3 }).unlock, 2);
  assert.equal(recommended(4, { 1: 3, 2: 1 }), 3);
  assert.equal(recommended(3, { 1: 3, 2: 1, 3: 3 }), 2);
});

test("a choice screen, the menu or the pond scrolled away freezes play; game keys while paused are ignored", () => {
  const { s, trip, hum } = playing();
  S.openSheet(s);
  assert.equal(S.ticking(s), false);
  assert.equal(S.pointerDown(s, 1), false);
  assert.equal(S.keyDown(s), false);
  S.closeSheet(s);
  S.pause(s);
  assert.equal(S.keyDown(s), false, "Space while the menu is up does nothing to the pond");
  S.resume(s);
  assert.ok(S.breathing(s, DT), "a short breath before the water moves");
  S.setInView(s, false);
  assert.equal(S.ticking(s), false);
  tick(s, trip, hum);
});

test("end-screen keys need a fresh press: a Space held through the last catch never skips the result", () => {
  const s = S.createSession(true);
  S.goTo(s, "over", 1000);
  assert.equal(S.freshResultKey(s, { timeStamp: 1001, repeat: true }), false, "auto-repeat of the held key");
  assert.equal(S.freshResultKey(s, { timeStamp: 900, repeat: false }), false, "a press from before the screen");
  assert.equal(S.freshResultKey(s, { timeStamp: 1200, repeat: false }), true);
  S.openSheet(s);
  assert.equal(S.freshResultKey(s, { timeStamp: 1300, repeat: false }), false);
});

test("a tap shorter than one step still counts as a press", () => {
  const { s, trip, hum } = playing();
  toReel(s, trip, hum);
  S.pointerUp(s, 1);
  for (let i = 0; i < 400 && trip.phase === P.REEL; i++) tick(s, trip, hum);
  // Whatever happened to the fish, a quick tap during the catch or miss card skips it.
  for (let i = 0; i < 30; i++) tick(s, trip, hum);
  const cast = trip.cast;
  assert.ok(S.pointerDown(s, 3)); S.pointerUp(s, 3);
  tick(s, trip, hum);
  assert.ok(trip.cast > cast || trip.phase === P.OVER, "the tap moved on to the next cast");
});
