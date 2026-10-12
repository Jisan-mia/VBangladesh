import assert from "node:assert/strict";
import test from "node:test";
import { makeRng, pick, readLevels, recordLevel, unlockedLevel } from "../../../shared/game-core";
import { site } from "../content";
import { share } from "../share";
import { isSolved, lineTo, place, rowsDone, shuffled, solve, solvedBoard, step, type Board, type Dir } from "../lib/board";
import {
  decodeMoves, encodeMoves, hint, levelBoard, parOf, play, replay, shortBy, sizeOf, startGame, startLevel, starsOf, tap, threeStar, twoStar,
  LEVEL_COUNT, MAX_LINK_MOVES, type Game,
} from "../lib/game";
import { LEVELS } from "../lib/levels";
import { caption, clearLine, compareLine, feat, fromGame, humanLine, parseShared, previewTitle, sharedHash } from "../lib/link";

const ALL_3 = [1, 2, 3, 4, 5, 6, 7, 8];
/** The textbook solvability test, independent of how the plates are made: inversions, plus the gap's row on even sizes. */
function solvable({ size, cells, gap }: Board) {
  const tiles = cells.filter(Boolean);
  let inversions = 0;
  for (let i = 0; i < tiles.length; i++) for (let j = i + 1; j < tiles.length; j++) if (tiles[i] > tiles[j]) inversions++;
  return size % 2 ? inversions % 2 === 0 : (inversions + size - 1 - Math.floor(gap / size)) % 2 === 0;
}
const playAll = (game: Game, path: readonly Dir[], help = false) => { for (const dir of path) game = play(game, [dir], help)!; return game; };
const solvedLevel = (level: number) => playAll(startGame(level), solve(levelBoard(level)));

test("30 levels: 3×3 for 1–10, 4×4 for 11–25, 5×5 for 26–30, all different, none already solved, all solvable", () => {
  assert.equal(LEVEL_COUNT, 30);
  assert.equal(LEVELS.length, 30);
  assert.deepEqual([1, 10, 11, 25, 26, 30].map(sizeOf), [3, 3, 4, 4, 5, 5]);
  const seen = new Set<string>();
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const board = levelBoard(level);
    assert.equal(board.size, sizeOf(level));
    assert.equal(board.cells[board.gap], 0);
    assert.deepEqual([...board.cells].sort((a, b) => a - b), solvedBoard(board.size).cells.slice().sort((a, b) => a - b));
    assert.ok(!isSolved(board), `level ${level} starts solved`);
    assert.ok(solvable(board), `level ${level} fails the parity check`);
    seen.add(board.cells.join(","));
  }
  assert.equal(seen.size, 30);
});

test("3×3 par is the true shortest solution (breadth-first search), and it rises from 2", () => {
  let before = 0;
  for (let level = 1; level <= 10; level++) {
    const shortest = place(levelBoard(level), ALL_3)!;
    assert.equal(shortest.length, parOf(level), `level ${level}`);
    assert.ok(parOf(level) > before, `level ${level} is harder than the one before`);
    assert.equal(playAll(startGame(level), shortest).won, true);
    before = parOf(level);
  }
  assert.equal(parOf(1), 2, "the first plate takes two taps");
});

test("4×4 and 5×5 par is achievable: the solver's solution or the shuffle undone, whichever is shorter", () => {
  for (let level = 11; level <= LEVEL_COUNT; level++) {
    const [seed, steps, par] = LEVELS[level - 1];
    const { board, path } = shuffled(sizeOf(level), seed, steps);
    const solver = solve(board), undone = path.slice().reverse().map(dir => (dir ^ 1) as Dir);
    assert.equal(par, Math.min(solver.length, steps), `level ${level}`);
    const proof = solver.length <= steps ? solver : undone;
    const game = playAll(startGame(level), proof);
    assert.equal(game.won, true, `level ${level}`);
    assert.ok(game.moves.length <= par && starsOf(game.moves.length, level) === 3, `level ${level}: three stars are reachable`);
  }
  for (const range of [[11, 25], [26, 30]]) for (let level = range[0] + 1; level <= range[1]; level++) assert.ok(parOf(level) > parOf(level - 1), `level ${level} rises`);
});

