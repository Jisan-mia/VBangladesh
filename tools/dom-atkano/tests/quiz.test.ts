import assert from "node:assert/strict";
import test from "node:test";
import { share } from "../share";
import { cleanName, humanLine, parseShareHash, rank, scoreOf, sets, shareHash, tallyIds, MAX_NAME_LENGTH, PER_SET, type Answer } from "../lib/quiz";

const key = (id: (typeof sets)[number]["id"]) => sets.find(item => item.id === id)!.questions.map(question => question.answer) as Answer[];

test("every set has exactly 10 well-formed questions with unique ids and a source", () => {
  const ids = sets.flatMap(item => item.questions.map(question => question.id));
  assert.equal(new Set(ids).size, ids.length);
  for (const item of sets) {
    assert.equal(item.questions.length, PER_SET);
    for (const question of item.questions) {
      assert.equal(new Set(question.options).size, 3, question.id);
      assert.match(question.source, /^https:\/\/(www\.|stats\.)?espncricinfo\.com\//, question.id);
      assert.ok(item.questions.some(other => other.kind === "heart"));
    }
  }
});

test("a finished set survives the share-link round trip, Bangla name included", () => {
  const shared = { set: "s2" as const, answers: [0, 1, 2, 0, 1, 2, 0, 1, 2, 0] as Answer[], name: "রাফি" };
  assert.deepEqual(parseShareHash(shareHash(shared)), shared);
});

test("the score is recomputed from answers, never read from the link", () => {
  assert.equal(scoreOf("s1", key("s1")), 10);
  const hash = shareHash({ set: "s1", answers: key("s1"), name: "" }) + "&score=0";
  assert.equal(scoreOf("s1", parseShareHash(hash)!.answers), 10);
});

test("hostile, partial or unknown links are rejected", () => {
  for (const hash of ["", "#set=s9&a=0000000000", "#set=s1&a=000000000", "#set=s1&a=00000000003", "#set=s1&a=000000000x", "#set=__proto__&a=0000000000", "#a=0000000000"]) assert.equal(parseShareHash(hash), null, hash);
  assert.equal(share.normalize("set=s1&a=12"), null);
});

test("names are NFC, stripped of control and direction characters, and capped", () => {
  assert.equal(cleanName("  রিমা‮  আক্তার\n"), "রিমা আক্তার");
  assert.equal(cleanName("ক".repeat(MAX_NAME_LENGTH + 10)).length, MAX_NAME_LENGTH);
  assert.equal(cleanName("é"), "é");
});

test("human line follows which questions were right", () => {
  const right = key("s1");
  const wrong = right.map(answer => ((answer + 1) % 3) as Answer);
  const questions = sets[0].questions;
  assert.match(humanLine("s1", right), /১০-এ ১০/);
  assert.match(humanLine("s1", wrong), /ভাগ্যবান/);
  const heartsOnly = questions.map((question, index) => question.kind === "heart" || index < 3 ? right[index] : wrong[index]);
  assert.match(humanLine("s1", heartsOnly), /কষ্টের ম্যাচ/);
  const joysOnly = questions.map((question, index) => question.kind === "joy" ? right[index] : wrong[index]);
  assert.match(humanLine("s1", joysOnly), /জেতার দিনগুলো/);
  assert.equal(rank(8), "খাঁটি টাইগার");
});

test("share preview is personal and tally lists only fixed ids", () => {
  const state = share.normalize(shareHash({ set: "s1", answers: key("s1"), name: "রাফি" }).slice(1))!;
  assert.match(share.preview(state).title, /^রাফি ১০-এ ১০ পেয়েছে/);
  assert.match(share.preview("garbage").title, /এক বন্ধু/);
  assert.ok(tallyIds.includes("seen:s1") && tallyIds.every(id => /^(seen:s\d|q\d{4}[a-z]{2,3})$/.test(id)));
});
