// Difficulty by headless rowers: each level is tuned so a person of a given skill places at the promised rate.
// The rowers (tests/bot.ts) tap with a wobble and steer with a reaction time, over the same 40 seeds every run.
import assert from "node:assert/strict";
import test from "node:test";
import { LEVEL_COUNT, LEVELS, MODE_INFO, starsForRank, type Mode } from "../lib/levels";
import { SLOW_TIME } from "../lib/rowing";
import { BLIND, IDLE, MASHER, SEEDS, SHAKY, SHARP, STEADY, median, rowRace, type Skill } from "./bot";

type Rates = { top3: number; first: number; fourth: number; time: number };
const cache = new Map<string, Rates>();
function rates(level: number, skill: Skill, mode: Mode = "n", scale = 1): Rates {
  const key = `${level}|${skill.name}|${mode}|${scale}`;
  let found = cache.get(key);
  if (!found) {
    let top3 = 0, first = 0, fourth = 0;
    const times: number[] = [];
    for (const seed of SEEDS) { const race = rowRace(level, seed, skill, mode, false, scale); if (race.rank <= 3) top3++; if (race.rank === 1) first++; if (race.rank === 4) fourth++; times.push(race.tenths / 10); }
    found = { top3: top3 / SEEDS.length, first: first / SEEDS.length, fourth: fourth / SEEDS.length, time: median(times) };
    cache.set(key, found);
  }
  return found;
}
const all = Array.from({ length: LEVEL_COUNT }, (_, index) => index + 1);
const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

test("race 1: a shaky first-timer places and finishes in about ten seconds; someone who never taps does not place", () => {
  const shaky = rates(1, SHAKY);
  assert.ok(shaky.top3 >= 0.95, `shaky places ${shaky.top3}`);
  assert.ok(shaky.first >= 0.6, `and wins ${shaky.first}`);
  assert.ok(shaky.time <= 10, `in ${shaky.time} s`);
  assert.ok(rates(1, STEADY).first >= 0.85);
  assert.ok(rates(1, IDLE).fourth >= 0.85, "no taps on the drum, no place");
  assert.ok(rates(1, SHARP).time >= 8, "and it is not over in a blink");
});

test("a steady rower places in every race of the first world nearly always, in every race most of the time, and rarely wins the last", () => {
  for (const level of [1, 2, 3, 4]) assert.ok(rates(level, STEADY).top3 >= 0.88, `race ${level}: ${rates(level, STEADY).top3}`);
  for (const level of all) assert.ok(rates(level, STEADY).top3 >= 0.6, `race ${level}: ${rates(level, STEADY).top3}`);
  assert.ok(rates(12, STEADY).first <= 0.45, `${rates(12, STEADY).first}`);
});

test("a sharp rower places nearly everywhere, wins most races and about half the last", () => {
  for (const level of all) {
    assert.ok(rates(level, SHARP).top3 >= 0.88, `race ${level}: ${rates(level, SHARP).top3}`);
    assert.ok(rates(level, SHARP).first >= 0.4, `race ${level} wins: ${rates(level, SHARP).first}`);
  }
  const last = rates(12, SHARP).first;
  assert.ok(last >= 0.35 && last <= 0.75, `last race ${last}`);
});

test("each world is harder than the one before for the same rower", () => {
  const world = (index: number, skill: Skill) => mean(LEVELS.map((def, at) => def.world === index ? rates(at + 1, skill).first : NaN).filter(Number.isFinite));
  for (const skill of [SHAKY, STEADY]) {
    assert.ok(world(0, skill) > world(1, skill) && world(1, skill) > world(2, skill) - 0.02, `${skill.name}: ${world(0, skill)} ${world(1, skill)} ${world(2, skill)}`);
    assert.ok(world(0, skill) > world(2, skill) + 0.1);
  }
});

test("tapping at random never wins, never taps never wins, and both do worse than a steady rower", () => {
  for (const level of all) {
    assert.equal(rates(level, MASHER).first, 0, `mashing wins race ${level}`);
    assert.equal(rates(level, IDLE).first, 0, `idling wins race ${level}`);
  }
  assert.ok(mean(all.map(level => rates(level, MASHER).top3)) < mean(all.map(level => rates(level, STEADY).top3)) - 0.2);
  assert.ok(mean(all.map(level => rates(level, IDLE).top3)) < 0.2);
});

test("steering matters: with perfect taps, never dodging wins far less once the champions arrive", () => {
  for (const level of [4, 8]) assert.ok(rates(level, BLIND).first <= 0.15, `race ${level}: ${rates(level, BLIND).first}`);
  assert.ok(mean(all.slice(1).map(level => rates(level, SHARP).first)) > mean(all.slice(1).map(level => rates(level, BLIND).first)) + 0.2);
});

test("সহজ places more often, কঠিন less; easy never gives three stars; slow mode is mild and the windows keep their milliseconds", () => {
  const rate = (mode: Mode) => mean(all.map(level => rates(level, STEADY, mode).first));
  assert.ok(rate("e") > rate("n") + 0.05, `${rate("e")} ${rate("n")}`);
  assert.ok(rate("h") < rate("n") - 0.05, `${rate("h")} ${rate("n")}`);
  assert.deepEqual([1, 2, 3, 4].map(rank => starsForRank(rank, "e")), [2, 2, 1, 0]);
  assert.deepEqual([1, 2, 3, 4].map(rank => starsForRank(rank, "n")), [3, 2, 1, 0]);
  assert.ok(MODE_INFO.e.maxStars === 2 && MODE_INFO.h.maxStars === 3);
  // Slow mode gives more time to read the river, which is its job. It must stay mild: stars are not made easy by it.
  const slow = mean(all.map(level => rates(level, STEADY, "n", SLOW_TIME).first)), normal = mean(all.map(level => rates(level, STEADY).first));
  assert.ok(slow <= normal + 0.12, `slow wins ${slow} against ${normal}`);
});