test("the same seed gives the same plate, a different seed a different one", () => {
  assert.deepEqual(shuffled(4, 77, 60), shuffled(4, 77, 60));
  assert.notDeepEqual(shuffled(4, 77, 60).board, shuffled(4, 78, 60).board);
  assert.deepEqual(startGame(17), startGame(17));
  // The shuffle never steps straight back.
  const { path } = shuffled(5, 9, 200);
  path.forEach((dir, i) => i && assert.notEqual(dir, path[i - 1] ^ 1));
});

test("slides: a tap moves the whole line toward the gap; off-line taps and the gap itself do nothing", () => {
  const board = solvedBoard(4); // gap in cell 15
  assert.deepEqual(lineTo(board, 12), [2, 2, 2], "three to the left: the row slides right");
  assert.deepEqual(lineTo(board, 3), [0, 0, 0], "three above: the column slides down");
  assert.equal(lineTo(board, 5), null);
  assert.equal(lineTo(board, 15), null);
  assert.equal(lineTo(board, -1), null);
  assert.equal(lineTo(board, 16), null);
  assert.equal(lineTo(board, 1.5), null);
  assert.equal(step(board, 1), null, "the gap can't leave the plate");
  assert.equal(step(board, 3), null);

  let game: Game = { level: 11, board: solvedBoard(4), moves: [], helped: 0, won: false };
  game = tap(game, 12)!;
  assert.deepEqual(game.board.cells.slice(12), [0, 13, 14, 15]);
  assert.equal(game.moves.length, 3, "a line of three counts three moves");
  assert.equal(tap(game, 5), null);
  // Sliding back the way it came takes the moves away again.
  game = tap(game, 15)!;
  assert.equal(game.moves.length, 0);
  assert.equal(game.won, true);
  assert.equal(tap(game, 14), null, "nothing moves once it's solved");
});

test("rows turn complete from the top, and the last only with the whole plate", () => {
  assert.equal(rowsDone(solvedBoard(4)), 4);
  const one = step(solvedBoard(4), 0)!; // ১২ drops into the corner
  assert.equal(rowsDone(one), 2);
  assert.equal(rowsDone(levelBoard(30)) < 5, true);
});

test("stars: three within par plus a fifth, two with more room, one for any finish or with help", () => {
  for (const level of [1, 7, 12, 30]) {
    const three = threeStar(level), two = twoStar(level);
    assert.equal(three, parOf(level) + Math.floor(parOf(level) / 5));
    assert.ok(two >= three + 4);
    assert.equal(starsOf(parOf(level), level), 3);
    assert.equal(starsOf(three, level), 3);
    assert.equal(starsOf(three + 1, level), 2);
    assert.equal(starsOf(two, level), 2);
    assert.equal(starsOf(two + 1, level), 1);
    assert.equal(starsOf(parOf(level), level, 1), 1);
    assert.equal(shortBy(three, level), 0);
    assert.equal(shortBy(three + 2, level), 2, "two fewer moves for the third star");
    assert.equal(shortBy(two + 5, level), 5);
    assert.equal(shortBy(parOf(level), level, 2), 0);
  }
  assert.equal(threeStar(1), 2, "level 1: two taps for three stars");
});

test("hints: on 3×3 following them is the shortest way; on 5×5 they always finish the plate", () => {
  let game = startGame(9);
  while (!game.won) game = play(game, [hint(game)!], true)!;
  assert.equal(game.moves.length, parOf(9));
  assert.equal(game.helped, parOf(9));
  assert.equal(starsOf(game.moves.length, 9, game.helped), 1);
  game = startGame(26);
  for (let i = 0; !game.won; i++) { assert.ok(i < 2000); game = play(game, [hint(game)!], true)!; }
  assert.equal(hint(game), null);
});

