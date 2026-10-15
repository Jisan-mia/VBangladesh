import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { site } from "../content";
import { share } from "../share";
import { hasPicture } from "../../o-te-ojogor/lib/art";
import { LEVELS, LEVEL_COUNT, cardLine, endLine, levelOf, pictureOf } from "../lib/levels";
import { GLYPHS, arrowOf, even, faceOf, lengthOf, parse, pathOf, smooth, strokesOf } from "../lib/strokes";
import {
  DONE_AT, EASE_AFTER, HARDEN_AFTER, LOOKAHEAD, TOLERANCE, advance, againLetter, done, down, fullAt, letterOf, move, nearPath, newRound,
  nextLetter, starsOf, strokeOf, up, type Event, type Round,
} from "../lib/trace";

const root = join(import.meta.dirname, "..");
const files = (dir: string): string[] => readdirSync(dir).flatMap(name => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? (name === "tests" ? [] : files(path)) : [path];
});

const VOWELS = ["অ", "আ", "ই", "ঈ", "উ", "ঊ", "ঋ", "এ", "ঐ", "ও", "ঔ"];
const CONSONANTS = ["ক", "খ", "গ", "ঘ", "ঙ", "চ", "ছ", "জ", "ঝ", "ঞ", "ট", "ঠ", "ড", "ঢ", "ণ", "ত", "থ", "দ", "ধ", "ন", "প", "ফ", "ব", "ভ", "ম",
  "য", "র", "ল", "শ", "ষ", "স", "হ", "ড়", "ঢ়", "য়", "ৎ", "ং", "ঃ", "ঁ"].map(char => char.normalize("NFC"));
const DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
// School lists: মাত্রাহীন (10) and অর্ধমাত্রা (8); every other letter has a full মাত্রা.
const NO_MATRA = ["এ", "ঐ", "ও", "ঔ", "ঙ", "ঞ", "ৎ", "ং", "ঃ", "ঁ"];
const HALF_MATRA = ["ঋ", "খ", "গ", "ণ", "থ", "ধ", "প", "শ"];

/** Drags a finger along a stroke from start to end in 3-unit steps, as a child would. */
function trace(round: Round): [Round, Event[]] {
  const events: Event[] = [];
  const stroke = strokeOf(round)!;
  let [now, event] = down(round, stroke.samples[0]);
  events.push(event);
  let from = stroke.samples[0];
  for (const point of stroke.samples.filter((_, i) => i % 2 === 0).concat([stroke.samples[stroke.samples.length - 1]])) {
    if (event === "stroke" || event === "letter") break;
    [now, event] = move(now, from, point);
    events.push(event);
    from = point;
  }
  if (event !== "stroke" && event !== "letter") { [now, event] = up(now); events.push(event); }
  return [now, events.filter(Boolean)];
}
const writeLetter = (round: Round) => {
  let now = round;
  while (!now.letterDone) now = trace(now)[0];
  return now;
};

test("every letter and digit has strokes: 11 স্বরবর্ণ, 39 ব্যঞ্জনবর্ণ, ০–৯, nothing extra", () => {
  assert.deepEqual(Object.keys(GLYPHS).sort(), [...VOWELS, ...CONSONANTS, ...DIGITS].sort());
  assert.equal(VOWELS.length + CONSONANTS.length, 50);
  for (const [char, glyph] of Object.entries(GLYPHS)) {
    assert.equal(char, char.normalize("NFC"), `${char} is NFC`);
    assert.ok(glyph.strokes.length >= 1, `${char} has a stroke`);
    const [size, x, y] = glyph.box;
    assert.ok(size > 50 && size <= 110 && x > -10 && x < 40 && y > 60 && y < 140, `${char} guide box`);
    for (const raw of glyph.strokes) {
      const points = parse(raw);
      assert.ok(points.length >= 2, `${char}: a stroke has two points`);
      for (const [px, py] of points) assert.ok(px >= 0 && px <= 100 && py >= 0 && py <= 100 && Number.isFinite(px + py), `${char}: ${px} ${py} in the box`);
    }
  }
});

test("the মাত্রা is drawn last, and only letters with one have it", () => {
  for (const [char, glyph] of Object.entries(GLYPHS)) {
    const isDigit = DIGITS.includes(char);
    // shortcut: the font draws ঋ's অর্ধমাত্রা as part of its top curl, so it has no separate bar to trace.
    const expect = !isDigit && !NO_MATRA.includes(char) && char !== "ঋ";
    assert.equal(!!glyph.matra, expect, `${char} মাত্রা`);
    if (!glyph.matra) continue;
    const bar = parse(glyph.strokes[glyph.strokes.length - 1]), [first, end] = [bar[0], bar[bar.length - 1]];
    assert.ok(Math.abs(first[1] - end[1]) <= 2 && end[0] - first[0] >= 10, `${char}: last stroke is a left-to-right bar`);
    assert.ok(first[1] <= 40, `${char}: the bar sits on top`);
    const length = end[0] - first[0];
    if (HALF_MATRA.includes(char)) assert.ok(length < 25, `${char}: half মাত্রা`); else assert.ok(length >= 30, `${char}: full মাত্রা`);
    for (const raw of glyph.strokes.slice(0, -1)) {
      const points = parse(raw), flat = points.every(([, py]) => Math.abs(py - first[1]) <= 2);
      assert.ok(!flat, `${char}: no other bar before the মাত্রা`);
    }
  }
});

