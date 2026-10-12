// One level: goals, moves, score, stars, and the move code a challenge link carries. Pure and server-safe.
import { starsFor } from "../../../shared/game-core";
import { deal, neighbours, play, CELLS, RAINBOW, SIZE, SPARKLE, type Outcome } from "./board";
import { LEVELS, type LevelSpec } from "./levels";

export const LEVEL_COUNT = LEVELS.length;
export const isLevel = (level: number) => Number.isInteger(level) && level >= 1 && level <= LEVEL_COUNT;
export const levelOf = (level: number): LevelSpec => LEVELS[level - 1];
/** Each move left when the goals are met is worth this much at the end. */
export const BONUS = 50;

/** A goal: lift `count` bangles of a colour (0..5), or make `count` ঝিকমিক (SPARKLE) or রংধনু (RAINBOW) bangles. */
export type Goal = readonly [target: number, count: number];

export type Game = {
  level: number; cells: number[]; draws: number; moves: number[]; left: number[];
  score: number; bonus: number; won: boolean; over: boolean;
};

export function startGame(level: number, spec: LevelSpec = levelOf(level)): Game {
  return { level, cells: deal(spec.seed, spec.colours), draws: 0, moves: [], left: spec.goals.map(goal => goal[1]), score: 0, bonus: 0, won: false, over: false };
}

/** What one outcome does for each goal. */
export function progress(goals: readonly Goal[], outcome: Pick<Outcome, "lifted" | "made">) {
  return goals.map(([target]) => (target === SPARKLE ? outcome.made[0] : target === RAINBOW ? outcome.made[1] : outcome.lifted[target]));
}

/** One swap. Null if it does nothing or the level is over. On the winning move, every move left turns into BONUS points. */
export function move(game: Game, a: number, b: number, spec: LevelSpec = levelOf(game.level)): { game: Game; outcome: Outcome } | null {
  if (game.over) return null;
  const outcome = play(game.cells, spec.seed, game.draws, spec.colours, a, b);
  if (!outcome) return null;
  const gained = progress(spec.goals, outcome);
  const left = game.left.map((count, index) => Math.max(0, count - gained[index]));
  const moves = [...game.moves, code(a, b)];
  const won = left.every(count => count === 0);
  const bonus = won ? (spec.moves - moves.length) * BONUS : 0;
  return {
    outcome,
    game: { ...game, cells: outcome.cells, draws: outcome.draws, moves, left, score: game.score + outcome.points + bonus, bonus, won, over: won || moves.length >= spec.moves },
  };
}

// ---- stars ----
export const levelStars = (level: number, score: number) => { const { three, two } = levelOf(level); return starsFor(score, three, two); };
/** Points short of the next star (0 at three stars). */
export function shortBy(level: number, score: number) {
  const { three, two } = levelOf(level), earned = levelStars(level, score);
  return earned === 3 ? 0 : (earned === 2 ? three : two) - score;
}
/** Where to open: the furthest level reached that isn't three-starred, else the first one that isn't. */
export function startLevel(stars: Record<number, number>, unlocked: number) {
  if ((stars[unlocked] ?? 0) < 3) return unlocked;
  for (let level = 1; level <= LEVEL_COUNT; level++) if ((stars[level] ?? 0) < 3) return level;
  return unlocked;
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
export function replay(level: number, text: string): Game | null {
  if (!isLevel(level)) return null;
  const moves = decodeMoves(text);
  if (!moves || moves.length > levelOf(level).moves) return null;
  let game = startGame(level);
  for (const value of moves) {
    const next = move(game, ...uncode(value));
    if (!next) return null;
    game = next.game;
  }
  return game.won ? game : null;
}
