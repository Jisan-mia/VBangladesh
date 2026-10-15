import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { makeRng } from "../../../shared/game-core";
import { FOOTER } from "../lib/draw-card";
import { COUNT_IN, LEVELS, LEVEL_COUNT, OG_DEMO, PASSES, beatPlan, cardTitle, choicesFor, isOgHash, levelOf, nearBeat, rhymeForLevel, starsOf, wordBeats, windowFor } from "../lib/game";
import { PICTURES, pictureOf, svgDocument } from "../lib/pictures";
import { RHYMES, bare, isBlank, rhymeOf, wordsOf } from "../lib/rhymes";
import { site } from "../content";
import { share } from "../share";

const bn = (n: number) => new Intl.NumberFormat("bn-BD", { useGrouping: false }).format(n);
const nfc = (text: string) => assert.equal(text, text.normalize("NFC"), text);

test("rhymes: only folk rhymes from the safe list, each with its recorded source", () => {
  // b-bangladesh.md §4.1, and who first wrote each down. Folk, so no author and no copyright.
  const sources: Record<string, RegExp> = {
    hattima: /যোগীন্দ্রনাথ সরকার ১৮৯৯/,
    ata: /রবীন্দ্রনাথ ঠাকুর ১৮৯৪/,
    chand: /রবীন্দ্রনাথ ঠাকুর ১৮৯৪/,
    agdum: /রবীন্দ্রনাথ ঠাকুর ১৮৯৪/,
  };
  assert.deepEqual(RHYMES.map(r => r.id), Object.keys(sources));
  const opening = ["হাট্টিমা টিম টিম", "আতা গাছে তোতা পাখি", "আয় আয় চাঁদ মামা", "আগডুম বাগডুম ঘোড়াডুম সাজে"];
  RHYMES.forEach((rhyme, index) => {
    assert.match(rhyme.source, /^লোকছড়া; /, rhyme.id);
    assert.match(rhyme.source, sources[rhyme.id], rhyme.id);
    assert.ok(rhyme.lines[0].startsWith(opening[index]), rhyme.id);
  });
  const all = JSON.stringify(RHYMES);
  // Opening lines only: no বর্গী, no dowry or wedding verses, no other author's poem.
  assert.doesNotMatch(all, /বর্গী|খাজনা|কন্যা|বিয়ে|যৌতুক|লাঠি|নজরুল|জসীম|জসিম/);
});

test("rhymes: complete, NFC, and every blank holds the answer's word and rhymes with its partner", () => {
  assert.equal(new Set(RHYMES.map(r => r.name)).size, RHYMES.length);
  for (const rhyme of RHYMES) {
    assert.equal(rhyme.lines.length, 4, rhyme.id);
    for (const text of [rhyme.name, rhyme.source, ...rhyme.lines]) { nfc(text); assert.doesNotMatch(text, /\s{2}/); }
    const answer = pictureOf(rhyme.answer);
    assert.ok(answer, rhyme.id);
    assert.ok(rhyme.blanks.length >= 1);
    for (const spot of rhyme.blanks) assert.equal(bare(wordsOf(rhyme.lines[spot.line])[spot.word] ?? ""), answer.bn, `${rhyme.id} ${spot.line}:${spot.word}`);
    // The partner stays visible (it isn't a blank), and sounds like the answer.
    assert.ok(rhyme.lines.some((line, index) => wordsOf(line).some((word, at) => bare(word) === bare(rhyme.partner) && !isBlank(rhyme, index, at))), rhyme.id);
    assert.equal(answer.tail, rhyme.tail, rhyme.id);
    for (const id of rhyme.others) {
      const other = pictureOf(id);
      assert.ok(other, id);
      assert.notEqual(other.tail, rhyme.tail, `${id} must not rhyme in ${rhyme.id}`);
      assert.notEqual(id, rhyme.answer);
    }
    assert.equal(new Set(rhyme.others).size, rhyme.others.length);
    assert.ok(isBlank(rhyme, rhyme.blanks[0].line, rhyme.blanks[0].word));
  }
  assert.equal(rhymeOf("nope"), undefined);
});

