import assert from "node:assert/strict";
import test from "node:test";
import { makeRng, readLevels, recordLevel, unlockedLevel } from "../../../shared/game-core";
import { site } from "../content";
import { share } from "../share";
import { generate as oldGenerate } from "../lib/board";
import {
  bannerNote, caption, clearLine, clock, compareLine, feat, finishTitle, hintLine, humanLine, lossLine, nearMissLine, parseShared, previewTitle, sharedHash, sharedStars, stingLine, timeText, worldTotal, MAX_SECONDS, type Shared,
} from "../lib/challenge";
import { countAt, easeOut, humLevel, rippleDelay } from "../lib/count.hot";
import { legacyOrchard, legacySpec } from "../lib/legacy";
import { LEVEL_COUNT, levelOf } from "../lib/levels";
import { deduce, flood, generate, knownFrom, lay, near, proveSafe, solve, watched, MANGO, PLAIN, POST, type Orchard } from "../lib/orchard";
import {
  dig, enter, findHint, lessonStep, nestsLeft, newRound, nextStar, openCount, puzzleOf, safeCount, starsEarned, takeHint, tie, twoStarTime, wrongTies, COVERED, OPEN, STUNG, TIED, type Round,
} from "../lib/play";
import { OPEN_KEY, bestSlug, openAfter, readOpen, startLevel } from "../lib/save";

const levels = Array.from({ length: LEVEL_COUNT }, (_, index) => index + 1);
const started = (level: number, seed: number) => enter(newRound(puzzleOf(level, seed)!))!.round;
/** A hand-made orchard for exact rule checks. */
function orchardOf(rows: string[], kinds: Record<number, number> = {}): Orchard {
  const cols = rows[0].length, size = cols * rows.length, nest = new Uint8Array(size), kind = new Uint8Array(size), count = new Uint8Array(size);
  rows.join("").split("").forEach((ch, cell) => { if (ch === "*") nest[cell] = 1; });
  for (const [cell, k] of Object.entries(kinds)) kind[Number(cell)] = k;
  const n = near(cols, rows.length);
  for (let cell = 0; cell < size; cell++) count[cell] = kind[cell] === MANGO ? 0 : (kind[cell] === POST ? n.four[cell] : n.eight[cell]).reduce((s, o) => s + nest[o], 0);
  return { cols, rows: rows.length, nests: nest.reduce((s, v) => s + v, 0), start: size - 1, nest, kind, count };
}

// ---- the orchard engine ----

test("numbers: a plain bush counts 8 neighbours, a post only the 4 sides, a mango says nothing", () => {
  const o = orchardOf(["*..", "...", "..."], { 4: POST });
  assert.equal(o.count[1], 1);
  assert.equal(o.count[4], 0, "the post at the centre doesn't see the corner nest");
  assert.deepEqual([...watched(o, 4)].sort(), [1, 3, 5, 7]);
  const m = orchardOf(["*..", "...", "..."], { 4: MANGO });
  assert.equal(m.count[4], 0);
  assert.deepEqual(watched(m, 4), []);
  assert.equal(watched(o, 8).length, 3);
});

test("flood: a 0 opens all it watches; a post's 0 opens its 4 sides; it never floods through a mango or onto a nest", () => {
  const o = orchardOf(["*....", ".....", "....."]);
  const open = new Uint8Array(15), opened = flood(o, open, 14);
  assert.equal(open[0], 0);
  assert.equal(opened.length, 14);
  assert.deepEqual(flood(o, open, 14), [], "already open");
  assert.deepEqual(flood(o, new Uint8Array(15), 0), [], "a nest never opens");
  const post = orchardOf(["*.*", "...", "*.*"], { 4: POST }), open2 = new Uint8Array(9);
  assert.equal(post.count[4], 0, "four nests on the corners, none on the sides");
  flood(post, open2, 4);
  assert.deepEqual([...open2], [0, 1, 0, 1, 1, 1, 0, 1, 0]);
  const mango = orchardOf(["*..", "...", "..."], { 4: MANGO }), open3 = new Uint8Array(9);
  assert.equal(flood(mango, open3, 4).length, 1, "a mango opens alone");
});

