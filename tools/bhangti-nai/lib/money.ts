// The cash box and the arithmetic every queue shares: chits, customers, the fewest-chits change. Pure and server-safe.

/** The chits in the cash box. Made-up play money: plain colours and numerals, never real note designs. */
export const CHITS = [1, 2, 5, 10, 20, 50, 100] as const;
export type Chit = (typeof CHITS)[number];

/** plain: one note · two: two notes · round: a note plus coins so the change comes out round · out: one chit has run out · kg: quantity × rate. */
export type Kind = 'plain' | 'two' | 'round' | 'out' | 'kg';
/** `qty` and `unit` are set only for kg customers (price = qty × unit); old queues never carry them. */
export type Customer = { who: number; kind: Kind; notes: number[]; price: number; out: Chit | 0; qty?: number; unit?: number };

const digits = new Intl.NumberFormat('bn-BD', { useGrouping: false });
export const bn = (value: number) => digits.format(value);

/** Student, grandmother, rickshaw-puller, office worker, little girl, the uncle next door. */
export const PEOPLE = ['স্কুলের ছাত্র', 'নানু', 'রিকশাওয়ালা মামা', 'অফিসের আপা', 'ছোট্ট মেয়ে', 'পাশের বাসার চাচা'] as const;

export const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);
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

export const MAX_TRAY = 12;
export const MAX_CHANGE = 300;
export const MAX_PIECES = 6;

/** Can this customer be served fairly: positive change, makeable from the box, few enough chits for the time? */
export function fair(customer: Customer) {
  const change = changeOf(customer);
  if (change < 1 || change > MAX_CHANGE || customer.price < 1) return false;
  const pieces = fewest(change, customer.out);
  if (!pieces || pieces.length > MAX_PIECES + (customer.out ? 1 : 0)) return false;
  // A run-out chit must matter: the usual quickest change would have used it.
  return !customer.out || fewest(change)!.includes(customer.out);
}

/** The example already solved on the first screen. */
export const EXAMPLE: Customer = { who: 1, kind: 'plain', notes: [50], price: 35, out: 0 };
export const EXAMPLE_TRAY: Chit[] = [10, 5];

/** "১.৪" seconds from ms, one decimal. */
export const seconds = (ms: number) => new Intl.NumberFormat('bn-BD', { useGrouping: false, maximumFractionDigits: 1 }).format(Math.max(0.1, Math.round(ms / 100) / 10));
