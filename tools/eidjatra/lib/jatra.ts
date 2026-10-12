// Pure state, words and tally maths for ঈদযাত্রা. Only the person's own trip is used: no traffic data, no schedules, no navigation.
import { possessive } from "../../../shared/bangla";

// The eight divisions of Bangladesh (Mymensingh since 2015): https://en.wikipedia.org/wiki/Divisions_of_Bangladesh , https://en.wikipedia.org/wiki/Mymensingh_Division
// `code` is part of the tally ids: once counts exist, never rename one.
export const divisions = [
  { id: "dhaka", code: "dha", label: "ঢাকা" },
  { id: "chattogram", code: "ctg", label: "চট্টগ্রাম" },
  { id: "rajshahi", code: "raj", label: "রাজশাহী" },
  { id: "khulna", code: "khu", label: "খুলনা" },
  { id: "barishal", code: "bar", label: "বরিশাল" },
  { id: "sylhet", code: "syl", label: "সিলেট" },
  { id: "rangpur", code: "ran", label: "রংপুর" },
  { id: "mymensingh", code: "mym", label: "ময়মনসিংহ" },
] as const;

export const modes = [
  { id: "bus", label: "বাস", by: "বাসে" },
  { id: "train", label: "ট্রেন", by: "ট্রেনে" },
  { id: "launch", label: "লঞ্চ", by: "লঞ্চে" },
  { id: "car", label: "প্রাইভেট গাড়ি", by: "প্রাইভেট গাড়িতে" },
] as const;

export type DivisionId = (typeof divisions)[number]["id"];
export type ModeId = (typeof modes)[number]["id"];
export type Trip = { from: DivisionId; to: DivisionId; mode: ModeId; hours: number; onTheWay: boolean; name: string };

export const HOURS = { min: 1, max: 48 } as const;
export const MAX_NAME = 20;
export const defaults: Trip = { from: "dhaka", to: "rangpur", mode: "bus", hours: 14, onTheWay: false, name: "" };

const numbers = new Intl.NumberFormat("bn-BD");
export const bn = (value: number) => numbers.format(value);
export const clampHours = (value: number) => Math.min(HOURS.max, Math.max(HOURS.min, Math.round(value)));
export const division = (id: DivisionId) => divisions.find(item => item.id === id)!;
export const mode = (id: ModeId) => modes.find(item => item.id === id)!;
const isDivision = (id: string | null): id is DivisionId => divisions.some(item => item.id === id);
const isMode = (id: string | null): id is ModeId => modes.some(item => item.id === id);

export function cleanName(name: string) {
  // NFC so the same name typed on two keyboards matches; strip control and bidi-override characters so a link can't scramble the card.
  return name.normalize("NFC").replace(/[\u0000-\u001f\u007f‪-‮⁦-⁩]/g, "").trim().replace(/\s+/g, " ").slice(0, MAX_NAME).trim();
}

/** Reads a number typed with Bangla or Latin digits ("১৪", "14"); NaN when there are no digits. */
export function readDigits(text: string) {
  const latin = text.replace(/[০-৯]/g, digit => String(digit.charCodeAt(0) - 0x09e6)).replace(/\D/g, "");
  return latin ? Number(latin.slice(0, 4)) : NaN;
}

export function shareHash(trip: Trip) {
  const params = new URLSearchParams({ f: trip.from, t: trip.to, m: trip.mode, h: String(clampHours(trip.hours)) });
  if (trip.onTheWay) params.set("s", "pothe");
  const name = cleanName(trip.name);
  if (name) params.set("n", name);
  return "#" + params.toString();
}

