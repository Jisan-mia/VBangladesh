import assert from "node:assert/strict";
import test from "node:test";
import { ART, svgDocument } from "../lib/art";
import { ALPHABET, blankWord, entryOf, LETTERS, LOOK_ALIKE, MIRROR, MIRROR_CUE, MIRROR_SHAPE, MIRROR_TWIN, splitWord, X_NOTE } from "../lib/letters";
import { LEVEL_COUNT, ORDER, WORLDS, isWorldEnd, isMirrorLevel, levelOf, levelsOfWorld, nextInOrder, nextToPlay, placeOf } from "../lib/levels";
import {
  MAX_CHOICES, MIN_CHOICES, START_PACE, answer, answerOf, askOf, choiceCount, choicesFor, createRound, currentItem, doneLine, hintOn, isDone, makeItems, maxTiles, methodLine, newsOf, nextItem, nextPace,
  resultOf, slipLine, starsOf, taskOf, whyOf, type Pace,
} from "../lib/play";
import { FIVE, GUESSER, LEARNER, playRound } from "./bot";

const SEEDS = 1500;
const nfc = (text: string) => assert.equal(text, text.normalize("NFC"), text);

test("26 letters, A to Z, each with its own word, gloss and picture", () => {
  assert.equal(LETTERS.length, 26);
  assert.equal(ALPHABET.join(""), "ABCDEFGHIJKLMNOPQRSTUVWXYZ");
  assert.equal(new Set(LETTERS.map(entry => entry.word)).size, 26);
  for (const entry of LETTERS) {
    assert.equal(entry.word[entry.at].toUpperCase(), entry.letter, entry.word);
    nfc(entry.bn);
    assert.ok(ART[entry.letter]?.includes("<path") || ART[entry.letter]?.includes("<circle"), `picture for ${entry.letter}`);
    assert.doesNotMatch(ART[entry.letter], /<script|href|url\(/, entry.letter);
    assert.match(svgDocument(entry.letter), /^<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);
  }
  assert.deepEqual(splitWord(entryOf("X")), ["Bo", "x", ""]);
  assert.equal(blankWord(entryOf("M")), "_ango");
  nfc(X_NOTE);
});

test("look-alikes and b d p q are well formed", () => {
  for (const [letter, near] of Object.entries(LOOK_ALIKE)) assert.ok(!near.includes(letter) && near.every(other => /^[a-z]$/.test(other)), letter);
  assert.ok(!LOOK_ALIKE.i.includes("l"), "capital I and small l look the same");
  for (const letter of MIRROR) { assert.equal(MIRROR_TWIN[MIRROR_TWIN[letter]], letter); nfc(MIRROR_CUE[letter]); }
  assert.ok(MIRROR_SHAPE.b.from < 44 && MIRROR_SHAPE.d.from < 44 && MIRROR_SHAPE.p.to > 80 && MIRROR_SHAPE.q.to > 80);
});

test("levels: ids 1–5 keep their old meaning (saved stars), the finales and the b/d level are new ids", () => {
  assert.equal(LEVEL_COUNT, 9);
  assert.deepEqual([1, 2, 3, 4, 5].map(id => levelOf(id).kinds[0]), ["picture", "picture", "small", "first", "mirror"]);
  assert.deepEqual(levelOf(1).letters, ALPHABET.slice(0, 13));
  assert.deepEqual(levelOf(2).letters, ALPHABET.slice(13));
  assert.deepEqual(levelOf(5).letters, ["B", "D", "P", "Q"]);
  assert.ok(!levelOf(4).letters.includes("X"), "Box starts with B, so X sits out the first-letter level");
  assert.deepEqual([...ORDER].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9], "the play order lists every level once");
  for (const id of ORDER) { nfc(levelOf(id).title); nfc(levelOf(id).finale ?? ""); nfc(newsOf(id)); nfc(taskOf(id)); nfc(doneLine(id)); assert.ok(newsOf(id), `news for ${id}`); }
});

