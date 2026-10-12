// The rules of পাকা-কাঁচা: a hidden 4-digit code, all four digits different, 7 tries, one mango per digit. Pure and server-safe.
import { makeRng, pick } from '../../../shared/game-core';

export const LENGTH = 4;
export const TRIES = 7;
/** p = পাকা (right digit, right place) · a = আধপাকা (in the code, another place) · k = কাঁচা (not in the code). */
export type Mark = 'p' | 'a' | 'k';
export const markNames: Record<Mark, string> = { p: 'পাকা', a: 'আধপাকা', k: 'কাঁচা' };
export const RULE = 'চারটা অঙ্কই আলাদা, কোনোটা দুবার নেই।';

const BN = '০১২৩৪৫৬৭৮৯';
export const bnDigits = (text: string) => text.replace(/[0-9]/g, digit => BN[Number(digit)]);
export const asciiDigits = (text: string) => text.replace(/[০-৯]/g, digit => String(BN.indexOf(digit)));
const numbers = new Intl.NumberFormat('bn-BD');
export const bn = (value: number) => numbers.format(value);

/** Four different digits as text. A leading ০ is fine: it's a lock code, not a number. */
export const isCode = (text: string) => /^\d{4}$/.test(text) && new Set(text).size === LENGTH;

/** The digits a code may use: all ten, or on the early levels only the first few keys of the pad (১ ২ ৩ …). */
export const poolOf = (digits = 10) => digits >= 10 ? '0123456789' : '123456789'.slice(0, Math.max(LENGTH, digits));

/** The code for a seed: four different digits drawn from makeRng, so a link replays the same code on every phone. */
export function codeFromSeed(seed: number, digits = 10) {
  const rng = makeRng(seed), pool = [...poolOf(digits)];
  let code = '';
  for (let index = 0; index < LENGTH; index++) code += pool.splice(pick(rng, pool.length), 1)[0];
  return code;
}

/**
 * One mark per guessed digit. Duplicates are scored the careful way even though codes and guesses never repeat a digit:
 * পাকা first, then আধপাকা only while that digit is still unmatched in the code.
 */
export function score(code: string, guess: string): Mark[] {
  const marks: Mark[] = [...guess].map((digit, index) => digit === code[index] ? 'p' : 'k');
  const left = new Map<string, number>();
  [...code].forEach((digit, index) => { if (marks[index] !== 'p') left.set(digit, (left.get(digit) ?? 0) + 1); });
  [...guess].forEach((digit, index) => {
    const count = left.get(digit) ?? 0;
    if (marks[index] === 'k' && count) { marks[index] = 'a'; left.set(digit, count - 1); }
  });
  return marks;
}

export const isWin = (row: readonly Mark[]) => row.length === LENGTH && row.every(mark => mark === 'p');
export const rowsOf = (code: string, guesses: readonly string[]) => guesses.map(guess => score(code, guess));
export const solved = (rows: readonly Mark[][]) => rows.length > 0 && isWin(rows[rows.length - 1]);
/** Finished: solved on the last row, or out of tries. A win anywhere but the last row is not a real game. */
export const finished = (rows: readonly Mark[][], tries = TRIES) => !rows.slice(0, -1).some(isWin) && rows.length <= tries && (solved(rows) || rows.length === tries);
/** Guesses a saved game may hold: valid codes, at most 7, nothing after the win. */
export const validGuesses = (code: string, guesses: readonly string[]) => guesses.length <= TRIES && guesses.every(isCode) && !rowsOf(code, guesses).slice(0, -1).some(isWin);

let every: string[] | null = null;
/** All 5,040 codes with four different digits. */
export const allCodes = () => every ??= Array.from({ length: 10_000 }, (_, value) => String(value).padStart(LENGTH, '0')).filter(isCode);
/** Could some real guess (from the level's digits) have given this row for this code? Used to re-check a shared link without its digits. */
export const possibleRow = (code: string, row: readonly Mark[], pool = '0123456789') => allCodes().some(guess => [...guess].every(digit => pool.includes(digit)) && score(code, guess).join('') === row.join(''));

