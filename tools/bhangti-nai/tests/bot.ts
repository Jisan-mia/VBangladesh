// A headless shopkeeper for the difficulty tests. It reads the customer, works the sum out in its head (longer for odd
// prices, kilos, two notes and a missing chit), taps the chits one by one, and now and then slips and hands the wrong
// amount and has to fix it. Reaction, thinking and tapping are human, and seeded, so the rates are exact.
import { makeRng } from '../../../shared/game-core';
import { RUSH_MS } from '../lib/levels';
import { changeOf, fewest, type Customer } from '../lib/money';
import { CUSTOMERS } from '../lib/legacy';
import { give, startRun, tap, timeUp, type Deal, type Run } from '../lib/play';

/** `react` s to read, `mult` scales the thinking, `tap` s a chit, `slip` chance of a wrong count on a sum worth 1.4 s of thought, `fix` s to put a slip right. */
export type Skill = { react: number; mult: number; tap: number; slip: number; fix: number };
export const PLAYERS = {
  casual: { react: 1.1, mult: 1.45, tap: 0.62, slip: 0.06, fix: 1.7 },
  steady: { react: 0.8, mult: 1, tap: 0.48, slip: 0.03, fix: 1.2 },
  strong: { react: 0.55, mult: 0.7, tap: 0.36, slip: 0.012, fix: 0.8 },
} as const satisfies Record<string, Skill>;

/** Seconds of thinking before the first chit goes down. */
export function think(customer: Customer) {
  let seconds = 0.7;
  if (customer.price % 5 !== 0) seconds += 0.6;
  if (customer.price >= 100) seconds += 0.4;
  if (customer.kind === 'round') seconds += 0.7;
  if (customer.kind === 'two') seconds += 1;
  if (customer.kind === 'out') seconds += 1.2;
  if (customer.kind === 'kg') seconds += 1.6 + (customer.unit! % 5 ? 0.6 : 0) + (customer.qty! > 3 ? 0.4 : 0);
  return seconds;
}

/** One customer, played: the seconds at the counter and whether it was right at once. */
export function playCustomer(customer: Customer, limit: number, rush: boolean, rng: () => number, skill: Skill) {
  const chits = fewest(changeOf(customer), customer.out)!.length;
  let seconds = skill.react + think(customer) * skill.mult + chits * skill.tap + (rng() - 0.5) * 0.5;
  const slipped = rng() < skill.slip * think(customer) / 1.4;
  let allowed = limit;
  if (slipped) { seconds += skill.fix; if (rush) allowed -= RUSH_MS / 1000; }
  return { seconds, clean: !slipped, late: seconds > allowed };
}

/** A whole shift on a deal, through the real rules (tap, give, timeUp). `timed` false is সময় নিয়ে. */
export function playShift(deal: Deal, rng: () => number, skill: Skill, timed = true): { run: Run; firstSeconds: number } {
  let run = startRun(deal), firstSeconds = 0;
  for (let index = 0; index < CUSTOMERS; index++) {
    const customer = deal.customers[index], played = playCustomer(customer, deal.seconds[index], deal.rush, rng, skill);
    if (index === 0) firstSeconds = played.seconds;
    const ms = Math.round(played.seconds * 1000);
    if (timed && played.late) { run = timeUp(run, ms); continue; }
    for (const chit of fewest(changeOf(customer), customer.out)!) run = tap(run, chit);
    if (!played.clean) { run = give(tap(run, 2), timed ? 0.3 : null, ms).run; run = { ...run, tray: run.tray.slice(0, -1) }; }
    run = give(run, timed ? Math.max(0, 1 - played.seconds / deal.seconds[index]) : null, ms).run;
  }
  return { run, firstSeconds };
}
