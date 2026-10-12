import assert from "node:assert/strict";
import test from "node:test";
import { makeRng, pick, readLevels, recordLevel, unlockedLevel } from "../../../shared/game-core";
import { site } from "../content";
import { share } from "../share";
import {
  allLit, decodeMoves, encodeMoves, hint, isSolved, levelSeed, litCount, makePuzzle, newGame, play, pressMask, replay, shortBy, sizeOf, solve, starLimits, starsFor, undo,
  LEVEL_COUNT, MAX_MOVES, type Game,
} from "../lib/game";
import { caption, cardLine, clearLine, compareLine, nearMiss, parseShared, previewTitle, sharedHash } from "../lib/link";

const levels = Array.from({ length: LEVEL_COUNT }, (_, index) => index + 1);
const popcount = (mask: number) => litCount(mask);

/** Brute force: the fewest presses that light everything, over every subset (fine up to 4×4). */
function bruteMin(lit: number, size: number) {
  const cells = size * size, masks = Array.from({ length: cells }, (_, index) => pressMask(size, index));
  let best = Infinity;
  for (let subset = 0; subset < 2 ** cells; subset++) {
    let state = lit;
    for (let index = 0; index < cells; index++) if (subset & (1 << index)) state ^= masks[index];
    if (state === allLit(size)) best = Math.min(best, popcount(subset));
  }
  return best;
}

test("a press flips itself and its four neighbours, fewer at edges and corners", () => {
  assert.equal(popcount(pressMask(3, 4)), 5);
  assert.equal(popcount(pressMask(3, 0)), 3);
  assert.equal(popcount(pressMask(5, 2)), 4);
  assert.equal(pressMask(3, 4), 0b010111010);
  assert.equal(pressMask(5, 24), (1 << 24) | (1 << 23) | (1 << 19));
  for (const size of [3, 4, 5]) for (let index = 0; index < size * size; index++) {
    // Symmetric: if switch a touches bulb b, switch b touches bulb a (the solver relies on it).
    for (let other = 0; other < size * size; other++) assert.equal(Boolean(pressMask(size, index) & (1 << other)), Boolean(pressMask(size, other) & (1 << index)));
  }
});

test("the same level always gives the same board", () => {
  for (const level of levels) assert.deepEqual(makePuzzle(level), makePuzzle(level));
  assert.notEqual(makePuzzle(3).start, makePuzzle(4).start);
  assert.equal(new Set(levels.map(levelSeed)).size, LEVEL_COUNT);
});

test("every level is solvable and its par is truly the fewest presses", () => {
  for (const level of levels) {
    const puzzle = makePuzzle(level);
    assert.equal(puzzle.size, sizeOf(level));
    assert.notEqual(puzzle.start, allLit(puzzle.size), `level ${level} starts solved`);
    const answer = solve(puzzle.start, puzzle.size);
    assert.ok(answer, `level ${level} unsolvable`);
    assert.equal(answer.length, puzzle.par, `level ${level} par`);
    const game = replay(level, answer);
    assert.ok(game && isSolved(game), `level ${level} answer fails`);
    if (puzzle.size <= 4) assert.equal(bruteMin(puzzle.start, puzzle.size), puzzle.par, `level ${level} brute force`);
  }
  // Rising challenge: par never falls inside a board size, and the sizes go 3, 4, 5.
  for (const level of levels.slice(1)) if (sizeOf(level) === sizeOf(level - 1)) assert.ok(makePuzzle(level).par >= makePuzzle(level - 1).par);
  assert.deepEqual([sizeOf(1), sizeOf(10), sizeOf(11), sizeOf(20), sizeOf(21), sizeOf(30)], [3, 3, 4, 4, 5, 5]);
  assert.equal(makePuzzle(1).par, 1);
});

test("the GF(2) solver finds the shortest answer from any reachable board, and says when none exists", () => {
  const rng = makeRng(77);
  for (let round = 0; round < 300; round++) {
    const size = 3 + pick(rng, 3), cells = size * size;
    let lit = allLit(size);
    for (let count = 0; count < 1 + pick(rng, 12); count++) lit ^= pressMask(size, pick(rng, cells));
    const answer = solve(lit, size);
    assert.ok(answer);
    assert.equal(answer.reduce((state, index) => state ^ pressMask(size, index), lit), allLit(size));
    assert.equal(new Set(answer).size, answer.length);
    if (size <= 4 && round % 5 === 0) assert.equal(answer.length, bruteMin(lit, size));
  }
  assert.deepEqual(solve(allLit(5), 5), []);
  // 4×4 and 5×5 have boards no presses can fix: one dark corner bulb on 5×5 is one of them.
  assert.equal(solve(allLit(5) & ~1, 5), null);
  assert.deepEqual(solve(allLit(3) ^ pressMask(3, 4), 3), [4]);
});