test("a headless run: random taps for a while, then a solver finishes; it ends sanely", () => {
  const rng = makeRng(2024);
  for (const level of [3, 14, 27]) {
    let game = startGame(level), taps = 0;
    for (let i = 0; i < 300 && !game.won; i++) {
      const next = tap(game, pick(rng, game.board.size ** 2));
      if (next) { game = next; taps++; }
    }
    assert.ok(taps > 50, "plenty of taps land on a movable line");
    game = playAll(game, solve(game.board));
    assert.equal(game.won, true);
    assert.equal(isSolved(game.board), true);
    assert.ok(game.moves.length >= parOf(level) || sizeOf(level) > 3, "never beats a true shortest");
    assert.ok(game.moves.length < 3000);
    assert.ok([1, 2, 3].includes(starsOf(game.moves.length, level, game.helped)));
  }
});

test("moves pack three to a character and refuse anything written another way", () => {
  const moves: Dir[] = [0, 1, 2, 3, 3, 2, 1];
  const text = encodeMoves(moves);
  assert.equal(text.length, 3);
  assert.deepEqual(decodeMoves(text, 7), moves);
  assert.equal(decodeMoves(text, 6), null, "wrong length for the count");
  assert.equal(decodeMoves(encodeMoves([...moves, 3]), 7), null, "padding must be empty");
  assert.equal(decodeMoves("A!", 4), null);
  assert.equal(decodeMoves("", 0), null);
  assert.equal(decodeMoves("A".repeat(501), MAX_LINK_MOVES + 1), null);
});

test("replay: the solver's moves re-solve the level; tricks are refused", () => {
  const won = solvedLevel(12), text = encodeMoves(won.moves);
  assert.equal(replay(12, text, won.moves.length)?.moves.length, won.moves.length);
  assert.equal(replay(13, text, won.moves.length), null, "another level's moves don't solve it");
  assert.equal(replay(0, text, won.moves.length), null);
  assert.equal(replay(31, text, won.moves.length), null);
  // A move and its undo padded in: the count would be inflated, so it's refused.
  const first = won.moves[0], padded = [first, (first ^ 1) as Dir, ...won.moves];
  assert.equal(replay(12, encodeMoves(padded), padded.length), null);
  // Stopping short isn't solved.
  const short = won.moves.slice(0, -1);
  assert.equal(replay(12, encodeMoves(short), short.length), null);
});

test("links: round trip, hostile input refused, names cleaned, previews personal", () => {
  const won = solvedLevel(14);
  const real = fromGame(won, "  রাফি‮  ")!;
  assert.equal(real.name, "রাফি");
  const hash = sharedHash(real);
  assert.deepEqual(parseShared(`#${hash}`), real);
  assert.equal(share.normalize(hash), hash);
  assert.equal(share.preview(hash).title, previewTitle(real));
  assert.match(previewTitle(real), /^রাফি ১৪ নম্বর লেভেল \(৪×৪\) .+ চালে মিলিয়েছে। তুমি পারবে\?$/);
  assert.equal(share.preview("junk").title, "১৫ ঘরের ধাঁধা: ঘুঁটি ঠেলে ১ থেকে সাজাও");

  const bad = (patch: Record<string, string>) => {
    const params = new URLSearchParams(hash);
    for (const [key, value] of Object.entries(patch)) params.set(key, value);
    return share.normalize(params.toString());
  };
  assert.equal(bad({ l: "15" }), null, "moves for another level");
  assert.equal(bad({ l: "০" }), null);
  assert.equal(bad({ l: "014" }), null);
  assert.equal(bad({ t: String(real.count + 3) }), null, "a count the moves don't match");
  assert.equal(bad({ t: "-1" }), null);
  assert.equal(bad({ h: "9999" }), null, "more hints than moves");
  assert.equal(bad({ h: "1.5" }), null);
  assert.equal(bad({ m: real.moves.replace(/^./, c => (c === "A" ? "B" : "A")) }), null);
  assert.equal(share.normalize("l=1&t=2&m=" + "A".repeat(2000)), null);
  assert.equal(share.normalize(""), null);
  const long = new URLSearchParams(hash);
  long.set("n", "ক".repeat(80));
  assert.equal(parseShared(long.toString())?.name.length, 20, "names are capped");
  // Helped counts survive; one more help than moves does not.
  const helped = sharedHash({ ...real, helped: 2 });
  assert.equal(parseShared(helped)?.helped, 2);
  // A game too long for a link gives no link.
  assert.equal(fromGame({ ...won, moves: Array<Dir>(MAX_LINK_MOVES + 1).fill(0) }, ""), null);
  assert.equal(fromGame(startGame(3), ""), null, "an unsolved game has no link");
});

