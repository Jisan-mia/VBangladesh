import assert from "node:assert/strict";
import test from "node:test";
import { makeRng } from "../../../shared/game-core";
import { share } from "../share";
import {
  begin, botMove, canUndo, createGame, findMove, fullStart, isBotTurn, isFull, legalMoves, movesFor, ownMoves, pinned, play, replay, threatened, undo, winStars,
  GOAT, LEGACY_LEVEL, POINTS, TIGER, type Game, type Start,
} from "../lib/game";
import { BOT_OFFSET, LADDERS, LEVEL_COUNT, LESSONS, PER_WORLD, WORLDS, botLevel, isFinale, isLesson, ladderLevel, levelOf, worldOf } from "../lib/levels";
import { parseShared, sharedHash } from "../lib/link";
import { danger, finishLine, finishStats, finishTitle, nextGoal, clock } from "../lib/result";
import { migrateLadder, openAfter, readOpen, readSide } from "../lib/save";
import * as F from "../lib/flow";
import { countAt, easeOut } from "../lib/count.hot";
import { casual, forced, sharp, shortestWin, weak, winRate } from "./bot";

const board = (spec: Record<number, number>) => { const goats = Array<number>(POINTS).fill(0); for (const [at, count] of Object.entries(spec)) goats[Number(at)] = count; return goats; };
const go = (game: Game, from: number, to: number) => { const index = findMove(game, from, to); assert.ok(index >= 0, `${from}→${to} should be legal`); return play(game, index)!; };
const modeOf = (side: 0 | 1) => side === TIGER ? 1 as const : 2 as const;

test("levels: two ladders of three worlds × four, one new line each, a named finale closing every world", () => {
  assert.equal(WORLDS.length * PER_WORLD, LEVEL_COUNT);
  for (const side of [TIGER, GOAT] as const) {
    const ladder = LADDERS[side];
    assert.equal(ladder.length, LEVEL_COUNT);
    const lines = new Set(ladder.map(level => level.line));
    assert.equal(lines.size, LEVEL_COUNT, "each level says one new thing of its own");
    ladder.forEach((level, index) => {
      const n = index + 1;
      assert.equal(Boolean(level.finale), isFinale(n), `level ${n}: a finale exactly at the end of a world`);
      assert.ok(level.line.length <= 80, `level ${n}: one short line`);
      assert.equal(level.line, level.line.normalize("NFC"));
      if (n > BOT_OFFSET) {
        assert.ok(isFull(level.start), `level ${n} is the full board`);
        assert.equal(level.start.bot, botLevel(n));
        assert.equal(ladderLevel(level.start.bot), n);
      }
    });
    assert.equal(new Set(ladder.filter(level => level.finale).map(level => level.finale)).size, WORLDS.length);
  }
  assert.deepEqual([1, 4, 5, 8, 9, 12].map(worldOf), [1, 1, 2, 2, 3, 3]);
});

test("পাঠশালা: every lesson is a forced win at its par against any reply, never sooner, and level 1 takes one move", () => {
  for (const side of [TIGER, GOAT] as const) {
    LADDERS[side].slice(0, LESSONS).forEach((level, index) => {
      const n = index + 1, start = level.start, mode = modeOf(side);
      if (n === PER_WORLD && side === TIGER) return; // the tigers' finale is a short real game, checked by bots below
      assert.ok(start.par !== undefined && level.seed !== undefined, `lesson ${n} has a par and a fixed seed`);
      assert.equal(shortestWin(mode, start, 4), start.par, `${side === TIGER ? "tiger" : "goat"} lesson ${n}`);
      assert.ok(start.cap >= 2 * start.par! + 1, "the clock leaves room for the solution and a slip");
      const game = begin(level.seed!, mode, start);
      assert.equal(game.over, false);
      assert.equal(isBotTurn(game), false, "a lesson starts with your move");
    });
  }
  // Level 1 on both sides is one move: a win inside ten seconds.
  assert.equal(LADDERS[TIGER][0].start.par, 1);
  assert.equal(LADDERS[GOAT][0].start.par, 1);
  const first = begin(101, 1, LADDERS[TIGER][0].start);
  assert.equal(go(first, 11, 13).winner, TIGER);
  assert.equal(winStars(go(first, 11, 13)), 3);
});

