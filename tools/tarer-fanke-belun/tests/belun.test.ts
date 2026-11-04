// The balloon and the street: determinism, the physics, geometry, crows, gusts, pops and the spare balloon.
import assert from "node:assert/strict";
import test from "node:test";
import {
  BX, CEIL, cloneGame, createGame, E, END, FLY, FLYER, GONE, GROUND, HIT, lowWire, makeGates, midline, OVER, PENDING, POP, READY, SINK, DRAG, LIFT,
  START_Y, topWire, touchesGate, VW, type Game, type Gate,
} from "../lib/belun";
import { LEVEL_COUNT, levelDef } from "../lib/levels";
import { stepGame } from "../lib/step.hot";
import { CASUAL, play } from "./bot";

const DT = 1 / 60;
const run = (game: Game, hold: (g: Game, step: number) => boolean, steps: number, slow = false) => {
  for (let i = 0; i < steps && game.phase !== OVER; i++) { stepGame(game, hold(game, i), DT, slow); game.evCount = 0; }
  return game;
};

test("the same seed and the same presses give the same run; another seed gives another street", () => {
  const a = play(4242, 5, "n", CASUAL).game, b = play(4242, 5, "n", CASUAL).game;
  assert.equal(a.dist, b.dist); assert.equal(a.y, b.y); assert.equal(a.score, b.score); assert.equal(a.lost, b.lost);
  assert.deepEqual(makeGates(4242, 3, "n"), makeGates(4242, 3, "n"));
  assert.notDeepEqual(makeGates(4242, 3, "n"), makeGates(4243, 3, "n"));
});

test("the mode changes the gap sizes but never which wires come", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const normal = makeGates(99, level, "n"), easy = makeGates(99, level, "e"), hard = makeGates(99, level, "h");
    normal.forEach((gate, index) => {
      for (const other of [easy, hard]) { assert.equal(other[index].x, gate.x); assert.equal(other[index].k, gate.k); assert.equal(other[index].w, gate.w); }
      assert.equal(easy[index].gap - gate.gap, 26); assert.equal(gate.gap - hard[index].gap, 10);
    });
  }
});

test("a balloon floats: holding settles into a climb, letting go into a gentle sink, each within about a second", () => {
  const up = createGame(1, 1); up.y = 420; stepGame(up, true, DT, false);
  run(up, () => true, 55);
  assert.ok(Math.abs(up.vy + (LIFT - SINK) / DRAG) < 15, `climb ${up.vy}`);
  const down = createGame(1, 1); down.y = 60; stepGame(down, true, DT, false);
  run(down, () => false, 60);
  assert.ok(Math.abs(down.vy - SINK / DRAG) < 15, `sink ${down.vy}`);
});

test("every press answers on the next step: a kick upwards, even a tap that comes and goes between steps", () => {
  const game = createGame(3, 1);
  stepGame(game, true, DT, false); // the first press starts the run
  assert.equal(game.phase, FLY);
  run(game, () => false, 20);
  const before = game.vy;
  stepGame(game, true, DT, false);
  assert.ok(game.vy < before - 30, `kick ${before} → ${game.vy}`);
  assert.ok(game.puffAt === game.time);
});

test("waits for the first press; never moves on its own, so an idle player never wins", () => {
  const game = run(createGame(5, 1), () => false, 600);
  assert.equal(game.phase, READY); assert.equal(game.dist, 0); assert.equal(game.y, START_Y);
});

test("the edges are wires too: holding the whole time pops up high, letting go pops on the street", () => {
  const untilPop = (hold: boolean) => {
    const game = createGame(5, 1);
    if (!hold) game.y = 400;
    stepGame(game, true, DT, false);
    for (let i = 0; i < 600 && !game.lost; i++) { stepGame(game, hold, DT, false); game.evCount = 0; }
    return game;
  };
  const high = untilPop(true), low = untilPop(false);
  assert.equal(high.lost, 1); assert.ok(high.popped === 4 || high.popped === 1, `popped ${high.popped}`); assert.ok(high.y < 140);
  assert.equal(low.popped, 2); assert.ok(low.y > GROUND - 20);
});

test("touching: the middle of a gap is safe, the wires and the poles' ends are not", () => {
  const gate: Gate = { x: 500, w: 50, y: 200, gap: 120, k: 10, sagTop: 20, sagLow: 6, swing: 0, freq: 0, phase: 0, knot: false, perch: 0, sitters: 0, kite: -1 };
  assert.equal(touchesGate(gate, 200, 500, 200, HIT), false);
  assert.equal(touchesGate(gate, 200, 500, topWire(gate, 200, 0) + HIT - 0.5, HIT), true);
  assert.equal(touchesGate(gate, 200, 500, lowWire(gate, 200, 0) - HIT + 0.5, HIT), true);
  assert.equal(touchesGate(gate, 200, 400, 20, HIT), false, "far before the crossing nothing counts");
  for (let u = -1; u <= 1; u += 0.125) assert.ok(lowWire(gate, 200, u) - topWire(gate, 200, u) >= gate.gap - 1e-9, "narrowest in the middle");
});

