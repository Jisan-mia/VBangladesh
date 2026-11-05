// Difficulty by bots (tests/bot.ts; targets in ai_docs/game-dev/rewrites/sat-chara.md). Every level is fair, level 1 is a
// win inside 10 s, random throws stop clearing levels after the first world, each finale is its world's hardest, the curve
// inside a world never jumps back up, and সহজ really is easier than ওস্তাদ. Fixed seeds, so the numbers are exact.
import assert from "node:assert/strict";
import test from "node:test";
import { isFinale, LEVEL_COUNT } from "../lib/levels";
import { CASUAL, finaleOf, levelsOf, rates, RANDOM, SKILLED, type Rates, type Skill } from "./bot";
import type { Hand } from "../lib/save";

const SEEDS = 60;
const memo = new Map<string, Rates>();
const of = (level: number, skill: Skill, hand: Hand = "n", seeds = SEEDS) => {
  const key = `${level}${skill.name}${hand}${seeds}`;
  if (!memo.has(key)) memo.set(key, rates(level, skill, seeds, hand));
  return memo.get(key)!;
};
/** Average stars a bot takes home from a level (0–3). */
const stars = (r: Rates) => r.three + r.twoPlus + r.clear;
const all = Array.from({ length: LEVEL_COUNT }, (_, i) => i + 1);

test("level 1: the casual thrower clears it nearly always, with ★★★ most times, inside 10 s; even random throws often do", () => {
  const casual = of(1, CASUAL);
  assert.ok(casual.clear >= 0.95, `clear ${casual.clear}`);
  assert.ok(casual.three >= 0.6, `3★ ${casual.three}`);
  assert.ok(casual.median <= 10, `median ${casual.median} s`);
  assert.ok(of(1, RANDOM).clear >= 0.3, "anyone can knock the first pile");
});

test("random throws don't clear the game: at most a third of any later level, and almost never a later finale", () => {
  for (const level of all.slice(1)) {
    const random = of(level, RANDOM).clear;
    assert.ok(random <= (level === 10 || level === 15 ? 0.15 : 0.35), `level ${level}: random ${random}`);
  }
});

test("every level is fair: the skilled thrower clears it at least four times in five, the casual one most times", () => {
  for (const level of all) {
    const skilled = of(level, SKILLED), casual = of(level, CASUAL);
    assert.ok(skilled.clear >= 0.8, `level ${level}: skilled ${skilled.clear}`);
    assert.ok(stars(skilled) >= stars(casual) - 0.05, `level ${level}: skill pays`);
    if (isFinale(level)) assert.ok(casual.clear >= 0.45 && casual.clear <= 0.9, `finale ${level}: casual ${casual.clear}`);
    else assert.ok(casual.clear >= 0.75, `level ${level}: casual ${casual.clear}`);
  }
});

test("each finale is its world's hardest, and inside a world the stars never jump back up", () => {
  for (let world = 0; world < 3; world++) {
    const ladder = levelsOf(world).map(level => stars(of(level, CASUAL)));
    const finale = stars(of(finaleOf(world), CASUAL));
    for (let k = 0; k < 4; k++) assert.ok(ladder[k] > finale, `world ${world + 1}: level ${world * 5 + k + 1} (${ladder[k]}) vs finale (${finale})`);
    for (let k = 1; k < 5; k++) assert.ok(ladder[k] <= ladder[k - 1] + 0.35, `world ${world + 1}: level ${world * 5 + k + 1} jumps from ${ladder[k - 1]} to ${ladder[k]}`);
  }
});

test("সহজ is really easier than ওস্তাদ for the casual thrower, world by world", () => {
  for (let world = 0; world < 3; world++) {
    const easy = levelsOf(world).reduce((sum, level) => sum + stars(of(level, CASUAL, "e", 30)), 0);
    const hard = levelsOf(world).reduce((sum, level) => sum + stars(of(level, CASUAL, "h", 30)), 0);
    assert.ok(easy > hard + 0.3, `world ${world + 1}: easy ${easy} vs hard ${hard}`);
  }
});
