import assert from "node:assert/strict";
import test from "node:test";
import { readLevels, recordLevel, totalStars, unlockedLevel } from "../../../shared/game-core";
import { countOf, isFinale, levelOf, LEVEL_COUNT, LEVELS, MODES, PER_WORLD, WORLDS, FAST, GHOST, SWARM } from "../lib/levels";
import { afterClear, playable, readMode, readUnlock, recommended } from "../lib/progress";
import { CASUAL, SHARP, rate } from "./bot";

const SEEDS = 40;

test("four worlds of five; each world brings one new kind and ends with its named boss", () => {
  assert.equal(LEVEL_COUNT, 20, "the same 20 রাত numbers as before, so old stars and links keep their place");
  assert.equal(LEVEL_COUNT, WORLDS.length * PER_WORLD);
  const kinds = [(r: typeof LEVELS[number]) => r.plain > 0, (r: typeof LEVELS[number]) => r.fast > 0, (r: typeof LEVELS[number]) => r.ghost > 0, (r: typeof LEVELS[number]) => r.swarms > 0];
  WORLDS.forEach((world, w) => {
    const rows = LEVELS.slice(w * PER_WORLD, (w + 1) * PER_WORLD);
    rows.forEach(row => assert.equal(row.world, w));
    assert.ok(rows.slice(0, -1).every(row => !row.boss) && rows[PER_WORLD - 1].boss > 0, `${world.name} ends with its boss`);
    assert.ok(isFinale((w + 1) * PER_WORLD));
    // The world's new kind is first seen in its first রাত, never before.
    const earlier = LEVELS.slice(0, w * PER_WORLD);
    assert.ok(kinds[w](rows[0]), `${world.kind} arrives in ${rows[0].name}`);
    if (w > 0) assert.ok(!earlier.some(kinds[w]), `${world.kind} is new in ${world.name}`);
  });
  assert.equal(levelOf(10).bossKind, FAST);
  assert.equal(levelOf(15).bossKind, GHOST);
  for (const row of LEVELS) assert.ok(row.line.length <= 80 && row.line === row.line.normalize("NFC") && row.name === row.name.normalize("NFC"));
  assert.equal(new Set(LEVELS.map(row => row.name)).size, LEVEL_COUNT);
  assert.equal(new Set(LEVELS.map(row => row.line)).size, LEVEL_COUNT, "each রাত says its own one new thing");
  assert.deepEqual(LEVELS.map(row => row.length).slice(0, 1), [10], "the first night is ten seconds");
  assert.ok(countOf(1) <= 5);
  assert.equal(SWARM, 3);
});

test("bots: casual clears every রাত and stars get harder to earn; finales bite on কঠিন; sharp clears them; nobody idles or camps through", () => {
  const casual: ReturnType<typeof rate>[] = [], hard: ReturnType<typeof rate>[] = [], easy: ReturnType<typeof rate>[] = [], sharp: ReturnType<typeof rate>[] = [];
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    casual.push(rate(level, CASUAL, SEEDS)); hard.push(rate(level, CASUAL, SEEDS, 1)); easy.push(rate(level, CASUAL, SEEDS, 5)); sharp.push(rate(level, SHARP, SEEDS));
    assert.equal(rate(level, "idle", 10).cleared, 0, `idle never clears রাত ${level}`);
    if (level >= 4) assert.equal(rate(level, "camper", 10).cleared, 0, `tapping the face loses রাত ${level}`);
  }
  assert.equal(casual[0].cleared, 1, "রাত 1 is always won");
  assert.ok(casual[0].time <= 10, `and within ten seconds (${casual[0].time.toFixed(1)} s)`);
  assert.ok(casual[0].three >= 0.9);
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const i = level - 1;
    assert.ok(casual[i].cleared >= 0.8, `casual clears রাত ${level}: ${casual[i].cleared}`);
    assert.ok(easy[i].cleared >= 0.9, `casual on সহজ clears রাত ${level}: ${easy[i].cleared}`);
    assert.ok(sharp[i].cleared >= 0.95, `sharp clears রাত ${level}: ${sharp[i].cleared}`);
  }
  for (let w = 0; w < WORLDS.length; w++) {
    const first = w * PER_WORLD, finale = first + PER_WORLD - 1;
    assert.ok(hard[finale].cleared < hard[first].cleared, `${WORLDS[w].boss} on কঠিন (${hard[finale].cleared}) is harder than ${LEVELS[first].name} (${hard[first].cleared})`);
  }
  const threeOf = (w: number) => casual.slice(w * PER_WORLD, (w + 1) * PER_WORLD).reduce((sum, r) => sum + r.three, 0) / PER_WORLD;
  assert.ok(threeOf(3) < threeOf(0) && threeOf(2) < threeOf(0), `★★★ gets rarer: ${[0, 1, 2, 3].map(threeOf).map(x => x.toFixed(2))}`);
});

test("modes change only the bites the sleeper takes", () => {
  assert.deepEqual(MODES.map(mode => mode.hearts), [5, 3, 1]);
  assert.deepEqual([readMode(null), readMode("0"), readMode("2"), readMode("x"), readMode("3")], [1, 0, 2, 1, 1]);
});

test("saved progress: old stars stay by রাত number, the own unlock migrates once, a friend's far-ahead রাত opens nothing in between", () => {
  const old = readLevels(JSON.stringify({ 1: 3, 2: 2, 3: 1, 21: 3, 4: 9 }), LEVEL_COUNT);
  assert.deepEqual(old, { 1: 3, 2: 2, 3: 1 });
  assert.deepEqual(readUnlock(null, old), { unlock: 4, migrated: true }, "migrated once from the stars");
  assert.deepEqual(readUnlock("4", { ...old, 12: 2 }), { unlock: 4, migrated: false }, "then the saved unlock wins");
  assert.equal(unlockedLevel({ ...old, 12: 2 }, LEVEL_COUNT), 13, "(the shared rule would open everything below 12)");
  assert.equal(afterClear(4, 4), 5);
  assert.equal(afterClear(4, 2), 4);
  assert.equal(afterClear(4, 12), 4, "a friend's রাত 12 records its stars but opens nothing");
  assert.equal(afterClear(20, 20), 20);
  assert.ok(playable(12, 4, {}, 12) && !playable(11, 4, { 12: 2 }) && playable(12, 4, { 12: 2 }));
  assert.equal(recommended(4, { 1: 3, 2: 2, 3: 1 }), 4);
  assert.equal(recommended(3, { 1: 3, 2: 2, 3: 3 }), 2);
  let stars = recordLevel({}, 1, 3);
  stars = recordLevel(stars, 1, 1);
  assert.equal(stars[1], 3, "stars never drop");
  assert.equal(totalStars(stars), 3);
});
