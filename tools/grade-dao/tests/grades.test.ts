import assert from "node:assert/strict";
import test from "node:test";
import { share } from "../share";
import { caption, cleanName, gpaOf, gradeOfPoint, humanLine, mergeVotes, nationalOf, nationalScore, packs, parseCounted, parseShareHash, previewTitle, shareHash, tallyIds, ITEMS_PER_PACK, MAX_NAME_LENGTH, MIN_SAMPLE, type Grade, type Sheet, type Tally } from "../lib/grades";

const street = packs[0];
const all = (grade: Grade) => Array<Grade>(ITEMS_PER_PACK).fill(grade);
const tallyOf = (counts: Record<string, number>): Tally => ({ total: 0, counts });

test("every pack has 8 items and every tally id is unique pack.item.grade", () => {
  for (const pack of packs) assert.equal(pack.items.length, ITEMS_PER_PACK, pack.id);
  assert.equal(new Set(tallyIds).size, tallyIds.length);
  assert.equal(tallyIds.length, packs.length * ITEMS_PER_PACK * 5);
  assert.ok(tallyIds.includes("street.fuchka.AP"));
  for (const id of tallyIds) assert.match(id, /^[a-z]+\.[a-z]+\.(AP|A|B|C|F)$/);
});

test("a shared sheet survives the link round trip, in the readable format from the brief", () => {
  const sheet: Sheet = { pack: "street", grades: ["AP", "A", "B", "C", "A", "AP", "F", "B"], name: "রাফি", score: { match: 5, of: 8 } };
  const hash = shareHash(sheet);
  assert.ok(hash.startsWith("#p=street&g=AP,A,B,C,A,AP,F,B&n="));
  assert.deepEqual(parseShareHash(hash), sheet);
  assert.deepEqual(parseShareHash(shareHash({ ...sheet, name: "", score: null })), { ...sheet, name: "", score: null });
  // The same name typed as decomposed Bangla comes back NFC.
  assert.equal(parseShareHash(`#p=eid&g=${all("A").join(",")}&n=${encodeURIComponent("রাফি".normalize("NFD"))}`)?.name, "রাফি".normalize("NFC"));
});

test("hostile or broken hashes are rejected instead of crashing", () => {
  const ok = all("A").join(",");
  assert.equal(parseShareHash(""), null);
  assert.equal(parseShareHash("#result"), null);
  assert.equal(parseShareHash(`#p=politics&g=${ok}`), null);
  assert.equal(parseShareHash(`#p=__proto__&g=${ok}`), null);
  assert.equal(parseShareHash("#p=street&g=A,A,A"), null);
  assert.equal(parseShareHash("#p=street&g=A,A,A,A,A,A,A,A,A"), null);
  assert.equal(parseShareHash("#p=street&g=A,A,A,A,A,A,A,D"), null);
  assert.equal(parseShareHash("#p=street&g=A,A,A,A,A,A,A,"), null);
  assert.equal(parseShareHash(`#p=street&g=${ok}&n=${"ক".repeat(400)}`), null);
  assert.equal(parseShareHash(`#p=street&g=${ok}&m=9&k=8`)?.score, null);
  assert.equal(parseShareHash(`#p=street&g=${ok}&m=2&k=3`)?.score, null);
  assert.equal(parseShareHash(`#p=street&g=${ok}&m=1.5&k=8`)?.score, null);
  assert.equal(parseShareHash(`#p=street&g=${ok}&m=-1&k=8`)?.score, null);
});

test("names are NFC, stripped of control and direction characters, and capped", () => {
  assert.equal(cleanName("  রিমা‮  আক্তার\n"), "রিমা আক্তার");
  assert.equal(cleanName("ক".repeat(MAX_NAME_LENGTH + 10)).length, MAX_NAME_LENGTH);
});