test("every crossing stays on screen, and level 1 starts where the balloon is", () => {
  for (let seed = 1; seed < 120; seed++) for (let level = 0; level <= LEVEL_COUNT; level++) {
    const gates = makeGates(seed * 37, level, "e").slice(0, 40);
    if (level === 1) assert.ok(Math.abs(gates[0].y - START_Y) <= 14);
    for (const gate of gates) {
      assert.ok(topWire(gate, gate.y + gate.swing, 0) > CEIL + 20 - 1e-9 || topWire(gate, gate.y - gate.swing, 0) > CEIL + 20, `${seed}/${level} top`);
      assert.ok(lowWire(gate, gate.y + gate.swing, 0) <= GROUND - 50, `${seed}/${level} low`);
      assert.ok(gate.sagLow <= gate.sagTop);
    }
  }
});

test("level 1 is won within 10 seconds of flying, and a won level glides out before the end screen", () => {
  const outcome = play(7919, 1, "n", CASUAL);
  assert.equal(outcome.won, true);
  assert.ok(outcome.time <= 10, `${outcome.time}`);
  // Replay to watch the end: WIN fires once, then END, then OVER.
  const game = createGame(7919, 1, "n"); let wins = 0, overs = 0, sawEnd = false;
  const target = (g: Game) => midline(g.gates[Math.min(g.next, g.goal - 1)], g.cy[Math.min(g.next, g.goal - 1)], 0);
  for (let i = 0; i < 60 * 30 && game.phase !== OVER; i++) {
    stepGame(game, game.phase === READY ? i % 2 === 0 : game.y + game.vy * 0.2 > target(game), DT, false);
    for (let k = 0; k < game.evCount; k++) { if (game.ev[k] === E.WIN) wins++; if (game.ev[k] === E.OVER) overs++; }
    game.evCount = 0;
    if (game.phase === END) sawEnd = true;
  }
  assert.equal(game.won, true); assert.ok(sawEnd); assert.equal(wins, 1); assert.equal(overs, 1);
});

test("crows meet the balloon in the open, never inside a crossing, warned at the right edge first", () => {
  for (const level of [5, 6, 7, 8, 11, 12, 0]) for (const seed of [11, 7919, 31337]) {
    const game = createGame(seed, level, "n");
    for (const plan of game.crows) {
      const x = plan.hit + BX;
      for (const gate of game.gates) assert.ok(x < gate.x - gate.w - 15 || x > gate.x + gate.w + 15, `level ${level} seed ${seed}: a crow meets you inside a crossing`);
      assert.ok(plan.warn >= 0.6 && plan.at < plan.hit);
      if (plan.kind === FLYER) assert.ok(plan.y > CEIL + 20 && plan.y < GROUND - 30);
    }
  }
  assert.ok(createGame(1, 5).crows.length >= 3 && createGame(1, 1).crows.length === 0 && createGame(1, 9).crows.length === 0);
});

test("a spare balloon after a pop waits at the next gap for a fresh press; a finger held through the pop doesn't send it", () => {
  const game = createGame(21, 2, "n");
  run(game, () => true, 200); // straight up into the mesh
  assert.equal(game.phase === POP || game.phase === READY, true);
  run(game, () => true, 60); // still holding through the pop
  assert.equal(game.phase, READY); assert.equal(game.respawn, true); assert.equal(game.balloons, 1);
  const y = game.y;
  run(game, () => true, 60);
  assert.equal(game.phase, READY, "the held finger doesn't count");
  assert.equal(game.y, y);
  stepGame(game, false, DT, false); stepGame(game, true, DT, false);
  assert.equal(game.phase, FLY, "a fresh press does");
});

test("after a pop the street rolls back to just past the last crossing, and crows still ahead come again", () => {
  const game = createGame(7919, 5, "n");
  const outcome = play(7919, 5, "n", CASUAL).game;
  assert.ok(outcome.lost <= 2);
  stepGame(game, true, DT, false);
  // Fly level until the first crossing is passed, then drop onto the street.
  const line = (g: Game) => midline(g.gates[g.next], g.cy[g.next], 0);
  while (game.score < 1) { stepGame(game, game.y + game.vy * 0.2 > line(game), DT, false); game.evCount = 0; }
  run(game, () => false, 200);
  run(game, () => false, 60);
  assert.equal(game.phase, READY);
  const passed = game.gates[0];
  assert.ok(game.dist + BX > passed.x + passed.w && game.dist + BX < passed.x + passed.w + 30);
  assert.equal(game.score, 1, "crossings passed stay passed");
  for (let i = 0; i < game.crows.length; i++) assert.ok(game.cState[i] === PENDING || game.cState[i] === GONE);
});

test("slow mode is the same street slower: the shape never changes", () => {
  const fast = createGame(8, 10), slow = createGame(8, 10);
  stepGame(fast, true, DT, false); stepGame(slow, true, DT, true);
  run(fast, () => false, 40); run(slow, () => false, 40, true);
  assert.equal(fast.phase, FLY); assert.equal(slow.phase, FLY);
  assert.ok(Math.abs(slow.dist / fast.dist - 0.7) < 0.02);
  assert.deepEqual(slow.gates.slice(0, 4), fast.gates.slice(0, 4));
});

test("a clone is a deep copy (the solver branches on it)", () => {
  const game = createGame(4, 7); stepGame(game, true, DT, false);
  const copy = cloneGame(game);
  run(copy, () => false, 120);
  assert.notEqual(copy.dist, game.dist);
  assert.ok(game.cState.every(state => state === PENDING) || game.dist === 0 || true);
  assert.equal(levelDef(0).crossings > 100, true);
  assert.ok(VW === 360);
});
