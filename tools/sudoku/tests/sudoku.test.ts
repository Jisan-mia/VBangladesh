import assert from "node:assert/strict";
import test from "node:test";
import { makeRng, readLevels, recordLevel, unlockedLevel } from "../../../shared/game-core";
import { site } from "../content";
import { share } from "../share";
import {
  dailyPuzzle, digitsDone, erase, giveHint, isSolved, isWrong, levelPuzzle, newlyDone, nextStar, place, startGame, startLevel,
  starsEarned, tierOf, todayKey, toggleNote, twoStarTime, undo, validDay, LEVEL_COUNT, type Game,
} from "../lib/game";
import { LEVELS } from "../lib/levels";
import { caption, clock, compareLine, duration, feat, fromPuzzle, humanLine, nearMissLine, parseShared, previewTitle, puzzleLabel, sharedHash } from "../lib/link";
import { SHAPES, consistent, countSolutions, decodeGrid, encodeGrid, layout, makePuzzle, solveByLogic, solvedGrid } from "../lib/sudoku";

const fnv = (text: string) => { let h = 2166136261; for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0; return h; };

test("every level: the right size, exactly its blanks, one solution, reachable by logic alone", () => {
  assert.equal(LEVEL_COUNT, 40);
  let before = { size: 0, empty: 0 };
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const puzzle = levelPuzzle(level)!, [size, empty] = LEVELS[level - 1];
    assert.ok(puzzle, `level ${level}`);
    assert.equal(puzzle.shape.n, size);
    assert.equal(puzzle.empty, empty, `level ${level} blanks`);
    assert.equal(countSolutions(puzzle.puzzle, puzzle.shape), 1, `level ${level} has one solution`);
    assert.deepEqual(solveByLogic(puzzle.puzzle, puzzle.shape), puzzle.solution, `level ${level} needs no guessing`);
    assert.ok(consistent(puzzle.solution, puzzle.shape) && !puzzle.solution.includes(0));
    puzzle.puzzle.forEach((value, cell) => assert.ok(!value || value === puzzle.solution[cell]));
    assert.ok(size > before.size || (size === before.size && empty >= before.empty), `level ${level} is never easier than the one before`);
    before = { size, empty };
  }
  assert.equal(levelPuzzle(1)!.empty, 4, "the first level is four blanks: a win in seconds");
  assert.equal(tierOf(1).name, "সহজ"); assert.equal(tierOf(11).name, "মাঝারি"); assert.equal(tierOf(21).name, "কঠিন"); assert.equal(tierOf(40).name, "ওস্তাদ");
  assert.equal(levelPuzzle(0), null); assert.equal(levelPuzzle(41), null); assert.equal(levelPuzzle(1.5), null);
});

test("the ladder is pinned: a generator change can't swap the puzzles behind old links", () => {
  const all = Array.from({ length: LEVEL_COUNT }, (_, i) => encodeGrid(levelPuzzle(i + 1)!.puzzle)).join("|");
  assert.equal(fnv(all), 1707594018);
});

test("same seed, same puzzle; generation stays quick enough for a cheap phone", () => {
  assert.deepEqual(makePuzzle(777, SHAPES[9], 50), makePuzzle(777, SHAPES[9], 50));
  assert.notDeepEqual(makePuzzle(777, SHAPES[9], 50).puzzle, makePuzzle(778, SHAPES[9], 50).puzzle);
  const started = performance.now();
  for (let day = 1; day <= 20; day++) dailyPuzzle(20261100 + day);
  assert.ok((performance.now() - started) / 20 < 20, "a 9×9 daily takes well under 20 ms here (the 200 ms phone budget, with room)");
});

test("full grids are valid for every size, and the two solvers agree", () => {
  for (const shape of Object.values(SHAPES)) {
    const rng = makeRng(42);
    for (let i = 0; i < 60; i++) assert.ok(consistent(solvedGrid(shape, rng), shape));
    const { units, peers } = layout(shape);
    assert.equal(units.length, shape.n * 3);
    assert.equal(peers[0].length, 3 * shape.n - shape.rows - shape.cols - 1);
  }
  assert.equal(countSolutions(new Array(16).fill(0), SHAPES[4]), 2, "an empty grid has many answers");
  assert.equal(countSolutions([1, 1, ...new Array(14).fill(0)], SHAPES[4]), 0, "a repeated digit has none");
  assert.equal(solveByLogic([1, 1, ...new Array(14).fill(0)], SHAPES[4]), null);
  assert.equal(solveByLogic(new Array(81).fill(0), SHAPES[9]), null, "logic alone can't start from nothing");
  assert.deepEqual(decodeGrid("1234", SHAPES[4]), null);
  assert.deepEqual(decodeGrid("5".repeat(16), SHAPES[4]), null);
  assert.deepEqual(decodeGrid(encodeGrid(levelPuzzle(3)!.puzzle), SHAPES[4]), levelPuzzle(3)!.puzzle);
});

