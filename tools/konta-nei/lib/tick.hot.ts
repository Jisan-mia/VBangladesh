// Code that runs every animation frame: the phase clock, the eyelids, the shutter, the countdown and the count-up.
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

/** Ease in and out (cubic), for the lids and the shutter. */
export function easeInOut(t: number) {
  const c = clamp01(t);
  return c < 0.5 ? 4 * c * c * c : 1 - (-2 * c + 2) * (-2 * c + 2) * (-2 * c + 2) / 2;
}

/** Ease out with a small overshoot: a thing dropping back onto the plank. */
export function easeBack(t: number) {
  const c = clamp01(t) - 1;
  return 1 + 2.4 * c * c * c + 1.4 * c * c;
}

/** How shut the eyelids are (0 open, 1 shut) `el` ms into a blink of `dur` ms: shut by 45%, held, open from 65%. */
export function lidAt(el: number, dur: number) {
  const t = dur > 0 ? el / dur : 1;
  if (t < 0.45) return easeInOut(t / 0.45);
  if (t < 0.65) return 1;
  return 1 - easeInOut((t - 0.65) / 0.35);
}

/** The shelf behind the lids changes at the middle of a blink, while they are shut. */
export function pastMiddle(el: number, dur: number) {
  return el >= dur * 0.5;
}

/** How far the tin shutter has rolled up (0 down, 1 up) `el` ms into its `dur` ms. */
export function shutterAt(el: number, dur: number) {
  return easeInOut(dur > 0 ? el / dur : 1);
}

/** Whole seconds left on the look, as the countdown tag shows them. */
export function secondsLeft(el: number, dur: number) {
  return Math.max(0, Math.ceil((dur - el) / 1000));
}

/** 0..1 of the look time still left, for the bar along the shelf's top. */
export function leftFraction(el: number, dur: number) {
  return dur > 0 ? clamp01(1 - el / dur) : 0;
}

/** The last three seconds of a look: the stage edge glows. */
export function lookDanger(el: number, dur: number) {
  return dur - el <= 3000 && el < dur;
}

/** The value a count-up shows at progress t (0..1). */
export function countAt(to: number, t: number) {
  return Math.round(to * easeOut(t));
}
