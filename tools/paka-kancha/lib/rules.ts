// The rules of পাকা-কাঁচা: a hidden 4-digit code, a number of tries, and a mango for every guessed digit. Pure and server-safe.
// The level ladder lives in levels.ts; the ladder from before the rewrite (for old level links) in legacy.ts.
import { makeRng, pick } from '../../../shared/game-core';

export const LENGTH = 4;
export const TRIES = 7;
/** p = পাকা (right digit, right place) · a = আধপাকা (in the code, another place) · k = কাঁচা (not in the code). */
export type Mark = 'p' | 'a' | 'k';
export const markNames: Record<Mark, string> = { p: 'পাকা', a: 'আধপাকা', k: 'কাঁচা' };
export const markHint: Record<Mark, string> = { p: 'ঠিক ঘরে', a: 'আছে, অন্য ঘরে', k: 'নেই' };

const BN = '০১২৩৪৫৬৭৮৯';
export const bnDigits = (text: string) => text.replace(/[0-9]/g, digit => BN[Number(digit)]);
export const asciiDigits = (text: string) => text.replace(/[০-৯]/g, digit => String(BN.indexOf(digit)));
const numbers = new Intl.NumberFormat('bn-BD');
export const bn = (value: number) => numbers.format(value);

/**
 * A level's rules. `digits`: the keys on the pad (৪ means ১–৪, ১০ means ০–৯). `repeat`: a digit may sit in the code twice.
 * `feedback`: a mango beside each digit, or only a count of each kind in the basket (which digit earned it stays hidden).
 */
export type Rules = { digits: number; tries: number; repeat: boolean; feedback: 'digit' | 'basket' };
/** The daily code, a seeded code and a friend's code: all ten digits, seven tries, four different digits, a mango per digit. */
export const FULL: Rules = { digits: 10, tries: TRIES, repeat: false, feedback: 'digit' };

/** Four different digits as text. A leading ০ is fine: it's a lock code, not a number. */
export const isCode = (text: string) => /^\d{4}$/.test(text) && new Set(text).size === LENGTH;
/** The digits a code may use: all ten, or on the early levels only the first few keys of the pad (১ ২ ৩ …). */
export const poolOf = (digits = 10) => digits >= 10 ? '0123456789' : '123456789'.slice(0, Math.max(LENGTH, digits));
/** A code these rules could hide (and a guess they accept): four digits from the pad, different unless the level allows a pair. */
export const fits = (text: string, rules: Rules) => /^\d{4}$/.test(text) && [...text].every(digit => poolOf(rules.digits).includes(digit)) && (rules.repeat || new Set(text).size === LENGTH);

/** The code for a seed, from makeRng, so a link replays the same code on every phone. Different digits: the same draw as always. */
export function codeFromSeed(seed: number, digits = 10, repeat = false) {
  const rng = makeRng(seed), pool = [...poolOf(digits)];
  let code = '';
  if (repeat) {
    // A pair-allowed level: each digit drawn on its own. At least one pair, so the level's new idea really shows up.
    for (let round = 0; round < 50; round++) {
      code = '';
      for (let index = 0; index < LENGTH; index++) code += pool[pick(rng, pool.length)];
      if (new Set(code).size < LENGTH) return code;
    }
    return code;
  }
  for (let index = 0; index < LENGTH; index++) code += pool.splice(pick(rng, pool.length), 1)[0];
  return code;
}

/**
 * One mark per guessed digit. Duplicates are scored the careful way: পাকা first, then আধপাকা only while that digit is
 * still unmatched in the code. (solver.ts fastScore packs the same answer into a number.)
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
const order: Record<Mark, number> = { p: 0, a: 1, k: 2 };
/** The basket: the same mangoes, পাকা first, so a row no longer says which digit earned which. */
export const basketOf = (marks: readonly Mark[]): Mark[] => [...marks].sort((one, two) => order[one] - order[two]);
/** What a row shows under these rules. */
export const shown = (code: string, guess: string, rules: Rules) => rules.feedback === 'basket' ? basketOf(score(code, guess)) : score(code, guess);
export const count = (row: readonly Mark[], mark: Mark) => row.filter(item => item === mark).length;

export const isWin = (row: readonly Mark[]) => row.length === LENGTH && row.every(mark => mark === 'p');
export const rowsOf = (code: string, guesses: readonly string[], rules: Rules = FULL) => guesses.map(guess => shown(code, guess, rules));
export const solved = (rows: readonly Mark[][]) => rows.length > 0 && isWin(rows[rows.length - 1]);
/** Finished: solved on the last row, or out of tries. A win anywhere but the last row is not a real game. */
export const finished = (rows: readonly Mark[][], tries = TRIES) => !rows.slice(0, -1).some(isWin) && rows.length <= tries && (solved(rows) || rows.length === tries);
/** Guesses a saved game may hold: codes these rules accept, no more than its tries, nothing after the win. */
export const validGuesses = (code: string, guesses: readonly string[], rules: Rules = FULL) =>
  guesses.length <= rules.tries && guesses.every(guess => fits(guess, rules)) && !rowsOf(code, guesses, rules).slice(0, -1).some(isWin);

