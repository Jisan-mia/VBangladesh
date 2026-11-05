// The run's clock: steps arrive on time, and nothing moves, lifts or wins while the game is held (away, paused, behind a menu).
import assert from "node:assert/strict";
import test from "node:test";
import { BREATH_MS, LEAD_MS, MAX_DT, STEP_MS, SLOW_STEP_MS, WIN_BEAT_MS, giveBreath, tick } from "../lib/run.hot";
import { makeClock, remaining } from "../lib/run";

/** Advances in 16 ms frames for `ms` live milliseconds. */
const play = (clock: ReturnType<typeof makeClock>, ms: number) => { for (let spent = 0; spent < ms; spent += 16) tick(clock, 16); };

test("steps arrive after the lead and then one every step; the run ends a beat after the last", () => {
  const clock = makeClock(3, false, true);
  play(clock, LEAD_MS - 20);
  assert.equal(clock.reached, 0);
  play(clock, 40);
  assert.equal(clock.reached, 1, "the first step arrives with the lead");
  play(clock, STEP_MS);
  assert.equal(clock.reached, 2);
  play(clock, STEP_MS);
  assert.equal(clock.reached, 3);
  assert.equal(clock.ended, false);
  play(clock, WIN_BEAT_MS + 32);
  assert.ok(clock.ended);
  assert.equal(tick(clock, 16), false, "an ended run is still");
});

test("ধীরে খেলো slows the rover, and a plan that bumps at once still ends", () => {
  assert.equal(makeClock(2, true, true).stepMs, SLOW_STEP_MS);
  const none = makeClock(0, false, false);
  play(none, LEAD_MS + 400);
  assert.ok(none.ended);
});

test("a long frame never lurches the rover: a frame counts at most MAX_DT", () => {
  const clock = makeClock(5, false, true);
  tick(clock, 5000);
  assert.ok(clock.t <= -LEAD_MS + MAX_DT + 1);
  assert.equal(clock.reached, 0);
});

test("a breath after coming back holds the clock still for BREATH_MS", () => {
  const clock = makeClock(4, false, true);
  play(clock, LEAD_MS + 20);
  const before = clock.t;
  giveBreath(clock);
  play(clock, BREATH_MS - 40);
  assert.equal(clock.t, before, "nothing moves in the breath");
  play(clock, 120);
  assert.ok(clock.t > before);
});

test("remaining is the live time left", () => {
  const clock = makeClock(2, false, true);
  assert.ok(remaining(clock) > STEP_MS + WIN_BEAT_MS);
});
