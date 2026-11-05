// Code that runs every frame while something on the table moves. Numbers in, the animation state (lib/anim.ts) mutated in
// place: no objects, arrays, closures or strings are made here (npm run lint:games checks it). Cosmetic only: what a drop
// means is decided by lib/game.ts, never here.
import { Ghost, MAX_DUST, MAX_FLASH, Mode, PIECES, SPOT_STRIDE, pxX, pxY, type Anim, type Px } from './anim';
import type { Scene } from './art';

export const SNAP_MS = 160;
export const FLASH_MS = 520;
export const SWEEP_MS = 1100;
export const SHAKE_MS = 260;
/** The ghost finger shows its move in the first ~2 s of each cycle, then rests: an invitation, not a loop that nags. */
export const GHOST_MS = 4600;
/** The ghost waits this long before its first run. */
export const GHOST_WAIT = 900;
/** Where each piece's hop sits in the finishing wave (ms after the last piece lands): the wave speeds up as it goes. */
const WAVE_AT = [0, 70, 125, 168, 202, 230, 252];
const DUST_MS = 420;
const TWO_PI = Math.PI * 2;

/** A strong ease-out (quintic, close to cubic-bezier(0.23, 1, 0.32, 1)) over 0..1, clamped: the piece answers at once, then settles. */
export function easeOut(t: number) {
  const c = t < 0 ? 0 : t > 1 ? 1 : t, left = 1 - c, square = left * left;
  return 1 - square * square * left;
}

/** The value a count-up shows at progress t (0..1). */
export function countAt(to: number, t: number) {
  return Math.round(to * easeOut(t));
}

const near = (a: number, b: number, by: number) => (a > b ? a - b : b - a) < by;

/**
 * Moves everything on by `dt` ms, in steps of at most 16 ms (the springs stay stable on a slow frame). Returns 1 while
 * anything still moves (keep the frames coming), 0 when the table is still. Pieces that went in are listed in `landed`.
 */
export function stepAnim(a: Anim, dt: number) {
  a.landedCount = 0;
  if (!(dt > 0)) return 1;
  let moving = 0, left = dt;
  while (left > 0) {
    const step = left > 16 ? 16 : left;
    if (stepOnce(a, step)) moving = 1;
    left -= step;
  }
  return moving;
}