test("the solver: every step it proves is true, on random orchards with posts and mangoes", () => {
  const rng = makeRng(99);
  for (let trial = 0; trial < 300; trial++) {
    const o = lay({ cols: 8, rows: 10, nests: 14, posts: trial % 4, mangoes: trial % 3 }, 70 + (trial % 8), rng), open = new Uint8Array(80);
    flood(o, open, o.start);
    const known = knownFrom(open);
    for (let step = deduce(o, known), guard = 0; step && guard < 200; step = deduce(o, known), guard++) {
      for (const cell of step.cells) assert.equal(o.nest[cell], step.safe ? 0 : 1, `trial ${trial}: ${step.via} step wrong`);
      for (const cell of step.cells) known[cell] = step.safe ? 1 : 2;
      if (step.safe) for (const cell of step.cells) for (const [at] of flood(o, open, cell)) known[at] = 1;
    }
    const proved = proveSafe(o, open);
    if (proved.cell >= 0) { assert.equal(o.nest[proved.cell], 0); assert.equal(open[proved.cell], 0); }
  }
});

test("the generator: same seed, same orchard; a different seed, a different one; the entry and its ring never hold a nest", () => {
  const shape = levelOf(30)!;
  const a = generate(shape, 777), b = generate(shape, 777), c = generate(shape, 778);
  assert.deepEqual([...a.orchard.nest], [...b.orchard.nest]);
  assert.deepEqual([...a.orchard.kind], [...b.orchard.kind]);
  assert.equal(a.orchard.start, b.orchard.start);
  assert.notDeepEqual([...a.orchard.nest], [...c.orchard.nest]);
  for (const cell of [a.orchard.start, ...near(shape.cols, shape.rows).eight[a.orchard.start]]) assert.equal(a.orchard.nest[cell], 0);
  assert.equal(a.orchard.nest.reduce((s, v) => s + v, 0), shape.nests);
});

// ---- the rules of a round ----

test("entering opens the path; level 1 always finds its lesson, and its three steps run in order", () => {
  for (let seed = 1; seed <= 120; seed++) {
    const ready = newRound(puzzleOf(1, seed * 31)!);
    assert.equal(lessonStep(ready), 1);
    assert.equal(dig(ready, 0), null, "nothing digs before you enter");
    const round = enter(ready)!.round, teach = round.lesson!;
    assert.ok(teach, `seed ${seed}`);
    assert.equal(enter(round), null, "you enter once");
    assert.equal(round.cells[round.puzzle.orchard.start], OPEN);
    assert.equal(lessonStep(round), 2);
    const tied = tie(round, teach.nest)!;
    assert.equal(lessonStep(tied), 3);
    let done: Round = tied;
    for (const cell of teach.safe) done = dig(done, cell)?.round ?? done;
    assert.equal(lessonStep(done), 0);
  }
  assert.equal(lessonStep(newRound(puzzleOf(2, 5)!)), 0);
});

