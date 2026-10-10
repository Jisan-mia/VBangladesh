export const MAX_NAME_LENGTH = 24;
export const MIN_LEFT = "1985-01";
/** A return date may be at most two years ahead. */
export const MAX_AHEAD_DAYS = 730;

const DIGITS = "০১২৩৪৫৬৭৮৯";
export const bn = (value: number | string) => String(value).replace(/\d/g, digit => DIGITS[Number(digit)]);

// Share links store these ids: only append, never rename or reorder.
// Countries with more than one time zone get one entry per zone; the tag always shows the country.
export const places = [
  { id: "sa", country: "সৌদি আরব", at: "সৌদি আরবে", zone: "Asia/Riyadh" },
  { id: "ae", country: "আমিরাত", at: "আমিরাতে", zone: "Asia/Dubai" },
  { id: "my", country: "মালয়েশিয়া", at: "মালয়েশিয়ায়", zone: "Asia/Kuala_Lumpur" },
  { id: "qa", country: "কাতার", at: "কাতারে", zone: "Asia/Qatar" },
  { id: "om", country: "ওমান", at: "ওমানে", zone: "Asia/Muscat" },
  { id: "kw", country: "কুয়েত", at: "কুয়েতে", zone: "Asia/Kuwait" },
  { id: "sg", country: "সিঙ্গাপুর", at: "সিঙ্গাপুরে", zone: "Asia/Singapore" },
  { id: "it", country: "ইতালি", at: "ইতালিতে", zone: "Europe/Rome" },
  { id: "gb", country: "যুক্তরাজ্য", at: "যুক্তরাজ্যে", zone: "Europe/London" },
  { id: "us", country: "যুক্তরাষ্ট্র", city: "নিউ ইয়র্ক", at: "নিউ ইয়র্কে", zone: "America/New_York" },
  { id: "us-c", country: "যুক্তরাষ্ট্র", city: "শিকাগো", at: "শিকাগোতে", zone: "America/Chicago" },
  { id: "us-w", country: "যুক্তরাষ্ট্র", city: "লস অ্যাঞ্জেলেস", at: "লস অ্যাঞ্জেলেসে", zone: "America/Los_Angeles" },
  { id: "ca", country: "কানাডা", city: "টরন্টো", at: "টরন্টোতে", zone: "America/Toronto" },
  { id: "ca-w", country: "কানাডা", city: "ভ্যাঙ্কুভার", at: "ভ্যাঙ্কুভারে", zone: "America/Vancouver" },
  { id: "au", country: "অস্ট্রেলিয়া", city: "সিডনি", at: "সিডনিতে", zone: "Australia/Sydney" },
  { id: "au-w", country: "অস্ট্রেলিয়া", city: "পার্থ", at: "পার্থে", zone: "Australia/Perth" },
  { id: "xx", country: "অন্য দেশ", at: "", zone: "" },
] as const;
export type Place = (typeof places)[number];
export type PlaceId = Place["id"];
/** The country chips (and the tally ids): one per country, its first zone. */
export const countries = places.filter(place => !place.id.includes("-"));
export const countryOf = (id: PlaceId) => id.split("-")[0];
export const zonesOf = (id: PlaceId) => places.filter(place => countryOf(place.id) === countryOf(id));
export const placeOf = (id: PlaceId) => places.find(place => place.id === id)!;

/** The three airports a flight home lands at. */
export const homes = [
  { id: "d", label: "ঢাকা" },
  { id: "c", label: "চট্টগ্রাম" },
  { id: "s", label: "সিলেট" },
] as const;
export type HomeId = (typeof homes)[number]["id"];

/** Who at home is waiting, for the family's reply card. */
export const relations = [
  { id: "ammu", label: "আম্মু" },
  { id: "abbu", label: "আব্বু" },
  { id: "bou", label: "বউ" },
  { id: "shami", label: "স্বামী" },
  { id: "chele", label: "ছেলে" },
  { id: "meye", label: "মেয়ে" },
  { id: "bhai", label: "ভাই" },
  { id: "bon", label: "বোন" },
] as const;
export type RelationId = (typeof relations)[number]["id"];

export const months = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"] as const;

