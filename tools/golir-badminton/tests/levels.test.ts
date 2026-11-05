// Every level played by headless bots over 40 seeds, with the target rates from ai_docs/game-dev/rewrites/golir-badminton.md.
import assert from "node:assert/strict";
import test from "node:test";
import { LEVEL_COUNT, LEVELS, PER_WORLD, isFinale, starsOf } from "../lib/levels";
import { botMatch, mashMatch, median, rate, CASUAL, SEEDS, SHARP, SMASHER, STEADY, type Skill } from "./bot";

const levels = Array.from({ length: LEVEL_COUNT }, (_, index) => index + 1);
const cache = new Map<string, ReturnType<typeof botMatch>[]>();
const runs = (level: number, skill: Skill, mode: "e" | "n" | "h" = "n") => {
  const key = `${level}${skill.name}${mode}`;
  if (!cache.has(key)) cache.set(key, SEEDS.map(seed => botMatch(level, seed, skill, mode)));
  return cache.get(key)!;
};
const wins = (list: ReturnType<typeof runs>) => rate(list.map(run => run.m.winner === 0));

test("level 1: a casual player wins nearly always, and wins a point within ten seconds", () => {
  const list = runs(1, CASUAL);
  assert.ok(wins(list) >= 0.95, `casual on level 1: ${wins(list)}`);
  const first = median(list.map(run => run.firstPoint).filter(t => t > 0));
  assert.ok(first <= 10, `first point after ${first} s`);
  assert.ok(median(list.map(run => run.time)) <= 45, "the whole first match is short");
});

test("level 1 is never won by one-hit smashes: every point won comes after a rally of at least three hits", () => {
  for (const skill of [SMASHER, SHARP, CASUAL]) {
    for (const run of runs(1, skill)) for (const rally of run.rallies) assert.ok(rally >= 3, `${skill.name}: a point won on hit ${rally}`);
  }
});

test("world 1: a casual player can clear every level, the finale is the hardest of the world", () => {
  const rates = [1, 2, 3, 4].map(level => wins(runs(level, CASUAL)));
  for (const [index, value] of rates.entries()) assert.ok(value >= 0.4, `casual on level ${index + 1}: ${value}`);
  assert.ok(rates[3] <= Math.min(...rates.slice(0, 3)), `finale ${rates[3]} vs ${rates}`);
});

test("a steady player wins every level at least 60% of the time, and the last level 50–95%", () => {
  for (const level of levels) {
    const value = wins(runs(level, STEADY));
    assert.ok(value >= 0.6, `steady on level ${level}: ${value}`);
    if (level === LEVEL_COUNT) assert.ok(value >= 0.5 && value <= 0.95, `steady on the last level: ${value}`);
  }
});

test("a sharp player wins every level at least 90% of the time and earns three stars often", () => {
  let three = 0;
  for (const level of levels) {
    const list = runs(level, SHARP);
    assert.ok(wins(list) >= 0.9, `sharp on level ${level}: ${wins(list)}`);
    three += rate(list.map(run => run.m.winner === 0 && starsOf(run.m.them, level) === 3));
  }
  assert.ok(three / LEVEL_COUNT >= 0.5, `sharp three-star rate ${three / LEVEL_COUNT}`);
});

test("every finale is harder for a casual player than its world's first level", () => {
  for (let world = 0; world < 3; world++) {
    const first = world * PER_WORLD + 1, finale = first + PER_WORLD - 1;
    assert.ok(isFinale(LEVELS[finale - 1]));
    const a = wins(runs(first, CASUAL)), b = wins(runs(finale, CASUAL));
    assert.ok(b < a, `world ${world + 1}: finale ${b} vs first ${a}`);
  }
});

test("সহজ really is easier: a casual player clears every level at least half the time", () => {
  for (const level of levels) {
    const value = wins(runs(level, CASUAL, "e"));
    assert.ok(value >= 0.5, `casual on easy level ${level}: ${value}`);
    assert.ok(value >= wins(runs(level, CASUAL)), `easy is no harder on level ${level}`);
  }
});

test("mashing never wins", () => {
  for (const level of [1, 4, 8, 12]) assert.equal(rate(SEEDS.map(seed => mashMatch(level, seed).winner === 0)), 0, `level ${level}`);
});

test("the drop beats মামা: against him a player who drops wins in fewer points given than one who only clears", () => {
  const only: Skill = { ...STEADY, name: "clears", smash: 0, drop: 0 }, drops: Skill = { ...STEADY, name: "drops", smash: 0, drop: 0.6 };
  const given = (skill: Skill) => SEEDS.reduce((sum, seed) => sum + botMatch(3, seed, skill).m.them, 0);
  assert.ok(given(drops) < given(only), `${given(drops)} vs ${given(only)}`);
});
