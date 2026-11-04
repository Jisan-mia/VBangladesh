import assert from "node:assert/strict";
import test from "node:test";
import { makeRng, pick } from "../../../shared/game-core";
import { site } from "../content";
import { share } from "../share";
import {
  clusters, demoWord, directions, dragLine, findAll, generate, joinConjuncts, lineBetween, nextHint, totalTime, wordAt,
  CELLS, HINT_SECONDS, SIZE, WORDS, type Level,
} from "../lib/grid";
import { band, bannerNote, caption, clock, compareLine, detail, feat, humanLine, kicker, parseShared, previewTitle, sharedHash, spoken, spokenIn, MAX_TIME, type Shared } from "../lib/link";
import { PACKS, packById } from "../lib/packs";

const contains = (outer: readonly string[], inner: readonly string[]) =>
  outer.length >= inner.length && outer.some((_, start) => inner.every((letter, k) => outer[start + k] === letter));

test("words split into whole letter clusters: conjuncts, ৎ, ং and nukta letters", () => {
  assert.deepEqual(clusters("কৃষ্ণচূড়া"), ["কৃ", "ষ্ণ", "চূ", "ড়া"]);
  assert.deepEqual(clusters("রজনীগন্ধা"), ["র", "জ", "নী", "গ", "ন্ধা"]);
  assert.deepEqual(clusters("কপোতাক্ষ"), ["ক", "পো", "তা", "ক্ষ"]);
  assert.deepEqual(clusters("শীতলক্ষ্যা"), ["শী", "ত", "ল", "ক্ষ্যা"], "two hasantas and a ya-phala stay one cell");
  assert.deepEqual(clusters("জ্যৈষ্ঠ"), ["জ্যৈ", "ষ্ঠ"]);
  assert.deepEqual(clusters("কার্তিক"), ["কা", "র্তি", "ক"], "reph rides on the next letter");
  assert.deepEqual(clusters("সূর্যমুখী"), ["সূ", "র্য", "মু", "খী"]);
  assert.deepEqual(clusters("শরৎ"), ["শ", "র", "ৎ"], "খণ্ড-ত is a letter of its own");
  assert.deepEqual(clusters("টেংরা"), ["টেং", "রা"], "অনুস্বার joins its letter");
  assert.deepEqual(clusters("হেমন্ত"), ["হে", "ম", "ন্ত"]);
  assert.deepEqual(clusters("জুঁই"), ["জুঁ", "ই"]);
  // ড় ঢ় য় are stored decomposed in NFC; a precomposed one from a keyboard splits the same way.
  assert.deepEqual(clusters("চিংড়ি"), clusters("চিংড়ি"));
  assert.deepEqual(clusters("চিংড়ি"), ["চিং", "ড়ি"]);
  assert.deepEqual(clusters("ময়ূর"), ["ম", "য়ূ", "র"]);
  assert.deepEqual(clusters("আষাঢ়"), ["আ", "ষা", "ঢ়"]);
});

test("old phones that break conjuncts at the hasanta get the same cells", () => {
  assert.deepEqual(joinConjuncts(["ক্", "ষ", "মা"]), ["ক্ষ", "মা"]);
  assert.deepEqual(joinConjuncts(["শী", "ত", "ল", "ক্", "ষ্", "যা"]), ["শী", "ত", "ল", "ক্ষ্যা"]);
  assert.deepEqual(joinConjuncts(["কা", "র্", "তি", "ক"]), ["কা", "র্তি", "ক"]);
  assert.deepEqual(joinConjuncts(["শ", "র", "ৎ"]), ["শ", "র", "ৎ"]);
});

