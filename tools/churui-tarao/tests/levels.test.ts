import assert from "node:assert/strict";
import test from "node:test";
import { readLevels, recordLevel, totalStars, unlockedLevel } from "../../../shared/game-core";
import { createGame } from "../lib/afternoon";
import { BOSS, ESCORTS, HP, LEVEL_COUNT, LEVELS, MODES, MUNIA, PER_WORLD, SHALIK, WORLDS, biteOf, isFinale, levelOf, OLD_LEVEL_COUNT } from "../lib/levels";
import { afterClear, playable, readMode, readUnlock, recommended } from "../lib/progress";
import { CASUAL, SHARP, rate } from "./bot";

const SEEDS = 40;

test("three worlds of four; each world brings one new bird and ends with its named boss; the old ten numbers keep their place", () => {
  assert.equal(LEVEL_COUNT, 12);
  assert.equal(LEVEL_COUNT, WORLDS.length * PER_WORLD);
  assert.ok(OLD_LEVEL_COUNT <= LEVEL_COUNT, "links and stars from the ten-field game name numbers that still exist");
  const news = [(r: typeof LEVELS[number]) => r.sides === 2 || r.group > 1, (r: typeof LEVELS[number]) => r.shalik > 0, (r: typeof LEVELS[number]) => r.munia > 0];
  WORLDS.forEach((world, w) => {
    const rows = LEVELS.slice(w * PER_WORLD, (w + 1) * PER_WORLD);
    rows.forEach(row => assert.equal(row.world, w));
    assert.ok(rows.slice(0, -1).every(row => !row.boss) && rows[PER_WORLD - 1].boss > 0, `${world.name} ends with its boss`);
    assert.ok(isFinale((w + 1) * PER_WORLD));
    if (w > 0) {
      assert.ok(news[w](rows[0]), `${world.bird} arrives in ${rows[0].name}`);
      assert.ok(!LEVELS.slice(0, w * PER_WORLD).some(row => news[w](row) && (w === 1 ? row.shalik > 0 : row.munia > 0)), `${world.bird} is new in ${world.name}`);
    }
  });
  assert.deepEqual(LEVELS.filter(row => row.boss).map(row => row.boss), [3, 4, 3], "claps each boss takes");
  assert.deepEqual(WORLDS.map(world => world.boss), ["পালের গোদা", "ঝুঁটি শালিক", "ডাকাত টিয়া"]);
  assert.equal(HP[SHALIK], 2, "a শালিক takes two claps");
  assert.equal(ESCORTS[2].kind, MUNIA);
  assert.ok(LEVELS[5].fog && LEVELS.filter(row => row.fog).length === 1, "the mist is one ক্ষেত");
  for (const row of LEVELS) assert.ok(row.line.length <= 100 && row.line === row.line.normalize("NFC") && row.name === row.name.normalize("NFC"));
  assert.equal(new Set(LEVELS.map(row => row.name)).size, LEVEL_COUNT);
  assert.equal(new Set(LEVELS.map(row => row.line)).size, LEVEL_COUNT, "each ক্ষেত says its own one new thing");
  assert.equal(LEVELS[0].length, 10, "the first ক্ষেত is ten seconds");
  assert.equal(createGame(1, 1, 1).n <= 6, true);
  assert.equal(levelOf(4).boss, 3);
  assert.equal(createGame(4, 1, 1).kind[createGame(4, 1, 1).boss], BOSS);
});

