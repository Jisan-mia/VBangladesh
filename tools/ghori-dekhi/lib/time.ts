// Saying the time the Bangladeshi way, and the clock hands' maths. Pure functions, no React.
// A clock state is `total`: minutes since 12:00, never wrapped, so a hand that turns past 12 keeps turning the same way on screen.

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);
export const mod = (value: number, by: number) => ((value % by) + by) % by;

export type Kind = "hour" | "quarter" | "half" | "to" | "five";
export type Part = "ভোর" | "সকাল" | "দুপুর" | "বিকেল" | "সন্ধ্যা" | "রাত";
/** A time of day: hour 0–23 and minute 0–59. */
export type Time = { h: number; m: number };

export function kindOf(m: number): Kind {
  return m === 0 ? "hour" : m === 15 ? "quarter" : m === 30 ? "half" : m === 45 ? "to" : "five";
}

/** সকাল ৬–১১, দুপুর ১২–৩, বিকেল ৪–৫, সন্ধ্যা ৬–৭, রাত ৮ থেকে ভোর ৪ পর্যন্ত, ভোর ৪–৫. */
export function partOf(h24: number): Part {
  const h = mod(h24, 24);
  if (h >= 4 && h < 6) return "ভোর";
  if (h >= 6 && h < 12) return "সকাল";
  if (h >= 12 && h < 16) return "দুপুর";
  if (h >= 16 && h < 18) return "বিকেল";
  if (h >= 18 && h < 20) return "সন্ধ্যা";
  return "রাত";
}

export const hour12 = (h24: number) => mod(h24, 12) || 12;

/**
 * "৭টা", "সাড়ে ৩টা", "সোয়া ৪টা", "পৌনে ৫টা" (১৫ মিনিট বাকি, so the next hour), "৪টা বেজে ১০ মিনিট".
 * 1:30 and 2:30 are "দেড়টা" and "আড়াইটা", as everyone says them. `part` adds সকাল/দুপুর/…; `at` gives "…টায়" ("৭টায় ওঠে").
 */
export function sayTime({ h, m }: Time, { part = false, at = false } = {}) {
  const kind = kindOf(m), here = hour12(h), next = hour12(h + 1);
  const ta = at ? "টায়" : "টা";
  let text: string;
  if (kind === "hour") text = `${bn(here)}${ta}`;
  else if (kind === "half") text = here === 1 ? `দেড়${ta}` : here === 2 ? `আড়াই${ta}` : `সাড়ে ${bn(here)}${ta}`;
  else if (kind === "quarter") text = `সোয়া ${bn(here)}${ta}`;
  else if (kind === "to") text = `পৌনে ${bn(next)}${ta}`;
  else text = `${bn(here)}টা বেজে ${bn(m)} মিনিট${at ? "ে" : ""}`;
  return part ? `${partOf(h)} ${text}` : text;
}

/** The other way people say 4:50: "৫টা বাজতে ১০ মিনিট বাকি". Only for the last half hour, off the quarter marks. */
export function sayLeft({ h, m }: Time) {
  if (m <= 30 || m % 15 === 0) return null;
  return `${bn(hour12(h + 1))}টা বাজতে ${bn(60 - m)} মিনিট বাকি`;
}

/** Digital form for parents: "৪:০৫". */
export const digital = ({ h, m }: Time) => `${bn(hour12(h))}:${bn(Math.floor(m / 10))}${bn(m % 10)}`;

// ── The hands ──

/** Degrees clockwise from 12. The hour hand moves half a degree each minute, as on a real clock. */
export const hands = (total: number) => ({ hour: total * 0.5, minute: total * 6 });
export const onFace = (total: number): Time => ({ h: Math.floor(mod(total, 720) / 60), m: mod(total, 60) });
/** Same reading on a 12-hour face. */
export const same = (total: number, time: Time) => mod(total, 720) === mod(time.h * 60 + time.m, 720);

/** The face value `target` (0–719) in the turn nearest `total`, so a tap never spins the hands round the long way. */
function nearest(total: number, target: number) {
  const base = total - mod(total, 720) + target;
  return [base - 720, base, base + 720].reduce((best, value) => Math.abs(value - total) < Math.abs(best - total) ? value : best);
}

export const snapMinute = (angle: number, step: number) => mod(Math.round(mod(angle, 360) / 6 / step) * step, 60);

/** Dragging the minute hand: it follows the finger in `step`-minute clicks, and carries the hour hand past 12 like a real clock. */
export function dragMinute(total: number, angle: number, step: number) {
  const delta = mod(snapMinute(angle, step) - mod(total, 60) + 30, 60) - 30;
  return total + delta;
}