function stepOnce(a: Anim, dt: number) {
  let moving = 0;
  const calm = a.calm, quick = calm || a.quick > 0;
  if (a.quick > 0) a.quick -= dt;
  const follow = 1 - Math.exp(-dt / (quick ? 12 : 22));
  const glide = 1 - Math.exp(-dt / (quick ? 25 : 70));
  const turn = 1 - Math.exp(-dt / (quick ? 20 : 60));
  const sec = dt / 1000;
  a.clock += dt;
  for (let i = 0; i < PIECES; i++) {
    const mode = a.mode[i];
    if (a.pop[i] > 0) {
      a.pop[i] -= dt; moving = 1;
      if (a.pop[i] <= 0) a.sv[i] = calm ? 0 : 2.6 - i * 0.18;
    }
    if (mode === Mode.In) {
      if (a.sv[i] !== 0 || a.s[i] !== 1) {
        a.sv[i] += ((1 - a.s[i]) * 700 - a.sv[i] * 36) * sec;
        a.s[i] += a.sv[i] * sec;
        if (near(a.s[i], 1, 0.002) && near(a.sv[i], 0, 0.02)) { a.s[i] = 1; a.sv[i] = 0; } else moving = 1;
      }
      continue;
    }
    if (a.wait[i] > 0) { a.wait[i] -= dt; moving = 1; continue; }
    if (mode === Mode.Snap) {
      a.ft[i] += dt / (calm ? 70 : SNAP_MS);
      const t = a.ft[i] > 1 ? 1 : a.ft[i], e = easeOut(t);
      a.x[i] = a.fx[i] + (a.tx[i] - a.fx[i]) * e;
      a.y[i] = a.fy[i] + (a.ty[i] - a.fy[i]) * e;
      // A little squash as it lands: it grows past its size on the way, and settles.
      a.s[i] = a.fs[i] + (1 - a.fs[i]) * e + (calm ? 0 : 0.08 * Math.sin(Math.PI * t));
      a.r[i] += (a.tr[i] - a.r[i]) * turn;
      a.fl[i] += (a.tfl[i] - a.fl[i]) * glide;
      if (t >= 1) {
        a.mode[i] = Mode.In; a.r[i] = a.tr[i]; a.s[i] = 1; a.fl[i] = a.tfl[i]; a.sv[i] = 0;
        a.landed[a.landedCount++] = i;
      }
      moving = 1;
      continue;
    }
    const k = mode === Mode.Held ? follow : glide;
    const ox = a.x[i];
    a.x[i] += (a.tx[i] - a.x[i]) * k;
    a.y[i] += (a.ty[i] - a.y[i]) * k;
    let angle = a.tr[i];
    if (mode === Mode.Held) {
      const speed = dt > 0 ? (a.x[i] - ox) / dt : 0;
      a.vx = a.vx * 0.8 + speed * 0.2;
      if (!calm) angle += a.vx > 0.03 ? 0.16 : a.vx < -0.03 ? -0.16 : a.vx * 5;
    }
    a.r[i] += (angle - a.r[i]) * turn;
    a.fl[i] += (a.tfl[i] - a.fl[i]) * (calm ? 1 : glide * 1.4 > 1 ? 1 : glide * 1.4);
    if (calm) { a.s[i] += (a.ts[i] - a.s[i]) * glide; a.sv[i] = 0; }
    else {
      // The scale is a soft spring: a little overshoot when a piece is picked up, turned or put back.
      a.sv[i] += ((a.ts[i] - a.s[i]) * 700 - a.sv[i] * 36) * sec;
      a.s[i] += a.sv[i] * sec;
    }
    if (a.shake[i] > 0) a.shake[i] = calm ? 0 : a.shake[i] - dt;
    if (mode === Mode.Held || a.shake[i] > 0 || !near(a.x[i], a.tx[i], 0.01) || !near(a.y[i], a.ty[i], 0.01) || !near(a.s[i], a.ts[i], 0.002) || !near(a.r[i], angle, 0.002) || !near(a.fl[i], a.tfl[i], 0.01) || !near(a.sv[i], 0, 0.02)) moving = 1;
    else { a.x[i] = a.tx[i]; a.y[i] = a.ty[i]; a.s[i] = a.ts[i]; a.r[i] = angle; a.fl[i] = a.tfl[i]; a.sv[i] = 0; }
  }
  for (let d = 0; d < MAX_DUST; d++) {
    if (a.dlife[d] <= 0) continue;
    a.dlife[d] -= dt;
    a.dx[d] += a.dvx[d] * dt; a.dy[d] += a.dvy[d] * dt;
    a.dvx[d] *= 0.9; a.dvy[d] = a.dvy[d] * 0.9 + 0.00001 * dt;
    moving = 1;
  }
  for (let f = 0; f < MAX_FLASH; f++) if (a.flashT[f] > 0) { a.flashT[f] -= dt; moving = 1; }
  if (a.sweep > 0) { a.sweep -= dt; moving = 1; }
  if (a.ghost !== Ghost.Off) { a.gt += dt; if (!calm) moving = 1; }
  if (a.hintN > 0 && !calm) moving = 1;
  return moving;
}

/** A puff of dust from around a piece that just went in. Positions are in view units. */
export function puff(a: Anim, x: number, y: number, half: number) {
  if (a.calm) return;
  let made = 0;
  for (let d = 0; d < MAX_DUST && made < 12; d++) {
    if (a.dlife[d] > 0) continue;
    const angle = made * 2.39996 + x * 0.7, cos = Math.cos(angle), sin = Math.sin(angle);
    a.dx[d] = x + cos * half; a.dy[d] = y + sin * half;
    a.dvx[d] = cos * (0.0012 + (made % 3) * 0.0006); a.dvy[d] = sin * (0.0012 + (made % 4) * 0.0005) - 0.0008;
    a.dlife[d] = DUST_MS;
    made++;
  }
}

/** A piece that just went in flashes gold for a moment. */
export function flash(a: Anim, piece: number) {
  let slot = 0, oldest = FLASH_MS + 1;
  for (let f = 0; f < MAX_FLASH; f++) if (a.flashT[f] < oldest) { oldest = a.flashT[f]; slot = f; }
  a.flashPiece[slot] = piece; a.flashT[slot] = a.calm ? FLASH_MS * 0.4 : FLASH_MS;
}

/** A piece starts sliding to its spot from wherever it is shown now. */
export function snapTo(a: Anim, id: number, x: number, y: number, angle: number, flip: number) {
  a.mode[id] = Mode.Snap;
  a.fx[id] = a.x[id]; a.fy[id] = a.y[id]; a.fs[id] = a.s[id]; a.ft[id] = 0;
  a.tx[id] = x; a.ty[id] = y; a.tr[id] = angle; a.tfl[id] = flip; a.wait[id] = 0;
  if (a.held === id) a.held = -1;
}

/** A piece goes to (or stays in) its tray place at `scale`, optionally with a shake. */
export function rest(a: Anim, id: number, x: number, y: number, scale: number, shake: number) {
  a.mode[id] = Mode.Tray;
  a.tx[id] = x; a.ty[id] = y; a.ts[id] = scale;
  if (shake > 0 && !a.calm) a.shake[id] = SHAKE_MS;
  if (a.held === id) a.held = -1;
}

