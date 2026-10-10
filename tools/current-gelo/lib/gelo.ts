// কারেন্ট গেল!: day keys, divisions, tally ids, link state and the lines on the card. Pure, so it runs in tests and on the server.
// No schedules, forecasts or official figures anywhere: every number is the person's own, or a crowd average labelled as unofficial.

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;
export const DAY_MINUTES = 24 * 60;
// Bangladesh keeps UTC+6 all year (no daylight saving since 2009: https://www.timeanddate.com/time/zone/bangladesh/dhaka),
// so a fixed offset gives the Dhaka day and clock on any phone, diaspora phones included.
const DHAKA = 6 * HOUR;

/** The Dhaka calendar day ("2027-05-02") a moment falls on. */
export const dayKey = (ms: number) => new Date(ms + DHAKA).toISOString().slice(0, 10);
/** The moment a Dhaka day begins (midnight in Bangladesh). */
export const dayStart = (day: string) => Date.parse(`${day}T00:00:00Z`) - DHAKA;
export const previousDay = (day: string) => dayKey(dayStart(day) - HOUR);

export function isDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const time = Date.parse(`${date}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === date && date >= "2026-01-01" && date <= "2099-12-31";
}

// Fixed ids: `id` goes in links, `code` in tally ids. Once public, never rename either.
export const divisions = [
  { id: "dhaka", code: "dh", label: "ঢাকা", at: "ঢাকায়" },
  { id: "chattogram", code: "ct", label: "চট্টগ্রাম", at: "চট্টগ্রামে" },
  { id: "rajshahi", code: "rj", label: "রাজশাহী", at: "রাজশাহীতে" },
  { id: "khulna", code: "kh", label: "খুলনা", at: "খুলনায়" },
  { id: "barishal", code: "bs", label: "বরিশাল", at: "বরিশালে" },
  { id: "sylhet", code: "sy", label: "সিলেট", at: "সিলেটে" },
  { id: "rangpur", code: "rp", label: "রংপুর", at: "রংপুরে" },
  { id: "mymensingh", code: "my", label: "ময়মনসিংহ", at: "ময়মনসিংহে" },
] as const;
export type DivisionId = (typeof divisions)[number]["id"];
export const isDivision = (id: unknown): id is DivisionId => divisions.some(division => division.id === id);
export const divisionOf = (id: DivisionId | "") => divisions.find(division => division.id === id);

// Tally buckets over the day's minutes. Ids 0–6 are fixed; `mid` is the hours each bucket stands for in the rough average.
export const buckets = [
  { id: 0, upTo: 0, mid: 0, label: "একবারও যায়নি" },
  { id: 1, upTo: 60, mid: 0.5, label: "১ ঘণ্টার মধ্যে" },
  { id: 2, upTo: 120, mid: 1.5, label: "১–২ ঘণ্টা" },
  { id: 3, upTo: 240, mid: 3, label: "২–৪ ঘণ্টা" },
  { id: 4, upTo: 360, mid: 5, label: "৪–৬ ঘণ্টা" },
  { id: 5, upTo: 540, mid: 7.5, label: "৬–৯ ঘণ্টা" },
  { id: 6, upTo: Infinity, mid: 11, label: "৯ ঘণ্টার বেশি" },
] as const;
export const bucketOf = (minutes: number) => buckets.find(bucket => minutes <= bucket.upTo)!;

/** "270502kh4": Dhaka day × division × hours bucket. Never free text. */
export const tallyId = (day: string, division: DivisionId, bucket: number) => `${day.slice(2).replaceAll("-", "")}${divisionOf(division)!.code}${bucket}`;

/**
 * The ids the tally API accepts right now: yesterday, today and tomorrow in Dhaka (tomorrow absorbs a phone clock running ahead).
 * shortcut: past days' counts stay in the tally table and in GET /api/tally (~100KB after a full season); add a per-day read or pruning API before a second season.
 */
export function tallyWindow(now = Date.now()) {
  return [-1, 0, 1].flatMap(offset => {
    const day = dayKey(now + offset * DAY);
    return divisions.flatMap(division => buckets.map(bucket => tallyId(day, division.id, bucket.id)));
  });
}

/**
 * The API keeps one vote list per browser and replaces it on every vote, subtracting whatever was left out.
 * So a vote re-sends this browser's pick for yesterday next to today's: yesterday's counts stay whole, and only picks older than
 * yesterday fall away (those days are never shown).
 */
export function votesToSend(votes: Record<string, string>, today: string, todayId: string) {
  const yesterday = previousDay(today);
  const kept: Record<string, string> = { [today]: todayId };
  if (typeof votes[yesterday] === "string") kept[yesterday] = votes[yesterday];
  return kept;
}

/** Below this, an average is one or two households, not a picture of the area. */
export const MIN_SAMPLE = 15;
type Counts = { counts: Record<string, number> };

export function reports(tally: Counts | null, day: string, division: DivisionId | "") {
  let count = 0, hours = 0;
  if (!tally) return { count, hours };
  for (const each of division ? [division] : divisions.map(item => item.id)) {
    for (const bucket of buckets) {
      const votes = Math.max(0, Math.floor(tally.counts[tallyId(day, each, bucket.id)] ?? 0));
      count += votes;
      hours += votes * bucket.mid;
    }
  }
  return { count, hours: count ? hours / count : 0 };
}

export type Crowd = { scope: "division" | "country"; hours: number; count: number; line: string };

/** The division's average when enough people there reported that day, else the whole country's, else nothing. */
export function crowd(tally: Counts | null, day: string, division: DivisionId | ""): Crowd | null {
  const area = divisionOf(division);
  if (area) {
    const local = reports(tally, day, area.id);
    if (local.count >= MIN_SAMPLE) return { scope: "division", ...local, line: `${area.label} বিভাগে গড় ${roughHours(local.hours)}` };
  }
  const country = reports(tally, day, "");
  return country.count >= MIN_SAMPLE ? { scope: "country", ...country, line: `সারা দেশে গড় ${roughHours(country.hours)}` } : null;
}
export const CROWD_NOTE = "যারা জানিয়েছে — অফিশিয়াল হিসাব নয়";

const numbers = new Intl.NumberFormat("bn-BD");
export const bn = (value: number) => numbers.format(value);

/** Bucket midpoints make the average rough, so it is said roughly. */
export function roughHours(hours: number) {
  if (hours < 0.75) return "১ ঘণ্টার কম";
  return `প্রায় ${bn(Math.round(hours))} ঘণ্টা`;
}

export function duration(minutes: number) {
  const hours = Math.floor(minutes / 60), rest = minutes % 60;
  if (!hours) return `${bn(rest)} মিনিট`;
  return rest ? `${bn(hours)} ঘণ্টা ${bn(rest)} মিনিট` : `${bn(hours)} ঘণ্টা`;
}

const dateFormat = new Intl.DateTimeFormat("bn-BD", { day: "numeric", month: "long", timeZone: "UTC" });
const weekdayFormat = new Intl.DateTimeFormat("bn-BD", { weekday: "long", timeZone: "UTC" });
export const dateLabel = (date: string) => isDate(date) ? dateFormat.format(Date.parse(date)) : "";
export const weekdayLabel = (date: string) => isDate(date) ? weekdayFormat.format(Date.parse(date)) : "";

/** "রাত ৮:১০": the way people say the time here, in Dhaka time. */
export function clock(ms: number) {
  const local = new Date(ms + DHAKA);
  const hour = local.getUTCHours(), minute = local.getUTCMinutes();
  const part = hour < 4 ? "রাত" : hour < 6 ? "ভোর" : hour < 12 ? "সকাল" : hour < 15 ? "দুপুর" : hour < 18 ? "বিকেল" : hour < 20 ? "সন্ধ্যা" : "রাত";
  return `${part} ${bn(hour % 12 || 12)}:${minute < 10 ? "০" : ""}${bn(minute)}`;
}

/** A gentle, shared joke picked from the day's numbers. Never angry, never about anyone to blame. */
export function humanLine(minutes: number, times: number) {
  if (minutes === 0) return "মোমবাতিটা তুলে রাখো, হাতপাখারও আজ ছুটি।";
  if (minutes >= 600) return "আজকের দিনটা হারিকেনের নামে লিখে দেওয়া যায়।";
  if (minutes >= 360) return "হাতপাখার ব্যায়ামে আজ তুমি চ্যাম্পিয়ন।";
  if (times >= 5) return "কারেন্টের আজ লুকোচুরির মুড: এই আছে, এই নেই।";
  if (minutes >= 180) return "মোমবাতি গলল, সাথে একটু ধৈর্যও। গরমটা তো আছেই।";
  if (minutes >= 60) return "হাতপাখাটা আজ খাটের নিচ থেকে বের করতেই হলো।";
  return "মোমবাতি খুঁজে পাওয়ার আগেই কারেন্ট চলে এল।";
}

/** How tall the candle stands: full on a bright day, a stub after 12 hours (it never vanishes). */
export const candleLeft = (minutes: number) => 1 - 0.82 * Math.min(1, Math.max(0, minutes) / (12 * 60));

export type Day = { minutes: number; times: number; division: DivisionId | ""; date: string };
export const MAX_TIMES = 50;
const clamp = (value: number, max: number) => Math.min(max, Math.max(0, Math.round(value)));

export function shareHash({ minutes, times, division, date }: Day) {
  const params = new URLSearchParams({ m: String(clamp(minutes, DAY_MINUTES)) });
  if (times > 0) params.set("n", String(clamp(times, MAX_TIMES)));
  if (isDivision(division)) params.set("dv", division);
  if (isDate(date)) params.set("d", date);
  return "#" + params.toString();
}

const whole = (text: string | null) => text !== null && /^\d{1,5}$/.test(text) ? Number(text) : NaN;

/** A shared day, or null for anything that isn't one (including in-page anchors like #result). Out-of-range numbers are capped. */
export function parseShareHash(hash: string): Day | null {
  let params: URLSearchParams;
  try { params = new URLSearchParams(hash.replace(/^#/, "")); } catch { return null; }
  const minutes = whole(params.get("m"));
  if (Number.isNaN(minutes)) return null;
  const times = params.has("n") ? whole(params.get("n")) : 0;
  const division = params.get("dv") ?? "";
  const date = params.get("d") ?? "";
  return { minutes: clamp(minutes, DAY_MINUTES), times: Number.isNaN(times) ? 0 : clamp(times, MAX_TIMES), division: isDivision(division) ? division : "", date: isDate(date) ? date : "" };
}

/** "আজ" on the day itself, the date afterwards, so an old card never claims to be today's. */
export const whenLabel = (date: string, today: string) => !date || date === today ? "আজ" : dateLabel(date);

export function caption({ minutes, times, division }: Day) {
  const area = divisionOf(division);
  if (!minutes) return `আজ${area ? ` ${area.at}` : ""} একবারও কারেন্ট যায়নি! মোমবাতিটা তুলে রাখলাম। তোমার এলাকায় আজ কেমন?`;
  return `আজ${area ? ` ${area.at}` : ""} ${duration(minutes)} কারেন্ট ছিল না${times > 1 ? `, ${bn(times)} বার গেল-এল` : ""}। ${humanLine(minutes, times)} তোমার এলাকায় আজ কত ঘণ্টা?`;
}

export function previewTitle({ minutes, division, date }: Day) {
  const area = divisionOf(division);
  const when = dateLabel(date) || "আজ";
  const where = area ? ` ${area.at}` : "";
  if (!minutes) return `${when}${where} একবারও কারেন্ট যায়নি! তোমার এলাকায় কেমন?`;
  return `${when}${where} ${duration(minutes)} কারেন্ট ছিল না — তোমার এলাকায় কত ঘণ্টা?`;
}
