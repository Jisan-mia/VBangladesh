// Pure arithmetic and link state for জ্যামে জীবন. Only the person's own numbers are used: no city-wide statistics.
export const limits = {
  minutes: { min: 10, max: 720, step: 10 },
  days: { min: 1, max: 7, step: 1 },
  years: { min: 1, max: 60, step: 1 },
} as const;
export const MAX_ROUTE = 20;
export const WEEKS_PER_YEAR = 52;

export type Commute = { minutes: number; days: number; years: number; route: string };
export const defaults: Commute = { minutes: 90, days: 6, years: 5, route: "গুলিস্তান — মিরপুর" };

// Every equivalent states its assumption on the page, so the arithmetic can be checked by hand.
export const equivalents = [
  { id: "cha", minutes: 15, unit: " কাপ চা", short: " কাপ চা", basis: "টংয়ে এক কাপ চা আর গল্প ১৫ মিনিট" },
  { id: "natok", minutes: 45, unit: "টা নাটক", short: "টা নাটক", basis: "একটা নাটক ৪৫ মিনিট" },
  { id: "boi", minutes: 300, unit: "টা উপন্যাস", short: "টা উপন্যাস", basis: "একটা উপন্যাস পড়তে ৫ ঘণ্টা" },
  { id: "odi", minutes: 480, unit: "টা ওয়ানডে ম্যাচ", short: "টা ওয়ানডে", basis: "পুরো একটা ওয়ানডে ম্যাচ ৮ ঘণ্টা" },
] as const;

// Tally buckets over daily minutes. Fixed ids: once links are public, never rename them.
export const buckets = [
  { id: "m0", max: 29, label: "৩০ মিনিটের কম" },
  { id: "m1", max: 59, label: "৩০–৫৯ মিনিট" },
  { id: "m2", max: 89, label: "১ ঘণ্টা থেকে দেড় ঘণ্টা" },
  { id: "m3", max: 119, label: "দেড় থেকে ২ ঘণ্টা" },
  { id: "m4", max: 179, label: "২ থেকে ৩ ঘণ্টা" },
  { id: "m5", max: Infinity, label: "৩ ঘণ্টা বা তার বেশি" },
] as const;
export const tallyIds = buckets.map(item => item.id);
export const bucketOf = (minutes: number) => buckets.find(item => minutes <= item.max)!;
/** Buckets m2 and up are "more than an hour a day" (60 minutes or more). */
export const overAnHour = ["m2", "m3", "m4", "m5"] as const;

const numbers = new Intl.NumberFormat("bn-BD");
export const bn = (value: number) => numbers.format(value);

export const clamp = (value: number, { min, max }: { min: number; max: number }) => Math.min(max, Math.max(min, Math.round(value)));

/** Reads a number typed with Bangla or Latin digits ("৯০", "90"); NaN when there are no digits. */
export function readDigits(text: string) {
  const latin = text.replace(/[০-৯]/g, digit => String(digit.charCodeAt(0) - 0x09e6)).replace(/\D/g, "");
  return latin ? Number(latin.slice(0, 6)) : NaN;
}

export function cleanRoute(route: string) {
  // NFC so the same route typed on two keyboards matches; strip control and bidi-override characters so a link can't scramble the card.
  return route.normalize("NFC").replace(/[\u0000-\u001f\u007f‪-‮⁦-⁩]/g, "").trim().replace(/\s+/g, " ").slice(0, MAX_ROUTE).trim();
}

export type Result = {
  totalMinutes: number;
  hours: number;
  days: number;
  /** The big number as shown: whole days, or hours when it's under a day. */
  value: string;
  unit: "দিন" | "ঘণ্টা";
  counts: Array<{ id: string; count: number; text: string; short: string; basis: string }>;
};