/** A piece put down loose on the board, at board size. */
export function loose(a: Anim, id: number, x: number, y: number) {
  a.mode[id] = Mode.Loose;
  a.tx[id] = x; a.ty[id] = y; a.ts[id] = 1;
  if (a.held === id) a.held = -1;
}

/** A piece comes into the hand at board size, a little bigger while carried. */
export function hold(a: Anim, id: number, x: number, y: number) {
  a.mode[id] = Mode.Held;
  a.held = id; a.vx = 0;
  a.tx[id] = x; a.ty[id] = y; a.ts[id] = a.calm ? 1 : 1.08; a.wait[id] = 0;
}

/**
 * The picture is whole: a wave of hops over the pieces, then a sweep of light. Both start after the last piece has landed
 * (`after` ms), so the cheer rides on the impact instead of fighting it.
 */
export function celebrate(a: Anim, after: number) {
  if (a.calm) return;
  for (let i = 0; i < PIECES; i++) a.pop[i] = after + WAVE_AT[i];
  a.sweep = SWEEP_MS + after + 120;
}

const trace = (c: CanvasRenderingContext2D, pts: Float32Array, n: number, offset: number, px: Px) => {
  c.beginPath();
  for (let k = 0; k < n; k++) {
    const x = pxX(px, pts[offset + k * 2]), y = pxY(px, pts[offset + k * 2 + 1]);
    if (k === 0) c.moveTo(x, y); else c.lineTo(x, y);
  }
  c.closePath();
};

function place(c: CanvasRenderingContext2D, a: Anim, px: Px, dpr: number, i: number, dx: number, dy: number) {
  const k = a.s[i], cos = Math.cos(a.r[i]) * k, sin = Math.sin(a.r[i]) * k, fl = a.fl[i];
  const wobble = a.shake[i] > 0 ? Math.sin(a.shake[i] * 0.09) * 0.12 * (a.shake[i] / SHAKE_MS) : 0;
  c.setTransform(cos * fl, sin * fl, -sin, cos, pxX(px, a.x[i] + dx + wobble) * dpr, pxY(px, a.y[i] + dy) * dpr);
}

function drawPiece(c: CanvasRenderingContext2D, a: Anim, scene: Scene, px: Px, dpr: number, i: number) {
  place(c, a, px, dpr, i, 0, 0);
  const half = scene.half[i];
  c.drawImage(scene.sprites[i], -half, -half);
}

/** The ghost finger: it drags (or taps) the first piece to its spot, over and over, until a child touches the game. */
function drawGhost(c: CanvasRenderingContext2D, a: Anim, scene: Scene, px: Px, dpr: number) {
  if (a.gt < 0) return;
  const calm = a.calm, t = (a.gt % GHOST_MS) / GHOST_MS, drag = a.ghost === Ghost.Drag;
  let x = a.gx0, y = a.gy0, alpha = 1, ripple = 0;
  if (!calm) {
    const press = drag ? 0.05 : 0.04, go = drag ? 0.28 : 0.14, end = drag ? 0.36 : 0.22;
    if (t < press) ripple = t / press;
    else if (t < go) { const e = easeOut((t - press) / (go - press)); x = a.gx0 + (a.gx1 - a.gx0) * e; y = a.gy0 + (a.gy1 - a.gy0) * e; }
    else if (t < end) { x = a.gx1; y = a.gy1; ripple = drag ? 0 : (t - go) / (end - go); }
    else { x = a.gx1; y = a.gy1; alpha = t - end > 0.12 ? 0 : 1 - (t - end) / 0.12; }
  }
  const X = pxX(px, x) * dpr, Y = pxY(px, y) * dpr;
  c.globalAlpha = alpha;
  if (ripple > 0) {
    c.strokeStyle = scene.p.ring; c.lineWidth = 3 * dpr; c.globalAlpha = alpha * (1 - ripple) * 0.8;
    c.beginPath(); c.arc(X, Y, (10 + ripple * 26) * dpr, 0, TWO_PI); c.stroke();
    c.globalAlpha = alpha;
  }
  c.drawImage(scene.finger, X - 32 * dpr, Y - 8 * dpr);
  c.globalAlpha = 1;
}

