// Pure সাত চাড়া physics, stepped at 60 Hz in four substeps. A tuned topple model, not a general rigid-body solver: a standing
// stone never moves until something knocks it or its support goes, a knocked stone flies as a spinning box with its own
// weight, and a stone that comes to rest is frozen flat, so nothing can jitter at rest. Fixed steps and no randomness: the
// same throw at the same moment on the same pile always ends the same way.
// Runs every step: no object or array literals, closures, `new` or string building in here (npm run lint:games).
import {
  clampAngle, speedOf, BALL_R, FLYING, G, GROUND, HAND_X, HAND_Y, LYING, MAX_STEPS, STANDING, STEP, STONES, SUB, WALL_X,
  type World,
} from "./world";

const BALL_MASS = 1.4;
/**
 * Normal approach speed the ball needs to knock a stone out: a loose top piece goes at KNOCK_BASE, and every piece resting
 * on it (all the way up) adds KNOCK_LOAD, because their weight pins it. A heavy piece needs its mass times as much.
 */
const KNOCK_BASE = 45;
const KNOCK_LOAD = 26;
/** The same for a flying stone sliding into a standing one. */
const STONE_KNOCK = 60;
const STONE_LOAD = 24;
/** A lying piece the ball meets at more than this is kicked aside. */
const KICK = 50;
/** Rolling drag on the lane (units/s²), the ground's bounce, and the far wall's. */
const ROLL = 360;
const BOUNCE = 0.45;
const WALL_BOUNCE = 0.25;
/** A bounce on the lane takes this share of the ball's forward speed with it (brick and dust grab a rubber ball). */
const SCUFF = 0.72;
const SLOP = 0.3;
/** মিঠু's half width. */
export const GUARD_HALF = 7;

// The last contact ballBox found (module scratch, so nothing allocates).
let contactX = 0, contactY = 0, contactNx = 0, contactNy = 0;

export function anyFlying(w: World) {
  for (let i = 0; i < STONES; i++) if (w.state[i] === FLYING) return true;
  return false;
}
export const settled = (w: World) => w.ball !== 1 && !anyFlying(w);
export function downCount(w: World) { let down = 0; for (let i = 0; i < STONES; i++) if (w.state[i] !== STANDING) down++; return down; }
export function downThisThrow(w: World) { let down = 0; for (let i = 0; i < STONES; i++) if (w.downAt[i] === w.throwNo) down++; return down; }

/** The top of মিঠু (his hands) at clock step `t`: standing, or up to `hop` higher while he's in the air. */
export function guardTop(w: World, t: number) {
  const base = GROUND - w.guardTall;
  if (!w.hasGuard || w.guardAir <= 0) return base;
  const u = (((t - w.guardPhase) % w.guardPeriod) + w.guardPeriod) % w.guardPeriod;
  return u < w.guardAir ? base - w.guardHop * Math.sin((Math.PI * u) / w.guardAir) : base;
}
/** 0 standing, up to 1 at the top of a hop. */
export const guardLift = (w: World, t: number) => w.guardHop > 0 ? (GROUND - w.guardTall - guardTop(w, t)) / w.guardHop : 0;

/** Throws the ball from the hand: `angle` above the horizontal in radians, `power` 0.1–1. */
export function throwBall(w: World, angle: number, power: number) {
  if (w.ball !== 0) return false;
  const a = clampAngle(angle), speed = speedOf(power);
  w.bx = HAND_X; w.by = HAND_Y; w.bvx = Math.cos(a) * speed; w.bvy = -Math.sin(a) * speed;
  w.ball = 1; w.steps = 0; w.rest = 0; w.held = 0;
  return true;
}

/** The ball back in the hand for the next throw; fallen stones stay where they lie. */
export function nextThrow(w: World) {
  w.throwNo++;
  w.ball = 0; w.held = 0; w.bx = HAND_X; w.by = HAND_Y; w.bvx = w.bvy = 0;
  w.idle = 0; w.backNow = 0;
}

