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

/** The stars the round is on track for at `time` seconds (hint seconds included). Finishing always earns one. */
export function starsOnTrack(time: number, three: number, two: number) {
  return time <= three ? 3 : time <= two ? 2 : 1;
}

/** 0..1: how much of the current star's time is used, for the thin meter under the clock (1 once it's the last star). */
export function starTimeUsed(time: number, three: number, two: number) {
  if (time <= three) return time / three;
  return time <= two ? (time - three) / (two - three) : 1;
}

/** Seconds left before the next star drops, or -1 once only one star is left. */
export function secondsToDrop(time: number, three: number, two: number) {
  if (time <= three) return three - time;
  return time <= two ? two - time : -1;
}

/** The last ten seconds before a star drops: the board's edge glows. */
export function edgeDanger(time: number, three: number, two: number) {
  const left = secondsToDrop(time, three, two);
  return left >= 0 && left <= 10;
}
