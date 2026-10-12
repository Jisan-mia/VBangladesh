import { bn, occasions as wishes } from "../../shubhechha/lib/greeting";

export { bn };
export const MAX_LABEL_LENGTH = 24;
/** A custom date may sit this many years either side of today. */
const MAX_YEARS = 3;
const DAY = 86_400_000;

/*
 * Where every date comes from (checked 10 Oct 2026):
 * - gov: সরকারি ছুটির তালিকা ২০২৬, জনপ্রশাসন মন্ত্রণালয়ের প্রজ্ঞাপন, ৯ নভেম্বর ২০২৫:
 *   https://bangla.thedailystar.net/news/bangladesh/news-712741 (full list, 10 Nov 2025)
 *   https://www.tbsnews.net/bangladesh/28-public-holidays-2026-approved-1279041 (approval, 6 Nov 2025)
 *   ২১ ফেব্রুয়ারি শহীদ দিবস · ২৬ মার্চ স্বাধীনতা দিবস · ১৪ এপ্রিল বাংলা নববর্ষ · ২১ অক্টোবর দুর্গাপূজা (বিজয়া দশমী) · ১৬ ডিসেম্বর বিজয় দিবস · ২৫ ডিসেম্বর বড়দিন.
 *   The 2027 list was not out yet (Cabinet Division approves it Oct–Nov); replace the panjika and moon projections with it when it is.
 * - panjika: tithi dates projected from the panjika, not computed here:
 *   Bengal Vijayadashami 2027 = 10 Oct: https://www.drikpanchang.com/festivals/vijayadashami/vijayadashami-date-time.html?year=2027
 *   Kali Puja 2026 = 8 Nov: https://vedpanchang.com/festivals/kali-puja-2026
 *   Saraswati Puja (Vasant Panchami) 2027 = 11 Feb: https://www.drikpanchang.com/navratri/saraswati-puja/saraswati-puja-date-time.html?year=2027
 *   Buddha Purnima 2027 = 20 May: https://www.officeholidays.com/holidays/bangladesh/buddha-purnima
 * - moon: Ramadan and Eid follow the National Moon Sighting Committee (Islamic Foundation); these are projections:
 *   https://www.bangladatetoday.com/blog/ramadan-2027-start-date-bangladesh · https://www.bangladatetoday.com/blog/eid-ul-fitr-2027-date-bangladesh
 *   When the committee announces a date, edit it here and add it to `settled` (2–4 edits a year).
 * - 2028 dates are projections too (Puja's come from the শুভ বিজয়া card in tools/shubhechha).
 */
export const sources = {
  gov: { label: "সরকারি ছুটির তালিকা ২০২৬ (জনপ্রশাসন মন্ত্রণালয়, ৯ নভেম্বর ২০২৫)", url: "https://bangla.thedailystar.net/news/bangladesh/news-712741" },
  panjika: { label: "পঞ্জিকার হিসাব; ২০২৭ সালের সরকারি ছুটির তালিকা এখনো আসেনি", url: "https://www.drikpanchang.com/festivals/vijayadashami/vijayadashami-date-time.html?year=2027" },
  moon: { label: "চাঁদ দেখার ওপর নির্ভর করে। ঠিক দিন জানায় জাতীয় চাঁদ দেখা কমিটি", url: "https://www.islamicfoundation.gov.bd/" },
  fixed: { label: "প্রতি বছর একই দিন, সরকারি ছুটির তালিকা ২০২৬ অনুযায়ী", url: "https://bangla.thedailystar.net/news/bangladesh/news-712741" },
} as const;
export type SourceId = keyof typeof sources;

/** Card art and colours; see draw-card. */
export type Theme = "eid" | "ramadan" | "durga" | "kali" | "saraswati" | "buddha" | "christmas" | "national" | "ekushe" | "boishakh" | "custom";

