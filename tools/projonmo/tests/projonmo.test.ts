import assert from "node:assert/strict";
import test from "node:test";
import { readLevels, recordLevel, totalStars } from "../../../shared/game-core";
import { nearMissLine, setStars } from "../lib/words";
import { sets as levelSets } from "../lib/words";
import { share } from "../share";
import { site } from "../content";
import { allEntries, caption, cleanName, dictionaryUrl, formula, friendBanner, humanLine, parseShareHash, sendTo, sets, shareHash, split, tallyIds, verdict, MAX_NAME_LENGTH, PER_KIND, PER_SET, type Answer, type SetId } from "../lib/words";

const setOf = (id: SetId) => sets.find(item => item.id === id)!;
const key = (id: SetId) => setOf(id).entries.map(entry => entry.answer) as Answer[];
const traps = (id: SetId) => setOf(id).entries.map(entry => entry.trap) as Answer[];
/** A wrong answer that is not the trap. */
const plainWrong = (answer: Answer, trap: Answer) => (3 - answer - trap) as Answer;
/** Right only on the given kind; elsewhere a plain (non-trap) wrong answer. */
const onlyKind = (id: SetId, kind: "genz" | "elder") => setOf(id).entries.map(entry => entry.kind === kind ? entry.answer : plainWrong(entry.answer, entry.trap)) as Answer[];