/** Dragging the hour hand: it goes where the finger points (allowing for the minutes), in whole-hour clicks. */
export function dragHour(total: number, angle: number) {
  const m = mod(total, 60), h = mod(Math.round((mod(angle, 360) - m * 0.5) / 30), 12);
  return nearest(total, h * 60 + m);
}

/** Tapping a number with the hour hand chosen: that number is the hour ("৩-এ চাপলে ৩টা"), minutes stay. */
export function tapHour(total: number, angle: number) {
  const h = mod(Math.round(mod(angle, 360) / 30), 12), m = mod(total, 60);
  return nearest(total, h * 60 + m);
}

/** Tapping with the minute hand chosen: the minutes jump there and the hour stays (a tap is a choice, not a turn). */
export function tapMinute(total: number, angle: number, step: number) {
  return total - mod(total, 60) + snapMinute(angle, step);
}

// ── Hints: why, in one line, never "ভুল" ──

const at = (n: number) => `${bn(n)} নম্বরে`;

/** What the big hand should say for this time. */
export function minuteHint({ m }: Time) {
  const kind = kindOf(m);
  if (kind === "hour") return "ঠিক ঘণ্টায় বড় কাঁটা থাকে ১২ নম্বরে।";
  if (kind === "half") return "সাড়ে মানে আধা ঘণ্টা: বড় কাঁটা ৬ নম্বরে।";
  if (kind === "quarter") return "সোয়া মানে ১৫ মিনিট: বড় কাঁটা ৩ নম্বরে।";
  if (kind === "to") return "পৌনে মানে আর ১৫ মিনিট বাকি: বড় কাঁটা ৯ নম্বরে।";
  return `${bn(m)} মিনিটে বড় কাঁটা ${at(m / 5)}। প্রতি নম্বরে ৫ মিনিট।`;
}

/** Where the small hand should be for this time. */
export function hourHint(time: Time) {
  const here = hour12(time.h), next = hour12(time.h + 1), kind = kindOf(time.m), when = sayTime(time, { at: true });
  if (kind === "hour") return `${when} ছোট কাঁটা ঠিক ${at(here)}।`;
  if (kind === "half") return `${when} ছোট কাঁটা ${bn(here)} আর ${bn(next)}-এর মাঝখানে।`;
  if (kind === "to" || time.m > 30) return `${when} ছোট কাঁটা ${bn(next)}-এর একটু আগে।`;
  return `${when} ছোট কাঁটা ${bn(here)} পেরিয়ে একটু এগিয়েছে।`;
}

/** After "হয়েছে" on a wrong clock: the big hand first, since it decides the words; then the small one. */
export function setHint(total: number, target: Time) {
  const now = onFace(total);
  if (now.m !== target.m) return minuteHint(target);
  return hourHint(target);
}

const PART_HINT: Record<Part, string> = {
  "ভোর": "আকাশ সবে ফর্সা হচ্ছে, তাই ভোর।",
  "সকাল": "ছবিতে সকালের রোদ, তাই সকাল।",
  "দুপুর": "সূর্য মাথার ওপরে, তাই দুপুর।",
  "বিকেল": "রোদ হেলে পড়েছে, তাই বিকেল।",
  "সন্ধ্যা": "সূর্য ডুবছে, তাই সন্ধ্যা।",
  "রাত": "আকাশে চাঁদ, তাই রাত।",
};

const BIG_HAND: Partial<Record<Kind, string>> = {
  hour: "বড় কাঁটা ১২ নম্বরে, মানে ঠিক ঘণ্টা।",
  quarter: "বড় কাঁটা ৩ নম্বরে, মানে ১৫ মিনিট পেরিয়েছে: সোয়া।",
  half: "বড় কাঁটা ৬ নম্বরে, মানে আধা ঘণ্টা পেরিয়েছে।",
  to: "বড় কাঁটা ৯ নম্বরে, মানে আর ১৫ মিনিট বাকি: পৌনে।",
};

/** After a wrong pick in "কয়টা বাজে?": what to look at next. */
export function readHint(chosen: Time, target: Time) {
  if (mod(chosen.h * 60 + chosen.m, 720) === mod(target.h * 60 + target.m, 720)) return PART_HINT[partOf(target.h)];
  if (chosen.m !== target.m) return BIG_HAND[kindOf(target.m)] ?? `বড় কাঁটা ${at(target.m / 5)}। ৫ করে গোনো: ${Array.from({ length: target.m / 5 }, (_, i) => bn((i + 1) * 5)).join(", ")}।`;
  return hourHint(target);
}
