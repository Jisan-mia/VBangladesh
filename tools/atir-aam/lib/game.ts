// One run: the open garden (endless) or a goal level. Moves, stars, links. Pure and server-safe.
import { starsFor } from "../../../shared/game-core";
import { canMove, slide, spawn, topStage, STONE, TOP, type Dir, type Slide } from "./board";
import { LEVELS } from "./levels";

export const LEVEL_COUNT = LEVELS.length;
export const FREE_SIZE = 4;
export const isLevel = (level: number) => Number.isInteger(level) && level >= 1 && level <= LEVEL_COUNT;
export const levelOf = (level: number) => LEVELS[level - 1];

/** `level` 0 is the open garden. `last` and `spawned` only feed the animation. */
export type Game = {
  level: number; seed: number; size: number; cells: number[]; moves: Dir[]; score: number; top: number;
  won: boolean; over: boolean; last: Slide | null; spawned: { cell: number; stage: number } | null;
};

/** A fresh plot: stones in place, then two আঁটি (never a চারা), so the first merge is a swipe or two away. */
export function plot(seed: number, size = FREE_SIZE, stones: readonly number[] = [], level = 0): Game {
  const cells = Array<number>(size * size).fill(0);
  for (const cell of stones) cells[cell] = STONE;
  for (const index of [0, 1]) { const placed = spawn(cells, seed, index, true)!; cells[placed.cell] = placed.stage; }
  return { level, seed, size, cells, moves: [], score: 0, top: 1, won: false, over: false, last: null, spawned: null };
}
/** A level's plot is the same on every phone; the open garden takes any seed. */
export const startGame = (seed: number, level = 0): Game => {
  if (!level) return plot(seed);
  const { seed: fixed, size, stones } = levelOf(level);
  return plot(fixed, size, stones, level);
};

/** One swipe. Null when the run is over or nothing would move (no move counted). */
export function move(game: Game, dir: Dir): Game | null {
  if (game.over) return null;
  const done = slide(game.cells, game.size, dir);
  if (!done) return null;
  const cells = done.cells, moves = [...game.moves, dir];
  const placed = spawn(cells, game.seed, moves.length + 1);
  if (placed) cells[placed.cell] = placed.stage;
  const top = Math.max(game.top, topStage(cells));
  const spec = game.level ? levelOf(game.level) : null;
  const won = !!spec && top >= spec.target;
  const over = won || !canMove(cells, game.size) || (!!spec && moves.length >= limitOf(game.level));
  return { ...game, cells, moves, score: game.score + done.points, top, won, over, last: done, spawned: placed };
}

export const playAll = (game: Game, dirs: readonly Dir[]) => dirs.reduce<Game | null>((current, dir) => current && move(current, dir), game);

// ---- stars ----
/** Level thresholds from the test bot's own move count (`bot`): roomy early, tighter on the ★ levels. */
export const threeStar = (level: number) => { const { bot, tight } = levelOf(level); return bot + Math.ceil(bot * (tight ? 0.15 : 0.25)); };
export const twoStar = (level: number) => { const { bot, tight } = levelOf(level); return bot + Math.ceil(bot * (tight ? 0.35 : 0.55)); };
/** The move limit: miss the goal by then and the level isn't cleared (retry is instant). */
export const limitOf = (level: number) => { const { bot, tight } = levelOf(level); return Math.max(10, bot + Math.ceil(bot * (tight ? 0.7 : 1)) + 4); };
export const levelStars = (level: number, count: number) => starsFor(count, threeStar(level), twoStar(level), true);
/** Moves fewer that would have earned the next star (0 at three stars). */
export function shortBy(level: number, count: number) {
  const earned = levelStars(level, count);
  return earned === 3 ? 0 : count - (earned === 2 ? threeStar(level) : twoStar(level));
}
/** The open garden: ★ for পাকা আম, ★★ for a ঝুড়ি, ★★★ for the whole বাগান. */
export const freeStars = (top: number) => Math.max(0, Math.min(3, top - (TOP - 3)));
export const FREE_STAR_STAGES = [TOP - 2, TOP - 1, TOP] as const;

/** Where to open the level list: the furthest level reached that isn't three-starred, else the first one that isn't. */
export function startLevel(stars: Record<number, number>, unlocked: number) {
  if ((stars[unlocked] ?? 0) < 3) return unlocked;
  for (let level = 1; level <= LEVEL_COUNT; level++) if ((stars[level] ?? 0) < 3) return level;
  return unlocked;
}

// ---- links: three moves a character ----
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
export const MAX_LINK_MOVES = 4500;

export function encodeMoves(moves: readonly Dir[]) {
  let text = "";
  for (let i = 0; i < moves.length; i += 3) text += CHARS[(moves[i] << 4) | ((moves[i + 1] ?? 0) << 2) | (moves[i + 2] ?? 0)];
  return text;
}

/** The `count` moves in `text`, or null unless it is written exactly the way encodeMoves writes it. */
export function decodeMoves(text: string, count: number): Dir[] | null {
  if (!Number.isInteger(count) || count < 1 || count > MAX_LINK_MOVES || text.length !== Math.ceil(count / 3)) return null;
  const moves: Dir[] = [];
  for (const char of text) {
    const code = CHARS.indexOf(char);
    if (code < 0) return null;
    moves.push((code >> 4) as Dir, ((code >> 2) & 3) as Dir, (code & 3) as Dir);
  }
  if (moves.slice(count).some(dir => dir !== 0)) return null;
  return moves.slice(0, count);
}

/**
 * Plays a link's moves from the start. Null unless every move really moves something; a level must reach its goal on
 * exactly the last move. So the score, the stage and the move count are proven, not claimed.
 */
export function replay(start: Game, text: string, count: number): Game | null {
  const dirs = decodeMoves(text, count);
  if (!dirs) return null;
  const game = playAll(start, dirs);
  if (!game || (start.level && !game.won)) return null;
  return game;
}
