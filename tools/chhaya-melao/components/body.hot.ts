// The toy's per-frame spring, run every animation frame while a toy is moving. Allocation-free: it only mutates the arrays made at setup.
import { FLIP, FOLLOW, CHANNELS, FLY, ROT, X, Y, type Body } from "../lib/body";

const SUBSTEP = 1 / 240;
const MAX_DT = 1 / 30;
const LEAN_PER_DEG_SPEED = 0.02;
const MAX_LEAN = 14;
const ARRIVED_PX = 16;

/**
 * Move the toy `dt` seconds. Returns true while it is still moving. While following a finger the toy leans into its own sideways
 * speed (a hanging cut-out) unless `calm`. A flying toy raises `arrived` once it is near its goal.
 */
export function stepBody(body: Body, dt: number, calm: boolean): boolean {
  const { pos, vel, goal, stiff, damp } = body;
  let left = dt > MAX_DT ? MAX_DT : dt;
  if (body.mode === FOLLOW) goal[ROT] = calm ? 0 : Math.max(-MAX_LEAN, Math.min(MAX_LEAN, vel[X] * LEAN_PER_DEG_SPEED));
  while (left > 0) {
    const h = left > SUBSTEP ? SUBSTEP : left;
    for (let channel = 0; channel < CHANNELS; channel++) {
      const accel = stiff[channel] * (goal[channel] - pos[channel]) - damp[channel] * vel[channel];
      vel[channel] += accel * h;
      pos[channel] += vel[channel] * h;
    }
    left -= h;
  }
  if (body.mode === FLY && !body.arrived && Math.hypot(goal[X] - pos[X], goal[Y] - pos[Y]) < ARRIVED_PX) body.arrived = 1;
  if (body.mode === FOLLOW) return true;
  let moving = false;
  for (let channel = 0; channel < CHANNELS; channel++) {
    const unit = channel === FLIP ? 0.002 : channel === ROT ? 0.05 : 0.08;
    if (Math.abs(goal[channel] - pos[channel]) > unit || Math.abs(vel[channel]) > unit * 20) { moving = true; break; }
  }
  if (!moving) { for (let channel = 0; channel < CHANNELS; channel++) { pos[channel] = goal[channel]; vel[channel] = 0; } }
  return moving;
}
