// One board in play: presses, take-backs, hints and stars. Pure; the component feeds it taps and keys.
import { allLit, canPress, cellsOf, isLine, isTaped, lineOf, pressMask, reachOf, solutions, type Board } from "./board";
import { isLegacyLevel, legacySize, legacyStart, plainBoard } from "./legacy";
import { isLevel, levelOf } from "./levels";

/** A board to play: a ladder level, or (legacy) one of the 30 boards an old link names. */
export type Puzzle = { level: number; legacy: boolean; board: Board; start: number; par: number; guide?: number };
export const MAX_MOVES = 200;

export function puzzleOf(level: number, legacy = false): Puzzle | null {
  if (legacy) {
    if (!isLegacyLevel(level)) return null;
    const { start, par } = legacyStart(level);
    return { level, legacy, board: plainBoard(legacySize(level)), start, par };
  }
  if (!isLevel(level)) return null;
  const { board, start, par, guide } = levelOf(level);
  return { level, legacy, board, start, par, guide };
}

export type Game = { puzzle: Puzzle; lit: number; moves: number[]; hinted: boolean; hints: number; undos: number };

export const newGame = (puzzle: Puzzle): Game => ({ puzzle, lit: puzzle.start, moves: [], hinted: false, hints: 0, undos: 0 });
export const isSolved = (game: Game) => game.lit === allLit(game.puzzle.board.size);

/** A press: null when the board is lit, the switch is taped or off the board, or the move cap is reached. */
export function press(game: Game, id: number): Game | null {
  const { board } = game.puzzle;
  if (isSolved(game) || !canPress(board, id) || game.moves.length >= MAX_MOVES) return null;
  return { ...game, lit: game.lit ^ pressMask(board, id), moves: [...game.moves, id] };
}

/** Takes back the last press. Nothing to take back on a fresh or lit board. */
export function undo(game: Game): Game {
  if (!game.moves.length || isSolved(game)) return game;
  const last = game.moves[game.moves.length - 1];
  return { ...game, lit: game.lit ^ pressMask(game.puzzle.board, last), moves: game.moves.slice(0, -1), undos: game.undos + 1 };
}

/** Lights after a list of presses from a puzzle's start; null when a press is refused. */
export function replay(puzzle: Puzzle, moves: readonly number[]): Game | null {
  let game: Game | null = newGame(puzzle);
  for (const id of moves) { game = game && press(game, id); if (!game) return null; }
  return game;
}

/** The bulbs one press would light (`on`) and put out (`off`). */
export function footprint(board: Board, lit: number, id: number) {
  const mask = pressMask(board, id);
  return { on: mask & ~lit, off: mask & lit };
}

// ---- the hint: a switch on a shortest way home, and why ----
export type Why = "line" | "only" | "dip" | "gain";
export type Hint = { id: number; on: number; off: number; rest: number; why: Why; only: number; line: "row" | "col" | null };

const count = (mask: number) => { let n = 0; for (let rest = mask >>> 0; rest; rest &= rest - 1) n++; return n; };

/**
 * Of every switch on any shortest way, the one that lights the most right now (ties: the one a dark bulb depends on, then the
 * lowest id). `rest` is how many presses remain after it; `only` is a dark bulb this is the one pressable switch for (or -1).
 */
export function teach(game: Game): Hint | null {
  const { board } = game.puzzle;
  if (isSolved(game)) return null;
  const best = solutions(board, game.lit);
  if (!best?.length) return null;
  const pool = [...new Set(best.flat())].sort((a, b) => a - b);
  const onlyFor = (id: number) => {
    const { on } = footprint(board, game.lit, id);
    for (let bulb = 0; bulb < cellsOf(board); bulb++) if (on & (1 << bulb) && reachOf(board, bulb).length === 1) return bulb;
    return -1;
  };
  let pickId = pool[0], score = -Infinity;
  for (const id of pool) {
    const { on, off } = footprint(board, game.lit, id);
    const value = (count(on) - count(off)) * 2 + (onlyFor(id) >= 0 ? 1 : 0);
    if (value > score) { score = value; pickId = id; }
  }
  const { on, off } = footprint(board, game.lit, pickId), only = isLine(board, pickId) ? -1 : onlyFor(pickId);
  const why: Why = isLine(board, pickId) ? "line" : only >= 0 ? "only" : count(off) > count(on) ? "dip" : "gain";
  return { id: pickId, on, off, rest: best[0].length - 1, why, only, line: isLine(board, pickId) ? lineOf(board, pickId).kind : null };
}

/** Marks the game as helped (the star cap) and counts the hint. */
export const withHint = (game: Game): Game => ({ ...game, hinted: true, hints: game.hints + 1 });

// ---- stars: unchanged from before the rewrite, so a link keeps the stars it always had ----

/** ★★★ at par, ★★ within a few extra presses, ★ for any clear. A hint caps it at ★★. */
export const starLimits = (par: number) => ({ three: par, two: par + Math.max(2, Math.ceil(par / 2)) });
export function starsFor(moves: number, par: number, hinted: boolean) {
  const { three, two } = starLimits(par);
  const earned = moves <= three ? 3 : moves <= two ? 2 : 1;
  return hinted ? Math.min(2, earned) : earned;
}
/** How many fewer presses would have earned one more star, or 0 when that wasn't in reach (3 stars, or a hint taken at 2). */
export function shortBy(moves: number, par: number, hinted: boolean) {
  const { three, two } = starLimits(par), earned = starsFor(moves, par, hinted);
  if (earned === 3 || (hinted && earned === 2)) return 0;
  return moves - (earned === 2 ? three : two);
}
/** The stars still in reach while playing: drops as the presses pass each limit (the HUD meter and the edge). */
export const starsOnTrack = (moves: number, par: number, hinted: boolean) => starsFor(moves, par, hinted);

/** A taped switch, for the "can't press it" answer. */
export const taped = (game: Game, id: number) => isTaped(game.puzzle.board, id);
