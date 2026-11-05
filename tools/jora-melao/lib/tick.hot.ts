// Code that runs every animation frame: the pausable clock and the count-up. Numbers in, numbers out: no objects, arrays,
// closures or strings are made here (npm run lint:games checks it).

/** ms on a clock: the banked ms, plus the run since `since` while it runs (a resume sets `since` a breath ahead). */
export function clockMs(spent: number, since: number, running: boolean, now: number) {
  return running ? spent + Math.max(0, now - since) : spent;
}

export function clamp01(t: number) {
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

/** Ease out (cubic). */
export function easeOut(t: number) {
  const c = clamp01(t);
  return 1 - (1 - c) * (1 - c) * (1 - c);
}

/** A number counting up to `value` as `t` goes 0 → 1 (eased). */
export function countAt(value: number, t: number) {
  return Math.round(value * easeOut(t));
}

/** Fraction of the peek still to run (1 full, 0 gone). */
export function leftFraction(elapsedMs: number, durMs: number) {
  return durMs > 0 ? clamp01(1 - elapsedMs / durMs) : 0;
}
