import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { makeRng } from "../../../shared/game-core";
import { site } from "../content";
import { share } from "../share";
import {
  addToday, answer, OG_TODAY, answerOf, cardLines, COLOR_WORDS, endLine, flip, glows, LEVELS, LEVEL_COUNT, makeItem, newRound, nextItem, opposite, PAIRS, pass,
  paceSeconds, pairsInPlay, praiseLine, rightChoice, roundStars, RULES, runLength, SHAPE_WORDS, SORT_CARDS, specOf, TARGETS, WORDS, type Round,
} from "../lib/game";

const root = join(import.meta.dirname, "..");
const files = (dir: string): string[] => readdirSync(dir).flatMap(name => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? (name === "tests" ? [] : files(path)) : [path];
});
const nfc = (text: string) => assert.equal(text, text.normalize("NFC"), text);

/** Plays a whole round: `misses` wrong taps before the right one on every scored picture. */
function play(level: number, misses = 0, seed = 7) {
  let round = newRound(level, 0, seed);
  for (let guard = 0; guard < 50; guard++) {
    const wrong = 1 - answerOf(round);
    if (!round.demo) for (let miss = 0; miss < misses; miss++) round = answer(round, wrong).round;
    round = answer(round, answerOf(round)).round;
    const next = nextItem(round);
    if (!next) return round;
    round = next;
  }
  throw new Error("a round always ends");
}

test("the pictures: five pairs, ten pictures, each with a word, art, and one opposite", () => {
  const pics = PAIRS.flat();
  assert.equal(PAIRS.length, 5);
  assert.equal(new Set(pics).size, 10, "no picture in two pairs");
  assert.deepEqual(Object.keys(WORDS).sort(), [...pics].sort());
  assert.deepEqual(PAIRS.map(([a, b]) => `${WORDS[a]}-${WORDS[b]}`), ["সূর্য-চাঁদ", "দিন-রাত", "বিড়াল-ইঁদুর", "বড়-ছোট", "ঠান্ডা-গরম"]);
  for (const pic of pics) { assert.equal(opposite(opposite(pic)), pic); assert.notEqual(opposite(pic), pic); }
  const words = Object.values(WORDS);
  assert.equal(new Set(words).size, words.length);
  [...words, ...Object.values(COLOR_WORDS), ...Object.values(SHAPE_WORDS), ...Object.values(RULES).flatMap(rule => [rule.name, rule.say]), ...LEVELS.map(spec => spec.label)].forEach(nfc);
  const art = readFileSync(join(root, "components/art.tsx"), "utf8");
  for (const pic of pics) assert.match(art, new RegExp(`\\b${pic}: \\(\\) =>`), `art for ${pic}`);
});

test("the card sort: each card matches one basket by colour and the other by shape", () => {
  assert.equal(SORT_CARDS.length, 2);
  for (const card of SORT_CARDS) {
    const byColor = rightChoice({ kind: "sort", card }, "color"), byShape = rightChoice({ kind: "sort", card }, "shape");
    assert.notEqual(byColor, byShape, "the switch always changes the answer");
    assert.equal(TARGETS[byColor].color, card.color);
    assert.equal(TARGETS[byShape].shape, card.shape);
  }
  assert.deepEqual(["ulto", "same", "color", "shape"].map(rule => flip(rule as "ulto")), ["same", "ulto", "shape", "color"]);
});

test("levels: opposite only, then a bell to 'same', then colour → shape; rounds of 8–12 pictures", () => {
  assert.equal(LEVEL_COUNT, 6);
  assert.deepEqual(LEVELS.map(spec => spec.kind), ["pair", "pair", "pair", "pair", "sort", "sort"]);
  assert.deepEqual(LEVELS.map(spec => spec.run === null), [true, true, false, false, false, false]);
  assert.equal(specOf(1).pairs, 2, "the youngest start with sun-moon and day-night");
  for (const spec of LEVELS) assert.ok(spec.items >= 8 && spec.items <= 12);
  assert.equal(new Set(LEVELS.map(spec => spec.label)).size, LEVEL_COUNT);
});

