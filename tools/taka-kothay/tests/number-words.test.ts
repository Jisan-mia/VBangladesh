import assert from "node:assert/strict";
import test from "node:test";
import { alternatives, banglaAmount, banglaNumber, banglaUnder100, englishAmount, englishNumber, figures, formatTyping, groupDigits, parseAmount, MAX_TAKA } from "../lib/number-words";

// Written out independently of the library table (Wiktionary + Wikipedia, Bangla Academy-style spellings).
const EXPECTED_1_TO_100 = `এক দুই তিন চার পাঁচ ছয় সাত আট নয় দশ
এগারো বারো তেরো চৌদ্দ পনেরো ষোলো সতেরো আঠারো উনিশ বিশ
একুশ বাইশ তেইশ চব্বিশ পঁচিশ ছাব্বিশ সাতাশ আটাশ ঊনত্রিশ ত্রিশ
একত্রিশ বত্রিশ তেত্রিশ চৌত্রিশ পঁয়ত্রিশ ছত্রিশ সাঁইত্রিশ আটত্রিশ ঊনচল্লিশ চল্লিশ
একচল্লিশ বিয়াল্লিশ তেতাল্লিশ চুয়াল্লিশ পঁয়তাল্লিশ ছেচল্লিশ সাতচল্লিশ আটচল্লিশ ঊনপঞ্চাশ পঞ্চাশ
একান্ন বাহান্ন তিপ্পান্ন চুয়ান্ন পঞ্চান্ন ছাপ্পান্ন সাতান্ন আটান্ন ঊনষাট ষাট
একষট্টি বাষট্টি তেষট্টি চৌষট্টি পঁয়ষট্টি ছেষট্টি সাতষট্টি আটষট্টি ঊনসত্তর সত্তর
একাত্তর বাহাত্তর তিয়াত্তর চুয়াত্তর পঁচাত্তর ছিয়াত্তর সাতাত্তর আটাত্তর ঊনআশি আশি
একাশি বিরাশি তিরাশি চুরাশি পঁচাশি ছিয়াশি সাতাশি অষ্টাশি ঊননব্বই নব্বই
একানব্বই বিরানব্বই তিরানব্বই চুরানব্বই পঁচানব্বই ছিয়ানব্বই সাতানব্বই আটানব্বই নিরানব্বই একশো`.split(/\s+/);

test("every word from 1 to 100 matches the checked list", () => {
  assert.equal(EXPECTED_1_TO_100.length, 100);
  for (let n = 1; n <= 100; n++) assert.equal(banglaNumber(n), EXPECTED_1_TO_100[n - 1], String(n));
  assert.equal(banglaNumber(0), "শূন্য");
});

test("the 1–99 table is 100 distinct NFC words with no stray characters", () => {
  assert.equal(banglaUnder100.length, 100);
  assert.equal(new Set(banglaUnder100).size, 100);
  for (const word of [...banglaUnder100, ...Object.values(alternatives)]) {
    assert.equal(word, word!.normalize("NFC"));
    assert.match(word!, /^[ঀ-৿]+$/, word);
  }
  for (const [n, alt] of Object.entries(alternatives)) assert.notEqual(alt, banglaUnder100[Number(n)], n);
});

// An independent reader: words back to a number. If every amount reads back to itself, the composition is right.
const bnValue = new Map<string, number>(banglaUnder100.map((word, n) => [word, n]));
function readBangla(words: string) {
  let total = 0, group = 0;
  for (const word of words.split(" ")) {
    const hundred = /^(.+)(শো|শত)$/.exec(word);
    if (word === "কোটি") { total += group * 10_000_000; group = 0; }
    else if (word === "লাখ" || word === "লক্ষ") { total += group * 100_000; group = 0; }
    else if (word === "হাজার") { total += group * 1000; group = 0; }
    else if (hundred && bnValue.has(hundred[1])) group += bnValue.get(hundred[1])! * 100;
    else if (bnValue.has(word)) group += bnValue.get(word)!;
    else throw new Error(`unknown word ${word}`);
  }
  // A crore count can itself hold hundreds/thousands only up to 999, which the loop above handles per group.
  return total + group;
}
const enOnes = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const enTens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
const enScale: Record<string, number> = { Crore: 1e7, Lakh: 1e5, Billion: 1e9, Million: 1e6, Thousand: 1e3 };
function readEnglish(words: string) {
  let total = 0, group = 0;
  for (const word of words.split(" ")) {
    if (enOnes.includes(word)) group += enOnes.indexOf(word);
    else if (enTens.indexOf(word) > 1) group += enTens.indexOf(word) * 10;
    else if (word === "Hundred") group *= 100;
    else if (word in enScale) { total += group * enScale[word]; group = 0; }
    else throw new Error(`unknown word ${word}`);
  }
  return total + group;
}