type Occasion = {
  id: string;
  /** Picker label. */
  chip: string;
  /** Big words on the card. */
  title: string;
  /** What exactly is counted to, under the title. */
  note: (year: number) => string;
  theme: Theme;
  /** "MM-DD" every year, from the 2026 list. */
  annual?: string;
  /** One-off dates, oldest first. */
  dates?: readonly string[];
  /** Moon- or tithi-based: anything not in the government list is "সম্ভাব্য". */
  source?: "panjika" | "moon";
};

// Durga Puja dates live with the শুভ বিজয়া card so both tools move together.
const bijoya = wishes.find(item => item.id === "bijoya")!.dates;
/** Dates an official source has fixed: tithi dates from a government list, moon dates once the committee announces them. */
const settled = new Set(["2026-10-21"]);

// Ids go into share links: never rename or remove one.
// shortcut: one-off dates run to early 2028 at most; add the next year each autumn when the government list comes out.
export const occasions = [
  { id: "eid-fitr", chip: "ঈদুল ফিতর", title: "ঈদুল ফিতর", note: () => "রোজার ঈদ", theme: "eid", dates: ["2027-03-10", "2028-02-27"], source: "moon" },
  { id: "ramadan", chip: "রমজান", title: "রমজান শুরু", note: () => "প্রথম রোজা", theme: "ramadan", dates: ["2027-02-09", "2028-01-29"], source: "moon" },
  { id: "eid-adha", chip: "ঈদুল আজহা", title: "ঈদুল আজহা", note: () => "কোরবানির ঈদ", theme: "eid", dates: ["2027-05-17", "2028-05-05"], source: "moon" },
  { id: "durga", chip: "দুর্গাপূজা", title: "দুর্গাপূজা", note: () => "বিজয়া দশমী", theme: "durga", dates: bijoya, source: "panjika" },
  { id: "kali", chip: "কালীপূজা", title: "কালীপূজা", note: () => "দীপাবলি", theme: "kali", dates: ["2026-11-08"], source: "panjika" },
  { id: "saraswati", chip: "সরস্বতী পূজা", title: "সরস্বতী পূজা", note: () => "বসন্ত পঞ্চমী", theme: "saraswati", dates: ["2027-02-11"], source: "panjika" },
  { id: "buddha", chip: "বুদ্ধ পূর্ণিমা", title: "বুদ্ধ পূর্ণিমা", note: () => "বৈশাখী পূর্ণিমা", theme: "buddha", dates: ["2027-05-20"], source: "panjika" },
  { id: "christmas", chip: "বড়দিন", title: "শুভ বড়দিন", note: () => "যিশুখ্রিস্টের জন্মদিন", theme: "christmas", annual: "12-25" },
  { id: "boishakh", chip: "পহেলা বৈশাখ", title: "পহেলা বৈশাখ", note: year => `বাংলা নববর্ষ ${bn(year - 593)}`, theme: "boishakh", annual: "04-14" },
  { id: "bijoy", chip: "বিজয় দিবস", title: "বিজয় দিবস", note: year => `বিজয়ের ${bn(year - 1971)} বছর`, theme: "national", annual: "12-16" },
  // A day of mourning: nothing here says "শুভ".
  { id: "ekushe", chip: "শহীদ দিবস", title: "অমর একুশে", note: () => "শহীদ দিবস ও আন্তর্জাতিক মাতৃভাষা দিবস", theme: "ekushe", annual: "02-21" },
  { id: "swadhinota", chip: "স্বাধীনতা দিবস", title: "স্বাধীনতা দিবস", note: year => `স্বাধীনতার ${bn(year - 1971)} বছর`, theme: "national", annual: "03-26" },
] as const satisfies readonly Occasion[];

export type OccasionId = (typeof occasions)[number]["id"];
/** What a link carries: a fixed occasion, or a person's own date and label. */
export type Pick = { id: OccasionId } | { date: string; label: string };
export type Countdown = {
  title: string;
  note: string;
  theme: Theme;
  /** "YYYY-MM-DD", or null when the date table has run out. */
  date: string | null;
  days: number;
  likely: boolean;
  source: SourceId | null;
};

export const occasionById = (id: OccasionId) => occasions.find(item => item.id === id)!;

