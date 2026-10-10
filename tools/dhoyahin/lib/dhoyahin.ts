import { possessive } from "../../../shared/bangla";

export { possessive };
export const MAX_NAME = 20;
export const MIN_STICKS = 1;
export const MAX_STICKS = 80;
export const MIN_PRICE = 1;
export const MAX_PRICE = 200;
/** An editable example, not a market price: people type what they paid. */
export const DEFAULT_PRICE = 15;
export const DEFAULT_STICKS = 10;
export const STICK_CHIPS = [5, 10, 20] as const;
/** Oldest quit date a link may carry; a planned date may sit up to a year ahead. */
const MIN_DATE = "1980-01-01";
const MAX_AHEAD_DAYS = 366;
const DAY = 86_400_000;

/*
 * Facts shown on the page (checked 10 Oct 2026). Nothing else here is a health claim; money is plain arithmetic.
 * - WHO Q&A "Tobacco: Health benefits of smoking cessation" (25 Feb 2020): people of all ages, even after
 *   smoking-related illness, still benefit from quitting.
 *   https://www.who.int/news-room/questions-and-answers/item/tobacco-health-benefits-of-smoking-cessation
 * - WHO fact sheet "Tobacco" (26 Jun 2026): counselling and medication can more than double the chance of quitting.
 *   https://www.who.int/news-room/fact-sheets/detail/tobacco
 * No quitline is listed: a WHO tender (Aug 2026) to set up Bangladesh's national quitline suggests none is running yet,
 * and the numbers found online could not be confirmed.
 */
export const facts = [
  { text: "যেকোনো বয়সে ছাড়লেই উপকার, এমনকি অসুখ ধরা পড়ার পরেও।", source: "বিশ্ব স্বাস্থ্য সংস্থা (WHO), ধূমপান ছাড়ার উপকার নিয়ে প্রশ্নোত্তর", url: "https://www.who.int/news-room/questions-and-answers/item/tobacco-health-benefits-of-smoking-cessation" },
  { text: "কাউন্সেলিং আর ওষুধের সাহায্য নিলে ছাড়তে পারার সম্ভাবনা দ্বিগুণেরও বেশি হয়।", source: "বিশ্ব স্বাস্থ্য সংস্থা (WHO), তামাক ফ্যাক্টশিট", url: "https://www.who.int/news-room/fact-sheets/detail/tobacco" },
] as const;

// Ids travel in links: never rename or remove one, only append.
export const cheers = [
  { id: "gorbito", label: "তোমাকে নিয়ে গর্বিত" },
  { id: "pashe", label: "চালিয়ে যাও, পাশে আছি" },
  { id: "parbe", label: "জানতাম, তুমি পারবে" },
  { id: "cha", label: "চায়ের দাওয়াত রইল, সিগারেট ছাড়া" },
  { id: "bhalobasha", label: "অনেক ভালোবাসা রইল" },
] as const;

export const relations = [
  { id: "ammu", label: "আম্মু" },
  { id: "abbu", label: "আব্বু" },
  { id: "bhai", label: "ভাই" },
  { id: "bon", label: "বোন" },
  { id: "bondhu", label: "বন্ধু" },
  { id: "bou", label: "বউ" },
  { id: "shami", label: "স্বামী" },
  { id: "chhele", label: "ছেলে" },
  { id: "meye", label: "মেয়ে" },
] as const;

export type CheerId = (typeof cheers)[number]["id"];
export type RelationId = (typeof relations)[number]["id"];
export type Cheer = { line: CheerId; from: RelationId };
export type Quit = { date: string; sticks: number; price: number; name: string; cheer?: Cheer };

const numbers = new Intl.NumberFormat("bn-BD", { maximumFractionDigits: 1 });
/** Bangla digits with lakh grouping: ৯,০০০ · ১,২০,০০০. */
export const bn = (value: number) => numbers.format(value);

