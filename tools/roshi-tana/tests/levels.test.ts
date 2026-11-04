// The ladder as data, tuned by headless players: each level teaches one thing, the first is won in about ten seconds,
// a steady player wins every level at its target rate, a sharp one gets three stars, and mashing never pays.
import assert from "node:assert/strict";
import test from "node:test";
import { readLevels, recordLevel, unlockedLevel } from "../../../shared/game-core";
import { isFinale, LEVELS, LEVEL_COUNT, MODE_INFO, nextAhead, openLevel, readAhead, readBests, starsOf, toNextStar, WORLDS } from "../lib/levels";
import { createMatch } from "../lib/match";
import { botMatch, mash, median, play, SEEDS, SHAKY, SHARP, STEADY, winTime } from "./bot";

const levels = Array.from({ length: LEVEL_COUNT }, (_, index) => index + 1);
const wins = (level: number, skill = STEADY, mode: "e" | "n" | "h" = "n", slow = false) => SEEDS.map(seed => botMatch(level, seed, skill, mode, slow)).filter(m => m.winner === 0);

test("three worlds of four, each ending in a named finale with a heave", () => {
  assert.equal(LEVEL_COUNT, 12);
  for (let world = 0; world < WORLDS.length; world++) {
    const list = LEVELS.filter(def => def.world === world);
    assert.equal(list.length, 4);
    assert.ok(isFinale(list[3]) && list.slice(0, 3).every(def => !isFinale(def)), `world ${world} ends on its finale`);
  }
  assert.equal(new Set(LEVELS.map(def => def.team)).size, LEVEL_COUNT, "every team is its own");
  assert.equal(new Set(LEVELS.map(def => def.teach)).size, LEVEL_COUNT, "every level says its one new thing");
});

test("each level adds exactly one new thing; a finale adds at most the heave", () => {
  const traits = (index: number) => {
    const def = LEVELS[index];
    return new Set([def.combo && "combo", def.accent && "accent", def.surge && "surge", def.rests && "rests", def.tempo.length > 0 && "tempo", def.digIn > 0 && "digIn",
      def.silent && "silent", def.slick && "slick", def.tempo.some(([, bpm]) => bpm < def.bpm) && "slowdown"].filter(Boolean));
  };
  const seen = new Set<unknown>();
  for (let index = 0; index < LEVEL_COUNT; index++) {
    const now = traits(index), added = [...now].filter(trait => !seen.has(trait));
    // The world finales bring back the world's things; a finale adds at most the heave.
    assert.ok(added.length <= 1, `level ${index + 1} adds ${added.join(", ")}`);
    if (index > 0 && !isFinale(LEVELS[index])) assert.equal(added.length, 1, `level ${index + 1} adds one thing`);
    for (const trait of now) seen.add(trait);
  }
});

test("level 1 is a gift: a shaky beginner always wins, and in about ten seconds", () => {
  const shaky = wins(1, SHAKY), steady = wins(1);
  assert.equal(shaky.length, SEEDS.length);
  assert.ok(median(shaky.map(winTime)) <= 10_500, `shaky median ${median(shaky.map(winTime))} ms`);
  assert.ok(median(steady.map(winTime)) <= 9_000, `steady median ${median(steady.map(winTime))} ms`);
});

test("a steady player wins world 1 at least 90%, every level at least 50%, and the last level 50–90%", () => {
  for (const level of levels) {
    const rate = wins(level).length / SEEDS.length;
    if (LEVELS[level - 1].world === 0) assert.ok(rate >= 0.9, `level ${level}: ${rate}`);
    assert.ok(rate >= 0.5, `level ${level}: ${rate}`);
    if (level === LEVEL_COUNT) assert.ok(rate >= 0.5 && rate <= 0.9, `last level: ${rate}`);
  }
});

test("a sharp player wins every level and gets three stars on most seeds; a steady one mostly doesn't", () => {
  for (const level of levels) {
    const sharp = wins(level, SHARP), steady = wins(level);
    assert.equal(sharp.length, SEEDS.length, `sharp wins level ${level}`);
    assert.ok(sharp.filter(m => starsOf(m.beats, level) === 3).length >= SEEDS.length * 0.75, `sharp 3★ on level ${level}`);
    assert.ok(steady.filter(m => starsOf(m.beats, level) === 3).length <= SEEDS.length * 0.6, `steady rarely 3★ on level ${level}`);
  }
});

