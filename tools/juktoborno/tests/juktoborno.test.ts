import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { site } from "../content";
import { share } from "../share";
import { hasWordPicture } from "../lib/art";
import { cardLine, createRound, tilesFor, type Round, DECOYS } from "../lib/round";
import { ALL_WORDS, HASANTA, SETS, bn, conjunct, equation, graphemes, printItems, shapeNote, splitWord } from "../lib/words";

const root = join(import.meta.dirname, "..");
const files = (dir: string): string[] => readdirSync(dir).flatMap(name => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? (name === "tests" ? [] : files(path)) : [path];
});
const CONSONANTS = new Set([..."কখগঘঙচছজঝঞটঠডঢণতথদধনপফবভমযরলশষসহ"]);

test("every word: NFC, a picture, exactly one যুক্তবর্ণ built from real consonants with হসন্ত, no duplicates", () => {
  assert.equal(ALL_WORDS.length, 34);
  assert.equal(new Set(ALL_WORDS.map(item => item.word)).size, ALL_WORDS.length, "no duplicate words");
  assert.equal(new Set(ALL_WORDS.map(item => item.pic)).size, ALL_WORDS.length, "each picture means one word");
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

test("graphemes keep a যুক্তবর্ণ whole, with its কার: letters render as whole clusters", () => {
  assert.deepEqual(graphemes("পক্ষী"), ["প", "ক্ষী"]);
  assert.deepEqual(graphemes("চন্দ্র"), ["চ", "ন্দ্র"]);
  assert.deepEqual(graphemes("মার্বেল"), ["মা", "র্বে", "ল"]);
  assert.deepEqual(graphemes("ব্যাঙ"), ["ব্যা", "ঙ"]);
  for (const item of ALL_WORDS) {
    const { before, cluster, after } = splitWord(item);
    assert.equal(before + cluster + after, item.word);
    assert.ok(cluster.includes(conjunct(item.parts)), `${item.word}: ${cluster}`);
    assert.ok(!cluster.endsWith(HASANTA));
    for (const piece of graphemes(item.word)) assert.ok(!piece.endsWith(HASANTA) || piece === graphemes(item.word).at(-1), `${item.word}: ${piece}`);
  }
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

test("রেফ and ফলা notes for parents and children", () => {
  assert.match(shapeNote(["র", "য"]), /রেফ/);
  assert.match(shapeNote(["ট", "র"]), /র-ফলা/);
  assert.match(shapeNote(["ন", "দ", "র"]), /র-ফলা/);
  assert.match(shapeNote(["ব", "য"]), /য-ফলা/);
  assert.equal(shapeNote(["ক", "ষ"]), "");
});

test("card line carries no name, and says ভাঙলাম, জুড়লাম or both", () => {
  const steps = (modes: ("bhangi" | "juri")[]) => modes.map(mode => ({ word: ALL_WORDS[0], mode }));
  assert.equal(cardLine(steps(["bhangi", "bhangi", "bhangi", "bhangi", "bhangi", "bhangi"])), "আজ ৬টা যুক্তবর্ণ ভাঙলাম");
  assert.equal(cardLine(steps(["bhangi", "juri", "bhangi", "juri", "bhangi", "juri", "bhangi", "juri"])), "আজ ৮টা যুক্তবর্ণ ভাঙলাম আর জুড়লাম");
  assert.equal(cardLine(steps(["juri", "juri", "juri", "juri", "juri", "juri"])), "আজ ৬টা যুক্তবর্ণ জুড়লাম");
  assert.equal(bn(12), "১২");
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

test("no network and no voice: the tool's source never calls fetch, share-client, speak or speechSynthesis; no per-letter spans", () => {
  const sources = [...files(root), join(root, "../../app/juktoborno/page.tsx")];
  assert.ok(sources.length >= 14);
  for (const file of sources) {
    const text = readFileSync(file, "utf8");
    assert.doesNotMatch(text, /\bfetch\s*\(/, file);
    assert.doesNotMatch(text, /share-client|ShareBar|sendBeacon|XMLHttpRequest|\/api\//, file);
    assert.doesNotMatch(text, /\bspeak\s*\(|SpeakButton|speechSynthesis|useBanglaVoice/, `${file}: no voice anywhere`);
    assert.doesNotMatch(text, /letter-spacing:\s*[^0]/, file);
    assert.doesNotMatch(text, /\.split\(""\)/, `${file}: split words with Intl.Segmenter`);
    assert.equal(text, text.normalize("NFC"), `${file} is NFC`);
  }
});

test("only progress is stored: levels, the খাতা; nothing a child typed, no name, no free text input", () => {
  const sources = files(root).map(file => readFileSync(file, "utf8")).join("\n");
  const keys = [...sources.matchAll(/ektukhani-[a-z-]+/g)].map(match => match[0]);
  // The stars live under ektukhani-levels-juktoborno, written by useLevels; the খাতা under its own key.
  assert.deepEqual([...new Set(keys)].sort(), ["ektukhani-juktoborno-book", "ektukhani-levels-juktoborno"]);
  assert.doesNotMatch(sources, /<input|<textarea|contentEditable/);
  assert.doesNotMatch(sources, /navigator\.(geolocation|mediaDevices)/);
});

test("the page uses the kids' player frame, the parent note, and no outbound link", () => {
  const page = readFileSync(join(root, "page.tsx"), "utf8");
  assert.match(page, /<GamePage site=\{site\} kids /);
  assert.match(page, /note=\{<ParentNote/);
  assert.doesNotMatch(page, /PageFrame|href="http/);
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
  assert.equal(site.headline, "যুক্তবর্ণ ভাঙি, আবার জুড়ি");
  for (const text of [site.title, site.description, site.lead, site.guideIntro, ...site.steps, ...site.privacy, ...site.faq.flatMap(item => [item.question, item.answer])]) {
    assert.equal(text, text.normalize("NFC"));
    assert.doesNotMatch(text, /আপনি|আপনার|করুন/, "তুমি voice");
  }
  assert.doesNotMatch(site.faq.map(item => item.answer).join(" "), /কণ্ঠ থাকলে তবেই|পড়ে শোনায়/, "no spoken word any more");
});

test("a round is made of whole words from its set", () => {
  const round: Round = createRound(5, 42);
  assert.equal(round.steps.length, 6);
  assert.ok(round.steps.every(step => SETS.tricky.words.includes(step.word)));
});
