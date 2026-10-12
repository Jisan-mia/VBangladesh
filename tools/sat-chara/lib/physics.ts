// Pure সাত চাড়া physics, side view of a গলি, in scene units (480×320) and seconds.
// A tuned topple model, not a general rigid-body solver: a standing stone never moves until something knocks it or
// its support goes, a knocked stone flies as a spinning box, and a stone that comes to rest is frozen flat.
// Frozen bodies are never integrated, so nothing can jitter at rest. Fixed steps and no randomness: the same throw
// on the same layout always ends the same way.

export const W = 480;
export const H = 320;
export const GROUND = 290;
/** The house wall at the far end of the গলি: stones and the ball bounce back off it. */
export const WALL_X = 470;
export const STONES = 7;

export const BALL_R = 8;
export const HAND_X = 46;
export const HAND_Y = 236;
export const ANGLE_MIN = -12 * Math.PI / 180;
export const ANGLE_MAX = 75 * Math.PI / 180;
export const POWER_MIN = 0.1;
const SPEED_MIN = 150;
const SPEED_MAX = 620;

export const STEP = 1 / 60;
const SUB = 4;
const G = 640;
/** A throw always settles before this (7 s); tests check real throws settle long before it. */
export const MAX_STEPS = 420;

const BALL_MASS = 1.4;
const STONE_MASS = 1;
const INV = 1 / BALL_MASS + 1 / STONE_MASS;
/** Normal approach speed the ball needs to knock a stone, and a flying stone needs to knock a standing one sideways. */
const KNOCK = 55;
const STONE_KNOCK = 70;
const SLOP = 0.3;

export const STANDING = 0;
export const FLYING = 1;
export const LYING = 2;

/** A stone's centre, size and the blocks (bricks, steps) as [x0, y0, x1, y1]. */
export type Stone = { x: number; y: number; w: number; h: number };
export type Layout = { stones: readonly Stone[]; blocks: ReadonlyArray<readonly [number, number, number, number]> };

export function createWorld(layout: Layout) {
  const n = STONES;
  const w = {
    x: new Float64Array(n), y: new Float64Array(n), w: new Float64Array(n), h: new Float64Array(n),
    a: new Float64Array(n), vx: new Float64Array(n), vy: new Float64Array(n), va: new Float64Array(n),
    state: new Uint8Array(n),
    /** The throw (0, 1, 2) that brought the stone down, or -1 while it still stands. */
    downAt: new Int8Array(n).fill(-1),
    /** Up to 4 stones each stone rests on (-1 = empty slot); `onFixed` is 1 when it rests on the ground or a block. */
    sup: new Int8Array(n * 4).fill(-1),
    onFixed: new Uint8Array(n),
    blocks: new Float64Array(layout.blocks.length * 4),
    bx: HAND_X, by: HAND_Y, bvx: 0, bvy: 0, spin: 0,
    /** 0 in the hand, 1 in flight, 2 done (stopped or out). */
    ball: 0, rest: 0,
    throwNo: 0, steps: 0,
    /** Counters the screen turns into sounds and puffs: knocks, stone landings, ball bounces. */
    knocks: 0, ballHits: 0, lands: 0, bounces: 0, landX: 0, landY: 0, hitX: 0, hitY: 0,
    dirty: false,
  };
  layout.stones.forEach((stone, i) => { w.x[i] = stone.x; w.y[i] = stone.y; w.w[i] = stone.w; w.h[i] = stone.h; });
  layout.blocks.forEach((block, i) => w.blocks.set(block, i * 4));
  for (let i = 0; i < n; i++) {
    const bottom = w.y[i] + w.h[i] / 2, left = w.x[i] - w.w[i] / 2, right = w.x[i] + w.w[i] / 2;
    if (Math.abs(bottom - GROUND) < 0.6) w.onFixed[i] = 1;
    for (let b = 0; b < w.blocks.length; b += 4) {
      if (Math.abs(bottom - w.blocks[b + 1]) < 0.6 && Math.min(right, w.blocks[b + 2]) - Math.max(left, w.blocks[b]) > 0.5) w.onFixed[i] = 1;
    }
    let slot = 0;
    for (let j = 0; j < n && slot < 4; j++) {
      if (j === i) continue;
      const top = w.y[j] - w.h[j] / 2, overlap = Math.min(right, w.x[j] + w.w[j] / 2) - Math.max(left, w.x[j] - w.w[j] / 2);
      if (Math.abs(top - bottom) < 0.6 && overlap > 0.5) w.sup[i * 4 + slot++] = j;
    }
  }
  return w;
}
export type World = ReturnType<typeof createWorld>;

