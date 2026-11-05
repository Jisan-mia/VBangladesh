import assert from "node:assert/strict";
import test from "node:test";
import { readLevels, unlockedLevel } from "../../../shared/game-core";
import {
  averageOf, bestKey, LEVEL_COUNT, MODE_INFO, migrateLevels, nextAhead, openLevel, potWeight, rawStars, readAhead, readBests, starsOf, STAR_MARKS, worldOf,
} from "../lib/levels";
import { averageOfRound, newRound } from "../lib/round";
import { CASUAL, play, rates, SKILLED } from "./bot";

test("scoring: the boss pot counts double, a spill is zero, stars at 60, 80 and 92", () => {
  assert.equal(potWeight(4, 3), 2);
  assert.equal(potWeight(4, 2), 1);
  assert.equal(potWeight(3, 3), 1, "level 3 has no boss");
  assert.equal(averageOf(3, [90, 80, 70, 60]), 75);
  assert.equal(averageOf(4, [90, 80, 70, 60]), 72, "(90+80+70+120)/5");
  assert.equal(averageOf(4, [99, 99, 99, 0]), 59, "a spilled boss pot costs double");
  assert.deepEqual([rawStars(59), rawStars(60), rawStars(79), rawStars(80), rawStars(91), rawStars(92)], [0, 1, 1, 2, 2, 3]);
  assert.deepEqual([...STAR_MARKS], [60, 80, 92]);
  // সহজ stops at two, and so does ধীরে খেলো, so neither is the short way to three.
  assert.equal(starsOf(97, "n"), 3);
  assert.equal(starsOf(97, "e"), 2);
  assert.equal(starsOf(97, "n", true), 2, "slow mode never earns three");
  assert.equal(starsOf(97, "h", true), 2);
  assert.equal(starsOf(70, "e"), 1);
  const round = newRound(1, 4);
  round.scores = [90, 80, 70, 60]; round.scored = 4;
  assert.equal(averageOfRound(round), 72);
  const old = newRound(1, 3, "n", true);
  old.scores = [90, 80, 70, 60, 50]; old.scored = 5;
  assert.equal(averageOfRound(old), 70, "old kitchens count every pot the same");
  assert.equal(worldOf(1).name, "আম্মুর রান্নাঘর");
  assert.equal(worldOf(12).scene, 2);
});

test("difficulty modes say what they change, and easy never reaches three stars", () => {
  assert.ok(MODE_INFO.e.rate < 1 && MODE_INFO.h.rate > 1 && MODE_INFO.n.rate === 1);
  assert.equal(MODE_INFO.e.maxStars, 2);
  for (const mode of ["e", "n", "h"] as const) assert.ok(MODE_INFO[mode].line.length > 10);
});

test("level 1 is won within ten seconds by a casual player, and by almost everyone", () => {
  const casual = rates(1, CASUAL, { seeds: 120 });
  assert.ok(casual.clear >= 0.96, `casual clears level 1 on ${casual.clear}`);
  assert.ok(casual.median <= 10, `median ${casual.median}s`);
  assert.ok(rates(1, SKILLED).clear >= 0.97);
});

test("every level is fair: the skilled bot clears it, the casual bot mostly clears but rarely gets three stars", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const casual = rates(level, CASUAL), skilled = rates(level, SKILLED);
    assert.ok(skilled.clear >= 0.9, `level ${level}: skilled clear ${skilled.clear}`);
    assert.ok(skilled.three >= 0.2, `level ${level}: skilled three-star ${skilled.three}`);
    assert.ok(casual.clear >= 0.88, `level ${level}: casual clear ${casual.clear}`);
    assert.ok(casual.three <= 0.15, `level ${level}: casual three-star ${casual.three}`);
    assert.ok(skilled.three > casual.three, `level ${level}: skill shows`);
  }
});

test("finales are the hardest of their world for a casual player, and the last is harder than the first", () => {
  const twoUp = (level: number) => rates(level, CASUAL).twoUp;
  for (const finale of [4, 8, 12]) assert.ok(twoUp(finale) <= 0.7, `level ${finale}: ${twoUp(finale)}`);
  assert.ok(twoUp(12) < twoUp(4));
  assert.ok(twoUp(4) < Math.min(twoUp(1), twoUp(2), twoUp(3)), "world 1's finale is its hardest");
});

