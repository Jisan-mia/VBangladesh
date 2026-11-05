// The springs that carry vehicles: they settle, they overshoot a little when they land (heavier ones wobble slower), slow mode
// never overshoots, and the street builds up and drives in.
import assert from "node:assert/strict";
import test from "node:test";
import { startGame } from "../lib/game";
import { arrive, makeMotion, massOf, settle } from "../lib/motion";
import { countAt, driveOff, easeOut, jolt, stepMotion } from "../lib/motion.hot";

function run(mass: number, calm: boolean, seconds = 2) {
  const m = makeMotion();
  m.n = 1; m.mass[0] = mass; m.x[0] = 0; m.t[0] = 3;
  let peak = 0, settledAt = -1;
  for (let t = 0; t < seconds * 60; t++) {
    const moving = stepMotion(m, 1 / 60, calm, -1);
    peak = Math.max(peak, m.x[0]);
    if (!moving && settledAt < 0) settledAt = t / 60;
  }
  return { x: m.x[0], peak, settledAt };
}

test("a vehicle let go settles on its cell within a second, with a small overshoot that grows with weight", () => {
  const light = run(massOf("rickshaw"), false), heavy = run(massOf("truck"), false);
  for (const result of [light, heavy]) {
    assert.equal(result.x, 3);
    assert.ok(result.settledAt > 0 && result.settledAt < 1.2, `settled at ${result.settledAt}`);
    assert.ok(result.peak > 3 && result.peak < 3.4, `overshoot ${result.peak - 3}`);
  }
  assert.ok(massOf("truck") > massOf("bus") && massOf("bus") > massOf("van") && massOf("van") > massOf("rickshaw"));
  assert.ok(heavy.settledAt >= light.settledAt, "a truck takes longer to settle than a rickshaw");
});

test("slow mode: no overshoot at all", () => {
  for (const kind of ["rickshaw", "truck"] as const) {
    const r = run(massOf(kind), true);
    assert.equal(r.x, 3);
    assert.ok(r.peak <= 3.0001, `${kind} overshoot ${r.peak - 3}`);
  }
});

test("a held vehicle follows its target without a wobble, and a bump shivers the one it hits and then settles", () => {
  const m = makeMotion();
  m.n = 1; m.mass[0] = 1; m.x[0] = 2; m.t[0] = 2;
  jolt(m, 0, 5);
  let moved = 0;
  for (let t = 0; t < 120; t++) { stepMotion(m, 1 / 60, false, -1); moved = Math.max(moved, Math.abs(m.x[0] - 2)); }
  assert.ok(moved > 0.02 && moved < 0.5, `the shiver is small: ${moved}`);
  assert.equal(m.x[0], 2, "…and it ends in its cell");
  const held = makeMotion();
  held.n = 1; held.mass[0] = 1; held.x[0] = 0; held.t[0] = 1.5;
  let over = 0;
  for (let t = 0; t < 120; t++) { stepMotion(held, 1 / 60, false, 0); over = Math.max(over, held.x[0] - 1.5); }
  assert.ok(over < 0.01, `held: critically damped, overshoot ${over}`);
  assert.ok(held.lift[0] > 0.9, "a held vehicle is lifted");
});

test("the jam builds: every vehicle starts off the street, drives in one after another, and ends in place", () => {
  for (const level of [8, 16, 32]) {
    const game = startGame(level), m = makeMotion();
    arrive(m, game.lay, game.pos);
    for (let i = 0; i < m.n; i++) {
      const length = game.lay.cars[i].down ? 7 : 6;
      assert.ok(m.x[i] < -game.lay.cars[i].len + 0.5 || m.x[i] > length, `vehicle ${i} starts out of sight`);
      assert.equal(m.t[i], game.pos[i]);
    }
    let frames = 0;
    while (stepMotion(m, 1 / 60, false, -1) && frames < 240) frames++;
    assert.ok(frames < 120, `jam ${level} is in place after ${frames} frames`);
    for (let i = 0; i < m.n; i++) assert.equal(m.x[i], game.pos[i]);
  }
  const game = startGame(1), m = makeMotion();
  settle(m, game.lay, game.pos);
  assert.equal(stepMotion(m, 1 / 60, false, -1), false, "at rest: nothing moves, so the loop can stop");
});

test("your CNG drives off the top and out of sight", () => {
  const game = startGame(1), m = makeMotion();
  settle(m, game.lay, [0, 2]);
  driveOff(m, 0);
  for (let t = 0; t < 240; t++) stepMotion(m, 1 / 60, false, -1);
  assert.ok(m.x[0] < -5);
});

test("the end screen's count-up eases out and ends exactly on the stat", () => {
  assert.equal(countAt(14, 0), 0);
  assert.equal(countAt(14, 1), 14);
  assert.ok(countAt(14, 0.3) > 14 * 0.3, "fast at first");
  assert.equal(easeOut(2), 1);
  assert.equal(easeOut(-1), 0);
  let before = 0;
  for (let t = 0; t <= 1; t += 0.05) { const value = countAt(40, t); assert.ok(value >= before); before = value; }
});
