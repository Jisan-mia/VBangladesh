import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { CRATER, REPEAT, ROVER, SAMPLE } from "../lib/art";
import { FACTS, SOURCE, factFor } from "../lib/facts";
import { BEST, LEVELS, LEVEL_COUNT, levelOf } from "../lib/levels";
import { CARD_FOOTER, blockText, cardSub, cardTitle, endTitle, methodLine, noteFor, tipFor } from "../lib/lines";
import { MAX_BLOCKS, MAX_TIMES, addBlock, blockSteps, parseMap, pathOf, removeBlock, repeatLast, runPlan, showHint, solve, starsOf, type Block, type Level } from "../lib/rover";
import { site } from "../content";
import { share } from "../share";

const nfc = (text: string) => assert.equal(text, text.normalize("NFC"), text);
const plan = (text: string): Block[] => text.split(" ").filter(Boolean).map(part => ({ dir: part.at(-1) as Block["dir"], times: part.length > 1 ? Number(part.slice(0, -1)) : 1 }));
const tiny = (rows: string[], repeat = false): Level => ({ n: 1, title: "t", ...parseMap(rows), repeat, challenge: false });

test("maps: every level parses, has a rover on sand, samples and craters on distinct cells", () => {
  assert.equal(LEVEL_COUNT, 12);
  for (const level of LEVELS) {
    const cells = [level.start, ...level.samples, ...level.craters].map(c => `${c.x},${c.y}`);
    assert.equal(new Set(cells).size, cells.length, `level ${level.n}`);
    assert.ok(level.w >= 4 && level.w <= 6 && level.h >= 4 && level.h <= 6, `level ${level.n} fits a phone`);
    nfc(level.title);
  }
  assert.equal(new Set(LEVELS.map(level => level.title)).size, LEVEL_COUNT);
  assert.throws(() => parseMap(["R.S", "..X"]));
  assert.throws(() => parseMap(["...", "..S"]), /bad map/);
  assert.equal(levelOf(0).n, 1);
  assert.equal(levelOf(99).n, 12);
});

test("every level is solvable, and the solver's own plan really wins when run", () => {
  for (const level of LEVELS) {
    const best = BEST[level.n - 1];
    assert.ok(best.plan.length && best.arrows.length, `level ${level.n} solvable`);
    assert.equal(runPlan(level, best.plan).end, "win", `level ${level.n} fewest-block plan`);
    assert.equal(runPlan(level, best.arrows).end, "win", `level ${level.n} arrow plan`);
    assert.equal(blockSteps(best.arrows), best.steps);
    assert.ok((level.repeat ? best.blocks : best.steps) <= MAX_BLOCKS, `level ${level.n} fits the plan strip`);
    if (!level.repeat) assert.equal(best.blocks, best.steps);
  }
});

test("the solver finds the true minimum on small maps", () => {
  assert.equal(solve(tiny(["RS"]))!.length, 1);
  assert.equal(solve(tiny(["R.C", "..S"]), false)!.length, 3);
  assert.equal(solve(tiny(["R....S"], true))!.length, 1);
  assert.deepEqual(solve(tiny(["R....S"], true)), [{ dir: "R", times: 5 }]);
  assert.equal(solve(tiny(["RC", "CS"])), null);
});

test("difficulty steps: short plans, longer plans, several samples, loops, then the fewest-blocks challenge", () => {
  const steps = BEST.map(best => best.steps);
  assert.deepEqual(steps.slice(0, 3), [1, 2, 3]);
  for (let i = 1; i < 6; i++) assert.ok(steps[i] >= steps[i - 1], "plans grow over levels 1–6");
  assert.ok(steps[5] >= 6 && steps[5] <= 10);
  assert.ok(LEVELS.slice(0, 6).every(level => level.samples.length === 1 && !level.repeat));
  assert.deepEqual(LEVELS.slice(6, 9).map(level => level.samples.length), [2, 2, 3]);
  assert.ok(LEVELS.slice(0, 9).every(level => !level.repeat), "no loops before level 10");
  assert.ok(LEVELS.slice(9).every(level => level.repeat));
  assert.ok(BEST.slice(9).every(best => best.blocks < best.steps / 2), "loops make the plan much shorter");
  assert.deepEqual(LEVELS.map(level => level.challenge), [...Array(11).fill(false), true]);
  // The first crater appears on level 3, right in the straight path.
  assert.equal(LEVELS[2].craters.length, 1);
  assert.ok(LEVELS.slice(0, 2).every(level => !level.craters.length));
});