export const speedOf = (power: number) => SPEED_MIN + (SPEED_MAX - SPEED_MIN) * clampPower(power);
export const clampAngle = (angle: number) => Math.min(ANGLE_MAX, Math.max(ANGLE_MIN, angle));
export const clampPower = (power: number) => Math.min(1, Math.max(POWER_MIN, power));

/** Throws the ball from the hand: `angle` above the horizontal in radians, `power` 0.1–1. */
export function throwBall(w: World, angle: number, power: number) {
  if (w.ball !== 0) return false;
  const a = clampAngle(angle), speed = speedOf(power);
  w.bx = HAND_X; w.by = HAND_Y; w.bvx = Math.cos(a) * speed; w.bvy = -Math.sin(a) * speed;
  w.ball = 1; w.steps = 0; w.rest = 0;
  return true;
}

/** The ball back in the hand for the next throw; fallen stones stay where they lie. */
export function nextThrow(w: World) {
  w.throwNo++;
  w.ball = 0; w.bx = HAND_X; w.by = HAND_Y; w.bvx = w.bvy = 0;
}

/** The first part of the arc, ignoring anything in the way: `count` points `gap` seconds apart into `out` as x, y pairs. */
export function previewPath(angle: number, power: number, out: Float32Array, count: number, gap = 0.045) {
  const a = clampAngle(angle), speed = speedOf(power), vx = Math.cos(a) * speed, vy = -Math.sin(a) * speed;
  for (let k = 0; k < count; k++) {
    const t = (k + 1) * gap;
    out[k * 2] = HAND_X + vx * t;
    out[k * 2 + 1] = HAND_Y + vy * t + 0.5 * G * t * t;
  }
  return out;
}

export const downCount = (w: World) => { let down = 0; for (let i = 0; i < STONES; i++) if (w.downAt[i] >= 0) down++; return down; };
export const downThisThrow = (w: World) => { let down = 0; for (let i = 0; i < STONES; i++) if (w.downAt[i] === w.throwNo) down++; return down; };
export const settled = (w: World) => w.ball !== 1 && !w.state.includes(FLYING);

/** Half-extents of a stone's bounding box at its current angle. */
const extentX = (w: World, i: number) => Math.abs(w.w[i] / 2 * Math.cos(w.a[i])) + Math.abs(w.h[i] / 2 * Math.sin(w.a[i]));
const extentY = (w: World, i: number) => Math.abs(w.w[i] / 2 * Math.sin(w.a[i])) + Math.abs(w.h[i] / 2 * Math.cos(w.a[i]));

function knock(w: World, i: number, vx: number, vy: number, va: number) {
  w.state[i] = FLYING; w.vx[i] = vx; w.vy[i] = vy; w.va[i] = Math.max(-14, Math.min(14, va));
  w.downAt[i] = w.throwNo;
  w.knocks++;
  w.dirty = true;
}