function* sampleNumbers() {
  for (let n = 0; n <= 120_000; n++) yield n;
  for (const base of [1e5, 1e6, 1e7, 1e8, 1e9]) for (let d = -150; d <= 150; d++) if (base + d >= 0) yield base + d;
  let seed = 7;
  for (let i = 0; i < 20_000; i++) { seed = (seed * 48271) % 2147483647; yield seed % (MAX_TAKA + 1); }
  yield MAX_TAKA;
}

test("every sampled amount reads back to itself, in all four wordings", () => {
  for (const n of sampleNumbers()) {
    const casual = banglaNumber(n), formal = banglaNumber(n, { formal: true });
    assert.equal(readBangla(casual), n, `${n} ${casual}`);
    assert.equal(readBangla(formal), n, `${n} ${formal}`);
    assert.equal(readEnglish(englishNumber(n)), n, String(n));
    assert.equal(readEnglish(englishNumber(n, { international: true })), n, String(n));
    if (n > 0) assert.doesNotMatch(casual, /শূন্য|  |^ | $|undefined|শত|লক্ষ/, String(n));
    if (n > 0) assert.doesNotMatch(formal, /শো|লাখ/, String(n));
  }
});

test("known cheque amounts, Bangla", () => {
  const cases: Array<[number, string]> = [
    [0, "শূন্য"], [100, "একশো"], [101, "একশো এক"], [110, "একশো দশ"], [999, "নয়শো নিরানব্বই"],
    [1000, "এক হাজার"], [1001, "এক হাজার এক"], [1100, "এক হাজার একশো"], [15000, "পনেরো হাজার"], [50000, "পঞ্চাশ হাজার"],
    [99999, "নিরানব্বই হাজার নয়শো নিরানব্বই"], [100000, "এক লাখ"], [100001, "এক লাখ এক"], [150000, "এক লাখ পঞ্চাশ হাজার"],
    [1234567, "বারো লাখ চৌত্রিশ হাজার পাঁচশো সাতষট্টি"], [9999999, "নিরানব্বই লাখ নিরানব্বই হাজার নয়শো নিরানব্বই"],
    [10000000, "এক কোটি"], [10000001, "এক কোটি এক"], [12500000, "এক কোটি পঁচিশ লাখ"],
    [999999999, "নিরানব্বই কোটি নিরানব্বই লাখ নিরানব্বই হাজার নয়শো নিরানব্বই"], [1000000000, "একশো কোটি"],
    [MAX_TAKA, "নয়শো নিরানব্বই কোটি নিরানব্বই লাখ নিরানব্বই হাজার নয়শো নিরানব্বই"], [3900, "তিন হাজার নয়শো"], [7939, "সাত হাজার নয়শো ঊনচল্লিশ"],
  ];
  for (const [n, words] of cases) assert.equal(banglaNumber(n), words, String(n));
  assert.equal(banglaNumber(1234567, { formal: true }), "বারো লক্ষ চৌত্রিশ হাজার পাঁচশত সাতষট্টি");
  assert.equal(banglaNumber(200, { formal: true }), "দুইশত");
});

test("known cheque amounts, English", () => {
  assert.equal(englishNumber(0), "Zero");
  assert.equal(englishNumber(1001), "One Thousand One");
  assert.equal(englishNumber(50000), "Fifty Thousand");
  assert.equal(englishNumber(100000), "One Lakh");
  assert.equal(englishNumber(1234567), "Twelve Lakh Thirty Four Thousand Five Hundred Sixty Seven");
  assert.equal(englishNumber(1234567, { international: true }), "One Million Two Hundred Thirty Four Thousand Five Hundred Sixty Seven");
  assert.equal(englishNumber(999999999), "Ninety Nine Crore Ninety Nine Lakh Ninety Nine Thousand Nine Hundred Ninety Nine");
  assert.equal(englishNumber(MAX_TAKA, { international: true }), "Nine Billion Nine Hundred Ninety Nine Million Nine Hundred Ninety Nine Thousand Nine Hundred Ninety Nine");
  assert.equal(englishNumber(1000000000), "One Hundred Crore");
});

