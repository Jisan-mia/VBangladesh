// The board: squares 1 to 100 snaking up from the bottom left, our own ladders and snakes, each with an everyday caption. Server-safe.

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

const jumpAt: number[] = Array(LAST + 1).fill(-1);
JUMPS.forEach((jump, id) => { jumpAt[jump.from] = id; });
/** The jump that starts on `square`, or -1. */
export const jumpFrom = (square: number) => jumpAt[square] ?? -1;

/** Column (0 left) and row (0 top) of square 1–100: row by row from the bottom, left to right, then back. */
export function cellOf(square: number) {
  const index = square - 1, line = Math.floor(index / SIZE), along = index % SIZE;
  return { col: line % 2 === 0 ? along : SIZE - 1 - along, row: SIZE - 1 - line };
}
