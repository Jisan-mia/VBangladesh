// Pure state and arithmetic for মাটির ব্যাংক: so much a day or week, until a break day. Plain multiplication only:
// no interest, no bank, no investment advice.
import { possessive } from "../../../shared/bangla";
// Festival dates (and their source URLs) live in কত দিন বাকি?, which is edited when the moon-sighting committee or the
// government holiday list fixes a date; both tools move together. See tools/koto-din-baki/lib/countdown.ts.
import { bn as plain, countdown, daysBetween, dhakaToday, isDate, occasionById, shortDate, sources, type OccasionId, type SourceId } from "../../koto-din-baki/lib/countdown";

export { dhakaToday, possessive, sources };

const DAY = 86_400_000;
// Money gets grouping (৳৩,০২০); years and dates don't (২০২৭).
const money = new Intl.NumberFormat("bn-BD");
export const bn = (value: number) => money.format(value);
export const LIMITS = { per: 100_000, label: 24, name: 20, years: 3, hash: 400 } as const;
export const perChoices = [5, 10, 20, 50, 100] as const;

// Ids go into share links: never rename or remove one.
export const breakDays = ["eid-fitr", "boishakh", "eid-adha", "durga", "christmas"] as const satisfies readonly OccasionId[];
export type BreakId = (typeof breakDays)[number];
export type Every = "day" | "week";

/** The goal: what a link always carries. `until` is a break-day id or a "YYYY-MM-DD" date. */
export type Goal = { per: number; every: Every; until: string; start: string; label: string; name: string };
/** A bank: the goal plus coins dropped. In a link, coins is null unless the person chose to show progress. */
export type Bank = Goal & { coins: number | null };

export type Plan = {
  date: string;
  /** "ঈদুল ফিতর" or "১৪ ফেব্রুয়ারি ২০২৭". */
  title: string;
  /** "ঈদুল ফিতরে", "দুর্গাপূজায়", "১৪ ফেব্রুয়ারি ২০২৭-এ". */
  on: string;
  /** "ঈদুল ফিতরের", "১৪ ফেব্রুয়ারি ২০২৭-এর". */
  of: string;
  /** Moon- or tithi-based dates are "সম্ভাব্য". */
  likely: boolean;
  source: SourceId | null;
  days: number;
  /** How many coins fill the bank. */
  count: number;
  total: number;
};

/** A typed whole-taka amount in Bangla or Latin digits (commas ignored); NaN otherwise. */
export function readTaka(text: string) {
  const latin = text.replace(/[০-৯]/g, digit => String(digit.charCodeAt(0) - 0x09e6)).replace(/[,\s]/g, "");
  return /^\d{1,6}$/.test(latin) ? Number(latin) : NaN;
}

export const isBreakId =(id: string): id is BreakId => (breakDays as readonly string[]).includes(id);
export const addDays = (date: string, days: number) => new Date(Date.parse(date) + days * DAY).toISOString().slice(0, 10);
const shiftYears = (date: string, by: number) => `${Number(date.slice(0, 4)) + by}${date.slice(4)}`;
export const validPer = (per: number) => Number.isInteger(per) && per >= 1 && per <= LIMITS.per;
export const everyWord = (every: Every) => every === "day" ? "রোজ" : "প্রতি সপ্তাহে";
export const unitWord = (every: Every) => every === "day" ? "দিন" : "সপ্তাহ";
export const breakLabel = (id: BreakId) => occasionById(id).chip;

/** The default first screen: ২০ টাকা a day until Eid-ul-Fitr. */
export const defaultBank = (today: string): Bank => ({ per: 20, every: "day", until: "eid-fitr", start: today, label: "", name: "", coins: 0 });

/**
 * Coins from the start day up to the day before the break day: a daily bank gets one coin a day (start day included),
 * a weekly one a coin every seventh day. Null when the date table has run out or the date isn't ahead of the start.
 */
