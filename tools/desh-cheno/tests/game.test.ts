import assert from "node:assert/strict";
import test from "node:test";
import { badge, cleanName, compareLine, defaultSet, humanLine, parseResult, previewTitle, resultHash, rightShare, scoreOf, tallyIds, tallyItems, MAX_NAME_LENGTH, ROUNDS, type Pick } from "../lib/game";
import { doodles } from "../lib/doodles";
import { quizSets } from "../lib/questions";
import { share } from "../share";

const allRight = (set: (typeof quizSets)[number]) => set.questions.map(question => question.right) as Pick[];

test("every set has 10 questions with 3 distinct options, unique ids, NFC text, and a source", () => {
  const ids = quizSets.flatMap(set => set.questions.map(question => question.id));
  assert.equal(new Set(ids).size, ids.length);
  for (const set of quizSets) {
    assert.equal(set.questions.length, ROUNDS);
    for (const question of set.questions) {
      assert.equal(new Set(question.options).size, 3, question.id);
      for (const text of [question.ask, question.fact, question.topic, ...question.options]) assert.equal(text, text.normalize("NFC"), question.id);
      assert.ok(question.source.length > 2 && question.fact.length > 5, question.id);
      assert.ok(question.art in doodles, question.id);
      // The topic shows on the card and in the human line, so it must not give the answer away.
      assert.ok(!question.topic.includes(question.options[question.right]), question.id);
    }
    // Right answers are spread over all three chips.
    const rights = new Set(set.questions.map(question => question.right));
    assert.equal(rights.size, 3, set.id);
  }
});

test("no people, parties or disputed claims slip into the questions", () => {
  const text = quizSets.flatMap(set => set.questions.flatMap(question => [question.ask, question.fact, ...question.options])).join(" ");
  for (const banned of ["বঙ্গবন্ধু", "শেখ", "জিয়া", "রহমান", "আওয়ামী", "বিএনপি", "জামায়াত", "শহীদের সংখ্যা", "লক্ষ", "জুলাই", "সর্বোচ্চ শৃঙ্গ", "কেওক্রাডং", "তাজিংডং", "দীর্ঘতম", "বৃহত্তম", "সবচেয়ে বড়", "সবচেয়ে লম্বা"]) {
    assert.ok(!text.includes(banned), banned);
  }
});

test("the Victory Day set is about 55 years from 1971", () => {
  const victory = quizSets.find(set => set.id === "v55")!;
  assert.ok(victory.victory);
  assert.equal(2026 - 1971, 55);
  const q = victory.questions.find(question => question.id === "bijoy-55")!;
  assert.equal(q.options[q.right], "৫৫");
});

test("a result survives the link round trip and is rescored, not trusted", () => {
  const picks: Pick[] = [1, 0, 2, 1, 0, 1, 2, 1, 0, 0];
  const result = parseResult(resultHash({ set: "protik", picks, name: "রাফি" }));
  assert.deepEqual(result, { set: "protik", picks, name: "রাফি" });
  assert.equal(scoreOf("protik", picks), 9);
  for (const set of quizSets) assert.equal(scoreOf(set.id, allRight(set)), 10);
});

test("hostile or broken links are rejected instead of crashing", () => {
  assert.equal(parseResult(""), null);
  assert.equal(parseResult("#set=evil&a=1111111111"), null);
  assert.equal(parseResult("#set=protik&a=111"), null);
  assert.equal(parseResult("#set=protik&a=11111111112"), null);
  assert.equal(parseResult("#set=protik&a=3111111111"), null);
  assert.equal(parseResult("#set=protik&a=%%%"), null);
  assert.equal(parseResult("#set=__proto__&a=1111111111"), null);
  assert.equal(parseResult("#set=toString&a=1111111111"), null);
});

test("names are NFC, lose control and direction characters, and are capped", () => {
  assert.equal(cleanName("  রিমা‮  আক্তার\n"), "রিমা আক্তার");
  assert.equal(cleanName("ক".repeat(MAX_NAME_LENGTH + 10)).length, MAX_NAME_LENGTH);
  assert.equal(cleanName("কো"), "কো");
  assert.equal(parseResult(`set=protik&a=1021012100&n=${encodeURIComponent("‮রাফি")}`)?.name, "রাফি");
});

