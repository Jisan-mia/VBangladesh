import assert from "node:assert/strict";
import test from "node:test";
import { site } from "../content";
import { share } from "../share";
import { createGame } from "../lib/afternoon";
import { parseShared, sharedHash } from "../lib/challenge";
import { migrateBest, oldMaxSaved, OLD_LEVELS } from "../lib/legacy";
import { LEVEL_COUNT, LEVELS } from "../lib/levels";
import { bannerNote, caption, clearLine, compareLine, feat, heading, hitWord, humanLine, lossLine, nearMissLine, previewTitle, tallyLine } from "../lib/lines";

const levels = Array.from({ length: LEVEL_COUNT }, (_, index) => index + 1);

/**
 * The ten-field game's afternoons, recorded before it was rewritten: [seed, field, birds that came, then the most grain a run
 * that shooed 0, half, all-but-one, all of them could keep]. oldMaxSaved must give exactly these, or an old link would be refused.
 */
const GOLDEN = [
  [48213, 1, 39, 0, 0, 98, 100], [777, 1, 38, 0, 0, 98, 100], [90210, 1, 39, 0, 0, 98, 100],
  [48213, 4, 45, 0, 0, 97, 100], [777, 4, 44, 0, 0, 98, 100], [90210, 4, 41, 0, 0, 97, 100],
  [48213, 7, 48, 0, 0, 98, 100], [777, 7, 52, 0, 0, 98, 100], [90210, 7, 49, 0, 0, 98, 100],
  [48213, 10, 58, 0, 0, 97, 100], [777, 10, 59, 0, 0, 98, 100], [90210, 10, 59, 0, 0, 97, 100],
] as const;

test("old links still parse with the old rules, keep their exact shape, and open the same ক্ষেত number and seed", () => {
  for (const [seed, level, birds, none, half, almost, all] of GOLDEN) {
    assert.deepEqual([0, Math.floor(birds / 2), birds - 1, birds].map(count => oldMaxSaved(seed, level, count)), [none, half, almost, all], `seed ${seed} field ${level}`);
    assert.equal(oldMaxSaved(seed, level, birds + 1), -1, "more shooed than came");
  }
  const hash = "s=48213&t=88&c=34&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF";
  const old = parseShared(`#${hash}`);
  assert.deepEqual(old, { level: 1, seed: 48213, grain: 88, shooed: 34, name: "রাফি", mode: 1, old: true });
  assert.equal(share.normalize(hash), hash, "an old link normalizes to itself");
  assert.equal(sharedHash(old!), hash);
  assert.equal(previewTitle(old!), "রাফি চড়ুই তাড়িয়ে ৮৮% ধান বাঁচিয়েছে। তুমি পারবে?");
  assert.match(bannerNote(old!), /আগের সংস্করণে রাফির নিজের ফোনের হিসাব/);
  const field7 = parseShared("s=777&t=90&c=50&l=7");
  assert.deepEqual(field7 && [field7.level, field7.old], [7, true]);
  assert.equal(sharedHash(field7!), "s=777&t=90&c=50&l=7", "an old link with a field keeps its shape");
  assert.equal(parseShared("s=777&t=100&c=60&l=7"), null, "more birds than came");
  assert.ok(parseShared("s=777&t=100&c=52&l=7"), "every old bird shooed: the whole field is a fair claim");
  assert.equal(parseShared("s=777&t=1&c=53&l=7"), null, "52 came");
  for (const [seed, level, , none] of GOLDEN) assert.equal(parseShared(`s=${seed}&t=${none + 1}&c=0&l=${level}`), null, `nobody shooed: ${none} at most`);
  assert.equal(OLD_LEVELS, 10);
  assert.equal(parseShared("s=777&t=50&c=3&l=11"), null, "the old game had no field 11");
});

