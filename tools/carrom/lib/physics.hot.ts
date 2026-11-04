// Per-step and per-frame physics: the fixed step, the first-touch test and the aim guide's trace.
// Fixed 60 Hz steps with 4 substeps over typed arrays. Only + − × ÷ and sqrt touch positions, so the same input gives the
// same board on every phone. Nothing here allocates (npm run lint:games checks it).
import {
  BOARD, COUNT, DRAG, E_DISC, E_WALL, FRICTION, GRIP, MAX_SHOT_TIME, POCKET_R, POCKET_X, POCKET_Y, REST, STRIKER, SUBSTEPS, STEP, WALL_GRIP,
  type World,
} from "./table";

function sink(w: World, i: number, p: number) {
  w.on[i] = 0;
  w.vx[i] = 0;
  w.vy[i] = 0;
  w.pocket[i] = p;
  w.order[i] = w.nextOrder++;
  w.sunk[w.sunkCount++] = i;
}

/** One fixed step: move, bounce off the cushions, collide, drop into pockets, slow down. */
export function step(w: World, dt = STEP) {
  if (!w.moving) return;
  const { x, y, vx, vy, r, m, on } = w;
  const h = dt / SUBSTEPS;
  for (let s = 0; s < SUBSTEPS; s++) {
    for (let i = 0; i < COUNT; i++) {
      if (!on[i]) continue;
      x[i] += vx[i] * h;
      y[i] += vy[i] * h;
      const ri = r[i];
      if (x[i] < ri) { x[i] = ri; if (vx[i] < 0) { if (-vx[i] > w.bump) w.bump = -vx[i]; vx[i] = -vx[i] * E_WALL; vy[i] *= WALL_GRIP; } }
      else if (x[i] > BOARD - ri) { x[i] = BOARD - ri; if (vx[i] > 0) { if (vx[i] > w.bump) w.bump = vx[i]; vx[i] = -vx[i] * E_WALL; vy[i] *= WALL_GRIP; } }
      if (y[i] < ri) { y[i] = ri; if (vy[i] < 0) { if (-vy[i] > w.bump) w.bump = -vy[i]; vy[i] = -vy[i] * E_WALL; vx[i] *= WALL_GRIP; } }
      else if (y[i] > BOARD - ri) { y[i] = BOARD - ri; if (vy[i] > 0) { if (vy[i] > w.bump) w.bump = vy[i]; vy[i] = -vy[i] * E_WALL; vx[i] *= WALL_GRIP; } }
    }
    for (let i = 0; i < COUNT - 1; i++) {
      if (!on[i]) continue;
      for (let j = i + 1; j < COUNT; j++) {
        if (!on[j]) continue;
        const dx = x[j] - x[i], dy = y[j] - y[i], rr = r[i] + r[j], d2 = dx * dx + dy * dy;
        if (d2 >= rr * rr || d2 === 0) continue;
        const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, wi = 1 / m[i], wj = 1 / m[j], inv = wi + wj;
        // Separate by position only, so resting discs that touch never gain speed.
        const push = (rr - d) / inv;
        x[i] -= nx * push * wi; y[i] -= ny * push * wi;
        x[j] += nx * push * wj; y[j] += ny * push * wj;
        const rvx = vx[j] - vx[i], rvy = vy[j] - vy[i], vn = rvx * nx + rvy * ny;
        if (vn >= 0) continue;
        if (-vn > w.clack) w.clack = -vn;
        const jn = -(1 + E_DISC) * vn / inv;
        let jt = -(rvy * nx - rvx * ny) / inv;
        const grip = GRIP * jn;
        if (jt > grip) jt = grip; else if (jt < -grip) jt = -grip;
        const px = jn * nx - jt * ny, py = jn * ny + jt * nx;
        vx[i] -= px * wi; vy[i] -= py * wi;
        vx[j] += px * wj; vy[j] += py * wj;
      }
    }
    for (let i = 0; i < COUNT; i++) {
      if (!on[i]) continue;
      for (let p = 0; p < 4; p++) {
        const dx = x[i] - POCKET_X[p], dy = y[i] - POCKET_Y[p];
        if (dx * dx + dy * dy < POCKET_R * POCKET_R) { sink(w, i, p); break; }
      }
    }
    for (let i = 0; i < COUNT; i++) {
      if (!on[i]) continue;
      const speed2 = vx[i] * vx[i] + vy[i] * vy[i];
      if (speed2 === 0) continue;
      const speed = Math.sqrt(speed2), next = speed - (FRICTION + DRAG * speed) * h;
      if (next <= REST) { vx[i] = 0; vy[i] = 0; continue; }
      vx[i] *= next / speed;
      vy[i] *= next / speed;
    }
  }
  w.shotTime += dt;
  let moving = false;
  for (let i = 0; i < COUNT; i++) if (on[i] && (vx[i] !== 0 || vy[i] !== 0)) { moving = true; break; }
  if (moving && w.shotTime > MAX_SHOT_TIME) { vx.fill(0); vy.fill(0); moving = false; }
  w.moving = moving;
}

/** Where firstHit writes: the distance travelled, and the disc touched (-1 for a cushion). */
export const HIT = new Float64Array(2);

/**
 * How far a disc of `radius` at (sx, sy) slides along the unit (dx, dy) before it touches a disc (other than `skipA` and
 * `skipB`) or a cushion. Writes HIT[0] = distance and HIT[1] = the disc, or -1 for a cushion.
 */
