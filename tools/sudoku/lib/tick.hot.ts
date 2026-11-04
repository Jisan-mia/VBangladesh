// Code that runs every clock tick (250 ms) and every frame of the end screen's count-up. Numbers in, numbers out:
// no objects, arrays, closures or strings are made here (npm run lint:games checks it).

/** Seconds on the clock: the banked seconds, plus the run since `since` (ms) while it runs. */
export function clockSeconds(base: number, since: number, running: boolean, now: number) {
  return running ? base + Math.max(0, now - since) / 1000 : base;
}

/** Ease out (cubic) over 0..1, clamped. */
export function easeOut(t: number) {
  const c = t < 0 ? 0 : t > 1 ? 1 : t;
  return 1 - (1 - c) * (1 - c) * (1 - c);
}

/** The value a count-up shows at progress t (0..1). */
export function countAt(to: number, t: number) {
  return Math.round(to * easeOut(t));
}

/** Seconds for two stars (the same rounding as game.ts twoStarTime). */
export function twoStarSeconds(par: number) {
  return Math.round(par * 2.2 / 10) * 10;
}

/** The stars the run is on track for right now: time against par, capped by hints taken. Never below one. */
export function starsOnTrack(seconds: number, hints: number, par: number) {
  const byTime = seconds <= par ? 3 : seconds <= twoStarSeconds(par) ? 2 : 1;
  const cap = 3 - hints;
  return Math.max(1, byTime < cap ? byTime : cap);
}

/** 0..1: how much of the current star's time is used, for the thin meter under the clock (1 once it's the last star). */
export function starTimeUsed(seconds: number, par: number) {
  if (seconds <= par) return seconds / par;
  const two = twoStarSeconds(par);
  return seconds <= two ? (seconds - par) / (two - par) : 1;
}
