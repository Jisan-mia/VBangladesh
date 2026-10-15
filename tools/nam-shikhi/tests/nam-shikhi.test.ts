import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { makeRng } from "../../../shared/game-core";
import { ART, BODY, SPLAT, VIEWS, artMarkup, svgDocument } from "../lib/art";
import { HABITATS, LEVEL_TITLE, PACKS, packFromHash, packOf } from "../lib/packs";
import {
  QUESTIONS, answerOf, askable, cardCell, cardTitle, choiceCount, choicesFor, firstOpenLevel, isSpot, learnedLine, planRound, promptOf, shuffle, spotAt, spotPercent, starsOf,
} from "../lib/round";
import { site } from "../content";
import { share } from "../share";

const bn = (n: number) => new Intl.NumberFormat("bn-BD").format(n);
const seeds = Array.from({ length: 40 }, (_, index) => 1 + index * 7919);

test("every item has a picture, a Bangla and an English name; NFC, no duplicates within a pack", () => {
  for (const pack of PACKS) {
    assert.ok(pack.items.length >= 7, pack.id);
    for (const key of ["id", "bn", "en"] as const) assert.equal(new Set(pack.items.map(item => item[key])).size, pack.items.length, `${pack.id} ${key} unique`);
    for (const item of pack.items) {
      assert.ok(artMarkup(item.art) || item.art === "body", `${pack.id}/${item.id} has a picture`);
      assert.equal(item.bn, item.bn.normalize("NFC"), item.bn);
      assert.match(item.bn, /^[ঀ-৿ ]+$/u, `${item.bn} is Bangla`);
      assert.match(item.en, /^[A-Z][a-z]*( [a-z]+| Bengal [a-z]+)*$/, `${item.en} is plain English, first letter capital`);
      for (const text of [item.fact, item.role, item.thing?.bn]) if (text) assert.equal(text, text.normalize("NFC"));
    }
    assert.ok(pack.levels.length >= 3, pack.id);
    for (const mode of pack.levels) assert.ok(askable(pack, mode).length >= QUESTIONS, `${pack.id} ${mode} has enough items`);
  }
});

test("the names the owner asked for, spelt the standard way", () => {
  const en = (pack: string, id: string) => packOf(pack as never).items.find(item => item.id === id)?.en;
  assert.equal(en("fol", "jackfruit"), "Jackfruit");
  assert.equal(en("fol", "guava"), "Guava");
  assert.equal(en("sobji", "korola"), "Bitter gourd");
  assert.equal(en("sobji", "morich"), "Green chilli");
  assert.equal(en("protik", "shapla"), "Water lily");
  assert.equal(en("protik", "doyel"), "Magpie robin");
  assert.equal(en("protik", "ilish"), "Hilsa");
  assert.equal(en("rong", "nil"), "Blue");
  assert.deepEqual(packOf("protik").items.map(item => item.role), ["জাতীয় ফুল", "জাতীয় পাখি", "জাতীয় মাছ", "জাতীয় ফল", "জাতীয় পশু", "জাতীয় গাছ", "জাতীয় পতাকা"]);
});

test("habitats: every animal in the habitat round has one home, and the drawings exist", () => {
  for (const home of HABITATS) { assert.ok(ART[home.id], home.id); assert.equal(home.at, home.at.normalize("NFC")); }
  const pashu = packOf("pashu");
  const homed = askable(pashu, "home");
  assert.ok(homed.length >= 10);
  assert.equal(pashu.items.find(item => item.id === "tiger")?.home, "sundarban");
  assert.equal(pashu.items.find(item => item.id === "camel")?.home, "desert");
  assert.equal(pashu.items.find(item => item.id === "penguin")?.home, "ice");
  for (const item of homed) {
    assert.ok(item.fact, `${item.id} has a fact`);
    assert.ok(!item.also?.includes(item.home!), item.id);
  }
});

test("colours: every splat has a fill, and a colour's thing is drawn", () => {
  for (const item of packOf("rong").items) {
    assert.ok(SPLAT[item.id], item.id);
    if (item.thing) assert.ok(ART[item.thing.art], item.thing.art);
  }
});

test("the body figure: each part's spots sit in its view, and a tap finds the nearest part", () => {
  const shorir = packOf("shorir");
  for (const item of shorir.items) {
    assert.ok(item.view && item.spots?.length, item.id);
    for (const [x, y] of item.spots!) assert.equal(spotAt(shorir, item.view!, x, y)?.id, item.id, `${item.id} at its own spot`);
  }
  assert.equal(spotAt(shorir, "face", 60, 47)?.id, "nose");
  assert.equal(spotAt(shorir, "face", 68, 39)?.id, "eye");
  assert.equal(spotAt(shorir, "body", 70, 180)?.id, "foot");
  assert.equal(spotAt(shorir, "body", 60, 45), null, "a face tap in the whole-body view finds no face part");
  assert.equal(spotAt(shorir, "face", 5, 5), null, "outside the view");
  assert.deepEqual(spotPercent("face", [60, 42]), { left: "50%", top: "50%" });
  assert.ok(BODY.includes("<circle") && VIEWS.body === "0 0 120 200");
});