/** How many standing stones rest on stone `i`, directly or through others. */
export function loadOn(w: World, i: number) {
  let mask = 1 << i, grew = true;
  while (grew) {
    grew = false;
    for (let j = 0; j < STONES; j++) {
      if (mask & (1 << j) || w.state[j] !== STANDING) continue;
      for (let s = 0; s < 4; s++) { const k = w.sup[j * 4 + s]; if (k >= 0 && mask & (1 << k)) { mask |= 1 << j; grew = true; break; } }
    }
  }
  let count = -1;
  for (let j = 0; j < STONES; j++) if (mask & (1 << j)) count++;
  return count;
}
/** The approach speed that knocks stone `i` out now. */
export const knockSpeed = (w: World, i: number) => (KNOCK_BASE + KNOCK_LOAD * loadOn(w, i)) * w.m[i];

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
      // The stone under it drags it along a little; the higher it sits, the less it follows. A pile whose footing is gone
      // sprays: pieces slide off left and right in turn, faster the higher they sat, so a collapse spreads on the ground.
      // A heavy piece is slower to go.
      const weight = 1 / Math.sqrt(w.m[i]);
      const drag = gone ? (gvx / gone) * 0.5 : 0, height = Math.max(0, (GROUND - w.y[i]) / w.h[i]);
      const side = (lo === Infinity ? (i % 2 ? 1 : -1) * (40 + 14 * height) : w.x[i] > hi ? 30 : -30) * weight;
      knock(w, i, drag + side, -20 * weight, side / 18);
      w.knocks--; // a stone that only loses its footing isn't a hit
      changed = true;
    }
  }
  w.dirty = false;
}

/** Ball against a fixed box: push out and bounce. Returns the inward normal speed (negative when it was closing in), or 1 for no contact. */
function ballBox(w: World, x0: number, y0: number, x1: number, y1: number, bounce: number) {
  const cx = Math.max(x0, Math.min(w.bx, x1)), cy = Math.max(y0, Math.min(w.by, y1));
  let dx = w.bx - cx, dy = w.by - cy;
  const d2 = dx * dx + dy * dy;
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
  if (ny < -0.5) w.bvx -= Math.sign(w.bvx) * Math.min(Math.abs(w.bvx), ROLL * STEP / SUB);
  contactX = cx; contactY = cy; contactNx = nx; contactNy = ny;
  return vn;
}

function inMud(w: World, x: number) {
  for (let k = 0; k < w.mud.length; k += 2) if (x > w.mud[k] && x < w.mud[k + 1]) return true;
  return false;
}