test("words split whole, never into letters, and keep their punctuation", () => {
  assert.deepEqual(wordsOf("তারা মাঠে পাড়ে ডিম,"), ["তারা", "মাঠে", "পাড়ে", "ডিম,"]);
  assert.equal(bare("বউ?"), "বউ");
  assert.equal(bare("দেব।"), "দেব");
  assert.equal(bare("হাট্টিমা"), "হাট্টিমা");
});

test("pictures: each has its own drawing and Bangla name, no duplicates, nothing linked", () => {
  assert.equal(new Set(PICTURES.map(p => p.id)).size, PICTURES.length);
  assert.equal(new Set(PICTURES.map(p => p.bn)).size, PICTURES.length);
  assert.equal(new Set(PICTURES.map(p => p.art)).size, PICTURES.length);
  for (const picture of PICTURES) {
    nfc(picture.bn);
    assert.match(picture.art, /<(path|ellipse|circle|rect)/, picture.id);
    assert.doesNotMatch(picture.art, /href|url\(|<script|<image|<text|<use/i, picture.id);
  }
  // Every picture is used by some rhyme.
  for (const picture of PICTURES) assert.ok(RHYMES.some(r => r.answer === picture.id || r.others.includes(picture.id)), picture.id);
  assert.match(svgDocument(PICTURES[0].art), /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 100 100"/);
});

test("levels: one ছড়া each, 2 then 3 pictures, a slightly quicker beat and narrower window each time", () => {
  assert.equal(LEVEL_COUNT, 4);
  assert.deepEqual(LEVELS.map(l => l.rhyme), RHYMES.map(r => r.id));
  assert.deepEqual(LEVELS.map(l => l.choices), [2, 2, 3, 3]);
  for (let i = 1; i < LEVEL_COUNT; i++) {
    assert.ok(LEVELS[i].beatMs < LEVELS[i - 1].beatMs);
    assert.ok(LEVELS[i].windowMs <= LEVELS[i - 1].windowMs);
  }
  // Slow and steady: never more than about 80 beats a minute, so the drum never pulses near 3 times a second.
  for (const level of LEVELS) assert.ok(level.beatMs >= 750);
  for (const rhyme of RHYMES) assert.ok(rhyme.others.length >= 2);
  assert.equal(levelOf(0).level, 1);
  assert.equal(levelOf(99).level, 4);
  assert.equal(levelOf(Number.NaN).level, 1);
  assert.equal(rhymeForLevel(3).id, "chand");
});

test("the beat plan: a count-in, one beat per word, a rest after each line, twice through", () => {
  const rhyme = rhymeOf("hattima")!;
  const plan = beatPlan(rhyme);
  const words = rhyme.lines.reduce((sum, line) => sum + wordsOf(line).length, 0);
  assert.equal(plan.length, COUNT_IN + PASSES * (words + rhyme.lines.length));
  assert.equal(wordBeats(plan), PASSES * words);
  assert.deepEqual(plan[0], { pass: 0, line: -1, word: -1 });
  assert.deepEqual(plan[COUNT_IN], { pass: 0, line: 0, word: 0 });
  assert.deepEqual(plan[COUNT_IN + 3], { pass: 0, line: 0, word: -1 });
  assert.equal(plan.at(-1)!.pass, PASSES - 1);
  assert.equal(OG_DEMO.words, wordBeats(plan));
  // Every round lasts about a minute or less at its level's speed.
  for (const level of LEVELS) {
    const seconds = beatPlan(rhymeOf(level.rhyme)!).length * level.beatMs / 1000;
    assert.ok(seconds > 20 && seconds < 75, `${level.rhyme} ${seconds}s`);
  }
});

test("a tap counts when it lands near a beat, either side", () => {
  assert.deepEqual(nearBeat(0, 900, 240), { beat: 0, near: true });
  assert.deepEqual(nearBeat(1800 + 200, 900, 240), { beat: 2, near: true });
  assert.deepEqual(nearBeat(2700 - 240, 900, 240), { beat: 3, near: true });
  assert.deepEqual(nearBeat(2700 - 241, 900, 240), { beat: 3, near: false });
  assert.equal(nearBeat(450, 900, 240).near, false);
});

test("difficulty: three off-beat taps in a row widen the window, five on the beat narrow it", () => {
  assert.equal(windowFor(240, 0, 0), 240);
  assert.equal(windowFor(240, 2, 0), 240);
  assert.equal(windowFor(240, 3, 0), 360);
  assert.equal(windowFor(240, 0, 4), 240);
  assert.equal(windowFor(240, 0, 5), 204);
});

test("choices: the answer once, no repeats, and nothing else that rhymes", () => {
  for (const seed of [1, 7, 99]) for (const rhyme of RHYMES) for (const count of [2, 3]) {
    const choices = choicesFor(rhyme, count, makeRng(seed));
    assert.equal(choices.length, count);
    assert.equal(choices.filter(c => c.id === rhyme.answer).length, 1);
    assert.equal(new Set(choices.map(c => c.id)).size, count);
    for (const other of choices.filter(c => c.id !== rhyme.answer)) assert.notEqual(other.tail, rhyme.tail);
  }
});

test("stars are a record: 3 for half the words on the beat and the rhyme first time, 2 for either half of that, 1 for finishing", () => {
  assert.equal(starsOf(15, 30, true), 3);
  assert.equal(starsOf(30, 30, false), 2);
  assert.equal(starsOf(8, 30, false), 2);
  assert.equal(starsOf(0, 30, true), 2);
  assert.equal(starsOf(7, 30, false), 1);
  assert.equal(starsOf(0, 0, false), 1);
});

test("the card says what was done, with no name; the #og demo is fixed and real", () => {
  assert.equal(cardTitle(4, bn), "আজ ৪ লাইনের ছড়া তালে তালে বললাম");
  nfc(FOOTER);
  assert.ok(isOgHash("#og"));
  assert.ok(!isOgHash("#og=1") && !isOgHash(""));
  assert.ok(OG_DEMO.stars === starsOf(OG_DEMO.hits, OG_DEMO.words, true));
  assert.ok(LEVELS[OG_DEMO.level - 1]);
});

test("no sharing of results: normalize always returns null, and there is no tally", () => {
  for (const state of ["", "l=3", "s=1&t=3", "x".repeat(500)]) assert.equal(share.normalize(state), null);
  assert.equal(share.tally, undefined);
});

test("the tool never touches the network", () => {
  const files: string[] = [];
  const walk = (dir: string) => { for (const name of readdirSync(dir)) { const path = join(dir, name); if (statSync(path).isDirectory()) { if (name !== "tests") walk(path); } else if (/\.tsx?$/.test(name)) files.push(path); } };
  walk(join(import.meta.dirname, ".."));
  assert.ok(files.length >= 9);
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, /\bfetch\s*\(/, `${file} calls fetch`);
    assert.doesNotMatch(source, /share-client|ShareBar|XMLHttpRequest|sendBeacon|WebSocket|\/api\//, file);
  }
});

test("content: SEO limits and the FAQ parents search for", () => {
  assert.ok(site.title.length <= 45, `title ${site.title.length}`);
  assert.ok(site.title.startsWith("ছোটদের ছড়া"));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, `description ${site.description.length}`);
  assert.ok(site.faq.length >= 6);
  assert.equal(site.faq[0].question, "ছড়া কাকে বলে?");
  assert.match(site.faq[0].answer, /^ছড়া হলো ছোট, তালে তালে বলা মিলওয়ালা কবিতা/);
  for (const ask of ["কোন বয়সের জন্য?", "ইন্টারনেট লাগে?", "কোনো তথ্য নেওয়া হয়?", "কতক্ষণ খেলবে?", "শব্দ বন্ধ রাখলেও খেলা যায়?"]) assert.ok(site.faq.some(item => item.question === ask), ask);
  for (const text of [site.title, site.description, site.headline!, site.lead, ...site.steps, ...site.privacy, ...site.faq.flatMap(item => [item.question, item.answer])]) {
    nfc(text);
    assert.doesNotMatch(text, /আপনি|করুন/);
  }
  assert.equal(site.privacy.length, 1);
});
