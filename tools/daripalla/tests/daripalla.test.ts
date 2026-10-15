import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { makeRng } from "../../../shared/game-core";
import { site } from "../content";
import { share } from "../share";
import {
  add, addToday, cardLines, choose, choicesFor, EMPTY_TODAY, endLine, feedback, fewestPieces, FRUITS, glows, hint, KNOWN_FRUITS, LEVELS, LEVEL_COUNT, makePuzzle,
  MAX_TILT, newRound, nextPuzzle, OG_TODAY, PAN_MAX, praiseLine, prompt, remove, roundStars, settled, solvedText, specOf, springStep, tiltFor, totals,
  UNKNOWN_FRUITS, type Pace, type Round,
} from "../lib/game";

const root = join(import.meta.dirname, "..");
const files = (dir: string): string[] => readdirSync(dir).flatMap(name => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? (name === "tests" ? [] : files(path)) : [path];
});
const nfc = (text: string) => assert.equal(text, text.normalize("NFC"), text);
const PACES: Pace[] = [-1, 0, 1];
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

/** Solves the current puzzle by following the ghost finger's hint; `wrong` wrong answers first on every question. */
function solve(round: Round, wrong = 0): Round {
  for (let guard = 0; guard < 30; guard++) {
    if (round.stage === "done") return round;
    if (round.stage === "ask") {
      for (let miss = 0; miss < wrong && round.stage === "ask"; miss++) round = choose(round, round.puzzle.choices.find(value => value !== round.puzzle.answer)!).round;
      round = choose(round, round.puzzle.answer).round;
      continue;
    }
    const step = hint(round)!;
    assert.ok(step && "tray" in step, "a balancing hint always points at the tray when nothing is too heavy");
    round = add(round, step.tray).round;
  }
  throw new Error("a puzzle always ends");
}
function play(level: number, wrong = 0, seed = 7, pace: Pace = 0) {
  let round = newRound(level, pace, seed);
  for (let guard = 0; guard < 20; guard++) {
    round = solve(round, wrong);
    const next = nextPuzzle(round);
    if (!next) return round;
    round = next;
  }
  throw new Error("a round always ends");
}

test("content data: fruits have names and art, known and unknown fruits never overlap, Bangla is NFC", () => {
  const art = readFileSync(join(root, "components/art.tsx"), "utf8");
  for (const [id, fruit] of Object.entries(FRUITS)) {
    assert.match(art, new RegExp(`\\b${id}: \\(\\) =>`), `art for ${id}`);
    nfc(fruit.name); nfc(fruit.of);
    assert.ok(fruit.of.startsWith(fruit.name), fruit.of);
  }
  assert.equal(new Set(Object.values(FRUITS).map(fruit => fruit.name)).size, Object.keys(FRUITS).length);
  assert.deepEqual(KNOWN_FRUITS.map(item => item.value), [1, 2, 3, 5], "tags grow with the fruit: লিচু < পেয়ারা < আম < পেঁপে");
  for (const fruit of UNKNOWN_FRUITS) assert.ok(!KNOWN_FRUITS.some(item => item.fruit === fruit), `${fruit} is never both tagged and unknown`);
  assert.equal(LEVEL_COUNT, 7);
  assert.equal(new Set(LEVELS.map(spec => spec.label)).size, LEVEL_COUNT);
  LEVELS.forEach(spec => nfc(spec.label));
  assert.deepEqual(LEVELS.map(spec => spec.kind), ["fill", "fill", "fill", "find", "find", "find", "guess"]);
});

