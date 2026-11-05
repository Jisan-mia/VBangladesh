// Challenge links (old ones still open), saved-progress migration, the lines, and the page's words.
import assert from "node:assert/strict";
import test from "node:test";
import { readLevels, unlockedLevel } from "../../../shared/game-core";
import { site } from "../content";
import { BASKET, BIKE, BRANCH, COW, GATE_M, LINE, MUD, PUDDLE, SIGN, TIRE } from "../lib/course";
import { LEVEL_COUNT, LEVELS, MODE_INFO, nextAhead, openLevel, readAhead, starsOf } from "../lib/levels";
import {
  bands, bumpLine, caption, compareLine, endlessLine, friendClaim, friendFits, friendLine, headline, humanLine, KEYS, LADDER, MAX_METERS, migrateLadder, nearMiss,
  parseShared, previewTitle, seconds, sharedHash, SLUG, starsOfShared, type Shared,
} from "../lib/link";
import { share } from "../share";

const base: Shared = { seed: 777, meters: 340, name: "মিম", level: 6, mode: "n", slow: false, stumbles: 1, pages: 2, tenths: 312, won: true, oldDay: 0 };

test("new links round-trip and carry the level, mode, stumbles, pages, time and slow mode", () => {
  const hash = sharedHash(base);
  assert.equal(hash, `s=777&t=340&l=6&v=2&k=1&p=2&c=312&n=${encodeURIComponent("মিম")}`);
  assert.deepEqual(parseShared(`#${hash}`), base);
  const endless: Shared = { ...base, level: 0, meters: 1480, stumbles: 0, pages: 0, mode: "e", slow: true, won: false };
  assert.deepEqual(parseShared(sharedHash(endless)), endless);
  const lost: Shared = { ...base, level: 12, meters: 410, won: false, stumbles: 3, pages: 0, mode: "h", tenths: 421 };
  assert.deepEqual(parseShared(sharedHash(lost)), lost);
  assert.equal(share.normalize(hash), hash);
});

test("old links still open: the endless road as ever, and an old school day opens level 2·day−1 with the friend's seed", () => {
  for (const old of ["s=9&t=40", "s=123456&t=1480&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF", "s=4821&t=300&l=1", "s=7&t=900&l=6&n=%E0%A6%A8%E0%A7%80%E0%A6%B2%E0%A6%BE"]) {
    const shared = parseShared(old)!;
    assert.ok(shared, old);
    assert.ok(parseShared(sharedHash(shared)), `${old} still parses after being written back`);
  }
  const endless = parseShared("s=9&t=40")!;
  assert.deepEqual(endless, { seed: 9, meters: 40, name: "", level: 0, mode: "n", slow: false, stumbles: 0, pages: 0, tenths: 0, won: false, oldDay: 0 });
  assert.equal(sharedHash(endless), "s=9&t=40&l=0&v=2", "an old endless link is written back as a new one, the same road");
  const day = parseShared("s=4821&t=300&l=1")!;
  assert.equal(day.level, 1);
  assert.equal(day.oldDay, 1);
  assert.equal(sharedHash(day), "s=4821&t=300&l=1", "an old day link is written back as it was");
  assert.equal(share.normalize("t=300&s=4821&l=1&x=2"), "s=4821&t=300&l=1");
  assert.equal(parseShared("s=7&t=900&l=6")!.level, 11, "Thursday opens level 11");
  assert.equal(parseShared("s=7&t=300&l=2")!.level, 3);
  assert.equal(parseShared("s=7&t=501&l=3"), null, "more than the old Monday had");
  assert.equal(parseShared("s=7&t=1001&l=6"), null, "more than Thursday's gate");
  assert.equal(starsOfShared(day), 0, "an old claim carries no stars");
  assert.equal(friendLine(day), "বন্ধু আগের খেলায় শনিবার ৩০০ মিটার গিয়েছিল।");
  assert.match(friendClaim(day), /আগের খেলার স্কোর/);
  assert.equal(compareLine({ won: true, stumbles: 0, pages: 3, tenths: 80, meters: 90 }, day), "", "an old score is never compared");
  assert.equal(previewTitle(parseShared("s=7&t=900&l=6&n=%E0%A6%A8%E0%A7%80%E0%A6%B2%E0%A6%BE")!), "নীলা বৃহস্পতিবার স্কুলের পথে ৯০০ মিটার গেছে। তুমি পারবে?");
  assert.equal(previewTitle(endless), "স্কুলের পথে ৪০ মিটার! তুমি পারবে?");
  assert.equal(friendLine(parseShared("s=7&t=1480&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF")!), "রাফি যত দূর পারো-তে ১৪৮০ মিটার গেছে।");
});

