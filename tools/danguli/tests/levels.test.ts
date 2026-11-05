// Every level played by headless bots over 60 seeds, with the target rates from ai_docs/game-dev/rewrites/danguli.md.
import assert from "node:assert/strict";
import test from "node:test";
import { LEVEL_COUNT, LEVELS, PER_WORLD, isFinale, levelDef, starsOf, type Mode } from "../lib/levels";
import { botRound, mashRound, median, rate, CASUAL, MIDDLE, SEEDS, SHARP, STEADY, type Skill } from "./bot";

const levels = Array.from({ length: LEVEL_COUNT }, (_, index) => index + 1);
const cache = new Map<string, ReturnType<typeof botRound>[]>();
const runs = (level: number, skill: Skill, mode: Mode = "n") => {
  const key = `${level}${skill.name}${mode}`;
  if (!cache.has(key)) cache.set(key, SEEDS.map(seed => botRound(level, seed, skill, mode)));
  return cache.get(key)!;
};
const wins = (list: ReturnType<typeof runs>) => rate(list.map(run => run.r.total > run.r.def.target));
const mean = (list: ReturnType<typeof runs>) => list.reduce((sum, run) => sum + run.r.total, 0) / list.length;

test("level 1: a casual player wins nearly always, and passes the neighbour within ten seconds", () => {
  const list = runs(1, CASUAL);
  assert.ok(wins(list) >= 0.97, `casual on level 1: ${wins(list)}`);
  const passed = median(list.map(run => run.passedAt).filter(t => t > 0));
  assert.ok(passed <= 10, `passed after ${passed} s`);
});

test("পাড়ার মাঠ: a casual player clears every level at least 55% of the time", () => {
  for (const level of [1, 2, 3, 4]) assert.ok(wins(runs(level, CASUAL)) >= 0.55, `casual on level ${level}: ${wins(runs(level, CASUAL))}`);
});

test("a steady player wins every level at least 60% of the time, and the last level 50–90%", () => {
  for (const level of levels) {
    const value = wins(runs(level, STEADY));
    assert.ok(value >= 0.6, `steady on level ${level}: ${value}`);
    if (level === LEVEL_COUNT) assert.ok(value >= 0.5 && value <= 0.9, `steady on the last level: ${value}`);
  }
});

test("a sharp player wins every level at least 75% of the time and earns three stars about half the time", () => {
  let three = 0;
  for (const level of levels) {
    const list = runs(level, SHARP);
    assert.ok(wins(list) >= 0.75, `sharp on level ${level}: ${wins(list)}`);
    three += rate(list.map(run => starsOf(run.r.total, level) === 3));
  }
  assert.ok(three / LEVEL_COUNT >= 0.45, `sharp three-star rate ${three / LEVEL_COUNT}`);
});

test("every finale is harder for a casual player than its মাঠ's first level", () => {
  for (let world = 0; world < 3; world++) {
    const first = world * PER_WORLD + 1, finale = first + PER_WORLD - 1;
    assert.ok(isFinale(LEVELS[finale - 1]));
    const a = wins(runs(first, CASUAL)), b = wins(runs(finale, CASUAL));
    assert.ok(b < a, `world ${world + 1}: finale ${b} vs first ${a}`);
  }
});

test("reading the field matters: with the captain, sand, the long arm, wet grass or walkers, a reader beats a player who always aims the middle", () => {
  for (const level of [4, 6, 8, 9, 11]) {
    const reader = mean(runs(level, STEADY)), middle = mean(runs(level, MIDDLE));
    assert.ok(reader > middle, `level ${level}: reader ${reader.toFixed(1)} vs middle ${middle.toFixed(1)}`);
  }
});

test("সহজ really is easier: a casual player wins every level at least as often, and at least 60%", () => {
  for (const level of levels) {
    const easy = wins(runs(level, CASUAL, "e"));
    assert.ok(easy >= 0.6, `casual on easy level ${level}: ${easy}`);
    assert.ok(easy + 0.05 >= wins(runs(level, CASUAL)), `easy is no harder on level ${level}`);
  }
});

test("mashing never wins", () => {
  for (const level of [1, 4, 8, 12]) assert.equal(rate(SEEDS.map(seed => mashRound(level, seed).total > levelDef(level).target)), 0, `level ${level}`);
});
