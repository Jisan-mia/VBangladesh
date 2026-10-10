// The tap log: outages kept as absolute moments, so one that runs past midnight splits across two Dhaka days.
import { DAY, DAY_MINUTES, HOUR, MINUTE, dayKey, dayStart, isDate, isDivision, previousDay, type DivisionId } from "./gelo";

/** An outage still open counts for at most this long; past it, "এল" was almost surely forgotten. */
export const MAX_OPEN = 12 * HOUR;
/** After this long without "এল", ask whether it was forgotten. */
export const ASK_AFTER = 4 * HOUR;
const MAX_OUTAGES = 80;
const KEEP = 3 * DAY;

export type Outage = { off: number; on: number | null };
/** `adjust`: minutes added or taken away by hand (the stepper), per Dhaka day. `votes`: this browser's tally pick per day. */
export type Saved = { outages: Outage[]; adjust: Record<string, number>; division: DivisionId | ""; votes: Record<string, string> };
export const empty: Saved = { outages: [], adjust: {}, division: "", votes: {} };
export const STORAGE_KEY = "current-gelo";

export const openOutage = (saved: Saved) => { const last = saved.outages.at(-1); return last && last.on === null ? last : null; };

/** Where an outage stops counting: when power came back, else now, but never past MAX_OPEN. */
export const endOf = (outage: Outage, now: number) => outage.on ?? Math.max(outage.off, Math.min(now, outage.off + MAX_OPEN));

function spans(outages: readonly Outage[], day: string, now: number) {
  const start = dayStart(day), stop = Math.min(start + DAY, now);
  return outages.map(outage => [Math.max(outage.off, start), Math.min(endOf(outage, now), stop)] as const).filter(([from, to]) => to > from);
}

/** Minutes without power on one Dhaka day from the taps alone. Overlaps (after a fix) are merged, never counted twice. */
export function tapMinutes(outages: readonly Outage[], day: string, now: number) {
  let total = 0, reached = -Infinity;
  for (const [from, to] of [...spans(outages, day, now)].sort((a, b) => a[0] - b[0])) {
    const begin = Math.max(from, reached);
    if (to > begin) total += to - begin;
    reached = Math.max(reached, to);
  }
  return Math.floor(total / MINUTE);
}

/** How many times the power went on that day (an outage carried over from last night counts on both days). */
export const outageCount = (outages: readonly Outage[], day: string, now: number) => spans(outages, day, now).length;

/** The day's total: taps plus the hand adjustment, kept between 0 and 24 hours. */
export function dayMinutes(saved: Saved, day: string, now: number) {
  return Math.min(DAY_MINUTES, Math.max(0, tapMinutes(saved.outages, day, now) + (saved.adjust[day] ?? 0)));
}

export function goOff(saved: Saved, now: number): Saved {
  if (openOutage(saved)) return saved;
  return { ...saved, outages: [...saved.outages, { off: now, on: null }].slice(-MAX_OUTAGES) };
}

/** Closes the open outage at `at` (default now): never before it began, after now, or longer than MAX_OPEN (the stepper adds the rest of a truly longer one). */
export function comeOn(saved: Saved, now: number, at = now): Saved {
  const open = openOutage(saved);
  if (!open) return saved;
  return { ...saved, outages: [...saved.outages.slice(0, -1), { off: open.off, on: Math.min(now, open.off + MAX_OPEN, Math.max(open.off, at)) }] };
}

export function removeOutage(saved: Saved, index: number): Saved {
  if (!saved.outages[index]) return saved;
  return { ...saved, outages: saved.outages.filter((_, at) => at !== index) };
}

/** The stepper: moves the day's total to the next whole hour up or down, by changing only the hand adjustment. */
export function stepHours(saved: Saved, day: string, now: number, direction: 1 | -1): Saved {
  const total = dayMinutes(saved, day, now);
  const target = Math.min(DAY_MINUTES, Math.max(0, direction > 0 ? Math.floor(total / 60) * 60 + 60 : Math.ceil(total / 60) * 60 - 60));
  const adjust = target - tapMinutes(saved.outages, day, now);
  return { ...saved, adjust: { ...saved.adjust, [day]: adjust } };
}

export function clearAdjust(saved: Saved, day: string): Saved {
  const adjust = { ...saved.adjust };
  delete adjust[day];
  return { ...saved, adjust };
}

/** The moment "HH:MM" (Dhaka) first comes after an outage began; null when malformed or still in the future. */
export function endAt(off: number, time: string, now: number) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) return null;
  let at = dayStart(dayKey(off)) + Number(match[1]) * HOUR + Number(match[2]) * MINUTE;
  if (at <= off) at += DAY;
  return at <= now ? at : null;
}

/** "HH:MM" in Dhaka for a time input's default value. */
export function hhmm(ms: number) {
  const iso = new Date(ms + 6 * HOUR).toISOString();
  return iso.slice(11, 16);
}

const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

function dayRecord<T>(value: unknown, keep: (day: string, item: unknown) => item is T, from: string) {
  const out: Record<string, T> = {};
  if (value && typeof value === "object") for (const [day, item] of Object.entries(value)) if (isDate(day) && day >= from && keep(day, item)) out[day] = item;
  return out;
}

/** Reads what this browser saved, dropping anything malformed and anything older than three days. Never throws. */
export function parseSaved(text: string | null, now: number): Saved {
  let raw: unknown;
  try { raw = text ? JSON.parse(text) : null; } catch { return empty; }
  if (!raw || typeof raw !== "object") return empty;
  const data = raw as Record<string, unknown>;
  const from = previousDay(previousDay(dayKey(now)));
  let last = -Infinity;
  const outages: Outage[] = [];
  for (const item of Array.isArray(data.outages) ? data.outages.slice(-MAX_OUTAGES) : []) {
    const off = (item as Outage)?.off, on = (item as Outage)?.on;
    if (!finite(off) || off < last || off > now + HOUR || (on !== null && (!finite(on) || on < off))) continue;
    if (on !== null && on < now - KEEP) continue;
    // Only the newest outage may still be open; an older open one was overtaken, so it ends where the next begins.
    if (outages.length && outages.at(-1)!.on === null) outages.at(-1)!.on = off;
    outages.push({ off, on });
    last = on ?? off;
  }
  return {
    outages,
    adjust: dayRecord(data.adjust, (_, item): item is number => finite(item) && Math.abs(item) <= DAY_MINUTES, from),
    division: isDivision(data.division) ? data.division : "",
    votes: dayRecord(data.votes, (_, item): item is string => typeof item === "string" && /^\d{6}[a-z]{2}\d$/.test(item), from),
  };
}
