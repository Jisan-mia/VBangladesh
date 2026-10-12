import assert from "node:assert/strict";
import test from "node:test";
import { badge, cleanName, compareLine, defaultSet, friendLine, humanLine, isLoan, parseResult, previewTitle, resultHash, rightShare, scoreOf, tallyIds, tallyItems, MAX_NAME_LENGTH, ROUNDS, type Pick } from "../lib/game";
import { wordSets } from "../lib/words";
import { share } from "../share";

const allRight = (set: (typeof wordSets)[number]) => set.words.map(word => word.right) as Pick[];

test("every set has 10 words, ids are unique, and the two spellings really differ", () => {
  const ids = wordSets.flatMap(set => set.words.map(word => word.id));
  assert.equal(new Set(ids).size, ids.length);
  for (const set of wordSets) {
    assert.equal(set.words.length, ROUNDS);
    for (const word of set.words) {
      assert.notEqual(word.options[0], word.options[1]);
      assert.equal(word.options[0], word.options[0].normalize("NFC"));
      assert.equal(word.options[1], word.options[1].normalize("NFC"));
      // The hint must never spell out either answer.
      assert.ok(!word.where.includes(word.options[0]) && !word.where.includes(word.options[1]), word.id);
    }
    // Right answers aren't all on one side.
    const rights = set.words.map(word => word.right);
    assert.ok(rights.includes(0) && rights.includes(1));
  }
});

test("disputed or recently changed spellings stay out", () => {
  const shown: string[] = wordSets.flatMap(set => set.words.flatMap(word => word.options));
  for (const banned of ["দারিদ্র্য", "দারিদ্র", "মুহূর্ত", "নূপুর", "শ্রেণি", "শহিদ", "শহীদ", "ইদ", "ঈদ", "জরুরি", "বাঙালি"]) assert.ok(!shown.includes(banned), banned);
});

test("a result survives the link round trip and is rescored, not trusted", () => {
  const picks: Pick[] = [1, 0, 1, 0, 1, 0, 1, 1, 0, 0];
  const result = parseResult(resultHash({ set: "dokan", picks, name: "রাফি" }));
  assert.deepEqual(result, { set: "dokan", picks, name: "রাফি" });
  assert.equal(scoreOf("dokan", picks), 9);
  assert.equal(scoreOf("e75", allRight(wordSets[3])), 10);
});

test("hostile or broken links are rejected instead of crashing", () => {
  assert.equal(parseResult(""), null);
  assert.equal(parseResult("#set=evil&a=1111111111"), null);
  assert.equal(parseResult("#set=dokan&a=111"), null);
  assert.equal(parseResult("#set=dokan&a=11111111112"), null);
  assert.equal(parseResult("#set=dokan&a=2111111111"), null);
  assert.equal(parseResult("#set=dokan&a=%%%"), null);
  assert.equal(parseResult("#set=__proto__&a=1111111111"), null);
});

test("names are NFC, lose control and direction characters, and are capped", () => {
  assert.equal(cleanName("  রিমা‮  আক্তার\n"), "রিমা আক্তার");
  assert.equal(cleanName("ক".repeat(MAX_NAME_LENGTH + 10)).length, MAX_NAME_LENGTH);
  assert.equal(cleanName("কো"), "কো".normalize("NFC"));
  assert.equal(cleanName("কো"), "কো");
});

test("lines and badges follow the score, and the Ekushe set stays sober", () => {
  assert.equal(humanLine(10, "dokan"), "তোমার হাতে সাইনবোর্ড দিলে একটাও ভুল থাকত না।");
  assert.equal(humanLine(7, "school"), "প্রায় সব ঠিক, বাকিটা এখন শিখে গেলে।");
  assert.equal(humanLine(3, "deyal"), "ভুল কয়টার নিয়ম নিচে আছে, একবার চোখ বুলিয়ে নাও।");
  assert.equal(badge(8, "dokan"), "বানান-বীর");
  assert.equal(badge(10, "e75"), "একুশের ৭৫ বছর");
  assert.ok(!humanLine(3, "e75").includes("ভালোবাসা"));
});

test("previews and friend lines are personal and spoiler-free", () => {
  const picks = allRight(wordSets[0]).map((pick, index) => (index < 2 ? 1 - pick : pick)) as Pick[];
  const result = { set: "dokan" as const, picks, name: "রাফি" };
  assert.equal(previewTitle(result), "রাফি ১০-এ ৮টা বানান ঠিক করেছে। তুমি পারবে?");
  assert.equal(friendLine(result), "রাফি পেয়েছে ১০-এ ৮, তুমি?");
  assert.equal(compareLine(9, result), "রাফির চেয়ে ১টা বেশি!");
  assert.equal(compareLine(8, result), "রাফির সাথে সমান সমান, দুজনেই ৮।");
  for (const word of wordSets[0].words) assert.ok(!previewTitle(result).includes(word.options[word.right]));
  assert.ok(previewTitle({ ...result, set: "e75", name: "" }).startsWith("একুশের ৭৫ বছর: এক বন্ধু"));
});

