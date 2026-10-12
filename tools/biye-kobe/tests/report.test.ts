import assert from "node:assert/strict";
import test from "node:test";
import { share } from "../share";
import { caption, cleanName, createReport, parseShareHash, previewTitle, questions, shareHash, timingIds, timings, MAX_NAME_LENGTH, QUESTION_COUNT, type Answer } from "../lib/report";

const every = (): Answer[][] => Array.from({ length: 3 ** QUESTION_COUNT }, (_, code) => Array.from({ length: QUESTION_COUNT }, (_, index) => Math.floor(code / 3 ** (QUESTION_COUNT - 1 - index)) % 3 as Answer));

test("six questions, three chips each, twelve fixed timings", () => {
  assert.equal(questions.length, 6);
  for (const question of questions) assert.equal(question.chips.length, 3);
  assert.equal(new Set(timingIds).size, 12);
});

test("every answer set gives a full report, and every timing can come up", () => {
  const seen = new Set<string>();
  for (const answers of every()) {
    const report = createReport(answers, "");
    assert.ok(report.complete && report.timing && report.reason && report.line, answers.join(""));
    seen.add(report.timing.id);
  }
  assert.deepEqual([...seen].sort(), [...timingIds].sort());
});

test("career first and happily single always get their own ending", () => {
  assert.equal(createReport([2, 0, 0, 1, 0, 0], "").timing?.id, "career");
  assert.equal(createReport([0, 2, 1, 2, 1, 0], "").timing?.id, "nijer");
  assert.match(createReport([0, 2, 1, 2, 1, 0], "").line, /নিজের সাথে বেশ আছো/);
});

test("an unfinished file has no prediction yet", () => {
  const report = createReport([1, 2, null, null, null, null], "রাফি");
  assert.equal(report.complete, false);
  assert.equal(report.answered, 2);
  assert.equal(report.timing, null);
  assert.equal(caption(report), "");
});

test("a shared report survives the link round trip", () => {
  const shared = { answers: [1, 2, 0, 1, 0, 2] as Answer[], name: "রাফি" };
  assert.equal(shareHash(shared), "#a=120102&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  assert.deepEqual(parseShareHash(shareHash(shared)), shared);
  assert.deepEqual(parseShareHash("#a=000000"), { answers: [0, 0, 0, 0, 0, 0], name: "" });
});

test("hostile or broken hashes are rejected instead of crashing", () => {
  for (const hash of ["", "#result", "#a=12010", "#a=1201022", "#a=12010x", "#a=120103", "#a=" + "1".repeat(500), "#a=%%%", "#a=-12010"]) assert.equal(parseShareHash(hash), null, hash);
  assert.equal(parseShareHash("#a=120102&n=" + "ক".repeat(200))?.name.length, MAX_NAME_LENGTH);
});

test("names are NFC, stripped of control and direction characters, and capped", () => {
  assert.equal(cleanName("  রিমা‮  আক্তার\n"), "রিমা আক্তার");
  assert.equal(cleanName("রো"), "রো");
  assert.equal(cleanName("ক".repeat(MAX_NAME_LENGTH + 10)).length, MAX_NAME_LENGTH);
});

test("the server normalizes links and writes a personal preview", () => {
  assert.equal(share.normalize("a=120102&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF&junk=1"), "a=120102&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  assert.equal(share.normalize("a=12"), null);
  assert.equal(share.preview("a=001100&n=রাফি").title, "ঘটক বলছে, রাফির বিয়ে প্রমোশনের মিষ্টির পরে! তোমার রিপোর্টে কী লেখা?");
  assert.equal(previewTitle({ answers: [0, 0, 0, 2, 0, 0], name: "" }), "ঘটক বলছে, এক বন্ধুর বিয়ে নিজে যখন চাইবে! তোমার রিপোর্টে কী লেখা?");
  assert.deepEqual(share.tally, timings.map(timing => timing.id));
});

test("no joke touches age, looks, money, dowry, caste or astrology", () => {
  const text = JSON.stringify([questions, timings, every().map(answers => createReport(answers, "").reason)]);
  for (const word of ["বয়স", "যৌতুক", "রাশি", "জ্যোতিষ", "গায়ের রং", "ওজন", "বেতন", "জাত", "পাত্র"]) assert.equal(text.includes(word), false, word);
});
