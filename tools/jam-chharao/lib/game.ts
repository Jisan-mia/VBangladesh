// One level being played: slides, undo, the hint, replaying a link, and this phone's progress. Pure and server-safe.
import { occupancy, parseLevel, reach, solve, solved, type Car, type Move } from "./board";
import { LEVELS } from "./levels";

export const LEVEL_COUNT = LEVELS.length;
/** Fewest moves that free the CNG on a level (1-based), as the solver found it. */
export const fewest = (level: number) => LEVELS[level - 1][1];
export const isLevel = (level: number) => Number.isInteger(level) && level >= 1 && level <= LEVEL_COUNT;

export type Game = { level: number; cars: Car[]; pos: number[]; moves: Move[]; helped: number; won: boolean };

export function startGame(level: number): Game {
  const { cars, start } = parseLevel(LEVELS[level - 1][0]);
  return { level, cars, pos: start, moves: [], helped: 0, won: false };
}

export function reachOf(game: Game, car: number) {
  return reach(game.cars, occupancy(game.cars, game.pos), game.pos, car);
}

/**
 * Slides `car` to `to` if the road is clear. Sliding the same vehicle again straight after counts as the same move
 * (the way the solver counts), and sliding it back where that move began takes the move away.
 */
export function slide(game: Game, car: number, to: number, help = false): Game | null {
  if (game.won || car < 0 || car >= game.cars.length) return null;
  const [low, high] = reachOf(game, car);
  if (!Number.isInteger(to) || to < low || to > high || to === game.pos[car]) return null;
  const pos = game.pos.slice();
  pos[car] = to;
  const last = game.moves[game.moves.length - 1];
  const moves = last?.car === car ? game.moves.slice(0, -1) : game.moves.slice();
  const from = last?.car === car ? last.from : game.pos[car];
  if (from !== to) moves.push({ car, from, to });
  return { ...game, pos, moves, helped: game.helped + (help ? 1 : 0), won: solved(pos) };
}

export function undo(game: Game): Game {
  const last = game.moves[game.moves.length - 1];
  if (!last || game.won) return game;
  const pos = game.pos.slice();
  pos[last.car] = last.from;
  return { ...game, pos, moves: game.moves.slice(0, -1) };
}

/** The next move of a shortest way out from here (every slide can be undone, so there always is one). */
export const hint = (game: Game): Move | null => game.won ? null : solve(game.cars, game.pos)?.[0] ?? null;

/** One character a move: car × 6 + where it stopped (no car stops past 5). */
const MOVE_CHARS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWX";
export const MAX_LINK_MOVES = 250;
export const encodeMoves = (moves: readonly Move[]) => moves.map(move => MOVE_CHARS[move.car * 6 + move.to]).join("");

/** Plays a link's moves from the level's start. Null unless every move is legal, written the short way, and the CNG gets out. */
export function replay(level: number, text: string): Game | null {
  if (!isLevel(level) || text.length > MAX_LINK_MOVES || !/^[0-9a-zA-X]+$/.test(text)) return null;
  let game = startGame(level);
  for (const char of text) {
    const code = MOVE_CHARS.indexOf(char), car = Math.floor(code / 6);
    if (game.won || game.moves[game.moves.length - 1]?.car === car) return null;
    const next = slide(game, car, code % 6);
    if (!next) return null;
    game = next;
  }
  return game.won ? game : null;
}

/** This phone's progress: level → fewest moves solved without help, or 0 when it was solved only with help. */
export type Progress = Record<number, number>;

/** Reads saved progress, keeping only sane entries (storage can hold anything). */
export function readProgress(raw: string | null): Progress {
  const progress: Progress = {};
  try {
    const saved: unknown = JSON.parse(raw ?? "{}");
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) return progress;
    for (const [key, value] of Object.entries(saved)) {
      const level = Number(key);
      if (isLevel(level) && Number.isInteger(value) && value >= 0 && value <= 999) progress[level] = value;
    }
  } catch { /* broken JSON: start fresh */ }
  return progress;
}

export function recordWin(progress: Progress, game: Game): Progress {
  const before = progress[game.level];
  const mine = game.helped ? 0 : game.moves.length;
  const best = before === undefined ? mine : before === 0 || mine === 0 ? Math.max(before, mine) : Math.min(before, mine);
  return { ...progress, [game.level]: best };
}

/** The highest level open to play: one past the highest solved. */
export const unlocked = (progress: Progress) => Math.min(LEVEL_COUNT, 1 + Math.max(0, ...Object.keys(progress).map(Number)));
