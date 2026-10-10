import assert from "node:assert/strict";
import test from "node:test";
import { conversions, equation, labels, parsePlot, plotHash, plotLine, previewTitle, sample, type Plot } from "../lib/plot";
import { amountText, convert, inputText, parseAmount, PITCH_SQFT, pitchText, SQM_IN_SQFT, unitById, units, type UnitId } from "../lib/units";
import { site } from "../content";
import { share } from "../share";

const close = (actual: number, expected: number, message?: string) => assert.ok(Math.abs(actual - expected) <= Math.abs(expected) * 1e-12, `${message ?? ""} ${actual} ≠ ${expected}`);

test("unit sizes match the Ministry of Land table", () => {
  const sqft = Object.fromEntries(units.map(unit => [unit.id, unit.sqft]));
  assert.deepEqual({ ...sqft, sqm: undefined }, { shotangsho: 435.6, katha: 720, bigha: 14400, acre: 43560, sqft: 1, chhotak: 45, sqm: undefined });
  close(sqft.sqm, 10.76391041670972);
  assert.equal(amountText(SQM_IN_SQFT), "১০.৭৬");
  assert.equal(SQM_IN_SQFT.toFixed(4), "10.7639");
  // The table's own relations: 20 কাঠা = 1 বিঘা, 16 ছটাক = 1 কাঠা, 100 শতাংশ = 1 একর, 1 একর = 3 বিঘা 8 ছটাক.
  close(convert(1, "bigha", "katha"), 20);
  close(convert(1, "katha", "chhotak"), 16);
  close(convert(1, "acre", "shotangsho"), 100);
  close(convert(3, "bigha", "sqft") + convert(8, "chhotak", "sqft"), 43560);
  // The ministry's rounded metric figures agree.
  assert.equal(Math.round(convert(1, "acre", "sqm")), 4047);
  assert.equal(Math.round(convert(1, "bigha", "sqm")), 1338);
  assert.equal(new Set(units.map(unit => unit.id)).size, units.length);
});

test("every conversion pair is consistent both ways and through square feet", () => {
  for (const from of units) for (const to of units) {
    const forward = convert(7.25, from.id, to.id);
    close(convert(forward, to.id, from.id), 7.25, `${from.id}→${to.id}→back`);
    close(forward, 7.25 * from.sqft / to.sqft, `${from.id}→${to.id}`);
    if (from.id === to.id) close(forward, 7.25);
  }
});

test("known answers people search for, shown with Bangla digits and sensible decimals", () => {
  const shown = (value: number, from: UnitId, to: UnitId) => amountText(convert(value, from, to));
  assert.equal(shown(1, "shotangsho", "sqft"), "৪৩৫.৬");
  assert.equal(shown(5, "shotangsho", "sqft"), "২,১৭৮");
  assert.equal(shown(1, "bigha", "shotangsho"), "৩৩.০৬");
  assert.equal(shown(1, "bigha", "katha"), "২০");
  assert.equal(shown(1, "bigha", "sqft"), "১৪,৪০০");
  assert.equal(shown(1, "bigha", "sqm"), "১,৩৩৮");
  assert.equal(shown(1, "bigha", "acre"), "০.৩৩১");
  assert.equal(shown(1, "bigha", "chhotak"), "৩২০");
  assert.equal(shown(1, "katha", "shotangsho"), "১.৬৫");
  assert.equal(shown(1, "katha", "sqft"), "৭২০");
  assert.equal(shown(1, "chhotak", "sqft"), "৪৫");
  assert.equal(shown(1, "acre", "bigha"), "৩.০৩");
  assert.equal(shown(1, "acre", "katha"), "৬০.৫");
  assert.equal(shown(1, "acre", "sqft"), "৪৩,৫৬০");
  assert.equal(shown(2160, "sqft", "katha"), "৩");
  assert.equal(shown(100, "acre", "sqft"), "৪৩,৫৬,০০০");
  assert.equal(shown(1, "sqm", "sqft"), "১০.৭৬");
  assert.equal(shown(1, "katha", "acre"), "০.০১৬৫");
});

