// The ঠোঙা ladder: three worlds of four levels, each level adding exactly one new thing, each world ending in a named finale.
// Server-safe (link.ts reads LEVELS to check a shared level score), so the goals never change: old links still add up.
// Tests walk every level (walls connected, the start lane clear, crows and pipes fair) and bots clear each at its target rate.

export const COLS = 12;
export const ROWS = 16;
export const CELLS = COLS * ROWS;

export type Rect = readonly [x: number, y: number, width: number, height: number];
/** A crow walks back and forth between two cells in one row or column, one cell every `every` moves of the snake. */
export type Crow = readonly [x0: number, y0: number, x1: number, y1: number];
/** A rail gate: shut for `shut` moves out of every `period`, its lamp blinking `warn` moves before it shuts. */
export type Gate = { cells: Rect; period: number; shut: number; warn: number };

export type World = { name: string; palette: "paper" | "station" | "fair" };
export const WORLDS: readonly World[] = [
  { name: "ঠোঙার মাঠ", palette: "paper" },
  { name: "ইস্টিশন", palette: "station" },
  { name: "রাতের মেলা", palette: "fair" },
];
export const LEVELS_PER_WORLD = 4;

export type Level = {
  name: string;
  /** The one new thing, in one line, for the title and the level list. */
  teach: string;
  /** Bites to clear; ms: one move. Never lower a goal: old links are checked against it. */
  goal: number; ms: number;
  walls: readonly Rect[];
  /** Food lands within this many cells of the head (level 1, so the first clear comes in seconds). */
  near?: number;
  crows?: readonly Crow[]; crowEvery?: number;
  /** Two pipe mouths [ax, ay, bx, by]: in one, out the other. */
  pipes?: readonly [number, number, number, number];
  gate?: Gate;
  /** A green chilli (কাঁচা মরিচ) makes the snake run fast for HOT_MOVES moves. */
  hot?: boolean;
  /** Tamarind shortens the tail by SOUR_CUT cells. */
  sour?: boolean;
  /** লোডশেডিং: only the glow round the head is lit (drawing only; the rules don't change). */
  dark?: boolean;
  finale?: boolean;
};

// The snake starts at (5, 11) heading up, so column 5 stays clear from row 7 down: four free moves before the first turn.
export const LEVELS: readonly Level[] = [
  { name: "প্রথম কামড়", teach: "সোয়াইপ করে ঘোরো। খাবার কাছেই পড়বে।", goal: 5, ms: 230, walls: [], near: 3 },
  { name: "সোনালি মরিচ", teach: "দাগ ফুরোনোর আগে সোনালি মরিচ ধরো, তারা মিলবে।", goal: 9, ms: 222, walls: [] },
  { name: "টিনের বেড়া", teach: "মাঠে টিনের দেয়াল। ধাক্কা মানেই শেষ।", goal: 10, ms: 214, walls: [[2, 4, 3, 1], [7, 4, 3, 1]] },
  { name: "কাকের হানা", teach: "একটা কাক এদিক-ওদিক হাঁটে। ওর গায়ে লাগলেই শেষ।", goal: 10, ms: 208, walls: [[0, 8, 3, 1], [9, 8, 3, 1]], crows: [[10, 3, 1, 3]], crowEvery: 2, finale: true },

  { name: "সরু গলি", teach: "দেয়ালের মাঝে সরু পথ। ধীরে, মেপে ঘোরো।", goal: 12, ms: 200, walls: [[3, 3, 6, 1], [2, 11, 1, 3], [9, 11, 1, 3]] },
  { name: "সুড়ঙ্গ", teach: "এক পাইপে ঢুকলে অন্য পাইপ দিয়ে বের হবে।", goal: 12, ms: 194, walls: [[3, 5, 6, 1], [3, 9, 1, 4], [8, 9, 1, 4]], pipes: [1, 1, 10, 14] },
  { name: "কাঁচা মরিচের ঝাল", teach: "সবুজ মরিচ খেলে সাপ কিছুক্ষণ জোরে ছোটে।", goal: 13, ms: 188, walls: [[2, 2, 1, 5], [9, 2, 1, 5], [4, 15, 4, 1]], hot: true },
  { name: "রেলগেট", teach: "মাঝের গেট মাঝে মাঝে বন্ধ হয়। বাতি জ্বললে সরে যাও।", goal: 14, ms: 182, walls: [[0, 6, 3, 1], [9, 6, 3, 1]], gate: { cells: [3, 6, 6, 1], period: 24, shut: 8, warn: 4 }, finale: true },

  { name: "তেঁতুলের টক", teach: "তেঁতুল খেলে লেজ ২ ঘর ছোট হয়।", goal: 15, ms: 176, walls: [[1, 4, 4, 1], [7, 4, 4, 1], [1, 9, 3, 1], [8, 9, 3, 1]], sour: true },
  { name: "দুই কাক", teach: "এবার দুটো কাক। দুজনকেই চোখে রাখো।", goal: 16, ms: 172, walls: [[0, 6, 4, 1], [8, 6, 4, 1]], crows: [[1, 2, 10, 2], [10, 9, 10, 14]], crowEvery: 2 },
  { name: "লোডশেডিং", teach: "বাতি গেল! হারিকেনের আলোয় দেয়াল দেখো।", goal: 18, ms: 168, walls: [[2, 3, 3, 1], [7, 3, 3, 1], [0, 9, 3, 1], [9, 9, 3, 1], [5, 15, 2, 1]], dark: true },
  { name: "নাগরদোলার রাত", teach: "কাক, পাইপ আর ঝাল, সব একসাথে।", goal: 20, ms: 168, walls: [[3, 4, 2, 1], [7, 4, 2, 1], [0, 9, 3, 1], [9, 9, 3, 1]], crows: [[1, 2, 10, 2], [10, 13, 7, 13]], crowEvery: 2, pipes: [1, 14, 10, 6], hot: true, finale: true },
];
export const LEVEL_COUNT = LEVELS.length;

export const levelOf = (level: number) => LEVELS[Math.max(1, Math.min(LEVEL_COUNT, level)) - 1];
/** 0-based world of a level (classic plays in the first world's colours). */
export const worldOf = (level: number) => level ? Math.floor((Math.max(1, Math.min(LEVEL_COUNT, level)) - 1) / LEVELS_PER_WORLD) : 0;

/** Every cell of a list of rectangles (y * COLS + x). */
export function rectCells(rects: readonly Rect[]) {
  const cells: number[] = [];
  for (const [x, y, w, h] of rects) for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) cells.push((y + dy) * COLS + x + dx);
  return cells;
}
/** Every wall cell of a level (y * COLS + x). */
export const wallCells = (level: number) => rectCells(levelOf(level).walls);

/** A golden chilli turns up after every 4th bite; the last bite ends the level, so these are the chillies a level can offer. */
export const chilliesIn = (level: number, every = 4) => Math.floor((levelOf(level).goal - 1) / every);

/** 3 stars for every golden chilli, 2 for at least half of them, 1 for clearing. */
export function levelStars(level: number, golden: number) {
  const offered = chilliesIn(level);
  return golden >= offered ? 3 : golden >= Math.ceil(offered / 2) ? 2 : 1;
}

/** ধীরে খেলো never moves faster than one cell in 240ms. */
export const levelInterval = (level: number, slow: boolean) => slow ? Math.max(240, levelOf(level).ms + 90) : levelOf(level).ms;