test("geometry: smooth curves pass through the points, even samples are 2 units apart, arrows point along", () => {
  const line = smooth([[10, 10], [50, 40], [90, 10]]);
  assert.deepEqual(line[0], [10, 10]);
  assert.deepEqual(line[line.length - 1], [90, 10]);
  assert.ok(line.some(([x, y]) => x === 50 && y === 40));
  const samples = even([[0, 0], [20, 0]]);
  assert.equal(samples.length, 11);
  assert.ok(samples.slice(1).every(([x], i) => Math.abs(x - samples[i][0] - 2) < 1e-9));
  assert.equal(lengthOf([[0, 0], [3, 4]]), 5);
  assert.equal(pathOf([[1, 2], [3, 4]]), "M1.0 2.0L3.0 4.0");
  const bar = strokesOf("ক")[2];
  assert.ok(Math.abs(arrowOf(bar)!.angle) < 5, "the মাত্রা arrow points right");
  assert.equal(faceOf("ং"), " ং");
  assert.equal(faceOf("ক"), "ক");
  assert.deepEqual(strokesOf("র").map(stroke => stroke.dot), [false, false, true, false], "র's dot is a tap");
});

test("sets: স্বরবর্ণ, then the বর্গ, then ০–৯; every letter once, each with a picture and a name", () => {
  assert.equal(LEVEL_COUNT, 13);
  const all = LEVELS.flatMap(level => level.letters);
  assert.deepEqual(all, [...VOWELS, ...CONSONANTS, ...DIGITS]);
  assert.equal(new Set(all).size, all.length, "no duplicates");
  assert.deepEqual(LEVELS[2].letters, ["ক", "খ", "গ", "ঘ", "ঙ"]);
  for (const level of LEVELS) assert.ok(level.letters.length >= 3 && level.letters.length <= 6, level.title);
  for (const char of all) {
    const { label, pic } = pictureOf(char);
    assert.ok(label.includes(char), `${char}: ${label}`);
    assert.ok(pic === "plate" || hasPicture(pic), `${char}: picture ${pic}`);
    assert.equal(label, label.normalize("NFC"));
  }
  assert.equal(pictureOf("অ").label, "অ-তে অজগর");
  assert.equal(pictureOf("৩").pic, "dots3");
  assert.equal(levelOf(0), LEVELS[0]);
  assert.equal(levelOf(99), LEVELS[LEVEL_COUNT - 1]);
});

test("tracing every stroke of every letter along its path completes it, stroke by stroke", () => {
  for (const level of LEVELS.keys()) {
    let round = newRound(level + 1);
    while (!done(round)) {
      const strokes = strokesOf(letterOf(round)).length;
      let events: Event[] = [];
      for (let i = 0; i < strokes; i++) {
        assert.equal(round.stroke, i, `${letterOf(round)} stroke ${i + 1}`);
        const [after, happened] = trace(round);
        events = events.concat(happened);
        round = after;
      }
      assert.deepEqual(events, [...Array(strokes - 1).fill("stroke"), "letter"], letterOf(round));
      assert.ok(round.letterDone);
      round = nextLetter(round);
    }
    assert.equal(round.helps, 0);
  }
});

test("direction counts: starting at the wrong end or scribbling elsewhere never fills a stroke", () => {
  const round = newRound(1), stroke = strokeOf(round)!;
  const end = stroke.samples[stroke.samples.length - 1];
  let [now] = down(round, end);
  [now] = move(now, end, stroke.samples[0]);
  assert.ok(now.reach < fullAt(stroke), "backwards does not finish");
  assert.equal(advance(stroke, 0, end, TOLERANCE[1]), 0, "the far end is out of reach at the start");
  assert.ok(advance(stroke, 0, stroke.samples[LOOKAHEAD], TOLERANCE[1]) <= LOOKAHEAD);
  assert.equal(nearPath(round, [0, 99]), false, "no ink far from the path");
  assert.equal(nearPath(round, stroke.samples[5]), true);
  assert.ok(DONE_AT > 0.5 && DONE_AT < 1);
});