test("packs: unique, NFC, every word 2–7 clean cells, none hidden inside another", () => {
  assert.equal(new Set(PACKS.map(pack => pack.id)).size, PACKS.length);
  assert.ok(PACKS.length >= 8);
  for (const pack of PACKS) {
    assert.ok(pack.words.length >= WORDS * 2, `${pack.id} needs variety`);
    assert.equal(new Set(pack.words).size, pack.words.length, `${pack.id} has a duplicate`);
    assert.match(pack.paper, /^#[0-9a-f]{6}$/);
    const split = pack.words.map(clusters);
    pack.words.forEach((word, index) => {
      assert.equal(word, word.normalize("NFC"), word);
      assert.ok(split[index].length >= 2 && split[index].length <= SIZE, `${word}: ${split[index].length} cells`);
      assert.equal(split[index].join(""), word);
      for (const cell of split[index]) assert.deepEqual(clusters(cell), [cell], `${word}: ${cell} is one cluster`);
    });
    split.forEach((outer, i) => split.forEach((inner, j) => {
      if (i === j) return;
      assert.ok(!contains(outer, inner) && !contains(outer, [...inner].reverse()), `${pack.words[j]} hides inside ${pack.words[i]}`);
    }));
  }
  assert.equal(packById("nope"), null);
});

test("the same seed, pack and level give the same grid; others differ", () => {
  for (const pack of PACKS) {
    assert.deepEqual(generate(4242, pack.id, 1), generate(4242, pack.id, 1));
    assert.notDeepEqual(generate(4242, pack.id, 0).grid, generate(4243, pack.id, 0).grid);
  }
  assert.notDeepEqual(generate(77, "mach", 0).grid, generate(77, "mach", 1).grid);
});

test("every grid: six different words, each placed and readable exactly once, filler from the pack's own letters", () => {
  let reversed = 0;
  for (const pack of PACKS) {
    const pool = new Set(pack.words.flatMap(clusters));
    for (const level of [0, 1] as Level[]) {
      const allowed = directions(level).map(([dr, dc]) => dr * SIZE + dc);
      for (let seed = 1; seed <= 120; seed++) {
        const puzzle = generate(seed * 7919, pack.id, level);
        assert.equal(puzzle.grid.length, CELLS);
        assert.ok(puzzle.grid.every(cell => pool.has(cell)), "no blank, no stray letter");
        assert.equal(puzzle.words.length, WORDS);
        assert.equal(new Set(puzzle.words.map(word => word.word)).size, WORDS);
        for (const word of puzzle.words) {
          assert.ok(pack.words.includes(word.word));
          word.cells.forEach((cell, k) => assert.equal(puzzle.grid[cell], word.letters[k]));
          const step = word.cells[1] - word.cells[0];
          assert.ok(allowed.includes(step), `${word.word} runs ${step} on level ${level}`);
          if (step < 0 || step === SIZE - 1) reversed++;
          const places = findAll(puzzle.grid, word.letters);
          assert.equal(places.length, 1, `${word.word} reads ${places.length} times in ${pack.id} #${seed * 7919}`);
          assert.deepEqual([...places[0]].sort((a, b) => a - b), [...word.cells].sort((a, b) => a - b));
        }
      }
    }
  }
  assert.ok(reversed > 100, "কঠিন really hides words backwards");
});

test("findAll counts a palindrome once and finds a word read backwards", () => {
  const grid = Array<string>(CELLS).fill("ক");
  grid[0] = "ঘু"; grid[1] = "ঘু";
  assert.equal(findAll(grid, ["ঘু", "ঘু"]).length, 1);
  grid[10] = "ম"; grid[9] = "আ";
  assert.equal(findAll(grid, ["আ", "ম"]).length, 1);
  assert.equal(findAll(grid, ["ম", "আ"]).length, 1, "the same cells, read the other way");
});

test("selections: straight lines only, either way round, the exact cells", () => {
  assert.deepEqual(lineBetween(0, 3), [0, 1, 2, 3]);
  assert.deepEqual(lineBetween(3, 0), [3, 2, 1, 0]);
  assert.deepEqual(lineBetween(0, 48), [0, 8, 16, 24, 32, 40, 48]);
  assert.deepEqual(lineBetween(6, 42), [6, 12, 18, 24, 30, 36, 42]);
  assert.deepEqual(lineBetween(2, 30), [2, 9, 16, 23, 30]);
  assert.equal(lineBetween(0, 9), null, "a knight's jump is not a line");
  assert.deepEqual(lineBetween(5, 5), [5]);

  assert.deepEqual(dragLine(0, 2.1, 0.3), [0, 1, 2], "a wobbly swipe snaps to the row");
  assert.deepEqual(dragLine(0, 2.2, 1.8), [0, 8, 16], "close to 45° is the diagonal");
  assert.deepEqual(dragLine(24, -0.2, -2.9), [24, 17, 10, 3]);
  assert.deepEqual(dragLine(5, 4, 0), [5, 6], "cut at the edge");
  assert.deepEqual(dragLine(5, 0.3, 0.2), [5], "a jitter is still a tap");

  const puzzle = generate(303, "phul", 0);
  const word = puzzle.words[2];
  assert.equal(wordAt(puzzle, word.cells), 2);
  assert.equal(wordAt(puzzle, [...word.cells].reverse()), 2, "swiping from the last letter counts");
  assert.equal(wordAt(puzzle, word.cells.slice(0, -1)), -1, "half a word is not a word");
  assert.equal(wordAt(puzzle, [word.cells[0]]), -1);
});

test("the teaching grid: ফুল, শাপলা struck from the start, read left to right", () => {
  const puzzle = generate(303, "phul", 0);
  const demo = puzzle.words[demoWord(puzzle)];
  assert.equal(demo.word, "শাপলা");
  assert.equal(demo.cells[1] - demo.cells[0], 1);
});

test("hints walk the unfound words in order and add ten seconds each", () => {
  const puzzle = generate(9, "pakhi", 1);
  assert.equal(nextHint(puzzle, [], []), 0);
  assert.equal(nextHint(puzzle, [0], []), 1);
  assert.equal(nextHint(puzzle, [1], [0]), 2);
  assert.equal(nextHint(puzzle, [0, 1, 2, 3, 4, 5], []), -1);
  assert.equal(totalTime(61.4, 0), 61);
  assert.equal(totalTime(61.6, 2), 62 + 2 * HINT_SECONDS);
});

test("score bands and the kind line, with কঠিন given more time", () => {
  assert.equal(band({ time: 45, level: 0 }), 0);
  assert.equal(band({ time: 80, level: 0 }), 1);
  assert.equal(band({ time: 80, level: 1 }), 0);
  assert.equal(band({ time: 200, level: 0 }), 2);
  assert.equal(band({ time: 600, level: 1 }), 3);
  const lines = [30, 100, 200, 900].map(time => humanLine({ time, level: 0 }));
  assert.equal(new Set(lines).size, 4);
  for (const line of lines) assert.doesNotMatch(line, /ধীর গতি|খারাপ|হেরে/);
});

/** A player who looks at a few letters a second, sometimes swipes wrong, and takes a hint when stuck. Seeded. */
function playOut(seed: number, packId: (typeof PACKS)[number]["id"], level: Level) {
  const rng = makeRng(seed * 13 + 5);
  const puzzle = generate(seed, packId, level);
  const found: number[] = [], hinted: number[] = [];
  let seconds = 0, misses = 0;
  for (let guard = 0; found.length < WORDS && guard < 500; guard++) {
    seconds += 2 + pick(rng, 9);
    if (rng() < 0.2) { misses += wordAt(puzzle, lineBetween(pick(rng, CELLS), pick(rng, CELLS)) ?? []) < 0 ? 1 : 0; continue; }
    if (seconds > 60 * (found.length + 1) && rng() < 0.3) { const next = nextHint(puzzle, found, hinted); if (next >= 0) hinted.push(next); }
    const target = puzzle.words.findIndex((_, index) => !found.includes(index));
    const cells = findAll(puzzle.grid, puzzle.words[target].letters)[0];
    const index = wordAt(puzzle, rng() < 0.5 ? cells : [...cells].reverse());
    if (index >= 0 && !found.includes(index)) found.push(index);
  }
  return { found, hinted, misses, time: totalTime(seconds, hinted.length) };
}

test("a headless run ends with all six found and a believable time", () => {
  for (const pack of PACKS) for (const level of [0, 1] as Level[]) {
    const run = playOut(31 + level, pack.id, level);
    assert.equal(run.found.length, WORDS);
    assert.ok(run.time >= 12 && run.time < MAX_TIME, String(run.time));
    const shared: Shared = { seed: 31 + level, pack: pack.id, level, demo: false, hints: run.hinted.length, time: run.time, name: "রাফি" };
    assert.deepEqual(parseShared(sharedHash(shared)), shared, "the run survives a link");
  }
});

test("time reads naturally", () => {
  assert.equal(clock(0), "০:০০");
  assert.equal(clock(135), "২:১৫");
  assert.equal(clock(5999), "৯৯:৫৯");
  assert.equal(spokenIn(45), "৪৫ সেকেন্ডে");
  assert.equal(spokenIn(120), "২ মিনিটে");
  assert.equal(spokenIn(75), "১ মিনিট ১৫ সেকেন্ডে");
  assert.equal(spoken(75), "১ মিনিট ১৫ সেকেন্ড");
  assert.equal(spoken(8), "৮ সেকেন্ড");
});

const rafi: Shared = { seed: 303, pack: "phul", level: 0, demo: true, hints: 1, time: 75, name: "রাফি" };

test("links: round trip, fixed order, personal preview", () => {
  const hash = sharedHash(rafi);
  assert.equal(hash, "s=303&t=75&p=phul&l=0&h=1&d=1&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  assert.deepEqual(parseShared(hash), rafi);
  assert.deepEqual(parseShared("#" + hash), rafi);
  assert.equal(share.normalize(hash), hash);
  assert.equal(previewTitle(rafi), "রাফি ফুলের ছয়টা শব্দ ১ মিনিট ১৫ সেকেন্ডে খুঁজে পেয়েছে। তুমি পারবে?");
  assert.equal(share.preview(hash).title, previewTitle(rafi));
  assert.equal(feat({ ...rafi, name: "", pack: "nodi" }), "এক বন্ধু নদীর ছয়টা শব্দ ১ মিনিট ১৫ সেকেন্ডে খুঁজে পেয়েছে");
  assert.match(bannerNote(rafi), /রাফির নিজের ফোনে/);
  assert.equal(detail(rafi), "৬টার ৬টা · সহজ · ১টা হিন্ট, +১০ সেকেন্ড");
  assert.match(caption(rafi), /^শব্দ খোঁজায় ফুলের ছয়টা শব্দ ১ মিনিট ১৫ সেকেন্ডে খুঁজে পেলাম \(১টা হিন্ট নিয়ে\)!/);
  const plain = sharedHash({ ...rafi, demo: false, name: "" });
  assert.equal(plain, "s=303&t=75&p=phul&l=0&h=1");
});

test("share normalize rejects hostile and out-of-range links, caps the rest", () => {
  const hash = sharedHash(rafi);
  assert.equal(share.normalize(hash + "&x=<script>alert(1)</script>"), hash, "unknown keys are dropped");
  const bad = [
    "", "junk", "s=303&t=75&l=0&h=1", "s=303&t=75&p=mango&l=0&h=1", "s=303&t=75&p=phul&l=2&h=1", "s=303&t=75&p=phul&h=1",
    "s=303&t=75&p=phul&l=0", "s=303&t=75&p=phul&l=0&h=7", "s=303&t=75&p=phul&l=0&h=-1", "s=303&t=75&p=phul&l=0&h=1.5",
    "s=303&t=75&p=phul&l=0&h=6&d=1", "s=303&t=75&p=phul&l=0&h=0&d=0", "s=303&t=75&p=phul&l=0&h=0&d=yes",
    "s=303&t=4&p=phul&l=0&h=0", "s=303&t=24&p=phul&l=0&h=2", `s=303&t=${MAX_TIME + 1}&p=phul&l=0&h=0`,
    "s=0&t=75&p=phul&l=0&h=0", "s=1000000000&t=75&p=phul&l=0&h=0", "s=-5&t=75&p=phul&l=0&h=0", "s=3.5&t=75&p=phul&l=0&h=0",
    "s=303&t=75&p=__proto__&l=0&h=0", "s=303&t=75&p=constructor&l=0&h=0", `s=303&t=75&p=phul&l=0&h=0&n=${"ক".repeat(700)}`,
  ];
  for (const state of bad) assert.equal(share.normalize(state), null, state);
  const long = share.normalize(`s=303&t=75&p=phul&l=0&h=0&n=${encodeURIComponent("রাফি‮\u0007 আহমেদ চৌধুরী সাহেবের ছেলে")}`)!;
  assert.ok(long);
  assert.equal(parseShared(long)!.name, "রাফি আহমেদ চৌধুরী সা", "control and direction marks gone, 20 code points at most");
  assert.equal(share.normalize("s=303&t=24&p=phul&l=0&h=1"), "s=303&t=24&p=phul&l=0&h=1", "five seconds plus one hint is the floor");
  assert.equal(share.normalize("s=303&t=1e3&p=phul&l=0&h=0"), "s=303&t=1000&p=phul&l=0&h=0", "odd number forms come back plain");
  assert.equal(share.preview("junk").title, "শব্দ খোঁজা: অক্ষরের ভিড়ে লুকানো বাংলা শব্দ");
  assert.equal(share.tally, undefined);
});

test("comparing with a friend is kind either way", () => {
  assert.equal(compareLine(55, rafi), "রাফির চেয়ে ২০ সেকেন্ড আগে!");
  assert.equal(compareLine(75, rafi), "একদম রাফির সমান সময়!");
  assert.equal(compareLine(83, rafi), "আর একটু হলেই! মাত্র ৮ সেকেন্ড পিছিয়ে।");
  assert.equal(compareLine(200, rafi), "এবার রাফি ২ মিনিট ৫ সেকেন্ড এগিয়ে। নতুন গ্রিডে আরেকবার দেখো!");
  assert.equal(compareLine(10, { ...rafi, name: "" }), "বন্ধুর চেয়ে ১ মিনিট ৫ সেকেন্ড আগে!");
});

test("content meets the SEO limits and speaks তুমি", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.headline && site.headline !== site.title);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.steps.length >= 3);
  assert.match(site.privacy.join(" "), /নাম/);
  assert.match(site.privacy.join(" "), /সময়/);
  const everything = JSON.stringify(site) + share.preview("").description;
  assert.doesNotMatch(everything, /করুন|আপনি|আপনার|দেখুন/);
  assert.doesNotMatch(everything, /টাকা জিত|বাজি|লটারি|পুরস্কার/);
  assert.match(site.faq.map(item => item.question).join(" "), /ফ্রি/);
  assert.match(site.faq.map(item => item.question).join(" "), /ইন্টারনেট/);
});

