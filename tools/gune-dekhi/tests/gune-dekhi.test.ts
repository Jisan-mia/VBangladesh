import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { makeRng } from "../../../shared/game-core";
import { site } from "../content";
import { share } from "../share";
import {
  addToday, answer, answerOf, cardLines, choicesFor, endLine, glows, gridFor, ITEMS, lined, LEVELS, LEVEL_COUNT, levelOf, makeItem, MODES, newRound,
  nextItem, NUMBER_WORDS, openSteps, PIPS, praiseLine, roundStars, scatter, span, specOf, tapFish, type Round,
} from "../lib/game";

const root = join(import.meta.dirname, "..");
const files = (dir: string): string[] => readdirSync(dir).flatMap(name => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? (name === "tests" ? [] : files(path)) : [path];
});
const nfc = (text: string) => assert.equal(text, text.normalize("NFC"), text);

/** Answers the item on screen: counts every fish, then gives the right answer after `misses` wrong ones on each question. */
function solve(round: Round, misses = 0): Round {
  const item = round.item;
  if (item.kind === "guni") for (let fish = 0; fish < item.n; fish++) round = tapFish(round, fish)!;
  while (round.stage === "pick" || round.stage === "koto") {
    const right = answerOf(round);
    for (let miss = 0; miss < misses; miss++) round = answer(round, round.item.kind === "beshi" && round.stage === "pick" ? 1 - right : right + 1).round;
    round = answer(round, right).round;
  }
  return round;
}
function play(level: number, misses = 0, seed = 7) {
  let round = newRound(level, false, 0, seed);
  for (let guard = 0; guard < ITEMS + 1; guard++) {
    round = solve(round, misses);
    const next = nextItem(round);
    if (!next) return round;
    round = next;
  }
  throw new Error("a round always ends");
}

test("three modes, three steps each, ranges 1–5 → 1–10 → 1–20 in counting", () => {
  assert.equal(LEVEL_COUNT, 9);
  assert.deepEqual(MODES.map(mode => mode.name), ["গুনি", "এক নজরে", "কোনটায় বেশি"]);
  for (const mode of MODES) assert.deepEqual(LEVELS.filter(spec => spec.mode === mode.id).map(spec => spec.step), [1, 2, 3]);
  assert.deepEqual([1, 2, 3].map(step => specOf(levelOf("guni", step)).max), [5, 10, 20]);
  assert.ok(specOf(levelOf("nojor", 1)).pictures, "the youngest answer with pictures");
  assert.ok(!specOf(levelOf("nojor", 2)).pictures, "then numerals");
  assert.ok(specOf(levelOf("beshi", 3)).koto, "later, কতটা বেশি");
  for (const spec of LEVELS) { nfc(spec.label); assert.ok(spec.min >= 1 && spec.min < spec.max); }
  assert.equal(NUMBER_WORDS.length, 21);
  assert.equal(new Set(NUMBER_WORDS).size, 21);
  NUMBER_WORDS.forEach(nfc);
  assert.deepEqual(NUMBER_WORDS.slice(1, 11), ["এক", "দুই", "তিন", "চার", "পাঁচ", "ছয়", "সাত", "আট", "নয়", "দশ"]);
});

test("dice patterns: n spots for 1–6, all distinct and inside the square", () => {
  for (let n = 1; n <= 6; n++) {
    assert.equal(PIPS[n].length, n);
    assert.equal(new Set(PIPS[n].map(spot => spot.join())).size, n);
    for (const [x, y] of PIPS[n]) assert.ok(x > 0.1 && x < 0.9 && y > 0.1 && y < 0.9);
  }
});

test("every item is complete and answerable in every level, eased or not", () => {
  for (const spec of LEVELS) for (const eased of [false, true]) for (let seed = 1; seed <= 300; seed++) {
    const level = levelOf(spec.mode, spec.step), [low, high] = span(level, eased), item = makeItem(level, makeRng(seed), eased, seed % 4);
    if (item.kind === "guni") {
      assert.ok(item.n >= low && item.n <= high);
      assert.equal(item.spots.length, item.n);
      assert.ok(item.grid[0] * item.grid[1] >= item.n);
      assert.equal(new Set(item.spots.map(spot => `${Math.round(spot.x / 5)},${Math.round(spot.y / 5)}`)).size, item.n, "no two fish on one spot");
      assert.ok(item.choices.includes(item.n));
    } else if (item.kind === "nojor") {
      assert.ok(item.n >= low && item.n <= high, `${level}: ${item.n}`);
      assert.equal(item.parts.reduce((a, b) => a + b, 0), item.n);
      assert.ok(item.parts.every(part => part >= 1 && part <= 6), "each group is one dice pattern");
      assert.equal(item.parts.length, spec.parts ?? 1);
      assert.ok(item.choices.includes(item.n));
    } else {
      const [a, b] = item.counts;
      assert.notEqual(a, b, "never equal");
      assert.ok(Math.min(a, b) >= 1 && Math.max(a, b) <= 10);
      assert.equal(item.spots[0].length, a); assert.equal(item.spots[1].length, b);
      if (spec.step === 1 || eased) assert.ok(Math.abs(a - b) >= (spec.koto ? 1 : 2), "easy gaps first");
      if (item.koto) { assert.ok(Math.abs(a - b) <= 3); assert.ok(item.koto.includes(Math.abs(a - b))); }
    }
    const choices = item.kind === "beshi" ? item.koto : item.choices;
    if (choices) {
      assert.equal(choices.length, 3);
      assert.equal(new Set(choices).size, 3);
      assert.deepEqual([...choices].sort((x, y) => x - y), choices, "tiles in counting order");
      assert.ok(choices.every(value => value >= 1 && value <= 20));
    }
  }
});