/** Today's date in Dhaka. Bangladesh is UTC+6 all year (no daylight saving), so a fixed shift is exact. */
export const dhakaToday = (now: Date) => new Date(now.getTime() + 6 * 3_600_000).toISOString().slice(0, 10);

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;
/** A real calendar date in "YYYY-MM-DD" form (rejects 2027-02-30). */
export function isDate(text: string) {
  const match = ISO.exec(text);
  return Boolean(match) && new Date(Date.UTC(+match![1], +match![2] - 1, +match![3])).toISOString().slice(0, 10) === text;
}
export const daysBetween = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / DAY);

/** The coming date of an occasion (today counts), or null when the table has run out. */
export function nextDate(occasion: (typeof occasions)[number], today: string): string | null {
  const year = Number(today.slice(0, 4));
  const candidates = "annual" in occasion ? [year, year + 1].map(y => `${y}-${occasion.annual}`) : occasion.dates;
  return candidates.find(date => date >= today) ?? null;
}

const MONTHS = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
const WEEKDAYS = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"];
const BANGLA_MONTHS = ["বৈশাখ", "জ্যৈষ্ঠ", "আষাঢ়", "শ্রাবণ", "ভাদ্র", "আশ্বিন", "কার্তিক", "অগ্রহায়ণ", "পৌষ", "মাঘ", "ফাল্গুন", "চৈত্র"];

/** "বুধবার, ২১ অক্টোবর ২০২৬". */
export function dateLine(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return `${WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]}, ${bn(d)} ${MONTHS[m - 1]} ${bn(y)}`;
}
export const shortDate = (date: string) => `${bn(Number(date.slice(8)))} ${MONTHS[Number(date.slice(5, 7)) - 1]}`;

/**
 * "৫ কার্তিক ১৪৩৩" on Bangladesh's revised calendar (Bangla Academy, 2019): the year starts on 14 April,
 * বৈশাখ–আশ্বিন have 31 days, ফাল্গুন 29 (30 when that February has 29 days), the rest 30.
 */
export function banglaDate(date: string) {
  const year = Number(date.slice(0, 4));
  const start = date.slice(5) >= "04-14" ? year : year - 1;
  const leap = (start + 1) % 4 === 0 && ((start + 1) % 100 !== 0 || (start + 1) % 400 === 0);
  let day = daysBetween(`${start}-04-14`, date);
  const lengths = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, leap ? 30 : 29, 30];
  let month = 0;
  while (day >= lengths[month]) day -= lengths[month++];
  return `${bn(day + 1)} ${BANGLA_MONTHS[month]} ${bn(start - 593)}`;
}

function clean(text: string, max: number) {
  // Control and bidi-override characters could scramble the card; ZWJ/ZWNJ stay because Bangla shaping needs them.
  const flat = text.normalize("NFC").replace(/[\u0000-\u001f\u007f-\u009f‎‏‪-‮⁦-⁩]/g, " ").replace(/\s+/g, " ").trim();
  return Array.from(flat).slice(0, max).join("").trim();
}
export const cleanLabel = (label: string) => clean(label, MAX_LABEL_LENGTH);

/** A custom date is allowed within ±3 years of today. */
export function inRange(date: string, today: string) {
  if (!isDate(date)) return false;
  const year = Number(today.slice(0, 4));
  const shift = (by: number) => `${year + by}${today.slice(4)}`;
  return date >= shift(-MAX_YEARS) && date <= shift(MAX_YEARS);
}

export function countdown(pick: Pick, today: string): Countdown {
  if ("date" in pick) {
    return { title: cleanLabel(pick.label) || "আমার দিন", note: "নিজের দিন", theme: "custom", date: pick.date, days: daysBetween(today, pick.date), likely: false, source: null };
  }
  const occasion = occasionById(pick.id);
  const date = nextDate(occasion, today);
  const year = Number((date ?? today).slice(0, 4));
  const fixed = Boolean(date && settled.has(date));
  const source: SourceId = !("source" in occasion) ? "fixed" : fixed && occasion.source === "panjika" ? "gov" : occasion.source;
  return {
    title: occasion.title, note: occasion.note(year), theme: occasion.theme, date,
    days: date ? daysBetween(today, date) : 0,
    likely: "source" in occasion && !fixed,
    source,
  };
}