test("art: a standalone SVG document for the card, and no external references anywhere", () => {
  for (const id of Object.keys(ART)) assert.doesNotMatch(ART[id], /href|url\(|<script|<image/i, id);
  assert.match(svgDocument("mango"), /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(svgDocument("lal"), /#e53935/);
});

test("a round: six different questions, the answer always among the choices, no repeated choice", () => {
  for (const pack of PACKS) for (const mode of pack.levels) for (const seed of seeds) {
    const rng = makeRng(seed), targets = planRound(pack, mode, rng);
    assert.equal(targets.length, QUESTIONS);
    assert.equal(new Set(targets.map(item => item.id)).size, QUESTIONS);
    for (const target of targets) for (const count of [2, 3, 4]) {
      const choices = choicesFor(pack, mode, target, count, rng);
      if (isSpot(pack, mode)) { assert.equal(choices.length, 0); continue; }
      assert.equal(choices.length, count, `${pack.id} ${mode} ${count}`);
      assert.equal(new Set(choices.map(choice => choice.id)).size, count);
      assert.equal(choices.filter(choice => choice.id === answerOf(mode, target)).length, 1);
      if (mode === "home") for (const choice of choices) assert.ok(choice.id === target.home || !target.also?.includes(choice.id as never), `${target.id} never shows a place it also lives`);
    }
  }
});

test("the habitat round spreads its homes", () => {
  for (const seed of seeds) {
    const homes = new Set(planRound(packOf("pashu"), "home", makeRng(seed)).map(item => item.home));
    assert.ok(homes.size >= 5, `${homes.size} homes`);
  }
});

test("difficulty: three misses in a row eases to two pictures, five right in a row steps up to four", () => {
  assert.equal(choiceCount(0, 0), 3);
  assert.equal(choiceCount(2, 0), 3);
  assert.equal(choiceCount(3, 0), 2);
  assert.equal(choiceCount(4, 0), 2);
  assert.equal(choiceCount(0, 4), 3);
  assert.equal(choiceCount(0, 5), 4);
  assert.equal(choiceCount(0, 9), 4);
});

test("stars are a record: 3 for 5–6 right first time, 2 for 3–4, 1 for finishing", () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6].map(n => starsOf(n)), [1, 1, 1, 2, 2, 3, 3]);
  assert.equal(firstOpenLevel({}, 4), 1);
  assert.equal(firstOpenLevel({ 1: 3 }, 4), 2);
  assert.equal(firstOpenLevel({ 1: 3, 2: 1, 3: 2, 4: 3 }, 4), 1);
  assert.equal(firstOpenLevel({ 1: 2, 2: 2 }, 3), 3);
});

test("prompts, learned lines and the card", () => {
  const pashu = packOf("pashu"), camel = pashu.items.find(item => item.id === "camel")!;
  assert.deepEqual(learnedLine("home", camel), { main: "উট থাকে মরুভূমিতে", sub: camel.fact });
  assert.equal(promptOf("en", camel, false).word, "Camel");
  assert.equal(promptOf("bn", camel, true).ask, "কোথায়?");
  const red = packOf("rong").items[0];
  assert.equal(learnedLine("thing", red).main, "টমেটো লাল");
  assert.equal(cardCell("thing", red).art, "tomato");
  assert.equal(cardTitle(packOf("fol"), "bn", 6, bn), "আজ ৬টা ফলের নাম শিখলাম");
  assert.equal(cardTitle(packOf("fol"), "en", 6, bn), "আজ ৬টা ফলের ইংরেজি নাম শিখলাম");
  assert.equal(cardTitle(packOf("shorir"), "bn", 6, bn), "আজ শরীরের ৬টা অঙ্গের নাম শিখলাম");
  for (const pack of PACKS) for (const mode of pack.levels) assert.ok(LEVEL_TITLE[mode]);
});

test("a pack opens by hash", () => {
  assert.equal(packFromHash("#p=fol"), "fol");
  assert.equal(packFromHash("#p=protik"), "protik");
  assert.equal(packFromHash("#p=nope"), null);
  assert.equal(packFromHash(""), null);
  assert.equal(packOf(null).id, "pashu");
  assert.equal(shuffle([1, 2, 3], makeRng(1)).length, 3);
});

test("no sharing of results: normalize always returns null, and there is no tally", () => {
  for (const state of ["", "p=fol", "s=1&t=3", "x".repeat(500)]) assert.equal(share.normalize(state), null);
  assert.equal(share.tally, undefined);
});

test("the tool never touches the network", () => {
  const files: string[] = [];
  const walk = (dir: string) => { for (const name of readdirSync(dir)) { const path = join(dir, name); if (statSync(path).isDirectory()) { if (name !== "tests") walk(path); } else if (/\.tsx?$/.test(name)) files.push(path); } };
  walk(join(import.meta.dirname, ".."));
  assert.ok(files.length >= 7);
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, /\bfetch\s*\(/, `${file} calls fetch`);
    assert.doesNotMatch(source, /share-client|XMLHttpRequest|sendBeacon|WebSocket|\/api\//, file);
  }
});

test("content: SEO limits and the FAQ the parents search for", () => {
  assert.ok(site.title.length <= 45, `title ${site.title.length}`);
  assert.ok(site.title.startsWith("পশুপাখির নাম বাংলা ও ইংরেজি"));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, `description ${site.description.length}`);
  assert.ok(site.faq.length >= 6);
  assert.match(site.faq[0].answer, /^বিড়াল \(Cat\), কুকুর \(Dog\)/);
  for (const ask of ["কোন বয়সের জন্য?", "ইন্টারনেট লাগে?", "কোনো তথ্য নেওয়া হয়?", "কতক্ষণ খেলবে?"]) assert.ok(site.faq.some(item => item.question === ask), ask);
  for (const text of [site.title, site.description, site.headline!, site.lead, ...site.steps, ...site.privacy, ...site.faq.flatMap(item => [item.question, item.answer])]) {
    assert.equal(text, text.normalize("NFC"));
    assert.doesNotMatch(text, /আপনি|করুন/);
  }
  assert.equal(site.privacy.length, 1);
});
