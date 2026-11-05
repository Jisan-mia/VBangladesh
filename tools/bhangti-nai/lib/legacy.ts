// The queue and clock from before the rewrite, kept behaviourally exact so a link without `v` (every link shared
// before the rewrite) replays the same ten customers on the same clock. Never change the generator.
import { makeRng, pick } from '../../../shared/game-core';
import { fair, fewest, PEOPLE, type Chit, type Customer, type Kind } from './money';

const NOTES = [50, 100, 200, 500] as const;
export const CUSTOMERS = 10;
export const BASE_SECONDS = 10;
/** A customer with a twist (extra coins, or a chit that has run out) gets a little longer. */
export const TWIST_SECONDS = 2;
/** The old shop days. */
export const DAYS = 20;

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
const OUTS = [1, 5, 10] as const;

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
export function legacyCustomers(seed: number, day = 0): Customer[] {
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

/** The old clock for one customer, in seconds (the old slow mode gave 1.5 times as long; the new one keeps the clock). */
export const legacySeconds = (customer: Customer, day = 0) =>
  Math.round((BASE_SECONDS + (customer.kind === 'round' || customer.kind === 'out' ? TWIST_SECONDS : 0)) * dayPace(day) * 10) / 10;
