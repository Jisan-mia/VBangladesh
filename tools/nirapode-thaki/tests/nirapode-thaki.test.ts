import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { ICONS, SCENES, sceneMarkup, svgDocument } from "../lib/art";
import { SETS, setFromHash, setOf } from "../lib/sets";
import { readLevels } from "../../../shared/game-core";
import { site } from "../content";
import { share } from "../share";

const bn = (n: number) => new Intl.NumberFormat("bn-BD").format(n);
const nfc = (text: string) => assert.equal(text, text.normalize("NFC"), text);

test("six scene sets in the order of the brief, each with a picture, a parent line and five questions", () => {
  assert.deepEqual(SETS.map(item => item.bn), ["রাস্তা পার", "পুকুরঘাট", "চুলা আর গরম জিনিস", "ঘুড়ি আর তার", "মেলায় হারিয়ে গেলে", "ঝড়-বজ্রপাত"]);
  for (const item of SETS) {
    assert.ok(SCENES[item.scene], `${item.id} scene`);
    assert.ok(ICONS[item.icon], `${item.id} icon`);
    assert.equal(item.questions.length, 5, item.id);
    for (const text of [item.bn, item.rules, item.away, item.parent.fact, item.parent.action, item.parent.source]) { nfc(text); assert.ok(text.trim()); }
    assert.equal(new Set(item.questions.map(q => q.id)).size, item.questions.length, `${item.id} question ids`);
  }
});

test("every question: a pictured safe answer, three wrong pictures, no duplicates, NFC Bangla", () => {
  for (const item of SETS) for (const q of item.questions) {
    const all = [q.right, ...q.wrong];
    assert.ok(q.wrong.length >= 3, `${item.id}/${q.id} has three wrong pictures`);
    assert.equal(new Set(all.map(choice => choice.id)).size, all.length, `${item.id}/${q.id} ids`);
    assert.equal(new Set(all.map(choice => choice.bn)).size, all.length, `${item.id}/${q.id} labels`);
    assert.equal(new Set(all.map(choice => choice.icon)).size, all.length, `${item.id}/${q.id} pictures`);
    for (const choice of all) { assert.ok(ICONS[choice.icon], `${item.id}/${q.id}/${choice.id} icon ${choice.icon}`); nfc(choice.bn); }
    for (const text of [q.ask, q.why, q.hint, q.rule]) { nfc(text); assert.match(text, /[ঀ-৿]/u); }
    if (q.prop) assert.ok(ICONS[q.prop.icon], `${q.id} prop`);
  }
});

test("the safety facts the brief asks for are the answers", () => {
  const right = (set: string, id: string) => setOf(set).questions.find(q => q.id === id)!.right.bn;
  assert.equal(right("rasta", "first-look"), "ডানে তাকাও", "Bangladesh drives on the left, so look right first");
  assert.equal(right("rasta", "again-right"), "আবার ডানে তাকাও");
  assert.match(right("pukur", "with-whom"), /বড়/);
  assert.match(right("pukur", "shout"), /ডাকো/);
  assert.match(right("pukur", "reach"), /বাঁশ.*গামছা/);
  assert.match(right("pukur", "bottle"), /ছুড়ে/);
  assert.match(right("chula", "cool"), /ঠান্ডা পানি/);
  assert.match(right("ghuri", "stuck"), /ছেড়ে দাও/);
  assert.match(right("mela", "lost"), /সেখানেই দাঁড়াও/);
  assert.match(right("mela", "ask"), /মা/);
  assert.match(right("jhor", "field"), /পাকা দালান/);
  // Never "jump in" as a safe answer, anywhere.
  for (const item of SETS) for (const q of item.questions) assert.doesNotMatch(q.right.bn, /লাফ|নেমে|নামো/, `${item.id}/${q.id}`);
});

