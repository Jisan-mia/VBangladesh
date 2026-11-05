import assert from "node:assert/strict";
import test from "node:test";
import { makeRng, pick, readLevels, recordLevel, unlockedLevel } from "../../../shared/game-core";
import { site } from "../content";
import { share } from "../share";
import {
  allLit, bits, canPress, cellsOf, isLine, isTaped, lineMask, plusMask, pressMask, pressesLeft, reachOf, solutions, solve, switchCount, MAX_SWITCHES, type Board,
} from "../lib/board";
import { LEGACY_COUNT, legacyStart, levelSeed } from "../lib/legacy";
import { LEVEL_COUNT, PER_WORLD, WORLDS, isFinale, levelOf, needsOf, worldOf } from "../lib/levels";
import { badge, caption, cardLine, clearLine, compareLine, decodeMoves, encodeMoves, feat, finishTitle, hintLine, houseLine, nearMiss, parseShared, previewTitle, sharedHash } from "../lib/link";
import { footprint, isSolved, newGame, press, puzzleOf, replay, shortBy, starLimits, starsFor, teach, undo, withHint, MAX_MOVES, type Game } from "../lib/play";
import { OPEN_KEY, openAfter, readOpen, startLevel } from "../lib/save";
import * as F from "../lib/flow";
import { countAt, easeOut, humLevel } from "../lib/count.hot";
import { CASUAL, SHARP, playOnce, rates } from "./bot";

const levels = Array.from({ length: LEVEL_COUNT }, (_, index) => index + 1);
/** Brute force over every set of pressable switches: the fewest that light everything (boards up to ~20 switches). */
function bruteMin(board: Board, lit: number) {
  const ids = Array.from({ length: switchCount(board) }, (_, id) => id).filter(id => canPress(board, id));
  let best = Infinity;
  for (let set = 0; set < 2 ** ids.length; set++) {
    let state = lit;
    for (let k = 0; k < ids.length; k++) if (set & (1 << k)) state ^= pressMask(board, ids[k]);
    if (state === allLit(board.size)) best = Math.min(best, bits(set));
  }
  return best === Infinity ? -1 : best;
}
const flowAt = (f: F.Flow, ...steps: ((f: F.Flow) => F.Flow)[]) => steps.reduce((state, step) => step(state), f);

// ---- the wiring and the solver ----

test("wiring: a bulb's switch flips it and its four neighbours, a line switch its whole row or column", () => {
  assert.equal(bits(plusMask(3, 4)), 5);
  assert.equal(bits(plusMask(3, 0)), 3);
  assert.equal(bits(plusMask(5, 2)), 4);
  assert.equal(lineMask(5, { kind: "row", at: 1 }), 0b11111 << 5);
  assert.equal(lineMask(4, { kind: "col", at: 0 }), 1 | 1 << 4 | 1 << 8 | 1 << 12);
  const board: Board = { size: 4, taped: 1 << 5, lines: [{ kind: "row", at: 2 }] };
  assert.equal(switchCount(board), 17);
  assert.ok(isLine(board, 16) && !isLine(board, 15));
  assert.ok(isTaped(board, 5) && !canPress(board, 5) && canPress(board, 16) && !canPress(board, 17) && !canPress(board, -1));
  assert.equal(pressMask(board, 16), lineMask(4, { kind: "row", at: 2 }));
  assert.equal(pressMask(board, 99), 0);
  // Bulb 5's reach leaves out its own taped switch.
  assert.deepEqual(reachOf(board, 5), [1, 4, 6, 9]);
});

test("solver: the fewest presses, checked by brute force on plain, taped and lined boards, and 'no answer' when there is none", () => {
  const rng = makeRng(77);
  for (let round = 0; round < 160; round++) {
    const size = 3 + pick(rng, 2), cells = size * size;
    let taped = 0;
    for (let k = 0; k < pick(rng, 4); k++) taped |= 1 << pick(rng, cells);
    const lines = Array.from({ length: pick(rng, 3) }, () => ({ kind: pick(rng, 2) ? "row" as const : "col" as const, at: pick(rng, size) }));
    const board: Board = { size, taped, lines };
    const ids = Array.from({ length: switchCount(board) }, (_, id) => id).filter(id => canPress(board, id));
    let lit = allLit(size);
    for (let k = 0; k < 1 + pick(rng, 8); k++) lit ^= pressMask(board, ids[pick(rng, ids.length)]);
    const all = solutions(board, lit);
    assert.ok(all && all.length, "a board made by presses can be lit");
    const min = bruteMin(board, lit);
    for (const answer of all) {
      assert.equal(answer.length, min);
      assert.equal(answer.reduce((state, id) => state ^ pressMask(board, id), lit), allLit(size));
      assert.ok(answer.every(id => canPress(board, id)));
    }
  }
  assert.deepEqual(solve({ size: 5, taped: 0, lines: [] }, allLit(5)), []);
  // 5×5 has boards no presses can fix: one dark corner is one of them.
  assert.equal(solve({ size: 5, taped: 0, lines: [] }, allLit(5) & ~1), null);
  assert.equal(pressesLeft({ size: 5, taped: 0, lines: [] }, allLit(5) & ~1), -1);
});

