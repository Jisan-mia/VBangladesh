// The ladder: three shops as three worlds, ten days each. Each shop brings one rule; inside a shop each level adds exactly
// one thing (its `lesson`, and the before → after chips from `changes`), and the tenth is the shop's named finale, where a
// wrong count costs the customer's patience. Tuned with the headless bots in tests/bot.ts; the tests assert the rates.
// Never reorder: links and saved stars carry the level number.
import { bn, type Chit, type Customer } from './money';

/** round: the customer adds coins so the change is round · two: two notes together · out: a chit has run out · kg: quantity × rate. */
export type Twist = 'round' | 'two' | 'out' | 'kg';
/**
 * Plain customers pay a price from `lo` to `hi` (in `step`s) with the smallest note above it, sometimes the next one up to
 * `note`. `secs` is the clock per customer. `tw` lists the twisted customers of the ten, newest twist first; `outs` the
 * chits that may run out, `pairs` the two-note payments, `kg` the rate range and the most kilos. `rush`: a wrong count
 * takes `RUSH_MS` off the customer's patience.
 */
export type Spec = {
  lo: number; hi: number; step: number; note: number; secs: number;
  tw: readonly (readonly [Twist, number])[]; outs: readonly Chit[]; pairs: readonly (readonly [number, number])[];
  kg: readonly [rateLo: number, rateHi: number, rateStep: number, kilos: number] | null; rush: boolean;
};
export type Level = Spec & { lesson: string };

export type World = { name: string; rule: string; finale: string; wall: string; sign: string; ink: string };
export const WORLDS: readonly World[] = [
  { name: 'পাড়ার দোকান', rule: 'খদ্দেরের টাকা থেকে দাম বাদ দিয়ে বাকিটা ফেরত দাও।', finale: 'ঈদের আগের দিন', wall: '#1b6a63', sign: '#f6c945', ink: '#8a1f17' },
  { name: 'বাজারের দোকান', rule: 'একটা চিরকুট শেষ। বাকি চিরকুট দিয়ে ভাংতি সাজাও।', finale: 'মাসের প্রথম বাজার', wall: '#2f5d8f', sign: '#8fd18a', ink: '#14422a' },
  { name: 'হাটের দোকান', rule: 'কেজি দরে বিক্রি: কেজি × দর = দাম, তারপর ফেরত।', finale: 'হাটবার', wall: '#7a3a3a', sign: '#f3a93a', ink: '#5a1d12' },
];
export const PER_WORLD = 10;
/** A wrong count in a finale takes this much off the customer's patience. */
export const RUSH_MS = 2000;
/** Extra seconds a twisted customer gets on top of the level's clock. */
export const EXTRA_SECONDS: Record<Twist, number> = { round: 2, two: 2, out: 2, kg: 3 };

const BASE: Spec = { lo: 10, hi: 45, step: 5, note: 50, secs: 10, tw: [], outs: [], pairs: [], kg: null, rush: false };
type Step = [change: Partial<Spec>, lesson: string];

