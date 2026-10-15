import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { makeRng } from "../../../shared/game-core";
import { ICONS, POSES, SCENES, ZONE_GERMS, germ, mouth, svgDocument, toothSide } from "../lib/art";
import { cardData } from "../lib/card-data";
import { FACTS } from "../lib/facts";
import { ASK, MOMENT_IDS, QUESTIONS, choiceCount, choicesFor, shuffle, starsOf } from "../lib/quiz";
import { BRUSH_ZONES, MODES, WASH_STEPS, cardTitle, isBedtime, modeFromHash, modeOf, progressAt, stepAt, totalSeconds } from "../lib/routines";
import { site } from "../content";
import { share } from "../share";

const bn = (n: number) => new Intl.NumberFormat("bn-BD", { useGrouping: false }).format(n);
const nfc = (text: string) => assert.equal(text, text.normalize("NFC"), text);

test("handwashing: WHO's six rubbing steps in order, 20 seconds in all, each with its picture and germs", () => {
  assert.deepEqual(WASH_STEPS.map(step => step.id), ["palms", "backs", "between", "thumbs", "nails", "wrists"]);
  assert.equal(totalSeconds(WASH_STEPS), 20);
  assert.equal(new Set(WASH_STEPS.map(step => step.bn)).size, WASH_STEPS.length);
  for (const step of WASH_STEPS) {
    nfc(step.bn);
    assert.ok(step.seconds >= 3, `${step.id} long enough to do`);
    assert.ok(POSES[step.id].art.includes("hd-glow"), `${step.id} shows the part to wash`);
    assert.equal(POSES[step.id].germs.length, 2);
  }
});

test("brushing: two minutes, upper and lower, outside, inside and chewing sides, then the tongue", () => {
  assert.equal(totalSeconds(BRUSH_ZONES), 120);
  assert.equal(BRUSH_ZONES.length, 7);
  for (const row of ["up", "low"] as const) assert.deepEqual(BRUSH_ZONES.filter(zone => zone.row === row).map(zone => zone.face), ["out", "in", "top"]);
  assert.equal(BRUSH_ZONES.at(-1)!.row, "tongue");
  assert.equal(new Set(BRUSH_ZONES.map(zone => zone.id)).size, 7);
  for (const zone of BRUSH_ZONES) {
    nfc(zone.bn);
    assert.ok(ZONE_GERMS[zone.row], zone.id);
    assert.match(mouth(zone), /hd-glow/);
    assert.match(toothSide(zone.face), /<path|<ellipse/);
  }
  assert.doesNotMatch(mouth(null), /hd-glow/);
});

test("the timer: steps change at the right second, the ring fills, and the end is reached only at the end", () => {
  assert.deepEqual(stepAt(WASH_STEPS, 0), { index: 0, fraction: 0, done: false });
  assert.equal(stepAt(WASH_STEPS, 3.99).index, 0);
  assert.equal(stepAt(WASH_STEPS, 4).index, 1);
  assert.equal(stepAt(WASH_STEPS, 19.9).index, 5);
  assert.equal(stepAt(WASH_STEPS, 19.9).done, false);
  assert.equal(stepAt(WASH_STEPS, 20).done, true);
  assert.equal(stepAt(BRUSH_ZONES, 108).index, 6);
  assert.equal(stepAt(BRUSH_ZONES, 119).done, false);
  assert.equal(stepAt(BRUSH_ZONES, 120).done, true);
  assert.equal(progressAt(WASH_STEPS, 10), 0.5);
  assert.equal(progressAt(WASH_STEPS, 40), 1);
  assert.equal(progressAt(WASH_STEPS, -1), 0);
});

test("the bedtime star: evening in Bangladesh, whatever the phone's time zone", () => {
  assert.equal(isBedtime(new Date("2026-10-15T15:30:00Z")), true, "9:30 pm in Dhaka");
  assert.equal(isBedtime(new Date("2026-10-15T12:00:00Z")), true, "6 pm");
  assert.equal(isBedtime(new Date("2026-10-15T11:59:00Z")), false, "5:59 pm");
  assert.equal(isBedtime(new Date("2026-10-15T01:00:00Z")), false, "7 am");
  assert.equal(isBedtime(new Date("2026-10-15T21:00:00Z")), true, "3 am");
});

test("modes: three, opened by hash, each with a parent fact and a source", () => {
  assert.deepEqual(MODES.map(mode => mode.level), [1, 2, 3]);
  assert.equal(modeFromHash("#m=dat"), "dat");
  assert.equal(modeFromHash("#m=nope"), null);
  assert.equal(modeFromHash(""), null);
  assert.equal(modeOf(null).id, "hat");
  for (const mode of MODES) for (const text of Object.values(FACTS[mode.id])) { nfc(text); assert.ok(text.trim()); }
  assert.match(FACTS.hat.source, /WHO/);
  assert.match(FACTS.hat.source, /PLOS Medicine ২০১১/);
});

test("the quiz: every critical time pictured once, calm wrong picks pictured, no duplicates, NFC Bangla", () => {
  assert.deepEqual(QUESTIONS.map(q => q.right.bn), ["ভাত খাওয়ার আগে", "টয়লেটের পরে", "মাঠে খেলার পরে", "হাঁচি-কাশির পরে", "টিফিন খাওয়ার আগে", "মুরগি-ছাগল ধরার পরে"]);
  nfc(ASK);
  for (const id of MOMENT_IDS) assert.ok(ICONS[id], `picture for ${id}`);
  const rights = new Set(QUESTIONS.map(q => q.right.id));
  for (const q of QUESTIONS) {
    const all = [q.right, ...q.wrong];
    assert.equal(q.wrong.length, 3, q.id);
    assert.equal(new Set(all.map(m => m.id)).size, all.length, q.id);
    assert.equal(new Set(all.map(m => m.bn)).size, all.length, q.id);
    // A wrong pick is never another real time to wash.
    for (const wrong of q.wrong) assert.ok(!rights.has(wrong.id), `${q.id}: ${wrong.id}`);
    for (const text of [q.why, q.hint, ...all.map(m => m.bn)]) { nfc(text); assert.match(text, /[ঀ-৿]/u); }
  }
});

