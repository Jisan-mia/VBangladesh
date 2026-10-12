import assert from "node:assert/strict";
import test from "node:test";
import { CPI } from "../lib/cpi";
import { createCard, growthText, humanLine, parseShareHash, previewTitle, roughly, shareHash, worth, years, FIRST_YEAR, LATEST_YEAR } from "../lib/tokhon";
import { share } from "../share";

test("the CPI table is one unbroken, steadily rising yearly series", () => {
  const keys = Object.keys(CPI).map(Number);
  assert.equal(FIRST_YEAR, 1986);
  assert.equal(LATEST_YEAR, 2025);
  assert.deepEqual(keys, Array.from({ length: LATEST_YEAR - FIRST_YEAR + 1 }, (_, index) => FIRST_YEAR + index));
  for (const year of keys.slice(1)) {
    const change = CPI[year] / CPI[year - 1];
    // Bangladesh has not had a falling year or a 30% jump in this series; either would mean a broken table.
    assert.ok(change >= 1 && change < 1.3, `${year}: ${change}`);
  }
});

test("known years match the World Bank response they were generated from", () => {
  assert.equal(CPI[2010], 100);
  assert.equal(CPI[1995], 42.5345);
  assert.equal(CPI[2025], 285.0006);
});

test("a sum survives the round trip to now and back", () => {
  for (const year of [FIRST_YEAR, 1995, 2010, 2024]) assert.ok(Math.abs(worth(worth(100, year), LATEST_YEAR, year) - 100) < 1e-9, String(year));
  assert.throws(() => worth(100, 1985), RangeError);
});

test("results are rounded to whole taka without false precision", () => {
  assert.equal(roughly(670.04), 670);
  assert.equal(roughly(11738.1), 11700);
  assert.equal(roughly(10.88), 11);
  assert.equal(roughly(108.77), 109);
  assert.equal(createCard({ year: 1995, amount: 100, birth: false }).sentence, "১৯৯৫ সালের ১০০ টাকা ≈ এখনকার ৬৭০ টাকা");
  assert.equal(createCard({ year: 1986, amount: 1000, birth: false }).now, 11700);
  assert.equal(createCard({ year: 1990, amount: 100, birth: false }).now, 884);
});

test("growth reads as times, or as a percentage when small", () => {
  assert.equal(growthText(worth(1, 1995)), "গড় দাম বেড়েছে প্রায় ৬.৭ গুণ");
  assert.equal(growthText(worth(1, 2024)), "গড় দাম বেড়েছে প্রায় ৯%");
  assert.equal(growthText(2.04), "গড় দাম বেড়েছে প্রায় ২ গুণ");
});

test("the human line says what the sum is worth today", () => {
  assert.equal(humanLine({ year: 1995 }), "১৯৯৫-এর ১০০ টাকায় যা কেনা যেত, আজ তা কিনতে লাগে প্রায় ৬৭০ টাকা।");
  assert.equal(humanLine({ year: 1986, amount: 1000 }), "১৯৮৬-এর ১,০০০ টাকায় যা কেনা যেত, আজ তা কিনতে লাগে প্রায় ১১,৭০০ টাকা।");
  for (const year of years) assert.ok(humanLine({ year }).length > 10);
});

test("a shared link round-trips and refuses hostile input", () => {
  const shared = { year: 1995, amount: 100, birth: true } as const;
  assert.equal(shareHash(shared), "#y=1995&a=100&b=1");
  assert.deepEqual(parseShareHash(shareHash(shared)), shared);
  assert.deepEqual(parseShareHash("y=2000&a=10"), { year: 2000, amount: 10, birth: false });
  assert.deepEqual(parseShareHash("#y=1986&a=1000&b=yes&x=1")?.birth, false);
  for (const hash of ["", "#", "#result", "#y=1985&a=100", "#y=2025&a=100", "#y=1995&a=50", "#y=1995&a=1e2", "#y=1995&a=0100", "#y=1995.0&a=100", "#y=19950&a=100", "#y=১৯৯৫&a=১০০", "#y=<script>&a=100", `#y=1995&a=100&z=${"x".repeat(300)}`]) {
    assert.equal(parseShareHash(hash), null, hash);
  }
});

test("every generated text is NFC, so canvas and link previews match the repo", () => {
  for (const year of [1986, 1995, 2012, 2024]) {
    const card = createCard({ year, amount: 1000, birth: year === 1995 });
    for (const text of [card.kicker, card.headline, card.sentence, card.growth, card.basis, card.line, previewTitle(card)]) assert.equal(text, text.normalize("NFC"));
  }
});

test("share: normalize, personal preview, and a tally over fixed year ids only", () => {
  assert.equal(share.normalize("a=100&y=1995&b=1&n=রাফি"), "y=1995&a=100&b=1");
  assert.equal(share.normalize("y=2025&a=100"), null);
  assert.equal(share.preview("y=1995&a=100&b=1").title, "আমার জন্মসাল ১৯৯৫: তখনকার ১০০ টাকা এখন প্রায় ৬৭০ টাকা। তোমারটা কত?");
  assert.equal(share.preview("y=1995&a=100").title, "১৯৯৫ সালের ১০০ টাকা এখন প্রায় ৬৭০ টাকা। তোমার জন্মসালেরটা কত?");
  assert.deepEqual(share.tally, years.map(String));
  assert.ok(!share.tally!.includes(String(LATEST_YEAR)));
});