test("og=1 asks for the preview card, is accepted only as 1, and is never written back", () => {
  const hash = sharedHash(base);
  assert.deepEqual(parseShared(`${hash}&og=1`), base);
  assert.equal(parseShared(`${hash}&og=2`), null);
  assert.equal(share.normalize(`${hash}&og=1`), hash);
  assert.equal(parseShared("s=9&t=40&og=1")?.level, 0, "an old endless link can ask for it too");
});

test("hostile or impossible links are rejected", () => {
  for (const bad of ["", "#", "s=0&t=30", "s=1&t=-1", "s=1&t=5", "s=1.5&t=30", "s=abc&t=30", `s=1&t=${MAX_METERS + 1}`, "s=99999999999&t=100", `s=1&t=100&n=${"x".repeat(700)}`,
    // new keys without v=2, a wrong version, an unknown mode or a mode of "n", a level that does not exist, a leading zero
    "s=1&t=100&k=1&p=1&c=100", "s=1&t=100&l=1&v=3&k=0&p=0&c=100", "s=1&t=90&l=1&v=2&m=x&k=0&p=0&c=100", "s=1&t=90&l=1&v=2&m=n&k=0&p=0&c=100", "s=1&t=90&l=13&v=2&k=0&p=0&c=100", "s=1&t=90&l=01&v=2&k=0&p=0&c=100",
    // a level's link must have its stumbles, pages and time, inside what the level has
    "s=1&t=90&l=1&v=2&p=0&c=100", "s=1&t=90&l=1&v=2&k=0&c=100", "s=1&t=90&l=1&v=2&k=0&p=0", "s=1&t=90&l=1&v=2&k=0&p=4&c=100", "s=1&t=91&l=1&v=2&k=0&p=0&c=100", "s=1&t=90&l=1&v=2&k=0&p=0&c=0",
    "s=1&t=90&l=1&v=2&k=0&p=0&c=99999", "s=1&t=90&l=1&v=2&k=0&p=0&c=100&d=yes", "s=1&t=30&l=0&v=2&k=1", "s=1&t=30&l=0&v=2&p=1",
    // an old day link with an impossible metre count
    "s=1&t=400&l=1", "s=1&t=30&l=7", "s=1&t=30&l=0"]) {
    assert.equal(parseShared(bad), null, bad);
  }
  const hostile = parseShared(`s=5&t=80&n=${encodeURIComponent("  রা‮ফি\u0000  খুব লম্বা একটা নাম যেটা বিশ অক্ষরের বেশি ")}`);
  assert.ok(hostile && !/[\u0000‮]/.test(hostile.name) && [...hostile.name].length <= 20);
  assert.equal(share.normalize("<script>"), null);
  assert.ok(share.preview("nope").title.length > 0);
  assert.equal(share.tally, undefined);
  assert.equal(share.normalize("t=340&n=%E0%A6%AE&s=777&l=6&v=2&k=1&p=2&c=312&x=1"), "s=777&t=340&l=6&v=2&k=1&p=2&c=312&n=%E0%A6%AE");
});

test("saved progress: the six days move into the 12-level ladder once, the endless best moves up to half the week", () => {
  const from = (days: Record<number, number>) => readLevels(migrateLadder(null, JSON.stringify(days), null), LEVEL_COUNT);
  assert.deepEqual(from({ 1: 3, 2: 1 }), { 1: 3, 2: 3, 3: 1, 4: 1 });
  assert.equal(unlockedLevel(from({ 1: 3, 2: 1 }), LEVEL_COUNT), 5, "days 1 and 2 open levels up to 4, and the next one");
  assert.equal(unlockedLevel(from({ 6: 2 }), LEVEL_COUNT), LEVEL_COUNT);
  assert.deepEqual(readLevels(migrateLadder(null, null, "950"), LEVEL_COUNT), { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 }, "a best of 950 passed the first three gates");
  assert.deepEqual(readLevels(migrateLadder(null, null, "250"), LEVEL_COUNT), {});
  assert.equal(migrateLadder(null, null, "250"), null, "nothing to move");
  assert.equal(migrateLadder(null, null, null), null);
  assert.equal(migrateLadder("{}", JSON.stringify({ 1: 3 }), "900"), null, "the ladder already exists: it runs once");
  assert.equal(migrateLadder(null, "junk{", null), null);
  // The ladder lives under its own key; the six days' key and the best stay put.
  assert.equal(KEYS.ladder, `ektukhani-levels-${LADDER}`);
  assert.equal(KEYS.days, `ektukhani-levels-${SLUG}`);
  assert.equal(KEYS.best, `ektukhani-best-${SLUG}`);
});

