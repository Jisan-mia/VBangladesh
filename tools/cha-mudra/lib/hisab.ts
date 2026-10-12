// Pure state and arithmetic for চায়ের কাপে হিসাব. Prices and rates are whatever the person types: no live data, no fetched rates.

export const units = [
  { id: "cha", label: "চা", count: " কাপ চা" },
  { id: "singara", label: "সিঙ্গারা", count: "টা সিঙ্গারা" },
  { id: "riksha", label: "রিকশা ভাড়া", count: "টা রিকশা ভাড়া" },
] as const;

// Rate names only: the person types today's rate themselves, so "রিয়াল" works for any riyal they hold.
export const currencies = [
  { id: "bdt", label: "টাকা" },
  { id: "sar", label: "রিয়াল" },
  { id: "aed", label: "দিরহাম" },
  { id: "myr", label: "রিঙ্গিত" },
  { id: "gbp", label: "পাউন্ড" },
  { id: "usd", label: "ডলার" },
] as const;

export type UnitId = (typeof units)[number]["id"];
export type CurrencyId = (typeof currencies)[number]["id"];
export type Prices = Record<UnitId, number>;
/** Everything a card shows and a link carries. `label` is the only free text and never goes to a tally. */
export type Hisab = { amount: number; currency: CurrencyId; rate: number | null; prices: Prices; perDay: number; label: string };

export const LIMITS = { taka: 1_000_000_000, foreign: 10_000_000, rateMin: 0.01, rateMax: 10_000, priceMax: 100_000, perDayMax: 20, label: 30 } as const;
export const perDayChoices = [1, 2, 3, 5] as const;
export const quickAmounts = [500, 5_000, 20_000, 1_00_000] as const;

export const DEFAULT_PRICES: Prices = { cha: 10, singara: 10, riksha: 50 };
export const DEFAULT_HISAB: Hisab = { amount: 5_000, currency: "bdt", rate: null, prices: DEFAULT_PRICES, perDay: 2, label: "" };

const numbers = new Intl.NumberFormat("bn-BD", { maximumFractionDigits: 2 });
export const bn = (value: number) => numbers.format(value);
export const currencyLabel = (id: CurrencyId) => currencies.find(currency => currency.id === id)!.label;

/** Reads a typed number in Bangla or Latin digits; commas are ignored, at most two decimals. NaN if it isn't a plain positive number. */
export function readNumber(text: string) {
  const latin = text.replace(/[০-৯]/g, digit => String(digit.charCodeAt(0) - 0x09e6)).replace(/[,\s]/g, "");
  return /^\d{1,12}(\.\d{0,2})?$/.test(latin) ? Number(latin) : NaN;
}

export function cleanLabel(text: string) {
  // NFC first so the same word typed on two keyboards is the same link; then drop control and bidi-override characters.
  const clean = text.normalize("NFC").replace(/[\u0000-\u001f\u007f‪-‮⁦-⁩]/g, "").trim().replace(/\s+/g, " ");
  return Array.from(clean).slice(0, LIMITS.label).join("").trim();
}

const amountCap = (currency: CurrencyId) => currency === "bdt" ? LIMITS.taka : LIMITS.foreign;
export const validAmount = (amount: number, currency: CurrencyId) => Number.isFinite(amount) && amount > 0 && amount <= amountCap(currency);
export const validRate = (rate: number | null): rate is number => rate !== null && Number.isFinite(rate) && rate >= LIMITS.rateMin && rate <= LIMITS.rateMax;
export const validPrice = (price: number) => Number.isInteger(price) && price >= 1 && price <= LIMITS.priceMax;
export const validPerDay = (perDay: number) => Number.isInteger(perDay) && perDay >= 1 && perDay <= LIMITS.perDayMax;

/** The amount in hundredths times the rate in hundredths: whole numbers, so 4.5 pound × 160.25 never drifts. */
function scaled({ amount, currency, rate }: Pick<Hisab, "amount" | "currency" | "rate">) {
  if (!validAmount(amount, currency)) return null;
  if (currency !== "bdt" && !validRate(rate)) return null;
  return Math.round(amount * 100) * (currency === "bdt" ? 100 : Math.round(rate! * 100));
}

/** Picks how many cups one drawn ভাঁড় stands for (1, 2, 5, 10, 20, 50…) so the tower never has more than `max` cups. */
export function cupScale(cups: number, max = 66) {
  for (let step = 1; ; step *= 10) for (const each of [1, 2, 5]) if (cups / (each * step) <= max) return each * step;
}

/** Cups stacked as a pyramid, bottom row first: rows shrink by one; the top row may be short and sits centred. */
export function towerRows(count: number) {
  const rows: number[] = [];
  let width = Math.ceil((Math.sqrt(8 * count + 1) - 1) / 2);
  for (let left = count; left > 0; width--) { rows.push(Math.min(width, left)); left -= width; }
  return rows;
}

export type Result = {
  taka: number;
  cups: number;
  others: Array<{ id: UnitId; count: number; text: string }>;
  each: number;
  drawn: number;
  days: number;
  span: string;
  yearly: number;
  line: string;
};

