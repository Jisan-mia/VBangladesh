// "তাল মেলাও": eight steady pulses to tap along with, once, so a phone's touch lag can be measured. Pure; the page feeds it steps and taps,
// and throws the pulses away if the window is left before the eighth (session.ts calibLost).
import { clamp } from "./course";

export const CALIB_BEATS = [1.2, 2.1, 3.0, 3.9, 4.8, 5.7, 6.6, 7.5] as const;
/** The measure ends this long after the last pulse. */
export const CALIB_END = CALIB_BEATS[CALIB_BEATS.length - 1] + 0.7;
export const MIN_LAG = -0.1, MAX_LAG = 0.3;

export type Calib = { t: number; taps: number[] };
export const createCalib = (): Calib => ({ t: 0, taps: [] });

/** The median gap between each tap and its nearest pulse, in seconds; null unless at least four taps landed near a pulse. */
export function lagFrom(taps: readonly number[], beats: readonly number[] = CALIB_BEATS) {
  const gaps: number[] = [];
  for (const tap of taps) {
    let gap = Infinity;
    for (const beat of beats) if (Math.abs(tap - beat) < Math.abs(gap)) gap = tap - beat;
    if (Math.abs(gap) <= 0.4) gaps.push(gap);
  }
  if (gaps.length < 4) return null;
  gaps.sort((a, b) => a - b);
  const middle = gaps.length >> 1;
  const median = gaps.length % 2 ? gaps[middle] : (gaps[middle - 1] + gaps[middle]) / 2;
  return Math.round(clamp(median, MIN_LAG, MAX_LAG) * 100) / 100;
}

/** The pulse a ring should be closing in on: seconds until it (negative a little while after), or Infinity when none is left. */
export function nextPulse(calib: Calib, window: number) {
  for (let index = 0; index < CALIB_BEATS.length; index++) if (CALIB_BEATS[index] - calib.t >= -window) return CALIB_BEATS[index] - calib.t;
  return Infinity;
}
