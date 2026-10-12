import { possessive } from "../../../shared/bangla";
import { dateLine, shortDate } from "../../koto-din-baki/lib/countdown";

export const MAX_COUNT = 150;
export const MAX_NAME_LENGTH = 30;
export const MAX_PANDALS_LENGTH = 60;

const numbers = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => numbers.format(value);

/**
 * This year's Durga Puja in Bangladesh. Bump this ONE constant each year; the page, FAQ, card and saved counts follow it.
 * 2026:
 * - বিজয়া দশমী ২১ অক্টোবর (সাধারণ ছুটি), মহানবমী ২০ অক্টোবর (নির্বাহী আদেশ): সরকারি ছুটির তালিকা ২০২৬,
 *   https://bangla.thedailystar.net/news/bangladesh/news-712741 · https://www.dhakatimes24.com/2026/09/23/413420
 * - ২২ অক্টোবর ছুটি যোগ, ২০–২৪ অক্টোবর টানা পাঁচ দিন (মন্ত্রিসভা, ৫ অক্টোবর ২০২৬):
 *   https://www.banglatribune.com/972580 · https://www.dhakatimes24.com/2026/10/05/414398
 * - ষষ্ঠী (বোধন) ১৬ অক্টোবর comes from the panjika, so it is shown as "সম্ভাব্য". Dhaka tithi table:
 *   https://www.bangladatetoday.com/blog/durga-puja-2026-dates-and-schedule ; both বিশুদ্ধ সিদ্ধান্ত and বেণীমাধব শীল give 16 Oct:
 *   https://bangla.asianetnews.com/religion/durga-puja-2026-date-and-time-mahalaya-kojagari-lakshmi-puja-durga-puja-date-and-time-check-this/photoshow-5bic6d6
 * For 2027: Bengal Vijayadashami is 10 Oct 2027 (https://www.drikpanchang.com/festivals/vijayadashami/vijayadashami-date-time.html?year=2027);
 * take ষষ্ঠী from the panjika and দশমী + holidays from the 2027 government list once it is published.
 */
export const PUJA = {
  year: 2026,
  shashthi: "2026-10-16",
  dashami: "2026-10-21",
  holidays: "২০ থেকে ২২ অক্টোবর সরকারি ছুটি, শুক্র-শনি মিলিয়ে টানা পাঁচ দিন",
  sources: [
    { label: "সরকারি ছুটির তালিকা", url: "https://bangla.thedailystar.net/news/bangladesh/news-712741" },
    { label: "ছুটির সংশোধনী", url: "https://www.banglatribune.com/972580" },
    { label: "পঞ্জিকার তিথি", url: "https://www.bangladatetoday.com/blog/durga-puja-2026-dates-and-schedule" },
  ],
} as const;

export const yearLabel = (year: number) => bn(year);
export const pujaDates = () => ({ shashthi: dateLine(PUJA.shashthi), dashami: dateLine(PUJA.dashami) });
/** "১৬–২১ অক্টোবর", or "৩০ সেপ্টেম্বর–৫ অক্টোবর" when Puja crosses a month. */
export function pujaSpan(start: string = PUJA.shashthi, end: string = PUJA.dashami) {
  return start.slice(0, 7) === end.slice(0, 7) ? `${bn(Number(start.slice(8)))}–${shortDate(end)}` : `${shortDate(start)}–${shortDate(end)}`;
}

// Descriptive and optional: people tick what they did OR watched, so no chip assumes a faith or a gender.
// Links store moments as bit positions: once public, only append; never reorder or delete.
export const moments = [
  { id: "anjali", label: "অঞ্জলি" },
  { id: "dhunuchi", label: "ধুনুচি নাচ" },
  { id: "sindur", label: "সিঁদুর খেলা" },
  { id: "prasad", label: "প্রসাদ" },
  { id: "arati", label: "আরতি দেখা" },
  { id: "dhak", label: "ঢাকের তালে নাচ" },
  { id: "mela", label: "পূজার মেলা" },
  { id: "bondhu", label: "বন্ধুর সাথে মণ্ডপে" },
] as const;

/** Pandal-count ranges for the anonymous tally: the exact count is never sent. */
export const buckets = [
  { id: "b1", min: 1, max: 3, label: "১–৩টা" },
  { id: "b2", min: 4, max: 7, label: "৪–৭টা" },
  { id: "b3", min: 8, max: 15, label: "৮–১৫টা" },
  { id: "b4", min: 16, max: 30, label: "১৬–৩০টা" },
  { id: "b5", min: 31, max: MAX_COUNT, label: "৩১টার বেশি" },
] as const;

export type MomentId = (typeof moments)[number]["id"];
export type BucketId = (typeof buckets)[number]["id"];
/** What a card and its link carry. `pandals` is free text for the card only: never counted, never in a preview title. */
export type Tour = { count: number; moments: MomentId[]; year: number; name: string; pandals: string };

export const momentLabel = (id: MomentId) => moments.find(moment => moment.id === id)!.label;
export const bucketOf = (count: number) => buckets.find(bucket => count >= bucket.min && count <= bucket.max) ?? null;

export function toggleMoment(picked: readonly MomentId[], id: MomentId): MomentId[] {
  return picked.includes(id) ? picked.filter(item => item !== id) : [...picked, id];
}

export const clampCount = (count: number) => Math.min(MAX_COUNT, Math.max(0, Math.round(count) || 0));

/** NFC; no control or bidi-override characters (they could scramble the card) and no web addresses; capped by characters. */
export function cleanText(text: string, max: number) {
  const flat = text.normalize("NFC")
    .replace(/[\u0000-\u001f\u007f-\u009f‎‏‪-‮⁦-⁩]/g, " ")
    .replace(/https?:\/\/\S*|www\.\S*/gi, " ")
    .replace(/\s+/g, " ").trim();
  return Array.from(flat).slice(0, max).join("").trim();
}

