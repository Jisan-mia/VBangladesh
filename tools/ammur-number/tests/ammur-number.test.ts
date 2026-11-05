import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { site, parentNote } from "../content";
import { share } from "../share";
import { levelOf } from "../lib/levels";
import {
  askLine, beats, bn, cardLine, DEMO, dial, endLine, expected, eyesLeft, glows, hiddenCount, look, lookLength, missLine, newRound, nextPiece, opensWithLook, parseNumber,
  resultOf, roundStars, sayLine, slots, somethingHidden, target, WORDS, type Round,
} from "../lib/play";
import { SAVED_KEY, readSaved } from "../lib/saved";
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

test("content: digits, words and the look's rhythm are right and NFC", () => {
  assert.equal(bn("0123456789"), "০১২৩৪৫৬৭৮৯");
  assert.equal(WORDS.length, 10);
  assert.equal(new Set(WORDS).size, 10);
  WORDS.forEach(nfc);
  // A rest between pieces, like a rhyme; slow mode is slower.
  const times = beats(11);
  assert.equal(times.length, 11);
  assert.ok(times[3] - times[2] > times[2] - times[1]);
  assert.ok(beats(11, true)[10] > times[10]);
  assert.ok(lookLength(11) > times[10]);
});

test("hiding follows the level: nothing, the old piece, or everything; an eased piece hides one notch less", () => {
  const hiddenAt = (level: number) => {
    const out: number[] = [];
    let round = newRound(level, NUMBER);
    for (;;) { out.push(hiddenCount(round)); round = typePiece(round); if (round.stage === "end") return out; round = nextPiece(round); }
  };
  assert.deepEqual(hiddenAt(1), [0, 0, 0, 0]);
  assert.deepEqual(hiddenAt(2), [0, 3, 5, 8]);
  assert.deepEqual(hiddenAt(3), [3, 5, 8, 11]);
  assert.deepEqual(hiddenAt(5), [0, 0]);
  assert.deepEqual(hiddenAt(7), [5, 11]);
  assert.deepEqual(hiddenAt(4), [11]);
  // Each piece is typed again from the start, and grows.
  let round = newRound(1, NUMBER);
  const targets: number[] = [];
  for (;;) { targets.push(target(round)); round = typePiece(round); if (round.stage === "end") break; round = nextPiece(round); assert.equal(round.typed, 0); }
  assert.deepEqual(targets, [3, 5, 8, 11]);
  assert.equal(hiddenCount({ ...nextPiece(typePiece(newRound(3, NUMBER))), eased: true }), 3, "eased: the old piece only");
  assert.equal(hiddenCount({ ...nextPiece(typePiece(newRound(2, NUMBER))), eased: true }), 0);
});

