import assert from "node:assert/strict";
import test from "node:test";
import { site } from "../content";
import { share } from "../share";
import { parseShared, sharedHash, OLD_COUNTS } from "../lib/challenge";
import { countOf, needZaps, LEVEL_COUNT, LEVELS } from "../lib/levels";
import { bannerNote, caption, clearLine, compareLine, feat, heading, hitWord, humanLine, lossLine, nearMissLine, previewTitle, tallyLine } from "../lib/lines";

const levels = Array.from({ length: LEVEL_COUNT }, (_, index) => index + 1);

test("old links still parse with the old rules, keep their exact shape, and open the same রাত number and seed", () => {
  const hash = "s=4242&t=15&l=7&b=1&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF";
  const old = parseShared(`#${hash}`);
  assert.deepEqual(old, { level: 7, seed: 4242, zaps: 15, bites: 1, name: "রাফি", mode: 1, old: true });
  assert.equal(share.normalize(hash), hash, "an old link normalizes to itself");
  assert.equal(previewTitle(old!), "রাফি রাত ৭-এ ১৫টা মশা মেরেছে। তুমি পারবে?");
  assert.match(bannerNote(old!), /আগের সংস্করণে রাফির নিজের ফোনের হিসাব/);
  assert.ok(parseShared("s=777&t=5&l=2&b=1&n=Rafi"), "the README's live link");
  assert.ok(parseShared(`s=9&t=${OLD_COUNTS[19] - 2}&l=20&b=2`), "every old night's mosquitoes are a fair claim");
  for (const bad of ["s=4242&t=17&l=7&b=1", "s=4242&t=5&l=7&b=3", "s=4242&t=5&l=7&b=0&d=1"]) assert.equal(parseShared(bad), null, bad);
});

test("new links carry v=2 and the mode, and are checked against that রাত's count and mode", () => {
  const shared = { level: 12, seed: 4242, zaps: 14, bites: 4, name: "", mode: 0, old: false };
  const hash = sharedHash(shared);
  assert.equal(hash, "s=4242&t=14&l=12&b=4&v=2&d=0");
  assert.deepEqual(parseShared(hash), shared);
  assert.equal(share.normalize(hash), hash);
  assert.equal(parseShared("s=4242&t=14&l=12&b=4&v=2&d=1"), null, "four bites wake him on স্বাভাবিক");
  assert.equal(parseShared("s=4242&t=14&l=12&b=1&v=2&d=2"), null, "one bite wakes him on কঠিন");
  assert.ok(parseShared(`s=4242&t=${countOf(12)}&l=12&b=0&v=2&d=2`), "every mosquito is a fair claim");
  assert.equal(parseShared(`s=4242&t=${countOf(12) + 1}&l=12&b=0&v=2&d=2`), null, "one more is not");
  assert.equal(parseShared("s=4242&t=3&l=1&b=0&v=2")?.mode, 1, "no d: স্বাভাবিক");
  assert.match(bannerNote(parseShared(hash)!), /সহজ খেলায়/);
});

test("hostile or impossible links are refused, names are cleaned and capped", () => {
  for (const bad of [
    "s=4242&t=5&l=21&b=0", "s=4242&t=5&l=0&b=0", "s=4242&t=5&l=07&b=0", "s=4242&t=5&l=7", "s=4242&t=5&b=0",
    "s=0&t=5&l=7&b=0", "s=4242&t=-1&l=7&b=0", "s=4242&t=1.5&l=7&b=0", "s=4242&t=5&l=7&b=-1", "s=4242&t=999&l=20&b=0",
    "s=4242&t=5&l=7&b=0&v=3", "s=4242&t=5&l=7&b=0&v=2&d=3", "s=4242&t=5&l=7&b=0&v=2&d=x", "s=4242&t=5&l=7&b=12&v=2",
    `s=4242&t=5&l=7&b=0&n=${"x".repeat(700)}`, "", "junk",
  ]) assert.equal(parseShared(bad), null, bad);
  const long = parseShared(`s=1&t=3&l=1&b=0&n=${encodeURIComponent("রাফি‮\u0007" + "ক".repeat(40))}`);
  assert.ok(long && [...long.name].length <= 20 && !/[‮\u0007]/.test(long.name));
  assert.ok(share.preview("junk").title.length > 0);
});