test("finales make you face the heave: a sharp player meets it and holds almost all of it", () => {
  for (const level of levels.filter(level => isFinale(LEVELS[level - 1]))) {
    const sharp = wins(level, SHARP);
    const heaves = sharp.reduce((sum, m) => sum + m.heaves, 0), held = sharp.reduce((sum, m) => sum + m.held, 0);
    assert.ok(heaves >= SEEDS.length, `level ${level}: sharp faced ${heaves} heaves`);
    assert.ok(held >= heaves * 0.9, `level ${level}: held ${held}/${heaves}`);
  }
});

test("mashing does worse than tapping on the beat, and never earns three stars", () => {
  for (const level of levels) for (const rate of [6, 9, 12]) {
    const mashed = SEEDS.slice(0, 12).map(seed => play(level, seed, mash(createMatch(seed, level), seed, rate))), steady = wins(level);
    const mashWins = mashed.filter(m => m.winner === 0);
    assert.ok(mashWins.length < steady.length * 0.3 || median(mashWins.map(m => m.beats)) > median(steady.map(m => m.beats)) * 2, `level ${level} at ${rate}/s`);
    for (const m of mashWins) assert.notEqual(starsOf(m.beats, level), 3, "a masher never earns 3 stars");
  }
});

test("modes keep their promise: easy is really easy and capped at two stars, hard still wins for a sharp player", () => {
  for (const level of levels) {
    assert.ok(wins(level, SHAKY, "e").length >= wins(level, SHAKY).length, `easy helps on level ${level}`);
    assert.ok(wins(level, SHARP, "h").length >= SEEDS.length * 0.9, `sharp wins hard level ${level}`);
    for (const m of wins(level, SHARP, "e")) assert.ok(starsOf(m.beats, level, "e") <= 2);
  }
  assert.ok(wins(1, SHAKY, "e").length === SEEDS.length);
  assert.equal(MODE_INFO.e.maxStars, 2);
});

test("ধীরে খেলো slows the drum but makes no star easier", () => {
  let slow = 0, normal = 0;
  for (const level of levels) {
    slow += wins(level, STEADY, "n", true).filter(m => starsOf(m.beats, level) === 3).length;
    normal += wins(level).filter(m => starsOf(m.beats, level) === 3).length;
    assert.ok(createMatch(1, level, "n", false, true).segP[0] > createMatch(1, level).segP[0]);
    assert.deepEqual(createMatch(1, level, "n", false, true).win, createMatch(1, level).win, "the same windows in ms");
  }
  assert.ok(slow <= normal + 3, `slow ${slow} vs normal ${normal}`);
});

test("star thresholds rise sensibly and starsOf / toNextStar agree", () => {
  for (const level of levels) {
    const [three, two] = LEVELS[level - 1].stars;
    assert.ok(three < two && two <= 60);
    assert.equal(starsOf(three, level), 3);
    assert.equal(starsOf(three + 1, level), 2);
    assert.equal(starsOf(two + 1, level), 1);
    assert.equal(toNextStar(three + 2, level), 2);
    assert.equal(toNextStar(three, level), 0);
    assert.equal(toNextStar(three, level, "e"), 0, "easy: no next star past two");
    assert.ok(LEVELS[level - 1].hard[0] >= three && LEVELS[level - 1].hard[1] >= two, "hard gives a few more beats");
  }
});

test("saved progress: old stars carry over, a friend's far level records stars without opening the levels between", () => {
  const old = readLevels(JSON.stringify({ 1: 3, 2: 2, 3: 1, 10: 2 }), LEVEL_COUNT);
  assert.deepEqual(old, { 1: 3, 2: 2, 3: 1, 10: 2 }, "levels 1–10 from the old ladder read as they were");
  assert.equal(openLevel(old, []), unlockedLevel(old, LEVEL_COUNT), "no ahead list: exactly the old unlock");
  // A fresh phone clears a friend's level 9.
  let stars = recordLevel({ 1: 3 }, 9, 2), ahead = nextAhead({ 1: 3 }, [], 9);
  assert.deepEqual(ahead, [9]);
  assert.equal(openLevel(stars, ahead), 2, "level 9's stars stay, but only level 2 opens");
  // Playing on up to 8 makes 9 count as yours.
  for (let level = 2; level <= 8; level++) { ahead = nextAhead(stars, ahead, level); stars = recordLevel(stars, level, 1); }
  assert.equal(openLevel(stars, ahead), 10);
  assert.deepEqual(readAhead("[9, 9, 0, 13, \"x\"]"), [9]);
  assert.deepEqual(readAhead("{broken"), []);
  assert.deepEqual(readBests(JSON.stringify({ "3n": 14, "13n": 9, "2x": 4, "4h": 0, "5e": 61, "6e": 22 })), { "3n": 14, "6e": 22 });
});
