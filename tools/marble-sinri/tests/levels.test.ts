// The floors: their structure, every ledge fair, the bots' target rates, the modes, the migration and the unlock rule.
import assert from "node:assert/strict";
import test from "node:test";
import { readLevels, unlockedLevel } from "../../../shared/game-core";
import { fair, makeFloor } from "../lib/gen";
import { colourFor, isFinale, levelOf, openColours, COLOUR_AT, LEVEL_COUNT, LEVELS, MARBLES, MODES, PER_WORLD, WORLDS } from "../lib/levels";
import { landable, makeLedge, CONCRETE, GAP, W } from "../lib/physics";
import { afterClear, migrateLadder, playable, readMode, readUnlock, recommended } from "../lib/progress";
import { CASUAL, PERFECT, SHARP, rate } from "./bot";

test("three worlds of four, each ending in its named finale, each floor faster or busier than the one before it in its world", () => {
  assert.equal(LEVEL_COUNT, WORLDS.length * PER_WORLD);
  WORLDS.forEach((world, index) => {
    const finale = LEVELS[(index + 1) * PER_WORLD - 1];
    assert.equal(finale.name, world.finale);
    assert.ok(isFinale((index + 1) * PER_WORLD) && finale.line.startsWith("শেষ তলা:"));
    for (let level = index * PER_WORLD + 1; level <= (index + 1) * PER_WORLD; level++) assert.equal(levelOf(level).world, index);
  });
  for (const row of LEVELS) assert.ok(row.line.length <= 80 && row.line === row.line.normalize("NFC") && row.name === row.name.normalize("NFC"));
  assert.equal(new Set(LEVELS.map(row => row.name)).size, LEVEL_COUNT);
});

test("each floor brings exactly one new thing: a feature none of the floors before it had", () => {
  const features = ["picks", "pots", "gust", "wet", "tilt", "crack", "dark", "round", "holes", "surge"] as const;
  const seen = new Set<string>();
  LEVELS.forEach((row, index) => {
    const fresh = features.filter(feature => (feature === "dark" ? row.dark : row[feature] > 0) && !seen.has(feature));
    if (index === 0) assert.deepEqual(fresh, [], "floor 1 is only rolling and dropping");
    else if (index === LEVEL_COUNT - 1) assert.deepEqual(fresh, [], "the last finale brings the scaffold's things together");
    else assert.equal(fresh.length, 1, `floor ${index + 1} adds ${fresh.join(", ") || "nothing"}`);
    fresh.forEach(feature => seen.add(feature));
  });
});

test("fair: on every floor of 120 seeds, every ledge can be reached from the one above in time, and has a way off", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    for (let seed = 1; seed <= 120; seed++) {
      const rows = makeFloor(seed * 104_729 + level, level);
      assert.equal(rows.length, levelOf(level).steps + 1);
      assert.ok(rows[rows.length - 1].floor);
      for (let index = 1; index < rows.length; index++) {
        const [a, b] = [rows[index - 1], rows[index]];
        assert.ok(b.y - a.y === GAP && b.x0 >= 0 && b.x1 <= W && landable(b), `floor ${level} seed ${seed} row ${index}`);
        if (b.floor) continue;
        assert.ok(fair(a, b), `floor ${level} seed ${seed}: row ${index} can't be reached`);
        assert.ok(fair(b, makeLedge(b.row + 1, 0, W, b.y + GAP, CONCRETE, b.speed)), `floor ${level} seed ${seed}: row ${index} traps the marble`);
      }
    }
  }
});