/**
 * Eid-ul-Fitr and Eid-ul-Azha as observed in Bangladesh, used only to count Eids spent abroad (shown as "প্রায়").
 * 2009–2026: the dates the National Moon Sighting Committee fixed (government holiday lists), e.g.
 *   2026 Fitr: https://www.dhakatribune.com/bangladesh/405939/eid-ul-fitr-being-celebrated-in-bangladesh-with
 *   2026 Azha: https://en.ittefaq.com.bd/16594/bangladesh-to-celebrate-eid-ul-azha-on-may-28
 *   2025 Azha: https://en.ittefaq.com.bd/12093/eid-ul-azha-on-june-7-in-bangladesh
 * 1985–2008: estimated as the Umm al-Qura date + 1 day (Bangladesh usually sights the moon a day after Saudi Arabia).
 * 2027–2028: projections, the same as koto-din-baki (https://www.bangladatetoday.com/blog/eid-ul-fitr-2027-date-bangladesh).
 * A one-day slip can only change the count when an Eid falls in the month someone left, which is why it says "প্রায়".
 */
export const eids = [
  "1985-06-21", "1985-08-27", "1986-06-10", "1986-08-17", "1987-05-30", "1987-08-06", "1988-05-18", "1988-07-25",
  "1989-05-08", "1989-07-14", "1990-04-27", "1990-07-04", "1991-04-17", "1991-06-24", "1992-04-06", "1992-06-12",
  "1993-03-26", "1993-06-02", "1994-03-15", "1994-05-22", "1995-03-04", "1995-05-11", "1996-02-21", "1996-04-29",
  "1997-02-10", "1997-04-19", "1998-01-30", "1998-04-08", "1999-01-20", "1999-03-29", "2000-01-09", "2000-03-17",
  "2000-12-28", "2001-03-06", "2001-12-17", "2002-02-23", "2002-12-06", "2003-02-12", "2003-11-26", "2004-02-02",
  "2004-11-15", "2005-01-22", "2005-11-04", "2006-01-11", "2006-10-24", "2007-01-01", "2007-10-14", "2007-12-21",
  "2008-10-02", "2008-12-09",
  "2009-09-21", "2009-11-28", "2010-09-11", "2010-11-17", "2011-08-31", "2011-11-07", "2012-08-20", "2012-10-27",
  "2013-08-09", "2013-10-16", "2014-07-29", "2014-10-06", "2015-07-18", "2015-09-25", "2016-07-07", "2016-09-13",
  "2017-06-26", "2017-09-02", "2018-06-16", "2018-08-22", "2019-06-05", "2019-08-12", "2020-05-25", "2020-08-01",
  "2021-05-14", "2021-07-21", "2022-05-03", "2022-07-10", "2023-04-22", "2023-06-29", "2024-04-11", "2024-06-17",
  "2025-03-31", "2025-06-07", "2026-03-21", "2026-05-28",
  "2027-03-10", "2027-05-17", "2028-02-27", "2028-05-05",
] as const;

const DAY = 86_400_000;
const pad = (value: number) => String(value).padStart(2, "0");
const utc = (date: string) => { const [y, m, d] = date.split("-").map(Number); return Date.UTC(y, m - 1, d); };
export const daysBetween = (from: string, to: string) => Math.round((utc(to) - utc(from)) / DAY);
export const addDays = (date: string, days: number) => new Date(utc(date) + days * DAY).toISOString().slice(0, 10);

