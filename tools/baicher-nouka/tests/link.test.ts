import assert from "node:assert/strict";
import test from "node:test";
import { site } from "../content";
import { LEGACY_LEVEL, LEVELS, LEVEL_COUNT, MODE_INFO, OLD_COUNT } from "../lib/levels";
import {
  MAX_TENTHS, banner, caption, clearLine, compareLine, humanLine, lossLine, minTenths, nearMiss, openingLevel, ordinal, parseShareHash, previewTitle, rankLines, resultLine, secs, shareHash, type Shared,
} from "../lib/link";
import { share } from "../share";

const base: Shared = { seed: 48213, tenths: 154, rank: 2, level: 6, name: "রাফি", mode: "n", old: false };

test("links from before the rewrite still open, and are written back exactly as they came", () => {
  const old = "s=48213&t=384&r=1&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF";
  const parsed = parseShareHash(old);
  assert.deepEqual(parsed, { seed: 48213, tenths: 384, rank: 1, level: LEGACY_LEVEL, name: "রাফি", mode: "n", old: true });
  assert.equal(share.normalize(old), old);
  const withRace = "s=77&t=455&r=3&l=2";
  assert.deepEqual(parseShareHash(withRace), { seed: 77, tenths: 455, rank: 3, level: 2, name: "", mode: "n", old: true });
  assert.equal(share.normalize(withRace), withRace);
  assert.equal(parseShareHash("s=77&t=270&r=3&l=12")?.level, 12, "old races went to twelve");
  assert.ok(OLD_COUNT === 12);
  assert.equal(parseShareHash("s=77&t=269&r=3"), null, "faster than anyone could row the old course");
});

test("new links carry the race, `v=2` and a mode, and round-trip", () => {
  const hash = shareHash(base);
  assert.match(hash, /^s=48213&t=154&r=2&l=6&v=2&n=/);
  assert.deepEqual(parseShareHash(hash), base);
  assert.equal(share.normalize(hash), hash);
  for (const mode of ["e", "h"] as const) {
    const withMode = shareHash({ ...base, mode });
    assert.match(withMode, new RegExp(`&v=2&d=${mode}&`));
    assert.deepEqual(parseShareHash(withMode), { ...base, mode });
  }
  assert.doesNotMatch(shareHash(base), /d=/, "সাধারণ is the default");
});

test("hostile or broken links are refused", () => {
  const good = shareHash(base);
  const swap = (from: string, to: string) => good.replace(from, to);
  const bad = [
    swap("l=6", "l=13"), swap("l=6", "l=0"), swap("l=6", "l=x"), swap("l=6", "l=06"), swap("l=6", "l=6.5"), swap("l=6", "l="),
    swap("r=2", "r=0"), swap("r=2", "r=5"), swap("r=2", "r=x"), swap("v=2", "v=3"), swap("v=2", "v=1"), swap("v=2", "v="),
    "s=48213&t=154&r=2&v=2", "s=48213&t=154&l=6&v=2",
    swap("&n=", "&d=x&n="), swap("&n=", "&d=n&n="), "s=48213&t=384&r=1&d=e", "s=48213&t=384&r=1&l=3&d=h",
    swap("t=154", `t=${MAX_TENTHS + 1}`), swap("t=154", "t=-1"), swap("t=154", "t=1.5"), swap("s=48213", "s=0"), swap("s=48213", "s=1000000000"),
    swap("t=154", `t=${minTenths(6, false) - 1}`), `${good}&${"x=1&".repeat(200)}`, "", "junk", "#",
  ];
  for (const link of bad) assert.equal(parseShareHash(link), null, link.slice(0, 60));
  assert.equal(share.normalize("junk"), null);
  assert.ok(share.preview("junk").title.length > 0);
  // A name is cleaned and capped, never trusted as markup.
  const long = shareHash({ ...base, name: "রাফি".repeat(30) });
  assert.ok((parseShareHash(long)?.name.length ?? 99) <= 20);
});

test("the quickest time a race can have is its course over the top speed, race by race", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const floor = minTenths(level, false);
    assert.ok(floor >= Math.floor(LEVELS[level - 1].course / 34) - 1 && floor < LEVELS[level - 1].course / 34);
    assert.ok(parseShareHash(shareHash({ ...base, level, tenths: floor + 1 })));
  }
});