test("bots: a perfect planner never falls; a casual player clears every floor and ★★★ gets harder; কঠিন bites in the finales; a sharp player clears them", () => {
  const casual = [], hard = [], sharp = [];
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const perfect = rate(level, PERFECT, 12);
    assert.equal(perfect.cleared, 1, `the planner clears floor ${level}`);
    assert.ok(perfect.three >= 0.9, `the planner's ★★★ on floor ${level}: ${perfect.three}`);
    casual.push(rate(level, CASUAL, 40)); hard.push(rate(level, CASUAL, 40, 1)); sharp.push(rate(level, SHARP, 40, 1));
  }
  assert.equal(casual[0].cleared, 1, "floor 1 is always won");
  assert.ok(casual[0].time < 10, `floor 1 takes ${casual[0].time.toFixed(1)} s`);
  assert.ok(casual[0].three >= 0.8, `floor 1 ★★★ ${casual[0].three}`);
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    assert.ok(casual[level - 1].cleared >= 0.85, `casual clears floor ${level}: ${casual[level - 1].cleared}`);
    assert.ok(sharp[level - 1].cleared >= 0.6, `sharp clears floor ${level} on কঠিন: ${sharp[level - 1].cleared}`);
  }
  for (const finale of [4, 8, 12]) {
    const { cleared } = hard[finale - 1];
    assert.ok(cleared >= 0.35 && cleared <= 0.85, `casual on কঠিন, finale ${finale}: ${cleared}`);
    assert.ok(cleared < hard[finale - PER_WORLD].cleared, `finale ${finale} is harder than its world's first floor`);
  }
  assert.ok(casual[LEVEL_COUNT - 1].three <= 0.65 && casual[LEVEL_COUNT - 1].three < casual[0].three, `the last floor's ★★★ is earned: ${casual[LEVEL_COUNT - 1].three}`);
});

test("সহজ, স্বাভাবিক, কঠিন change only the chances", () => {
  assert.deepEqual(MODES.map(mode => mode.chances), [5, 3, 1]);
  assert.deepEqual([readMode(null), readMode("0"), readMode("2"), readMode("x")], [1, 0, 2, 1]);
});

test("migration: the old 8-stage stars open the new ladder once; nobody loses a stage or a colour", () => {
  assert.equal(migrateLadder("{}", "{\"8\":3}"), null, "already migrated");
  assert.equal(migrateLadder(null, null), null, "a new phone");
  assert.equal(migrateLadder(null, "junk"), null);
  const all = JSON.parse(migrateLadder(null, JSON.stringify({ 1: 3, 2: 3, 3: 2, 4: 2, 5: 1, 6: 1, 7: 1, 8: 3 }))!);
  assert.equal(Object.keys(all).length, 12);
  assert.deepEqual([all[1], all[4], all[12]], [3, 2, 3], "each new floor carries the old stage in its place");
  const some = JSON.parse(migrateLadder(null, JSON.stringify({ 1: 2, 2: 1 }))!);
  assert.deepEqual(some, { 1: 2, 2: 1, 3: 1 });
  assert.equal(unlockedLevel(readLevels(JSON.stringify(some), LEVEL_COUNT), LEVEL_COUNT), 4);
  // Every colour the old game had open (colour i for old stage i) is still open after the move.
  for (let cleared = 1; cleared <= 8; cleared++) {
    const old: Record<number, number> = {};
    for (let stage = 1; stage <= cleared; stage++) old[stage] = 1;
    const moved = readLevels(migrateLadder(null, JSON.stringify(old)), LEVEL_COUNT), open = openColours(moved);
    for (let colour = 0; colour <= cleared; colour++) assert.ok(open[colour], `old stage ${cleared}: colour ${colour}`);
  }
  assert.equal(MARBLES.length, COLOUR_AT.length);
  assert.deepEqual([colourFor(1), colourFor(2), colourFor(12)], [1, -1, 8]);
});

test("own unlock: migrated once from the stars, then a friend's far-ahead floor opens nothing in between", () => {
  assert.deepEqual(readUnlock(null, { 1: 3, 2: 1 }), { unlock: 3, migrated: true });
  assert.deepEqual(readUnlock("5", {}), { unlock: 5, migrated: false });
  assert.equal(afterClear(3, 3), 4, "clearing the furthest open floor opens the next");
  assert.equal(afterClear(3, 1), 3);
  assert.equal(afterClear(3, 9), 3, "a friend's floor 9 records stars but opens nothing");
  assert.equal(afterClear(12, 12), 12);
  assert.ok(playable(9, 3, {}, 9) && !playable(8, 3, { 9: 2 }) && playable(9, 3, { 9: 2 }));
  assert.equal(recommended(4, { 1: 3, 2: 2, 3: 1 }), 4);
  assert.equal(recommended(3, { 1: 3, 2: 2, 3: 3 }), 2);
});