test("every picture is complete and answerable at every pace", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) for (const pace of [-1, 0, 1] as const) for (let seed = 1; seed <= 200; seed++) {
    const spec = specOf(level), rng = makeRng(seed);
    let previous;
    for (let index = 0; index < 6; index++) {
      const item = makeItem(spec, pace, rng, previous);
      if (item.kind === "pair") {
        assert.equal(spec.kind, "pair");
        assert.ok(PAIRS.slice(0, pairsInPlay(spec, pace)).flat().includes(item.show));
        assert.ok(item.choices.includes(item.show) && item.choices.includes(opposite(item.show)));
        if (previous?.kind === "pair") assert.notEqual(item.show, previous.show, "never the same picture twice in a row");
        assert.notEqual(rightChoice(item, "ulto"), rightChoice(item, "same"));
      } else {
        assert.equal(spec.kind, "sort");
        assert.ok(SORT_CARDS.includes(item.card));
      }
      for (const rule of spec.kind === "pair" ? ["ulto", "same"] as const : ["color", "shape"] as const) assert.ok([0, 1].includes(rightChoice(item, rule)));
      previous = item;
    }
  }
});

test("difficulty steps: the ease lengthens runs and keeps three pairs; brisk shortens runs; চটপট is gentler when eased", () => {
  const four = specOf(4);
  assert.equal(pairsInPlay(four, -1), 3);
  assert.equal(pairsInPlay(four, 0), 5);
  assert.equal(pairsInPlay(specOf(1), -1), 2);
  for (let seed = 1; seed < 100; seed++) {
    assert.ok(runLength(four, -1, makeRng(seed)) >= 4);
    const normal = runLength(four, 0, makeRng(seed));
    assert.ok(normal >= 2 && normal <= 4);
    assert.ok(runLength(four, 1, makeRng(seed)) >= 2, "never shorter than two");
  }
  assert.equal(runLength(specOf(1), 0, makeRng(1)), Infinity);
  assert.deepEqual([-1, 0, 1].map(pace => paceSeconds(pace as 0)), [5, 4, 3]);
});

test("a miss wobbles only: the same picture waits, two tries make it glow, three missed pictures ease the pace", () => {
  let round = nextItem(answer(newRound(2, 0, 3), answerOf(newRound(2, 0, 3))).round)!;
  assert.equal(round.demo, false);
  const item = round.item, wrong = 1 - answerOf(round);
  let result = answer(round, wrong);
  assert.equal(result.outcome, "again");
  assert.equal(result.round.item, item, "nothing changes under the finger");
  assert.equal(glows(result.round), false);
  result = answer(result.round, wrong);
  assert.equal(glows(result.round), true);
  assert.equal(answer(result.round, 5).outcome, "ignore");
  round = answer(result.round, answerOf(result.round)).round;
  assert.equal(round.stage, "done");
  assert.equal(answer(round, 0).outcome, "ignore", "no double answers");
  assert.equal(round.firstTry, 0);
  // two more missed pictures make three in a row
  for (let index = 0; index < 2; index++) { round = nextItem(round)!; round = answer(round, 1 - answerOf(round)).round; round = answer(round, answerOf(round)).round; }
  assert.equal(round.pace, -1);
});

test("five clean answers step the pace up; demo pictures never count", () => {
  let round = newRound(2, -1, 5);
  assert.ok(round.demo);
  round = answer(round, 1 - answerOf(round)).round;
  assert.equal(round.missRun, 0, "a demo miss doesn't count");
  round = answer(round, answerOf(round)).round;
  assert.equal(round.scored, 0);
  for (let index = 0; index < 5; index++) { round = nextItem(round)!; round = answer(round, answerOf(round)).round; }
  assert.equal(round.pace, 0);
  assert.equal(round.scored, 5);
});

test("the bell flips the rule, shows a demo, never rings on the last picture; level 5 switches once", () => {
  for (let seed = 1; seed < 60; seed++) for (const level of [3, 4, 5, 6]) {
    let round = newRound(level, 0, seed), rule = round.rule, bells = 0;
    for (;;) {
      round = answer(round, answerOf(round)).round;
      const next = nextItem(round);
      if (!next) break;
      if (next.rang) { bells++; assert.equal(next.rule, flip(rule)); assert.ok(next.demo); assert.ok(next.index < specOf(level).items - 1); rule = next.rule; }
      else assert.equal(next.rule, rule);
      round = next;
    }
    assert.equal(round.bells, bells);
    assert.ok(bells >= 1, `level ${level} rings`);
    if (level === 5) assert.equal(bells, 1);
  }
  for (const level of [1, 2]) assert.equal(play(level).bells, 0);
});

