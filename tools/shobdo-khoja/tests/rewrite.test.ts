// The rewrite: every statechart bug replayed against the pure logic, the ladder as data, forgiving strokes, links old and
// new, saved progress and its one-time migration, and the bot-tuned star rates.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { recordLevel, unlockedLevel } from "../../../shared/game-core";
import { BACKWARDS, DIRS, build, clueOf, clusters, findAll, generate, type Dir } from "../lib/grid";
import { isDone, match, newRound, strike, takeHint, RUN_SECONDS } from "../lib/game";
import { PER_WORLD, STAGES, STAGE_COUNT, TEACH_SEED, WORLDS, finaleName, isFinale, stageAt, worldOf, worldStart } from "../lib/levels";
import { caption, detail, feat, kicker, pageNear, pageStars, parseShared, previewTitle, sharedHash, spoken, spokenIn, type Shared } from "../lib/link";
import { PACKS } from "../lib/packs";
import * as session from "../lib/session";
import { cellAt, dragInto, octantOf } from "../lib/drag.hot";
import { edgeDanger, starTimeUsed, starsOnTrack } from "../lib/tick.hot";
import { migrateOld, openAfter, readFree, readOpen, startLevel, writeFree } from "../lib/save";
import { share } from "../share";
import { site } from "../content";
import { bot, PLAYERS } from "./bot";

const component = readFileSync(new URL("../components/shobdo-game.tsx", import.meta.url), "utf8");
const readStroke = (from: number, dx: number, dy: number, size: number, held = -1) => {
  const out = new Int16Array(8), meta = Int16Array.of(1, held);
  const count = dragInto(out, meta, from, dx, dy, size);
  return { cells: Array.from(out.subarray(0, count)), held: meta[1] };
};

// ---- old links rebuild the same grids ----
test("classic grids are byte for byte the grids before the rewrite (old links still open the same page)", () => {
  // Checksums taken from the generator before the rewrite, 8 seeds per pack and difficulty.
  const pinned: Record<string, string> = {
    phul0: "438bf0cff2b568e4", phul1: "939c3adf3885b0d4", mach0: "77cd29f4dc98e224", mach1: "6ac04971617bf238", pitha0: "8f2fceb8b790c82f", pitha1: "2dce52d400401df0",
    phol0: "aa52009c8f65f100", phol1: "9effbaba4c9a6675", pakhi0: "ec11d290052b2851", pakhi1: "3af7436b018c5db4", khela0: "24b1291760b4695d", khela1: "63836f1c2d7cfb26",
    ritu0: "3923a8755e6c1b95", ritu1: "2f87c79384ddce71", nodi0: "b00caa37ae9187d9", nodi1: "3894b38c34760e5e",
  };
  for (const pack of PACKS) for (const level of [0, 1] as const) {
    const hash = createHash("sha256");
    for (const seed of [1, 7, 303, 4242, 4821, 99991, 123456789, 999999999]) { const p = generate(seed, pack.id, level); hash.update(JSON.stringify([p.grid, p.words.map(w => w.cells)])); }
    assert.equal(hash.digest("hex").slice(0, 16), pinned[`${pack.id}${level}`], `${pack.id} ${level}`);
  }
});