test("the hint always points along a shortest way, even after wrong presses", () => {
  for (const level of [1, 7, 15, 30]) {
    let game: Game = newGame(makePuzzle(level));
    game = play(play(game, 0)!, game.puzzle.size)!;
    let presses = 0;
    while (!isSolved(game) && presses < 40) {
      const before = solve(game.lit, game.puzzle.size)!.length, index = hint(game);
      game = play(game, index)!;
      assert.equal(solve(game.lit, game.puzzle.size)!.length, before - 1);
      presses++;
    }
    assert.ok(isSolved(game));
  }
  const solved = replay(1, [4])!;
  assert.equal(hint(solved), -1);
});

test("rule edges: no presses after solving, none off the board, undo restores the board and the count", () => {
  const game = newGame(makePuzzle(5));
  assert.equal(play(game, -1), null);
  assert.equal(play(game, 9), null);
  assert.equal(play(game, 1.5), null);
  const one = play(game, 3)!, back = undo(one);
  assert.equal(back.lit, game.lit);
  assert.equal(back.moves.length, 0);
  assert.equal(undo(game), game);
  const twice = play(one, 3)!;
  assert.equal(twice.lit, game.lit);
  assert.equal(twice.moves.length, 2);
  const solved = replay(1, [4])!;
  assert.ok(isSolved(solved));
  assert.equal(play(solved, 0), null);
  assert.equal(undo(solved), solved);
});

test("a headless run of every level: random presses, then the hint, always ends lit with a sane count", () => {
  const rng = makeRng(2026);
  for (const level of levels) {
    let game: Game = newGame(makePuzzle(level));
    const cells = game.puzzle.size ** 2;
    for (let count = 0; count < 6; count++) game = play(game, pick(rng, cells)) ?? game;
    while (!isSolved(game)) game = play(game, hint(game))!;
    assert.ok(game.moves.length >= game.puzzle.par && game.moves.length <= 6 + cells);
    assert.ok([1, 2, 3].includes(starsFor(game.moves.length, game.puzzle.par, false)));
  }
});

test("star thresholds, the hint cap and near-miss numbers", () => {
  assert.deepEqual(starLimits(1), { three: 1, two: 3 });
  assert.deepEqual(starLimits(11), { three: 11, two: 17 });
  assert.equal(starsFor(5, 5, false), 3);
  assert.equal(starsFor(4, 5, false), 3);
  assert.equal(starsFor(8, 5, false), 2);
  assert.equal(starsFor(9, 5, false), 1);
  assert.equal(starsFor(5, 5, true), 2);
  assert.equal(starsFor(30, 5, true), 1);
  assert.equal(shortBy(5, 5, false), 0);
  assert.equal(shortBy(7, 5, false), 2);
  assert.equal(shortBy(10, 5, false), 2);
  assert.equal(shortBy(5, 5, true), 0);
  assert.equal(nearMiss(7, 5, false), "আর ২ চাল কম হলে ৩ তারা।");
  assert.equal(nearMiss(10, 5, false), "আর ২ চাল কম হলে ২ তারা।");
  assert.equal(nearMiss(5, 5, true), "হিন্ট ছাড়া পারলে ৩ তারা পাবে।");
  assert.equal(nearMiss(7, 5, true), "হিন্ট ছাড়া, আর ২ চাল কম হলে ৩ তারা।");
  assert.equal(nearMiss(5, 5, false), "");
});

test("progress goes through the shared readLevels and recordLevel", () => {
  let stars = readLevels(null, LEVEL_COUNT);
  assert.equal(unlockedLevel(stars, LEVEL_COUNT), 1);
  stars = recordLevel(stars, 1, starsFor(1, 1, false));
  stars = recordLevel(stars, 1, starsFor(9, 1, false));
  assert.equal(stars[1], 3);
  const saved = readLevels(JSON.stringify({ ...stars, 2: 2, 31: 3, x: 1, 3: 9 }), LEVEL_COUNT);
  assert.deepEqual(saved, { 1: 3, 2: 2 });
  assert.equal(unlockedLevel(saved, LEVEL_COUNT), 3);
  assert.deepEqual(readLevels("{broken", LEVEL_COUNT), {});
});