test("bots: casual clears every ক্ষেত and ★★★ gets rarer by world; finales bite on কঠিন; sharp clears them; nobody idles through", () => {
  const casual: ReturnType<typeof rate>[] = [], hard: ReturnType<typeof rate>[] = [], easy: ReturnType<typeof rate>[] = [], sharp: ReturnType<typeof rate>[] = [];
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    casual.push(rate(level, CASUAL, SEEDS)); hard.push(rate(level, CASUAL, SEEDS, 2)); easy.push(rate(level, CASUAL, SEEDS, 0)); sharp.push(rate(level, SHARP, SEEDS));
    assert.equal(rate(level, "idle", 10).cleared, 0, `idle never clears ক্ষেত ${level}`);
  }
  assert.equal(casual[0].cleared, 1, "ক্ষেত 1 is always won");
  assert.ok(casual[0].time <= 10, `and within ten seconds (${casual[0].time.toFixed(1)} s)`);
  assert.ok(casual[0].three >= 0.9);
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const i = level - 1;
    assert.ok(casual[i].cleared >= 0.8, `casual clears ক্ষেত ${level}: ${casual[i].cleared}`);
    assert.ok(easy[i].cleared >= 0.9, `casual on সহজ clears ক্ষেত ${level}: ${easy[i].cleared}`);
    assert.ok(sharp[i].cleared >= 0.95, `sharp clears ক্ষেত ${level}: ${sharp[i].cleared}`);
    assert.ok(easy[i].three >= casual[i].three, `সহজ is never harder for ★★★ (ক্ষেত ${level})`);
  }
  for (let w = 0; w < WORLDS.length; w++) {
    const first = w * PER_WORLD, finale = first + PER_WORLD - 1;
    assert.ok(hard[finale].cleared < hard[first].cleared, `${WORLDS[w].boss} on কঠিন (${hard[finale].cleared}) is harder than ${LEVELS[first].name} (${hard[first].cleared})`);
  }
  const threeOf = (w: number) => casual.slice(w * PER_WORLD, (w + 1) * PER_WORLD).reduce((sum, r) => sum + r.three, 0) / PER_WORLD;
  assert.ok(threeOf(1) < threeOf(0) && threeOf(2) < threeOf(0), `★★★ gets rarer: ${[0, 1, 2].map(threeOf).map(x => x.toFixed(2))}`);
});

test("modes change only how much a peck takes, never who lands where; the marks are the same on every mode", () => {
  assert.deepEqual(MODES.map(mode => mode.bite), [1, 2, 3]);
  assert.deepEqual([biteOf(0), biteOf(1), biteOf(2), biteOf(9), biteOf(-1)], [1, 2, 3, 3, 1]);
  assert.deepEqual([readMode(null), readMode("0"), readMode("2"), readMode("x"), readMode("3"), readMode("")], [1, 0, 2, 1, 1, 1]);
  for (const level of [1, 5, 12]) assert.deepEqual([...createGame(level, 5, 0).t0], [...createGame(level, 5, 2).t0]);
});

test("saved progress: old stars stay by ক্ষেত number, the own unlock migrates once, a friend's far-ahead ক্ষেত opens nothing in between", () => {
  const old = readLevels(JSON.stringify({ 1: 3, 2: 2, 3: 1, 13: 3, 4: 9 }), LEVEL_COUNT);
  assert.deepEqual(old, { 1: 3, 2: 2, 3: 1 });
  assert.deepEqual(readUnlock(null, old), { unlock: 4, migrated: true }, "migrated once from the stars");
  assert.deepEqual(readUnlock("4", { ...old, 10: 2 }), { unlock: 4, migrated: false }, "then the saved unlock wins");
  assert.equal(unlockedLevel({ ...old, 10: 2 }, LEVEL_COUNT), 11, "(the shared rule would open everything below 10)");
  assert.equal(afterClear(4, 4), 5);
  assert.equal(afterClear(4, 2), 4);
  assert.equal(afterClear(4, 10), 4, "a friend's ক্ষেত 10 records its stars but opens nothing");
  assert.equal(afterClear(12, 12), 12);
  assert.ok(playable(10, 4, {}, 10) && !playable(9, 4, { 10: 2 }) && playable(10, 4, { 10: 2 }));
  assert.equal(recommended(4, { 1: 3, 2: 2, 3: 1 }), 4);
  assert.equal(recommended(3, { 1: 3, 2: 2, 3: 3 }), 2);
  let stars = recordLevel({}, 1, 3);
  stars = recordLevel(stars, 1, 1);
  assert.equal(stars[1], 3, "stars never drop");
  assert.equal(totalStars(stars), 3);
});