// ---- bug 1: NoStrokeUnderThePauseCard ----
test("bug 1 · NoStrokeUnderThePauseCard: a pause lifts the pen, and nothing strikes until চালিয়ে যাও", () => {
  let s = session.begin(session.ready(), 0);
  assert.equal(session.canMove(s), true);
  s = session.pause(s, 2000, "away");                        // you touch a letter, then the tab hides
  assert.equal(session.canMove(s), false, "a stroke finished under the pause card counts for nothing");
  s = session.resume(s, 9000, "away");
  assert.equal(session.canMove(s), true);
  // The component: every way in checks the clock is running, and every pause drops the finger.
  assert.match(component, /function pauseFor\(why: session\.Why\) \{\n\s+cancelPress\(\);/);
  assert.match(component, /function letGo\(stroke: readonly number\[\]\) \{\n\s+if \(!session\.canMove\(now\.current\.run\)\) return;/);
  assert.match(component, /function tap\(cell: number\) \{\n\s+if \(!session\.canMove\(now\.current\.run\)\) return;/);
  assert.match(component, /function hint\(\) \{\n\s+if \(!session\.canMove\(now\.current\.run\)\) return;/);
  assert.match(component, /if \(!session\.canMove\(now\.current\.run\)\) \{ cancelPress\(\); return; \}/, "a move after a pause ends the stroke");
  assert.match(component, /cancelPress\(\);\n\s+if \(!session\.canMove\(now\.current\.run\)\) return;\n\s+if \(!held\.moved\)/, "pointerup after a pause strikes nothing");
});

// ---- bug 2: NoProgressWhileAway ----
test("bug 2 · NoProgressWhileAway: clicking into another window stops the clock", () => {
  let s = session.begin(session.ready(), 1000);
  assert.equal(session.elapsed(s, 3000), 2);                   // ০:০২ at the blur
  s = session.pause(s, 3000, "away");
  assert.equal(session.elapsed(s, 8000), 2, "still ০:০২ five seconds later");
  assert.match(component, /window\.addEventListener\("blur", away\)/);
  assert.match(component, /document\.addEventListener\("visibilitychange", hide\)/);
  assert.match(component, /onPause: \(\) => pauseFor\("away"\)/);
});

// ---- bug 3: InputReleasedWhenAway ----
test("bug 3 · InputReleasedWhenAway: after a blur no finger counts as on the grid", () => {
  assert.match(component, /function cancelPress\(\) \{ press\.current = null; hideTrail\(\); \}/);
  assert.match(component, /const away = \(\) => pauseFor\("away"\);/, "blur goes through pauseFor, which cancels the press");
  assert.match(component, /onPointerCancel=\{cancelPress\} onLostPointerCapture=\{cancelPress\}/);
  assert.match(component, /function onPointerDown[^]*?if \(!event\.isPrimary \|\| !session\.canMove\(now\.current\.run\)\) return;/, "a press needs a running clock");
});

// ---- bug 4: UnlockOnlyByClearing ----
test("bug 4 · UnlockOnlyByClearing: a friend's far-ahead level records its stars but opens nothing in between", () => {
  let stars = {}, open = readOpen(null, stars, null);
  assert.equal(open, 1, "a new phone has level 1");
  // The live replay: a friend's level-20 link, solved on a clean phone.
  stars = recordLevel(stars, 20, 3);
  open = openAfter(open, 20);
  assert.equal(open, 1, "levels 2 to 20 stay closed for your own play");
  assert.equal(unlockedLevel(stars, STAGE_COUNT), 21, "the shared rule is untouched (migrations rely on it)");
  assert.equal(readOpen("1", stars, null), 1, "and a reload keeps your own unlock, not the shared rule's");
  open = openAfter(open, 1);
  assert.equal(open, 2, "your own clear opens the next level");
  assert.equal(openAfter(STAGE_COUNT, STAGE_COUNT), STAGE_COUNT);
  for (const raw of ["0", "33", "x", "2.5"]) assert.equal(readOpen(raw, { 1: 3 }, null), 2, raw);
  assert.match(component, /if \(read\(OPEN_KEY\) === null\) write\(OPEN_KEY, String\(mine\)\)/, "the first visit writes the migrated value once");
  assert.match(component, /const opened = openAfter\(open, g\.page\);/);
  assert.match(component, /const canPick = \(to: number\) => to >= 1 && to <= STAGE_COUNT && \(to <= open \|\| to === visit\);/, "the friend's own level is the only extra one");
});

test("the old 24-level ladder migrates once, generously, and never shrinks what was open", () => {
  assert.equal(migrateOld({}), 1);
  assert.equal(migrateOld({ 1: 3 }), worldStart(1), "old level 1 (ফুল) cleared: the মাছ world opens");
  assert.equal(migrateOld({ 1: 3, 2: 2, 3: 1 }), worldStart(3));
  assert.equal(migrateOld({ 8: 1 }), worldStart(7), "all eight packs reached");
  assert.equal(migrateOld({ 12: 3 }), worldStart(7));
  assert.equal(migrateOld({ 17: 1 }), STAGE_COUNT, "into the third round: everything");
  assert.equal(readOpen(null, { 6: 3 }, JSON.stringify({ 1: 3 })), 7, "the higher of the new stars and the old ladder");
  assert.equal(readOpen(null, {}, JSON.stringify({ 3: 2 })), worldStart(3));
  assert.equal(readOpen(null, {}, "{broken"), 1);
  assert.equal(startLevel(4), 4, "a visit opens on the furthest level reached");
  assert.deepEqual(readFree(null), { pack: "phul", level: 0 });
  assert.deepEqual(readFree(writeFree("nodi", 1)), { pack: "nodi", level: 1 });
  assert.deepEqual(readFree("__proto__.1"), { pack: "phul", level: 1 });
});

// ---- choices pause, and leaving a started page asks ----
test("choices: the sheet stops the clock, and only a yes throws a started page away", () => {
  let s = session.begin(session.ready(), 0);
  assert.equal(session.started(s), true);
  s = session.pause(s, 5000, "sheet");                        // you open সব লেভেল
  assert.equal(session.elapsed(s, 60_000), 5);
  s = session.pause(s, 6000, "away");                         // then another window
  assert.equal(s.why, "sheet");
  assert.equal(session.resume(s, 7000, "away").phase, "paused", "the menu's চালিয়ে যাও doesn't close the sheet");
  assert.equal(session.resume(s, 7000, "sheet").phase, "playing");
  assert.equal(session.started(session.ready()), false, "the start card has nothing to lose");
  assert.equal(session.started(session.finish(session.begin(session.ready(), 0), 3000)), false, "nor the result");
  assert.match(component, /function leave\(then: \(\) => void, after: string\) \{\n\s+if \(!session\.started\(now\.current\.run\)\) \{ then\(\); return; \}/);
  assert.match(component, /leave\(\(\) => load\(pageDeal\(to\)\)/, "a level picked mid-page");
  assert.match(component, /leave\(\(\) => load\(freeDeal\(pack, level\)\)/, "a pack or difficulty picked mid-page");
  assert.match(component, /leave\(\(\) => load\(freeDeal\(game\.pack, game\.level\)\), "নতুন গ্রিড/, "নতুন গ্রিড mid-page");
  assert.match(component, /function openSheet\(\) \{\n\s+if \(now\.current\.run\.phase === "playing"\) pauseFor\("sheet"\);/);
});

// ---- the ladder as data ----
test("ladder: eight packs as worlds, four levels each, one new thing per level, a named finale per world", () => {
  assert.equal(STAGE_COUNT, WORLDS.length * PER_WORLD);
  assert.deepEqual(WORLDS.map(w => w.pack), PACKS.map(p => p.id), "the worlds keep the packs' order");
  const lessons = STAGES.map(s => s.lesson);
  assert.equal(new Set(lessons).size, STAGE_COUNT, "every level says something different");
  for (const lesson of lessons) {
    assert.equal(lesson, lesson.normalize("NFC"));
    assert.ok(lesson.length > 8 && lesson.length <= 95, lesson);
    assert.doesNotMatch(lesson, /আপনি|করুন|অসাধারণ|দারুণ|!/);
  }
  const key = (s: (typeof STAGES)[number]) => JSON.stringify([s.size, s.words, s.dirs, s.traps ?? 0, Boolean(s.clue), s.must?.count ?? 0, s.backwards ?? 0, s.cross ?? 0, s.three]);
  STAGES.forEach((stage, index) => {
    const level = index + 1;
    assert.equal(stage.pack, WORLDS[worldOf(level)].pack);
    if (index) assert.notEqual(key(stage), key(STAGES[index - 1]), `level ${level} changes something`);
    assert.ok(stage.three < stage.two, `level ${level}: three stars is quicker than two`);
    assert.ok(stage.words <= PACKS.find(p => p.id === stage.pack)!.words.length / 2, `level ${level}: the pack has twice the words it needs`);
  });
  for (let level = 1; level <= STAGE_COUNT; level++) {
    assert.equal(isFinale(level), level % PER_WORLD === 0);
    if (!isFinale(level)) continue;
    const at = stageAt(level)!, w = WORLDS[worldOf(level)];
    assert.equal(finaleName(level), w.finale);
    assert.ok(at.lesson.includes(spokenIn(at.three)) || at.lesson.includes(spoken(at.three)), `the finale's line names its real three-star time (${level})`);
  }
  // The first world teaches one direction at a time.
  assert.deepEqual(STAGES.slice(0, 3).map(s => s.dirs), [["R"], ["R", "D"], ["R", "D", "DR"]]);
  assert.equal(stageAt(0), null); assert.equal(stageAt(33), null); assert.equal(stageAt(1.5), null);
});

test("ladder: every level builds for every seed tried, and each grid keeps its level's promises", () => {
  const reach = (dirs: readonly Dir[], cells: number[], size: number) => {
    const step = cells[1] - cells[0];
    return dirs.some(dir => DIRS[dir][0] * size + DIRS[dir][1] === step && Math.abs(cells[1] % size - cells[0] % size) <= 1);
  };
  STAGES.forEach((stage, index) => {
    const pack = PACKS.find(p => p.id === stage.pack)!, pool = new Set(pack.words.flatMap(clusters));
    for (let seed = 1; seed <= 60; seed++) {
      const p = build(seed * 7919 + index, stage.pack, stage);
      const where = `level ${index + 1} #${seed}`;
      assert.equal(p.grid.length, stage.size * stage.size);
      assert.ok(p.grid.every(cell => pool.has(cell)), where);
      assert.equal(p.words.length, stage.words);
      assert.equal(new Set(p.words.map(w => w.word)).size, stage.words);
      for (const word of p.words) {
        assert.ok(word.letters.length <= stage.size, where);
        assert.ok(reach(stage.dirs, word.cells, stage.size), `${where}: ${word.word} runs a way the level doesn't teach`);
        assert.equal(findAll(p.grid, word.letters).length, 1, `${where}: ${word.word} reads once`);
      }
      assert.equal(p.traps.length, stage.traps ?? 0, where);
      for (const trap of p.traps) assert.ok(p.words.some(w => trap.every((cell, k) => p.grid[cell] === w.letters[k]) && trap.length === w.letters.length - 1), `${where}: a trap is a word but its last letter`);
      const backwards = p.words.filter(w => { const step = w.cells[1] - w.cells[0]; return BACKWARDS.has((Object.keys(DIRS) as Dir[]).find(dir => DIRS[dir][0] * stage.size + DIRS[dir][1] === step && stage.dirs.includes(dir))!); }).length;
      assert.ok(backwards >= (stage.backwards ?? 0), `${where}: ${backwards} backwards`);
      const used = new Set(p.words.flatMap(w => w.cells)).size, lengths = p.words.reduce((sum, w) => sum + w.letters.length, 0);
      assert.ok(lengths - used >= (stage.cross ?? 0), `${where}: shared cells`);
      if (stage.must) assert.ok(p.words.filter(w => stage.must!.test(w.letters)).length >= stage.must.count, `${where}: must`);
      if (stage.clue) {
        const clues = new Set(p.words.map(w => clueOf(w.letters)));
        for (const other of pack.words.map(clusters)) {
          if (p.words.some(w => w.letters.join("") === other.join("")) || !clues.has(clueOf(other))) continue;
          assert.equal(findAll(p.grid, other).length, 0, `${where}: ${other.join("")} would answer a clue`);
        }
      }
    }
    assert.deepEqual(build(4242, stage.pack, stage), build(4242, stage.pack, stage), "same seed, same grid");
  });
  // Level 1's first play is the teaching grid: three flowers, the demo word left to right.
  const teach = build(TEACH_SEED, "phul", STAGES[0]);
  assert.equal(teach.words[0].cells[1] - teach.words[0].cells[0], 1);
});

// ---- strokes ----
test("strokes: exact either way, one cell of slack at an end, never a guess between two words", () => {
  // A hand-made 6×6 page: পলাশ on row 1 (cells 6–8), কৃষ্ণচূড়া on row 2 (12–15), শিমুল on row 4 (24–26).
  const grid = Array<string>(36).fill("ক");
  const put = (word: string, from: number) => clusters(word).forEach((letter, k) => { grid[from + k] = letter; });
  put("পলাশ", 6); put("কৃষ্ণচূড়া", 12); put("শিমুল", 24);
  const place = (word: string, from: number) => ({ word, letters: clusters(word), cells: clusters(word).map((_, k) => from + k) });
  const p = { seed: 1, pack: "phul" as const, level: 0 as const, size: 6, grid, traps: [], clue: false, words: [place("পলাশ", 6), place("শিমুল", 24), place("কৃষ্ণচূড়া", 12)] };
  const at = (word: string) => p.words.findIndex(w => w.word === word);
  assert.equal(match(p, [6, 7, 8], []), at("পলাশ"));
  assert.equal(match(p, [8, 7, 6], []), at("পলাশ"), "from the last letter back");
  assert.equal(match(p, [6, 7, 8, 9], []), at("পলাশ"), "running one cell past");
  assert.equal(match(p, [23, 24, 25, 26], []), at("শিমুল"), "starting one cell early");
  assert.equal(match(p, [12, 13, 14], []), at("কৃষ্ণচূড়া"), "a long word one cell short");
  assert.equal(match(p, [13, 14, 15], []), at("কৃষ্ণচূড়া"), "or short at its first letter");
  assert.equal(match(p, [6, 7], []), -1, "a three-cell word needs all three");
  assert.equal(match(p, [6, 7, 8, 9, 10], []), -1, "two cells of slack is a miss");
  assert.equal(match(p, [0, 7, 14], []), -1);
  assert.equal(match(p, [6, 7, 8, 9], [at("পলাশ")]), -1, "slack only helps a word not found yet");
  let round = newRound();
  ({ round } = strike(round, p, [6, 7, 8], 2));
  ({ round } = strike(round, p, [24, 25, 26], 2 + RUN_SECONDS - 1));
  assert.equal(round.run, 1, "a quick second find makes a run");
  const again = strike(round, p, [8, 7, 6], 12);
  assert.equal(again.outcome.kind, "again");
  const miss = strike(round, p, [0, 1], 12);
  assert.equal(miss.outcome.kind, "miss");
  assert.equal(miss.round.misses, 1);
  ({ round } = strike(miss.round, p, [12, 13, 14, 15], 40));
  assert.equal(round.run, 0, "a slow find starts again");
  assert.equal(round.bestRun, 2);
  assert.ok(isDone(round, p));
  assert.equal(strike(newRound(), p, [6], 1).outcome.kind, "none", "a tap is not a stroke");
  const hinted = takeHint(newRound(), p)!;
  assert.equal(hinted.index, 0);
  assert.deepEqual(takeHint(hinted.round, p)!.round.hinted, [0, 1]);
});

test("the pen: snaps to eight ways, holds its way through a wobble, cut at the edge", () => {
  assert.deepEqual(readStroke(0, 2.1, 0.3, 5).cells, [0, 1, 2]);
  assert.deepEqual(readStroke(0, 2.2, 1.8, 5).cells, [0, 6, 12], "close to 45° is the diagonal");
  assert.deepEqual(readStroke(12, -0.2, -2.1, 5).cells, [12, 7, 2]);
  assert.deepEqual(readStroke(3, 4, 0, 5).cells, [3, 4], "cut at the edge");
  assert.deepEqual(readStroke(3, 0.3, 0.2, 5).cells, [3], "a jitter is still a tap");
  // 26° off the row: a fresh drag reads the diagonal, but a drag already moving along the row keeps the row.
  const wobble = [2, 2 * Math.tan(26 * Math.PI / 180)] as const;
  assert.equal(readStroke(0, ...wobble, 8).held, 1);
  assert.equal(readStroke(0, ...wobble, 8, 0).held, 0, "the row holds");
  assert.deepEqual(readStroke(0, ...wobble, 8, 0).cells, [0, 1, 2]);
  assert.equal(octantOf(0.3, 1.6, 0), 2, "a real turn still turns");
  assert.equal(cellAt(2.5, 1.2, 5), 7);
  assert.equal(cellAt(-0.1, 1, 5), -1);
  assert.equal(cellAt(5, 1, 5), -1);
});

// ---- the clock, star track and edge ----
test("tick: the star track during play is exactly the stars the result gives, and the edge warns ten seconds early", () => {
  STAGES.forEach((stage, index) => {
    for (const time of [1, stage.three - 1, stage.three, stage.three + 1, stage.two, stage.two + 1, stage.two * 3]) {
      assert.equal(starsOnTrack(time, stage.three, stage.two), pageStars(index + 1, time), `level ${index + 1} at ${time}`);
    }
  });
  assert.equal(edgeDanger(9, 20, 35), false);
  assert.equal(edgeDanger(10, 20, 35), true);
  assert.equal(edgeDanger(21, 20, 35), false);
  assert.equal(edgeDanger(30, 20, 35), true);
  assert.equal(edgeDanger(40, 20, 35), false, "nothing left to lose");
  assert.equal(starTimeUsed(0, 20, 35), 0);
  assert.equal(starTimeUsed(20, 20, 35), 1);
  assert.equal(starTimeUsed(99, 20, 35), 1);
  assert.equal(pageNear(1, stageAt(1)!.three + 3), "আর ৩ সেকেন্ড কম লাগলে ৩ তারা।");
  assert.equal(pageNear(1, stageAt(1)!.two + 2), "আর ২ সেকেন্ড কম লাগলে ২ তারা।");
  assert.equal(pageNear(1, 5), "");
});

// ---- links ----
test("ladder links: round trip for every hint count, a personal preview, and forged levels refused", () => {
  for (const [index, stage] of STAGES.entries()) {
    for (let hints = 0; hints <= stage.words; hints++) {
      const mine: Shared = { seed: 4821, pack: stage.pack, level: stage.dirs.length > 3 ? 1 : 0, demo: false, hints, time: 300, name: "মিম", page: index + 1 };
      assert.deepEqual(parseShared(sharedHash(mine)), mine, `level ${index + 1}, ${hints} hints`);
      assert.equal(share.normalize(sharedHash(mine)), sharedHash(mine));
    }
  }
  const four: Shared = { seed: 77, pack: "phul", level: 0, demo: false, hints: 0, time: 38, name: "রাফি", page: 4 };
  assert.equal(sharedHash(four), "s=77&t=38&p=phul&h=0&g=4&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  assert.equal(previewTitle(four), "রাফি লেভেল ৪-এ ফুলের পাঁচটা শব্দ ৩৮ সেকেন্ডে খুঁজে পেয়েছে। তুমি পারবে?");
  assert.equal(feat({ ...four, name: "" }), "এক বন্ধু লেভেল ৪-এ ফুলের পাঁচটা শব্দ ৩৮ সেকেন্ডে খুঁজে পেয়েছে");
  assert.equal(kicker(four), "রাফির শব্দ খোঁজা · মালি চাচার বাগান · ফুল ★★★");
  assert.equal(detail(four), "৫টার ৫টা · হিন্ট ছাড়া");
  assert.match(caption(four), /^শব্দ খোঁজার লেভেল ৪-এ ফুলের পাঁচটা শব্দ ৩৮ সেকেন্ডে খুঁজে পেলাম, ৩ তারা। তুমি কত সময়ে পারবে\?$/);
  const forged = [
    "s=77&t=42&p=mach&h=0&g=4", "s=77&t=42&p=phul&h=0&g=0", "s=77&t=42&p=phul&h=0&g=33", "s=77&t=42&p=phul&h=0&g=04", "s=77&t=42&p=phul&h=0&g=x",
    "s=77&t=42&p=phul&h=6&g=4", "s=77&t=42&p=phul&l=0&h=0&g=4", "s=77&t=42&p=phul&h=0&d=1&g=4", "s=77&t=42&p=phul&h=0&v=4&g=4",
    "s=77&t=2&p=phul&h=0&g=4", "s=77&t=14&p=phul&h=1&g=4", "s=77&t=42&p=__proto__&h=0&g=4",
  ];
  for (const state of forged) assert.equal(parseShared(state), null, state);
  assert.ok(parseShared("s=77&t=15&p=phul&h=1&g=4"), "five words and one hint is the floor");
});

test("content: H1, title and description within the rules, at least six FAQs, তুমি throughout", () => {
  assert.ok(site.title.length <= 45);
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.doesNotMatch(site.headline ?? "", /ছয়টা/, "the H1 no longer promises exactly six words");
  assert.ok(site.faq.length >= 6);
  assert.doesNotMatch(JSON.stringify(site), /আপনি|করুন|দেখুন|অসাধারণ/);
});

// ---- keys, timers, sound ----
test("keys and timers: Enter goes to the game, results need a fresh press, P opens the player's menu, no stray timers", () => {
  assert.match(component, /const key = event\.key, enter = key === "Enter" \|\| key === " ", fresh = !event\.repeat;/);
  assert.match(component, /if \(fresh && finish && event\.timeStamp > finish\.at \+ 400\) primary\.run\(\);/);
  assert.match(component, /if \(player\.stage\.width > 0\) player\.requestPause\(\); else pauseFor\("away"\);/);
  assert.match(component, /if \(run\.phase === "paused"\) \{ if \(enter\)/, "keys do nothing to the grid while paused");
  assert.match(component, /function dropFocus/);
  assert.match(component, /onClick=\{dropFocus\}/);
  assert.match(component, /if \(ask\) \{\n\s+if \(key === "1" \|\| key === "১"\)/, "the ask card answers 1 and 2");
  // Celebrations are on the audio clock (cut by the player's pause) or StarReveal (cleared on unmount); the two
  // display timers are cleared on every new page and on unmount.
  assert.doesNotMatch(component, /setTimeout\(\(\) => (sfx|sound)\./);
  assert.match(component, /sound\.fanfare\(ROOTS\[g\.pack\], big, /);
  assert.match(component, /function load\(next: Deal\) \{\n\s+cancelPress\(\);\n\s+clearTimers\(\);\n[^\n]*\n\s+silenceScheduled\(\);/, "a new page cuts the last page's song and fanfare");
  assert.match(component, /return \(\) => \{\n\s+window\.removeEventListener\("blur", away\);[^]*?clearTimers\(\);/);
  const finish = readFileSync(new URL("../components/finish.tsx", import.meta.url), "utf8");
  assert.match(finish, /<StarReveal count=/);
  assert.match(finish, /cancelAnimationFrame\(frame\.current\)/);
});

// ---- difficulty by bots ----
test("bots: level 1 in ten seconds, the first worlds easy, three stars rarest on the finales", () => {
  const RUNS = 120;
  const times = (level: number, skill: (typeof PLAYERS)[keyof typeof PLAYERS]) => {
    const stage = stageAt(level)!;
    return Array.from({ length: RUNS }, (_, k) => Math.round(bot(build(k * 7919 + level, stage.pack, stage), stage.dirs, k * 31 + 7, skill).seconds));
  };
  const rate = (list: number[], pass: (t: number) => boolean) => list.filter(pass).length / list.length;
  // The teaching grid with its demo word shown: a steady player is done inside ten seconds.
  const teach = build(TEACH_SEED, "phul", STAGES[0]);
  const shown = Array.from({ length: RUNS }, (_, k) => bot({ ...teach, words: teach.words.slice(1) }, STAGES[0].dirs, k + 1, PLAYERS.steady).seconds + 1.2);
  assert.ok(rate(shown, t => t <= 10) >= 0.95, "teaching grid in 10 s");
  for (let level = 1; level <= STAGE_COUNT; level++) {
    const stage = stageAt(level)!, three = (t: number) => t <= stage.three, two = (t: number) => t <= stage.two;
    const casual = times(level, PLAYERS.casual), steady = times(level, PLAYERS.steady), strong = times(level, PLAYERS.strong);
    assert.ok(rate(strong, three) >= 0.85, `strong 3★ on ${level}: ${rate(strong, three)}`);
    if (level <= 4) assert.ok(rate(casual, three) >= 0.6, `casual 3★ on ${level}: ${rate(casual, three)}`);
    else if (!isFinale(level) && level <= 8) assert.ok(rate(steady, three) >= 0.85, `steady 3★ on ${level}`);
    else if (!isFinale(level) && level !== 19) {
      assert.ok(rate(steady, three) >= 0.6, `steady 3★ on ${level}: ${rate(steady, three)}`);
      assert.ok(rate(casual, two) >= 0.85, `casual 2★ on ${level}: ${rate(casual, two)}`);
    }
    if (isFinale(level) && level > 4) {
      const hard = rate(steady, three);
      assert.ok(hard >= 0.35 && hard <= 0.75, `steady 3★ on the finale ${level}: ${hard}`);
      assert.ok(rate(casual, two) >= 0.7, `casual 2★ on the finale ${level}`);
      assert.ok(rate(casual, three) <= 0.25, `casual 3★ is rare on the finale ${level}`);
    }
  }
});
