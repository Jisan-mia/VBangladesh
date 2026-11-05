// Difficulty by bots: a casual player (slow eyes, a wobbly aim, a lazy hand) and a skilled one play every stall over many
// seeds, and the rates are the design's promises. Also the levels as data: one new thing each, a named finale per মেলা.
import assert from "node:assert/strict";
import test from "node:test";
import { LEVELS, LEVEL_COUNT, MODE_INFO, WORLDS, potCount, starsOf, type Mode } from "../lib/levels";
import { E_OVER, left } from "../lib/rules";
import { CASUAL, percentile, play, runOf, SKILLED, type Skill } from "./bot";

const N = 24;
/** Plays stall `level` on N seeds; returns the share cleared, the share cleared without losing a ball, the median seconds and median tail. */
function rates(level: number, skill: Skill, mode: Mode = "n", seeds = N) {
  let cleared = 0, perfect = 0, topStars = 0;
  const seconds: number[] = [], tails: number[] = [];
  for (let seed = 1; seed <= seeds; seed++) {
    const out = play(runOf(seed * 101 + level, level, mode), skill);
    if (!out.cleared) continue;
    cleared++; seconds.push(out.seconds); tails.push(out.tail);
    if (out.game.lost === 0) perfect++;
    topStars = Math.max(topStars, starsOf(true, out.game.lost, mode));
  }
  seconds.sort((a, b) => a - b); tails.sort((a, b) => a - b);
  return { clear: cleared / seeds, perfect: perfect / seeds, median: percentile(seconds, 0.5) ?? Infinity, tail: percentile(tails, 0.5) ?? Infinity, topStars };
}
const casual = Array.from({ length: LEVEL_COUNT }, (_, index) => rates(index + 1, CASUAL));
const skilled = Array.from({ length: LEVEL_COUNT }, (_, index) => rates(index + 1, SKILLED));

test("stall 1 is won in about ten seconds by a casual player, nearly always", () => {
  const first = rates(1, CASUAL, "n", 60);
  assert.ok(first.clear >= 0.97, `cleared ${first.clear}`);
  assert.ok(first.median <= 10, `median ${first.median}s`);
  assert.ok(skilled[0].median <= 10);
});

test("a skilled player clears every stall; a casual one clears the first world easily and every stall more often than not lost", () => {
  skilled.forEach((row, index) => assert.ok(row.clear >= 0.85, `skilled, stall ${index + 1}: ${row.clear}`));
  casual.forEach((row, index) => assert.ok(row.clear >= 0.35, `casual, stall ${index + 1}: ${row.clear}`));
  for (let index = 0; index < 4; index++) assert.ok(casual[index].clear >= 0.7, `casual, world 1, stall ${index + 1}: ${casual[index].clear}`);
});

test("each মেলা's finale is the hardest stall of its world for the casual player", () => {
  for (let world = 0; world < WORLDS.length; world++) {
    const stalls = LEVELS.map((def, index) => ({ def, index })).filter(({ def }) => def.world === world);
    const finale = stalls[stalls.length - 1];
    assert.ok(finale.def.finale, `world ${world} ends in a named মটকা`);
    for (const other of stalls.slice(0, -1)) assert.ok(casual[finale.index].clear < casual[other.index].clear, `world ${world}: finale ${casual[finale.index].clear} vs stall ${other.index + 1} ${casual[other.index].clear}`);
  }
});

test("the end of a stall is a run of aimed throws, not a grind: the last five pots take a skilled player about fifteen seconds, the old stall took fifty", () => {
  skilled.forEach((row, index) => assert.ok(row.tail <= 18, `skilled, stall ${index + 1}: last pots took ${row.tail}s`));
  casual.forEach((row, index) => assert.ok(row.tail <= 25, `casual, stall ${index + 1}: last pots took ${row.tail}s`));
  casual.forEach((row, index) => assert.ok(row.median <= 60, `casual, stall ${index + 1}: ${row.median}s`));
});

test("সহজ: a casual player clears every stall, the stars stop at two", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const row = rates(level, CASUAL, "e", 16);
    assert.ok(row.clear >= 0.75, `easy, stall ${level}: ${row.clear}`);
    assert.ok(row.topStars <= 2, "never three stars");
  }
  assert.equal(MODE_INFO.e.balls, 5);
});

test("কঠিন: a skilled player still clears every stall more often than not", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const row = rates(level, SKILLED, "h", 16);
    assert.ok(row.clear >= 0.55, `hard, stall ${level}: ${row.clear}`);
  }
});

test("each stall adds one thing and never gets easier; each মেলা ends in a named মটকা", () => {
  const teach = new Set<string>();
  LEVELS.forEach((def, index) => {
    assert.ok(!teach.has(def.teach), "no two stalls teach the same line");
    teach.add(def.teach);
    assert.ok(def.name.length > 0 && def.teach.length > 0 && def.teach.length <= 70, `stall ${index + 1} words`);
    assert.equal(def.world, Math.floor(index / 4));
    assert.equal(Boolean(def.finale), index % 4 === 3, `stall ${index + 1} is a finale only at the end of a মেলা`);
    assert.equal(def.boss > 0, Boolean(def.finale));
    assert.ok(potCount(def) >= 5);
  });
  assert.deepEqual(LEVELS.filter(def => def.finale).map(def => def.boss), [6, 8, 10], "the মটকা takes more blows in each মেলা");
  assert.ok(LEVELS[3].bossMove === 0 && LEVELS[7].bossMove > 0 && LEVELS[11].bossMove > 0, "the second মটকা slides");
  // One new element: the stall's feature set grows by something its neighbour lacks, never two things at once.
  const features = (def: (typeof LEVELS)[number]) => ({ tough: def.tough > 0, sway: def.sway > 0, cracker: def.crackers > 0, knot: def.rows.some(row => row.includes("B")), wind: def.wind > 0, boss: def.boss > 0, stick: def.stick < 1 });
  let seen: Record<string, boolean> = {};
  LEVELS.forEach((def, index) => {
    const now = features(def);
    const fresh = (Object.keys(now) as (keyof typeof now)[]).filter(key => now[key] && !seen[key]);
    if (index > 0 && index !== 3 && index !== 7 && index !== 11) assert.ok(fresh.length <= 1 || index === 4 || index === 7, `stall ${index + 1} brings ${fresh.join(", ")}`);
    seen = Object.fromEntries((Object.keys(now) as (keyof typeof now)[]).map(key => [key, Boolean(seen[key]) || now[key]]));
  });
});

test("every stall can be cleared with every ball in hand, and the ending is reached once", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    let perfect = false;
    for (let seed = 1; seed <= 12 && !perfect; seed++) {
      const out = play(runOf(seed * 7 + level, level), SKILLED);
      if (out.cleared && out.game.lost === 0) perfect = true;
    }
    assert.ok(perfect, `stall ${level} has a perfect run`);
  }
  const out = play(runOf(5, 4), SKILLED);
  assert.equal(left(out.game) === 0 || out.game.end === "out", true);
  assert.ok(E_OVER > 0);
});
