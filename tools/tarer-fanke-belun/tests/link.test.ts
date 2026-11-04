// Challenge links (old ones still open), saved-progress migration, the lines, and the page's words.
import assert from "node:assert/strict";
import test from "node:test";
import { readLevels, unlockedLevel } from "../../../shared/game-core";
import { site } from "../content";
import { LEVEL_COUNT, LEVELS, MODE_INFO, nextAhead, openLevel, readAhead, starsOf } from "../lib/levels";
import { caption, compareLine, friendClaim, friendLine, humanLine, migrateLevels, nearMiss, parseShared, previewTitle, sharedHash, type Shared } from "../lib/link";
import { share } from "../share";

const base: Shared = { seed: 777, score: 9, name: "মিম", level: 5, mode: "n", slow: false, lost: 1, grazes: 2, tenths: 213, won: true, old: false };

test("new links round-trip and carry the level, mode, losses, scrapes and time", () => {
  const hash = sharedHash(base);
  assert.equal(hash, `s=777&t=9&l=5&v=2&k=1&g=2&c=213&n=${encodeURIComponent("মিম")}`);
  assert.deepEqual(parseShared(`#${hash}`), base);
  const endless: Shared = { ...base, level: 0, score: 37, lost: 3, mode: "e", slow: true, won: false, grazes: 5 };
  assert.deepEqual(parseShared(sharedHash(endless)), endless);
  assert.equal(share.normalize(hash), hash);
});

test("old links still open: no `l` is যত দূর পারো, `b=1` is সহজ, and they write back exactly as they were", () => {
  for (const old of ["s=9&t=40&b=1", "s=123456&t=37&b=1&d=1&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF", "s=777&t=8&l=2&d=1", "s=9&t=0"]) {
    const shared = parseShared(old)!;
    assert.ok(shared && shared.old, old);
    assert.equal(sharedHash(shared), old.replace("&d=1&n", "&d=1&n"));
  }
  assert.deepEqual(parseShared("s=9&t=40&b=1"), { seed: 9, score: 40, name: "", level: 0, mode: "e", slow: false, lost: 0, grazes: 0, tenths: 0, won: false, old: true });
  assert.equal(parseShared("s=7&t=20&l=10")?.level, 10, "the old tenth level opens level 10");
  assert.equal(parseShared("s=7&t=21&l=10"), null, "more than the old level had");
  assert.equal(friendLine(parseShared("s=7&t=37&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF")!), "রাফি আগের খেলায় যত দূর পারো-তে ৩৭টা ফাঁক পার করেছিল।");
  assert.equal(compareLine({ won: true, lost: 0, grazes: 0, tenths: 80, score: 4 }, parseShared("s=7&t=3&l=1")!), "", "an old score is never compared");
  assert.equal(previewTitle(parseShared("s=7&t=12&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF")!), "রাফি তারের জটে ১২টা ফাঁক পার করেছে। তুমি পারবে?");
});

test("hostile or impossible links are rejected", () => {
  for (const bad of ["", "s=0&t=3", "s=1&t=-1", "s=1&t=1000", "s=1.5&t=3", "s=abc&t=3", "s=1&t=3&b=2", "s=1&t=3&d=yes", `s=1&t=3&n=${"x".repeat(700)}`,
    "s=1&t=3&l=0&v=3&k=2&g=0&c=10", "s=1&t=9&l=5&v=2&k=1&g=0", "s=1&t=10&l=5&v=2&k=0&g=0&c=10", "s=1&t=9&l=5&v=2&k=3&g=0&c=10",
    "s=1&t=4&l=5&v=2&k=1&g=0&c=10", "s=1&t=9&l=13&v=2&k=0&g=0&c=10", "s=1&t=9&l=5&v=2&m=x&k=0&g=0&c=10", "s=1&t=9&l=5&v=2&k=0&g=0&c=0",
    "s=1&t=9&l=05&v=2&k=0&g=0&c=10", "s=1&t=9&l=5&v=2&k=0&g=99&c=10", "s=1&t=9&l=5&v=2&b=1&k=0&g=0&c=10"]) {
    assert.equal(parseShared(bad), null, bad);
  }
  const hostile = parseShared(`s=5&t=8&n=${encodeURIComponent("  রা‮ফি\u0000  খুব লম্বা একটা নাম যেটা বিশ অক্ষরের বেশি ")}`);
  assert.ok(hostile && !/[\u0000‮]/.test(hostile.name) && [...hostile.name].length <= 20);
  assert.equal(share.normalize("<script>"), null);
  assert.ok(share.preview("nope").title.length > 0);
  assert.equal(share.tally, undefined);
});

test("stars: cleared ★, no balloon lost ★★, few scrapes too ★★★; easy tops out at two; the near-miss says the number", () => {
  assert.equal(starsOf(false, 0, 0, 3), 0);
  assert.equal(starsOf(true, 1, 0, 3), 1);
  assert.equal(starsOf(true, 0, 2, 3), 2);
  assert.equal(starsOf(true, 0, 1, 3), 3);
  assert.equal(starsOf(true, 0, 0, 3, "e"), 2);
  assert.equal(starsOf(true, 0, 0, 0), 0, "যত দূর পারো has no stars");
  assert.equal(nearMiss({ level: 3, won: false, lost: 2, grazes: 0, score: 5, best: null, mode: "n" }), "আর ৩টা ফাঁক হলেই আরমানিটোলা পার।");
  assert.equal(nearMiss({ level: 3, won: true, lost: 0, grazes: 3, score: 8, best: null, mode: "n" }), "আর ২টা ঘষা কম হলেই ৩ তারা।");
  assert.equal(nearMiss({ level: 3, won: true, lost: 0, grazes: 0, score: 8, best: null, mode: "e" }), "সহজে বড়জোর ২ তারা। ৩ তারা পেতে সাধারণে খেলো।");
  assert.equal(nearMiss({ level: 0, won: false, lost: 2, grazes: 0, score: 33, best: 37, mode: "n" }), "আর ৪টা ফাঁক হলেই নতুন সেরা।");
  for (const mode of ["e", "n", "h"] as const) assert.ok(MODE_INFO[mode].balloons >= 1);
});

