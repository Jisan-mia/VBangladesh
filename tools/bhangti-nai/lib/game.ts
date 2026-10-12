// Rules for ভাংতি নাই!: ten seeded customers, exact change from chits, scoring and lines. Pure and server-safe.
import { makeRng, pick } from '../../../shared/game-core';

/** The chits in the cash box. Made-up play money: plain colours and numerals, never real note designs. */
export const CHITS = [1, 2, 5, 10, 20, 50, 100] as const;
export type Chit = (typeof CHITS)[number];
const NOTES = [50, 100, 200, 500] as const;

export const CUSTOMERS = 10;
export const RIGHT_POINTS = 100;
export const FAST_POINTS = 50;
export const MAX_SCORE = CUSTOMERS * (RIGHT_POINTS + FAST_POINTS);
export const BASE_SECONDS = 10;
/** A customer with a twist (extra coins, or a chit that has run out) gets a little longer. */
export const TWIST_SECONDS = 2;
export const MAX_TRAY = 12;

/** Student, grandmother, rickshaw-puller, office worker, little girl, the uncle next door. */
export const PEOPLE = ['স্কুলের ছাত্র', 'নানু', 'রিকশাওয়ালা মামা', 'অফিসের আপা', 'ছোট্ট মেয়ে', 'পাশের বাসার চাচা'] as const;

/** plain: one note · two: two notes · round: a note plus coins so the change comes out round · out: one chit has run out. */
export type Kind = 'plain' | 'two' | 'round' | 'out';
export type Customer = { who: number; kind: Kind; notes: number[]; price: number; out: Chit | 0 };

const digits = new Intl.NumberFormat('bn-BD', { useGrouping: false });
export const bn = (value: number) => digits.format(value);

const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);
export const paidOf = (customer: Customer) => sum(customer.notes);
export const changeOf = (customer: Customer) => paidOf(customer) - customer.price;
export const trayTotal = sum;

/** The fewest chits that make `amount` without the chit that ran out, largest first; null if it can't be made. */
export function fewest(amount: number, out: Chit | 0 = 0): Chit[] | null {
  if (!Number.isInteger(amount) || amount < 0) return null;
  const usable = CHITS.filter(chit => chit !== out);
  const count = new Array<number>(amount + 1).fill(Infinity), last = new Array<number>(amount + 1).fill(0);
  count[0] = 0;
  for (let value = 1; value <= amount; value++) {
    for (const chit of usable) if (chit <= value && count[value - chit] + 1 < count[value]) { count[value] = count[value - chit] + 1; last[value] = chit; }
  }
  if (count[amount] === Infinity) return null;
  const chits: Chit[] = [];
  for (let value = amount; value > 0; value -= last[value]) chits.push(last[value] as Chit);
  return chits.sort((a, b) => b - a);
}

// [kind, lowest price, highest price, step]: round sums first, then odd prices, bigger notes and the two twists.
const PLAN: ReadonlyArray<readonly [Kind, number, number, number]> = [
  ['plain', 10, 45, 5],
  ['plain', 15, 90, 5],
  ['plain', 12, 97, 1],
  ['plain', 55, 190, 1],
  ['round', 23, 189, 1],
  ['two', 104, 146, 1],
  ['out', 21, 96, 1],
  ['plain', 120, 470, 1],
  ['round', 210, 480, 1],
  ['out', 110, 190, 1],
];
const MAX_CHANGE = 300;
const MAX_PIECES = 6;
const OUTS = [1, 5, 10] as const;

/** Can this customer be served fairly: positive change, makeable from the box, few enough chits for the time? */
export function fair(customer: Customer) {
  const change = changeOf(customer);
  if (change < 1 || change > MAX_CHANGE || customer.price < 1) return false;
  const pieces = fewest(change, customer.out);
  if (!pieces || pieces.length > MAX_PIECES + (customer.out ? 1 : 0)) return false;
  // A run-out chit must matter: the usual quickest change would have used it.
  return !customer.out || fewest(change)!.includes(customer.out);
}

function customerAt(rng: () => number, row: number, first: boolean, who: number): Customer {
  const [kind, low, high, step] = PLAN[row];
  for (let attempt = 0; attempt < 60; attempt++) {
    const price = low + pick(rng, Math.floor((high - low) / step) + 1) * step;
    const smallest = NOTES.find(note => note > price) ?? 500;
    let notes: number[];
    let out: Chit | 0 = 0;
    if (kind === 'two') notes = [100, 50];
    else if (kind === 'round') {
      // The customer adds coins so the change is round, the way people do at a real counter: 87 টাকা, "১০০ আর ৭ নাও".
      if (price % 10 === 0) continue;
      notes = [smallest, ...fewest(price % 10)!];
    } else {
      const bigger = NOTES[NOTES.indexOf(smallest as (typeof NOTES)[number]) + 1];
      // The first customer always hands the smallest note, so the opening sum is gentle.
      notes = [!first && bigger && rng() < 0.4 ? bigger : smallest];
      if (kind === 'out') out = OUTS[pick(rng, OUTS.length)];
    }
    const customer: Customer = { who, kind, notes, price, out };
    if (fair(customer)) return customer;
  }
  // Practically never reached; a known-fair customer keeps the run whole.
  return { who, kind: 'plain', notes: [100], price: 63, out: 0 };
}