test("worlds: one new idea each, every world ends in a named finale", () => {
  assert.deepEqual(WORLDS.map(world => levelsOfWorld(world.id)), [[1, 2, 6], [3, 7], [4, 8], [9, 5]]);
  for (const world of WORLDS) {
    const ids = levelsOfWorld(world.id), last = ids[ids.length - 1];
    assert.ok(levelOf(last).finale, `${world.name} ends in a finale`);
    assert.ok(isWorldEnd(last) && ids.slice(0, -1).every(id => !isWorldEnd(id)));
    for (const id of ids.slice(0, -1)) assert.equal(levelOf(id).finale, undefined);
  }
  assert.equal(placeOf(6), 3); assert.equal(placeOf(5), 9);
  assert.equal(nextInOrder(6), 3); assert.equal(nextInOrder(5), 0);
  assert.equal(nextToPlay({}), 1);
  assert.equal(nextToPlay({ 1: 3, 2: 2 }), 6);
  assert.equal(nextToPlay(Object.fromEntries(ORDER.map(id => [id, 1]))), 1);
  // Tile counts: a level starts at 2–4, level 1 at 2 so the first win is a coin-flip away, the two-letter level never shows p or q.
  assert.equal(levelOf(1).base, 2);
  for (const id of ORDER) { assert.ok(levelOf(id).base >= MIN_CHOICES && levelOf(id).base <= MAX_CHOICES); assert.ok(levelOf(id).length === 6 || levelOf(id).length === 8); }
  assert.equal(maxTiles(levelOf(9)), 2);
});

test("rounds: the right length, letters from the level's own set, none twice (except b d p q), same seed same round", () => {
  for (const id of ORDER) {
    const level = levelOf(id);
    for (let seed = 1; seed < 80; seed++) {
      const items = makeItems(id, seed);
      assert.equal(items.length, level.length);
      for (const item of items) { assert.ok(level.letters.includes(item.letter), `${id} ${item.letter}`); assert.ok(level.kinds.includes(item.kind)); }
      if (isMirrorLevel(id)) {
        assert.deepEqual(items.filter(item => item.kind === "mirror").map(item => item.letter).sort(), [...level.letters].sort(), "each letter asked once as 'which starts it'");
        assert.equal(items.filter(item => item.kind === "same").length, level.length - level.letters.length);
      } else assert.equal(new Set(items.map(item => item.letter)).size, level.length, `${id}: a letter repeats`);
      if (level.kinds.length > 1) for (const kind of level.kinds) assert.ok(items.some(item => item.kind === kind), `${id}: finale mixes ${kind}`);
    }
  }
  assert.deepEqual(makeItems(2, 7), makeItems(2, 7));
  assert.notDeepEqual(makeItems(2, 7), makeItems(2, 8));
});

test("choices: the answer once, no repeats, the real mix-ups, never the same sound twice", () => {
  const twins: Record<string, string[]> = { C: ["K", "Q", "S"], K: ["C", "Q"], Q: ["C", "K"], S: ["C"] };
  for (const id of ORDER) for (let seed = 1; seed < 40; seed++) for (const item of makeItems(id, seed)) for (const count of [2, 3, 4]) {
    const choices = choicesFor(item, count, seed, levelOf(id).letters);
    assert.equal(choices.length, count, `${id} ${item.kind} ${item.letter} ${count}`);
    assert.equal(new Set(choices).size, count);
    assert.equal(choices.filter(value => value === answerOf(item)).length, 1);
    if (item.kind === "picture") for (const value of choices) { assert.ok(levelOf(id).letters.includes(value)); if (value !== item.letter) assert.ok(!(twins[item.letter] ?? []).includes(value), `${item.letter} vs ${value}`); }
    if (item.kind === "first") for (const value of choices) assert.ok(!(twins[item.letter] ?? []).includes(value), `${item.letter} vs ${value}`);
    if (item.kind === "capital") for (const value of choices) assert.match(value, /^[A-Z]$/);
    if (item.kind === "small") for (const value of choices) assert.match(value, /^[a-z]$/);
  }
  assert.deepEqual(choicesFor({ kind: "small", letter: "B" }, 3, 1).sort(), ["b", "d", "p"], "b against its mirror twins first");
  assert.deepEqual(choicesFor({ kind: "capital", letter: "B" }, 3, 1).sort(), ["B", "D", "P"]);
  for (let seed = 1; seed < 60; seed++) {
    assert.ok(!choicesFor({ kind: "small", letter: "I" }, 4, seed).includes("l"), "small l is never offered for capital I");
    assert.ok(!choicesFor({ kind: "capital", letter: "L" }, 4, seed).includes("I"), "capital I is never offered for small l");
  }
  assert.deepEqual(choicesFor({ kind: "mirror", letter: "D" }, 4, 3).sort(), ["b", "d", "p", "q"]);
  assert.deepEqual(choicesFor({ kind: "same", letter: "P" }, 2, 3).sort(), ["p", "q"], "eased: just the mirror twin");
});

