// The river's rules against the pure sim the component runs: generation, fairness, the careful solver, hops, splashes, the current, the wake, the ferry,
// the danger senses and the foot of each mode.
import assert from "node:assert/strict";
import test from "node:test";
import { modeOf, MODES } from "../lib/levels";
import {
  dipOf, floaterAt, holds, leftOf, levelSeed, makeRiver, mangoCount, minTenths, specOf, starsOf, tenths,
  ARRIVED, BANK, BLOCKED, CHAR, COLS, DIP_PERIOD, DIP_UNDER, DIP_WARN, DOWN, EDGE, EDGY, FERRY, FERRY_IN, HOP_T, HOPPED, LEFT, LEVEL_COUNT, MANGO, MAX_TENTHS, NEAR,
  PANA, PAR, RESPAWNED, RIGHT, RING, SPLASHED, START_X, UP, VELA, WATER, type Lane, type River,
} from "../lib/river";
import { createRun, type Run } from "../lib/run";
import { allMangoTime, crossTime } from "../lib/solve";
import { act, drain, stepRun, DANGER_S } from "../lib/step.hot";
import { DANGER } from "../lib/river";
import { nearLine } from "../lib/result";
import { DT } from "./bot";

const rivers = Array.from({ length: LEVEL_COUNT }, (_, index) => makeRiver(index + 1));
const RESPAWN_T = modeOf(1).respawn;

/** A tiny hand-made river for rule tests: start bank, the given water lanes, goal bank. */
function custom(lanes: Partial<Lane>[], mangoes: River["mangoes"] = []): River {
  const land = (type: number): Lane => ({ type, dir: 1, speed: 0, floaters: [], wake: false, ring: RING });
  return { level: 1, seed: levelSeed(1), lanes: [land(BANK), ...lanes.map(lane => ({ ...land(WATER), ...lane }) as Lane), land(BANK)], mangoes, rain: false, par: 10, ferry: false };
}
/** Steps until the run settles (no hop in the air, not in the water) or `seconds` pass; returns every event seen. */
function settle(run: Run, seconds = 2) {
  let events = drain(run);
  for (let t = 0; t < seconds && (run.hop > 0 || run.down > 0 || run.falling); t += DT) { stepRun(run, DT); events |= drain(run); }
  return events;
}
/** A floater sitting still under the boy's column. */
const raft = (at = START_X - 1 + (RING - COLS) / 2, len = 2, kind = VELA) => ({ kind, at, len, dip: -1 });

test("the same level gives the same river; different levels differ", () => {
  assert.deepEqual(makeRiver(7), makeRiver(7));
  assert.deepEqual(makeRiver(23, 555), makeRiver(23, 555));
  assert.notDeepEqual(makeRiver(7).lanes, makeRiver(8).lanes);
  assert.notDeepEqual(makeRiver(7, 1).lanes, makeRiver(7, 2).lanes);
  for (let level = 1; level <= LEVEL_COUNT; level++) assert.equal(rivers[level - 1].seed, levelSeed(level));
});

