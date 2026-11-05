import assert from "node:assert/strict";
import test from "node:test";
import { TOP } from "../lib/board";
import { SEEDS } from "../lib/level-seeds";
import { DEFS, LEVEL_COUNT, LEVELS, PER_WORLD, WORLDS, finaleName, isFinale } from "../lib/levels";
import { createGame, limitOf, move, specOf, threeStar, type Run } from "../lib/rules";
import { botPar, casual, rateOf, steady } from "./bot";

const run = (level: number): Run => ({ v: 2, kind: "level", level, seed: 0, mode: "n" });
const PEOPLE = 30;

test("24 levels in three seasons of eight; the eighth of each is its named finale", () => {
  assert.equal(LEVEL_COUNT, 24);
  assert.equal(SEEDS.length, 24, "the generated table covers every level");
  assert.equal(WORLDS.length * PER_WORLD, LEVEL_COUNT);
  assert.deepEqual([8, 16, 24].map(finaleName), WORLDS.map(world => world.finale));
  assert.deepEqual(LEVELS.filter((_, i) => isFinale(i + 1)).map(level => level.name), ["শিলাবৃষ্টি", "কালবৈশাখী", "মধুমাস"]);
  assert.deepEqual(LEVELS.map(level => level.size), [...Array(16).fill(4), ...Array(8).fill(5)]);
  assert.ok(LEVELS.slice(0, 8).every(level => !level.stones.length && !level.weeds && !level.gust && !level.crow), "season 1 has no stones, weeds, gusts or crows");
  for (const [index, level] of LEVELS.entries()) {
    assert.ok(level.target >= 2 && level.target <= TOP);
    assert.ok(level.stones.every(cell => cell >= 0 && cell < level.size * level.size));
    assert.ok(level.teach.length > 8 && level.teach.length < 90, `level ${index + 1} teaches one thing in one line`);
  }
  assert.equal(new Set(DEFS.map(level => level.teach)).size, LEVEL_COUNT, "every level teaches something of its own");
  assert.equal(LEVELS[0].target, 2, "level 1 is one merge");
});

test("each level brings at most one thing the ladder hasn't shown before", () => {
  const kinds = (n: number) => { const l = LEVELS[n - 1]; return [l.stones.length > 0, l.stones.length > 1, l.weeds > 0, l.rain > 0, l.hail > 0, l.gust > 0, l.crow > 0, l.count > 1, l.size > 4, l.undo, l.tight]; };
  const seen = kinds(1).map(() => false);
  for (let n = 1; n <= LEVEL_COUNT; n++) {
    const now = kinds(n), fresh = now.filter((on, i) => on && !seen[i]).length;
    assert.ok(fresh <= 1, `level ${n} brings ${fresh} new things`);
    now.forEach((on, i) => { if (on) seen[i] = true; });
  }
});

test("par: the stored table is what the strong bots measure, and it sits inside ★★★", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    assert.equal(botPar(run(level)), LEVELS[level - 1].bot, `level ${level} par`);
    const spec = specOf(run(level));
    assert.ok(spec.bot <= threeStar(spec) && threeStar(spec) < limitOf(spec, "n"));
  }
});

test("level 1 is won in a swipe or two from the start, inside 10 seconds", () => {
  const start = createGame(run(1));
  let fastest = Infinity;
  for (const a of [0, 1, 2, 3] as const) {
    const one = move(start, a);
    if (one?.won) fastest = Math.min(fastest, 1);
    for (const b of [0, 1, 2, 3] as const) if (one && move(one, b)?.won) fastest = Math.min(fastest, 2);
  }
  assert.ok(fastest <= 2);
  const casualRun = rateOf(run(1), person => casual(person), PEOPLE);
  assert.equal(casualRun.rate, 1);
  assert.ok(casualRun.median <= 3, `casual median ${casualRun.median} swipes (≈ 1 s each)`);
});

test("bot targets: a casual player clears season 1, a steady player clears every level, finales are hardest", () => {
  const casualRates: number[] = [], steadyRates: number[] = [];
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    casualRates.push(rateOf(run(level), person => casual(person), PEOPLE).rate);
    steadyRates.push(rateOf(run(level), person => steady(person), PEOPLE).rate);
  }
  for (let level = 1; level <= 8; level++) assert.ok(casualRates[level - 1] >= 0.8, `casual on level ${level}: ${casualRates[level - 1]}`);
  for (let level = 1; level <= LEVEL_COUNT; level++) assert.ok(steadyRates[level - 1] >= 0.5, `steady on level ${level}: ${steadyRates[level - 1]}`);
  for (let world = 0; world < 3; world++) {
    const first = world * PER_WORLD, finale = first + PER_WORLD - 1;
    const pars = LEVELS.slice(first, finale + 1).map(level => level.bot);
    assert.equal(Math.max(...pars), pars[pars.length - 1], `season ${world + 1}'s finale has the longest par`);
    assert.ok(casualRates[finale] <= casualRates[first], `season ${world + 1}'s finale is harder for the casual player than its first level`);
    assert.ok(casualRates[finale] === Math.min(...casualRates.slice(first, finale + 1)), `season ${world + 1}'s finale is the casual player's hardest`);
  }
  assert.ok(casualRates[23] < casualRates[7], "the last finale is harder than the first");
});