test("the friend lines are honest and compare like for like", () => {
  assert.equal(friendLine(base), "মিম মিরপুর ১০-এর সব ফাঁক পার করেছে ২১.৩ সেকেন্ডে।");
  assert.equal(friendLine({ ...base, lost: 0 }), "মিম মিরপুর ১০-এর সব ফাঁক পার করেছে ২১.৩ সেকেন্ডে, একটাও বেলুন না ফাটিয়ে।");
  assert.equal(friendLine({ ...base, won: false, lost: 2, score: 4 }), "মিম মিরপুর ১০-এ ৪টা ফাঁক পার করেছে।");
  assert.match(friendClaim({ ...base, slow: true }), /মিমের নিজের ফোনের স্কোর, ধীরে খেলায়/);
  assert.equal(compareLine({ won: true, lost: 0, grazes: 2, tenths: 220, score: 9 }, base), "মিমের চেয়ে ১টা বেলুন কম ফাটিয়েছ।");
  assert.equal(compareLine({ won: true, lost: 1, grazes: 2, tenths: 200, score: 9 }, base), "মিমের চেয়ে ১.৩ সেকেন্ড আগে!");
  assert.equal(compareLine({ won: false, lost: 2, grazes: 0, tenths: 99, score: 3 }, base), "মিম পার হয়েছে। আরেকবার?");
  assert.equal(compareLine({ won: false, lost: 3, grazes: 0, tenths: 99, score: 40 }, { ...base, level: 0, score: 37, lost: 3, won: false }), "মিমের চেয়ে ৩টা ফাঁক বেশি!");
  assert.equal(previewTitle(base), "মিম মিরপুর ১০-এর সব ফাঁক পার করেছে, ২১.৩ সেকেন্ডে। তুমি পারবে?");
  assert.match(caption({ score: 9, level: 5, won: true }), /মিরপুর ১০ পার/);
  assert.match(caption({ score: 0, level: 0, won: false }), /প্রথম তারেই/);
  assert.equal(humanLine({ level: 2, won: true, lost: 0, grazes: 0, score: 6 }), "বেলুন আস্ত, তারে একবারও লাগেনি।");
  assert.equal(humanLine({ level: 0, won: false, lost: 2, grazes: 0, score: 20 }), "তারে বসা কাকগুলোও অবাক হয়ে দেখছে।");
});

test("saved progress: the old endless best migrates once; stars keep their level numbers; a friend's far level opens nothing between", () => {
  assert.equal(migrateLevels(null, "9"), JSON.stringify({ 1: 1, 2: 1 }));
  assert.equal(migrateLevels(null, "37"), JSON.stringify({ 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 }), "never more than half the old levels");
  assert.equal(migrateLevels(null, "3"), null);
  assert.equal(migrateLevels(null, null), null);
  assert.equal(migrateLevels(null, "junk"), null);
  assert.equal(migrateLevels("{}", "37"), null, "already moved");
  assert.deepEqual(readLevels(JSON.stringify({ 1: 3, 10: 2, 13: 3 }), LEVEL_COUNT), { 1: 3, 10: 2 }, "old stars by number, nothing past 12");
  // A friend's level 9 cleared from a link: its stars are kept, but your own unlock stays at 3.
  const stars = { 1: 2, 2: 3, 9: 2 }, ahead = nextAhead({ 1: 2, 2: 3 }, [], 9);
  assert.deepEqual(ahead, [9]);
  assert.equal(openLevel(stars, ahead), 3);
  assert.equal(unlockedLevel(stars, LEVEL_COUNT), 10, "the shared rule alone would open everything below 9");
  assert.equal(openLevel({ ...stars, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1 }, ahead), 10, "once your own play reaches it, it counts");
  assert.deepEqual(readAhead("[9, 9, 40, \"x\"]"), [9]);
  assert.deepEqual(readAhead("junk"), []);
});

test("the page's words fit the SEO rules, stay NFC and never name a trademark", () => {
  assert.ok([...site.title].length <= 45, `title ${[...site.title].length}`);
  assert.ok(site.title.startsWith("বেলুন গেম"));
  const description = [...site.description].length;
  assert.ok(description >= 120 && description <= 160, `description ${description}`);
  assert.equal(site.headline, "মামার বেলুন উড়ে গেল! তারে যেন না লাগে", "the H1 is unchanged");
  assert.ok(site.faq.length >= 6);
  assert.ok(site.privacy.some(line => line.includes("লিংক")));
  const all = JSON.stringify(site) + JSON.stringify(LEVELS);
  assert.equal(all, all.normalize("NFC"));
  assert.doesNotMatch(all, /flappy|ফ্ল্যাপি|bird|পাখি/i);
});
