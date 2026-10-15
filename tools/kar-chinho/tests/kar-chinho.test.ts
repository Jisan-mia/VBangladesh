import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { site } from "../content";
import { share } from "../share";
import { hasWordPicture } from "../lib/art";
import {
  KARS, LEVELS, LEVEL_COUNT, MAX_CHOICES, MIN_CHOICES, PARTNERS, SIDE, START_PACE, answer, choiceCount, choicesFor, dotted, isDone, newRound,
  nextPace, nextWord, printLevel, spellWith, splitWord, starsOf, type Pace,
} from "../lib/words";

const items = LEVELS.flatMap(level => level.items);

test("every word has a picture, an NFC spelling and exactly the sign it claims", () => {
  for (const item of items) {
    assert.ok(hasWordPicture(item.pic), `${item.word}: no picture "${item.pic}"`);
    assert.equal(item.word, item.word.normalize("NFC"), `${item.word}: not NFC`);
    assert.ok(KARS.includes(item.kar), `${item.word}: not a কার`);
    const parts = splitWord(item);
    assert.equal(spellWith(item, item.kar), item.word, `${item.word}: slot doesn't rebuild the word`);
    assert.ok(parts.base.length >= 1, `${item.word}: empty base`);
    // A ঁ ং ঃ right after the slot would float on nothing while the sign is missing.
    assert.ok(!/^[ঁ-ঃ]/.test(parts.after), `${item.word}: a mark sits on the slot`);
  }
});

test("each picture always means the same word", () => {
  const byPic = new Map<string, string>();
  for (const item of items) {
    assert.equal(byPic.get(item.pic) ?? item.word, item.word, `${item.pic} used for two words`);
    byPic.set(item.pic, item.word);
  }
});

test("levels: one sign each from আ-কার to ঔ-কার, then all ten; ten different words per level", () => {
  assert.equal(LEVEL_COUNT, 11);
  assert.deepEqual(LEVELS.slice(0, 10).map(level => level.kar), [...KARS]);
  for (const level of LEVELS) {
    assert.equal(level.items.length, 10, level.title);
    assert.equal(new Set(level.items.map(item => item.word)).size, 10, `${level.title}: a word repeats`);
    if (level.kar) assert.ok(level.items.filter(item => item.kar === level.kar).length >= 3, `${level.title}: too few focus words`);
  }
  assert.deepEqual(new Set(LEVELS[10].items.map(item => item.kar)), new Set(KARS), "the mixed level uses every sign once");
});

test("the slot sits where the sign shows", () => {
  assert.deepEqual(splitWord(LEVELS[0].items[0]), { before: "", base: "ম", after: "ছ" });
  assert.equal(SIDE["ি"], "left"); assert.equal(SIDE["া"], "right"); assert.equal(SIDE["ু"], "below"); assert.equal(SIDE["ৌ"], "both");
  const bristi = items.find(item => item.word === "বৃষ্টি")!;
  assert.deepEqual(splitWord(bristi), { before: "", base: "ব", after: "ষ্টি" });
  const pepe = items.find(item => item.word === "পেঁপে")!;
  assert.deepEqual(splitWord(pepe), { before: "পেঁ", base: "প", after: "" });
  const ghuri = items.find(item => item.word === "ঘুড়ি" && item.kar === "ি")!;
  assert.deepEqual(splitWord(ghuri), { before: "ঘু", base: "ড়", after: "" }, "the nukta stays with its letter");
  assert.equal(dotted("া"), "◌া");
});

test("choices: the right sign plus close look-alikes, no repeats, no real variant spelling", () => {
  for (const item of items) for (let count = MIN_CHOICES; count <= MAX_CHOICES; count++) for (const seed of [1, 7, 99]) {
    const tiles = choicesFor(item, count, seed);
    assert.equal(tiles.length, count);
    assert.ok(tiles.includes(item.kar));
    assert.equal(new Set(tiles).size, count);
    for (const kar of tiles) assert.ok(!item.not?.includes(kar));
  }
  for (const kar of KARS) assert.ok(PARTNERS[kar].length >= MAX_CHOICES && !PARTNERS[kar].includes(kar));
  const mula = items.find(item => item.word === "মুলা")!;
  assert.ok(!choicesFor(mula, 4, 3).includes("ূ"), "মূলা is a variant spelling, never a wrong tile");
});

