import { possessive } from "../../../shared/bangla";

export const MAX_NAME_LENGTH = 30;
export const MIN_DATE = "1900-01-01";

const grouped = new Intl.NumberFormat("bn-BD");
const plain = new Intl.NumberFormat("bn-BD", { useGrouping: false });
/** Counts with grouping ("৯,৯০৪"); years and day numbers without ("১৯৯৯"). */
export const bn = (value: number) => grouped.format(value);
export const bnPlain = (value: number) => plain.format(value);

const DAY = 86_400_000;
const pad = (value: number) => String(value).padStart(2, "0");
const parts = (date: string) => date.split("-").map(Number) as [number, number, number];
const utc = (date: string) => { const [y, m, d] = parts(date); return Date.UTC(y, m - 1, d); };
const fromUtc = (time: number) => new Date(time).toISOString().slice(0, 10);

export const daysInMonth = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate();
export const isLeap = (year: number) => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
export const daysBetween = (from: string, to: string) => Math.round((utc(to) - utc(from)) / DAY);
export const addDays = (date: string, days: number) => fromUtc(utc(date) + days * DAY);
export const toDate = (year: number, month: number, day: number) => `${year}-${pad(month)}-${pad(day)}`;

export function isDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const [y, m, d] = parts(date);
  return m >= 1 && m <= 12 && d >= 1 && d <= daysInMonth(y, m);
}

/** Today's date in Bangladesh, whatever the phone's own time zone (diaspora phones included). */
export function todayInDhaka(now = new Date()) {
  const get = (type: string) => new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now).find(part => part.type === type)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Adds whole months; a day the target month lacks becomes its last day (31 Jan + 1 month = 28/29 Feb). */
export function addMonths(date: string, count: number) {
  const [y, m, d] = parts(date);
  const index = y * 12 + (m - 1) + count;
  const year = Math.floor(index / 12), month = (index % 12) + 1;
  return toDate(year, month, Math.min(d, daysInMonth(year, month)));
}

export type Age = { years: number; months: number; days: number };

/**
 * Completed years, months and days from birth to `on`. Someone born on 29 February turns a year older on
 * 28 February in other years (the same month-end rule as addMonths), so age and next birthday always agree.
 */
export function age(birth: string, on: string): Age {
  const [by, bm] = parts(birth), [ty, tm] = parts(on);
  let months = (ty - by) * 12 + (tm - bm);
  if (addMonths(birth, months) > on) months--;
  return { years: Math.floor(months / 12), months: months % 12, days: daysBetween(addMonths(birth, months), on) };
}

/** "২৭ বছর ৩ মাস ১৪ দিন"; zero parts are left out ("২৭ বছর ৫ দিন"), but there is always at least one. */
export function ageText({ years, months, days }: Age) {
  const text = [years && `${bn(years)} বছর`, months && `${bn(months)} মাস`, days && `${bn(days)} দিন`].filter(Boolean).join(" ");
  return text || "০ দিন";
}

export function nextBirthday(birth: string, on: string) {
  const { years } = age(birth, on);
  const thisYear = addMonths(birth, years * 12);
  const date = thisYear === on ? on : addMonths(birth, (years + 1) * 12);
  return { date, days: daysBetween(on, date), turning: date === on ? years : years + 1 };
}

/** The next round 1,000 days alive ("১০,০০০ দিন") after today. */
export function nextMilestone(birth: string, on: string) {
  const alive = daysBetween(birth, on);
  const count = (Math.floor(alive / 1000) + 1) * 1000;
  return { count, date: addDays(birth, count), days: count - alive };
}

export const weekdays = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"] as const;
export const months = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"] as const;
export const banglaMonths = ["বৈশাখ", "জ্যৈষ্ঠ", "আষাঢ়", "শ্রাবণ", "ভাদ্র", "আশ্বিন", "কার্তিক", "অগ্রহায়ণ", "পৌষ", "মাঘ", "ফাল্গুন", "চৈত্র"] as const;

export const weekday = (date: string) => new Date(utc(date)).getUTCDay();

