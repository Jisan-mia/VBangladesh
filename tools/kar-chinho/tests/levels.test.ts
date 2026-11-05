import assert from "node:assert/strict";
import test from "node:test";
import { hasWordPicture } from "../lib/art";
import { ALL_SIGNS, LEVEL_COUNT, ORDER, WORLDS, isWorldEnd, levelOf, levelsOfWorld, nextInOrder, nextToPlay, placeOf, printLevel, signsOf } from "../lib/levels";
import { MAX_CHOICES, MIN_CHOICES, START_PACE, answer, choiceCount, choicesFor, createRound, currentItem, isDone, nextPace, nextWord, starsOf, type Pace } from "../lib/round";
import { KARS, PARTNERS, SIDE, dotted, spellWith, splitWord } from "../lib/words";
import { FIVE, GUESSER, LEARNER, playRound } from "./bot";

const SEEDS = 2000;
const items = ORDER.flatMap(id => levelOf(id).items);

test("every word has a picture, an NFC spelling and exactly the sign it claims", () => {
  for (const item of items) {
    assert.ok(hasWordPicture(item.pic), `${item.word}: no picture "${item.pic}"`);
    assert.equal(item.word, item.word.normalize("NFC"), `${item.word}: not NFC`);
    assert.ok(KARS.includes(item.kar), `${item.word}: not a কার`);
    assert.equal(spellWith(item, item.kar), item.word, `${item.word}: slot doesn't rebuild the word`);
    assert.ok(splitWord(item).base.length >= 1, `${item.word}: empty base`);
    // A ঁ ং ঃ right after the slot would float on nothing while the sign is missing.
    assert.ok(!/^[ঁ-ঃ]/.test(splitWord(item).after), `${item.word}: a mark sits on the slot`);
  }
});

test("each picture always means the same word", () => {
  const byPic = new Map<string, string>();
  for (const item of items) { assert.equal(byPic.get(item.pic) ?? item.word, item.word, `${item.pic} used for two words`); byPic.set(item.pic, item.word); }
});

test("the slot sits where the sign shows", () => {
  assert.deepEqual(splitWord(levelOf(1).items[0]), { before: "", base: "ম", after: "ছ" });
  assert.equal(SIDE["ি"], "left"); assert.equal(SIDE["া"], "right"); assert.equal(SIDE["ু"], "below"); assert.equal(SIDE["ৌ"], "both");
  assert.deepEqual(splitWord(items.find(item => item.word === "বৃষ্টি")!), { before: "", base: "ব", after: "ষ্টি" });
  assert.deepEqual(splitWord(items.find(item => item.word === "পেঁপে")!), { before: "পেঁ", base: "প", after: "" });
  assert.deepEqual(splitWord(items.find(item => item.word === "ঘুড়ি" && item.kar === "ি")!), { before: "ঘু", base: "ড়", after: "" }, "the nukta stays with its letter");
  assert.equal(dotted("া"), "◌া");
});

test("levels: ids 1–11 keep their old sign (saved stars and ?print links), three world finales are new ids", () => {
  assert.equal(LEVEL_COUNT, 14);
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(id => levelOf(id).kar), [...KARS]);
  assert.equal(levelOf(ALL_SIGNS).kar, null);
  assert.deepEqual(new Set(levelOf(ALL_SIGNS).items.map(item => item.kar)), new Set(KARS), "সব কার uses every sign once");
  assert.deepEqual([...ORDER].sort((a, b) => a - b), Array.from({ length: 14 }, (_, at) => at + 1), "the play order lists every level once");
  for (const id of ORDER) {
    const level = levelOf(id);
    assert.equal(level.items.length, 10, level.title);
    assert.equal(new Set(level.items.map(item => item.word)).size, 10, `${level.title}: a word repeats`);
    if (level.kar) assert.ok(level.items.filter(item => item.kar === level.kar).length >= 3, `${level.title}: too few focus words`);
    if (level.pool) for (const item of level.items) assert.ok(level.pool.includes(item.kar), `${level.title}: ${item.word} is from another world`);
  }
});

