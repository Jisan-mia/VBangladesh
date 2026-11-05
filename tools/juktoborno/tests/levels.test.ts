import assert from "node:assert/strict";
import test from "node:test";
import { ALL_JOINTS, GRAND_FINALE, LEVEL_COUNT, ORDER, WORLDS, emblemOf, isWorldEnd, levelOf, levelsOfWorld, nextInOrder, nextToPlay, placeOf, printLevel } from "../lib/levels";
import {
  DECOYS, createRound, currentStep, hint, isLast, marksOf, methodLine, nextStep, place, resultOf, startPace, starsOf, tiles, unplace, wanted, whyLine, type Round,
} from "../lib/round";
import { SETS, conjunct } from "../lib/words";
import { GUESSER, LEARNER, SEVEN, playRound } from "./bot";

const SEEDS = 2000;
const solve = (round: Round) => currentStep(round).word.parts.reduce((state, part) => place(state, part).round, round);

test("levels: ids 1–8 keep their old meaning (saved stars), the four finales are new ids 9–12", () => {
  assert.equal(LEVEL_COUNT, 12);
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7, 8].map(id => levelOf(id).mode), ["bhangi", "juri", "bhangi", "juri", "bhangi", "juri", "bhangi", "juri"]);
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7, 8].map(id => levelOf(id).world), [0, 0, 1, 1, 2, 2, 3, 3]);
  assert.deepEqual([9, 10, 11, 12].map(id => levelOf(id).mode), ["mixed", "mixed", "mixed", "mixed"]);
  assert.deepEqual([...ORDER].sort((a, b) => a - b), Array.from({ length: 12 }, (_, at) => at + 1), "the play order lists every level once");
  assert.equal(new Set(ORDER.map(id => levelOf(id).title)).size, 12, "titles are unique");
  assert.equal(levelOf(0), levelOf(1));
  assert.equal(levelOf(99), levelOf(1));
  // The old titles are unchanged.
  assert.deepEqual([1, 2, 3, 4].map(id => levelOf(id).title), ["জোড়া বর্ণ ভাঙি", "জোড়া বর্ণ জুড়ি", "চেনা যুক্তবর্ণ ভাঙি", "চেনা যুক্তবর্ণ জুড়ি"]);
});

test("worlds: one set each, ভাঙি, জুড়ি, then a named finale of every word", () => {
  assert.deepEqual(WORLDS.map(world => levelsOfWorld(world.id)), [[1, 2, 9], [3, 4, 10], [5, 6, 11], [7, 8, 12]]);
  for (const world of WORLDS) {
    const ids = levelsOfWorld(world.id), last = ids[ids.length - 1];
    assert.ok(levelOf(last).finale && isWorldEnd(last) && ids.slice(0, -1).every(id => !isWorldEnd(id)));
    assert.equal(levelOf(last).size, SETS[world.set].words.length, "a finale plays every word of its world");
    for (const id of ids) assert.equal(levelOf(id).words, SETS[world.set].words);
    for (const id of ids.slice(0, -1)) assert.equal(levelOf(id).size, 6);
    assert.ok(world.task.length > 10 && world.skill.length > 3);
  }
  assert.deepEqual(ORDER.map(placeOf), Array.from({ length: 12 }, (_, at) => at + 1));
  assert.equal(nextInOrder(2), 9); assert.equal(nextInOrder(9), 3); assert.equal(nextInOrder(GRAND_FINALE), 0);
});

test("each world's first level teaches one new thing: doubles, two letters, hidden shapes, ফলা and রেফ", () => {
  for (const word of SETS.double.words) assert.equal(word.parts[0], word.parts[1]);
  for (const word of SETS.common.words) assert.notEqual(word.parts[0], word.parts[1]);
  assert.ok(SETS.tricky.words.every(word => ["কষ", "জঞ", "ঞজ", "কত", "ঙক", "ষঠ", "কস"].includes(word.parts.join(""))));
  assert.ok(SETS.phala.words.every(word => word.parts.includes("র") || word.parts.includes("য")));
});

test("the level that's ready: the first in play order without stars", () => {
  assert.equal(nextToPlay({}), 1);
  assert.equal(nextToPlay({ 1: 3, 2: 1 }), 9, "after জুড়ি comes the world's finale, not the next world");
  assert.equal(nextToPlay({ 1: 3, 2: 1, 9: 2, 3: 1 }), 4);
  assert.equal(nextToPlay(Object.fromEntries(ORDER.map(id => [id, 1]))), 1);
});