test("a wrong tap shows a picture-led why, and the parent line says what was tapped", () => {
  assert.deepEqual(whyOf({ kind: "picture", letter: "M" }, "B"), { chip: "letter", value: "B" });
  assert.deepEqual(whyOf({ kind: "picture", letter: "M" }, "X"), { chip: "letter", value: "x" });
  assert.deepEqual(whyOf({ kind: "small", letter: "G" }, "q"), { chip: "letter", value: "Q" });
  assert.deepEqual(whyOf({ kind: "capital", letter: "G" }, "O"), { chip: "letter", value: "o" });
  assert.deepEqual(whyOf({ kind: "first", letter: "M" }, "N"), { chip: "picture", value: "N" });
  assert.deepEqual(whyOf({ kind: "mirror", letter: "B" }, "d"), { chip: "order", value: "d" });
  assert.equal(askOf({ kind: "picture", letter: "M" }), "কোন ছবির নাম M দিয়ে শুরু?");
  assert.equal(askOf({ kind: "picture", letter: "X" }), "কোন ছবির নামে x আছে?");
  assert.equal(slipLine({ kind: "picture", letter: "M" }, "P"), "ওটা Papaya (পেঁপে), শুরু P দিয়ে।");
  assert.equal(slipLine({ kind: "picture", letter: "Y" }, "X"), "ওটা Box (বাক্স), এর শেষে x।");
  assert.equal(slipLine({ kind: "small", letter: "B" }, "d"), "ওটা ছোট হাতের d, বড় হাতের D-এর জোড়া।");
  assert.equal(slipLine({ kind: "capital", letter: "B" }, "D"), "ওটা বড় হাতের D, ছোট হাতের d-এর জোড়া।");
  assert.equal(slipLine({ kind: "first", letter: "M" }, "N"), "N দিয়ে শুরু Nest (পাখির বাসা)।");
  assert.match(slipLine({ kind: "mirror", letter: "B" }, "d"), /^d: আগে পেট.*b: আগে লাঠি/);
  for (const id of ORDER) for (const item of makeItems(id, 3)) {
    nfc(askOf(item));
    for (const value of choicesFor(item, 4, 3, levelOf(id).letters)) if (value !== answerOf(item)) { nfc(slipLine(item, value)); assert.ok(whyOf(item, value).value); }
  }
});

test("difficulty steps: three misses ease, five first-try rights step up, within one tile, never announced", () => {
  const level = levelOf(2);
  let pace: Pace = START_PACE;
  assert.equal(choiceCount(level, pace), 3);
  for (let i = 0; i < 3; i++) pace = nextPace(pace, false);
  assert.equal(pace.offset, -1); assert.equal(choiceCount(level, pace), 2);
  for (let i = 0; i < 9; i++) pace = nextPace(pace, false);
  assert.equal(pace.offset, -1, "never more than one tile fewer");
  for (let i = 0; i < 5; i++) pace = nextPace(pace, true);
  assert.equal(pace.offset, 0);
  for (let i = 0; i < 20; i++) pace = nextPace(pace, true);
  assert.equal(pace.offset, 1); assert.equal(choiceCount(level, pace), 4);
  assert.equal(choiceCount(levelOf(1), START_PACE), 2);
  assert.equal(choiceCount(levelOf(9), { offset: 1, right: 0, missed: 0 }), 2, "b/d never grows past two tiles");
  assert.equal(choiceCount(levelOf(5), { offset: -1, right: 0, missed: 0 }), 3);
});