test("running a plan: step by step, stops gently at a crater or the edge, ends at the last sample", () => {
  const level = levelOf(3);
  const crash = runPlan(level, plan("U U"));
  assert.equal(crash.end, "crater");
  assert.equal(crash.failBlock, 0);
  assert.deepEqual(crash.bump, { x: 1, y: 2 });
  assert.equal(crash.steps.length, 0);
  const edge = runPlan(level, plan("D"));
  assert.equal(edge.end, "edge");
  assert.equal(edge.failBlock, 0);
  const short = runPlan(level, plan("R U"));
  assert.equal(short.end, "short");
  assert.equal(short.got, 0);
  const win = runPlan(level, plan("R U U L L"));
  assert.equal(win.end, "win");
  assert.equal(win.steps.length, 3, "stops at the sample, leftover blocks don't run");
  const loop = runPlan(levelOf(10), plan("5U 4R"));
  assert.equal(loop.end, "win");
  assert.deepEqual(loop.steps.map(step => step.turn), [0, 1, 2, 3, 4, 0, 1, 2, 3]);
  assert.deepEqual(loop.steps.map(step => step.block), [0, 0, 0, 0, 0, 1, 1, 1, 1]);
  assert.equal(runPlan(levelOf(1), []).end, "short");
  assert.deepEqual(pathOf(levelOf(1), plan("R")), [{ x: 1, y: 2 }, { x: 2, y: 2 }]);
});

test("editing the plan: add, the repeat tile, remove, and the size limits", () => {
  let p: Block[] = [];
  p = addBlock(p, "U");
  p = repeatLast(repeatLast(p));
  assert.deepEqual(p, [{ dir: "U", times: 3 }]);
  for (let i = 0; i < 9; i++) p = repeatLast(p);
  assert.equal(p[0].times, MAX_TIMES);
  assert.deepEqual(repeatLast([]), []);
  p = addBlock(p, "R");
  assert.deepEqual(removeBlock(p, 0), [{ dir: "R", times: 1 }]);
  let long: Block[] = [];
  for (let i = 0; i < 30; i++) long = addBlock(long, "L");
  assert.equal(long.length, MAX_BLOCKS);
  assert.equal(blockText({ dir: "U", times: 3 }), "৩ বার ওপরে");
  assert.equal(blockText({ dir: "L", times: 1 }), "বামে");
});

test("stars are a record: 1 for every sample, 2 within two blocks of the shortest, 3 for the shortest", () => {
  assert.equal(starsOf(5, 5), 3);
  assert.equal(starsOf(4, 5), 3);
  assert.equal(starsOf(6, 5), 2);
  assert.equal(starsOf(7, 5), 2);
  assert.equal(starsOf(8, 5), 1);
  // A loop level solved with plain arrows still earns a star, never a loss.
  assert.equal(starsOf(BEST[9].steps, BEST[9].blocks), 1);
});

test("mistakes ease, never punish: a hint path after three missed runs, and the line says which block", () => {
  assert.deepEqual([0, 1, 2, 3, 4].map(showHint), [false, false, false, true, true]);
  const level = levelOf(3);
  const crater = noteFor(level, runPlan(level, plan("L L")), 2);
  assert.match(crater.title, /ম্যাপ এখানেই শেষ/);
  const bumped = noteFor(level, runPlan(level, plan("U")), 1);
  assert.equal(bumped.title, "এখানে গর্ত! প্ল্যানটা ঠিক করো।");
  assert.match(bumped.why, /^১ নম্বর ব্লকে/);
  assert.match(noteFor(level, runPlan(level, plan("D")), 1).title, /ম্যাপ/);
  assert.match(noteFor(levelOf(9), runPlan(levelOf(9), plan("R R")), 2).why, /আরও ২টা পাথর বাকি/);
  assert.equal(noteFor(level, runPlan(level, []), 0).title, "আগে তীর চাপো।");
  for (const line of [crater.title, crater.why, bumped.why]) assert.doesNotMatch(line, /হেরে|ভুল করেছ|খারাপ/);
});

