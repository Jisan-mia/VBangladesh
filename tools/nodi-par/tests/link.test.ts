// Links, words and content. Old links (no `d`) still parse and round-trip byte for byte; the optional `d` carries a non-default mode.
import assert from "node:assert/strict";
import test from "node:test";
import { readLevels, recordLevel } from "../../../shared/game-core";
import { site } from "../content";
import { FINALES, LESSONS, MODES, PLACES, STORY, WORLDS, isFinale, lessonOf, riverName, worldOf } from "../lib/levels";
import {
  bn, compareLine, detailLine, heading, humanLine, nearLine, parseShareHash, previewTitle, riverLabel, secs, shareHash, worldLine, MAX_SPLASHES, type Shared,
} from "../lib/result";
import { levelSeed, mangoCount, minTenths, LEVEL_COUNT, MAX_TENTHS, PAR } from "../lib/river";
import { share } from "../share";

const sample: Shared = { level: 7, seed: levelSeed(7), tenths: 154, mangoes: 2, splashes: 1, name: "রাফি", mode: 1 };
/** A link made by the game before the rewrite: no `d`, keys in this order. */
const OLD = `s=${levelSeed(7)}&t=154&l=7&a=2&p=1&n=${encodeURIComponent("রাফি")}`;

test("an old link still parses, keeps its exact shape, and opens the same river", () => {
  assert.deepEqual(parseShareHash(`#${OLD}`), sample);
  assert.equal(shareHash(sample), OLD, "no d for the default mode: byte for byte");
  assert.equal(share.normalize(OLD), OLD);
  assert.equal(share.preview(OLD).title, "রাফি ১৫.৪ সেকেন্ডে নদী পার হয়েছে। তুমি পারবে?");
  assert.equal(previewTitle({ ...sample, name: "" }), "১৫.৪ সেকেন্ডে নদী পার! তুমি পারবে?");
  assert.ok(share.preview("nonsense").title.length > 10);
  const bare = `s=${levelSeed(1)}&t=40&l=1&a=1&p=0`;
  assert.equal(share.normalize(bare), bare);
});

test("the new d key carries সহজ and কঠিন, is cleaned when it is the default, and rejects anything else", () => {
  for (const mode of [0, 2]) {
    const hash = shareHash({ ...sample, mode });
    assert.equal(hash, `s=${levelSeed(7)}&t=154&l=7&a=2&p=1&d=${mode}&n=${encodeURIComponent("রাফি")}`);
    assert.deepEqual(parseShareHash(hash), { ...sample, mode });
    assert.equal(share.normalize(hash), hash);
  }
  assert.equal(parseShareHash(`${OLD}&d=1`)?.mode, 1);
  assert.equal(share.normalize(`${OLD}&d=1`), OLD, "d=1 is the default: the canonical link has none");
  for (const d of ["3", "-1", "x", "01", "2.0", ""]) assert.equal(parseShareHash(`${OLD}&d=${d}`), null, `d=${d}`);
});

test("challenge links reject anything that doesn't fit its river", () => {
  const bad = [
    `s=${levelSeed(7) + 1}&t=154&l=7&a=2&p=1`, // another seed
    `s=${levelSeed(7)}&t=154&l=31&a=2&p=1`, `s=${levelSeed(7)}&t=154&l=0&a=2&p=1`, `s=${levelSeed(7)}&t=154&a=2&p=1`,
    `s=${levelSeed(7)}&t=${minTenths(7) - 1}&l=7&a=2&p=1`, // faster than one hop a row
    `s=${levelSeed(7)}&t=${MAX_TENTHS + 1}&l=7&a=2&p=1`, `s=${levelSeed(7)}&t=15.4&l=7&a=2&p=1`,
    `s=${levelSeed(7)}&t=154&l=7&a=${mangoCount(7) + 1}&p=1`, `s=${levelSeed(7)}&t=154&l=7&a=-1&p=1`, `s=${levelSeed(7)}&t=154&l=7&a=2`,
    `s=${levelSeed(7)}&t=154&l=7&a=2&p=${MAX_SPLASHES + 1}`, `s=${levelSeed(7)}&t=154&l=7&a=2&p=1e2`, `s=${levelSeed(7)}&t=154&l=07x&a=2&p=1`,
    `s=${levelSeed(7)}&t=154&l=7&a=2&p=1&n=${"x".repeat(700)}`, "", "garbage", "s=<script>",
  ];
  for (const state of bad) { assert.equal(parseShareHash(state), null, state); assert.equal(share.normalize(state), null, state); }
  // Names are cleaned and capped, never trusted.
  const named = parseShareHash(`s=${levelSeed(7)}&t=154&l=7&a=2&p=1&n=${encodeURIComponent("  <b>রাফি</b>‮ আহমেদ খুব লম্বা নাম আরও আরও")}`)!;
  assert.ok(named && [...named.name].length <= 20 && !named.name.includes("‮"));
  // Every river's own link round-trips.
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const own: Shared = { level, seed: levelSeed(level), tenths: PAR[level - 1] * 10, mangoes: mangoCount(level), splashes: 0, name: "", mode: 1 };
    assert.deepEqual(parseShareHash(shareHash(own)), own, `river ${level}`);
  }
});