/** The human line under the count. */
export function humanLine(count: Countdown) {
  if (!count.date) return "তারিখটা এখনো ঠিক হয়নি। সরকারি তালিকা এলেই বসিয়ে দেব।";
  if (count.theme === "ekushe") return count.days === 0 ? "আজ একুশে। ভাষাশহিদদের গভীর শ্রদ্ধায় স্মরণ করি।" : "ভাষাশহিদদের স্মরণের দিন আসছে।";
  if (count.days < 0) return "দিনটা পেরিয়ে গেছে।";
  if (count.days === 0) return "আজই!";
  if (count.days === 1) return "কালই! আর একটা রাত।";
  if (count.days < 7) return "আর মাত্র ক'টা দিন!";
  if (count.days <= 30) return "ক্যালেন্ডারের পাতা ছিঁড়তে শুরু করো।";
  return "এখনো অনেক দেরি, তবু গুনছি।";
}

/** "৩৭ দিন বাকি", "আজই", "৩ দিন আগে ছিল". */
export function daysText(count: Countdown) {
  if (!count.date) return "তারিখ আসছে";
  if (count.days === 0) return "আজই";
  return count.days > 0 ? `${bn(count.days)} দিন বাকি` : `${bn(-count.days)} দিন আগে ছিল`;
}

/** Occasions with their counts, nearest first; ones without a date go last. */
export function byNearest(today: string) {
  return occasions
    .map(occasion => ({ occasion, count: countdown({ id: occasion.id }, today) }))
    .sort((a, b) => (a.count.date ? a.count.days : Infinity) - (b.count.date ? b.count.days : Infinity));
}

/** Every listed date from `from` to `to` (inclusive), in order: the holiday table. */
export function calendar(from: string, to: string) {
  const years = [Number(from.slice(0, 4)), Number(to.slice(0, 4))];
  return occasions
    .flatMap(occasion => ("annual" in occasion ? [years[0], years[0] + 1].filter(y => y <= years[1]).map(y => `${y}-${occasion.annual}`) : [...occasion.dates])
      // countdown from the day itself returns that same date with its source and certainty
      .filter(date => date >= from && date <= to).map(date => ({ id: occasion.id, chip: occasion.chip, ...countdown({ id: occasion.id }, date) })))
    .sort((a, b) => a.date!.localeCompare(b.date!));
}

export function shareHash(pick: Pick) {
  const params = "date" in pick ? new URLSearchParams({ d: pick.date, l: cleanLabel(pick.label) }) : new URLSearchParams({ o: pick.id });
  if ("date" in pick && !cleanLabel(pick.label)) params.delete("l");
  return "#" + params.toString();
}

/** Reads #o=eid-fitr or #d=2027-02-14&l=রাফির বিয়ে; anything else is null. */
export function parseShareHash(hash: string, today: string): Pick | null {
  let params: URLSearchParams;
  try { params = new URLSearchParams(hash.replace(/^#/, "")); } catch { return null; }
  const id = params.get("o");
  const occasion = occasions.find(item => item.id === id);
  if (occasion) return { id: occasion.id };
  const date = params.get("d") ?? "";
  return inRange(date, today) ? { date, label: cleanLabel(params.get("l") ?? "") } : null;
}

/** "ঈদুল ফিতর আর ১৫১ দিন। তুমি কোন দিনের অপেক্ষায়?" for link previews. */
export function previewTitle(pick: Pick, today: string) {
  const count = countdown(pick, today);
  const name = "date" in pick ? count.title : occasionById(pick.id).chip;
  const when = !count.date ? "আসছে" : count.days === 0 ? "আজই" : count.days > 0 ? `আর ${bn(count.days)} দিন` : `ছিল ${bn(-count.days)} দিন আগে`;
  return `${name} ${when}। তুমি কোন দিনের অপেক্ষায়?`;
}