export function isDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const [y, m, d] = date.split("-").map(Number);
  return m >= 1 && m <= 12 && d >= 1 && d <= new Date(Date.UTC(y, m, 0)).getUTCDate();
}
const isMonth = (month: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(month);

function zoned(zone: string, now: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const get = (type: string) => parts.find(part => part.type === type)!.value;
  return { date: `${get("year")}-${get("month")}-${get("day")}`, hour: Number(get("hour")) % 24, minute: Number(get("minute")) };
}

/** Today in Bangladesh, the calendar the family at home counts by, whatever the phone's own time zone. */
export const todayInDhaka = (now = new Date()) => zoned("Asia/Dhaka", now).date;

export type Clock = { hour: number; minute: number };
export const clockIn = (zone: string, now = new Date()): Clock => { const { hour, minute } = zoned(zone, now); return { hour, minute }; };

/** "রাত ১১:০৫": the part of day the way people say it, then a 12-hour clock. */
export function clockText({ hour, minute }: Clock) {
  const part = hour < 4 ? "রাত" : hour < 6 ? "ভোর" : hour < 12 ? "সকাল" : hour < 15 ? "দুপুর" : hour < 18 ? "বিকেল" : hour < 20 ? "সন্ধ্যা" : "রাত";
  return `${part} ${bn(hour % 12 || 12)}:${bn(pad(minute))}`;
}

/** "দেশ ৩ ঘণ্টা এগিয়ে" from two wall clocks read at the same instant (so daylight saving is already in them). */
export function gapText(here: Clock, home: Clock) {
  let gap = (home.hour * 60 + home.minute) - (here.hour * 60 + here.minute);
  if (gap > 720) gap -= 1440;
  if (gap <= -720) gap += 1440;
  if (gap === 0) return "দেশের সাথে একই সময়";
  const size = Math.abs(gap), hours = Math.floor(size / 60), minutes = size % 60;
  const amount = [hours && `${bn(hours)} ঘণ্টা`, minutes && `${bn(minutes)} মিনিট`].filter(Boolean).join(" ");
  return `দেশ ${amount} ${gap > 0 ? "এগিয়ে" : "পিছিয়ে"}`;
}

/** What home is probably doing at this hour in Bangladesh. */
export function homeNote(hour: number) {
  if (hour >= 23 || hour < 5) return "বাড়িতে সবাই হয়তো ঘুমিয়ে।";
  if (hour < 8) return "বাড়িতে দিন শুরু হচ্ছে।";
  if (hour < 12) return "বাড়িতে সকালের ব্যস্ততা।";
  if (hour < 15) return "বাড়িতে দুপুরের ভাতের সময়।";
  if (hour < 18) return "বাড়িতে বিকেলের চা।";
  if (hour < 20) return "বাড়িতে সন্ধ্যা নেমেছে।";
  return "সবাই জেগে আছে, ফোন দিতে পারো।";
}

export const monthsAbroad = (left: string, today: string) => {
  const [ly, lm] = left.split("-").map(Number), [ty, tm] = today.split("-").map(Number);
  return (ty - ly) * 12 + (tm - lm);
};

export function abroadText(total: number) {
  if (total <= 0) return "এই মাসেই";
  const years = Math.floor(total / 12), rest = total % 12;
  return [years && `${bn(years)} বছর`, rest && `${bn(rest)} মাস`].filter(Boolean).join(" ");
}

/** Eids after the month someone left, up to and including today. The leaving month is left out: many fly out right after Eid. */
export function eidsAway(left: string, today: string) {
  const [y, m] = left.split("-").map(Number);
  const from = m === 12 ? `${y + 1}-01-01` : `${y}-${pad(m + 1)}-01`;
  return eids.filter(date => date >= from && date <= today).length;
}

export const nextEid = (today: string) => eids.find(date => date > today) ?? "";

export function cleanName(name: string) {
  // Strip control and bidi-override characters so a shared link can't scramble the card text.
  return name.normalize("NFC").replace(/[\u0000-\u001f\u007f‪-‮⁦-⁩]/g, "").trim().replace(/\s+/g, " ").slice(0, MAX_NAME_LENGTH);
}

export type Trip = { place: PlaceId; left: string; back: string; home: HomeId; name: string; waiting?: RelationId | "" };

export const sampleTrip: Trip = { place: "sa", left: "2019-07", back: "", home: "d", name: "" };

export function validLeft(left: string, today: string) {
  return isMonth(left) && left >= MIN_LEFT && left <= today.slice(0, 7);
}

/** A return date must come after leaving and be at most two years ahead. Dates that have since passed stay valid, so old links still open. */
export function validBack(back: string, left: string, today: string) {
  return isDate(back) && back.slice(0, 7) >= left && back <= addDays(today, MAX_AHEAD_DAYS);
}

export function shareHash({ place, left, back, home, name, waiting }: Trip) {
  const params = new URLSearchParams({ c: place, l: left });
  if (back) params.set("r", back);
  if (home !== "d") params.set("h", home);
  const shown = cleanName(name);
  if (shown) params.set("n", shown);
  if (waiting) params.set("w", waiting);
  return "#" + params.toString();
}

export function parseShareHash(hash: string, today = todayInDhaka()): Trip | null {
  if (hash.length > 400) return null;
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const place = places.find(item => item.id === params.get("c"))?.id;
  const left = params.get("l") ?? "";
  if (!place || !validLeft(left, today)) return null;
  const back = params.get("r") ?? "";
  if (back && !validBack(back, left, today)) return null;
  const home = homes.find(item => item.id === params.get("h"))?.id ?? "d";
  const waiting = relations.find(item => item.id === params.get("w"))?.id ?? "";
  return { place, left, back, home, name: cleanName(params.get("n") ?? ""), waiting };
}

export function humanLine(total: number, eidCount: number, daysLeft: number | null, eidAtHome: boolean) {
  if (daysLeft !== null && daysLeft <= 0) return "অপেক্ষা শেষ, এবার বাড়ির ভাত।";
  if (daysLeft !== null) {
    const after = eidAtHome ? "এবারের ঈদ বাড়ির উঠোনে।" : "এবার দেখা হবে সামনাসামনি।";
    return eidCount ? `${bn(eidCount)}টা ঈদ ভিডিও কলে। ${after}` : `দিন গুনছি। ${after}`;
  }
  if (total < 12) return "প্রথম বছরটাই সবচেয়ে লম্বা।";
  if (total >= 120) return "এত বছরেও উঠোনের মাটির গন্ধটা ভুলিনি।";
  return "দূরে আছি, মন পড়ে আছে বাড়ির উঠোনে।";
}

export type Card = {
  name: string;
  place: Place;
  from: string;
  to: string;
  abroad: string;
  months: number;
  eids: number;
  eidText: string;
  /** Days until the return date in Bangladesh; null when no date is set, 0 on the day, negative once home. */
  daysLeft: number | null;
  stamp: string;
  line: string;
  waiting: string;
};

export function createCard(trip: Trip, today: string): Card {
  const place = placeOf(trip.place);
  const total = Math.max(0, monthsAbroad(trip.left, today));
  const eidCount = eidsAway(trip.left, today);
  const daysLeft = trip.back ? daysBetween(today, trip.back) : null;
  const upcoming = nextEid(today);
  // Home for Eid when the flight lands within three weeks before the next one.
  const eidAtHome = Boolean(trip.back && upcoming && trip.back <= upcoming && daysBetween(trip.back, upcoming) <= 21);
  return {
    name: cleanName(trip.name),
    place,
    from: place.id === "xx" ? "বিদেশ" : place.country,
    to: homes.find(home => home.id === trip.home)!.label,
    abroad: total ? `${abroadText(total)} প্রবাসে` : "প্রবাসে প্রথম মাস",
    months: total,
    eids: eidCount,
    eidText: eidCount ? `${bn(eidCount)}টা ঈদ দূরে` : "প্রথম ঈদটা সামনে",
    daysLeft,
    stamp: daysLeft === null ? "মন বাড়িতে" : daysLeft > 0 ? `আর ${bn(daysLeft)} দিন` : daysLeft === 0 ? "আজ ফিরছি" : "ফিরে এসেছি",
    line: humanLine(total, eidCount, daysLeft, eidAtHome),
    waiting: relations.find(relation => relation.id === trip.waiting)?.label ?? "",
  };
}

/** "দেশে ফিরছে আর ৪৭ দিন" about someone, "দেশে ফিরছি …" about yourself. */
function countdownPhrase(daysLeft: number, me: boolean) {
  if (daysLeft > 0) return `দেশে ${me ? "ফিরছি" : "ফিরছে"} আর ${bn(daysLeft)} দিন`;
  if (daysLeft === 0) return `আজ দেশে ${me ? "ফিরছি" : "ফিরছে"}!`;
  return `দেশে ${me ? "ফিরেছি" : "ফিরেছে"}!`;
}

/** "রাফি দেশে ফিরছে আর ৪৭ দিন" for the family; without a name, the traveller's own voice. */
export function countdownLine(card: Card) {
  if (card.daysLeft === null) return card.name ? `${card.name} ${card.abroad}` : card.abroad;
  return card.name ? `${card.name} ${countdownPhrase(card.daysLeft, false)}` : countdownPhrase(card.daysLeft, true);
}

/** Link-preview title: "রাফি ৭ বছর প্রবাসে — দেশে ফিরছে আর ৪৭ দিন". */
export function previewTitle(card: Card) {
  if (card.waiting) return `${card.waiting} অপেক্ষায় — ${countdownLine(card)}`;
  if (card.daysLeft === null) return `${countdownLine(card)} · ${card.eidText}`;
  const years = card.months >= 12 ? `${bn(Math.floor(card.months / 12))} বছর প্রবাসে` : card.abroad;
  return `${card.name ? `${card.name} ` : ""}${years} — ${countdownPhrase(card.daysLeft, !card.name)}`;
}

/** The family's fixed reply: "রাফি ফিরছে আর ৪৭ দিন। আমরা অপেক্ষায় — আম্মু". */
export function replyLine(card: Card, waiting: string) {
  const sign = `আমরা অপেক্ষায় — ${waiting}`;
  if (card.daysLeft === null) return `${card.name ? `${card.name}, ` : ""}তাড়াতাড়ি ফিরো। ${sign}`;
  if (card.daysLeft > 0) return `${card.name ? `${card.name} ফিরছে` : "তুমি ফিরছ"} আর ${bn(card.daysLeft)} দিন। ${sign}`;
  return `${card.name ? `${card.name}, ` : ""}তুমি ফিরেছ, এটাই আমাদের ঈদ। — ${waiting}`;
}