test("a round: a wrong tile stays dim, the right tile glows after two misses, no item takes more than three taps, stars count first tries", () => {
  let round = createRound(5, 11);
  assert.equal(round.choices.length, 4);
  const right = answerOf(currentItem(round));
  const wrong = round.choices.filter(value => value !== right);
  round = answer(round, wrong[0]);
  assert.equal(round.tries, 1); assert.deepEqual(round.wrong, [wrong[0]]);
  assert.equal(answer(round, wrong[0]), round, "the same wrong tile again does nothing");
  assert.ok(!hintOn(round));
  round = answer(round, wrong[1]);
  assert.ok(hintOn(round), "the answer glows after two");
  round = answer(round, right);
  assert.ok(round.solved); assert.equal(round.firstTry, 0); assert.equal(round.misses, 2);
  assert.equal(answer(round, wrong[2]), round, "taps after solving are ignored");
  assert.equal(nextItem(createRound(1, 1)).index, 0, "can't move on before solving");
  assert.deepEqual([[0, 6], [1, 6], [5, 6], [3, 6], [2, 6], [7, 8], [8, 8], [4, 8]].map(([first, length]) => starsOf(first, length)), [1, 1, 3, 2, 1, 3, 3, 2]);
  assert.equal(doneLine(1), "আজ ৬টা অক্ষরের ছবি মেলালাম");
  assert.equal(doneLine(3), "আজ ৬ জোড়া বড়-ছোট অক্ষর মেলালাম");
  assert.equal(doneLine(7), "আজ ৮ জোড়া বড়-ছোট অক্ষর মেলালাম");
  assert.equal(methodLine(2, 1), "২বার আবার দেখেছ, তারপর মিলিয়েছ।");
  assert.equal(taskOf(1).length > 10, true);
});

test("fairness: a random-tapping bot finishes every level on every seed, within three taps an item, and rarely earns three stars", () => {
  for (const id of ORDER) {
    let three = 0;
    for (let seed = 1; seed <= SEEDS; seed++) {
      const play = playRound(id, seed, GUESSER);
      assert.ok(isDone(play.round));
      assert.ok(play.taps <= levelOf(id).length * 3, `${id}: ${play.taps} taps`);
      if (resultOf(play.round).stars === 3) three++;
    }
    assert.ok(three / SEEDS <= 0.15, `${id}: guessers get three stars on ${(three / SEEDS * 100).toFixed(0)}% of seeds`);
  }
});

test("target rates: a five-year-old (knows it 70%) and a learner (90%) over 1,500 seeds a level (measured: guessers 0–12% three stars, five-year-olds 44–78%, learners 89–97%)", () => {
  const rate = (id: number, child: typeof FIVE) => { let three = 0, firstTry = 0, slow = 0; for (let seed = 1; seed <= SEEDS; seed++) { const play = playRound(id, seed, child); if (resultOf(play.round).stars === 3) three++; firstTry += play.firstRightAt <= 10 ? 1 : 0; slow = Math.max(slow, play.seconds); } return { three: three / SEEDS, first: firstTry / SEEDS, slow }; };
  for (const id of ORDER) {
    const five = rate(id, FIVE), learner = rate(id, LEARNER);
    assert.ok(five.first >= 0.99, `${id}: the first right answer comes within 10 s`);
    assert.ok(learner.three >= 0.85, `${id}: learner three-star rate ${learner.three}`);
    assert.ok(five.three >= (id === 1 || id === 9 ? 0.7 : 0.4) && five.three <= 0.85, `${id}: five-year-old three-star rate ${five.three}`);
    assert.ok(five.slow <= 120, `${id}: a round takes under two minutes (${five.slow}s)`);
  }
});
