// Turning the clock hands under a finger: the hand follows smoothly, takes the nearer hand, and clicks into place on release.
// A clock state is `total` (minutes since 12:00); the hour hand sits at total × 0.5° and the long hand at total × 6°.
// Pure, no React. The component paints the angles; these functions say what they are.
import { hands, mod } from "./time";

export type Hand = "hour" | "minute";

/** The shortest signed turn from one angle to another, −180…180. */
export const shortest = (delta: number) => mod(delta + 180, 360) - 180;

/** The hand's unwrapped angle after the finger moved: the short way round, so crossing 12 never jumps a whole turn. */
export const follow = (deg: number, finger: number) => deg + shortest(finger - mod(deg, 360));

/** Minutes (unwrapped) for the long hand at `deg`, from a grab that began at `total0` with the hand at `deg0`. */
export const minuteAt = (total0: number, deg0: number, deg: number) => total0 + (deg - deg0) / 6;
/** The same for the short hand: it turns 0.5° a minute, so a degree is two minutes. */
export const hourAt = (total0: number, deg0: number, deg: number) => total0 + (deg - deg0) * 2;

/** Where a released long hand clicks: the nearest `step` minutes. Carries the short hand past 12, as a real clock does. */
export const snapMinuteTotal = (total: number, step: number) => Math.round(total / step) * step;
/** Where a released short hand clicks: the nearest whole hour, keeping the minutes the long hand shows. */
export function snapHourTotal(total: number, keepMinutes: number) {
  const m = mod(keepMinutes, 60);
  return Math.round((total - m) / 60) * 60 + m;
}

/** The click spot within this many degrees of the hand pulls it in, so it feels magnetic on the way. */
export const PULL_DEG = 5;
export const pulled = (total: number, snapped: number, hand: Hand) => Math.abs(total - snapped) * (hand === "minute" ? 6 : 0.5) <= PULL_DEG ? snapped : total;

/** Which hand a press at `angle` and `r` (in a 300-wide clock, centre 150) picks up. The nearer by angle; when both are close, the long one if the finger is far out. */
export function pickHand(total: number, angle: number, r: number, lockMinute = false): Hand {
  if (lockMinute) return "hour";
  const { hour, minute } = hands(total), off = (a: number) => Math.abs(shortest(angle - a));
  const dh = off(hour), dm = off(minute);
  if (dh < 25 && dm < 25) return r > 80 ? "minute" : "hour";
  return dm <= dh ? "minute" : "hour";
}

/** An arrow key: one click for the chosen hand. The long hand carries the short one; the short hand moves a whole hour. */
export const stepHand = (total: number, hand: Hand, direction: 1 | -1, step: number) =>
  hand === "minute" ? snapMinuteTotal(total, step) + direction * step : total + direction * 60;

/** Keeps a total within one turn of the face (0–719), the same reading. The hands look identical. */
export const wrapTotal = (total: number) => mod(total, 720);

/** Strong ease-out (quint) for the click into place (0…1 → 0…1): it moves at once and settles. */
export const ease = (p: number) => { const q = 1 - Math.min(1, Math.max(0, p)); return 1 - q * q * q * q * q; };
export const CLICK_MS = 160;

/** The pie from 12 to the long hand: its minutes (0–59), and what is left. */
export const pieMinutes = (total: number) => mod(Math.round(total), 60);