test("lines follow the score and name the one question that was missed", () => {
  const protik = quizSets[0];
  const right = allRight(protik);
  assert.equal(humanLine({ set: "protik", picks: right, name: "" }), "দশটা তারাই তোমার। চার্ট পেপারে আর জায়গা নেই।");
  const missGach = [...right]; missGach[5] = 0;
  assert.equal(humanLine({ set: "protik", picks: missGach, name: "" }), "দেশটা প্রায় মুখস্থ, শুধু জাতীয় গাছের প্রশ্নটা ফসকেছে।");
  const two = [...missGach]; two[0] = 0;
  assert.equal(humanLine({ set: "protik", picks: two, name: "" }), "চার্টের বেশিরভাগ তারা তোমার, বাকিগুলো এবার মনে থাকবে।");
  const none = right.map(pick => ((pick + 1) % 3) as Pick);
  assert.equal(humanLine({ set: "protik", picks: none, name: "" }), "ফাঁকা তারাই বেশি। নিচে প্রতিটার উত্তর আর সূত্র আছে।");
  const victory = quizSets[3];
  assert.equal(humanLine({ set: "v55", picks: allRight(victory), name: "" }), "বিজয়ের ৫৫ বছরে দেশটা তোমার পুরো চেনা।");
  assert.equal(badge(10), "ফার্স্ট বেঞ্চ");
  assert.equal(badge(9), "ক্লাস ক্যাপ্টেন");
  assert.equal(badge(1), "নতুন ভর্তি");
});

test("previews and compare lines are personal and spoiler-free", () => {
  const picks = allRight(quizSets[0]).map((pick, index) => (index < 2 ? (pick + 1) % 3 : pick)) as Pick[];
  const result = { set: "protik" as const, picks, name: "রাফি" };
  assert.equal(previewTitle(result), "রাফি দেশ চেনো কুইজে ১০-এ ৮। তুমি কয়টা পারবে?");
  assert.equal(compareLine(9, result), "রাফির চেয়ে ১টা বেশি!");
  assert.equal(compareLine(8, result), "রাফির সাথে সমান সমান, দুজনেই ৮।");
  assert.ok(previewTitle({ ...result, set: "v55", name: "" }).startsWith("বিজয়ের ৫৫ বছর: এক বন্ধু"));
});

test("share.ts normalizes link state and rejects junk", () => {
  assert.equal(share.normalize("a=0120120120&set=v55&n=%20রাফি%20&x=1"), "set=v55&a=0120120120&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  assert.equal(share.normalize("set=protik"), null);
  assert.equal(share.normalize("set=protik&a=0120120120&n=" + "ক".repeat(500)), "set=protik&a=0120120120&n=" + encodeURIComponent("ক".repeat(MAX_NAME_LENGTH)));
  assert.match(share.preview("set=protik&a=0120120120").title, /১০-এ/);
});

test("tally only uses fixed question ids and counts right picks", () => {
  const picks = allRight(quizSets[1]);
  picks[0] = ((picks[0] + 1) % 3) as Pick;
  const items = tallyItems({ set: "nodi", picks, name: "রাফি" });
  assert.equal(items.filter(item => item.startsWith("s-")).length, 10);
  assert.equal(items.filter(item => item.startsWith("r-")).length, 9);
  assert.ok(items.every(item => tallyIds.includes(item)));
  assert.equal(rightShare({ "s-sagor": 5, "r-sagor": 5 }, "sagor"), null);
  assert.equal(rightShare({ "s-sagor": 40, "r-sagor": 29 }, "sagor"), 73);
});

test("the Victory Day set leads in December only", () => {
  assert.equal(defaultSet(new Date(2026, 11, 1)), "v55");
  assert.equal(defaultSet(new Date(2026, 9, 10)), "protik");
});
