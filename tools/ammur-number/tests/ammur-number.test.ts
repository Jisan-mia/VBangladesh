import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { site } from "../content";
import { share } from "../share";
import {
  beats, bn, cardLine, DEMO, dial, endLine, expected, glows, grouped, hiddenCount, LEVELS, LEVEL_COUNT, levelOf, newRound, nextPiece, parseNumber, peek,
  PIECES, promptLine, rhyme, roundStars, slots, target, WORDS, type Round,
} from "../lib/game";
import { CARD_ASK, cardFontSample } from "../lib/draw-card";

const root = join(import.meta.dirname, "..");
const files = (dir: string): string[] => readdirSync(dir).flatMap(name => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? (name === "tests" ? [] : files(path)) : [path];
});
const nfc = (text: string) => assert.equal(text, text.normalize("NFC"), text);
const NUMBER = "01712345678";

/** Types the current piece; `misses` wrong digits first on its first digit. */
function typePiece(round: Round, misses = 0) {
  for (let miss = 0; miss < misses; miss++) round = dial(round, (expected(round) + 1) % 10).round;
  while (round.stage === "play") round = dial(round, expected(round)).round;
  return round;
}
function play(level: number, misses = 0) {
  let round = newRound(level, NUMBER);
  for (let guard = 0; guard < 10; guard++) {
    round = typePiece(round, misses);
    if (round.stage === "end") return round;
    assert.equal(round.stage, "piece");
    round = nextPiece(round);
  }
  throw new Error("a round always ends");
}

test("parsing: Bangladeshi mobile numbers in Bangla or English digits, nothing else", () => {
  assert.equal(parseNumber("01712345678"), NUMBER);
  assert.equal(parseNumber("০১৭১২৩৪৫৬৭৮"), NUMBER);
  assert.equal(parseNumber("০১৭১২-৩৪৫ ৬৭৮"), NUMBER);
  assert.equal(parseNumber("+8801712345678"), NUMBER);
  assert.equal(parseNumber("8801712345678"), NUMBER);
  for (const operator of "3456789") assert.equal(parseNumber(`01${operator}00000000`), `01${operator}00000000`);
  for (const bad of ["", "0171234567", "017123456789", "01212345678", "01112345678", "02712345678", "0171234567a", "abc", "+8802712345678"]) assert.equal(parseNumber(bad), null, bad);
  assert.equal(parseNumber(DEMO), DEMO);
});

test("content: digits, words, pieces and the chant are right and NFC", () => {
  assert.equal(bn("0123456789"), "০১২৩৪৫৬৭৮৯");
  assert.equal(WORDS.length, 10);
  assert.equal(new Set(WORDS).size, 10);
  WORDS.forEach(nfc);
  assert.equal(grouped(NUMBER), "০১৭১২-৩৪৫-৬৭৮");
  assert.deepEqual(PIECES, [3, 5, 8, 11]);
  assert.equal(rhyme(NUMBER, 3), "শূন্য-এক-সাত");
  assert.equal(rhyme(NUMBER, 5), "শূন্য-এক-সাত, এক-দুই");
  assert.equal(rhyme(NUMBER), "শূন্য-এক-সাত, এক-দুই, তিন-চার-পাঁচ, ছয়-সাত-আট");
  nfc(rhyme(NUMBER));
  // A rest between pieces, like a rhyme; slow mode is slower.
  const times = beats(11);
  assert.equal(times.length, 11);
  assert.ok(times[3] - times[2] > times[2] - times[1]);
  assert.ok(beats(11, true)[10] > times[10]);
});

test("difficulty steps: copy → remember the old piece → remember all → whole number", () => {
  assert.equal(LEVEL_COUNT, 4);
  assert.deepEqual(LEVELS.map(level => level.hide), ["none", "old", "all", "all"]);
  assert.deepEqual(LEVELS.map(level => level.pieces.length), [4, 4, 4, 1]);
  assert.equal(new Set(LEVELS.map(level => level.label)).size, LEVEL_COUNT);
  LEVELS.forEach(level => nfc(level.label));
  assert.equal(LEVELS[3].showFirst, false);
  const hiddenAt = (level: number) => {
    const out: number[] = [];
    let round = newRound(level, NUMBER);
    for (;;) { out.push(hiddenCount(round)); round = typePiece(round); if (round.stage === "end") return out; round = nextPiece(round); }
  };
  assert.deepEqual(hiddenAt(1), [0, 0, 0, 0]);
  assert.deepEqual(hiddenAt(2), [0, 3, 5, 8]);
  assert.deepEqual(hiddenAt(3), [3, 5, 8, 11]);
  assert.deepEqual(hiddenAt(4), [11]);
  // Each piece is typed again from the start, and grows.
  let round = newRound(1, NUMBER);
  const targets: number[] = [];
  for (;;) { targets.push(target(round)); round = typePiece(round); if (round.stage === "end") break; round = nextPiece(round); assert.equal(round.typed, 0); }
  assert.deepEqual(targets, [3, 5, 8, 11]);
  assert.equal(levelOf(9).step, 4);
});

test("boxes: typed, guide, hidden, a hint after two misses, and later ones", () => {
  let round = newRound(2, NUMBER);
  round = nextPiece(typePiece(round));
  assert.deepEqual(slots(round, false).slice(0, 6), ["hidden", "hidden", "hidden", "guide", "guide", "later"]);
  assert.deepEqual(slots(round, true).slice(0, 5), ["guide", "guide", "guide", "guide", "guide"]);
  round = dial(round, 0).round;
  assert.equal(slots(round, false)[0], "typed");
  round = dial(round, 9).round;
  assert.equal(glows(round), false);
  round = dial(round, 9).round;
  assert.equal(glows(round), true);
  assert.equal(slots(round, false)[1], "hint");
  assert.match(promptLine(round, "ammu", false), /মনে/);
});

