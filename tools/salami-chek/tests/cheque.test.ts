import assert from "node:assert/strict";
import test from "node:test";
import { amountFigures, amountWords, chequeLine, cleanName, defaultCheque, givers, parseShareHash, previewTitle, readAmount, shareHash, topGiver, MAX_AMOUNT, MAX_NAME_LENGTH, type Cheque } from "../lib/cheque";
import { share } from "../share";

test("a cheque survives the link round trip", () => {
  const cheque: Cheque = { giver: "mama", amount: 1000, name: "রাফি", ok: true };
  const hash = shareHash(cheque);
  assert.equal(hash, "#g=mama&a=1000&n=" + encodeURIComponent("রাফি") + "&ok=1");
  assert.deepEqual(parseShareHash(hash), cheque);
  assert.deepEqual(parseShareHash("g=nanu&a=500"), { giver: "nanu", amount: 500, name: "", ok: false });
  assert.equal(shareHash(defaultCheque), "#g=mama&a=1000");
  for (const giver of givers) assert.equal(parseShareHash(shareHash({ ...defaultCheque, giver: giver.id }))?.giver, giver.id);
});

test("hostile, empty or out-of-range hashes are refused", () => {
  for (const hash of ["", "#result", "#g=boss&a=1000", "#g=mama", "#g=mama&a=0", "#g=mama&a=-5", "#g=mama&a=1e3", "#g=mama&a=12.5", "#g=mama&a=abc", `#g=mama&a=${MAX_AMOUNT + 1}`, "#g=<script>&a=1"]) {
    assert.equal(parseShareHash(hash), null, hash);
  }
  assert.equal(parseShareHash("#g=mama&a=1000&ok=yes")?.ok, false);
  assert.equal(parseShareHash(`#g=mama&a=${MAX_AMOUNT}`)?.amount, MAX_AMOUNT);
  assert.equal(share.normalize("g=mama&a=99999999"), null);
  assert.equal(share.normalize("#g=mama&a=1000&x=1&n=%20রাফি%20"), "g=mama&a=1000&n=" + encodeURIComponent("রাফি"));
});

test("names are NFC, lose control and direction-override characters, and are capped", () => {
  assert.equal(cleanName("  রিমা‮  আক্তার\n"), "রিমা আক্তার");
  assert.equal(cleanName("ক".repeat(MAX_NAME_LENGTH + 10)).length, MAX_NAME_LENGTH);
  const decomposed = "ময়না".normalize("NFD");
  assert.equal(cleanName(decomposed), "ময়না".normalize("NFC"));
  assert.equal(parseShareHash("#g=mama&a=1&n=" + encodeURIComponent(decomposed))?.name, "ময়না".normalize("NFC"));
});

test("typed amounts accept Bangla digits and commas, within 1 to 1 lakh", () => {
  assert.equal(readAmount("১,০০০"), 1000);
  assert.equal(readAmount("2500"), 2500);
  assert.equal(readAmount("১০০০০০"), 100000);
  assert.equal(readAmount("১০০০০১"), null);
  assert.equal(readAmount(""), null);
  assert.equal(readAmount("০"), null);
});

test("the amount reads in words and figures from the taka-kothay library", () => {
  assert.equal(amountWords(1000), "এক হাজার টাকা মাত্র");
  assert.equal(amountWords(2000), "দুই হাজার টাকা মাত্র");
  assert.equal(amountWords(1550), "এক হাজার পাঁচশো পঞ্চাশ টাকা মাত্র");
  assert.equal(amountWords(100000), "এক লাখ টাকা মাত্র");
  assert.equal(amountFigures(100000), "১,০০,০০০");
});

test("the human line follows the brief", () => {
  assert.equal(chequeLine({ ...defaultCheque, giver: "nanu" }), "নানুর সালামি সবসময় সবচেয়ে মিষ্টি।");
  assert.equal(chequeLine({ ...defaultCheque, giver: "bhaiya" }), "ভাইয়া, এবার না বলো না!");
  assert.equal(chequeLine({ ...defaultCheque, amount: 5000 }), "স্বপ্ন দেখতে টাকা লাগে না।");
  assert.match(chequeLine({ ...defaultCheque, ok: true }), /সই হয়ে গেছে/);
  for (const giver of givers) assert.ok(chequeLine({ ...defaultCheque, giver: giver.id }));
});

test("the link preview is personal and the tally counts givers only", () => {
  assert.equal(previewTitle({ ...defaultCheque, name: "রাফি" }), "রাফি মামার কাছে সালামি চেয়েছে — সই করে দাও!");
  assert.equal(previewTitle({ ...defaultCheque, giver: "bhaiya", name: "" }), "বড় ভাইয়ার কাছে একটা সালামির চেক এসেছে — সই করে দাও!");
  assert.equal(previewTitle({ ...defaultCheque, name: "জাহিদ", ok: true }), "মামা জাহিদের সালামির চেকে সই করে দিয়েছে!");
  assert.equal(share.preview("g=mama&a=1000&n=রাফি").title, "রাফি মামার কাছে সালামি চেয়েছে — সই করে দাও!");
  assert.deepEqual(share.tally, givers.map(giver => giver.id));
});

test("the most-signed giver needs a minimum sample", () => {
  assert.equal(topGiver({ mama: 3 }, 3, 30), null);
  assert.equal(topGiver({ mama: 12, nanu: 20 }, 32, 30), "nanu");
  assert.equal(topGiver({}, 40, 30), null);
});
