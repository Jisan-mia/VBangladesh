// Every পাটি is clearable at its target rate by a headless thumb (tests/bot.ts plays the real tick()). Fixed seeds, so the
// numbers are the same on every run; the measured rates are in ai_docs/game-dev/rewrites/pati-buni.md.
import assert from "node:assert/strict";
import test from "node:test";
import { isFinale, LEVEL_COUNT, LEVELS } from "../lib/levels";
import { CAREFUL, CASUAL, PLANNER, rate } from "./bot";

const SEEDS = 24;

test("পাটি 1: every thumb wins it, with three stars", () => {
  for (const skill of [CASUAL, CAREFUL, PLANNER]) assert.deepEqual(rate(1, skill, SEEDS, 0), { cleared: 1, stars: 3 });
});

test("a casual thumb on স্বাভাবিক clears world 1 almost always, later পাটি mostly, and each finale about half the time", () => {
  for (let level = 2; level <= LEVEL_COUNT; level++) {
    const { cleared } = rate(level, CASUAL, SEEDS, 1);
    const [low, high] = isFinale(level) ? [0.35, 0.97] : level <= 4 ? [0.9, 1] : [0.65, 1];
    assert.ok(cleared >= low && cleared <= high, `${level} ${LEVELS[level - 1].name}: ${cleared}`);
  }
});

test("সহজ really is easier, and কঠিন harder, for the same thumb", () => {
  for (const level of [4, 8, 12]) {
    const easy = rate(level, CASUAL, SEEDS, 3).cleared, mid = rate(level, CASUAL, SEEDS, 1).cleared, hard = rate(level, CASUAL, SEEDS, 0).cleared;
    assert.ok(easy >= mid && mid >= hard && easy > hard, `${level}: ${easy} ${mid} ${hard}`);
    assert.ok(hard >= 0.15, `${level} on কঠিন stays possible: ${hard}`);
  }
});

test("a careful thumb clears every পাটি on কঠিন; a planner earns ★★ on average and ★★★ is within reach", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    assert.ok(rate(level, CAREFUL, SEEDS, 0).cleared >= 0.9, `${level} careful`);
    const plan = rate(level, PLANNER, SEEDS, 1);
    assert.ok(plan.stars >= 1.1 && plan.stars <= 3, `${level} planner stars ${plan.stars}`);
  }
});
