import assert from "node:assert/strict";
import test from "node:test";
import { categories, cleanName, cleanTitle, commonLine, defaults, describe, headline, parseShareHash, placePick, previewDescription, resolveTyped, shareHash, shelfLine, shelfLooks, tallyIds, MAX_NAME_LENGTH, MAX_TITLE_LENGTH, type Shelf } from "../lib/shelf";
import { share } from "../share";

test("curated lists are whole: unique titles, a creator each, valid distinct defaults", () => {
  for (const cat of categories) {
    assert.ok(cat.items.length >= 12, cat.id);
    assert.equal(new Set(cat.items.map(item => item.title)).size, cat.items.length, cat.id);
    for (const item of cat.items) {
      assert.ok(item.title.trim() && item.by.trim(), item.title);
      assert.equal(item.title, item.title.normalize("NFC"));
      assert.equal(item.by, item.by.normalize("NFC"));
    }
    const start = defaults[cat.id];
    assert.equal(start.length, 4);
    assert.equal(new Set(start).size, 4);
    for (const pick of start) assert.ok(typeof pick === "number" && pick < cat.items.length);
  }
  assert.equal(new Set(tallyIds).size, tallyIds.length);
  assert.ok(tallyIds.includes("natok") && tallyIds.includes("gaan-22") && !tallyIds.some(id => id.includes("t:")));
});

test("a shelf survives the link round trip, typed titles included", () => {
  const shelf: Shelf = { cat: "natok", picks: [12, 4, 0, "ইতিকথা"], name: "রাফি" };
  const hash = shareHash(shelf);
  assert.equal(hash, `#k=natok&i=12,4,0,t:${encodeURIComponent("ইতিকথা")}&n=${encodeURIComponent("রাফি")}`);
  assert.deepEqual(parseShareHash(hash), shelf);
  assert.deepEqual(parseShareHash("k=gaan&i=0,1,2,3"), { cat: "gaan", picks: [0, 1, 2, 3], name: "" });
  // the brief's readable form, with raw Bangla, also opens
  assert.deepEqual(parseShareHash("#k=boi&i=1,2,3,t:আমার বই"), { cat: "boi", picks: [1, 2, 3, "আমার বই"], name: "" });
  for (const cat of categories) assert.deepEqual(parseShareHash(shareHash({ cat: cat.id, picks: defaults[cat.id], name: "" }))?.picks, defaults[cat.id]);
});

test("hostile, short, long, duplicate or out-of-range links are refused", () => {
  for (const hash of ["", "#result", "#k=natok", "#k=nope&i=0,1,2,3", "#k=natok&i=0,1,2", "#k=natok&i=0,1,2,3,4", "#k=natok&i=0,1,2,99", "#k=natok&i=0,1,2,-1",
    "#k=natok&i=0,1,2,1.5", "#k=natok&i=0,0,1,2", "#k=natok&i=0,1,2,t:", "#k=natok&i=0,1,2,t:%20%20", "#k=natok&i=0,1,t:ক,t:ক", "#k=natok&i=0,1,2,%ZZ", "#k=<b>&i=0,1,2,3", "#k=natok&i=0,1,2,x:abc",
    `#k=natok&i=0,1,2,t:${"ক".repeat(700)}`, "#k=natok&i=0,1,2,0003"]) {
    assert.equal(parseShareHash(hash), null, hash);
  }
  assert.equal(share.normalize("k=natok&i=0,1,2,99"), null);
  assert.equal(share.normalize("#k=natok&i=00,1,2,3&x=1&n=%20রাফি%20"), "k=natok&i=0,1,2,3&n=" + encodeURIComponent("রাফি"));
});

test("typed titles and names are NFC, safe and capped; commas never break the link", () => {
  assert.equal(cleanTitle("  আমার‮  প্রিয়\n"), "আমার প্রিয়");
  assert.equal(cleanTitle("এক, দুই，তিন"), "এক দুই তিন");
  assert.equal(Array.from(cleanTitle("ক".repeat(MAX_TITLE_LENGTH + 9))).length, MAX_TITLE_LENGTH);
  assert.equal(Array.from(cleanName("খ".repeat(MAX_NAME_LENGTH + 9))).length, MAX_NAME_LENGTH);
  const decomposed = "বোকা".normalize("NFD");
  assert.notEqual(decomposed, "বোকা".normalize("NFC"));
  assert.equal(cleanTitle(decomposed), "বোকা".normalize("NFC"));
  assert.equal(parseShareHash(`#k=natok&i=0,1,2,t:${encodeURIComponent(decomposed)}`)?.picks[3], "বোকা".normalize("NFC"));
  const long = parseShareHash(`#k=natok&i=0,1,2,t:${encodeURIComponent("গ".repeat(50))}`);
  assert.equal(Array.from(long!.picks[3] as string).length, MAX_TITLE_LENGTH);
  assert.equal(shareHash({ cat: "natok", picks: [0, 1, 2, "এক, দুই"], name: "" }), `#k=natok&i=0,1,2,t:${encodeURIComponent("এক দুই")}`);
  // a typed title that is already on the list becomes the curated item
  assert.equal(resolveTyped("natok", " কোথাও কেউ নেই "), 0);
  assert.equal(resolveTyped("natok", "নতুন নাটক"), "নতুন নাটক");
  assert.equal(resolveTyped("natok", "   "), null);
});