/** A standing stone stays while its centre is over what is left under it; otherwise it tips toward the open side. */
function supportPass(w: World) {
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < STONES; i++) {
      if (w.state[i] !== STANDING || w.onFixed[i]) continue;
      const left = w.x[i] - w.w[i] / 2, right = w.x[i] + w.w[i] / 2;
      let lo = Infinity, hi = -Infinity, gone = 0, gvx = 0;
      for (let s = 0; s < 4; s++) {
        const j = w.sup[i * 4 + s];
        if (j < 0) continue;
        if (w.state[j] === STANDING) { lo = Math.min(lo, Math.max(left, w.x[j] - w.w[j] / 2)); hi = Math.max(hi, Math.min(right, w.x[j] + w.w[j] / 2)); }
        else { gone++; gvx += w.vx[j]; }
      }
      if (w.x[i] >= lo - SLOP && w.x[i] <= hi + SLOP) continue;
      // The stone under it drags it along a little; the higher it sits, the less it follows (each level halves it).
      // A pile whose footing is gone also sprays: pieces slide off left and right in turn, faster the higher they sat,
      // so a collapse spreads on the ground instead of settling back into a neat pile.
      const drag = gone ? (gvx / gone) * 0.5 : 0, height = Math.max(0, (GROUND - w.y[i]) / w.h[i]);
      const side = lo === Infinity ? (i % 2 ? 1 : -1) * (40 + 14 * height) : w.x[i] > hi ? 30 : -30;
      knock(w, i, drag + side, -20, side / 18);
      w.knocks--; // a stone that only loses its footing isn't a hit
      changed = true;
    }
  }
  w.dirty = false;
}

/** Ball against a fixed box: push out and bounce. Returns the inward normal speed (negative when it was closing in), or 1 for no contact. */
function ballBox(w: World, x0: number, y0: number, x1: number, y1: number, bounce: number) {
  const cx = Math.max(x0, Math.min(w.bx, x1)), cy = Math.max(y0, Math.min(w.by, y1));
  let dx = w.bx - cx, dy = w.by - cy, d2 = dx * dx + dy * dy;
  if (d2 >= BALL_R * BALL_R) return 1;
  let nx: number, ny: number, push: number;
  if (d2 > 1e-9) { const d = Math.sqrt(d2); nx = dx / d; ny = dy / d; push = BALL_R - d; }
  else {
    // Centre inside the box (only at a corner graze): leave by the nearest face.
    const l = w.bx - x0, r = x1 - w.bx, t = w.by - y0, b = y1 - w.by, m = Math.min(l, r, t, b);
    if (m === l) { nx = -1; ny = 0; } else if (m === r) { nx = 1; ny = 0; } else if (m === t) { nx = 0; ny = -1; } else { nx = 0; ny = 1; }
    push = BALL_R + m;
  }
  w.bx += nx * push; w.by += ny * push;
  dx = nx; dy = ny;
  const vn = w.bvx * dx + w.bvy * dy;
  if (vn < 0) { w.bvx -= (1 + bounce) * vn * dx; w.bvy -= (1 + bounce) * vn * dy; }
  // Rolling on top of a brick, a step or a stone slows the ball like the ground does.
  if (ny < -0.5) w.bvx -= Math.sign(w.bvx) * Math.min(Math.abs(w.bvx), 170 * STEP / SUB);
  contactX = cx; contactY = cy; contactNx = nx; contactNy = ny;
  return vn;
}
let contactX = 0, contactY = 0, contactNx = 0, contactNy = 0;