// ---- the ladder ----

test("ladder: three houses of ten, each level one new line, a named finale closing every house", () => {
  assert.equal(WORLDS.length * PER_WORLD, LEVEL_COUNT);
  assert.equal(new Set(levels.map(level => levelOf(level).line)).size, LEVEL_COUNT, "each level says one new thing of its own");
  for (const level of levels) {
    const info = levelOf(level);
    assert.equal(Boolean(info.finale), isFinale(level), `level ${level}: a finale exactly at the end of a house`);
    assert.ok(info.line.length <= 95, `level ${level}: one short line (${info.line.length})`);
    assert.equal(info.line, info.line.normalize("NFC"));
  }
  assert.deepEqual(levels.filter(isFinale).map(level => levelOf(level).finale), ["নানার বোর্ড", "পরীক্ষার আগের রাত", "বরযাত্রী আসছে"]);
  assert.deepEqual([1, 10, 11, 20, 21, 30].map(worldOf), [1, 1, 2, 2, 3, 3]);
  // One new rule per house: no tape or lines in the first, tape (no lines) in the second, lines in every level of the third.
  for (const level of levels) {
    const { board } = levelOf(level), world = worldOf(level);
    if (world === 1) assert.ok(!board.taped && !board.lines.length, `level ${level}`);
    if (world === 2) assert.ok(board.taped && !board.lines.length, `level ${level}`);
    if (world === 3) assert.ok(board.lines.length > 0, `level ${level}`);
  }
});

test("ladder: every level is solvable, its par is proven the fewest presses, and the new rule is really needed", () => {
  for (const level of levels) {
    const { board, start, par } = levelOf(level);
    assert.notEqual(start, allLit(board.size), `level ${level} starts lit`);
    assert.ok(switchCount(board) - bits(board.taped) <= MAX_SWITCHES);
    const best = solutions(board, start)!;
    assert.ok(best.length, `level ${level} unsolvable`);
    assert.equal(best[0].length, par, `level ${level} par`);
    if (switchCount(board) <= 20) assert.equal(bruteMin(board, start), par, `level ${level} brute force`);
    const game = replay(puzzleOf(level)!, best[0]);
    assert.ok(game && isSolved(game), `level ${level} answer lights the board`);
    // Its par fits the star rule: ★★★ is reachable exactly at par.
    assert.equal(starsFor(par, par, false), 3);
    const needs = needsOf(level);
    if (needs === "line" || needs === "cross") assert.ok(best.every(answer => answer.some(id => isLine(board, id))), `level ${level}: every best answer uses a line switch`);
    if (needs === "cross") assert.ok(best.every(answer => new Set(answer.filter(id => isLine(board, id)).map(id => board.lines[id - cellsOf(board)].kind)).size === 2));
    if (needs === "tape") {
      const near = Array.from({ length: cellsOf(board) }, (_, bulb) => bulb).some(bulb => !(start & (1 << bulb)) && reachOf(board, bulb).length < bits(plusMask(board.size, bulb)));
      assert.ok(near, `level ${level}: a dark bulb sits beside a tape`);
    }
  }
  // Par never falls inside a house, and level 1 is one press.
  for (const level of levels.slice(1)) if (worldOf(level) === worldOf(level - 1)) assert.ok(levelOf(level).par >= levelOf(level - 1).par, `level ${level}`);
  assert.equal(levelOf(1).par, 1);
});

test("ladder: every start is pinned, so a change can't quietly swap the board behind a link", () => {
  assert.deepEqual(levels.map(level => levelOf(level).start), [
    325, 500, 56, 334, 32, 262, 4900, 41452, 61972, 57319, 36273, 58646, 7062, 38880, 29483263,
    15828056, 1588790, 18458994, 1106824, 12097197, 33522687, 31389690, 16235700, 26394719, 1680359, 22922279, 23575067, 8576111, 23925518, 24578182,
  ]);
  assert.deepEqual(levelOf(5), levelOf(5));
});

