import { districtName, districts, divisions, isDistrictId, type DistrictId } from "../../bhashar-chhobi/lib/districts";
import { bn, countdown, dateLine, daysBetween, dhakaToday, occasionById, shortDate } from "../../koto-din-baki/lib/countdown";
import { TIMETABLE_1448 } from "./data-1448";

export { bn, dateLine, dhakaToday, districtName, districts, divisions, shortDate, type DistrictId };

/*
 * Times come ONLY from the Islamic Foundation Bangladesh's official timetable (see data-1448.ts), never computed.
 * The start of Ramadan before that table exists comes from the moon config shared with koto-din-baki
 * (a projection, always shown as "সম্ভাব্য"; the National Moon Sighting Committee fixes the real day).
 */
export const IF_HOME = { label: "ইসলামিক ফাউন্ডেশন বাংলাদেশ", url: "https://www.islamicfoundation.gov.bd/" } as const;
/** The day we last looked for the IF table. */
export const CHECKED = "2026-10-10";

export type DayRow = { day: number; date: string; sehri: string; iftar: string };
export type Offset = { from: number; sehri: number; iftar: number };
export type Timetable = {
  hijriYear: number;
  source: { label: string; url: string };
  /** "YYYY-MM-DD": the day the two independent entries diffed clean. */
  checked: string;
  checkedBy: readonly [string, string];
  /** Fixture data for tests: never shown to anyone. */
  test?: true;
  days: readonly DayRow[];
  offsets: Readonly<Record<string, readonly Offset[]>>;
};

const HOUR = 3_600_000, MINUTE = 60_000;
const CLOCK = /^([01]\d|2[0-3]):([0-5]\d)$/;
const minutesOf = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3));
const isDate = (text: string) => /^\d{4}-\d{2}-\d{2}$/.test(text) && new Date(text + "T00:00:00Z").toISOString().startsWith(text);
const plusDays = (date: string, days: number) => new Date(Date.parse(date) + days * 86_400_000).toISOString().slice(0, 10);

/** Everything wrong with a table, in plain words for whoever enters it. Empty means usable. */
export function validate(table: Timetable): string[] {
  const problems: string[] = [];
  if (!/^https:\/\/[^\s]+$/.test(table.source?.url ?? "") || !table.source.label?.trim()) problems.push("source needs a label and an https url");
  if (!isDate(table.checked)) problems.push("checked must be a YYYY-MM-DD date");
  const [a, b] = table.checkedBy ?? [];
  if (!a?.trim() || !b?.trim() || a.trim() === b.trim()) problems.push("checkedBy needs two different people");
  const days = table.days ?? [];
  if (days.length < 29 || days.length > 30) problems.push(`days has ${days.length} rows, expected 29 or 30`);
  days.forEach((row, index) => {
    const at = `day ${index + 1}`;
    if (row.day !== index + 1) problems.push(`${at}: day number is ${row.day}`);
    if (!isDate(row.date) || (index > 0 && row.date !== plusDays(days[index - 1].date, 1))) problems.push(`${at}: date ${row.date} does not follow the day before`);
    if (!CLOCK.test(row.sehri) || !CLOCK.test(row.iftar)) { problems.push(`${at}: times must be 24-hour HH:MM`); return; }
    // Loose sanity bounds for Bangladesh in any season; they catch a typed 14:56 or 06:02.
    if (minutesOf(row.sehri) < 180 || minutesOf(row.sehri) > 360) problems.push(`${at}: sehri ${row.sehri} is outside 03:00–06:00`);
    if (minutesOf(row.iftar) < 990 || minutesOf(row.iftar) > 1170) problems.push(`${at}: iftar ${row.iftar} is outside 16:30–19:30`);
    const before = days[index - 1];
    if (before && CLOCK.test(before.sehri) && CLOCK.test(before.iftar)
      && (Math.abs(minutesOf(row.sehri) - minutesOf(before.sehri)) > 3 || Math.abs(minutesOf(row.iftar) - minutesOf(before.iftar)) > 3)) problems.push(`${at}: moved more than 3 minutes from the day before (typo?)`);
  });
  for (const district of districts) {
    const parts = table.offsets?.[district.id];
    if (!parts?.length) { problems.push(`offsets: ${district.id} is missing`); continue; }
    if (parts[0].from !== 1 || parts.some((part, i) => i > 0 && part.from <= parts[i - 1].from)) problems.push(`offsets: ${district.id} parts must start at day 1 and go up`);
    for (const part of parts) {
      if (![part.sehri, part.iftar].every(value => Number.isInteger(value) && Math.abs(value) <= 15)) problems.push(`offsets: ${district.id} has a difference over 15 minutes`);
      if (district.id === "dhaka" && (part.sehri !== 0 || part.iftar !== 0)) problems.push("offsets: dhaka must be 0");
    }
  }
  for (const id of Object.keys(table.offsets ?? {})) if (!isDistrictId(id)) problems.push(`offsets: unknown district ${id}`);
  return problems;
}