test("worlds: grouped by where the sign sits, each ending in a named finale", () => {
  assert.deepEqual(WORLDS.map(world => levelsOfWorld(world.id)), [[1, 2, 3, 12], [4, 5, 6, 13], [7, 8, 9, 10, 14], [11]]);
  for (const world of WORLDS) {
    const ids = levelsOfWorld(world.id), last = ids[ids.length - 1];
    assert.ok(levelOf(last).finale, `${world.name} ends in a finale`);
    assert.ok(isWorldEnd(last) && ids.slice(0, -1).every(id => !isWorldEnd(id)));
    for (const id of ids.slice(0, -1)) assert.ok(world.signs.includes(levelOf(id).kar!), `${levelOf(id).title} sits in ${world.name}`);
  }
  for (const id of [1, 2, 3]) assert.ok(["left", "right"].includes(SIDE[levelOf(id).kar!]));
  for (const id of [4, 5, 6]) assert.equal(SIDE[levelOf(id).kar!], "below");
  assert.deepEqual(ORDER.map(placeOf), Array.from({ length: 14 }, (_, at) => at + 1));
  assert.equal(nextInOrder(3), 12); assert.equal(nextInOrder(12), 4); assert.equal(nextInOrder(11), 0);
  assert.deepEqual(signsOf(12), ["া", "ি", "ী"]); assert.deepEqual(signsOf(1), ["া"]);
});

test("the level that's ready: the first in play order without stars", () => {
  assert.equal(nextToPlay({}), 1);
  assert.equal(nextToPlay({ 1: 3, 2: 1, 3: 2 }), 12, "after ঈ-কার comes the world's finale, not উ-কার");
  assert.equal(nextToPlay({ 1: 3, 2: 1, 3: 2, 12: 1, 4: 2 }), 5);
  assert.equal(nextToPlay(Object.fromEntries(ORDER.map(id => [id, 1]))), 1);
});

test("print view: ?print=N for every id; anything else prints সব কার", () => {
  assert.equal(printLevel("4"), 4);
  assert.equal(printLevel("13"), 13);
  for (const value of ["", "0", "15", "x", "1.5", null]) assert.equal(printLevel(value), ALL_SIGNS);
});

test("choices: the right sign plus close look-alikes, no repeats, no real variant spelling", () => {
  for (const id of ORDER) for (const item of levelOf(id).items) for (let count = MIN_CHOICES; count <= MAX_CHOICES; count++) for (const seed of [1, 7, 99]) {
    const tiles = choicesFor(item, count, seed, levelOf(id).pool);
    assert.equal(tiles.length, count);
    assert.ok(tiles.includes(item.kar));
    assert.equal(new Set(tiles).size, count);
    for (const kar of tiles) assert.ok(!item.not?.includes(kar));
  }
  for (const kar of KARS) assert.ok(PARTNERS[kar].length >= MAX_CHOICES && !PARTNERS[kar].includes(kar));
  const mula = items.find(item => item.word === "মুলা")!;
  assert.ok(!choicesFor(mula, 4, 3, levelOf(13).pool).includes("ূ"), "মূলা is a variant spelling, never a wrong tile");
});

test("a finale's tiles are its own world's signs first", () => {
  for (const id of [12, 13, 14]) {
    const level = levelOf(id);
    for (const item of level.items) {
      const tiles = choicesFor(item, level.base, 5, level.pool);
      const own = level.pool!.filter(kar => !item.not?.includes(kar));
      for (const kar of own.slice(0, level.base)) assert.ok(tiles.includes(kar), `${level.title}: ${item.word} misses ${kar}`);
    }
  }
});

