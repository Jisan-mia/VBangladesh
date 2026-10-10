import assert from "node:assert/strict";
import test from "node:test";
import { caption, cleanName, coverTitle, daysIn, defaultYear, editorial, editorials, fridaysIn, parseShareHash, prompts, shareHash, stateOf, DEFAULT_PICKS, MAX_NAME, type Cover } from "../lib/barshiki";
import { share } from "../share";

const sample: Cover = { year: 2026, picks: [2, 0, 4, 1, 3], name: "রাফি" };

test("a cover survives the link round trip in the brief's format", () => {
  assert.equal(stateOf(sample), "y=2026&p=3%2C1%2C5%2C2%2C4&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  assert.deepEqual(parseShareHash(shareHash(sample)), sample);
  assert.deepEqual(parseShareHash("#y=2026&p=3,1,5,2,4&n=রাফি"), sample);
  const last = { year: 2099, picks: prompts.map(prompt => prompt.options.length - 1), name: "" };
  assert.deepEqual(parseShareHash(shareHash(last)), last);
});

test("hostile or broken links are refused instead of crashing", () => {
  for (const bad of ["", "#result", "#y=2026", "#y=1999&p=1,1,1,1,1", "#y=2100&p=1,1,1,1,1", "#y=20x6&p=1,1,1,1,1", "#y=2026&p=0,1,1,1,1", "#y=2026&p=1,1,1,1", "#y=2026&p=1,1,1,1,1,1", "#y=2026&p=99,1,1,1,1", "#y=2026&p=1.5,1,1,1,1", "#y=2026&p=-1,1,1,1,1", "#%%%"]) {
    assert.equal(parseShareHash(bad), null, bad);
  }
});

test("names are NFC, lose control and direction-override characters, and are capped", () => {
  assert.equal(cleanName("  রিমা‮  আক্তার\n"), "রিমা আক্তার");
  assert.equal(cleanName("রয়".normalize("NFD")), "রয়".normalize("NFC"));
  assert.equal(cleanName("ক".repeat(MAX_NAME + 10)).length, MAX_NAME);
  assert.equal(parseShareHash(`#y=2026&p=1,1,1,1,1&n=${encodeURIComponent("ক".repeat(200))}`)!.name.length, MAX_NAME);
});

test("option ids are unique within each prompt, so link positions stay meaningful", () => {
  for (const prompt of prompts) assert.equal(new Set(prompt.options.map(option => option.id)).size, prompt.options.length, prompt.id);
  assert.equal(DEFAULT_PICKS.length, prompts.length);
  DEFAULT_PICKS.forEach((pick, index) => assert.ok(pick < prompts[index].options.length));
});

test("every সেরা মুহূর্ত has its own editorial line", () => {
  assert.deepEqual(Object.keys(editorials).sort(), prompts[3].options.map(option => option.id).sort());
  assert.equal(editorial({ ...sample, picks: [0, 0, 0, 4, 0] }), "এ বছর টিকে থাকাটাই ছিল বড় জয়।");
});

test("the calendar facts on the cover are right", () => {
  assert.equal(daysIn(2026), 365);
  assert.equal(daysIn(2028), 366);
  assert.equal(daysIn(2100 - 1), 365);
  assert.equal(fridaysIn(2026), 52); // 1 Jan 2026 is a Thursday, so Thursday gets the 53rd day
  assert.equal(fridaysIn(2027), 53); // 1 Jan 2027 is a Friday
  assert.equal(defaultYear(new Date(2027, 0, 5)), 2026);
  assert.equal(defaultYear(new Date(2026, 11, 31)), 2026);
});

test("title, caption and link preview speak for the person", () => {
  assert.equal(coverTitle(sample), "রাফির বার্ষিকী ২০২৬");
  assert.equal(coverTitle({ ...sample, name: "" }), "আমার বার্ষিকী ২০২৬");
  assert.match(caption(sample), /^আমার ২০২৬, এক প্রচ্ছদে। বছরের শব্দ: শেখা।/);
  const state = share.normalize("y=2026&p=3,1,5,2,4&n=রাফি")!;
  assert.equal(share.preview(state).title, "রাফির বার্ষিকী ২০২৬ — বছরের শব্দ: শেখা");
  assert.equal(share.normalize("y=2026&p=1,1"), null);
  assert.ok(share.tally!.includes("dhoirjo"));
  assert.ok(share.tally!.every(id => !/[^\x00-\x7f]/.test(id)));
});