export function encodeMoments(picked: readonly MomentId[]) {
  return moments.reduce((bits, moment, index) => picked.includes(moment.id) ? bits + 2 ** index : bits, 0).toString(36);
}

export function decodeMoments(code: string): MomentId[] {
  // 8 bits fit in two base-36 digits; anything else is not ours.
  if (!/^[0-9a-z]{1,2}$/.test(code)) return [];
  const bits = parseInt(code, 36);
  return moments.filter((_, index) => Math.floor(bits / 2 ** index) % 2 === 1).map(moment => moment.id);
}

export function shareHash(tour: Tour) {
  const params = new URLSearchParams({ c: String(clampCount(tour.count)), r: encodeMoments(tour.moments), y: String(tour.year % 100) });
  const name = cleanText(tour.name, MAX_NAME_LENGTH);
  const pandals = cleanText(tour.pandals, MAX_PANDALS_LENGTH);
  if (name) params.set("n", name);
  if (pandals) params.set("p", pandals);
  return "#" + params.toString();
}

/** Reads #c=11&r=1b&y=26&n=রাফি&p=…; a card needs at least one pandal. Bad optional parts fall back instead of rejecting. */
export function parseShareHash(hash: string): Tour | null {
  let params: URLSearchParams;
  try { params = new URLSearchParams(hash.replace(/^#/, "")); } catch { return null; }
  const raw = params.get("c") ?? "";
  if (!/^[1-9]\d{0,2}$/.test(raw) || Number(raw) > MAX_COUNT) return null;
  const year = params.get("y") ?? "";
  return {
    count: Number(raw),
    moments: decodeMoments(params.get("r") ?? ""),
    year: /^\d{2}$/.test(year) && Number(year) >= 26 ? 2000 + Number(year) : PUJA.year,
    name: cleanText(params.get("n") ?? "", MAX_NAME_LENGTH),
    pandals: cleanText(params.get("p") ?? "", MAX_PANDALS_LENGTH),
  };
}

/** "শুভ বিজয়া" from Dashami on (and for any earlier year's card), "শুভ শারদীয়া" before it. `today` is a Dhaka "YYYY-MM-DD". */
export function signOff(year: number, today: string) {
  return year < PUJA.year || today >= PUJA.dashami ? "শুভ বিজয়া" : "শুভ শারদীয়া";
}

/** The human line, chosen from the count and the moments. First match wins. */
export function tourLine(count: number, picked: readonly MomentId[]) {
  const has = (id: MomentId) => picked.includes(id);
  if (count === 0) return "ঢাকের শব্দ শুনছ? চলো, প্রথম মণ্ডপে।";
  if (count >= 31) return "পায়ে ব্যথা। এবার প্রায় পুরো শহর ঘোরা হলো।";
  if (has("dhunuchi") && has("dhak")) return "ধুনুচির ধোঁয়া আর ঢাকের তাল, রাতটা জমে গেছে।";
  if (count >= 16) return "রাত জেগে মণ্ডপ থেকে মণ্ডপে, এবার নিজের রেকর্ড।";
  if (has("sindur")) return "সিঁদুর খেলার রঙে বিজয়ার দিনটা লাল হয়ে গেল।";
  if (has("bondhu") && count >= 4) return "বন্ধুর হাত ধরে মণ্ডপ থেকে মণ্ডপ। কে আগে থামে, দেখা যাক।";
  if (has("prasad")) return "প্রসাদের খিচুড়ি আর নাড়ু। রাতের খাবার আজ বাদ।";
  if (has("mela")) return "নাগরদোলায় একটা চক্কর, হাতে মাটির খেলনা।";
  if (has("arati")) return "সন্ধ্যার আরতির আলো এখনো চোখে লেগে আছে।";
  if (has("anjali")) return "সকালের অঞ্জলি, নতুন জামা, ঢাকের শব্দ।";
  if (has("bondhu")) return "বন্ধুর সাথে ঘোরা মানে ছবি তুলতেই আধঘণ্টা।";
  if (count <= 3) return "অল্প কয়টা, কিন্তু শুরুটা তো হলো।";
  return "ঢাকের তালে তালে মণ্ডপ থেকে মণ্ডপে।";
}

/** "রিমা ১১টা · আমি ৭টা": a friend's count beside yours on the card. */
export function friendLine(own: number, friend: Tour | null) {
  if (!friend || !own) return "";
  return `${friend.name || "বন্ধু"} ${bn(friend.count)}টা · আমি ${bn(own)}টা`;
}

export function cardHeadline(name: string) {
  return `${name ? possessive(name) : "আমার"} পূজা`;
}

/** Link preview: name and count only. Pandal names stay out of previews on purpose. */
export function previewTitle(tour: Pick<Tour, "count" | "name">) {
  return `${tour.name || "এক বন্ধু"} এবার পূজায় ${bn(tour.count)}টা মণ্ডপ ঘুরেছে। তুমি কয়টা ঘুরলে?`;
}

/** What everyone's opt-in counts say, once enough people have joined; null until then. */
export function everyoneSays(counts: Record<string, number>, minimum: number) {
  const top = <T extends { id: string }>(rows: readonly T[]) => {
    const ranked = rows.map(row => ({ row, count: counts[row.id] ?? 0 })).sort((a, b) => b.count - a.count);
    return ranked[0].count > (ranked[1]?.count ?? 0) ? ranked[0].row : null;
  };
  const people = buckets.reduce((sum, bucket) => sum + (counts[bucket.id] ?? 0), 0);
  return people >= minimum ? { people, bucket: top(buckets), moment: top(moments) } : null;
}

export { possessive };
