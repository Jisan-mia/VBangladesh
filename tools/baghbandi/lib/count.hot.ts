// Code that runs every animation frame of the end screen's count-up, and on every clock read. Numbers in, numbers out:
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
