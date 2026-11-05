import assert from "node:assert/strict";
import test from "node:test";
import { allMoves } from "../lib/board";
import { botGame, thresholds } from "../lib/hint";
import { DEFS, LEVEL_COUNT, LEVELS, PER_WORLD, WORLDS, finaleName, isFinale } from "../lib/ladder";
import { SEEDS } from "../lib/ladder-seeds";
import { baseLimit, createGame, move, newRun, starsAt } from "../lib/rules";
import { casual, rateOf, steady } from "./bot";

const PEOPLE = 40;

test("40 levels in four মেলা of ten; the tenth of each is its named finale", () => {
  assert.equal(LEVEL_COUNT, 40);
  assert.equal(SEEDS.length, 40, "the generated table covers every level");
  assert.equal(WORLDS.length * PER_WORLD, LEVEL_COUNT);
  assert.deepEqual([10, 20, 30, 40].map(finaleName), WORLDS.map(world => world.finale));
  assert.deepEqual(DEFS.filter((_, i) => isFinale(i + 1)).map(level => level.name), WORLDS.map(world => world.finale));
  assert.equal(new Set(DEFS.map(level => level.teach)).size, LEVEL_COUNT, "every level teaches something of its own");
  assert.equal(new Set(DEFS.map(level => level.name)).size, LEVEL_COUNT, "every level has its own name");
  assert.equal(new Set(LEVELS.map(level => level.seed)).size, LEVEL_COUNT, "every level has its own tray");
  for (const [index, level] of LEVELS.entries()) {
    assert.ok(level.teach.length > 8 && level.teach.length < 100, `level ${index + 1} teaches one thing in one line`);
    assert.ok(level.colours >= 4 && level.colours <= 6);
    assert.ok(level.thick <= level.dust);
  }
  assert.ok(LEVELS.slice(0, 10).every(level => !level.locks && !level.dust && !level.drop), "the first mela has no tied bangles, dust or falling locks");
  assert.ok(LEVELS.slice(0, 10).every(level => level.goals.every(([target]) => target !== 20)), "no রংধনু goal before the second mela");
  assert.ok(LEVELS.slice(0, 20).every(level => !level.dust && !level.drop), "dust comes in the third mela, falling locks in the fourth");
});

test("each level brings at most one thing the ladder hasn't shown before", () => {
  const kinds = (n: number) => {
    const l = LEVELS[n - 1], goals = l.goals.map(goal => goal[0]);
    return [l.colours >= 5, l.colours >= 6, goals.includes(10), goals.includes(20), l.locks > 0, l.dust > 0, l.thick > 0, l.drop > 0, l.goals.length >= 2, l.goals.length >= 3, l.tight];
  };
  const seen = kinds(1).map(() => false);
  for (let n = 1; n <= LEVEL_COUNT; n++) {
    const now = kinds(n), fresh = now.filter((on, i) => on && !seen[i]).length;
    assert.ok(fresh <= 1, `level ${n} brings ${fresh} new things`);
    now.forEach((on, i) => { if (on) seen[i] = true; });
  }
});

test("the solver (greedy bot) proves every level fair: it clears inside the moves, with the recorded numbers", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const spec = LEVELS[level - 1], game = botGame(newRun(level), spec);
    assert.ok(game.won, `level ${level} (${spec.name}) is cleared by the greedy bot`);
    assert.equal(game.moves.length, spec.bot, `level ${level} par`);
    assert.equal(game.score, spec.botScore, `level ${level} bot score`);
    assert.ok(spec.bot < spec.moves, `level ${level}: room beyond the bot's ${spec.bot} moves`);
    assert.ok(baseLimit(spec, "h") >= spec.bot + 2, `level ${level}: hard mode still leaves the bot two spare moves`);
    assert.ok(spec.three > spec.two && spec.two > 0);
  }
});

test("the star thresholds come from the looser runs (spot check)", () => {
  for (const level of [1, 13, 25, 40]) {
    const spec = LEVELS[level - 1], { three, two } = thresholds(level, spec);
    assert.equal(three, spec.three, `level ${level} three stars`);
    assert.equal(two, spec.two, `level ${level} two stars`);
    assert.equal(starsAt(spec, "n", spec.three), 3);
    assert.equal(starsAt(spec, "n", spec.two), 2);
    assert.equal(starsAt(spec, "n", spec.two - 1), 1);
  }
});

test("level 1 is won within ten seconds: two or three swaps, even for a careless player", () => {
  const start = createGame(newRun(1));
  let fastest = Infinity;
  for (const [a, b] of allMoves(start.cells)) {
    const one = move(start, a, b)!;
    if (one.won) fastest = 1;
    else for (const [c, d] of allMoves(one.cells)) if (move(one, c, d)?.won) fastest = Math.min(fastest, 2);
  }
  assert.ok(fastest <= 2, `fastest win ${fastest}`);
  const careless = rateOf(newRun(1), casual, PEOPLE);
  assert.equal(careless.rate, 1);
  assert.ok(careless.median <= 3, `casual median ${careless.median} swaps (about 1.5 s each)`);
});

test("bot targets: a casual player clears the first mela, a steady player clears every level, finales are long", () => {
  const casualRates: number[] = [], steadyRates: number[] = [];
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    casualRates.push(rateOf(newRun(level), casual, PEOPLE).rate);
    steadyRates.push(rateOf(newRun(level), steady, PEOPLE).rate);
  }
  for (let level = 1; level <= 10; level++) assert.ok(casualRates[level - 1] >= 0.9, `casual on level ${level}: ${casualRates[level - 1]}`);
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    assert.ok(casualRates[level - 1] >= 0.4, `casual on level ${level}: ${casualRates[level - 1]}`);
    assert.ok(steadyRates[level - 1] >= 0.5, `steady on level ${level}: ${steadyRates[level - 1]}`);
  }
  for (let world = 0; world < WORLDS.length; world++) {
    const first = world * PER_WORLD, finale = first + PER_WORLD - 1;
    const pars = LEVELS.slice(first, finale + 1).map(level => level.bot), sorted = [...pars].sort((a, b) => a - b);
    assert.ok(pars[pars.length - 1] >= sorted[Math.floor(sorted.length / 2)], `mela ${world + 1}'s finale takes more than a middling level`);
    assert.ok(casualRates[finale] <= casualRates[first], `mela ${world + 1}'s finale is no easier for the casual player than its first level`);
  }
  assert.ok(LEVELS[39].bot > LEVELS[9].bot, "the last finale is longer than the first");
  assert.ok(casualRates[39] < casualRates[9], "and harder for the casual player");
});
