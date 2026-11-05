// Difficulty by bots: each level is fair at its target rate, level 1 is a win inside 10 s, each finale is its world's hardest,
// সহজ really is easy and কঠিন is still winnable. The bots are in bot.ts; the targets are in the design doc.
import assert from "node:assert/strict";
import test from "node:test";
import { LEVEL_COUNT, LEVELS, starsOf, type Mode } from "../lib/levels";
import { CASUAL, percentile, play, runOf, SKILLED, type Skill } from "./bot";

const SEEDS = 120;
type Rates = { clear: number; three: number; twoPlus: number; median: number };
const memo = new Map<string, Rates>();
function rates(level: number, mode: Mode, skill: Skill): Rates {
  const key = `${level}${mode}${skill.name}`;
  if (memo.has(key)) return memo.get(key)!;
  let clear = 0, three = 0, twoPlus = 0;
  const times: number[] = [];
  for (let seed = 1; seed <= SEEDS; seed++) {
    const outcome = play(runOf(seed * 101 + 7, level, mode), skill);
    if (outcome.cleared) { clear++; times.push(outcome.seconds); }
    assert.ok(outcome.game.n - 1 <= LEVELS[level - 1].goal, `level ${level} seed ${seed}: never more sacks than the truck takes`);
    assert.equal(outcome.game.phase, "over", `level ${level} seed ${seed}: every round ends`);
    const stars = starsOf(level, outcome.cleared, outcome.game.perfect, mode);
    if (stars === 3) three++;
    if (stars >= 2) twoPlus++;
  }
  const result = { clear: clear / SEEDS, three: three / SEEDS, twoPlus: twoPlus / SEEDS, median: percentile(times.sort((a, b) => a - b), 0.5) ?? Infinity };
  memo.set(key, result);
  return result;
}

test("level 1: the casual bot fills the truck on nearly every seed, inside 10 s on the median seed", () => {
  const casual = rates(1, "n", CASUAL);
  assert.ok(casual.clear >= 0.97, `clear ${casual.clear}`);
  assert.ok(casual.median <= 10, `median ${casual.median}`);
});

test("সাধারণ: the skilled bot clears every level and gets three stars on most seeds; the casual bot clears at least half", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const skilled = rates(level, "n", SKILLED), casual = rates(level, "n", CASUAL);
    assert.ok(skilled.clear >= 0.9, `level ${level} skilled clear ${skilled.clear}`);
    assert.ok(skilled.three >= 0.75, `level ${level} skilled 3★ ${skilled.three}`);
    assert.ok(casual.clear >= 0.5, `level ${level} casual clear ${casual.clear}`);
    assert.ok(casual.twoPlus >= 0.35, `level ${level} casual 2★+ ${casual.twoPlus}`);
  }
});

test("each finale is the hardest level of its world for the casual bot, and the last world is the hardest", () => {
  for (let world = 0; world < 3; world++) {
    const levels = LEVELS.map((def, index) => ({ def, level: index + 1 })).filter(({ def }) => def.world === world);
    const finale = levels.find(({ def }) => def.finale)!, finaleRate = rates(finale.level, "n", CASUAL).clear;
    for (const { level, def } of levels) if (!def.finale) assert.ok(rates(level, "n", CASUAL).clear >= finaleRate, `world ${world + 1}: level ${level} is easier than the finale`);
  }
  assert.ok(rates(12, "n", CASUAL).clear < rates(4, "n", CASUAL).clear, "the last finale is harder than the first");
});

test("সহজ really is easy: the casual bot clears three in four of every level, and stars stop at two", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const easy = rates(level, "e", CASUAL), normal = rates(level, "n", CASUAL);
    assert.ok(easy.clear >= 0.75, `level ${level} easy clear ${easy.clear}`);
    assert.ok(easy.clear >= normal.clear - 0.02, `level ${level}: easy is no harder than normal`);
    assert.equal(easy.three, 0, "never three stars on easy");
  }
});

test("কঠিন is still winnable: the skilled bot clears at least seven in ten of every level", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const hard = rates(level, "h", SKILLED);
    assert.ok(hard.clear >= 0.7, `level ${level} hard skilled clear ${hard.clear}`);
  }
});
