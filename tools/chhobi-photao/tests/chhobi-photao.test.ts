import assert from "node:assert/strict";
import test from "node:test";
import { makeRng, pick, readLevels, recordLevel, unlockedLevel } from "../../../shared/game-core";
import { site } from "../content";
import { share } from "../share";
import {
  applyHint, doneLines, hint, isSolved, levelSeed, lineStates, markFor, mistakes, newGame, paint, puzzleOf, shortBy, sizeOf, starsFor, undo,
  LEVEL_COUNT, type Game,
} from "../lib/game";
import { caption, cardLine, clearLine, compareLine, feat, nearMiss, parseShared, previewTitle, sharedHash, timeText, MAX_SECONDS } from "../lib/link";
import { worldIndex } from "../lib/levels";
import { strokeOrder } from "../lib/play";
import { cluesOf, settleLine, solveByLines } from "../lib/nonogram";
import { PICTURES } from "../lib/pictures";

const levels = Array.from({ length: LEVEL_COUNT }, (_, index) => index + 1);

/** Every solution, by trying each row's possible placements and checking columns as rows are added (independent of the line solver). */
function countSolutions(rows: number[][], cols: number[][], limit = 2) {
  const size = rows.length;
  const placements = (clue: number[]) => {
    const out: boolean[][] = [];
    const walk = (block: number, start: number, line: boolean[]) => {
      if (block === clue.length) { out.push([...line, ...Array(size - line.length).fill(false)]); return; }
      for (let at = start; at + clue[block] <= size; at++) {
        const next = [...line, ...Array(at - line.length).fill(false), ...Array(clue[block]).fill(true)];
        if (next.length < size) next.push(false);
        walk(block + 1, next.length, next);
      }
    };
    walk(0, 0, []);
    return out;
  };
  const options = rows.map(placements);
  let found = 0;
  const grid: boolean[][] = [];
  const colsOk = (complete: boolean) => cols.every((clue, col) => {
    const runs = cluesOf(grid.map(row => row[col]));
    if (complete) return runs.length === clue.length && runs.every((run, index) => run === clue[index]);
    // A partial column may not have more runs than its clue, nor a closed run longer than the clue's.
    if (runs.length > clue.length) return false;
    return runs.every((run, index) => run <= clue[index]);
  });
  const go = (row: number) => {
    if (found >= limit) return;
    if (row === size) { if (colsOk(true)) found++; return; }
    for (const option of options[row]) { grid.push(option); if (colsOk(false)) go(row + 1); grid.pop(); }
  };
  go(0);
  return found;
}

test("one line: clues, and what line logic forces", () => {
  assert.deepEqual(cluesOf([1, 1, 0, 1, 0]), [2, 1]);
  assert.deepEqual(cluesOf([0, 0, 0]), []);
  assert.deepEqual([...settleLine([5], [-1, -1, -1, -1, -1])!], [1, 1, 1, 1, 1]);
  assert.deepEqual([...settleLine([3], [-1, -1, -1, -1])!], [-1, 1, 1, -1]);
  assert.deepEqual([...settleLine([], [-1, -1, -1])!], [0, 0, 0]);
  assert.deepEqual([...settleLine([1, 1], [1, -1, -1])!], [1, 0, 1]);
  assert.equal(settleLine([2], [1, 0, 1]), null);
  // Two diagonal cells can go either way: logic alone is stuck, as it should be.
  assert.deepEqual([...solveByLines({ rows: [[1], [1]], cols: [[1], [1]] })!], [-1, -1, -1, -1]);
});

