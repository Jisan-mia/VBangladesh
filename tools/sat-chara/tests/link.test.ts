// Challenge links (new and old), the share preview, the words, and the page's content rules.
import assert from "node:assert/strict";
import test from "node:test";
import { parseShared, sharedHash, type Shared } from "../lib/challenge";
import { seedOf } from "../lib/levels";
import { oldLayoutOf, oldSeedOf } from "../lib/old-levels";
import { bannerNote, caption, compareLine, feat, humanLine, missLine, nearMissLine, previewTitle, recordLine, throwLine } from "../lib/words";
import { site } from "../content";
import { share } from "../share";

test("a new link round-trips with the level's own seed, its difficulty and the name", () => {
  const shared: Shared = { kind: "level", level: 12, balls: 2, hand: "h", name: "রাফি" };
  const hash = sharedHash(shared);
  assert.match(hash, new RegExp(`^s=${seedOf(12)}&t=2&v=2&c=12&d=h&n=`));
  assert.deepEqual(parseShared(`#${hash}`), shared);
  assert.equal(sharedHash({ ...shared, hand: "n" }).includes("d="), false, "মাঝারি adds no key");
  assert.equal(parseShared(sharedHash({ ...shared, balls: 9 }))!.balls, 3);
  assert.equal(share.normalize(hash), hash);
  assert.equal(share.preview(hash).title, "রাফি লেভেল ১২-এর সাত চাড়া ২ বলে ফেলেছে। তুমি পারবে?");
});

test("an old link (before the rewrite) still parses and opens the friend's exact old pile", () => {
  const old = `s=${oldSeedOf(3)}&t=2&l=3&n=Rafi`;
  assert.deepEqual(parseShared(`#${old}`), { kind: "old", level: 3, balls: 2, hand: "n", name: "Rafi" });
  assert.equal(share.normalize(old), old, "normalised to the very same link");
  // The old level 1: seven pieces at x 250 (±0.8), widths 46…30 (±2), the bottom one on the ground.
  const pile = oldLayoutOf(1).stones;
  assert.ok(pile.every(stone => Math.abs(stone.x - 250) <= 0.8 + 1e-9));
  assert.ok(pile.every((stone, k) => Math.abs(stone.w - [46, 43, 41, 39, 36, 33, 30][k]) <= 2));
  assert.equal(pile[0].y, 286, "the old level 1 pile stands where it stood");
  assert.deepEqual(oldLayoutOf(12), oldLayoutOf(12), "the same every time");
  assert.equal(oldSeedOf(30), 1000 + 30 * 7919);
  assert.ok(parseShared(`s=${oldSeedOf(30)}&t=1&l=30`), "the last old level is fine");
});

test("forged, broken or hostile links are refused", () => {
  const good = new URLSearchParams(sharedHash({ kind: "level", level: 3, balls: 1, hand: "n", name: "মিম" }));
  const variant = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(good);
    for (const [key, value] of Object.entries(changes)) value === null ? params.delete(key) : params.set(key, value);
    return params.toString();
  };
  for (const bad of [
    variant({ t: "0" }), variant({ t: "4" }), variant({ t: "1.5" }), variant({ c: "16" }), variant({ c: "0" }), variant({ c: "03" }), variant({ c: null }),
    variant({ v: "3" }), variant({ v: null }), variant({ d: "n" }), variant({ d: "x" }), variant({ s: String(seedOf(4)) }), variant({ s: "0" }), variant({ s: null }),
    `s=${oldSeedOf(4)}&t=1&l=3`, `s=${oldSeedOf(31)}&t=1&l=31`, `s=${seedOf(3)}&t=1&l=3`,
    "", "#", "garbage", "s=1&t=1", `#${"a".repeat(700)}`, "<script>alert(1)</script>",
  ]) {
    assert.equal(parseShared(bad), null, bad);
    assert.equal(share.normalize(bad), null);
  }
  const hostile = parseShared(variant({ n: "‮রাফি\u0000" + "ক".repeat(40) }))!;
  assert.ok(hostile.name.length <= 20 && !hostile.name.includes("‮"));
  assert.ok(share.preview("junk").title.length > 0);
});

test("the words: exact, kind, and the dog joke never only in sound", () => {
  assert.equal(throwLine(0, 7, 2, false), "ফসকে গেছে। দূরে একটা কুকুর ডেকে উঠল।");
  assert.equal(throwLine(6, 1, 1, false), "৬টা পড়ল। আর মাত্র ১টা। শেষ বল।");
  assert.equal(throwLine(0, 7, 2, true), "মিঠু বলটা ধরে ফেলেছে।");
  assert.equal(missLine(1), "আর মাত্র ১টা চাড়া বাকি ছিল।");
  assert.equal(nearMissLine(1, 7), "");
  assert.equal(nearMissLine(2, 5), "প্রথম বলে ৫টা পড়েছিল। আর ২টা পড়লে ৩ তারা হতো।");
  assert.match(recordLine(1, true, 5), /বল্টু ভাইয়ের রেকর্ড ভাঙল/);
  assert.match(recordLine(2, true, 10), /সমান/);
  assert.equal(recordLine(1, true, 4), "", "only finales have a record");
  assert.equal(humanLine(1), "প্রথম বলেই খটাখট।");
  assert.equal(compareLine(1, 2, "রাফি"), "রাফির চেয়ে ১ বল কম লাগল।");
  assert.equal(feat({ kind: "old", level: 3, balls: 1, hand: "n", name: "" }), "এক বন্ধু সাত চাড়া এক বলে ফেলেছে");
  assert.match(bannerNote({ name: "রাফি", hand: "e", kind: "level" }), /রাফির নিজের ফোনের হিসাব। সহজ মোডে।/);
  assert.equal(caption({ kind: "level", level: 4, balls: 1 }), "সাত চাড়ার লেভেল ৪-এ সাতটা চাড়া ফেললাম এক বলে। তুমি কয় বলে পারবে?");
  assert.equal(previewTitle({ kind: "level", level: 1, balls: 3, hand: "n", name: "" }), "এক বন্ধু লেভেল ১-এর সাত চাড়া ৩ বলে ফেলেছে। তুমি পারবে?");
  const all = JSON.stringify([throwLine(3, 4, 1, false), missLine(7)]);
  assert.ok(!/!.*!/.test(all), "at most one ! a screen");
});

test("content meets the SEO limits, keeps its title and H1, and speaks তুমি", () => {
  assert.equal(site.title, "সাত চাড়া খেলা: বল ছুড়ে চাড়া ফেলার গেম");
  assert.equal(site.headline, "এক বলে সাতটা চাড়া ফেলতে পারবে?");
  assert.ok(site.title.length <= 45);
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.match(site.description, /১৫টা লেভেল/);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.faq.some(item => item.question === "কয়টা লেভেল আছে?" && /১৫টা/.test(item.answer)));
  assert.ok(site.faq.some(item => /হাঁড়িভাঙা|ডাংগুলি/.test(item.answer)));
  for (const word of ["নাম", "লেভেল", "সিড", "বল", "মোড"]) assert.match(site.privacy.join(" "), new RegExp(word));
  assert.doesNotMatch(JSON.stringify(site), /আপনি|করুন|দেখুন|গুলতি|slingshot|angry|বাজি|জিতে নাও/i);
  assert.equal(JSON.stringify(site).normalize("NFC"), JSON.stringify(site), "Bangla in NFC");
});