test("print view: ?print=N for every id; a bare or odd ?print gives the ten-word sheet", () => {
  assert.equal(printLevel("4"), 4);
  assert.equal(printLevel("12"), 12);
  for (const value of ["", "0", "13", "x", "1.5", null]) assert.equal(printLevel(value), 0);
});

test("the খাতা lists every যুক্তবর্ণ once, and each card shows what its level is about", () => {
  const all = Object.values(SETS).flatMap(set => set.words.map(word => conjunct(word.parts)));
  assert.deepEqual([...ALL_JOINTS], [...new Set(all)]);
  assert.equal(emblemOf(1).length, 1);
  assert.equal(emblemOf(9).length, 2);
  assert.equal(emblemOf(5)[0], "ক্ষ");
});

test("a round: the level's words in a seeded order; a finale alternates ভাঙি and জুড়ি; replays reorder, never change, the words", () => {
  const round = createRound(5, 42);
  assert.equal(round.steps.length, 6);
  assert.equal(new Set(round.steps.map(step => step.word.word)).size, 6);
  assert.ok(round.steps.every(step => step.mode === "bhangi"));
  assert.deepEqual(createRound(5, 42), round);
  assert.notDeepEqual(createRound(3, 1).steps.map(step => step.word.word), createRound(3, 2).steps.map(step => step.word.word));
  const finale = createRound(11, 7);
  assert.equal(finale.steps.length, 8);
  assert.deepEqual(finale.steps.map(step => step.mode), ["bhangi", "juri", "bhangi", "juri", "bhangi", "juri", "bhangi", "juri"]);
  assert.equal(new Set(finale.steps.map(step => step.word.word)).size, 8, "every word of the world, once");
  for (const id of ORDER) assert.deepEqual(createRound(id, 1234), createRound(id, 1234));
});

test("level ১ opens with two tiles so the first win is a tap or two away", () => {
  const round = createRound(1, 3);
  assert.equal(startPace(1), "easy");
  assert.equal(tiles(round).length, 2);
  assert.equal(createRound(3, 3).pace, "normal");
});

test("placing: fill, then right; a double takes the same tile twice; nothing after the word is solved", () => {
  let round = createRound(1, 7);
  const word = currentStep(round).word;
  let step = place(round, word.parts[0]);
  assert.equal(step.outcome, "fill");
  step = place(step.round, word.parts[1]);
  assert.equal(step.outcome, "right");
  round = step.round;
  assert.ok(round.solved);
  assert.equal(round.firstTry, 1);
  assert.equal(place(round, "ক").outcome, "ignore", "no taps after a word is done");
  assert.equal(unplace(round), round, "a solved word can't be taken back");
  round = nextStep(round);
  assert.equal(round.index, 1);
  assert.deepEqual(round.filled, []);
  assert.equal(nextStep(round), round, "পরেরটা waits for a solved word");
});

test("wrong order and wrong letters: the slots empty, marks show what fitted, a one-line reason, then the next tile glows", () => {
  const round = createRound(3, 11);
  const word = currentStep(round).word;
  const flipped = place(place(round, word.parts[1]).round, word.parts[0]);
  assert.equal(flipped.outcome, "order");
  assert.deepEqual(flipped.round.filled, []);
  assert.deepEqual(marksOf(flipped.round), ["wrong", "wrong"]);
  assert.match(whyLine(flipped.round), /আগে-পরে উল্টো/);
  assert.equal(hint(flipped.round), 1);
  assert.equal(wanted(flipped.round), word.parts[0]);
  const stray = place(place(flipped.round, word.parts[0]).round, word.decoys[0]);
  assert.equal(stray.outcome, "wrong");
  assert.deepEqual(marksOf(stray.round), ["right", "wrong"]);
  assert.equal(whyLine(stray.round), `${word.parts[0]} ঠিক জায়গায়। ${word.decoys[0]} এই যুক্তবর্ণে নেই।`);
  assert.equal(hint(stray.round), 2);
  assert.equal(stray.round.misses, 2);
  assert.doesNotMatch(whyLine(stray.round), /ভুল/);
  // A glow never gives away more than the next letter.
  assert.equal(wanted(place(stray.round, word.parts[0]).round), word.parts[1]);
});

test("undo takes the last letter back", () => {
  const round = createRound(2, 5), word = currentStep(round).word;
  const one = place(round, word.parts[0]).round;
  assert.deepEqual(unplace(one).filled, []);
  assert.equal(unplace(round), round);
});

