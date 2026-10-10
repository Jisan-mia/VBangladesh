import assert from "node:assert/strict";
import test from "node:test";
import { BUDGET, cleanName, createCard, decodeCart, encodeCart, groupLevels, groups, items, leftOf, parseCount, parseShareHash, phrase, roomFor, setCount, shareHash, spentOf, starter, taka, vanLine, MAX_NAME_LENGTH, type Cart } from "../lib/van";
import { vanSvg } from "../lib/van-art";
import { share } from "../share";

test("forty items, eight per group, unique short ids, round prices sorted cheapest first", () => {
  assert.equal(items.length, 40);
  assert.equal(new Set(items.map(item => item.id)).size, 40);
  for (const group of groups) {
    const prices = items.filter(item => item.group === group.id).map(item => item.price);
    assert.equal(prices.length, 8, group.id);
    assert.deepEqual(prices, [...prices].sort((a, b) => a - b), group.id);
  }
  for (const item of items) {
    assert.match(item.id, /^[a-z]{2,12}$/);
    assert.ok(item.price >= 15 && item.price <= BUDGET && item.price % 5 === 0, item.id);
  }
  // Buying one of everything must not fit: the game is about choosing.
  assert.ok(items.reduce((total, item) => total + item.price, 0) > BUDGET);
});

test("money reads in Bangla digits with lakh and crore grouping", () => {
  assert.equal(taka(BUDGET), "৳১,০০,০০,০০০");
  assert.equal(taka(1234567), "৳১২,৩৪,৫৬৭");
});

test("the van starts with one cup of tea", () => {
  assert.deepEqual(starter, { cha: 1 });
  assert.equal(leftOf(starter), 99_99_985);
});

test("counts never go below zero, past a cap, or past the money left", () => {
  assert.deepEqual(setCount(starter, "cha", -5), {});
  assert.deepEqual(setCount({}, "bari", 3), { bari: 1 });
  const twoCars = setCount({}, "car", 9);
  assert.equal(twoCars.car, 2);
  assert.equal(roomFor(twoCars, "car"), 0);
  const rich = setCount(twoCars, "bari", 1);
  assert.equal(rich.bari, 1);
  assert.equal(spentOf(rich), BUDGET);
  assert.equal(roomFor(rich, "cha"), 0);
  assert.deepEqual(setCount(rich, "cha", 1), rich);
  assert.throws(() => setCount({}, "lottery", 1), RangeError);
  assert.deepEqual(setCount(starter, "cha", Number.NaN), starter);
});

test("count boxes accept Bangla or English digits and ignore the rest", () => {
  assert.equal(parseCount("৩০০"), 300);
  assert.equal(parseCount("৩0০"), 300);
  assert.equal(parseCount(""), 0);
  assert.equal(parseCount("abc-12"), 12);
});

test("phrases read naturally on the card", () => {
  assert.equal(phrase("kacchi", 300), "৩০০ প্লেট কাচ্চি");
  assert.equal(phrase("library", 1), "১টা স্কুল লাইব্রেরি");
  assert.equal(phrase("bari", 1), "আম্মুর জন্য বাড়ি");
  assert.equal(phrase("kombol", 3), "৩০০টা শীতের কম্বল");
  assert.equal(phrase("rasta", 2), "১,০০০ মিটার গ্রামের রাস্তা");
  assert.equal(phrase("biriyani", 1), "পাড়ায় বিরিয়ানি");
  assert.equal(phrase("biriyani", 2), "২ বার পাড়ায় বিরিয়ানি");
});

test("a cart survives the link round trip with the name", () => {
  const cart: Cart = { kacchi: 300, library: 1, bari: 1, cha: 2 };
  assert.equal(encodeCart(cart), "cha:2,kacchi:300,bari:1,library:1");
  assert.deepEqual(parseShareHash(shareHash({ cart, name: "রাফি" })), { cart: { cha: 2, kacchi: 300, bari: 1, library: 1 }, name: "রাফি" });
  assert.deepEqual(parseShareHash("#q=cha%3A2%2Ckacchi%3A300"), { cart: { cha: 2, kacchi: 300 }, name: "" });
});