test("modes: easy is slower and never gives three; hard is quicker and still clearable; slow never gives three", () => {
  for (const level of [1, 4, 6, 12]) {
    const easy = rates(level, SKILLED, { mode: "e" }), normal = rates(level, SKILLED), hard = rates(level, SKILLED, { mode: "h" }), slow = rates(level, SKILLED, { slow: true });
    assert.equal(easy.three, 0, `level ${level}: easy`);
    assert.equal(slow.three, 0, `level ${level}: slow`);
    assert.ok(easy.clear >= 0.95 && slow.clear >= 0.95, `level ${level}: the gentle modes clear`);
    assert.ok(hard.clear >= 0.8, `level ${level}: hard clear ${hard.clear}`);
    assert.ok(hard.three <= normal.three + 0.2 && hard.median < normal.median + 0.01, `level ${level}: hard`);
    assert.ok(rates(level, CASUAL, { mode: "e" }).median > rates(level, CASUAL).median, `level ${level}: easy takes longer`);
  }
  for (let seed = 1; seed < 40; seed++) assert.ok(play(seed, 3, SKILLED, { slow: true }).stars <= 2);
});

test("a bot run is deterministic", () => {
  assert.deepEqual(play(77, 7, CASUAL).round.scores, play(77, 7, CASUAL).round.scores);
  assert.notDeepEqual(play(77, 7, CASUAL).round.scores, play(78, 7, CASUAL).round.scores);
});

test("a friend's far-ahead level keeps its stars but never opens the levels in between", () => {
  const stars = { 1: 3, 2: 2, 9: 3 };
  assert.equal(unlockedLevel(stars, LEVEL_COUNT), 10, "the shared rule opens everything below the highest, on purpose");
  assert.equal(openLevel(stars, [9]), 3, "ours: only what we reached");
  assert.equal(openLevel(stars, []), 10, "no `ahead` list means the shared rule, as for older phones");
  assert.deepEqual(nextAhead({ 1: 3, 2: 2 }, [], 9), [9]);
  assert.deepEqual(nextAhead({ 1: 3, 2: 2 }, [], 3), [], "the next level is ours, not ahead");
  assert.deepEqual(nextAhead({ 1: 3, 2: 2, 9: 3 }, [9], 3), [9], "clearing 3 keeps 9 ahead until we reach it");
  assert.equal(openLevel({ 1: 3, 2: 3, 3: 1, 9: 3 }, [9]), 4);
  // Once our own play reaches the far level, it is ours.
  const reached = { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3 };
  assert.equal(openLevel(reached, [9]), 10);
  assert.deepEqual(readAhead('[9,"x",99,3,3]'), [3, 9]);
  assert.deepEqual(readAhead("junk"), []);
});

test("saved bests per level and mode drop junk", () => {
  assert.deepEqual(readBests('{"4n":88,"4x":1,"13n":3,"2e":120,"1h":-1,"3n":"9","5h":70}'), { "4n": 88, "5h": 70 });
  assert.deepEqual(readBests("not json"), {});
  assert.equal(bestKey(4, "h"), "4h");
});

test("old saved progress migrates once: the furthest old kitchen becomes one star a level; a new phone is never rewritten", () => {
  const old = JSON.stringify({ 1: 3, 2: 2, 3: 1, 4: 1 });
  const moved = migrateLevels(old, null, null)!;
  assert.deepEqual(JSON.parse(moved.levels!), { 1: 1, 2: 1, 3: 1, 4: 1 });
  assert.equal(moved.marker, "2");
  assert.equal(unlockedLevel(readLevels(moved.levels, LEVEL_COUNT), LEVEL_COUNT), 5, "the same number of kitchens stays open");
  assert.equal(migrateLevels(old, null, "2"), null, "run once");
  // The original game kept only a best average: it became kitchen 3's stars, then one star on levels 1–3.
  assert.deepEqual(JSON.parse(migrateLevels(null, "88", null)!.levels!), { 1: 1, 2: 1, 3: 1 });
  assert.equal(migrateLevels(null, "40", null)!.levels, null, "under 50 is no progress, but the marker is still set");
  assert.deepEqual(migrateLevels(null, null, null), { levels: null, marker: "2" });
  assert.deepEqual(migrateLevels("junk", null, null), { levels: null, marker: "2" });
  // A phone that already plays the new ladder carries the marker, so its own stars are never read as old ones.
  assert.equal(migrateLevels(JSON.stringify({ 1: 3, 9: 3 }), null, "2"), null);
});