test("every river is built fairly: banks at both ends, opposite currents side by side, no wide gaps, the first hop lands", () => {
  for (const river of rivers) {
    const spec = specOf(river.level), lanes = river.lanes;
    assert.equal(lanes[0].type, BANK); assert.equal(lanes.at(-1)!.type, BANK);
    assert.equal(lanes.filter(lane => lane.type === WATER).length, spec.water, `river ${river.level}`);
    assert.equal(lanes.filter(lane => lane.type === CHAR).length, spec.chars);
    assert.equal(lanes.some(lane => lane.floaters.some(floater => floater.kind === FERRY)), spec.ferry);
    assert.equal(lanes.filter(lane => lane.wake).length, spec.wake);
    for (let row = 1; row < lanes.length - 1; row++) {
      const lane = lanes[row];
      if (lane.type !== WATER) continue;
      if (lanes[row + 1].type === WATER) assert.notEqual(lane.dir, lanes[row + 1].dir, `river ${river.level} rows ${row}/${row + 1} flow the same way`);
      assert.ok(lane.floaters.length >= 2 && lane.speed > 0 && lane.speed < 3);
      const sorted = [...lane.floaters].sort((a, b) => a.at - b.at);
      sorted.forEach((floater, index) => {
        const next = sorted[(index + 1) % sorted.length];
        const gap = (((next.at - floater.at - floater.len) % lane.ring) + lane.ring) % lane.ring;
        assert.ok(gap >= spec.gap[0] - 1e-6 && gap <= spec.gap[1] + 1e-6, `river ${river.level} row ${row} gap ${gap.toFixed(2)}`);
      });
    }
    assert.ok(holds(lanes[1], START_X, 0, -0.5), `river ${river.level}: the first hop must land`);
    assert.equal(river.mangoes.length, mangoCount(river.level));
    for (const mango of river.mangoes) assert.ok(lanes[mango.row].type !== BANK && !lanes[mango.row].wake && !lanes[mango.row].floaters.some(f => f.kind === FERRY && mango.floater >= 0 && lanes[mango.row].floaters[mango.floater] === f));
  }
});

test("a careful player crosses every river, from the start and after a splash on any bank or চর, whenever they begin", () => {
  for (const river of rivers) {
    river.lanes.forEach((lane, row) => {
      if (lane.type === WATER || row === river.lanes.length - 1) return;
      for (const t of [0, 3.7, 9.1]) for (const x of row === 0 ? [START_X] : [1.5, START_X, 7.5]) {
        const seconds = crossTime(river, { row, x, t });
        assert.ok(seconds !== null && seconds < 60, `river ${river.level} from row ${row} x ${x} at ${t}s: ${seconds}`);
      }
    });
  }
});

test("the careful player is not a pushover: it refuses a river nobody could stand on", () => {
  const sliver = custom([{ dir: 1, speed: 1, floaters: [{ kind: VELA, at: 3, len: 0.3, dip: -1 }, { kind: VELA, at: 11, len: 0.3, dip: -1 }] }]);
  assert.equal(crossTime(sliver), null);
});

test("every mango can be picked up, and the time star is in reach with every mango", () => {
  for (const river of rivers) {
    const perfect = allMangoTime(river);
    assert.ok(perfect !== null, `river ${river.level}: a mango is out of reach`);
    // PAR is recomputed from the careful player, so changing the river generator can't silently break the stars.
    assert.equal(PAR[river.level - 1], Math.ceil(perfect * 1.25 + river.lanes.length * 0.9 + 2), `river ${river.level}`);
    assert.equal(starsOf(river, perfect, river.mangoes.length), 3);
  }
});

test("stars: one for crossing, one for the time, one for every mango", () => {
  const river = rivers[4];
  assert.equal(starsOf(river, river.par + 5, 0), 1);
  assert.equal(starsOf(river, river.par, 0), 2);
  assert.equal(starsOf(river, river.par + 0.1, river.mangoes.length), 2);
  assert.equal(starsOf(river, river.par - 1, river.mangoes.length), 3);
  assert.equal(tenths(12.34), 123);
  assert.equal(tenths(0), 1);
  assert.equal(tenths(5000), MAX_TENTHS);
  assert.equal(nearLine(PAR[4] * 10 + 24, mangoCount(5), 5), "আর ২.৪ সেকেন্ড আগে পৌঁছালেই আরেকটা তারা।");
  assert.equal(nearLine(PAR[4] * 10, mangoCount(5) - 1, 5), "আর ১টা আম তুললেই আরেকটা তারা।");
  assert.match(nearLine(PAR[4] * 10 + 5, 0, 5), /^আরেকটা তারা: ০.৫ সেকেন্ড আগে পৌঁছাও, বা আরও ২টা আম তোলো।$/);
  assert.equal(nearLine(10, mangoCount(5), 5), "");
});