const STEPS: readonly Step[] = [
  // ১ পাড়ার দোকান: plain subtraction, then the money grows.
  [{}, 'খদ্দের ৫০ দিল, জিনিস ৩৫ টাকার। দাম বাদ দিয়ে বাকিটা ফেরত দাও।'],
  [{ lo: 15, hi: 95, note: 100 }, 'এবার ১০০ টাকার নোটও আসবে।'],
  [{ step: 1 }, 'দাম এখন খুচরা, ১ আর ২ টাকার কয়েন লাগবে।'],
  [{ secs: 9 }, 'খদ্দেরের তাড়া। প্রতিজন এক সেকেন্ড কম অপেক্ষা করবে।'],
  [{ lo: 55, hi: 195, note: 200 }, '২০০ টাকার নোট। ফেরতটাও বড়।'],
  [{ tw: [['round', 4]] }, 'কেউ কেউ খুচরা বাড়িয়ে দেবে: ১০০ আর ৭। ফেরত গোল হবে।'],
  [{ secs: 8 }, 'আরও এক সেকেন্ড কম।'],
  [{ lo: 120, hi: 470, note: 500 }, '৫০০ টাকার নোট। ফেরত ৩০০ পর্যন্ত।'],
  [{ tw: [['two', 3], ['round', 4]], pairs: [[100, 50]] }, 'দুটো নোট একসঙ্গে: ১০০ আর ৫০। আগে যোগ, তারপর বিয়োগ।'],
  [{ tw: [['two', 4], ['round', 5]], secs: 6, rush: true }, 'ঈদের আগের দিন, দোকানে ভিড়। ভুল গুনলে খদ্দেরের ধৈর্য দুই সেকেন্ড কমে।'],
  // ২ বাজারের দোকান: a chit is sold out.
  [{ lo: 21, hi: 96, step: 1, note: 100, secs: 10, tw: [['out', 3]], outs: [10], pairs: [], rush: false }, 'নতুন দোকান: ১০ টাকার চিরকুট শেষ! বাকি চিরকুটে ভাংতি সাজাও।'],
  [{ outs: [5] }, 'এবার ৫ টাকার চিরকুট শেষ।'],
  [{ outs: [1] }, 'এবার ১ টাকার কয়েন নেই।'],
  [{ outs: [1, 5, 10], tw: [['out', 5]] }, 'কোনটা শেষ, আগে দেখে নাও। এখন পাঁচজনের বেলায় এমন হবে।'],
  [{ lo: 55, hi: 195, note: 200 }, '২০০ টাকার নোট।'],
  [{ secs: 9 }, 'এক সেকেন্ড কম।'],
  [{ lo: 120, hi: 470, note: 500 }, '৫০০ টাকার নোট।'],
  [{ tw: [['round', 3], ['out', 4]] }, 'খুচরা বাড়ানো খদ্দেররা ফিরে এসেছে।'],
  [{ outs: [1, 5, 10, 20, 50] }, '২০ বা ৫০ টাকার চিরকুটও শেষ হতে পারে।'],
  [{ tw: [['out', 5], ['round', 2], ['two', 2]], pairs: [[100, 50], [200, 100]], secs: 7, rush: true }, 'মাসের প্রথম বাজার, ভিড় আর ভাংতি দুটোই কম। ভুল গুনলে ধৈর্য দুই সেকেন্ড কমে।'],
  // ৩ হাটের দোকান: kilos × rate.
  [{ lo: 15, hi: 95, step: 5, note: 100, secs: 10, tw: [['kg', 3]], kg: [5, 25, 5, 2], outs: [], pairs: [], rush: false }, 'নতুন দোকান: কেজি দরে বিক্রি। ২ কেজি, কেজি ১৫ টাকা: আগে দাম, তারপর ফেরত।'],
  [{ kg: [5, 25, 5, 3] }, 'এবার ৩ কেজি পর্যন্ত।'],
  [{ kg: [5, 25, 1, 3] }, 'কেজির দাম এখন খুচরা, যেমন ১৭ টাকা।'],
  [{ kg: [5, 25, 1, 5] }, '৫ কেজি পর্যন্ত নেবে।'],
  [{ lo: 55, hi: 195, note: 200, kg: [5, 40, 1, 5] }, '২০০ টাকার নোট, কেজি ৪০ টাকা পর্যন্ত।'],
  [{ secs: 9 }, 'এক সেকেন্ড কম।'],
  [{ tw: [['kg', 5]] }, 'কেজি দরের খদ্দের এখন পাঁচজন।'],
  [{ tw: [['out', 3], ['kg', 4]], outs: [5, 10] }, 'চিরকুট শেষ হওয়ার দিন ফিরে এসেছে।'],
  [{ lo: 120, hi: 470, note: 500 }, '৫০০ টাকার নোট।'],
  [{ tw: [['kg', 4], ['out', 3], ['round', 2]], outs: [1, 5, 10], secs: 7, rush: true }, 'হাটবার, সারা গাঁয়ের ভিড়। ভুল গুনলে ধৈর্য দুই সেকেন্ড কমে।'],
];