test("lines are kind, concrete and fit the result", () => {
  for (const level of levels) assert.ok(clearLine(level).length > 10 && !/অসাধারণ|দারুণ|!!/.test(clearLine(level)));
  assert.match(cardLine(5, 5, false), /বাড়তি/);
  assert.match(cardLine(7, 5, false), /৭/);
  assert.equal(compareLine(4, 6, "রাফি"), "রাফির চেয়ে ২ চাল কম!");
  assert.equal(compareLine(6, 6, "রাফি"), "একদম সমান! রাফিও ৬ চালে পেরেছিল।");
  assert.equal(compareLine(7, 6, "রাফি"), "আর একটু হলেই! মাত্র ১ চাল বেশি।");
  assert.match(compareLine(12, 6, ""), /বন্ধু এখনো ৬ চাল এগিয়ে/);
  assert.match(caption({ level: 1, moves: [4], hinted: false }), /১ চালেই/);
});

test("a challenge link round-trips and is replayed press by press", () => {
  const moves = solve(makePuzzle(12).start, 4)!;
  const hash = sharedHash({ level: 12, moves, hinted: false, name: "রাফি" });
  const parsed = parseShared(`#${hash}`);
  assert.deepEqual(parsed, { level: 12, moves, hinted: false, name: "রাফি" });
  assert.equal(previewTitle(parsed!), `রাফি লেভেল ১২-এর সব বাতি ${["", "১", "২", "৩"][moves.length]} চালে জ্বালিয়েছে। তুমি পারবে?`);
  const helped = parseShared(sharedHash({ level: 1, moves: [0, 0, 4], hinted: true, name: "" }))!;
  assert.equal(helped.hinted, true);
  assert.equal(share.normalize(hash), hash);
  assert.match(share.preview(hash).title, /রাফি/);
  assert.equal(decodeMoves(encodeMoves([0, 9, 10, 24]), 5)!.join(), "0,9,10,24");
});

test("forged, broken or hostile links are refused", () => {
  const good = new URLSearchParams(sharedHash({ level: 1, moves: [4], hinted: false, name: "মিম" }));
  const variant = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(good);
    for (const [key, value] of Object.entries(changes)) value === null ? params.delete(key) : params.set(key, value);
    return params.toString();
  };
  for (const bad of [
    variant({ t: "0" }), variant({ t: "2" }), variant({ m: "0" }), variant({ m: "44" }), variant({ m: "9" }), variant({ m: "" }), variant({ m: null }),
    variant({ l: "31" }), variant({ l: "0" }), variant({ l: "01" }), variant({ l: "2" }), variant({ s: String(levelSeed(2)) }), variant({ s: "-1" }),
    variant({ h: "2" }), variant({ t: String(MAX_MOVES + 1) }), variant({ m: "4".repeat(MAX_MOVES + 1), t: String(MAX_MOVES + 1) }),
    "", "#", "garbage", "s=1&t=1", `#${"a".repeat(700)}`, "<script>alert(1)</script>",
  ]) {
    assert.equal(parseShared(bad), null, bad);
    assert.equal(share.normalize(bad), null);
  }
  const hostileName = parseShared(variant({ n: "‮রাফি\u0000" + "ক".repeat(40) }))!;
  assert.ok(hostileName.name.length <= 20 && !hostileName.name.includes("‮"));
  assert.equal(share.preview("junk").title.length > 0, true);
});

test("content meets the SEO limits and speaks তুমি", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.match(site.title, /^বাতি জ্বালানোর ধাঁধা/);
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.headline && site.headline !== site.title);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.faq.some(item => item.question === "কয়টা লেভেল আছে?"));
  assert.ok(site.faq.some(item => /জ্যাম ছাড়াও|পাকা-কাঁচা/.test(item.answer)));
  assert.match(site.privacy.join(" "), /নাম/);
  assert.match(site.privacy.join(" "), /চাল/);
  const all = JSON.stringify(site);
  assert.doesNotMatch(all, /আপনি|করুন|দেখুন|Lights Out|লাইটস আউট/);
});
