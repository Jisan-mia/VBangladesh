import assert from "node:assert/strict";
import test from "node:test";
import { site } from "../content";
import { caption, friendClaim, friendLine, parseShared, previewTitle, sharedHash, spillCountOf, totalFor, versusLine, whereText, type Shared } from "../lib/challenge";
import { againRun, pickedRun, rivalOf } from "../lib/run";
import { share } from "../share";

const result = { seed: 123456, scores: [94, 88, 0, 97, 91], spills: [false, false, true, false, false], name: "রাফি", slow: false, level: 3, mode: "n" as const, old: true };

test("an old link (before the rewrite) still parses, and is written back in its old shape", () => {
  // The old format, pinned from the original game: kitchen 3 carries no `l`, the total is a plain average.
  const hash = sharedHash(result);
  assert.equal(hash, "s=123456&t=74&p=94.88.x.97.91&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  assert.deepEqual(parseShared(`#${hash}`), { ...result, total: 74 });
  assert.equal(share.normalize(hash), hash);
  // Other old kitchens carry `l`, slow carries `d=1`.
  const seven = sharedHash({ ...result, level: 7, scores: [90, 80, 70, 60, 50, 40, 30], spills: Array(7).fill(false), slow: true, name: "" });
  assert.equal(seven, "s=123456&t=60&p=90.80.70.60.50.40.30&l=7&d=1");
  assert.deepEqual(parseShared(seven), { seed: 123456, total: 60, scores: [90, 80, 70, 60, 50, 40, 30], spills: Array(7).fill(false), name: "", slow: true, level: 7, mode: "n", old: true });
  assert.equal(parseShared("s=5&t=60&p=60.60.60.60&l=2")?.old, true);
  assert.equal(parseShared("s=5&t=60&p=60.60.60.60&l=2")?.level, 2);
  assert.equal(parseShared("s=5&t=60&p=60.60.60.60&l=9"), null, "old kitchens stop at 8");
  assert.equal(parseShared("s=5&t=60&p=60.60.60.60&l=0"), null);
});

test("a new link carries v=2, the level and the mode, and the boss pot counts double in its total", () => {
  const shared = { seed: 777, scores: [90, 80, 70, 60], spills: [false, false, false, false], name: "", slow: false, level: 4, mode: "n" as const, old: false };
  assert.equal(totalFor(4, false, shared.scores), 72);
  const hash = sharedHash(shared);
  assert.equal(hash, "s=777&t=72&p=90.80.70.60&l=4&v=2");
  assert.deepEqual(parseShared(hash), { ...shared, total: 72 });
  assert.equal(parseShared(sharedHash({ ...shared, mode: "h" }))?.mode, "h");
  assert.equal(parseShared(sharedHash({ ...shared, mode: "e", slow: true }))?.slow, true);
  assert.match(sharedHash({ ...shared, mode: "e" }), /&m=e$/);
  // The old rules would average these four to 75, so the same marks without v=2 are refused on a level-4 link only if the total differs.
  assert.equal(parseShared("s=777&t=75&p=90.80.70.60&l=4&v=2"), null, "boss pot weight is part of the check");
  assert.equal(parseShared("s=777&t=75&p=90.80.70.60&l=3&v=2")?.total, 75, "level 3 has four pots and no boss, so the plain average is right");
  assert.equal(parseShared("s=777&t=72&p=90.80.70.60&l=3&v=2"), null);
  assert.deepEqual(parseShared(sharedHash({ ...shared, level: 3 }))?.scores, shared.scores);
  assert.equal(share.normalize(hash), hash);
  assert.equal(whereText({ level: 12, old: false }), "লেভেল ১২ · মেজবানের ডেকচি");
  assert.match(whereText({ level: 3, old: true }), /পুরোনো রান্নাঘর ৩/);
});

test("hostile, broken or inflated links are refused or capped", () => {
  for (const bad of ["", "#", "#result", "s=0&t=50&p=50.50.50.50.50", "s=5&t=50", "s=5&t=50&p=50.50.50.50", "s=5&t=50&p=50.50.50.50.50.50",
    "s=5&t=99&p=50.50.50.50.50", "s=5&t=100&p=99.99.99.99.99", "s=5&t=20&p=100.0.0.0.0", "s=5&t=10&p=-1.20.10.10.10", "s=5&t=50&p=5e1.50.50.50.50",
    "s=1.5&t=50&p=50.50.50.50.50", "s=1000000000&t=50&p=50.50.50.50.50", "s=5&t=50&p=50.50.50.50.50&n=" + "ক".repeat(700), "s=5&t=50&p=<script>.1.1.1.1",
    "s=5&t=50&p=50.50.50.50.50&v=3", "s=5&t=50&p=50.50.50.50.50&v=1", "s=5&t=50&p=50.50&l=13&v=2", "s=5&t=50&p=50.50&l=0&v=2",
    "s=5&t=50&p=50.50&v=2", "s=5&t=50&p=50.50&l=1&v=2&m=n", "s=5&t=50&p=50.50&l=1&v=2&m=z", "s=5&t=50&p=50.50&l=1&v=2&m=eh", "s=5&t=50&p=50.50.50.50.50&m=h",
    "s=5&t=50&p=50.50&l=1&v=2&d=2", "s=5&t=50&p=50.50.50.50.50&d=0", "s=5&t=50&p=50.50&l=01&v=2", "s=5&t=50&p=50.50&l=1e0&v=2"]) {
    assert.equal(parseShared(bad), null, bad);
    assert.equal(share.normalize(bad), null, bad);
  }
  // Names are cleaned and capped; out-of-range scores in our own hash builder are clamped.
  const base = { seed: 5, scores: [50, 50, 50, 50, 50], spills: [false, false, false, false, false], slow: false, level: 3, mode: "n" as const, old: true };
  const named = parseShared(sharedHash({ ...base, name: "  রিমা‮\n আক্তার " + "ক".repeat(40) }));
  assert.ok(named && [...named.name].length <= 20 && !named.name.includes("‮"));
  assert.equal(parseShared(sharedHash({ ...base, scores: [500, -3, NaN, 50, 50], name: "" }))?.total, 40);
});

test("the words around a link are kind, exact and personal", () => {
  const shared: Shared = { ...result, total: 74 };
  assert.equal(previewTitle({ total: 91, name: "রাফি" }), "রাফি দুধ উথলানোর খেলায় ৯১% করেছে। তুমি পারবে?");
  assert.match(share.preview(sharedHash(result)).title, /^রাফি দুধ উথলানোর খেলায় ৭৪%/);
  assert.match(share.preview(sharedHash(result)).description, /পুরোনো রান্নাঘর/);
  assert.match(share.preview("junk").title, /দুধটা দেখিস/);
  assert.equal(spillCountOf(shared.spills), 1);
  assert.match(caption(shared), /পাঁচটা পাতিলে ৭৪%, ১টা উথলে গেছে/);
  assert.match(friendLine(shared), /^রাফি ৭৪% করেছে/);
  assert.equal(friendClaim({ name: "রাফি", slow: true }), "রাফির নিজের ফোনের স্কোর, ধীরে খেলায়");
  assert.equal(versusLine(95, 91, "রাফি"), "রাফির চেয়ে ৪% বেশি! এবার লিংকটা ফেরত পাঠাও।");
  assert.match(versusLine(88, 91, "রাফি"), /^আর একটু হলেই! রাফির চেয়ে মাত্র ৩% কম।/);
  assert.match(versusLine(60, 91, ""), /^এবার বন্ধু এগিয়ে/);
  assert.match(versusLine(91, 91, "মিম"), /সমান/);
});

test("content meets the SEO limits", () => {
  assert.ok([...site.title].length <= 45, site.title);
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.faq.length >= 6);
  assert.ok(site.steps.length >= 3);
  assert.equal(new Set(site.faq.map(item => item.question)).size, site.faq.length, "no repeated question");
  assert.match(site.privacy.join(" "), /নাম/);
  assert.doesNotMatch(JSON.stringify(site), /আপনি|করুন|বাজি|টাকা জিতো/);
  assert.equal(site.slug, "dudh-uthlano");
  assert.equal(JSON.stringify(site), JSON.stringify(site).normalize("NFC"));
  assert.match(site.faq.map(item => item.answer).join(" "), /১২টা/);
});