function stepBall(w: World, h: number) {
  w.bvy += G * h; w.bx += w.bvx * h; w.by += w.bvy * h;
  w.spin += w.bvx * h / BALL_R;
  if (w.by + BALL_R > GROUND) {
    w.by = GROUND - BALL_R;
    if (w.bvy > 0) {
      if (w.bvy > 60) { w.bounces++; }
      w.bvy = w.bvy < 30 ? 0 : -w.bvy * 0.5;
    }
    const slow = Math.min(Math.abs(w.bvx), 170 * h);
    w.bvx -= Math.sign(w.bvx) * slow;
  }
  if (w.bx + BALL_R > WALL_X) { w.bx = WALL_X - BALL_R; if (w.bvx > 0) { w.bvx = -w.bvx * 0.45; w.bounces++; } }
  for (let b = 0; b < w.blocks.length; b += 4) {
    const vn = ballBox(w, w.blocks[b], w.blocks[b + 1], w.blocks[b + 2], w.blocks[b + 3], 0.45);
    if (vn < -60) w.bounces++;
  }
  for (let i = 0; i < STONES; i++) {
    if (w.state[i] !== STANDING) continue;
    const hw = w.w[i] / 2, hh = w.h[i] / 2, bvx = w.bvx, bvy = w.bvy;
    const vn = ballBox(w, w.x[i] - hw, w.y[i] - hh, w.x[i] + hw, w.y[i] + hh, 0);
    // Square on top with little sideways speed: the ball just lands on the stone.
    if (vn < -KNOCK && (Math.abs(contactNx) > 0.3 || Math.abs(bvx) > 150)) {
      const nx = contactNx, ny = contactNy, tx = -ny, ty = nx;
      const vnIn = bvx * nx + bvy * ny, vt = bvx * tx + bvy * ty;
      const jn = -(1 + 0.35) * vnIn / INV, limit = 0.4 * jn;
      const jt = Math.max(-limit, Math.min(limit, -vt / INV));
      const px = jn * nx + jt * tx, py = jn * ny + jt * ty;
      w.bvx = bvx + px / BALL_MASS; w.bvy = bvy + py / BALL_MASS;
      const rx = contactX - w.x[i], ry = contactY - w.y[i];
      const inertia = STONE_MASS * (w.w[i] * w.w[i] + w.h[i] * w.h[i]) / 12;
      knock(w, i, -px / STONE_MASS, -py / STONE_MASS - 40, (rx * -py - ry * -px) / inertia * 6);
      w.hitX = contactX; w.hitY = contactY; w.ballHits++;
    } else if (vn < 0) {
      w.bvx *= 0.98;
      if (vn < -60) w.bounces++;
    }
  }
  if (w.bx < -BALL_R * 3) { w.ball = 2; return; }
  // Still for a quarter second (on the ground, a brick or a stone): the ball is done.
  w.rest = Math.abs(w.bvx) < 8 && Math.abs(w.bvy) < 8 ? w.rest + h : 0;
  if (w.rest > 0.25) { w.ball = 2; w.bvx = w.bvy = 0; }
}

/** A flying stone's bounding box against a fixed box (block, standing or lying stone). Returns 1 on a landing contact. */
function stoneBox(w: World, i: number, x0: number, y0: number, x1: number, y1: number, standing: number, h: number) {
  const ex = extentX(w, i), ey = extentY(w, i);
  const ox = Math.min(w.x[i] + ex, x1) - Math.max(w.x[i] - ex, x0), oy = Math.min(w.y[i] + ey, y1) - Math.max(w.y[i] - ey, y0);
  if (ox <= 0 || oy <= 0) return 0;
  // A stone on the ground that slides under another one is pushed sideways, never into the ground.
  if (oy < ox && (w.y[i] < (y0 + y1) / 2 || w.y[i] + ey < GROUND - 0.5)) {
    if (w.y[i] < (y0 + y1) / 2) { w.y[i] -= oy; land(w, i, h); return 1; }
    w.y[i] += oy; if (w.vy[i] < 0) w.vy[i] = 0;
    return 0;
  }
  const dir = w.x[i] < (x0 + x1) / 2 ? -1 : 1;
  // Sliding into a standing stone hard enough knocks it on.
  if (standing >= 0 && -w.vx[i] * dir > STONE_KNOCK) {
    knock(w, standing, w.vx[i] * 0.6, -30, -dir * 4);
    w.vx[i] *= 0.35;
  }
  w.x[i] += dir * ox;
  if (w.vx[i] * dir < 0) w.vx[i] = -w.vx[i] * 0.25;
  return 0;
}

function land(w: World, i: number, h: number) {
  if (w.vy[i] > 0) {
    if (w.vy[i] > 70) { w.lands++; w.landX = w.x[i]; w.landY = w.y[i] + extentY(w, i); }
    w.vy[i] = w.vy[i] < 24 ? 0 : -w.vy[i] * 0.22;
  }
  w.vx[i] -= Math.sign(w.vx[i]) * Math.min(Math.abs(w.vx[i]), 700 * h);
  // On the ground a stone tips toward lying flat; on its edge it falls one way or the other.
  const s2 = Math.sin(2 * w.a[i]);
  w.va[i] += (-22 * s2 + (Math.abs(s2) < 0.05 && Math.abs(Math.cos(w.a[i])) < 0.3 ? (w.vx[i] >= 0 ? 4 : -4) : 0)) * h;
  w.va[i] *= 1 - 6 * h;
}

