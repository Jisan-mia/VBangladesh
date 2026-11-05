import assert from "node:assert/strict";
import test from "node:test";
import { BUBBLES, createFoam } from "../lib/foam";
import { alive, burst, popAt, spawn, stepFoam } from "../lib/foam.hot";
import { createRun, ringAt } from "../lib/run";
import { FINISHED, STEP_CHANGED, advance } from "../lib/run.hot";
import { BRUSH_ZONES, WASH_STEPS } from "../lib/routines";

test("the clock: each step starts at the right second, the ring fills evenly, and the end comes once at the end", () => {
  const run = createRun(WASH_STEPS);
  const changes: number[] = [];
  let finished = 0;
  while (!run.done) {
    const before = run.index, events = advance(run, 1 / 60);
    if (events & STEP_CHANGED && run.index !== before) changes.push(Math.round(run.t * 10) / 10);
    if (events & FINISHED) finished++;
  }
  assert.deepEqual(changes, [4, 7, 11, 14, 17], "the five changes between six steps");
  assert.equal(finished, 1);
  assert.equal(run.index, WASH_STEPS.length - 1);
  assert.equal(ringAt(run), 1);
  assert.equal(advance(run, 1), 0, "nothing after the end");
  const brush = createRun(BRUSH_ZONES);
  assert.equal(brush.total, 120);
  assert.equal(brush.half, 60);
  advance(brush, 61);
  assert.equal(brush.index, 3, "at 61 s the brush is on the lower outside");
  assert.equal(ringAt(createRun(WASH_STEPS)), 0);
});

test("the suds: the same seed gives the same bubbles, and the pool is never overfull", () => {
  const draw = (seed: number) => {
    const foam = createFoam(seed);
    for (let frame = 0; frame < 600; frame++) stepFoam(foam, 1 / 60, 8, 1, 0.5);
    return Array.from(foam.x).join(",") + "|" + foam.popped;
  };
  assert.equal(draw(7), draw(7));
  assert.notEqual(draw(7), draw(8));
  const foam = createFoam(3);
  for (let n = 0; n < 500; n++) spawn(foam, 1);
  assert.ok(alive(foam) <= BUBBLES);
  assert.equal(spawn(foam, 1), false, "a full pool takes no more");
  burst(foam, 20, 1);
  assert.ok(alive(foam) <= BUBBLES);
});

test("the suds stay inside the pool, and each pops by itself within a few seconds", () => {
  const foam = createFoam(11);
  for (let frame = 0; frame < 60 * 20; frame++) {
    stepFoam(foam, 1 / 60, 10, 1, 1);
    for (let slot = 0; slot < BUBBLES; slot++) if (foam.alive[slot]) assert.ok(Math.hypot(foam.x[slot] - 100, foam.y[slot] - 100) <= 78, "inside the pool");
  }
  assert.ok(foam.popped > 100);
  for (let frame = 0; frame < 60 * 5; frame++) stepFoam(foam, 1 / 60, 0, 1, 1);
  assert.equal(alive(foam), 0, "with no new ones, every bubble is gone");
});

test("a finger pops the bubble under it and nothing else; ধীরে খেলো holds the bubbles nearly still", () => {
  const foam = createFoam(5);
  for (let frame = 0; frame < 120; frame++) stepFoam(foam, 1 / 60, 10, 1, 1);
  const slot = Array.from(foam.alive).findIndex(Boolean);
  const x = foam.x[slot], y = foam.y[slot], before = alive(foam);
  assert.ok(popAt(foam, x, y));
  assert.equal(alive(foam), before - 1);
  assert.equal(popAt(foam, -50, -50), false, "a tap outside pops nothing");
  const still = createFoam(5);
  spawn(still, 1);
  const startY = still.y[0];
  for (let frame = 0; frame < 60; frame++) stepFoam(still, 1 / 60, 0, 0, 1);
  assert.equal(still.y[0], startY, "drift 0 holds a bubble still");
});