test("every puzzle at every pace is solvable with the given pieces and fits the pan", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) for (const pace of PACES) for (let seed = 1; seed <= 300; seed++) for (const index of [0, 1]) {
    const puzzle = makePuzzle(level, pace, makeRng(seed), index), kind = specOf(level).kind;
    assert.equal(puzzle.kind, kind);
    if (kind === "guess") {
      assert.equal(puzzle.tray.length, 0);
      const stars = puzzle.left.filter(piece => piece.kind === "star");
      assert.ok(stars.length >= 1 && stars.length <= 3);
      assert.ok(stars.every(piece => piece.value === puzzle.answer));
      assert.equal(sum(puzzle.start.map(piece => piece.value)), sum(puzzle.left.map(piece => piece.value)), "the picture equation is true");
    } else {
      const need = sum(puzzle.left.map(piece => piece.value)) - sum(puzzle.start.map(piece => piece.value));
      assert.ok(need >= 1, `level ${level} needs something on the pan`);
      assert.ok(fewestPieces(need, puzzle.tray.map(piece => piece.value)) <= PAN_MAX - puzzle.start.length, `level ${level} fits the pan: ${need}`);
      assert.ok(sum(puzzle.left.map(piece => piece.value)) <= 20, "sums stay within 20");
      if (level <= 3) assert.equal(puzzle.answer, need);
    }
    if (kind !== "fill") {
      assert.equal(puzzle.choices.length, 3);
      assert.ok(puzzle.choices.includes(puzzle.answer));
      assert.equal(new Set(puzzle.choices).size, 3);
      assert.ok(puzzle.choices.every(value => value >= 1));
      assert.deepEqual(puzzle.choices, [...puzzle.choices].sort((a, b) => a - b));
      assert.ok(puzzle.answer >= 2, "no fruit weighs nothing");
    }
    if (level === 6) assert.equal(puzzle.left[0].kind === "fruit" && puzzle.left[1].kind === "fruit" && puzzle.left[0].fruit === puzzle.left[1].fruit, true, "two of the same fruit");
  }
  assert.equal(fewestPieces(19, [1, 2, 5, 10]), 4);
  assert.equal(fewestPieces(0, [1]), 0);
  assert.equal(fewestPieces(-1, [1]), Infinity);
  assert.deepEqual(choicesFor(5, makeRng(1), 7).includes(7), true, "the tempting wrong one is offered");
});

test("difficulty steps: an eased pace keeps numbers small, a brisk one makes them bigger", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const biggest = (pace: Pace) => Math.max(...Array.from({ length: 200 }, (_, seed) => { const puzzle = makePuzzle(level, pace, makeRng(seed + 1), 1); return sum(puzzle.left.map(piece => piece.value)); }));
    const smallest = (pace: Pace) => Math.min(...Array.from({ length: 200 }, (_, seed) => { const puzzle = makePuzzle(level, pace, makeRng(seed + 1), 1); return sum(puzzle.left.map(piece => piece.value)); }));
    assert.ok(biggest(-1) <= biggest(0) && biggest(0) <= biggest(1), `level ${level} grows with pace`);
    assert.ok(smallest(-1) <= smallest(1), `level ${level}`);
  }
  // The picture equation: one ★ when eased, three when brisk; the first puzzle is a step gentler.
  const stars = (pace: Pace, index: number) => makePuzzle(7, pace, makeRng(3), index).left.filter(piece => piece.kind === "star").length;
  assert.deepEqual([stars(-1, 1), stars(0, 1), stars(1, 1)], [1, 2, 3]);
  assert.deepEqual([stars(0, 0), stars(1, 0)], [1, 2]);
});

test("a level 1 round plays like ৪ + ? = ৭: tilt follows the pans, level ends the puzzle, never auto-advances", () => {
  let round = newRound(1, 0, 11);
  const { left, right } = totals(round);
  assert.ok(left > right);
  assert.ok(tiltFor(round) < 0, "the heavier left pan is down");
  assert.equal(round.stage, "balance");
  nfc(prompt(round));
  round = solve(round);
  assert.equal(round.stage, "done");
  assert.equal(tiltFor(round), 0);
  assert.match(solvedText(round), /^[০-৯+ ]+ = [০-৯]+$/);
  assert.equal(add(round, 0).outcome, "ignore", "nothing moves once level");
  const end = play(1);
  assert.equal(end.solved, specOf(1).puzzles);
  assert.equal(nextPuzzle(end), null);
  assert.equal(roundStars(end), 3);
  assert.equal(endLine(end), "৫বার পাল্লা সমান করলে।");
  assert.ok(praiseLine(end));
});