function stepBall(w: World, h: number) {
  const fromY = w.by;
  w.bvy += G * h; w.bx += w.bvx * h; w.by += w.bvy * h;
  w.spin += w.bvx * h / BALL_R;
  // The clothesline: a ball that meets it, from either side, is caught by the গামছা and drops under it.
  if (w.hasLine && w.bx > w.lineX0 && w.bx < w.lineX1 && Math.min(fromY, w.by) - BALL_R < w.lineY && Math.max(fromY, w.by) + BALL_R > w.lineY
    && (fromY - BALL_R >= w.lineY || fromY + BALL_R <= w.lineY)) {
    w.by = w.lineY + BALL_R + 0.5; w.bvx *= 0.2; w.bvy = 30;
    w.lineHits++;
  }
  if (w.by + BALL_R > GROUND) {
    w.by = GROUND - BALL_R;
    const mud = inMud(w, w.bx);
    if (w.bvy > 0) {
      if (w.bvy > 60) { if (mud) w.splats++; else w.bounces++; }
      if (w.bvy >= 30) w.bvx *= SCUFF;
      w.bvy = mud || w.bvy < 30 ? 0 : -w.bvy * BOUNCE;
    }
    // Mud swallows a rolling ball within a hand's breadth.
    const slow = Math.min(Math.abs(w.bvx), (mud ? 2600 : ROLL) * h);
    if (mud && Math.abs(w.bvx) > 40 && slow >= Math.abs(w.bvx) - 1e-9) w.splats++;
    w.bvx -= Math.sign(w.bvx) * slow;
  }
  if (w.bx + BALL_R > WALL_X) { w.bx = WALL_X - BALL_R; if (w.bvx > 0) { w.bvx = -w.bvx * WALL_BOUNCE; w.bounces++; } }
  for (let b = 0; b < w.blocks.length; b += 4) {
    const vn = ballBox(w, w.blocks[b], w.blocks[b + 1], w.blocks[b + 2], w.blocks[b + 3], 0.45);
    if (vn < -60) w.bounces++;
  }
  // মিঠু catches whatever reaches him, in the air or rolling.
  if (w.hasGuard) {
    const top = guardTop(w, w.clock), gx = w.guardX;
    const cx = Math.max(gx - GUARD_HALF, Math.min(w.bx, gx + GUARD_HALF)), cy = Math.max(top, Math.min(w.by, GROUND));
    if ((w.bx - cx) * (w.bx - cx) + (w.by - cy) * (w.by - cy) < BALL_R * BALL_R) {
      w.ball = 2; w.held = 1; w.caught++;
      w.bvx = w.bvy = 0; w.bx = gx + 2; w.by = top - 3;
      return;
    }
  }
  for (let i = 0; i < STONES; i++) {
    // Fallen pieces are rubble on the lane: the ball kicks a loose one aside and loses speed doing it, or bumps over it.
    if (w.state[i] === LYING) {
      const hw = w.w[i] / 2, hh = w.h[i] / 2, bvx = w.bvx, bvy = w.bvy;
      const vn = ballBox(w, w.x[i] - hw, w.y[i] - hh, w.x[i] + hw, w.y[i] + hh, 0.2);
      if (vn < -KICK && (Math.abs(contactNx) > 0.3 || Math.abs(bvx) > 150)) {
        const m = w.m[i], share = BALL_MASS / (BALL_MASS + m);
        w.state[i] = FLYING; w.vx[i] = bvx * share * 1.3; w.vy[i] = -40 - Math.abs(bvy) * 0.2; w.va[i] = (bvx > 0 ? 1 : -1) * 5;
        w.bvx = bvx * (1 - share * 0.8); w.bvy = bvy * 0.6;
        w.kicks++; w.dirty = true;
      } else if (vn < -60) w.bounces++;
      continue;
    }
    if (w.state[i] !== STANDING) continue;
    const hw = w.w[i] / 2, hh = w.h[i] / 2, bvx = w.bvx, bvy = w.bvy;
    const vn = ballBox(w, w.x[i] - hw, w.y[i] - hh, w.x[i] + hw, w.y[i] + hh, 0);
    // Square on top with little sideways speed: the ball just lands on the stone. A heavy piece needs a hard ball.
    if (vn < -knockSpeed(w, i) && (Math.abs(contactNx) > 0.3 || Math.abs(bvx) > 150)) {
      const m = w.m[i], inv = 1 / BALL_MASS + 1 / m;
      const nx = contactNx, ny = contactNy, tx = -ny, ty = nx;
      const vnIn = bvx * nx + bvy * ny, vt = bvx * tx + bvy * ty;
      const jn = -(1 + 0.35) * vnIn / inv, limit = 0.4 * jn;
      const jt = Math.max(-limit, Math.min(limit, -vt / inv));
      const px = jn * nx + jt * tx, py = jn * ny + jt * ty;
      w.bvx = bvx + px / BALL_MASS; w.bvy = bvy + py / BALL_MASS;
      const rx = contactX - w.x[i], ry = contactY - w.y[i];
      const inertia = m * (w.w[i] * w.w[i] + w.h[i] * w.h[i]) / 12;
      knock(w, i, -px / m, -py / m - 40 / m, (rx * -py - ry * -px) / inertia * 6);
      w.hitX = contactX; w.hitY = contactY; w.ballHits++;
    } else if (vn < 0) {
      w.bvx *= 0.98;
      if (vn < -40) { w.grazes++; w.grazeI = i; }
      if (vn < -60) w.bounces++;
    }
  }
  if (w.bx < -BALL_R * 3) { w.ball = 2; return; }
  // Still for a quarter second (on the ground, a brick or a stone): the ball is done.
  w.rest = Math.abs(w.bvx) < 8 && Math.abs(w.bvy) < 8 ? w.rest + h : 0;
  if (w.rest > 0.25) { w.ball = 2; w.bvx = w.bvy = 0; }
}

