import assert from "node:assert/strict";
import test from "node:test";
import { backdrops, caption, cleanName, createCard, dateText, humanLine, isDate, parseShareHash, previewTitle, shareHash, stampText, tallyIds, todayLocal, MAX_NAME, type Print } from "../lib/studio";
import { share } from "../share";

const print: Print = { backdrop: "garden", date: "2027-04-14", name: "রাফি" };

test("a print survives the share-link round trip, with a Bangla name", () => {
  assert.deepEqual(parseShareHash(shareHash(print)), print);
  assert.deepEqual(parseShareHash(shareHash({ ...print, name: "", date: "" })), { ...print, name: "", date: "" });
  for (const item of backdrops) assert.equal(parseShareHash(shareHash({ ...print, backdrop: item.id }))?.backdrop, item.id);
});

test("the link never has room for a photo: only backdrop, date and name", () => {
  const params = new URLSearchParams(shareHash(print).slice(1));
  assert.deepEqual([...params.keys()], ["b", "d", "n"]);
});

test("hostile or unrelated hashes are ignored instead of crashing", () => {
  assert.equal(parseShareHash(""), null);
  assert.equal(parseShareHash("#send"), null);
  assert.equal(parseShareHash("#b=taj-mahal"), null);
  assert.equal(parseShareHash("#b=%%%"), null);
  assert.equal(parseShareHash("#b=__proto__"), null);
  assert.deepEqual(parseShareHash("#b=sea&d=2027-02-30&n="), { backdrop: "sea", date: "", name: "" });
  assert.equal(parseShareHash("#b=sea&d=<script>")?.date, "");
});

test("dates must be real calendar days in a sane range", () => {
  assert.ok(isDate("2028-02-29"));
  assert.ok(!isDate("2027-02-29"));
  assert.ok(!isDate("2027-13-01"));
  assert.ok(!isDate("1890-01-01"));
  assert.ok(!isDate("2027-4-14"));
  assert.match(todayLocal(new Date(2027, 3, 14)), /^2027-04-14$/);
});

test("the corner stamp reads like a 90s camera date", () => {
  assert.equal(stampText("2027-04-14"), "'27 4 14");
  assert.equal(stampText("1998-12-03"), "'98 12 3");
  assert.equal(stampText(""), "");
  assert.equal(dateText("2027-04-14"), "১৪ এপ্রিল ২০২৭");
});

test("names are NFC, lose control and direction-override characters, and are capped", () => {
  // ে + া typed separately is the same letter as ো
  assert.equal(cleanName("মোনা"), "মোনা");
  assert.equal(parseShareHash(`#b=lake&n=${encodeURIComponent("মোনা")}`)?.name, "মোনা");
  assert.equal(cleanName("  রিমা‮  আক্তার\n"), "রিমা আক্তার");
  assert.equal(Array.from(cleanName("ক".repeat(MAX_NAME + 10))).length, MAX_NAME);
});

test("each backdrop has its own pen line, and a friend's same backdrop changes it", () => {
  assert.equal(new Set(backdrops.map(item => item.line)).size, backdrops.length);
  assert.equal(humanLine(print), "ফুলগুলো প্লাস্টিকের, হাসিটা আসল।");
  assert.equal(humanLine(print, { backdrop: "garden", date: "", name: "মিম" }), "মিম আর আমি, একই ব্যাকড্রপে দুজন।");
  assert.equal(humanLine(print, { backdrop: "sea", date: "", name: "মিম" }), "ফুলগুলো প্লাস্টিকের, হাসিটা আসল।");
  assert.equal(createCard(print).stamp, "'27 4 14");
});

test("previews and captions are personal and Bangla-possessive", () => {
  assert.equal(previewTitle(print), "রাফির স্টুডিওর ছবি, ফুলবাগানের সামনে। তুমিও তুলবে?");
  assert.equal(previewTitle({ ...print, backdrop: "villa", name: "" }), "স্টুডিওর ছবি, বাগানবাড়ির সামনে। তুমিও তুলবে?");
  assert.ok(caption(print).includes("ফুলবাগানের সামনে"));
});

test("share: normalize rejects junk, previews personally, tallies only fixed backdrop ids", () => {
  assert.equal(share.normalize("b=evil"), null);
  assert.equal(share.normalize("n=রাফি"), null);
  assert.equal(share.normalize("b=lake&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF&x=1"), "b=lake&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  assert.equal(share.preview("b=plane&n=রাফি").title, "রাফির স্টুডিওর ছবি, উড়োজাহাজের সামনে। তুমিও তুলবে?");
  assert.deepEqual(share.tally, backdrops.map(item => item.id));
  assert.equal(new Set(tallyIds).size, tallyIds.length);
});
