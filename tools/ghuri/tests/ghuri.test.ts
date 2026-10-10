import assert from "node:assert/strict";
import test from "node:test";
import { banglaYear, caption, cleanText, colors, headline, humanLine, parseShareHash, patterns, previewTitle, stateOf, wishes, DEFAULT, MAX_TEXT, type Ghuri } from "../lib/ghuri";
import { share } from "../share";

const kite: Ghuri = { ...DEFAULT, pattern: "chokhdar", color: "blue", text: "রাফি" };
const fanush: Ghuri = { ...DEFAULT, mode: "fanush", wish: "shustho", color: "yellow", text: "" };

test("kites and lanterns survive the link round trip in the brief's format", () => {
  assert.equal(stateOf(kite), "o=kite&p=chokhdar&c=blue&nm=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  assert.deepEqual(parseShareHash("#" + stateOf(kite)), kite);
  assert.deepEqual(parseShareHash("#o=kite&p=chokhdar&c=blue&nm=রাফি"), kite);
  assert.equal(stateOf(fanush), "o=fanush&w=shustho&c=yellow");
  assert.deepEqual(parseShareHash(stateOf(fanush)), fanush);
  for (const pattern of patterns) for (const color of colors) {
    const item = { ...DEFAULT, pattern: pattern.id, color: color.id };
    assert.deepEqual(parseShareHash(stateOf(item)), item);
  }
});

test("hostile or broken links are refused instead of crashing", () => {
  for (const bad of ["", "#result", "#make", "#o=kite", "#o=kite&p=chokhdar", "#o=kite&p=nope&c=red", "#o=kite&p=chokhdar&c=purple", "#o=plane&p=chokhdar&c=red", "#o=fanush&c=red", "#o=fanush&w=__proto__&c=red", "#o=kite&p=constructor&c=red", "#%%%"]) {
    assert.equal(parseShareHash(bad), null, bad);
  }
});

test("written words are NFC, lose control and direction-override characters, and are capped", () => {
  assert.equal(cleanText("  উড়ে‮  যা\n"), "উড়ে যা");
  assert.equal(cleanText("রয়".normalize("NFD")), "রয়".normalize("NFC"));
  assert.equal(cleanText("ক".repeat(MAX_TEXT + 10)).length, MAX_TEXT);
  assert.equal(parseShareHash(`#o=kite&p=daba&c=red&nm=${encodeURIComponent("ক".repeat(300))}`)!.text.length, MAX_TEXT);
  assert.equal(stateOf({ ...kite, text: "   " }), "o=kite&p=chokhdar&c=blue");
});

test("ids are unique and every kite has its own human line", () => {
  for (const list of [patterns, colors, wishes]) assert.equal(new Set(list.map(item => item.id)).size, list.length);
  assert.equal(new Set(patterns.map(pattern => pattern.line)).size, patterns.length);
  assert.equal(humanLine(fanush), "আকাশে একটা আলো, মনে একটা চাওয়া।");
  assert.equal(headline({ ...kite, text: "" }), "চোখদার");
  assert.equal(headline(fanush), "মা-বাবা সুস্থ থাকুক");
});

test("the card year is the Bangla year Shakrain falls in", () => {
  assert.equal(banglaYear(new Date(2026, 9, 10)), 1433);
  assert.equal(banglaYear(new Date(2027, 0, 14)), 1433); // Shakrain 2027 = 30 Poush 1433
  assert.equal(banglaYear(new Date(2027, 3, 13)), 1433);
  assert.equal(banglaYear(new Date(2027, 3, 14)), 1434);
});

test("caption and link preview speak for the person, tally only counts fixed ids", () => {
  assert.equal(caption(kite), "সাকরাইনের আকাশে আমার ঘুড়ি ‘রাফি’ উড়ছে! তোমার ঘুড়ির নাম কী?");
  assert.equal(previewTitle({ ...kite, text: "" }), "এক বন্ধুর চোখদার উড়ছে সাকরাইনের আকাশে — তোমার ঘুড়ি কই?");
  const state = share.normalize("o=kite&p=chokhdar&c=blue&nm=রাফি")!;
  assert.equal(share.preview(state).title, "‘রাফি’ উড়ছে সাকরাইনের আকাশে — তোমার ঘুড়ি কই?");
  assert.equal(share.preview(share.normalize("o=fanush&w=bhalo&c=red")!).title, "এক বন্ধুর ফানুসে একটা চাওয়া: সবাই ভালো থাকুক");
  assert.equal(share.normalize("o=kite&p=x&c=red"), null);
  assert.deepEqual([...share.tally!], patterns.map(pattern => pattern.id));
  assert.ok(share.tally!.every(id => !/[^\x00-\x7f]/.test(id)));
});