test("the look opens a piece only where something hides and the level asks for it", () => {
  assert.equal(opensWithLook(newRound(1, NUMBER)), false);
  assert.equal(opensWithLook(newRound(2, NUMBER)), false, "level 2's first piece hides nothing");
  assert.equal(opensWithLook(nextPiece(typePiece(newRound(2, NUMBER)))), true);
  assert.equal(opensWithLook(newRound(3, NUMBER)), true);
  assert.equal(opensWithLook(newRound(4, NUMBER)), false, "the whole number from memory has no look");
  assert.equal(opensWithLook(newRound(9, NUMBER)), true);
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
  assert.match(sayLine(round, "ammu", "dial"), /মনে/);
  assert.match(missLine(round), /জ্বলছে/);
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

test("the eye: free where nothing hides, one look where something does, and asleep when the round has none left", () => {
  const open = newRound(1, NUMBER);
  assert.equal(somethingHidden(open), false);
  assert.deepEqual([look(open).allowed, look(open).charged], [true, false]);
  const hidden = newRound(3, NUMBER);
  assert.deepEqual([look(hidden).allowed, look(hidden).charged, look(hidden).round.looks], [true, true, 1]);
  assert.equal(eyesLeft(hidden), null);
  let two = newRound(9, NUMBER);
  assert.equal(eyesLeft(two), 2);
  two = look(look(two).round).round;
  assert.equal(eyesLeft(two), 0);
  assert.equal(look(two).allowed, false);
  assert.equal(look({ ...two, stage: "piece" }).allowed, false);
  // Looks only ever cost a star: nothing else changes, and typing on goes the same.
  assert.equal(typePiece(two).stage, "end");
  assert.equal(levelOf(8).eyes, 3);
});

test("stars only record the round: 0–1 slips three, up to 4 two, else one; a charged look is a slip", () => {
  assert.equal(roundStars(play(1)), 3);
  assert.equal(roundStars({ ...play(1), misses: 1 }), 3);
  assert.equal(roundStars({ ...play(1), misses: 2, looks: 2 }), 2);
  assert.equal(roundStars(play(1, 2)), 1);
  assert.equal(roundStars(look(newRound(3, NUMBER)).round), 3, "one look is still three stars");
  assert.equal(roundStars({ ...play(3), looks: 2 }), 2);
  const done = resultOf(play(1, 1));
  assert.equal(done.dialled, 27);
  assert.equal(done.clean, 27 - 4, "a miss costs the first try of that digit");
  assert.deepEqual(Object.keys(done).sort(), ["clean", "dialled", "level", "looks", "misses", "stars"]);
  assert.match(endLine(play(4), "ammu"), /মনে আছে/);
  assert.match(endLine(play(2, 1), "abbu"), /আব্বুর/);
  assert.match(askLine("ammu"), /আম্মুকে/);
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

test("privacy: no network, no link, no log; the number reaches storage only through lib/saved.ts under one key", () => {
  const sources = [...files(root), join(root, "../../app/ammur-number/page.tsx")];
  assert.ok(sources.length >= 14);
  for (const file of sources) {
    const whole = readFileSync(file, "utf8"), text = whole.replace(/\/\/.*$/gm, "");
    assert.doesNotMatch(text, /\bfetch\s*\(/, file);
    assert.doesNotMatch(text, /share-client|ShareBar|sendBeacon|XMLHttpRequest|WebSocket|\/api\//, file);
    assert.doesNotMatch(text, /sessionStorage|indexedDB|document\.cookie|caches\./, file);
    assert.doesNotMatch(text, /history\.(push|replace)State|location\.(hash|search|href)\s*=(?!=)|location\.(assign|replace)\(/, file);
    assert.doesNotMatch(text, /console\.|speechSynthesis|speak\(|SpeakButton/, file);
    assert.equal(whole, whole.normalize("NFC"), `${file} is NFC`);
    if (!file.endsWith("lib/saved.ts")) assert.doesNotMatch(text, /localStorage/, `${file} stays out of storage`);
  }
  const saved = readFileSync(join(root, "lib/saved.ts"), "utf8");
  const code = saved.replace(/\/\/.*$/gm, "");
  assert.equal(code.match(/localStorage\./g)?.length, code.match(/localStorage\.(get|set|remove)Item\(\s*SAVED_KEY/g)?.length, "every storage call uses the one key");
  assert.equal(SAVED_KEY, "ektukhani-ammur-number-saved");
  // The number is never handed to the card, the level stars, or the end result.
  const game = readFileSync(join(root, "components/game.tsx"), "utf8");
  assert.doesNotMatch(game, /levels\.record\([^)]*number/);
  assert.doesNotMatch(readFileSync(join(root, "lib/draw-card.ts"), "utf8").replace(/\/\/.*$/gm, ""), /\.number\b|DEMO|parseNumber/);
  // The number field is the parent's only text input, behind the gate, with nothing for the browser to remember; radios and a tick are not buttons.
  const form = readFileSync(join(root, "components/parent-form.tsx"), "utf8");
  assert.equal(form.match(/<input/g)?.length, 3);
  assert.match(form, /autoComplete="off"/);
  assert.doesNotMatch(form, /<form|name=/);
  assert.match(game, /<ParentGate key=\{gateKey\}/);
  assert.doesNotMatch(game, /<input/);
});

test("saved numbers: only real numbers are read back, anything else is ignored; no number, no keys", () => {
  assert.deepEqual(readSaved(JSON.stringify({ ammu: NUMBER, abbu: "01800000000" })), { ammu: NUMBER, abbu: "01800000000" });
  assert.deepEqual(readSaved(JSON.stringify({ ammu: "01712345678", abbu: "hello", other: NUMBER })), { ammu: NUMBER });
  for (const bad of [null, "", "x", "[]", "42", "{\"ammu\":42}", "{\"ammu\":\"০১৭১২\"}"]) assert.deepEqual(readSaved(bad), {}, String(bad));
});

test("pictures only: the eye key has a picture and the ghost finger points to it; no voice", () => {
  const game = readFileSync(join(root, "components/game.tsx"), "utf8");
  assert.match(game, /className="am-key am-eye"[\s\S]*<Eye shut=/);
  assert.match(game, /ghostAt === 'eye' && <Ghost/);
  assert.match(game, /hidden && left !== 0/);
  // The kids' end buttons are pictures of at least 96 px.
  const css = readFileSync(join(root, "product.css"), "utf8");
  assert.match(css, /\.am-big\{[^}]*min-height:112px/);
  assert.match(readFileSync(join(root, "components/end-screen.tsx"), "utf8"), /<Replay \/>[\s\S]*<HangUp \/>/);
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
  assert.ok(site.headline && site.headline !== site.title);
  assert.equal(site.headline, "আম্মুর নম্বর মুখস্থ করি, টুকরো টুকরো করে");
  for (const text of [site.title, site.description, site.lead, site.guideIntro, ...site.steps, ...site.privacy, ...site.faq.flatMap(item => [item.question, item.answer]), ...Object.values(parentNote)]) {
    nfc(text);
    assert.doesNotMatch(text, /আপনি|আপনার|করুন/, "তুমি voice");
  }
});
