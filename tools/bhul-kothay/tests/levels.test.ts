import assert from "node:assert/strict";
import test from "node:test";
import { PER_WORLD, STAGES, TEACH_SEED, stageAt, worldStart } from "../lib/levels";
import { makePuzzle } from "../lib/puzzle";
import { starsOf } from "../lib/round";
import { CASUAL, SHARP, play, sample } from "./bot";

const RUNS = 40;
const rates = new Map<number, { casual3: number; casual2: number; sharp3: number }>();
function ratesOf(level: number) {
  let found = rates.get(level);
  if (!found) {
    const stage = stageAt(level), casual = sample(level, CASUAL, RUNS), sharp = sample(level, SHARP, 24, 7);
    const share = (list: typeof casual, at: number) => list.filter(run => run.done && starsOf(stage, run.time, run.wrong) >= at).length / list.length;
    found = { casual3: share(casual, 3), casual2: share(casual, 2), sharp3: share(sharp, 3) };
    rates.set(level, found);
  }
  return found;
}

test("level 1 is won inside 10 seconds: the teaching pair nearly always, with a median near 6 s", () => {
  const teach = makePuzzle(1, TEACH_SEED), times: number[] = [];
  for (let seed = 1; seed <= 100; seed++) times.push(play(teach, CASUAL, seed).time);
  const quick = times.filter(time => time <= 10).length;
  assert.ok(quick >= 85, `teaching pair: ${quick}/100 inside 10 s`);
  assert.ok(times.sort((a, b) => a - b)[50] <= 7.5, `median ${times[50]}`);
  const fresh = sample(1, CASUAL, 60).filter(run => run.time <= 10).length / 60;
  assert.ok(fresh >= 0.8, `fresh pairs: ${fresh}`);
  assert.ok(ratesOf(1).casual3 >= 0.95);
});

test("every level: a casual player gets ★★ nearly always and ★★★ about half the time; a sharp eye gets ★★★", () => {
  for (const stage of STAGES.slice(1)) {
    const { casual3, casual2, sharp3 } = ratesOf(stage.level);
    assert.ok(casual2 >= 0.92, `level ${stage.level}: casual ★★ ${casual2}`);
    assert.ok(casual3 >= 0.3 && casual3 <= 0.8, `level ${stage.level}: casual ★★★ ${casual3}`);
    assert.ok(sharp3 >= 0.75, `level ${stage.level}: sharp ★★★ ${sharp3}`);
  }
});

test("each world's finale is its hardest picture for ★★★", () => {
  for (let world = 0; world < 6; world++) {
    const finale = worldStart(world) + PER_WORLD - 1, first = worldStart(world) + (world === 0 ? 1 : 0);
    assert.ok(ratesOf(finale).casual3 <= ratesOf(first).casual3 + 0.05, `world ${world + 1}: finale ${ratesOf(finale).casual3} vs ${ratesOf(first).casual3}`);
  }
});

test("the bot is deterministic: the same seed plays the same way", () => {
  const puzzle = makePuzzle(14, 321);
  assert.deepEqual(play(puzzle, CASUAL, 9), play(puzzle, CASUAL, 9));
});
