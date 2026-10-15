import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { site } from "../content";
import { share } from "../share";
import { hasWordPicture } from "../lib/art";
import { cardLine } from "../lib/words";
import {
  ALL_WORDS, DECOYS, HASANTA, LEVELS, LEVEL_COUNT, ROUND_SIZE, SETS, conjunct, current, done, equation, graphemes, hint, levelOf, methodLine,
  newRound, next, place, printItems, shapeNote, splitWord, starsOf, tiles, tilesFor, unplace, whyLine, type Round,
} from "../lib/words";

const root = join(import.meta.dirname, "..");
const files = (dir: string): string[] => readdirSync(dir).flatMap(name => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? (name === "tests" ? [] : files(path)) : [path];
});
const CONSONANTS = new Set([..."কখগঘঙচছজঝঞটঠডঢণতথদধনপফবভমযরলশষসহ"]);

/** Plays the current word right, letter by letter. */
const solve = (round: Round) => current(round).parts.reduce((state, part) => place(state, part).round, round);

test("every word: NFC, a picture, exactly one যুক্তবর্ণ built from real consonants with হসন্ত, no duplicates", () => {
  assert.equal(ALL_WORDS.length, 34);
  assert.equal(new Set(ALL_WORDS.map(item => item.word)).size, ALL_WORDS.length, "no duplicate words");
  for (const item of ALL_WORDS) {
    const joint = conjunct(item.parts);
    assert.equal(item.word, item.word.normalize("NFC"), item.word);
    assert.ok(hasWordPicture(item.pic), `${item.word} has a picture (${item.pic})`);
    assert.ok(item.parts.length === 2 || item.parts.length === 3, item.word);
    for (const part of item.parts) assert.ok(CONSONANTS.has(part), `${item.word}: ${part} is a base consonant`);
    assert.equal(joint, item.parts.join(HASANTA));
    assert.equal(item.word.split(joint).length, 2, `${item.word} holds ${joint} once`);
    assert.equal([...item.word].filter(ch => ch === HASANTA).length, item.parts.length - 1, `${item.word} has no other যুক্তবর্ণ`);
    assert.equal(item.decoys.length, 3, item.word);
    assert.equal(new Set(item.decoys).size, 3, item.word);
    for (const decoy of item.decoys) {
      assert.ok(!item.parts.includes(decoy), `${item.word}: decoy ${decoy} is not a part`);
      assert.equal(decoy, decoy.normalize("NFC"));
      assert.equal([...decoy].length, 1, `${item.word}: decoy ${decoy} is one character`);
    }
  }
});

test("known spellings and parts (Bangla Academy)", () => {
  const parts = Object.fromEntries(ALL_WORDS.map(item => [item.word, equation(item.parts)]));
  assert.equal(parts["পক্ষী"], "ক্ষ = ক + ষ");
  assert.equal(parts["বিজ্ঞান"], "জ্ঞ = জ + ঞ");
  assert.equal(parts["ঘণ্টা"], "ণ্ট = ণ + ট");
  assert.equal(parts["ঠান্ডা"], "ন্ড = ন + ড");
  assert.equal(parts["চন্দ্র"], "ন্দ্র = ন + দ + র");
  assert.equal(parts["সূর্য"], "র্য = র + য");
  assert.equal(parts["ব্যাঙ"], "ব্য = ব + য");
  assert.equal(parts["ট্রেন"], "ট্র = ট + র");
  assert.ok(!ALL_WORDS.some(item => item.word.includes("য়") && item.parts.includes("য")), "য-ফলা uses য, never য়");
});

test("graphemes keep a যুক্তবর্ণ whole, with its কার", () => {
  assert.deepEqual(graphemes("পক্ষী"), ["প", "ক্ষী"]);
  assert.deepEqual(graphemes("চন্দ্র"), ["চ", "ন্দ্র"]);
  assert.deepEqual(graphemes("মার্বেল"), ["মা", "র্বে", "ল"]);
  assert.deepEqual(graphemes("ব্যাঙ"), ["ব্যা", "ঙ"]);
  for (const item of ALL_WORDS) {
    const { before, cluster, after } = splitWord(item);
    assert.equal(before + cluster + after, item.word);
    assert.ok(cluster.includes(conjunct(item.parts)), `${item.word}: ${cluster}`);
    assert.ok(!cluster.endsWith(HASANTA));
  }
});

