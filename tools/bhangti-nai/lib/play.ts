// Rules for ভাংতি নাই!: a deal of ten customers, exact change from chits, scoring, stars and the lines. Pure and server-safe.
import { CUSTOMERS, DAYS, legacyCustomers, legacySeconds } from './legacy';
import { LEVEL_COUNT, levelAt, secondsFor } from './levels';
import { bn, changeOf, CHITS, MAX_TRAY, paidOf, trayTotal, type Chit, type Customer } from './money';
import { makeQueue } from './queue';

export const RIGHT_POINTS = 100;
export const FAST_POINTS = 50;
export const MAX_SCORE = CUSTOMERS * (RIGHT_POINTS + FAST_POINTS);

/** `v` 1: a queue from before the rewrite (`level` is the old shop day, 0 the classic queue); 2: the new ladder. */
export type Version = 1 | 2;
export type Deal = { v: Version; level: number; seed: number; customers: Customer[]; seconds: number[]; rush: boolean };

export function makeDeal(level: number, seed: number, v: Version = 2): Deal {
  if (v === 1) {
    const customers = legacyCustomers(seed, level);
    return { v, level, seed, customers, seconds: customers.map(customer => legacySeconds(customer, level)), rush: false };
  }
  const spec = levelAt(level), customers = makeQueue(spec, seed);
  return { v, level, seed, customers, seconds: customers.map(customer => secondsFor(spec, customer)), rush: spec.rush };
}
/** Levels a link may name: the ladder, or an old day (0 is the classic queue). */
export const dealExists = (level: number, v: Version) => Number.isInteger(level) && (v === 2 ? level >= 1 && level <= LEVEL_COUNT : level >= 0 && level <= DAYS);

/** One customer's outcome: `clean` is right on the first try; `ms` the time at the counter. */
export type Entry = { ok: boolean; clean: boolean; ms: number; points: number };
export type Run = { customers: Customer[]; index: number; tray: Chit[]; tries: number; slips: number; score: number; log: Entry[]; clean: number };

export const startRun = (deal: Deal): Run => ({ customers: deal.customers, index: 0, tray: [], tries: 0, slips: 0, score: 0, log: [], clean: 0 });
export const isOver = (run: Run) => run.log.length >= CUSTOMERS;
export const current = (run: Run): Customer | undefined => run.customers[run.index];
export const rightCount = (log: readonly Entry[]) => log.filter(entry => entry.ok).length;

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

function next(run: Run, entry: Entry): Run {
  return { ...run, index: run.index + 1, tray: [], tries: 0, score: run.score + entry.points, log: [...run.log, entry], clean: run.clean + (entry.clean ? 1 : 0) };
}

/** Stars for a shop day, from first-try right answers: 6 clears it, 8 is two stars, all ten is three. */
export const STAR_STEPS = [6, 8, 10] as const;
export const dayStars = (clean: number) => STAR_STEPS.filter(step => clean >= step).length;
/** Without the clock (সময় নিয়ে) stars stop at two: the clock is what the third one proves. */
export const TIMED_STARS = 3, CALM_STARS = 2;
export const starsOf = (clean: number, timed: boolean) => Math.min(dayStars(clean), timed ? TIMED_STARS : CALM_STARS);

/** Under a score that missed this phone's best: the best, and the exact gap when one quick customer could close it. */
export function bestLine(score: number, best: number, where = 'এই দিনে') {
  const gap = best - score + 5;
  return gap <= RIGHT_POINTS + FAST_POINTS ? `${where} সেরা ${bn(best)}। আর ${bn(gap)} পয়েন্ট হলেই নতুন সেরা।` : `${where} সেরা ${bn(best)}`;
}

/** The exact near miss under the stars, or '' when there is nothing closer to reach. */
export function nearLine(clean: number, timed = true) {
  const stars = starsOf(clean, timed);
  if (stars === 3) return '';
  if (!timed && dayStars(clean) === 3) return 'দশে দশ! ঘড়ির সঙ্গে খেললে ৩ তারা পাবে।';
  const short = STAR_STEPS[stars] - clean;
  return stars === 0 ? `আর ${bn(short)} জনকে একবারে ঠিক দিলেই দিন পার।` : `আর ${bn(short)} জনকে একবারে ঠিক দিলে ${bn(stars + 1)} তারা।`;
}