test("placing a pick swaps instead of duplicating", () => {
  assert.deepEqual(placePick([0, 1, 2, 3], 0, 5), [5, 1, 2, 3]);
  assert.deepEqual(placePick([0, 1, 2, 3], 0, 2), [2, 1, 0, 3]);
  assert.deepEqual(placePick([0, 1, "ক", 3], 3, "ক"), [0, 1, 3, "ক"]);
  assert.deepEqual(placePick([0, 1, 2, 3], 1, 1), [0, 1, 2, 3]);
});

test("the human line comes from the category and the picks", () => {
  assert.equal(shelfLine("natok", [0, 1, 2, 11]), "বাকের ভাইয়ের জন্য মনটা এখনো কেমন করে।");
  assert.equal(shelfLine("natok", [1, 2, 3, 4]), "পুরো তাকটাই হুমায়ূন আহমেদের।");
  assert.equal(shelfLine("natok", [12, 8, 9, 10]), "ঈদের রাতে সবাই মিলে টিভির সামনে, হাতে সেমাইয়ের বাটি।");
  assert.equal(shelfLine("cinema", [0, 6, 14, 18]), "ছুটির ঘণ্টা দেখে কে কাঁদেনি, বলো তো?");
  assert.equal(shelfLine("cinema", [0, 1, 18, 19]), "সাদাকালো দিন থেকে আজকের হল, সব যুগের চারটা।");
  assert.equal(shelfLine("boi", [0, 13, 15, 23]), "পাঠ্যবইয়ের ভাঁজে লুকিয়ে পড়া সেই রহস্য।");
  assert.equal(shelfLine("boi", [0, 13, 2, 3]), "হলুদ পাঞ্জাবি, খালি পা, হিমু হতে কে না চেয়েছে?");
  assert.equal(shelfLine("gaan", [0, 4, 13, 17]), "চাঁদরাতে এই গান না বাজলে ঈদ আসে না।");
  assert.equal(shelfLine("gaan", [12, 13, 14, 15]), "ক্যাসেট উল্টে উল্টে শোনা সেই ব্যান্ডের দিন।");
  assert.equal(shelfLine("gaan", ["ক", "খ", "গ", 1]), "এই চারটা কারও তালিকায় নেই, কিন্তু আমার তাকে আছে।");
});

test("friend match, headline, previews and looks", () => {
  const friend: Shelf = { cat: "natok", picks: [0, 2, 5, "ইতিকথা"], name: "মিম" };
  assert.equal(commonLine({ cat: "natok", picks: [0, 2, 6, 7] }, friend), "দুজনেরই আছে: কোথাও কেউ নেই, আজ রবিবার");
  assert.equal(commonLine({ cat: "natok", picks: [0, 2, 5, "ইতিকথা"] }, friend), "মিমের সাথে চারটাই মিলে গেছে!");
  assert.equal(commonLine({ cat: "natok", picks: [0, 2, 5, 9] }, friend), "দুজনেরই আছে: কোথাও কেউ নেই, আজ রবিবার আর ১টা");
  assert.equal(commonLine({ cat: "natok", picks: [8, 9, 10, 11] }, friend), "মিমের সাথে একটাও মেলেনি!");
  assert.equal(commonLine({ cat: "boi", picks: [0, 2, 5, 9] }, friend), "");
  assert.equal(headline({ cat: "natok", name: "রাফি" }), "রাফির চার প্রিয় নাটক");
  assert.equal(headline({ cat: "gaan", name: "" }), "আমার চার প্রিয় গান");
  assert.equal(share.preview(shareHash(friend).slice(1)).title, "মিমের চার প্রিয় নাটক — তোমার চারটা কী?");
  assert.equal(share.preview(shareHash({ ...friend, name: "" }).slice(1)).title, "এক বন্ধুর চার প্রিয় নাটক — তোমার চারটা কী?");
  assert.ok(!previewDescription(friend).includes("ইতিকথা"), "typed titles stay out of link previews");
  assert.equal(describe("gaan", 4).by, "কাজী নজরুল ইসলাম");
  const looks = shelfLooks("natok", [0, 1, 2, "ক"]);
  assert.deepEqual(shelfLooks("natok", [0, 1, 2, "ক"]), looks);
  assert.ok(looks.every((look, i) => i === 0 || look.bg !== looks[i - 1].bg));
  assert.ok(looks[3].typed && !looks[0].typed);
});
