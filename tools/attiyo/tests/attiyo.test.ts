import assert from "node:assert/strict";
import test from "node:test";
import { share } from "../share";
import { STEPS, allChains, answerFor, caption, chainText, cleanName, isValidChain, kinPossessive, parseShareHash, phrase, quizOptions, shareHash, stepProblem, tallyIds, termFor, terms, MAX_NAME_LENGTH, type Step, type Style } from "../lib/kin";

const c = (key: string) => key.split(".") as Step[];
const term = (key: string, style: Style) => termFor(c(key), style);

test("known chains name the right relative in both family styles", () => {
  const known: Array<[string, string, string]> = [
    ["f.z.h", "ফুপা", "পিসেমশাই"],
    ["m.b", "মামা", "মামা"],
    ["b.w", "ভাবি", "বউদি"],
    ["f.f", "দাদা", "ঠাকুরদা"],
    ["f.m", "দাদি", "ঠাকুমা"],
    ["m.f", "নানা", "দাদু"],
    ["m.m", "নানি", "দিদিমা"],
    ["f.b", "চাচা", "কাকা / জ্যাঠা"],
    ["f.z", "ফুপু", "পিসি"],
    ["m.z", "খালা", "মাসি"],
    ["m.z.h", "খালু", "মেসো"],
    ["m.b.w", "মামি", "মামি"],
    ["f.b.w", "চাচি", "কাকি / জেঠি"],
    ["z.h", "দুলাভাই", "জামাইবাবু"],
    ["w.b", "সম্বন্ধী / শ্যালক", "সম্বন্ধী / শ্যালক"],
    ["w.z", "শ্যালিকা", "শ্যালিকা"],
    ["w.z.h", "ভায়রা", "ভায়রা"],
    ["h.b", "দেবর / ভাসুর", "দেবর / ভাসুর"],
    ["h.z", "ননদ", "ননদ"],
    ["h.b.w", "জা", "জা"],
    ["h.z.h", "নন্দাই", "নন্দাই"],
    ["b.s", "ভাতিজা", "ভাইপো"],
    ["b.d", "ভাতিজি", "ভাইঝি"],
    ["z.s", "ভাগনে", "ভাগনে"],
    ["s.w", "বউমা", "বউমা"],
    ["d.h", "জামাই", "জামাই"],
    ["s.w.f", "বেয়াই", "বেয়াই"],
    ["d.h.m", "বেয়ান", "বেয়ান"],
    ["b.w.f", "তালুই", "তালুই"],
    ["h.f", "শ্বশুর", "শ্বশুর"],
    ["w.m", "শাশুড়ি", "শাশুড়ি"],
    ["d.d", "নাতনি", "নাতনি"],
  ];
  for (const [key, chacha, kaka] of known) {
    assert.equal(term(key, "c"), chacha, key);
    assert.equal(term(key, "k"), kaka, key);
  }
});

test("cousin terms follow the cousin's sex and the parent's side", () => {
  assert.equal(term("f.b.s", "c"), "চাচাতো ভাই");
  assert.equal(term("f.b.d", "c"), "চাচাতো বোন");
  assert.equal(term("f.z.s", "c"), "ফুপাতো ভাই");
  assert.equal(term("m.b.d", "c"), "মামাতো বোন");
  assert.equal(term("m.z.s", "c"), "খালাতো ভাই");
  assert.equal(term("m.z.d", "k"), "মাসতুতো বোন");
  assert.equal(term("f.z.d", "k"), "পিসতুতো বোন");
  assert.equal(term("f.b.s", "k"), "খুড়তুতো / জেঠতুতো ভাই");
});

test("a chain with no word says so and builds the phrase people use", () => {
  const cousinWife = answerFor(c("f.b.s.w"), "c");
  assert.equal(cousinWife.unnamed, true);
  assert.equal(cousinWife.said, "চাচাতো ভাইয়ের স্ত্রী");
  assert.equal(answerFor(c("f.b.s.w"), "k").said, "খুড়তুতো বা জেঠতুতো ভাইয়ের স্ত্রী");
  assert.equal(phrase(c("z.h.b"), "c"), "দুলাভাইয়ের ভাই");
  assert.equal(phrase(c("f.f.f.f"), "c"), "দাদার বাবার বাবা");
  assert.equal(phrase(c("h.b.s"), "c"), "দেবর বা ভাসুরের ছেলে");
  assert.match(caption(c("f.b.s.w"), "c"), /আলাদা কোনো নাম নেই/);
});

test("a word sourced only in one style is shown for that style, the other gets the plain phrase", () => {
  const answer = answerFor(c("h.f.b"), "c");
  assert.equal(answer.term, null);
  assert.equal(answer.unnamed, false);
  assert.equal(answer.said, "শ্বশুরের ভাই");
  assert.equal(answer.other, "খুড়শ্বশুর / জেঠশ্বশুর");
});

test("loops back and impossible spouses are refused with who it really is", () => {
  assert.equal(stepProblem(c("f"), "w", "c"), "আব্বুর স্ত্রী মানে তো আম্মু। একটা মুছে “আম্মুর” ছোঁও।");
  assert.match(stepProblem(c("f"), "s", "c")!, /ভাই, নয়তো তুমি নিজেই/);
  assert.match(stepProblem(c("f.f"), "s", "c")!, /দাদার ছেলে মানে তো চাচা, নয়তো আব্বু নিজেই/);
  assert.match(stepProblem(c("f.f"), "d", "c")!, /দাদার মেয়ে মানে তো ফুপু।/);
  assert.match(stepProblem(c("f.b"), "f", "c")!, /চাচার আব্বু মানে তো দাদা/);
  assert.match(stepProblem(c("z.h"), "w", "c")!, /বোন নিজেই/);
  assert.match(stepProblem(c("f"), "h", "c")!, /স্ত্রী থাকে/);
  assert.match(stepProblem(c("m"), "w", "k")!, /মায়ের তো স্বামী থাকে/);
  assert.match(stepProblem(c("f.b.s.w"), "b", "c")!, /চার ধাপ/);
  assert.equal(stepProblem([], "h", "c"), null);
  assert.equal(stepProblem(c("f.z"), "h", "c"), null);
});