test("the cheque line adds taka, paisa and মাত্র / Only", () => {
  assert.equal(banglaAmount({ taka: 50000, paisa: 0 }), "পঞ্চাশ হাজার টাকা মাত্র");
  assert.equal(banglaAmount({ taka: 0, paisa: 0 }), "শূন্য টাকা মাত্র");
  assert.equal(banglaAmount({ taka: 1250, paisa: 50 }), "এক হাজার দুইশো পঞ্চাশ টাকা পঞ্চাশ পয়সা মাত্র");
  assert.equal(banglaAmount({ taka: 0, paisa: 5 }), "পাঁচ পয়সা মাত্র");
  assert.equal(banglaAmount({ taka: 100000, paisa: 0 }, { formal: true }), "এক লক্ষ টাকা মাত্র");
  assert.equal(englishAmount({ taka: 50000, paisa: 0 }), "Taka Fifty Thousand Only");
  assert.equal(englishAmount({ taka: 0, paisa: 0 }), "Taka Zero Only");
  assert.equal(englishAmount({ taka: 12, paisa: 50 }), "Taka Twelve and Paisa Fifty Only");
  assert.equal(englishAmount({ taka: 0, paisa: 75 }), "Paisa Seventy Five Only");
  for (const bad of [{ taka: -1, paisa: 0 }, { taka: 1.5, paisa: 0 }, { taka: MAX_TAKA + 1, paisa: 0 }, { taka: 1, paisa: 100 }, { taka: NaN, paisa: 0 }]) {
    assert.throws(() => banglaAmount(bad), RangeError);
    assert.throws(() => englishAmount(bad), RangeError);
  }
});

test("figures use lakh commas, or international ones", () => {
  assert.equal(groupDigits("1234567"), "12,34,567");
  assert.equal(groupDigits("9999999999"), "9,99,99,99,999");
  assert.equal(groupDigits("1234567", true), "1,234,567");
  assert.equal(groupDigits("100"), "100");
  assert.equal(figures({ taka: 1234567, paisa: 5 }), "১২,৩৪,৫৬৭.০৫");
  assert.equal(figures({ taka: 50000, paisa: 0 }), "৫০,০০০");
  assert.equal(figures({ taka: 1234567, paisa: 50 }, { bangla: false, international: true }), "1,234,567.50");
});

test("typed amounts: Bangla or English digits, commas, signs; refuses junk and 3 paisa digits", () => {
  const ok = (raw: string, taka: number, paisa = 0) => assert.deepEqual(parseAmount(raw), { ok: true, amount: { taka, paisa } }, raw);
  ok("৫০,০০০", 50000); ok("50000", 50000); ok("১২,৩৪,৫৬৭.৫", 1234567, 50); ok("1,234,567.05", 1234567, 5);
  ok("৳ ১০০১", 1001); ok("Tk. 1,00,000/-", 100000); ok("৫০০ টাকা", 500); ok("০", 0); ok("0007", 7); ok(".5", 0, 50); ok("12.", 12);
  ok("৯৯,৯৯,৯৯,৯৯৯", 999999999); ok("9999999999.99", MAX_TAKA, 99); ok("১২৩4৫", 12345);
  assert.deepEqual(parseAmount(""), { ok: false, reason: "empty" });
  assert.deepEqual(parseAmount("  ,"), { ok: false, reason: "empty" });
  for (const bad of ["abc", "1.2.3", "12.345", "-5", "1e5", ".", "৫০ হাজার", "0x10", "١٢٣"]) assert.equal(parseAmount(bad).ok, false, bad);
  assert.deepEqual(parseAmount("10000000000"), { ok: false, reason: "too-big" });
  assert.deepEqual(parseAmount("000000000000001"), { ok: true, amount: { taka: 1, paisa: 0 } });
});

test("the field reformats as you type and keeps an unfinished dot", () => {
  assert.equal(formatTyping("1234567"), "১২,৩৪,৫৬৭");
  assert.equal(formatTyping("১২,৩৪৫"), "১২,৩৪৫");
  assert.equal(formatTyping("12."), "১২.");
  assert.equal(formatTyping("12.345"), "১২.৩৪");
  assert.equal(formatTyping("1.2.3"), "১.২৩");
  assert.equal(formatTyping(".5"), "০.৫");
  assert.equal(formatTyping("00500"), "৫০০");
  assert.equal(formatTyping("৳ abc"), "");
});