test("the server normalizes links and writes a personal preview", () => {
  const ok = all("A").join(",");
  assert.equal(share.normalize(`p=street&g=${ok}&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF&m=5&k=8&junk=1`), `p=street&g=${ok}&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF&m=5&k=8`);
  assert.equal(share.normalize("p=street"), null);
  assert.equal(share.preview("p=street&g=B,AP,A,A,A,A,A,A&n=রাফি&m=5&k=8").title, "রাফির রেজাল্ট শিট: চটপটি A+, দেশের সাথে মিল ৫/৮ — তুমি কত দেবে?");
  assert.equal(share.preview("p=ride&g=AP,C,B,A,A,A,A,A").title, "এক পরীক্ষকের রেজাল্ট শিট: রিকশা A+, লোকাল বাস C, সিএনজি B… তুমি কত দেবে?");
  assert.ok(share.tally?.every(id => /^[a-z]+\.[a-z]+\.[A-Z]+$/.test(id)));
});

test("grade points follow the school scale and round to the nearest grade", () => {
  assert.equal(gpaOf(["AP", "A", null, null, null, null, null, null]), 4.5);
  assert.equal(gpaOf(Array(8).fill(null)), null);
  assert.deepEqual([5, 4.5, 4.49, 3.5, 3, 2.5, 2, 1, 0.99, 0].map(gradeOfPoint), ["AP", "AP", "A", "A", "B", "B", "C", "C", "F", "F"]);
});

test("no national average below the minimum sample, and this browser's own vote is left out", () => {
  assert.equal(nationalOf(null, "street", "fuchka"), null);
  assert.equal(nationalOf(tallyOf({ "street.fuchka.AP": MIN_SAMPLE - 1 }), "street", "fuchka"), null);
  assert.deepEqual(nationalOf(tallyOf({ "street.fuchka.AP": 20, "street.fuchka.A": 10 }), "street", "fuchka"), { grade: "AP", gpa: 140 / 30, total: 30 });
  assert.equal(nationalOf(tallyOf({ "street.fuchka.AP": 20, "street.fuchka.A": 10 }), "street", "fuchka", "AP"), null);
  assert.equal(nationalOf(tallyOf({ "street.fuchka.F": 40 }), "street", "fuchka")?.grade, "F");
});

test("the national match counts exact grades, only once enough items have an average", () => {
  const average = (grade: Grade) => ({ grade, gpa: 0, total: 50 });
  assert.equal(nationalScore(all("A"), [average("A"), average("A"), average("A"), null, null, null, null, null]), null);
  assert.deepEqual(nationalScore(all("A"), [average("A"), average("A"), average("B"), average("AP"), null, null, null, null]), { match: 2, of: 4 });
  assert.deepEqual(nationalScore(all("A"), all("A").map(average)), { match: 8, of: 8 });
});

test("the human line comes from the grades given", () => {
  const average = (grade: Grade) => ({ grade, gpa: 0, total: 50 });
  assert.equal(humanLine(street, Array(8).fill(null)), "লাল কলম তোমার হাতে। প্রথম খাতা: ফুচকা।");
  assert.equal(humanLine(street, ["A", "B", null, null, null, null, null, null]), "আর ৬টা খাতা বাকি, তারপর রেজাল্ট!");
  assert.equal(humanLine(street, all("AP")), "সবাইকে A+! এমন দয়ালু পরীক্ষক আর হয় না।");
  assert.equal(humanLine(street, all("F")), "সবাই ফেল! তোমার খাতায় পাস করা কঠিন।");
  assert.equal(humanLine(street, ["C", "A", "A", "A", "A", "A", "A", "A"], [average("AP")]), "দেশ ফুচকাকে দিল A+, তুমি দিলে C। কড়া পরীক্ষক!");
  assert.equal(humanLine(packs[2], ["A", "AP", "A", "A", "A", "A", "A", "A"], [null, average("C")]), "দেশ লোকাল বাসকে দিল C, তুমি দিলে A+। দয়ার শরীর!");
  assert.equal(humanLine(street, ["AP", "A", "B", "C", "A", "B", "F", "B"]), "ফুচকা পেল A+, হালিম ফেল। তোমার খাতায় দয়া আছে, ছাড় নেই!");
  assert.equal(humanLine(packs[1], ["A", "B", "F", "A", "A", "A", "A", "A"]), "শরৎকে F! বেচারা আবার পরীক্ষা দেবে।");
  assert.equal(humanLine(street, ["AP", "AP", "B", "C", "A", "B", "A", "B"]), "ফুচকা আর চটপটি পেল A+, তোমার খাতায় যুগ্ম প্রথম!");
  assert.equal(humanLine(street, ["B", "AP", "B", "C", "A", "B", "A", "B"]), "চটপটি পেল A+, তোমার খাতায় প্রথম!");
  assert.equal(humanLine(street, all("A")), "সবাই ভালো করেছে, তবু কেউ A+ পায়নি। কড়া কিন্তু ন্যায্য!");
  assert.equal(humanLine(street, all("C")), "কেউ A+ পায়নি। তোমার খাতায় নম্বর পাওয়া সহজ না!");
});

