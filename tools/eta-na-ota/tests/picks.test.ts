import assert from "node:assert/strict";
import test from "node:test";
import { share } from "../share";
import { caption, cleanName, humanLine, nationalScore, packs, parseShareHash, pairSplit, rarestPick, shareHash, tallyIds, MAX_NAME_LENGTH, MIN_SAMPLE, PAIRS_PER_PACK, type Side, type Tally } from "../lib/picks";

const food = packs[0];
const all = (side: Side) => Array<Side>(PAIRS_PER_PACK).fill(side);
// A tally where every food pair has `left` votes for L and `right` for R.
const tallyOf = (left: number, right: number): Tally => ({ total: left + right, counts: Object.fromEntries(food.pairs.flatMap(pair => [[`${pair.id}.L`, left], [`${pair.id}.R`, right]])) });

test("every pack has 12 pairs and every tally id is unique", () => {
  for (const pack of packs) assert.equal(pack.pairs.length, PAIRS_PER_PACK, pack.id);
  assert.equal(new Set(tallyIds).size, tallyIds.length);
  assert.equal(tallyIds.length, packs.length * PAIRS_PER_PACK * 2);
});

test("a shared card survives the link round trip", () => {
  const shared = { pack: "football" as const, answers: [..."LRRLLRLRRLLR"] as Side[], name: "রাফি", score: { match: 7, of: 12 } };
  assert.deepEqual(parseShareHash(shareHash(shared)), shared);
  assert.deepEqual(parseShareHash(shareHash({ ...shared, name: "", score: null })), { ...shared, name: "", score: null });
});

test("hostile or broken hashes are rejected instead of crashing", () => {
  assert.equal(parseShareHash(""), null);
  assert.equal(parseShareHash("#result"), null);
  assert.equal(parseShareHash("#p=politics&a=LLLLLLLLLLLL"), null);
  assert.equal(parseShareHash("#p=food&a=LLLL"), null);
  assert.equal(parseShareHash("#p=food&a=LLLLLLLLLLLX"), null);
  assert.equal(parseShareHash("#p=food&a=" + "L".repeat(500)), null);
  assert.equal(parseShareHash("#p=food&a=LLLLLLLLLLLL&m=13&k=12")?.score, null);
  assert.equal(parseShareHash("#p=food&a=LLLLLLLLLLLL&m=2&k=3")?.score, null);
  assert.equal(parseShareHash("#p=food&a=LLLLLLLLLLLL&m=1.5&k=12")?.score, null);
  assert.equal(parseShareHash("#p=food&a=LLLLLLLLLLLL&m=-1&k=12")?.score, null);
});

test("names are NFC, stripped of control and direction characters, and capped", () => {
  assert.equal(cleanName("  রিমা‮  আক্তার\n"), "রিমা আক্তার");
  assert.equal(cleanName("রো"), "রো");
  assert.equal(cleanName("ক".repeat(MAX_NAME_LENGTH + 10)).length, MAX_NAME_LENGTH);
});

test("the server normalizes links and writes a personal preview", () => {
  assert.equal(share.normalize("p=food&a=LLLLLLLLLLLL&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF&m=7&k=12&junk=1"), "p=food&a=LLLLLLLLLLLL&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF&m=7&k=12");
  assert.equal(share.normalize("p=food"), null);
  assert.equal(share.preview("p=food&a=LLLLLLLLLLLL&n=রাফি&m=7&k=12").title, "রাফির পছন্দ দেশের সাথে ৭/১২ মেলে। তোমার কয়টা মেলে?");
  assert.equal(share.preview("p=food&a=RLLLLLLLLLLL").title, "এক বন্ধুর বাছাই: চটপটি, কাচ্চি, ভাত… তুমি কোন দিকে?");
});

test("percentages leave out this browser's own earlier vote", () => {
  assert.deepEqual(pairSplit(tallyOf(10, 5), food.pairs[0], "L"), { L: 9, R: 5, total: 14 });
  assert.equal(pairSplit(null, food.pairs[0]), null);
});

test("no national score until enough people have played", () => {
  assert.equal(nationalScore(food, all("L"), tallyOf(MIN_SAMPLE - 1, 0)), null);
  assert.deepEqual(nationalScore(food, all("L"), tallyOf(40, 20)), { match: 12, of: 12 });
  assert.deepEqual(nationalScore(food, all("R"), tallyOf(40, 20)), { match: 0, of: 12 });
  assert.deepEqual(nationalScore(food, all("R"), tallyOf(20, 20)), { match: 12, of: 12 });
});

test("rare picks earn their own line, otherwise the score picks it", () => {
  const rare = rarestPick(food, all("R"), tallyOf(80, 20));
  assert.deepEqual(rare, { pick: "চটপটি", other: "ফুচকা", percent: 20 });
  assert.equal(humanLine(food, all("R"), null, rare), "ফুচকা ছেড়ে চটপটি? সাহস আছে!");
  assert.equal(humanLine(food, all("L"), { match: 12, of: 12 }, null), "তুমি পুরো দেশের মনের কথা বলো।");
  assert.equal(humanLine(food, all("L"), { match: 7, of: 12 }, null), "অর্ধেক দেশ তোমার দলে।");
  assert.equal(humanLine(food, all("L"), { match: 2, of: 12 }, null), "দেশ যেদিকে, তুমি প্রায় উল্টোদিকে।");
  assert.equal(humanLine(food, all("L"), null, null), "ফুচকা আর কাচ্চি। তোমাকে চেনা হয়ে গেল।");
});

test("a friend's link turns the caption into a match count", () => {
  const mine = { pack: "food" as const, answers: all("L"), name: "", score: null };
  const friend = { ...mine, answers: [..."LLLLLLLLLRRR"] as Side[], name: "তানিয়া" };
  assert.equal(caption(mine, friend), "তানিয়ার সাথে আমার মিল ৯/১২! তোমার সাথে কয়টা মেলে?");
  assert.equal(caption(mine, null), "ফুচকা না চটপটি? আমি ফুচকা দলে। তুমি কোন দিকে?");
});