/** Whole cups only: you can't buy 0.7 of a cup at the stall. Null while a foreign rate is missing. */
export function compute(hisab: Hisab): Result | null {
  const value = scaled(hisab);
  if (value === null) return null;
  const count = (id: UnitId) => Math.floor(value / (hisab.prices[id] * 10_000));
  const cups = count("cha");
  const each = cupScale(cups);
  const days = Math.floor(cups / hisab.perDay);
  return {
    taka: value / 10_000,
    cups,
    others: units.filter(unit => unit.id !== "cha").map(unit => ({ id: unit.id, count: count(unit.id), text: bn(count(unit.id)) + unit.count })),
    each,
    drawn: cups ? Math.max(1, Math.round(cups / each)) : 0,
    days,
    span: spanLine(hisab.perDay, days),
    yearly: hisab.perDay * hisab.prices.cha * 365,
    line: humanLine(cups, days),
  };
}

export function spanLine(perDay: number, days: number) {
  const start = `দিনে ${bn(perDay)} কাপ খেলে`;
  if (days < 1) return `${start} এক দিনও চলবে না`;
  if (days < 60) return `${start} চলবে ${bn(days)} দিন`;
  if (days < 730) return `${start} চলবে প্রায় ${bn(Math.round(days / 30))} মাস`;
  return `${start} চলবে প্রায় ${bn(Math.round(days / 365))} বছর`;
}

/** The human line comes from how long the cups would last at the person's own cups-a-day. */
export function humanLine(cups: number, days: number) {
  if (cups < 1) return "এক কাপও হলো না! মামা, বাকি রাখো?";
  if (days < 1) return "আজকের আড্ডাটা হয়ে গেল।";
  if (days < 7) return "এক সপ্তাহের বিকেলগুলো চায়ে চায়ে।";
  if (days < 60) return "এক মাসের বিকেল টং-এর বেঞ্চেই কেটে যাবে।";
  if (days < 365) return "কয়েক মাস টং-এর বেঞ্চে বসা যাবে।";
  if (days < 730) return "এক বছরের আড্ডা এক জিনিসে।";
  if (days < 365 * 80) return "বছরের পর বছর, রোজ বিকেলের চা।";
  return "এক জীবনেও এত চা খেয়ে শেষ করা যাবে না!";
}

export function amountText(hisab: Hisab, result: Result | null) {
  if (hisab.currency === "bdt") return `${bn(hisab.amount)} টাকা`;
  return `${bn(hisab.amount)} ${currencyLabel(hisab.currency)}${result ? ` (${bn(Math.round(result.taka))} টাকা)` : ""}`;
}

export function caption(hisab: Hisab, result: Result) {
  const what = hisab.label ? `${hisab.label}: ${amountText(hisab, result)}` : amountText(hisab, result);
  return `${what} = ${bn(result.cups)} কাপ চা! ${result.line} তোমার শখের জিনিস কত কাপ চা?`;
}

export function previewTitle(hisab: Hisab) {
  const result = compute(hisab);
  const cups = result ? `${bn(result.cups)} কাপ চা` : "কত কাপ চা?";
  return `${hisab.label || amountText(hisab, result)} = ${cups}`;
}

const priceCode = (prices: Prices) => units.map(unit => `${unit.id}${prices[unit.id]}`).join(",");

/** "#a=5000&u=cha10,singara10,riksha50&d=2[&c=sar&r=32.5][&n=…]": plain Latin digits so the link stays short. */
export function shareHash(hisab: Hisab) {
  const params = new URLSearchParams({ a: String(hisab.amount), u: priceCode(hisab.prices), d: String(hisab.perDay) });
  if (hisab.currency !== "bdt" && hisab.rate !== null) { params.set("c", hisab.currency); params.set("r", String(hisab.rate)); }
  const label = cleanLabel(hisab.label);
  if (label) params.set("n", label);
  return "#" + params.toString();
}

const plain = (raw: string | null) => raw && /^\d{1,10}(\.\d{1,2})?$/.test(raw) ? Number(raw) : NaN;

export function parseShareHash(hash: string): Hisab | null {
  if (hash.length > 400) return null;
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const currency = currencies.find(item => item.id === params.get("c"))?.id ?? "bdt";
  const amount = plain(params.get("a"));
  const rate = currency === "bdt" ? null : plain(params.get("r"));
  if (!validAmount(amount, currency) || (currency !== "bdt" && !validRate(rate))) return null;
  const prices = { ...DEFAULT_PRICES };
  for (const part of (params.get("u") ?? "").split(",")) {
    const match = /^([a-z]+)(\d{1,6})$/.exec(part);
    const unit = units.find(item => item.id === match?.[1]);
    if (unit && validPrice(Number(match![2]))) prices[unit.id] = Number(match![2]);
  }
  const perDay = Number(params.get("d"));
  return { amount, currency, rate, prices, perDay: validPerDay(perDay) ? perDay : DEFAULT_HISAB.perDay, label: cleanLabel(params.get("n") ?? "") };
}
