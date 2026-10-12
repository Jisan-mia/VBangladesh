// One level being played: slides, the hint, stars, and replaying a link. Pure and server-safe.
import { starsFor } from "../../../shared/game-core";
import { isSolved, lineTo, opposite, shuffled, sizeOf, solve, step, LEVEL_COUNT, type Board, type Dir } from "./board";
import { LEVELS } from "./levels";

export { LEVEL_COUNT, sizeOf };
export const isLevel = (level: number) => Number.isInteger(level) && level >= 1 && level <= LEVEL_COUNT;
/** The plate a level starts from: the same on every phone. */
export const levelBoard = (level: number) => shuffled(sizeOf(level), LEVELS[level - 1][0], LEVELS[level - 1][1]).board;
/** The level's par: on 3×3 the fewest moves possible. */
export const parOf = (level: number) => LEVELS[level - 1][2];
/** Three stars at par plus a fifth, two with a little more room, one for any finish. */
export const threeStar = (level: number) => parOf(level) + Math.floor(parOf(level) / 5);
export const twoStar = (level: number) => threeStar(level) + Math.max(4, Math.ceil(threeStar(level) * 0.6));
/** Help from the hint caps a solve at one star. */
export const starsOf = (count: number, level: number, helped = 0) => helped ? 1 : starsFor(count, threeStar(level), twoStar(level), true);
/** How many fewer moves would have earned the next star (0 at three stars or with help). */
export const shortBy = (count: number, level: number, helped = 0) => {
  const earned = starsOf(count, level, helped);
  return helped || earned === 3 ? 0 : count - (earned === 2 ? threeStar(level) : twoStar(level));
};

/** `moves` are gap steps: one per ঘুঁটি slid. */
export type Game = { level: number; board: Board; moves: Dir[]; helped: number; won: boolean };

export const startGame = (level: number): Game => ({ level, board: levelBoard(level), moves: [], helped: 0, won: false });

/**
 * Plays gap steps in order. Sliding a ঘুঁটি straight back where it came from takes that move away.
 * Null if any step runs off the plate or the plate is already solved.
 */
export function play(game: Game, steps: readonly Dir[], help = false): Game | null {
  if (game.won || !steps.length) return null;
  let board = game.board;
  const moves = game.moves.slice();
  for (const dir of steps) {
    const next = step(board, dir);
    if (!next) return null;
    board = next;
    if (moves.length && moves[moves.length - 1] === opposite(dir)) moves.pop();
    else moves.push(dir);
  }
  return { ...game, board, moves, helped: game.helped + (help ? 1 : 0), won: isSolved(board) };
}

/** Tapping a ঘুঁটি in the gap's row or column slides that whole line; anything else does nothing (null). */
export const tap = (game: Game, cell: number) => {
  const steps = lineTo(game.board, cell);
  return steps ? play(game, steps) : null;
};

/** The next move of a real solution from here (the true shortest one on 3×3). */
export const hint = (game: Game): Dir | null => game.won ? null : solve(game.board, 1)[0] ?? null;

// ---- links: three moves a character ----
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
export const MAX_LINK_MOVES = 1500;

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

/** Plays a link's moves from the level's start. Null unless every move is legal, none undoes the one before, and the last one solves it. */
export function replay(level: number, text: string, count: number): Game | null {
  if (!isLevel(level)) return null;
  const moves = decodeMoves(text, count);
  if (!moves) return null;
  let game = startGame(level);
  for (const dir of moves) {
    const next = play(game, [dir]);
    if (!next || next.moves.length !== game.moves.length + 1) return null;
    game = next;
  }
  return game.won ? game : null;
}

/** Where to open: the furthest level reached that isn't three-starred yet, else the first one that isn't. */
export function startLevel(stars: Record<number, number>, unlocked: number) {
  if ((stars[unlocked] ?? 0) < 3) return unlocked;
  for (let level = 1; level <= LEVEL_COUNT; level++) if ((stars[level] ?? 0) < 3) return level;
  return unlocked;
}