test("old level links (v) still open the same classic grid; forged ones are refused", () => {
  const level: Shared = { seed: 4821, pack: "mach", level: 1, demo: false, hints: 0, time: 80, name: "", stage: 10 };
  const hash = sharedHash(level);
  assert.equal(hash, "s=4821&t=80&p=mach&l=1&h=0&v=10");
  assert.deepEqual(parseShared(hash), level);
  assert.equal(share.normalize(hash), hash);
  assert.match(kicker(level), /^শব্দ খোঁজা · মাছ · কঠিন$/, "an old level number is not shown: the ladder has new numbers");
  assert.equal(parseShared("s=303&t=75&p=phul&l=0&h=1&d=1")!.stage, undefined, "a link from before levels has no level");
  assert.ok(parseShared("s=303&t=75&p=phul&l=0&h=1&d=1&v=1"), "old level 1 may carry the teaching grid");
  const forged = ["s=5&t=80&p=phul&l=1&h=0&v=10", "s=5&t=80&p=mach&l=0&h=0&v=10", "s=5&t=80&p=phul&l=0&h=0&v=0", "s=5&t=80&p=phul&l=0&h=0&v=25",
    "s=5&t=80&p=mach&l=1&h=0&d=1&v=10", "s=5&t=80&p=phul&l=0&h=0&v=x", "s=5&t=80&p=phul&l=0&h=0&v=1.0"];
  for (const state of forged) assert.equal(share.normalize(state), null, state);
});
