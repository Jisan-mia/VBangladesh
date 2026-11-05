import assert from "node:assert/strict";
import test from "node:test";
import { makeRng, pick } from "../../../shared/game-core";
import { DUO_SIZES, LEVELS, duoSpec } from "../lib/levels";
import { atStake, begin, endPeek, flightPlaces, flip, flipsText, isUp, movesToNextStar, newGame, readFlips, reachable, replay, settle, starsOf, type Game } from "../lib/play";
import { PLAYERS, play } from "./bot";

const partnerOf = (game: Game, index: number) => game.board.findIndex((id, other) => other !== index && id === game.board[index]);
const started = (game: Game) => endPeek(begin(game));
const L = (level: number, seed = 11) => started(newGame(seed, LEVELS[level - 1]));
/** The first two places that do not match, and the first matching pair, on a board. */
const wrongPair = (game: Game) => { const b = game.board.findIndex(id => id !== game.board[0]); return [0, b] as const; };

test("the same seed deals the same board; another seed deals another", () => {
  assert.deepEqual(newGame(4242, LEVELS[7]), newGame(4242, LEVELS[7]));
  assert.notDeepEqual(newGame(4242, LEVELS[7]).board, newGame(4243, LEVELS[7]).board);
  assert.deepEqual(play(9, LEVELS[20], PLAYERS.steady).game.flips, play(9, LEVELS[20], PLAYERS.steady).game.flips, "the birds fly the same way for the same seed");
});

test("flipping: a match stays, a miss waits to turn back, and taps that do nothing are ignored", () => {
  const game = L(3);
  const a = 0, b = partnerOf(game, 0), c = game.board.findIndex(id => id !== game.board[0]);
  const one = flip(game, a);
  assert.deepEqual(one.open, [a]);
  assert.equal(one.moves, 0);
  assert.equal(flip(one, a), one, "the card already up");
  const miss = flip(one, c);
  assert.deepEqual(miss.open, [a, c]);
  assert.equal(miss.moves, 1);
  assert.equal(miss.last, "miss");
  assert.equal(miss.streak, 0);
  assert.equal(settle(miss).open.length, 0);
  const hit = flip(one, b);
  assert.deepEqual(hit.open, []);
  assert.deepEqual([hit.found[a], hit.found[b]], [0, 0]);
  assert.equal(hit.streak, 1);
  assert.equal(flip(hit, a), hit, "a matched card");
  assert.equal(flip(game, -1), game);
  assert.equal(flip(game, 99), game);
  assert.equal(flip(newGame(11, LEVELS[2]), 0).phase, "ready", "nothing flips before the start card's sign");
});

test("tapping the missed pair, or another card, turns it back (no flight board): the other card still flips", () => {
  const game = L(3), [a, c] = wrongPair(game);
  const miss = flip(flip(game, a), c);
  const back = flip(miss, a);
  assert.deepEqual(back.open, []);
  assert.equal(back.flips.length, miss.flips.length, "tapping a missed card only turns the pair back");
  const other = game.board.findIndex((_, i) => i !== a && i !== c);
  const next = flip(miss, other);
  assert.deepEqual(next.open, [other], "another card turns the pair back and opens");
});

test("the demo pair of level 1 shows until the first tap, then turns back", () => {
  const game = L(1);
  assert.ok(game.demo);
  assert.ok(isUp(game, game.demo![0]) && isUp(game, game.demo![1]));
  assert.ok(game.seen[game.demo![0]], "the demo cards count as seen");
  const next = flip(game, game.board.findIndex((_, i) => !game.demo!.includes(i)));
  assert.equal(isUp(next, game.demo![0]), false);
});

test("the peek: every card is up and nothing flips until it ends; the peeked cards count as seen", () => {
  const game = begin(newGame(3, LEVELS[8]));
  assert.equal(game.phase, "peek");
  assert.ok(game.board.every((_, i) => isUp(game, i)));
  assert.equal(flip(game, 0), game);
  assert.ok(game.seen.every(Boolean));
  const play = endPeek(game);
  assert.equal(play.phase, "play");
  assert.equal(isUp(play, 0), false);
  assert.equal(endPeek(play), play);
  assert.equal(begin(play), play, "begin runs once");
});

test("a match on a card you saw before counts as remembered; a lucky guess does not", () => {
  let game = L(3, 21);
  const a = 0, b = partnerOf(game, 0), c = game.board.findIndex(id => id !== game.board[0]);
  // Lucky: the twin was never seen.
  const lucky = flip(flip(game, a), b);
  assert.equal(lucky.remembered, 0);
  // Remembered: see b first (a miss), then open a and take b.
  game = settle(flip(flip(game, b), c));
  const kept = flip(flip(game, a), b);
  assert.equal(kept.remembered, 1);
  assert.equal(kept.bestStreak, 1);
});

