// The planets, the football Sun, the print sheet, the board, the kids' privacy rules and the page's words.
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { site } from "../content";
import { share } from "../share";
import { BOARD, HOME, orbitRadius, parkBeside, spot } from "../lib/board";
import { CLUE } from "../lib/clues";
import { farHint, farReveal, sizeHint, sizeReveal, tourHint } from "../lib/round";
import {
  earthsInside, footballScale, mmLabel, metreLabel, nearestThing, planetOf, PLANETS, printMm, PRINT_EARTH_MM, SATURN_RING, SUN_KM, THINGS, ZONES, zoneOf,
} from "../lib/planets";

const nfc = (text: string) => assert.equal(text, text.normalize("NFC"), text);
const root = join(import.meta.dirname, "..");
const files = (dir: string): string[] => readdirSync(dir).flatMap(name => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? (name === "tests" ? [] : files(path)) : [path];
});

test("the eight planets, in order from the Sun, with Bangladeshi names, a fact, a clue and a drawing each", () => {
  assert.deepEqual(PLANETS.map(planet => planet.name), ["বুধ", "শুক্র", "পৃথিবী", "মঙ্গল", "বৃহস্পতি", "শনি", "ইউরেনাস", "নেপচুন"]);
  assert.equal(new Set(PLANETS.map(planet => planet.id)).size, 8);
  assert.equal(new Set(PLANETS.map(planet => planet.fact)).size, 8);
  for (const planet of PLANETS) {
    nfc(planet.name); nfc(planet.fact); nfc(CLUE[planet.id]);
    assert.ok(planet.fact.length > 15 && planet.fact.length < 110, planet.fact);
    assert.ok(CLUE[planet.id].length > 3 && CLUE[planet.id].length < 40, CLUE[planet.id]);
    assert.match(planet.color, /^#[0-9a-f]{6}$/); assert.match(planet.shade, /^#[0-9a-f]{6}$/);
    assert.ok(planet.drawR >= 15 && planet.drawR <= 40);
  }
  assert.equal(new Set(Object.values(CLUE)).size, 8, "no two planets share a clue");
  for (let i = 1; i < 8; i++) assert.ok(PLANETS[i].distanceMkm > PLANETS[i - 1].distanceMkm, "ordered by distance");
  // NASA's own sizes: Jupiter biggest, Mercury smallest, Venus nearly Earth's size.
  const bySize = [...PLANETS].sort((a, b) => b.diameterKm - a.diameterKm).map(planet => planet.id);
  assert.deepEqual(bySize, ["jupiter", "saturn", "uranus", "neptune", "earth", "venus", "mars", "mercury"]);
  assert.match(planetOf("jupiter").fact, /১০০০টা পৃথিবী/);
  assert.ok(earthsInside(planetOf("jupiter")) > 1000, "NASA's ‘about 1,000 Earths’ is below the pure volume ratio (~1,300)");
});

test("the football Sun: real ratios, computed and checked", () => {
  const earth = footballScale(planetOf("earth")), neptune = footballScale(planetOf("neptune")), jupiter = footballScale(planetOf("jupiter"));
  assert.ok(Math.abs(earth.sizeMm - 2.02) < 0.02, String(earth.sizeMm));
  assert.ok(Math.abs(earth.distanceM - 23.7) < 0.2, String(earth.distanceM));
  assert.ok(Math.abs(neptune.distanceM - 711.5) < 1, String(neptune.distanceM));
  assert.ok(Math.abs(jupiter.sizeMm - 22.1) < 0.1, String(jupiter.sizeMm));
  assert.ok(Math.abs(earth.sizeMm / 220 - 12_756 / SUN_KM) < 1e-12);
  assert.deepEqual(PLANETS.map(planet => nearestThing(footballScale(planet).sizeMm).id), ["sand", "mustard", "mustard", "sand", "marble", "marble", "pea", "pea"]);
  assert.deepEqual(PLANETS.map(planet => zoneOf(footballScale(planet).distanceM).id), ["field", "field", "field", "field", "street", "street", "far", "far"]);
  assert.equal(mmLabel(earth.sizeMm), "২ মিমি");
  assert.equal(mmLabel(footballScale(planetOf("mercury")).sizeMm), "০.৮ মিমি");
  assert.equal(metreLabel(neptune.distanceM), "৭১২ মিটার");
  assert.equal(THINGS.length, new Set(THINGS.map(thing => thing.id)).size);
  for (const thing of THINGS) nfc(thing.name);
  for (const zone of ZONES) nfc(zone.name);
});

test("hints point the right way and never say ভুল", () => {
  assert.equal(sizeHint(THINGS[4], planetOf("earth")), "আরও ছোট ভাবো।");
  assert.equal(sizeHint(THINGS[0], planetOf("jupiter")), "আরও বড় ভাবো।");
  assert.equal(farHint(ZONES[0], planetOf("neptune")), "আরও দূরে ভাবো।");
  assert.equal(farHint(ZONES[2], planetOf("mars")), "আরও কাছে ভাবো।");
  assert.equal(tourHint("earth", planetOf("mercury")), "বুধ সূর্যের আরও কাছে, ওটা আগে।");
  assert.equal(tourHint("mars", planetOf("venus")), "শুক্র সূর্যের আরও কাছে, ওটা আগে।");
  assert.equal(tourHint("mercury", planetOf("venus")), "আগে শুক্র।");
});

test("the print sheet keeps true ratios and fits A4", () => {
  assert.equal(printMm(12_756), PRINT_EARTH_MM);
  assert.ok(Math.abs(printMm(planetOf("jupiter").diameterKm) - 87.7) < 0.1);
  assert.ok(printMm(planetOf("saturn").diameterKm) * SATURN_RING < 186, "Saturn with its ring fits the 190 mm sheet");
  assert.ok(Math.abs(printMm(SUN_KM) / 10 - 87.3) < 0.1, "the Sun at this scale, in cm");
  assert.equal(sizeReveal(planetOf("earth")), "পৃথিবী হতো ২ মিমি, একটা সরিষার দানার মতো।");
  assert.equal(sizeReveal(planetOf("jupiter")), "বৃহস্পতি হতো ২২ মিমি, একটা মার্বেলের মতো।");
  assert.equal(farReveal(planetOf("earth")), "পৃথিবী থাকত ২৪ মিটার দূরে, মাঠের ভেতরেই।");
});

test("every planet sits on the board, far enough apart for a small finger; the rocket parks in view", () => {
  for (const count of [4, 8] as const) {
    const spots = Array.from({ length: count }, (_, index) => spot(index, count));
    for (const at of spots) {
      assert.ok(at.x >= 40 && at.x <= BOARD.width - 40 && at.y >= 40 && at.y <= BOARD.height - 40, JSON.stringify(at));
      assert.ok(Math.hypot(at.x, at.y) > BOARD.sunR + 30, "clear of the Sun");
    }
    for (let i = 0; i < count; i++) for (let j = i + 1; j < count; j++) {
      assert.ok(Math.hypot(spots[i].x - spots[j].x, spots[i].y - spots[j].y) >= 90, `${count}: ${i}–${j}`);
    }
    for (let index = 0; index < count; index++) {
      const park = parkBeside(index, count, PLANETS[index].drawR);
      assert.ok(park.x > 10 && park.x < BOARD.width - 10 && park.y > 10 && park.y < BOARD.height - 10, `${count}: ${index} ${JSON.stringify(park)}`);
    }
    assert.ok(orbitRadius(count - 1, count) > orbitRadius(0, count));
  }
  assert.ok(HOME.x > 0 && HOME.y > 0);
});

test("kids' rules: no sharing of anything about the child, no network, no free text, no voice", () => {
  assert.equal(share.normalize(""), null);
  assert.equal(share.normalize("level=1&stars=3"), null);
  assert.equal(share.tally, undefined);
  const sources = [...files(root), join(root, "../../app/sourojogot/page.tsx")].filter(path => /\.(tsx?|css)$/.test(path));
  assert.ok(sources.length >= 18);
  for (const path of sources) {
    const code = readFileSync(path, "utf8");
    assert.doesNotMatch(code, /\bfetch\s*\(/, path);
    assert.doesNotMatch(code, /share-client|ShareBar|\/api\//, path);
    assert.doesNotMatch(code, /<input|getUserMedia|geolocation/, path);
    assert.doesNotMatch(code, /speechSynthesis|SpeechSynthesis|\bspeak\s*\(|SpeakButton|useBanglaVoice/, path);
  }
});

test("the page uses the shared player with the kids frame; the game has no toggles of its own", () => {
  const page = readFileSync(join(root, "page.tsx"), "utf8");
  assert.match(page, /<GamePage site=\{site\} kids/);
  assert.match(page, /note=\{<ParentNote/);
  const game = readFileSync(join(root, "components/game.tsx"), "utf8");
  assert.match(game, /useGamePlayer\(\{[\s\S]*onPause[\s\S]*onResume[\s\S]*onRestart[\s\S]*onLevels/);
  assert.doesNotMatch(game, /SoundToggle|setSlow|sj-pill|LevelGrid/, "the player's menu owns sound, ধীরে খেলো and the level list");
  assert.doesNotMatch(game, /location\.hash|pushState/, "never set the hash or push history");
});

test("touch targets: end buttons and the next button are pictures of at least 96 px; nothing under 16 px", () => {
  const css = readFileSync(join(root, "product.css"), "utf8");
  assert.match(css, /\.sj-big\{[^}]*min-height:112px/);
  assert.match(css, /\.sj-next\{[^}]*width:96px;height:96px/);
  assert.match(css, /\.sj-choice\{[^}]*min-height:116px/);
  for (const match of css.matchAll(/font-size:(\d+(?:\.\d+)?)px/g)) assert.ok(Number(match[1]) >= 16, match[0]);
  const end = readFileSync(join(root, "components/end-screen.tsx"), "utf8");
  assert.match(end, /<svg[\s\S]{0,40}viewBox="0 0 48 48"[\s\S]*আবার খেলো[\s\S]*<svg[\s\S]{0,40}viewBox="0 0 48 48"[\s\S]*শেষ/, "আবার খেলো and শেষ are picture buttons, in that order");
});

test("content meets the SEO limits and answers the homework question first", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.ok(site.title.startsWith("সৌরজগৎ গেম"));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.headline && site.headline !== site.title && site.headline !== site.name);
  assert.ok(site.faq.length >= 6);
  assert.equal(site.faq[0].question, "সৌরজগতে কয়টি গ্রহ?");
  assert.ok(site.faq[0].answer.startsWith("৮টা"));
  for (const question of ["কোন বয়সের জন্য?", "ইন্টারনেট লাগে?", "কোনো তথ্য নেওয়া হয়?", "কতক্ষণ খেলবে?", "কয়টা লেভেল আছে?"]) assert.ok(site.faq.some(item => item.question === question), question);
  assert.ok(site.faq.some(item => /প্লুটো/.test(item.question) && /বামন গ্রহ/.test(item.answer) && /২০০৬/.test(item.answer)));
  assert.equal(site.privacy.length, 1);
  for (const text of [site.title, site.description, site.headline!, site.lead, ...site.steps, ...site.privacy, ...site.faq.flatMap(item => [item.question, item.answer])]) {
    nfc(text);
    assert.doesNotMatch(text, /আপনি|করুন|দেখুন/, text);
  }
});
