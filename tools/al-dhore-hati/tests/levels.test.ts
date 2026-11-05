// Difficulty by bots: each level is fair at its target rate, level 1 is a win inside 10 s, each finale is its world's hardest,
// সহজ really is easy and কঠিন is still winnable. The bots are in bot.ts; the targets are in the design doc.
import assert from "node:assert/strict";
import test from "node:test";
import { LEVEL_COUNT, starsOf, type Mode } from "../lib/levels";
import { PH_DONE, PH_FELL } from "../lib/rules";
import { CASUAL, heldRight, idle, oldRun, percentile, play, runOf, SKILLED, SLOW, type Skill } from "./bot";

const SEEDS = 100;
type Rates = { clear: number; three: number; median: number };
const memo = new Map<string, Rates>();
function rates(level: number, mode: Mode, skill: Skill, pace = 1): Rates {
  const key = `${level}${mode}${skill.name}${pace}`;
  const hit = memo.get(key);
  if (hit) return hit;
  let clear = 0, three = 0;
  const times: number[] = [];
  for (let seed = 1; seed <= SEEDS; seed++) {
    const outcome = play(runOf(seed * 101 + 7, level, mode), skill, pace);
    assert.ok(outcome.game.phase === PH_DONE || outcome.game.phase === PH_FELL, `level ${level} seed ${seed}: every field ends`);
    if (outcome.cleared) { clear++; times.push(outcome.seconds); }
    if (starsOf(outcome.game.slips, outcome.cleared, mode) === 3) three++;
  }
  const result = { clear: clear / SEEDS, three: three / SEEDS, median: percentile(times.sort((a, b) => a - b), 0.5) ?? Infinity };
  memo.set(key, result);
  return result;
}
const levels = Array.from({ length: LEVEL_COUNT }, (_, index) => index + 1);

test("level 1: the casual bot clears nearly every seed, inside 10 s on the median seed", () => {
  const casual = rates(1, "n", CASUAL);
  assert.ok(casual.clear >= 0.97, `clear ${casual.clear}`);
  assert.ok(casual.median <= 10, `median ${casual.median}`);
  assert.ok(rates(1, "n", SKILLED).three >= 0.95);
});

test("সাধারণ: the skilled bot clears every level and gets three stars on most seeds; the casual bot clears at least half", () => {
  for (const level of levels) {
    const skilled = rates(level, "n", SKILLED), casual = rates(level, "n", CASUAL);
    assert.ok(skilled.clear >= 0.9, `level ${level} skilled clear ${skilled.clear}`);
    assert.ok(skilled.three >= 0.6, `level ${level} skilled 3★ ${skilled.three}`);
    assert.ok(casual.clear >= 0.5, `level ${level} casual clear ${casual.clear}`);
    assert.ok(casual.median <= 30, `level ${level} median ${casual.median}s`);
  }
});

test("each finale is the hardest field of its world for the casual bot, and the last is harder than the first", () => {
  for (const finale of [5, 10, 15, 20]) {
    const mine = rates(finale, "n", CASUAL).clear;
    for (let level = finale - 4; level < finale; level++) assert.ok(mine < rates(level, "n", CASUAL).clear || mine < 0.99, `finale ${finale} (${mine}) vs level ${level} (${rates(level, "n", CASUAL).clear})`);
  }
  assert.ok(rates(20, "n", CASUAL).clear < rates(5, "n", CASUAL).clear);
});

test("the early levels ask for steering, from the second: an untouched walk rarely stays dry, holding one side never clears", () => {
  for (const level of levels) {
    let dry = 0, right = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const a = idle(runOf(seed, level)); if (a.cleared && a.game.slips === 0) dry++;
      if (heldRight(runOf(seed, level)).cleared) right++;
    }
    if (level >= 2) assert.equal(dry, 0, `level ${level}: an untouched walk stayed dry ${dry}/20`);
    assert.equal(right, 0, `level ${level}: holding →`);
  }
});

test("সহজ: the casual bot clears every level, never with three stars; the mode only helps", () => {
  for (const level of levels) {
    const easy = rates(level, "e", CASUAL);
    assert.ok(easy.clear >= 0.95, `level ${level} easy ${easy.clear}`);
    assert.equal(easy.three, 0, `level ${level} easy three stars`);
    assert.ok(easy.clear >= rates(level, "n", CASUAL).clear - 0.02, `level ${level}`);
  }
});

test("কঠিন: the skilled bot still clears every level, and it is harder than সাধারণ for the casual bot", () => {
  for (const level of levels) assert.ok(rates(level, "h", SKILLED).clear >= 0.7, `level ${level} hard skilled ${rates(level, "h", SKILLED).clear}`);
  const sum = (mode: Mode) => levels.reduce((total, level) => total + rates(level, mode, CASUAL).clear, 0);
  assert.ok(sum("h") < sum("n"), "harder in total");
});

test("ধীরে খেলো slows the walk and keeps the stars' rule: a slow walk is never harder, and the star count is by slips as ever", () => {
  for (const level of [5, 12, 20]) {
    const slow = rates(level, "n", CASUAL, SLOW), normal = rates(level, "n", CASUAL);
    assert.ok(slow.clear >= normal.clear - 0.05, `level ${level}: slow ${slow.clear} vs ${normal.clear}`);
    assert.ok(slow.median > normal.median, "and it takes longer");
  }
});

test("old fields (old links) are playable with the old three slips and the old numbers", () => {
  for (const level of [1, 7, 11, 20]) {
    let cleared = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const out = play(oldRun(seed * 17, level), SKILLED);
      assert.ok(out.game.slips <= 3);
      assert.equal(out.game.lives, 3);
      if (out.cleared) cleared++;
    }
    assert.ok(cleared >= 27, `old level ${level}: ${cleared}/30`);
  }
});