test("captions and previews say what a real person would post", () => {
  const mine: Sheet = { pack: "street", grades: ["AP", "A", "B", "C", "A", "AP", "F", "B"], name: "", score: null };
  const friend: Sheet = { ...mine, grades: ["AP", "A", "B", "C", "A", "A", "A", "A"], name: "তানিয়া" };
  assert.equal(caption(mine, friend), "তানিয়ার সাথে আমার গ্রেড মিলেছে ৫/৮! তুমি ফুচকাকে কত দেবে?");
  assert.equal(caption(mine, null), "স্ট্রিট ফুড পরীক্ষার খাতা দেখলাম: ফুচকা A+, চটপটি A, ঝালমুড়ি B। তুমি ফুচকাকে কত দেবে?");
  assert.equal(caption({ ...mine, score: { match: 5, of: 8 } }, null), "স্ট্রিট ফুড পরীক্ষার খাতা দেখলাম: ফুচকা পেল A+, দেশের সাথে মিল ৫/৮। তুমি কত দেবে?");
  assert.equal(previewTitle({ ...mine, name: "রাফি" }), "রাফির রেজাল্ট শিট: ফুচকা A+, চটপটি A, ঝালমুড়ি B… তুমি কত দেবে?");
});

test("counting a second pack resends the first, so the server's single vote list keeps both", () => {
  const first = mergeVotes({}, "street", all("AP"));
  assert.equal(first.items.length, 8);
  assert.ok(first.items.every(id => id.startsWith("street.") && id.endsWith(".AP")));
  const second = mergeVotes(first.counted, "ride", all("C"));
  assert.equal(second.items.length, 16);
  assert.ok(second.items.includes("street.fuchka.AP") && second.items.includes("ride.riksha.C"));
  // Re-grading a pack replaces that pack's grades, never duplicates them.
  const regrade = mergeVotes(second.counted, "street", all("F"));
  assert.equal(regrade.items.length, 16);
  assert.ok(regrade.items.includes("street.fuchka.F") && !regrade.items.includes("street.fuchka.AP"));
  assert.ok(regrade.items.every(id => tallyIds.includes(id)));
  assert.deepEqual(first.counted, { street: all("AP") }, "merging never mutates the earlier record");
});

test("remembered votes from localStorage are validated before they are resent", () => {
  assert.deepEqual(parseCounted(null), {});
  assert.deepEqual(parseCounted("not json"), {});
  assert.deepEqual(parseCounted("[1,2]"), {});
  assert.deepEqual(parseCounted(JSON.stringify({ street: all("A"), ride: ["A"], eid: [...all("A").slice(1), "X"], hacked: all("A") })), { street: all("A") });
  const round = mergeVotes(parseCounted(JSON.stringify(mergeVotes({}, "season", all("B")).counted)), "eid", all("A"));
  assert.equal(round.items.length, 16);
});