test("new links carry v=2 and the mode, and are checked against that ক্ষেত's birds, marks and mode", () => {
  const shared = { level: 7, seed: 4242, grain: 84, shooed: 20, name: "রাফি", mode: 1, old: false };
  const hash = sharedHash(shared);
  assert.equal(hash, "s=4242&t=84&c=20&l=7&v=2&d=1&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  assert.deepEqual(parseShared(hash), shared);
  assert.equal(share.normalize(hash), hash);
  const easy = { ...shared, name: "", mode: 0, grain: 83 };
  assert.deepEqual(parseShared(sharedHash(easy)), easy);
  assert.equal(parseShared("s=4242&t=83&c=20&l=7&v=2&d=1"), null, "an odd loss on স্বাভাবিক: pecks take 2%");
  assert.equal(parseShared("s=4242&t=40&c=20&l=7&v=2&d=1"), null, "under the pass mark: no card for a lost ক্ষেত");
  assert.ok(parseShared(`s=4242&t=100&c=${createGame(7, 4242, 1).n}&l=7&v=2&d=1`), "every bird is a fair claim");
  assert.equal(parseShared(`s=4242&t=100&c=${createGame(7, 4242, 1).n + 1}&l=7&v=2&d=1`), null, "one more is not");
  assert.equal(parseShared("s=4242&t=84&c=20&l=7&v=2")?.mode, 1, "no d: স্বাভাবিক");
  assert.match(bannerNote(parseShared(sharedHash({ ...shared, mode: 2, grain: 85 }))!), /কঠিন খেলায়/);
  assert.equal(parseShared("s=4242&t=84&c=20&l=13&v=2&d=1"), null, "a ক্ষেত that doesn't exist");
});

test("hostile or impossible links are refused, names are cleaned and capped", () => {
  for (const bad of [
    "s=4242&t=84&c=20&l=0&v=2&d=1", "s=4242&t=84&c=20&l=07&v=2&d=1", "s=0&t=84&c=20&l=7&v=2&d=1", "s=4242&t=-1&c=20&l=7&v=2&d=1", "s=4242&t=1.5&c=20&l=7&v=2",
    "s=4242&t=84&c=20&l=7&v=3", "s=4242&t=84&c=20&l=7&v=2&d=3", "s=4242&t=84&c=20&l=7&v=2&d=x", "s=4242&t=84&c=-1&l=7&v=2", "s=4242&t=84&c=100&l=7&v=2",
    "s=4242&t=84&c=20&d=1", "s=4242&t=84&c=20&l=7&d=1", `s=4242&t=84&c=20&l=7&v=2&n=${"x".repeat(700)}`, "", "junk",
  ]) assert.equal(parseShared(bad), null, bad);
  const long = parseShared(`s=1&t=100&c=3&l=1&v=2&d=1&n=${encodeURIComponent("রাফি‮\u0007" + "ক".repeat(40))}`);
  assert.ok(long && [...long.name].length <= 20 && !/[‮\u0007]/.test(long.name));
  assert.ok(share.preview("junk").title.length > 0);
});

test("the old best moves into ক্ষেত 1's stars once, and only when there is nothing newer", () => {
  assert.equal(migrateBest(false, "88"), 2);
  assert.equal(migrateBest(false, "95"), 3);
  assert.equal(migrateBest(false, "12"), 0, "it never cleared the field: nothing to move");
  assert.equal(migrateBest(false, null), 0);
  assert.equal(migrateBest(false, "x"), 0);
  assert.equal(migrateBest(false, "250"), 0);
  assert.equal(migrateBest(true, "95"), 0, "already moved");
});

test("lines: exact, kind, in তুমি, and one evening per ক্ষেত", () => {
  assert.equal(new Set(levels.map(clearLine)).size, LEVEL_COUNT);
  assert.equal(nearMissLine(7, 40, 0), "আর ৫% ধান বাঁচলেই ক্ষেত পার।");
  assert.equal(nearMissLine(7, 50, 1), "আর ১৬% ধান বাঁচলেই ২ তারা।");
  assert.equal(nearMissLine(7, 90, 3), "");
  assert.match(lossLine(7, 6, false), /আর ৬ সেকেন্ড/);
  assert.match(lossLine(8, 0, true), /ঝুঁটি শালিক বাকি/);
  assert.match(lossLine(6, 0, false), /ছায়া/);
  assert.equal(heading({ level: 4, stars: 2, lost: false, firstClear: true }), "পালের গোদা পালাল!");
  assert.equal(heading({ level: 2, stars: 1, lost: false, firstClear: false }), "ক্ষেত ২ পার");
  assert.equal(heading({ level: 2, stars: 0, lost: true, firstClear: false }), "সব ধান খেয়ে ফেলল");
  assert.equal(heading({ level: 2, stars: 0, lost: false, firstClear: false }), "ধান কম পড়ল");
  const sh = { level: 7, grain: 84, shooed: 20, name: "রাফি" };
  assert.match(humanLine(sh), /ভালো পাহারা/);
  assert.match(humanLine({ level: 12, grain: 90 }), /বারোটা ক্ষেত/);
  assert.equal(tallyLine(sh), "২০টা পাখি হুশ · ধান রইল ৮৪%");
  assert.equal(feat(sh), "রাফি ক্ষেত ৭-এ ৮৪% ধান বাঁচিয়েছে");
  assert.equal(compareLine({ grain: 90, shooed: 10 }, { grain: 84, shooed: 10 }, "রাফি"), "রাফির চেয়ে ৬% বেশি ধান বাঁচালে!");
  assert.equal(compareLine({ grain: 84, shooed: 12 }, { grain: 84, shooed: 10 }, "রাফি"), "ধান সমান সমান, তবে রাফির চেয়ে ২টা পাখি বেশি তাড়ালে!");
  assert.equal(compareLine({ grain: 84, shooed: 10 }, { grain: 84, shooed: 10 }, "রাফি"), "রাফি আর তুমি একদম সমান সমান!");
  assert.equal(compareLine({ grain: 80, shooed: 10 }, { grain: 84, shooed: 10 }, "রাফি"), "আর একটু হলেই! রাফির চেয়ে মাত্র ৪% কম।");
  assert.equal(compareLine({ grain: 50, shooed: 10 }, { grain: 84, shooed: 10 }, ""), "বন্ধু এবার ৩৪% এগিয়ে। একই ক্ষেতে আরেকবার?");
  assert.equal(hitWord(3, 5, 0), "এক তালিতে ৩টা!");
  assert.equal(hitWord(1, 4, 0), "টানা ৪");
  assert.equal(new Set([0, 1, 2].map(turn => hitWord(1, 1, turn))).size, 3, "the plain shoo varies");
  assert.match(caption(sh), /কত বাঁচাবে\?$/);
  const all = [...levels.flatMap(level => [clearLine(level), lossLine(level, 3, false), LEVELS[level - 1].line]), caption(sh), previewTitle(sh)].join(" ");
  assert.doesNotMatch(all, /আপনি|করুন|দেখুন|অসাধারণ|দারুণ|মারা|মরে|বন্দুক/);
  assert.equal(all, all.normalize("NFC"));
});

test("content meets the SEO limits, speaks তুমি, and never hurts a bird", () => {
  assert.ok([...site.title].length <= 45, String([...site.title].length));
  assert.ok(site.title.startsWith("পাখি তাড়ানোর"));
  assert.equal(site.slug, "churui-tarao");
  assert.ok([...site.description].length >= 120 && [...site.description].length <= 160, String([...site.description].length));
  assert.equal(site.headline, "ধান পেকেছে, চড়ুই এসেছে!", "the H1 is unchanged");
  assert.ok(site.faq.length >= 6);
  assert.equal(new Set(site.faq.map(item => item.question)).size, site.faq.length);
  const text = JSON.stringify(site);
  assert.doesNotMatch(text, /আপনি|করুন|দেখুন|অসাধারণ|দারুণ|duck|hunt|ডাক হান্ট/i);
  assert.match(site.privacy.join(" "), /সিড/);
  assert.match(text, /১২টা ক্ষেত/);
  assert.equal(text, text.normalize("NFC"));
});
