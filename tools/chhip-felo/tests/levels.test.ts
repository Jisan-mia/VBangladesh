// Every level is fair and teaches one thing: headless anglers (tests/bot.ts) play each level over many seeds,
// and the rates the design promises are asserted here (ai_docs/game-dev/rewrites/chhip-felo.md).
import assert from "node:assert/strict";
import test from "node:test";
import { LEVEL_COUNT, LEVELS, levelDef, MODE_INFO, starsOf, WORLDS, type Mode } from "../lib/levels";
import { BOSSES, FISH, T, traitWords } from "../lib/species";
import { CASUAL, HOLDER, percentile, play, SKILLED, type Skill } from "./bot";

const SEEDS = Array.from({ length: 30 }, (_, index) => 7919 * (index + 1));
type Rates = { clear: number; three: number; median: number };
function rates(level: number, mode: Mode, skill: Skill | "idle", seeds = SEEDS, slow = false): Rates {
  let clear = 0, three = 0;
  const times: number[] = [];
  for (const seed of seeds) {
    const outcome = play(seed, level, mode, skill, slow);
    // An idle player never casts, so its trip never ends; everyone who plays finishes the level.
    if (!outcome && skill === "idle") continue;
    assert.ok(outcome, `level ${level} seed ${seed} ends within five minutes`);
    if (!outcome.won) continue;
    clear++; times.push(outcome.landed);
    if (starsOf(true, outcome.lost, mode) === 3) three++;
  }
  times.sort((a, b) => a - b);
  return { clear: clear / seeds.length, three: three / seeds.length, median: times.length ? percentile(times, 0.5) : Infinity };
}
const table = new Map<string, Rates>();
const cached = (level: number, mode: Mode, skill: Skill | "idle") => {
  const key = `${level}${mode}${typeof skill === "string" ? skill : skill.name}`;
  if (!table.has(key)) table.set(key, rates(level, mode, skill));
  return table.get(key)!;
};
const pct = (value: number) => `${(value * 100).toFixed(0)}%`;

test("level 1: the win comes within 10 seconds, and even holding the whole reel clears it", () => {
  const casual = cached(1, "n", CASUAL);
  assert.ok(casual.median <= 10, `casual median ${casual.median.toFixed(1)} s`);
  assert.equal(casual.clear, 1);
  assert.equal(cached(1, "n", HOLDER).clear, 1, "level 1's line never snaps; the red edge teaches instead");
});

test("normal: the casual angler clears World 1 on ≥ 90% of seeds and every level on ≥ 75%", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const { clear } = cached(level, "n", CASUAL), floor = levelDef(level).world === 0 ? 0.9 : 0.75;
    assert.ok(clear >= floor, `level ${level}: casual clears ${pct(clear)}`);
  }
});

test("normal: the skilled angler clears every level on ≥ 95% and keeps every bait on ≥ 75%", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const { clear, three } = cached(level, "n", SKILLED);
    assert.ok(clear >= 0.95, `level ${level}: skilled clears ${pct(clear)}`);
    assert.ok(three >= 0.75, `level ${level}: skilled 3 stars ${pct(three)}`);
  }
});

test("skill shows: holding the whole reel fails from level 2 on, and never touching never clears", () => {
  for (let level = 2; level <= LEVEL_COUNT; level++) assert.ok(cached(level, "n", HOLDER).clear <= 0.1, `level ${level}: holder ${pct(cached(level, "n", HOLDER).clear)}`);
  for (const level of [1, 4, 9, 16]) assert.equal(cached(level, "n", "idle").clear, 0);
});

test("later waters are harder: the casual angler keeps every bait less often in each world than the one before", () => {
  const mean = (world: number) => {
    const levels = LEVELS.map((def, index) => ({ def, level: index + 1 })).filter(({ def }) => def.world === world);
    return levels.reduce((sum, { level }) => sum + cached(level, "n", CASUAL).three, 0) / levels.length;
  };
  const worlds = [0, 1, 2, 3].map(mean);
  for (let world = 1; world < 4; world++) assert.ok(worlds[world] < worlds[world - 1] + 0.02, `worlds ${worlds.map(pct).join(" ")}`);
  assert.ok(worlds[3] < worlds[0] - 0.25, "the হাওর is clearly harder than the পুকুর");
});

