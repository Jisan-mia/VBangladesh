// Difficulty, proven by flying: a beam-search solver shows every flight can be landed on the red ring with one page, and
// headless pilots of two skills hold the target rates (see tests/bot.ts for what each skill means).
import assert from "node:assert/strict";
import test from "node:test";
import { makeCourse } from "../lib/course";
import { createGame } from "../lib/flight";
import { LEVEL_COUNT, PER_WORLD, isFinale } from "../lib/levels";
import { CASUAL, SHARP, fly, rate } from "./bot";
import { solve } from "./solver";

const SEEDS = 12;

test("every flight can be landed on the red ring with a single page (beam-search proof, three seeds each)", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) for (const seed of [11, 4242, 90001]) {
    // A beam is a heuristic: a wider one is tried before calling a flight impossible.
    let found = solve(makeCourse(seed, level), { width: 64 });
    for (const width of [96, 128]) if (found.landing !== 2) found = solve(makeCourse(seed, level), { width });
    assert.equal(found.landing, 2, `level ${level} seed ${seed} (got as far as ${found.far})`);
  }
});

test("★★★ is possible on every flight: the solver lands on the ring with the candy goal in the pocket, one page", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) for (const seed of [4242, 7]) {
    const course = makeCourse(seed, level);
    let best = 0;
    for (const width of [96, 160]) for (const greed of [1, 3]) {
      if (best >= course.goal) break;
      const found = solve(course, { width, greed });
      if (found.landing === 2) best = Math.max(best, found.candies);
    }
    assert.ok(best >= course.goal, `level ${level} seed ${seed}: ${best} of ${course.goal} candies on a bullseye flight`);
  }
});

test("স্বাভাবিক (3 pages): a casual player lands every flight at least 85% of the time, and level 1 every time inside 10 s", () => {
  const first = rate(1, CASUAL, SEEDS, 3);
  assert.equal(first.cleared, 1);
  let quick = 0;
  for (let seed = 1; seed <= SEEDS; seed++) { const game = fly(createGame(makeCourse(seed * 7919, 1), 3), CASUAL, seed); if (game.landing && game.landT < 10) quick++; }
  assert.ok(quick / SEEDS >= 0.9, `level 1 landed inside 10 s: ${quick}/${SEEDS}`);
  for (let level = 2; level <= LEVEL_COUNT; level++) {
    const { cleared } = rate(level, CASUAL, SEEDS, 3);
    assert.ok(cleared >= 0.85, `level ${level}: ${cleared}`);
  }
});

test("কঠিন (1 page): the casual player still lands level 1 every time; each finale is a real test (35–90%) and harder than its world's first flight", () => {
  assert.equal(rate(1, CASUAL, SEEDS, 1).cleared, 1);
  for (let world = 0; world < LEVEL_COUNT / PER_WORLD; world++) {
    const opening = rate(world * PER_WORLD + 1, CASUAL, SEEDS, 1).cleared, finale = world * PER_WORLD + PER_WORLD;
    assert.ok(isFinale(finale));
    const { cleared } = rate(finale, CASUAL, SEEDS, 1);
    assert.ok(cleared >= 0.35 && cleared <= 0.9, `finale ${finale}: ${cleared}`);
    assert.ok(cleared < opening, `finale ${finale} (${cleared}) is harder than flight ${world * PER_WORLD + 1} (${opening})`);
  }
});

test("a sharp player on কঠিন lands every flight at least 70% of the time", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const { cleared } = rate(level, SHARP, SEEDS, 1);
    assert.ok(cleared >= 0.7, `level ${level}: ${cleared}`);
  }
});
