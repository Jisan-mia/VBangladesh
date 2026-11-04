// Code that runs every animation frame: the clocks, the countdown, the edge danger and the count-up.
// Numbers in, numbers out: no objects, arrays, closures or strings are made here (npm run lint:games checks it).

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

/** Whole seconds left, as the clock corner shows them. */
export function secondsLeft(leftMs: number) {
  return leftMs <= 0 ? 0 : Math.ceil(leftMs / 1000);
}

/** 0..1 of the round still left, for the thin bar along the top. */
export function leftFraction(leftMs: number, roundMs: number) {
  return roundMs > 0 ? clamp01(leftMs / roundMs) : 0;
}

/** The stage edge: 0 calm, 1 amber (the last 10 s), 2 red (the last 5 s). */
export function dangerAt(leftMs: number) {
  return leftMs <= 0 ? 0 : leftMs <= 5000 ? 2 : leftMs <= 10000 ? 1 : 0;
}

/** The value a count-up shows at progress t (0..1). */
export function countAt(to: number, t: number) {
  return Math.round(to * easeOut(t));
}
