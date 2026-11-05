// One run of a level: goals, moves, score, stars and the move code a challenge link carries. Pure and server-safe.
// The engine (board.ts) is a superset of the old one: a run with v = 1 plays the old table exactly (legacy.ts).
import { starsFor } from "../../../shared/game-core";
import {
  CELLS, DUST_GOAL, FREE_GOAL, RAINBOW, SIZE, SPARKLE, deal, dropCell, dustLayout, giftPieces, neighbours, play, type Outcome,
} from "./board";
import { LEVELS, MODE_INFO, isLevel, type Goal, type Mode, type Spec } from "./ladder";
import { OLD_LEVELS } from "./legacy";

export { DUST_GOAL, FREE_GOAL };
/** v 1: the level table before the rewrite (friends' old links). v 2: the ladder. `gift` 0..3 is the finale's pick. */
export type Run = { v: 1 | 2; level: number; mode: Mode; gift: number };
export const newRun = (level: number, mode: Mode = "n", gift = 0): Run => ({ v: 2, level, mode, gift });

const OLD_SPECS: readonly Spec[] = OLD_LEVELS.map(old => ({ ...old, locks: 0, dust: 0, thick: 0, drop: 0, tight: false }));
export const specOf = (run: Run): Spec => (run.v === 1 ? OLD_SPECS[run.level - 1] : LEVELS[run.level - 1]);
export const runOk = (run: Run) => isLevel(run.level) && (run.v === 2 || run.mode === "n") && (run.v === 2 || run.gift === 0);

/** Each move left when the goals are met is worth this much at the end. */
export const BONUS = 50;
/** The moves a mode allows, before a gift. */
export function baseLimit(spec: Spec, mode: Mode) {
  return mode === "e" ? Math.ceil(spec.moves * 1.5) : mode === "h" ? Math.max(spec.bot + 2, Math.round(spec.moves * 0.88)) : spec.moves;
}
export const limitOf = (spec: Spec, mode: Mode, gift = 0) => baseLimit(spec, mode) + (gift === 3 ? 3 : 0);
export const maxStars = (mode: Mode) => MODE_INFO[mode].maxStars;

export type Game = {
  run: Run; spec: Spec; limit: number;
  cells: number[]; dust: number[]; draws: number; moves: number[]; left: number[];
  score: number; bonus: number; won: boolean; over: boolean;
  /** What this run did, for the end screen. */
  lifted: number; sparkles: number; rainbows: number; freed: number; wiped: number; bestCascade: number; bestLift: number; bestLiftAt: number;
  /** The last move's outcome (the scene animates it) and its cascade length. */
  last: Outcome | null; streak: number;
};

export function createGame(run: Run, spec: Spec = specOf(run)): Game {
  let cells = deal(spec.seed, spec.colours, spec.locks);
  if (run.gift === 1 || run.gift === 2) cells = giftPieces(cells, spec.seed, run.gift);
  return {
    run, spec, limit: limitOf(spec, run.mode, run.gift), cells, dust: spec.dust ? dustLayout(spec.seed, spec.dust, spec.thick) : Array<number>(CELLS).fill(0),
    draws: 0, moves: [], left: spec.goals.map(goal => goal[1]), score: 0, bonus: 0, won: false, over: false,
    lifted: 0, sparkles: 0, rainbows: 0, freed: 0, wiped: 0, bestCascade: 0, bestLift: 0, bestLiftAt: 0, last: null, streak: 0,
  };
}

type Progress = { lifted: readonly number[]; made: readonly [number, number] | readonly number[]; freed: number; wiped: number };
/** What one outcome does for each goal. */
export function progress(goals: readonly Goal[], outcome: Progress) {
  return goals.map(([target]) =>
    target === SPARKLE ? outcome.made[0] : target === RAINBOW ? outcome.made[1] : target === DUST_GOAL ? outcome.wiped : target === FREE_GOAL ? outcome.freed : outcome.lifted[target]);
}

export const movesLeft = (game: Game) => Math.max(0, game.limit - game.moves.length);

/** The number of the next move that lets a তালা fall, and where it will fall (−1 on a level without them or when none is due). */
export const dropDue = (game: Game) => (game.spec.drop && !game.over && (game.moves.length + 1) % game.spec.drop === 0 ? dropCell(game.spec.seed, (game.moves.length + 1) / game.spec.drop) : -1);

