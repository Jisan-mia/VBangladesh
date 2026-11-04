// One level being played: slides, the hint, stars, and replaying a link. Pure and server-safe.
import { starsFor } from "../../../shared/game-core";
import { isSolved, lineTo, opposite, shuffled, sizeOf, solve, step, LEVEL_COUNT, type Board, type Dir } from "./board";
import { LEVELS } from "./levels";
import { METHOD } from "./plates";

export { LEVEL_COUNT, sizeOf };
export const isLevel = (level: number) => Number.isInteger(level) && level >= 1 && level <= LEVEL_COUNT;
/** The plate a level starts from: the same on every phone. */
export const levelBoard = (level: number) => shuffled(sizeOf(level), LEVELS[level - 1][0], LEVELS[level - 1][1]).board;
/** The level's par: on 3×3 the fewest moves possible. */
export const parOf = (level: number) => LEVELS[level - 1][2];
/**
 * What the star targets build on: the layered method's moves on this plate (row by row, the way a patient person solves it).
 * On ৩×৩ that is the true shortest, so it equals par. On bigger plates par can be the shuffle undone, which only a lucky
 * eye finds, so building on it made the early ৪×৪ plates the hardest to three-star; the method keeps the curve honest.
 */
export const targetOf = (level: number) => Math.max(parOf(level), METHOD[level - 1]);
/** Three stars within the target plus a fifth, two with a little more room, one for any finish. */
export const threeStar = (level: number) => targetOf(level) + Math.floor(targetOf(level) / 5);
export const twoStar = (level: number) => threeStar(level) + Math.max(4, Math.ceil(threeStar(level) * 0.6));
/** The most stars a plate can still earn after `helped` hints: the first hint costs one star, a second another. */
export const hintCap = (helped: number) => helped <= 0 ? 3 : helped === 1 ? 2 : 1;
/** Stars for a finish: by moves against the level's targets, capped by the hints taken. */
export const starsOf = (count: number, level: number, helped = 0) => Math.min(hintCap(helped), starsFor(count, threeStar(level), twoStar(level), true));
/** How many fewer moves would have earned the next star (0 at three stars, or when hints cap it anyway). */
export const shortBy = (count: number, level: number, helped = 0) => {
  const earned = starsOf(count, level, helped);
  if (earned >= hintCap(helped)) return 0;
  return count - (earned === 2 ? threeStar(level) : twoStar(level));
};
/** Mid-plate: the stars this plate is on track for right now, and how many more moves keep them (Infinity at one star). */
export function onTrack(count: number, level: number, helped = 0) {
  const stars = starsOf(count, level, helped);
  const line = stars === 3 ? threeStar(level) : stars === 2 ? twoStar(level) : Infinity;
  return { stars, left: line - count };
}

/** `moves` are gap steps: one per ঘুঁটি slid. `undone` counts moves taken back (pushed straight back the way they came). */
export type Game = { level: number; board: Board; moves: Dir[]; helped: number; won: boolean; undone: number };

export const startGame = (level: number): Game => ({ level, board: levelBoard(level), moves: [], helped: 0, won: false, undone: 0 });

/**
 * Plays gap steps in order. Sliding a ঘুঁটি straight back where it came from takes that move away.
 * Null if any step runs off the plate or the plate is already solved.
 */
export function play(game: Game, steps: readonly Dir[], help = false): Game | null {
  if (game.won || !steps.length) return null;
  let board = game.board, undone = game.undone ?? 0;
  const moves = game.moves.slice();
  for (const dir of steps) {
    const next = step(board, dir);
    if (!next) return null;
    board = next;
    if (moves.length && moves[moves.length - 1] === opposite(dir)) { moves.pop(); undone++; }
    else moves.push(dir);
  }
  return { ...game, board, moves, helped: game.helped + (help ? 1 : 0), won: isSolved(board), undone };
}

/** ফিরিয়ে নাও: slides the last ঘুঁটি back where it came from, which takes that move away. Null with nothing to undo. */
export const undo = (game: Game) => game.moves.length ? play(game, [opposite(game.moves[game.moves.length - 1])]) : null;

/** How many ঘুঁটি sit in their home cell. */
export function homeCount(board: Board) {
  let home = 0;
  for (let cell = 0; cell < board.cells.length - 1; cell++) if (board.cells[cell] === cell + 1) home++;
  return home;
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

/** The old opening rule, kept for its tests: the furthest level reached that isn't three-starred yet, else the first one that isn't. */
export function startLevel(stars: Record<number, number>, unlocked: number) {
  if ((stars[unlocked] ?? 0) < 3) return unlocked;
  for (let level = 1; level <= LEVEL_COUNT; level++) if ((stars[level] ?? 0) < 3) return level;
  return unlocked;
}
