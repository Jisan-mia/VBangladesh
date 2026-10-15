import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { makeRng } from "../../../shared/game-core";
import { FLAGS, LAND_PATH, PICS, WORLD, flagDocument, picDocument, project, starPoints } from "../lib/art";
import { COUNTRIES, DHAKA, TRIPS, countryOf } from "../lib/countries";
import { FOOTER } from "../lib/draw-card";
import {
  CARDS, LEVELS, LEVEL_COUNT, OG_DEMO, angleAt, cardTitle, choiceCount, choicesFor, flightOf, helloLine, inside, isOgHash, levelOf, of, pointAt,
  questionOf, starsOf, tripCountries, tripView, whyLine,
} from "../lib/game";
import { site } from "../content";
import { share } from "../share";

const bn = (n: number) => new Intl.NumberFormat("bn-BD", { useGrouping: false }).format(n);
const nfc = (text: string) => assert.equal(text, text.normalize("NFC"), text);

test("countries: 18 on six continents, each complete, Bangla NFC, no duplicates", () => {
  assert.ok(COUNTRIES.length >= 16 && COUNTRIES.length <= 20, `${COUNTRIES.length} countries`);
  assert.deepEqual(new Set(COUNTRIES.map(c => c.continent)), new Set(["এশিয়া", "আফ্রিকা", "ইউরোপ", "উত্তর আমেরিকা", "দক্ষিণ আমেরিকা", "ওশেনিয়া"]));
  for (const key of ["id", "name", "capital"] as const) assert.equal(new Set(COUNTRIES.map(c => c[key])).size, COUNTRIES.length, key);
  for (const kind of ["food", "place", "animal"] as const) assert.equal(new Set(COUNTRIES.map(c => c[kind].name)).size, COUNTRIES.length, kind);
  for (const c of COUNTRIES) {
    for (const text of [c.name, c.capital, c.continent, c.hello.word, c.hello.language, c.hello.means ?? "", c.food.name, c.food.note, c.place.name, c.place.note, c.animal.name, c.animal.note, c.like]) {
      nfc(text);
      assert.doesNotMatch(text, /আপনি|করুন/);
    }
    assert.match(c.hello.word, /^[ঀ-৿ ’]+$/u, `${c.id} greeting is in Bangla script`);
    for (const note of [c.food.note, c.place.note, c.animal.note, c.like]) assert.match(note, /।$/, `${c.id}: ${note}`);
    for (const kind of ["food", "place", "animal"]) assert.match(PICS[`${c.id}:${kind}`] ?? "", /<(path|circle|ellipse|rect|polygon)/, `${c.id}:${kind} has a picture`);
    assert.ok(c.ask !== "flag" || FLAGS[c.id], `${c.id} asks about a flag we draw`);
    assert.match(c.ink, /^#[0-9a-f]{6}$/);
    assert.ok(c.lon >= -170 && c.lon <= 180 && c.lat > -55 && c.lat < 80);
  }
  // The countries where many প্রবাসী relatives live, and the neighbours.
  for (const id of ["sa", "ae", "my", "sg", "it", "gb", "us"]) assert.equal(countryOf(id)?.probash, true, id);
  for (const id of ["in", "np", "bt", "mm", "jp", "cn", "eg", "ke", "br", "au", "ca"]) assert.ok(countryOf(id), id);
});

test("art: our own markup only, nothing linked; flags drawn exactly or left out", () => {
  for (const [key, svg] of Object.entries(PICS)) {
    assert.doesNotMatch(svg, /href|url\(|<script|<image|<text|<use|undefined|NaN/i, key);
    assert.match(picDocument(key), /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 64 64">/);
  }
  assert.equal(Object.keys(PICS).length, COUNTRIES.length * 3);
  for (const [id, flag] of Object.entries(FLAGS)) {
    assert.doesNotMatch(flag.svg, /href|url\(|<script|<image|<text|<use|undefined|NaN/i, id);
    assert.match(flagDocument(id), new RegExp(`viewBox="0 0 ${flag.w} ${flag.h}"`));
  }
  // Too complex to draw right, so no flag: Nepal, Bhutan, Australia, Saudi Arabia, Egypt, Kenya, Canada, Brazil.
  for (const id of ["np", "bt", "au", "sa", "eg", "ke", "ca", "br"]) assert.equal(FLAGS[id], undefined, id);
  assert.equal(flagDocument("np"), "");
  // The US flag has 50 stars; China's has five.
  assert.equal((FLAGS.us.svg.match(/<polygon/g) ?? []).length, 50);
  assert.equal((FLAGS.cn.svg.match(/<polygon/g) ?? []).length, 5);
  // Proportions from the construction sheets.
  assert.deepEqual([FLAGS.jp.w / FLAGS.jp.h, FLAGS.gb.w / FLAGS.gb.h, FLAGS.us.w / FLAGS.us.h, FLAGS.my.w / FLAGS.my.h, FLAGS.bd.w / FLAGS.bd.h], [1.5, 2, 1.9, 2, 10 / 6]);
  // A five-pointed star has ten corners, the first straight up.
  const points = starPoints(0, 0, 1).split(" ");
  assert.equal(points.length, 10);
  assert.equal(points[0], "0,-1");
});

test("trips: six of three, every country once, from next door outward", () => {
  assert.equal(LEVEL_COUNT, 6);
  assert.deepEqual(TRIPS.flatMap(t => t.ids).sort(), COUNTRIES.map(c => c.id).sort());
  for (const trip of TRIPS) { assert.equal(trip.ids.length, 3); nfc(trip.title); }
  assert.deepEqual(TRIPS[0].ids, ["in", "np", "bt"]);
  assert.equal(levelOf(0).level, 1);
  assert.equal(levelOf(99).level, 6);
  assert.equal(levelOf(Number.NaN).level, 1);
  // Each trip asks about different kinds of things, so it isn't three animals in a row.
  for (let level = 1; level <= LEVEL_COUNT; level++) assert.ok(new Set(tripCountries(level).map(c => c.ask)).size >= 2, `trip ${level}`);
});

test("difficulty: 3 pictures, then 4 on the far trips; three misses in a row eases by one, five right adds one, always 2–4", () => {
  assert.deepEqual(LEVELS.map(l => l.choices), [3, 3, 3, 4, 4, 4]);
  assert.equal(choiceCount(3, 0, 0), 3);
  assert.equal(choiceCount(3, 2, 0), 3);
  assert.equal(choiceCount(3, 3, 0), 2);
  assert.equal(choiceCount(3, 0, 4), 3);
  assert.equal(choiceCount(3, 0, 5), 4);
  assert.equal(choiceCount(2, 3, 0), 2);
  assert.equal(choiceCount(4, 0, 5), 4);
  assert.equal(choiceCount(4, 3, 0), 3);
});

test("choices: one right answer, no repeats; flag questions only offer flags we draw", () => {
  for (const seed of [1, 7, 99]) for (const target of COUNTRIES) for (const count of [2, 3, 4]) {
    const choices = choicesFor(target, count, makeRng(seed));
    assert.equal(choices.length, count);
    assert.equal(choices.filter(c => c.id === target.id).length, 1);
    assert.equal(new Set(choices.map(c => c.id)).size, count);
    if (target.ask === "flag") for (const c of choices) assert.ok(FLAGS[c.id], `${target.id}: ${c.id}`);
  }
});

test("words: questions, hints and greetings read as natural Bangla", () => {
  assert.equal(inside("ভারত"), "ভারতে");
  assert.equal(inside("কানাডা"), "কানাডায়");
  assert.equal(inside("ইতালি"), "ইতালিতে");
  assert.equal(of("ভারত"), "ভারতের");
  assert.equal(of("কেনিয়া"), "কেনিয়ার");
  assert.equal(of("ইতালি"), "ইতালির");
  assert.equal(questionOf(countryOf("jp")!), "কোনটা জাপানের পতাকা?");
  assert.equal(questionOf(countryOf("np")!), "নেপালে কোন প্রাণীটা দেখলে?");
  assert.equal(whyLine(countryOf("eg")!, "animal"), "এটা মিসরের ফেনেক শিয়াল। আরেকবার ভাবো।");
  assert.equal(whyLine(countryOf("cn")!, "place"), "এটা চীনের মহাপ্রাচীর। আরেকবার ভাবো।");
  assert.equal(helloLine(countryOf("jp")!), "জাপানি ভাষায় হ্যালো");
  assert.equal(helloLine(countryOf("my")!), "মালয় ভাষায় শুভ সকাল");
  assert.equal(CARDS.length, 5);
  for (const c of COUNTRIES) { nfc(questionOf(c)); nfc(whyLine(c, c.ask)); }
});

test("stars are a record: 3 for all three stamps on the first tap, 2 for two, 1 for finishing", () => {
  assert.deepEqual([0, 1, 2, 3].map(starsOf), [1, 1, 2, 3]);
});

test("map: every pin is inside the world, each trip's view holds Dhaka and its countries, flights start in Dhaka", () => {
  assert.match(LAND_PATH, /^M[\d. LZM-]+$/);
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const view = tripView(level);
    assert.ok(view.x >= 0 && view.y >= 0 && view.x + view.w <= WORLD.width + 1e-9 && view.y + view.h <= WORLD.height + 1e-9, `trip ${level}`);
    assert.ok(Math.abs(view.w / view.h - 1.6) < 1e-9);
    for (const point of [DHAKA, ...tripCountries(level)]) {
      const [x, y] = project(point.lon, point.lat);
      assert.ok(x > view.x && x < view.x + view.w && y > view.y && y < view.y + view.h, `trip ${level}: ${x},${y}`);
    }
  }
  const f = flightOf(countryOf("jp")!);
  assert.deepEqual(pointAt(f, 0), { x: f.ax, y: f.ay });
  assert.deepEqual(pointAt(f, 1), { x: f.bx, y: f.by });
  assert.ok(pointAt(f, 0.5).y < Math.min(f.ay, f.by), "the flight bows north");
  assert.ok(Number.isFinite(angleAt(f, 0.5)));
});

test("the card says what was done, with no name; the #og demo is fixed and real", () => {
  assert.equal(cardTitle(3, bn), "আজ ৩টা দেশ ঘুরলাম");
  nfc(FOOTER);
  assert.ok(isOgHash("#og"));
  assert.ok(!isOgHash("#og=1") && !isOgHash(""));
  assert.ok(OG_DEMO.level >= 1 && OG_DEMO.level <= LEVEL_COUNT && OG_DEMO.stars >= 1 && OG_DEMO.stars <= 3);
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
  assert.ok(site.title.startsWith("বিশ্বের দেশের নাম"));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, `description ${site.description.length}`);
  assert.ok(site.faq.length >= 6);
  assert.equal(site.faq[0].question, "পৃথিবীতে কয়টি দেশ আছে?");
  assert.match(site.faq[0].answer, /^জাতিসংঘের সদস্য দেশ ১৯৩টি।/);
  for (const ask of ["কোন বয়সের জন্য?", "ইন্টারনেট লাগে?", "কোনো তথ্য নেওয়া হয়?", "কতক্ষণ খেলবে?"]) assert.ok(site.faq.some(item => item.question === ask), ask);
  for (const text of [site.title, site.description, site.headline!, site.lead, ...site.steps, ...site.privacy, ...site.faq.flatMap(item => [item.question, item.answer])]) {
    nfc(text);
    assert.doesNotMatch(text, /আপনি|করুন/);
  }
  assert.equal(site.privacy.length, 1);
});
