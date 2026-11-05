import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { BANSHI, DHOL, FINGER, ICONS, SOUND_ART, TUNG } from "../lib/art";
import {
  CARD_FOOTER, DEMO, FREQ, MAX_SAVED, NOTES, ROWS, ROW_COLORS, SOUNDS, STEPS_NARROW, STEPS_WIDE, TEMPOS,
  addSaved, cardSub, cardTitle, checkLine, compare, emptyTune, has, methodLine, noteCount, parseTune, readSaved, rowsAt, sameTune, starsOf, toggle,
} from "../lib/music";
import { LEVELS } from "../lib/levels";
import { site } from "../content";
import { share } from "../share";

const nfc = (text: string) => assert.equal(text, text.normalize("NFC"), text);

test("notes: five pentatonic notes, each with a name, a colour and a pitch, low to high", () => {
  assert.deepEqual([...NOTES], ["সা", "রে", "গা", "পা", "ধা"]);
  assert.equal(ROWS, 5);
  assert.equal(FREQ.length, ROWS);
  assert.equal(new Set(ROW_COLORS).size, ROWS);
  for (let i = 1; i < ROWS; i++) assert.ok(FREQ[i] > FREQ[i - 1]);
  // C D E G A: no fourth and no seventh, so no two notes clash.
  assert.deepEqual(FREQ.map(f => Math.round(12 * Math.log2(f / FREQ[0]))), [0, 2, 4, 7, 9]);
  for (const name of [...NOTES, ...SOUNDS.flatMap(s => [s.name, s.at]), ...TEMPOS.map(t => t.name)]) nfc(name);
  assert.equal(SOUND_ART.length, SOUNDS.length);
});

test("tempo: three speeds, and even the fastest lights a cell less than three times a second", () => {
  assert.deepEqual(TEMPOS.map(t => t.name), ["ধীরে", "মাঝারি", "জোরে"]);
  for (let i = 1; i < TEMPOS.length; i++) assert.ok(TEMPOS[i].ms < TEMPOS[i - 1].ms);
  assert.ok(TEMPOS.every(t => 1000 / t.ms < 3));
});

test("the grid: toggle, read back, count and compare tunes", () => {
  let tune = emptyTune(STEPS_NARROW);
  assert.equal(tune.length, 6);
  tune = toggle(tune, 2, 4);
  tune = toggle(tune, 2, 0);
  assert.ok(has(tune, 2, 4) && has(tune, 2, 0) && !has(tune, 2, 1));
  assert.deepEqual(rowsAt(tune[2]), [0, 4]);
  assert.equal(noteCount(tune), 2);
  assert.deepEqual(toggle(toggle(tune, 2, 4), 2, 4), tune);
  assert.deepEqual(parseTune("0 13 . 024"), [1, 10, 0, 21]);
  assert.ok(sameTune(parseTune("0 1"), [1, 2]));
  assert.ok(!sameTune(parseTune("0 1"), parseTune("0 1 .")));
  assert.equal(emptyTune(STEPS_WIDE).length, 8);
});

test("checking a copy: what is right, what is extra, what is missing", () => {
  const target = parseTune("0 1 2 3 . .");
  assert.deepEqual(compare(target, target), { right: 4, extra: 0, missing: 0, done: true });
  const guess = toggle(toggle(target, 0, 0), 5, 4);
  assert.deepEqual(compare(target, guess), { right: 3, extra: 1, missing: 1, done: false });
  assert.equal(checkLine(target, guess), "৪টা নোটের ৩টা মিলেছে। ১টা ঘর বাড়তি, ওটা দুলছে।");
  assert.equal(checkLine(target, toggle(target, 0, 0)), "৪টা নোটের ৩টা মিলেছে। আরও ১টা বাকি। আবার শোনো।");
  assert.equal(checkLine(target, emptyTune(6)), "আগে ঘরে চাপো, তারপর মিলিয়ে দেখো।");
  for (const line of [checkLine(target, guess), checkLine(target, emptyTune(6))]) assert.doesNotMatch(line, /ভুল|হেরে|খারাপ/);
});

test("stars are a record of checks: 3 on the first, 2 on the second, then 1", () => {
  assert.deepEqual([1, 2, 3, 7].map(starsOf), [3, 2, 1, 1]);
  assert.equal(methodLine(1, 6), "একবার শুনেই ৬টা নোট মনে রেখেছ।");
  assert.doesNotMatch(methodLine(1, 4), /একবার শুনেই/, "no praise for the easy ones");
  assert.match(methodLine(3, 5), /^৩ বারে/);
});

test("saved tunes: newest first, six at most, repeats move up, broken storage is ignored", () => {
  let list = readSaved(null);
  assert.deepEqual(list, []);
  for (let i = 0; i < 8; i++) list = addSaved(list, { tune: toggle(emptyTune(6), i % 6, Math.floor(i / 6)), sound: i % 3 });
  assert.equal(list.length, MAX_SAVED);
  assert.ok(has(list[0].tune, 1, 1), "newest first");
  const again = addSaved(list, { tune: list[3].tune, sound: 0 });
  assert.equal(again.length, MAX_SAVED);
  assert.ok(sameTune(again[0].tune, list[3].tune));
  assert.deepEqual(readSaved(JSON.stringify(list)), list);
  assert.deepEqual(readSaved("{oops"), []);
  assert.deepEqual(readSaved('{"a":1}'), []);
  const bad = [{ tune: [1, 2, 3], sound: 0 }, { tune: [99, 0, 0, 0, 0, 0], sound: 0 }, { tune: [1, 0, 0, 0, 0, 0], sound: 7 }, { tune: [1, 0, 0, 0, 0, 0, 0, 2], sound: 2 }, null];
  assert.deepEqual(readSaved(JSON.stringify(bad)), [{ tune: [1, 0, 0, 0, 0, 0, 0, 2], sound: 2 }]);
});