test("rules: a গামছা blocks a tap, a number clears around its tied nests, a sting is forgiven twice, the third brings the swarm", () => {
  const round = started(5, 4242), o = round.puzzle.orchard;
  const covered = [...round.cells.keys()].find(cell => round.cells[cell] === COVERED)!;
  const tied = tie(round, covered)!;
  assert.equal(tied.cells[covered], TIED);
  assert.equal(nestsLeft(tied), o.nests - 1);
  assert.equal(dig(tied, covered), null, "a tied bush can't be cleared");
  assert.equal(tie(tied, covered)!.cells[covered], COVERED);
  assert.equal(tie(round, o.start), null, "open ground can't be tied");
  assert.equal(dig(round, o.start), null, "tapping an open 0 does nothing");

  // A chord: an open number with all its nests tied clears the rest of its bushes.
  const number = [...round.cells.keys()].find(cell => round.cells[cell] === OPEN && o.count[cell] && watched(o, cell).some(x => round.cells[x] === COVERED && !o.nest[x]));
  assert.ok(number !== undefined);
  assert.equal(dig(round, number!), null, "not until its nests are all tied");
  let ready = round;
  for (const other of watched(o, number!)) if (o.nest[other] && ready.cells[other] === COVERED) ready = tie(ready, other)!;
  const chord = dig(ready, number!)!;
  assert.ok(chord.opened.length > 0 && !chord.stung.length);
  for (const other of watched(o, number!)) assert.equal(chord.round.cells[other], o.nest[other] ? TIED : OPEN);

  // Stings: the nests the hornets forgive (2 here), then the swarm.
  const nests = [...o.nest.keys()].filter(cell => o.nest[cell] && round.cells[cell] === COVERED);
  let r = round;
  for (let k = 0; k < 2; k++) {
    const move = dig(r, nests[k])!;
    assert.deepEqual(move.stung, [nests[k]]);
    assert.ok(!move.lost);
    assert.equal(move.round.cells[nests[k]], STUNG);
    assert.equal(move.round.stings, k + 1);
    assert.equal(dig(move.round, nests[k]), null, "a stung nest can't be tapped again");
    r = move.round;
  }
  const last = dig(r, nests[2])!;
  assert.ok(last.lost);
  assert.equal(last.round.status, "lost");
  assert.equal(last.round.hit, nests[2]);
  assert.equal(dig(last.round, 0), null, "nothing moves after the end");
  // A finale forgives one.
  const finale = started(10, 9), fNests = [...finale.puzzle.orchard.nest.keys()].filter(c => finale.puzzle.orchard.nest[c]);
  assert.equal(finale.puzzle.forgive, 1);
  assert.ok(!dig(finale, fNests[0])!.lost);
  assert.ok(dig(dig(finale, fNests[0])!.round, fNests[1])!.lost);
});

test("a wrong গামছা makes a chord set the hidden nest off, and the end screen shows the wrong tie", () => {
  for (let seed = 1; seed < 200; seed++) {
    const round = started(4, seed), o = round.puzzle.orchard;
    const one = [...round.cells.keys()].find(cell => round.cells[cell] === OPEN && o.kind[cell] === PLAIN && o.count[cell] === 1
      && watched(o, cell).some(x => round.cells[x] === COVERED && !o.nest[x]) && watched(o, cell).some(x => round.cells[x] === COVERED && o.nest[x]));
    if (one === undefined) continue;
    const fake = watched(o, one).find(x => round.cells[x] === COVERED && !o.nest[x])!, real = watched(o, one).find(x => o.nest[x])!;
    const move = dig(tie(round, fake)!, one)!;
    assert.deepEqual(move.stung, [real]);
    assert.deepEqual(wrongTies(move.round), [fake]);
    return;
  }
  assert.fail("no orchard had the pattern");
});

test("hints: always a safe bush, with the numbers that prove it; hints alone clear any level, every nest tied at the end", () => {
  for (const level of [1, 5, 12, 20, 24, 30]) {
    let round = started(level, 31337 + level), guard = 0;
    while (round.status === "playing" && guard++ < 400) {
      const hint = findHint(round)!;
      assert.ok(hint.cell >= 0 && !round.puzzle.orchard.nest[hint.cell], `level ${level}: the hint is safe`);
      for (const clue of hint.clues) assert.equal(round.cells[clue], OPEN, "a clue is a cleared number");
      assert.ok(hintLine(hint).length > 10);
      round = takeHint(round)!.round;
    }
    assert.equal(round.status, "won", `level ${level}`);
    assert.equal(openCount(round.cells), safeCount(round.puzzle.orchard));
    assert.equal(nestsLeft(round), 0);
  }
});

