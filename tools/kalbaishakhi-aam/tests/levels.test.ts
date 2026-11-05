import assert from "node:assert/strict";
import test from "node:test";
import { readLevels, unlockedLevel } from "../../../shared/game-core";
import { createGame, starsOf } from "../lib/game";
import { makeLevelStorm } from "../lib/gen";
import { LEVEL_COUNT, LEVELS, MODES, PER_WORLD, WORLDS, isFinale } from "../lib/levels";
import { afterClear, migrateLadder, milestoneOf, nextMilestone, playable, readMode, readUnlock, recommended } from "../lib/progress";
import { CASUAL, SHARP, playBot } from "./bot";

const SEEDS = 40;
function rates(level: number, skill: typeof CASUAL, hearts: number) {
  let cleared = 0, three = 0;
  for (let seed = 1; seed <= SEEDS; seed++) {
    const stars = starsOf(playBot(createGame(makeLevelStorm(seed * 7919, level), hearts), skill, seed));
    if (stars) cleared++;
    if (stars === 3) three++;
  }
  return { cleared: cleared / SEEDS, three: three / SEEDS };
}

test("three worlds of four, each ending in its named storm", () => {
  assert.equal(LEVEL_COUNT, WORLDS.length * PER_WORLD);
  WORLDS.forEach((world, index) => {
    const finale = LEVELS[(index + 1) * PER_WORLD - 1];
    assert.equal(finale.name, world.finale);
    assert.ok(isFinale((index + 1) * PER_WORLD));
    assert.ok(finale.line.startsWith("শেষ ঝড়:"));
    for (let level = index * PER_WORLD + 1; level <= (index + 1) * PER_WORLD; level++) assert.equal(LEVELS[level - 1].world, index);
  });
  for (const row of LEVELS) assert.ok(row.line.length <= 80 && row.line === row.line.normalize("NFC"));
});

test("bots: a casual player clears every storm and stars get harder to earn; কঠিন bites in the finales; a sharp player clears them", () => {
  const casual = [], hard = [], sharp = [];
  for (let level = 1; level <= LEVEL_COUNT; level++) { casual.push(rates(level, CASUAL, 3)); hard.push(rates(level, CASUAL, 1)); sharp.push(rates(level, SHARP, 1)); }
  assert.equal(casual[0].cleared, 1, "storm 1 is always won");
  assert.equal(hard[0].cleared, 1, "even on কঠিন");
  assert.ok(casual[0].three >= 0.6, `storm 1 ★★★ ${casual[0].three}`);
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    assert.ok(casual[level - 1].cleared >= 0.9, `casual clears storm ${level}: ${casual[level - 1].cleared}`);
    assert.ok(sharp[level - 1].cleared >= 0.7, `sharp clears storm ${level} on কঠিন: ${sharp[level - 1].cleared}`);
  }
  for (const finale of [4, 8, 12]) {
    const { cleared } = hard[finale - 1];
    assert.ok(cleared >= 0.4 && cleared <= 0.85, `casual on কঠিন, finale ${finale}: ${cleared}`);
    assert.ok(hard[finale - 1].cleared < hard[finale - PER_WORLD].cleared, `finale ${finale} is harder than its world's first storm`);
  }
  assert.ok(casual[LEVEL_COUNT - 1].three <= 0.4, `the last storm's ★★★ is earned: ${casual[LEVEL_COUNT - 1].three}`);
  assert.ok(casual[LEVEL_COUNT - 1].three < casual[0].three);
});

test("সহজ, স্বাভাবিক, কঠিন change only the জান", () => {
  assert.deepEqual(MODES.map(mode => mode.hearts), [5, 3, 1]);
  const easy = createGame(makeLevelStorm(5, 6), 5), hard = createGame(makeLevelStorm(5, 6), 1);
  assert.deepEqual(easy.drops, hard.drops);
  assert.deepEqual([readMode(null), readMode("0"), readMode("2"), readMode("x")], [1, 0, 2, 1]);
});

test("migration: the old 8-storm stars (or the older best score) open the new ladder once, nobody loses a storm", () => {
  assert.equal(migrateLadder("{}", "{\"8\":3}", "500"), null, "already migrated");
  assert.equal(migrateLadder(null, null, null), null, "a new phone");
  assert.equal(migrateLadder(null, null, "junk"), null);
  const fromBest = JSON.parse(migrateLadder(null, null, "180")!);
  assert.deepEqual(fromBest, { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 }, "the original storm (old 4) opens new 1–6");
  assert.equal(unlockedLevel(readLevels(JSON.stringify(fromBest), LEVEL_COUNT), LEVEL_COUNT), 7);
  const all = JSON.parse(migrateLadder(null, JSON.stringify({ 1: 3, 2: 3, 3: 2, 4: 2, 5: 1, 6: 1, 7: 1, 8: 3 }), null)!);
  assert.equal(Object.keys(all).length, 12);
  assert.deepEqual([all[1], all[4], all[12]], [3, 2, 3], "each new storm carries the old one in its place");
  const some = JSON.parse(migrateLadder(null, JSON.stringify({ 1: 2, 2: 1 }), "40")!);
  assert.deepEqual(some, { 1: 2, 2: 1, 3: 1 });
});

test("own unlock: migrated once from the stars, then a friend's far-ahead storm opens nothing in between", () => {
  assert.deepEqual(readUnlock(null, { 1: 3, 2: 1 }), { unlock: 3, migrated: true });
  assert.deepEqual(readUnlock("5", {}), { unlock: 5, migrated: false });
  assert.equal(afterClear(3, 3), 4, "clearing the furthest open storm opens the next");
  assert.equal(afterClear(3, 1), 3);
  assert.equal(afterClear(3, 9), 3, "a friend's storm 9 records stars but opens nothing");
  assert.equal(afterClear(12, 12), 12);
  assert.ok(playable(9, 3, {}, 9) && !playable(8, 3, { 9: 2 }) && playable(9, 3, { 9: 2 }));
  assert.equal(recommended(4, { 1: 3, 2: 2, 3: 1 }), 4);
  assert.equal(recommended(3, { 1: 3, 2: 2, 3: 3 }), 2);
});

test("milestones count every mango on this phone", () => {
  assert.deepEqual([0, 49, 50, 99, 100, 260, 6000].map(milestoneOf), [0, 0, 50, 50, 100, 250, 5000]);
  assert.deepEqual([0, 50, 120, 6000].map(nextMilestone), [50, 100, 250, 0]);
});
