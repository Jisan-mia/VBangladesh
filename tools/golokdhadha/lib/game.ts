// One run through a maze: where the walker is, the pencil line, the keys in hand, the clock and the stats. Built once per
// run (allocation is fine here); lib/step.hot.ts mutates it 60 times a second without allocating.
import { boardOf, darkFor, SLOW_SPEED, SPEED, type Mode, type Where } from "./levels";
import type { Board, Dir } from "./board";
import type { Graph } from "./solve";

export type Phase = "ready" | "walk" | "over";

/** Bits the step sets for the component to answer with sound and juice; the component clears them after reading. */
export const EV = { step: 1, bump: 2, key: 4, ride: 8, current: 16, stop: 32, finish: 64, start: 128, gate: 256 } as const;

export type Game = {
  board: Board; graph: Graph; where: Where; mode: Mode;
  /** Fixed when the run starts: ধীরে খেলো turned on mid-run counts from the next run. */
  slow: boolean; speed: number;
  /** The lantern's reach in cells, 0 for a lit run. */
  dark: number;
  phase: Phase;
  /** Keys in hand: bit 1 and bit 2. */
  mask: number;
  /** The cell the walker last arrived at (the pencil line's tip). */
  at: number;
  /** The next cell the walker is walking into, or -1 when standing or turning back. */
  to: number;
  /** While turning back mid-lane: the cell it was walking into; the walker heads back to `at`. -1 otherwise. */
  ghost: number;
  /** 0–1 of the way from `at` to `to`; while turning back, 0–1 of the way from `at` to `ghost`, shrinking. */
  progress: number;
  heading: Dir;
  /** A turn asked for while walking, taken at the next stop. */
  pending: Dir | 0;
  /** A tap walk's goal (straight down a lane), or -1. */
  target: number;
  /** Cells in the current walk (a guard; gen.ts never ships a lane that circles). */
  runCells: number;
  elapsed: number;
  /** Seconds left of a ride; the walker already stands on the far stand. */
  ride: number; rideFrom: number;
  trail: Int16Array; trailLen: number;
  /** Every cell arrived at, in order: the card draws the rubbed-out wanders from it. */
  walked: Int16Array; walkedLen: number;
  /** Cells the lantern has shown (dark runs). */
  lit: Uint8Array;
  steps: number; backtracks: number; swipes: number; bumps: number; deadEnds: number; keys: number; rides: number;
  /** The last bump: its side, why (1 wall, 2 gate, 3 one-way) and seconds left of its nudge. */
  bumpDir: Dir; bumpKind: number; bumpAge: number;
  /** The colour of the gate that just swung open (for its animation), and seconds since. */
  opened: number; openAge: number;
  events: number;
};

/** A fresh run. `made` swaps in a hand-built board (tests); otherwise the level's or the day's own. */
export function createGame(where: Where, mode: Mode, slow: boolean, made = boardOf(where)): Game {
  const { board, graph } = made, cells = board.open.length;
  const game: Game = {
    board, graph, where, mode, slow, speed: slow ? SLOW_SPEED : SPEED, dark: darkFor(board, mode),
    phase: "ready", mask: 0, at: board.start, to: -1, ghost: -1, progress: 0, heading: 4, pending: 0, target: -1, runCells: 0,
    elapsed: 0, ride: 0, rideFrom: -1,
    trail: new Int16Array(cells * 4), trailLen: 1, walked: new Int16Array(cells * 16), walkedLen: 1, lit: new Uint8Array(cells),
    steps: 0, backtracks: 0, swipes: 0, bumps: 0, deadEnds: 0, keys: 0, rides: 0,
    bumpDir: 4, bumpKind: 0, bumpAge: 0, opened: 0, openAge: 9, events: 0,
  };
  game.trail[0] = board.start; game.walked[0] = board.start;
  lightAround(game, board.start);
  return game;
}

/** Marks the cells within the lantern's reach of `cell` as seen. Runs on arrival only. */
export function lightAround(game: Game, cell: number) {
  const { size } = game.board, reach = game.dark || 0;
  if (!reach) return;
  const row = Math.floor(cell / size), col = cell % size, span = Math.ceil(reach);
  for (let r = Math.max(0, row - span); r <= Math.min(size - 1, row + span); r++) {
    for (let c = Math.max(0, col - span); c <= Math.min(size - 1, col + span); c++) {
      if ((r - row) * (r - row) + (c - col) * (c - col) <= reach * reach) game.lit[r * size + c] = 1;
    }
  }
}

/** The pencil line as a plain list (setup and the card, never per frame). */
export const trailOf = (game: Game) => Array.from(game.trail.subarray(0, game.trailLen));
export const walkedOf = (game: Game) => Array.from(game.walked.subarray(0, game.walkedLen));
/** Time as the HUD and the card both show it: tenths, rounded the same way everywhere. */
export const tenthsOf = (seconds: number) => Math.max(0, Math.round(seconds * 10));
/** Never once turned back. */
export const cleanRun = (game: Game) => game.backtracks === 0;