test("a careless player tapping at random ends sanely: won or swarmed, never stuck", () => {
  const rng = makeRng(2026);
  let losses = 0;
  for (let k = 0; k < 60; k++) {
    let round = started(1 + (k % 30), 500 + k), guard = 0;
    while (round.status === "playing" && guard++ < 600) { const move = dig(round, Math.floor(rng() * round.cells.length)); if (move) round = move.round; }
    assert.ok(round.status === "won" || round.status === "lost");
    if (round.status === "lost") losses++;
  }
  assert.ok(losses > 30, "random tapping mostly meets the swarm");
});

// ---- stars ----

test("stars: time against par, twice par for two, and each hint or sting lowers the ceiling", () => {
  const par = levelOf(12)!.par;
  assert.equal(twoStarTime(par), par * 2);
  assert.equal(starsEarned(par, 0, 0, par), 3);
  assert.equal(starsEarned(par + 1, 0, 0, par), 2);
  assert.equal(starsEarned(par * 2 + 1, 0, 0, par), 1);
  assert.equal(starsEarned(10, 1, 0, par), 2);
  assert.equal(starsEarned(10, 0, 1, par), 2);
  assert.equal(starsEarned(10, 1, 1, par), 1);
  assert.equal(starsEarned(10, 9, 2, par), 1);
  assert.equal(nextStar(par, 0, 0, par), null);
  assert.deepEqual(nextStar(par + 12, 0, 0, par), { goal: 3, seconds: 12, help: 0 });
  assert.deepEqual(nextStar(10, 0, 1, par), { goal: 3, seconds: 0, help: 1 });
  assert.equal(nearMissLine(nextStar(par + 12, 0, 0, par)), "আর ১২ সেকেন্ড আগে হলে ৩ তারা।");
  assert.equal(nearMissLine(nextStar(10, 1, 0, par)), "১টা হিন্ট বা ভুল কম হলে ৩ তারা।");
  assert.equal(nearMissLine(null), "");
});

// ---- what the phone keeps ----

test("saved progress: stars stay in the old key, your open level is set once from them, and only your own clears open the next", () => {
  // Migration: a player with old stars on 1–4 keeps every level open that the old game opened.
  assert.equal(readOpen(null, { 1: 3, 2: 2, 3: 1, 4: 1 }), 5);
  assert.equal(readOpen(null, {}), 1);
  assert.equal(readOpen("7", { 1: 3 }), 7, "once saved, the saved level wins");
  assert.equal(readOpen("0", {}), 1);
  assert.equal(readOpen("99", { 1: 1 }), 2);
  assert.equal(readOpen("x", {}), 1);
  assert.equal(OPEN_KEY, "ektukhani-bhimruler-chak-open");
  assert.equal(openAfter(1, 1), 2);
  assert.equal(openAfter(4, 2), 4, "replaying a lower level opens nothing new");
  assert.equal(openAfter(1, 12), 1, "a friend's far-ahead level opens nothing in between");
  assert.equal(openAfter(30, 30), 30);
  assert.equal(startLevel({ 1: 3, 2: 3, 3: 1 }, 4), 4);
  assert.equal(startLevel({ 1: 3, 2: 3, 3: 3, 4: 3 }, 4), 4);
  assert.equal(startLevel({ 1: 3, 2: 1, 3: 3 }, 3), 2);
  let saved = readLevels(JSON.stringify({ 1: 3, 2: 2, 31: 3, 0: 1, x: 2, 3: 7 }), LEVEL_COUNT);
  assert.deepEqual(saved, { 1: 3, 2: 2 });
  saved = recordLevel(saved, 2, 1);
  assert.equal(saved[2], 2, "a worse result never lowers the stars");
  assert.equal(unlockedLevel(saved, LEVEL_COUNT), 3);
  assert.equal(bestSlug(4, false), "bhimruler-chak-v2-l4");
  assert.equal(bestSlug(4, true), "bhimruler-chak-l4", "an old link's orchard keeps the old best");
});

// ---- links ----