test("daily puzzles: dated in Bangladesh time, real dates only, each one valid", () => {
  assert.equal(todayKey(Date.UTC(2026, 9, 11, 18, 30)), 20261012, "00:30 in Dhaka is already the 12th");
  assert.equal(todayKey(Date.UTC(2026, 9, 11, 17, 59)), 20261011);
  for (const day of [20260101, 20261012, 20280229, 20991231]) assert.ok(validDay(day), String(day));
  for (const day of [20251231, 20260231, 20270229, 20261301, 20261000, 21000101, 2026101, 20261012.5]) assert.ok(!validDay(day), String(day));
  for (let d = 1; d <= 30; d++) {
    const puzzle = dailyPuzzle(20261100 + d)!;
    assert.equal(countSolutions(puzzle.puzzle, puzzle.shape), 1);
    assert.ok(puzzle.empty >= 40 && puzzle.empty <= 47, `${d}: ${puzzle.empty}`);
  }
  assert.equal(dailyPuzzle(20260231), null);
});

test("stars: time against par, and each hint lowers the ceiling", () => {
  const par = levelPuzzle(25)!.par;
  assert.equal(par, Math.ceil(41 * 8 / 10) * 10);
  assert.equal(levelPuzzle(1)!.par, 30, "never under half a minute");
  assert.equal(starsEarned(par, 0, par), 3);
  assert.equal(starsEarned(par + 1, 0, par), 2);
  assert.equal(starsEarned(twoStarTime(par), 0, par), 2);
  assert.equal(starsEarned(twoStarTime(par) + 1, 0, par), 1);
  assert.equal(starsEarned(10, 1, par), 2);
  assert.equal(starsEarned(10, 2, par), 1);
  assert.equal(starsEarned(10, 9, par), 1, "never below one star");
  assert.equal(nextStar(par, 0, par), null);
  assert.deepEqual(nextStar(par + 24, 0, par), { goal: 3, seconds: 24, hints: 0 });
  assert.deepEqual(nextStar(10, 1, par), { goal: 3, seconds: 0, hints: 1 });
  assert.deepEqual(nextStar(twoStarTime(par) + 5, 2, par), { goal: 2, seconds: 5, hints: 1 });
  assert.equal(nearMissLine({ goal: 3, seconds: 24, hints: 0 }), "আর ২৪ সেকেন্ড আগে হলে ৩ তারা।");
  assert.equal(nearMissLine({ goal: 3, seconds: 0, hints: 1 }), "১টা সাহায্য কম নিলে ৩ তারা।");
  assert.equal(nearMissLine({ goal: 2, seconds: 65, hints: 1 }), "আর ১ মিনিট ৫ সেকেন্ড আগে আর ১টা সাহায্য কম হলে ২ তারা।");
  assert.equal(nearMissLine(null), "");
});

test("moves: printed digits stay, pencil marks clear themselves, undo keeps the hint count", () => {
  const puzzle = levelPuzzle(21)!, game = startGame(puzzle);
  const given = puzzle.puzzle.findIndex(Boolean), blank = puzzle.puzzle.indexOf(0), answer = puzzle.solution[blank];
  assert.equal(place(game, given, 1), null);
  assert.equal(place(game, blank, 0), null);
  assert.equal(place(game, blank, 10), null);
  const peer = layout(puzzle.shape).peers[blank].find(cell => !puzzle.puzzle[cell])!;
  let next = toggleNote(game, peer, answer)!;
  assert.equal(next.notes[peer], 1 << answer);
  next = place(next, blank, answer)!;
  assert.equal(next.notes[peer], 0, "placing a digit wipes it from its peers' pencil marks");
  assert.equal(toggleNote(next, blank, 3), null, "no pencil marks in a filled cell");
  assert.equal(place(next, blank, answer), null, "the same digit again is not a move");
  const wrong = place(next, peer, answer)!;
  assert.ok(isWrong(wrong, peer));
  assert.ok(!isWrong(wrong, blank));
  const rubbed = erase(wrong, peer)!;
  assert.equal(rubbed.values[peer], 0);
  assert.equal(erase(rubbed, peer), null, "nothing left to erase");
  assert.deepEqual(undo(rubbed)!.values, wrong.values);
  const helped = giveHint(game, blank)!;
  assert.equal(helped.cell, blank);
  assert.equal(helped.game.values[blank], answer);
  assert.equal(helped.game.hints, 1);
  assert.equal(undo(helped.game)!.hints, 1, "taking a hint back doesn't hide it");
  assert.equal(undo(game), null);
  const auto = giveHint(game, given)!;
  assert.ok(!puzzle.puzzle[auto.cell], "a hint on a printed cell picks a blank instead");
});

