// Code that runs every frame while something on the table moves, and every frame of the end screen's count-up. Numbers in,
// the animation state (lib/anim.ts) mutated in place: no objects, arrays, closures or strings are made here (npm run
// lint:games checks it). Cosmetic only: what a drop means is decided by lib/play.ts, never here.
import { Flash, Mode, MAX_DUST, MAX_FLASH, type Anim, type Layout } from "./anim";

/** Everything drawn, made once per level and size (lib/art.ts): the board and tray layers, each piece and its lift shadow. */
export type Scene = {
  board: HTMLCanvasElement; tray: HTMLCanvasElement;
  sprites: HTMLCanvasElement[]; shadows: HTMLCanvasElement[];
  /** Each cell's outline, in board px. */
  cells: Path2D[];
  sweep: CanvasGradient;
  flashColors: string[];
  dust: string; ring: string; cursor: string;
};

export const SNAP_MS = 150;
export const FLASH_MS = 520;
export const SWEEP_MS = 1100;
export const SHAKE_MS = 220;
const DUST_MS = 420;

/** Milliseconds on the clock: the banked time, plus the run since `since` while it runs. */
export function clockMs(base: number, since: number, running: boolean, now: number) {
  return running ? base + Math.max(0, now - since) : base;
}

/** Ease out (cubic) over 0..1, clamped. */
export function easeOut(t: number) {
  const c = t < 0 ? 0 : t > 1 ? 1 : t;
  return 1 - (1 - c) * (1 - c) * (1 - c);
}

/** The value a count-up shows at progress t (0..1). */
export function countAt(to: number, t: number) {
  return Math.round(to * easeOut(t));
}

const near = (a: number, b: number, by: number) => (a > b ? a - b : b - a) < by;

/**
 * Moves everything on by `dt` ms, in steps of at most 16 ms (the scale spring stays stable on a slow frame). Returns 1 while
 * anything still moves (keep the frames coming), 0 when the table is still. Pieces that went in are listed in `landed`.
 */
export function stepAnim(a: Anim, dt: number) {
  a.landedCount = 0;
  // A frame stamped before the kick that asked for it (dt ≤ 0) moves nothing, but the frames must keep coming.
  if (!(dt > 0)) return 1;
  let moving = 0, left = dt;
  while (left > 0) {
    const step = left > 16 ? 16 : left;
    moving = stepOnce(a, step);
    left -= step;
  }
  return moving;
}

function stepOnce(a: Anim, dt: number) {
  let moving = 0;
  const calm = a.calm;
  const follow = 1 - Math.exp(-dt / (calm ? 12 : 22));
  const glide = 1 - Math.exp(-dt / (calm ? 25 : 70));
  const turn = 1 - Math.exp(-dt / (calm ? 20 : 55));
  const sec = dt / 1000;
  for (let i = 0; i < a.count; i++) {
    const mode = a.mode[i];
    if (mode === Mode.Waiting || mode === Mode.In) continue;
    if (a.wait[i] > 0) { a.wait[i] -= dt; moving = 1; continue; }
    if (mode === Mode.Snap) {
      a.ft[i] += dt / (calm ? 60 : SNAP_MS);
      const t = a.ft[i] > 1 ? 1 : a.ft[i], e = easeOut(t);
      a.x[i] = a.fx[i] + (a.tx[i] - a.fx[i]) * e;
      a.y[i] = a.fy[i] + (a.ty[i] - a.fy[i]) * e;
      a.s[i] = a.fs[i] + (1 - a.fs[i]) * e + (calm ? 0 : 0.07 * Math.sin(Math.PI * t));
      a.r[i] += (a.tr[i] - a.r[i]) * turn;
      if (t >= 1) { a.mode[i] = Mode.In; a.r[i] = a.tr[i]; a.s[i] = 1; a.landed[a.landedCount++] = i; }
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
      if (!calm) angle += a.vx > 1.2 ? 0.16 : a.vx < -1.2 ? -0.16 : a.vx * 0.13;
    }
    a.r[i] += (angle - a.r[i]) * turn;
    // The scale is a soft spring: a little overshoot when a piece is picked up or pops into a slot.
    if (calm) { a.s[i] += (a.ts[i] - a.s[i]) * glide; a.sv[i] = 0; }
    else {
      a.sv[i] += ((a.ts[i] - a.s[i]) * 700 - a.sv[i] * 30) * sec;
      a.s[i] += a.sv[i] * sec;
    }
    if (a.shake[i] > 0) a.shake[i] = calm ? 0 : a.shake[i] - dt;
    if (mode === Mode.Held || a.shake[i] > 0 || !near(a.x[i], a.tx[i], 0.3) || !near(a.y[i], a.ty[i], 0.3) || !near(a.s[i], a.ts[i], 0.002) || !near(a.r[i], angle, 0.002) || !near(a.sv[i], 0, 0.02)) moving = 1;
    else { a.x[i] = a.tx[i]; a.y[i] = a.ty[i]; a.s[i] = a.ts[i]; a.r[i] = angle; a.sv[i] = 0; }
  }
  for (let d = 0; d < MAX_DUST; d++) {
    if (a.dlife[d] <= 0) continue;
    a.dlife[d] -= dt;
    a.dx[d] += a.dvx[d] * dt; a.dy[d] += a.dvy[d] * dt;
    a.dvx[d] *= 0.9; a.dvy[d] = a.dvy[d] * 0.9 + 0.0004 * dt;
    moving = 1;
  }
  for (let f = 0; f < MAX_FLASH; f++) if (a.flashT[f] > 0) { a.flashT[f] -= dt; moving = 1; }
  if (a.sweep > 0) { a.sweep -= dt; moving = 1; }
  return moving;
}

