// The rules of জোড়া মেলাও as pure functions: deal a seeded board, flip, settle a miss, replay a link's flips. Server-safe.
import { makeRng, pick } from "../../../shared/game-core";

/** The fair-stall toys, by id. The order is part of every link (a seed deals from it), so only ever append. */
export const TOYS = ["belun", "ghuri", "latim", "bansi", "ektara", "putul", "tomtom", "jhunjhuni", "charki", "nouka"] as const;
export type ToyId = (typeof TOYS)[number];

export const COLS = 4;
/** Cards on the board, four to a row: ২×৪ and ৫×৪ came with levels; two players choose ৪×৪ or the easy ৩×৪. */
export type Size = 8 | 12 | 16 | 20;
export const SIZES: readonly Size[] = [8, 12, 16, 20];
export type Players = 1 | 2;
export const rowsOf = (size: Size) => size / COLS;
export const pairsOf = (size: Size) => size / 2;

export type Game = {
  seed: number;
  size: Size;
  players: Players;
  /** Which toy lies on each card (an index into TOYS); every toy twice. */
  board: number[];
  /** One pair shown face up on the first screen, as a demo; it turns back on the first tap. */
  demo: [number, number];
  /** Face-up cards that aren't matched yet: none, the first of a move, or a missed pair waiting to turn back. */
  open: number[];
  /** Per card: -1 while hidden, else who matched it (0, or 1 for the second player). */
  found: number[];
  turn: 0 | 1;
  pairs: [number, number];
  moves: number;
  /** Every card flipped, in order. A link carries these so the friend's page can re-check the moves. */
  flips: number[];
  phase: "ready" | "playing" | "over";
  /** What the latest move did, for the "মিলেছে!" pop. */
  last: "match" | "miss" | null;
};

function shuffle<T>(rng: () => number, items: T[]) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = pick(rng, i + 1);
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

/** The same seed and size always give the same toys in the same places, on every phone. */
export function newGame(seed: number, size: Size, players: Players): Game {
  const rng = makeRng(seed);
  const toys = shuffle(rng, TOYS.map((_, index) => index)).slice(0, pairsOf(size));
  const board = shuffle(rng, toys.flatMap(toy => [toy, toy]));
  const shown = toys[pick(rng, toys.length)];
  const first = board.indexOf(shown);
  return {
    seed, size, players, board,
    demo: [first, board.indexOf(shown, first + 1)],
    open: [], found: board.map(() => -1), turn: 0, pairs: [0, 0], moves: 0, flips: [], phase: "ready", last: null,
  };
}

/** Turns a missed pair back face down. */
export const settle = (game: Game): Game => game.open.length === 2 ? { ...game, open: [], last: null } : game;

/**
 * Flips card `index`. Returns the same object when the tap does nothing (a matched card, the card already up, game over).
 * A missed pair still showing turns back first; tapping one of those two only turns them back.
 */
export function flip(game: Game, index: number): Game {
  if (game.phase === "over" || !Number.isInteger(index) || index < 0 || index >= game.size || game.found[index] >= 0) return game;
  if (game.open.includes(index)) return game.open.length === 2 ? settle(game) : game;
  const before = settle(game);
  const flips = [...before.flips, index];
  if (before.open.length === 0) return { ...before, open: [index], flips, phase: "playing", last: null };

  const other = before.open[0], moves = before.moves + 1;
  if (before.board[other] !== before.board[index]) {
    const turn = before.players === 2 ? (1 - before.turn) as 0 | 1 : 0;
    return { ...before, open: [other, index], flips, moves, turn, last: "miss" };
  }
  const found = before.found.slice();
  found[other] = found[index] = before.turn;
  const pairs: [number, number] = [...before.pairs];
  pairs[before.turn]++;
  const over = pairs[0] + pairs[1] === pairsOf(before.size);
  return { ...before, open: [], found, pairs, flips, moves, last: "match", phase: over ? "over" : "playing" };
}

/** Is card `index` face up on screen? */
export const isUp = (game: Game, index: number) =>
  game.found[index] >= 0 || game.open.includes(index) || (game.phase === "ready" && game.demo.includes(index));