test("finished rows, columns and boxes are spotted once, and finished digits too", () => {
  const puzzle = levelPuzzle(1)!;
  let game = startGame(puzzle);
  const blanks = puzzle.puzzle.map((value, cell) => value ? -1 : cell).filter(cell => cell >= 0);
  let units = 0;
  for (const cell of blanks) {
    const next = place(game, cell, puzzle.solution[cell])!;
    units += newlyDone(game, next, cell).length;
    game = next;
  }
  assert.ok(isSolved(game));
  const open = layout(puzzle.shape).units.filter(unit => unit.some(cell => !puzzle.puzzle[cell])).length;
  assert.equal(units, open, "each row, column and box with a blank chimes exactly once");
  assert.deepEqual(digitsDone(game).slice(1), [true, true, true, true]);
  const back = undo(game)!;
  assert.ok(!isSolved(back));
});

test("a headless run: wrong digits, pencil marks, undos and a hint still end in a solved grid", () => {
  for (const level of [5, 17, 33]) {
    const puzzle = levelPuzzle(level)!, rng = makeRng(level), n = puzzle.shape.n;
    let game: Game = startGame(puzzle);
    const blanks = puzzle.puzzle.map((value, cell) => value ? -1 : cell).filter(cell => cell >= 0).sort(() => rng() - 0.5);
    for (const cell of blanks) {
      if (rng() < 0.3) game = toggleNote(game, cell, 1 + Math.floor(rng() * n)) ?? game;
      if (rng() < 0.2) {
        const wrong = (puzzle.solution[cell] % n) + 1;
        game = place(game, cell, wrong)!;
        assert.ok(isWrong(game, cell));
        game = undo(game)!;
      }
      game = place(game, cell, puzzle.solution[cell]) ?? game;
    }
    const last = undo(game)!;
    game = giveHint(last)!.game;
    assert.ok(isSolved(game), `level ${level}`);
    assert.equal(game.hints, 1);
    const stars = starsEarned(puzzle.par, game.hints, puzzle.par);
    assert.equal(stars, 2);
  }
});

test("this phone's progress goes through readLevels and recordLevel", () => {
  let stars = readLevels(null, LEVEL_COUNT);
  assert.deepEqual(stars, {});
  assert.equal(startLevel(stars, unlockedLevel(stars, LEVEL_COUNT)), 1, "a new player starts at level 1");
  stars = recordLevel(stars, 1, starsEarned(20, 0, 30));
  stars = recordLevel(stars, 2, starsEarned(70, 0, 30));
  stars = readLevels(JSON.stringify(stars), LEVEL_COUNT);
  assert.deepEqual(stars, { 1: 3, 2: 2 });
  assert.equal(unlockedLevel(stars, LEVEL_COUNT), 3);
  assert.equal(startLevel(stars, 3), 2, "back to the first open level short of three stars");
  assert.equal(startLevel({ 1: 3, 2: 3 }, 3), 3);
  assert.equal(startLevel(Object.fromEntries(Array.from({ length: 40 }, (_, i) => [i + 1, 3])), 40), 40);
  assert.deepEqual(readLevels('{"1":3,"41":3,"2":7}', LEVEL_COUNT), { 1: 3 });
});

