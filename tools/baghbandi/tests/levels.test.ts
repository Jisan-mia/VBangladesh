import assert from "node:assert/strict";
import test from "node:test";
import { makeRng, pick } from "../../../shared/game-core";
import { share } from "../share";
import {
  botMove, createGame, isBotTurn, legalMoves, migrateBest, openingLevel, play, replay, threatened, winStars,
  BOT_LEVELS, GOAT, LEGACY_LEVEL, MAX_MOVES, TIGER, type Game, type Mode,
} from "../lib/game";
import { nearMiss, parseShared, sharedHash } from "../lib/link";

// Links made before levels existed (captured from the old code): they must still replay against the same bot.
const OLD_LINKS = [
  "s=48213&t=7&p=1&m=HEABMAJFJEGBUHAEIAADDEACLIMFLFBECBGBOBRDNBQBGBJARBLBBABDNAPEHCDCEDEBBAMAFBDEHCJAIEABICRCRDCAMADEHAEBLAGBHBEBGCSBUBOCHBAA&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF",
  "s=777&t=8&p=2&m=HBCEDHDANBJCPDDEHIMDCA&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF",
];

/** Someone who mostly knows the rules (`skill` of the time takes a jump as the tiger, or keeps goats safe). Seeded. */
function person(game: Game, rng: () => number, skill: number) {
  const list = legalMoves(game);
  if (game.turn === TIGER) {
    const takes = list.flatMap((move, index) => move.over >= 0 ? [index] : []);
    return takes.length && rng() < skill ? takes[pick(rng, takes.length)] : pick(rng, list.length);
  }
  const safe = list.flatMap((move, index) => { const goats = game.goats.slice(); goats[move.from]--; goats[move.to] = 1; return threatened(goats, game.tigers).length ? [] : [index]; });
  return safe.length && rng() < skill ? safe[pick(rng, safe.length)] : pick(rng, list.length);
}
/** A sharp player: the level-8 bot's own judgement on your side. */
const sharp = (game: Game) => botMove({ ...game, level: BOT_LEVELS.length });

function winRate(mode: Mode, level: number, player: (game: Game, rng: () => number) => number, seeds = 60) {
  let wins = 0;
  for (let seed = 1; seed <= seeds; seed++) {
    const rng = makeRng(seed * 31 + 7);
    let game = createGame(seed, mode, level);
    while (!game.over) game = play(game, isBotTurn(game) ? botMove(game) : player(game, rng))!;
    if (winStars(game) > 0) wins++;
  }
  return wins / seeds;
}

test("old links still open: no level means the bot from before levels, and they normalize unchanged", () => {
  for (const link of OLD_LINKS) {
    const shared = parseShared(link);
    assert.ok(shared, link.slice(0, 30));
    assert.equal(shared.game.level, LEGACY_LEVEL);
    assert.equal(share.normalize(link), link);
  }
  assert.equal(createGame(1, 1).level, LEGACY_LEVEL);
  // The same moves against any other level's bot don't check out.
  for (let level = 1; level <= BOT_LEVELS.length; level++) if (level !== LEGACY_LEVEL) assert.equal(share.normalize(`${OLD_LINKS[0]}&l=${level}`), null, `level ${level}`);
});

test("a level travels in the link (`l`), is replayed against that level's bot, and junk levels are refused", () => {
  const rng = makeRng(5);
  let game = createGame(4242, 1, 3);
  while (!game.over) game = play(game, isBotTurn(game) ? botMove(game) : person(game, rng, 0.9))!;
  const hash = sharedHash({ mode: 1, name: "রাফি", other: "", game });
  assert.match(hash, /&l=3&/);
  const back = parseShared(hash)!;
  assert.equal(back.game.level, 3);
  assert.deepEqual(back.game.moves, game.moves);
  assert.equal(share.normalize(hash), hash);
  for (const bad of ["0", "9", "x", "03", "", "3.0"]) assert.equal(share.normalize(hash.replace("l=3", `l=${bad}`)), null, `l=${bad}`);
  assert.equal(replay(game.seed, 1, game.moves, 4), null, "a different bot level doesn't replay");
  // Two people have no bot: the level is ignored and dropped.
  const two = createGame(9, 0, 2);
  assert.doesNotMatch(sharedHash({ mode: 0, name: "", other: "", game: two }), /l=/);
});

