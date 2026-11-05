// Difficulty by headless players on the real sim (tests/bot.ts), not by feel: river 1 is a sure win inside 10 s, each world asks more of a casual
// thumb, the foot of each mode shows in the numbers, and a sharp thumb holds the time star everywhere.
import assert from "node:assert/strict";
import test from "node:test";
import { LEVEL_COUNT, PER_WORLD } from "../lib/levels";
import { makeRiver, starsOf } from "../lib/river";
import { createRun } from "../lib/run";
import { drain, stepRun } from "../lib/step.hot";
import { allRivers, playRiver, CASUAL, SHARP, DT, type Profile } from "./bot";

const rivers = allRivers(LEVEL_COUNT);
const SEEDS = 24;

/** Completion, time-star and splash rates by world (and every river), for a profile and mode. */
function rates(profile: Profile, mode: number, from = 1, to = LEVEL_COUNT) {
  const worlds = Array.from({ length: 3 }, () => ({ runs: 0, done: 0, onTime: 0, splashes: 0 }));
  const each: { level: number; done: number }[] = [];
  for (const river of rivers.slice(from - 1, to)) {
    let done = 0;
    for (let seed = 1; seed <= SEEDS; seed++) {
      const run = playRiver(river, profile, seed * 97 + river.level, mode), world = worlds[Math.floor((river.level - 1) / PER_WORLD)];
      world.runs++;
      if (run.done) { world.done++; done++; world.splashes += run.splashes; if (starsOf(river, run.time, 0) >= 2) world.onTime++; }
    }
    each.push({ level: river.level, done: done / SEEDS });
  }
  return { each, worlds: worlds.map(world => ({ done: world.done / Math.max(1, world.runs), onTime: world.onTime / Math.max(1, world.runs), splashes: world.splashes / Math.max(1, world.done) })) };
}

test("river 1: a casual thumb wins every time inside 10 seconds (about 3), dry, on every mode", () => {
  for (const mode of [0, 1, 2]) for (let seed = 1; seed <= 40; seed++) {
    const run = playRiver(rivers[0], CASUAL, seed * 31, mode);
    assert.ok(run.done && run.time < 10, `mode ${mode} seed ${seed}: ${run.time.toFixed(1)} s`);
    assert.ok(run.splashes <= 1, `mode ${mode} seed ${seed}: ${run.splashes} splashes`);
  }
});

test("a casual thumb clears the rivers, and each world asks more: fewer clear in time, more splashes", () => {
  const { each, worlds } = rates(CASUAL, 1);
  assert.ok(worlds[0].done >= 0.98 && worlds[1].done >= 0.9 && worlds[2].done >= 0.8, JSON.stringify(worlds));
  assert.ok(worlds[0].onTime >= 0.95 && worlds[0].onTime > worlds[1].onTime && worlds[1].onTime > worlds[2].onTime, JSON.stringify(worlds));
  assert.ok(worlds[0].splashes < worlds[1].splashes && worlds[0].splashes < worlds[2].splashes, JSON.stringify(worlds));
  assert.ok(worlds[2].onTime >= 0.6, "even the monsoon is earnable for a casual thumb");
  for (const river of each) assert.ok(river.done >= 0.5, `river ${river.level}: only ${(river.done * 100).toFixed(0)}% cleared`);
});

test("the foot of each mode shows: on the big rivers সহজ earns the time star more often than কঠিন", () => {
  const easy = rates(CASUAL, 0, 11), hard = rates(CASUAL, 2, 11);
  for (const world of [1, 2]) assert.ok(easy.worlds[world].onTime > hard.worlds[world].onTime, `world ${world + 1}: ${easy.worlds[world].onTime.toFixed(2)} vs ${hard.worlds[world].onTime.toFixed(2)}`);
});

test("a sharp thumb clears every river and holds the time star on almost all of them", () => {
  const { each, worlds } = rates(SHARP, 1);
  for (const world of worlds) assert.ok(world.done >= 0.98 && world.onTime >= 0.9, JSON.stringify(worlds));
  for (const river of each) assert.ok(river.done >= 0.9, `river ${river.level}`);
});

test("an idle player never loses anything: the clock runs, nothing is spent, the river is never crossed", () => {
  for (const level of [1, 15, 30]) {
    const run = createRun(makeRiver(level));
    for (let t = 0; t < 60; t += DT) { stepRun(run, DT); drain(run); }
    assert.equal(run.done, false); assert.equal(run.splashes, 0); assert.equal(run.row, 0);
    assert.ok(run.t > 59.9);
  }
});
