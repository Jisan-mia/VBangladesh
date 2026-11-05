import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { FLAGS, LAND_PATH, PICS, WORLD, flagDocument, picDocument, project, starPoints } from "../lib/art";
import { COUNTRIES, DHAKA, TRIPS, countryOf } from "../lib/countries";
import { FOOTER } from "../lib/draw-card";
import { ASPECT, FRAME_COUNT, angleAt, flightMs, flightOf, planeFrames, pointAt, routePath, viewOf } from "../lib/geo";
import { LIKE_OF, LIKE_PICS, likeDocument, likeMarkup } from "../lib/likes";
import { LEVEL_COUNT, stopIds } from "../lib/levels";
import { awayLine, cardTitle, helloLine, inside, of, questionOf, rightLine, whyLine } from "../lib/text";
import { site, parentNote } from "../content";
import { share } from "../share";

const bn = (n: number) => new Intl.NumberFormat("bn-BD", { useGrouping: false }).format(n);
const nfc = (text: string) => assert.equal(text, text.normalize("NFC"), text);
const here = import.meta.dirname;
const sources = (extra: RegExp = /\.tsx?$/) => {
  const files: string[] = [];
  const walk = (dir: string) => { for (const name of readdirSync(dir)) { const path = join(dir, name); if (statSync(path).isDirectory()) { if (name !== "tests") walk(path); } else if (extra.test(name)) files.push(path); } };
  walk(join(here, ".."));
  return files;
};

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
  for (const id of ["sa", "ae", "my", "sg", "it", "gb", "us"]) assert.equal(countryOf(id)?.probash, true, id);
});

