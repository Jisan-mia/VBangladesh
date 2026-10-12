import assert from "node:assert/strict";
import test from "node:test";
import { readLevels, recordLevel, totalStars } from "../../../shared/game-core";
import { nearMissLine, setStars } from "../lib/idioms";
import { sets as levelSets } from "../lib/idioms";
import { share } from "../share";
import { artIds, idiomSvg } from "../lib/art";
import { allIdioms, cleanName, dictionaryUrl, humanLine, parseShareHash, rank, scoreOf, sets, shareHash, tallyIds, trapsOf, MAX_NAME_LENGTH, PER_SET, type Answer } from "../lib/idioms";

const key = (id: (typeof sets)[number]["id"]) => sets.find(item => item.id === id)!.questions.map(question => question.answer) as Answer[];
const traps = (id: (typeof sets)[number]["id"]) => sets.find(item => item.id === id)!.questions.map(question => question.trap) as Answer[];

test("every page has 10 well-formed idioms: unique ids, 3 distinct options, a trap that isn't the answer, a drawing", () => {
  assert.equal(new Set(allIdioms.map(item => item.id)).size, allIdioms.length);
  assert.equal(new Set(allIdioms.map(item => item.idiom)).size, allIdioms.length);
  for (const item of sets) {
    assert.equal(item.questions.length, PER_SET);
    assert.equal(new Set(key(item.id)).size, 3, `${item.id}: answers sit in every position`);
    for (const question of item.questions) {
      assert.equal(new Set(question.options).size, 3, question.id);
      assert.notEqual(question.trap, question.answer, question.id);
      assert.ok(question.example.includes(question.idiom.split(" ")[0].replace(/-.*/, "")), `${question.id}: the example uses the idiom`);
      assert.ok(!question.scene.includes(question.meaning), question.id);
    }
  }
  assert.deepEqual([...artIds].sort(), allIdioms.map(item => item.id).sort());
});

test("drawings are valid, deterministic SVG with no text and no broken numbers", () => {
  for (const id of artIds) {
    const svg = idiomSvg(id);
    assert.match(svg, /^<svg [^>]*viewBox="0 0 200 140"[^>]*>.*<\/svg>$/s, id);
    assert.doesNotMatch(svg, /NaN|undefined|<text/, id);
    assert.equal(svg, idiomSvg(id));
  }
  assert.match(idiomSvg("gure-bali", 400), /width="400" height="280"/);
});

test("dictionary links rebuild precomposed ড় so the Bangla Academy search finds the word", () => {
  assert.equal(dictionaryUrl("গুড়"), "https://accessibledictionary.gov.bd/bengali-to-bengali/?q=%E0%A6%97%E0%A7%81%E0%A7%9C");
  assert.match(dictionaryUrl("আমড়া"), /%E0%A7%9C/);
  assert.doesNotMatch(dictionaryUrl("আমড়া"), /%E0%A6%BC/);
  assert.equal(dictionaryUrl("অরণ্য"), "https://accessibledictionary.gov.bd/bengali-to-bengali/?q=" + encodeURIComponent("অরণ্য"));
});

test("a finished page survives the share-link round trip, Bangla name included", () => {
  const shared = { set: "s2" as const, answers: [0, 1, 2, 0, 1, 2, 0, 1, 2, 0] as Answer[], name: "রাফি" };
  assert.deepEqual(parseShareHash(shareHash(shared)), shared);
  assert.equal(parseShareHash("#set=s1&a=0210211021&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF")?.name, "রাফি");
});

test("the score is recomputed from answers, never read from the link", () => {
  assert.equal(scoreOf("s1", key("s1")), 10);
  const hash = shareHash({ set: "s1", answers: key("s1"), name: "" }) + "&score=0";
  assert.equal(scoreOf("s1", parseShareHash(hash)!.answers), 10);
});

test("hostile, partial or unknown links are rejected", () => {
  for (const hash of ["", "#set=s9&a=0000000000", "#set=s1&a=000000000", "#set=s1&a=00000000003", "#set=s1&a=000000000x", "#set=__proto__&a=0000000000", "#set=constructor&a=0000000000", "#a=0000000000", "#set=s1&a=０000000000"]) assert.equal(parseShareHash(hash), null, hash);
  assert.equal(share.normalize("set=s1&a=12"), null);
  assert.equal(share.normalize("set=s1&a=0000000000&n=" + "ক".repeat(500)), "set=s1&a=0000000000&n=" + encodeURIComponent("ক".repeat(MAX_NAME_LENGTH)));
});

test("names are NFC, stripped of control and direction characters, and capped", () => {
  assert.equal(cleanName("  রিমা‮  আক্তার\n"), "রিমা আক্তার");
  assert.equal(cleanName("ক".repeat(MAX_NAME_LENGTH + 10)).length, MAX_NAME_LENGTH);
  assert.equal(cleanName("é"), "é");
  assert.equal(parseShareHash(shareHash({ set: "s1", answers: key("s1"), name: "<b>x</b>\u0000" }))?.name, "<b>x</b>");
});

test("human line follows the score and how often the picture fooled you", () => {
  const right = key("s1");
  assert.match(humanLine("s1", right), /১০-এ ১০/);
  const fooled = traps("s1");
  assert.equal(trapsOf("s1", fooled), 10);
  assert.match(humanLine("s1", fooled), /^১০বার ছবি যা দেখায়/);
  const oneMiss = right.map((answer, index) => index === 3 ? (3 - answer - traps("s1")[3]) as Answer : answer);
  assert.equal(scoreOf("s1", oneMiss), 9);
  assert.match(humanLine("s1", oneMiss), /“ভূতের মুখে রাম নাম”/);
  assert.equal(rank(10), "বাগধারার পণ্ডিত");
  assert.equal(rank(8), "ফার্স্ট বেঞ্চ");
  assert.equal(rank(0), "বইটা আবার খোলো");
});

test("share preview is personal and spoiler-free; tally lists only fixed ids", () => {
  const state = share.normalize(shareHash({ set: "s1", answers: key("s1"), name: "রাফি" }).slice(1))!;
  const preview = share.preview(state);
  assert.equal(preview.title, "রাফি ১০টা বাগধারার ১০টা পেরেছে। তুমি কয়টা পারবে?");
  assert.match(preview.description, /^রাফির সাথে/);
  for (const question of sets[0].questions) assert.ok(!preview.description.includes(question.options[question.answer]), question.id);
  assert.match(share.preview("garbage").title, /^এক বন্ধু/);
  assert.equal(tallyIds.length, 22);
  assert.ok(tallyIds.every(id => /^(seen:s\d|[a-z-]+)$/.test(id)));
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
