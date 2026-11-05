import assert from "node:assert/strict";
import test from "node:test";
import { isLevel, LEVEL_COUNT, levelOf, levelsOfWorld, nextInOrder, nextToPlay, ORDER, placeOf, WORLDS, isWorldEnd } from "../lib/levels";
import { roundStars } from "../lib/play";
import { FIVE, GUESSER, LEARNER, numberFor, playRound } from "./bot";
import { parseNumber } from "../lib/play";

const SEEDS = 300;
const rate = (level: number, child: typeof FIVE, test: (play: ReturnType<typeof playRound>) => boolean) => {
  let hit = 0;
  for (let seed = 1; seed <= SEEDS; seed++) if (test(playRound(level, seed, child))) hit++;
  return hit / SEEDS;
};
const threeStars = (level: number, child: typeof FIVE) => rate(level, child, play => roundStars(play.round) === 3);

test("three worlds of three levels, each with its own idea; ids 1–4 keep their old meaning so saved stars stay true", () => {
  assert.equal(LEVEL_COUNT, 9);
  assert.deepEqual([...ORDER].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.deepEqual(WORLDS.map(world => levelsOfWorld(world.id).length), [3, 3, 3]);
  // Old steps: 1 copy · 2 the old piece hides · 3 look then hide all · 4 the whole number from memory.
  assert.deepEqual([1, 2, 3, 4].map(id => levelOf(id).hide), ["none", "old", "all", "all"]);
  assert.deepEqual([1, 2, 3].map(id => levelOf(id).pieces.length), [4, 4, 4]);
  assert.deepEqual(levelOf(4).pieces, [11]);
  assert.equal(levelOf(4).show, false);
  // One finale a world, and it is the last of its world in play order.
  for (const world of WORLDS) {
    const ids = levelsOfWorld(world.id);
    assert.deepEqual(ids.filter(isWorldEnd), [ids[2]], world.name);
    assert.ok(levelOf(ids[2]).finale);
  }
  assert.equal(new Set(ORDER.map(id => levelOf(id).title)).size, 9);
  // A new idea at a time: pieces get longer, hiding comes in, then looks run out.
  assert.deepEqual(ORDER.map(id => levelOf(id).pieces.length), [4, 2, 1, 4, 4, 2, 2, 1, 1]);
  assert.deepEqual(ORDER.map(id => levelOf(id).hide), ["none", "none", "none", "old", "all", "all", "all", "all", "all"]);
  assert.deepEqual(ORDER.map(id => levelOf(id).eyes), [null, null, null, null, null, null, 3, 2, 1]);
  assert.equal(placeOf(4), 9);
  assert.equal(nextInOrder(4), 0);
  assert.equal(nextInOrder(1), 5);
  assert.equal(nextToPlay({}), 1);
  assert.equal(nextToPlay({ 1: 3, 5: 2 }), 6);
  assert.equal(nextToPlay(Object.fromEntries(ORDER.map(id => [id, 1]))), 1);
  assert.equal(isLevel(0), false); assert.equal(isLevel(10), false); assert.equal(isLevel(1.5), false);
  assert.equal(levelOf(99).id, 1);
});

test("bot numbers are valid mobile numbers", () => {
  for (let seed = 1; seed <= 200; seed++) assert.equal(parseNumber(numberFor(seed)), numberFor(seed));
});

test("level 1: the first piece is in within 10 seconds for a young child, and the whole round is about half a minute", () => {
  assert.ok(rate(1, FIVE, play => play.firstPieceAt <= 10) >= 0.99);
  assert.ok(rate(1, FIVE, play => play.seconds <= 60) >= 0.95);
  assert.ok(rate(1, LEARNER, play => play.seconds <= 40) >= 0.95);
});

test("the guesser always gets through (the key glows after two misses) and never earns three stars", () => {
  for (const id of ORDER) {
    for (let seed = 1; seed <= 60; seed++) { const play = playRound(id, seed, GUESSER); assert.ok(play.mostTaps <= 3, `L${id} seed ${seed}`); }
    assert.ok(threeStars(id, GUESSER) <= 0.02, `L${id}`);
  }
});

test("a five-year-old gets three stars on the copying world most of the time, and the hidden worlds ask for more", () => {
  assert.ok(threeStars(1, FIVE) >= 0.55);
  assert.ok(threeStars(5, FIVE) >= 0.7);
  assert.ok(threeStars(6, FIVE) >= 0.8);
  // Every level is finished (never stuck), and a hidden level is harder than the copying one for the same child.
  for (const id of ORDER) assert.ok(rate(id, FIVE, play => play.round.stage === "end") === 1, `L${id}`);
  assert.ok(threeStars(3, FIVE) < threeStars(1, FIVE));
});

test("a child who has practised gets three stars on the copying world nearly always, and on the hidden worlds about half the time", () => {
  for (const id of [1, 5, 6]) assert.ok(threeStars(id, LEARNER) >= 0.9, `L${id}`);
  for (const id of [2, 3, 7, 8, 9, 4]) {
    const share = threeStars(id, LEARNER);
    assert.ok(share >= 0.25 && share <= 0.85, `L${id} ${share}`);
  }
});

test("a round is about a minute or two", () => {
  for (const id of ORDER) {
    assert.ok(rate(id, LEARNER, play => play.seconds <= 60) >= 0.95, `L${id} learner`);
    assert.ok(rate(id, FIVE, play => play.seconds <= 120) >= 0.95, `L${id} five`);
  }
});
