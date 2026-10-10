import assert from "node:assert/strict";
import test from "node:test";
import { bucketOf, calculate, caption, cleanRoute, defaults, duration, humanLine, limits, parseShareHash, previewTitle, readDigits, shareHash, tallyIds, MAX_ROUTE, type Commute } from "../lib/jam";
import { share } from "../share";

test("the arithmetic is minutes × days a week × 52 weeks × years, shown in 24-hour days", () => {
  const every = calculate({ minutes: 90, days: 7, years: 5, route: "" });
  assert.equal(every.totalMinutes, 90 * 7 * 52 * 5);
  assert.equal(every.value, "১১৪");
  assert.equal(every.unit, "দিন");
  const office = calculate(defaults);
  assert.equal(office.value, "৯৮");
});

test("equivalents are whole counts of the stated assumptions", () => {
  const result = calculate({ minutes: 60, days: 5, years: 1, route: "" });
  // 60 × 5 × 52 = 15,600 minutes
  assert.deepEqual(result.counts.map(item => item.count), [1040, 346, 52, 32]);
  assert.equal(result.counts[0].text, "১,০৪০ কাপ চা");
  assert.equal(result.counts[1].text, "৩৪৬টা নাটক");
});

test("under a day the big number switches to hours, and the smallest input still fills every equivalent", () => {
  const tiny = calculate({ minutes: limits.minutes.min, days: 1, years: 1, route: "" });
  assert.equal(tiny.unit, "ঘণ্টা");
  assert.equal(tiny.value, "৯");
  assert.ok(tiny.counts.every(item => item.count >= 1));
});

test("typed numbers work in Bangla or Latin digits", () => {
  assert.equal(readDigits("৯০"), 90);
  assert.equal(readDigits("120"), 120);
  assert.equal(readDigits("১২ মিনিট"), 12);
  assert.ok(Number.isNaN(readDigits("")));
  assert.ok(Number.isNaN(readDigits("abc")));
});

test("durations read naturally", () => {
  assert.equal(duration(45), "৪৫ মিনিট");
  assert.equal(duration(120), "২ ঘণ্টা");
  assert.equal(duration(90), "১ ঘণ্টা ৩০ মিনিট");
});

test("a commute survives the share-link round trip, including a Bangla route", () => {
  const commute: Commute = { minutes: 150, days: 5, years: 12, route: "আগ্রাবাদ — জিইসি" };
  assert.deepEqual(parseShareHash(shareHash(commute)), commute);
  assert.deepEqual(parseShareHash(shareHash({ ...commute, route: "" })), { ...commute, route: "" });
  assert.deepEqual(parseShareHash("#m=90&y=5&r=%E0%A6%97%E0%A7%81%E0%A6%B2%E0%A6%BF%E0%A6%B8%E0%A7%8D%E0%A6%A4%E0%A6%BE%E0%A6%A8-%E0%A6%AE%E0%A6%BF%E0%A6%B0%E0%A6%AA%E0%A7%81%E0%A6%B0"), { minutes: 90, days: defaults.days, years: 5, route: "গুলিস্তান-মিরপুর" });
});

test("hostile or empty links are refused instead of crashing", () => {
  for (const hash of ["", "#", "#result", "#m=90", "#y=5", "#m=abc&y=5", "#m=-5&y=5", "#m=9.5&y=5", "#m=90&y=5&d=x", "#m=1e9&y=5", `#m=90&y=5&r=${"x".repeat(500)}`, "#m=%%%&y=2"]) {
    assert.equal(parseShareHash(hash), null, hash);
  }
});

test("out-of-range numbers are capped, routes are cleaned, NFC-normalised and capped", () => {
  assert.deepEqual(parseShareHash("#m=99999&d=0&y=900"), { minutes: limits.minutes.max, days: limits.days.min, years: limits.years.max, route: "" });
  assert.equal(parseShareHash("#m=0&y=0")?.minutes, limits.minutes.min);
  assert.equal(cleanRoute("  মিরপুর‮  ১০\n"), "মিরপুর ১০");
  assert.equal(cleanRoute("ক".repeat(MAX_ROUTE + 10)).length, MAX_ROUTE);
  // য় typed as য + nukta becomes the single NFC form.
  assert.equal(cleanRoute("য়"), "য়".normalize("NFC"));
});

test("share.ts normalizes, previews personally and tallies only fixed buckets", () => {
  assert.equal(share.normalize("m=90&d=6&y=5&r=মিরপুর"), "m=90&d=6&y=5&r=" + encodeURIComponent("মিরপুর").replace(/%20/g, "+"));
  assert.equal(share.normalize("hello"), null);
  assert.match(share.preview("m=90&d=6&y=5&r=মিরপুর").title, /৯৮ দিন, মিরপুর রুটে/);
  assert.deepEqual(share.tally, tallyIds);
  assert.equal(new Set(tallyIds).size, 6);
});

test("every daily minute lands in exactly one bucket", () => {
  assert.equal(bucketOf(10).id, "m0");
  assert.equal(bucketOf(30).id, "m1");
  assert.equal(bucketOf(60).id, "m2");
  assert.equal(bucketOf(90).id, "m3");
  assert.equal(bucketOf(120).id, "m4");
  assert.equal(bucketOf(720).id, "m5");
});

test("the human line, caption and preview come from the person's own numbers", () => {
  assert.match(humanLine(defaults), /মাস/);
  assert.match(humanLine({ minutes: 120, days: 7, years: 20, route: "" }), /বছরের বেশি/);
  assert.match(humanLine({ minutes: 20, days: 5, years: 1, route: "" }), /কপাল ভালো/);
  assert.match(caption(defaults), /৯৮ দিন/);
  assert.equal(previewTitle({ ...defaults, route: "" }), "জ্যামে জীবনের ৯৮ দিন। তোমার কত?");
});
