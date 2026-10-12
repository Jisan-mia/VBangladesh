// From a finger to a kick. The board is 360×340 units: the bamboo goal near the top, the ball on the chalk spot below.
// Where the finger ends (measured from the ball) is where the ball goes; a short flick sends it low along the grass.
// How fast the finger moves is the power, and how the path bows is the curl.
import type { Shot } from "./match";

export const W = 360, H = 340;
/** The goal on screen: centre, half width (post to centre), grass line and crossbar. */
export const GX = 180, GW = 116, GY = 172, GTOP = 88, GH = GY - GTOP;
export const SPOT_X = 180, SPOT_Y = 296, BALL_R = 10;

export const toScreenX = (x: number) => GX + x * GW;
export const toScreenY = (y: number) => GY - y * GH;

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

/** The aim point for a finger that moved (dx, dy) from where it went down, in goal units. Null if it isn't heading up the pitch. */
export function aimFrom(dx: number, dy: number): { x: number; y: number } | null {
  if (dy > -18) return null;
  const tx = SPOT_X + dx, ty = SPOT_Y + dy;
  if (ty >= GY) {
    // Short of the goal: carry the same direction on to the grass line, a low shot.
    const k = (GY - SPOT_Y) / dy;
    return { x: clamp((SPOT_X + dx * k - GX) / GW, -1.6, 1.6), y: 0.05 };
  }
  return { x: clamp((tx - GX) / GW, -1.6, 1.6), y: clamp((GY - ty) / GH, 0.05, 1.6) };
}

/** Finger speed (board units per millisecond) to power 0.1–1: a lazy drag is soft, a flick is full power. */
export const powerFrom = (speed: number) => clamp((speed - 0.15) / 0.8, 0.1, 1);

/**
 * A whole swipe to a kick. `xs`, `ys` and `ts` are the path in board units and milliseconds (first to last).
 * Speed is taken over the last 120 ms, so a careful aim that ends in a flick still counts as a flick.
 * Curl is how far the path bows from the straight line, as a share of its length (-1 to 1, right of travel is +).
 */
export function swipeShot(xs: ArrayLike<number>, ys: ArrayLike<number>, ts: ArrayLike<number>, count: number): Shot | null {
  if (count < 2) return null;
  const last = count - 1, dx = xs[last] - xs[0], dy = ys[last] - ys[0], aim = aimFrom(dx, dy);
  const length = Math.hypot(dx, dy);
  if (!aim || length < 24) return null;
  let from = last;
  while (from > 0 && ts[last] - ts[from - 1] <= 120) from--;
  if (from === last) from = last - 1;
  const span = Math.max(16, ts[last] - ts[from]);
  const speed = Math.hypot(xs[last] - xs[from], ys[last] - ys[from]) / span;
  let bow = 0;
  for (let i = 1; i < last; i++) {
    // Signed distance from the chord: + when the path bulges to the right of the direction of travel.
    const d = ((ys[i] - ys[0]) * dx - (xs[i] - xs[0]) * dy) / length;
    if (Math.abs(d) > Math.abs(bow)) bow = d;
  }
  const curve = clamp((bow / length) * 4, -1, 1);
  return { x: aim.x, y: aim.y, power: powerFrom(speed), curve: Math.abs(curve) < 0.15 ? 0 : curve };
}

/** The tap path: a spot tapped on the goal (board units) and a power from the meter. */
export function spotShot(tx: number, ty: number, power: number): Shot {
  return { x: clamp((tx - GX) / GW, -1.6, 1.6), y: clamp((GY - ty) / GH, 0.05, 1.6), power: clamp(power, 0.1, 1), curve: 0 };
}
