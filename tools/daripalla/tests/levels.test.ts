import assert from "node:assert/strict";
import test from "node:test";
import { makeRng } from "../../../shared/game-core";
import { isLevel, LEVEL_COUNT, levelOf, levelsOfWorld, nextInOrder, nextToPlay, ORDER, placeOf, starsOf, WORLDS } from "../lib/levels";
import { choicesFor, fewestPieces, FRUITS, KNOWN_FRUITS, makePuzzle, PAN_MAX, starsIn, sum, UNKNOWN_FRUITS, type Pace } from "../lib/puzzle";
import { GUESSER, LEARNER, playRound, QUICK, SEVEN } from "./bot";

const PACES: Pace[] = [-1, 0, 1];
const nfc = (text: string) => assert.equal(text, text.normalize("NFC"), text);
const total = (pieces: { value: number }[]) => pieces.reduce((all, piece) => all + piece.value, 0);

test("the levels are data: eleven in three worlds, old ids 1–7 kept, one finale per world, nothing duplicated", () => {
  assert.equal(ORDER.length, 11);
  assert.equal(new Set(ORDER).size, 11);
  assert.deepEqual([...ORDER].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  assert.equal(LEVEL_COUNT, 11);
  for (let id = 1; id <= 7; id++) assert.ok(isLevel(id), `old id ${id} still plays`);
  assert.deepEqual(levelsOfWorld(0), [1, 2, 3, 8]);
  assert.deepEqual(levelsOfWorld(1), [4, 5, 6, 9]);
  assert.deepEqual(levelsOfWorld(2), [10, 7, 11]);
  for (const world of WORLDS) {
    const ids = levelsOfWorld(world.id);
    assert.equal(levelOf(ids[ids.length - 1]).finale, true, `${world.name} ends on a finale`);
    assert.equal(ids.filter(id => levelOf(id).finale).length, 1);
  }
  // The old kinds are unchanged: ids 1–3 fill, 4–6 find, 7 guess.
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7].map(id => levelOf(id).kind), ["fill", "fill", "fill", "find", "find", "find", "guess"]);
  const titles = ORDER.map(id => levelOf(id).title);
  assert.equal(new Set(titles).size, 11);
  for (const id of ORDER) { const level = levelOf(id); [level.title, level.news, level.task].forEach(nfc); assert.equal(level.puzzles, 5); }
  assert.equal(placeOf(8), 4); assert.equal(nextInOrder(8), 4); assert.equal(nextInOrder(11), 0);
  assert.equal(nextToPlay({}), 1); assert.equal(nextToPlay({ 1: 3, 2: 1, 3: 2 }), 8); assert.equal(nextToPlay(Object.fromEntries(ORDER.map(id => [id, 1]))), 11);
});

test("content data: fruits have names and art, known and unknown fruits never overlap, Bangla is NFC", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const art = readFileSync(join(import.meta.dirname, "../components/art.tsx"), "utf8");
  for (const [id, fruit] of Object.entries(FRUITS)) {
    assert.match(art, new RegExp(`\\b${id}: \\(\\) =>`), `art for ${id}`);
    nfc(fruit.name); nfc(fruit.of);
    assert.ok(fruit.of.startsWith(fruit.name), fruit.of);
  }
  assert.equal(new Set(Object.values(FRUITS).map(fruit => fruit.name)).size, Object.keys(FRUITS).length);
  assert.deepEqual(KNOWN_FRUITS.map(item => item.value), [1, 2, 3, 5], "tags grow with the fruit: লিচু < পেয়ারা < আম < পেঁপে");
  for (const fruit of UNKNOWN_FRUITS) assert.ok(!KNOWN_FRUITS.some(item => item.fruit === fruit), `${fruit} is never both tagged and unknown`);
});