test("overshooting a known target is a miss with a why-line; lifting it off can balance; unknowns never count it", () => {
  let round = newRound(1, 0, 4);
  // Fill up with the biggest weight until the pan is heavy.
  let result = add(round, 2);
  while (result.outcome === "added") { round = result.round; result = add(round, 2); }
  assert.equal(result.outcome, "over");
  {
    assert.equal(result.round.misses, 1);
    const line = feedback(result.round, "over");
    assert.match(line, /বেশি হলো, একটা তুলে নাও।$/);
    nfc(line);
    const again = add(result.round, 0);
    assert.equal(again.round.misses, 1, "staying heavy isn't a second miss");
    const off = remove(result.round, result.round.added.length - 1);
    assert.ok(["removed", "level"].includes(off.outcome));
  }
  assert.equal(remove(newRound(1, 0, 4), 0).outcome, "ignore", "the fixed starter never comes off");
  // An unknown fruit: going past it is how you find it, so it costs nothing.
  let find = newRound(4, 0, 9);
  for (let guard = 0; guard < 6 && find.stage === "balance"; guard++) {
    const next = add(find, 3);
    if (next.outcome === "full") break;
    find = next.round;
  }
  assert.equal(find.misses, 0);
});

test("a question: two wrong tries make the answer glow; the line says why; three misses ease, five clean step up", () => {
  let round = solve(newRound(5, 0, 21));
  round = nextPuzzle(round)!;
  for (let guard = 0; round.stage === "balance" && guard < 10; guard++) round = add(round, (hint(round) as { tray: number }).tray).round;
  assert.equal(round.stage, "ask");
  nfc(prompt(round));
  assert.match(prompt(round), /টার ওজন কত\?$/);
  const wrong = round.puzzle.choices.filter(value => value !== round.puzzle.answer);
  const first = choose(round, wrong[0]);
  assert.equal(first.outcome, "again");
  nfc(feedback(first.round, "again", wrong[0]));
  assert.ok(feedback(first.round, "again", wrong[0]).length > 0);
  assert.equal(glows(first.round), false);
  const second = choose(first.round, wrong[1]);
  assert.equal(glows(second.round), true);
  assert.equal(choose(second.round, 99).outcome, "ignore");
  const right = choose(second.round, round.puzzle.answer);
  assert.equal(right.outcome, "right");
  assert.equal(right.round.misses, round.misses + 2);
  // Three misses in a row quietly ease the pace.
  const eased = play(4, 2, 5, 0);
  assert.equal(eased.pace, -1);
  assert.equal(roundStars(eased), 1);
  assert.equal(praiseLine(eased), "", "no praise for a hard round");
  // Five clean puzzles in a row step it up, and the pace carries to the next round.
  assert.equal(play(4, 0, 5, 0).pace, 1);
  assert.equal(play(4, 0, 5, 1).pace, 1, "never above brisk");
});

test("picture equation: a try shows the tilt and the arithmetic, the answer levels the pan", () => {
  let round = nextPuzzle(solve(newRound(7, 0, 8)))!;
  assert.equal(round.stage, "ask");
  assert.equal(tiltFor(round), 0, "held level until a try");
  nfc(prompt(round));
  const wrong = round.puzzle.choices.find(value => value !== round.puzzle.answer)!;
  const tried = choose(round, wrong);
  assert.equal(tried.round.guess, wrong);
  assert.notEqual(tiltFor(tried.round), 0);
  const line = feedback(tried.round, "again", wrong);
  assert.match(line, /^★ = [০-৯]+ হলে .+ = [০-৯]+, [০-৯]+-এর চেয়ে (বেশি|কম)।$/);
  round = choose(tried.round, round.puzzle.answer).round;
  assert.equal(tiltFor(round), 0);
  assert.match(solvedText(round), /^★ \+ ★( \+ [০-৯]+)? = [০-৯]+$/);
});

test("star thresholds: no miss or one → 3, up to three → 2, else 1", () => {
  const at = (misses: number) => roundStars({ misses } as Round);
  assert.deepEqual([0, 1, 2, 3, 4, 9].map(at), [3, 3, 2, 2, 1, 1]);
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const clean = play(level);
    assert.equal(roundStars(clean), 3, `level ${level}`);
    nfc(endLine(clean));
  }
});