test("চটপট: a passed picture counts as a miss, quietly; demos never pass", () => {
  const first = newRound(2, 0, 9);
  assert.equal(pass(first), first, "the demo waits");
  const round = nextItem(answer(first, answerOf(first)).round)!;
  const passed = pass(round);
  assert.equal(passed.stage, "done");
  assert.equal(passed.scored, 1);
  assert.equal(passed.firstTry, 0);
  assert.equal(pass(passed), passed);
});

test("star thresholds: no miss or one → 3, up to three → 2, else 1; rounds end and wait", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const clean = play(level);
    assert.equal(clean.done, specOf(level).items);
    assert.equal(nextItem(clean), null, "never auto-advances");
    assert.equal(roundStars(clean), 3);
    assert.ok(praiseLine(clean).length > 0);
    nfc(endLine(clean));
    const messy = play(level, 1);
    assert.equal(roundStars(messy), 1);
    assert.equal(praiseLine(messy), "", "no praise for a hard round");
  }
  const at = (misses: number) => roundStars({ scored: 10, firstTry: 10 - misses } as Round);
  assert.deepEqual([0, 1, 2, 3, 4, 8].map(at), [3, 3, 2, 2, 1, 1]);
  assert.equal(endLine(play(1)), "৮টা ছবির উল্টোটা খুঁজে নিলে।");
  assert.match(endLine(play(5)), /^১০টা কার্ড সাজালে, ঘণ্টা বাজল ১ বার।$/);
});

test("today's card counts what was done, first person, no name", () => {
  let today = addToday({ pictures: 0, cards: 0, bells: 0 }, play(1));
  today = addToday(today, play(5));
  assert.deepEqual(cardLines(today), ["আজ ৮টা ছবিতে উল্টো খেললাম", "১০টা কার্ড রং আর আকারে সাজালাম", "ঘণ্টা বাজল ১ বার, নিয়ম বদলে নিলাম"]);
  assert.deepEqual(cardLines({ pictures: 0, cards: 4, bells: 0 }), ["আজ ৪টা কার্ড রং আর আকারে সাজালাম"]);
  assert.deepEqual(cardLines({ pictures: 0, cards: 0, bells: 0 }), []);
  cardLines(today).forEach(nfc);
});

test("the #og preview draws a fixed card and never touches storage, stars or play time", () => {
  assert.equal(cardLines(OG_TODAY).length, 3);
  const og = readFileSync(join(root, "components/og-card.tsx"), "utf8");
  assert.doesNotMatch(og, /localStorage|sessionStorage|indexedDB|useLevels|useKidsSession|atBreak|record\(|addToday/);
  const game = readFileSync(join(root, "components/ulto-game.tsx"), "utf8");
  assert.match(game, /og \? <OgCard[^\n]*: <Game \/>/, "the game, with its stars and session clock, isn't rendered on #og");
});

test("share never makes a link and has no tally", () => {
  assert.equal(share.normalize("level=1"), null);
  assert.equal(share.normalize(""), null);
  assert.equal(share.tally, undefined);
  assert.ok(share.preview("x").title.length > 0);
});

test("no network: the tool's source never calls fetch or imports share-client", () => {
  const sources = [...files(root), join(root, "../../app/ulto-khela/page.tsx")];
  assert.ok(sources.length >= 9);
  for (const file of sources) {
    const text = readFileSync(file, "utf8");
    assert.doesNotMatch(text, /\bfetch\s*\(/, file);
    assert.doesNotMatch(text, /share-client|ShareBar|sendBeacon|XMLHttpRequest|\/api\//, file);
    assert.equal(text, text.normalize("NFC"), `${file} is NFC`);
  }
});

test("content meets the SEO limits and the kids' rules", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.ok(site.title.startsWith("বিপরীত শব্দ"));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.faq.length >= 6);
  assert.match(site.faq[0].answer, /^যে শব্দের মানে আরেকটা শব্দের ঠিক উল্টো/);
  const questions = site.faq.map(item => item.question).join(" ");
  for (const must of ["কোন বয়সের", "ইন্টারনেট", "তথ্য", "কতক্ষণ"]) assert.ok(questions.includes(must), must);
  assert.equal(new Set(site.faq.map(item => item.question)).size, site.faq.length);
  assert.equal(site.privacy.length, 1);
  assert.ok(site.headline && site.headline !== site.title);
  for (const text of [site.title, site.description, site.lead, site.guideIntro, ...site.steps, ...site.privacy, ...site.faq.flatMap(item => [item.question, item.answer])]) {
    nfc(text);
    assert.doesNotMatch(text, /আপনি|আপনার|করুন|IQ|জিনিয়াস/, "তুমি voice, no brain claims");
  }
});