test("a hop onto empty water is a splash, then back on the last bank", () => {
  const river = custom([{ dir: 1, speed: 0.0001, floaters: [raft(0)] }]);
  const run = createRun(river);
  assert.equal(act(run, UP), true);
  assert.equal(run.falling, true);
  let events = settle(run);
  assert.ok(events & HOPPED && events & SPLASHED && events & RESPAWNED);
  assert.equal(run.splashes, 1); assert.equal(run.row, 0); assert.equal(run.x, START_X);
  assert.ok(run.t >= HOP_T + RESPAWN_T - 0.02);
  // A miss by a hair gets the kinder word.
  const hair = custom([{ dir: 1, speed: 0.0001, floaters: [raft(START_X + 0.3 + (RING - COLS) / 2)] }]);
  const close = createRun(hair);
  act(close, UP);
  events = settle(close);
  assert.ok(events & SPLASHED && events & NEAR);
});

test("standing on a raft carries you; past the screen's edge the current takes you", () => {
  const river = custom([{ dir: 1, speed: 1.5, floaters: [raft(), raft(12)] }]);
  const run = createRun(river);
  act(run, UP); settle(run);
  assert.equal(run.row, 1);
  const before = run.x;
  stepRun(run, 0.5); drain(run);
  assert.ok(Math.abs(run.x - before - 0.75) < 1e-6);
  let events = 0;
  for (let t = 0; t < 6 && !(events & SPLASHED); t += DT) { stepRun(run, DT); events |= drain(run); }
  assert.ok(events & SPLASHED);
  assert.ok(run.splashX > COLS);
});

test("কচুরিপানা in the wake sinks on its rhythm and drops you", () => {
  const pana = { kind: PANA, at: START_X - 1 + (RING - COLS) / 2, len: 2, dip: 0 };
  const river = custom([{ dir: 1, speed: 0.0001, floaters: [pana], wake: true }]);
  assert.equal(dipOf(pana, 0), 0);
  assert.ok(dipOf(pana, DIP_PERIOD - DIP_UNDER - DIP_WARN / 2) > 0 && dipOf(pana, DIP_PERIOD - DIP_UNDER - DIP_WARN / 2) < 1);
  assert.equal(dipOf(pana, DIP_PERIOD - DIP_UNDER / 2), 1);
  assert.equal(floaterAt(river.lanes[1], START_X, DIP_PERIOD - 0.5), -1);
  const run = createRun(river);
  act(run, UP); settle(run);
  assert.equal(run.row, 1);
  let events = 0;
  for (let t = 0; t < DIP_PERIOD && !(events & SPLASHED); t += DT) { stepRun(run, DT); events |= drain(run); }
  assert.ok(events & SPLASHED);
  assert.ok(run.t >= DIP_PERIOD - DIP_UNDER - 0.05 && run.t <= DIP_PERIOD - DIP_UNDER + 0.05);
});

test("edges, the start bank, a queued hop, mangoes, a landing past the end and arrival", () => {
  const river = custom([{ dir: 1, speed: 0.0001, floaters: [raft(), raft(12)] }], [{ row: 1, floater: 0, offset: 1, x: 0 }]);
  const run = createRun(river);
  assert.equal(act(run, DOWN), false);
  assert.ok(drain(run) & BLOCKED);
  for (let i = 0; i < 4; i++) { act(run, LEFT); settle(run); }
  assert.equal(run.x, 0.5);
  assert.equal(act(run, LEFT), false);
  for (let i = 0; i < 4; i++) { act(run, RIGHT); settle(run); }
  assert.equal(run.x, START_X);
  // Up, and up again while still in the air: the second hop waits for the landing.
  const before = run.t;
  act(run, UP); act(run, UP);
  assert.equal(run.queued, UP);
  const events = settle(run, 1) | (() => { let more = 0; for (let t = 0; t < 1 && !run.done; t += DT) { stepRun(run, DT); more |= drain(run); } return more; })();
  assert.ok(events & MANGO, "picked the mango on the way");
  assert.ok(events & ARRIVED);
  assert.equal(run.done, true); assert.equal(run.got, 1); assert.equal(run.row, 2);
  assert.ok(Math.abs(run.time - before - 2 * HOP_T) < 0.05);

  const edge = custom([{ dir: 1, speed: 0.0001, floaters: [raft(START_X + 0.1 + (RING - COLS) / 2)] }]);
  const slide = createRun(edge);
  act(slide, UP);
  assert.ok(drain(slide) & EDGY);
  assert.ok(slide.x > START_X && slide.falling === false, "slides onto the raft");
});

