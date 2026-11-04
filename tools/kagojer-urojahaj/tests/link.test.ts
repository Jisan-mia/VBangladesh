// Links (new and old), saved progress and its one-time migration, and the words around the game.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { site } from "../content";
import { makeCourse } from "../lib/course";
import { LEVELS, STORY, levelOf } from "../lib/levels";
import { makeLegacyWave } from "../lib/legacy";
import { caption, compareLine, flightOfWave, nearMiss, parseShared, previewTitle, resultLine, sharedHash, sharedStars } from "../lib/link";
import { scoreOf } from "../lib/physics";
import { migrateLadder, readUnlock, recommended } from "../lib/progress";
import { share } from "../share";

test("the old sky generator is kept bit for bit (old links are checked against it)", () => {
  let all = "";
  for (let level = 1; level <= 20; level++) for (const seed of [1, 777, 48213, 999999999]) all += JSON.stringify(makeLegacyWave(seed, level));
  assert.equal(createHash("sha256").update(all).digest("hex").slice(0, 16), "0e8d96a491d14afd");
  const wave = makeLegacyWave(48213, 7);
  assert.deepEqual([wave.total, wave.goal, wave.suns, wave.maxScore], [28, 20, 18, 1178]);
});

test("old links (s t l c r h n) still parse, keep their words, and open the same place in the new ladder", () => {
  const old = parseShared("s=48213&t=320&l=7&c=12&r=4&h=1&n=রাফি");
  assert.ok(old && old.kind === "old");
  assert.equal(sharedHash(old!), "s=48213&t=320&l=7&c=12&r=4&h=1&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  assert.equal(previewTitle(old!), "রাফি কাগজের প্লেনে ৩২০ পয়েন্ট করেছে। তুমি পারবে?");
  assert.equal(flightOfWave(7), 5);
  assert.equal(flightOfWave(20), 12);
  assert.equal(sharedStars(old!), 1, "12 of 20 clouds, wet once: the old rules give one star");
  assert.equal(parseShared("s=48213&t=320&l=7&c=29&r=4&h=1"), null, "more clouds than that sky had");
  assert.equal(parseShared("s=48213&t=5000&l=7&c=12&r=4&h=1"), null, "a score that sky can't make");
  assert.equal(parseShared("s=48213&t=320&l=21&c=1&r=0&h=0"), null);
  assert.equal(share.normalize("s=48213&t=320&l=7&c=12&r=4&h=1"), "s=48213&t=320&l=7&c=12&r=4&h=1");
});

test("new links (s t w c m n): the points must be exactly what those candies, that landing and some distance make", () => {
  const course = makeCourse(4242, 6), score = scoreOf(5, course.meters, 2);
  const hash = `s=4242&t=${score}&w=6&c=5&m=2&n=মিম`;
  const flight = parseShared(hash);
  assert.ok(flight && flight.kind === "flight" && flight.level === 6 && flight.candies === 5 && flight.landing === 2);
  assert.equal(parseShared(sharedHash(flight!))?.score, score);
  assert.equal(parseShared(`s=4242&t=${score + 1}&w=6&c=5&m=2`), null, "a point too many");
  assert.equal(parseShared(`s=4242&t=${scoreOf(course.candyCount + 1, course.meters, 1)}&w=6&c=${course.candyCount + 1}&m=1`), null, "more candies than the flight has");
  assert.ok(parseShared(`s=4242&t=${scoreOf(2, 10, 0)}&w=6&c=2&m=0`), "a fall after 10 মিটার");
  assert.equal(parseShared(`s=4242&t=${scoreOf(2, course.meters + 1, 0)}&w=6&c=2&m=0`), null, "further than the flight goes");
  for (const bad of ["", "#", "s=0&t=1&w=1&c=0&m=0", "s=1&t=-1&w=1&c=0&m=0", "s=1&t=1&w=13&c=0&m=0", "s=1&t=1&w=1&c=0&m=3", "s=1&t=1e3&w=1&c=0&m=0", `s=1&t=1&w=1&c=0&m=0&n=${"x".repeat(700)}`]) assert.equal(parseShared(bad), null, bad);
  const bidi = parseShared(`s=4242&t=${score}&w=6&c=5&m=2&n=${encodeURIComponent("a‮b")}`);
  assert.ok(bidi && !bidi.name.includes("‮"));
  assert.match(previewTitle(flight!), /মিম কাগজের প্লেন নামাল ‘কাটা ঘুড়ি’ উড়ানে/);
  assert.match(caption(flight!), /ঠিক মাঝখানে নামিয়েছি/);
});

test("old saved progress moves over once; the game keeps its own unlock", () => {
  assert.equal(migrateLadder(null, null), null);
  assert.equal(migrateLadder("{}", JSON.stringify({ 1: 3 })), null, "only when the new ladder is still empty");
  assert.deepEqual(JSON.parse(migrateLadder(null, JSON.stringify({ 1: 3, 2: 2, 3: 1, 4: 3, 5: 2, 6: 1, 7: 1, 8: 2, 9: 3, 10: 3 }))!), { 1: 2, 2: 3, 3: 2, 4: 1, 5: 3, 6: 3 });
  assert.equal(migrateLadder(null, JSON.stringify({ 1: 3 })), null, "one old wave is not a whole new flight");
  assert.deepEqual(readUnlock(null, { 1: 2, 2: 1 }), { unlock: 3, migrated: true });
  assert.deepEqual(readUnlock("5", {}), { unlock: 5, migrated: false });
  assert.equal(recommended(3, { 1: 3, 2: 1 }), 3);
  assert.equal(recommended(3, { 1: 3, 2: 1, 3: 3 }), 2);
});

test("the words: kind comparisons, exact near misses, a dry line per result", () => {
  assert.equal(compareLine(120, 100, "রাফি"), "রাফির চেয়ে ২০ পয়েন্ট বেশি।");
  assert.equal(compareLine(100, 100, ""), "বন্ধু আর তুমি একদম সমান সমান।");
  assert.match(compareLine(90, 100, ""), /আর একটু হলেই/);
  const base = { landing: 1, candies: 2, total: 5, goal: 3, meters: 16, full: 16, crashes: 0, level: 1, bullMiss: 0 };
  assert.equal(nearMiss(base), "আর ১টা লজেন্স হলেই আরেকটা তারা।");
  assert.equal(nearMiss({ ...base, candies: 3, bullMiss: 20 }), "মাঝখানের দাগ থেকে মাত্র ২ বিঘত দূরে নামল।");
  assert.equal(nearMiss({ ...base, landing: 0, meters: 10 }), "আর ৬ মিটার গেলেই নামার জায়গা।");
  assert.match(resultLine({ ...base, landing: 0, meters: 10 }), /১৬ মিটারের মধ্যে ১০ মিটার/);
  assert.match(resultLine({ ...base, landing: 2, candies: 5 }), /সব লজেন্স/);
});

test("content: SEO limits, unique Bangla in NFC, at least 6 FAQs, every level has its one line", () => {
  assert.ok([...site.title].length <= 45 && site.title.startsWith("প্লেন গেম"), site.title);
  const description = [...site.description].length;
  assert.ok(description >= 120 && description <= 160, `description ${description}`);
  assert.ok(site.headline && site.headline !== site.title);
  assert.ok(site.faq.length >= 6 && site.faq.some(item => item.question === "কয়টা লেভেল আছে?"));
  assert.ok(site.privacy.some(line => line.includes("লিংক")));
  const copy = JSON.stringify(site) + LEVELS.map(level => level.name + level.line).join(" ") + STORY.join(" ") + share.preview("").title;
  assert.equal(copy, copy.normalize("NFC"));
  assert.doesNotMatch(copy, /আপনি|করুন|টাকা জিত|বাজি|জুয়া|গুলি|বন্দুক|শত্রু/);
  assert.equal(new Set(LEVELS.map(level => level.name)).size, LEVELS.length);
  for (let level = 1; level <= LEVELS.length; level++) assert.ok(levelOf(level).line.length < 110, `level ${level} line`);
});
