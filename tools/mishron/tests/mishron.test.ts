import assert from "node:assert/strict";
import test from "node:test";
import { share } from "../share";
import { site } from "../content";
import { cleanName, combine, decodeSet, encodeSet, honest, nextHint, parseSaved, parseShareHash, shareHash, tallyIds, MAX_NAME_LENGTH, TOTAL } from "../lib/game";
import { itemById, items, mix, recipes, STARTERS } from "../lib/recipes";

// Election Commission symbols (Prothom Alo, 24 Sep 2025, all 115) plus later party symbols. None may be an item, even as a plain object.
const EC_SYMBOLS = ("আপেল আনারস আম আলমারি ঈগল উটপাখি উদীয়মান_সূর্য একতারা কাঁচি কবুতর কলম কলস কলার_ছড়ি কাঁঠাল কাপ-পিরিচ কাস্তে কেটলি কুমির কম্পিউটার কলা কুড়াল কুলা কুঁড়েঘর কোদাল খাট খেজুর_গাছ গরুর_গাড়ি গাভি গামছা গোলাপ_ফুল ঘণ্টা ঘুড়ি ঘোড়া চাকা চার্জার_লাইট চাবি চিংড়ি চেয়ার চশমা ছড়ি ছাতা জগ জাহাজ টিউবওয়েল টিফিন_ক্যারিয়ার টেবিল টেবিলঘড়ি ট্রাক টেলিফোন টেলিভিশন " +
  "ডাব ঢেঁকি তবলা তরমুজ তারা থালা দাঁড়িপাল্লা দালান দেয়ালঘড়ি দোয়াত_কলম দোলনা ধানের_শীষ নোঙর নৌকা প্রজাপতি ফুটবল ফুলকপি ফুলের_টব ফুলের_মালা ফ্রিজ বক বাঘ বই বটগাছ বাঁশি বেঞ্চ বেগুন বাইসাইকেল বালতি বেলুন বৈদ্যুতিক_পাখা মই মগ মাইক মোটরগাড়ি মশাল ময়ূর মাছ মাথাল মিনার মোমবাতি মোবাইল_ফোন মোড়া মোরগ রকেট রিকশা লাউ লিচু লাঙল সোনালি_আঁশ সেলাই_মেশিন সোফা সিংহ স্যুটকেস হরিণ হাত হাতঘড়ি হাতপাখা হাঁস হাতি হাতুড়ি হারিকেন হুক্কা হেলিকপ্টার " +
  "শাপলা শাপলা_কলি হ্যান্ডশেক লাঙ্গল ধান খেজুর পাট গরু মুরগি").split(" ").map(word => word.replace(/_/g, " "));