test("difficulty: three tries that go nowhere replay the stroke and widen the path; five clean strokes narrow it", () => {
  let round = newRound(1);
  let event: Event = null;
  for (let i = 0; i < EASE_AFTER; i++) { [round] = down(round, [2, 98]); [round, event] = up(round); }
  assert.equal(event, "help");
  assert.equal(round.pace, 0, "eased");
  assert.equal(round.helps, 1);
  assert.ok(TOLERANCE[0] > TOLERANCE[1] && TOLERANCE[1] > TOLERANCE[2]);

  round = newRound(1, 0);
  const clean = (now: Round) => now.letterDone ? trace(nextLetter(now))[0] : trace(now)[0];
  for (let i = 0; i < HARDEN_AFTER - 1; i++) round = clean(round);
  assert.equal(round.pace, 0);
  round = clean(round);
  assert.equal(round.pace, 1, `a step narrower after ${HARDEN_AFTER} clean strokes`);
  const lifted = up(down(newRound(1), strokeOf(newRound(1))!.samples[0])[0]);
  assert.equal(lifted[0].misses, 1, "a tap without moving is a quiet miss");
  assert.equal(lifted[1], null, "and nothing is announced");
});

test("again and next: the same letter restarts, the round ends after the last letter", () => {
  let round = writeLetter(newRound(11));
  assert.equal(againLetter(round).letterDone, false);
  assert.equal(againLetter(round).index, 0);
  while (!done(round)) { round = nextLetter(round); if (!done(round)) round = writeLetter(round); }
  assert.equal(round.index, round.letters.length);
});

test("stars only record: 3 with at most one replay, 2 up to three, never 0", () => {
  assert.equal(starsOf(0), 3);
  assert.equal(starsOf(1), 3);
  assert.equal(starsOf(2), 2);
  assert.equal(starsOf(3), 2);
  assert.equal(starsOf(4), 1);
  assert.equal(starsOf(40), 1);
});

test("card and end lines carry no name", () => {
  assert.equal(cardLine(["অ", "আ"]), "আজ ২টা বর্ণ আঙুলে লিখলাম");
  assert.equal(cardLine(["১", "২", "৩"]), "আজ ৩টা সংখ্যা আঙুলে লিখলাম");
  assert.equal(cardLine(["ক", "১"]), "আজ ২টা বর্ণ আর সংখ্যা আঙুলে লিখলাম");
  assert.equal(endLine(["য", "র", "ল"]), "৩টা বর্ণ লিখলে: য র ল");
});

test("share never makes a link and has no tally", () => {
  assert.equal(share.normalize("level=1"), null);
  assert.equal(share.normalize(""), null);
  assert.equal(share.tally, undefined);
  assert.ok(share.preview("x").title.length > 0);
});

test("no network: the tool's source never calls fetch or imports share-client", () => {
  const sources = [...files(root), join(root, "../../app/borno-likhi/page.tsx")];
  assert.ok(sources.length >= 10);
  for (const file of sources) {
    const text = readFileSync(file, "utf8");
    assert.doesNotMatch(text, /\bfetch\s*\(/, file);
    assert.doesNotMatch(text, /share-client|ShareBar|sendBeacon|XMLHttpRequest|\/api\//, file);
    assert.doesNotMatch(text, /letter-spacing:\s*[^0]/, file);
    assert.equal(text, text.normalize("NFC"), `${file} is NFC`);
  }
});

test("content meets the SEO limits and the kids' rules", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.ok(site.title.startsWith("অ আ ক খ লেখার নিয়ম"));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.faq.length >= 6);
  assert.equal(site.faq[0].question, "বাংলা বর্ণমালায় কয়টি বর্ণ?");
  assert.match(site.faq[0].answer, /^বাংলা বর্ণমালায় ৫০টা বর্ণ: ১১টা স্বরবর্ণ আর ৩৯টা ব্যঞ্জনবর্ণ।/);
  assert.match(site.faq[1].answer, /^১০টা: এ ঐ ও ঔ ঙ ঞ ৎ ং ঃ ঁ।/);
  const questions = site.faq.map(item => item.question).join(" ");
  for (const must of ["কোন বয়সের", "ইন্টারনেট", "তথ্য", "কতক্ষণ", "খাতায়"]) assert.ok(questions.includes(must), must);
  assert.equal(site.privacy.length, 1);
  assert.ok(site.headline && site.headline !== site.title);
  for (const text of [site.title, site.description, site.lead, site.guideIntro, ...site.steps, ...site.privacy, ...site.faq.flatMap(item => [item.question, item.answer])]) {
    assert.equal(text, text.normalize("NFC"));
    assert.doesNotMatch(text, /আপনি|আপনার|করুন/, "তুমি voice");
    assert.doesNotMatch(text.replaceAll("A4", ""), /[0-9]/, "Bangla digits");
  }
});