test("the ferry announces itself once as it comes into view", () => {
  const river = rivers[12];
  assert.ok(river.ferry);
  const run = createRun(river);
  let horns = 0;
  for (let t = 0; t < 40; t += DT) { stepRun(run, DT); if (drain(run) & FERRY_IN) horns++; }
  const lane = river.lanes.find(each => each.floaters.some(floater => floater.kind === FERRY))!;
  const loops = 40 * lane.speed / lane.ring;
  assert.ok(horns >= Math.floor(loops) - 1 && horns <= Math.ceil(loops) + 1, `${horns} horns in ${loops.toFixed(1)} loops`);
});


test("leftOf and floaterAt agree near the loop's seam", () => {
  const lane: Lane = { type: WATER, dir: -1, speed: 1, floaters: [{ kind: VELA, at: 0.5, len: 2, dip: -1 }], wake: false, ring: RING };
  for (let t = 0; t < 20; t += 0.37) {
    const left = leftOf(lane, lane.floaters[0], t);
    if (left > 0.3 && left + 2 < COLS - 0.3) { assert.equal(floaterAt(lane, left + 1, t, 0), 0); assert.equal(floaterAt(lane, left - 0.5, t, 0), -1); }
  }
});

test("danger at the edge: the current carrying you off raises it in the last DANGER_S seconds, once, and it clears on a new row", () => {
  const river = custom([{ dir: 1, speed: 1, floaters: [raft(), raft(12)] }, { dir: -1, speed: 0.0001, floaters: [raft(), raft(12)] }]);
  const run = createRun(river);
  act(run, UP); settle(run);
  assert.equal(run.edge, 0, "mid-river: no danger");
  let raised = 0, first = -1;
  for (let t = 0; t < 8 && !run.edge; t += DT) { stepRun(run, DT); if (drain(run) & DANGER) { raised++; first = run.t; } }
  assert.equal(raised, 1);
  assert.equal(run.edgeSide, 1, "the right edge, where this lane's current runs");
  const seconds = (COLS + EDGE - run.x) / 1;
  assert.ok(seconds <= DANGER_S + 0.05 && seconds >= DANGER_S - 0.1, `${seconds.toFixed(2)} s from the edge when it starts`);
  const level = run.edge;
  for (let t = 0; t < 0.5; t += DT) { stepRun(run, DT); assert.equal(drain(run) & DANGER, 0, "no second warning"); }
  assert.ok(run.edge > level, "it grows as the edge nears");
  act(run, UP); settle(run);
  assert.equal(run.edge, 0, "a slow lane: safe again");
  // A bank is never danger, and a splash clears it.
  const edgy = createRun(custom([{ dir: -1, speed: 2, floaters: [raft(START_X - 1 + (RING - COLS) / 2, 3)] }]));
  act(edgy, UP); settle(edgy);
  for (let t = 0; t < 6 && !(drain(edgy) & SPLASHED); t += DT) stepRun(edgy, DT);
  assert.equal(edgy.edge, 0);
  assert.equal(edgy.edgeSide, 0);
});