test("old boards: the 30 boards behind links from before the rewrite are rebuilt exactly", () => {
  const pinned = [[3, 325, 1], [3, 500, 1], [3, 283, 2], [3, 334, 2], [3, 470, 3], [3, 93, 3], [3, 174, 4], [3, 436, 4], [3, 22, 5], [3, 147, 5], [4, 53861, 3], [4, 46460, 3], [4, 54112, 4], [4, 59149, 4], [4, 40991, 5], [4, 24597, 5], [4, 3727, 6], [4, 18808, 6], [4, 26517, 7], [4, 58292, 7], [5, 7859807, 4], [5, 3793105, 5], [5, 22485303, 5], [5, 24140413, 6], [5, 20741167, 6], [5, 11334439, 7], [5, 10517526, 8], [5, 21460822, 9], [5, 24082583, 10], [5, 21635803, 11]];
  assert.deepEqual(Array.from({ length: LEGACY_COUNT }, (_, index) => { const { size, start, par } = legacyStart(index + 1); return [size, start, par]; }), pinned);
});

// ---- difficulty, by bots ----

test("bots: the first lessons always give three stars, every level is fair for a casual player, and each finale is its house's hardest", () => {
  const three = levels.map(level => rates(puzzleOf(level)!, CASUAL, 150).three);
  const two = levels.map(level => rates(puzzleOf(level)!, CASUAL, 150).two);
  for (const level of [1, 2, 21]) assert.equal(three[level - 1], 1, `level ${level}: the guided first press`);
  levels.forEach((level, index) => assert.ok(two[index] >= 0.25, `level ${level}: casual ★★ rate ${two[index]}`));
  for (let world = 1; world <= WORLDS.length; world++) {
    const from = (world - 1) * PER_WORLD, house = three.slice(from, from + PER_WORLD);
    const finale = house[PER_WORLD - 1];
    assert.ok(house.slice(0, -1).every(rate => rate > finale), `house ${world}: finale ${finale} is the hardest (${house.join(" ")})`);
    for (let k = 1; k < PER_WORLD; k++) assert.ok(house[k] <= house[k - 1] + 0.2, `house ${world} level ${from + k + 1} not much easier than the one before`);
  }
  assert.ok(three[LEVEL_COUNT - 1] <= 0.12, `the last finale is a real boss for a casual player (${three[LEVEL_COUNT - 1]})`);
  // A sharp player (the solver) gets three stars everywhere.
  for (const level of levels) assert.equal(playOnce(puzzleOf(level)!, 1, SHARP).stars, 3, `level ${level}`);
});

// ---- the hint that teaches ----

test("hint: always a switch on a shortest way (even after wrong presses), with its footprint, its reason and the presses left", () => {
  const reasons = new Set<string>();
  for (const level of levels) {
    let game: Game = newGame(puzzleOf(level)!);
    const rng = makeRng(level);
    for (let k = 0; k < 2; k++) {
      const ids = Array.from({ length: switchCount(game.puzzle.board) }, (_, id) => id).filter(id => canPress(game.puzzle.board, id));
      game = press(game, ids[pick(rng, ids.length)]) ?? game;
    }
    let guard = 0;
    while (!isSolved(game) && guard++ < 40) {
      const before = pressesLeft(game.puzzle.board, game.lit), hint = teach(game)!;
      assert.equal(hint.rest, before - 1);
      assert.deepEqual({ on: hint.on, off: hint.off }, footprint(game.puzzle.board, game.lit, hint.id));
      if (hint.why === "only") assert.deepEqual(reachOf(game.puzzle.board, hint.only), [hint.id]);
      reasons.add(hint.why);
      const line = hintLine(hint);
      assert.ok(line.length < 120 && /চাল/.test(line), line);
      game = press(withHint(game), hint.id)!;
      assert.equal(pressesLeft(game.puzzle.board, game.lit), before - 1);
    }
    assert.ok(isSolved(game) && game.hinted && game.hints > 0);
  }
  assert.deepEqual([...reasons].sort(), ["dip", "gain", "line", "only"], "every kind of reason gets taught somewhere");
  assert.equal(teach(replay(puzzleOf(1)!, [4])!), null);
  assert.equal(hintLine({ id: 4, on: 0b11111, off: 0, rest: 0, why: "gain", only: -1, line: null }), "এটা চাপলে ৫টা জ্বলবে। এটাই শেষ চাল।");
  assert.equal(hintLine({ id: 9, on: 0b111, off: 0b11, rest: 3, why: "line", only: -1, line: "row" }), "লম্বা সুইচটা পুরো সারি উল্টাবে: ৩টা জ্বলবে, ২টা নিভবে। তারপর আর ৩ চাল।");
});