test("no harm in the words or the pictures: safe actions only", () => {
  const harm = /ডুবে|ডুবছে|মারা|মৃত|রক্ত|আহত|দুর্ঘটনা|পুড়ে গেছে|আগুন লেগেছে|ধাক্কা/;
  for (const item of SETS) for (const q of item.questions) for (const text of [q.ask, q.why, q.hint, q.rule, q.right.bn, ...q.wrong.map(w => w.bn)]) assert.doesNotMatch(text, harm, text);
  for (const [id, svg] of [...Object.entries(ICONS), ...Object.entries(SCENES)]) assert.doesNotMatch(svg, /href|url\(|<script|<image|<text/i, id);
});

test("art: a standalone SVG document for the card, and a prop drawn on its scene", () => {
  assert.match(svgDocument("zebra"), /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.ok(sceneMarkup("road", { icon: "ball", x: 10, y: 10, size: 20 }).endsWith("</g>"));
  assert.notEqual(ICONS["look-left"], ICONS["look-right"]);
});

test("a set opens by hash", () => {
  assert.equal(setFromHash("#s=jhor"), "jhor");
  assert.equal(setFromHash("#s=nope"), null);
  assert.equal(setFromHash(""), null);
  assert.equal(setOf(null).id, "rasta");
});

test("saved stars from before the rewrite still read, and the three finales are new ids", () => {
  assert.deepEqual(readLevels('{"1":3,"2":2,"6":1}', 9), { 1: 3, 2: 2, 6: 1 });
  assert.deepEqual(readLevels('{"7":2,"9":3,"10":1}', 9), { 7: 2, 9: 3 }, "ids past the last level are dropped");
});

test("no sharing of results: normalize always returns null, and there is no tally", () => {
  for (const state of ["", "s=jhor", "s=1&t=3", "x".repeat(500)]) assert.equal(share.normalize(state), null);
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
    assert.doesNotMatch(source, /share-client|XMLHttpRequest|sendBeacon|WebSocket|\/api\//, file);
  }
});

test("content: SEO limits and the FAQ parents search for", () => {
  assert.ok(site.title.length <= 45, `title ${site.title.length}`);
  assert.ok(site.title.startsWith("রাস্তা পারাপারের নিয়ম"));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, `description ${site.description.length}`);
  assert.ok(site.faq.length >= 6);
  assert.match(site.faq[0].answer, /^আগে ডানে তাকাও, তারপর বামে, তারপর আবার ডানে/);
  for (const ask of ["কোন বয়সের জন্য?", "ইন্টারনেট লাগে?", "কোনো তথ্য নেওয়া হয়?", "কতক্ষণ খেলবে?"]) assert.ok(site.faq.some(item => item.question === ask), ask);
  for (const text of [site.title, site.description, site.headline!, site.lead, ...site.steps, ...site.privacy, ...site.faq.flatMap(item => [item.question, item.answer])]) {
    nfc(text);
    assert.doesNotMatch(text, /আপনি|করুন/);
  }
  assert.equal(site.privacy.length, 1);
});

test("no voice anywhere (bug 1, SilentWhenMuted): the game never calls speak, SpeakButton or speechSynthesis", () => {
  const files: string[] = [];
  const walk = (dir: string) => { for (const name of readdirSync(dir)) { const path = join(dir, name); if (statSync(path).isDirectory()) { if (name !== "tests") walk(path); } else if (/\.tsx?$/.test(name)) files.push(path); } };
  walk(join(import.meta.dirname, ".."));
  for (const file of files) assert.doesNotMatch(readFileSync(file, "utf8"), /\bspeak\s*\(|SpeakButton|speechSynthesis|SpeechSynthesisUtterance|useBanglaVoice/, file);
});

test("the page is the shared player with the kids' frame, and no child-facing link leaves it (bug 3, ParentGate)", () => {
  const page = readFileSync(join(import.meta.dirname, "..", "page.tsx"), "utf8");
  assert.match(page, /<GamePage[^>]*\bkids\b/);
  assert.doesNotMatch(page, /PageFrame|<a\b|href=/, "the page itself links nowhere");
  const game = readdirSync(join(import.meta.dirname, "..", "components")).map(name => readFileSync(join(import.meta.dirname, "..", "components", name), "utf8")).join("\n");
  assert.doesNotMatch(game, /href=|<a\b|location\.(href|assign|replace)|window\.open/, "the game links nowhere");
  assert.doesNotMatch(game, /location\.hash\s*=|history\.pushState|\.scrollIntoView/, "no hash writes, no history pushes, no scrolling the page");
});

test("old links parse and nothing is written to the address bar", () => {
  const game = readFileSync(join(import.meta.dirname, "..", "components", "game.tsx"), "utf8");
  assert.doesNotMatch(game, /replaceState|hashchange/);
});