test("a sinking কচুরিপানা under your feet raises the sink warning before it drops you", () => {
  const pana = { kind: PANA, at: START_X - 1 + (RING - COLS) / 2, len: 2, dip: 0 };
  const river = custom([{ dir: 1, speed: 0.0001, floaters: [pana], wake: true }]);
  const run = createRun(river);
  act(run, UP); settle(run);
  let warned = 0, dropped = -1;
  for (let t = 0; t < DIP_PERIOD && dropped < 0; t += DT) { stepRun(run, DT); if (run.sink > 0 && !warned) warned = run.t; if (drain(run) & SPLASHED) dropped = run.t; }
  assert.ok(warned > 0 && dropped > warned, "the warning comes first");
  assert.ok(dropped - warned <= DIP_WARN + 0.1 && dropped - warned >= DIP_WARN - 0.2, `${(dropped - warned).toFixed(2)} s of warning`);
  assert.equal(run.sink, 0, "gone with the splash");
});

test("the foot: a wider grip holds a landing a narrower one drops, and the water keeps you for the mode's seconds", () => {
  // A one-cell raft whose right end is 0.3 left of the landing spot: inside the easy grip (0.4), outside normal (0.25) and hard (0.1).
  const end = START_X + (RING - COLS) / 2 - 0.3 - 1;
  const river = custom([{ dir: 1, speed: 0.0001, floaters: [{ kind: VELA, at: end, len: 1, dip: -1 }] }]);
  const easy = createRun(river, 0), normal = createRun(river, 1), hard = createRun(river, 2);
  assert.equal(act(easy, UP), true); assert.equal(easy.falling, false, "সহজ: the end of a ভেলা still holds you");
  assert.equal(act(normal, UP), true); assert.equal(normal.falling, true, "স্বাভাবিক: past the end is water");
  assert.equal(act(hard, UP), true); assert.equal(hard.falling, true);
  for (const mode of [1, 2]) {
    const fresh = createRun(river, mode);
    act(fresh, UP);
    const t0 = fresh.t;
    settle(fresh, 3);
    assert.ok(Math.abs(fresh.t - t0 - HOP_T - MODES[mode].respawn) < 0.03, `mode ${mode}: ${(fresh.t - t0).toFixed(2)} s`);
    assert.equal(fresh.mode, mode);
  }
  assert.deepEqual(MODES.map(mode => mode.respawn), [0.45, 0.7, 1]);
});

test("the run counts every hop and the best quick streak; the result belongs to the river that was crossed", () => {
  const river = makeRiver(1);
  const run = createRun(river);
  assert.equal(run.river.level, 1);
  // Hop only when it holds (the careful solver's moves would be overkill here): a bot that waits for the next row.
  for (let t = 0; t < 30 && !run.done; t += DT) {
    stepRun(run, DT); drain(run);
    if (run.hop === 0 && !run.falling && run.down === 0 && run.row < river.lanes.length - 1 && holds(river.lanes[run.row + 1], run.x, run.t + 0.05, -0.3)) act(run, UP);
  }
  assert.ok(run.done);
  assert.equal(run.hops, river.lanes.length - 1, "one hop per row on a clean crossing");
  assert.ok(run.bestChain >= 2 && run.bestChain <= run.hops);
  assert.equal(run.river.level, 1, "whatever the page shows meanwhile, the run keeps its own river");
});

test("PAR and the rivers' physical makeup are unchanged by the rewrite (links and stars keep their meaning)", () => {
  assert.equal(PAR.length, 30);
  assert.equal(levelSeed(1), 8919); assert.equal(levelSeed(30), 1000 + 30 * 7919);
  assert.deepEqual(rivers.map(river => river.lanes.length - 2 - river.lanes.filter(lane => lane.type === CHAR).length), rivers.map(river => specOf(river.level).water));
  assert.equal(minTenths(1), Math.floor(3 * HOP_T * 10));
});
