import assert from "node:assert/strict";
import test from "node:test";
import { check, cleanName, fold, gradeOf, parseShareHash, passages, previewTitle, score, shareHash, tallyIds, MAX_NAME, MAX_WPM } from "../lib/typing";
import { share } from "../share";

test("keyboards' different spellings of the same letters are never a mistake", () => {
  assert.equal(fold("য়"), fold("য়")); // য় precomposed vs য + nukta
  assert.equal(fold("ড়"), fold("ড়")); // ড়
  assert.equal(fold("কো"), fold("কো")); // কো typed as ে + া
  assert.equal(fold("হঠাত্‍"), fold("হঠাৎ")); // old-style ৎ
  assert.equal(fold("র‍্যাব"), fold("র্যাব")); // Avro's joiner in র‍্য
  assert.equal(fold("পায়।"), fold("পায়")); // দাঁড়ি is optional
  const precomposed = check("যায় না", "যায় না ");
  assert.equal(precomposed.correctWords, 2);
  assert.equal(precomposed.correct, precomposed.judged);
});

test("right words count, a wrong letter marks its word and costs accuracy", () => {
  const result = check("আমার সোনার বাংলা", "আমার সোনর ");
  assert.deepEqual(result.marks, ["ok", "bad", "now"]);
  assert.equal(result.correctWords, 1);
  assert.ok(result.correct < result.judged);
  assert.equal(result.finished, false);
});

test("a half-typed word is judged kindly, including a half-built conjunct", () => {
  assert.deepEqual(check("ক্ষমা চাই", "ক্").marks, ["now", "todo"]);
  assert.equal(check("ক্ষমা চাই", "ক্").correct, 1);
  assert.deepEqual(check("ক্ষমা চাই", "খ").marks, ["slip", "todo"]);
});

test("typing the last word exactly ends the test, with or without a space", () => {
  assert.equal(check("মা চা", "মা চা").finished, true);
  assert.equal(check("মা চা", "মা চ").finished, false);
  assert.equal(check("মা চা", "মা চি ").finished, true);
});

test("speed counts only right words per minute; accuracy reaches 100 only with no slip", () => {
  const result = check("এক দুই তিন চার", "এক দুই তিন চার");
  assert.deepEqual(score(result, 60), { wpm: 4, accuracy: 100 });
  assert.equal(score(result, 30).wpm, 8);
  const slip = check("ক " + "খ ".repeat(300), "ক " + "খ ".repeat(299) + "গ ");
  assert.equal(score(slip, 60).accuracy, 99);
  assert.equal(score(check("", ""), 60).accuracy, 0);
  assert.ok(score(check(passages[0], passages[0]), 1).wpm <= MAX_WPM);
});

test("every passage is non-empty and survives NFC unchanged in meaning", () => {
  for (const passage of passages) {
    assert.ok(passage.split(" ").length >= 35, passage.slice(0, 20));
    assert.equal(check(passage, passage.normalize("NFD")).correct, check(passage, passage).correct);
    assert.equal(check(passage, passage).finished, true);
  }
});

test("a result survives the link round trip", () => {
  const shared = { p: 4, w: 28, a: 96, n: "রাফি" };
  assert.deepEqual(parseShareHash(shareHash(shared)), shared);
  assert.equal(share.normalize(shareHash(shared).slice(1)), shareHash(shared).slice(1));
});

test("hostile or broken links are refused or capped", () => {
  assert.equal(parseShareHash(""), null);
  assert.equal(parseShareHash("#result"), null);
  assert.equal(parseShareHash("#p=99&w=20&a=90"), null);
  assert.equal(parseShareHash("#p=1&w=999&a=90"), null);
  assert.equal(parseShareHash("#p=1&w=20&a=101"), null);
  assert.equal(parseShareHash("#p=-1&w=20&a=90"), null);
  assert.equal(parseShareHash("#p=1&w=2e1&a=90"), null);
  assert.equal(parseShareHash("#p=1&w=20&a=90&n=" + "ক".repeat(400)), null);
  assert.equal(share.normalize("p=1&w=x"), null);
  assert.equal(shareHash({ p: 0, w: 5000, a: 300, n: "" }), "#p=0&w=200&a=100");
});

test("names are NFC-normalized, cleaned and capped", () => {
  assert.equal(cleanName("  রিমা‮  আক্তার\n"), "রিমা আক্তার");
  assert.equal(cleanName("ক".repeat(MAX_NAME + 10)).length, MAX_NAME);
  assert.equal(cleanName("প্রিয়য়"), cleanName("প্রিয়য়"));
});

test("link previews are personal, and only fixed speed buckets are counted", () => {
  assert.equal(previewTitle({ p: 0, w: 28, a: 96, n: "রাফি" }), "রাফি মিনিটে ২৮টা বাংলা শব্দ টাইপ করেছে, ৯৬% নির্ভুল। তুমি কত?");
  assert.match(share.preview("p=0&w=12&a=90").title, /^এক বন্ধু/);
  assert.deepEqual(share.tally, tallyIds);
  assert.equal(gradeOf(0).id, "shikkhanobish");
  assert.equal(gradeOf(28).id, "paka");
  assert.equal(gradeOf(200).id, "ostad");
});
