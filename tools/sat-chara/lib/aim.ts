// The aim: a pull on the lane, the two-tap path (a sweeping direction, then a swinging power), and the arrow keys.
// Pure numbers in, numbers out; the component keeps them in its view.
import { clampAngle, clampPower } from "./world";
import type { Hand } from "./save";

const DEG = Math.PI / 180;
/** A press that moves less than this (CSS px) is a tap, not a pull. */
export const TAP_SLOP = 10;
/** A pull shorter than this when let go throws nothing. */
export const CANCEL_PULL = 16;

/** The pull's length (CSS px) that gives full power: about a third of the lane, never under 90 px. */
export const fullPull = (laneWidth: number) => Math.max(90, laneWidth * 0.36);

export type Aim = { angle: number; power: number; length: number; back: boolean };
export const makeAim = (): Aim => ({ angle: 30 * DEG, power: 0.6, length: 0, back: false });

/**
 * The throw goes opposite the pull: a finger dragged down and left sends the ball up and right. A pull toward the pile
 * (the ball would go backward) is `back`: letting go there throws nothing. The angle eases toward the finger so a
 * shaking thumb doesn't shake the arc.
 */
export function pullAim(out: Aim, dx: number, dy: number, laneWidth: number, ease = 1) {
  const length = Math.hypot(dx, dy), throwX = -dx, throwY = dy;
  out.length = length;
  out.back = throwX < -4 && length > CANCEL_PULL;
  if (length < 2) return out;
  const target = clampAngle(Math.atan2(throwY, Math.max(0.0001, throwX)));
  out.angle += (target - out.angle) * ease;
  out.power = clampPower(length / fullPull(laneWidth));
  return out;
}

const wave = (t: number, period: number) => 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / period);
/** The tap path's first stage: the direction sweeps 5°–60° (slower in ধীরে খেলো). */
export const sweepAngle = (t: number, slow: boolean) => (5 + 55 * wave(t, slow ? 4.4 : 2.6)) * DEG;
/** The second stage: the power swings 15%–100%. */
export const meterPower = (t: number, slow: boolean) => 0.15 + 0.85 * wave(t, slow ? 3.2 : 1.8);

/** The arrow keys: ↑↓ the direction by 2°, ←→ the power by 4%. */
export function nudge(out: Aim, key: string) {
  if (key === "ArrowUp" || key === "ArrowDown") out.angle = clampAngle(out.angle + (key === "ArrowUp" ? 2 : -2) * DEG);
  else out.power = clampPower(out.power + (key === "ArrowRight" ? 0.04 : -0.04));
  return out;
}

/** How many of the path's dots the difficulty shows: all of them, the first half, or the first few. */
export function shownDots(hand: Hand, count: number) {
  if (hand === "e") return count;
  if (hand === "n") return Math.max(3, Math.ceil(count / 2));
  return Math.min(count, 3);
}