test("share.ts normalizes link state and rejects junk", () => {
  assert.equal(share.normalize("a=0101010101&set=dokan&n=%20রাফি%20&x=1"), "set=dokan&a=0101010101&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  assert.equal(share.normalize("set=dokan"), null);
  assert.match(share.preview("set=dokan&a=0101010101").title, /১০-এ/);
});

test("tally only uses fixed word ids and counts right picks", () => {
  const picks = allRight(wordSets[1]);
  picks[0] = (1 - picks[0]) as Pick;
  const items = tallyItems({ set: "school", picks, name: "রাফি" });
  assert.equal(items.filter(item => item.startsWith("s-")).length, 10);
  assert.equal(items.filter(item => item.startsWith("r-")).length, 9);
  assert.ok(items.every(item => tallyIds.includes(item)));
  assert.equal(rightShare({ "s-porikkha": 5, "r-porikkha": 5 }, "porikkha"), null);
  assert.equal(rightShare({ "s-porikkha": 40, "r-porikkha": 29 }, "porikkha"), 73);
});

test("the Ekushe set leads in February only", () => {
  assert.equal(defaultSet(new Date(2027, 1, 21)), "e75");
  assert.equal(defaultSet(new Date(2026, 9, 10)), "dokan");
});

test("sets are append-only, and links shared before the খাঁটি বাংলা set still open the same card", () => {
  assert.deepEqual(wordSets.map(set => set.id).slice(0, 5), ["dokan", "school", "deyal", "e75", "khanti"]);
  const old = parseResult("#set=e75&a=1010101100&n=%E0%A6%B0%E0%A6%BF%E0%A6%AE%E0%A6%BE");
  assert.deepEqual(old, { set: "e75", picks: [1, 0, 1, 0, 1, 0, 1, 1, 0, 0], name: "রিমা" });
  assert.equal(previewTitle(old!), "একুশের ৭৫ বছর: রিমা ১০-এ ১০টা বানান ঠিক করেছে। তুমি পারবে?");
  assert.equal(scoreOf("dokan", [...("1010101101")].map(Number) as Pick[]), 10);
  assert.ok(!isLoan("e75") && !isLoan("dokan"));
});

test("the খাঁটি বাংলা set shows an English word and two different Bangla words", () => {
  const set = wordSets[4];
  assert.ok(set.sober && set.kind === "loan" && isLoan(set.id));
  for (const word of set.words) {
    assert.ok(word.loan && word.loan === word.loan.normalize("NFC"), word.id);
    assert.ok(!(word.options as readonly string[]).includes(word.loan) && !word.where.includes(word.loan), word.id);
    assert.ok(word.rule.includes(word.options[word.right]), word.id);
  }
  // Every other set is spelling, with no English word on the board.
  for (const other of wordSets.slice(0, 4)) assert.ok(other.words.every(word => !("loan" in word)), other.id);
});

test("the খাঁটি বাংলা set has its own sober lines, preview and link round trip", () => {
  const picks = allRight(wordSets[4]);
  picks[9] = (1 - picks[9]) as Pick;
  const result = parseResult(resultHash({ set: "khanti", picks, name: "রাফি" }))!;
  assert.deepEqual(result, { set: "khanti", picks, name: "রাফি" });
  assert.equal(scoreOf("khanti", picks), 9);
  assert.equal(badge(9, "khanti"), "মায়ের ভাষায় বলি");
  assert.equal(badge(10, "e75"), "একুশের ৭৫ বছর");
  assert.equal(previewTitle(result), "একুশের ৭৫ বছর: রাফি ১০-এ ৯টা শব্দের খাঁটি বাংলা বলেছে। তুমি পারবে?");
  for (const score of [10, 7, 2]) assert.ok(!/ভালোবাসা|বানান/.test(humanLine(score, "khanti")), String(score));
  assert.equal(humanLine(2, "khanti"), "মুখে ইংরেজি আসা দোষের না। বাংলাটাও জানা থাকুক।");
  assert.match(share.preview(resultHash(result)).description, /ইংরেজি শব্দ/);
  assert.match(share.preview("set=dokan&a=0101010101").description, /বানান/);
  for (const word of wordSets[4].words) assert.ok(!previewTitle(result).includes(word.options[word.right]));
  assert.ok(tallyItems(result).every(item => tallyIds.includes(item)));
});
