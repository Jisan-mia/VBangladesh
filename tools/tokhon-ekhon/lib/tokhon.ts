import { CPI, NOW_AS_OF, NOW_INFLATION, NOW_YEAR } from "./cpi";

const dataYears = Object.keys(CPI).map(Number).sort((a, b) => a - b);
export const FIRST_YEAR = dataYears[0];
/** The newest full-year average in the data (the base for "now"). */
export const LAST_FULL_YEAR = dataYears[dataYears.length - 1];
/** "Now" is a fixed year from cpi.ts, never the phone's clock. */
export const LATEST_YEAR = NOW_YEAR;
/** Price level per year: the annual averages, plus "now" estimated from the latest full year and current inflation. */
export const LEVEL: Readonly<Record<number, number>> = { ...CPI, [NOW_YEAR]: CPI[LAST_FULL_YEAR] * (1 + NOW_INFLATION / 100) };
/** Years you can pick: every full year in the data. */
export const years = dataYears.filter(year => year < LATEST_YEAR);
export const amounts = [10, 100, 1000] as const;
export type Amount = (typeof amounts)[number];

export type Shared = { year: number; amount: Amount; birth: boolean };
export const DEFAULT: Shared = { year: 1995, amount: 100, birth: false };

const grouped = new Intl.NumberFormat("bn-BD");
const plain = new Intl.NumberFormat("bn-BD", { useGrouping: false });
const decimal = new Intl.NumberFormat("bn-BD", { maximumFractionDigits: 1 });
/** Taka with Bangladeshi grouping ("১,১৭০", "১,০০,০০০"); years without ("১৯৯৫"). */
export const bn = (value: number) => grouped.format(value);
export const bnYear = (value: number) => plain.format(value);

/** What `amount` taka of `from` costs in `to`, by the consumer price index: amount × level(to) ÷ level(from). */
export function worth(amount: number, from: number, to = LATEST_YEAR) {
  const then = LEVEL[from], now = LEVEL[to];
  if (!then || !now) throw new RangeError("এই সালের হিসাব নেই।");
  return (amount * now) / then;
}

/** Whole taka to three significant figures: an average-price estimate shouldn't pretend to be exact. */
export function roughly(value: number) {
  if (value < 100) return Math.round(value);
  const step = 10 ** (Math.floor(Math.log10(value)) - 2);
  return Math.round(value / step) * step;
}

/** How many fresh notes the wallet shows for "now": the price multiple, rounded, between 1 and 12. */
export const noteCount = (times: number) => Math.min(12, Math.max(1, Math.round(times)));

/** "গড় দাম বেড়েছে প্রায় ৭.৩ গুণ"; under 1.5× a percentage reads better ("প্রায় ৮%"). */
export function growthText(times: number) {
  return times < 1.5 ? `গড় দাম বেড়েছে প্রায় ${bn(Math.round((times - 1) * 100))}%` : `গড় দাম বেড়েছে প্রায় ${decimal.format(times)} গুণ`;
}

/** One plain line saying what the sum is worth today; worded so it reads right on the page and on the card. */
export function humanLine({ year, amount = 100 }: Pick<Shared, "year"> & { amount?: number }) {
  return `${bnYear(year)}-এর ${bn(amount)} টাকায় যা কেনা যেত, আজ তা কিনতে লাগে প্রায় ${bn(roughly(worth(amount, year)))} টাকা।`;
}

export function shareHash({ year, amount, birth }: Shared) {
  const params = new URLSearchParams({ y: String(year), a: String(amount) });
  if (birth) params.set("b", "1");
  return "#" + params.toString();
}

/** Only a known year and one of the three amounts get through; anything else (including in-page #anchors) is null. */
export function parseShareHash(hash: string): Shared | null {
  if (hash.length > 200) return null;
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const y = params.get("y") ?? "", a = params.get("a") ?? "";
  const year = /^\d{4}$/.test(y) ? Number(y) : NaN;
  const amount = amounts.find(value => String(value) === a);
  if (!years.includes(year) || !amount) return null;
  return { year, amount, birth: params.get("b") === "1" };
}

export type Card = Shared & {
  now: number;
  times: number;
  kicker: string;
  headline: string;
  sentence: string;
  growth: string;
  basis: string;
  line: string;
};

export function createCard(shared: Shared): Card {
  const exact = worth(shared.amount, shared.year);
  const times = exact / shared.amount;
  const now = roughly(exact);
  return {
    ...shared,
    now,
    times,
    kicker: shared.birth ? `আমার জন্মসাল ${bnYear(shared.year)}` : "টাকার মান, তখন আর এখন",
    headline: `${bnYear(shared.year)} সালের ${bn(shared.amount)} টাকা`,
    sentence: `${bnYear(shared.year)} সালের ${bn(shared.amount)} টাকা ≈ এখনকার ${bn(now)} টাকা`,
    growth: growthText(times),
    basis: `${NOW_AS_OF}-এর দামে আনুমানিক`,
    line: humanLine(shared),
  };
}

/** Link-preview and post text, e.g. "আমার জন্মসাল ১৯৯৫: তখনকার ১০০ টাকা এখন প্রায় ৭২৬ টাকা". */
export function previewTitle(shared: Shared) {
  const card = createCard(shared);
  return shared.birth
    ? `আমার জন্মসাল ${bnYear(card.year)}: তখনকার ${bn(card.amount)} টাকা এখন প্রায় ${bn(card.now)} টাকা। তোমারটা কত?`
    : `${card.headline} এখন প্রায় ${bn(card.now)} টাকা। তোমার জন্মসালেরটা কত?`;
}
