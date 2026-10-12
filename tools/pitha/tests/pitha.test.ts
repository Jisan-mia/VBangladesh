import assert from "node:assert/strict";
import test from "node:test";
import { readLevels, recordLevel, totalStars } from "../../../shared/game-core";
import { nearMissLine, setStars } from "../lib/pitha";
import { sets as levelSets } from "../lib/pitha";
import { share } from "../share";
import { pithaArt, pithaSvg, stallSvg } from "../lib/art";
import { allPithas, cleanName, humanLine, moreNames, parseShareHash, rank, scoreOf, sets, shareHash, tallyIds, MAX_NAME_LENGTH, PER_SET, type Answer } from "../lib/pitha";

const key = (id: (typeof sets)[number]["id"]) => sets.find(item => item.id === id)!.questions.map(question => question.answer) as Answer[];
const all = allPithas;

test("every set has 10 well-formed pithas: unique ids, the answer among 3 distinct options, a source, a drawing", () => {
  assert.equal(new Set(all.map(question => question.id)).size, all.length);
  for (const item of sets) {
    assert.equal(item.questions.length, PER_SET);
    assert.ok(item.questions.some(question => question.kind === "everyday") && item.questions.some(question => question.kind === "festive"), item.id);
    for (const question of item.questions) {
      assert.equal(new Set(question.options).size, 3, question.id);
      assert.equal(question.options[question.answer], question.name, question.id);
      assert.ok(!question.clue.includes(question.name), `${question.id}: the clue gives the name away`);
      assert.match(question.source, /^https:\/\//, question.id);
      assert.ok(pithaArt[question.id].length > 100, question.id);
    }
  }
  // Answers aren't all in one position.
  for (const item of sets) assert.ok(new Set(key(item.id)).size === 3, item.id);
});

test("the static list has 30 distinct names and the drawings are valid, deterministic SVG", () => {
  const names = [...all.map(question => question.name), ...moreNames.map(item => item.name)];
  assert.equal(names.length, 30);
  assert.equal(new Set(names).size, 30);
  assert.equal(pithaSvg("chitoi"), pithaSvg("chitoi"));
  assert.match(stallSvg("bhapa"), /^<svg [^>]*viewBox="0 44 320 146".*<\/svg>$/s);
  assert.doesNotMatch(Object.values(pithaArt).join(""), /NaN|undefined/);
});

test("a finished set survives the share-link round trip, Bangla name included", () => {
  const shared = { set: "w2" as const, answers: [0, 1, 2, 0, 1, 2, 0, 1, 2, 0] as Answer[], name: "রাফি" };
  assert.deepEqual(parseShareHash(shareHash(shared)), shared);
  assert.deepEqual(parseShareHash("#set=w1&a=0210211021&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF")?.name, "রাফি");
});

test("the score is recomputed from answers, never read from the link", () => {
  assert.equal(scoreOf("w1", key("w1")), 10);
  const hash = shareHash({ set: "w1", answers: key("w1"), name: "" }) + "&score=0";
  assert.equal(scoreOf("w1", parseShareHash(hash)!.answers), 10);
});

test("hostile, partial or unknown links are rejected", () => {
  for (const hash of ["", "#set=w9&a=0000000000", "#set=w1&a=000000000", "#set=w1&a=00000000003", "#set=w1&a=000000000x", "#set=__proto__&a=0000000000", "#a=0000000000", "#set=w1&a=０000000000"]) assert.equal(parseShareHash(hash), null, hash);
  assert.equal(share.normalize("set=w1&a=12"), null);
});

test("names are NFC, stripped of control and direction characters, and capped", () => {
  assert.equal(cleanName("  রিমা‮  আক্তার\n"), "রিমা আক্তার");
  assert.equal(cleanName("ক".repeat(MAX_NAME_LENGTH + 10)).length, MAX_NAME_LENGTH);
  assert.equal(cleanName("é"), "é");
  assert.equal(parseShareHash(shareHash({ set: "w1", answers: key("w1"), name: "<b>x</b>\u0000" }))?.name, "<b>x</b>");
});

test("human line follows which kinds of pitha were right", () => {
  const right = key("w1");
  const wrong = right.map(answer => ((answer + 1) % 3) as Answer);
  const questions = sets[0].questions;
  assert.match(humanLine("w1", right), /১০-এ ১০/);
  assert.match(humanLine("w1", wrong), /চেখে চেখেই/);
  const everydayOnly = questions.map((question, index) => question.kind === "everyday" ? right[index] : wrong[index]);
  assert.equal(humanLine("w1", everydayOnly), "রোজের পিঠা চেনো, উৎসবেরটা এবার শিখে নাও।");
  const festiveOnly = questions.map((question, index) => question.kind === "festive" || index < 2 ? right[index] : wrong[index]);
  assert.match(humanLine("w1", festiveOnly), /উৎসবের পিঠা চেনো/);
  assert.equal(rank(8), "পিঠার ওস্তাদ");
  assert.equal(rank(2), "পিঠার নতুন ভক্ত");
});

test("share preview is personal and tally lists only fixed ids", () => {
  const state = share.normalize(shareHash({ set: "w1", answers: key("w1"), name: "রাফি" }).slice(1))!;
  assert.equal(share.preview(state).title, "রাফি ১০টা পিঠার ১০টা চিনেছে। তুমি কয়টা চিনবে?");
  assert.match(share.preview(state).description, /^রাফির সাথে/);
  assert.match(share.preview("garbage").title, /^এক বন্ধু/);
  assert.equal(tallyIds.length, 22);
  assert.ok(tallyIds.every(id => /^(seen:w\d|[a-z-]+)$/.test(id)));
});

test("stars per set: 3 for a perfect 10, 2 for 7 or more, 1 for finishing, with an exact near-miss line", () => {
  assert.deepEqual([10, 9, 7, 6, 0].map(setStars), [3, 2, 2, 1, 1]);
  assert.equal(nearMissLine(10), "");
  assert.equal(nearMissLine(9), "আর ১টা ঠিক হলে ৩ তারা।");
  assert.equal(nearMissLine(7), "আর ৩টা ঠিক হলে ৩ তারা।");
  assert.equal(nearMissLine(6), "আর ১টা ঠিক হলে ২ তারা।");
  assert.equal(nearMissLine(3), "আর ৪টা ঠিক হলে ২ তারা।");
});

test("progress per set goes through readLevels and recordLevel", () => {
  const count = levelSets.length;
  let stars = readLevels(`{"1":3,"2":1,"${count + 1}":3,"x":2,"0":2}`, count);
  assert.deepEqual(stars, { 1: 3, 2: 1 });
  stars = recordLevel(stars, 2, setStars(9));
  assert.equal(stars[2], 2);
  stars = recordLevel(stars, 2, setStars(2));
  assert.equal(stars[2], 2, "a worse run never lowers the stars");
  assert.equal(totalStars(stars), 5);
  assert.deepEqual(readLevels("not json", count), {});
  assert.deepEqual(readLevels(null, count), {});
});
