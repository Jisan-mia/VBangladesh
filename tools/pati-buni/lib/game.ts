// One run's state, made once per পাটি. step.hot.ts mutates it 60 times a second without allocating.
// Everything random comes from makeRng(seed), drawn in an order fixed by the strip count (never by time or input), so the
// same seed deals the same strips on every phone, and খোলা পাটি deals exactly what the original game dealt.
import { makeRng, pick } from "../../../shared/game-core";
import { EVENT_RING } from "./events";
import { levelOf, type Level } from "./levels";
import { MAT_ROWS } from "./link";
import { ACROSS, COLS, KIND_INDEX, OLD, ROWS, CELLS } from "./pieces";
import { begin } from "./step.hot";


export type Game = {
  level: number; row: Level; seed: number; rng: () => number; slow: boolean;
  board: Uint8Array;
  /** The fixed first strips, then the shuffled bundle being dealt. */
  opening: Uint8Array; openAt: number;
  bundle: Uint8Array; deck: Uint8Array; deckLen: number; deckAt: number;
  /** The falling strip (`live` false while a row weaves, before the next one comes). */
  live: boolean; kind: number; turn: number; x: number; y: number; wet: boolean; gold: boolean;
  next: number; nextWet: boolean; nextGold: boolean;
  fall: number; lock: number; resets: number;
  /** Rows weaving right now (lowest first), and whether a gold strip is in them. */
  clearing: Int8Array; clearCount: number; clearLeft: number; clearGold: boolean;
  /** The newest woven rows' colour patterns as a ring (see link.ts), and how many were ever woven into it. */
  woven: Uint16Array; wovenCount: number;
  rows: number; score: number; strips: number; bestClear: number; goldRows: number; streak: number; bestStreak: number;
  rolls: number; rollsUsed: number; rises: number; suis: number; t: number;
  riseIn: number; suiIn: number;
  /** 0 weaving, 1 the goal is woven, 2 the frame filled. */
  over: 0 | 1 | 2;
  events: Int32Array; eventCount: number;
};

const colourOfDigit = (digit: string) => Number(digit);

/** The old torn rows at the bottom (a tear that drifts at most a column per row, so it can be mended), then the fixed rows, from the seed. */
function openingBoard(row: Level, rng: () => number) {
  const board = new Uint8Array(CELLS);
  let y = ROWS - 1, tear = row.old ? pick(rng, COLS) : 0;
  for (let index = 0; index < row.old; index++, y--) {
    // A worn row: natural cane and খয়েরি, every cell flagged OLD, with `holes` gaps.
    for (let x = 0; x < COLS; x++) board[y * COLS + x] = (((x + y) % 3 === 0 ? 4 : 1) | OLD | ((x + y) % 2 ? 0 : ACROSS));
    if (index) tear = Math.max(0, Math.min(COLS - 1, tear + pick(rng, 3) - 1));
    board[y * COLS + tear] = 0;
    // A second hole off the tear, buried by the row above: a job for the সুই.
    if (row.holes > 1) board[y * COLS + (tear + 2 + pick(rng, COLS - 3)) % COLS] = 0;
  }
  for (const text of row.rows) {
    for (let x = 0; x < COLS; x++) if (text[x] !== ".") board[y * COLS + x] = colourOfDigit(text[x]) | ((x + y) % 2 ? 0 : ACROSS);
    y--;
  }
  return board;
}

/** A fresh run of পাটি `level` (0 is খোলা পাটি) with `rolls` গোটানো. */
export function createGame(seed: number, level: number, rolls: number, slow = false): Game {
  const row = levelOf(level), rng = makeRng(seed);
  const board = openingBoard(row, rng);
  const game: Game = {
    level: row === levelOf(0) ? 0 : level, row, seed, rng, slow, board,
    opening: Uint8Array.from(row.opening.map(kind => KIND_INDEX[kind])), openAt: 0,
    bundle: Uint8Array.from(row.bundle.map(kind => KIND_INDEX[kind])), deck: new Uint8Array(row.bundle.length), deckLen: row.bundle.length, deckAt: row.bundle.length,
    live: false, kind: 0, turn: 0, x: 0, y: 0, wet: false, gold: false, next: 0, nextWet: false, nextGold: false,
    fall: 0, lock: 0, resets: 0,
    clearing: new Int8Array(4), clearCount: 0, clearLeft: 0, clearGold: false,
    woven: new Uint16Array(MAT_ROWS), wovenCount: 0,
    rows: 0, score: 0, strips: 0, bestClear: 0, goldRows: 0, streak: 0, bestStreak: 0,
    rolls: row.goal ? rolls : 0, rollsUsed: 0, rises: 0, suis: 0, t: 0,
    riseIn: row.rise, suiIn: row.sui,
    over: 0, events: new Int32Array(EVENT_RING * 4), eventCount: 0,
  };
  begin(game);
  return game;
}

/** The woven rows on the card, oldest first (at most MAT_ROWS). */
export function wovenList(game: Game) {
  const count = Math.min(game.wovenCount, MAT_ROWS), list: number[] = [];
  for (let index = game.wovenCount - count; index < game.wovenCount; index++) list.push(game.woven[index % MAT_ROWS]);
  return list;
}

/** Where the stack's top is: the number of rows from the top that are still empty (14 for an empty frame). */
export function headroom(board: Uint8Array) {
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (board[y * COLS + x]) return y;
  return ROWS;
}
