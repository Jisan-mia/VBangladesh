// One fixed step of the top. Allocation-free: no literals, closures or string building in here; everything is in the Top's
// own fields and typed arrays. The page calls advance() once per step while the session says the round ticks.
import {
  emit, gust, swayRate, windPower,
  DROP, E_BUMP, E_DONE, E_FALL, E_LAND, E_LIFTABLE, E_WIND, F_SLOW, F_WOBBLE, MAX_TIME, P_DONE, P_FALL, P_PALM, P_READY, P_SPIN, PICK_SPIN, SETTLE, WRAP_GAP,
  type Top,
} from "./top";

const TAU = Math.PI * 2;

export function advance(top: Top, dt: number) {
  const phase = top.phase;
  if (phase === P_SPIN) { spin(top, dt); return; }
  if (phase === P_READY) {
    if (top.winding) {
      top.held += dt;
      const wraps = Math.floor(top.held / WRAP_GAP);
      if (wraps > top.wraps) { top.wraps = wraps; emit(top, E_WIND, wraps, windPower(top.held)); }
    }
    return;
  }
  if (phase === P_FALL || phase === P_PALM) {
    top.endT += dt;
    if (top.endT >= SETTLE) { top.phase = P_DONE; emit(top, E_DONE, 0, 0); }
  }
}

function spin(top: Top, dt: number) {
  const def = top.def, slack = 1 - top.omega;
  top.t += dt;
  if (!top.landed && top.t >= DROP) { top.landed = true; emit(top, E_LAND, 0, 0); }
  top.omega -= (def.friction + 0.06 * top.wobble) * dt;
  top.wobble += def.growth * top.grow * (0.2 + 1.8 * slack * slack) * dt;
  if (def.wind > 0) top.wobble += def.wind * gust(top, top.t) * dt;
  top.sway += swayRate(top.omega) * dt;
  top.turn = (top.turn + (6 + 22 * (top.omega > 0 ? top.omega : 0)) * dt) % TAU;
  while (top.next < top.n && top.at[top.next] <= top.t) {
    const k = top.next++, braced = top.t - top.lastSoft <= top.brace;
    let size = top.size[k] * (0.5 + slack);
    if (braced) size *= 0.35;
    top.wobble += size;
    top.omega -= braced ? top.drag[k] * 0.5 : top.drag[k];
    top.faced++;
    if (braced) top.braced++;
    if (top.wave[k] === 1) { top.waveFaced++; if (braced) top.waveBraced++; }
    emit(top, E_BUMP, top.kind[k], braced ? 1 : 0);
  }
  if (!top.liftable && top.omega < PICK_SPIN) { top.liftable = true; emit(top, E_LIFTABLE, 0, 0); }
  if (top.wobble >= 1 || top.omega <= 0.02 || top.t >= MAX_TIME) {
    top.fall = top.wobble >= 1 ? F_WOBBLE : F_SLOW;
    if (top.wobble > 1) top.wobble = 1;
    top.phase = P_FALL; top.endT = 0;
    emit(top, E_FALL, top.fall, 0);
  }
}