/** One swap. Null if it does nothing or the level is over. On the winning move, every move left turns into BONUS points. */
export function move(game: Game, a: number, b: number): Game | null {
  if (game.over) return null;
  const { spec } = game, number = game.moves.length + 1;
  const lockAt = spec.drop && number % spec.drop === 0 ? dropCell(spec.seed, number / spec.drop) : -1;
  const outcome = play(game.cells, spec.seed, game.draws, spec.colours, a, b, { dust: spec.dust ? game.dust : null, lockAt });
  if (!outcome) return null;
  const gained = progress(spec.goals, outcome);
  const left = game.left.map((count, index) => Math.max(0, count - gained[index]));
  const moves = [...game.moves, code(a, b)];
  const won = left.every(count => count === 0);
  const bonus = won ? Math.max(0, Math.min(baseLimit(spec, game.run.mode), spec.moves) - moves.length) * BONUS : 0;
  const total = outcome.lifted.reduce((sum, count) => sum + count, 0);
  return {
    ...game, cells: outcome.cells, dust: outcome.dust ?? game.dust, draws: outcome.draws, moves, left, score: game.score + outcome.points + bonus, bonus, won,
    over: won || moves.length >= game.limit, last: outcome, streak: outcome.steps.length,
    lifted: game.lifted + total, sparkles: game.sparkles + outcome.made[0], rainbows: game.rainbows + outcome.made[1], freed: game.freed + outcome.freed, wiped: game.wiped + outcome.wiped,
    bestCascade: Math.max(game.bestCascade, outcome.steps.length),
    bestLift: total > game.bestLift ? total : game.bestLift, bestLiftAt: total > game.bestLift ? moves.length : game.bestLiftAt,
  };
}

// ---- stars ----
export const starsOf = (game: Game) => (game.won ? starsAt(game.spec, game.run.mode, game.score) : 0);
export const starsAt = (spec: Spec, mode: Mode, score: number) => Math.min(maxStars(mode), starsFor(score, spec.three, spec.two));
/** Points short of the next star, or 0 at the most this mode gives. */
export function shortBy(game: Game) {
  const { three, two } = game.spec, earned = starsOf(game);
  return earned >= maxStars(game.run.mode) ? 0 : (earned === 2 ? three : two) - game.score;
}

/** 0 calm, 1 amber (the moves are running low), 2 red (two or fewer). Never once the level is over. */
export function danger(game: Game) {
  if (game.over) return 0;
  const left = movesLeft(game);
  return left <= 2 ? 2 : left <= Math.max(4, Math.ceil(game.limit * 0.2)) ? 1 : 0;
}

// ---- moves: a swap is a cell and a direction (right or down), two characters in a link ----
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
export const code = (a: number, b: number) => Math.min(a, b) * 2 + (Math.abs(a - b) === 1 ? 0 : 1);
export const uncode = (value: number): [number, number] => { const cell = value >> 1; return [cell, cell + (value & 1 ? SIZE : 1)]; };
export const encodeMoves = (moves: readonly number[]) => moves.map(value => CHARS[value >> 6] + CHARS[value & 63]).join("");

/** The swaps in `text`, or null unless every one is a real pair of neighbours. */
export function decodeMoves(text: string): number[] | null {
  if (!text || text.length % 2 || text.length > 200) return null;
  const moves: number[] = [];
  for (let i = 0; i < text.length; i += 2) {
    const hi = CHARS.indexOf(text[i]), lo = CHARS.indexOf(text[i + 1]);
    if (hi < 0 || lo < 0) return null;
    const value = hi * 64 + lo, [a, b] = uncode(value);
    if (a >= CELLS || !neighbours(a, b)) return null;
    moves.push(value);
  }
  return moves;
}

/** Replays a link's moves from the level's start. Null unless every swap works and the goals are met on exactly the last one. */
export function replay(run: Run, text: string): Game | null {
  if (!runOk(run)) return null;
  const moves = decodeMoves(text);
  let game = createGame(run);
  if (!moves || moves.length > game.limit) return null;
  for (const value of moves) {
    const next = move(game, ...uncode(value));
    if (!next) return null;
    game = next;
  }
  return game.won ? game : null;
}
