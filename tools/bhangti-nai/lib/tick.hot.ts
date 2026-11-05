// Code that runs every animation frame: the phase clock, the patience bar, the mood and edge thresholds and the count-up.
// Numbers in, numbers out: no objects, arrays, closures or strings are made here (npm run lint:games checks it).

/** ms on a phase's clock: the banked ms, plus the run since `since` while it runs (a resume sets `since` a breath ahead). */
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

/** 0..1 of the customer's patience still left (1 when there is no clock). */
export function patienceLeft(el: number, dur: number) {
  return dur > 0 ? clamp01(1 - el / dur) : 1;
}

/** Whole seconds left, as the tick sound counts them. */
export function secondsLeft(el: number, dur: number) {
  return Math.max(0, Math.ceil((dur - el) / 1000));
}

/** The customer's face: 0 calm, 1 in a hurry (half the patience gone), 2 cross (the last fifth). */
export function moodAt(left: number) {
  return left <= 0.2 ? 2 : left <= 0.5 ? 1 : 0;
}

/** The stage edge: 0 none, 1 amber (the last 30%), 2 red (the last 15%). */
export function edgeAt(left: number) {
  return left <= 0.15 ? 2 : left <= 0.3 ? 1 : 0;
}

/** The value a count-up shows at progress t (0..1). */
export function countAt(to: number, t: number) {
  return Math.round(to * easeOut(t));
}