/** Shop days are the levels: each one a little trickier and a little quicker than the day before. */
export const DAYS = 20;

/**
 * Which PLAN row each of a day's ten customers comes from. Day 1 stays on round sums and single notes;
 * by day 20 the queue starts at coins-for-round-change and ends on run-out chits. Day 0 is the classic queue, one row each.
 */
export function dayRows(day: number): number[] {
  if (!day) return PLAN.map((_, row) => row);
  const t = (day - 1) / (DAYS - 1);
  return Array.from({ length: CUSTOMERS }, (_, index) => Math.min(PLAN.length - 1, Math.floor(index * (0.35 + 0.65 * t) + 3 * t)));
}

/** The clock per customer on a day: 30% longer on day 1, a fifth shorter by day 20 (day 0 is the classic clock). */
export const dayPace = (day: number) => day ? 1.3 - 0.5 * (day - 1) / (DAYS - 1) : 1;

/** The same seed (and day) gives the same ten customers on every phone. */
export function makeCustomers(seed: number, day = 0): Customer[] {
  const rng = makeRng(seed), rows = dayRows(day);
  const customers: Customer[] = [];
  let previous = -1;
  for (let index = 0; index < CUSTOMERS; index++) {
    let who = pick(rng, PEOPLE.length);
    if (who === previous) who = (who + 1 + pick(rng, PEOPLE.length - 1)) % PEOPLE.length;
    previous = who;
    customers.push(customerAt(rng, rows[index], index === 0, who));
  }
  return customers;
}

/** The example already solved on the first screen. */
export const EXAMPLE: Customer = { who: 1, kind: 'plain', notes: [50], price: 35, out: 0 };
export const EXAMPLE_TRAY: Chit[] = [10, 5];

/** What the customer says, as text and amounts: [["২০০", " টাকা দিলাম,"], ["জিনিস ", "৮৭", " টাকার"]]. Amounts stay numbers so the page can make them big. */
export function saying(customer: Customer): Array<Array<string | number>> {
  const [first, ...rest] = customer.notes;
  const given = customer.kind === 'plain' || customer.kind === 'out' ? [first, ' টাকা দিলাম,'] : [first, ' আর ', sum(rest), ' টাকা দিলাম,'];
  return [given, ['জিনিস ', customer.price, ' টাকার']];
}

export const secondsFor = (customer: Customer, slow: boolean, day = 0) =>
  Math.round((BASE_SECONDS + (customer.kind === 'round' || customer.kind === 'out' ? TWIST_SECONDS : 0)) * (slow ? 1.5 : 1) * dayPace(day) * 10) / 10;

/** Up to 50 for a right answer on the first try, by the share of time left, in steps of 5. */
export const fastBonus = (left: number) => 5 * Math.round((Math.max(0, Math.min(1, left)) * FAST_POINTS) / 5);

export type Outcome = 'ok' | 'miss';
/** `clean` counts customers served right on the first try: the day's stars come from it. */
export type Run = { customers: Customer[]; day: number; index: number; tray: Chit[]; tries: number; score: number; results: Outcome[]; clean: number };

export const startRun = (seed: number, day = 0): Run => ({ customers: makeCustomers(seed, day), day, index: 0, tray: [], tries: 0, score: 0, results: [], clean: 0 });
export const isOver = (run: Run) => run.results.length >= CUSTOMERS;
export const current = (run: Run): Customer | undefined => run.customers[run.index];
export const rightCount = (results: readonly Outcome[]) => results.filter(result => result === 'ok').length;

/** Puts a chit on the counter. A chit that ran out, a full counter or a finished run changes nothing. */
export function tap(run: Run, chit: Chit): Run {
  const customer = current(run);
  if (!customer || isOver(run) || chit === customer.out || !CHITS.includes(chit) || run.tray.length >= MAX_TRAY) return run;
  return { ...run, tray: [...run.tray, chit] };
}

/** Takes one chit of this value back off the counter (the last one put down). */
export function takeBack(run: Run, chit: Chit): Run {
  const at = run.tray.lastIndexOf(chit);
  return at < 0 ? run : { ...run, tray: run.tray.filter((_, index) => index !== at) };
}

