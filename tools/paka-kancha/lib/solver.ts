// Codes as whole numbers (0–9999, four digits, a leading 0 allowed) and a fast scorer, for the fairness proofs, the bots and
// the link check. Pure: no DOM, no randomness. `fastScore` matches rules.ts `score` exactly (পাকা first, then আধপাকা only while
// that digit is still unmatched in the code), packed into one number so millions of comparisons stay cheap.
import { LENGTH } from './rules';

/** How a row is shown: one mango beside each digit (`digit`), or only how many of each kind fell into the basket (`basket`). */
export type Feedback = 'digit' | 'basket';

const left = new Int8Array(10);
const marks = new Int8Array(LENGTH);
const digitAt = (code: number, index: number) => Math.floor(code / 10 ** (LENGTH - 1 - index)) % 10;

/** Per digit: base 3, পাকা 2 · আধপাকা 1 · কাঁচা 0, first digit most significant. Basket: পাকা × 5 + আধপাকা. */
export function fastScore(code: number, guess: number, feedback: Feedback) {
  left.fill(0);
  for (let index = 0; index < LENGTH; index++) {
    const c = digitAt(code, index), g = digitAt(guess, index);
    if (c === g) marks[index] = 2; else { marks[index] = 0; left[c]++; }
  }
  for (let index = 0; index < LENGTH; index++) {
    if (marks[index] === 2) continue;
    const g = digitAt(guess, index);
    if (left[g] > 0) { marks[index] = 1; left[g]--; }
  }
  if (feedback === 'basket') {
    let ripe = 0, half = 0;
    for (let index = 0; index < LENGTH; index++) { if (marks[index] === 2) ripe++; else if (marks[index] === 1) half++; }
    return ripe * 5 + half;
  }
  let packed = 0;
  for (let index = 0; index < LENGTH; index++) packed = packed * 3 + marks[index];
  return packed;
}
/** The packed score of a win. */
export const winScore = (feedback: Feedback) => feedback === 'basket' ? 20 : 80;

export const codeText = (code: number) => String(code).padStart(LENGTH, '0');
export const codeNumber = (text: string) => Number(text);

/** Every code a level can hide: four digits from `pool`, all different unless `repeat`. */
export function codesFrom(pool: string, repeat: boolean) {
  const digits = [...pool].map(Number), out: number[] = [];
  const grow = (sofar: number, depth: number, used: number) => {
    if (depth === LENGTH) { out.push(sofar); return; }
    for (const digit of digits) if (repeat || !(used & (1 << digit))) grow(sofar * 10 + digit, depth + 1, used | (1 << digit));
  };
  grow(0, 0, 0);
  return out;
}

/** Every code a level can hide. A pair-allowed level always hides at least one pair, and its players know it. */
export function codesFor(pool: string, repeat: boolean) {
  const all = codesFrom(pool, repeat);
  return repeat ? all.filter(code => new Set(codeText(code)).size < LENGTH) : all;
}

/** The codes still possible after a guess and its packed score. */
export const narrow = (codes: readonly number[], guess: number, scored: number, feedback: Feedback) => codes.filter(code => fastScore(code, guess, feedback) === scored);

/** The guess among `options` whose worst answer leaves the fewest codes (ties: one that could still be the code, then the first). */
export function minimaxGuess(candidates: readonly number[], options: readonly number[], feedback: Feedback) {
  const buckets = new Int32Array(feedback === 'basket' ? 25 : 81);
  const possible = new Set(candidates);
  let best = candidates[0], worst = Infinity, bestPossible = true;
  for (const option of options) {
    buckets.fill(0);
    let largest = 0;
    for (const code of candidates) { const k = fastScore(code, option, feedback); const n = ++buckets[k]; if (n > largest) largest = n; if (largest >= worst) break; }
    const isPossible = possible.has(option);
    if (largest < worst || (largest === worst && isPossible && !bestPossible)) { worst = largest; best = option; bestPossible = isPossible; }
  }
  return best;
}

/**
 * A careful player: every guess could still be the code (it never plays a probe), chosen to leave the fewest codes in the
 * worst case. Plays every code once and returns how many tries each took. `opener` fixes the first guess (all first guesses
 * of a level look alike to someone who knows nothing yet).
 */
export function carefulTries(codes: readonly number[], feedback: Feedback, opener = codes[0]) {
  const tries: number[] = [];
  const solve = (candidates: readonly number[], depth: number, forced?: number) => {
    const guess = forced ?? (candidates.length <= 2 ? candidates[0] : minimaxGuess(candidates, candidates, feedback));
    const split = new Map<number, number[]>();
    for (const code of candidates) {
      const k = fastScore(code, guess, feedback);
      let group = split.get(k);
      if (!group) split.set(k, group = []);
      group.push(code);
    }
    for (const [k, group] of split) {
      if (k === winScore(feedback)) tries.push(depth + 1);
      else solve(group, depth + 1);
    }
  };
  solve(codes, 0, opener);
  return tries;
}

/** A row as shown (p/a/k letters) as the packed score fastScore gives, or -1 when the letters aren't a row this feedback could show. */
export function packRow(row: readonly string[], feedback: Feedback) {
  if (row.length !== LENGTH) return -1;
  if (feedback === 'basket') {
    let ripe = 0, half = 0, seen = 0;
    for (const mark of row) {
      const rank = mark === 'p' ? 0 : mark === 'a' ? 1 : mark === 'k' ? 2 : 3;
      if (rank === 3 || rank < seen) return -1;
      seen = rank;
      if (rank === 0) ripe++; else if (rank === 1) half++;
    }
    return ripe * 5 + half;
  }
  let packed = 0;
  for (const mark of row) {
    if (mark !== 'p' && mark !== 'a' && mark !== 'k') return -1;
    packed = packed * 3 + (mark === 'p' ? 2 : mark === 'a' ? 1 : 0);
  }
  return packed;
}

/** Could some guess these rules accept have shown this row against this code? A shared link is re-checked with it, without its digits. */
export function possibleRow(code: string, row: readonly string[], pool: string, repeat: boolean, feedback: Feedback) {
  const wanted = packRow(row, feedback);
  if (wanted < 0) return false;
  const secret = codeNumber(code);
  return codesFrom(pool, repeat).some(guess => fastScore(secret, guess, feedback) === wanted);
}