test("links: a level or a date, re-checked; anything odd is refused", () => {
  const level = levelPuzzle(12)!;
  const mine = fromPuzzle(level, 252.4, 1, "  রাফি ");
  const hash = sharedHash(mine);
  assert.equal(hash, `s=${LEVELS[11][2]}&t=252&l=12&h=1&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF`);
  assert.deepEqual(parseShared(hash), { level: 12, day: 0, seconds: 252, hints: 1, name: "রাফি" });
  assert.equal(share.normalize(hash), hash);
  const daily = sharedHash(fromPuzzle(dailyPuzzle(20261012)!, 412, 0, ""));
  assert.equal(daily, "s=20261012&t=412");
  assert.deepEqual(parseShared(`#${daily}`), { level: 0, day: 20261012, seconds: 412, hints: 0, name: "" });
  const seed = LEVELS[11][2];
  const bad = [
    "", "junk", "s=20261012", "t=40", `s=${seed}&t=40&l=13`, `s=${seed}&t=40&l=0`, `s=${seed}&t=40&l=41`, `s=${seed}&t=40&l=012`,
    `s=${LEVELS[40 - 1][2]}&t=40&l=4x`, "s=20260231&t=40", "s=12345&t=40", "s=20261012&t=0", "s=20261012&t=6000", "s=20261012&t=1.5",
    "s=20261012&t=-3", "s=20261012&t=40&h=100", "s=20261012&t=40&h=47", "s=20261012&t=40&h=-1", "s=20261012&t=40&h=01", "s=20261012&t=40&h=<b>",
    `s=${LEVELS[0][2]}&t=40&l=1&h=5`, `s=20261012&t=40&n=${"ক".repeat(700)}`, "s=9999999999&t=40",
  ];
  for (const state of bad) assert.equal(share.normalize(state), null, state);
  assert.equal(parseShared("s=20261012&t=40&n=%E2%80%AE%E0%A6%B0%E0%A6%BF%E0%A6%AE%E0%A6%BE%00")?.name, "রিমা");
});

test("previews, captions and lines are personal, honest and kind", () => {
  const mine = parseShared(sharedHash(fromPuzzle(levelPuzzle(12)!, 252, 0, "রাফি")))!;
  assert.equal(feat(mine), "রাফি সুডোকুর লেভেল ১২ মিলিয়েছে ৪ মিনিট ১২ সেকেন্ডে");
  assert.equal(previewTitle(mine), `${feat(mine)}। তুমি পারবে?`);
  assert.equal(share.preview(sharedHash(mine)).title, previewTitle(mine));
  assert.match(share.preview("junk").title, /^সুডোকু বাংলায়/);
  assert.equal(share.tally, undefined);
  const daily = { level: 0, day: 20260703, seconds: 60, hints: 2, name: "" };
  assert.equal(feat(daily), "এক বন্ধু ৩ জুলাইয়ের সুডোকু মিলিয়েছে ১ মিনিটে, ২টা ঘর সাহায্য নিয়ে");
  assert.equal(puzzleLabel(daily), "৩ জুলাইয়ের ধাঁধা");
  assert.equal(puzzleLabel({ level: 7, day: 0 }), "লেভেল ৭ · সহজ");
  assert.match(caption(mine), /লেভেল ১২ \(মাঝারি\) মেলালাম ৪ মিনিট ১২ সেকেন্ডে/);
  assert.equal(clock(252), "০৪:১২"); assert.equal(clock(9999), "৯৯:৫৯");
  assert.equal(duration(45), "৪৫ সেকেন্ড"); assert.equal(duration(180), "৩ মিনিট");
  assert.equal(compareLine(200, 252, "রাফি"), "রাফির চেয়ে ৫২ সেকেন্ড আগে!");
  assert.equal(compareLine(252, 252, "রাফি"), "একদম সমান! রাফিও ৪ মিনিট ১২ সেকেন্ড নিয়েছিল।");
  assert.equal(compareLine(270, 252, ""), "আর একটু হলেই! মাত্র ১৮ সেকেন্ড পিছিয়ে।");
  assert.match(compareLine(400, 252, "মিম"), /^মিম এখনো ২ মিনিট ২৮ সেকেন্ড এগিয়ে/);
  for (const stars of [1, 2, 3]) assert.ok(humanLine(stars, 0, 40).length > 10);
  assert.equal(humanLine(1, 2, 40), "২টা ঘর বলে দিয়েছি, বাকি ৩৮টা তোমার নিজের।");
});

test("content meets the SEO limits and speaks তুমি", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.ok(site.title.startsWith("সুডোকু"));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.headline && site.headline !== site.title);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.faq.some(item => item.question === "কয়টা লেভেল আছে?"));
  assert.match(site.faq.map(item => item.answer).join(" "), /জ্যাম ছাড়াও/);
  assert.ok(site.steps.length >= 3);
  assert.match(site.privacy.join(" "), /সময়/);
  assert.match(site.privacy.join(" "), /নাম/);
  const everything = JSON.stringify(site) + share.preview("").description;
  assert.doesNotMatch(everything, /আপনি|করুন|দেখুন|অসাধারণ|সেরা অভিজ্ঞতা/);
  assert.doesNotMatch(everything, /বাজি|টাকা জিত|লটারি|পুরস্কার/);
});
