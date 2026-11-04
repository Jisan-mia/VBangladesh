// Everything the canvas frame reads besides the round: sizes, cached sprites, the aim on screen, puffs, the pile's
// shiver, the shake and the shout. Made once per mount and mutated in place, so a frame never allocates.
import { makeAim, type Aim } from "./aim";
import { makeSprites, type Sprites } from "./scene";
import { STONES } from "./world";

export const MAX_DOTS = 40;
export const DOT_GAP = 0.045;
const PUFFS = 28;

/** How the ball is being aimed: at rest (the dots sweep for the tap path), the power swinging, a pull, or the keys. */
export type AimMode = "sweep" | "power" | "pull" | "keys";

export function makeView() {
  return {
    width: 0, height: 0, ratio: 1,
    /** CSS px per scene unit, and the units of scene shown above the lane. */
    scale: 1, extra: 0,
    sprites: makeSprites() as Sprites,
    aim: makeAim() as Aim,
    mode: "sweep" as AimMode,
    /** Seconds of real time, and when the sweep or the meter started. */
    clock: 0, since: 0,
    dots: new Float32Array(MAX_DOTS * 2), dotCount: 0, dotsShown: 0,
    /** 0–1: how far back the arm is drawn, and the throw's follow-through (counts down from 1). */
    armBack: 0, follow: 0,
    px: new Float32Array(PUFFS), py: new Float32Array(PUFFS), pvx: new Float32Array(PUFFS), pvy: new Float32Array(PUFFS), plife: new Float32Array(PUFFS),
    /** Each standing stone's shiver (radians), set when the ball grazes the pile. */
    wob: new Float32Array(STONES),
    shakeT: 0, shakeAmp: 0,
    /** The line's flutter after a ball meets it, and the "সাতটাই!" shout's remaining time. */
    lineWob: 0, shout: 0, shoutX: 0, shoutY: 0,
    /** Steps of hit-stop left (the first knock of a throw freezes the pile for a blink). */
    freeze: 0,
    calm: false,
  };
}
export type View = ReturnType<typeof makeView>;

/** A few dust puffs at a point (a landing, a hit). Skipped when calm. */
export function puff(v: View, x: number, y: number, count = 4) {
  if (v.calm) return;
  for (let i = 0, made = 0; i < PUFFS && made < count; i++) {
    if (v.plife[i] > 0) continue;
    v.px[i] = x + (made - 1.5) * 3; v.py[i] = y - 1;
    v.pvx[i] = (made - 1.5) * 14; v.pvy[i] = -10 - made * 4;
    v.plife[i] = 0.45;
    made++;
  }
}

/** A shake of the whole lane, scaled by how much fell (never in calm). */
export function shakeBy(v: View, amount: number) {
  if (v.calm) return;
  v.shakeAmp = Math.max(v.shakeAmp, Math.min(6, amount)); v.shakeT = 0.28;
}