test("hostile, empty or impossible carts are refused", () => {
  assert.equal(parseShareHash(""), null);
  assert.equal(parseShareHash("#q=%%%"), null);
  assert.equal(decodeCart("cha:0"), null);
  assert.equal(decodeCart("cha:-1"), null);
  assert.equal(decodeCart("cha:01"), null);
  assert.equal(decodeCart("lottery:1"), null);
  assert.equal(decodeCart("cha:1,cha:2"), null);
  assert.equal(decodeCart("bari:2"), null);
  assert.equal(decodeCart("car:3"), null, "over the budget");
  assert.equal(decodeCart("cha:9999999"), null, "over the budget");
  assert.equal(decodeCart("cha:1,".repeat(200)), null);
  assert.equal(share.normalize("q=<script>"), null);
  assert.equal(share.normalize("q=car:2,bari:1"), "q=car:2,bari:1");
});

test("names are NFC, lose control and direction-override characters, and are capped", () => {
  assert.equal(cleanName("  রিমা‮  আক্তার\n"), "রিমা আক্তার");
  assert.equal(cleanName("ক".repeat(MAX_NAME_LENGTH + 10)).length, MAX_NAME_LENGTH);
  assert.equal(cleanName("ময়না"), "ময়না".normalize("NFC"));
});

test("the human line comes from what is on the van", () => {
  assert.equal(vanLine({ car: 2, bari: 1 }), "শেষ পয়সাটাও খরচ! হিসাব একদম মিলে গেছে।");
  assert.equal(vanLine({ library: 1, kacchi: 10 }), "এই কোটি টাকায় অন্যের হাসিই বেশি।");
  assert.equal(vanLine(starter), "কোটি টাকা হাতে, তবু খরচ করতে হাত কাঁপে!");
  assert.equal(vanLine({ bike: 4 }), "শখের দাম লাখ টাকা, এবার সত্যি সত্যি!");
  assert.equal(vanLine({ cha: 200, bike: 1 }), "কোটি টাকা হোক আর যা-ই হোক, চা চলবেই।");
  assert.equal(vanLine({ worldcup: 1 }), "টাকা থাকলে দেশটা আগে ঘুরে দেখা চাই।");
});

test("the van grows one parcel per different item in a group", () => {
  assert.deepEqual(groupLevels({ cha: 300, kacchi: 1, car: 1, bari: 1 }), [2, 1, 0, 1, 0]);
  const svg = vanSvg([8, 8, 8, 8, 8]);
  assert.ok(svg.startsWith("<svg xmlns="));
  assert.ok(!vanSvg([1, 0, 0, 0, 0], { paint: false }).includes("<text"));
  assert.ok(vanSvg([0, 1, 0, 0, 0], { fresh: 1 }).includes('class="ek-drop"'));
});

test("the card lists the biggest spends first and compares with a friend", () => {
  const card = createCard({ cart: { kacchi: 300, library: 1, cha: 2 }, name: "রাফি" }, { cart: { library: 1, bari: 1 }, name: "তানিয়া" });
  assert.equal(card.title, "রাফির এক কোটির ভ্যান");
  assert.equal(card.headline, "রাফি খরচ করেছে ৳৪,০৫,০৩০");
  assert.equal(card.list, "১টা স্কুল লাইব্রেরি, ৩০০ প্লেট কাচ্চি, ২ কাপ চা");
  assert.equal(card.match, "তানিয়ার সাথে ১টা জিনিস মিলে গেছে");
  assert.equal(createCard({ cart: starter, name: "" }).title, "আমার এক কোটির ভ্যান");
});

test("share preview is personal and the tally only counts fixed item ids", () => {
  const state = share.normalize("q=kacchi:300,bari:1&n=রাফি")!;
  assert.equal(state, "q=kacchi:300,bari:1&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  assert.equal(share.preview(state).title, "রাফির এক কোটির ভ্যানে আম্মুর জন্য বাড়ি, ৩০০ প্লেট কাচ্চি… তুমি কী কিনতে?");
  assert.deepEqual(share.tally, items.map(item => item.id));
});
