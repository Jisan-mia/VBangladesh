// A level's ten customers, seeded: the same seed and level give the same queue on every phone. Pure and server-safe.
import { makeRng, pick } from '../../../shared/game-core';
import { CUSTOMERS } from './legacy';
import { levelAt, PER_WORLD, type Spec, type Twist } from './levels';
import { fair, fewest, PEOPLE, type Chit, type Customer } from './money';

const NOTES = [50, 100, 200, 500] as const;
/** Where twisted customers stand in the queue: the newest twist meets you at the third customer. Never the first. */
export const SLOTS = [2, 5, 8, 3, 6, 9, 4, 7, 1] as const;

/** Which twist (if any) each of the ten customers brings on a level. */
export function twistsOf(spec: Spec): (Twist | null)[] {
  const kinds: (Twist | null)[] = new Array(CUSTOMERS).fill(null);
  let next = 0;
  for (const [twist, count] of spec.tw) for (let k = 0; k < count; k++) kinds[SLOTS[next++]] = twist;
  return kinds;
}

function customerFor(rng: () => number, spec: Spec, twist: Twist | null, first: boolean, who: number): Customer {
  for (let attempt = 0; attempt < 80; attempt++) {
    let price: number, notes: number[], out: Chit | 0 = 0, qty: number | undefined, unit: number | undefined;
    const plainPrice = () => spec.lo + pick(rng, Math.floor((spec.hi - spec.lo) / spec.step) + 1) * spec.step;
    const handed = (cost: number) => {
      const smallest = NOTES.find(note => note > cost) ?? 500, bigger = NOTES[NOTES.indexOf(smallest as (typeof NOTES)[number]) + 1];
      // The first customer always hands the smallest note, so the opening sum is gentle.
      return !first && bigger && bigger <= spec.note && rng() < 0.4 ? bigger : smallest;
    };
    if (twist === 'two') {
      const [a, b] = spec.pairs[pick(rng, spec.pairs.length)];
      price = a + 4 + pick(rng, b - 7);
      notes = [a, b];
    } else if (twist === 'kg') {
      const [rateLo, rateHi, rateStep, kilos] = spec.kg!;
      qty = 2 + pick(rng, kilos - 1);
      unit = rateLo + pick(rng, Math.floor((rateHi - rateLo) / rateStep) + 1) * rateStep;
      price = qty * unit;
      notes = [handed(price)];
    } else {
      price = plainPrice();
      if (twist === 'round') {
        // The customer adds coins so the change is round, the way people do at a real counter: 87 টাকা, "১০০ আর ৭ নাও".
        if (price % 10 === 0) continue;
        notes = [NOTES.find(note => note > price) ?? 500, ...fewest(price % 10)!];
      } else {
        notes = [handed(price)];
        if (twist === 'out') out = spec.outs[pick(rng, spec.outs.length)];
      }
    }
    const customer: Customer = { who, kind: twist ?? 'plain', notes, price, out };
    if (qty) { customer.qty = qty; customer.unit = unit; }
    if (fair(customer)) return customer;
  }
  // Practically never reached; a known-fair customer keeps the run whole.
  return { who, kind: 'plain', notes: [100], price: 63, out: 0 };
}

export function makeQueue(spec: Spec, seed: number): Customer[] {
  const rng = makeRng(seed), kinds = twistsOf(spec);
  const customers: Customer[] = [];
  let previous = -1;
  for (let index = 0; index < CUSTOMERS; index++) {
    let who = pick(rng, PEOPLE.length);
    if (who === previous) who = (who + 1 + pick(rng, PEOPLE.length - 1)) % PEOPLE.length;
    previous = who;
    customers.push(customerFor(rng, spec, kinds[index], index === 0, who));
  }
  return customers;
}

export const queueOfLevel = (level: number, seed: number) => makeQueue(levelAt(level), seed);

/** Where a level's newest twist first meets you ("নতুন: …" shows on that customer), or null when the level brings no new twist. */
export function newTwistAt(level: number): { index: number; twist: Twist } | null {
  const spec = levelAt(level), twist = spec.tw[0]?.[0];
  if (!twist) return null;
  const before = (level - 1) % PER_WORLD === 0 ? [] : levelAt(level - 1).tw.map(([kind]) => kind);
  return before.includes(twist) ? null : { index: twistsOf(spec).indexOf(twist), twist };
}