/** The table people may see: a real (non-test) table with no problems, else null. */
export const usable = (table: Timetable | null): Timetable | null => table && !table.test && validate(table).length === 0 ? table : null;
/** What the page shows. Null until IF publishes 1448 and two people enter and diff it. */
export const live = usable(TIMETABLE_1448);

const dhakaMs = (date: string, hhmm: string) => Date.parse(`${date}T${hhmm}:00+06:00`);
/** "৪:৫৬" in Dhaka time, 12-hour, as IF and every pocket card print it. */
export function clock(ms: number) {
  const time = new Date(ms + 6 * HOUR);
  return `${bn(time.getUTCHours() % 12 || 12)}:${bn(time.getUTCMinutes()).padStart(2, "০")}`;
}

export type DayTimes = { day: number; date: string; sehri: number; iftar: number };
/** One রমজান day's times for a district: IF's Dhaka time plus IF's difference for that district. */
export function timesFor(table: Timetable, district: DistrictId, row: DayRow): DayTimes {
  const part = [...table.offsets[district]].reverse().find(item => item.from <= row.day)!;
  return { day: row.day, date: row.date, sehri: dhakaMs(row.date, row.sehri) + part.sehri * MINUTE, iftar: dhakaMs(row.date, row.iftar) + part.iftar * MINUTE };
}
export const monthFor = (table: Timetable | null, district: DistrictId) => table ? table.days.map(row => timesFor(table, district, row)) : [];

/** The day to show: today's until today's iftar, then tomorrow's. Null with no table or outside Ramadan. */
export function showDay(table: Timetable | null, district: DistrictId, now: number): (DayTimes & { tomorrow: boolean }) | null {
  const today = dhakaToday(new Date(now));
  const month = monthFor(table, district);
  const index = month.findIndex(day => day.date === today);
  if (index >= 0 && now < month[index].iftar) return { ...month[index], tomorrow: false };
  const next = month.find(day => day.date === plusDays(today, 1));
  return next ? { ...next, tomorrow: true } : null;
}

export type NextEvent = { kind: "sehri" | "iftar"; at: number; minutes: number };
export function nextEvent(table: Timetable | null, district: DistrictId, now: number): NextEvent | null {
  for (const day of monthFor(table, district)) {
    for (const kind of ["sehri", "iftar"] as const) if (day[kind] > now) return { kind, at: day[kind], minutes: Math.ceil((day[kind] - now) / MINUTE) };
  }
  return null;
}

/** "১ ঘণ্টা ১২ মিনিট". */
export function duration(minutes: number) {
  const hours = Math.floor(minutes / 60), rest = minutes % 60;
  return [hours && `${bn(hours)} ঘণ্টা`, (rest || !hours) && `${bn(rest)} মিনিট`].filter(Boolean).join(" ");
}

