// Rules for পাটি বুনি: an 8×14 mat frame, six cane strips of 2 to 4 cells from a seeded bundle, simple wall kicks, and full rows that weave and roll away.
import { makeRng, pick } from "../../../shared/game-core";
import { possessive } from "../../../shared/bangla";
import { bn, MAT_ROWS, ROW_POINTS } from "./link";

export const COLS = 8;
export const ROWS = 14;
export const CELLS = COLS * ROWS;

/** 1 natural বেত, 2 হলুদ, 3 মেহেদি, 4 খয়েরি. A board cell stores the colour, plus ACROSS when its slats run sideways. */
export type Colour = 1 | 2 | 3 | 4;
export const ACROSS = 8;
export const colourOf = (cell: number) => cell & 7;

type Cells = ReadonlyArray<readonly [number, number]>;
/** Each strip turns inside its own `box`; cells are [x, y] with y down. */
export const PIECES = {
  dui: { box: 2, colour: 2, cells: [[0, 0], [1, 0]] },
  tin: { box: 3, colour: 1, cells: [[0, 1], [1, 1], [2, 1]] },
  kona: { box: 2, colour: 4, cells: [[0, 0], [0, 1], [1, 1]] },
  lomba: { box: 4, colour: 3, cells: [[0, 1], [1, 1], [2, 1], [3, 1]] },
  banka: { box: 3, colour: 2, cells: [[0, 1], [1, 1], [2, 1], [2, 0]] },
  dheu: { box: 3, colour: 3, cells: [[0, 1], [1, 1], [1, 0], [2, 0]] },
} as const satisfies Record<string, { box: number; colour: Colour; cells: Cells }>;
export type Kind = keyof typeof PIECES;
export const KINDS = Object.keys(PIECES) as Kind[];

/** Eight strips to a bundle, the short ones twice as often; the seed shuffles every bundle. */
export const BUNDLE: readonly Kind[] = ["dui", "tin", "tin", "kona", "kona", "lomba", "banka", "dheu"];
/** Everyone starts the same way: a short strip for the first gap, then a straight three that needs one step right. */
export const OPENING: readonly Kind[] = ["dui", "tin"];

/** Flat [x0, y0, x1, y1, …] for every kind and quarter turn, worked out once so a frame never allocates. */
export const TURNS = Object.fromEntries(KINDS.map(kind => {
  const { box, cells } = PIECES[kind];
  const turns: number[][] = [];
  let current: Cells = cells;
  for (let turn = 0; turn < 4; turn++) {
    turns.push(current.flat());
    current = current.map(([x, y]) => [box - 1 - y, x] as const);
  }
  return [kind, turns];
})) as Record<Kind, number[][]>;

/** Tried in order when a turn bumps a wall or the stack: in place, a step either side, one up, then two either side for the long strip. */
const KICKS = [[0, 0], [-1, 0], [1, 0], [0, -1], [-2, 0], [2, 0]] as const;
/** A strip resting on the stack may still slide or turn; each move restarts the lock wait, up to this many times. */
const MAX_RESETS = 12;
export const LEVEL_EVERY = 10;
export const SOFT_MS = 40;
export const lockMs = (slow: boolean) => slow ? 800 : 480;
export const clearMs = (slow: boolean) => slow ? 640 : 420;
export const level = (rows: number) => Math.floor(rows / LEVEL_EVERY);
/** Milliseconds per row: a gentle 700, about 13% quicker every ten rows, never under 70. ধীরে খেলো starts at 1000 and never goes under 520. */
export function dropMs(rows: number, slow: boolean) {
  const steps = level(rows);
  return slow ? Math.max(520, Math.round(1000 * 0.92 ** steps)) : Math.max(70, Math.round(700 * 0.87 ** steps));
}

export type Piece = { kind: Kind; turn: number; x: number; y: number };
export type Game = {
  rng: () => number;
  board: Uint8Array;
  bundle: Kind[];
  piece: Piece | null;
  next: Kind;
  rows: number;
  score: number;
  pieces: number;
  fall: number;
  lock: number;
  resets: number;
  /** Rows being woven right now; they leave the board once `clearLeft` runs out. */
  clearing: number[];
  clearLeft: number;
  /** The newest woven rows' colour patterns, oldest first (see link.ts). */
  woven: number[];
  slow: boolean;
  over: boolean;
};