test("choices are near neighbours; ponds keep every fish a big cell", () => {
  assert.deepEqual(choicesFor(1, 1, 6, () => 0), [1, 2, 3]);
  assert.deepEqual(choicesFor(20, 1, 20, () => 0), [18, 19, 20]);
  for (let seed = 1; seed < 50; seed++) { const [x, , z] = choicesFor(5, 1, 20, makeRng(seed)); assert.ok(z - x <= 4); }
  assert.deepEqual(gridFor(5), [3, 2]); assert.deepEqual(gridFor(10), [3, 4]); assert.deepEqual(gridFor(20), [4, 5]);
  // On a 320px phone the pond is about 290px wide: 3 columns keep each fish cell at 96px for up to 12 fish.
  assert.ok(290 / gridFor(12)[0] >= 96);
  const spots = scatter(20, [4, 5], makeRng(3));
  assert.ok(spots.every(spot => spot.x > 0 && spot.x < 100 && spot.y > 0 && spot.y < 100));
  assert.deepEqual(lined(3).map(spot => [spot.x, spot.y]), [[30, 11], [70, 11], [30, 30]]);
  assert.ok(lined(10).every(spot => spot.y < 95));
});

test("counting: each fish once, in order; the total question comes after the last fish", () => {
  let round = newRound(levelOf("guni", 1), false, 0, 11);
  assert.equal(round.stage, "count");
  assert.equal(answer(round, 3).outcome, "ignore", "no answer before counting");
  round = tapFish(round, 2)!;
  assert.deepEqual(round.counted, [2]);
  assert.equal(tapFish(round, 2), null, "a counted fish doesn't count twice");
  assert.equal(tapFish(round, 99), null);
  const item = round.item;
  if (item.kind !== "guni") throw new Error("guni");
  for (let fish = 0; fish < item.n; fish++) round = tapFish(round, fish) ?? round;
  assert.equal(round.stage, "pick");
  assert.equal(round.counted.length, item.n);
});

test("mistakes: a miss costs a try, two tries make the answer glow, three in a row quietly ease the next item", () => {
  let round = solve(newRound(levelOf("nojor", 2), false, 0, 5), 0);
  round = nextItem(round)!;
  const right = answerOf(round);
  let result = answer(round, right + 1);
  assert.equal(result.outcome, "again");
  round = result.round;
  assert.equal(glows(round), false);
  round = answer(round, right + 1).round;
  assert.equal(glows(round), true);
  assert.equal(round.eased, false);
  round = answer(round, right + 1).round;
  assert.ok(round.eased, "three misses in a row");
  const sameItem = round.item;
  result = answer(round, right);
  assert.equal(result.outcome, "right");
  assert.equal(result.round.item, sameItem, "nothing changes under the finger");
  const next = nextItem(result.round)!;
  const [, easedHigh] = span(next.level, true);
  if (next.item.kind === "nojor") assert.ok(next.item.n <= easedHigh);
  assert.equal(next.tries, 0);
});

test("five first-try answers lift the ease", () => {
  let round = newRound(levelOf("guni", 3), true, 0, 9);
  for (let index = 0; index < 4; index++) { round = solve(round); assert.ok(round.eased); round = nextItem(round)!; }
  round = solve(round);
  assert.equal(round.rightRun, 5);
  assert.equal(round.eased, false);
  const again = newRound(round.level, round.eased, round.rightRun, 3);
  if (again.item.kind === "guni") assert.ok(again.item.n >= 8);
});