export type Season =
  | { phase: "before"; start: string; total: number; days: number; likely: boolean; hijri: number }
  | { phase: "during"; start: string; total: number; day: number; likely: boolean; hijri: number }
  | { phase: "unknown" };

// Both are moon occasions with a date list in koto-din-baki; the starts and Eids pair up by index.
const moonDates = (id: "ramadan" | "eid-fitr") => (occasionById(id) as { dates: readonly string[] }).dates;
const hijriYear = (date: string) => parseInt(new Intl.DateTimeFormat("en-US-u-ca-islamic-umalqura", { year: "numeric", timeZone: "UTC" }).format(new Date(plusDays(date, 10))), 10);

/** Where today sits: before Ramadan (days to go) or in it (which day). The IF table wins over the moon projection. */
export function season(table: Timetable | null, today: string): Season {
  const windows = table
    ? [{ start: table.days[0].date, total: table.days.length, likely: false }]
    : moonDates("ramadan").map((start, index) => ({ start, total: daysBetween(start, moonDates("eid-fitr")[index]), likely: countdown({ id: "ramadan" }, start).likely }));
  const window = windows.find(item => daysBetween(today, item.start) + item.total > 0);
  if (!window) return { phase: "unknown" };
  const hijri = table?.hijriYear ?? hijriYear(window.start);
  const until = daysBetween(today, window.start);
  return until > 0 ? { phase: "before", ...window, days: until, hijri } : { phase: "during", ...window, day: 1 - until, hijri };
}

/** The warm line under the card, from the moment the person is in. */
export function humanLine(time: Season, next: NextEvent | null) {
  if (next?.kind === "iftar" && next.minutes <= 15) return "শরবতটা বানিয়ে ফেলো।";
  if (next?.kind === "sehri" && next.minutes <= 30) return "শেষ লোকমাটা সেরে নাও, এক গ্লাস পানি খেয়ে নিও।";
  if (time.phase === "unknown") return "পরের রমজানের তারিখ এলেই বসিয়ে দেব।";
  if (time.phase === "during") {
    if (time.day === 1) return "প্রথম রোজা। রমজান মোবারক।";
    if (time.total - time.day < 3) return "ঈদ আর বেশি দূরে নেই।";
    return "ইফতারের আগে বাড়িটা আরেকটু ব্যস্ত হয়ে ওঠে।";
  }
  if (time.days <= 3) return "চাঁদ দেখার অপেক্ষা। ছাদে উঠতে তৈরি থাকো।";
  if (time.days <= 30) return "রমজান প্রায় এসে গেল। বাজারের লিস্টটা শুরু করো।";
  return "রমজান আসছে। দিন গোনা শুরু।";
}

/** "রমজান আসতে সম্ভাব্য আর ১২২ দিন" / "আজ ১২ রমজান". */
export function seasonText(time: Season) {
  if (time.phase === "unknown") return "পরের রমজানের তারিখ আসছে";
  const maybe = time.likely ? "সম্ভাব্য " : "";
  return time.phase === "before" ? `রমজান আসতে ${maybe}আর ${bn(time.days)} দিন` : `আজ ${maybe}${bn(time.day)} রমজান`;
}

export const shareHash = (district: DistrictId) => "#" + new URLSearchParams({ z: district }).toString();
/** Reads #z=dhaka; anything else is null. */
export function parseShareHash(hash: string): DistrictId | null {
  let params: URLSearchParams;
  try { params = new URLSearchParams(hash.replace(/^#/, "")); } catch { return null; }
  const id = (params.get("z") ?? "").normalize("NFC").trim().toLowerCase();
  return isDistrictId(id) ? id : null;
}

/** Link-preview title. No clock times: Facebook caches previews for days, and a stale time would mislead. */
export function previewTitle(district: DistrictId, today: string) {
  return `${districtName(district)} · ${seasonText(season(live, today))} — তোমার জেলায় ইফতার কখন?`;
}