test("rounding never shows false precision", () => {
  assert.equal(amountText(1337.8), "১,৩৩৮");
  assert.equal(amountText(435.64), "৪৩৫.৬");
  assert.equal(amountText(33.05785), "৩৩.০৬");
  assert.equal(amountText(20.0000000001), "২০");
  assert.equal(amountText(100.00000000000001), "১০০");
  assert.equal(amountText(0.0000229568), "০.০০০০২৩");
  assert.equal(amountText(0.00002), "০.০০০০২");
  assert.equal(amountText(0.00000001), "০.০০০০১-এর কম");
  assert.equal(amountText(4356000000), "৪,৩৫,৬০,০০,০০০");
});

test("input takes Bangla or English digits, grouping and one decimal point", () => {
  assert.equal(parseAmount("১"), 1);
  assert.equal(parseAmount("2.5"), 2.5);
  assert.equal(parseAmount("২.৫"), 2.5);
  assert.equal(parseAmount(" ১৪,৪০০ "), 14400);
  assert.equal(parseAmount("1 00 000"), 100000);
  assert.equal(parseAmount(".৫"), 0.5);
  assert.equal(parseAmount("৩."), 3);
  assert.equal(parseAmount("১.২৩৪৫৬"), 1.2346);
  assert.equal(parseAmount("9999999"), 9999999);
  for (const bad of ["", " ", ".", "0", "০.০০০০১", "-1", "1e3", "১০০০০০০০", "১/২", "abc", "১.২.৩", "Infinity", "0x10", "৩ কাঠা"]) assert.equal(parseAmount(bad), null, bad);
  for (const value of [1, 2.5, 0.0001, 33.0579, 9999999.9999, 14400]) assert.equal(parseAmount(inputText(value)), value);
  assert.equal(inputText(14400), "১৪৪০০");
});

test("the football comparison is computed from the 105 × 68 m pitch", () => {
  close(PITCH_SQFT, 105 * 68 * SQM_IN_SQFT);
  assert.equal(Math.round(PITCH_SQFT), 76854);
  assert.equal(pitchText(convert(1, "bigha", "sqft")), "ফুটবল মাঠের প্রায় ১৯%");
  assert.equal(pitchText(convert(1, "acre", "sqft")), "ফুটবল মাঠের প্রায় ৫৭%");
  assert.equal(pitchText(convert(1, "katha", "sqft")), "ফুটবল মাঠের ১%-এরও কম");
  assert.equal(pitchText(PITCH_SQFT), "প্রায় পুরো একটা ফুটবল মাঠ");
  assert.equal(pitchText(convert(5, "acre", "sqft")), "ফুটবল মাঠের প্রায় ২.৮ গুণ");
  assert.equal(pitchText(PITCH_SQFT * 123456), "ফুটবল মাঠের প্রায় ১,২৩,৪৫৬ গুণ");
});

test("the brief's link opens 1 বিঘা and the card line reads like the brief", () => {
  assert.deepEqual(parsePlot("#v=1&u=bigha"), sample);
  assert.equal(plotHash(sample), "v=1&u=bigha");
  assert.equal(equation(sample), "১ বিঘা = ৩৩.০৬ শতাংশ = ২০ কাঠা = ১৪,৪০০ বর্গফুট");
  assert.deepEqual(conversions(sample).map(item => item.label), ["শতাংশ", "কাঠা", "একর", "বর্গফুট", "বর্গমিটার", "ছটাক"]);
  assert.equal(equation({ value: 5, unit: "shotangsho", label: "" }), "৫ শতাংশ = ৩.০৩ কাঠা = ২,১৭৮ বর্গফুট = ০.১৫১ বিঘা");
});

