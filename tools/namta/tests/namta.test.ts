import assert from "node:assert/strict";
import test from "node:test";
import {
  caption, cleanName, decodeOrder, digitOf, encodeOrder, humanLine, parseShareHash, parseStart, previewTitle, proudLine, randomOrder,
  scoreOf, shareHash, tableName, tallyIds, typeDigit, DEFAULT_ORDER, MAX_NAME, MULTIPLIERS, TABLES, type Shared,
} from "../lib/namta";
import { share } from "../share";

const sample: Shared = { t: 5, q: [3, 7, 2, 9, 5, 10, 4, 8, 1, 6], a: [15, 35, 10, 45, 25, 50, 20, 40, 5, 30], n: "রাফি", w: "meye", s: 0 };

test("the game covers ২ to ২০, ten sums each, and the default order is a real shuffle of ×১ to ×১০", () => {
  assert.deepEqual(TABLES, Array.from({ length: 19 }, (_, index) => index + 2));
  assert.deepEqual([...DEFAULT_ORDER].sort((x, y) => x - y), MULTIPLIERS);
  assert.equal(DEFAULT_ORDER[0], 3);
  for (let run = 0; run < 50; run++) assert.deepEqual(randomOrder().sort((x, y) => x - y), MULTIPLIERS);
  assert.deepEqual(randomOrder(() => 0.999), MULTIPLIERS);
});

test("the score is recomputed from the answers, never read from the link", () => {
  assert.equal(scoreOf(sample), 10);
  assert.equal(scoreOf({ ...sample, a: [15, 35, 10, 45, 25, 50, 20, 40, 5, 31] }), 9);
  assert.equal(scoreOf({ ...sample, a: [] }), 0);
  const forged = parseShareHash(shareHash({ ...sample, a: Array(10).fill(0) }) + "&score=10");
  assert.equal(forged && scoreOf(forged), 0);
});

test("the pad types Bangla or Latin digits, at most three, with no leading zero", () => {
  assert.equal(digitOf("৭"), 7);
  assert.equal(digitOf("0"), 0);
  assert.equal(digitOf("a"), null);
  assert.equal(digitOf("১২"), null);
  assert.equal(typeDigit("", 0), "0");
  assert.equal(typeDigit("0", 5), "5");
  assert.equal(typeDigit("20", 0), "200");
  assert.equal(typeDigit("200", 1), "200");
});

test("order travels as ten distinct digits, ১০ written as 0", () => {
  assert.equal(encodeOrder(sample.q), "3729504816");
  assert.deepEqual(decodeOrder("3729504816"), sample.q);
  assert.equal(decodeOrder("3729504811"), null);
  assert.equal(decodeOrder("372950481"), null);
  assert.equal(decodeOrder("37295048x6"), null);
  assert.equal(decodeOrder(null), null);
});

test("a finished game survives the link round trip, so a sibling gets the same ten sums", () => {
  assert.deepEqual(parseShareHash(shareHash(sample)), sample);
  const timed = { ...sample, n: "", w: "bachcha" as const, s: 48 };
  assert.equal(shareHash(timed), "#t=5&q=3729504816&a=15-35-10-45-25-50-20-40-5-30&s=48");
  assert.deepEqual(parseShareHash(shareHash(timed)), timed);
  assert.equal(share.normalize(shareHash(sample).slice(1)), shareHash(sample).slice(1));
});

test("hostile or broken links are refused or capped", () => {
  assert.equal(parseShareHash(""), null);
  assert.equal(parseShareHash("#result"), null);
  assert.equal(parseShareHash("#t=5&q=3729504816&a=1-2-3"), null);
  assert.equal(parseShareHash("#t=1&q=3729504816&a=1-2-3-4-5-6-7-8-9-10"), null);
  assert.equal(parseShareHash("#t=21&q=3729504816&a=1-2-3-4-5-6-7-8-9-10"), null);
  assert.equal(parseShareHash("#t=5&q=3729504816&a=1-2-3-4-5-6-7-8-9-1000"), null);
  assert.equal(parseShareHash("#t=5&q=3729504816&a=1-2-3-4-5-6-7-8-9--1"), null);
  assert.equal(parseShareHash("#t=05.0&q=3729504816&a=1-2-3-4-5-6-7-8-9-10"), null);
  assert.equal(parseShareHash("#t=5&q=3729504816&a=1-2-3-4-5-6-7-8-9-10&n=" + "ক".repeat(400)), null);
  const odd = parseShareHash("#t=5&q=3729504816&a=1-2-3-4-5-6-7-8-9-10&w=boss&s=9999");
  assert.equal(odd?.w, "bachcha");
  assert.equal(odd?.s, 0);
  assert.equal(share.normalize("t=5&q=x"), null);
  assert.equal(shareHash({ ...sample, n: "", a: [5000, -3, 1.7, 0, 0, 0, 0, 0, 0, 0], s: 5000 }), "#t=5&q=3729504816&a=999-0-1-0-0-0-0-0-0-0&w=meye&s=999");
});

test("a bare #t= link only picks the table", () => {
  assert.equal(parseStart("#t=13"), 13);
  assert.equal(parseStart("#t=1"), null);
  assert.equal(parseStart("#result"), null);
  assert.equal(parseStart(shareHash(sample)), null);
});

test("names are NFC-normalized, cleaned and capped", () => {
  assert.equal(cleanName("  রিমা‮  আক্তার\n"), "রিমা আক্তার");
  assert.equal(cleanName("ক".repeat(MAX_NAME + 10)).length, MAX_NAME);
  assert.equal(cleanName("প্রিয়য়"), cleanName("প্রিয়য়"));
});

test("the words are kind and gender-neutral unless a parent picks ছেলে or মেয়ে", () => {
  assert.equal(proudLine(10, "bachcha"), "আমার বাচ্চা পেরেছে!");
  assert.equal(proudLine(10, "meye"), "আমার মেয়ে পেরেছে!");
  assert.equal(proudLine(10, "ami"), "আমি পেরেছি!");
  for (let score = 0; score <= 10; score++) {
    assert.doesNotMatch(proudLine(score, "bachcha") + humanLine(score, 7), /ফেল|খারাপ|ভুল করেছে/);
  }
  assert.equal(tableName(13), "১৩-এর নামতা");
  assert.match(humanLine(10, 17), /১৭-এর নামতা/);
});

test("captions and link previews are personal; only fixed table ids are counted", () => {
  assert.equal(caption(sample), "আমার মেয়ে রাফি ৫-এর নামতায় ১০-এ ১০ পেয়েছে! একই ১০টা অঙ্ক, তোমার বাচ্চা কয়টা পারে?");
  assert.equal(caption({ ...sample, w: "ami" }), "আমি ৫-এর নামতায় ১০-এ ১০ পেয়েছি! একই ১০টা অঙ্ক, তুমি কয়টা পারো?");
  assert.equal(previewTitle(sample), "রাফি ৫-এর নামতায় ১০-এ ১০ পেয়েছে। তোমার বাচ্চা কয়টা পারবে?");
  assert.match(share.preview(shareHash({ ...sample, n: "" }).slice(1)).title, /^এক খুদে বন্ধু ৫-এর নামতায়/);
  assert.equal(share.preview("junk").title, "নামতা পারো? স্লেটে দেখাও");
  assert.deepEqual(share.tally, tallyIds);
  assert.equal(tallyIds.length, 19);
  assert.ok(tallyIds.every(id => /^t\d{1,2}$/.test(id)));
});