test("the beam: tilt is bounded and signed, and the spring wobbles past level before it settles", () => {
  const round = newRound(2, 0, 3);
  assert.ok(Math.abs(tiltFor({ ...round, added: Array(6).fill({ kind: "weight", value: 10 }) })) <= MAX_TILT);
  let state = { angle: -MAX_TILT, speed: 0 }, crossed = false, time = 0;
  while (!settled(state, 0) && time < 10) { state = springStep(state, 0, 1 / 60); if (state.angle > 0.3) crossed = true; time += 1 / 60; }
  assert.ok(crossed, "it swings past level once: the wobble");
  assert.ok(time < 5, `settles in ${time.toFixed(1)}s`);
});

test("today's card counts what was done, first person, no name", () => {
  let today = addToday(EMPTY_TODAY, solve(newRound(1, 0, 2)));
  today = addToday(today, solve(newRound(4, 0, 2)));
  assert.equal(today.balanced, 2);
  assert.equal(today.found, 1);
  assert.match(today.last, / = [০-৯]+$/);
  assert.deepEqual(cardLines(today), ["আজ ২বার পাল্লা সমান করলাম", "১টা ফলের ওজন বের করলাম"]);
  assert.deepEqual(cardLines({ ...EMPTY_TODAY, pictures: 3 }), ["আজ ৩টা ছবির অঙ্ক মেলালাম"]);
  assert.deepEqual(cardLines(EMPTY_TODAY), []);
  [...cardLines(today), today.last].forEach(nfc);
});

test("the #og preview draws a fixed card and never touches storage, stars or play time", () => {
  assert.equal(cardLines(OG_TODAY).length, 2);
  const og = readFileSync(join(root, "components/og-card.tsx"), "utf8");
  assert.doesNotMatch(og, /localStorage|sessionStorage|indexedDB|useLevels|useKidsSession|atBreak|record\(|addToday/);
  const game = readFileSync(join(root, "components/balance-game.tsx"), "utf8");
  assert.match(game, /og \? <OgCard[^\n]*: <Game \/>/, "the game, with its stars and session clock, isn't rendered on #og");
});

test("share never makes a link and has no tally", () => {
  assert.equal(share.normalize("level=1"), null);
  assert.equal(share.normalize(""), null);
  assert.equal(share.tally, undefined);
  assert.ok(share.preview("x").title.length > 0);
});

test("no network: the tool's source never calls fetch or imports share-client", () => {
  const sources = [...files(root), join(root, "../../app/daripalla/page.tsx")];
  assert.ok(sources.length >= 10);
  for (const file of sources) {
    const text = readFileSync(file, "utf8");
    assert.doesNotMatch(text, /\bfetch\s*\(/, file);
    assert.doesNotMatch(text, /share-client|ShareBar|sendBeacon|XMLHttpRequest|\/api\//, file);
    assert.equal(text, text.normalize("NFC"), `${file} is NFC`);
  }
});

test("content meets the SEO limits and the kids' rules", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.ok(site.title.startsWith("শিশুদের যোগ অংক"));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.faq.length >= 6);
  assert.match(site.faq[0].question, /সমান চিহ্ন/);
  assert.match(site.faq[0].answer, /^সমান চিহ্ন মানে দুই পাশের মান একই/);
  const questions = site.faq.map(item => item.question).join(" ");
  for (const must of ["কোন বয়সের", "ইন্টারনেট", "তথ্য", "কতক্ষণ"]) assert.ok(questions.includes(must), must);
  assert.equal(new Set(site.faq.map(item => item.question)).size, site.faq.length);
  assert.equal(site.privacy.length, 1);
  assert.ok(site.headline && site.headline !== site.title);
  for (const text of [site.title, site.description, site.lead, site.guideIntro, ...site.steps, ...site.privacy, ...site.faq.flatMap(item => [item.question, item.answer])]) {
    nfc(text);
    assert.doesNotMatch(text, /আপনি|আপনার|করুন|IQ|জিনিয়াস|কেজি ওজন/, "তুমি voice, no brain claims");
  }
});