/** A puff of cardboard dust from the four sides of a piece that just went in. */
export function puff(a: Anim, x: number, y: number, half: number) {
  if (a.calm) return;
  let made = 0;
  for (let d = 0; d < MAX_DUST && made < 12; d++) {
    if (a.dlife[d] > 0) continue;
    const angle = made * 2.39996 + x * 0.01, cos = Math.cos(angle), sin = Math.sin(angle);
    a.dx[d] = x + cos * half; a.dy[d] = y + sin * half;
    a.dvx[d] = cos * (0.05 + (made % 3) * 0.025); a.dvy[d] = sin * (0.05 + (made % 4) * 0.02) - 0.03;
    a.dlife[d] = DUST_MS;
    made++;
  }
}

/** A cell lights up for a moment: gold for a piece in, red for a wrong cell, amber for "right place, still turned". */
export function flash(a: Anim, cell: number, kind: number) {
  let slot = 0, oldest = FLASH_MS + 1;
  for (let f = 0; f < MAX_FLASH; f++) if (a.flashT[f] < oldest) { oldest = a.flashT[f]; slot = f; }
  a.flashCell[slot] = cell; a.flashKind[slot] = kind; a.flashT[slot] = FLASH_MS;
}

/** A piece starts sliding home from wherever it is shown now. */
export function snapHome(a: Anim, id: number, x: number, y: number, angle: number) {
  a.mode[id] = Mode.Snap;
  a.fx[id] = a.x[id]; a.fy[id] = a.y[id]; a.fs[id] = a.s[id]; a.ft[id] = 0;
  a.tx[id] = x; a.ty[id] = y; a.tr[id] = angle; a.wait[id] = 0;
  if (a.held === id) a.held = -1;
}

/** A piece goes to (or stays in) a tray slot at `scale`, optionally with a shake. */
export function rest(a: Anim, id: number, x: number, y: number, scale: number, shake: number) {
  a.mode[id] = Mode.Tray;
  a.tx[id] = x; a.ty[id] = y; a.ts[id] = scale;
  if (shake > 0 && !a.calm) a.shake[id] = SHAKE_MS;
  if (a.held === id) a.held = -1;
}

/** A piece comes into your hand at its board size, a little bigger while carried. */
export function hold(a: Anim, id: number, x: number, y: number) {
  a.mode[id] = Mode.Held;
  a.held = id; a.vx = 0;
  a.tx[id] = x; a.ty[id] = y; a.ts[id] = a.calm ? 1 : 1.05; a.wait[id] = 0;
}