export const rowsText = (rows: readonly Mark[][]) => rows.map(row => row.join('')).join('');
export function parseRows(text: string): Mark[][] | null {
  if (!new RegExp(`^([pak]{${LENGTH}}){1,${TRIES}}$`).test(text)) return null;
  return text.match(new RegExp(`.{${LENGTH}}`, 'g'))!.map(chunk => [...chunk] as Mark[]);
}

/** The best mark each digit has earned so far, for the pad. In basket rows only a row with no mango at all says something. */
export function keyHints(code: string, guesses: readonly string[], rules: Rules = FULL) {
  const rank: Record<Mark, number> = { k: 0, a: 1, p: 2 };
  const hints: Partial<Record<string, Mark>> = {};
  for (const guess of guesses) {
    const marks = score(code, guess);
    if (rules.feedback === 'basket') {
      if (marks.every(mark => mark === 'k')) for (const digit of guess) hints[digit] = 'k';
      continue;
    }
    marks.forEach((mark, index) => {
      const digit = guess[index], old = hints[digit];
      if (!old || rank[mark] > rank[old]) hints[digit] = mark;
    });
  }
  return hints;
}

/**
 * Why a full row can't be the code, from the rows so far, in one short line (or '' when it could be). It never blocks:
 * a probe can be clever. It only teaches what the mangoes already said.
 */
export function clash(guess: string, guesses: readonly string[], rows: readonly Mark[][], rules: Rules) {
  if (rules.repeat && new Set(guess).size === LENGTH && guesses.length) return 'এখানে কোডে একটা জোড়া থাকে। এটা দেখার চাল হতে পারে, কোড না।';
  for (let index = 0; index < guesses.length; index++) {
    const before = guesses[index], row = rows[index];
    if (rules.feedback === 'digit') {
      for (let slot = 0; slot < LENGTH; slot++) {
        const digit = before[slot];
        if (row[slot] === 'p' && guess[slot] !== digit) return `${bn(slot + 1)} নম্বর ঘরে ${bnDigits(digit)} পাকা ছিল।`;
        if (row[slot] === 'a' && guess[slot] === digit) return `${bnDigits(digit)} এই ঘরে আধপাকা ছিল, মানে অন্য ঘরে বসবে।`;
        if (row[slot] === 'k' && !rules.repeat && guess.includes(digit)) return `${bnDigits(digit)} তো কাঁচা ছিল, কোডে নেই।`;
      }
    }
    const wanted = rules.feedback === 'basket' ? basketOf(score(guess, before)).join('') : score(guess, before).join('');
    if (wanted !== row.join('')) return `এটা কোড হলে ${bn(index + 1)} নম্বর চেষ্টায় অন্য আম পড়ত।`;
  }
  return '';
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

/**
 * The day's code, a seeded code ("আরেকবার" and its link), a code a friend typed in, or a level's seeded code.
 * `legacy`: a level link from before the rewrite, played with the old ladder's rules (lib/legacy.ts).
 */
export type Puzzle = { kind: 'day'; date: string } | { kind: 'seed'; seed: number } | { kind: 'code'; code: string } | { kind: 'level'; level: number; seed: number; legacy?: boolean };
export const samePuzzle = (one: Puzzle, two: Puzzle) => JSON.stringify(one) === JSON.stringify(two);

/** One game: whose code, the tries so far, and the try being typed. */
export type Play = { guesses: string[]; input: string };
export const isOver = (code: string, guesses: readonly string[], tries = TRIES) => guesses.length >= tries || guesses.at(-1) === code;
/** Why a digit can't go in, or '' when it can. */
export function refusal(code: string, play: Play, digit: string, rules: Rules) {
  if (isOver(code, play.guesses, rules.tries)) return 'over';
  if (!/^\d$/.test(digit) || !poolOf(rules.digits).includes(digit)) return 'pad';
  if (play.input.length >= LENGTH) return 'full';
  if (!rules.repeat && play.input.includes(digit)) return 'twice';
  return '';
}
/** Adds a digit to the try being typed; ignored if it's refused. */
export const typeDigit = (code: string, play: Play, digit: string, rules: Rules): Play => refusal(code, play, digit, rules) ? play : { ...play, input: play.input + digit };
export const erase = (play: Play): Play => play.input ? { ...play, input: play.input.slice(0, -1) } : play;
/** Locks in a full try the rules accept. */
export function submit(code: string, play: Play, rules: Rules): Play {
  if (!fits(play.input, rules) || isOver(code, play.guesses, rules.tries)) return play;
  return { guesses: [...play.guesses, play.input], input: '' };
}