/** Up to 50 for a right answer on the first try, by the share of time left, in steps of 5. */
export const fastBonus = (left: number) => 5 * Math.round((Math.max(0, Math.min(1, left)) * FAST_POINTS) / 5);

/**
 * Hands over what's on the counter. `left` is the share of time left (null when playing without the clock), `ms` the time
 * at the counter. Wrong: the chits stay so you can fix them, and `diff` says how far off (+ too much, − too little).
 * Right: on to the next customer.
 */
export function give(run: Run, left: number | null, ms = 0): { run: Run; diff: number; points: number; bonus: number } {
  const customer = current(run);
  if (!customer || isOver(run) || !run.tray.length) return { run, diff: NaN, points: 0, bonus: 0 };
  const diff = trayTotal(run.tray) - changeOf(customer);
  if (diff !== 0) return { run: { ...run, tries: run.tries + 1, slips: run.slips + 1 }, diff, points: 0, bonus: 0 };
  const clean = run.tries === 0, bonus = clean && left !== null ? fastBonus(left) : 0, points = RIGHT_POINTS + bonus;
  return { run: next(run, { ok: true, clean, ms, points }), diff: 0, points, bonus };
}

/** The clock ran out: no points, no fuss, next customer. */
export const timeUp = (run: Run, ms = 0): Run => isOver(run) ? run : next(run, { ok: false, clean: false, ms, points: 0 });

/** What the customer says, as text and amounts: [["২০০", " টাকা দিলাম,"], ["জিনিস ", "৮৭", " টাকার"]]. Amounts stay numbers so the page can make them big. */
export function saying(customer: Customer): Array<Array<string | number>> {
  const [first, ...rest] = customer.notes;
  const given = customer.kind === 'plain' || customer.kind === 'out' || customer.kind === 'kg'
    ? [first, ' টাকা দিলাম' + (customer.kind === 'kg' ? '।' : ',')]
    : [first, ' আর ', rest.reduce((total, note) => total + note, 0), ' টাকা দিলাম,'];
  return customer.kind === 'kg' ? [[customer.qty!, ' কেজি, কেজি ', customer.unit!, ' টাকা।'], given] : [given, ['জিনিস ', customer.price, ' টাকার']];
}

/** The working behind the right change, one line a step: shown after a second wrong count and when a customer walks off. */
export function working(customer: Customer): string[] {
  const lines: string[] = [];
  if (customer.kind === 'kg') lines.push(`${bn(customer.qty!)} × ${bn(customer.unit!)} = ${bn(customer.price)}`);
  if (customer.notes.length > 1) lines.push(`${customer.notes.map(bn).join(' + ')} = ${bn(paidOf(customer))}`);
  lines.push(`${bn(paidOf(customer))} − ${bn(customer.price)} = ${bn(changeOf(customer))}`);
  return lines;
}

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

/** What the run says about itself: right and first-try counts, times and the best streak of first tries. */
export function statsOf(log: readonly Entry[]) {
  const served = log.filter(entry => entry.ok);
  let streak = 0, bestStreak = 0;
  for (const entry of log) { streak = entry.clean ? streak + 1 : 0; bestStreak = Math.max(bestStreak, streak); }
  return {
    right: served.length, clean: log.filter(entry => entry.clean).length, bestStreak,
    avgMs: served.length ? Math.round(served.reduce((total, entry) => total + entry.ms, 0) / served.length) : 0,
    fastestMs: served.length ? Math.min(...served.map(entry => entry.ms)) : 0,
  };
}

/** The kind line under the score, by how many customers got the right change. */
export function humanLine(right: number, score: number) {
  if (right === CUSTOMERS && score >= 1400) return 'ক্যালকুলেটর লাগে না, মাথাতেই হিসাব পাকা!';
  if (right === CUSTOMERS) return 'দশে দশ! পাড়ার সবাই এখন এই দোকানেই আসবে।';
  if (right >= 8) return 'দোকানদারের মাথা আছে! ভিড়ে এক-আধজন তো ফসকাবেই।';
  if (right >= 6) return 'খদ্দেররা মোটামুটি খুশি। খাতায় একটু কাটাকাটি, এই যা।';
  if (right >= 3) return 'ভিড়ের মধ্যে ভাংতি গোনা সহজ না। আরেকবার দোকান খোলো!';
  return 'আজ ক্যাশবাক্স একটু রাগ করেছে। চলো, আবার দোকান খুলি!';
}