/** Draws the whole table. `dpr` is the canvas's pixel ratio; everything else is in CSS px. */
export function drawTable(c: CanvasRenderingContext2D, a: Anim, scene: Scene, l: Layout, dpr: number) {
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, c.canvas.width, c.canvas.height);
  c.globalAlpha = 1;
  c.drawImage(scene.board, l.ox * dpr - 2 * dpr, l.oy * dpr - 2 * dpr);
  c.setTransform(dpr, 0, 0, dpr, l.ox * dpr, l.oy * dpr);
  for (let f = 0; f < MAX_FLASH; f++) {
    if (a.flashT[f] <= 0 || a.flashCell[f] < 0) continue;
    const t = a.flashT[f] / FLASH_MS;
    c.globalAlpha = a.flashKind[f] === Flash.Good ? t * 0.7 : t < 0.6 ? 0.55 : t * 0.9;
    c.fillStyle = scene.flashColors[a.flashKind[f]];
    c.fill(scene.cells[a.flashCell[f]]);
  }
  if (a.sweep > 0) {
    c.globalAlpha = a.sweep < 250 ? a.sweep / 250 : 1;
    const at = (1 - a.sweep / SWEEP_MS) * l.board * 2.2 - l.board * 0.6;
    c.save();
    c.beginPath(); c.rect(0, 0, l.board, l.board); c.clip();
    c.setTransform(dpr, 0, 0, dpr, (l.ox + at) * dpr, l.oy * dpr);
    c.fillStyle = scene.sweep;
    c.fillRect(-l.board * 0.6, 0, l.board * 0.6, l.board);
    c.restore();
  }
  if (a.cursor >= 0) {
    c.globalAlpha = 1;
    c.strokeStyle = scene.cursor; c.lineWidth = 3;
    c.strokeRect((a.cursor % l.n) * l.cell + 1.5, Math.floor(a.cursor / l.n) * l.cell + 1.5, l.cell - 3, l.cell - 3);
  }
  c.globalAlpha = 1;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.drawImage(scene.tray, (l.ox - 2) * dpr, (l.trayTop - 2) * dpr);
  if (a.selected >= 0) {
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.strokeStyle = scene.ring; c.lineWidth = 3;
    c.strokeRect(l.ox + (a.selected % l.cols) * l.slot + 3, l.trayTop + Math.floor(a.selected / l.cols) * l.slot + 3, l.slot - 6, l.slot - 6);
  }
  for (let i = 0; i < a.count; i++) if (a.mode[i] === Mode.Tray) drawPiece(c, a, scene, l, dpr, i);
  for (let i = 0; i < a.count; i++) if (a.mode[i] === Mode.Snap) drawPiece(c, a, scene, l, dpr, i);
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.fillStyle = scene.dust;
  for (let d = 0; d < MAX_DUST; d++) {
    if (a.dlife[d] <= 0) continue;
    c.globalAlpha = a.dlife[d] / DUST_MS * 0.8;
    const size = 1.5 + (d % 3);
    c.fillRect(a.dx[d] - size / 2, a.dy[d] - size / 2, size, size);
  }
  c.globalAlpha = 1;
  const held = a.held;
  if (held >= 0 && a.mode[held] === Mode.Held) {
    // The lift shadow sits low and to the right, so the piece reads as above the table.
    const lift = a.calm ? 4 : 10 * a.s[held];
    place(c, a, l, dpr, held, lift * 0.45, lift);
    c.globalAlpha = 0.45;
    c.drawImage(scene.shadows[held], -l.piece / 2, -l.piece / 2, l.piece, l.piece);
    c.globalAlpha = 1;
    drawPiece(c, a, scene, l, dpr, held);
  }
}

function place(c: CanvasRenderingContext2D, a: Anim, l: Layout, dpr: number, i: number, dx: number, dy: number) {
  const s = a.s[i] * dpr, cos = Math.cos(a.r[i]) * s, sin = Math.sin(a.r[i]) * s;
  const wobble = a.shake[i] > 0 ? Math.sin(a.shake[i] * 0.09) * 5 * (a.shake[i] / SHAKE_MS) : 0;
  c.setTransform(cos, sin, -sin, cos, (a.x[i] + dx + wobble) * dpr, (a.y[i] + dy) * dpr);
}

function drawPiece(c: CanvasRenderingContext2D, a: Anim, scene: Scene, l: Layout, dpr: number, i: number) {
  place(c, a, l, dpr, i, 0, 0);
  c.drawImage(scene.sprites[i], -l.piece / 2, -l.piece / 2, l.piece, l.piece);
}
