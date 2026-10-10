import assert from "node:assert/strict";
import test from "node:test";
import { caption, cleanName, humanLine, isBlocked, letters, mixedScripts, outcome, outcomes, parseShareHash, play, previewTitle, samplePair, shareHash, MAX_NAME } from "../lib/flames";
import { site } from "../content";
import { share } from "../share";

const result = (a: string, b: string) => outcomes[play({ a, b }).result].letter;

test("Bangla names split into whole letters: vowel signs, signs and conjuncts stay with their consonant", () => {
  assert.deepEqual(letters("রাফি"), ["রা", "ফি"]);
  assert.deepEqual(letters("শুভ্র"), ["শু", "ভ্র"]);
  assert.deepEqual(letters("অর্ক"), ["অ", "র্ক"]);
  assert.deepEqual(letters("চাঁদ"), ["চাঁ", "দ"]);
  assert.deepEqual(letters("লক্ষ্মী"), ["ল", "ক্ষ্মী"]);
  assert.deepEqual(letters("শরৎ"), ["শ", "র", "ৎ"]);
  assert.deepEqual(letters("Rafi 2"), ["R", "A", "F", "I"]);
  assert.deepEqual(letters("নাদিয়া মীম"), ["না", "দি", "য়া", "মী", "ম"]);
  assert.deepEqual(letters("রয়".normalize("NFD")), letters("রয়".normalize("NFC")));
});

test("the remaining count walks F-L-A-M-E-S the copybook way (1 S, 2 E, 3 F, 4 E, 5 F, 6 M)", () => {
  // n letters left: "a" against n letters with nothing in common.
  assert.deepEqual([2, 3, 4, 5, 6].map(n => result("ক", "খ".repeat(n - 1))), ["E", "F", "E", "F", "M"]);
  const one = play({ a: "AB", b: "A" });
  assert.equal(one.left, 1);
  assert.equal(outcomes[one.result].letter, "S");
});

test("each shared letter is struck once per pair, and the struck order is complete", () => {
  const game = play({ a: "RAFI", b: "MIM" });
  assert.deepEqual(game.pairs, [[3, 1]]);
  assert.equal(game.left, 5);
  assert.equal(game.struck.length, 5);
  assert.equal(new Set([...game.struck, game.result]).size, 6);
  assert.equal(outcome(game).letter, "F");
  const once = play({ a: "আনা", b: "নানা" });
  assert.deepEqual(once.pairs, [[1, 0]]);
  assert.equal(once.left, 2);
  assert.equal(play({ a: "নানা", b: "নানা" }).pairs.length, 2);
  assert.equal(result("rafi", "RAFI"), "F");
  assert.deepEqual(play({ a: "রাফি", b: "রাফি" }).struck, []);
});

test("the sample is a kind result and human lines exist for every outcome", () => {
  const game = play(samplePair);
  assert.deepEqual(game.pairs, [[0, 0]]);
  assert.equal(game.left, 3);
  assert.equal(outcome(game).label, "বন্ধু");
  assert.equal(humanLine(game), outcome(game).lines[1]);
  assert.equal(outcome(play({ a: "রাফি", b: "মিম" })).label, "ঝগড়ুটে বন্ধু");
  for (const item of outcomes) assert.equal(item.lines.length, 2);
  assert.doesNotMatch(outcomes.map(item => item.label + item.lines.join("")).join(" "), /শত্রু|দুশমন/);
});

test("mixed Bangla and English names are flagged, same-script names are not", () => {
  assert.equal(mixedScripts({ a: "রাফি", b: "Mim" }), true);
  assert.equal(mixedScripts({ a: "Rafi", b: "মিম" }), true);
  assert.equal(mixedScripts(samplePair), false);
  assert.equal(mixedScripts({ a: "Rafi", b: "Mim" }), false);
});

test("a game survives the share-link round trip", () => {
  assert.equal(shareHash({ a: "রাফি", b: "মিম" }), "#a=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF&b=%E0%A6%AE%E0%A6%BF%E0%A6%AE");
  assert.deepEqual(parseShareHash(shareHash(samplePair)), samplePair);
  assert.deepEqual(parseShareHash("#a=রাফি&b=মিম"), { a: "রাফি", b: "মিম" });
  assert.deepEqual(parseShareHash("#a=Rafi&b=Mim"), { a: "Rafi", b: "Mim" });
});

test("hostile, empty or anchor hashes are ignored instead of crashing", () => {
  for (const hash of ["", "#result", "#khata", "#a=", "#a=রাফি", "#b=মিম", "#a=১২৩&b=মিম", "#a=  &b=x", "#a=%E0%A4&b=x", "#a=khanki&b=Mim"]) assert.equal(parseShareHash(hash), null, hash);
  assert.equal(parseShareHash(`#a=${"x".repeat(500)}&b=y`)?.a.length, MAX_NAME);
});

test("names keep Bangla, Latin, digits and spaces, are NFC and capped", () => {
  assert.equal(cleanName("  রিমা‮  আক্তার\n"), "রিমা আক্তার");
  assert.equal(cleanName("<b>Joy</b>"), "bJoyb");
  assert.equal([...cleanName("ক".repeat(MAX_NAME + 8))].length, MAX_NAME);
  assert.equal(cleanName("রয়".normalize("NFD")), "রয়".normalize("NFC"));
});

test("abusive names never reach the card, ordinary names do", () => {
  for (const bad of ["Khanki", "f u c k", "খানকি", "রাফি বাল", "Haramjada"]) assert.equal(cleanName(bad), "", bad);
  for (const fine of ["Iqbal", "ইকবাল", "Bala", "রাফি", "নাদিয়া"]) assert.equal(isBlocked(fine), false, fine);
});

test("share previews name only the first person and say it's just for fun", () => {
  assert.equal(share.normalize("b=রাইসা&a=রাফি"), shareHash(samplePair).slice(1));
  assert.equal(share.normalize("hello"), null);
  assert.equal(share.preview(shareHash(samplePair).slice(1)).title, "রাফি ফ্লেমস খেলেছে — তুমিও খেলো");
  assert.doesNotMatch(share.preview(shareHash(samplePair).slice(1)).title, /রাইসা/);
  assert.equal(previewTitle(null), "দুই নাম, এক খেলা — ফ্লেমসে কী আসে?");
  assert.equal(share.tally, undefined);
  assert.match(caption(samplePair), /রাফি \+ রাইসা = বন্ধু!/);
  assert.match(caption(samplePair), /শুধু মজা/);
});

test("SEO copy fits its limits", () => {
  assert.ok([...site.title].length <= 45, site.title);
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.faq.length >= 5);
});