test("levels: four sets, ভাঙি before জুড়ি, easy doubles first, each set has enough words for a round", () => {
  assert.equal(LEVEL_COUNT, 8);
  assert.deepEqual(LEVELS.map(level => level.mode), ["bhangi", "juri", "bhangi", "juri", "bhangi", "juri", "bhangi", "juri"]);
  assert.deepEqual(LEVELS.map(level => level.set), ["double", "double", "common", "common", "tricky", "tricky", "phala", "phala"]);
  assert.equal(new Set(LEVELS.map(level => level.title)).size, LEVEL_COUNT);
  for (const item of SETS.double.words) assert.equal(item.parts[0], item.parts[1], `${item.word} is a double`);
  for (const set of Object.values(SETS)) assert.ok(set.words.length >= ROUND_SIZE);
  assert.ok(SETS.phala.words.every(item => item.parts.includes("র") || item.parts.includes("য")));
  assert.equal(levelOf(0), LEVELS[0]);
  assert.equal(levelOf(99), LEVELS[LEVEL_COUNT - 1]);
});

test("a round: six different words from its set, same seed same order", () => {
  const round = newRound(5, 42);
  assert.equal(round.items.length, ROUND_SIZE);
  assert.equal(new Set(round.items.map(item => item.word)).size, ROUND_SIZE);
  assert.ok(round.items.every(item => SETS.tricky.words.includes(item)));
  assert.deepEqual(newRound(5, 42).items, round.items);
});

test("tiles hold the parts once (ক + ক is one tile, used twice) plus the decoys for the pace", () => {
  const double = SETS.double.words[0], triple = SETS.phala.words.find(item => item.parts.length === 3)!;
  assert.equal(tilesFor(double, "normal", 1).length, 1 + DECOYS.normal);
  assert.equal(tilesFor(triple, "easy", 1).length, 3 + DECOYS.easy);
  const set = tilesFor(SETS.tricky.words[0], "hard", 9);
  assert.equal(set.length, 5);
  for (const part of SETS.tricky.words[0].parts) assert.ok(set.includes(part));
  assert.deepEqual(tilesFor(double, "normal", 3), tilesFor(double, "normal", 3), "stable for a word");
});

test("placing: fill, then right; a double takes the same tile twice", () => {
  let round = newRound(1, 7);
  const item = current(round);
  let step = place(round, item.parts[0]);
  assert.equal(step.outcome, "fill");
  step = place(step.round, item.parts[1]);
  assert.equal(step.outcome, "right");
  round = step.round;
  assert.ok(round.solved);
  assert.equal(place(round, "ক").outcome, "ignore", "no taps after a word is done");
  round = next(round);
  assert.equal(round.index, 1);
  assert.deepEqual(round.filled, []);
});

test("wrong order and wrong letters: the slots empty, a one-line reason, then the right tiles glow", () => {
  const round = newRound(3, 11);
  const item = current(round);
  const flipped = place(place(round, item.parts[1]).round, item.parts[0]);
  assert.equal(flipped.outcome, "order");
  assert.deepEqual(flipped.round.filled, []);
  assert.match(whyLine(flipped.round), /আগে-পরে উল্টো/);
  assert.equal(hint(flipped.round), 1);
  const stray = place(place(flipped.round, item.parts[0]).round, item.decoys[0]);
  assert.equal(stray.outcome, "wrong");
  assert.equal(whyLine(stray.round), `${item.parts[0]} ঠিক জায়গায়। ${item.decoys[0]} এই যুক্তবর্ণে নেই।`);
  assert.equal(hint(stray.round), 2);
  assert.equal(stray.round.misses, 2);
  assert.doesNotMatch(whyLine(stray.round), /ভুল/);
});

test("undo takes the last letter back", () => {
  const round = newRound(2, 5), item = current(round);
  const one = place(round, item.parts[0]).round;
  assert.deepEqual(unplace(one).filled, []);
  assert.deepEqual(unplace(round), round);
});

test("difficulty: three misses in a row quietly ease the next tiles; five right in a row step them up", () => {
  let round = newRound(3, 1);
  for (let i = 0; i < 3; i++) round = place(place(round, "অ").round, "অ").round;
  assert.equal(round.pace, "easy");
  assert.equal(tiles(round).length, new Set(current(round).parts).size + DECOYS.easy);
  round = solve(round);
  assert.equal(round.pace, "easy", "one right is not enough");
  round = solve(next(round));
  assert.equal(round.pace, "normal", "two right in a row lift it back");
  round = newRound(4, 2);
  for (let i = 0; i < 5; i++) { round = solve(round); if (i < 4) round = next(round); }
  assert.equal(round.pace, "hard");
  round = place(place(next(round), "অ").round, "অ").round;
  assert.equal(round.pace, "normal", "a miss steps it back down");
});