test("mistakes: a wrong digit never goes in; three in a row ease the next piece; five right lift it", () => {
  let round = newRound(3, NUMBER);
  const { round: missed, event } = dial(round, 5);
  assert.equal(event, "miss");
  assert.equal(missed.typed, 0);
  round = typePiece(round, 3);
  assert.equal(round.misses, 3);
  assert.equal(round.eased, false, "the ease waits for the next piece");
  round = nextPiece(round);
  assert.equal(round.eased, true);
  assert.equal(hiddenCount(round), 3, "eased: only the old piece hides");
  round = dial(round, expected(round)).round;
  for (let index = 0; index < 4; index++) round = dial(round, expected(round)).round;
  assert.equal(round.eased, false, "five right in a row lift it");
  assert.equal(dial({ ...round, stage: "piece" }, 0).event, "ignore");
});

test("peeking counts as help only when something is hidden", () => {
  const open = newRound(1, NUMBER);
  assert.equal(peek(open).helps, 0);
  const hidden = newRound(4, NUMBER);
  assert.equal(peek(hidden).helps, 1);
});

test("stars only record the round: 0–1 slips three, up to 4 two, else one", () => {
  assert.equal(roundStars(play(1)), 3);
  assert.equal(roundStars({ ...play(1), misses: 1 }), 3);
  assert.equal(roundStars({ ...play(1), misses: 2, helps: 2 }), 2);
  assert.equal(roundStars(play(1, 2)), 1);
  assert.equal(play(4).piece, 0);
  assert.equal(play(4).stage, "end");
  assert.match(endLine(play(4), "ammu"), /মনে আছে/);
  assert.match(endLine(play(2, 1), "abbu"), /আব্বুর/);
});

test("the card says what was done, never a digit", () => {
  assert.equal(cardLine("ammu"), "আজ আম্মুর নম্বর মুখস্থ করলাম");
  assert.equal(cardLine("abbu"), "আজ আব্বুর নম্বর মুখস্থ করলাম");
  for (const text of [cardLine("ammu"), cardLine("abbu"), CARD_ASK, cardFontSample]) { nfc(text); assert.doesNotMatch(text, /[0-9০-৯]/); }
  const source = readFileSync(join(root, "lib/draw-card.ts"), "utf8");
  assert.doesNotMatch(source, /\.number\b|bn\(/, "the card never receives or prints the number");
});

test("share never makes a link and has no tally", () => {
  assert.equal(share.normalize("n=01712345678"), null);
  assert.equal(share.normalize(""), null);
  assert.equal(share.tally, undefined);
  assert.ok(share.preview("x").title.length > 0);
});

test("no network, and the number never reaches storage, the address, a log or the network", () => {
  const sources = [...files(root), join(root, "../../app/ammur-number/page.tsx")];
  assert.ok(sources.length >= 8);
  for (const file of sources) {
    const text = readFileSync(file, "utf8");
    assert.doesNotMatch(text, /\bfetch\s*\(/, file);
    assert.doesNotMatch(text, /share-client|ShareBar|sendBeacon|XMLHttpRequest|WebSocket|\/api\//, file);
    assert.doesNotMatch(text, /localStorage|sessionStorage|indexedDB|document\.cookie|caches\./, file);
    assert.doesNotMatch(text, /history\.(push|replace)State|location\.(hash|search|href)\s*=(?!=)|location\.(assign|replace)\(/, file);
    assert.doesNotMatch(text, /console\./, file);
    assert.equal(text, text.normalize("NFC"), `${file} is NFC`);
  }
  // The number field is the parent's only text input, with nothing for the browser to remember.
  const game = readFileSync(join(root, "components/number-game.tsx"), "utf8");
  assert.equal(game.match(/<input/g)?.length, 1);
  assert.match(game, /autoComplete="off"/);
  assert.doesNotMatch(game, /<form|name="/);
  assert.match(game, /<ParentGate key=\{gate\} label="নম্বর দাও">/);
});

test("content meets the SEO limits and the kids' rules", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.ok(site.title.startsWith("ফোন নম্বর মুখস্থ"));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.faq.length >= 6);
  assert.match(site.faq[0].answer, /^টুকরো করে, সুরে সুরে।/);
  const questions = site.faq.map(item => item.question).join(" ");
  for (const must of ["কোন বয়সের", "ইন্টারনেট", "তথ্য", "কতক্ষণ", "জমা"]) assert.ok(questions.includes(must), must);
  assert.equal(new Set(site.faq.map(item => item.question)).size, site.faq.length);
  assert.equal(site.privacy.length, 1);
  assert.ok(site.privacy[0].startsWith("নম্বরটা কোথাও রাখা হয় না, পাতা বন্ধ করলেই মুছে যায়।"));
  assert.ok(site.headline && site.headline !== site.title);
  for (const text of [site.title, site.description, site.lead, site.guideIntro, ...site.steps, ...site.privacy, ...site.faq.flatMap(item => [item.question, item.answer])]) {
    nfc(text);
    assert.doesNotMatch(text, /আপনি|আপনার|করুন/, "তুমি voice");
  }
});