test("bots: the tigers' first hunt is gentle, the full ladders get harder level by level, and each last finale is a real boss you can still beat", () => {
  const hunt = LADDERS[TIGER][PER_WORLD - 1].start;
  assert.ok(winRate(1, hunt, casual, 80) >= 0.85, "প্রথম শিকার: a casual tiger nearly always makes it");
  assert.ok(winRate(1, hunt, weak, 80) >= 0.7, "and a careless one mostly does");
  for (const side of [TIGER, GOAT] as const) {
    const mode = modeOf(side), name = side === TIGER ? "বাঘ" : "ছাগল";
    const rates = LADDERS[side].slice(BOT_OFFSET).map(level => winRate(mode, level.start, casual, 50));
    assert.ok(rates[0] >= 0.8, `${name} level 5: ${rates[0]}`);
    for (let index = 1; index < rates.length; index++) assert.ok(rates[index] <= rates[index - 1] + 0.12, `${name}: level ${index + 5} (${rates[index]}) easier than ${index + 4} (${rates[index - 1]})`);
    assert.ok(rates[rates.length - 1] <= 0.15, `${name}: the last finale is hard for a casual player (${rates[rates.length - 1]})`);
    assert.ok(winRate(mode, LADDERS[side][LEVEL_COUNT - 1].start, sharp, 30) > 0.1, `${name}: a sharp player can beat the last finale`);
  }
});

test("bug 1 · BotWaitsWhileHidden: as the tiger the bot opens, but not while the tab is hidden; coming back gives a guard and the clock never counted", () => {
  // Path: pick বাঘ হবো (a full level, the goats open), hide the tab before the bot's beat, the bot would have moved.
  const level = levelOf(TIGER, 5)!;
  const game = begin(7, 1, level.start);
  assert.ok(isBotTurn(game), "the goats move first, so the bot opens");
  let flow = F.start(F.titleFlow(), 0);
  assert.ok(F.running(flow), "on the board, the bot may move after its beat");
  flow = F.away(flow, true, 100);
  assert.equal(F.running(flow), false, "hidden: the bot's timer is not armed, and nothing moves");
  assert.equal(F.elapsed(flow, 5000), 0.1, "and the clock stopped at the hide");
  flow = F.away(flow, false, 5000);
  assert.ok(F.running(flow), "back: the bot moves a beat after you are here to see it");
  assert.equal(F.takesTap(flow, 5000 + F.BACK_GUARD_MS - 1), false, "the tap that brings the tab back is not a move");
  assert.ok(F.takesTap(flow, 5000 + F.BACK_GUARD_MS));
  // A tab that loads hidden starts away, so the opening waits too.
  assert.equal(F.running(F.start(F.titleFlow(true), 0)), false);
});

test("bug 2 · BotWaitsWhileBlurred: you move, glance at another window, and the tiger waits until you are back", () => {
  let game = begin(48213, 2, fullStart(7));
  game = go(game, 11, 12);
  assert.ok(isBotTurn(game), "the bot is thinking");
  let flow = F.start(F.titleFlow(), 0);
  flow = F.away(flow, true, 300); // blur
  assert.equal(F.running(flow), false);
  // The player's menu also opens on blur once you have touched the game; closing the menu alone doesn't resume while away.
  flow = F.menu(flow, true, 310);
  flow = F.away(flow, false, 2000);
  assert.equal(F.running(flow), false, "the menu still holds play");
  flow = F.menu(flow, false, 2500);
  assert.ok(F.running(flow), "চালিয়ে যাও: the bot's beat starts now");
  assert.equal(F.elapsed(flow, 2500), 0.3, "the clock counted only the time you were there");
  assert.equal(F.takesTap(flow, 2600), false, "the click that closes the menu never knocks a piece");
});

