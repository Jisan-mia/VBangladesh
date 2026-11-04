import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { ART, BODY, PEEK, SPLAT, VIEWS, artMarkup, bushMarkup, svgDocument } from "../lib/art";
import { pageCell, pageTitle, spotAt, spotPercent, learnedLine } from "../lib/book";
import { HABITATS, PACKS, packFromHash, packOf } from "../lib/packs";
import { site } from "../content";
import { share } from "../share";

const bn = (n: number) => new Intl.NumberFormat("bn-BD").format(n);

/** Every source file of the tool except the tests. */
function sources() {
  const files: string[] = [];
  const walk = (dir: string) => { for (const name of readdirSync(dir)) { const path = join(dir, name); if (statSync(path).isDirectory()) { if (name !== "tests") walk(path); } else if (/\.tsx?$/.test(name)) files.push(path); } };
  walk(join(import.meta.dirname, ".."));
  return files;
}

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

test("habitats, colours and the body figure have their drawings and spots", () => {
  for (const home of HABITATS) { assert.ok(ART[home.id], home.id); assert.equal(home.at, home.at.normalize("NFC")); }
  for (const item of packOf("rong").items) { assert.ok(SPLAT[item.id], item.id); if (item.thing) assert.ok(ART[item.thing.art], item.thing.art); }
  const shorir = packOf("shorir");
  for (const item of shorir.items) {
    assert.ok(item.view && item.spots?.length, item.id);
    for (const [x, y] of item.spots!) assert.equal(spotAt(item.view!, x, y)?.id, item.id, `${item.id} at its own spot`);
  }
  assert.equal(spotAt("face", 60, 47)?.id, "nose");
  assert.equal(spotAt("body", 70, 180)?.id, "foot");
  assert.equal(spotAt("body", 60, 45), null, "a face tap in the whole-body view finds no face part");
  assert.equal(spotAt("face", 5, 5), null, "outside the view");
  assert.deepEqual(spotPercent("face", [60, 42]), { left: "50%", top: "50%" });
  assert.ok(BODY.includes("<circle") && VIEWS.body === "0 0 120 200");
});

test("উঁকি: every picture of the peek levels has a bush height, and the bush covers the bottom", () => {
  for (const id of ["pashu", "fol", "sobji", "protik"] as const) for (const item of packOf(id).items) {
    const top = PEEK[item.art];
    assert.ok(top >= 36 && top <= 58, `${item.art} peek ${top}`);
  }
  assert.match(bushMarkup(50), /^<path d="M2 60a9.6/);
});

test("art: a standalone SVG document for the card, and no external references anywhere", () => {
  for (const id of Object.keys(ART)) assert.doesNotMatch(ART[id], /href|url\(|<script|<image/i, id);
  assert.match(svgDocument("mango"), /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(svgDocument("lal"), /#e53935/);
});

test("name tags and the finished page", () => {
  const pashu = packOf("pashu"), camel = pashu.items.find(item => item.id === "camel")!;
  assert.deepEqual(learnedLine({ kind: "home", target: camel }), { main: "উট থাকে মরুভূমিতে", sub: "Camel", fact: camel.fact });
  const red = packOf("rong").items[0];
  assert.equal(learnedLine({ kind: "paint", target: red }).main, "টমেটো লাল");
  assert.equal(pageCell({ kind: "paint", target: red }).art, "tomato");
  assert.equal(pageCell({ kind: "bn", target: red }).art, "lal", "a colour's own sticker is its splat");
  assert.equal(learnedLine({ kind: "role", target: packOf("protik").items[0] }).main, "জাতীয় ফুল শাপলা");
  assert.equal(pageTitle(9, 6, bn), "আজ ৬টা ফলের নাম শিখলাম");
  assert.equal(pageTitle(10, 6, bn), "আজ ৬টা ফলের ইংরেজি নাম শিখলাম");
  assert.equal(pageTitle(3, 6, bn), "আজ জানলাম ৬টা প্রাণী কোথায় থাকে");
  assert.equal(pageTitle(17, 6, bn), "আজ শরীরের ৬টা অঙ্গের নাম শিখলাম");
  assert.equal(pageTitle(22, 6, bn), "আজ ৬টা রং চিনলাম");
});

test("a world opens by hash, as old links did", () => {
  assert.equal(packFromHash("#p=fol"), "fol");
  assert.equal(packFromHash("#p=protik"), "protik");
  assert.equal(packFromHash("#p=nope"), null);
  assert.equal(packFromHash(""), null);
  assert.equal(packOf(null).id, "pashu");
});

test("no sharing of results: normalize always returns null, and there is no tally", () => {
  for (const state of ["", "p=fol", "s=1&t=3", "x".repeat(500)]) assert.equal(share.normalize(state), null);
  assert.equal(share.tally, undefined);
});

test("the tool never touches the network, never speaks, and never pushes history or sets the hash", () => {
  const files = sources();
  assert.ok(files.length >= 10);
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, /\bfetch\s*\(/, `${file} calls fetch`);
    assert.doesNotMatch(source, /share-client|XMLHttpRequest|sendBeacon|WebSocket|\/api\//, file);
    assert.doesNotMatch(source, /\bspeak\(|SpeakButton|speechSynthesis|useBanglaVoice/, `${file} speaks`);
    assert.doesNotMatch(source, /location\.hash\s*=|pushState|history\.replaceState\(null/, `${file} touches history`);
  }
});

test("content: SEO limits, no voice promised, and the FAQ the parents search for", () => {
  assert.ok(site.title.length <= 45, `title ${site.title.length}`);
  assert.ok(site.title.startsWith("পশুপাখির নাম বাংলা ও ইংরেজি"));
  assert.equal(site.headline, "ছবি দেখে নাম শিখি, বাংলা আর ইংরেজিতে");
  assert.ok(site.description.length >= 120 && site.description.length <= 160, `description ${site.description.length}`);
  assert.ok(site.faq.length >= 6);
  assert.match(site.faq[0].answer, /^বিড়াল \(Cat\), কুকুর \(Dog\)/);
  for (const ask of ["কোন বয়সের জন্য?", "ইন্টারনেট লাগে?", "কোনো তথ্য নেওয়া হয়?", "কতক্ষণ খেলবে?", "নামগুলো কি পড়ে শোনায়?"]) assert.ok(site.faq.some(item => item.question === ask), ask);
  assert.match(site.faq.find(item => item.question === "নামগুলো কি পড়ে শোনায়?")!.answer, /^না।/);
  for (const text of [site.title, site.description, site.headline!, site.lead, ...site.steps, ...site.privacy, ...site.faq.flatMap(item => [item.question, item.answer])]) {
    assert.equal(text, text.normalize("NFC"));
    assert.doesNotMatch(text, /আপনি|করুন|স্পিকার|শোনায়, আর/);
  }
  assert.equal(site.privacy.length, 1);
});