test("difficulty: three first-try misses ease the next word, five right step it up, within one tile", () => {
  let pace: Pace = START_PACE;
  for (let i = 0; i < 3; i++) pace = nextPace(pace, false);
  assert.equal(pace.offset, -1);
  for (let i = 0; i < 3; i++) pace = nextPace(pace, false);
  assert.equal(pace.offset, -1, "never more than one tile easier");
  for (let i = 0; i < 5; i++) pace = nextPace(pace, true);
  assert.equal(pace.offset, 0);
  for (let i = 0; i < 10; i++) pace = nextPace(pace, true);
  assert.equal(pace.offset, 1);
  assert.equal(choiceCount(levelOf(1), START_PACE), 2);
  assert.equal(choiceCount(levelOf(1), { ...START_PACE, offset: -1 }), 2);
  assert.equal(choiceCount(levelOf(3), START_PACE), 3);
  assert.equal(choiceCount(levelOf(11), { ...START_PACE, offset: 1 }), 4);
});

test("stars: 8+ first-try → 3, 5+ → 2, else 1", () => {
  assert.deepEqual([10, 8, 7, 5, 4, 0].map(starsOf), [3, 3, 2, 2, 1, 1]);
});

test("determinism: the same seed gives the same words and tiles", () => {
  for (const id of ORDER) assert.deepEqual(createRound(id, 1234), createRound(id, 1234));
  assert.notDeepEqual(createRound(1, 1).items.map(item => item.word), createRound(1, 2).items.map(item => item.word));
  assert.deepEqual(playRound(5, 77, FIVE), playRound(5, 77, FIVE));
});

test("a whole round: wrong taps cost a first try, never the round", () => {
  for (const id of ORDER) {
    let round = createRound(id, 42 + id), turns = 0;
    while (!isDone(round)) {
      const item = currentItem(round);
      if (round.index % 3 === 0) round = answer(round, round.choices.find(kar => kar !== item.kar)!);
      round = answer(round, item.kar);
      assert.equal(answer(round, item.kar), round, "taps after solving are ignored");
      round = nextWord(round);
      assert.ok(++turns <= 10);
    }
    assert.equal(round.firstTry, 6);
    assert.equal(round.misses, 4);
  }
});

test("bots: a guesser always finishes; a five-year-old clears level ১ well; learners get ৩ stars", () => {
  for (const id of ORDER) {
    let guess3 = 0, five3 = 0, learn3 = 0, maxTaps = 0;
    for (let seed = 1; seed <= SEEDS; seed++) {
      const g = playRound(id, seed * 7 + id, GUESSER), f = playRound(id, seed * 7 + id, FIVE), l = playRound(id, seed * 7 + id, LEARNER);
      maxTaps = Math.max(maxTaps, g.taps);
      if (starsOf(g.round.firstTry) === 3) guess3++;
      if (starsOf(f.round.firstTry) === 3) five3++;
      if (starsOf(l.round.firstTry) === 3) learn3++;
      assert.ok(g.firstRightAt <= 10 && f.firstRightAt <= 10, `${levelOf(id).title}: the first word takes longer than 10 s`);
    }
    const name = levelOf(id).title;
    assert.ok(maxTaps <= 30, `${name}: a guesser needed ${maxTaps} taps`);
    assert.ok(guess3 / SEEDS <= 0.06, `${name}: random taps earn ৩ stars ${guess3 / SEEDS}`);
    assert.ok(learn3 / SEEDS >= 0.9, `${name}: learner ৩ stars ${learn3 / SEEDS}`);
    if (id === 1) assert.ok(five3 / SEEDS >= 0.75, `level ১: five-year-old ৩ stars ${five3 / SEEDS}`);
    if (levelOf(id).finale) assert.ok(five3 / SEEDS >= 0.45 && five3 / SEEDS <= 0.8, `${name}: five-year-old ৩ stars ${five3 / SEEDS}, the finale should be harder but fair`);
  }
});