test("end lines praise the method only when true, and the card says what was done with no name", () => {
  assert.equal(endTitle(5), "৫ ব্লকের প্ল্যানে সব পাথর তোলা হলো");
  assert.match(methodLine(7, 5, 1, false), /৫ ব্লকের/);
  assert.match(methodLine(2, 2, 3, true), /লুপ/);
  assert.match(methodLine(6, 6, 1, false), /প্রথম বারেই/);
  assert.doesNotMatch(methodLine(2, 2, 1, false), /প্রথম বারেই/, "no praise for trivial levels");
  const today = { levels: 3, samples: 4, last: { n: 7, plan: plan("U U R"), stars: 2 } };
  assert.equal(cardTitle(today), "আজ মঙ্গলে রোভার চালিয়ে ৪টা পাথর তুললাম");
  assert.equal(cardSub(today), "৩টা লেভেল পার, শেষ প্ল্যান ৩ ব্লকের");
  for (const level of LEVELS) for (const p of [[], plan("U")]) nfc(tipFor(level, p));
  nfc(CARD_FOOTER);
});

test("Mars facts: one per level, NFC Bangla, NASA source, no real rover names", () => {
  assert.equal(FACTS.length, LEVEL_COUNT);
  assert.equal(new Set(FACTS).size, FACTS.length);
  for (const fact of FACTS) { nfc(fact); assert.match(fact, /[ঀ-৿]/u); }
  assert.match(SOURCE, /NASA/);
  assert.equal(factFor(1), FACTS[0]);
  assert.equal(factFor(12), FACTS[11]);
  assert.ok(FACTS.some(fact => fact.includes("৬৮৭")));
  const everything = [...FACTS, ...site.faq.flatMap(f => [f.question, f.answer]), ...site.steps, site.description].join(" ");
  assert.doesNotMatch(everything, /Curiosity|Perseverance|Sojourner|Spirit|Opportunity|কিউরিওসিটি|পারসিভিয়ারেন্স/i);
});

test("pictures are our own inline SVG, with nothing loaded from outside", () => {
  for (const svg of [ROVER, SAMPLE, CRATER, REPEAT]) assert.doesNotMatch(svg, /href|url\(|<script|<image|<text/i);
});

test("no sharing of results: normalize always returns null, and there is no tally", () => {
  for (const state of ["", "l=3", "s=1&t=3", "og", "x".repeat(500)]) assert.equal(share.normalize(state), null);
  assert.equal(share.tally, undefined);
});

test("the tool never touches the network", () => {
  const files: string[] = [];
  const walk = (dir: string) => { for (const name of readdirSync(dir)) { const path = join(dir, name); if (statSync(path).isDirectory()) { if (name !== "tests") walk(path); } else if (/\.tsx?$/.test(name)) files.push(path); } };
  walk(join(import.meta.dirname, ".."));
  assert.ok(files.length >= 11, `${files.length} files`);
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, /\bfetch\s*\(/, `${file} calls fetch`);
    assert.doesNotMatch(source, /share-client|XMLHttpRequest|sendBeacon|WebSocket|\/api\//, file);
  }
  const route = readFileSync(join(import.meta.dirname, "../../../app/mongole-rover/page.tsx"), "utf8");
  assert.match(route, /tool-mongole-rover/);
});

test("content: SEO limits and the FAQ parents search for", () => {
  assert.ok(site.title.length <= 45, `title ${site.title.length}`);
  assert.ok(site.title.startsWith("ছোটদের কোডিং গেম"));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, `description ${site.description.length}`);
  assert.ok(site.faq.length >= 6);
  assert.equal(site.faq[0].question, "লাল গ্রহ কাকে বলে?");
  assert.match(site.faq[0].answer, /^মঙ্গল গ্রহকে লাল গ্রহ বলে।/);
  for (const ask of ["কোন বয়সের জন্য?", "ইন্টারনেট লাগে?", "কোনো তথ্য নেওয়া হয়?", "কতক্ষণ খেলবে?"]) assert.ok(site.faq.some(item => item.question === ask), ask);
  for (const text of [site.title, site.description, site.headline!, site.lead, site.guideIntro, ...site.steps, ...site.privacy, ...site.faq.flatMap(item => [item.question, item.answer])]) {
    nfc(text);
    assert.doesNotMatch(text, /আপনি|করুন/);
  }
  assert.equal(site.privacy.length, 1);
  assert.notEqual(site.headline, site.title);
});