test("every page has 5 Gen Z words and 5 elders' words, well-formed and spread over all answer positions", () => {
  assert.equal(new Set(allEntries.map(entry => entry.id)).size, allEntries.length);
  assert.equal(new Set(allEntries.map(entry => entry.word)).size, allEntries.length);
  for (const item of sets) {
    assert.equal(item.entries.length, PER_SET);
    assert.equal(item.entries.filter(entry => entry.kind === "genz").length, PER_KIND, item.id);
    assert.equal(new Set(key(item.id)).size, 3, `${item.id}: answers sit in every position`);
    for (const entry of item.entries) {
      assert.equal(new Set(entry.options).size, 3, entry.id);
      assert.notEqual(entry.trap, entry.answer, entry.id);
      assert.ok(entry.example.includes(entry.word.replace(/[?]$/, "").split(" ")[0]), `${entry.id}: the example uses the word`);
      assert.ok(!entry.oops.includes(entry.options[entry.answer]), `${entry.id}: the oops line doesn't give the answer away`);
      if (entry.kind === "elder" && entry.source) assert.match(entry.source.url, /^https:\/\/accessibledictionary\.gov\.bd\//, entry.id);
      if (entry.source) assert.match(entry.source.url, /^https:\/\//, entry.id);
    }
  }
});

test("no idiom repeats বাগধারার ছবি, and nothing political slips in", async () => {
  const { allIdioms } = await import("../../bagdhara/lib/idioms");
  const theirs = new Set(allIdioms.map(item => item.idiom));
  for (const entry of allEntries) assert.ok(!theirs.has(entry.word), entry.id);
  const text = JSON.stringify(sets);
  for (const word of ["আন্দোলন", "বিপ্লব", "জুলাই", "স্বৈরাচার", "ক্রাশ", "রিজ"]) assert.ok(!text.includes(word), word);
});

test("dictionary links rebuild precomposed ড় so the Bangla Academy search finds the word", () => {
  assert.equal(dictionaryUrl("ইঁচড়"), "https://accessibledictionary.gov.bd/bengali-to-bengali/?q=%E0%A6%87%E0%A6%81%E0%A6%9A%E0%A7%9C");
  assert.doesNotMatch(dictionaryUrl("ইঁচড়"), /%E0%A6%BC/);
  assert.equal(dictionaryUrl("লাট"), "https://accessibledictionary.gov.bd/bengali-to-bengali/?q=" + encodeURIComponent("লাট"));
});

test("the split follows the formula: right Gen Z ÷ all right × 100, rounded; nothing right is 50–50", () => {
  assert.deepEqual(split("s1", key("s1")), { genzRight: 5, elderRight: 5, total: 10, genzPct: 50, elderPct: 50, lean: "even" });
  assert.deepEqual(split("s1", onlyKind("s1", "genz")), { genzRight: 5, elderRight: 0, total: 5, genzPct: 100, elderPct: 0, lean: "genz" });
  assert.equal(split("s2", onlyKind("s2", "elder")).elderPct, 100);
  const fourTwo = setOf("s1").entries.map((entry, index) => {
    const genzIndex = setOf("s1").entries.slice(0, index).filter(other => other.kind === entry.kind).length;
    const right = entry.kind === "genz" ? genzIndex < 4 : genzIndex < 2;
    return right ? entry.answer : plainWrong(entry.answer, entry.trap);
  }) as Answer[];
  const result = split("s1", fourTwo);
  assert.deepEqual([result.genzRight, result.elderRight, result.genzPct, result.elderPct], [4, 2, 67, 33]);
  assert.equal(formula(result), "জেন-জির ৫টা শব্দের মধ্যে পেরেছ ৪টা, আব্বু-আম্মুর ৫টার মধ্যে ২টা। জেন-জি = ৪ ÷ (৪ + ২) × ১০০ = ৬৭%, বাকি ৩৩% আব্বু-আম্মু।");
  const none = traps("s1");
  assert.deepEqual([split("s1", none).genzPct, split("s1", none).elderPct], [50, 50]);
  assert.match(formula(split("s1", none)), /৫০-৫০/);
});

test("verdicts, human lines and who gets the challenge", () => {
  assert.equal(verdict(split("s1", key("s1"))), "দুই প্রজন্মের দোভাষী");
  assert.equal(verdict(split("s1", onlyKind("s1", "genz"))), "খাঁটি জেন-জি");
  assert.equal(verdict(split("s1", onlyKind("s1", "elder"))), "খাঁটি আব্বু-আম্মু");
  assert.equal(verdict(split("s1", traps("s1"))), "অভিধানটা আবার খোলো");
  assert.match(humanLine("s1", key("s1")), /^দশে দশ/);
  // The first trap you fell for drives the line.
  const goatTrap = key("s1").map((answer, index) => index === 2 ? traps("s1")[2] : answer);
  assert.match(humanLine("s1", goatTrap), /ছাগল/);
  assert.match(humanLine("s1", onlyKind("s1", "genz")), /জেন-জির ভাষায় তুমি পাকা/);
  assert.equal(sendTo(split("s1", onlyKind("s1", "genz"))), "আব্বু-আম্মুকে পাঠাও");
  assert.equal(sendTo(split("s1", onlyKind("s1", "elder"))), "ছোটদের পাঠাও");
  assert.match(caption({ set: "s1", answers: onlyKind("s1", "genz"), name: "" }), /১০০% জেন-জি, ০% আব্বু-আম্মু.*আব্বু-আম্মু, তোমরা কয়টা পারো দেখি\?$/);
  const banner = friendBanner({ set: "s1", answers: onlyKind("s1", "elder"), name: "নানু" });
  assert.equal(banner.title, "নানু ০% জেন-জি, ১০০% আব্বু-আম্মু। এবার তোমার পালা!");
  assert.match(banner.sub, /জেন-জির শব্দে তুমি পারবে তো/);
});

test("a finished page survives the share-link round trip, Bangla name included", () => {
  const shared = { set: "s2" as const, answers: [0, 1, 2, 0, 1, 2, 0, 1, 2, 0] as Answer[], name: "রাফি" };
  assert.deepEqual(parseShareHash(shareHash(shared)), shared);
  assert.equal(parseShareHash("#set=s1&a=0210211021&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF")?.name, "রাফি");
});

test("the split is recomputed from answers; a percentage in the link is ignored", () => {
  const hash = shareHash({ set: "s1", answers: onlyKind("s1", "genz"), name: "" }) + "&genz=0&pct=0";
  assert.equal(split("s1", parseShareHash(hash)!.answers).genzPct, 100);
  assert.equal(share.normalize(hash.slice(1)), shareHash({ set: "s1", answers: onlyKind("s1", "genz"), name: "" }).slice(1));
});

test("hostile, partial or unknown links are rejected", () => {
  for (const hash of ["", "#set=s9&a=0000000000", "#set=s1&a=000000000", "#set=s1&a=00000000003", "#set=s1&a=000000000x", "#set=__proto__&a=0000000000", "#set=constructor&a=0000000000", "#a=0000000000", "#set=s1&a=０000000000", "#set=s1&a=-000000000"]) assert.equal(parseShareHash(hash), null, hash);
  assert.equal(share.normalize("set=s1&a=12"), null);
  assert.equal(share.normalize("set=s1&a=0000000000&n=" + "ক".repeat(500)), "set=s1&a=0000000000&n=" + encodeURIComponent("ক".repeat(MAX_NAME_LENGTH)));
});

test("names are NFC, stripped of control and direction characters, and capped", () => {
  assert.equal(cleanName("  রিমা‮  আক্তার\n"), "রিমা আক্তার");
  assert.equal(cleanName("ক".repeat(MAX_NAME_LENGTH + 10)).length, MAX_NAME_LENGTH);
  assert.equal(cleanName("é"), "é");
  assert.equal(cleanName("ড়"), "ড়".normalize("NFC"));
  assert.equal(parseShareHash(shareHash({ set: "s1", answers: key("s1"), name: "<b>x</b>\u0000" }))?.name, "<b>x</b>");
});

test("share preview is personal and spoiler-free; tally lists only fixed ids", () => {
  const state = share.normalize(shareHash({ set: "s1", answers: onlyKind("s1", "genz"), name: "রাফি" }).slice(1))!;
  const preview = share.preview(state);
  assert.equal(preview.title, "রাফি ১০০% জেন-জি, ০% আব্বু-আম্মু — তুমি কোন দলে?");
  assert.match(preview.description, /স্লে, টাকা কি গাছে ধরে\?, গোট…/);
  for (const entry of allEntries) assert.ok(!preview.description.includes(entry.options[entry.answer]), entry.id);
  assert.match(share.preview("garbage").title, /তুমি কোন দলে/);
  assert.equal(tallyIds.length, 22);
  assert.ok(tallyIds.every(id => /^(seen:s\d|[a-z-]+)$/.test(id)));
});

test("SEO copy stays within its limits", () => {
  assert.ok(site.title.length <= 45, site.title);
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.faq.length >= 5);
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