const tokens = (text: string) => text.split(/[\s\-–—,।!?‘’'"…:()]+/).filter(Boolean);

test("the item list is sound: unique ids and names, 150–200 items, every recipe uses known items", () => {
  assert.equal(new Set(items.map(item => item.id)).size, items.length);
  assert.equal(new Set(items.map(item => item.name)).size, items.length);
  assert.ok(items.length >= 150 && items.length <= 200, `${items.length} items`);
  for (const { a, b, out } of recipes) for (const id of [a, b, out]) assert.ok(itemById(id), `unknown id ${id}`);
  assert.deepEqual(items.slice(0, 4).map(item => item.id), [...STARTERS]);
});

test("no pair is written twice, and recipes work in either order", () => {
  const seen = new Map<string, string>();
  for (const { a, b, out } of recipes) {
    const key = [a, b].sort().join("+");
    assert.ok(!seen.has(key), `${key} → ${seen.get(key)} and ${out}`);
    seen.set(key, out);
    assert.equal(mix(a, b), out);
    assert.equal(mix(b, a), out);
    assert.ok(!(STARTERS as readonly string[]).includes(out), `${key} makes a starter`);
  }
});

test("every item can be made starting from পানি, চাল, মাটি, রোদ", () => {
  assert.deepEqual(honest(items.map(item => item.id)), items.map(item => item.id));
});

test("following the hint button alone finishes the whole game, so nobody gets stuck", () => {
  const found = new Set<string>(STARTERS);
  for (let hint = nextHint(found); hint; hint = nextHint(found)) {
    const result = combine(hint.a, hint.b, found);
    assert.equal(result.type, "new");
    if (result.type === "new") found.add(result.item.id);
  }
  assert.equal(found.size, TOTAL);
});

test("no Election Commission symbol, party symbol or paddy appears as an item or in a note", () => {
  for (const item of items) {
    for (const word of tokens(item.name)) assert.ok(!EC_SYMBOLS.includes(word), `${item.id}: ${word}`);
    for (const symbol of EC_SYMBOLS.filter(symbol => symbol.includes(" ") || symbol.length >= 4)) assert.ok(!item.name.includes(symbol) || item.id === "dotara", `${item.id} contains ${symbol}`);
    for (const symbol of ["নৌকা", "ধানের", "দাঁড়িপাল্লা", "লাঙল", "লাঙ্গল", "হাতপাখা", "শাপলা", "মশাল", "খেজুর", "কুঁড়েঘর", "হুক্কা", "হারিকেন", "ঘুড়ি", "রিকশা", "ঘণ্টা", "কেটলি", "বেঞ্চ"]) assert.ok(!item.note.includes(symbol), `${item.id} note: ${symbol}`);
    assert.ok(!tokens(item.note).includes("ধান"), `${item.id} note mentions paddy`);
  }
});

test("an unknown pair gives a gentle nudge instead of an error", () => {
  const found = new Set<string>(STARTERS);
  const result = combine("chal", "rod", found);
  assert.equal(result.type, "none");
  if (result.type === "none") assert.match(result.hint, /চাল|রোদ|পানি|মাটি/);
  const old = combine("pani", "chal", new Set([...STARTERS, "bhat"]));
  assert.equal(old.type, "old");
  const everything = new Set(items.map(item => item.id));
  const done = combine("chal", "rod", everything);
  assert.ok(done.type === "none" && done.hint.includes("শেষ"));
});

test("a discovered set survives the link round trip, including the last item", () => {
  const found = honest(items.map(item => item.id));
  assert.deepEqual(decodeSet(encodeSet(found)), found);
  assert.ok(encodeSet(found).length <= 40, "the set fits in a short link");
  const shared = parseShareHash(shareHash({ found: ["pani", "chal", "mati", "rod", "bhat", "kada"], latest: "kada", name: "রাফি" }));
  assert.deepEqual(shared, { found: ["pani", "chal", "mati", "rod", "bhat", "kada"], latest: "kada", name: "রাফি" });
});

test("hostile, empty or impossible links are cleaned instead of trusted", () => {
  assert.equal(parseShareHash(""), null);
  assert.equal(parseShareHash("#d=%%%"), null);
  assert.equal(parseShareHash("#d=" + "z".repeat(60)), null);
  assert.equal(parseShareHash("#d=f"), null, "starters alone are not a share");
  // A hand-made set claiming বৈশাখী মেলা without its ingredients loses it.
  const fake = parseShareHash(shareHash({ found: ["pani", "chal", "mati", "rod", "bhat", "boishakhi-mela"], latest: "boishakhi-mela", name: "" }));
  assert.deepEqual(fake?.found, ["pani", "chal", "mati", "rod", "bhat"]);
  assert.equal(fake?.latest, "bhat");
  assert.equal(parseShareHash("#d=" + encodeSet(["bhat"]) + "&l=evil")?.latest, "bhat");
});

test("names are NFC, lose control and direction-override characters, and are capped", () => {
  assert.equal(cleanName("  রিমা‮  আক্তার\n"), "রিমা আক্তার");
  assert.equal(cleanName("ক".repeat(MAX_NAME_LENGTH + 10)).length, MAX_NAME_LENGTH);
  assert.equal(cleanName("য়"), "য়".normalize("NFC"));
});

test("saved progress keeps discovery order and drops junk", () => {
  assert.deepEqual(parseSaved(null).order, [...STARTERS]);
  assert.deepEqual(parseSaved("{not json").order, [...STARTERS]);
  assert.deepEqual(parseSaved(JSON.stringify({ order: ["kada", "bhat", "evil", 7, "boishakhi-mela"], latest: "bhat" })), { order: ["pani", "chal", "mati", "rod", "kada", "bhat"], latest: "bhat" });
});

test("share.ts normalizes links and gives a personal preview; tally covers fixed ids only", () => {
  const state = shareHash({ found: ["pani", "chal", "mati", "rod", "bhat", "kada"], latest: "kada", name: "রাফি" }).slice(1);
  assert.equal(share.normalize(state), state);
  assert.equal(share.normalize("d=%%%"), null);
  assert.match(share.preview(state).title, /রাফি ২টা জিনিস বানিয়েছে · সর্বশেষ: কাদা/);
  assert.ok(share.tally?.every(id => itemById(id) && !(STARTERS as readonly string[]).includes(id)));
  assert.equal(share.tally?.length, tallyIds.length);
});

test("SEO copy stays within its limits and never names someone else's game", () => {
  assert.ok(site.title.length <= 45, site.title);
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.faq.length >= 5);
  const text = JSON.stringify(site);
  assert.ok(!/infinite|craft|ইনফিনিট|ক্রাফট/i.test(text));
});