const pad = (value: number) => String(value).padStart(2, "0");
/** The phone's own calendar day: a smoke-free day ends at the person's midnight, wherever they live. */
export const localToday = (now: Date) => `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
/** Dhaka's day, for server-side link previews where there is no phone clock. */
export const dhakaToday = (now: Date) => new Date(now.getTime() + 6 * 3_600_000).toISOString().slice(0, 10);

export function isDate(text: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(text) && new Date(text + "T00:00:00Z").toISOString().slice(0, 10) === text;
}
export const daysBetween = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / DAY);
export const addDays = (date: string, days: number) => new Date(Date.parse(date) + days * DAY).toISOString().slice(0, 10);
export const maxDate = (today: string) => addDays(today, MAX_AHEAD_DAYS);
export const MIN_QUIT_DATE = MIN_DATE;
export const inRange = (date: string, today: string) => isDate(date) && date >= MIN_DATE && date <= maxDate(today);

export function cleanName(name: string) {
  // NFC so one name has one spelling; strip control and bidi-override characters so a link can't scramble the card.
  return name.normalize("NFC").replace(/[\u0000-\u001f\u007f-\u009f‎‏‪-‮⁦-⁩]/g, " ").replace(/\s+/g, " ").trim().slice(0, MAX_NAME).trim();
}

export const cleanSticks = (value: number) => Number.isFinite(value) ? Math.min(MAX_STICKS, Math.max(MIN_STICKS, Math.round(value))) : DEFAULT_STICKS;
export const cleanPrice = (value: number) => Number.isFinite(value) ? Math.min(MAX_PRICE, Math.max(MIN_PRICE, Math.round(value * 10) / 10)) : DEFAULT_PRICE;

export function stateOf({ date, sticks, price, name, cheer }: Quit) {
  const params = new URLSearchParams({ d: date, k: String(cleanSticks(sticks)), p: String(cleanPrice(price)) });
  const shown = cleanName(name);
  if (shown) params.set("n", shown);
  if (cheer) { params.set("c", cheer.line); params.set("w", cheer.from); }
  return params.toString();
}

const number = (text: string | null, pattern: RegExp) => text && pattern.test(text) ? Number(text) : NaN;

/** A link's quit state, or null when the date is missing or out of range. Out-of-range numbers are clamped, not trusted. */
export function parseState(hash: string, today: string): Quit | null {
  let params: URLSearchParams;
  try { params = new URLSearchParams(hash.replace(/^#/, "").slice(0, 600)); } catch { return null; }
  const date = params.get("d") ?? "";
  if (!inRange(date, today)) return null;
  const line = cheers.find(item => item.id === params.get("c"))?.id;
  const from = relations.find(item => item.id === params.get("w"))?.id;
  return {
    date,
    sticks: cleanSticks(number(params.get("k"), /^\d{1,3}$/)),
    price: cleanPrice(number(params.get("p"), /^\d{1,3}(\.\d{1,2})?$/)),
    name: cleanName(params.get("n") ?? ""),
    ...(line && from ? { cheer: { line, from } } : {}),
  };
}

/** Whole years and months on the calendar, e.g. "১ বছর ২ মাস"; empty under a month. */
export function spanText(from: string, to: string) {
  const [y1, m1, d1] = from.split("-").map(Number);
  const [y2, m2, d2] = to.split("-").map(Number);
  let months = (y2 - y1) * 12 + (m2 - m1) - (d2 < d1 ? 1 : 0);
  if (months < 1) return "";
  const years = Math.floor(months / 12);
  months %= 12;
  return [years && `${bn(years)} বছর`, months && `${bn(months)} মাস`].filter(Boolean).join(" ");
}

const dateFormat = new Intl.DateTimeFormat("bn-BD", { day: "numeric", month: "long", timeZone: "UTC" });
export const dateLine = (date: string) => dateFormat.format(new Date(date + "T00:00:00Z"));

/** The human line, by days smoke-free. Never a health claim, never a scolding. */
export function humanLine(days: number) {
  if (days < 0) return "দিন ঠিক হয়ে গেছে। সেদিন থেকে নতুন শুরু।";
  if (days === 0) return "প্রথম দিনটাই সবচেয়ে কঠিন, আর তুমি সেটা পার করছ।";
  if (days < 7) return "প্রতিটা দিন একটা নতুন পাতা। চারাটা বাড়ছে।";
  if (days < 14) return "এক সপ্তাহ পার! পাতাগুলো একবার গুনে দেখো।";
  if (days < 30) return "দুই সপ্তাহ পেরিয়ে গেল। শেকড় এখন শক্ত হচ্ছে।";
  if (days < 60) return "এক মাস! চারাটা এখন গাছ।";
  if (days < 90) return "দুই মাস! টবটা এখন ছোট ছোট লাগছে।";
  if (days < 180) return "তিন মাস পেরিয়ে গেছে, গাছে ফুল এসেছে।";
  if (days < 365) return "ছয় মাস! এই গাছটা তোমার জেদের সাক্ষী।";
  return "এক বছরেরও বেশি! বারান্দার সবচেয়ে সুন্দর গাছটা তোমার।";
}

export type Tally = {
  /** Whole days since the quit date; negative while a planned date is still ahead. */
  days: number;
  skipped: number;
  saved: number;
  perDay: number;
  span: string;
  line: string;
};

export function tally(quit: Quit, today: string): Tally {
  const days = daysBetween(quit.date, today);
  const sticks = cleanSticks(quit.sticks);
  const price = cleanPrice(quit.price);
  const done = Math.max(days, 0);
  return { days, skipped: done * sticks, saved: Math.round(done * sticks * price), perDay: Math.round(sticks * price * 10) / 10, span: spanText(quit.date, today), line: humanLine(days) };
}

export const cheerLabel = (cheer: Cheer) => cheers.find(item => item.id === cheer.line)!.label;
export const relationLabel = (cheer: Cheer) => relations.find(item => item.id === cheer.from)!.label;

/** The big words on the card and in the counter. */
export function headline(quit: Quit, count: Tally) {
  if (count.days < 0) return { big: `আর ${bn(-count.days)} দিন`, sub: `${dateLine(quit.date)} থেকে ধোঁয়াহীন` };
  if (count.days === 0) return { big: "প্রথম দিন", sub: "আজ থেকে ধোঁয়াহীন" };
  return { big: `${bn(count.days)} দিন`, sub: count.span ? `ধোঁয়াহীন · ${count.span}` : "ধোঁয়াহীন" };
}

/** The two stats under the plant, first person because the quitter posts them. */
export function stats(count: Tally, sticks: number) {
  if (count.days <= 0) return [`দিনে ${bn(cleanSticks(sticks))}টা কম`, `দিনে ${bn(count.perDay)} টাকা বাঁচবে`];
  return [`${bn(count.skipped)}টা সিগারেট খাইনি`, `${bn(count.saved)} টাকা বাঁচল`];
}

export function caption(quit: Quit, count: Tally) {
  if (count.days < 0) return `${dateLine(quit.date)} থেকে সিগারেট ছাড়ছি। পাশে থেকো।`;
  if (count.days === 0) return "আজ থেকে সিগারেট ছাড়লাম। প্রথম দিন, পাশে থেকো।";
  return `${bn(count.days)} দিন হলো, একটাও সিগারেট না। ${bn(count.saved)} টাকা বাঁচল। টবের গাছটা দেখো:`;
}

/** What a family member writes when they send a link back with a cheer tag. */
export function cheerCaption(quit: Quit, count: Tally, cheer: Cheer) {
  const who = quit.name ? `${quit.name}, ` : "";
  const when = count.days > 0 ? `${bn(count.days)} দিন! ` : "";
  return `${who}${when}${cheerLabel(cheer)}। — ${relationLabel(cheer)}`;
}

export function previewTitle(quit: Quit, today: string) {
  const count = tally(quit, today);
  const who = quit.name || "এক বন্ধু";
  const base = count.days < 0 ? `${who} ${dateLine(quit.date)} থেকে সিগারেট ছাড়ছে` : count.days === 0 ? `${who} আজ থেকে সিগারেট ছেড়েছে` : `${quit.name ? possessive(quit.name) : "এক বন্ধুর"} ${bn(count.days)} দিন ধোঁয়াহীন, ${bn(count.saved)} টাকা বাঁচল`;
  return quit.cheer ? `${relationLabel(quit.cheer)} লিখেছে: ${cheerLabel(quit.cheer)} — ${base}` : base;
}

/* ---------- the plant: one geometry for the page's SVG and the card's canvas ---------- */

/** Leaf outline pointing along +x, length 1. */
export const LEAF_PATH = "M0 0C.22-.3.62-.34 1 0 .62.34.22.3 0 0Z";
export const PLANT_LEAVES = 30;
const SPACING = 11;

export type Leaf = { x: number; y: number; angle: number; size: number; fresh: boolean };
export type Flower = { x: number; y: number; stalk: number; side: number };
export type Plant = { stem: number; leaves: Leaf[]; flowers: Flower[]; seed: boolean };

/**
 * One leaf for each smoke-free day up to a month, then one flower for each month (12 at most).
 * Coordinates: origin at the soil, y grows upward, units are the 400-wide plant box.
 * Every leaf keeps its spot as days pass, so growing only ever adds at the top.
 */
export function plant(days: number): Plant {
  if (days < 0) return { stem: 0, leaves: [], flowers: [], seed: true };
  const count = Math.min(days, PLANT_LEAVES);
  const leaves: Leaf[] = [
    // Two seed leaves are there from day one.
    { x: 0, y: 14, angle: 162, size: 30, fresh: days === 0 },
    { x: 0, y: 14, angle: 18, size: 30, fresh: days === 0 },
  ];
  for (let index = 0; index < count; index++) {
    const side = index % 2 ? -1 : 1;
    const y = 26 + index * SPACING;
    const lean = ((index * 37) % 17) - 8;
    leaves.push({ x: sway(y), y, angle: side > 0 ? 22 + lean : 158 - lean, size: 60 - index * 0.8, fresh: index === count - 1 });
  }
  const stem = count ? 26 + (count - 1) * SPACING + 18 : 22;
  const flowers: Flower[] = [];
  for (let month = 0; month < Math.min(Math.floor(days / 30), 12); month++) {
    // From the top down, alternating sides.
    const index = PLANT_LEAVES - 1 - Math.floor(month * 2.4);
    const y = 26 + index * SPACING + 5;
    flowers.push({ x: sway(y), y, stalk: 26 + (month % 3) * 6, side: month % 2 ? -1 : 1 });
  }
  return { stem, leaves, flowers, seed: false };
}

/** The stem's gentle S-curve, shared by stem and leaf joints. */
export const sway = (y: number) => Math.sin(y / 70) * 10;

export function stemPath(height: number) {
  const points: string[] = [];
  for (let y = 0; y <= height; y += 6) points.push(`${sway(y).toFixed(1)} ${-y}`);
  return "M" + points.join("L");
}

/* ---------- this phone's own progress ---------- */

export const STORAGE_KEY = "dhoyahin-quit";

export function loadQuit(storage: Pick<Storage, "getItem"> | null, today: string): Quit | null {
  try {
    const saved = storage?.getItem(STORAGE_KEY);
    return saved ? parseState(saved, today) : null;
  } catch { return null; }
}

export function saveQuit(storage: Pick<Storage, "setItem"> | null, quit: Quit) {
  // Only the person's own count is kept; a cheer belongs to the link it came in.
  try { storage?.setItem(STORAGE_KEY, stateOf({ ...quit, cheer: undefined })); } catch { /* private mode: the count just won't be remembered */ }
}

/** The clay pot, in the same box (soil line at y=0, SVG y down). A row of lime-wash dots, like a hand-painted মাটির টব. */
export const pot = {
  rim: "M-92 -6h184a6 6 0 0 1 6 6v24a6 6 0 0 1-6 6h-184a6 6 0 0 1-6-6V0a6 6 0 0 1 6-6Z",
  body: "M-80 30h160l-16 118a10 10 0 0 1-10 9h-108a10 10 0 0 1-10-9Z",
  soil: "M-86 0c20-10 152-10 172 0Z",
  wave: "M-74 72q9-9 18 0t18 0 18 0 18 0 18 0 18 0 18 0 18 0",
  dots: [-60, -36, -12, 12, 36, 60].map(x => [x, 104] as const),
  shade: "M30 30h50l-16 118a10 10 0 0 1-10 9H22Z",
} as const;
export const PLANT_BOX = { x: -150, y: -420, width: 300, height: 580 } as const;

/** Terracotta, leaf green and marigold, shared by page and card. */
export const colors = { clay: "#c0582f", clayDeep: "#9c3f1c", soil: "#4a2e1f", stem: "#2f6b2a", leaf: "#3f9a3a", leafDeep: "#2b7a2c", fresh: "#7cc443", petal: "#f29a1f", eye: "#b8461a", lime: "#fff4e6" } as const;