test("stars, the exact gap to the next one, and the star that is at stake", () => {
  const spec = LEVELS[4]; // 8 pairs, ★★★ 13, ★★ 18
  assert.equal(starsOf(spec, 13), 3);
  assert.equal(starsOf(spec, 14), 2);
  assert.equal(starsOf(spec, 18), 2);
  assert.equal(starsOf(spec, 19), 1);
  assert.equal(starsOf(duoSpec(16), 8), 0, "two players earn no stars");
  assert.equal(movesToNextStar(spec, 19), 1);
  assert.equal(movesToNextStar(spec, 14), 1);
  assert.equal(movesToNextStar(spec, 13), 0);
  let game = started(newGame(5, spec));
  assert.equal(atStake(game), 0, "far from the edge");
  assert.equal(reachable(game), 3);
  // Burn misses until the next one would cost ★★★.
  const spend = (g: Game) => { const [a, c] = wrongPair(settle(g)); return settle(flip(flip(settle(g), a), c)); };
  while (game.moves + (spec.pairs - game.pairs[0]) < spec.three) game = spend(game);
  assert.equal(atStake(game), 3, "the edge glows when one more miss costs the third star");
  const lost = flip(flip(game, wrongPair(game)[0]), wrongPair(game)[1]);
  assert.equal(lost.cracked, 3, "that miss cracks the third star");
  assert.equal(reachable(lost), 2);
  assert.equal(flip(settle(lost), partnerOf(settle(lost), 0)).cracked, 0);
});

test("the birds: they fly after every Nth miss, never take the missed pair, and a link replays them exactly", () => {
  const spec = LEVELS[18]; // level 19: every 2nd miss on 8 pairs
  let game = started(newGame(9, spec)), flights = 0;
  const board0 = game.board.slice();
  for (let round = 0; round < 6 && game.phase === "play"; round++) {
    const [a, c] = wrongPair(settle(game));
    game = settle(game);
    const before = game.board.slice();
    game = flip(flip(game, a), c);
    const missed = game.open.slice();
    const settled = settle(game);
    if (settled.flown.length) {
      flights++;
      assert.equal(settled.misses % spec.every, 0);
      assert.ok(settled.flown.every(place => !missed.includes(place)), "the missed pair stays put");
      const [x, y] = settled.flown;
      assert.equal(settled.board[x], before[y]);
      assert.equal(settled.board[y], before[x]);
      assert.equal(settled.seen[x], game.seen[y], "a card's seen mark travels with it");
    } else assert.deepEqual(settled.board, before);
    game = settled;
  }
  assert.ok(flights >= 2 && game.board.some((id, i) => id !== board0[i]));
  // The same picks in a different order of taps still replay: a bot's game round-trips through its flips.
  for (const level of [17, 20, 23, 24]) {
    for (let seed = 1; seed <= 20; seed++) {
      const end = play(seed, LEVELS[level - 1], PLAYERS.casual).game;
      assert.equal(end.phase, "over");
      const again = replay(newGame(seed, LEVELS[level - 1]), readFlips(flipsText(end.flips))!);
      assert.ok(again && again.phase === "over" && again.moves === end.moves, `level ${level} seed ${seed}`);
      assert.deepEqual(again.board, end.board);
    }
  }
});

test("on a bird board a tap on a missed pair's neighbour only turns the pair back (the cards may fly first)", () => {
  const spec = LEVELS[18];
  const game = started(newGame(4, spec)), [a, c] = wrongPair(game);
  const miss = flip(flip(game, a), c);
  const other = game.board.findIndex((_, i) => i !== a && i !== c);
  const next = flip(miss, other);
  assert.deepEqual(next.open, []);
  assert.equal(next.flips.length, miss.flips.length);
});

test("a flight picks cards you have seen first, and only two or four places", () => {
  const game = begin(newGame(2, LEVELS[8 + 7 + 8])); // the finale of the birds: 12 pairs, two swaps
  const places = flightPlaces(endPeek({ ...game, seen: game.board.map(() => true) }), 2);
  assert.equal(places.length, 4);
  assert.equal(new Set(places).size, 4);
  const few = { ...endPeek(game), seen: game.board.map((_, i) => i < 2) };
  assert.ok(flightPlaces(few, 1).some(place => place < 2), "seen cards fly first");
});

test("two players: a miss hands over the turn, a match keeps it, the winner has more pairs", () => {
  let game = started(newGame(7, duoSpec(12), 2));
  assert.equal(game.turn, 0);
  const [a, c] = wrongPair(game);
  game = flip(flip(game, a), c);
  assert.equal(game.turn, 1);
  game = settle(game);
  game = flip(flip(game, 0), partnerOf(game, 0));
  assert.equal(game.turn, 1, "a match keeps the turn");
  assert.deepEqual(game.pairs, [0, 1]);
  assert.ok(DUO_SIZES.includes(12));
});

test("a random tapper always finishes every board, and every board ends with all pairs found", () => {
  for (const level of [1, 8, 9, 16, 17, 24]) {
    const spec = LEVELS[level - 1];
    let game = started(newGame(level, spec));
    const rng = makeRng(level * 31 + 7);
    for (let taps = 0; game.phase === "play" && taps < 30_000; taps++) game = flip(game, pick(rng, game.board.length));
    assert.equal(game.phase, "over", `level ${level}`);
    assert.equal(game.pairs[0], spec.pairs);
    assert.ok(game.found.every(owner => owner === 0));
  }
});

test("flips survive a link as base-32 digits (places past 15 on a 24-card board)", () => {
  const end = play(77, LEVELS[7], PLAYERS.sharp).game;
  assert.ok(end.flips.some(index => index >= 16));
  assert.deepEqual(readFlips(flipsText(end.flips)), end.flips);
  assert.equal(readFlips("xyz"), null);
});
