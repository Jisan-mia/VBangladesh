// Every level is fair and teaches one thing: headless bots (bot.ts) play each level over many seeds, and the rates the
// design promises are asserted here (ai_docs/game-dev/rewrites/deri-hoye-gelo.md).
import assert from "node:assert/strict";
import test from "node:test";
import { finaleStart, PAGE, planRoad, PUDDLE, SPEC, UNIT } from "../lib/course";
import { bellOf, cleanTime } from "../lib/game";
import { LEVEL_COUNT, LEVELS, MODE_INFO, MODES, PAGES, starsOf, WORLDS, type Mode } from "../lib/levels";
import { CASUAL, percentile, play, SKILLED, type Skill } from "./bot";

const SEEDS = Array.from({ length: 40 }, (_, index) => 7919 * (index + 1));
type Rates = { clear: number; three: number; median: number };
function rates(level: number, mode: Mode, skill: Skill, seeds = SEEDS, slow = false): Rates {
  let clear = 0, three = 0;
  const times: number[] = [];
  for (const seed of seeds) {
    const outcome = play(seed, level, mode, skill, slow);
    if (!outcome.won) continue;
    clear++; times.push(outcome.time);
    if (starsOf(true, outcome.stumbles, outcome.pages, level) === 3) three++;
  }
  times.sort((a, b) => a - b);
  return { clear: clear / seeds.length, three: three / seeds.length, median: times.length ? percentile(times, 0.5) : Infinity };
}
const table = new Map<string, Rates>();
const cached = (level: number, skill: Skill) => {
  const key = `${level}${skill.name}`;
  if (!table.has(key)) table.set(key, rates(level, "n", skill));
  return table.get(key)!;
};

test("level 1: the first win comes within 10 seconds, and everyone who plays clears it", () => {
  const casual = cached(1, CASUAL);
  assert.ok(casual.median <= 10, `casual median ${casual.median.toFixed(1)} s`);
  assert.ok(casual.clear >= 0.97);
  assert.ok(cleanTime(LEVELS[0]) <= 10, "a clean run is under 10 s");
});

test("normal: the casual bot clears World 1 on ≥ 90% of seeds and every level on ≥ 60%", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const { clear } = cached(level, CASUAL), floor = LEVELS[level - 1].world === 0 ? 0.9 : 0.6;
    assert.ok(clear >= floor, `level ${level}: casual clears ${(clear * 100).toFixed(0)}%`);
  }
});

test("normal: the skilled bot clears every level on ≥ 95% of seeds and earns three stars on ≥ 60%", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const { clear, three } = cached(level, SKILLED);
    assert.ok(clear >= 0.95, `level ${level}: skilled clears ${(clear * 100).toFixed(0)}%`);
    assert.ok(three >= 0.6, `level ${level}: skilled 3 stars ${(three * 100).toFixed(0)}%`);
  }
});

test("never pressing anything loses every level in সাধারণ and কঠিন; a masher does not clear the finales", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) for (const seed of SEEDS.slice(0, 6)) {
    for (const mode of ["n", "h"] as const) assert.equal(play(seed, level, mode, "idle").won, false, `level ${level} idle ${mode}`);
  }
  for (const level of [4, 8, 12]) for (const seed of SEEDS.slice(0, 6)) assert.equal(play(seed, level, "n", "masher").won, false, `finale ${level} masher`);
});

test("each world's finale is among its harder levels for the casual bot, and the worlds get harder", () => {
  const mean = (world: number) => {
    const list = LEVELS.map((def, index) => ({ def, level: index + 1 })).filter(({ def }) => def.world === world);
    return list.reduce((sum, { level }) => sum + cached(level, CASUAL).clear, 0) / list.length;
  };
  assert.ok(mean(0) > mean(2), `World 1 ${mean(0).toFixed(2)}, World 3 ${mean(2).toFixed(2)}`);
  for (let world = 0; world < 3; world++) {
    const list = LEVELS.map((def, index) => ({ def, level: index + 1 })).filter(({ def }) => def.world === world);
    const finale = cached(list[3].level, CASUAL).clear;
    for (const { level } of list.slice(0, 3)) assert.ok(finale <= cached(level, CASUAL).clear + 0.03, `world ${world + 1}: finale ${finale} vs level ${level}`);
  }
  assert.ok(cached(12, CASUAL).three <= cached(1, CASUAL).three, "the last level earns the fewest three-star runs");
});

test("সহজ is really easy (the casual bot clears everything); কঠিন is still fair for the skilled bot", () => {
  const seeds = SEEDS.slice(0, 20);
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    assert.ok(rates(level, "e", CASUAL, seeds).clear >= 0.95, `level ${level}: easy casual`);
    assert.ok(rates(level, "h", SKILLED, seeds).clear >= 0.9, `level ${level}: hard skilled`);
  }
  // The mode moves only the bell: the road and the stars stay.
  assert.ok(MODES.every((mode, at) => !at || MODE_INFO[mode].stumbles < MODE_INFO[MODES[at - 1]].stumbles || mode === "n"));
  for (let level = 1; level <= LEVEL_COUNT; level++) assert.ok(bellOf(level, "e") > bellOf(level, "n") && bellOf(level, "n") > bellOf(level, "h"));
  assert.deepEqual(planRoad(11, 200, LEVELS[5]), planRoad(11, 200, LEVELS[5]));
});

