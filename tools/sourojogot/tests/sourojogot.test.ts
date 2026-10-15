import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { site } from "../content";
import { share } from "../share";
import {
  BOARD, cardFact, choiceCount, doneLine, farChoices, farHint, FRESH_PACE, LEVEL_COUNT, LEVELS, levelOf, nextPace, placeOn, planetsOf, rightThing, rightZone,
  shouldGlow, shuffledSlots, sizeChoices, sizeHint, sizeReveal, farReveal, spot, starsOf, tourHint, type Pace,
} from "../lib/levels";
import {
  earthsInside, footballScale, mmLabel, metreLabel, nearestThing, planetOf, PLANETS, printMm, PRINT_EARTH_MM, SATURN_RING, SUN_KM, THINGS, ZONES, zoneOf,
} from "../lib/planets";

const nfc = (text: string) => assert.equal(text, text.normalize("NFC"), text);

test("the eight planets, in order from the Sun, with Bangladeshi names, a fact and a drawing each", () => {
  assert.deepEqual(PLANETS.map(planet => planet.name), ["বুধ", "শুক্র", "পৃথিবী", "মঙ্গল", "বৃহস্পতি", "শনি", "ইউরেনাস", "নেপচুন"]);
  assert.equal(new Set(PLANETS.map(planet => planet.id)).size, 8);
  assert.equal(new Set(PLANETS.map(planet => planet.fact)).size, 8);
  for (const planet of PLANETS) {
    nfc(planet.name); nfc(planet.fact);
    assert.ok(planet.fact.length > 15 && planet.fact.length < 110, planet.fact);
    assert.match(planet.color, /^#[0-9a-f]{6}$/); assert.match(planet.shade, /^#[0-9a-f]{6}$/);
    assert.ok(planet.drawR >= 15 && planet.drawR <= 40);
  }
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
  // The ratio holds: Earth is to the football as Earth's diameter is to the Sun's.
  assert.ok(Math.abs(earth.sizeMm / 220 - 12_756 / SUN_KM) < 1e-12);
  assert.deepEqual(PLANETS.map(planet => nearestThing(footballScale(planet).sizeMm).id), ["sand", "mustard", "mustard", "sand", "marble", "marble", "pea", "pea"]);
  assert.deepEqual(PLANETS.map(planet => zoneOf(footballScale(planet).distanceM).id), ["field", "field", "field", "field", "street", "street", "far", "far"]);
  assert.equal(mmLabel(earth.sizeMm), "২ মিমি");
  assert.equal(mmLabel(footballScale(planetOf("mercury")).sizeMm), "০.৮ মিমি");
  assert.equal(metreLabel(neptune.distanceM), "৭১২ মিটার");
  assert.equal(sizeReveal(planetOf("earth")), "পৃথিবী হতো ২ মিমি, একটা সরিষার দানার মতো।");
  assert.equal(sizeReveal(planetOf("jupiter")), "বৃহস্পতি হতো ২২ মিমি, একটা মার্বেলের মতো।");
  assert.equal(farReveal(planetOf("earth")), "পৃথিবী থাকত ২৪ মিটার দূরে, মাঠের ভেতরেই।");
  assert.equal(THINGS.length, new Set(THINGS.map(thing => thing.id)).size);
  for (const thing of THINGS) nfc(thing.name);
  for (const zone of ZONES) nfc(zone.name);
});

test("the print sheet keeps true ratios and fits A4", () => {
  assert.equal(printMm(12_756), PRINT_EARTH_MM);
  assert.ok(Math.abs(printMm(planetOf("jupiter").diameterKm) - 87.7) < 0.1);
  assert.ok(printMm(planetOf("saturn").diameterKm) * SATURN_RING < 186, "Saturn with its ring fits the 190 mm sheet");
  assert.ok(Math.abs(printMm(SUN_KM) / 10 - 87.3) < 0.1, "the Sun at this scale, in cm");
});

test("every planet sits on the board, far enough apart for a small finger", () => {
  for (const count of [4, 8] as const) {
    const spots = Array.from({ length: count }, (_, index) => spot(index, count));
    for (const at of spots) {
      assert.ok(at.x >= 40 && at.x <= BOARD.width - 40 && at.y >= 40 && at.y <= BOARD.height - 40, JSON.stringify(at));
      assert.ok(Math.hypot(at.x, at.y) > BOARD.sunR + 30, "clear of the Sun");
    }
    for (let i = 0; i < count; i++) for (let j = i + 1; j < count; j++) {
      assert.ok(Math.hypot(spots[i].x - spots[j].x, spots[i].y - spots[j].y) >= 90, `${count}: ${i}–${j}`);
    }
  }
});

test("levels: tour, sort, then the football Sun, gently harder", () => {
  assert.equal(LEVEL_COUNT, 6);
  assert.deepEqual(LEVELS.map(level => `${level.mode}${level.count}`), ["tour4", "tour8", "sort4", "sort8", "size8", "far8"]);
  assert.equal(planetsOf(1).at(-1)!.name, "মঙ্গল");
  assert.equal(levelOf(99), LEVELS[5]);
  assert.equal(new Set(LEVELS.map(level => level.title)).size, LEVEL_COUNT);
  for (let level = 1; level <= LEVEL_COUNT; level++) { nfc(levelOf(level).title); nfc(doneLine(level)); nfc(cardFact(level)); }
  assert.equal(doneLine(2), "আজ সূর্য থেকে নেপচুন পর্যন্ত ঘুরে এলাম");
  assert.equal(doneLine(4), "আজ ৮টা গ্রহ ঠিক ক্রমে সাজালাম");
});

test("sort round: every planet starts off its orbit, and a right tap puts it home", () => {
  for (const seed of [1, 2, 3, 99, 12345]) for (const count of [4, 8]) {
    const slots = shuffledSlots(count, seed);
    assert.deepEqual([...slots].sort(), Array.from({ length: count }, (_, index) => index));
    assert.ok(slots.every((planet, slot) => planet !== slot));
    assert.deepEqual(shuffledSlots(count, seed), slots, "same seed, same start");
    let board = slots;
    for (let planet = 0; planet < count; planet++) board = placeOn(board, planet, planet);
    assert.deepEqual(board, Array.from({ length: count }, (_, index) => index));
  }
});

test("difficulty steps: three slips ease, five right step up, never announced", () => {
  let pace: Pace = FRESH_PACE;
  assert.equal(choiceCount(pace), 3);
  for (let i = 0; i < 3; i++) pace = nextPace(pace, false);
  assert.equal(pace.help, 1); assert.equal(choiceCount(pace), 2); assert.ok(shouldGlow(pace, 0));
  pace = nextPace(pace, true);
  assert.equal(pace.help, 0); assert.ok(!shouldGlow(pace, 1)); assert.ok(shouldGlow(pace, 2), "glows after two tries");
  for (let i = 0; i < 5; i++) pace = nextPace(pace, true);
  assert.equal(pace.help, -1); assert.equal(choiceCount(pace), 4);
  pace = nextPace(pace, false);
  assert.equal(pace.help, 0, "one slip drops back to normal");
});

test("size and far choices always hold the answer, and hints point the right way", () => {
  for (const planet of PLANETS) for (const count of [2, 3, 4]) for (const seed of [1, 7, 42]) {
    const choices = sizeChoices(planet, count, seed);
    assert.equal(choices.length, count);
    assert.ok(choices.some(thing => thing.id === rightThing(planet).id));
    assert.equal(new Set(choices.map(thing => thing.id)).size, count);
    assert.deepEqual(choices.map(thing => thing.sizeMm), [...choices.map(thing => thing.sizeMm)].sort((a, b) => a - b));
  }
  assert.equal(farChoices().length, 3);
  assert.equal(rightZone(planetOf("neptune")).id, "far");
  assert.equal(sizeHint(THINGS[4], planetOf("earth")), "আরও ছোট ভাবো।");
  assert.equal(sizeHint(THINGS[0], planetOf("jupiter")), "আরও বড় ভাবো।");
  assert.equal(farHint(ZONES[0], planetOf("neptune")), "আরও দূরে ভাবো।");
  assert.equal(farHint(ZONES[2], planetOf("mars")), "আরও কাছে ভাবো।");
  assert.equal(tourHint("earth", planetOf("mercury")), "বুধ সূর্যের আরও কাছে, ওটা আগে।");
});

test("stars are a record: 3 with no slip, 2 with up to two, else 1", () => {
  assert.deepEqual([0, 1, 2, 3, 9].map(starsOf), [3, 2, 2, 1, 1]);
});

test("no sharing of anything about the child", () => {
  assert.equal(share.normalize(""), null);
  assert.equal(share.normalize("level=1&stars=3"), null);
  assert.equal(share.tally, undefined);
});

test("the tool's source never calls fetch or imports share-client", () => {
  const root = join(import.meta.dirname, "..");
  const files = (dir: string): string[] => readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? (name === "tests" ? [] : files(path)) : [path];
  });
  const sources = [...files(root), join(root, "../../app/sourojogot/page.tsx")].filter(path => /\.(tsx?|css)$/.test(path));
  assert.ok(sources.length >= 8);
  for (const path of sources) {
    const code = readFileSync(path, "utf8");
    assert.doesNotMatch(code, /\bfetch\s*\(/, path);
    assert.doesNotMatch(code, /share-client|ShareBar|\/api\//, path);
    assert.doesNotMatch(code, /<input|getUserMedia|geolocation/, path);
  }
});

test("content meets the SEO limits and answers the homework question first", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.ok(site.title.startsWith("সৌরজগৎ গেম"));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.headline && site.headline !== site.title && site.headline !== site.name);
  assert.ok(site.faq.length >= 6);
  assert.equal(site.faq[0].question, "সৌরজগতে কয়টি গ্রহ?");
  assert.ok(site.faq[0].answer.startsWith("৮টা"));
  for (const question of ["কোন বয়সের জন্য?", "ইন্টারনেট লাগে?", "কোনো তথ্য নেওয়া হয়?", "কতক্ষণ খেলবে?"]) assert.ok(site.faq.some(item => item.question === question), question);
  assert.ok(site.faq.some(item => /প্লুটো/.test(item.question) && /বামন গ্রহ/.test(item.answer) && /২০০৬/.test(item.answer)));
  assert.equal(site.privacy.length, 1);
  for (const text of [site.title, site.description, site.headline!, site.lead, ...site.steps, ...site.privacy, ...site.faq.flatMap(item => [item.question, item.answer])]) {
    nfc(text);
    assert.doesNotMatch(text, /আপনি|করুন|দেখুন/, text);
  }
});