export type Event = "none" | "lock" | "clear" | "spawn" | "over";

export const across = (kind: Kind, turn: number, index: number) => ((TURNS[kind][turn][index * 2] + TURNS[kind][turn][index * 2 + 1]) & 1) === 0;

/** The half-woven start: two rows of natural cane and খয়েরি with a gap each, the bottom one exactly a short strip wide. */
function openingBoard() {
  const board = new Uint8Array(CELLS);
  const rows: Array<[number, readonly number[]]> = [[13, [1, 4, 1, 0, 0, 1, 4, 1]], [12, [4, 1, 4, 0, 0, 0, 1, 4]]];
  for (const [y, colours] of rows) colours.forEach((colour, x) => { if (colour) board[y * COLS + x] = colour | ((x + y) % 2 ? 0 : ACROSS); });
  return board;
}

export function fits(board: Uint8Array, kind: Kind, turn: number, x: number, y: number) {
  const cells = TURNS[kind][turn];
  for (let i = 0; i < cells.length; i += 2) {
    const cx = x + cells[i], cy = y + cells[i + 1];
    if (cx < 0 || cx >= COLS || cy < 0 || cy >= ROWS || board[cy * COLS + cx]) return false;
  }
  return true;
}

function deal(game: Game): Kind {
  if (!game.bundle.length) {
    const fresh = [...BUNDLE];
    for (let i = fresh.length - 1; i > 0; i--) { const j = pick(game.rng, i + 1); [fresh[i], fresh[j]] = [fresh[j], fresh[i]]; }
    game.bundle = fresh;
  }
  return game.bundle.shift()!;
}

/** The waiting strip enters at the top centre with its whole box inside the frame, so it can turn straight away. Returns false (game over) when there's no room. */
function spawn(game: Game) {
  const kind = game.next;
  game.next = deal(game);
  game.piece = { kind, turn: 0, x: Math.floor((COLS - PIECES[kind].box) / 2), y: 0 };
  game.fall = 0; game.lock = 0; game.resets = 0;
  if (fits(game.board, kind, 0, game.piece.x, game.piece.y)) return true;
  game.over = true;
  return false;
}

export function createGame(seed: number, slow = false): Game {
  const game: Game = {
    rng: makeRng(seed), board: openingBoard(), bundle: [...OPENING], piece: null, next: "dui",
    rows: 0, score: 0, pieces: 0, fall: 0, lock: 0, resets: 0, clearing: [], clearLeft: 0, woven: [], slow, over: false,
  };
  game.next = deal(game);
  spawn(game);
  return game;
}

const active = (game: Game) => game.over || game.clearing.length ? null : game.piece;
const grounded = (game: Game, piece: Piece) => !fits(game.board, piece.kind, piece.turn, piece.x, piece.y + 1);
function settle(game: Game, piece: Piece) {
  if (grounded(game, piece) && game.resets < MAX_RESETS) { game.lock = 0; game.resets++; }
}

export function move(game: Game, dx: -1 | 1) {
  const piece = active(game);
  if (!piece || !fits(game.board, piece.kind, piece.turn, piece.x + dx, piece.y)) return false;
  piece.x += dx;
  settle(game, piece);
  return true;
}

/** A clockwise quarter turn, nudged off a wall or the stack when it would overlap. */
export function rotate(game: Game) {
  const piece = active(game);
  if (!piece) return false;
  const turn = (piece.turn + 1) % 4;
  for (const [kx, ky] of KICKS) {
    if (!fits(game.board, piece.kind, turn, piece.x + kx, piece.y + ky)) continue;
    piece.turn = turn; piece.x += kx; piece.y += ky;
    settle(game, piece);
    return true;
  }
  return false;
}

/** One woven row's colours: 2 bits per column, column 0 lowest. */
export function rowPattern(board: Uint8Array, y: number) {
  let pattern = 0;
  for (let x = 0; x < COLS; x++) pattern |= (colourOf(board[y * COLS + x]) - 1) << (x * 2);
  return pattern;
}