test("every reachable chain (1–4 steps) gets a sensible phrase in both styles", () => {
  const chains = allChains();
  assert.ok(chains.length > 400 && chains.length < 600, `chain count ${chains.length}`);
  for (const chain of chains) for (const style of ["c", "k"] as const) {
    const said = phrase(chain, style);
    assert.ok(said && !/undefined|null|\/|  /.test(said), `${chain.join(".")} → ${said}`);
  }
});

test("every named entry is a reachable chain with at least one word", () => {
  const reachable = new Set(allChains().map(chain => chain.join(".")));
  for (const [key, entry] of Object.entries(terms)) {
    assert.ok(reachable.has(key), `${key} is not reachable`);
    assert.ok(entry.c || entry.k, `${key} has no word`);
  }
  for (const step of STEPS) assert.ok(term(step, "c") && term(step, "k"), `single step ${step}`);
});

test("Bangla possessives of kin words", () => {
  assert.equal(kinPossessive("ভাই"), "ভাইয়ের");
  assert.equal(kinPossessive("মা"), "মায়ের");
  assert.equal(kinPossessive("জা"), "জায়ের");
  assert.equal(kinPossessive("আব্বু"), "আব্বুর");
  assert.equal(kinPossessive("ভাসুর"), "ভাসুরের");
  assert.equal(kinPossessive("স্ত্রী"), "স্ত্রীর");
  assert.equal(kinPossessive("নাতবউ"), "নাতবউয়ের");
  assert.equal(kinPossessive("দেবর / ভাসুর"), "দেবর বা ভাসুরের");
  assert.equal(chainText(c("f.z.h"), "c"), "আব্বুর বোনের স্বামী");
  assert.equal(chainText(c("m.b"), "k"), "মায়ের ভাই");
});

test("quiz options hold the answer and two different same-sex terms, the same every time", () => {
  const options = quizOptions(c("f.z.h"), "c")!;
  assert.equal(options.length, 3);
  assert.ok(options.includes("ফুপা"));
  assert.equal(new Set(options).size, 3);
  assert.ok(!options.some(option => ["ফুপু", "খালা", "চাচি", "মামি"].includes(option)));
  assert.deepEqual(quizOptions(c("f.z.h"), "c"), options);
  assert.equal(quizOptions(c("f.b.s.w"), "c"), null);
  for (const key of Object.keys(terms)) {
    const list = quizOptions(c(key), "c");
    if (term(key, "c")) assert.equal(list?.length, 3, key);
  }
});

test("a chain survives the share-link round trip", () => {
  const shared = { chain: c("m.z.h"), style: "k" as const, name: "রাফি" };
  assert.deepEqual(parseShareHash(shareHash(shared)), shared);
  assert.equal(shareHash({ chain: c("f.z.h"), style: "c", name: "" }), "#c=f.z.h");
  assert.deepEqual(parseShareHash("#c=f.z.h"), { chain: c("f.z.h"), style: "c", name: "" });
});

test("hostile, looping or oversized hashes are rejected", () => {
  for (const bad of ["", "#", "#c=", "#c=x", "#c=f.w", "#c=f.s", "#c=f.h", "#c=f.f.f.f.f", "#c=f..z", "#c=F.Z", "#c=f.z.h%00", "#c=<script>", "#c=" + "f.".repeat(500) + "f"]) {
    assert.equal(parseShareHash(bad), null, bad);
  }
  assert.equal(parseShareHash("#c=f.z.h&d=evil")?.style, "c");
  assert.ok(isValidChain(c("h.f.z.h")));
});

test("names are NFC, stripped of control and direction characters, and capped", () => {
  assert.equal(cleanName("  রিমা\u202e  আক্তার\n"), "রিমা আক্তার");
  assert.equal(cleanName("ক".repeat(MAX_NAME_LENGTH + 10)).length, MAX_NAME_LENGTH);
  const decomposed = "\u09af\u09bc";
  assert.equal(cleanName(decomposed), decomposed.normalize("NFC"));
  assert.equal(parseShareHash(shareHash({ chain: c("f"), style: "c", name: "ক".repeat(50) }))!.name.length, MAX_NAME_LENGTH);
});

test("share: normalize, a personal spoiler-free preview, and a tally over fixed ids only", () => {
  assert.equal(share.normalize("c=f.z.h&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF&junk=1"), "c=f.z.h&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  assert.equal(share.normalize("c=f.w"), null);
  const preview = share.preview(share.normalize("c=f.z.h&n=রাফি")!);
  assert.equal(preview.title, "রাফি জানতে চায়: আব্বুর বোনের স্বামী তোমার কী হয়?");
  assert.ok(!preview.title.includes("ফুপা") && !preview.description.includes("ফুপা"));
  assert.equal(share.preview("c=m.b&d=k").title, "এক বন্ধু জানতে চায়: মায়ের ভাই তোমার কী হয়?");
  assert.deepEqual(share.tally, tallyIds);
  assert.ok(share.tally!.every(id => /^[fmbzhwsd](\.[fmbzhwsd]){0,3}$/.test(id)));
});