export function firstHit(w: World, sx: number, sy: number, dx: number, dy: number, radius: number, skipA: number, skipB: number) {
  let best = 1e9, disc = -1;
  if (dx < 0) { const t = (radius - sx) / dx; if (t < best) best = t; } else if (dx > 0) { const t = (BOARD - radius - sx) / dx; if (t < best) best = t; }
  if (dy < 0) { const t = (radius - sy) / dy; if (t < best) best = t; } else if (dy > 0) { const t = (BOARD - radius - sy) / dy; if (t < best) best = t; }
  for (let j = 0; j < STRIKER; j++) {
    if (j === skipA || j === skipB || !w.on[j]) continue;
    const fx = sx - w.x[j], fy = sy - w.y[j], rr = radius + w.r[j];
    const b = fx * dx + fy * dy, c = fx * fx + fy * fy - rr * rr;
    if (c < 0) continue;
    const d2 = b * b - c;
    if (d2 < 0) continue;
    const t = -b - Math.sqrt(d2);
    if (t >= 0 && t < best) { best = t; disc = j; }
  }
  HIT[0] = best < 0 ? 0 : best;
  HIT[1] = disc;
}

/** Which pocket a centre sliding from (sx, sy) along unit (dx, dy) for `length` drops into, or -1. `mouth` is how central it must pass (1 = the edge). */
export function pocketOnPath(sx: number, sy: number, dx: number, dy: number, length: number, mouth: number) {
  for (let p = 0; p < 4; p++) {
    const px = POCKET_X[p] - sx, py = POCKET_Y[p] - sy, along = px * dx + py * dy;
    if (along < 0) continue;
    const ox = px - along * dx, oy = py - along * dy, off2 = ox * ox + oy * oy, edge = POCKET_R * mouth;
    if (off2 >= edge * edge) continue;
    if (along - Math.sqrt(edge * edge - off2) <= length + 2) return p;
  }
  return -1;
}

/** The direction after a cushion, written into BOUNCE[0..1] (unit). `wall` 0 = a side cushion, 1 = top or bottom. */
export const BOUNCE = new Float64Array(2);
export function bounce(dx: number, dy: number, wall: number) {
  const bx = wall === 0 ? -dx * E_WALL : dx * WALL_GRIP, by = wall === 0 ? dy * WALL_GRIP : -dy * E_WALL;
  const length = Math.sqrt(bx * bx + by * by) || 1;
  BOUNCE[0] = bx / length;
  BOUNCE[1] = by / length;
}

// The aim guide, read by the drawing code each frame. Indices into TRACE:
export const T_POINTS = 0; // 2 or 3 points along the striker's path
export const T_XY = 1; // x0 y0 x1 y1 x2 y2 (6 slots)
export const T_DISC = 7; // the disc the striker touches first, or -1
export const T_NX = 8; // the touched disc's direction (unit), from the ghost striker through its centre
export const T_NY = 9;
export const T_POCKET = 10; // the pocket that disc heads into, or -1
export const T_COIN_END = 11; // how far the disc travels to that pocket, or to whatever stops it
export const T_FOUL = 12; // 1 when the striker itself rolls over a pocket before touching anything
export const TRACE = new Float64Array(13);

/**
 * Traces a strike from (sx, sy) along unit (dx, dy): the striker to its first touch, through at most `bounces` cushions,
 * then the disc it touches, along the line of centres, to a pocket or whatever stops it. Results go into TRACE.
 */
export function traceAim(w: World, sx: number, sy: number, dx: number, dy: number, radius: number, bounces: number) {
  let x = sx, y = sy, ux = dx, uy = dy, points = 1;
  TRACE[T_XY] = sx; TRACE[T_XY + 1] = sy;
  TRACE[T_DISC] = -1; TRACE[T_POCKET] = -1; TRACE[T_FOUL] = 0; TRACE[T_NX] = 0; TRACE[T_NY] = 0; TRACE[T_COIN_END] = 0;
  for (let leg = 0; leg <= bounces; leg++) {
    firstHit(w, x, y, ux, uy, radius, STRIKER, -1);
    let t = HIT[0];
    const disc = HIT[1];
    const fell = pocketOnPath(x, y, ux, uy, t, 1);
    if (fell >= 0) {
      // The striker would drop before it touches anything: stop the line at the pocket.
      const px = POCKET_X[fell] - x, py = POCKET_Y[fell] - y;
      t = px * ux + py * uy;
      TRACE[T_FOUL] = 1;
    }
    x += ux * t; y += uy * t;
    TRACE[T_XY + points * 2] = x; TRACE[T_XY + points * 2 + 1] = y;
    points++;
    if (fell >= 0) break;
    if (disc >= 0) {
      TRACE[T_DISC] = disc;
      let nx = w.x[disc] - x, ny = w.y[disc] - y;
      const length = Math.sqrt(nx * nx + ny * ny) || 1;
      nx /= length; ny /= length;
      TRACE[T_NX] = nx; TRACE[T_NY] = ny;
      firstHit(w, w.x[disc], w.y[disc], nx, ny, w.r[disc], disc, STRIKER);
      const stop = HIT[0];
      TRACE[T_COIN_END] = stop;
      const into = pocketOnPath(w.x[disc], w.y[disc], nx, ny, HIT[1] >= 0 ? stop : stop + POCKET_R, 0.85);
      if (into >= 0) {
        TRACE[T_POCKET] = into;
        const qx = POCKET_X[into] - w.x[disc], qy = POCKET_Y[into] - w.y[disc];
        TRACE[T_COIN_END] = qx * nx + qy * ny;
      }
      break;
    }
    if (leg === bounces) break;
    const side = x <= radius + 0.5 || x >= BOARD - radius - 0.5;
    bounce(ux, uy, side ? 0 : 1);
    ux = BOUNCE[0]; uy = BOUNCE[1];
  }
  TRACE[T_POINTS] = points;
}