test("numbers and places read in Bangla and the lines are kind and exact", () => {
  assert.equal(secs(384), "৩৮.৪");
  assert.deepEqual([1, 2, 3, 4].map(ordinal), ["১ম", "২য়", "৩য়", "৪র্থ"]);
  assert.equal(resultLine(base), "১৫.৪ সেকেন্ডে ২য়");
  assert.match(banner(base), /রাফি .* হয়েছে। একই নদী/);
  assert.match(previewTitle(base), /রাফি/);
  assert.match(previewTitle({ ...base, name: "" }), /^বাইচের নৌকায়/);
  assert.match(caption(base), /সরু খাল/);
  assert.doesNotMatch(caption({ ...base, old: true, level: 3 }), /undefined|বাইচ [0-9]/);
  assert.equal(nearMiss(2, 8, 400, null), "আর ০.৮ সেকেন্ড আগে পৌঁছালেই ১ম।");
  assert.equal(nearMiss(3, 60, 400, null), "", "six seconds back isn't close");
  assert.equal(nearMiss(1, 0, 404, 400), "আর ০.৫ সেকেন্ড কম লাগলেই নতুন সেরা।");
  assert.equal(nearMiss(1, 0, 398, 400), "");
  assert.equal(openingLevel({}, 1), 1);
  assert.equal(openingLevel({ 1: 3, 2: 2 }, 3), 3);
  assert.equal(openingLevel({ 1: 3, 2: 2, 3: 3 }, 4), 4);
  assert.match(compareLine(140, 154, "মিতু"), /১.৪ সেকেন্ড আগে/);
  assert.match(compareLine(154, 154, ""), /সমান সমান/);
  assert.match(compareLine(156, 154, "মিতু"), /আর একটু হলেই/);
  assert.match(compareLine(250, 154, "মিতু"), /এগিয়ে/);
  assert.equal(rankLines.length, 5);
  assert.equal(humanLine(9), rankLines[4]);
  for (let level = 1; level <= LEVEL_COUNT; level++) assert.ok(clearLine(level).length > 10);
  assert.match(lossLine({ beats: 8, hits: 2, offbeats: 0, patchHits: 0, boss: "" }), /৮টা তালের ২টা/);
  assert.match(lossLine({ beats: 8, hits: 6, offbeats: 9, patchHits: 0, boss: "" }), /তালের বাইরে/);
  assert.match(lossLine({ beats: 8, hits: 6, offbeats: 1, patchHits: 3, boss: "" }), /কচুরিপানায় ৩ বার/);
  assert.match(lossLine({ beats: 8, hits: 6, offbeats: 1, patchHits: 0, boss: "পাকা মাঝি" }), /পাকা মাঝির শেষ টান/);
  assert.match(lossLine({ beats: 8, hits: 6, offbeats: 1, patchHits: 0, boss: "" }), /প্রথম থেকেই/);
});

test("the ladder: twelve races, three worlds of four with a named finale each, one new thing every race", () => {
  assert.equal(LEVELS.length, 12);
  for (let world = 0; world < 3; world++) {
    const races = LEVELS.filter(def => def.world === world);
    assert.equal(races.length, 4);
    assert.ok(races[3].boss, `world ${world} ends with a named champion`);
    assert.equal(races.filter(def => def.boss).length, 1);
  }
  const names = LEVELS.map(def => def.name);
  assert.equal(new Set(names).size, 12);
  assert.ok(LEVELS.every(def => def.teach.length > 20 && def.teach.length < 120));
  assert.ok(LEVELS[0].course <= 2000 && LEVELS[0].patches === 0, "race 1 is short and open water");
  assert.ok(LEVELS.every((def, index) => index === 0 || def.course >= LEVELS[index - 1].course - 1000));
  assert.deepEqual(Object.keys(MODE_INFO), ["e", "n", "h"]);
});

test("content meets the SEO limits, has the guide and FAQ, and never names a trademark or a real race", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.faq.length >= 6);
  assert.ok(site.steps.length >= 3);
  assert.notEqual(site.guideTitle, site.title);
  assert.match(site.privacy.join(" "), /সময়/);
  assert.equal(site.slug, "baicher-nouka");
  const text = JSON.stringify(site) + LEVELS.map(def => def.name + def.teach + def.boss).join(" ");
  for (const [key, value] of Object.entries(site)) if (typeof value === "string") assert.equal(value, value.normalize("NFC"), key);
  assert.equal(text, text.normalize("NFC"));
  assert.doesNotMatch(text, /জাতীয় নৌকাবাইচ|সিলেট|চাঁদপুর|ব্রাহ্মণবাড়িয়া/);
  assert.ok(new Set(site.faq.map(item => item.question)).size === site.faq.length);
});
