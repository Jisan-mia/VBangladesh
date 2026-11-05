import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { Mode, PIECES, layoutFor, makeAnim, modelY, pxX, pxY, unX, unY } from "../lib/anim";
import { SNAP_MS, celebrate, hold, puff, rest, snapTo, stepAnim, SWEEP_MS } from "../lib/table.hot";

const still = (a: ReturnType<typeof makeAnim>, ms = 2000) => { let moving = 1; for (let t = 0; t < ms && moving; t += 16) moving = stepAnim(a, 16); return moving; };

test("a piece slides home in the snap time, lands once, and the table goes still", () => {
  const a = makeAnim();
  a.x[2] = 4; a.y[2] = 9; a.s[2] = 0.6; a.mode[2] = Mode.Tray;
  hold(a, 2, 4, 9); a.tx[2] = 3; a.ty[2] = 2;
  stepAnim(a, 100);
  snapTo(a, 2, 3, 2, 0.5, 1);
  let landed = 0, steps = 0;
  while (a.mode[2] === Mode.Snap && steps < 100) { stepAnim(a, 8); landed += a.landedCount; steps++; }
  assert.equal(landed, 1);
  assert.ok(steps * 8 >= SNAP_MS - 16 && steps * 8 <= SNAP_MS + 16, `took ${steps * 8} ms`);
  assert.equal(a.mode[2], Mode.In);
  assert.equal(a.x[2], 3); assert.equal(a.s[2], 1); assert.equal(a.r[2], 0.5);
  assert.equal(still(a), 0);
});

test("the animation is deterministic: the same frames give the same numbers", () => {
  const run = () => {
    const a = makeAnim();
    for (let i = 0; i < PIECES; i++) { a.x[i] = i; a.y[i] = 8; rest(a, i, i, 8, 0.6, 0); }
    hold(a, 3, 3, 8); a.tx[3] = 5; a.ty[3] = 2; stepAnim(a, 120);
    snapTo(a, 3, 5, 2, 0, -1); puff(a, 5, 2, 0.7); still(a);
    return Array.from(a.x).concat(Array.from(a.y), Array.from(a.s), Array.from(a.fl));
  };
  assert.deepEqual(run(), run());
});

test("a held piece tilts with its speed and lifts to 1.08; slow mode has no tilt, no overshoot, no dust", () => {
  const a = makeAnim(); a.mode.fill(Mode.Tray);
  hold(a, 0, 0, 0); a.tx[0] = 8; a.ty[0] = 0;
  let max = 0;
  for (let t = 0; t < 400; t += 16) { stepAnim(a, 16); max = Math.max(max, Math.abs(a.r[0])); }
  assert.ok(max > 0.05, `tilt ${max}`);
  assert.ok(Math.abs(a.ts[0] - 1.08) < 1e-6);
  const calm = makeAnim(); calm.calm = true; calm.mode.fill(Mode.Tray);
  hold(calm, 0, 0, 0); calm.tx[0] = 8;
  let tilt = 0, big = 0;
  for (let t = 0; t < 400; t += 16) { stepAnim(calm, 16); tilt = Math.max(tilt, Math.abs(calm.r[0])); big = Math.max(big, calm.s[0]); }
  assert.equal(tilt, 0); assert.ok(big <= 1.0001);
  puff(calm, 1, 1, 1); assert.ok(calm.dlife.every(v => v === 0));
  celebrate(calm, 100); assert.equal(calm.sweep, 0);
});

test("keyboard moves answer at once: with `quick` the piece is where it goes within 120 ms", () => {
  const slowA = makeAnim(), quickA = makeAnim();
  for (const a of [slowA, quickA]) { a.mode.fill(Mode.Tray); a.x[0] = 0; rest(a, 0, 4, 0, 1, 0); }
  quickA.quick = 250;
  stepAnim(slowA, 96); stepAnim(quickA, 96);
  assert.ok(Math.abs(quickA.x[0] - 4) < 0.15, `quick ${quickA.x[0]}`);
  assert.ok(Math.abs(slowA.x[0] - 4) > 0.5, `eased ${slowA.x[0]}`);
});

test("the finishing wave speeds up (not a metronome) and the sweep waits for the last piece to land", () => {
  const a = makeAnim(); a.mode.fill(Mode.In);
  celebrate(a, SNAP_MS);
  const at = Array.from(a.pop), gaps = at.slice(1).map((v, i) => v - at[i]);
  assert.ok(gaps.every((gap, i) => i === 0 || gap < gaps[i - 1]), `gaps ${gaps}`);
  assert.ok(at[0] >= SNAP_MS);
  assert.ok(a.sweep > SWEEP_MS, "the sweep starts after the landing");
});

test("layout: the picture and tray fit the stage, a tall stage pushes the tray down, and the pick radius is 44 px", () => {
  const box: [number, number, number, number] = [0, 0, 9.6, 12];
  const tight = layoutFor(390, 12 * (390 / 9.6), box, 7), tall = layoutFor(390, 900, box, 7);
  assert.equal(tight.shift, 0);
  assert.ok(tall.shift > 0 && tall.shift <= 3.5);
  for (const px of [tight, tall]) {
    assert.ok(px.pick * px.u >= 43.9);
    assert.ok(Math.abs(unX(px, pxX(px, 3.3)) - 3.3) < 1e-9 && Math.abs(unY(px, pxY(px, 5.1)) - 5.1) < 1e-9);
  }
  // A point in the tray's pushed-down area is in the tray for the rules; the gap above the tray counts as the tray.
  assert.ok(modelY(tall, 7 + tall.shift + 1) >= 7 + 0.9 - 1e-6);
  assert.equal(modelY(tall, 3), 3);
  assert.ok(modelY(tall, 7.5) >= 6.9, "the gap is the tray, not the picture");
});

test("the hot files allocate nothing per frame (lint:games' hot-alloc rule) and use no timers or randomness", () => {
  const hot = readFileSync(join(import.meta.dirname, "../lib/table.hot.ts"), "utf8");
  assert.ok(!/Math\.random|Date\.now|setTimeout|setInterval/.test(hot));
});
