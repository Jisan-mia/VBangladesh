// Pure carrom physics: 19 discs and a striker on a 740 mm board, in millimetres and seconds.
// Fixed 60 Hz steps with 4 substeps, typed arrays and no allocation in step(), so a cheap phone runs it smoothly
// and the same input on the same engine always gives the same result.

export const BOARD = 740;
/** The wooden frame around the playing surface (drawing only). */
export const RAIL = 52;
export const TOTAL = BOARD + 2 * RAIL;
export const COIN_R = 16;
export const STRIKER_R = 21;
export const BIG_STRIKER_R = 25;
export const POCKET_R = 24;
/** The striker's centre line on the bottom baseline, and how far along it the striker may sit. */
export const BASE_Y = 622;
export const BASE_MIN = 151;
export const BASE_MAX = 589;
export const CENTRE = BOARD / 2;

/** 0–8 white, 9–17 black, 18 the queen, 19 the striker: never more objects than this. */
export const COUNT = 20;
export const QUEEN = 18;
export const STRIKER = 19;

export const STEP = 1 / 60;
export const MAX_SPEED = 3800;
const SUBSTEPS = 4;
/** Sliding friction on a powdered board (mm/s²) plus a little drag, so long slides settle without crawling. */
const FRICTION = 1000;
const DRAG = 0.4;
/** Below this speed (mm/s) a disc stops dead: no endless creeping, no jitter. */
const REST = 6;
const E_DISC = 0.9;
const E_WALL = 0.72;
/** How much a glancing hit drags the other disc sideways, and how much sideways speed survives a cushion. */
const GRIP = 0.06;
const WALL_GRIP = 0.94;
const STRIKER_MASS = 2.6;
/** A safety stop. Tests check real shots settle long before it. */
export const MAX_SHOT_TIME = 20;

export const POCKET_X = [POCKET_R, BOARD - POCKET_R, POCKET_R, BOARD - POCKET_R] as const;
export const POCKET_Y = [POCKET_R, POCKET_R, BOARD - POCKET_R, BOARD - POCKET_R] as const;

export function createWorld() {
  const r = new Float64Array(COUNT).fill(COIN_R), m = new Float64Array(COUNT).fill(1);
  r[STRIKER] = STRIKER_R;
  m[STRIKER] = STRIKER_MASS;
  return {
    x: new Float64Array(COUNT), y: new Float64Array(COUNT), vx: new Float64Array(COUNT), vy: new Float64Array(COUNT), r, m,
    /** 1 while the disc is on the board. */
    on: new Uint8Array(COUNT),
    /** Which pocket took the disc (-1 = none) and the order discs were pocketed in, across the whole game. */
    pocket: new Int8Array(COUNT).fill(-1),
    order: new Int32Array(COUNT),
    nextOrder: 1,
    /** The discs pocketed by the current shot, in order. */
    sunk: new Int8Array(COUNT),
    sunkCount: 0,
    moving: false,
    shotTime: 0,
    /** The hardest disc-on-disc and disc-on-cushion hit (closing speed, mm/s) since the page last read and zeroed them: sound only, never physics. */
    clack: 0,
    bump: 0,
  };
}
export type World = ReturnType<typeof createWorld>;

function sink(w: World, i: number, p: number) {
  w.on[i] = 0;
  w.vx[i] = w.vy[i] = 0;
  w.pocket[i] = p;
  w.order[i] = w.nextOrder++;
  w.sunk[w.sunkCount++] = i;
}

/** Flicks the striker along (dx, dy) with power 0–1. The curve keeps soft shots fine-grained and still lets a full pull break the pack. */
export function shoot(w: World, dx: number, dy: number, power: number) {
  const length = Math.sqrt(dx * dx + dy * dy) || 1, speed = MAX_SPEED * Math.min(1, Math.max(0, power)) ** 1.4;
  w.vx[STRIKER] = (dx / length) * speed;
  w.vy[STRIKER] = (dy / length) * speed;
  w.sunkCount = 0;
  w.shotTime = 0;
  w.moving = speed > 0;
}

export function kineticEnergy(w: World) {
  let total = 0;
  for (let i = 0; i < COUNT; i++) if (w.on[i]) total += 0.5 * w.m[i] * (w.vx[i] * w.vx[i] + w.vy[i] * w.vy[i]);
  return total;
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
      if (next <= REST) { vx[i] = vy[i] = 0; continue; }
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

/** True when a disc of radius `radius` at (px, py) would overlap no disc on the board (other than `skip`). */
export function isFree(w: World, px: number, py: number, radius: number, skip = -1) {
  for (let j = 0; j < COUNT; j++) {
    if (j === skip || !w.on[j]) continue;
    const dx = w.x[j] - px, dy = w.y[j] - py, rr = w.r[j] + radius;
    if (dx * dx + dy * dy < rr * rr) return false;
  }
  return true;
}

export type Hit = { t: number; disc: number };

/** Aim assist: how far the striker travels along a unit (dx, dy) before it touches a disc or a cushion. Writes into `out`. */
export function firstHit(w: World, sx: number, sy: number, dx: number, dy: number, out: Hit) {
  const radius = w.r[STRIKER];
  let best = Infinity, disc = -1;
  if (dx < 0) best = Math.min(best, (radius - sx) / dx); else if (dx > 0) best = Math.min(best, (BOARD - radius - sx) / dx);
  if (dy < 0) best = Math.min(best, (radius - sy) / dy); else if (dy > 0) best = Math.min(best, (BOARD - radius - sy) / dy);
  for (let j = 0; j < STRIKER; j++) {
    if (!w.on[j]) continue;
    const fx = sx - w.x[j], fy = sy - w.y[j], rr = radius + w.r[j];
    const b = fx * dx + fy * dy, c = fx * fx + fy * fy - rr * rr;
    if (c < 0) continue;
    const disc2 = b * b - c;
    if (disc2 < 0) continue;
    const t = -b - Math.sqrt(disc2);
    if (t >= 0 && t < best) { best = t; disc = j; }
  }
  out.t = Math.max(0, best);
  out.disc = disc;
  return out;
}