// ---- rules of play ----

test("rules: taped and off-board switches refuse, nothing after the last bulb, take-back restores the board and counts itself", () => {
  const game = newGame(puzzleOf(11)!);
  assert.equal(press(game, 5), null, "taped");
  assert.equal(press(game, -1), null);
  assert.equal(press(game, 16), null);
  assert.equal(press(game, 1.5), null);
  const one = press(game, 3)!, back = undo(one);
  assert.equal(back.lit, game.lit);
  assert.equal(back.moves.length, 0);
  assert.equal(back.undos, 1);
  assert.equal(undo(game), game);
  const done = replay(puzzleOf(1)!, [4])!;
  assert.ok(isSolved(done));
  assert.equal(press(done, 0), null);
  assert.equal(undo(done), done);
  let long = newGame(puzzleOf(5)!);
  for (let k = 0; k < MAX_MOVES; k++) long = press(long, k % 2 ? 0 : 1) ?? long;
  assert.equal(press(long, 2), null, "the move cap");
});

test("stars: thresholds, the hint cap and the near-miss numbers (unchanged, so links keep their stars)", () => {
  assert.deepEqual(starLimits(1), { three: 1, two: 3 });
  assert.deepEqual(starLimits(11), { three: 11, two: 17 });
  assert.equal(starsFor(5, 5, false), 3);
  assert.equal(starsFor(8, 5, false), 2);
  assert.equal(starsFor(9, 5, false), 1);
  assert.equal(starsFor(5, 5, true), 2);
  assert.equal(shortBy(7, 5, false), 2);
  assert.equal(shortBy(5, 5, true), 0);
  assert.equal(nearMiss(7, 5, false), "আর ২ চাল কম হলে ৩ তারা।");
  assert.equal(nearMiss(10, 5, false), "আর ২ চাল কম হলে ২ তারা।");
  assert.equal(nearMiss(5, 5, true), "হিন্ট ছাড়া পারলে ৩ তারা পাবে।");
  assert.equal(nearMiss(5, 5, false), "");
});

test("determinism: the same presses give the same board on every phone", () => {
  for (const level of [3, 14, 28]) {
    const moves = solve(levelOf(level).board, levelOf(level).start)!;
    assert.deepEqual(replay(puzzleOf(level)!, moves), replay(puzzleOf(level)!, moves));
  }
});

// ---- the statechart's paths, against the pure flow (ai_docs/statecharts/switchboard) ----

test("bug 1 · BoardFrozenWhilePaused: under the pause menu (or away), no press, take-back or hint acts; the clock holds", () => {
  // Path: you press a switch → you hide the tab (the menu opens) → you press Z.
  const playing = F.start(F.titleFlow(), 0);
  assert.ok(F.takesPress(playing, 1000));
  const paused = F.menu(F.away(playing, true, 2000), true, 2000);
  assert.equal(F.takesPress(paused, 2100), false, "Z, a switch or H under the menu does nothing");
  assert.equal(F.elapsed(paused, 9000), 2, "the clock stopped at the pause");
  assert.equal(F.takesPress(F.sheet(playing, true, 3000), 3100), false, "the level sheet holds too");
  const back = F.menu(F.away(paused, false, 9000), false, 9500);
  assert.equal(F.takesPress(back, 9600), false, "the tap that brings you back only wakes the board");
  assert.ok(F.takesPress(back, 9500 + F.BACK_GUARD_MS));
  assert.equal(F.elapsed(back, 10500), 3);
});

