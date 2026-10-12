// কাটাকুটি (noughts and crosses) on a 3×3 patch of the same quilt, against a bot with three levels. Pure: rules, bots and stars.
import { makeRng, pick } from "../../../shared/game-core";

/** 1 সহজ (takes a win, else anywhere) · 2 মাঝারি (also blocks, likes the middle) · 3 কঠিন (never loses). */
export type Bot = 1 | 2 | 3;
export const BOTS: readonly Bot[] = [1, 2, 3];
export const botName = (bot: Bot) => bot === 1 ? "সহজ" : bot === 2 ? "মাঝারি" : "কঠিন";

/** Cells in reading order: -1 empty, 0 you (✕, red cross-stitch), 1 the bot (○, blue running stitch). */
export type Cells = number[];
export type Round = { seed: number; bot: Bot; cells: Cells; turn: 0 | 1; moves: number[]; first: 0 | 1 };
export type Outcome = { winner: 0 | 1 | null; line: readonly number[] | null; over: boolean };

export const LINES: readonly (readonly number[])[] = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];

/** A new round. `first` takes turns between rounds, so the bot opens every other one. */
export const newRound = (seed: number, bot: Bot, first: 0 | 1 = 0): Round => ({ seed, bot, cells: Array<number>(9).fill(-1), turn: first, moves: [], first });

export function outcome(cells: Cells): Outcome {
  for (const line of LINES) {
    const who = cells[line[0]];
    if (who >= 0 && who === cells[line[1]] && who === cells[line[2]]) return { winner: who as 0 | 1, line, over: true };
  }
  return { winner: null, line: null, over: cells.every(cell => cell >= 0) };
}

/** Marks a cell for whoever's turn it is. Null for anything illegal. */
export function mark(round: Round, cell: number): Round | null {
  if (!Number.isInteger(cell) || cell < 0 || cell > 8 || round.cells[cell] >= 0 || outcome(round.cells).over) return null;
  const cells = round.cells.slice();
  cells[cell] = round.turn;
  return { ...round, cells, moves: [...round.moves, cell], turn: round.turn === 0 ? 1 : 0 };
}

const empty = (cells: Cells) => cells.flatMap((cell, index) => cell < 0 ? [index] : []);
/** A cell that completes a line for `who`, or -1. */
function finishing(cells: Cells, who: number) {
  for (const line of LINES) {
    const mine = line.filter(index => cells[index] === who).length, gap = line.find(index => cells[index] < 0);
    if (mine === 2 && gap !== undefined) return gap;
  }
  return -1;
}

/** Perfect play: +10 − depth for a bot win, −10 + depth for a loss, 0 for a draw (so it wins fast and loses slow). */
function minimax(cells: Cells, turn: 0 | 1, depth: number): number {
  const end = outcome(cells);
  if (end.winner === 1) return 10 - depth;
  if (end.winner === 0) return depth - 10;
  if (end.over) return 0;
  let best = turn === 1 ? -Infinity : Infinity;
  for (const cell of empty(cells)) {
    cells[cell] = turn;
    const value = minimax(cells, turn === 1 ? 0 : 1, depth + 1);
    cells[cell] = -1;
    best = turn === 1 ? Math.max(best, value) : Math.min(best, value);
  }
  return best;
}

/** The best cells for the bot by perfect play (several can tie). */
export function perfectMoves(cells: Cells, who: 0 | 1 = 1) {
  const scored = empty(cells).map(cell => {
    const next = cells.slice();
    next[cell] = who;
    const value = minimax(next, who === 1 ? 0 : 1, 1);
    return { cell, value: who === 1 ? value : -value };
  });
  const top = Math.max(...scored.map(entry => entry.value));
  return scored.filter(entry => entry.value === top).map(entry => entry.cell);
}

/** The bot's cell. Seeded by the round and move count, so the same position in the same round always gets the same reply. */
export function botMove(round: Round) {
  const rng = makeRng((round.seed ^ Math.imul(round.moves.length + 1, 0x9e3779b1)) >>> 0);
  const free = empty(round.cells), choose = (cells: number[]) => cells[pick(rng, cells.length)];
  // Every opening cell is a draw with perfect play; skip the full search on the empty board (it's the slow one on a cheap phone).
  if (round.bot === 3) return choose(free.length === 9 ? [0, 2, 4, 6, 8] : perfectMoves(round.cells));
  const win = finishing(round.cells, 1);
  if (win >= 0) return win;
  if (round.bot === 1) return choose(free);
  const block = finishing(round.cells, 0);
  if (block >= 0) return block;
  if (round.cells[4] < 0) return 4;
  const corners = free.filter(cell => cell % 2 === 0);
  return choose(corners.length ? corners : free);
}

/**
 * Stars for one round: a win is 3 against সহজ or মাঝারি; a draw is 1 against সহজ, 2 against মাঝারি and 3 against কঠিন (which never loses).
 * A loss is 0.
 */
export function starsOf(bot: Bot, winner: 0 | 1 | null) {
  if (winner === 1) return 0;
  if (winner === 0) return 3;
  return bot === 1 ? 1 : bot === 2 ? 2 : 3;
}

/** What it takes for three stars, for the line under a round that fell short. */
export function threeStarGoal(bot: Bot) {
  return bot === 3 ? "কঠিন বটের সাথে সমান করলেই ৩ তারা।" : `${botName(bot)} বটকে হারালে ৩ তারা।`;
}