test("lines: exact, kind, in তুমি, and one morning per night", () => {
  assert.equal(new Set(levels.map(clearLine)).size, LEVEL_COUNT);
  assert.equal(nearMissLine(7, needZaps(7) - 2, 1), "আর ২টা মশা মারলে আরেকটা তারা। একটাও কামড় না খেলে আরেকটা।");
  assert.equal(nearMissLine(7, needZaps(7), 1), "একটাও কামড় না খেলে আরেকটা তারা।");
  assert.equal(nearMissLine(7, needZaps(7), 0), "");
  assert.match(lossLine(3, 6, 0, false), /আর ৬ সেকেন্ড/);
  assert.match(lossLine(7, 0, 0, false), /ফুটো/);
  assert.match(lossLine(4, 2, 1, false), /চড়/);
  assert.match(lossLine(5, 0, 0, true), /পালোয়ান মশা বাকি/);
  assert.equal(heading({ level: 5, won: true, firstClear: true, hearts: 3 }), "পালোয়ান মশা কাত!");
  assert.equal(heading({ level: 3, won: true, firstClear: false, hearts: 3 }), "রাত ৩ পার");
  assert.equal(heading({ level: 3, won: false, firstClear: false, hearts: 1 }), "এক কামড়েই ঘুম ভেঙে গেল");
  assert.match(humanLine({ level: 7, zaps: 14, bites: 0 }), /মশারি/);
  assert.match(humanLine({ level: 20, zaps: 30, bites: 2 }), /২০ রাত/);
  assert.equal(tallyLine({ level: 7, zaps: 12, bites: 1 }), `${new Intl.NumberFormat("bn-BD").format(countOf(7))}টা মশার ১২টা ব্যাটে · কামড় ১টা`);
  assert.equal(compareLine({ zaps: 15, bites: 0 }, { zaps: 12, bites: 0 }, "রাফি"), "রাফির চেয়ে ৩টা বেশি!");
  assert.match(compareLine({ zaps: 12, bites: 0 }, { zaps: 12, bites: 2 }, "রাফি"), /কামড় কম/);
  assert.match(compareLine({ zaps: 11, bites: 0 }, { zaps: 12, bites: 0 }, ""), /আর একটু হলেই! বন্ধু/);
  assert.equal(hitWord(1, 1), "চট!");
  assert.equal(hitWord(3, 5), "এক চাপে ৩টা!");
  assert.equal(hitWord(1, 4), "টানা ৪");
  assert.equal(feat({ level: 7, zaps: 15, name: "" }), "এক বন্ধু রাত ৭-এ ১৫টা মশা মেরেছে");
  assert.match(caption({ level: 3, zaps: 9, bites: 0 }), /তুমি কয়টা মারবে\?$/);
  const all = [...levels.flatMap(level => [clearLine(level), lossLine(level, 3, 0, false), LEVELS[level - 1].line]), caption({ level: 3, zaps: 9, bites: 0 })].join(" ");
  assert.doesNotMatch(all, /আপনি|করুন|দেখুন|অসাধারণ|দারুণ|রক্ত|ডেঙ্গু/);
  assert.equal(all, all.normalize("NFC"));
});

test("content meets the SEO limits, speaks তুমি, and carries the dengue tip exactly once, calmly", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.ok(site.title.startsWith("মশা মারার গেম"));
  assert.equal(site.slug, "moshar-raat");
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.equal(site.headline, "ভোর পর্যন্ত বালিশটা বাঁচাতে পারবে?", "the H1 is unchanged");
  assert.ok(site.faq.length >= 6);
  const text = JSON.stringify(site);
  assert.equal(text.match(/জমা পানি/g)?.length, 1, "the tip appears once on the page");
  assert.doesNotMatch(text, /আপনি|করুন|দেখুন|ডেঙ্গু|জ্বর|মৃত্যু|বিপদ|সাবধান|অসাধারণ|দারুণ/);
  assert.match(site.privacy.join(" "), /সিড/);
  assert.equal(text, text.normalize("NFC"));
});