/** Half-extents of a stone's bounding box at its current angle. */
const extentX = (w: World, i: number) => Math.abs(w.w[i] / 2 * Math.cos(w.a[i])) + Math.abs(w.h[i] / 2 * Math.sin(w.a[i]));
const extentY = (w: World, i: number) => Math.abs(w.w[i] / 2 * Math.sin(w.a[i])) + Math.abs(w.h[i] / 2 * Math.cos(w.a[i]));

function land(w: World, i: number, h: number) {
  if (w.vy[i] > 0) {
    if (w.vy[i] > 70) { if (w.m[i] > 1) w.thuds++; else w.lands++; w.landX = w.x[i]; w.landY = w.y[i] + extentY(w, i); }
    w.vy[i] = w.vy[i] < 24 ? 0 : -w.vy[i] * (w.m[i] > 1 ? 0.12 : 0.22);
  }
  w.vx[i] -= Math.sign(w.vx[i]) * Math.min(Math.abs(w.vx[i]), 700 * h);
  // On the ground a stone tips toward lying flat; on its edge it falls one way or the other.
  const s2 = Math.sin(2 * w.a[i]);
  w.va[i] += (-22 * s2 + (Math.abs(s2) < 0.05 && Math.abs(Math.cos(w.a[i])) < 0.3 ? (w.vx[i] >= 0 ? 4 : -4) : 0)) * h;
  w.va[i] *= 1 - 6 * h;
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
  // Sliding into a standing stone hard enough knocks it on; a heavy one takes a harder push.
  if (standing >= 0 && -w.vx[i] * dir > (STONE_KNOCK + STONE_LOAD * loadOn(w, standing)) * w.m[standing] / Math.sqrt(w.m[i])) {
    knock(w, standing, w.vx[i] * 0.6 * w.m[i] / w.m[standing], -30, -dir * 4);
    w.vx[i] *= 0.35;
  }
  w.x[i] += dir * ox;
  if (w.vx[i] * dir < 0) w.vx[i] = -w.vx[i] * 0.25;
  return 0;
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
  if (w.hasGuard) contact |= stoneBox(w, i, w.guardX - GUARD_HALF, guardTop(w, w.clock), w.guardX + GUARD_HALF, GROUND, -1, h);
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
  rest(w, i);
}

function rest(w: World, i: number) {
  const bottom = w.y[i] + extentY(w, i);
  w.a[i] = Math.round(w.a[i] / Math.PI) * Math.PI;
  w.y[i] = bottom - w.h[i] / 2;
  w.vx[i] = w.vy[i] = w.va[i] = 0;
  w.state[i] = LYING;
  const fly = Math.abs(w.x[i] - w.hx[i]);
  if (fly > w.maxFly) w.maxFly = fly;
}

/** Stones lying on a stone that just got knocked wake up and fall again. */
function wakeLying(w: World) {
  for (let i = 0; i < STONES; i++) if (w.state[i] === LYING && w.y[i] + w.h[i] / 2 < GROUND - 0.5) w.state[i] = FLYING;
}

/** One fixed step (1/60 s) in four substeps. Does nothing once the throw has settled except keep the clock. */
export function step(w: World) {
  w.clock++;
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
    if (w.ball === 1) w.ball = 2;
    for (let i = 0; i < STONES; i++) if (w.state[i] === FLYING) { w.a[i] = Math.round(w.a[i] / Math.PI) * Math.PI; w.vx[i] = w.vy[i] = w.va[i] = 0; w.state[i] = LYING; }
  }
}

/** Moves a lying stone off the spot stone `i` stood on, flat on the ground beside it. */
function clearSpot(w: World, i: number) {
  const left = w.hx[i] - w.w[i] / 2, right = w.hx[i] + w.w[i] / 2, top = w.hy[i] - w.h[i] / 2, bottom = w.hy[i] + w.h[i] / 2;
  for (let j = 0; j < STONES; j++) {
    if (j === i || w.state[j] !== LYING) continue;
    const hw = w.w[j] / 2, hh = w.h[j] / 2;
    const ox = Math.min(right, w.x[j] + hw) - Math.max(left, w.x[j] - hw), oy = Math.min(bottom, w.y[j] + hh) - Math.max(top, w.y[j] - hh);
    if (ox <= 0 || oy <= 0) continue;
    const dir = w.x[j] >= w.hx[i] ? 1 : -1;
    let x = w.x[j] + dir * (ox + 0.5);
    if (x + hw > WALL_X || x - hw < 60) x = w.x[j] - dir * (w.w[i] + w.w[j]);
    w.x[j] = Math.min(WALL_X - hw, Math.max(60 + hw, x));
    w.y[j] = GROUND - hh;
  }
}