test("the ladders are fair: level 1 is nearly a sure win, each step is no easier, and the top level can still be beaten", () => {
  for (const mode of [1, 2] as const) {
    const side = mode === 1 ? "বাঘ" : "ছাগল";
    const casual = (game: Game, rng: () => number) => person(game, rng, 0.9);
    const rates = BOT_LEVELS.map((_, index) => winRate(mode, index + 1, casual, 40));
    assert.ok(rates[0] >= 0.9, `${side}: level 1 won ${rates[0]}`);
    for (let index = 1; index < rates.length; index++) assert.ok(rates[index] <= rates[index - 1] + 0.1, `${side}: level ${index + 1} (${rates[index]}) is easier than ${index} (${rates[index - 1]})`);
    for (let level = 1; level <= BOT_LEVELS.length; level++) assert.ok(winRate(mode, level, sharp, 30) > 0, `${side}: nobody can beat level ${level}`);
  }
});

test("stars: the tiger by moves, the goats by trap or goats kept; a loss earns none", () => {
  const base = createGame(1, 1, 2);
  const tiger = (moves: number) => ({ ...base, over: true, winner: TIGER, ending: "hunt", taken: 8, moves: Array(moves).fill(0) }) as Game;
  assert.deepEqual([30, 40, 41, 70, 71, 110].map(moves => winStars(tiger(moves))), [3, 3, 2, 2, 1, 1]);
  assert.equal(nearMiss(tiger(46)), "আর ৬ চাল কম লাগলে ৩ তারা।");
  assert.equal(nearMiss(tiger(80)), "আর ১০ চাল কম লাগলে ২ তারা।");
  assert.equal(nearMiss(tiger(30)), "");
  const held = { ...base, over: true, winner: GOAT, ending: "hold", taken: 6, moves: Array(MAX_MOVES).fill(0) } as Game;
  assert.equal(winStars(held), 0, "goats won, but you were the tiger");
  assert.equal(nearMiss(held), "আর ২টা ছাগল ধরলেই জিত।");
  const goats = { ...held, mode: 2 } as Game;
  assert.deepEqual([winStars(goats), winStars({ ...goats, taken: 3 }), winStars({ ...goats, ending: "trap", taken: 7 })], [1, 2, 3]);
  assert.equal(nearMiss(goats), "আর ৩টা ছাগল কম হারালে ২ তারা।");
  assert.equal(nearMiss({ ...goats, taken: 2 }), "বাঘ বন্দি করতে পারলে ৩ তারা।");
  assert.equal(nearMiss({ ...goats, winner: TIGER, ending: "hunt", taken: 8, moves: Array(100).fill(0) }), "আর ২০ চাল টিকে থাকলেই জিত।");
  assert.equal(winStars({ ...goats, mode: 0 }), 0, "no stars between two people");
});

test("old progress: a best that proves a win over the old bot becomes one star on level 7, once", () => {
  assert.equal(migrateBest(TIGER, "8", null), JSON.stringify({ 7: 1 }));
  assert.equal(migrateBest(TIGER, "7", null), null, "seven goats taken: the tiger lost");
  assert.equal(migrateBest(GOAT, "13", null), JSON.stringify({ 7: 1 }), "kept 13: the tiger never got 8");
  assert.equal(migrateBest(GOAT, "12", null), null);
  assert.equal(migrateBest(TIGER, "8", "{}"), null, "levels already saved: never again");
  assert.equal(migrateBest(TIGER, null, null), null);
  assert.equal(migrateBest(TIGER, "junk", null), null);
});

test("the opening level: the furthest open level you haven't three-starred", () => {
  assert.equal(openingLevel({}, 1), 1);
  assert.equal(openingLevel({ 1: 3, 2: 1 }, 3), 3);
  assert.equal(openingLevel({ 1: 3, 2: 2, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3 }, 8), 2);
  assert.equal(openingLevel(Object.fromEntries(BOT_LEVELS.map((_, index) => [index + 1, 3])), 8), 8);
});