test("ReplayIsExact: a friend's pots stay the friend's only for the friend's own level; anything else gets fresh pots", () => {
  const friend = parseShared("s=777&t=72&p=90.80.70.60&l=4&v=2&m=h")!;
  const run = { seed: 777, level: 4, mode: "h" as const, old: false };
  assert.equal(rivalOf(friend, run), friend);
  assert.equal(againRun(friend, run, 5).seed, 777, "again keeps the friend's seed, so the comparison holds");
  assert.equal(againRun(friend, { ...run, seed: 12 }, 5).seed, 5, "other pots on the same level stay other");
  assert.equal(againRun(friend, { ...run, level: 3 }, 5).seed, 5);
  assert.equal(againRun(null, run, 5).seed, 5);
  assert.equal(pickedRun(friend, 4, "h", 5).seed, 777, "the list's level 4 in the friend's mode is the friend's");
  assert.equal(pickedRun(friend, 4, "n", 5).seed, 5, "another mode is another challenge");
  assert.equal(pickedRun(friend, 2, "h", 5).seed, 5);
  const old = parseShared("s=123456&t=74&p=94.88.x.97.91")!;
  assert.equal(rivalOf(old, { seed: 123456, level: 3, mode: "n", old: true }), old);
  assert.equal(rivalOf(old, { seed: 123456, level: 3, mode: "n", old: false }), null, "old kitchen 3 is not new level 3");
  assert.equal(pickedRun(old, 3, "n", 5).seed, 5);
});