export function plan(goal: Pick<Goal, "per" | "every" | "until" | "start">): Plan | null {
  if (!validPer(goal.per) || !isDate(goal.start)) return null;
  let date: string, title: string, likely = false, source: SourceId | null = null;
  if (isBreakId(goal.until)) {
    // The break day after the start day, so starting on Eid itself saves for the next one.
    const count = countdown({ id: goal.until }, addDays(goal.start, 1));
    if (!count.date) return null;
    date = count.date; likely = count.likely; source = count.source;
    title = breakLabel(goal.until);
  } else {
    if (!isDate(goal.until)) return null;
    date = goal.until;
    title = `${shortDate(date)} ${plain(Number(date.slice(0, 4)))}`;
  }
  const days = daysBetween(goal.start, date);
  if (days < 1 || date > shiftYears(goal.start, LIMITS.years)) return null;
  const count = goal.every === "day" ? days : Math.ceil(days / 7);
  const word = isBreakId(goal.until);
  const on = !word ? `${title}-এ` : title.endsWith("া") ? `${title}য়` : `${title}ে`;
  return { date, title, on, of: word ? possessive(title) : `${title}-এর`, likely, source, days, count, total: count * goal.per };
}

/** How many coins one grid circle stands for (1, 2, 5, 10…) so the grid never draws more than `max`. */
export function coinScale(count: number, max = 150) {
  for (let step = 1; ; step *= 10) for (const each of [1, 2, 5]) if (count / (each * step) <= max) return each * step;
}

/** The human line: from progress when it's shown, otherwise from the break day the person picked. */
export function bankLine(goal: Pick<Goal, "until">, p: Plan, coins: number | null) {
  if (coins !== null) {
    const part = coins / p.count;
    if (coins >= p.count) return "ব্যাংক ভরে গেছে, এবার ভাঙার পালা!";
    if (coins === 0) return "প্রথম পয়সাটাই সবচেয়ে কঠিন।";
    if (part < 0.25) return "ঠং! শুরুটা হয়ে গেছে।";
    if (part < 0.5) return "ঝাঁকালে এখন ঝনঝন শব্দ হয়।";
    if (part < 0.75) return "অর্ধেক ভরা — বাকি অর্ধেক আরও সহজ।";
    return "আর অল্প, ব্যাংকটা ভারী হয়ে এসেছে।";
  }
  switch (goal.until) {
    case "eid-fitr": case "eid-adha": return "চাঁদরাতে ব্যাংক ভাঙার অপেক্ষা শুরু।";
    case "boishakh": return "বৈশাখী মেলায় নিজের জমানো টাকায় কেনাকাটা।";
    case "durga": return "পূজার মেলায় নিজের জমানো টাকায় কেনাকাটা।";
    case "christmas": return "বড়দিনের আগে ব্যাংক ভাঙার অপেক্ষা।";
    default: return "দিন গুনে গুনে ব্যাংক ভরবে।";
  }
}

export const owner = (name: string) => name ? `${possessive(name)} মাটির ব্যাংক` : "আমার মাটির ব্যাংক";
/** "রোজ ২০ টাকা × ১৫১ দিন = ৩,০২০ টাকা". */
export const sumLine = (goal: Pick<Goal, "per" | "every">, p: Plan) => `${everyWord(goal.every)} ${bn(goal.per)} টাকা × ${bn(p.count)} ${unitWord(goal.every)} = ${bn(p.total)} টাকা`;
/** "৩০-এ ১৮ · ৳২,৯৪০ জমল". */
export const progressLine = (per: number, p: Plan, coins: number) => `${bn(p.count)}-এ ${bn(coins)} · ৳${bn(coins * per)} জমল`;
export const breakText = (p: Plan) => `${p.title}${p.likely ? " (সম্ভাব্য)" : ""}`;