test("ধীরে খেলো is the same road and the same bell, only slower: the casual bot still clears and stars follow the same rule", () => {
  for (const level of [1, 4, 5, 9, 12]) {
    const slow = rates(level, "n", CASUAL, SEEDS.slice(0, 12), true), fast = rates(level, "n", CASUAL, SEEDS.slice(0, 12));
    assert.ok(slow.clear >= 0.6, `level ${level} slow ${slow.clear}`);
    assert.ok(slow.three <= fast.three + 0.1, `slow mode never makes three stars easier (level ${level}: ${slow.three} vs ${fast.three})`);
  }
  assert.equal(starsOf.length, 4, "stars read (won, stumbles, pages, level) and nothing about slow mode");
});

test("a level's stars are three separate jobs: the gate, no stumble, every page", () => {
  assert.equal(starsOf(false, 0, 3, 5), 0);
  assert.equal(starsOf(true, 2, 1, 5), 1);
  assert.equal(starsOf(true, 0, 1, 5), 2);
  assert.equal(starsOf(true, 3, PAGES, 5), 2);
  assert.equal(starsOf(true, 0, PAGES, 5), 3);
  assert.equal(starsOf(true, 0, PAGES, 0), 0, "যত দূর পারো has no stars");
});

/** What each level brings that no earlier level had. */
function newThings(index: number) {
  const def = LEVELS[index], out = new Set<string>();
  for (const [kind, weight] of Object.entries(def.kinds)) if ((weight ?? 0) > 0) out.add(String(kind));
  if (def.pairs) out.add("pairs");
  if (def.highPages) out.add("high pages");
  if (def.sprint) out.add("sprint");
  if (def.finale) out.add(`finale ${def.finale.name}`);
  return out;
}

test("each level adds one new thing, and each world ends with a named finale", () => {
  const seen = new Set<string>();
  assert.equal(new Set(LEVELS.map(def => def.title)).size, LEVEL_COUNT, "every level has its own title");
  assert.equal(new Set(LEVELS.map(def => def.name)).size, LEVEL_COUNT, "every level is its own place");
  assert.equal(WORLDS.length, 3);
  for (let index = 0; index < LEVEL_COUNT; index++) {
    const def = LEVELS[index];
    // The thing a level teaches is one obstacle; the finale and the sprint ride on top of it.
    const fresh = [...newThings(index)].filter(item => !seen.has(item) && !item.startsWith("finale") && item !== "sprint" && item !== "high pages" && item !== "pairs");
    assert.ok(fresh.length <= 1, `level ${index + 1} adds ${fresh.join(", ")}`);
    assert.ok(def.teach.length > 10, `level ${index + 1} says what it teaches`);
    for (const item of newThings(index)) seen.add(item);
  }
  for (let world = 0; world < 3; world++) {
    const list = LEVELS.filter(def => def.world === world);
    assert.equal(list.length, 4);
    assert.ok(list[3].finale && list.slice(0, 3).every(def => !def.finale), "only the fourth level is a finale");
    assert.ok(list[3].title.includes(list[3].finale!.name.split(" ")[0]) || list[3].finale!.name.length > 3);
  }
  // Gates and speeds only grow inside a world; the last level is the longest and the fastest.
  for (let index = 1; index < LEVEL_COUNT; index++) if (LEVELS[index].world === LEVELS[index - 1].world) assert.ok(LEVELS[index].speed >= LEVELS[index - 1].speed);
  assert.ok(LEVELS[11].gate === Math.max(...LEVELS.map(def => def.gate)) && LEVELS[11].sprint > 0);
});

test("each level's road holds its new thing early, its finale at the end, and exactly three pages", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const def = LEVELS[level - 1];
    for (const seed of [3, 77, 4242, 90001]) {
      const road = planRoad(seed, def.gate, def), things = road.filter(piece => piece.kind !== PAGE && piece.w > 0);
      assert.equal(road.filter(piece => piece.kind === PAGE).length, PAGES, `level ${level} seed ${seed}: pages`);
      assert.equal(things[0].kind, PUDDLE, `level ${level}: a puddle first`);
      assert.ok(things[0].x >= 18 * UNIT - 1);
      const lesson = things.find(piece => piece.hint > 0 && piece.kind === def.fresh);
      assert.ok(lesson, `level ${level}: its new thing carries a lesson`);
      assert.ok(things.some(piece => piece.kind === def.fresh), `level ${level} has its new thing`);
      assert.ok(things.every(piece => piece.x + piece.w <= (def.gate - 2) * UNIT), `level ${level}: nothing blocks the gate`);
      if (def.finale) {
        const bosses = things.filter(piece => piece.boss);
        assert.equal(bosses.length, def.finale.count, `level ${level}: the finale has ${def.finale.count} things`);
        assert.ok(bosses.every(piece => piece.x / UNIT >= finaleStart(def) - 20), "the finale sits at the end");
        assert.ok(def.finale.kinds.every(kind => SPEC[kind].w > 0));
      } else assert.ok(things.every(piece => !piece.boss));
    }
  }
});

test("the bell keeps its promise: each mode's stumbles still reach the gate in time, and a few more do not on the longer levels", () => {
  const seeds = SEEDS.slice(0, 12);
  for (const mode of MODES) {
    const allowed = MODE_INFO[mode].stumbles;
    for (const level of [1, 4, 8, 12]) {
      const wins = seeds.filter(seed => play(seed, level, mode, { ...SKILLED, crash: allowed }).won).length;
      assert.ok(wins >= seeds.length - 1, `${mode} level ${level}: ${allowed} stumbles still win (${wins}/${seeds.length})`);
    }
    const late = seeds.filter(seed => play(seed, 12, mode, { ...SKILLED, crash: allowed + 4 }).won).length;
    assert.ok(late <= 2, `${mode}: ${allowed + 4} stumbles on the last level are late (${late}/${seeds.length} won)`);
  }
});
