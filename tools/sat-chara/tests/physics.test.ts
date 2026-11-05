// The physics and the round's rules: determinism, piles that stand still, weight, the lane's new pieces (mud, the
// clothesline, মিঠু, টুনি), the preview, and the round's balls and stars.
import assert from "node:assert/strict";
import test from "node:test";
import { createRound, launch, starsOf, BALLS } from "../lib/game";
import { layoutOf, LEVEL_COUNT, LEVELS, seedOf, worldOf } from "../lib/levels";
import { oldLayoutOf, OLD_COUNT } from "../lib/old-levels";
import {
  canRebuild, downCount, guardTop, idle, knockSpeed, loadOn, nextThrow, settled, simulate, step, throwBall, trace, traceTime,
} from "../lib/physics.hot";
import { advance, E_BACK, E_CLEAR, E_FAIL, E_SETTLE } from "../lib/step.hot";
import {
  createWorld, speedOf, ANGLE_MAX, ANGLE_MIN, BALL_R, FLYING, G, GROUND, HAND_X, HAND_Y, LYING, MAX_STEPS, STANDING, STONES, WALL_X, type Layout, type World,
} from "../lib/world";

const DEG = Math.PI / 180;
const levels = Array.from({ length: LEVEL_COUNT }, (_, index) => index + 1);
const snapshot = (w: World) => JSON.stringify([[...w.x], [...w.y], [...w.a], [...w.state], [...w.downAt], w.bx, w.by, w.clock]);
/** A plain pile of seven at x, nothing else. */
const pileAt = (x: number, heavy = 0): Layout => {
  const widths = [46, 43, 41, 39, 36, 33, 30];
  let y = GROUND;
  return { blocks: [], stones: widths.map((w, k) => { const h = k < heavy ? 11 : 8; y -= h; return { x, y: y + h / 2, w, h, heavy: k < heavy }; }) };
};

test("15 levels in three places of five; every pile stands still on its own, forever", () => {
  assert.equal(LEVEL_COUNT, 15);
  assert.deepEqual([1, 6, 11].map(level => worldOf(level).name), ["গলির মোড়", "স্কুলের মাঠ", "নানুবাড়ির উঠান"]);
  assert.deepEqual(LEVELS.map((def, i) => def.finale ? i + 1 : 0).filter(Boolean), [5, 10, 15]);
  for (const layout of [...levels.map(layoutOf), ...Array.from({ length: OLD_COUNT }, (_, i) => oldLayoutOf(i + 1))]) {
    assert.equal(layout.stones.length, STONES);
    const w = createWorld(layout);
    for (let i = 0; i < STONES; i++) {
      const supported = w.onFixed[i] === 1 || [...w.sup.slice(i * 4, i * 4 + 4)].some(j => j >= 0);
      assert.ok(supported, `stone ${i} rests on something`);
      assert.ok(w.x[i] - w.w[i] / 2 > 60 && w.x[i] + w.w[i] / 2 < WALL_X, `stone ${i} sits in the lane`);
    }
    // Nothing thrown, and a forced support check as if something had been hit: nothing may move.
    const before = JSON.stringify([[...w.x], [...w.y], [...w.state]]);
    w.dirty = true; w.ball = 1; w.bx = -100;
    for (let k = 0; k < 120; k++) step(w);
    assert.equal(downCount(w), 0, "a pile fell over by itself");
    assert.equal(JSON.stringify([[...w.x], [...w.y], [...w.state]]), before, "stones moved at rest");
  }
});

test("same throw at the same moment, same result: the simulation is deterministic", () => {
  for (const level of [1, 5, 9, 12, 14, 15]) {
    for (const [angle, power] of [[0.2, 0.55], [0.5, 0.8], [-0.1, 1], [0.9, 0.4]]) {
      const a = createWorld(layoutOf(level)), b = createWorld(layoutOf(level));
      for (let k = 0; k < 37; k++) { idle(a); idle(b); }
      simulate(a, angle, power); simulate(b, angle, power);
      assert.equal(snapshot(a), snapshot(b), `level ${level} ${angle}/${power}`);
    }
  }
  assert.deepEqual(layoutOf(7), layoutOf(7));
  assert.notEqual(seedOf(1), seedOf(2));
});

