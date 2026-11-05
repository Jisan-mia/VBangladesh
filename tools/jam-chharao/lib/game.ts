// One jam being played: slides, take-back, the hint, stars, and replaying a link. Pure and server-safe.
// A jam is either on the ladder (levels.ts, v=2 links) or one of the 40 from before the rewrite (legacy.ts, links without `v`).
import { starsFor } from "../../../shared/game-core";
import { blockers, heroesOut, occupancy, parseLevel, reach, solve, solved, type Layout, type Move } from "./board";
import { LEGACY_LEVELS } from "./legacy";
import { LEVELS } from "./levels";
import { LEVEL_COUNT } from "./worlds";

export { LEVEL_COUNT };
export const LEGACY_COUNT = LEGACY_LEVELS.length;
export const isLevel = (level: number, legacy = false) => Number.isInteger(level) && level >= 1 && level <= (legacy ? LEGACY_COUNT : LEVEL_COUNT);

const layouts = new Map<string, Layout>();
/** The jam's start: the same on every phone. Never mutate the result. */
export function layoutOf(level: number, legacy = false): Layout {
  const key = `${legacy ? "o" : "n"}${level}`;
  let lay = layouts.get(key);
  if (!lay) {
    lay = legacy ? parseLevel(LEGACY_LEVELS[level - 1][0]) : parseLevel(LEVELS[level - 1][0], LEVELS[level - 1][1]);
    layouts.set(key, lay);
  }
  return lay;
}

/** Fewest moves that clear the street on a jam (1-based), as the solver found it. */
export const parOf = (level: number, legacy = false) => legacy ? LEGACY_LEVELS[level - 1][1] : LEVELS[level - 1][2];
/** Moves for two stars: a little slack over the best, more on the long jams. */
export const twoStarMoves = (par: number) => par + Math.max(2, Math.ceil(par / 4));
/** The most stars a jam can still earn after `helped` hints: the first costs one star, a second another. Old jams: any hint, one star. */
export const hintCap = (helped: number, legacy = false) => helped <= 0 ? 3 : legacy ? 1 : helped === 1 ? 2 : 1;
/** Three stars at par, two within twoStarMoves, one for any other way out; hints cap it. */
export const starsOf = (count: number, par: number, helped = 0, legacy = false) =>
  Math.min(hintCap(helped, legacy), starsFor(count, par, twoStarMoves(par), true));
/** How many fewer moves would have earned the next star (0 at the top, or when hints cap it anyway). */
export function shortBy(count: number, par: number, helped = 0, legacy = false) {
  const earned = starsOf(count, par, helped, legacy);
  if (earned >= hintCap(helped, legacy)) return 0;
  return count - (earned === 2 ? par : twoStarMoves(par));
}
/** Mid-jam: the stars this jam is on track for right now, and how many more moves keep them (Infinity at one star). */
export function onTrack(count: number, par: number, helped = 0, legacy = false) {
  const stars = starsOf(count, par, helped, legacy);
  const line = stars === 3 ? par : stars === 2 ? twoStarMoves(par) : Infinity;
  return { stars, left: line - count };
}

export type Game = {
  level: number; legacy: boolean; lay: Layout; pos: number[]; moves: Move[]; helped: number;
  /** Moves taken away (by ফিরিয়ে নাও, or by sliding straight back). */
  undone: number; won: boolean;
};

export function startGame(level: number, legacy = false): Game {
  const lay = layoutOf(level, legacy);
  return { level, legacy, lay, pos: lay.start.slice(), moves: [], helped: 0, undone: 0, won: false };
}

export function reachOf(game: Game, car: number) {
  return reach(game.lay, occupancy(game.lay, game.pos), game.pos, car);
}

/**
 * Slides `car` to `to` if the road is clear. Sliding the same vehicle again straight after counts as the same move
 * (the way the solver counts), and sliding it back where that move began takes the move away.
 */
export function slide(game: Game, car: number, to: number, help = false): Game | null {
  if (game.won || !Number.isInteger(car) || car < 0 || car >= game.lay.cars.length) return null;
  const [low, high] = reachOf(game, car);
  if (!Number.isInteger(to) || to < low || to > high || to === game.pos[car]) return null;
  const pos = game.pos.slice();
  pos[car] = to;
  const last = game.moves[game.moves.length - 1];
  const moves = last?.car === car ? game.moves.slice(0, -1) : game.moves.slice();
  const from = last?.car === car ? last.from : game.pos[car];
  let undone = game.undone;
  if (from !== to) moves.push({ car, from, to }); else undone++;
  return { ...game, pos, moves, undone, helped: game.helped + (help ? 1 : 0), won: solved(game.lay, pos) };
}

/** ফিরিয়ে নাও: puts the last moved vehicle back where that move began. */
export function undo(game: Game): Game | null {
  const last = game.moves[game.moves.length - 1];
  if (!last || game.won) return null;
  const pos = game.pos.slice();
  pos[last.car] = last.from;
  return { ...game, pos, moves: game.moves.slice(0, -1), undone: game.undone + 1 };
}

/** The next move of a shortest way out from here (every slide before a hero leaves can be undone, so there always is one). */
export const hint = (game: Game): Move | null => game.won ? null : solve(game.lay, game.pos)?.[0] ?? null;
/** How many moves are left on a shortest way out from here. */
export const movesLeft = (game: Game) => game.won ? 0 : solve(game.lay, game.pos)?.length ?? 0;

/** One character a move: car × 6 + where it stopped (no car stops past 5). */
const MOVE_CHARS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWX";
export const MAX_LINK_MOVES = 250;
export const encodeMoves = (moves: readonly Move[]) => moves.map(move => MOVE_CHARS[move.car * 6 + move.to]).join("");

/** Plays a link's moves from the jam's start. Null unless every move is legal, written the short way, and the street clears. */
export function replay(level: number, text: string, legacy = false): Game | null {
  if (!isLevel(level, legacy) || text.length > MAX_LINK_MOVES || !/^[0-9a-zA-X]+$/.test(text)) return null;
  let game = startGame(level, legacy);
  for (const char of text) {
    const code = MOVE_CHARS.indexOf(char), car = Math.floor(code / 6);
    if (game.won || game.moves[game.moves.length - 1]?.car === car) return null;
    const next = slide(game, car, code % 6);
    if (!next) return null;
    game = next;
  }
  return game.won ? game : null;
}

/** How far the street is from clear: vehicles still in a hero's way (now and at the start), and heroes already out. */
export function clearance(game: Game) {
  const { lay } = game, now = blockers(lay, game.pos).length, total = blockers(lay, lay.start).length, out = heroesOut(lay, game.pos);
  const fraction = Math.max(0, Math.min(1, 1 - (now + (lay.heroes - out)) / (total + lay.heroes)));
  return { blockers: now, total, out, heroes: lay.heroes, fraction };
}