test("bug 2 · HumComesBack: the hum is wanted again on resume and when sound comes back, and never while held, muted or lit", () => {
  const playing = F.start(F.titleFlow(), 0);
  assert.ok(F.wantsHum(true, playing, 1, false));
  // (b) press → hide → চালিয়ে যাও
  const hidden = F.menu(F.away(playing, true, 100), true, 100);
  assert.equal(F.wantsHum(true, hidden, 1, false), false);
  assert.ok(F.wantsHum(true, F.menu(F.away(hidden, false, 200), false, 300), 1, false), "the hum comes back on resume");
  // (a) press → sound off → sound on: the hum follows the switch, not the next press.
  assert.equal(F.wantsHum(false, playing, 1, false), false);
  assert.ok(F.wantsHum(true, playing, 1, false));
  assert.equal(F.wantsHum(true, playing, 0, false), false, "a fresh board is quiet");
  assert.equal(F.wantsHum(true, F.finish(playing, 500), 3, true), false, "a lit board is quiet");
  assert.ok(humLevel(25, 25) > humLevel(5, 25), "it follows the light, take-backs included");
});

test("bug 3 · OpenLevelsAreEarned: a friend's far-ahead board records its stars but opens nothing in between", () => {
  // Path: open a friend's link to level 12 with only level 1 open → light its last bulb.
  assert.equal(openAfter(1, 12), 1);
  assert.equal(openAfter(1, 1), 2);
  assert.equal(openAfter(5, 3), 5);
  assert.equal(openAfter(30, 30), 30);
  let stars = recordLevel(readLevels(null, LEVEL_COUNT), 12, 3);
  assert.equal(unlockedLevel(stars, LEVEL_COUNT), 13, "the shared rule alone would open 2–11");
  assert.equal(readOpen("1", null, stars), 1, "your own open level stays 1");
  stars = recordLevel(stars, 1, 2);
  assert.equal(openAfter(readOpen("1", null, stars), 1), 2);
});

test("saved progress: the open level is set once from the old ladder's stars, and the start level is your frontier", () => {
  assert.equal(OPEN_KEY, "ektukhani-switchboard-open");
  assert.equal(readOpen(null, null, {}), 1);
  assert.equal(readOpen(null, JSON.stringify({ 1: 3, 2: 2, 3: 1, 4: 3 }), {}), 5, "every level you had open stays open");
  assert.equal(readOpen(null, JSON.stringify({ 30: 3 }), {}), 30);
  assert.equal(readOpen(null, "{broken", {}), 1);
  assert.equal(readOpen("7", JSON.stringify({ 20: 3 }), {}), 7, "after the first time only your own key counts");
  assert.equal(readOpen("99", null, {}), 1);
  assert.equal(startLevel({ 1: 3, 2: 3, 3: 1 }, 4), 4);
  assert.equal(startLevel({ 1: 3, 2: 3 }, 2), 2);
});

test("ResultNeedsFreshPress and NoDoubleResult: the result guard, and finishing only from play", () => {
  const over = F.finish(F.start(F.titleFlow(), 0), 1000);
  assert.equal(over.screen, "over");
  assert.equal(F.finish(over, 1200), over, "a second finish changes nothing");
  assert.equal(F.takesResultKey(over, 1100, false), false, "Enter held through the last press");
  assert.equal(F.takesResultKey(over, 1500, true), false, "a key repeat");
  assert.ok(F.takesResultKey(over, 1000 + F.RESULT_GUARD_MS, false));
  assert.equal(F.takesResultKey(F.menu(over, true, 1500), 1600, false), false);
  assert.equal(F.start(over, 2000), over, "শুরু করো only from the start card");
  assert.equal(F.toTitle(F.sheet(over, true, 0)).sheet, false);
  assert.equal(F.restartBoard(F.start(F.titleFlow(), 0), 5000).since, 5000);
});

// ---- links ----

test("links: a new link round-trips (line switches included) and replays press by press", () => {
  for (const level of [1, 12, 21, 30]) {
    const moves = solve(levelOf(level).board, levelOf(level).start)!;
    const hash = sharedHash({ level, legacy: false, moves, hinted: level === 12, name: "রাফি" });
    assert.match(hash, /&v=2/);
    assert.deepEqual(parseShared(`#${hash}`), { level, legacy: false, moves, hinted: level === 12, name: "রাফি" });
    assert.equal(share.normalize(hash), hash);
  }
  assert.deepEqual(decodeMoves(encodeMoves([0, 9, 10, 24, 25, 29])), [0, 9, 10, 24, 25, 29]);
  assert.match(previewTitle(parseShared(sharedHash({ level: 30, legacy: false, moves: solve(levelOf(30).board, levelOf(30).start)!, hinted: false, name: "মিম" }))!), /^মিম বরযাত্রী আসছে-এর সব বাতি ৯ চালে জ্বালিয়েছে।/);
});