test("which has more: the pond, then (last step) how many more; a miss lines the fish up", () => {
  let round = newRound(levelOf("beshi", 3), false, 0, 4);
  if (round.item.kind !== "beshi") throw new Error("beshi");
  const more = round.item.counts[0] > round.item.counts[1] ? 0 : 1, gap = Math.abs(round.item.counts[0] - round.item.counts[1]);
  round = answer(round, 1 - more).round;
  assert.equal(round.tries, 1);
  round = answer(round, more).round;
  assert.equal(round.stage, "koto");
  assert.equal(round.tries, 0);
  assert.equal(answerOf(round), gap);
  round = answer(round, gap).round;
  assert.equal(round.stage, "done");
  assert.equal(answerOf(round), gap, "the koto tile stays lit");
  assert.equal(round.firstTry, 0, "one miss on the item means not first try");
  const plain = solve(newRound(levelOf("beshi", 1), false, 0, 4));
  assert.equal(plain.stage, "done");
  assert.equal(plain.firstTry, 1);
});

test("a round is five items, then it waits; stars only record it", () => {
  for (const spec of LEVELS) {
    const level = levelOf(spec.mode, spec.step), round = play(level);
    assert.equal(round.index, ITEMS - 1);
    assert.equal(nextItem(round), null, "never auto-advances past the round");
    assert.equal(round.firstTry, ITEMS);
    assert.equal(roundStars(round.firstTry), 3);
    assert.ok(praiseLine(round).length > 0);
    nfc(endLine(round));
    assert.equal(play(level, 1).firstTry, 0);
    assert.equal(praiseLine(play(level, 1)), "", "no praise for a hard round");
  }
  assert.deepEqual([0, 1, 2, 3, 4, 5].map(roundStars), [1, 1, 2, 2, 3, 3]);
  assert.match(endLine(play(levelOf("guni", 1))), /^৫টা পুকুরে মোট [০-৯]+টা মাছ গুনলে।$/);
  assert.equal(endLine(play(levelOf("nojor", 1))), "৫টা নকশা এক নজরে দেখলে।");
  assert.equal(endLine(play(levelOf("beshi", 1))), "৫ জোড়া পুকুর মেলালে।");
});

test("steps open one by one inside each mode; every mode opens on its own", () => {
  assert.equal(openSteps({}, "guni"), 1);
  assert.equal(openSteps({}, "beshi"), 1);
  assert.equal(openSteps({ [levelOf("guni", 1)]: 1 }, "guni"), 2);
  assert.equal(openSteps({ [levelOf("guni", 1)]: 1, [levelOf("guni", 2)]: 2 }, "guni"), 3);
  assert.equal(openSteps({ [levelOf("guni", 1)]: 1 }, "nojor"), 1);
});

test("today's card counts what was done, first person, no name", () => {
  let today = addToday({ fish: 0, seen: 0, ponds: 0 }, play(levelOf("guni", 1)));
  const fish = today.fish;
  assert.ok(fish >= 10 && fish <= 25);
  today = addToday(today, play(levelOf("beshi", 1)));
  assert.deepEqual(cardLines(today), [`আজ ${new Intl.NumberFormat("bn-BD").format(fish)}টা মাছ গুনলাম`, "৫ জোড়া পুকুর মেলালাম"]);
  assert.deepEqual(cardLines({ fish: 0, seen: 5, ponds: 0 }), ["আজ ৫টা নকশা এক নজরে চিনলাম"]);
  assert.deepEqual(cardLines({ fish: 0, seen: 0, ponds: 0 }), []);
});

test("share never makes a link and has no tally", () => {
  assert.equal(share.normalize("level=1"), null);
  assert.equal(share.normalize(""), null);
  assert.equal(share.tally, undefined);
  assert.ok(share.preview("x").title.length > 0);
});

test("no network: the tool's source never calls fetch or imports share-client", () => {
  const sources = [...files(root), join(root, "../../app/gune-dekhi/page.tsx")];
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
  assert.ok(site.title.startsWith("শিশুদের সংখ্যা শেখানোর খেলা"));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.faq.length >= 6);
  assert.match(site.faq[0].answer, /^প্রতিটা জিনিস একবার করে ছুঁয়ে/);
  const questions = site.faq.map(item => item.question).join(" ");
  for (const must of ["কোন বয়সের", "ইন্টারনেট", "তথ্য", "কতক্ষণ"]) assert.ok(questions.includes(must), must);
  assert.equal(new Set(site.faq.map(item => item.question)).size, site.faq.length);
  assert.equal(site.privacy.length, 1);
  assert.ok(site.headline && site.headline !== site.title);
  for (const text of [site.title, site.description, site.lead, site.guideIntro, ...site.steps, ...site.privacy, ...site.faq.flatMap(item => [item.question, item.answer])]) {
    nfc(text);
    assert.doesNotMatch(text, /আপনি|আপনার|করুন/, "তুমি voice");
  }
});