test("every picture is square, sizes only grow from 5×5 to 10×10, and each has its own colours and line", () => {
  assert.equal(LEVEL_COUNT, 30);
  assert.equal(new Set(PICTURES.map(picture => picture.name)).size, LEVEL_COUNT);
  for (const level of levels) {
    const { art, colors, bg, line } = PICTURES[level - 1];
    assert.ok(art.every(row => row.length === art.length), `level ${level} not square`);
    for (const letter of art.join("")) assert.ok(letter === "." || /^#[0-9a-f]{6}$/i.test(colors[letter] ?? ""), `level ${level} letter ${letter} has no colour`);
    assert.match(bg, /^#[0-9a-f]{6}$/i);
    assert.ok(line.length > 8 && !/অসাধারণ|দারুণ|!!/.test(line));
    const { rows, cols } = puzzleOf(level);
    assert.ok(rows.every(clue => clue.length) || level > 1, "level 1 has no empty rows");
    assert.ok(rows.flat().length && cols.flat().length);
    if (level > 1) assert.ok(sizeOf(level) >= sizeOf(level - 1));
  }
  assert.deepEqual([sizeOf(1), sizeOf(5), sizeOf(6), sizeOf(30)], [5, 5, 6, 10]);
  assert.deepEqual(puzzleOf(1).rows[0], [5], "level 1 opens with an obvious row");
});

test("every picture is solvable by line logic alone, so its answer is unique (and a brute-force count agrees)", () => {
  assert.equal(countSolutions([[1], [1]], [[1], [1]]), 2, "the counter sees ambiguity");
  for (const level of levels) {
    const puzzle = puzzleOf(level);
    const grid = solveByLines(puzzle);
    assert.ok(grid, `level ${level} contradicts itself`);
    assert.ok(grid.every((value, index) => value === (puzzle.solution[index] ? 1 : 0)), `level ${level} needs guessing`);
    assert.equal(countSolutions(puzzle.rows, puzzle.cols), 1, `level ${level} has another answer`);
  }
});

test("the same level always gives the same puzzle, with its own seed", () => {
  for (const level of levels) assert.deepEqual(puzzleOf(level).rows, puzzleOf(level).rows);
  assert.equal(new Set(levels.map(levelSeed)).size, LEVEL_COUNT);
  assert.deepEqual(newGame(7), newGame(7));
  assert.deepEqual(worldIndex(1), 0); assert.equal(worldIndex(10), 0); assert.equal(worldIndex(11), 1); assert.equal(worldIndex(30), 2);
});

test("marks, strokes and undo", () => {
  assert.equal(markFor(0, "fill"), 1); assert.equal(markFor(1, "fill"), 0); assert.equal(markFor(2, "fill"), 1);
  assert.equal(markFor(0, "cross"), 2); assert.equal(markFor(2, "cross"), 0); assert.equal(markFor(1, "cross"), 2);
  const game = newGame(1);
  assert.equal(paint(game, [], 1), null);
  assert.equal(paint(game, [-1, 25, 1.5], 1), null);
  const row = paint(game, [0, 1, 2, 3, 4], 1)!;
  assert.equal(row.history.length, 1);
  assert.equal(lineStates(row).rows[0], "done");
  assert.equal(doneLines(row), 1);
  const dragged = paint(row, [5], 1, false)!;
  assert.equal(dragged.history.length, 1, "one undo step per stroke");
  assert.deepEqual(undo(dragged).cells, game.cells);
  assert.equal(undo(game), game);
});

test("mistakes count each wrong cell once, even after it's wiped; over-full lines turn red", () => {
  let game = newGame(1);
  game = paint(game, [6], 1)!; // row 1 is "1 1 1": cell 6 is a gap
  assert.equal(mistakes(game), 1);
  game = paint(game, [6], 0)!;
  game = paint(game, [6], 1)!;
  assert.equal(mistakes(game), 1);
  game = paint(game, [5, 6, 7, 8], 1)!;
  assert.equal(mistakes(game), 2);
  assert.equal(lineStates(game).rows[1], "over");
  assert.equal(lineStates(newGame(1)).rows[1], "");
});

test("the hint fixes wrong marks first, then gives a cell logic can prove; a solved board refuses more marks", () => {
  let game = paint(newGame(3), [0], 1)!; // ঘুড়ি: cell 0 is empty
  assert.deepEqual(hint(game), { index: 0, to: 0 });
  game = paint(game, [0], 0)!;
  game = paint(game, [2], 2)!; // a ✕ on a filled cell
  assert.deepEqual(hint(game), { index: 2, to: 1 });
  for (const level of levels) {
    let walk: Game = newGame(level);
    let steps = 0;
    while (!isSolved(walk) && steps < 400) {
      const help = applyHint(walk)!;
      assert.ok(help, `level ${level} hint stuck`);
      walk = help.game; steps++;
    }
    assert.ok(isSolved(walk), `level ${level} not solved by hints`);
    assert.equal(mistakes(walk), 0);
    assert.equal(starsFor(mistakes(walk), walk.hints > 0), 2);
    assert.equal(paint(walk, [0], 2), null);
    assert.equal(hint(walk), null);
    assert.equal(undo(walk), walk);
  }
});

test("a headless run: random strokes with slips, then fixes, always ends solved with a sane count", () => {
  const rng = makeRng(2026);
  for (const level of levels) {
    const { size, solution } = puzzleOf(level);
    let game: Game = newGame(level);
    for (let count = 0; count < 12; count++) {
      const start = pick(rng, size * size), end = (Math.floor(start / size)) * size + pick(rng, size);
      game = paint(game, strokeOrder(size, start, end, "row"), pick(rng, 3) as 0 | 1 | 2) ?? game;
    }
    // Then play perfectly: wipe every wrong fill, fill every picture cell.
    game = paint(game, solution.flatMap((filled, index) => !filled && game.cells[index] === 1 ? [index] : []), 0) ?? game;
    game = paint(game, solution.flatMap((filled, index) => filled ? [index] : []), 1) ?? game;
    assert.ok(isSolved(game), `level ${level}`);
    assert.ok(mistakes(game) <= size * size - solution.filter(Boolean).length);
    assert.ok([1, 2, 3].includes(starsFor(mistakes(game), false)));
  }
});

test("star thresholds and near-miss numbers", () => {
  assert.equal(starsFor(0, false), 3);
  assert.equal(starsFor(1, false), 2);
  assert.equal(starsFor(2, false), 2);
  assert.equal(starsFor(3, false), 1);
  assert.equal(starsFor(0, true), 2);
  assert.equal(starsFor(5, true), 1);
  assert.equal(shortBy(0, false), 0);
  assert.equal(shortBy(2, false), 2);
  assert.equal(shortBy(5, false), 3);
  assert.equal(shortBy(1, true), 0);
  assert.equal(nearMiss(1, false), "আর ১টা ভুল ঘর কম হলে ৩ তারা।");
  assert.equal(nearMiss(4, false), "আর ২টা ভুল ঘর কম হলে ২ তারা।");
  assert.equal(nearMiss(0, true), "হিন্ট ছাড়া পারলে ৩ তারা পাবে।");
  assert.equal(nearMiss(2, true), "হিন্ট ছাড়া, কোনো ভুল ঘর না ভরে পারলে ৩ তারা।");
  assert.equal(nearMiss(0, false), "");
});

test("progress goes through the shared readLevels and recordLevel, and opens at the right level", () => {
  let stars = readLevels(null, LEVEL_COUNT);
  assert.equal(unlockedLevel(stars, LEVEL_COUNT), 1);
  stars = recordLevel(stars, 1, starsFor(0, false));
  stars = recordLevel(stars, 1, starsFor(4, false));
  assert.equal(stars[1], 3);
  const saved = readLevels(JSON.stringify({ ...stars, 2: 2, 31: 3, x: 1, 3: 9 }), LEVEL_COUNT);
  assert.deepEqual(saved, { 1: 3, 2: 2 });
  assert.equal(unlockedLevel(saved, LEVEL_COUNT), 3);
  assert.deepEqual(readLevels("{broken", LEVEL_COUNT), {});
});

test("lines are kind, concrete and fit the result", () => {
  assert.equal(timeText(45), "৪৫ সেকেন্ড");
  assert.equal(timeText(130), "২ মিনিট ১০ সেকেন্ড");
  assert.equal(timeText(180), "৩ মিনিট");
  for (const level of levels) assert.ok(clearLine(level).length > 8);
  assert.match(clearLine(30), /৩০টা ছবিই/);
  assert.match(cardLine({ seconds: 70, mistakes: 0, hinted: false }), /একটা ঘরও ভুল ভরিনি/);
  assert.match(cardLine({ seconds: 70, mistakes: 2, hinted: false }), /ভুল ঘর ২টা/);
  assert.match(cardLine({ seconds: 70, mistakes: 0, hinted: true }), /হিন্ট/);
  assert.equal(compareLine(40, 60, "রাফি"), "রাফির চেয়ে ২০ সেকেন্ড আগে!");
  assert.equal(compareLine(60, 60, "রাফি"), "একদম সমান! রাফিও ১ মিনিট নিয়েছিল।");
  assert.equal(compareLine(70, 60, "রাফি"), "আর একটু হলেই! মাত্র ১০ সেকেন্ড পিছিয়ে।");
  assert.match(compareLine(200, 60, ""), /বন্ধু এখনো ২ মিনিট ২০ সেকেন্ড এগিয়ে/);
  assert.match(caption({ level: 3, seconds: 42, mistakes: 0, hinted: false }), /৪২ সেকেন্ডে/);
});

test("a challenge link round-trips", () => {
  const hash = sharedHash({ level: 17, seconds: 130, mistakes: 1, hinted: false, name: "রাফি" });
  const parsed = parseShared(`#${hash}`);
  assert.deepEqual(parsed, { level: 17, seconds: 130, mistakes: 1, hinted: false, name: "রাফি" });
  assert.equal(previewTitle(parsed!), "রাফি লেভেল ১৭-এর ছবি ২ মিনিট ১০ সেকেন্ডে ফুটিয়েছে। তুমি পারবে?");
  assert.equal(feat({ level: 1, seconds: 9, name: "" }), "এক বন্ধু লেভেল ১-এর ছবি ৯ সেকেন্ডে ফুটিয়েছে");
  assert.equal(parseShared(sharedHash({ level: 1, seconds: 20, mistakes: 0, hinted: true, name: "" }))!.hinted, true);
  assert.equal(parseShared(sharedHash({ level: 1, seconds: 99999, mistakes: 0, hinted: false, name: "" }))!.seconds, MAX_SECONDS);
  assert.equal(share.normalize(hash), hash);
  assert.match(share.preview(hash).title, /রাফি/);
});

test("forged, broken or hostile links are refused", () => {
  const good = new URLSearchParams(sharedHash({ level: 1, seconds: 30, mistakes: 0, hinted: false, name: "মিম" }));
  const variant = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(good);
    for (const [key, value] of Object.entries(changes)) value === null ? params.delete(key) : params.set(key, value);
    return params.toString();
  };
  for (const bad of [
    variant({ t: "0" }), variant({ t: String(MAX_SECONDS + 1) }), variant({ t: "1.5" }), variant({ m: "" }), variant({ m: null }), variant({ m: "-1" }), variant({ m: "01" }),
    variant({ m: "7" }), // level 1 has only 4 empty cells
    variant({ m: "100" }), variant({ l: "31" }), variant({ l: "0" }), variant({ l: "01" }), variant({ l: "2" }), variant({ s: String(levelSeed(2)) }), variant({ s: "-1" }),
    variant({ h: "2" }), variant({ h: "" }), "", "#", "garbage", "s=1&t=1", `#${"a".repeat(700)}`, "<script>alert(1)</script>",
  ]) {
    assert.equal(parseShared(bad), null, bad);
    assert.equal(share.normalize(bad), null);
  }
  const hostileName = parseShared(variant({ n: "‮রাফি\u0000" + "ক".repeat(40) }))!;
  assert.ok(hostileName.name.length <= 20 && !hostileName.name.includes("‮"));
  assert.ok(share.preview("junk").title.length > 0);
});

test("content meets the SEO limits and speaks তুমি", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.match(site.title, /^ননোগ্রাম/);
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.headline && site.headline !== site.title);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.faq.some(item => item.question === "কয়টা লেভেল আছে?"));
  assert.ok(site.faq.some(item => /সুইচবোর্ড|জ্যাম ছাড়াও/.test(item.answer)));
  for (const word of ["নাম", "সময়", "ভুল ঘর", "লেভেল"]) assert.match(site.privacy.join(" "), new RegExp(word));
  const all = JSON.stringify(site) + JSON.stringify(PICTURES);
  assert.doesNotMatch(all, /আপনি|করুন|দেখুন|Picross|পিক্রস|Nintendo/i);
});
