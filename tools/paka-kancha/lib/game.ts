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

/** The code for a seed: four different digits drawn from makeRng, so a link replays the same code on every phone. */
export function codeFromSeed(seed: number) {
  const rng = makeRng(seed), pool = [...'0123456789'];
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
export const finished = (rows: readonly Mark[][]) => !rows.slice(0, -1).some(isWin) && rows.length <= TRIES && (solved(rows) || rows.length === TRIES);
/** Guesses a saved game may hold: valid codes, at most 7, nothing after the win. */
export const validGuesses = (code: string, guesses: readonly string[]) => guesses.length <= TRIES && guesses.every(isCode) && !rowsOf(code, guesses).slice(0, -1).some(isWin);

let every: string[] | null = null;
/** All 5,040 codes with four different digits. */
export const allCodes = () => every ??= Array.from({ length: 10_000 }, (_, value) => String(value).padStart(LENGTH, '0')).filter(isCode);
/** Could some real guess have given this row for this code? Used to re-check a shared link without its digits. */
export const possibleRow = (code: string, row: readonly Mark[]) => allCodes().some(guess => score(code, guess).join('') === row.join(''));

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

/** The day's code, a seeded code ("আরেকবার" and its challenge link), or a code a friend typed in. */
export type Puzzle = { kind: 'day'; date: string } | { kind: 'seed'; seed: number } | { kind: 'code'; code: string };
export const codeOf = (puzzle: Puzzle) => puzzle.kind === 'code' ? puzzle.code : codeFromSeed(puzzle.kind === 'day' ? daySeed(puzzle.date) : puzzle.seed);
export const samePuzzle = (one: Puzzle, two: Puzzle) => JSON.stringify(one) === JSON.stringify(two);

/** One game: whose code, the tries so far, and the try being typed. */
export type Play = { puzzle: Puzzle; guesses: string[]; input: string };
export const isOver = (code: string, guesses: readonly string[]) => guesses.length >= TRIES || guesses.at(-1) === code;
/** Adds a digit to the try being typed; ignored if it's already there, the try is full or the game is over. */
export function typeDigit(code: string, play: Play, digit: string): Play {
  if (!/^\d$/.test(digit) || play.input.includes(digit) || play.input.length >= LENGTH || isOver(code, play.guesses)) return play;
  return { ...play, input: play.input + digit };
}
export const erase = (play: Play): Play => play.input ? { ...play, input: play.input.slice(0, -1) } : play;
/** Locks in a full try of four different digits. */
export function submit(code: string, play: Play): Play {
  if (!isCode(play.input) || isOver(code, play.guesses)) return play;
  return { ...play, guesses: [...play.guesses, play.input], input: '' };
}

/** The line under the result, by how many tries it took. */
export function humanLine(rows: readonly Mark[][]) {
  if (!solved(rows)) return 'এবার আমগুলো কাঁচাই রইল। কোডটা মনে রেখো, পরেরটায় দেখিয়ে দিয়ো।';
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
