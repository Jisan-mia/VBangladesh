// What this phone keeps between visits, as pure string ⇄ value functions (the component does the localStorage calls):
// half-done grids, the days you solved a daily, and the levels your own play has opened.
import { unlockedLevel, type LevelStars } from "../../../shared/game-core";
import { startGame, validDay, LEVEL_COUNT, type Game, type Puzzle } from "./game";

export const WIP_KEY = "ektukhani-sudoku-wip", DAYS_KEY = "ektukhani-sudoku-days", OPEN_KEY = "ektukhani-sudoku-open", DAILY_KEY = "ektukhani-sudoku-daily";
/** How many half-done grids are kept; the oldest goes first. */
export const WIP_LIMIT = 8;
const MAX_SECONDS = 99 * 60 + 59;

/** "l12", "d20261104" (the classic daily) or "d20261104e". */
export const puzzleKey = (puzzle: Puzzle) => "level" in puzzle ? `l${puzzle.level}` : `d${puzzle.day}${puzzle.kind === "h" ? "" : puzzle.kind}`;

/** One saved grid: digits as a string, pencil marks in base 36, hints and mistakes, and the clock's seconds. */
export type Wip = { v: string; m: string; h: number[]; x: number; s: number };
type Saved = Record<string, Wip>;

export const toWip = (game: Game, seconds: number): Wip => ({
  v: game.values.join(""),
  m: game.notes.map(mask => mask.toString(36)).join("."),
  h: game.hinted.slice(),
  x: game.mistakes,
  s: Math.min(MAX_SECONDS, Math.max(0, Math.floor(seconds))),
});

/** Your own digits are on the grid (a saved grid worth offering back). */
export const hasWork = (game: Game) => game.values.some((value, cell) => value !== game.puzzle.puzzle[cell]) || game.notes.some(Boolean);

/** A saved grid back on its puzzle, or null when it doesn't fit (another size, changed givens, junk). */
export function fromWip(wip: unknown, puzzle: Puzzle): { game: Game; seconds: number } | null {
  if (!wip || typeof wip !== "object") return null;
  const { v, m, h, x, s } = wip as Partial<Wip>;
  const { n } = puzzle.shape, cells = n * n, full = ((1 << n) - 1) << 1;
  if (typeof v !== "string" || v.length !== cells || !new RegExp(`^[0-${n}]+$`).test(v)) return null;
  if (typeof m !== "string" || !Array.isArray(h) || !Number.isInteger(x) || !Number.isInteger(s) || (x as number) < 0 || (x as number) > 9999 || (s as number) < 0 || (s as number) > MAX_SECONDS) return null;
  const values = [...v].map(Number);
  if (puzzle.puzzle.some((given, cell) => given && values[cell] !== given)) return null;
  const parts = m.split(".");
  if (parts.length !== cells || parts.some(part => !/^[0-9a-z]{1,4}$/.test(part))) return null;
  const notes = parts.map(part => parseInt(part, 36));
  if (notes.some((mask, cell) => (mask & ~full) !== 0 || (mask && values[cell]))) return null;
  const hinted = [...new Set(h)];
  if (hinted.some(cell => !Number.isInteger(cell) || cell < 0 || cell >= cells || puzzle.puzzle[cell] || values[cell] !== puzzle.solution[cell])) return null;
  return { game: { ...startGame(puzzle), values, notes, hints: hinted.length, hinted, mistakes: x as number }, seconds: s as number };
}

const parse = (raw: string | null): Saved => {
  try { const read = JSON.parse(raw ?? "{}"); return read && typeof read === "object" && !Array.isArray(read) ? read : {}; } catch { return {}; }
};
export const readWip = (raw: string | null, key: string) => parse(raw)[key] ?? null;

/** The store with this grid saved (moved to the newest place), keeping the newest WIP_LIMIT. */
export function putWip(raw: string | null, key: string, wip: Wip) {
  const saved = parse(raw);
  delete saved[key];
  saved[key] = wip;
  const keys = Object.keys(saved);
  for (const old of keys.slice(0, Math.max(0, keys.length - WIP_LIMIT))) delete saved[old];
  return JSON.stringify(saved);
}
export function dropWip(raw: string | null, key: string) {
  const saved = parse(raw);
  delete saved[key];
  return JSON.stringify(saved);
}

// ---- the days you solved a daily ----

export function readDays(raw: string | null): number[] {
  try {
    const list = JSON.parse(raw ?? "[]");
    return Array.isArray(list) ? [...new Set(list.filter(day => validDay(day)))].sort((a, b) => a - b).slice(-400) : [];
  } catch { return []; }
}
export const addDay = (days: number[], day: number) => validDay(day) ? readDays(JSON.stringify([...days, day])) : days;

const toDate = (day: number) => Date.UTC(Math.floor(day / 10000), Math.floor(day / 100) % 100 - 1, day % 100);
const fromDate = (ms: number) => { const date = new Date(ms); return date.getUTCFullYear() * 10000 + (date.getUTCMonth() + 1) * 100 + date.getUTCDate(); };
/** The day `offset` days from `day` (both 20261104-style). */
export const shiftDay = (day: number, offset: number) => fromDate(toDate(day) + offset * 86_400_000);

/** The last seven days ending today, oldest first, each with whether you solved a daily that day. */
export const week = (days: number[], today: number) =>
  Array.from({ length: 7 }, (_, index) => { const day = shiftDay(today, index - 6); return { day, done: days.includes(day) }; });

/** Days in a row with a daily solved, ending today (or yesterday, while today is still open). */
export function streak(days: number[], today: number) {
  let day = days.includes(today) ? today : shiftDay(today, -1), count = 0;
  while (days.includes(day)) { count++; day = shiftDay(day, -1); }
  return count;
}

// ---- the levels your own play opened ----

/**
 * The highest level you may pick. The first time, it's what the old rule gave (unlockedLevel: one past the highest level
 * with stars), so nobody loses an open level. After that only your own play opens levels: clearing level L opens L + 1
 * when L was already open, and a friend's far-ahead level records its stars without opening the ones in between.
 */
export function readOpen(raw: string | null, stars: LevelStars) {
  const saved = Number(raw);
  return raw !== null && Number.isInteger(saved) && saved >= 1 && saved <= LEVEL_COUNT ? saved : unlockedLevel(stars, LEVEL_COUNT);
}
export const openAfter = (open: number, cleared: number) => cleared <= open ? Math.min(LEVEL_COUNT, Math.max(open, cleared + 1)) : open;

/** Which daily difficulty to show first: the last one picked, else সহজ. */
export const readDaily = (raw: string | null) => raw === "e" || raw === "m" || raw === "h" ? raw : "e";