test("ChoiceFreezesPlay: the level sheet holds play and the clock; each hold lifts only its own way", () => {
  let flow = F.start(F.titleFlow(), 0);
  flow = F.sheet(flow, true, 1000);
  assert.equal(F.running(flow), false);
  flow = F.away(flow, true, 1500);
  flow = F.away(flow, false, 1800);
  assert.equal(F.running(flow), false, "coming back from another window doesn't close the sheet");
  flow = F.sheet(flow, false, 4000);
  assert.ok(F.running(flow));
  assert.equal(F.elapsed(flow, 5000), 2, "1 s before the sheet + 1 s after it");
  // Picking a level from the sheet goes to that level's start card, with the hold gone.
  assert.equal(F.toTitle(F.sheet(F.start(F.titleFlow(), 0), true, 10)).sheet, false);
});

test("ResultNeedsFreshPress: a key held through the last move, or one too soon, never skips the result", () => {
  let flow = F.start(F.titleFlow(), 0);
  flow = F.finish(flow, 10_000);
  assert.equal(flow.screen, "over");
  assert.equal(F.takesResultKey(flow, 10_100, false), false, "too soon");
  assert.equal(F.takesResultKey(flow, 10_000 + F.RESULT_GUARD_MS, true), false, "an auto-repeat");
  assert.ok(F.takesResultKey(flow, 10_000 + F.RESULT_GUARD_MS, false));
  assert.equal(F.takesResultKey(F.menu(flow, true, 11_000), 12_000, false), false, "not under the menu");
  assert.equal(F.finish(flow, 20_000), flow, "a game ends once");
  assert.equal(F.elapsed(flow, 99_999), 10, "the clock stopped at the last move");
});

test("take-backs: lessons let you take back even a lost last move; the tiger's first move can be taken back when it opens", () => {
  // As the tiger in a lesson you move first: one own move is something to take back.
  const lesson = begin(101, 1, LADDERS[TIGER][0].start);
  const stepped = go(lesson, 11, 16);
  assert.equal(ownMoves(stepped), 1);
  assert.ok(canUndo(stepped));
  const answered = play(stepped, botMove(stepped))!;
  assert.deepEqual(undo(answered).moves, [], "back to the start: your move and the bot's reply");
  // A lost goat lesson: the finished game can be reopened from the move before.
  let goats = begin(202, 2, LADDERS[GOAT][1].start);
  goats = go(goats, 2, 3); // leaves goat 6 open
  goats = play(goats, botMove(goats))!;
  assert.equal(goats.over, true);
  assert.equal(goats.winner, TIGER, "the tiger took the open goat");
  assert.equal(canUndo(goats), false, "a finished game is finished...");
  assert.ok(canUndo(goats, true), "...but a lesson may take back its last move");
  assert.deepEqual(undo(goats).moves, []);
  const reopened = F.reopen(F.finish(F.start(F.titleFlow(), 0), 4000), 9000);
  assert.equal(reopened.screen, "play");
  assert.equal(F.elapsed(reopened, 10_000), 5);
});

