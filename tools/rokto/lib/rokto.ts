/*
 * How long to wait between whole-blood donations. যাচাই করা: ১১ অক্টোবর ২০২৬.
 *
 * Bangladesh, DGHS Safe Blood Transfusion Programme: অধ্যাপক সৈয়দা মাসুমা রহমান, পরামর্শক, নিরাপদ রক্ত পরিসঞ্চালন
 * কর্মসূচি, স্বাস্থ্য অধিদপ্তর, in Prothom Alo (updated 13 Apr 2024): "একজন সুস্থ, সবল মানুষ চার মাস পরপর রক্ত দিতে
 * পারবেন।" and "নারীদের ক্ষেত্রে সাধারণত ছয় মাস পর রক্ত দিতে বলা হয়।"
 *   https://www.prothomalo.com/lifestyle/health/khsamqr1co
 * WHO, Blood donor selection (2012): minimum 12 weeks for men and 16 weeks for women, as quoted by the 2026 Vox Sanguinis
 * systematic review (the WHO PDF itself would not open as text here).
 *   https://www.who.int/publications/i/item/9789241548519
 *   https://pmc.ncbi.nlm.nih.gov/articles/PMC13356998/
 * So the tool never offers less than 4 months (≥ 120 days, longer than either WHO minimum) and starts on the most
 * conservative figure, 6 months. Eligibility (weight, age, haemoglobin, illness, medicines, pregnancy) is the blood
 * bank's call, never ours: the page says so and judges nothing.
 */
export const INTERVALS = [6, 4] as const;
export type Interval = (typeof INTERVALS)[number];
export const DEFAULT_INTERVAL: Interval = 6;
export const VERIFIED = "১১ অক্টোবর ২০২৬";
// ISO twin of the date above for schema dateModified and sitemap lastmod; bump both together.
export const VERIFIED_ON = "2026-10-11";

export const MAX_NAME_LENGTH = 30;
export const MAX_COUNT = 250;
export const MIN_DATE = "1970-01-01";

// Share links store these ids: append only, never rename.
export const groups = [
  { id: "ap", label: "A+", spoken: "এ পজিটিভ" },
  { id: "an", label: "A−", spoken: "এ নেগেটিভ" },
  { id: "bp", label: "B+", spoken: "বি পজিটিভ" },
  { id: "bn", label: "B−", spoken: "বি নেগেটিভ" },
  { id: "abp", label: "AB+", spoken: "এবি পজিটিভ" },
  { id: "abn", label: "AB−", spoken: "এবি নেগেটিভ" },
  { id: "op", label: "O+", spoken: "ও পজিটিভ" },
  { id: "on", label: "O−", spoken: "ও নেগেটিভ" },
] as const;
export type Group = (typeof groups)[number];
export type GroupId = Group["id"];
const groupOf = (id: string) => groups.find(group => group.id === id);

const grouped = new Intl.NumberFormat("bn-BD");
const plain = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => grouped.format(value);
export const bnPlain = (value: number) => plain.format(value);

export const months = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"] as const;

const pad = (value: number) => String(value).padStart(2, "0");
const parts = (date: string) => date.split("-").map(Number) as [number, number, number];
const utc = (date: string) => { const [y, m, d] = parts(date); return Date.UTC(y, m - 1, d); };

export const toDate = (year: number, month: number, day: number) => `${year}-${pad(month)}-${pad(day)}`;
export const daysInMonth = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate();
export const daysBetween = (from: string, to: string) => Math.round((utc(to) - utc(from)) / 86_400_000);

export function isDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const [y, m, d] = parts(date);
  return m >= 1 && m <= 12 && d >= 1 && d <= daysInMonth(y, m);
}