test("no shaming, nothing scary: no 'dirty', no germ with teeth or a frown", () => {
  const words = [ASK, ...QUESTIONS.flatMap(q => [q.why, q.hint, q.right.bn, ...q.wrong.map(w => w.bn)]), ...WASH_STEPS.map(s => s.bn), ...BRUSH_ZONES.map(z => z.bn), ...Object.values(FACTS).flatMap(f => Object.values(f)), ...site.faq.flatMap(f => [f.question, f.answer]), ...site.steps];
  for (const text of words) assert.doesNotMatch(text, /নোংরা|ময়লা হাত|পচা|ভয়|মারা|মরে/, text);
  for (let n = 0; n < 4; n++) assert.doesNotMatch(germ(0, 0, 1, n), /polygon|fangs/);
  for (const svg of [...Object.values(ICONS), ...Object.values(SCENES), ...Object.values(POSES).map(p => p.art)]) assert.doesNotMatch(svg, /href|url\(|<script|<image|<text/i);
});

test("difficulty: three misses in a row eases to two pictures, five right in a row steps up to four", () => {
  assert.equal(choiceCount(0, 0, 4), 3);
  assert.equal(choiceCount(2, 0, 4), 3);
  assert.equal(choiceCount(3, 0, 4), 2);
  assert.equal(choiceCount(0, 4, 4), 3);
  assert.equal(choiceCount(0, 5, 4), 4);
  assert.equal(choiceCount(0, 5, 3), 3);
  for (const seed of [1, 7, 99]) for (const q of QUESTIONS) for (const count of [2, 3, 4]) {
    const choices = choicesFor(q, count, makeRng(seed));
    assert.equal(choices.length, count);
    assert.equal(choices.filter(c => c.id === q.right.id).length, 1);
    assert.equal(new Set(choices.map(c => c.id)).size, count);
  }
  assert.equal(shuffle([1, 2, 3], makeRng(1)).length, 3);
});

test("stars are a record: 3 for five or six right first time, 2 for three or four, 1 for finishing", () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6].map(n => starsOf(n)), [1, 1, 1, 2, 2, 3, 3]);
});

test("the card says what was done, with no name", () => {
  assert.equal(cardTitle("hat", bn), "আজ ২০ সেকেন্ড ধরে ৬ ধাপে হাত ধুলাম");
  assert.equal(cardTitle("dat", bn), "আজ ২ মিনিট ধরে দাঁত মাজলাম");
  assert.equal(cardTitle("kokhon", bn, 6), "আজ হাত ধোয়ার ৬টা সময় চিনলাম");
  assert.equal(cardData("hat", 3, false, bn).tiles.length, 6);
  const night = cardData("dat", 3, true, bn), day = cardData("dat", 3, false, bn);
  assert.equal(night.tiles.length, 8);
  assert.ok(night.badge && !day.badge);
  assert.match(night.tiles.at(-1)!.text, /মিষ্টি খাওয়ার পর মুখ ধোও/);
  assert.equal(cardData("kokhon", 2, false, bn).tiles.length, QUESTIONS.length);
  assert.match(svgDocument("<g/>"), /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
});

test("no sharing of results: normalize always returns null, and there is no tally", () => {
  for (const state of ["", "m=dat", "s=1&t=3", "x".repeat(500)]) assert.equal(share.normalize(state), null);
  assert.equal(share.tally, undefined);
});

test("the tool never touches the network", () => {
  const files: string[] = [];
  const walk = (dir: string) => { for (const name of readdirSync(dir)) { const path = join(dir, name); if (statSync(path).isDirectory()) { if (name !== "tests") walk(path); } else if (/\.tsx?$/.test(name)) files.push(path); } };
  walk(join(import.meta.dirname, ".."));
  assert.ok(files.length >= 12);
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, /\bfetch\s*\(/, `${file} calls fetch`);
    assert.doesNotMatch(source, /share-client|XMLHttpRequest|sendBeacon|WebSocket|\/api\//, file);
  }
});

test("content: SEO limits and the FAQ parents search for", () => {
  assert.ok(site.title.length <= 45, `title ${site.title.length}`);
  assert.ok(site.title.startsWith("হাত ধোয়ার নিয়ম"));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, `description ${site.description.length}`);
  assert.ok(site.faq.length >= 6);
  assert.match(site.faq[0].answer, /^সাবান দিয়ে অন্তত ২০ সেকেন্ড ঘষো/);
  for (const ask of ["কোন বয়সের জন্য?", "ইন্টারনেট লাগে?", "কোনো তথ্য নেওয়া হয়?", "কতক্ষণ খেলবে?"]) assert.ok(site.faq.some(item => item.question === ask), ask);
  for (const text of [site.title, site.description, site.headline!, site.lead, ...site.steps, ...site.privacy, ...site.faq.flatMap(item => [item.question, item.answer])]) {
    nfc(text);
    assert.doesNotMatch(text, /আপনি|করুন/);
  }
  assert.equal(site.privacy.length, 1);
});