test("art: our own markup only, nothing linked; flags drawn exactly or left out", () => {
  for (const [key, svg] of Object.entries({ ...PICS, ...LIKE_PICS })) {
    assert.doesNotMatch(svg, /href|url\(|<script|<image|<text|<use|undefined|NaN/i, key);
  }
  for (const key of Object.keys(PICS)) assert.match(picDocument(key), /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 64 64">/);
  assert.equal(Object.keys(PICS).length, COUNTRIES.length * 3);
  for (const [id, flag] of Object.entries(FLAGS)) {
    assert.doesNotMatch(flag.svg, /href|url\(|<script|<image|<text|<use|undefined|NaN/i, id);
    assert.match(flagDocument(id), new RegExp(`viewBox="0 0 ${flag.w} ${flag.h}"`));
  }
  for (const id of ["np", "bt", "au", "sa", "eg", "ke", "ca", "br"]) assert.equal(FLAGS[id], undefined, id);
  assert.equal(flagDocument("np"), "");
  assert.equal((FLAGS.us.svg.match(/<polygon/g) ?? []).length, 50);
  assert.equal((FLAGS.cn.svg.match(/<polygon/g) ?? []).length, 5);
  assert.deepEqual([FLAGS.jp.w / FLAGS.jp.h, FLAGS.gb.w / FLAGS.gb.h, FLAGS.us.w / FLAGS.us.h, FLAGS.my.w / FLAGS.my.h, FLAGS.bd.w / FLAGS.bd.h], [1.5, 2, 1.9, 2, 10 / 6]);
  const points = starPoints(0, 0, 1).split(" ");
  assert.equal(points.length, 10);
  assert.equal(points[0], "0,-1");
});

test("postcards say their fact with a picture: every country's like card has one, and it is ours", () => {
  for (const c of COUNTRIES) {
    const key = LIKE_OF[c.id];
    assert.ok(key, `${c.id} has a like picture`);
    assert.match(likeMarkup(key), /<(path|circle|ellipse|rect|polygon)/, `${c.id}: ${key}`);
    assert.match(likeDocument(key), /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 64 64">/);
  }
  assert.equal(Object.keys(LIKE_OF).length, COUNTRIES.length);
});

test("trips: six of three, every country once, from next door outward", () => {
  assert.deepEqual(TRIPS.flatMap(t => t.ids).sort(), COUNTRIES.map(c => c.id).sort());
  for (const trip of TRIPS) { assert.equal(trip.ids.length, 3); nfc(trip.title); }
  assert.deepEqual(TRIPS[0].ids, ["in", "np", "bt"]);
  assert.equal(LEVEL_COUNT, 9);
});

test("words: questions, hints and greetings read as natural Bangla", () => {
  assert.equal(inside("ভারত"), "ভারতে");
  assert.equal(inside("কানাডা"), "কানাডায়");
  assert.equal(inside("ইতালি"), "ইতালিতে");
  assert.equal(of("ভারত"), "ভারতের");
  assert.equal(of("কেনিয়া"), "কেনিয়ার");
  assert.equal(of("ইতালি"), "ইতালির");
  assert.equal(questionOf(countryOf("jp")!, "flag"), "কোনটা জাপানের পতাকা?");
  assert.equal(questionOf(countryOf("np")!, "animal"), "নেপালে কোন প্রাণীটা দেখলে?");
  assert.equal(questionOf(countryOf("jp")!, "hello"), "কোন দেশে বলে “কোনিচিওয়া”?");
  assert.equal(whyLine(countryOf("eg")!, "animal"), "এটা মিসরের ফেনেক শিয়াল। আরেকবার ভাবো।");
  assert.equal(whyLine(countryOf("cn")!, "place"), "এটা চীনের মহাপ্রাচীর। আরেকবার ভাবো।");
  assert.equal(whyLine(countryOf("br")!, "hello"), "ব্রাজিল-এ বলে “ওলা”। আরেকবার ভাবো।");
  assert.equal(rightLine(countryOf("jp")!, "food"), "ঠিক। জাপানের সুশি।");
  assert.equal(helloLine(countryOf("jp")!), "জাপানি ভাষায় হ্যালো");
  assert.equal(helloLine(countryOf("my")!), "মালয় ভাষায় শুভ সকাল");
  for (const c of COUNTRIES) for (const ask of ["food", "place", "animal", "hello", ...(FLAGS[c.id] ? ["flag" as const] : [])] as const) { nfc(questionOf(c, ask)); nfc(whyLine(c, ask)); nfc(rightLine(c, ask)); }
  nfc(awayLine(countryOf("jp"))); nfc(awayLine(undefined));
});

test("map: every pin is inside the world, each level's view holds Dhaka and its countries, flights start in Dhaka and the frames are made once", () => {
  assert.match(LAND_PATH, /^M[\d. LZM-]+$/);
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const ids = stopIds(level), view = viewOf(ids);
    assert.ok(view.x >= 0 && view.y >= 0 && view.x + view.w <= WORLD.width + 1e-9 && view.y + view.h <= WORLD.height + 1e-9, `level ${level}`);
    assert.ok(Math.abs(view.w / view.h - ASPECT) < 1e-9);
    for (const point of [DHAKA, ...ids.map(id => countryOf(id)!)]) {
      const [x, y] = project(point.lon, point.lat);
      assert.ok(x > view.x && x < view.x + view.w && y > view.y && y < view.y + view.h, `level ${level}: ${x},${y}`);
    }
  }
  const f = flightOf("jp");
  assert.deepEqual(pointAt(f, 0), { x: f.ax, y: f.ay });
  assert.deepEqual(pointAt(f, 1), { x: f.bx, y: f.by });
  assert.ok(pointAt(f, 0.5).y < Math.min(f.ay, f.by), "the flight bows north");
  assert.ok(Number.isFinite(angleAt(f, 0.5)));
  assert.match(routePath(f), /^M[\d. ]+Q[\d. ]+$/);
  const frames = planeFrames(f, 4);
  assert.equal(frames.length, FRAME_COUNT + 1);
  assert.equal(frames[0].reveal, 1); assert.equal(frames.at(-1)!.reveal, 0);
  assert.ok(frames.every((frame, at) => at === 0 || frame.reveal <= frames[at - 1].reveal), "the dots only ever reveal");
  for (const id of COUNTRIES.map(c => c.id)) { const ms = flightMs(flightOf(id)); assert.ok(ms >= 1100 && ms <= 1800, `${id} ${ms} ms`); }
});

test("the card says what was done, with no name; the #og demo is a real level", () => {
  assert.equal(cardTitle(3, bn), "আজ ৩টা দেশ ঘুরলাম");
  nfc(FOOTER);
  const game = readFileSync(join(here, "..", "components", "game.tsx"), "utf8");
  assert.match(game, /OG_DEMO = \{ level: 3, stars: 3 \}/);
  assert.deepEqual(stopIds(3), ["cn", "jp", "au"], "level 3 is still the trip the card image shows");
});

test("no sharing of results: normalize always returns null, and there is no tally", () => {
  for (const state of ["", "l=3", "s=1&t=3", "x".repeat(500)]) assert.equal(share.normalize(state), null);
  assert.equal(share.tally, undefined);
});

test("the tool never touches the network", () => {
  const files = sources();
  assert.ok(files.length >= 14);
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
  for (const text of [site.title, site.description, site.headline!, site.lead, ...site.steps, ...site.privacy, ...site.faq.flatMap(item => [item.question, item.answer]), ...Object.values(parentNote)]) {
    nfc(text);
    assert.doesNotMatch(text, /আপনি|করুন/);
  }
  assert.equal(site.privacy.length, 1);
});

test("no voice anywhere: the game never calls speak, SpeakButton or speechSynthesis", () => {
  for (const file of sources()) assert.doesNotMatch(readFileSync(file, "utf8"), /\bspeak\s*\(|SpeakButton|speechSynthesis|SpeechSynthesisUtterance|useBanglaVoice/, file);
});

test("the page is the shared player with the kids' frame, and no child-facing link leaves it (bug 5, NoOutboundForKids)", () => {
  const page = readFileSync(join(here, "..", "page.tsx"), "utf8");
  assert.match(page, /<GamePage[^>]*\bkids\b/);
  assert.doesNotMatch(page, /PageFrame|<a\b|href=/, "the page itself links nowhere");
  const game = readdirSync(join(here, "..", "components")).map(name => readFileSync(join(here, "..", "components", name), "utf8")).join("\n");
  assert.doesNotMatch(game, /href=|<a\b|location\.(href|assign|replace)|window\.open/, "the game links nowhere");
  assert.doesNotMatch(game, /location\.hash\s*=(?!=)|history\.pushState|\.scrollIntoView/, "no hash writes, no history pushes, no scrolling the page");
  assert.doesNotMatch(game, /replaceState|hashchange/, "nothing is written to the address bar");
});

test("the end buttons are pictures of at least 96 px, and every pressable has a real size", () => {
  const css = readFileSync(join(here, "..", "product.css"), "utf8");
  for (const rule of [/\.pg-big\{[^}]*min-height:112px/, /\.pg-next\{[^}]*width:128px;height:104px/, /\.pg-go\{[^}]*min-height:112px/, /\.pg-choice\{[^}]*min-height:100px/, /\.pg-close\{[^}]*width:56px;height:56px/]) assert.match(css, rule);
  const end = readFileSync(join(here, "..", "components", "end-screen.tsx"), "utf8");
  assert.match(end, /<svg[^>]*>[\s\S]*<span>আবার খেলো<\/span>/);
  assert.match(end, /<svg[^>]*>[\s\S]*<span>শেষ<\/span>/);
});