/*
 * Bangladesh's revised Bangla calendar (বঙ্গাব্দ). The year always starts on 14 April.
 *
 * 2019 revision, from 1426 (14 Apr 2019): বৈশাখ–আশ্বিন 31 days, কার্তিক–মাঘ 30, ফাল্গুন 29 (30 when that
 * February has 29 days), চৈত্র 30. It moved 21 Feb to ৮ ফাল্গুন and 16 Dec to ১ পৌষ. Ashwin first ran to 31 days
 * in Oct 2019, so 1426 is the first year under it.
 *   https://www.dhakatribune.com/bangladesh/191106/ashshin-in-31-days-in-revised-bangla-calendar
 *   https://en.wikipedia.org/wiki/Bangladeshi_national_calendar
 * 1987 rule (the 1966 Bangla Academy/Shahidullah committee scheme, adopted by the government in 1987 and used
 * in official papers from 1988, i.e. 1395): বৈশাখ–ভাদ্র 31 days, the rest 30, ফাল্গুন 31 in a leap year.
 *   https://www.tbsnews.net/thoughts/saga-bangla-calendar-403202
 *   https://en.banglapedia.org/index.php?title=Panjika
 * Checked against archived Prothom Alo datelines (web.archive.org snapshots of prothomalo.com):
 *   15 Mar 2016 = ০১ চৈত্র ১৪২২ (leap day in ফাল্গুন), 18 Oct 2018 = ৩ কার্তিক ১৪২৫, 19 Dec 2018 = ০৫ পৌষ ১৪২৫,
 *   16 Oct 2019 = ৩১ আশ্বিন ১৪২৬, 16 Dec 2019 = ০১ পৌষ ১৪২৬, 21 Feb 2020 = ০৮ ফাল্গুন ১৪২৬.
 * Before 1395 there was no official revised calendar; most panjikas then followed the traditional reckoning
 * (new year on 14 or 15 April), so those dates are worked out with the 1966 scheme and labelled as such.
 */
export type BanglaRule = "2019" | "1987" | "1966";
export type BanglaDate = { day: number; month: number; year: number; rule: BanglaRule };

export function banglaDate(date: string): BanglaDate {
  const y = Number(date.slice(0, 4));
  const start = date.slice(5) >= "04-14" ? y : y - 1;
  const year = start - 593;
  const leap = isLeap(start + 1);
  const lengths = year >= 1426
    ? [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, leap ? 30 : 29, 30]
    : [31, 31, 31, 31, 31, 30, 30, 30, 30, 30, leap ? 31 : 30, 30];
  let day = daysBetween(`${start}-04-14`, date), month = 0;
  while (day >= lengths[month]) day -= lengths[month++];
  return { day: day + 1, month, year, rule: year >= 1426 ? "2019" : year >= 1395 ? "1987" : "1966" };
}

export const ruleNote: Record<BanglaRule, string> = {
  "2019": "২০১৯ সালে সংশোধিত বাংলাদেশের সরকারি বাংলা পঞ্জিকা অনুযায়ী",
  "1987": "তখনকার (১৯৮৭-র) সরকারি বাংলা পঞ্জিকা অনুযায়ী",
  "1966": "১৯৮৮-র আগে সরকারি বাংলা পঞ্জিকা ছিল না; বাংলা একাডেমির ১৯৬৬-র নিয়মে হিসাব, তখনকার পঞ্জিকার সাথে এক দিন এদিক-ওদিক হতে পারে",
};

export const seasons = [
  { id: "grishmo", label: "গ্রীষ্ম", people: "গ্রীষ্মের মানুষ", in: "গ্রীষ্মে" },
  { id: "borsha", label: "বর্ষা", people: "বর্ষার মানুষ", in: "বর্ষায়" },
  { id: "shorot", label: "শরৎ", people: "শরতের মানুষ", in: "শরতে" },
  { id: "hemonto", label: "হেমন্ত", people: "হেমন্তের মানুষ", in: "হেমন্তে" },
  { id: "sheet", label: "শীত", people: "শীতের মানুষ", in: "শীতে" },
  { id: "boshonto", label: "বসন্ত", people: "বসন্তের মানুষ", in: "বসন্তে" },
] as const;
export type Season = (typeof seasons)[number];
/** Two Bangla months per season: গ্রীষ্ম is বৈশাখ–জ্যৈষ্ঠ, বর্ষা আষাঢ়–শ্রাবণ, and so on. */
export const seasonOf = (bangla: BanglaDate): Season => seasons[Math.floor(bangla.month / 2)];

export const banglaText = (bangla: BanglaDate) => `${bnPlain(bangla.day)} ${banglaMonths[bangla.month]} ${bnPlain(bangla.year)}`;
export function englishText(date: string) {
  const [y, m, d] = parts(date);
  return `${bnPlain(d)} ${months[m - 1]} ${bnPlain(y)}`;
}
/** "শনিবার, ২৫ আশ্বিন ১৪৩৩ · ১০ অক্টোবর ২০২৬" */
export const dateline = (date: string) => `${weekdays[weekday(date)]}, ${banglaText(banglaDate(date))} · ${englishText(date)}`;

