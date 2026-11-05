// Difficulty by headless bots (bot.ts): a casual, a steady and a sharp player, one that never touches, and a masher, over 60
// seeds a level. The rates are the design's promise (ai_docs/game-dev/rewrites/latim.md); change a level, change these.
import assert from "node:assert/strict";
import test from "node:test";
import { LEVELS, LEVEL_COUNT, starsOf, type Mode } from "../lib/levels";
import { botSpin, CASUAL, IDLE, mashSpin, median, rate, SEEDS, SHARP, STEADY, type Skill } from "./bot";

const memo = new Map<string, number[]>();
/** Scores (tenths) of one skill on one level over the seeds. */
function scores(level: number, skill: Skill, mode: Mode = "n", slow = false) {
  const key = `${level}|${skill.name}|${mode}|${slow}`;
  let found = memo.get(key);
  if (!found) { found = SEEDS.map(seed => botSpin(level, seed, skill, mode, slow).score); memo.set(key, found); }
  return found;
}
const clears = (level: number, skill: Skill, mode: Mode = "n", slow = false) => rate(scores(level, skill, mode, slow).map(score => starsOf(score, level, mode) > 0));
const threes = (level: number, skill: Skill, mode: Mode = "n", slow = false) => rate(scores(level, skill, mode, slow).map(score => starsOf(score, level, mode) === 3));
const all = Array.from({ length: LEVEL_COUNT }, (_, index) => index + 1);

test("casual players clear level 1 almost always, and well inside ten seconds", () => {
  assert.ok(clears(1, CASUAL) >= 0.97, `${clears(1, CASUAL)}`);
  assert.ok(LEVELS[0].stars[0] * 10 <= median(scores(1, CASUAL)) && LEVELS[0].stars[0] <= 10);
  // the first win: the spin passes the clear mark (4 s) on every seed
  assert.ok(scores(1, IDLE).every(score => score >= LEVELS[0].stars[0] * 10 - 10), "even a top nobody touches reaches ~4 s");
});

test("casual clears every level of the first place on 90%+ and every level on 85%+", () => {
  for (const level of [1, 2, 3, 4]) assert.ok(clears(level, CASUAL) >= 0.9, `level ${level}: ${clears(level, CASUAL)}`);
  for (const level of all) assert.ok(clears(level, CASUAL) >= 0.85, `level ${level}: ${clears(level, CASUAL)}`);
});

test("steady players clear every level on 95%+, sharp ones on 98%+ and take 3 stars on most", () => {
  for (const level of all) {
    assert.ok(clears(level, STEADY) >= 0.95, `steady level ${level}: ${clears(level, STEADY)}`);
    assert.ok(clears(level, SHARP) >= 0.98, `sharp level ${level}: ${clears(level, SHARP)}`);
    assert.ok(threes(level, SHARP) >= 0.4, `sharp 3 stars, level ${level}: ${threes(level, SHARP)}`);
  }
  assert.ok(median(all.map(level => threes(level, SHARP))) >= 0.75);
  // the last level is a real test: the strong bot 3-stars it about half the time, the steady one less
  assert.ok(threes(12, SHARP) >= 0.35 && threes(12, SHARP) <= 0.8, `${threes(12, SHARP)}`);
  assert.ok(threes(12, STEADY) < threes(12, SHARP));
});

test("skill is rewarded: sharp ≥ steady ≥ casual for 3 stars, level by level (within noise)", () => {
  for (const level of all) {
    assert.ok(threes(level, SHARP) + 0.1 >= threes(level, STEADY), `level ${level}`);
    assert.ok(threes(level, STEADY) + 0.1 >= threes(level, CASUAL), `level ${level}`);
  }
  assert.ok(median(all.map(level => threes(level, STEADY))) > median(all.map(level => threes(level, CASUAL))) + 0.2);
});

test("each finale is harder for a casual player than its place's first level", () => {
  for (const [first, finale] of [[1, 4], [5, 8], [9, 12]]) {
    assert.ok(threes(finale, CASUAL) < threes(first, CASUAL), `${finale}: ${threes(finale, CASUAL)} vs ${threes(first, CASUAL)}`);
    assert.ok(median(scores(finale, CASUAL)) < median(scores(first, CASUAL)) + 5, `${finale} median`);
  }
});

test("touching at the green beats leaving it alone on every level, and by seconds, not by noise", () => {
  for (const level of all) assert.ok(median(scores(level, STEADY)) >= median(scores(level, IDLE)) + 30, `level ${level}`);
});

test("a top nobody touches clears the early levels but not the finales", () => {
  assert.ok(clears(1, IDLE) >= 0.97);
  for (const level of [8, 10, 12]) assert.ok(clears(level, IDLE) <= 0.2, `level ${level}: ${clears(level, IDLE)}`);
  for (const level of [6, 7, 9, 11]) assert.ok(clears(level, IDLE) <= 0.7, `level ${level}: ${clears(level, IDLE)}`);
});

test("the masher never gets three stars and does not clear the later places", () => {
  for (const level of all) {
    const mashed = SEEDS.map(seed => mashSpin(level, seed).score);
    assert.equal(rate(mashed.map(score => starsOf(score, level) === 3)), 0, `level ${level}`);
    assert.ok(median(mashed) < median(scores(level, STEADY)) - 80, `level ${level}: mash ${median(mashed)}`);
    if (level >= 9) assert.ok(rate(mashed.map(score => starsOf(score, level) > 0)) <= 0.2, `level ${level}`);
  }
});

test("modes: easy clears at least as often but tops out at two stars; hard stays fair for a sharp player", () => {
  for (const level of [3, 8, 12]) {
    assert.ok(clears(level, CASUAL, "e") >= clears(level, CASUAL, "n") - 0.03, `level ${level}`);
    assert.equal(threes(level, SHARP, "e"), 0, "easy has no third star");
    assert.ok(rate(scores(level, SHARP, "e").map(score => starsOf(score, level, "e") === 2)) >= 0.5, `easy two stars on ${level}`);
    assert.ok(clears(level, SHARP, "h") >= 0.95, `hard, level ${level}`);
    assert.ok(threes(level, SHARP, "h") <= threes(level, SHARP, "n") + 0.05, `hard is not easier, level ${level}`);
  }
  assert.ok(threes(12, SHARP, "h") < threes(12, SHARP, "n") + 1e-9);
});

test("ধীরে খেলো does not make stars easier: the 3-star rate is about the same", () => {
  for (const level of [1, 6, 12]) {
    const a = threes(level, CASUAL, "n", false), b = threes(level, CASUAL, "n", true);
    assert.ok(Math.abs(a - b) <= 0.2, `level ${level}: ${a} vs ${b}`);
    assert.ok(Math.abs(clears(level, STEADY, "n", true) - clears(level, STEADY)) <= 0.05);
  }
});