export function caption(bank: Bank, p: Plan) {
  if (bank.coins !== null) {
    const full = bank.coins >= p.count;
    return `${full ? "মাটির ব্যাংক ভরে গেছে" : `মাটির ব্যাংকে ${bn(p.count)}-এর মধ্যে ${bn(bank.coins)}টা পয়সা পড়ল`}, ৳${bn(bank.coins * bank.per)} জমল! ${bankLine(bank, p, bank.coins)} তোমার মাটির ব্যাংকে কত?`;
  }
  return `মাটির ব্যাংকে ${everyWord(bank.every)} ${bn(bank.per)} টাকা জমাচ্ছি, ${p.of} আগে ভাঙলে হবে ৳${bn(p.total)}! তুমিও আমার সাথে জমাবে?`;
}

export function previewTitle(bank: Bank, p: Plan) {
  const who = bank.name ? possessive(bank.name) : "এক বন্ধুর";
  if (bank.coins !== null) return `${who} মাটির ব্যাংকে ${progressLine(bank.per, p, bank.coins)} — তোমার ব্যাংকে কত?`;
  return `${who} মাটির ব্যাংক: ${everyWord(bank.every)} ${bn(bank.per)} টাকা, ${p.on} ৳${bn(p.total)} — তুমিও জমাবে?`;
}

export function cleanText(text: string, max: number) {
  // NFC so the same word typed on two keyboards is one link; control and bidi-override characters could scramble the card.
  const flat = text.normalize("NFC").replace(/[\u0000-\u001f\u007f-\u009f‎‏‪-‮⁦-⁩]/g, " ").replace(/\s+/g, " ").trim();
  return Array.from(flat).slice(0, max).join("").trim();
}

/** "#t=20&e=d&o=eid-fitr&s=2026-10-10[&d=…][&l=…][&n=…][&c=18]": coins only when the person chose to show them. */
export function shareHash(bank: Bank) {
  const params = new URLSearchParams({ t: String(bank.per), e: bank.every === "week" ? "w" : "d" });
  if (isBreakId(bank.until)) params.set("o", bank.until); else params.set("d", bank.until);
  params.set("s", bank.start);
  const label = cleanText(bank.label, LIMITS.label), name = cleanText(bank.name, LIMITS.name);
  if (label) params.set("l", label);
  if (name) params.set("n", name);
  if (bank.coins !== null) params.set("c", String(bank.coins));
  return "#" + params.toString();
}

/** Reads a link or a saved bank. The start must be within three years of today; anything broken is null. */
export function parseShareHash(hash: string, today: string): Bank | null {
  if (hash.length > LIMITS.hash) return null;
  let params: URLSearchParams;
  try { params = new URLSearchParams(hash.replace(/^#/, "")); } catch { return null; }
  const digits = (raw: string | null, size: number) => raw && new RegExp(`^\\d{1,${size}}$`).test(raw) ? Number(raw) : NaN;
  const per = digits(params.get("t"), 6);
  const start = params.get("s") ?? "";
  const until = params.get("o") ?? params.get("d") ?? "";
  if (!isDate(start) || start < shiftYears(today, -LIMITS.years) || start > shiftYears(today, LIMITS.years)) return null;
  const goal = { per, every: params.get("e") === "w" ? "week" as const : "day" as const, until, start };
  const p = plan(goal);
  if (!p) return null;
  const coins = digits(params.get("c"), 4);
  return { ...goal, label: cleanText(params.get("l") ?? "", LIMITS.label), name: cleanText(params.get("n") ?? "", LIMITS.name), coins: coins <= p.count ? coins : null };
}

// Progress lives only in this browser; the saved form is the same hash a link uses, with coins always kept.
export const STORAGE_KEY = "matir-bank";

export function loadBank(storage: Pick<Storage, "getItem">, today: string): Bank | null {
  try {
    const bank = parseShareHash(storage.getItem(STORAGE_KEY) ?? "", today);
    return bank && { ...bank, coins: bank.coins ?? 0 };
  } catch { return null; }
}

export function saveBank(storage: Pick<Storage, "setItem">, bank: Bank) {
  try { storage.setItem(STORAGE_KEY, shareHash({ ...bank, coins: bank.coins ?? 0 })); return true; } catch { return false; }
}