const monthLines = [
  "বৈশাখে জন্ম — নতুন বছরের সাথে সাথেই হাজির।",
  "জ্যৈষ্ঠে জন্ম, আম-কাঁঠালের মাসে। মিষ্টি তো হবেই।",
  "আষাঢ়ে জন্ম — কদম ফোটার দিনে, প্রথম বৃষ্টির গন্ধে।",
  "শ্রাবণের বৃষ্টিতে জন্ম, তাই বুঝি মনটা এত নরম।",
  "ভাদ্রে জন্ম, তাল পাকার মাসে। তালের পিঠার মতোই মিষ্টি।",
  "আশ্বিনে জন্ম, যখন আকাশে সাদা মেঘ আর মাঠে কাশফুল।",
  "কার্তিকে জন্ম — হেমন্তের হালকা কুয়াশার ভোরে।",
  "অগ্রহায়ণে জন্ম, নতুন ধান আর নবান্নের মাসে।",
  "পৌষের শীতে জন্ম, তাই বুঝি পিঠার প্রতি এত টান।",
  "মাঘের শীতে জন্ম — লেপের ওম আর খেজুর রসের মাসে।",
  "ফাল্গুনে জন্ম, শিমুল-পলাশ ফোটার দিনে।",
  "চৈত্রে জন্ম — বছর শেষের মেলার মাসে।",
] as const;

/** One warm line from the birth date: a birthday or a round day count today beats the weekday, which beats the month. */
export function humanLine(birth: string, today: string) {
  const alive = daysBetween(birth, today);
  if (alive > 0 && nextBirthday(birth, today).days === 0) return "আজ জন্মদিন! কেক না থাকুক, পায়েস যেন থাকে।";
  if (alive > 0 && alive % 1000 === 0) return `আজ জীবনের ${bn(alive)}তম দিন — এমন গোল দিন রোজ আসে না!`;
  if (weekday(birth) === 5) return "শুক্রবারে জন্ম — ছুটির দিনের মানুষ।";
  return monthLines[banglaDate(birth).month];
}

export function cleanName(name: string) {
  // NFC, and no control or bidi-override characters, so a shared link can't scramble the headline.
  const flat = name.normalize("NFC").replace(/[\u0000-\u001f\u007f-\u009f‎‏‪-‮⁦-⁩]/g, " ").replace(/\s+/g, " ").trim();
  return Array.from(flat).slice(0, MAX_NAME_LENGTH).join("").trim();
}

/** A birth date we accept: a real calendar date from 1900 up to today. */
export const validBirth = (date: string, today: string) => isDate(date) && date >= MIN_DATE && date <= today;

export type Shared = { birth: string; name: string };

export function shareHash({ birth, name }: Shared) {
  const params = new URLSearchParams({ b: birth });
  const shown = cleanName(name);
  if (shown) params.set("n", shown);
  return "#" + params.toString();
}

export function parseShareHash(hash: string, today = todayInDhaka()): Shared | null {
  if (hash.length > 400) return null;
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const birth = params.get("b") ?? "";
  return validBirth(birth, today) ? { birth, name: cleanName(params.get("n") ?? "") } : null;
}

/** "রাফি তোমার চেয়ে ১ বছর ২ মাস বড়" on the page; the card, which friends read, says "আমার". */
export function compareLine(friend: Shared, mine: string, voice: "you" | "me" = "you") {
  const who = friend.name || (voice === "you" ? "তোমার বন্ধু" : "বন্ধু");
  if (friend.birth === mine) return voice === "you" ? `${who} আর তুমি একই দিনে জন্মেছ!` : `${who} আর আমি একই দিনে জন্মেছি!`;
  const older = friend.birth < mine;
  const gap = ageText(older ? age(friend.birth, mine) : age(mine, friend.birth));
  return `${who} ${voice === "you" ? "তোমার" : "আমার"} চেয়ে ${gap} ${older ? "বড়" : "ছোট"}`;
}

export type Card = {
  name: string;
  birth: string;
  dateline: string;
  headline: string;
  subhead: string;
  age: Age;
  ageText: string;
  alive: number;
  bangla: BanglaDate;
  banglaText: string;
  weekday: string;
  season: Season;
  next: ReturnType<typeof nextBirthday>;
  milestone: ReturnType<typeof nextMilestone>;
  line: string;
  match: string;
};

export function createCard(own: Shared, today: string, friend?: Shared | null): Card {
  const name = cleanName(own.name);
  const ageNow = age(own.birth, today);
  const alive = daysBetween(own.birth, today);
  const bangla = banglaDate(own.birth);
  return {
    name,
    birth: own.birth,
    dateline: dateline(own.birth),
    headline: name ? `জন্ম নিল ${name}` : "এই দিনে জন্ম নিলাম আমি",
    subhead: `আজ ${name ? "তার" : "আমার"} বয়স ${ageText(ageNow)} — ${bn(alive)} দিন`,
    age: ageNow,
    ageText: ageText(ageNow),
    alive,
    bangla,
    banglaText: banglaText(bangla),
    weekday: weekdays[weekday(own.birth)],
    season: seasonOf(bangla),
    next: nextBirthday(own.birth, today),
    milestone: nextMilestone(own.birth, today),
    line: humanLine(own.birth, today),
    match: friend ? compareLine(friend, own.birth, "me") : "",
  };
}

export { possessive };
