import assert from "node:assert/strict";
import test from "node:test";
import { BOTS, botMove, mark, newRound, outcome, perfectMoves, starsOf, threeStarGoal, type Bot, type Round } from "../lib/katakuti";

/** Plays the bot's replies until it's the person's turn (or the round is over). */
function botReplies(round: Round) {
  let current = round;
  while (current.turn === 1 && !outcome(current.cells).over) current = mark(current, botMove(current))!;
  return current;
}

/** Every way a person could play against this bot from here: calls `leaf` with each finished round. */
function everyGame(round: Round, leaf: (end: Round) => void) {
  const current = botReplies(round);
  if (outcome(current.cells).over) { leaf(current); return; }
  current.cells.forEach((cell, index) => { if (cell < 0) everyGame(mark(current, index)!, leaf); });
}

test("lines, draws and illegal marks", () => {
  assert.deepEqual(outcome([0, 0, 0, -1, 1, 1, -1, -1, -1]), { winner: 0, line: [0, 1, 2], over: true });
  assert.deepEqual(outcome([1, 0, 0, -1, 1, 0, -1, -1, 1]).line, [0, 4, 8]);
  assert.deepEqual(outcome([0, 1, 0, 0, 1, 1, 1, 0, 0]), { winner: null, line: null, over: true });
  assert.equal(outcome([0, -1, -1, -1, -1, -1, -1, -1, -1]).over, false);
  const round = mark(newRound(1, 1), 4)!;
  assert.equal(round.cells[4], 0);
  assert.equal(round.turn, 1);
  assert.equal(mark(round, 4), null, "a sewn cell can't be sewn again");
  assert.equal(mark(round, 9), null);
  assert.equal(mark(round, -1), null);
  assert.equal(newRound(1, 2, 1).turn, 1, "the bot opens when it's its round to start");
});

test("কঠিন never loses, whoever opens and however the person plays", () => {
  for (const first of [0, 1] as const) for (const seed of [1, 7, 42, 999]) {
    let games = 0;
    everyGame(newRound(seed, 3, first), end => { games++; assert.notEqual(outcome(end.cells).winner, 0, `seed ${seed}, first ${first}: ${end.moves}`); });
    assert.ok(games > 10);
  }
});

test("every bot can be held to at least a draw by careful play", () => {
  for (const bot of BOTS) for (const first of [0, 1] as const) for (const seed of [3, 11, 123]) {
    let round = newRound(seed, bot, first);
    while (!outcome(round.cells).over) {
      round = botReplies(round);
      if (outcome(round.cells).over) break;
      round = mark(round, perfectMoves(round.cells, 0)[0])!;
    }
    assert.notEqual(outcome(round.cells).winner, 1, `${bot} beat a careful player`);
  }
});

test("সহজ and মাঝারি can be beaten; মাঝারি blocks, both take a win", () => {
  for (const bot of [1, 2] as Bot[]) {
    let wins = 0;
    everyGame(newRound(5, bot, 0), end => { if (outcome(end.cells).winner === 0) wins++; });
    assert.ok(wins > 0, `${bot} has a way to lose`);
  }
  // You have two in the top row; মাঝারি blocks the third.
  const threat: Round = { ...newRound(8, 2), cells: [0, 0, -1, -1, 1, -1, -1, -1, -1], turn: 1, moves: [0, 4, 1] };
  assert.equal(botMove(threat), 2);
  // The bot has two down the middle: both সহজ and মাঝারি finish it rather than block.
  for (const bot of [1, 2] as Bot[]) {
    const win: Round = { ...newRound(9, bot), cells: [0, 1, 0, -1, 1, -1, -1, -1, 0], turn: 1, moves: [0, 1, 2, 4, 8] };
    assert.equal(botMove(win), 7);
  }
});

test("the bot's reply is the same for the same round, and differs across rounds", () => {
  const round = mark(newRound(77, 1), 0)!;
  assert.equal(botMove(round), botMove(round));
  const replies = new Set(Array.from({ length: 30 }, (_, seed) => botMove(mark(newRound(seed + 1, 1), 0)!)));
  assert.ok(replies.size > 3, "সহজ spreads its stitches around");
  assert.ok([0, 2, 4, 6, 8].includes(botMove(newRound(5, 3, 1))), "কঠিন opens in a corner or the middle");
});

test("stars per bot: a win is 3, a draw counts more against a stronger bot, a loss is none", () => {
  assert.equal(starsOf(1, 0), 3);
  assert.equal(starsOf(2, 0), 3);
  assert.equal(starsOf(1, null), 1);
  assert.equal(starsOf(2, null), 2);
  assert.equal(starsOf(3, null), 3, "কঠিন never loses, so a draw is the best result");
  for (const bot of BOTS) assert.equal(starsOf(bot, 1), 0);
  assert.equal(threeStarGoal(3), "কঠিন বটের সাথে সমান করলেই ৩ তারা।");
  assert.equal(threeStarGoal(2), "মাঝারি বটকে হারালে ৩ তারা।");
});