test("friend links: an old link still opens, maps to its ladder level, and clearing a far-ahead level opens nothing in between", () => {
  const old = "s=777&t=8&p=2&m=HBCEDHDANBJCPDDEHIMDCA&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF";
  const shared = parseShared(old)!;
  assert.equal(shared.game.level, LEGACY_LEVEL);
  assert.equal(ladderLevel(shared.game.level), 11, "the bot from before levels is level 11 now");
  assert.equal(share.normalize(old), old, "unchanged");
  // A game on a full ladder level is the same game a link replays: the link needs no new key.
  const rng = makeRng(3);
  let game = begin(4242, 1, levelOf(TIGER, 7)!.start);
  while (!game.over) game = play(game, isBotTurn(game) ? botMove(game) : casual(game, rng))!;
  const back = parseShared(sharedHash({ mode: 1, name: "", other: "", game }))!;
  assert.deepEqual(back.game.moves, game.moves);
  assert.equal(ladderLevel(back.game.level), 7);
  // Your open level: a friend's level 11 cleared from level 3 records stars, opens nothing.
  assert.equal(openAfter(3, 11), 3);
  assert.equal(openAfter(3, 3), 4, "your own open level opens the next");
  assert.equal(openAfter(5, 2), 5, "replaying an old one opens nothing new");
  assert.equal(openAfter(LEVEL_COUNT, LEVEL_COUNT), LEVEL_COUNT);
});

test("saved progress: the old ladders move once (bot levels 1–8 become 5–12, an old best becomes a star on 11), and your open level is read once", () => {
  assert.equal(migrateLadder(TIGER, null, JSON.stringify({ 1: 3, 2: 1, 8: 2 }), null), JSON.stringify({ 5: 3, 6: 1, 12: 2 }));
  assert.equal(migrateLadder(TIGER, null, null, "8"), JSON.stringify({ 11: 1 }), "a best that proves a win over the old bot");
  assert.equal(migrateLadder(GOAT, null, null, "12"), "{}", "kept 12: not a win; still marked as moved");
  assert.equal(migrateLadder(TIGER, "{}", JSON.stringify({ 1: 3 }), "8"), null, "never twice");
  assert.equal(migrateLadder(TIGER, null, "{broken", null), "{}");
  assert.equal(readOpen(null, { 5: 3, 6: 1 }), 7, "first read: one past your highest star, so old players keep their levels");
  assert.equal(readOpen("4", { 11: 1 }), 4, "afterwards your own open level, whatever stars a friend's link left");
  assert.equal(readOpen("99", {}), 1);
  assert.deepEqual(["1", "2", "0", null, "x"].map(readSide), [1, 2, 0, 1, 1], "a newcomer starts as the tiger");
});

test("stars: lessons by your own moves against par; full games keep their rule; a loss earns none", () => {
  const start: Start = { goats: board({ 12: 1 }), tigers: [11], turn: TIGER, goal: 1, cap: 9, hold: true, bot: 1, par: 1 };
  const game = begin(1, 1, start);
  assert.equal(winStars(go(game, 11, 13)), 3);
  // Won after more of your own moves (the tiger moved first, so moves 0, 2, 4… are yours): par → 3, par + 2 → 2, later → 1.
  const after = (moves: number) => winStars({ ...game, over: true, winner: TIGER, ending: "hunt", moves: Array(moves).fill(0) } as Game);
  assert.deepEqual([1, 3, 5, 7].map(after), [3, 2, 2, 1]);
  assert.equal(winStars({ ...game, over: true, winner: GOAT, ending: "hold", moves: [0] } as Game), 0);
  const full = createGame(1, 1, 2);
  const tiger = (moves: number) => ({ ...full, over: true, winner: TIGER, ending: "hunt", taken: 8, moves: Array(moves).fill(0) }) as Game;
  assert.deepEqual([30, 40, 41, 70, 71].map(moves => winStars(tiger(moves))), [3, 3, 2, 2, 1], "unchanged from before the rewrite");
});

