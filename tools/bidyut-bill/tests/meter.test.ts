import assert from "node:assert/strict";
import test from "node:test";
import { appliances, applianceIds, cleanName, decodeUse, defaultUse, headline, homeHash, homeLine, MAX_NAME, meterReading, parseHome, parseNumber, presetHome, previewTitle, shares, stepHours, totalUnits, wheelDigits, type Home } from "../lib/meter";
import { site } from "../content";
import { share } from "../share";

const close = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} ≠ ${expected}`);

test("the first-screen home: 2 fans, 4 bulbs, a fridge and a TV", () => {
  const home = presetHome();
  // fans 2×75 W×8 h×30 = 36, bulbs 4×12×6×30 = 8.64, fridge 60×24×30 = 43.2, TV 60×4×30 = 7.2
  close(totalUnits(home.uses), 95.04);
  assert.equal(homeHash(home), "a=fan2.8,light4.6,fridge1.24,tv1.4");
  const reading = meterReading(home);
  assert.equal(reading.bill.units, 95);
  assert.equal(reading.bill.total, Math.round((75 * 526 + 20 * 850 + 2 * 4200) * 1.05));
  assert.equal(reading.shares[0].use.id, "fridge");
  assert.equal(headline(home.uses), "এ মাসে ফ্রিজ খেল ৪৫%");
});

test("shares are whole percentages that add up to 100, biggest first", () => {
  const home = presetHome();
  const rows = shares(home.uses);
  assert.equal(rows.reduce((sum, row) => sum + row.percent, 0), 100);
  assert.deepEqual(rows.map(row => row.use.id), ["fridge", "fan", "light", "tv"]);
  for (let i = 1; i < rows.length; i++) assert.ok(rows[i - 1].units >= rows[i].units);
  assert.deepEqual(shares([]), []);
});

test("an AC-heavy home gets its line", () => {
  const home: Home = { ...presetHome(), uses: [...presetHome().uses, defaultUse("ac")] };
  assert.equal(shares(home.uses)[0].use.id, "ac");
  assert.equal(homeLine(home.uses), "এসি ঠান্ডা, বিল গরম।");
  assert.match(previewTitle(home), /^এক বাসায় এ মাসে প্রায় .+ ইউনিট, এসি খেল .+% — তোমার বাসায়\?$/);
  assert.equal(homeLine([defaultUse("router")]), "মিটার এত ধীরে ঘোরে, প্রায় শোনাই যায় না।");
});

test("links round-trip, with edited watts, load and name", () => {
  const home: Home = { uses: [{ id: "ac", count: 2, hours: 7, watts: 1450 }, { id: "fan", count: 3, hours: 12, watts: 75 }, { id: "iron", count: 1, hours: 0.5, watts: 1000 }], load: 4, name: "রাফি" };
  const hash = homeHash(home);
  assert.equal(hash, "a=fan3.12,ac2.7w1450,iron1.0.5&kw=4&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  const back = parseHome(`#${hash}`)!;
  assert.deepEqual(back.uses.map(use => use.id), ["fan", "ac", "iron"]);
  assert.deepEqual(back, { ...home, uses: [home.uses[1], home.uses[0], home.uses[2]] });
  assert.deepEqual(parseHome(homeHash(back)), back);
  assert.deepEqual(decodeUse("iron1.0.5"), { id: "iron", count: 1, hours: 0.5, watts: 1000 });
});

test("hostile links: junk is dropped, never thrown", () => {
  for (const bad of ["", "#", "a=", "a=,,,", "a=fan0.8", "a=fan31.8", "a=fan2.0", "a=fan2.25", "a=fan2.0.25", "a=fan2.8w0", "a=fan2.8w3001", "a=heater1.2", "a=FAN2.8", "a=fan2.8;drop", "a=<script>", "x=fan2.8", "%E0%A4%A", "a=fan2.8".padEnd(2100, ",")]) {
    assert.equal(parseHome(bad), null, bad.slice(0, 40));
  }
  const mixed = parseHome("a=junk,fan2.8,fan5.5,heater1.1,tv1.4w99999,light4.6&kw=9&n=%3Cb%3E")!;
  assert.deepEqual(mixed.uses.map(use => [use.id, use.count]), [["fan", 2], ["light", 4]]);
  assert.equal(mixed.load, 2);
  assert.equal(mixed.name, "b");
  // Only as many tokens as there could be appliances are read.
  assert.equal(parseHome(`a=${Array(200).fill("junk").join(",")},fan1.1`), null);
});

test("names are NFC, stripped of control and bidi marks, and capped", () => {
  // \u09df (য়) is a composition exclusion: NFC keeps it as য + ়, so typed and pasted forms must clean to the same string.
  const typed = cleanName("মা\u09af\u09bcা");
  assert.equal(typed, typed.normalize("NFC"));
  assert.equal(cleanName("মা\u09dfা"), typed);
  assert.equal(cleanName("মা\u09dfা".normalize("NFD")), typed);
  assert.equal(parseHome(`a=fan1.1&n=${encodeURIComponent("মা\u09dfা")}`)!.name, typed);
  assert.equal(cleanName("\u202eরাফি\u200f  ভাই\n"), "রাফি ভাই");
  assert.equal(Array.from(cleanName("ক".repeat(40))).length, MAX_NAME);
  assert.equal(cleanName("রাফ\u09cd"), "রাফ");
});

test("share: normalize, a personal preview, and a tally over fixed ids only", () => {
  assert.equal(share.normalize("a=tv1.4,fan2.8&kw=2"), "a=fan2.8,tv1.4");
  assert.equal(share.normalize("nothing"), null);
  const title = share.preview("a=fan2.8,ac1.6&n=রাফি").title;
  assert.match(title, /^রাফির বাসায় এ মাসে প্রায় /);
  assert.ok(share.preview("junk").title.length > 0);
  assert.deepEqual(share.tally, applianceIds);
  assert.equal(new Set(applianceIds).size, appliances.length);
  for (const id of applianceIds) assert.match(id, /^[a-z]{2,12}$/);
});

test("hours step by half an hour up to 2, then by the hour", () => {
  assert.equal(stepHours(0.5, 1), 1);
  assert.equal(stepHours(1.5, 1), 2);
  assert.equal(stepHours(2, 1), 3);
  assert.equal(stepHours(8, -1), 7);
  assert.equal(stepHours(2, -1), 1.5);
  assert.equal(stepHours(2.5, -1), 2);
  assert.equal(stepHours(0.5, -1), 0.5);
  assert.equal(stepHours(24, 1), 24);
});

test("numbers: Bangla or English digits in, five meter wheels out", () => {
  assert.equal(parseNumber("৭৫"), 75);
  assert.equal(parseNumber(" 1450 "), 1450);
  assert.equal(parseNumber("১.৫"), 1.5);
  assert.equal(parseNumber("৭৫ওয়াট"), null);
  assert.equal(parseNumber(""), null);
  assert.equal(wheelDigits(95.04), "00095");
  assert.equal(wheelDigits(123456), "99999");
  assert.equal(wheelDigits(-3), "00000");
});

test("page text meets the SEO brief", () => {
  assert.ok(site.title.length <= 45, site.title);
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.faq.length >= 5);
  assert.notEqual(site.title, "কোন যন্ত্রে কত বিল আসে?");
  assert.ok(site.privacy.some(line => line.includes("লিংকে থাকে")));
});
