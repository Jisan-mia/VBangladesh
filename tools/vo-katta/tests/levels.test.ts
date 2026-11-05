// Every level is fair and teaches one thing: headless bots (tests/bot.ts) play each level over many seeds,
// and the rates the design promises are asserted here (ai_docs/game-dev/rewrites/vo-katta.md).
import assert from "node:assert/strict";
import test from "node:test";
import { BOSSES, LEVEL_COUNT, LEVELS, levelDef, MODE_INFO, RIVALS, starsOf, type Mode, type RivalKind } from "../lib/levels";
import { CASUAL, HOLDER, play, percentile, SKILLED, type Skill } from "./bot";

const SEEDS = Array.from({ length: 30 }, (_, index) => 7919 * (index + 1));
type Rates = { clear: number; three: number; median: number; lost: number };
function rates(level: number, mode: Mode, skill: Skill | "idle", seeds = SEEDS, slow = false): Rates {
  let clear = 0, three = 0, lost = 0;
  const times: number[] = [];
  for (const seed of seeds) {
    const outcome = play(seed, level, mode, skill, slow);
    // An idle player may simply hover for ever; everyone who plays finishes the evening.
    if (!outcome && skill === "idle") continue;
    assert.ok(outcome, `level ${level} seed ${seed} ends within 4 minutes`);
    lost += outcome.lost;
    if (!outcome.won) continue;
    clear++; times.push(outcome.time);
    if (starsOf(true, outcome.lost, mode) === 3) three++;
  }
  times.sort((a, b) => a - b);
  return { clear: clear / seeds.length, three: three / seeds.length, median: times.length ? percentile(times, 0.5) : Infinity, lost: lost / seeds.length };
}

const table = new Map<string, Rates>();
const cached = (level: number, mode: Mode, skill: Skill | "idle") => {
  const key = `${level}${mode}${typeof skill === "string" ? skill : skill.name}`;
  if (!table.has(key)) table.set(key, rates(level, mode, skill));
  return table.get(key)!;
};

test("level 1: the first win comes within 10 seconds, and nobody who plays at all loses it", () => {
  const casual = cached(1, "n", CASUAL);
  assert.ok(casual.median <= 10, `casual median ${casual.median.toFixed(1)} s`);
  assert.equal(casual.clear, 1);
  assert.equal(cached(1, "n", HOLDER).clear, 1, "even holding টান non-stop clears it");
  const first = play(SEEDS[0], 1, "n", CASUAL)!;
  assert.ok(first.game.fastest < 4, "the first প্যাঁচ is short");
});

test("normal: the casual bot clears World 1 on ≥ 90% of seeds and every level on ≥ 60%", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const { clear } = cached(level, "n", CASUAL), floor = levelDef(level).world === 0 ? 0.9 : 0.6;
    assert.ok(clear >= floor, `level ${level}: casual clears ${(clear * 100).toFixed(0)}%`);
  }
});

test("normal: the skilled bot clears every level on ≥ 95% of seeds and keeps every kite on most", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const { clear, three } = cached(level, "n", SKILLED);
    assert.ok(clear >= 0.95, `level ${level}: skilled clears ${(clear * 100).toFixed(0)}%`);
    assert.ok(three >= 0.75, `level ${level}: skilled 3 stars ${(three * 100).toFixed(0)}%`);
  }
});

test("skill shows: feathering beats holding টান non-stop, and never touching loses every level", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const casual = cached(level, "n", CASUAL), holder = cached(level, "n", HOLDER), idle = cached(level, "n", "idle");
    assert.ok(holder.clear <= casual.clear, `level ${level}: holder ${holder.clear} vs casual ${casual.clear}`);
    assert.ok(holder.lost >= casual.lost, `level ${level}: holder loses at least as many kites`);
    if (holder.clear === 1) assert.ok(holder.median > casual.median, `level ${level}: holding is slower`);
    if (level >= 3) assert.ok(holder.clear <= 0.2, `level ${level}: holding fails from the first charger on (${holder.clear})`);
    assert.equal(idle.clear, 0, `level ${level}: an idle player never clears`);
  }
});

test("later levels are harder: the casual bot keeps every kite less often in World 3 than in World 1", () => {
  const mean = (world: number) => {
    const levels = LEVELS.map((def, index) => ({ def, level: index + 1 })).filter(({ def }) => def.world === world);
    return levels.reduce((sum, { level }) => sum + cached(level, "n", CASUAL).three, 0) / levels.length;
  };
  assert.ok(mean(0) > mean(1) && mean(1) >= mean(2) - 0.05, `World 1 ${mean(0).toFixed(2)}, World 2 ${mean(1).toFixed(2)}, World 3 ${mean(2).toFixed(2)}`);
});

test("easy is really easy (the casual bot clears everything) and never gives 3 stars; hard is still fair for the skilled", () => {
  const seeds = SEEDS.slice(0, 15);
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const easy = rates(level, "e", CASUAL, seeds);
    assert.ok(easy.clear >= 0.95, `level ${level}: easy casual ${easy.clear}`);
    assert.equal(easy.three, 0, "easy tops out at two stars");
    const hard = rates(level, "h", SKILLED, seeds);
    assert.ok(hard.clear >= 0.9, `level ${level}: hard skilled ${hard.clear}`);
  }
});

test("slow mode is the same evening slower: the casual bot still clears the first levels, and stars follow the same rule", () => {
  for (const level of [1, 3, 5]) {
    const slow = rates(level, "n", CASUAL, SEEDS.slice(0, 10), true);
    assert.ok(slow.clear >= 0.9, `level ${level} slow: ${slow.clear}`);
  }
  assert.equal(starsOf.length, 2, "stars never read slow mode");
});

test("each level adds one new thing, each evening ends with a named champion", () => {
  const seen = new Set<string>();
  const features = (index: number) => {
    const def = LEVELS[index], out = new Set<string>(def.roster);
    if (def.pair) out.add("pair");
    if (def.gusts) out.add("gusts");
    if (def.lanterns) out.add("lanterns");
    if (def.wind > 1.2) out.add("wind");
    return out;
  };
  const titles = new Set(LEVELS.map(def => def.title)), names = new Set(LEVELS.map(def => def.name));
  assert.equal(titles.size, LEVEL_COUNT, "every level has its own title");
  assert.equal(names.size, LEVEL_COUNT, "every level is its own পাড়া");
  for (let index = 0; index < LEVEL_COUNT; index++) {
    const def = LEVELS[index], fresh = [...features(index)].filter(item => !seen.has(item));
    assert.ok(fresh.length <= 1, `level ${index + 1} adds ${fresh.join(", ")}`);
    if (def.finale) assert.ok(fresh.length === 1 && BOSSES.includes(fresh[0] as RivalKind), `level ${index + 1}'s one new thing is its champion`);
    for (const item of features(index)) seen.add(item);
  }
  for (let world = 0; world < 3; world++) {
    const levels = LEVELS.filter(def => def.world === world);
    assert.equal(levels.length, 4);
    assert.ok(levels[3].finale && levels.slice(0, 3).every(def => !def.finale));
    const boss = levels[3].roster[levels[3].roster.length - 1];
    assert.ok(RIVALS[boss].notches >= 3 && levels[3].title.includes(RIVALS[boss].name.split(" ").pop()!), `${levels[3].title} names ${RIVALS[boss].name}`);
  }
  for (const mode of ["e", "n", "h"] as const) assert.ok(MODE_INFO[mode].kites >= 3);
});