test("progress goes through readLevels and recordLevel; the opening level is the furthest not yet three-starred", () => {
  const saved = readLevels(JSON.stringify({ 1: 3, 2: 2, 31: 3, 4: 7, x: 1 }), LEVEL_COUNT);
  assert.deepEqual(saved, { 1: 3, 2: 2 });
  assert.deepEqual(readLevels("{broken", LEVEL_COUNT), {});
  assert.deepEqual(recordLevel(saved, 2, 1), saved, "a worse result doesn't replace a better one");
  assert.equal(recordLevel(saved, 3, 3)[3], 3);
  assert.equal(unlockedLevel(saved, LEVEL_COUNT), 3);
  assert.equal(startLevel({}, 1), 1);
  assert.equal(startLevel(saved, 3), 3);
  assert.equal(startLevel({ 1: 3, 2: 1, 3: 3 }, 4), 4);
  const everything = Object.fromEntries(Array.from({ length: 30 }, (_, i) => [i + 1, i === 6 ? 2 : 3]));
  assert.equal(startLevel(everything, 30), 7, "all cleared: back to the first one short of three stars");
});

test("result lines: kind, exact, by stars", () => {
  assert.equal(humanLine(parOf(5), 5, 0), "মাপা চাল, ঘুরপথ প্রায় নেই।");
  assert.equal(humanLine(twoStar(5), 5, 0), "মিলেছে। কয়েকটা চাল একটু ঘুরে গেছে, এই যা।");
  assert.equal(humanLine(999, 5, 0), "লম্বা পথ, তবু শেষ ঘুঁটিটা ঠিক জায়গায় বসেছে।");
  assert.equal(humanLine(8, 5, 1), "একটু সাহায্য নিয়ে হলেও সব ঘুঁটি জায়গামতো।");
  assert.equal(clearLine(1), "১ থেকে ৮, সব ঘুঁটি জায়গামতো।");
  assert.equal(clearLine(20), "১ থেকে ১৫, সব ঘুঁটি জায়গামতো।");
  assert.equal(compareLine(40, 52, "রাফি"), "রাফির চেয়ে ১২ চাল কম!");
  assert.equal(compareLine(52, 52, "রাফি"), "একদম সমান! রাফিও ৫২ চালেই মিলিয়েছিল।");
  assert.equal(compareLine(55, 52, ""), "আর একটু হলেই! মাত্র ৩ চাল বেশি।");
  assert.equal(compareLine(90, 52, "রাফি"), "রাফি এখনো ৩৮ চাল এগিয়ে। আরেকবার?");
  assert.equal(feat({ level: 3, count: 6, helped: 0, name: "" }), "এক বন্ধু ৩ নম্বর লেভেল (৩×৩) ৬ চালে মিলিয়েছে");
  assert.equal(caption({ level: 26, count: 140, helped: 1 }), "১৫ ঘরের ধাঁধার ২৬ নম্বর লেভেল (৫×৫) ১৪০ চালে মেলালাম, একটু সাহায্য নিয়ে। তুমি কত চালে পারবে?");
});

test("content meets the SEO limits and speaks তুমি", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.ok(site.title.startsWith("১৫ পাজল"), "keyword first");
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.headline && site.headline !== site.title && site.headline !== site.name);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.faq.some(item => item.question === "কয়টা লেভেল আছে?"));
  assert.ok(site.faq.some(item => /জ্যাম ছাড়াও|সুডোকু/.test(item.answer)), "names a related game");
  const all = JSON.stringify(site);
  assert.doesNotMatch(all, /আপনি|করুন|দেখুন|আপনার|অসাধারণ/);
  assert.match(site.privacy.join(" "), /লেভেল, তোমার চালগুলো/);
});