test("the card says what was made with no name", () => {
  assert.equal(cardTitle({ made: 3, matched: 0, last: DEMO }), "আজ ৩টা সুর বানালাম");
  assert.equal(cardTitle({ made: 0, matched: 2, last: DEMO }), "আজ ২টা সুর শুনে মিলিয়ে বাজালাম");
  assert.equal(cardTitle({ made: 1, matched: 4, last: DEMO }), "আজ ১টা সুর বানালাম, ৪টা মেলালাম");
  assert.equal(cardSub(DEMO), "শেষ সুরটা: ৭টা নোট, বাঁশিতে");
  nfc(CARD_FOOTER);
  assert.equal(DEMO.tune.length, STEPS_NARROW);
});

test("pictures are our own inline SVG, with nothing loaded from outside", () => {
  for (const svg of [BANSHI, DHOL, TUNG, FINGER, ...Object.values(ICONS)]) assert.doesNotMatch(svg, /href|url\(|<script|<image|<text/i);
  for (const level of LEVELS) assert.ok(level.icon in ICONS, `level ${level.id} icon`);
});

test("no sharing of tunes: normalize always returns null, and there is no tally", () => {
  for (const state of ["", "t=0.1.2", "s=1&t=3", "og", "x".repeat(500)]) assert.equal(share.normalize(state), null);
  assert.equal(share.tally, undefined);
});

test("the tool never touches the network", () => {
  const files: string[] = [];
  const walk = (dir: string) => { for (const name of readdirSync(dir)) { const path = join(dir, name); if (statSync(path).isDirectory()) { if (name !== "tests") walk(path); } else if (/\.tsx?$/.test(name)) files.push(path); } };
  walk(join(import.meta.dirname, ".."));
  assert.ok(files.length >= 14, `${files.length} files`);
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, /\bfetch\s*\(/, `${file} calls fetch`);
    assert.doesNotMatch(source, /share-client|XMLHttpRequest|sendBeacon|WebSocket|\/api\/|getUserMedia|navigator\.vibrate|new AudioContext/, file);
  }
  const route = readFileSync(join(import.meta.dirname, "../../../app/sur-banai/page.tsx"), "utf8");
  assert.match(route, /tool-sur-banai/);
});

test("only the tune and the stars are stored: the old keys are kept and one new one holds the draft", () => {
  const sources = ["components/game.tsx", "lib/draft.ts"].map(file => readFileSync(join(import.meta.dirname, "..", file), "utf8")).join("\n");
  assert.match(sources, /ektukhani-sur-banai-tunes/);
  assert.match(sources, /ektukhani-sur-banai-draft/);
  assert.match(sources, /useLevels\(SLUG, LEVEL_COUNT\)/);
  assert.match(sources, /SLUG = 'sur-banai'/, "the stars stay at ektukhani-levels-sur-banai");
  const keys = new Set(sources.match(/'ektukhani-[a-z-]+'|"ektukhani-[a-z-]+"/g)?.map(key => key.slice(1, -1)));
  assert.deepEqual([...keys].sort(), ["ektukhani-sur-banai-draft", "ektukhani-sur-banai-tunes"]);
});

test("content: SEO limits and the FAQ parents search for", () => {
  assert.ok(site.title.length <= 45, `title ${site.title.length}`);
  assert.ok(site.title.startsWith("ছোটদের মিউজিক গেম"));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, `description ${site.description.length}`);
  assert.ok(site.faq.length >= 6);
  assert.equal(site.faq[0].question, "সরগমে কয়টি স্বর?");
  assert.match(site.faq[0].answer, /^সাতটা: সা, রে, গা, মা, পা, ধা, নি।/);
  for (const ask of ["কোন বয়সের জন্য?", "ইন্টারনেট লাগে?", "কোনো তথ্য নেওয়া হয়?", "কতক্ষণ খেলবে?", "রাখার আগে পাতা বন্ধ করলে সুর হারায়?"]) assert.ok(site.faq.some(item => item.question === ask), ask);
  assert.equal(new Set(site.faq.map(item => item.question)).size, site.faq.length);
  for (const text of [site.title, site.description, site.headline!, site.lead, site.guideIntro, ...site.steps, ...site.privacy, ...site.faq.flatMap(item => [item.question, item.answer])]) {
    nfc(text);
    assert.doesNotMatch(text, /আপনি|করুন/);
  }
  assert.equal(site.privacy.length, 1);
  assert.notEqual(site.headline, site.title);
  assert.equal(site.slug, "sur-banai");
  assert.equal(site.headline, "ঘরে চেপে সুর বানাও, তারপর বাজাও");
  assert.equal(site.title, "ছোটদের মিউজিক গেম: সুর বানাই");
});
