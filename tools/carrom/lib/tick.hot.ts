// Code the component runs every 60 Hz step or animation frame: the strike's steps, the power meter, the end screen's
// count-up. Numbers in, numbers out: nothing here allocates (npm run lint:games checks it).
import { step } from "./physics.hot";
import { STEP, type World } from "./table";
import type { View } from "./view";

/** Steps the strike for `dt` seconds of play. ধীরে খেলো runs the very same 60 Hz steps, half as many each second, so results never depend on it. */
export function advance(v: View, w: World, dt: number, slow: boolean) {
  v.simCarry += dt * (slow ? 0.5 : 1);
  while (v.simCarry >= STEP && w.moving) { step(w, STEP); v.simCarry -= STEP; }
  if (!w.moving) v.simCarry = 0;
}

/** মারো held: the power swings 0 → 1 → 0 over 2.4 s (4.8 s in ধীরে খেলো). */
export function meter(v: View, slow: boolean) {
  const x = ((v.clock - v.chargeAt) / (slow ? 2.4 : 1.2)) % 2;
  return x < 1 ? x : 2 - x;
}

/** The smallest signed difference between two angles. */
export function turnBetween(fromX: number, fromY: number, toX: number, toY: number) {
  return Math.atan2(fromX * toY - fromY * toX, fromX * toX + fromY * toY);
}

/** Ease out (cubic) over 0..1, clamped. */
export function easeOut(t: number) {
  const k = t < 0 ? 0 : t > 1 ? 1 : t;
  return 1 - (1 - k) * (1 - k) * (1 - k);
}
/** The value a count-up shows at progress t (0..1). */
export const countAt = (to: number, t: number) => Math.round(to * easeOut(t));