export const LEVELS: readonly Level[] = STEPS.reduce<Level[]>((all, [change, lesson]) => [...all, { ...(all[all.length - 1] ?? BASE), ...change, lesson }], []);

export const LEVEL_COUNT = LEVELS.length;
export const worldOf = (level: number) => Math.floor((level - 1) / PER_WORLD);
export const worldStart = (index: number) => index * PER_WORLD + 1;
export const isFinale = (level: number) => level % PER_WORLD === 0;
export const isLevel = (level: number) => Number.isInteger(level) && level >= 1 && level <= LEVEL_COUNT;
export const levelAt = (level: number): Level => LEVELS[level - 1];
export const finaleName = (level: number) => isFinale(level) ? WORLDS[worldOf(level)].finale : '';
export const specCount = (spec: Spec) => spec.tw.reduce((total, [, count]) => total + count, 0);

/** The clock for one customer on a level, in seconds. */
export const secondsFor = (spec: Spec, customer: Customer) =>
  Math.round((spec.secs + (customer.kind === 'plain' ? 0 : EXTRA_SECONDS[customer.kind])) * 10) / 10;

const TWIST_NAME: Record<Twist, string> = { round: 'গোল ভাংতি', two: 'দুটো নোট', out: 'চিরকুট শেষ', kg: 'কেজি দর' };
const twistIds = (spec: Spec) => spec.tw.map(([twist]) => twist).join();

/** What changed since the level before, in the player's words (the start card's before → after chips). */
export function changes(level: number): string[] {
  const now = levelAt(level);
  if ((level - 1) % PER_WORLD === 0) return level === 1 ? [] : ['নতুন দোকান'];
  const was = levelAt(level - 1), out: string[] = [];
  if (now.rush && !was.rush) out.push('ভুলে ধৈর্য কমে');
  if (now.note !== was.note) out.push(`বড় নোট ${bn(was.note)} → ${bn(now.note)}`);
  if (now.step !== was.step) out.push('খুচরা দাম');
  if (now.secs !== was.secs) out.push(`সময় ${bn(was.secs)} → ${bn(now.secs)} সে.`);
  const nowTwists = twistIds(now), wasTwists = twistIds(was);
  if (nowTwists !== wasTwists) out.push(`নতুন: ${TWIST_NAME[now.tw[0][0]]}`);
  else if (specCount(now) !== specCount(was)) out.push(`${TWIST_NAME[now.tw[0][0]]} ${bn(specCount(was))} → ${bn(specCount(now))} জন`);
  if (now.outs.join() !== was.outs.join() && nowTwists === wasTwists) out.push(now.outs.length === 1 && was.outs.length === 1 ? `শেষ চিরকুট ${bn(was.outs[0])} → ${bn(now.outs[0])}` : 'শেষ চিরকুট বদলাল');
  if (now.kg && was.kg && now.kg[3] !== was.kg[3]) out.push(`কেজি ${bn(was.kg[3])} → ${bn(now.kg[3])} পর্যন্ত`);
  if (now.kg && was.kg && now.kg[2] !== was.kg[2]) out.push('খুচরা দর');
  return out;
}

/** The kinds of change since the level before; a bigger note and the prices that come with it count as one. */
export function changeKinds(level: number): string[] {
  const now = levelAt(level), was = levelAt(level - 1), out: string[] = [];
  if (now.rush !== was.rush) out.push('rush');
  if (now.note !== was.note || now.lo !== was.lo || now.hi !== was.hi || now.kg?.[1] !== was.kg?.[1]) out.push('money');
  if (now.step !== was.step) out.push('step');
  if (now.secs !== was.secs) out.push('secs');
  const rest = (spec: Spec) => JSON.stringify([spec.tw, spec.outs, spec.pairs, spec.kg && [spec.kg[0], spec.kg[2], spec.kg[3]]]);
  if (rest(now) !== rest(was)) out.push('twist');
  return out;
}