test("words: labels, bands, comparisons, headings", () => {
  assert.equal(secs(154), "১৫.৪"); assert.equal(secs(7), "০.৭"); assert.equal(bn(30), "৩০");
  assert.equal(riverLabel(7), "নদী ৭ · ওপারে বটতলা");
  assert.equal(PLACES.length, LEVEL_COUNT);
  assert.equal(humanLine({ level: 7, splashes: 0, mangoes: mangoCount(7) }), "একবারও পানিতে পড়োনি, আমও সব তোলা। ব্যাগ শুকনো।");
  assert.equal(humanLine({ level: 7, splashes: 0, mangoes: 0 }), "একবারও পানিতে পড়োনি। স্কুলব্যাগ একদম শুকনো।");
  assert.equal(humanLine({ level: 7, splashes: 1, mangoes: 0 }), "একবার ছপাৎ। গামছায় মুছে আবার লাফ।");
  assert.match(humanLine({ level: 7, splashes: 4, mangoes: 0 }), /^৪ বার পানিতে/);
  assert.match(humanLine({ level: 7, splashes: 9, mangoes: 0 }), /গোসল/);
  assert.equal(detailLine(sample), "আম ২/২ · ১ বার পানিতে");
  assert.equal(compareLine(140, 154, "রাফি"), "রাফির চেয়ে ১.৪ সেকেন্ড আগে পৌঁছালে!");
  assert.equal(compareLine(154, 154, ""), "বন্ধু আর তুমি একদম সমান।");
  assert.match(compareLine(165, 154, "রাফি"), /^আর একটু হলেই! রাফির চেয়ে মাত্র ১.১ সেকেন্ড পিছে।$/);
  assert.match(compareLine(400, 154, "রাফি"), /এগিয়ে/);
  assert.equal(nearLine(PAR[4] * 10 + 24, mangoCount(5), 5), "আর ২.৪ সেকেন্ড আগে পৌঁছালেই আরেকটা তারা।");
  assert.equal(nearLine(PAR[4] * 10, mangoCount(5) - 1, 5), "আর ১টা আম তুললেই আরেকটা তারা।");
  assert.equal(nearLine(10, mangoCount(5), 5), "");
  assert.equal(heading(7, 2), "ঢং! নদী ৭ পার");
  assert.equal(heading(7, 3), "ঢং! নদী ৭ একদম ঠিকঠাক পার");
  assert.equal(heading(10, 1), "খালের মোড় পার!");
  assert.equal(worldLine(7), "");
  for (const level of [10, 20, 30]) assert.ok(worldLine(level).length > 10);
});

test("levels as data: every river has one lesson, three worlds of ten, three named finales", () => {
  assert.equal(LESSONS.length, LEVEL_COUNT);
  assert.equal(new Set(LESSONS).size, LEVEL_COUNT, "no two rivers teach the same line");
  for (let level = 1; level <= LEVEL_COUNT; level++) assert.ok(lessonOf(level).length > 8 && !/[A-Za-z]/.test(lessonOf(level)));
  assert.deepEqual(Object.keys(FINALES).map(Number), [10, 20, 30]);
  assert.deepEqual([worldOf(1), worldOf(10), worldOf(11), worldOf(20), worldOf(21), worldOf(30)], [0, 0, 1, 1, 2, 2]);
  assert.equal(WORLDS.length, 3);
  assert.ok(isFinale(20) && !isFinale(19));
  assert.equal(riverName(10), "খালের মোড়"); assert.equal(riverName(7), "বটতলা");
  assert.equal(STORY.length, 3);
  assert.deepEqual(MODES.map(mode => mode.name), ["সহজ", "স্বাভাবিক", "কঠিন"]);
  for (const mode of MODES) assert.ok(mode.line.length > 5);
});

test("progress goes through the kit's readLevels and recordLevel", () => {
  let stars = readLevels('{"1":3,"2":2,"3":1,"40":3,"x":2,"4":7}', LEVEL_COUNT);
  assert.deepEqual(stars, { 1: 3, 2: 2, 3: 1 });
  stars = recordLevel(recordLevel(stars, 2, 3), 2, 1);
  assert.equal(stars[2], 3, "stars only go up");
});

test("content meets the SEO limits and keeps clear of famous names", () => {
  assert.ok([...site.title].length <= 45, `title ${[...site.title].length}`);
  const description = [...site.description].length;
  assert.ok(description >= 120 && description <= 160, `description ${description}`);
  assert.ok(site.headline && site.headline !== site.title);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.faq.some(item => item.question === "কয়টা লেভেল আছে?"));
  assert.ok(site.faq.some(item => item.answer.includes("পিয়নের সাইকেল")));
  assert.ok(site.steps.length >= 3 && site.privacy.some(line => line.includes("লিংক")));
  const all = JSON.stringify(site) + LESSONS.join("");
  for (const word of ["frogger", "crossy", "ফ্রগার", "ক্রসি", "chicken", "মুরগি", "গাড়ি"]) assert.ok(!all.toLowerCase().includes(word), word);
  for (const line of [site.lead, site.guideIntro, ...site.steps, ...site.faq.map(item => item.answer)]) assert.ok((line.match(/!/g) ?? []).length <= 1, line);
  for (const text of [JSON.stringify(site), LESSONS.join(""), STORY.join(""), Object.values(FINALES).join("")]) assert.equal(text, text.normalize("NFC"));
});