test("difficulty: three misses in a row quietly ease the next tiles; five right in a row step them up", () => {
  let round = createRound(3, 1);
  for (let i = 0; i < 3; i++) round = place(place(round, "অ").round, "অ").round;
  assert.equal(round.pace, "easy");
  assert.equal(tiles(round).length, new Set(currentStep(round).word.parts).size + DECOYS.easy);
  round = solve(round);
  assert.equal(round.pace, "easy", "one right is not enough");
  round = solve(nextStep(round));
  assert.equal(round.pace, "normal", "two right in a row lift it back");
  round = createRound(4, 2);
  for (let i = 0; i < 5; i++) { round = solve(round); if (i < 4) round = nextStep(round); }
  assert.equal(round.pace, "hard");
  round = place(place(nextStep(round), "অ").round, "অ").round;
  assert.equal(round.pace, "normal", "a miss steps it back down");
});

test("a whole round: wrong tries cost stars, never the round; a finale ends after every word", () => {
  for (const id of ORDER) {
    let round = createRound(id, 99 + id), words = 0;
    for (;;) {
      if (round.index % 3 === 0) { const word = currentStep(round).word; round = place(place(round, word.decoys[0]).round, word.decoys[0]).round; }
      round = solve(round);
      words++;
      if (isLast(round)) break;
      round = nextStep(round);
    }
    assert.equal(words, levelOf(id).size);
    assert.equal(round.firstTry, words - Math.ceil(words / 3));
    const result = resultOf(round);
    assert.equal(result.words, words);
    assert.ok(result.stars >= 1);
  }
});

test("stars record clean work, and praise names the method only when earned", () => {
  assert.deepEqual([0, 1, 2, 4, 5, 9].map(misses => starsOf(misses)), [3, 3, 2, 2, 1, 1]);
  assert.deepEqual([0, 1, 2, 6, 7].map(misses => starsOf(misses, 8)), [3, 3, 2, 2, 1]);
  assert.match(methodLine({ misses: 0 }), /ধীরে বলে বলে/);
  assert.match(methodLine({ misses: 3 }), /^৩বার/);
  assert.match(methodLine({ misses: 9 }), /কঠিন ছিল/);
});

test("bots: a guesser always finishes in a few tries; a seven-year-old earns stars; a learner earns ৩ on almost every round", () => {
  for (const id of ORDER) {
    const level = levelOf(id);
    let guess3 = 0, seven2 = 0, seven3 = 0, learn3 = 0, maxTaps = 0, firstSolvedGuess = 0;
    for (let seed = 1; seed <= SEEDS; seed++) {
      const g = playRound(id, seed * 7 + id, GUESSER), s = playRound(id, seed * 7 + id, SEVEN), l = playRound(id, seed * 7 + id, LEARNER);
      maxTaps = Math.max(maxTaps, g.taps);
      firstSolvedGuess = Math.max(firstSolvedGuess, g.firstSolvedAt);
      // At most three full tries on a word (two misses, then the glowing tile), of 2–3 letters each.
      assert.ok(g.mostTapsOnAWord <= 3 * 3, `${level.title}: ${g.mostTapsOnAWord} taps on one word`);
      if (starsOf(g.round.misses, level.size) === 3) guess3++;
      const stars = starsOf(s.round.misses, level.size);
      if (stars >= 2) seven2++;
      if (stars === 3) seven3++;
      if (starsOf(l.round.misses, level.size) === 3) learn3++;
    }
    const name = level.title;
    assert.ok(maxTaps <= 9 * level.size, `${name}: a guesser needed ${maxTaps} taps`);
    assert.ok(guess3 / SEEDS <= 0.03, `${name}: random taps earn ৩ stars ${guess3 / SEEDS}`);
    assert.ok(seven2 / SEEDS >= 0.9, `${name}: a seven-year-old earns ২+ stars ${seven2 / SEEDS}`);
    assert.ok(learn3 / SEEDS >= 0.88, `${name}: learner ৩ stars ${learn3 / SEEDS}`);
    if (id === 1) { assert.ok(seven3 / SEEDS >= 0.55, `level ১: seven-year-old ৩ stars ${seven3 / SEEDS}`); assert.ok(firstSolvedGuess <= 10, `level ১: even a guesser solves word one in ${firstSolvedGuess} s`); }
    if (level.finale) assert.ok(seven3 / SEEDS >= 0.2 && seven3 / SEEDS <= 0.7, `${name}: seven-year-old ৩ stars ${seven3 / SEEDS}, a finale should be harder but fair`);
  }
});