test("plots survive the link round trip", () => {
  const plots: Plot[] = [sample, { value: 3, unit: "katha", label: "vita" }, { value: 0.0001, unit: "sqm", label: "pukur" }, { value: 9999999.9999, unit: "acre", label: "khet" }, { value: 12.5, unit: "shotangsho", label: "" }];
  for (const plot of plots) {
    assert.deepEqual(parsePlot("#" + plotHash(plot)), plot);
    assert.equal(share.normalize(plotHash(plot)), plotHash(plot));
  }
  assert.equal(plotHash({ value: 3, unit: "katha", label: "vita" }), "v=3&u=katha&l=vita");
});

test("hostile or broken links are refused or cleaned, never invented", () => {
  for (const hash of ["", "#", "#result", "#source", "v=1", "u=bigha", "v=0&u=bigha", "v=-1&u=bigha", "v=1e3&u=bigha", "v=Infinity&u=bigha", "v=1&u=gonda", "v=1&u=BIGHA", "v=1&u=bigha%00", "v=12345678&u=acre", "v=1.23456&u=acre", "v=১&u=bigha", "v=1,000&u=sqft", "v=1+2&u=sqft", "v=%E0%A7%A7&u=bigha", "v=1&u=<script>"]) {
    assert.equal(parsePlot(hash), null, hash);
    assert.equal(share.normalize(hash), null, hash);
  }
  // Unknown labels and extra keys are dropped; leading zeros are tidied.
  assert.equal(share.normalize("v=007&u=katha&l=mosque&x=<b>"), "v=7&u=katha");
  assert.equal(share.normalize("v=2&u=bigha&l=pukur&l=vita"), "v=2&u=bigha&l=pukur");
  // Labels are fixed ids; a lookalike or decomposed spelling is not one of them.
  assert.equal(parsePlot(`v=1&u=bigha&l=${encodeURIComponent("পুকুর")}`)!.label, "");
  assert.equal(parsePlot("v=1&u=bigha&l=pukur‍")!.label, "");
  assert.ok(plotHash(parsePlot("v=" + "9".repeat(5000) + "&u=acre") ?? sample).length < 40);
});

test("link previews name the size; human lines follow the input", () => {
  assert.equal(share.preview("v=1&u=bigha").title, "১ বিঘা = ৩৩.০৬ শতাংশ = ২০ কাঠা = ১৪,৪০০ বর্গফুট");
  assert.equal(share.preview("v=3&u=katha&l=vita").title, "ভিটা: ৩ কাঠা = ৪.৯৬ শতাংশ = ২,১৬০ বর্গফুট = ০.১৫ বিঘা");
  assert.match(share.preview("v=1&u=bigha").description, /ফুটবল মাঠের প্রায় ১৯%/);
  assert.equal(share.preview("garbage").title, "শতাংশ, কাঠা, বিঘা — কোনটা কত?");
  assert.equal(share.tally, undefined);
  assert.equal(previewTitle(sample), equation(sample));
  const lines = new Set([0.5, 3, 10, 1.5, 20].map(value => plotLine({ value, unit: "katha", label: "" })));
  assert.ok(lines.size >= 4);
  for (const label of labels) assert.ok(plotLine({ value: 3, unit: "katha", label: label.id }).length > 10);
  assert.match(plotLine({ value: 5, unit: "acre", label: "" }), /ফুটবল মাঠের চেয়েও বড়/);
});

test("page copy follows the SEO rules and its numbers match the calculator", () => {
  assert.ok(site.title.length <= 45, `${site.title.length}`);
  assert.ok(site.description.length >= 120 && site.description.length <= 160, `${site.description.length}`);
  assert.ok(site.faq.length >= 5);
  const faq = site.faq.map(item => item.answer).join(" ");
  for (const fact of [amountText(convert(5, "shotangsho", "sqft")), amountText(convert(1, "bigha", "shotangsho")), amountText(convert(1, "katha", "shotangsho")), amountText(convert(1, "acre", "bigha")), amountText(convert(1, "acre", "katha")), amountText(PITCH_SQFT), amountText(unitById("chhotak").sqft)]) {
    assert.ok(faq.includes(fact), fact);
  }
  assert.ok(!/আপনি|করুন|দেখুন/.test(JSON.stringify(site)));
});