test("every throw settles well before the safety stop, and nothing jitters once still", () => {
  for (const level of [1, 3, 7, 9, 13, 15]) {
    for (let a = 0; a < 7; a++) for (let p = 0; p < 5; p++) {
      const w = createWorld(layoutOf(level));
      simulate(w, ANGLE_MIN + (ANGLE_MAX - ANGLE_MIN) * a / 6, 0.15 + 0.85 * p / 4);
      assert.ok(w.steps < MAX_STEPS * 0.8, `level ${level}: settled in ${w.steps} steps`);
      assert.ok(![...w.state].includes(FLYING));
      for (let i = 0; i < STONES; i++) if (w.state[i] === LYING) {
        assert.ok(Math.abs(Math.sin(w.a[i])) < 1e-9, "a lying stone lies flat");
        assert.ok(w.y[i] + w.h[i] / 2 <= GROUND + 1e-6, "and never sinks into the ground");
      }
      const still = snapshot(w).replace(/,\d+\]$/, "]");
      for (let k = 0; k < 60; k++) step(w);
      assert.equal(snapshot(w).replace(/,\d+\]$/, "]"), still, "a settled world stays exactly still");
    }
  }
});

test("weight: the bottom of a tall pile is pinned by what rests on it; a heavy piece is pinned harder", () => {
  const w = createWorld(pileAt(300));
  assert.deepEqual([...Array(STONES).keys()].map(i => loadOn(w, i)), [6, 5, 4, 3, 2, 1, 0]);
  assert.ok(knockSpeed(w, 0) > knockSpeed(w, 6) * 3, "the base needs a much harder ball than the top");
  const heavy = createWorld(pileAt(300, 2));
  assert.ok(knockSpeed(heavy, 0) > knockSpeed(w, 0) * 1.8);
  // A soft roll into the base leaves the pile standing; a firm one takes all seven.
  const soft = createWorld(pileAt(200)), firm = createWorld(pileAt(200));
  simulate(soft, 0, 0.12); simulate(firm, -2 * DEG, 0.55);
  assert.equal(downCount(soft), 0, "a soft roll only nudges");
  assert.equal(downCount(firm), STONES, "a firm low hit brings the whole pile down");
  // A ball dropped gently on the top doesn't knock it.
  const drop = createWorld(pileAt(300));
  drop.ball = 1; drop.bx = drop.x[6]; drop.by = drop.y[6] - 30;
  while (!settled(drop)) step(drop);
  assert.equal(downCount(drop), 0);
  // The heavy base: the same firm throw that fells a plain pile leaves a কলসির কানা base standing.
  const plain = createWorld(pileAt(350)), kana = createWorld(pileAt(350, 2));
  simulate(plain, 2 * DEG, 0.62); simulate(kana, 2 * DEG, 0.62);
  assert.ok(downCount(kana) < downCount(plain), `${downCount(kana)} vs ${downCount(plain)}`);
});

test("the lane: mud stops a rolling ball, the clothesline catches a lob, মিঠু catches what reaches him", () => {
  const roll = (layout: Layout) => { const w = createWorld(layout); simulate(w, 0, 0.7); return w; };
  const open = roll({ stones: [], blocks: [] }), muddy = roll({ stones: [], blocks: [], mud: [[200, 300]] });
  assert.ok(open.bx > 400, `open lane rolls on to ${open.bx}`);
  assert.ok(muddy.bx < 310 && muddy.splats > 0, `mud stops it at ${muddy.bx}`);
  const line = createWorld({ stones: [], blocks: [], line: { x0: 50, x1: 440, y: 200 } });
  throwBall(line, 40 * DEG, 0.75);
  let peak = Infinity;
  while (!settled(line)) { step(line); peak = Math.min(peak, line.by); }
  assert.equal(line.lineHits, 1); assert.ok(peak > 200 - BALL_R, "never above the line");
  const guard = createWorld({ stones: [], blocks: [], guard: { x: 250, tall: 36, hop: 34, period: 96, air: 30, phase: 0 } });
  assert.ok(guardTop(guard, 15) < guardTop(guard, 60), "he is up mid-hop and down between");
  simulate(guard, 0, 0.8);
  assert.equal(guard.caught, 1); assert.equal(guard.held, 1); assert.equal(guard.ball, 2);
});

