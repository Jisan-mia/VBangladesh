import assert from "node:assert/strict";
import test from "node:test";
import { readLevels, unlockedLevel } from "../../../shared/game-core";
import { LEVELS, LEVEL_COUNT, SIZES, TOYS, flip, flipsText, migrateLevels, movesToNextStar, newGame, readFlips, replay, starsOf, startLevel, type Game, type Size } from "../lib/game";
import { caption, cardHash, cardOf, parseCard, sizeLabel } from "../lib/result";

/** A perfect memory that never uses the face-up demo pair: the opening order is its only luck. */
function perfect(seed: number, size: Size) {
  let game: Game = newGame(seed, size, 1);
  const seen = new Map<number, number>();
  const hidden = () => game.board.map((_, index) => index).filter(index => game.found[index] < 0 && !seen.has(index) && !game.open.includes(index));
  while (game.phase !== "over") {
    const pair = [...seen].flatMap(([a, toy]) => [...seen].filter(([b, other]) => a < b && toy === other && game.found[a] < 0).map(([b]) => [a, b]))[0];
    const first = pair ? pair[0] : hidden()[0];
    game = flip(game, first);
    seen.set(first, game.board[first]);
    const mate = pair ? pair[1] : [...seen].find(([index, toy]) => index !== first && toy === game.board[first] && game.found[index] < 0)?.[0];
    const second = mate ?? hidden()[0];
    game = flip(game, second);
    seen.set(second, game.board[second]);
  }
  return game;
}

test("levels: the board grows 8 → 12 → 16 → 20 and par only tightens within a size", () => {
  assert.equal(LEVEL_COUNT, 12);
  assert.deepEqual([...new Set(LEVELS.map(level => level.size))], [8, 12, 16, 20]);
  LEVELS.forEach((level, index) => {
    assert.ok(level.three < level.two, `level ${index + 1}`);
    assert.ok(level.three >= level.size / 2, `level ${index + 1}: three stars needs at least one move per pair`);
    const before = LEVELS[index - 1];
    if (!before) return;
    assert.ok(level.size >= before.size);
    if (level.size === before.size) assert.ok(level.three <= before.three && level.two <= before.two && (level.three < before.three || level.two < before.two), `level ${index + 1} is a step up`);
  });
  assert.ok(TOYS.length * 2 >= Math.max(...SIZES), "enough toys for the biggest board");
});

test("every level is fair: a perfect memory earns three stars on most deals, and every clear earns a star", () => {
  for (const [index, level] of LEVELS.entries()) {
    let three = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const end = perfect(seed, level.size);
      assert.equal(end.phase, "over");
      const stars = starsOf(index + 1, end.moves);
      assert.ok(stars >= 1);
      if (stars === 3) three++;
    }
    assert.ok(three / 300 >= 0.45, `level ${index + 1}: three stars on ${Math.round(three / 3)}% of deals`);
  }
});

test("stars by moves and the exact gap to the next star", () => {
  // Level 4: 12 cards, three ≤ 10, two ≤ 13.
  assert.equal(starsOf(4, 6), 3);
  assert.equal(starsOf(4, 10), 3);
  assert.equal(starsOf(4, 11), 2);
  assert.equal(starsOf(4, 13), 2);
  assert.equal(starsOf(4, 14), 1);
  assert.equal(starsOf(0, 10), 0, "not a level game");
  assert.equal(movesToNextStar(4, 14), 1);
  assert.equal(movesToNextStar(4, 12), 2);
  assert.equal(movesToNextStar(4, 9), 0);
  assert.equal(startLevel({}, 1), 1);
  assert.equal(startLevel({ 1: 3, 2: 3 }, 3), 3);
  assert.equal(startLevel({ 1: 2, 2: 3, 3: 3 }, 3), 1);
});

test("the 20-card board deals ten toys twice, and its flips past 15 survive a link", () => {
  const game = perfect(77, 20);
  assert.equal(new Set(game.board).size, 10);
  assert.ok(game.flips.some(index => index >= 16));
  assert.deepEqual(readFlips(flipsText(game.flips)), game.flips);
  assert.deepEqual(replay(77, 20, 1, game.flips)?.moves, game.moves);
  const card = cardOf(game, ["রাফি"], 10);
  const hash = cardHash(card);
  assert.match(hash, /g=20&l=10/);
  assert.deepEqual(parseCard(hash), card);
  assert.equal(sizeLabel(20), "৫×৪");
  assert.equal(sizeLabel(8), "২×৪");
  assert.match(caption(card), /লেভেল ১০: ২০টা কার্ড/);
});

test("old links still open; level links must match their board", () => {
  const easy = perfect(5, 12);
  const old = cardHash(cardOf(easy, [""]));
  assert.ok(!old.includes("l="), "a game outside the levels carries no level");
  assert.equal(parseCard(old)?.level, 0);
  assert.equal(parseCard(old)?.size, 12);
  const full = perfect(6, 16);
  assert.equal(parseCard(cardHash(cardOf(full, ["মিম"])))?.size, 16);
  // A level link: the level's board size, solo only.
  const small = perfect(8, 8), link = cardHash(cardOf(small, [""], 2));
  assert.equal(parseCard(link)?.level, 2);
  assert.equal(parseCard(link.replace("l=2", "l=5")), null, "level 5 is a 12-card board");
  assert.equal(parseCard(link.replace("l=2", "l=13")), null);
  assert.equal(parseCard(link.replace("l=2", "l=x")), null);
  assert.equal(parseCard(link.replace("&l=2", "")), null, "an 8-card board only comes from a level");
  assert.equal(parseCard(`${link}&m=2&a=4`), null, "two players don't play levels");
  assert.equal(cardOf(newGame(1, 16, 2), ["", ""], 7).level, 0, "a two-player card never carries a level");
});

test("old bests on ৩×৪ and ৪×৪ become stars once, judged by the level's par", () => {
  const moved = migrateLevels(null, "9", "20");
  assert.ok(moved);
  const stars = readLevels(moved, LEVEL_COUNT);
  assert.deepEqual(stars, { 4: 3, 7: 1 });
  assert.equal(unlockedLevel(stars, LEVEL_COUNT), 8);
  assert.deepEqual(readLevels(migrateLevels(null, null, "15"), LEVEL_COUNT), { 7: 2 });
  assert.equal(migrateLevels('{"1":2}', "9", "20"), null, "only once");
  assert.equal(migrateLevels(null, null, null), null);
  assert.equal(migrateLevels(null, "abc", "3"), null, "nonsense and impossible bests are ignored");
});