function stepStone(w: World, i: number, h: number) {
  w.vy[i] += G * h; w.x[i] += w.vx[i] * h; w.y[i] += w.vy[i] * h; w.a[i] += w.va[i] * h;
  w.va[i] *= 1 - 0.3 * h;
  let contact = 0;
  const ey = extentY(w, i);
  if (w.y[i] + ey > GROUND) { w.y[i] = GROUND - ey; land(w, i, h); contact = 1; }
  const ex = extentX(w, i);
  if (w.x[i] + ex > WALL_X) { w.x[i] = WALL_X - ex; if (w.vx[i] > 0) w.vx[i] = -w.vx[i] * 0.3; }
  else if (w.x[i] - ex < 0) { w.x[i] = ex; if (w.vx[i] < 0) w.vx[i] = -w.vx[i] * 0.3; }
  for (let b = 0; b < w.blocks.length; b += 4) contact |= stoneBox(w, i, w.blocks[b], w.blocks[b + 1], w.blocks[b + 2], w.blocks[b + 3], -1, h);
  for (let j = 0; j < STONES; j++) {
    if (j === i || w.state[j] === FLYING) continue;
    const hw = w.w[j] / 2, hh = w.h[j] / 2;
    contact |= stoneBox(w, i, w.x[j] - hw, w.y[j] - hh, w.x[j] + hw, w.y[j] + hh, w.state[j] === STANDING ? j : -1, h);
  }
  const sunk = w.y[i] + extentY(w, i) - GROUND;
  if (sunk > 0) w.y[i] -= sunk;
  if (!contact || Math.abs(w.vx[i]) > 10 || Math.abs(w.vy[i]) > 24 || Math.abs(w.va[i]) > 1.2) return;
  if (Math.abs(Math.sin(w.a[i])) > 0.12) return;
  // At rest and nearly flat: snap flat and freeze, so it can never jitter.
  const bottom = w.y[i] + extentY(w, i);
  w.a[i] = Math.round(w.a[i] / Math.PI) * Math.PI;
  w.y[i] = bottom - w.h[i] / 2;
  w.vx[i] = w.vy[i] = w.va[i] = 0;
  w.state[i] = LYING;
}

/** Stones lying on a stone that just got knocked wake up and fall again. */
function wakeLying(w: World) {
  for (let i = 0; i < STONES; i++) if (w.state[i] === LYING && w.y[i] + w.h[i] / 2 < GROUND - 0.5) w.state[i] = FLYING;
}

/** One fixed step (1/60 s) in four substeps. Does nothing once the throw has settled. */
export function step(w: World) {
  if (settled(w)) return;
  const h = STEP / SUB;
  for (let s = 0; s < SUB; s++) {
    if (w.ball === 1) stepBall(w, h);
    if (w.dirty) { supportPass(w); wakeLying(w); }
    for (let i = 0; i < STONES; i++) if (w.state[i] === FLYING) stepStone(w, i, h);
    if (w.dirty) { supportPass(w); wakeLying(w); }
  }
  w.steps++;
  if (w.steps >= MAX_STEPS) {
    // Safety stop: whatever still moves lies down where it is.
    w.ball = w.ball === 1 ? 2 : w.ball;
    for (let i = 0; i < STONES; i++) if (w.state[i] === FLYING) { w.a[i] = Math.round(w.a[i] / Math.PI) * Math.PI; w.vx[i] = w.vy[i] = w.va[i] = 0; w.state[i] = LYING; }
  }
}

/** Throws and steps until everything is still. Returns the stones that came down on this throw. */
export function simulate(w: World, angle: number, power: number) {
  throwBall(w, angle, power);
  while (!settled(w)) step(w);
  return downThisThrow(w);
}
