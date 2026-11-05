// Worlds, finales and difficulty: every level is solvable, one new thing each, and the headless players behave the way the design says.
import assert from "node:assert/strict";
import test from "node:test";
import { BEST, LEARNS, LEVELS, LEVEL_COUNT, WORLDS, badgeName, isFinale, nextToPlay, worldOf } from "../lib/levels";
import { resultOf } from "../lib/play";
import { MAX_BLOCKS, runPlan } from "../lib/rover";
import { careless, casual } from "./bot";

const SEEDS = 200;

test("four worlds of three levels in play order; ids 1–12 keep their saved-stars meaning", () => {
  assert.equal(LEVEL_COUNT, 12);
  assert.equal(WORLDS.length, 4);
  assert.deepEqual(WORLDS.flatMap(world => [...world.ids]), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  // The titles are the old ones, so a child's saved level 7 is still "দুটো পাথর".
  assert.deepEqual(LEVELS.map(level => level.title).slice(0, 3), ["এক ধাপ", "দুই ধাপ", "গর্ত পাশ কাটাও"]);
  assert.equal(LEVELS[6].title, "দুটো পাথর");
  assert.equal(LEVELS[11].title, "কম ব্লকে পারবে?");
  assert.equal(LEARNS.length, LEVEL_COUNT);
  assert.equal(new Set(LEARNS).size, LEVEL_COUNT, "each level says its own new thing");
});

test("each world's last level is a named finale, and every world adds one idea", () => {
  assert.deepEqual(LEVELS.filter(level => isFinale(level.n)).map(level => level.n), [3, 6, 9, 12]);
  assert.equal(new Set(WORLDS.map(world => world.finale)).size, 4);
  for (const world of WORLDS) assert.equal(badgeName(world.ids.at(-1)!), world.finale);
  assert.equal(badgeName(1), "এক ধাপ");
  // World 1 has one crater only at its finale; world 2 is crater fields; world 3 has several samples; world 4 has the repeat block.
  assert.deepEqual(LEVELS.slice(0, 2).map(level => level.craters.length), [0, 0]);
  assert.ok(LEVELS.slice(3, 6).every(level => level.craters.length >= 3 && level.samples.length === 1));
  assert.ok(LEVELS.slice(6, 9).every(level => level.samples.length >= 2));
  assert.ok(LEVELS.slice(9).every(level => level.repeat) && LEVELS.slice(0, 9).every(level => !level.repeat));
  assert.equal(worldOf(10).name, "লুপের পাহাড়");
  assert.equal(nextToPlay({}), 1);
  assert.equal(nextToPlay({ 1: 3, 2: 3, 3: 1 }), 4);
  assert.equal(nextToPlay(Object.fromEntries(LEVELS.map(level => [level.n, 3]))), LEVEL_COUNT);
  assert.equal(nextToPlay({ 1: 3, 2: 2, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 3, 11: 3, 12: 3 }), 2);
});

test("every level is solvable within the plan strip, and a won plan gives stars by blocks only", () => {
  for (const level of LEVELS) {
    const best = BEST[level.n - 1];
    assert.equal(runPlan(level, best.plan).end, "win");
    assert.ok(best.plan.length <= MAX_BLOCKS);
    assert.equal(resultOf(level.n, best.plan, 1).stars, 3);
    assert.equal(resultOf(level.n, best.arrows, 1).stars >= 1, true);
  }
});

test("a casual child (0.7 s a tap, 5% wrong arrows, fixes the lit block) wins level 1 inside 10 s and every level within six runs", () => {
  for (const level of LEVELS) {
    let won = 0, quick = 0, slowest = 0;
    for (let seed = 1; seed <= SEEDS; seed++) {
      const play = casual(level.n, seed);
      if (play.won) won++;
      if (play.won && play.seconds <= 10) quick++;
      slowest = Math.max(slowest, play.seconds);
    }
    assert.ok(won / SEEDS >= 0.98, `level ${level.n}: ${won}/${SEEDS}`);
    if (level.n === 1) assert.ok(quick / SEEDS >= 0.97, `level 1 inside 10 s: ${quick}/${SEEDS}`);
  }
  // The whole game for a casual child is minutes, never a wall.
  const total = LEVELS.reduce((sum, level) => sum + casual(level.n, 7).seconds, 0);
  assert.ok(total < 240, `${total} s for all twelve`);
});

test("the maps are not guessable: random arrows seldom win from level 3 on, almost never from level 5", () => {
  for (const level of LEVELS) {
    let won = 0;
    for (let seed = 1; seed <= SEEDS; seed++) if (careless(level.n, seed).won) won++;
    const rate = won / SEEDS;
    if (level.n >= 3) assert.ok(rate <= 0.15, `level ${level.n} guessed ${rate}`);
    if (level.n >= 5) assert.ok(rate <= 0.01, `level ${level.n} guessed ${rate}`);
  }
});

test("loops pay: world 4's shortest plans are less than half the arrows, and a casual child still uses a loop block", () => {
  for (const level of LEVELS.slice(9)) {
    const best = BEST[level.n - 1];
    assert.ok(best.blocks * 2 < best.steps, `level ${level.n}`);
    assert.ok(casual(level.n, 3).plan.some(block => block.times > 1));
  }
});
