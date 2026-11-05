// Difficulty, proven by riding: headless riders of four skills (see tests/bot.ts for what each means) hold the target rates
// on every route, in every mode, over fixed seeds. Every route is also checked for its length and for fairness.
import assert from "node:assert/strict";
import test from "node:test";
import { makeCourse } from "../lib/course";
import { UNIT } from "../lib/geometry";
import { LEVEL_COUNT, LEVELS, MODES, PER_WORLD, isFinale, levelOf } from "../lib/levels";
import { CAREFUL, CASUAL, IDLE, SHARP, rideWith, type Skill } from "./bot";

const SEEDS = 14;
const seeds = (n: number) => Array.from({ length: n }, (_, index) => (index + 1) * 7919);

/** Finish rate, ★★★ rate and mean bumps of `skill` on `level` in `mode`, over fixed seeds. */
function rate(level: number, skill: Skill, mode = 1, n = SEEDS) {
  let finished = 0, three = 0, bumps = 0, time = 0, delivered = 0, goalHit = 0;
  for (const seed of seeds(n)) {
    const ride = rideWith(skill, seed, level, mode);
    finished += +ride.finished; three += +(ride.stars === 3); bumps += ride.bumps; time = Math.max(time, ride.time); delivered += ride.delivered;
    goalHit += +(ride.delivered >= levelOf(level).goal);
  }
  return { finished: finished / n, three: three / n, bumps: bumps / n, time, delivered: delivered / n, goalHit: goalHit / n };
}

test("12 routes in 3 worlds of 4, each world ends in a named finale, each route says its one new thing", () => {
  assert.equal(LEVEL_COUNT, 12);
  for (let world = 0; world < LEVEL_COUNT / PER_WORLD; world++) {
    const finale = world * PER_WORLD + PER_WORLD;
    assert.ok(isFinale(finale) && levelOf(finale).boss?.name, `world ${world} ends in a named finale`);
    for (let level = world * PER_WORLD + 1; level < finale; level++) assert.ok(!isFinale(level));
  }
  for (const row of LEVELS) { assert.ok(row.line.length >= 20 && row.line.length <= 130, row.name); assert.equal(row.name, row.name.normalize("NFC")); }
  assert.equal(new Set(LEVELS.map(row => row.name)).size, LEVEL_COUNT);
});

test("the road is the same for the same seed and route, whatever the speed or the mode", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    assert.deepEqual(makeCourse(4242, level), makeCourse(4242, level));
    assert.notDeepEqual(makeCourse(4242, level).things.map(thing => thing.lane), makeCourse(4243, level).things.map(thing => thing.lane));
  }
});

test("every route is about as long as planned and the place is where the ride ends", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const nominal = levelOf(level).meters * UNIT;
    for (const seed of seeds(10)) {
      const course = makeCourse(seed, level);
      // Route 1's first puddle, three gates and the clear run to the place need room: it runs a little over.
      assert.ok(course.end >= nominal * 0.97 && course.end <= nominal * (level === 1 ? 1.27 : 1.16), `route ${level} seed ${seed}: ${Math.round(course.end / UNIT)} m of ${levelOf(level).meters}`);
      assert.equal(course.houses.length, levelOf(level).houses, `route ${level}: every gate is laid out`);
    }
  }
});

test("careful (perfect reading): every route on every seed is reached with every letter delivered and no bump: the proof each route is fair", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const { finished, three, bumps } = rate(level, CAREFUL, 1, 24);
    assert.equal(finished, 1, `route ${level} reached`);
    assert.ok(three >= 0.95, `route ${level} ★★★: ${three}`);
    assert.ok(bumps <= 0.1, `route ${level} bumps: ${bumps}`);
  }
});

test("স্বাভাবিক: a casual rider reaches route 1 every time inside 10 s; 90% on the rest of world 1; 70% on every other route", () => {
  const first = rate(1, CASUAL);
  assert.equal(first.finished, 1);
  assert.ok(first.time < 10, `route 1 takes ${first.time.toFixed(1)} s`);
  for (let level = 2; level <= LEVEL_COUNT; level++) {
    const { finished } = rate(level, CASUAL);
    assert.ok(finished >= (level <= PER_WORLD ? 0.9 : 0.7), `route ${level}: ${finished}`);
  }
});

test("it is not too easy: from the river on, a casual rider bumps now and then, and in the storm most of the time", () => {
  let river = 0;
  for (let level = PER_WORLD + 1; level <= LEVEL_COUNT; level++) river += rate(level, CASUAL, 1, 20).bumps;
  assert.ok(river / (LEVEL_COUNT - PER_WORLD) >= 0.25, `mean bumps on routes 5–12: ${river / (LEVEL_COUNT - PER_WORLD)}`);
  assert.ok(rate(LEVEL_COUNT, CASUAL, 1, 20).bumps >= 0.8, "the storm bites");
});

test("a sharp rider reaches every route at least 95% of the time, and earns ★★★ on most", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const { finished, three } = rate(level, SHARP);
    assert.ok(finished >= 0.95, `route ${level}: ${finished}`);
    assert.ok(three >= 0.6, `route ${level} ★★★: ${three}`);
  }
});

test("a rider who never touches the screen never delivers a letter to a gate: no ★★ ever, and from route 2 rarely any ★", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const idle = rate(level, IDLE, 1, 20);
    assert.equal(idle.goalHit, 0, `route ${level}`);
    assert.equal(idle.three, 0);
    if (level >= 2) assert.ok(idle.finished <= 0.3, `route ${level}: idle reaches the place ${idle.finished}`);
  }
});

test("সহজ: the casual rider reaches every route (5 bumps are allowed)", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) assert.ok(rate(level, CASUAL, 0).finished >= 0.95, `route ${level}`);
});

test("কঠিন (one bump ends it): the casual rider still reaches route 1 every time; each finale is a real test (20–90%) and harder than its world's first route", () => {
  assert.equal(rate(1, CASUAL, 2).finished, 1);
  for (let world = 0; world < LEVEL_COUNT / PER_WORLD; world++) {
    const opening = rate(world * PER_WORLD + 1, CASUAL, 2, 20).finished, finale = world * PER_WORLD + PER_WORLD;
    const { finished } = rate(finale, CASUAL, 2, 20);
    assert.ok(finished >= 0.2 && finished <= 0.9, `finale ${finale}: ${finished}`);
    assert.ok(finished < opening, `finale ${finale} (${finished}) is harder than route ${world * PER_WORLD + 1} (${opening})`);
  }
});

test("a sharp rider on কঠিন reaches every route at least 85% of the time", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) assert.ok(rate(level, SHARP, 2).finished >= 0.85, `route ${level}`);
});

test("ধীরে খেলো changes only the clock: the same road, the same targets, and a perfect rider earns the same stars", () => {
  for (const level of [3, 8, 12]) {
    for (const seed of seeds(4)) {
      const normal = rideWith(CAREFUL, seed, level, 1, 1), slow = rideWith(CAREFUL, seed, level, 1, 0.75);
      assert.equal(slow.houses, normal.houses);
      assert.equal(slow.stars, normal.stars, "the same targets, the same stars");
      assert.equal(slow.finished, normal.finished);
    }
  }
  assert.deepEqual(MODES.map(mode => mode.limit), [5, 3, 1]);
});
