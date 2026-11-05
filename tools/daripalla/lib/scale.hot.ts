// The balance's physics, stepped 60 times a second: the beam is a damped spring toward the tilt the weights ask for, each pan hangs
// from its end of the beam and swings against the beam's acceleration, and a piece landing makes its pan dip and the beam rock.
// Numbers only and allocation-free; the page reads the fields and writes the transforms.
import type { Phys } from "./phys";

const BEAM_K = 64, BEAM_D = 4.2;
const SWAY_K = 70, SWAY_D = 4.6, SWAY_COUPLE = 0.5;
const DIP_K = 260, DIP_D = 14;

/** Jump straight to a tilt with nothing moving (a fresh round, ধীরে খেলো). */
export function settleAt(p: Phys, angle: number) {
  p.a = angle; p.v = 0; p.landT = 0; p.rest = true;
  for (let side = 0; side < 2; side++) { p.sway[side] = 0; p.swayV[side] = 0; p.dip[side] = 0; p.dipV[side] = 0; }
}

/** A weight lands on `side` (0 left, 1 right) with `force` 0..1: the pan dips and the beam rocks. */
export function land(p: Phys, side: number, force: number) {
  p.dipV[side] += 150 + 260 * force;
  p.v += (side === 1 ? 1 : -1) * (14 + 26 * force);
  p.rest = false;
}

/** Queue a landing for after `ms` (the piece is still flying). */
export function landIn(p: Phys, ms: number, side: number, force: number) {
  p.landT = ms; p.landSide = side; p.landForce = force; p.rest = false;
}

/** Lifting a piece off lets its pan spring up. */
export function lifted(p: Phys, side: number) { p.dipV[side] -= 160; p.rest = false; }

const abs = Math.abs;

/** One step of `dt` seconds toward `target` degrees. */
export function stepPhys(p: Phys, target: number, dt: number) {
  if (p.landT > 0) { p.landT -= dt * 1000; if (p.landT <= 0) land(p, p.landSide, p.landForce); }
  const before = p.v;
  p.v += (-BEAM_K * (p.a - target) - BEAM_D * p.v) * dt;
  p.a += p.v * dt;
  const accel = p.v - before;
  for (let side = 0; side < 2; side++) {
    p.swayV[side] += (-SWAY_K * p.sway[side] - SWAY_D * p.swayV[side]) * dt - accel * SWAY_COUPLE;
    p.sway[side] += p.swayV[side] * dt;
    p.dipV[side] += (-DIP_K * p.dip[side] - DIP_D * p.dipV[side]) * dt;
    p.dip[side] += p.dipV[side] * dt;
  }
  p.rest = p.landT <= 0 && abs(p.a - target) < 0.02 && abs(p.v) < 0.05
    && abs(p.sway[0]) < 0.05 && abs(p.sway[1]) < 0.05 && abs(p.swayV[0]) < 0.1 && abs(p.swayV[1]) < 0.1
    && abs(p.dip[0]) < 0.15 && abs(p.dip[1]) < 0.15 && abs(p.dipV[0]) < 0.3 && abs(p.dipV[1]) < 0.3;
  if (p.rest) { p.a = target; p.v = 0; for (let side = 0; side < 2; side++) { p.sway[side] = 0; p.swayV[side] = 0; p.dip[side] = 0; p.dipV[side] = 0; } }
}