const dhaka = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit" });
/** Today's date in Bangladesh, whatever the phone's own time zone (diaspora phones included). */
export function todayInDhaka(now = new Date()) {
  const get = (type: string) => dhaka.formatToParts(now).find(part => part.type === type)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/**
 * The same day `count` months later. When that month lacks the day (31 Oct + 4 months), it moves to the 1st of the
 * following month, never back to the month's end, so the date is never early. December has 31 days, so the
 * following month is always in the same year.
 */
export function addMonthsNotEarly(date: string, count: number) {
  const [y, m, d] = parts(date);
  const index = y * 12 + (m - 1) + count;
  const year = Math.floor(index / 12), month = (index % 12) + 1;
  return d <= daysInMonth(year, month) ? toDate(year, month, d) : toDate(year, month + 1, 1);
}

/** "১১ অক্টোবর ২০২৬" */
export function dateText(date: string) {
  const [y, m, d] = parts(date);
  return `${bnPlain(d)} ${months[m - 1]} ${bnPlain(y)}`;
}

export function cleanName(name: string) {
  // NFC, and no control or bidi-override characters, so a shared link can't scramble the card text.
  const flat = name.normalize("NFC").replace(/[\u0000-\u001f\u007f-\u009f‎‏‪-‮⁦-⁩]/g, " ").replace(/\s+/g, " ").trim();
  return Array.from(flat).slice(0, MAX_NAME_LENGTH).join("").trim();
}

export type Donor = { group: GroupId; last: string; count: number; interval: Interval; name: string };

export const validLast = (date: string, today: string) => isDate(date) && date >= MIN_DATE && date <= today;

export function shareHash({ group, last, count, interval, name }: Donor) {
  const params = new URLSearchParams({ g: group, d: last, c: String(count), i: String(interval) });
  const shown = cleanName(name);
  if (shown) params.set("n", shown);
  return "#" + params.toString();
}

export function parseShareHash(hash: string, today = todayInDhaka()): Donor | null {
  if (hash.length > 400) return null;
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const group = groupOf(params.get("g") ?? "");
  const last = params.get("d") ?? "";
  const countText = params.get("c") ?? "";
  const count = Number(countText);
  if (!group || !validLast(last, today) || !/^[1-9]\d{0,2}$/.test(countText) || count > MAX_COUNT) return null;
  // An unknown interval falls back to the conservative one rather than rejecting the whole card.
  const interval = INTERVALS.find(value => String(value) === params.get("i")) ?? DEFAULT_INTERVAL;
  return { group: group.id, last, count, interval, name: cleanName(params.get("n") ?? "") };
}

/** The page talks to "you"; the card, which friends read, says "I". */
type Voice = "you" | "me";
const lines: Array<{ upTo: number; you: string; me: string }> = [
  { upTo: 1, you: "প্রথমবার! কারও জীবনে তুমি প্রথম ফোঁটা।", me: "প্রথমবার! কারও জীবনে আমি প্রথম ফোঁটা।" },
  { upTo: 3, you: "সুঁইয়ের ভয়টা হেরে গেছে, জিতে গেছে মনটা।", me: "সুঁইয়ের ভয়টা হেরে গেছে, জিতে গেছে মনটা।" },
  { upTo: 9, you: "কোনো এক হাসপাতালের করিডোরে কেউ অপেক্ষা করছিল, আর তুমি গিয়েছিলে।", me: "কোনো এক হাসপাতালের করিডোরে কেউ অপেক্ষা করছিল, আর আমি গিয়েছিলাম।" },
  { upTo: 24, you: "দুই অঙ্ক পেরিয়ে গেছে! এটা এখন আর শখ না, পরিচয়।", me: "দুই অঙ্ক পেরিয়ে গেছে! এটা এখন আর শখ না, পরিচয়।" },
  { upTo: 49, you: "ব্লাড ব্যাংকের লোকেরা এখন নিশ্চয়ই তোমাকে নাম ধরে চেনে।", me: "ব্লাড ব্যাংকের লোকেরা এখন নিশ্চয়ই আমাকে নাম ধরে চেনে।" },
  { upTo: Infinity, you: "কত অচেনা পরিবারের গল্পে তুমি আছ, নিজেও জানো না।", me: "কত অচেনা পরিবারের গল্পে আমি আছি, নিজেও জানি না।" },
];
export const humanLine = (count: number, voice: Voice = "you") => lines.find(line => count <= line.upTo)![voice];

export function headline({ count, last }: Pick<Donor, "count" | "last">, today: string) {
  if (last === today) return count === 1 ? "আজ প্রথমবার রক্ত দিলাম!" : `আজ রক্ত দিলাম, এ নিয়ে ${bn(count)} বার!`;
  return count === 1 ? "প্রথমবার রক্ত দিয়েছি!" : `${bn(count)} বার রক্ত দিয়েছি!`;
}

/** "রাফি রক্ত দেয়, তুমি?" — the friend banner. */
export const friendTitle = (name: string) => `${name || "তোমার বন্ধু"} রক্ত দেয়, তুমি?`;

export type Card = {
  name: string;
  group: Group;
  count: number;
  interval: Interval;
  last: string;
  next: string;
  lastText: string;
  nextText: string;
  /** Days from today until the interval ends; 0 or less once it has. */
  daysLeft: number;
  headline: string;
  line: string;
  pageLine: string;
};

export function createCard(donor: Donor, today: string): Card {
  const next = addMonthsNotEarly(donor.last, donor.interval);
  return {
    name: cleanName(donor.name),
    group: groupOf(donor.group)!,
    count: donor.count,
    interval: donor.interval,
    last: donor.last,
    next,
    lastText: dateText(donor.last),
    nextText: dateText(next),
    daysLeft: daysBetween(today, next),
    headline: headline(donor, today),
    line: humanLine(donor.count, "me"),
    pageLine: humanLine(donor.count, "you"),
  };
}

export function caption(card: Card) {
  return `${card.headline} আমার গ্রুপ ${card.group.label}, আবার দিতে পারব ${card.nextText} থেকে। তুমি শেষ কবে রক্ত দিয়েছ?`;
}
