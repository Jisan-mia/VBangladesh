// The rules of জোড়া মেলাও as pure functions: deal a seeded board, flip, settle a miss, replay a link's flips. Server-safe.
import { makeRng, pick } from "../../../shared/game-core";

/** The fair-stall toys, by id. The order is part of every link (a seed deals from it), so only ever append. */
export const TOYS = ["belun", "ghuri", "latim", "bansi", "ektara", "putul", "tomtom", "jhunjhuni", "charki", "nouka"] as const;
export type ToyId = (typeof TOYS)[number];

export const COLS = 4;
/** ৪×৪ (16 cards) or the easy ৩×৪ (12 cards). */
export type Size = 12 | 16;
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

/** One hex digit per flip: a 16-card game in 23 moves is 46 characters. */
export const flipsText = (flips: readonly number[]) => flips.map(index => index.toString(16)).join("");
export const readFlips = (text: string) => /^[0-9a-f]*$/.test(text) ? [...text].map(digit => parseInt(digit, 16)) : null;

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