test("সহজ is really easy and never gives 3 stars; কঠিন is still fair for the skilled", () => {
  const seeds = SEEDS.slice(0, 15);
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const easy = rates(level, "e", CASUAL, seeds);
    assert.ok(easy.clear >= 0.95, `level ${level}: easy casual ${pct(easy.clear)}`);
    assert.equal(easy.three, 0, "easy tops out at two stars");
    const hard = rates(level, "h", SKILLED, seeds);
    assert.ok(hard.clear >= 0.9, `level ${level}: hard skilled ${pct(hard.clear)}`);
  }
});

test("ধীরে খেলো is the same water slower: the casual angler clears every level, and stars follow the same rule", () => {
  for (const level of [1, 4, 8, 12, 16]) {
    const slow = rates(level, "n", CASUAL, SEEDS.slice(0, 12), true);
    assert.ok(slow.clear >= 0.85, `level ${level} slow: ${pct(slow.clear)}`);
  }
  assert.equal(starsOf.length, 2, "stars never read slow mode");
});

/** What a level shows a player for the first time: a trait of a fish in its pool, or a feature of the water. */
function features(index: number) {
  const def = LEVELS[index], out = new Set<string>();
  for (const fish of def.pool) for (const [bit] of [[T.SURGE], [T.JUMP], [T.SLIP], [T.RUSH], [T.SOFT]]) if (FISH[fish].traits & bit) out.add(`trait${bit}`);
  if (def.fakes) out.add("nibbles");
  if (def.pads) out.add("pads");
  if (def.current) out.add("current");
  if (def.waves) out.add("waves");
  if (def.dark) out.add("dark");
  if (def.boss >= 0) out.add(`boss${def.boss}`);
  return out;
}

test("each level adds one new thing, and each water ends with a named boss", () => {
  const seen = new Set<string>();
  assert.equal(new Set(LEVELS.map(def => def.title)).size, LEVEL_COUNT, "every level has its own title");
  for (let index = 0; index < LEVEL_COUNT; index++) {
    const def = LEVELS[index], fresh = [...features(index)].filter(item => !seen.has(item));
    // The mixed level adds nothing new on purpose: it's the rehearsal before the last boss.
    if (def.title !== "সব একসাথে") assert.ok(fresh.length === 1 || (index === 0 && fresh.length === 0), `level ${index + 1} adds ${fresh.join(", ") || "nothing"}`);
    if (def.boss >= 0) assert.deepEqual(fresh, [`boss${def.boss}`], `level ${index + 1}'s one new thing is its boss`);
    // A level that brings a new kind of fish makes it bite first.
    if (def.first >= 0) assert.ok(def.pool.includes(def.first));
    for (const item of features(index)) seen.add(item);
    assert.ok(def.teach.length <= 70, `level ${index + 1}'s line is short`);
  }
  for (let world = 0; world < WORLDS.length; world++) {
    const levels = LEVELS.filter(def => def.world === world);
    assert.equal(levels.length, 4);
    assert.ok(levels[3].boss === world && levels.slice(0, 3).every(def => def.boss < 0));
    assert.equal(levels[3].title, BOSSES[world].name, "the finale is named after its boss");
    assert.ok(BOSSES[world].notches >= 3);
  }
  for (const mode of ["e", "n", "h"] as const) assert.ok(MODE_INFO[mode].spare >= 1);
});

test("every fish in the album can be caught somewhere, and each says its personality", () => {
  const reachable = new Set(LEVELS.flatMap(def => def.pool));
  for (let index = 0; index < FISH.length; index++) {
    assert.ok(reachable.has(index), `${FISH[index].name} bites in some level`);
    for (const level of LEVELS) if (level.pool.includes(index)) assert.ok(FISH[index].places.includes(WORLDS[level.world].water), `${FISH[index].name} lives in ${WORLDS[level.world].name}`);
  }
  assert.equal(traitWords(0), "শান্ত");
  assert.equal(traitWords(T.SURGE | T.JUMP), "ঘাই মারে, লাফায়");
});
