import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_HISAB, LIMITS, cleanLabel, compute, cupScale, parseShareHash, previewTitle, readNumber, shareHash, towerRows, type Hisab } from "../lib/hisab";
import { share } from "../share";

test("the default is the brief's first screen: ৫,০০০ টাকা = ৫০০ কাপ চা", () => {
  const result = compute(DEFAULT_HISAB)!;
  assert.equal(result.cups, 500);
  assert.deepEqual(result.others.map(other => other.text), ["৫০০টা সিঙ্গারা", "১০০টা রিকশা ভাড়া"]);
  assert.equal(result.days, 250);
  assert.equal(result.yearly, 7300);
});

test("only whole cups count; the change is left over", () => {
  assert.equal(compute({ ...DEFAULT_HISAB, amount: 55 })!.cups, 5);
  assert.equal(compute({ ...DEFAULT_HISAB, amount: 9 })!.cups, 0);
});

test("a foreign amount needs a typed rate and converts without float drift", () => {
  assert.equal(compute({ ...DEFAULT_HISAB, currency: "gbp", rate: null }), null);
  const coffee = compute({ ...DEFAULT_HISAB, amount: 4.5, currency: "gbp", rate: 160.1 })!;
  assert.equal(coffee.taka, 720.45);
  assert.equal(coffee.cups, 72);
  // 0.1 × 0.3 style floats must not lose a cup: 3 × 10 = 30 exactly.
  assert.equal(compute({ ...DEFAULT_HISAB, amount: 0.3, currency: "usd", rate: 100, prices: { ...DEFAULT_HISAB.prices, cha: 3 } })!.cups, 10);
});

test("typed numbers accept Bangla digits and commas, nothing else", () => {
  assert.equal(readNumber("৫,০০০"), 5000);
  assert.equal(readNumber("৩২.৫"), 32.5);
  assert.ok(Number.isNaN(readNumber("-5")));
  assert.ok(Number.isNaN(readNumber("1.234")));
  assert.ok(Number.isNaN(readNumber("পাঁচ")));
});

test("the tower never draws more than 66 cups and always uses 1-2-5 steps", () => {
  for (const cups of [1, 66, 67, 500, 5000, 123_456, 1e8]) {
    const each = cupScale(cups);
    assert.ok(cups / each <= 66, `${cups} cups at ${each}`);
    assert.ok([1, 2, 5].includes(each / 10 ** Math.floor(Math.log10(each))));
  }
  assert.deepEqual(towerRows(60), [11, 10, 9, 8, 7, 6, 5, 4]);
  assert.deepEqual(towerRows(61), [11, 10, 9, 8, 7, 6, 5, 4, 1]);
  assert.deepEqual(towerRows(0), []);
});

test("a hisab survives the share-link round trip", () => {
  const hisab: Hisab = { amount: 12.5, currency: "sar", rate: 32.5, prices: { cha: 15, singara: 8, riksha: 70 }, perDay: 3, label: "লন্ডনের কফি" };
  assert.deepEqual(parseShareHash(shareHash(hisab)), hisab);
  assert.equal(shareHash(DEFAULT_HISAB), "#a=5000&u=cha10%2Csingara10%2Criksha50&d=2");
});

test("hostile or broken links are refused or fall back to safe defaults", () => {
  assert.equal(parseShareHash(""), null);
  assert.equal(parseShareHash("#a=-5"), null);
  assert.equal(parseShareHash("#a=1e9"), null);
  assert.equal(parseShareHash(`#a=${LIMITS.taka + 1}`), null);
  assert.equal(parseShareHash("#a=10&c=sar"), null, "a foreign amount without a rate");
  assert.equal(parseShareHash("#a=10&c=sar&r=0"), null);
  assert.equal(parseShareHash("#a=10&c=evil&r=5")?.currency, "bdt");
  const odd = parseShareHash("#a=100&u=cha0,singara9999999,hack5,riksha30&d=99")!;
  assert.deepEqual(odd.prices, { cha: 10, singara: 10, riksha: 30 });
  assert.equal(odd.perDay, 2);
  assert.equal(parseShareHash("#a=1&n=" + "ক".repeat(500)), null, "overlong links are refused outright");
});

test("labels are NFC, stripped of control and bidi characters, and capped", () => {
  assert.equal(cleanLabel("  নতুন‮  ফোন\n"), "নতুন ফোন");
  assert.equal(cleanLabel("নতুন ফোন".normalize("NFD")), cleanLabel("নতুন ফোন"));
  assert.equal([...cleanLabel("চ".repeat(80))].length, LIMITS.label);
  assert.equal(parseShareHash("#a=100&n=%E2%80%AEabc")?.label, "abc");
});

test("the server share normalizes and previews with the person's own words", () => {
  assert.equal(share.normalize("a=05000&d=2"), "a=5000&u=cha10%2Csingara10%2Criksha50&d=2");
  assert.equal(share.normalize("a=abc"), null);
  assert.equal(share.preview("a=20000&n=নতুন ফোন").title, "নতুন ফোন = ২,০০০ কাপ চা! তোমার শখের জিনিস কত কাপ?");
  assert.equal(previewTitle(DEFAULT_HISAB), "৫,০০০ টাকা = ৫০০ কাপ চা");
  assert.equal(share.tally, undefined);
});
