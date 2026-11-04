// Code that runs on every clock read and every animation frame of the end screen's count-up. Numbers in, numbers out:
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

/** The hornets' hum for the stings so far: a low drone with one, louder and higher with two. */
export function humLevel(stings: number) {
  return stings <= 0 ? 0 : stings === 1 ? 0.22 : 0.42;
}
export function humPitch(stings: number) {
  return stings <= 1 ? 190 : 240;
}

/** The ripple's delay (ms) for a bush `ring` steps out from where the opening began; none in ধীরে খেলো. */
export function rippleDelay(ring: number, slow: boolean) {
  return slow ? 0 : (ring > 16 ? 16 : ring) * 26;
}
