import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { makeRng } from "../../../shared/game-core";
import { FOOTER } from "../lib/draw-card";
import { LEVELS, LEVEL_COUNT, OG_DEMO, ROUND, cardTitle, choiceCount, choicesFor, isOgHash, levelOf, roundTargets, starsOf, turnCss, turnFor } from "../lib/game";
import { FAMILIES, SHAPES, shapeOf, svgDocument } from "../lib/shapes";
import { site } from "../content";
import { share } from "../share";

const bn = (n: number) => new Intl.NumberFormat("bn-BD", { useGrouping: false }).format(n);
const nfc = (text: string) => assert.equal(text, text.normalize("NFC"), text);

test("objects: 25–30, each with its own drawing and Bangla name, no duplicates, NFC", () => {
  assert.ok(SHAPES.length >= 25 && SHAPES.length <= 30, `${SHAPES.length} objects`);
  assert.equal(new Set(SHAPES.map(s => s.id)).size, SHAPES.length);
  assert.equal(new Set(SHAPES.map(s => s.bn)).size, SHAPES.length);
  assert.equal(new Set(SHAPES.map(s => s.art)).size, SHAPES.length);
  for (const id of ["hati", "riksha", "jirafa", "chhata", "has", "nouka", "ghuri", "biral", "morog", "cup", "saikel", "ut", "penguin", "talgach", "hariken", "rocket"]) assert.ok(shapeOf(id), id);
  for (const shape of SHAPES) {
    nfc(shape.bn);
    assert.match(shape.bn, /^[ঀ-৿ -]+$/u, shape.bn);
    assert.match(shape.art, /<(path|ellipse|circle|rect)/, shape.id);
    // Our own markup only: nothing linked, no text a shadow would give away.
    assert.doesNotMatch(shape.art, /href|url\(|<script|<image|<text|<use/i, shape.id);
    assert.ok(FAMILIES.includes(shape.family), shape.id);
  }
  assert.match(svgDocument(SHAPES[0].art), /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 100 100"/);
});

test("families: each has at least four objects, so the look-closely level can offer four alike", () => {
  for (const family of FAMILIES) assert.ok(SHAPES.filter(s => s.family === family).length >= 4, family);
});

test("levels: 2 → 3 → 4 pictures, then look-alikes, then turned shadows", () => {
  assert.equal(LEVEL_COUNT, 5);
  assert.deepEqual(LEVELS.map(l => l.choices), [2, 3, 4, 3, 3]);
  assert.deepEqual(LEVELS.map(l => l.kin), [false, false, false, true, false]);
  assert.deepEqual(LEVELS.map(l => l.turned), [false, false, false, false, true]);
  assert.equal(levelOf(0).level, 1);
  assert.equal(levelOf(99).level, 5);
  assert.equal(levelOf(Number.NaN).level, 1);
});

test("a round: six different objects", () => {
  for (const seed of [1, 2, 3, 42]) {
    const targets = roundTargets(makeRng(seed));
    assert.equal(targets.length, ROUND);
    assert.equal(new Set(targets.map(t => t.id)).size, ROUND);
  }
});

test("choices: one right answer, no repeats; other families early on, the same family on the look-closely level", () => {
  for (const seed of [1, 7, 99]) for (const target of SHAPES) for (const count of [2, 3, 4]) {
    const rng = makeRng(seed);
    for (const kin of [false, true]) {
      const choices = choicesFor(target, count, kin, rng);
      assert.equal(choices.length, count);
      assert.equal(choices.filter(c => c.id === target.id).length, 1);
      assert.equal(new Set(choices.map(c => c.id)).size, count);
      for (const other of choices.filter(c => c.id !== target.id)) assert.equal(other.family === target.family, kin, `${target.id} vs ${other.id}`);
    }
  }
});

test("difficulty: three misses in a row eases by one picture, five right in a row adds one, always 2–4", () => {
  assert.equal(choiceCount(3, 0, 0), 3);
  assert.equal(choiceCount(3, 2, 0), 3);
  assert.equal(choiceCount(3, 3, 0), 2);
  assert.equal(choiceCount(3, 0, 4), 3);
  assert.equal(choiceCount(3, 0, 5), 4);
  assert.equal(choiceCount(2, 3, 0), 2);
  assert.equal(choiceCount(4, 0, 5), 4);
});

test("turned shadows only on the last level, and every turn has its CSS", () => {
  const rng = makeRng(5);
  for (let i = 0; i < 40; i++) assert.equal(turnFor(false, rng), "none");
  const seen = new Set(Array.from({ length: 200 }, () => turnFor(true, rng)));
  assert.deepEqual([...seen].sort(), ["flip", "r180", "r270", "r90"]);
  for (const turn of seen) assert.ok(turnCss[turn]);
});

test("stars are a record: 3 for five or six on the first tap, 2 for three or four, 1 for finishing", () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6].map(starsOf), [1, 1, 1, 2, 2, 3, 3]);
});

test("the card says what was done, with no name; the #og demo is fixed and real", () => {
  assert.equal(cardTitle(6, bn), "আজ ৬টা ছায়া মেলালাম");
  nfc(FOOTER);
  assert.ok(isOgHash("#og"));
  assert.ok(!isOgHash("#og=1") && !isOgHash(""));
  assert.equal(OG_DEMO.ids.length, ROUND);
  for (const id of OG_DEMO.ids) assert.ok(shapeOf(id), id);
});

test("no sharing of results: normalize always returns null, and there is no tally", () => {
  for (const state of ["", "l=3", "s=1&t=3", "x".repeat(500)]) assert.equal(share.normalize(state), null);
  assert.equal(share.tally, undefined);
});

test("the tool never touches the network", () => {
  const files: string[] = [];
  const walk = (dir: string) => { for (const name of readdirSync(dir)) { const path = join(dir, name); if (statSync(path).isDirectory()) { if (name !== "tests") walk(path); } else if (/\.tsx?$/.test(name)) files.push(path); } };
  walk(join(import.meta.dirname, ".."));
  assert.ok(files.length >= 8);
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, /\bfetch\s*\(/, `${file} calls fetch`);
    assert.doesNotMatch(source, /share-client|ShareBar|XMLHttpRequest|sendBeacon|WebSocket|\/api\//, file);
  }
});

test("content: SEO limits and the FAQ parents search for", () => {
  assert.ok(site.title.length <= 45, `title ${site.title.length}`);
  assert.ok(site.title.startsWith("বাচ্চাদের শিক্ষামূলক খেলা"));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, `description ${site.description.length}`);
  assert.ok(site.faq.length >= 6);
  assert.equal(site.faq[0].question, "ছায়া কাকে বলে?");
  assert.match(site.faq[0].answer, /^আলোর পথে কোনো জিনিস দাঁড়ালে/);
  for (const ask of ["কোন বয়সের জন্য?", "ইন্টারনেট লাগে?", "কোনো তথ্য নেওয়া হয়?", "কতক্ষণ খেলবে?"]) assert.ok(site.faq.some(item => item.question === ask), ask);
  for (const text of [site.title, site.description, site.headline!, site.lead, ...site.steps, ...site.privacy, ...site.faq.flatMap(item => [item.question, item.answer])]) {
    nfc(text);
    assert.doesNotMatch(text, /আপনি|করুন/);
  }
  assert.equal(site.privacy.length, 1);
});
