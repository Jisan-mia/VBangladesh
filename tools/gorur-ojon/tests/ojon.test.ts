import assert from "node:assert/strict";
import test from "node:test";
import { cleanName, convertLength, cowHash, inRange, kgText, kgToLb, kgToMon, lbText, lbToKg, limits, liveWeight, meatText, monText, monToKg, packetCount, parseCow, previewTitle, sample, splitMeat, weightLine, type Cow } from "../lib/ojon";
import { site } from "../content";
import { share } from "../share";

const close = (actual: number, expected: number, tolerance = 1e-9) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≠ ${expected}`);

test("Schaeffer's formula matches the extension worked example", () => {
  // Oregon State Extension: a beef cow with 70 in girth and 78 in length → (70 × 70 × 78) / 300 = 1,274 lbs.
  close(liveWeight(70, 78, "in").lb, 1274);
  close(liveWeight(50, 42, "in").lb, 350);
  assert.equal(lbText(liveWeight(70, 78, "in").lb), "১,২৭৪");
});

test("pounds, kilograms and মণ convert both ways", () => {
  close(lbToKg(1), 0.45359237);
  close(kgToLb(1), 2.2046226218487757);
  close(lbToKg(kgToLb(123.4)), 123.4);
  close(monToKg(1), 40);
  close(kgToMon(40), 1);
  close(kgToMon(1300), 32.5); // "সাড়ে ৩২ মণ" = "১ হাজার ৩০০ কেজি"
  close(kgToLb(monToKg(1)), 88.18490487395103);
  const w = liveWeight(50, 42, "in");
  close(w.kg, 350 * 0.45359237);
  close(w.mon, (350 * 0.45359237) / 40);
  // The "÷ 660 = কেজি" shortcut is the same formula: 300 / 0.45359237 ≈ 661.4.
  assert.ok(Math.abs(w.kg - (50 * 50 * 42) / 661.39) < 0.01);
});

test("centimetres give the same answer as inches", () => {
  const inches = liveWeight(50, 42, "in");
  const cm = liveWeight(50 * 2.54, 42 * 2.54, "cm");
  close(cm.lb, inches.lb, 1e-9);
  // In kg straight from cm the divisor is about 10,839.
  close(liveWeight(127, 106.68, "cm").kg, (127 * 127 * 106.68) / (300 / 0.45359237 * 2.54 ** 3), 1e-9);
});

test("switching the unit keeps the same cow, in whole numbers and inside the limits", () => {
  assert.equal(convertLength(50, "in", "cm", "girth"), 127);
  assert.equal(convertLength(127, "cm", "in", "girth"), 50);
  assert.equal(convertLength(42, "in", "cm", "length"), 107);
  assert.equal(convertLength(42, "in", "in", "length"), 42);
  assert.equal(convertLength(130, "in", "cm", "girth"), 330);
  assert.equal(convertLength(51, "cm", "in", "girth"), 20);
  for (const field of ["girth", "length"] as const) {
    assert.ok(inRange(convertLength(limits.in[field][0], "in", "cm", field), "cm", field));
    assert.ok(inRange(convertLength(limits.cm[field][1], "cm", "in", field), "in", field));
  }
});

test("rounding: one decimal of মণ, whole kilograms and pounds, Bangla digits", () => {
  const w = liveWeight(50, 42, "in");
  assert.equal(monText(w.mon), "৪");
  assert.equal(kgText(w.kg), "১৫৯");
  assert.equal(lbText(w.lb), "৩৫০");
  assert.equal(monText(3.25), "৩.৩");
  assert.equal(monText(3.04), "৩");
  assert.equal(monText(32.5), "৩২.৫");
  assert.equal(kgText(1299.6), "১,৩০০");
  assert.equal(meatText(12.34), "১২.৩");
  assert.equal(meatText(12), "১২");
});

test("meat splits in 100 g steps that always add up to the total", () => {
  assert.deepEqual(splitMeat(36, [1, 1, 1]), [12, 12, 12]);
  assert.deepEqual(splitMeat(37, [1, 1, 1]), [12.4, 12.3, 12.3]);
  assert.deepEqual(splitMeat(36, [2, 1, 1]), [18, 9, 9]);
  assert.deepEqual(splitMeat(36, [1, 0, 2]), [12, 0, 24]);
  assert.deepEqual(splitMeat(10, [0, 0, 0]), [0, 0, 0]);
  for (const total of [1, 7.3, 36, 99.9, 250, 999]) for (const split of [[1, 1, 1], [3, 1, 1], [4, 3, 2], [0, 1, 4]] as const) {
    const parts = splitMeat(total, [...split]);
    assert.equal(Math.round(parts.reduce((a, b) => a + b, 0) * 10), Math.round(total * 10), `${total} ${split}`);
    parts.forEach((part, index) => { if (split[index] === 0) assert.equal(part, 0); });
  }
});

test("packets count only the two shares given away", () => {
  assert.equal(packetCount(36, [1, 1, 1], 500), 48);
  assert.equal(packetCount(36, [1, 1, 1], 750), 32);
  assert.equal(packetCount(36, [1, 1, 1], 1000), 24);
  assert.equal(packetCount(37, [1, 1, 1], 500), 49);
  assert.equal(packetCount(36, [1, 0, 0], 500), 0);
});

test("link state round-trips", () => {
  const cows: Cow[] = [
    sample,
    { ...sample, name: "লালু", meat: 36 },
    { girth: 127, length: 107, unit: "cm", name: "কালা মানিক", meat: 120.5, split: [2, 1, 1], packet: 750, card: "bhag" },
    { girth: 20, length: 15, unit: "in", name: "", meat: 1, split: [0, 0, 4], packet: 1000, card: "ojon" },
  ];
  for (const cow of cows) assert.deepEqual(parseCow(cowHash(cow)), cow);
  assert.equal(cowHash(sample), "g=50&l=42&m=36");
  // The brief's example link opens.
  assert.deepEqual(parseCow("#g=62&l=58&nm=লালু&m=36"), { ...sample, girth: 62, length: 58, name: "লালু" });
});

test("hostile or broken links fall back safely", () => {
  for (const bad of ["", "#", "g=50", "l=42", "g=abc&l=42", "g=1e3&l=42", "g=999&l=42", "g=50&l=0", "g=-50&l=42", "g=50.25&l=42", "g=19&l=42", "g=131&l=42", "g=50&l=42&u=cm", "g=٥٠&l=42", "g=%E0&l=42"]) {
    assert.equal(parseCow(bad), null, bad);
  }
  const odd = parseCow("g=50&l=42&m=5000&s=9-9-9&p=123&c=x&u=mm");
  assert.deepEqual(odd, sample);
  assert.deepEqual(parseCow("g=50&l=42&s=0-0-0")?.split, [1, 1, 1]);
  assert.equal(parseCow("g=50&l=42&m=0")?.meat, 36);
});

test("names are NFC, stripped of control and bidi characters, capped at 12 and never cut mid-conjunct", () => {
  assert.equal(cleanName("  লালু  "), "লালু");
  assert.equal(cleanName("লা‮লু<b>"), "লা লু b");
  assert.equal(cleanName("a\u0000b\nc"), "a b c");
  assert.equal(cleanName("লালু".normalize("NFD")), "লালু".normalize("NFC"));
  // য় has no composed NFC form: NFC keeps it as য + nukta, the way the repo stores it.
  assert.equal(cleanName(String.fromCodePoint(0x09df)), String.fromCodePoint(0x09af, 0x09bc));
  assert.equal(Array.from(cleanName("অনেক লম্বা নামের গরুটা")).length <= 12, true);
  assert.equal(cleanName("১২৩৪৫৬৭৮৯০১ক্ষ"), "১২৩৪৫৬৭৮৯০১ক");
  assert.equal(parseCow(`g=50&l=42&nm=${encodeURIComponent("x".repeat(40))}`)?.name, "x".repeat(12));
});

test("lines and previews are personal, honest and never about price or meat yield", () => {
  assert.match(weightLine(1.5, ""), /ছোট্টখাট্টো/);
  assert.match(weightLine(3, "লালু"), /^লালুকে /);
  assert.match(weightLine(5, "Lalu"), /^Lalu-কে /);
  assert.match(weightLine(15, "রাজা"), /হাটের রাজা/);
  assert.equal(previewTitle({ ...sample, name: "লালু" }), "লালুর ওজন প্রায় ৪ মণ (১৫৯ কেজি) — তোমাদেরটা কত?");
  assert.equal(previewTitle(sample), "এই গরুর ওজন প্রায় ৪ মণ (১৫৯ কেজি) — তোমাদেরটা কত?");
  assert.equal(previewTitle({ ...sample, card: "bhag" }), "৩৬ কেজি → ১২ + ১২ + ১২ · ৪৮টা প্যাকেট");
  for (const mon of [1, 3, 5, 9, 20]) assert.doesNotMatch(weightLine(mon, ""), /টাকা|দাম|মাংস/);
});

test("share normalizes, rejects junk and previews the sharer's cow", () => {
  assert.equal(share.normalize("#nm=লালু&g=62&l=58&m=36"), "g=62&l=58&nm=%E0%A6%B2%E0%A6%BE%E0%A6%B2%E0%A7%81&m=36");
  assert.equal(share.normalize("g=hello"), null);
  assert.match(share.preview("g=62&l=58&nm=লালু&m=36").title, /^লালুর ওজন প্রায় ৮.৪ মণ/);
  assert.equal(share.tally, undefined);
});

test("SEO content follows the brief", () => {
  assert.ok(site.title.length <= 45);
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.faq.length >= 5);
  assert.match(site.faq.map(item => item.answer).join(" "), /সম্ভাব্য/);
  assert.match(site.privacy.join(" "), /গরুর নাম/);
});