test("a new link round-trips and rebuilds the same orchard, with hints and stings", () => {
  const shared: Shared = { level: 12, legacy: false, seed: 4321, first: -1, seconds: 130, hints: 1, stings: 1, name: "রাফি" };
  const hash = sharedHash(shared);
  assert.match(hash, /v=2/);
  assert.doesNotMatch(hash, /f=/);
  assert.deepEqual(parseShared(`#${hash}`), shared);
  assert.equal(previewTitle(shared), "রাফি লেভেল ১২-এর বাগান ২ মিনিট ১০ সেকেন্ডে সাফ করেছে। তুমি পারবে?");
  assert.equal(feat({ level: 10, legacy: false, seconds: 9, name: "" }), "এক বন্ধু বুড়ো আমগাছ ৯ সেকেন্ডে সাফ করেছে");
  assert.match(bannerNote(shared), /১বার হিন্ট, ১বার ভুল নিয়ে।.*রাফির নিজের ফোনের হিসাব/);
  assert.equal(parseShared(sharedHash({ ...shared, seconds: 99999 }))!.seconds, MAX_SECONDS);
  assert.equal(sharedStars(shared), 1);
  assert.equal(share.normalize(hash), hash);
  assert.match(share.preview(hash).title, /রাফি/);
  const mine = puzzleOf(12, 4321)!.orchard, theirs = puzzleOf(12, parseShared(hash)!.seed)!.orchard;
  assert.deepEqual([...mine.nest], [...theirs.nest], "the friend gets the very same orchard");
});

test("an old link (no v) still parses and rebuilds the old orchard exactly, around the friend's first tap", () => {
  // A link shared before the rewrite, in the exact old format.
  const old = "s=4321&t=130&l=12&f=17&h=1&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF";
  const shared = parseShared(`#${old}`)!;
  assert.deepEqual(shared, { level: 12, legacy: true, seed: 4321, first: 17, seconds: 130, hints: 1, stings: 0, name: "রাফি" });
  assert.equal(sharedHash(shared), old, "it writes back the same old link");
  const { cols, rows, nests } = legacySpec(12)!;
  const before = oldGenerate(cols, rows, nests, 4321, 17).board, now = legacyOrchard(12, 4321, 17).orchard;
  assert.deepEqual([...now.nest], [...before.nest]);
  assert.deepEqual([...now.count], [...before.count]);
  const p = puzzleOf(12, 4321, true, 17)!;
  assert.equal(p.par, legacySpec(12)!.par);
  assert.equal(p.forgive, 0, "an old orchard keeps the old rule: one nest and everyone runs");
  const round = enter(newRound(p))!.round;
  assert.equal(round.cells[17], OPEN);
  assert.ok(parseShared("#s=77&t=30&l=30&f=125"), "the last bush of the old biggest orchard is fine");
  assert.equal(parseShared("#s=77&t=30&l=30&f=126"), null);
});

test("forged, broken or hostile links are refused", () => {
  const good = new URLSearchParams(sharedHash({ level: 1, legacy: false, seed: 77, first: -1, seconds: 30, hints: 0, stings: 0, name: "মিম" }));
  const variant = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(good);
    for (const [key, value] of Object.entries(changes)) value === null ? params.delete(key) : params.set(key, value);
    return params.toString();
  };
  for (const bad of [
    variant({ t: "0" }), variant({ t: String(MAX_SECONDS + 1) }), variant({ t: "1.5" }), variant({ t: "-3" }),
    variant({ l: "31" }), variant({ l: "0" }), variant({ l: "01" }), variant({ l: null }), variant({ l: "1e1" }),
    variant({ v: "3" }), variant({ v: "" }), variant({ f: "5" }), variant({ x: "3" }), variant({ x: "a" }), variant({ l: "10", x: "2" }),
    variant({ h: "10" }), variant({ h: "" }), variant({ h: "x" }), variant({ s: "0" }), variant({ s: "1000000000" }),
    variant({ v: null }), variant({ v: null, f: "36" }), variant({ v: null, f: "-1" }), variant({ v: null, f: "05" }), variant({ v: null, f: "5", x: "1" }),
    "", "#", "garbage", "s=1&t=1", `#${"a".repeat(700)}`, "<script>alert(1)</script>",
  ]) {
    assert.equal(parseShared(bad), null, bad);
    assert.equal(share.normalize(bad), null);
  }
  const hostile = parseShared(variant({ n: "‮রাফি\u0000" + "ক".repeat(40) }))!;
  assert.ok(hostile.name.length <= 20 && !hostile.name.includes("‮"));
  assert.ok(share.preview("junk").title.length > 0);
});