test("links: a link from before the rewrite still opens its old board, keeps its stars, and normalizes to itself", () => {
  const old = "s=99049&t=3&l=12&m=16a&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF";
  const parsed = parseShared(`#${old}`)!;
  assert.deepEqual(parsed, { level: 12, legacy: true, moves: [1, 6, 10], hinted: false, name: "রাফি" });
  assert.equal(sharedHash(parsed), old);
  assert.equal(share.normalize(old), old);
  assert.match(share.preview(old).title, /^রাফি পুরোনো লেভেল ১২-এর সব বাতি ৩ চালে/);
  assert.equal(puzzleOf(12, true)!.board.size, 4);
  assert.deepEqual(badge(12, true), { main: "বন্ধুর বোর্ড", sub: "পুরোনো লেভেল ১২" });
  // The same presses don't light the new level 12, so a v2 link with them is refused.
  assert.equal(parseShared(`${old}&v=2`), null);
});

test("links: forged, broken or hostile links are refused", () => {
  const good = new URLSearchParams(sharedHash({ level: 1, legacy: false, moves: [4], hinted: false, name: "মিম" }));
  const variant = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(good);
    for (const [key, value] of Object.entries(changes)) value === null ? params.delete(key) : params.set(key, value);
    return params.toString();
  };
  assert.ok(parseShared(variant({})));
  for (const bad of [
    variant({ t: "0" }), variant({ t: "2" }), variant({ m: "0" }), variant({ m: "44" }), variant({ m: "" }), variant({ m: null }), variant({ m: "#" }),
    variant({ l: "31" }), variant({ l: "0" }), variant({ l: "01" }), variant({ l: "2" }), variant({ s: String(levelSeed(2)) }), variant({ s: "-1" }),
    variant({ h: "2" }), variant({ v: "3" }), variant({ t: String(MAX_MOVES + 1) }),
    sharedHash({ level: 11, legacy: false, moves: [5, 5], hinted: false, name: "" }), // a taped switch
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

test("words: kind, concrete lines that fit the result", () => {
  for (const level of levels) assert.ok(clearLine(level).length > 10 && !/অসাধারণ|দারুণ|!!/.test(clearLine(level)));
  assert.match(clearLine(10), /নানার বোর্ড/);
  assert.equal(clearLine(3, true), "বন্ধুর বোর্ডের সব বাতি জ্বলল।");
  assert.equal(finishTitle(20, false, 8, true), "পরীক্ষার আগের রাত পার!");
  assert.equal(finishTitle(20, false, 9, false), "৯ চালে সব বাতি জ্বলল");
  assert.equal(houseLine(10, { 1: 3, 2: 3, 10: 2 }), "বারান্দার ১০টা বোর্ড: ★ ৮/৩০।");
  assert.equal(houseLine(30, { 1: 3, 30: 1 }), "প্যান্ডেলের ১০টা বোর্ড: ★ ১/৩০। তিন বাড়ির ৩০টা বোর্ড: ★ ৪/৯০।");
  assert.equal(houseLine(9, {}), "");
  assert.match(cardLine(5, 5, false), /বাড়তি/);
  assert.equal(compareLine(4, 6, "রাফি"), "রাফির চেয়ে ২ চাল কম!");
  assert.equal(compareLine(6, 6, "রাফি"), "একদম সমান! রাফিও ৬ চালে পেরেছিল।");
  assert.match(caption({ level: 1, legacy: false, moves: [4], hinted: false }), /১ চালেই/);
  assert.match(feat({ level: 3, legacy: true, moves: [1, 2], hinted: true, name: "" }), /^এক বন্ধু একটা হিন্ট নিয়ে পুরোনো লেভেল ৩/);
  assert.equal(countAt(10, 1), 10);
  assert.equal(easeOut(2), 1);
});

test("content: SEO limits, at least six FAQs, তুমি throughout, NFC", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.match(site.title, /^বাতি জ্বালানোর ধাঁধা/);
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.headline && site.headline !== site.title);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.faq.some(item => /কসটেপ/.test(item.answer)) && site.faq.some(item => /লম্বা সুইচ/.test(item.answer)));
  assert.match(site.privacy.join(" "), /নাম/);
  const all = JSON.stringify(site);
  assert.equal(all, all.normalize("NFC"));
  assert.doesNotMatch(all, /আপনি|করুন|দেখুন|Lights Out|লাইটস আউট/);
});