/** One step spent aiming (ball in hand). The clock runs, and টুনি may put a fallen piece back. Returns 1 when she did. */
export function idle(w: World) {
  w.clock++;
  if (!w.hasRebuild || w.ball !== 0 || w.throwNo === 0) return 0;
  w.idle++;
  if (w.backNow >= w.rebuildMost || w.idle < w.rebuildDelay + w.backNow * w.rebuildEvery) return 0;
  for (let k = 0; k < STONES; k++) {
    const i = w.order[k];
    if (w.state[i] === STANDING) continue;
    let ready = true;
    for (let s = 0; s < 4; s++) { const j = w.sup[i * 4 + s]; if (j >= 0 && w.state[j] !== STANDING) ready = false; }
    if (!ready) continue;
    w.fx[i] = w.x[i]; w.fy[i] = w.y[i]; w.fa[i] = w.a[i];
    clearSpot(w, i);
    w.x[i] = w.hx[i]; w.y[i] = w.hy[i]; w.a[i] = 0; w.vx[i] = w.vy[i] = w.va[i] = 0;
    w.state[i] = STANDING; w.downAt[i] = -1; w.backAt[i] = w.clock;
    w.backNow++; w.restacked++;
    return 1;
  }
  return 0;
}
/** টুনি has fallen pieces she could still put back in this gap. */
export function canRebuild(w: World) {
  return w.hasRebuild === 1 && w.ball === 0 && w.throwNo > 0 && w.backNow < w.rebuildMost && downCount(w) > 0;
}

/** How long the preview's dots last (seconds) and the time to the ball's first contact, set by trace(). */
export let traceTime = 0;

function touches(w: World, x: number, y: number, t: number) {
  if (y + BALL_R >= GROUND || x + BALL_R >= WALL_X) return true;
  for (let b = 0; b < w.blocks.length; b += 4) {
    if (x + BALL_R > w.blocks[b] && x - BALL_R < w.blocks[b + 2] && y + BALL_R > w.blocks[b + 1] && y - BALL_R < w.blocks[b + 3]) return true;
  }
  for (let i = 0; i < STONES; i++) {
    if (w.state[i] === FLYING) continue;
    if (Math.abs(x - w.x[i]) < w.w[i] / 2 + BALL_R && Math.abs(y - w.y[i]) < w.h[i] / 2 + BALL_R) return true;
  }
  if (w.hasLine && x > w.lineX0 && x < w.lineX1 && Math.abs(y - w.lineY) < BALL_R) return true;
  if (w.hasGuard && Math.abs(x - w.guardX) < GUARD_HALF + BALL_R && y + BALL_R > guardTop(w, t)) return true;
  return false;
}

/**
 * The arc the ball would fly, as dots `gap` seconds apart into `out` (x, y pairs), up to `max` dots, stopping at the first
 * thing it meets (the ground, a block, a standing stone, the line, মিঠু as he will be then). Returns the dot count;
 * `traceTime` is the time to that first contact.
 */
export function trace(w: World, angle: number, power: number, out: Float32Array, max: number, gap: number) {
  const a = clampAngle(angle), speed = speedOf(power), vx = Math.cos(a) * speed, vy = -Math.sin(a) * speed;
  let count = 0;
  for (let k = 1; k <= 360; k++) {
    const t = k * gap * 0.25, x = HAND_X + vx * t, y = HAND_Y + vy * t + 0.5 * G * t * t;
    if (touches(w, x, y, w.clock + t * 60)) { traceTime = t; return count; }
    if (k % 4 === 0 && count < max) { out[count * 2] = x; out[count * 2 + 1] = y; count++; }
  }
  traceTime = 360 * gap * 0.25;
  return count;
}

/** Throws and steps until everything is still. Returns the stones that came down on this throw. */
export function simulate(w: World, angle: number, power: number) {
  throwBall(w, angle, power);
  while (!settled(w)) step(w);
  return downThisThrow(w);
}
