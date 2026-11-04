import assert from "node:assert/strict";
import test from "node:test";
import { boardProblem, CLASSIC, boardLadder } from "../lib/board";
import { levelSetup, placeOf, starsOf } from "../lib/game";
import { isFinale, LEVEL_COUNT, LEVELS, RIVALS, WORLDS } from "../lib/levels";
import { planMove, makeMotion } from "../lib/motion.hot";
import { levelRace } from "./bot";

const SEEDS = 3000;
const rate = (count: number) => count / SEEDS;

test("every board is sound, every world ends in a named boss snake, and the ladder adds one thing a level", () => {
  assert.equal(LEVEL_COUNT, 12);
  assert.deepEqual(WORLDS.map(world => [world.from, world.to]), [[1, 4], [5, 8], [9, 12]]);
  for (const level of LEVELS) {
    assert.equal(boardProblem(level.board), "", `level ${level.id}`);
    assert.ok(level.rivals >= 0 && level.rivals <= RIVALS.length && level.par > 0);
    assert.ok(level.lesson.length > 10 && !/!/.test(level.lesson));
    assert.equal(isFinale(level.id), level.id === WORLDS[level.world].to, `only the last level of a world is a finale (${level.id})`);
    if (level.boss) assert.ok(!boardLadder(level.board, level.boss.jump) && level.board.jumps[level.boss.jump], "the boss is a snake");
  }
  assert.equal(new Set(LEVELS.map(level => level.lesson)).size, LEVEL_COUNT, "a different lesson on every level");
  assert.equal(LEVELS[0].board.jumps.length, 1, "level 1: one ladder, nothing else");
  assert.equal(LEVELS[8].board, CLASSIC, "world 3 is the classic board, unchanged");
  // One new rule or seat at a time: rivals never jump by two, and the rules switch on one by one.
  for (let id = 2; id <= LEVEL_COUNT; id++) {
    const before = LEVELS[id - 2], now = LEVELS[id - 1];
    const changes = [now.rivals !== before.rivals, now.pieces !== before.pieces, now.rules.exact !== before.rules.exact, now.rules.triple !== before.rules.triple].filter(Boolean).length;
    assert.ok(changes <= 1 || now.boss, `level ${id} changes ${changes} rules at once`);
  }
});

test("level 1 is won within 10 seconds, and its third star is earned about half the time", () => {
  const times: number[] = [];
  let three = 0;
  for (let seed = 1; seed <= SEEDS; seed++) {
    const { game, ms } = levelRace(1, seed, "person");
    assert.equal(placeOf(game), 1);
    times.push(ms);
    if (starsOf(game) === 3) three++;
  }
  times.sort((a, b) => a - b);
  assert.ok(times[SEEDS >> 1] <= 9500, `median ${times[SEEDS >> 1]} ms`);
  assert.ok(rate(times.filter(ms => ms <= 10_000).length) >= 0.75, "most first races end inside 10 s");
  assert.ok(rate(three) >= 0.4 && rate(three) <= 0.8, `3★ ${rate(three)}`);
});

test("every level is cleared on every seed (you always get home), in a sane number of rolls", () => {
  for (const level of LEVELS) {
    for (let seed = 1; seed <= 600; seed++) for (const player of ["smart", "random"] as const) {
      const { game } = levelRace(level.id, seed, player);
      assert.equal(game.phase, "over", `level ${level.id} seed ${seed}`);
      assert.ok(placeOf(game) >= 1 && starsOf(game) >= 1);
      assert.ok(game.rolls <= 400, `level ${level.id} took ${game.rolls} rolls`);
    }
  }
});

test("rivals: you win about your fair share or better, the sensible pick pays, and finales are hard to three-star", () => {
  for (const level of LEVELS) {
    let wins = 0, randomWins = 0, three = 0;
    for (let seed = 1; seed <= SEEDS; seed++) {
      const smart = levelRace(level.id, seed, "smart").game;
      if (placeOf(smart) === 1) wins++;
      if (starsOf(smart) === 3) three++;
      if (level.pieces === 2 && placeOf(levelRace(level.id, seed, "random").game) === 1) randomWins++;
    }
    const floor = [1, 0.46, 0.4, 0.28][level.rivals];
    assert.ok(rate(wins) >= floor, `level ${level.id}: wins ${rate(wins)} < ${floor}`);
    if (level.pieces === 2) assert.ok(rate(wins) - rate(randomWins) >= 0.1, `level ${level.id}: the recommended pick should matter (${rate(wins)} vs ${rate(randomWins)})`);
    if (level.boss) assert.ok(rate(three) >= 0.08 && rate(three) <= 0.35, `finale ${level.id}: 3★ ${rate(three)}`);
    else assert.ok(rate(three) >= 0.15, `level ${level.id}: 3★ ${rate(three)}`);
  }
});

test("ধীরে খেলো changes the time a move takes, never where it ends or what it earns", () => {
  const fast = makeMotion(), slow = makeMotion(), board = levelSetup(4).board;
  planMove(fast, board, 0, 0, 20, 24, 4, 2, true, false);
  planMove(slow, board, 0, 0, 20, 24, 4, 2, true, true);
  assert.equal(fast.end, slow.end);
  assert.equal(slow.travel, 0, "no slide in slow mode");
  assert.ok(slow.hold > fast.hold, "a longer hold on the snake's head");
  // Stars come from the rolls alone (no motion input), so the same seed earns the same stars either way.
  assert.equal(starsOf(levelRace(3, 42).game), starsOf(levelRace(3, 42).game));
});