test("difficulty: three first-try misses ease the next word, five right step it up, within one tile", () => {
  let pace: Pace = START_PACE;
  for (let i = 0; i < 3; i++) pace = nextPace(pace, false);
  assert.equal(pace.offset, -1);
  for (let i = 0; i < 3; i++) pace = nextPace(pace, false);
  assert.equal(pace.offset, -1, "never more than one tile easier");
  for (let i = 0; i < 5; i++) pace = nextPace(pace, true);
  assert.equal(pace.offset, 0);
  for (let i = 0; i < 4; i++) pace = nextPace(pace, true);
  pace = nextPace(pace, false);
  for (let i = 0; i < 4; i++) pace = nextPace(pace, true);
  assert.equal(pace.offset, 0, "a miss resets the run of five");
  for (let i = 0; i < 10; i++) pace = nextPace(pace, true);
  assert.equal(pace.offset, 1);
  assert.equal(choiceCount(1, START_PACE), 2);
  assert.equal(choiceCount(1, { ...START_PACE, offset: -1 }), 2);
  assert.equal(choiceCount(3, START_PACE), 3);
  assert.equal(choiceCount(11, { ...START_PACE, offset: 1 }), 4);
});

test("stars: 8+ first-try → 3, 5+ → 2, else 1", () => {
  assert.deepEqual([10, 8, 7, 5, 4, 0].map(starsOf), [3, 3, 2, 2, 1, 1]);
});

test("a whole round: wrong taps cost a first try, never the round", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    let round = newRound(level, 42 + level);
    assert.equal(round.items.length, 10);
    let turns = 0;
    while (!isDone(round)) {
      const item = round.items[round.index];
      assert.ok(round.choices.includes(item.kar));
      if (round.index % 3 === 0) round = answer(round, round.choices.find(kar => kar !== item.kar)!);
      round = answer(round, item.kar);
      assert.ok(round.solved);
      assert.equal(answer(round, item.kar), round, "taps after solving are ignored");
      round = nextWord(round);
      assert.ok(++turns <= 10);
    }
    assert.equal(round.firstTry, 6);
    assert.equal(starsOf(round.firstTry), 2);
  }
});

test("print view: ?print=4 prints level 4, anything else the mixed sheet", () => {
  assert.equal(printLevel("4"), 4);
  for (const value of ["", "0", "12", "x", null]) assert.equal(printLevel(value), LEVEL_COUNT);
});

test("share: no link state and no tally", () => {
  assert.equal(share.normalize("level=1"), null);
  assert.equal(share.normalize(""), null);
  assert.equal(share.tally, undefined);
});

function files(dir: string): string[] {
  return readdirSync(dir).flatMap(name => { const path = join(dir, name); return statSync(path).isDirectory() ? (name === "tests" ? [] : files(path)) : [path]; });
}

test("the tool never calls the network or the share client", () => {
  const root = join(import.meta.dirname, "..");
  for (const path of [...files(root), join(root, "../../app/kar-chinho/page.tsx")]) {
    const source = readFileSync(path, "utf8");
    assert.ok(!/\bfetch\s*\(/.test(source), `${path} calls fetch`);
    assert.ok(!/share-client|\/api\//.test(source), `${path} reaches the share client or an API`);
  }
});

test("content: SEO limits, six or more FAQs, homework answer first", () => {
  assert.ok(site.title.length <= 45, `title ${site.title.length}`);
  assert.ok(site.title.startsWith("কার চিহ্ন"));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, `description ${site.description.length}`);
  assert.ok(site.faq.length >= 6);
  assert.equal(site.faq[0].question, "কার চিহ্ন কয়টি?");
  assert.ok(site.faq[0].answer.startsWith("কার-চিহ্ন ১০টা"));
  for (const ask of ["কোন বয়সের জন্য?", "ইন্টারনেট লাগে?", "কোনো তথ্য নেওয়া হয়?", "কতক্ষণ খেলবে?"]) assert.ok(site.faq.some(item => item.question === ask), ask);
  assert.equal(site.privacy.length, 1);
  for (const text of [site.title, site.description, site.headline!, ...site.steps, ...site.faq.flatMap(item => [item.question, item.answer])]) assert.equal(text, text.normalize("NFC"));
});
