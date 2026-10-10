import assert from "node:assert/strict";
import test from "node:test";
import { site } from "../content";
import { caption, cleanName, humanLine, isBlocked, letters, parseShareHash, previewTitle, shareHash, styles, tallyIds, MAX_NAME, type Design } from "../lib/namer";
import { share } from "../share";

const rafi: Design = { name: "রাফি", style: "alpana", from: "" };

test("style ids are unique and there is no rickshaw style (রিকশার রং owns that)", () => {
  assert.equal(new Set(styles.map(style => style.id)).size, styles.length);
  for (const style of styles) assert.doesNotMatch(style.id + style.label, /rickshaw|riksha|রিকশা/i);
});

test("a design survives the share-link round trip, gift giver included", () => {
  assert.deepEqual(parseShareHash(shareHash(rafi)), rafi);
  const gift: Design = { name: "Nadia Islam", style: "neon", from: "তানিয়া" };
  assert.deepEqual(parseShareHash(shareHash(gift)), gift);
  assert.equal(shareHash({ name: "রাফি", style: "tile", from: "" }), "#n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF&st=tile");
});

test("hostile, empty or anchor hashes are ignored instead of crashing", () => {
  for (const hash of ["", "#result", "#studio", "#n=রাফি", "#st=tile", "#n=রাফি&st=rickshaw", "#n=%%%&st=tile", "#n=😀😀&st=tile", "#n=১২৩&st=gold", "#%E0%A4", "#n=khanki&st=tile"]) assert.equal(parseShareHash(hash), null, hash);
  assert.deepEqual(parseShareHash("#n=রাফি&st=gold&f=harami"), { name: "রাফি", style: "gold", from: "" });
  assert.deepEqual(parseShareHash(`#n=${"ক".repeat(500)}&st=tile&evil=1`), { name: "ক".repeat(MAX_NAME), style: "tile", from: "" });
});

test("names keep Bangla, Latin and single spaces, are NFC and capped", () => {
  assert.equal(cleanName("  রিমা‮  আক্তার\n"), "রিমা আক্তার");
  assert.equal(cleanName("<b>Joy</b>"), "bJoyb");
  assert.equal(cleanName("Rafi😀 #10!"), "Rafi");
  assert.equal(cleanName("রাফি ১০"), "রাফি");
  assert.equal([...cleanName("ক".repeat(MAX_NAME + 8))].length, MAX_NAME);
  assert.equal(cleanName("রয়".normalize("NFD")), "রয়".normalize("NFC"));
});

test("abusive names never reach the card, ordinary names do", () => {
  for (const bad of ["Khanki", "f u c k", "খানকি", "বোকাচোদা", "রাফি বাল", "Haramjada"]) {
    assert.ok(isBlocked(bad), bad);
    assert.equal(cleanName(bad), "", bad);
  }
  for (const fine of ["Iqbal", "ইকবাল", "Bala", "রাফি", "শ্রাবন্তী", "Sakib"]) assert.equal(isBlocked(fine), false, fine);
});

test("letters keep যুক্তাক্ষর and vowel signs on one tile", () => {
  assert.deepEqual(letters("শ্রাবন্তী"), ["শ্রা", "ব", "ন্তী"]);
  assert.deepEqual(letters("ঋদ্ধি"), ["ঋ", "দ্ধি"]);
  assert.deepEqual(letters("সৌম্য"), ["সৌ", "ম্য"]);
  assert.deepEqual(letters("রাফি আহমেদ"), ["রা", "ফি", " ", "আ", "হ", "মে", "দ"]);
  assert.deepEqual(letters("চাঁদ"), ["চাঁ", "দ"]);
  assert.deepEqual(letters("Joy"), ["J", "o", "y"]);
  // য় arrives decomposed after NFC (য + nukta) and must stay one letter.
  assert.deepEqual(letters("নয়ন"), ["ন", "য়", "ন"]);
});

test("the human line follows the first letter; national styles stay sober", () => {
  assert.equal(humanLine({ name: "রাফি", style: "tile" }), "র দিয়ে শুরু, রোদ্দুরের মতো ঝলমলে নাম।");
  assert.match(humanLine({ name: "শ্রাবন্তী", style: "gold" }), /^শ দিয়ে শুরু/);
  assert.equal(humanLine({ name: "রাফি", style: "ekushe" }), "মায়ের ভাষায় লেখা আমার নাম।");
  assert.equal(humanLine({ name: "রাফি", style: "bijoy" }), "লাল-সবুজে লেখা আমার নাম।");
  assert.equal(humanLine({ name: "Nadia", style: "neon" }), humanLine({ name: "Nadia", style: "chalk" }));
  for (const name of ["", "Nadia", "অ", "ঋতু", "ড়", "x"]) assert.ok(humanLine({ name, style: "tile" }).length > 10, name);
  assert.doesNotMatch(humanLine({ name: "শুভ", style: "ekushe" }), /শুভ/);
});

test("share previews are personal; gifts say who sent it", () => {
  assert.equal(share.normalize("st=alpana&n=রাফি"), shareHash(rafi).slice(1));
  assert.equal(share.normalize("hello"), null);
  assert.equal(share.preview(shareHash(rafi).slice(1)).title, "রাফির নাম উঠোনের আলপনায় — তোমারটা সাজাও");
  assert.equal(share.preview(shareHash({ ...rafi, from: "তানিয়া" }).slice(1)).title, "তানিয়া তোমার নামটা সাজিয়ে পাঠিয়েছে, রাফি!");
  assert.equal(previewTitle(null), "নিজের নাম, নিজের মতো সাজাও — নামের ডিজাইন");
  assert.match(caption({ ...rafi, from: "তানিয়া" }), /^রাফি, তোমার নামটা/);
});

test("the tally counts only style ids, never names", () => {
  assert.deepEqual([...share.tally!], styles.map(style => style.id));
  assert.deepEqual(tallyIds, share.tally);
});

test("SEO copy fits its limits", () => {
  assert.ok([...site.title].length <= 45, site.title);
  const description = [...site.description].length;
  assert.ok(description >= 120 && description <= 160, String(description));
  assert.ok(site.faq.length >= 5);
});