test("a friend's far-ahead level keeps its stars but opens nothing in between", () => {
  const stars = { 1: 3, 2: 2, 9: 3 };
  assert.equal(openLevel(stars, [9]), 3, "levels 3..8 stay shut");
  assert.equal(openLevel(stars, []), unlockedLevel(stars, LEVEL_COUNT), "without the list the shared rule applies");
  assert.deepEqual(nextAhead({ 1: 3, 2: 2 }, [], 9), [9]);
  assert.deepEqual(nextAhead({ 1: 3, 2: 2, 3: 1 }, [9], 4), [9], "your own next level is not 'ahead'");
  assert.deepEqual(nextAhead({ 1: 3, 2: 2, 3: 1, 4: 1, 9: 3 }, [9], 5), [9]);
  assert.equal(openLevel({ 1: 3, 2: 2, 3: 1, 4: 2, 5: 1, 6: 1, 7: 1, 8: 1, 9: 3 }, [9]), 10, "once your own play reaches it, it is yours");
  assert.deepEqual(readAhead("[9, 3, 9, 99, \"x\"]"), [3, 9]);
  assert.deepEqual(readAhead("junk"), []);
  assert.deepEqual(readAhead(null), []);
});

test("stars are three jobs and the near-miss says the exact number", () => {
  assert.equal(starsOf(true, 0, 3, 2), 3);
  assert.equal(nearMiss({ level: 3, won: false, stumbles: 3, pages: 1, meters: 150, best: null, mode: "n" }), "আর ১টা হোঁচট কম হলেই সময়মতো গেটে।");
  assert.equal(nearMiss({ level: 3, won: false, stumbles: 2, pages: 1, meters: 150, best: null, mode: "h" }), "আর ১টা হোঁচট কম হলেই সময়মতো গেটে।");
  assert.equal(nearMiss({ level: 3, won: false, stumbles: 8, pages: 1, meters: 150, best: null, mode: "n" }), "আর ৭০ মিটার গেলেই বাঁশঝাড় পার।");
  assert.equal(nearMiss({ level: 3, won: true, stumbles: 0, pages: 2, meters: 220, best: null, mode: "n" }), "আর ১টা পাতা কুড়ালেই ৩ তারা।");
  assert.equal(nearMiss({ level: 3, won: true, stumbles: 1, pages: 3, meters: 220, best: null, mode: "n" }), "একবারও হোঁচট না খেলেই ৩ তারা।");
  assert.equal(nearMiss({ level: 3, won: true, stumbles: 0, pages: 3, meters: 220, best: null, mode: "n" }), "");
  assert.equal(nearMiss({ level: 0, won: false, stumbles: 0, pages: 0, meters: 880, best: 920, mode: "n" }), "আর ৪০ মিটার গেলেই নতুন সেরা।");
  assert.equal(nearMiss({ level: 0, won: false, stumbles: 0, pages: 0, meters: 300, best: 920, mode: "n" }), "");
});