export const rowsText = (rows: readonly Mark[][]) => rows.map(row => row.join('')).join('');
export function parseRows(text: string): Mark[][] | null {
  if (!new RegExp(`^([pak]{${LENGTH}}){1,${TRIES}}$`).test(text)) return null;
  return text.match(new RegExp(`.{${LENGTH}}`, 'g'))!.map(chunk => [...chunk] as Mark[]);
}

/** The best mark each digit has earned so far, for the number pad. */
export function keyHints(code: string, guesses: readonly string[]) {
  const rank: Record<Mark, number> = { k: 0, a: 1, p: 2 };
  const hints: Partial<Record<string, Mark>> = {};
  for (const guess of guesses) score(code, guess).forEach((mark, index) => {
    const digit = guess[index], old = hints[digit];
    if (!old || rank[mark] > rank[old]) hints[digit] = mark;
  });
  return hints;
}

// Dates: the daily code changes at midnight Dhaka time for everyone, wherever their phone is set.
export const dhakaDate = (now = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
export function isDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const time = Date.parse(`${date}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === date && date >= '2026-01-01' && date <= '2099-12-31';
}
/** A future day's code isn't out yet, so a date from a link or a wrong clock becomes today. */
export const clampDate = (date: string, today: string) => date > today ? today : date;
export const daySeed = (date: string) => Number(date.replaceAll('-', ''));
export const bnDate = (date: string) => new Intl.DateTimeFormat('bn-BD', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));

/** The day's code, a seeded code ("আরেকবার" and its challenge link), a code a friend typed in, or a level's seeded code. */
export type Puzzle = { kind: 'day'; date: string } | { kind: 'seed'; seed: number } | { kind: 'code'; code: string } | { kind: 'level'; level: number; seed: number };
/** A level's pad size and tries; every other puzzle uses all ten digits and seven tries. */
export type Rules = { digits: number; tries: number };
export const FULL: Rules = { digits: 10, tries: TRIES };

/**
 * The levels: a few keys on the pad at first, then one more key or one try fewer per level.
 * `three`/`two`: the most tries for 3 and 2 stars (any solve is 1). A test proves a careful player solves every code within `tries`.
 * Two worlds: উঠান (৫–৭টা অঙ্ক) and আমবাগান (৮–১০টা অঙ্ক).
 */
export const LEVELS: ReadonlyArray<Rules & { three: number; two: number }> = [
  { digits: 5, tries: 7, three: 3, two: 4 }, { digits: 5, tries: 6, three: 3, two: 4 }, { digits: 5, tries: 5, three: 3, two: 4 },
  { digits: 6, tries: 7, three: 3, two: 4 }, { digits: 6, tries: 6, three: 3, two: 4 }, { digits: 6, tries: 5, three: 3, two: 4 },
  { digits: 7, tries: 7, three: 3, two: 5 }, { digits: 7, tries: 6, three: 3, two: 5 }, { digits: 7, tries: 5, three: 3, two: 4 },
  { digits: 8, tries: 7, three: 4, two: 5 }, { digits: 8, tries: 6, three: 4, two: 5 }, { digits: 8, tries: 5, three: 3, two: 4 },
  { digits: 9, tries: 7, three: 4, two: 5 }, { digits: 9, tries: 6, three: 4, two: 5 }, { digits: 9, tries: 6, three: 3, two: 5 },
  { digits: 10, tries: 7, three: 5, two: 6 }, { digits: 10, tries: 7, three: 4, two: 6 }, { digits: 10, tries: 7, three: 4, two: 5 },
];
export const LEVEL_COUNT = LEVELS.length;
export const WORLD_SIZE = 9;
export const isLevel = (level: number) => Number.isInteger(level) && level >= 1 && level <= LEVEL_COUNT;
export const rulesOf = (puzzle: Puzzle): Rules => puzzle.kind === 'level' && isLevel(puzzle.level) ? LEVELS[puzzle.level - 1] : FULL;
/** Stars for a finished level game: 0 when the code wasn't found. */
export function starsOf(level: number, rows: readonly Mark[][]) {
  if (!isLevel(level) || !solved(rows)) return 0;
  const { three, two } = LEVELS[level - 1];
  return rows.length <= three ? 3 : rows.length <= two ? 2 : 1;
}
/** Where to open: the furthest open level unless it already has three stars, then the first one short of three. */
export function startLevel(stars: Readonly<Record<number, number>>, unlocked: number) {
  if ((stars[unlocked] ?? 0) < 3) return unlocked;
  for (let level = 1; level <= LEVEL_COUNT; level++) if ((stars[level] ?? 0) < 3) return level;
  return unlocked;
}
/**
 * Once, before levels existed on this phone: someone who already solved a full code (an old best) doesn't redo the small-pad world.
 * Returns the new level store (উঠান cleared with one star each), or null when there's nothing to move.
 */
export function migrateLevels(levelsRaw: string | null, bestRaw: string | null) {
  if (levelsRaw !== null || bestRaw === null) return null;
  const best = Number(bestRaw);
  if (!Number.isInteger(best) || best < 1 || best > TRIES) return null;
  return JSON.stringify(Object.fromEntries(Array.from({ length: WORLD_SIZE }, (_, index) => [index + 1, 1])));
}
/** How many tries fewer would have earned the next star (0 at three stars or for a miss). */
export function triesToNextStar(level: number, rows: readonly Mark[][]) {
  const stars = starsOf(level, rows);
  if (!stars || stars === 3) return 0;
  const { three, two } = LEVELS[level - 1];
  return rows.length - (stars === 2 ? three : two);
}
export function codeOf(puzzle: Puzzle) {
  if (puzzle.kind === 'code') return puzzle.code;
  if (puzzle.kind === 'level') return codeFromSeed(puzzle.seed, rulesOf(puzzle).digits);
  return codeFromSeed(puzzle.kind === 'day' ? daySeed(puzzle.date) : puzzle.seed);
}
export const samePuzzle = (one: Puzzle, two: Puzzle) => JSON.stringify(one) === JSON.stringify(two);

/** One game: whose code, the tries so far, and the try being typed. */
export type Play = { puzzle: Puzzle; guesses: string[]; input: string };
export const isOver = (code: string, guesses: readonly string[], tries = TRIES) => guesses.length >= tries || guesses.at(-1) === code;
/** Adds a digit to the try being typed; ignored if it's already there, not on this level's pad, the try is full or the game is over. */
export function typeDigit(code: string, play: Play, digit: string): Play {
  const { digits, tries } = rulesOf(play.puzzle);
  if (!/^\d$/.test(digit) || !poolOf(digits).includes(digit) || play.input.includes(digit) || play.input.length >= LENGTH || isOver(code, play.guesses, tries)) return play;
  return { ...play, input: play.input + digit };
}
export const erase = (play: Play): Play => play.input ? { ...play, input: play.input.slice(0, -1) } : play;
/** Locks in a full try of four different digits. */
export function submit(code: string, play: Play): Play {
  if (!isCode(play.input) || isOver(code, play.guesses, rulesOf(play.puzzle).tries)) return play;
  return { ...play, guesses: [...play.guesses, play.input], input: '' };
}

/** The line under the result, by how many tries it took (the last try of a short level still counts as the last). */
export function humanLine(rows: readonly Mark[][], tries = TRIES) {
  if (!solved(rows)) return 'এবার আমগুলো কাঁচাই রইল। কোডটা মনে রেখো, পরেরটায় দেখিয়ে দিয়ো।';
  if (rows.length === tries && tries < TRIES) return 'একদম শেষ বারে! শেষ মুহূর্তে আম পাকল।';
  return [
    'প্রথম বারেই! এটা আন্দাজ, না জাদু?',
    'দ্বিতীয় বারেই! আজ কপাল খুলে গেছে।',
    'মাথা একদম ঠান্ডা, হাতও পাকা।',
    'একদম ঝরঝরে খেলা, ধাপে ধাপে পাকিয়েছ।',
    'ধীরে ধীরে, ঠিক ঠিক। আম পেকেছে!',
    'একটু ঘুরিয়েছে, তবু হাল ছাড়োনি।',
    'একদম শেষ বারে! শেষ মুহূর্তে আম পাকল।',
  ][rows.length - 1];
}
