// Boards: squares 1..last snaking up from the bottom left, with ladders and snakes that each carry an everyday caption.
// The classic 10×10 layout below is fixed forever: old links replay on it. Server-safe.

export const SIZE = 10;
export const LAST = 100;

/** A ladder (up) or a snake (down) from square `from` to square `to`. */
export type Jump = { from: number; to: number; caption: string };

// Our own layout (not a boxed game's numbers). Order is fixed: card text and tests refer to these by position.
export const LADDERS: readonly Jump[] = [
  { from: 2, to: 23, caption: "নামতা মুখস্থ" },
  { from: 8, to: 30, caption: "স্কুল ছুটি" },
  { from: 17, to: 54, caption: "আম্মুর হাতের খিচুড়ি" },
  { from: 28, to: 47, caption: "টিফিনে সিঙ্গারা" },
  { from: 36, to: 57, caption: "খাতায় ভেরি গুড" },
  { from: 41, to: 62, caption: "ঘুড়ি আকাশে" },
  { from: 50, to: 69, caption: "কারেন্ট চলে এলো" },
  { from: 71, to: 92, caption: "বিকেলে মাঠে খেলা" },
  { from: 79, to: 100, caption: "নানাবাড়ি বেড়ানো" },
];

export const SNAKES: readonly Jump[] = [
  { from: 24, to: 6, caption: "জ্যামে আটকা" },
  { from: 33, to: 15, caption: "ঘুড়ি কেটে গেল" },
  { from: 43, to: 22, caption: "রাতে করলা ভাজি" },
  { from: 46, to: 26, caption: "হোমওয়ার্ক বাকি" },
  { from: 67, to: 48, caption: "বৃষ্টিতে ক্রিকেট বন্ধ" },
  { from: 77, to: 58, caption: "এমবি শেষ" },
  { from: 86, to: 66, caption: "রিমোট হাতছাড়া" },
  { from: 93, to: 53, caption: "লোডশেডিং" },
];

/** Every jump, ladders first: a jump's id is its index here. */
export const JUMPS: readonly Jump[] = [...LADDERS, ...SNAKES];
export const isLadder = (id: number) => id >= 0 && id < LADDERS.length;

/** The jump that starts on `square` of the classic board, or -1. */
export const jumpFrom = (square: number) => CLASSIC.at[square] ?? -1;

/** Column (0 left) and row (0 top) of a classic square 1–100: row by row from the bottom, left to right, then back. */
export const cellOf = (square: number) => cellAt(CLASSIC, square);

// ---- any board ----

/** A board: `cols` × `rows` squares, ladders first in `jumps`, and `at[square]` = the jump starting there (or -1). */
export type Board = {
  cols: number;
  rows: number;
  last: number;
  jumps: readonly Jump[];
  ladders: number;
  at: Int16Array;
};

export function makeBoard(cols: number, rows: number, ladders: readonly Jump[], snakes: readonly Jump[]): Board {
  const last = cols * rows, jumps = [...ladders, ...snakes], at = new Int16Array(last + 2).fill(-1);
  jumps.forEach((jump, id) => { at[jump.from] = id; });
  return { cols, rows, last, jumps, ladders: ladders.length, at };
}

export const CLASSIC: Board = makeBoard(SIZE, SIZE, LADDERS, SNAKES);

export const boardLadder = (board: Board, id: number) => id >= 0 && id < board.ladders;
export const boardJumpFrom = (board: Board, square: number) => square >= 1 && square <= board.last ? board.at[square] : -1;
/** How far a jump moves a piece, in squares. */
export const span = (board: Board, id: number) => Math.abs(board.jumps[id].to - board.jumps[id].from);

/** Column (0 left) and row (0 top) of square 1..last, snaking up from the bottom left. */
export function cellAt(board: Board, square: number) {
  const index = square - 1, line = Math.floor(index / board.cols), along = index % board.cols;
  return { col: line % 2 === 0 ? along : board.cols - 1 - along, row: board.rows - 1 - line };
}

/**
 * What is wrong with a board, or "" when it is sound: one jump per square, no jump from 1 or the last square,
 * no jump landing on another jump's start, ladders go up and snakes go down, captions are plain.
 */
export function boardProblem(board: Board) {
  const starts = new Set<number>(), ends = new Set<number>();
  for (const [id, jump] of board.jumps.entries()) {
    if (starts.has(jump.from)) return `two jumps on ${jump.from}`;
    starts.add(jump.from); ends.add(jump.to);
    if (jump.from <= 1 || jump.from >= board.last) return `jump ${id} starts on ${jump.from}`;
    if (jump.to < 1 || jump.to > board.last) return `jump ${id} ends off the board`;
    if (boardLadder(board, id) ? jump.to <= jump.from : jump.to >= jump.from) return `jump ${id} goes the wrong way`;
    if (jump.caption.length < 3 || /[!?।]/.test(jump.caption)) return `jump ${id} caption`;
  }
  for (const end of ends) if (starts.has(end)) return `a jump lands on another jump's start (${end})`;
  return "";
}