/** A shared trip, or null for anything that isn't one (including in-page anchors like #result). Out-of-range hours are capped. */
export function parseShareHash(hash: string): Trip | null {
  if (hash.length > 600) return null;
  let params: URLSearchParams;
  try { params = new URLSearchParams(hash.replace(/^#/, "")); } catch { return null; }
  const from = params.get("f"), to = params.get("t"), how = params.get("m"), hours = params.get("h") ?? "";
  if (!isDivision(from) || !isDivision(to) || !isMode(how) || !/^\d{1,4}$/.test(hours)) return null;
  return { from, to, mode: how, hours: clampHours(Number(hours)), onTheWay: params.get("s") === "pothe", name: cleanName(params.get("n") ?? "") };
}

/** "ঢাকা → রংপুর"; a trip inside one division reads "ঢাকা → ঢাকা বিভাগের বাড়ি". */
export function routeLabel({ from, to }: Pick<Trip, "from" | "to">) {
  return from === to ? `${division(from).label} → ${division(to).label} বিভাগের বাড়ি` : `${division(from).label} → ${division(to).label}`;
}

/** "ঢাকা থেকে রংপুর", for sentences. */
export function routeWords({ from, to }: Pick<Trip, "from" | "to">) {
  return from === to ? `${division(from).label} থেকে ${division(to).label} বিভাগেরই বাড়িতে` : `${division(from).label} থেকে ${division(to).label}`;
}

export const tripLine = (trip: Trip) => `${mode(trip.mode).by} ${bn(trip.hours)} ঘণ্টা${trip.onTheWay ? " ধরে পথে" : " · বাড়ি পৌঁছেছি"}`;

/** The warm line on the card, picked from the person's own hours. */
export function humanLine({ hours, onTheWay, mode: how }: Trip) {
  if (onTheWay) return hours >= 10 ? "অনেকটা পথ গেছে। ব্যাগটা একবার গুনে নাও।" : "আর একটু! বাড়িতে চুলায় হাঁড়ি চড়ে গেছে।";
  if (hours > 20) return "প্রায় এক দিনের পথ। পৌঁছে আগে এক গ্লাস পানি।";
  if (hours > 12) return "লম্বা পথ, শেষে মায়ের হাতের রান্না।";
  if (hours > 7) return how === "launch" ? "রাতভর নদী, ভোরে ঘাটে নামতেই বাড়ির গন্ধ।" : "পথটা লম্বা, তবু জানালার বাইরে সবুজ দেখতে দেখতেই শেষ।";
  if (hours > 3) return "এক ঘুমেই পথ শেষ, চোখ খুলেই বাড়ির উঠান।";
  return "চোখের পলকে বাড়ি। বাকিরা একটু হিংসা করবে।";
}

/** A joke estimate, said as one: about one "কতদূর এলি?" call from home every two hours. */
export const calls = (hours: number) => Math.max(1, Math.round(hours / 2));
export const callLine = (trip: Trip) => `${trip.onTheWay ? "এ পর্যন্ত" : "পথে"} বাড়ি থেকে ‘কতদূর এলি?’ ফোন: আন্দাজে ${bn(calls(trip.hours))} বার`;

// One small note scribbled beside the road, by vehicle. Gentle road humour only: no traffic, no accidents.
const notes: Record<ModeId, readonly string[]> = {
  bus: ["সুপারভাইজার: ‘আর ১০ মিনিট!’", "হাইওয়ে হোটেলে পরোটা-চা", "পাশের সিটের ঘুমন্ত মাথা", "ছাদে বাঁধা ব্যাগ গুনছি"],
  train: ["জানালায় ধানখেত", "ঝালমুড়ি-ওয়ালা উঠল", "স্টেশনে এক কাপ চা", "ঝিকঝিক শুনে ঘুম"],
  launch: ["ডেকে চাদর পেতে ঘুম", "নদীর বাতাসে চা", "ভোরে ঘাটে নামা", "জানালায় জেলে নৌকা"],
  car: ["গাড়িতে পুরোনো গান", "পেছনের সিটে ঘুম", "পথের ধারে ডাব", "পেছন থেকে: ‘আর কতক্ষণ?’"],
};
export const roadNote = (trip: Trip) => notes[trip.mode][trip.hours % notes[trip.mode].length];

export function caption(trip: Trip) {
  const how = `${mode(trip.mode).by} ${bn(trip.hours)} ঘণ্টা`;
  return trip.onTheWay
    ? `ঈদযাত্রা চলছে! ${routeWords(trip)}, ${how} ধরে পথে। তোমার বাড়ি যেতে কত ঘণ্টা লাগল?`
    : `ঈদযাত্রা শেষ, শেষমেশ বাড়ি! ${routeWords(trip)}, ${how}। ${humanLine(trip)} তোমার বাড়ি যেতে কত ঘণ্টা লাগল?`;
}

export function previewTitle(trip: Trip) {
  const who = trip.name ? `${possessive(cleanName(trip.name))} ঈদযাত্রা` : "ঈদযাত্রা";
  return `${who}: ${routeLabel(trip)}, ${mode(trip.mode).by} ${bn(trip.hours)} ঘণ্টা${trip.onTheWay ? " ধরে পথে" : ""}। তোমার কত ঘণ্টা?`;
}

// ---- Tally: "যারা জানিয়েছে" averages per route and vehicle ----
// One fixed event id per Eid. Bump it before each Eid's travel week (eid-ul-fitr-2027 → eid-ul-adha-2027 → eid-ul-fitr-2028 …)
// so "এবার" never mixes last Eid's roads with this one's. The API only accepts the current event's ids.
// The tally keeps one vote per browser per tool, so voting in a new Eid replaces that browser's old vote; old events are never shown.
export const EVENT = "eid-ul-fitr-2027";
// Fixed ids: once counts exist, never change a bucket's range. `mid` is the hour used for the rough average.
export const hourBuckets = [
  { id: "h1", max: 3, mid: 2 },
  { id: "h2", max: 6, mid: 5 },
  { id: "h3", max: 9, mid: 8 },
  { id: "h4", max: 12, mid: 11 },
  { id: "h5", max: 18, mid: 15.5 },
  { id: "h6", max: Infinity, mid: 22 },
] as const;
/** Fewer people than this on one route and vehicle and the average is noise (or one family's joke), so it stays hidden. */
export const MIN_SAMPLE = 50;

export const bucketOf = (hours: number) => hourBuckets.find(bucket => hours <= bucket.max)!;
const routeKey = (from: DivisionId, to: DivisionId, how: ModeId) => `${EVENT}:${division(from).code}-${division(to).code}-${how}`;
export const tallyId = (trip: Pick<Trip, "from" | "to" | "mode" | "hours">) => `${routeKey(trip.from, trip.to, trip.mode)}-${bucketOf(trip.hours).id}`;
// 8 × 8 × 4 × 6 = 1536 ids for the current Eid only; a vote is always exactly one of them.
export const tallyIds = divisions.flatMap(from => divisions.flatMap(to => modes.flatMap(how => hourBuckets.map(bucket => `${routeKey(from.id, to.id, how.id)}-${bucket.id}`))));

export type Average = { hours: number; people: number };

/** The rough average for this route and vehicle from bucket counts, or null below MIN_SAMPLE. */
export function routeAverage(counts: Record<string, number>, trip: Pick<Trip, "from" | "to" | "mode">): Average | null {
  const key = routeKey(trip.from, trip.to, trip.mode);
  let people = 0, sum = 0;
  for (const bucket of hourBuckets) {
    const count = Math.max(0, counts[`${key}-${bucket.id}`] ?? 0);
    people += count;
    sum += count * bucket.mid;
  }
  return people >= MIN_SAMPLE ? { hours: Math.round(sum / people), people } : null;
}

export const averageLine = (trip: Trip, average: Average) => `যারা জানিয়েছে: এবার এই পথে ${mode(trip.mode).by} গড়ে প্রায় ${bn(average.hours)} ঘণ্টা (${bn(average.people)} জন)`;

export function compareLine(hours: number, average: Average) {
  const gap = hours - average.hours;
  if (gap >= 2) return `গড়ের চেয়ে ${bn(gap)} ঘণ্টা বেশি। ধৈর্যের একটা মেডেল তোমার পাওনা।`;
  if (gap <= -2) return `গড়ের চেয়ে ${bn(-gap)} ঘণ্টা আগে বাড়ি। কপাল ভালো।`;
  return "প্রায় সবার মতোই। এই পথের চেনা গল্প।";
}

export { possessive };