// ---- words ----

test("lines are kind, exact and fit the result", () => {
  assert.equal(timeText(45), "৪৫ সেকেন্ড");
  assert.equal(timeText(130), "২ মিনিট ১০ সেকেন্ড");
  assert.equal(timeText(180), "৩ মিনিট");
  assert.equal(clock(65), "০১:০৫");
  assert.equal(lossLine(2), "আর মাত্র ২টা ঝোপ বাকি ছিল!");
  assert.match(lossLine(17), /কেউ হুল খায়নি। আর ১৭টা ঝোপ বাকি ছিল।/);
  for (const level of levels) assert.ok(clearLine(level).length > 10);
  assert.match(clearLine(10), /বুড়ো গাছটার/);
  assert.match(clearLine(30), /৩০টা বাগানের/);
  assert.equal(finishTitle(20, false, true), "ফজলির বাগান সাফ");
  assert.equal(finishTitle(3, false, true), "লেভেল ৩ সাফ");
  assert.match(finishTitle(3, false, false), /দৌড়/);
  assert.equal(humanLine(3, 0, 0), "ভিমরুলেরা টেরই পায়নি।");
  assert.match(humanLine(2, 2, 0), /২বার হিন্ট/);
  assert.match(humanLine(2, 0, 1), /একবার জেগেছিল/);
  assert.match(stingLine(1), /আর ১বার ভুল/);
  assert.match(stingLine(0), /আর একটা ভুল হলেই/);
  assert.equal(compareLine(40, 60, "রাফি"), "রাফির চেয়ে ২০ সেকেন্ড আগে!");
  assert.equal(compareLine(60, 60, "রাফি"), "একদম সমান! রাফিও ১ মিনিট নিয়েছিল।");
  assert.match(compareLine(200, 60, ""), /বন্ধু এখনো ২ মিনিট ২০ সেকেন্ড এগিয়ে/);
  assert.match(caption({ level: 3, legacy: false, seconds: 42 }), /৫টা চাক এড়িয়ে.*৪২ সেকেন্ডে/);
  assert.equal(worldTotal(10, { 1: 3, 2: 2, 10: 1 }), "বাড়ির পেছনের ১০টা বাগান: ★ ৬/৩০");
});

test("hot maths: the clock read, the count-up and the hum are plain numbers", () => {
  assert.equal(easeOut(0), 0); assert.equal(easeOut(1), 1); assert.equal(easeOut(2), 1);
  assert.equal(countAt(90, 1), 90); assert.equal(countAt(90, 0), 0);
  assert.equal(humLevel(0), 0); assert.ok(humLevel(2) > humLevel(1));
  assert.equal(rippleDelay(3, true), 0); assert.equal(rippleDelay(40, false), rippleDelay(16, false));
});

test("content meets the SEO limits and speaks তুমি", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.match(site.title, /^সংখ্যার ধাঁধা গেম/);
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.headline && site.headline !== site.title);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.faq.some(item => item.question === "কয়টা লেভেল আছে?"));
  assert.ok(site.faq.some(item => /ঝরা আম/.test(item.answer)) && site.faq.some(item => /খুঁটি/.test(item.answer)));
  for (const word of ["নাম", "সময়", "লেভেল", "সিড", "হিন্ট"]) assert.match(site.privacy.join(" "), new RegExp(word));
  assert.doesNotMatch(JSON.stringify(site), /আপনি|করুন|দেখুন|mine|মাইন|বোমা|minesweeper/i);
  assert.equal(JSON.stringify(site), JSON.stringify(site).normalize("NFC"));
});