/** Draws the whole table. `dpr` is the canvas's pixel ratio; positions are in view units and go through `px`. */
export function drawTable(c: CanvasRenderingContext2D, a: Anim, scene: Scene, px: Px, dpr: number) {
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';
  c.drawImage(scene.back, 0, 0);

  // The lines that are left to fill: tinted in the piece's colour, plain, faint, or none.
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.lineJoin = 'round';
  if (a.lines < 3) {
    for (let s = 0; s < a.spots; s++) {
      trace(c, a.spotPts, a.spotN[s], s * SPOT_STRIDE, px);
      if (a.lines === 0) {
        c.fillStyle = scene.fills[a.spotColor[s]]; c.fill();
        c.strokeStyle = scene.strokes[a.spotColor[s]]; c.lineWidth = 2.5;
      } else { c.strokeStyle = a.lines === 1 ? scene.p.line : scene.p.faint; c.lineWidth = a.lines === 1 ? 2.5 : 2; }
      c.globalAlpha = a.lines === 1 ? 0.8 : 1;
      c.stroke();
    }
    c.globalAlpha = 1;
  }
  if (a.hintN > 0) {
    trace(c, a.hintPts, a.hintN, 0, px);
    const pulse = a.calm ? 0.35 : 0.3 + 0.18 * Math.sin(a.clock / 320);
    c.globalAlpha = pulse; c.fillStyle = scene.p.hint; c.fill();
    c.globalAlpha = 1; c.strokeStyle = scene.p.hint; c.lineWidth = 4; c.stroke();
  }

  c.setTransform(1, 0, 0, 1, 0, 0);
  for (let i = 0; i < PIECES; i++) if (a.mode[i] === Mode.In) drawPiece(c, a, scene, px, dpr, i);
  for (let i = 0; i < PIECES; i++) if (a.mode[i] === Mode.Loose) drawPiece(c, a, scene, px, dpr, i);
  if (a.selected >= 0 && a.mode[a.selected] === Mode.Tray) {
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.strokeStyle = scene.p.ring; c.lineWidth = 3; c.globalAlpha = 0.9;
    c.beginPath(); c.arc(pxX(px, a.x[a.selected]), pxY(px, a.y[a.selected]), px.pick * px.u * 0.9, 0, TWO_PI); c.stroke();
    c.globalAlpha = 1; c.setTransform(1, 0, 0, 1, 0, 0);
  }
  for (let i = 0; i < PIECES; i++) if (a.mode[i] === Mode.Tray) drawPiece(c, a, scene, px, dpr, i);
  for (let i = 0; i < PIECES; i++) if (a.mode[i] === Mode.Snap) drawPiece(c, a, scene, px, dpr, i);

  // A gold flash over a piece that just went in.
  c.globalCompositeOperation = 'lighter';
  for (let f = 0; f < MAX_FLASH; f++) {
    if (a.flashT[f] <= 0 || a.flashPiece[f] < 0) continue;
    c.globalAlpha = (a.flashT[f] / FLASH_MS) * 0.55;
    drawPiece(c, a, scene, px, dpr, a.flashPiece[f]);
  }
  c.globalCompositeOperation = 'source-over';
  c.globalAlpha = 1;

  if (a.sweep > 0 && a.sweep <= SWEEP_MS) {
    const t = 1 - a.sweep / SWEEP_MS, bandX = (t * 1.6 - 0.3) * px.w;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = a.sweep < 250 ? a.sweep / 250 * 0.35 : 0.35;
    c.fillStyle = scene.p.flash;
    c.beginPath();
    c.moveTo((bandX - px.w * 0.12) * dpr, 0); c.lineTo((bandX + px.w * 0.05) * dpr, 0); c.lineTo((bandX - px.w * 0.1) * dpr, px.h * dpr); c.lineTo((bandX - px.w * 0.27) * dpr, px.h * dpr);
    c.closePath(); c.fill();
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  }

  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.fillStyle = scene.p.dust;
  for (let d = 0; d < MAX_DUST; d++) {
    if (a.dlife[d] <= 0) continue;
    c.globalAlpha = (a.dlife[d] / DUST_MS) * 0.8;
    const size = 2 + (d % 3);
    c.fillRect(pxX(px, a.dx[d]) - size / 2, pxY(px, a.dy[d]) - size / 2, size, size);
  }
  c.globalAlpha = 1;

  const held = a.held;
  if (held >= 0 && a.mode[held] === Mode.Held) {
    // The lift shadow sits low and to the right, so the piece reads as above the table.
    const lift = a.calm ? 0.08 : 0.2 * a.s[held];
    place(c, a, px, dpr, held, lift * 0.5, lift);
    c.globalAlpha = 0.5;
    c.drawImage(scene.shadows[held], -scene.half[held], -scene.half[held]);
    c.globalAlpha = 1;
    drawPiece(c, a, scene, px, dpr, held);
  }
  if (a.ghost !== Ghost.Off) { c.setTransform(1, 0, 0, 1, 0, 0); drawGhost(c, a, scene, px, dpr); }
  c.setTransform(1, 0, 0, 1, 0, 0);
}