test("a whole round ends after six words", () => {
  let round = newRound(8, 99);
  for (let i = 0; i < ROUND_SIZE; i++) round = next(solve(round));
  assert.ok(done(round));
  assert.equal(round.misses, 0);
});

test("stars record clean work, and praise names the method only when earned", () => {
  assert.equal(starsOf(0), 3);
  assert.equal(starsOf(1), 3);
  assert.equal(starsOf(2), 2);
  assert.equal(starsOf(4), 2);
  assert.equal(starsOf(5), 1);
  assert.match(methodLine({ ...newRound(1, 1), misses: 0 }), /ধীরে বলে বলে/);
  assert.match(methodLine({ ...newRound(1, 1), misses: 3 }), /^৩বার/);
});

test("রেফ and ফলা notes for parents and children", () => {
  assert.match(shapeNote(["র", "য"]), /রেফ/);
  assert.match(shapeNote(["ট", "র"]), /র-ফলা/);
  assert.match(shapeNote(["ন", "দ", "র"]), /র-ফলা/);
  assert.match(shapeNote(["ব", "য"]), /য-ফলা/);
  assert.equal(shapeNote(["ক", "ষ"]), "");
});

test("card line carries no name", () => {
  assert.equal(cardLine(6, ["bhangi"]), "আজ ৬টা যুক্তবর্ণ ভাঙলাম");
  assert.equal(cardLine(12, ["bhangi", "juri"]), "আজ ১২টা যুক্তবর্ণ ভাঙলাম আর জুড়লাম");
  assert.equal(cardLine(6, ["juri"]), "আজ ৬টা যুক্তবর্ণ জুড়লাম");
});

test("the print sheet has ten real words, easy to hard, with a রেফ and a ফলা", () => {
  const items = printItems();
  assert.equal(items.length, 10);
  assert.ok(items.every(Boolean));
  assert.equal(new Set(items).size, 10);
  assert.ok(items.some(item => item.parts[0] === "র"));
  assert.ok(items.some(item => item.parts.at(-1) === "র"));
});

test("share never makes a link and has no tally", () => {
  assert.equal(share.normalize("level=1"), null);
  assert.equal(share.normalize(""), null);
  assert.equal(share.tally, undefined);
  assert.ok(share.preview("x").title.length > 0);
});

test("no network: the tool's source never calls fetch or imports share-client; no per-letter spans", () => {
  const sources = [...files(root), join(root, "../../app/juktoborno/page.tsx")];
  assert.ok(sources.length >= 10);
  for (const file of sources) {
    const text = readFileSync(file, "utf8");
    assert.doesNotMatch(text, /\bfetch\s*\(/, file);
    assert.doesNotMatch(text, /share-client|ShareBar|sendBeacon|XMLHttpRequest|\/api\//, file);
    assert.doesNotMatch(text, /letter-spacing:\s*[^0]/, file);
    assert.doesNotMatch(text, /\.split\(""\)/, `${file}: split words with Intl.Segmenter`);
    assert.equal(text, text.normalize("NFC"), `${file} is NFC`);
  }
});

test("content meets the SEO limits and the kids' rules", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.ok(site.title.startsWith("যুক্তবর্ণ ভেঙে শব্দ গঠন"));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.faq.length >= 6);
  assert.match(site.faq[0].answer, /^মাঝে কোনো স্বর ছাড়া দুই বা তিনটা ব্যঞ্জনবর্ণ জুড়ে গেলে তাকে যুক্তবর্ণ বলে/);
  const questions = site.faq.map(item => item.question).join(" ");
  for (const must of ["কোন বয়সের", "ইন্টারনেট", "তথ্য", "কতক্ষণ"]) assert.ok(questions.includes(must), must);
  assert.equal(site.privacy.length, 1);
  assert.ok(site.headline && site.headline !== site.title);
  for (const text of [site.title, site.description, site.lead, site.guideIntro, ...site.steps, ...site.privacy, ...site.faq.flatMap(item => [item.question, item.answer])]) {
    assert.equal(text, text.normalize("NFC"));
    assert.doesNotMatch(text, /আপনি|আপনার|করুন/, "তুমি voice");
  }
});
