// The ladder: its shape, the lessons proved by a full solver, and the bot strengths asserted over many seeded games.
//
// Measured (300 seeds each; beginner · casual · careful · sharp, see tests/bot.ts):
//   4 প্রথম কাঁথা      .87 .88 .94 .95
//   5 চার-চার ঘর       .23 .53 .87 .86   (the old সহজ বট)
//   6 সারি গোনা        .19 .41 .77 .77
//   8 মিনু খালা        .07 .17 .32 .43   (the old কঠিন বট)
//   9 জরির ঘর          .12 .19 .46 .64
//  10 পাঁচ-পাঁচ ঘর     .06 .13 .42 .60
//  11 খালা আগে         .04 .14 .34 .57
//  12 নানুর নকশিকাঁথা  .05 .10 .33 .50
import assert from "node:assert/strict";
import test from "node:test";
import { begin, botMove, closes, isBotTurn, legacySetup, play, totalPoints, type Game } from "../lib/quilt";
import { LADDER_LEVELS, LEVEL_COUNT, PER_WORLD, WORLDS, isFinale, isLesson, levelOf, starsFor, worldOf } from "../lib/levels";
import { beginner, careful, casual, guaranteed, person, sharp, winRate } from "./bot";

test("levels: three worlds × four, one new line each, a named finale closing every world, a named rival everywhere", () => {
  assert.equal(LADDER_LEVELS.length, LEVEL_COUNT);
  assert.equal(WORLDS.length * PER_WORLD, LEVEL_COUNT);
  assert.equal(new Set(LADDER_LEVELS.map(level => level.line)).size, LEVEL_COUNT, "each level says one new thing of its own");
  LADDER_LEVELS.forEach((level, index) => {
    const n = index + 1;
    assert.equal(Boolean(level.finale), isFinale(n), `level ${n}: a finale exactly at the end of a world`);
    assert.ok(level.line.length <= 80, `level ${n}: one short line (${level.line.length})`);
    assert.equal(level.line, level.line.normalize("NFC"));
    assert.ok(level.rival && level.setup.bot, `level ${n}: someone sews against you`);
    const total = totalPoints(level.setup);
    assert.ok(level.two <= level.three && level.three <= total && level.two > total / 2, `level ${n}: star counts`);
    const game = begin(level.lesson?.seed ?? 1, level.setup);
    assert.equal(game.over, false);
    assert.ok(game.owner.every((who, box) => who >= 0 || game.geo.boxEdge.slice(4 * box, 4 * box + 4).some(edge => !game.drawn[edge])), `level ${n}: no box closed by the opening alone`);
  });
  assert.equal(new Set(LADDER_LEVELS.filter(level => level.finale).map(level => level.finale)).size, WORLDS.length);
  assert.deepEqual([1, 4, 5, 8, 9, 12].map(worldOf), [1, 1, 2, 2, 3, 3]);
  assert.deepEqual(levelOf(5)!.setup, legacySetup(1), "level 5 is the old সহজ বট");
  assert.deepEqual(levelOf(8)!.setup, legacySetup(2), "level 8 is the old কঠিন বট");
  assert.deepEqual([1, 2, 3, 7].filter(isLesson), [1, 2, 3, 7]);
  // One new thing per world: small cloths, then the 4×4 cloth, then জরির ঘর.
  assert.ok(LADDER_LEVELS.slice(0, 4).every(level => level.setup.cols <= 3));
  assert.ok(LADDER_LEVELS.slice(4, 8).every(level => level.setup.cols === 4 && !level.setup.gold));
  assert.ok(LADDER_LEVELS.slice(8).every(level => (level.setup.gold?.length ?? 0) >= 2));
});