test("the end screen: real numbers, kind words, the exact next goal", () => {
  const won = go(begin(101, 1, LADDERS[TIGER][0].start), 11, 13);
  assert.equal(finishTitle(won), "১টা ধরা, ১ চালে");
  assert.deepEqual(finishStats(won, 4.4, 0).map(stat => [stat.label, stat.value, stat.of]), [["তোমার চাল", 1, undefined], ["ধরা ছাগল", 1, 1], ["সময়", 4, undefined], ["ফিরিয়ে আনা", 0, undefined]]);
  assert.equal(nextGoal(won), "");
  assert.equal(clock(65), "১:০৫");
  // A lost goat lesson says what happened and how to fix it, never that you did badly.
  let lost = begin(202, 2, LADDERS[GOAT][1].start);
  lost = go(lost, 2, 3); lost = play(lost, botMove(lost))!;
  assert.equal(finishTitle(lost), "বাঘ ধরল ১টা");
  assert.match(finishLine(lost), /পেছনটা ফাঁকা/);
  assert.match(nextGoal(lost), /ফিরিয়ে/);
  const goats = finishStats(lost, 10, 2);
  assert.deepEqual(goats[1], { label: "বাঁচানো ছাগল", value: 6, of: 7, unit: "" });
  for (const game of [won, lost]) assert.doesNotMatch([finishTitle(game), finishLine(game), nextGoal(game)].join(" "), /হেরে|খারাপ|ব্যর্থ/);
  // Trapped: the goats' lesson 1, the one right move.
  const trap = go(begin(201, 2, LADDERS[GOAT][0].start), 11, 6);
  assert.equal(trap.ending, "trap");
  assert.equal(finishTitle(trap), "বাঘ বন্দি!");
});

test("danger at the edge: a goat left open, a tiger nearly boxed in, calm otherwise", () => {
  const open = begin(1, 2, { goats: board({ 1: 1, 2: 1, 6: 1, 7: 1, 10: 1, 15: 1, 17: 1 }), tigers: [0], turn: GOAT, goal: 3, cap: 30, hold: true, bot: 7 });
  assert.equal(danger(open, threatened(open.goats, open.tigers).length, 0), 1);
  assert.equal(danger({ ...open, taken: 2 }, 1, 0), 2, "one more and the tiger wins");
  assert.equal(danger(open, 0, 0), 0);
  const tiger = createGame(1, 1, 3);
  assert.equal(danger(tiger, 0, 12), 0);
  assert.equal(danger(tiger, 0, 3), 1);
  assert.equal(danger(tiger, 0, 1), 2);
  assert.equal(danger(begin(1, 1, LADDERS[TIGER][0].start), 0, 1), 0, "a lesson's small board never flashes");
});

test("one or two tigers, and a rope on each pinned tiger", () => {
  assert.deepEqual(pinned(board({ 1: 1, 2: 1, 5: 1, 10: 1, 6: 1, 12: 1 }), [0, 24]), [0]);
  assert.deepEqual(movesFor(board({ 12: 1 }), [11], TIGER).map(move => [move.from, move.to, move.over]), [[11, 6, -1], [11, 13, 12], [11, 16, -1], [11, 10, -1]]);
  // Goats always have a move (two tigers can't cut the board, see baghbandi.test.ts), so "stuck" never ends a real game and
  // old games end exactly as before.
  assert.equal(replay(777, 2, parseShared("s=777&t=8&p=2&m=HBCEDHDANBJCPDDEHIMDCA&n=x")!.game.moves)!.ending, "hunt");
});

test("count-up maths and determinism", () => {
  assert.equal(easeOut(0), 0);
  assert.equal(easeOut(1), 1);
  assert.equal(easeOut(2), 1);
  assert.ok(easeOut(0.5) > 0.5);
  assert.equal(countAt(20, 1), 20);
  assert.equal(countAt(20, 0), 0);
  const runOnce = () => { const rng = makeRng(9); let g = begin(55, 1, LADDERS[TIGER][PER_WORLD - 1].start); while (!g.over) g = play(g, isBotTurn(g) ? botMove(g) : casual(g, rng))!; return g.moves.join(); };
  assert.equal(runOnce(), runOnce());
  assert.ok(isLesson(4) && !isLesson(5));
  assert.ok(forced(begin(1, 2, LADDERS[GOAT][0].start), GOAT, 1));
});