test("every puzzle at every pace is solvable with the given pieces and fits the pan", () => {
  for (const id of ORDER) for (const pace of PACES) for (let seed = 1; seed <= 300; seed++) for (const index of [0, 1, 2]) {
    const level = levelOf(id), puzzle = makePuzzle(id, pace, makeRng(seed), index);
    assert.equal(puzzle.kind, level.kind);
    if (level.kind === "guess") {
      assert.equal(puzzle.tray.length, 0);
      const stars = puzzle.left.filter(piece => piece.kind === "star");
      assert.equal(stars.length, starsIn(id), `level ${id} shows ${starsIn(id)} ★`);
      assert.ok(stars.every(piece => piece.value === puzzle.answer));
      assert.equal(total(puzzle.start), total(puzzle.left), "the picture equation is true");
      assert.ok(total(puzzle.left) <= 20);
    } else {
      const need = total(puzzle.left) - total(puzzle.start);
      assert.ok(need >= 1, `level ${id} needs something on the pan`);
      assert.ok(fewestPieces(need, puzzle.tray.map(piece => piece.value)) <= PAN_MAX - puzzle.start.length, `level ${id} fits the pan: ${need}`);
      assert.ok(total(puzzle.left) <= 20, "sums stay within 20");
      if (level.kind === "fill") assert.equal(puzzle.answer, need);
    }
    if (level.kind !== "fill") {
      assert.equal(puzzle.choices.length, 3);
      assert.ok(puzzle.choices.includes(puzzle.answer));
      assert.equal(new Set(puzzle.choices).size, 3);
      assert.ok(puzzle.choices.every(value => value >= 1));
      assert.deepEqual(puzzle.choices, [...puzzle.choices].sort((a, b) => a - b));
      assert.ok(puzzle.answer >= 2, "no fruit weighs nothing");
    }
    const fruits = puzzle.left.filter(piece => piece.kind === "fruit");
    if (id === 6) assert.equal(fruits.length === 2 && fruits[0].kind === "fruit" && fruits[1].kind === "fruit" && fruits[0].fruit === fruits[1].fruit, true);
    if (id === 9) { assert.equal(fruits.length, 2); assert.equal(puzzle.left.filter(piece => piece.kind === "weight").length, 1); }
    if (id === 8) { assert.equal(puzzle.left.length, 2); assert.equal(puzzle.start.length, 1); assert.ok(puzzle.left.every(piece => piece.kind === "weight")); }
    if (id === 1 && index === 0) assert.ok([1, 2, 5].includes(puzzle.answer), "level 1's first pan is one tap");
  }
  assert.equal(fewestPieces(19, [1, 2, 5, 10]), 4);
  assert.equal(fewestPieces(0, [1]), 0);
  assert.equal(fewestPieces(-1, [1]), Infinity);
  assert.deepEqual(choicesFor(5, makeRng(1), 7).includes(7), true, "the tempting wrong one is offered");
});

test("difficulty steps: an eased pace keeps numbers small, a brisk one makes them bigger", () => {
  for (const id of ORDER) {
    const sums = (pace: Pace) => Array.from({ length: 300 }, (_, seed) => total(makePuzzle(id, pace, makeRng(seed + 1), 1).left));
    assert.ok(Math.max(...sums(-1)) <= Math.max(...sums(0)) && Math.max(...sums(0)) <= Math.max(...sums(1)), `level ${id} grows with pace`);
    assert.ok(Math.min(...sums(-1)) <= Math.min(...sums(1)), `level ${id}`);
  }
});

test("stars: no miss or one → 3, up to three → 2, else 1", () => {
  assert.deepEqual([0, 1, 2, 3, 4, 9].map(starsOf), [3, 3, 2, 2, 1, 1]);
});

test("bots: a child who knows the way gets 3 stars on every level, each in a round of a few minutes", () => {
  for (const id of ORDER) {
    let three = 0, slowest = 0;
    for (let seed = 1; seed <= 25; seed++) {
      const play = playRound(id, seed, QUICK);
      assert.equal(play.run.solved, 5);
      if (play.run.stars === 3) three++;
      slowest = Math.max(slowest, play.seconds);
      assert.ok(play.firstWinAt <= 10, `level ${id}: the first pan is level within 10 s (${play.firstWinAt.toFixed(1)})`);
    }
    assert.equal(three, 25, `level ${id}`);
    assert.ok(slowest <= 120, `level ${id} takes ${slowest.toFixed(0)} s`);
  }
});

test("bots: a learner clears every level with at least 2 stars most of the time; a seven-year-old often does; guessing never gets stuck", () => {
  for (const id of ORDER) {
    const stars = (child: typeof QUICK) => Array.from({ length: 40 }, (_, seed) => playRound(id, seed + 1, child).run.stars);
    const learner = stars(LEARNER), seven = stars(SEVEN), guess = stars(GUESSER);
    const rate = (all: number[], atLeast: number) => all.filter(value => value >= atLeast).length / all.length;
    assert.ok(rate(learner, 2) >= 0.8, `level ${id}: learner 2★ rate ${rate(learner, 2)}`);
    assert.ok(rate(seven, 2) >= 0.45, `level ${id}: seven-year-old 2★ rate ${rate(seven, 2)}`);
    assert.ok(rate(guess, 1) === 1 && rate(guess, 3) <= 0.5, `level ${id}: guessing still ends (1★ at least) and mostly isn't 3★`);
  }
});