test("lessons: each is a win against every reply, its ★★★ is the solver's best, and level 1 takes three stitches", () => {
  for (const n of [1, 2, 3, 7]) {
    const level = levelOf(n)!, game = begin(level.lesson!.seed, level.setup);
    assert.equal(game.turn, 0, `lesson ${n} starts with your stitch`);
    const best = guaranteed(game);
    assert.equal(best, level.three, `lesson ${n}: ★★★ = ${best}, the most you can be sure of`);
    assert.ok(best > totalPoints(level.setup) / 2, `lesson ${n} is a forced win`);
  }
  let first = begin(101, levelOf(1)!.setup);
  for (const edge of [5, 6, 8]) first = play(first, edge)!;
  assert.ok(first.over);
  assert.equal(starsFor(1, first.score), 3);
  // The lesson keys walk you through level 7's double-deal: take one, hand back two, then the long chain is yours.
  const level7 = levelOf(7)!;
  let deal = begin(107, level7.setup);
  for (const edge of level7.lesson!.keys!) deal = play(deal, edge)!;
  while (!deal.over) deal = play(deal, isBotTurn(deal) ? botMove(deal) : takeOrAny(deal))!;
  assert.deepEqual(deal.score, [10, 6]);
  // Taking all three first loses.
  let greedy = begin(107, level7.setup);
  while (!greedy.over) greedy = play(greedy, isBotTurn(greedy) ? botMove(greedy) : takeOrAny(greedy))!;
  assert.ok(greedy.score[0] < greedy.score[1]);
});
const takeOrAny = (game: Game) => game.drawn.flatMap((done, edge) => done ? [] : [edge]).sort((a, b) => closes(game.geo, game.drawn, b) - closes(game.geo, game.drawn, a))[0];

test("the warning teaches: in level 2 heeding it always wins, ignoring it mostly doesn't; in level 3 the short chain always wins", () => {
  const two = levelOf(2)!.setup, three = levelOf(3)!.setup;
  assert.equal(winRate(two, person(1, 1, 0), 100), 1);
  assert.ok(winRate(two, person(1, 0, 0), 100) < 0.3);
  assert.equal(winRate(three, person(1, 1, 1), 100), 1);
  assert.ok(winRate(three, person(1, 1, 0), 100) < 0.6, "guessing at the end is a coin flip at best");
});

test("bots: a beginner wins the first quilt, each level is no easier than the one before, and নানু is a real boss you can still beat", () => {
  const first = levelOf(4)!.setup;
  assert.ok(winRate(first, beginner, 300) >= 0.78, "প্রথম কাঁথা: a beginner mostly wins");
  assert.ok(winRate(first, casual, 300) >= 0.85);
  const full = [4, 5, 6, 8, 9, 10, 11, 12];
  const rates = full.map(n => winRate(levelOf(n)!.setup, casual, 200));
  for (let i = 1; i < rates.length; i++) assert.ok(rates[i] <= rates[i - 1] + 0.12, `level ${full[i]} (${rates[i]}) easier than ${full[i - 1]} (${rates[i - 1]})`);
  assert.ok(rates[1] >= 0.4, `the big cloth's first level is fair for a casual player (${rates[1]})`);
  assert.ok(rates[rates.length - 1] <= 0.15, `নানু is hard for a casual player (${rates[rates.length - 1]})`);
  assert.ok(winRate(levelOf(5)!.setup, careful, 200) >= 0.8, "a careful player beats the old সহজ বট");
  assert.ok(winRate(levelOf(12)!.setup, sharp, 150) >= 0.3, "a sharp player can beat নানু");
  assert.ok(winRate(levelOf(8)!.setup, sharp, 150) <= 0.6, "মিনু খালা holds her own");
});

test("stars: none for a loss or a draw, then the level's flower counts; slow mode has nothing to do with them", () => {
  assert.equal(starsFor(5, [8, 8]), 0);
  assert.equal(starsFor(5, [7, 9]), 0);
  assert.deepEqual([9, 10, 11, 12, 16].map(mine => starsFor(5, [mine, 16 - mine])), [1, 2, 2, 3, 3]);
  assert.deepEqual([5, 6, 7].map(mine => starsFor(4, [mine, 9 - mine])), [1, 2, 3]);
  assert.equal(starsFor(99, [9, 0]), 0);
});