test("টুনি puts fallen pieces back bottom first, only between balls, at most her share per gap", () => {
  const w = createWorld({ ...pileAt(300), rebuild: { delay: 60, every: 42, most: 3 } });
  for (let k = 0; k < 200; k++) idle(w);
  assert.equal(w.restacked, 0, "nothing to stack before the first ball");
  simulate(w, -2 * DEG, 0.55);
  assert.equal(downCount(w), STONES);
  nextThrow(w);
  assert.ok(canRebuild(w));
  for (let k = 0; k < 59; k++) idle(w);
  assert.equal(w.restacked, 0, "she waits a moment");
  idle(w);
  assert.equal(w.restacked, 1);
  assert.equal(w.state[0], STANDING, "the bottom piece first");
  for (let k = 0; k < 500; k++) idle(w);
  assert.equal(w.restacked, 3, "three at most in one gap");
  assert.deepEqual([...w.state].slice(0, 3), [STANDING, STANDING, STANDING]);
  assert.equal(downCount(w), 4);
  throwBall(w, 0.5, 0.2);
  const during = w.restacked;
  while (!settled(w)) step(w);
  assert.equal(w.restacked, during, "never while a ball is in the air");
});

test("the preview's dots are the true start of the flight, and stop at the first thing the ball meets", () => {
  const out = new Float32Array(80), w = createWorld({ stones: [], blocks: [] });
  const count = trace(w, 0.6, 0.7, out, 40, 0.045);
  const first = out.slice(0, 6);
  assert.ok(count > 5);
  const fly = createWorld({ stones: [], blocks: [] });
  throwBall(fly, 0.6, 0.7);
  for (let k = 0; k < 8; k++) step(fly);
  const x8 = fly.bx; step(fly);
  assert.ok(Math.abs(first[4] - (x8 + (fly.bx - x8) * 0.1)) < 1.5, `${first[4]} vs ${x8}`);
  // On an empty lane the dots stop where the ball first reaches the ground.
  const vy = Math.sin(0.6) * speedOf(0.7), drop = GROUND - BALL_R - HAND_Y;
  const landing = (vy + Math.sqrt(vy * vy + 2 * G * drop)) / G;
  trace(w, 0.6, 0.7, out, 40, 0.045);
  assert.ok(Math.abs(traceTime - landing) < 0.02, `${traceTime} vs ${landing}`);
  const pile = createWorld(pileAt(220));
  trace(pile, 0, 0.9, out, 40, 0.045);
  assert.ok(traceTime < (220 - 23 - HAND_X) / speedOf(0.9) + 0.02, "a flat throw at a near pile stops at the pile");
});

test("a round: three balls, stars by balls, the end of each ball as events", () => {
  assert.deepEqual([1, 2, 3].map(starsOf), [3, 2, 1]);
  assert.equal(BALLS, 3);
  // The first throw (2° apart, power 5% apart) that takes all seven on level 1: there are plenty.
  let sure = [0, 0];
  for (let a = 0; a <= 40 && !sure[1]; a += 2) for (let p = 0.3; p <= 1 && !sure[1]; p += 0.05) {
    const w = createWorld(layoutOf(1));
    if (simulate(w, a * DEG, p) === STONES) sure = [a * DEG, p];
  }
  assert.ok(sure[1] > 0);
  const clear = createRound("level", 1);
  assert.ok(launch(clear, sure[0], sure[1]));
  assert.equal(launch(clear, 0, 1), false, "one ball at a time");
  let events = 0;
  while (!(events & E_SETTLE)) events = advance(clear);
  assert.ok(events & E_CLEAR); assert.equal(clear.phase, "done"); assert.equal(clear.balls, 1); assert.equal(clear.first, 7);
  const miss = createRound("level", 1);
  for (let ball = 0; ball < 3; ball++) {
    launch(miss, 70 * DEG, 0.1);
    events = 0;
    while (!(events & E_SETTLE)) events = advance(miss);
  }
  assert.ok(events & E_FAIL); assert.equal(miss.balls, 3); assert.equal(miss.cleared, false);
  // টুনি's piece shows as an event while aiming.
  const tuni = createRound("level", 12);
  launch(tuni, -1 * DEG, 0.75);
  events = 0;
  while (!(events & E_SETTLE)) events = advance(tuni);
  let back = 0;
  for (let k = 0; k < 400 && downCount(tuni.world) > 0; k++) if (advance(tuni) & E_BACK) back++;
  assert.ok(tuni.phase === "done" || back > 0, "pieces come back while you aim");
  // An old friend's pile opens exactly as it was.
  assert.deepEqual(createRound("old", 7).world.x, createWorld(oldLayoutOf(7)).x);
});