function lockPiece(game: Game): Event {
  const piece = game.piece!, cells = TURNS[piece.kind][piece.turn], colour = PIECES[piece.kind].colour;
  for (let i = 0; i < cells.length / 2; i++) {
    game.board[(piece.y + cells[i * 2 + 1]) * COLS + piece.x + cells[i * 2]] = colour | (across(piece.kind, piece.turn, i) ? ACROSS : 0);
  }
  game.piece = null;
  game.pieces++;
  for (let y = 0; y < ROWS; y++) {
    let full = true;
    for (let x = 0; x < COLS && full; x++) full = game.board[y * COLS + x] !== 0;
    if (full) game.clearing.push(y);
  }
  if (!game.clearing.length) return spawn(game) ? "lock" : "over";
  // The lowest row was woven first.
  for (let i = game.clearing.length - 1; i >= 0; i--) game.woven.push(rowPattern(game.board, game.clearing[i]));
  if (game.woven.length > MAT_ROWS) game.woven.splice(0, game.woven.length - MAT_ROWS);
  game.rows += game.clearing.length;
  game.score += ROW_POINTS[game.clearing.length];
  game.clearLeft = clearMs(game.slow);
  return "clear";
}

/** Woven rows roll away and everything above slides down. */
function collapse(game: Game) {
  const board = game.board;
  let write = ROWS - 1;
  for (let read = ROWS - 1; read >= 0; read--) {
    if (game.clearing.includes(read)) continue;
    if (write !== read) board.copyWithin(write * COLS, read * COLS, read * COLS + COLS);
    write--;
  }
  board.fill(0, 0, (write + 1) * COLS);
  game.clearing.length = 0;
}

/** Drops the strip straight down and locks it. */
export function hardDrop(game: Game): Event {
  const piece = active(game);
  if (!piece) return "none";
  while (!grounded(game, piece)) piece.y++;
  return lockPiece(game);
}

/** Advances the game by `ms`: the weave animation, then gravity (faster while `soft` is held), then the lock wait once the strip rests. */
export function tick(game: Game, ms: number, soft = false): Event {
  if (game.over) return "none";
  if (game.clearing.length) {
    game.clearLeft -= ms;
    if (game.clearLeft > 0) return "none";
    collapse(game);
    return spawn(game) ? "spawn" : "over";
  }
  const piece = game.piece;
  if (!piece) return "none";
  if (!grounded(game, piece)) {
    const every = soft ? Math.min(SOFT_MS, dropMs(game.rows, game.slow)) : dropMs(game.rows, game.slow);
    game.fall += ms;
    while (game.fall >= every && !grounded(game, piece)) { piece.y++; game.fall -= every; game.lock = 0; }
    if (grounded(game, piece)) game.fall = 0;
    return "none";
  }
  game.lock += ms;
  return game.lock >= lockMs(game.slow) ? lockPiece(game) : "none";
}

export const bands = [
  { min: 0, line: "প্রথম কয় সারিই সবচেয়ে কঠিন।" },
  { min: 5, line: "ছোট্ট একটা আসন হয়ে গেল!" },
  { min: 15, line: "এই পাটিতে দুজন আরাম করে বসবে।" },
  { min: 30, line: "গরমের দুপুরে পুরো পরিবারের পাটি!" },
] as const;
export const humanLine = (rows: number) => bands.findLast(band => rows >= band.min)!.line;

/** After a friend's challenge: kind either way. */
export function compareLine(score: number, target: number, name: string) {
  const who = name || "বন্ধু";
  if (score > target) return `${possessive(who)} চেয়ে ${bn(score - target)} বেশি!`;
  if (score === target) return `একদম সমান! ${who}ও ${bn(target)}।`;
  const gap = target - score;
  if (gap <= Math.max(20, Math.round(target * 0.15))) return `আর একটু হলেই! মাত্র ${bn(gap)} কম।`;
  return `${who} এখনো ${bn(gap)} এগিয়ে। আরেকবার?`;
}