test("lines: bands, headlines, bump lines, comparisons, previews and captions", () => {
  assert.equal(endlessLine(0), bands[0].line);
  assert.equal(endlessLine(99), bands[0].line);
  assert.equal(endlessLine(100), bands[1].line);
  assert.equal(endlessLine(999), bands[3].line);
  assert.equal(endlessLine(GATE_M), "ঘণ্টা পড়ার আগেই গেটে!");
  assert.equal(endlessLine(20000), bands[5].line);
  assert.equal(headline(0, false, 523), "বেল পড়ে গেল!");
  assert.equal(headline(0, false, 1200), "আজ আর লেট না!");
  assert.equal(headline(4, true, 300), "ঠিক সময়ে গেটে!");
  assert.equal(headline(4, false, 200), "দেরি হয়ে গেল!");
  for (const kind of [PUDDLE, MUD, BASKET, BIKE, COW, LINE, BRANCH, SIGN, TIRE]) assert.ok(bumpLine(kind).length > 8, `kind ${kind}`);
  assert.equal(new Set([PUDDLE, MUD, BASKET, BIKE, COW, LINE, BRANCH, SIGN, TIRE].map(bumpLine)).size, 9, "every thing trips you its own way");
  assert.equal(humanLine({ level: 5, won: true, stumbles: 0, pages: 3, meters: 300 }), "একবারও হোঁচট নেই, খাতার সব পাতাও ব্যাগে।");
  assert.equal(humanLine({ level: 5, won: true, stumbles: 2, pages: 0, meters: 300 }), "২ বার হোঁচট খেয়েও ঠিক সময়ে গেটে।");
  assert.equal(humanLine({ level: 5, won: false, stumbles: 4, pages: 0, meters: 220 }), "৪ বার হোঁচট খেয়ে সময় ফুরিয়ে গেল।");
  assert.equal(humanLine({ level: 5, won: false, stumbles: 1, pages: 0, meters: 220 }), "একবার হোঁচটেই সময় ফুরিয়ে গেল।");
  // Against a friend on the same road: who made it, then stumbles, pages, time.
  const friend: Shared = { ...base, level: 6, stumbles: 1, pages: 2, tenths: 312 };
  assert.equal(compareLine({ won: true, stumbles: 0, pages: 2, tenths: 340, meters: 340 }, friend), "মিমের চেয়ে ১ বার কম হোঁচট।");
  assert.equal(compareLine({ won: true, stumbles: 1, pages: 3, tenths: 340, meters: 340 }, friend), "মিমের চেয়ে ১টা পাতা বেশি কুড়ালে।");
  assert.equal(compareLine({ won: true, stumbles: 1, pages: 2, tenths: 290, meters: 340 }, friend), "মিমের চেয়ে ২.২ সেকেন্ড আগে!");
  assert.match(compareLine({ won: true, stumbles: 1, pages: 2, tenths: 320, meters: 340 }, friend), /^আর একটু হলেই!/);
  assert.equal(compareLine({ won: false, stumbles: 3, pages: 0, tenths: 400, meters: 200 }, friend), "মিম ঠিক সময়ে পৌঁছেছে। আরেকবার?");
  assert.equal(compareLine({ won: true, stumbles: 2, pages: 0, tenths: 400, meters: 340 }, { ...friend, won: false, meters: 200 }), "মিম সময়মতো পৌঁছাতে পারেনি, তুমি পারলে।");
  assert.equal(compareLine({ won: false, stumbles: 0, pages: 0, tenths: 0, meters: 1048 }, { ...base, level: 0, meters: 928 }), "মিমের চেয়ে ১২০ মিটার বেশি!");
  assert.match(previewTitle(friend), /ঘণ্টার আগেই.*তুমি পারবে\?$/);
  assert.match(previewTitle({ ...friend, won: false, meters: 200 }), /মিটার গিয়ে দেরি করে ফেলল/);
  assert.match(caption({ meters: 1200, level: 0, won: false }), /ঘণ্টা পড়ার আগেই/);
  assert.match(caption({ meters: 340, level: 6, won: true }), /ঘণ্টা পড়ার আগেই/);
  assert.match(caption({ meters: 200, level: 6, won: false }), /ঘণ্টা শুনলাম/);
});

test("a friend's road fits a run when seed, level and (for new links) mode match", () => {
  assert.equal(friendFits(base, 777, 6, "n"), true);
  assert.equal(friendFits(base, 777, 6, "e"), false);
  assert.equal(friendFits(base, 778, 6, "n"), false);
  assert.equal(friendFits(base, 777, 5, "n"), false);
  assert.equal(friendFits(parseShared("s=9&t=40"), 9, 0, "h"), true, "the endless road is the same in any mode");
  assert.equal(friendFits(parseShared("s=9&t=300&l=1"), 9, 1, "e"), true, "an old day link has no mode");
  assert.equal(friendFits(null, 1, 1, "n"), false);
});

test("content meets the SEO limits, has enough FAQs, stays clear of famous runner names and uses plain তুমি", () => {
  assert.ok([...site.title].length <= 45, `title ${[...site.title].length}`);
  const description = [...site.description].length;
  assert.ok(description >= 120 && description <= 160, `description ${description}`);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.steps.length >= 3 && site.privacy.some(line => line.includes("শেয়ার")));
  assert.equal(site.slug, "deri-hoye-gelo");
  assert.equal(site.name, "দেরি হয়ে গেল!");
  assert.equal(site.headline, "ঘণ্টা বাজছে, জলদি গেটে চলো!");
  assert.doesNotMatch(`${site.title} ${site.name}`, /run|surf|রান|সার্ফ|দৌ(?:ড়|ড়)/i);
  assert.doesNotMatch(JSON.stringify(site), /subway|temple|surfer|আপনি|করুন/i);
  assert.equal(JSON.stringify(site), JSON.stringify(site).normalize("NFC"), "Bangla is NFC");
  assert.equal(new Set(site.faq.map(item => item.question)).size, site.faq.length);
  for (const mode of ["e", "n", "h"] as const) assert.ok(MODE_INFO[mode].line.length > 10);
  assert.equal(LEVELS.length, 12);
});