export function calculate({ minutes, days, years }: Commute): Result {
  const totalMinutes = minutes * days * WEEKS_PER_YEAR * years;
  const hours = totalMinutes / 60;
  const fullDays = hours / 24;
  const roundedDays = Math.round(fullDays);
  const inDays = roundedDays >= 1;
  return {
    totalMinutes,
    hours,
    days: fullDays,
    value: bn(inDays ? roundedDays : Math.round(hours)),
    unit: inDays ? "দিন" : "ঘণ্টা",
    counts: equivalents.map(item => {
      const count = Math.floor(totalMinutes / item.minutes);
      return { id: item.id, count, text: bn(count) + item.unit, short: bn(count) + item.short, basis: item.basis };
    }),
  };
}

export const habitLine = ({ minutes, days, years }: Commute) => `রোজ ${duration(minutes)} · সপ্তাহে ${bn(days)} দিন · ${bn(years)} বছর`;

export function duration(minutes: number) {
  const hours = Math.floor(minutes / 60), rest = minutes % 60;
  if (!hours) return `${bn(rest)} মিনিট`;
  if (!rest) return `${bn(hours)} ঘণ্টা`;
  return `${bn(hours)} ঘণ্টা ${bn(rest)} মিনিট`;
}

/** A warm, funny line picked from the person's own numbers. */
export function humanLine(commute: Commute) {
  const { days } = calculate(commute);
  if (days >= 365) return `জীবনের ${bn(Math.floor(days / 365))} বছরের বেশি জ্যামে! বাসের সিটটাই এখন দ্বিতীয় বাড়ি।`;
  if (commute.minutes >= 180) return "রোজ এত সময়! হেলপার মামাও এখন নাম ধরে ডাকে।";
  if (days >= 100) return "এত সময়ে একটা ভাষা শেখা যেত, অথবা অনেক ঘুম।";
  if (days >= 30) return `প্রায় ${bn(Math.round(days / 30))} মাস! জানালার সিটটা এখন পুরোনো বন্ধু।`;
  if (days >= 7) return `${bn(Math.floor(days / 7))} সপ্তাহের ছুটির সমান, শুধু সিগন্যালে বসে।`;
  return "জ্যাম কম, কপাল ভালো। বাকিরা একটু হিংসা করবে।";
}

export function caption(commute: Commute) {
  const result = calculate(commute);
  return `হিসাব করে দেখলাম, জ্যামে আমার জীবনের ${result.value} ${result.unit} চলে গেছে! মানে ${result.counts[0].text}। তোমার কত দিন?`;
}

export function previewTitle(commute: Commute) {
  const result = calculate(commute);
  const route = cleanRoute(commute.route);
  return `জ্যামে জীবনের ${result.value} ${result.unit}${route ? `, ${route} রুটে` : ""}। তোমার কত?`;
}

export function shareHash(commute: Commute) {
  const params = new URLSearchParams({ m: String(clamp(commute.minutes, limits.minutes)), d: String(clamp(commute.days, limits.days)), y: String(clamp(commute.years, limits.years)) });
  const route = cleanRoute(commute.route);
  if (route) params.set("r", route);
  return "#" + params.toString();
}

const whole = (text: string | null) => text !== null && /^\d{1,6}$/.test(text) ? Number(text) : NaN;

/** A shared card, or null for anything that isn't one (including in-page anchors like #result). Out-of-range numbers are capped. */
export function parseShareHash(hash: string): Commute | null {
  let params: URLSearchParams;
  try { params = new URLSearchParams(hash.replace(/^#/, "")); } catch { return null; }
  const minutes = whole(params.get("m")), years = whole(params.get("y"));
  if (Number.isNaN(minutes) || Number.isNaN(years)) return null;
  const days = params.has("d") ? whole(params.get("d")) : defaults.days;
  if (Number.isNaN(days)) return null;
  const route = params.get("r") ?? "";
  if (route.length > 200) return null;
  return { minutes: clamp(minutes, limits.minutes), days: clamp(days, limits.days), years: clamp(years, limits.years), route: cleanRoute(route) };
}