export const undo = (run: Run): Run => run.tray.length ? { ...run, tray: run.tray.slice(0, -1) } : run;

function next(run: Run, outcome: Outcome, points: number): Run {
  const clean = run.clean + (outcome === 'ok' && run.tries === 0 ? 1 : 0);
  return { ...run, index: run.index + 1, tray: [], tries: 0, score: run.score + points, results: [...run.results, outcome], clean };
}

/** Stars for a day, from first-try right answers: 6 clears the day, 8 is two stars, all ten is three. */
export const STAR_STEPS = [6, 8, 10] as const;
export const dayStars = (clean: number) => STAR_STEPS.filter(step => clean >= step).length;

/** Under a score that missed this phone's best: the best, and the exact gap when one quick customer could close it. */
export function bestLine(score: number, best: number, day: number) {
  const where = day ? 'এই দিনে' : 'এই ফোনে', gap = best - score + 5;
  return gap <= RIGHT_POINTS + FAST_POINTS ? `${where} সেরা ${bn(best)}। আর ${bn(gap)} পয়েন্ট হলেই নতুন সেরা।` : `${where} সেরা ${bn(best)}`;
}

/** The exact near miss under the stars, or '' when there is nothing closer to reach. */
export function nearLine(clean: number) {
  const stars = dayStars(clean);
  if (stars === 3) return '';
  const short = STAR_STEPS[stars] - clean;
  return stars === 0 ? `আর ${bn(short)} জনকে একবারে ঠিক দিলেই দিন পার।` : `আর ${bn(short)} জনকে একবারে ঠিক দিলে ${bn(stars + 1)} তারা।`;
}

/**
 * Hands over what's on the counter. `left` is the share of time left (null when playing without the clock).
 * Wrong: the chits stay so you can fix them, and `diff` says how far off (+ too much, − too little). Right: on to the next customer.
 */
export function give(run: Run, left: number | null): { run: Run; diff: number; points: number; bonus: number } {
  const customer = current(run);
  if (!customer || isOver(run) || !run.tray.length) return { run, diff: NaN, points: 0, bonus: 0 };
  const diff = trayTotal(run.tray) - changeOf(customer);
  if (diff !== 0) return { run: { ...run, tries: run.tries + 1 }, diff, points: 0, bonus: 0 };
  const bonus = run.tries === 0 && left !== null ? fastBonus(left) : 0;
  return { run: next(run, 'ok', RIGHT_POINTS + bonus), diff: 0, points: RIGHT_POINTS + bonus, bonus };
}

/** The clock ran out: no points, no fuss, next customer. */
export const timeUp = (run: Run): Run => isOver(run) ? run : next(run, 'miss', 0);

/** The playful line after a wrong count: never a scolding. */
export function wrongLine(diff: number, tries: number) {
  const amount = bn(Math.abs(diff));
  const lines = diff < 0
    ? [`আরে, ${amount} টাকা কম দিলে!`, `আরও ${amount} টাকা পাব তো!`, `উঁহু, ${amount} টাকা কম হলো।`]
    : [`আরে, ${amount} টাকা বেশি দিলে!`, `এত দিলে দোকান চলবে? ${amount} টাকা বেশি!`, `${amount} টাকা বেশি হয়ে গেল যে!`];
  return lines[Math.max(0, tries - 1) % lines.length];
}
export const RIGHT_LINES = ['ঠিক আছে, আসি তাহলে!', 'একদম ঠিক! ধন্যবাদ।', 'হিসাব পাকা!', 'বাহ, ঝটপট!'] as const;
export const LATE_LINE = 'থাক, ভাংতিটা পরে নেব!';

/** "১০০ + ১০ + ২ + ১" */
export const chitsText = (chits: readonly number[]) => chits.map(bn).join(' + ');

/** The kind line under the score, by how many customers got the right change. */
export function humanLine(right: number, score: number) {
  if (right === CUSTOMERS && score >= 1400) return 'ক্যালকুলেটর লাগে না, মাথাতেই হিসাব পাকা!';
  if (right === CUSTOMERS) return 'দশে দশ! পাড়ার সবাই এখন এই দোকানেই আসবে।';
  if (right >= 8) return 'দোকানদারের মাথা আছে! ভিড়ে এক-আধজন তো ফসকাবেই।';
  if (right >= 6) return 'খদ্দেররা মোটামুটি খুশি। খাতায় একটু কাটাকাটি, এই যা।';
  if (right >= 3) return 'ভিড়ের মধ্যে ভাংতি গোনা সহজ না। আরেকবার দোকান খোলো!';
  return 'আজ ক্যাশবাক্স একটু রাগ করেছে। চলো, আবার দোকান খুলি!';
}
