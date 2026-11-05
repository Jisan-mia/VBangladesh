// Every level is fair and teaches one thing: a solver proves each one flyable without a pop, and headless bots (bot.ts)
// play each level over many seeds; the rates the design promises are asserted here (ai_docs/game-dev/rewrites/tarer-fanke-belun.md).
import assert from "node:assert/strict";
import test from "node:test";
import { BOSS_NAME, LEVEL_COUNT, LEVELS, levelDef, starsOf, type Mode } from "../lib/levels";
import { CASUAL, play, percentile, SKILLED, solve, type Skill } from "./bot";

const SEEDS = Array.from({ length: 40 }, (_, index) => 7919 * (index + 1));
type Rates = { clear: number; three: number; median: number };
function rates(level: number, mode: Mode, skill: Skill, seeds = SEEDS, slow = false): Rates {
  let clear = 0, three = 0;
  const times: number[] = [];
  for (const seed of seeds) {
    const outcome = play(seed, level, mode, skill, slow);
    if (!outcome.won) continue;
    clear++; times.push(outcome.time);
    if (starsOf(true, outcome.lost, outcome.grazes, level, mode) === 3) three++;
  }
  times.sort((a, b) => a - b);
  return { clear: clear / seeds.length, three: three / seeds.length, median: times.length ? percentile(times, 0.5) : Infinity };
}
const table = new Map<string, Rates>();
const cached = (level: number, skill: Skill) => {
  const key = `${level}${skill.name}`;
  if (!table.has(key)) table.set(key, rates(level, "n", skill));
  return table.get(key)!;
};

test("every level can be flown without losing a balloon, in every mode (a beam-search solver finds the way)", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    for (const seed of [11, 7919, 31337, 900001]) assert.ok(solve(seed, level, "n").won, `level ${level} seed ${seed}`);
    for (const seed of [4242, 123457]) assert.ok(solve(seed, level, "h").won, `level ${level} hard seed ${seed}`);
    assert.ok(solve(level * 101, level, "e").won, `level ${level} easy`);
  }
});

test("level 1: the first win comes within 10 seconds, and everyone who plays clears it", () => {
  const casual = cached(1, CASUAL);
  assert.ok(casual.median <= 10, `casual median ${casual.median.toFixed(1)} s`);
  assert.equal(casual.clear, 1);
});

test("normal: the casual bot clears every World 1 level on ≥ 90% of seeds and every level on ≥ 60%", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const { clear } = cached(level, CASUAL), floor = levelDef(level).world === 0 ? 0.9 : 0.6;
    assert.ok(clear >= floor, `level ${level}: casual clears ${(clear * 100).toFixed(0)}%`);
  }
});

test("normal: the skilled bot clears every level on ≥ 95% of seeds and gets three stars on most", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const { clear, three } = cached(level, SKILLED);
    assert.ok(clear >= 0.95, `level ${level}: skilled clears ${(clear * 100).toFixed(0)}%`);
    assert.ok(three >= 0.75, `level ${level}: skilled 3 stars ${(three * 100).toFixed(0)}%`);
  }
});

test("skill shows: never touching or holding the whole time loses every level", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) for (const seed of SEEDS.slice(0, 5)) {
    assert.equal(play(seed, level, "n", "idle").won, false, `level ${level} idle`);
    assert.equal(play(seed, level, "n", "holder").won, false, `level ${level} holder`);
  }
});

test("the worlds get harder, and each finale is the hardest of its world for the casual bot", () => {
  const mean = (world: number) => {
    const levels = LEVELS.map((def, index) => ({ def, level: index + 1 })).filter(({ def }) => def.world === world);
    return levels.reduce((sum, { level }) => sum + cached(level, CASUAL).clear, 0) / levels.length;
  };
  assert.ok(mean(0) > mean(1) && mean(0) > mean(2), `World 1 ${mean(0).toFixed(2)}, World 2 ${mean(1).toFixed(2)}, World 3 ${mean(2).toFixed(2)}`);
  for (let world = 0; world < 3; world++) {
    const levels = LEVELS.map((def, index) => ({ def, level: index + 1 })).filter(({ def }) => def.world === world);
    const finale = cached(levels[3].level, CASUAL).clear;
    for (const { level } of levels.slice(0, 3)) assert.ok(finale <= cached(level, CASUAL).clear + 0.05, `world ${world + 1}: finale ${finale} vs level ${level}`);
  }
  assert.ok(cached(12, CASUAL).three <= cached(1, CASUAL).three);
});

test("easy is really easy (the casual bot clears everything) and never gives 3 stars; hard is still fair for the skilled", () => {
  const seeds = SEEDS.slice(0, 15);
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const easy = rates(level, "e", CASUAL, seeds);
    assert.ok(easy.clear >= 0.9, `level ${level}: easy casual ${easy.clear}`);
    assert.equal(easy.three, 0, "easy tops out at two stars");
    assert.ok(rates(level, "h", SKILLED, seeds).clear >= 0.8, `level ${level}: hard skilled`);
  }
});

test("slow mode is the same street slower: the casual bot still clears, and stars follow the same rule", () => {
  for (const level of [1, 4, 5, 9]) assert.ok(rates(level, "n", CASUAL, SEEDS.slice(0, 10), true).clear >= 0.8, `level ${level} slow`);
  assert.equal(starsOf.length, 4, "stars never read slow mode (won, lost, scrapes, level; the mode is optional)");
});

test("each level adds one new thing, each world ends with a named finale", () => {
  const seen = new Set<string>();
  const features = (index: number) => {
    const def = LEVELS[index], out = new Set<string>(["wires"]);
    if (def.reach > 60) out.add("heights");
    if (def.pairs) out.add("pairs");
    if (def.knots) out.add("knots");
    if (def.flyers) out.add("flyers");
    if (def.flocks) out.add("flocks");
    if (def.swoops) out.add(def.boss === "goda" ? "goda" : "divers");
    if (def.gust) out.add("gusts");
    if (def.swing) out.add("swing");
    if (def.boss === "jhor") out.add("jhor");
    if (def.flyers + def.swoops > 0 && def.gust && def.swing && !def.boss) out.add("all together");
    return out;
  };
  assert.equal(new Set(LEVELS.map(def => def.title)).size, LEVEL_COUNT, "every level has its own title");
  assert.equal(new Set(LEVELS.map(def => def.name)).size, LEVEL_COUNT, "every level is its own পাড়া");
  for (let index = 0; index < LEVEL_COUNT; index++) {
    const fresh = [...features(index)].filter(item => !seen.has(item));
    assert.ok(fresh.length <= 1 || (index === 0 && fresh.length === 1), `level ${index + 1} adds ${fresh.join(", ")}`);
    for (const item of features(index)) seen.add(item);
  }
  for (let world = 0; world < 3; world++) {
    const levels = LEVELS.filter(def => def.world === world);
    assert.equal(levels.length, 4);
    assert.ok(levels[3].finale && levels[3].boss && levels.slice(0, 3).every(def => !def.finale && !def.boss));
    assert.ok(levels[3].title.includes(BOSS_NAME[levels[3].boss!]), `${levels[3].title} names ${BOSS_NAME[levels[3].boss!]}`);
  }
});