/**
 * Plays a link's flips on its board. Null when any flip is not a real flip (a matched card, a repeat, off the board).
 * A missed pair is turned back before each flip, as the timer or a tap on it would have done on the phone.
 */
export function replay(seed: number, size: Size, players: Players, flips: readonly number[]): Game | null {
  let game = newGame(seed, size, players);
  for (const index of flips) {
    const next = flip(settle(game), index);
    if (next.flips.length !== game.flips.length + 1) return null;
    game = next;
  }
  return game;
}

/** One base-32 digit per flip (the same as hex below 16, so old links read the same): a 16-card game in 23 moves is 46 characters. */
export const flipsText = (flips: readonly number[]) => flips.map(index => index.toString(32)).join("");
export const readFlips = (text: string) => /^[0-9a-v]*$/.test(text) ? [...text].map(digit => parseInt(digit, 32)) : null;

/**
 * Solo levels: the board grows (৮ → ১২ → ১৬ → ২০ cards) and par tightens. `three`/`two`: the most moves for 3 and 2 stars; any clear is 1.
 * A test plays each level with a perfect memory and checks three stars stay within reach.
 */
export const LEVELS: ReadonlyArray<{ size: Size; three: number; two: number }> = [
  { size: 8, three: 7, two: 9 }, { size: 8, three: 6, two: 8 }, { size: 8, three: 6, two: 7 },
  { size: 12, three: 10, two: 13 }, { size: 12, three: 9, two: 12 }, { size: 12, three: 9, two: 11 },
  { size: 16, three: 14, two: 18 }, { size: 16, three: 13, two: 16 }, { size: 16, three: 12, two: 15 },
  { size: 20, three: 18, two: 23 }, { size: 20, three: 17, two: 21 }, { size: 20, three: 16, two: 20 },
];
export const LEVEL_COUNT = LEVELS.length;
export const isLevel = (level: number) => Number.isInteger(level) && level >= 1 && level <= LEVEL_COUNT;
export function starsOf(level: number, moves: number) {
  if (!isLevel(level)) return 0;
  const { three, two } = LEVELS[level - 1];
  return moves <= three ? 3 : moves <= two ? 2 : 1;
}
/** Moves fewer that would have earned the next star (0 at three stars). */
export function movesToNextStar(level: number, moves: number) {
  const stars = starsOf(level, moves);
  if (!stars || stars === 3) return 0;
  const { three, two } = LEVELS[level - 1];
  return moves - (stars === 2 ? three : two);
}
/** Where to open: the furthest open level unless it already has three stars, then the first one short of three. */
export function startLevel(stars: Readonly<Record<number, number>>, unlocked: number) {
  if ((stars[unlocked] ?? 0) < 3) return unlocked;
  for (let level = 1; level <= LEVEL_COUNT; level++) if ((stars[level] ?? 0) < 3) return level;
  return unlocked;
}
/**
 * Once, before levels: this phone's old best on ৩×৪ and ৪×৪ (fewest moves) become stars on the first level of that size, judged by its par.
 * Returns the new level store, or null when there's nothing to move.
 */
export function migrateLevels(levelsRaw: string | null, best12: string | null, best16: string | null) {
  if (levelsRaw !== null) return null;
  const stars: Record<number, number> = {};
  for (const [raw, size] of [[best12, 12], [best16, 16]] as const) {
    const moves = Number(raw);
    if (raw === null || !Number.isInteger(moves) || moves < pairsOf(size)) continue;
    const level = LEVELS.findIndex(entry => entry.size === size) + 1;
    stars[level] = starsOf(level, moves);
  }
  return Object.keys(stars).length ? JSON.stringify(stars) : null;
}

/** Score bands for one player, by how many moves per pair: 0 is a flawless game, 5 is a long, patient one. */
export function band(moves: number, size: Size) {
  const perPair = moves / pairsOf(size);
  if (perPair <= 1) return 0;
  if (perPair <= 1.5) return 1;
  if (perPair <= 2) return 2;
  if (perPair <= 2.75) return 3;
  if (perPair <= 3.5) return 4;
  return 5;
}
