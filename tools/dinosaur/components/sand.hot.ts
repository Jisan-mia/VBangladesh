// Per-stamp and per-frame painting of the pit: allocation-free. Setup lives in sand-paint.ts.
import { COLS, PIT, type Pit } from "../lib/pit";
import type { Dust } from "./sand-paint";

const TAU = Math.PI * 2;

/** Paint the last stamp: clear the sand's top layer (and, in deep sand, the wet layer under the cells on their second stroke), darken the soil's edge. */
export function paintStamp(pit: Pit, top: CanvasRenderingContext2D, mid: CanvasRenderingContext2D | null, halo: CanvasRenderingContext2D) {
  top.beginPath(); top.arc(pit.sx, pit.sy, pit.sr, 0, TAU); top.fill();
  if (pit.depth === 1 || !mid) {
    halo.beginPath(); halo.arc(pit.sx, pit.sy, pit.sr + 2.5, 0, TAU); halo.fill();
    return;
  }
  for (let k = 0; k < pit.nChanged; k++) {
    if (pit.changedTo[k] !== 2) continue;
    const i = pit.changed[k], cx = ((i % COLS) + 0.5) * PIT.cell, cy = (Math.floor(i / COLS) + 0.5) * PIT.cell;
    mid.beginPath(); mid.arc(cx, cy, 4.2, 0, TAU); mid.fill();
    halo.beginPath(); halo.arc(cx, cy, 6.5, 0, TAU); halo.fill();
  }
}

const rand = (d: Dust) => { d.seed = (d.seed * 1664525 + 1013904223) >>> 0; return d.seed / 4294967296; };

/** A little spray of grains at (x, y), thrown back against the way the brush moves (dx, dy). */
export function puff(d: Dust, x: number, y: number, dx: number, dy: number, count: number) {
  for (let k = 0; k < count; k++) {
    const i = d.next; d.next = (d.next + 1) % d.n;
    d.x[i] = x + (rand(d) - 0.5) * 10; d.y[i] = y + (rand(d) - 0.5) * 10;
    d.vx[i] = -dx * 0.05 + (rand(d) - 0.5) * 1.6; d.vy[i] = -dy * 0.05 - 0.4 - rand(d) * 1.1;
    d.life[i] = 0.7 + rand(d) * 0.3;
  }
  d.alive = d.n;
}

/** One frame of dust: move, fall, fade, draw. Returns how many grains are still alive (0 means the loop can stop). */
export function stepDust(d: Dust, c: CanvasRenderingContext2D, color: string): number {
  c.clearRect(0, 0, PIT.width, PIT.height);
  c.fillStyle = color;
  let alive = 0;
  for (let i = 0; i < d.n; i++) {
    const life = d.life[i];
    if (life <= 0) continue;
    d.x[i] += d.vx[i]; d.y[i] += d.vy[i]; d.vy[i] += 0.07; d.life[i] = life - 0.035;
    c.globalAlpha = life > 1 ? 1 : life;
    c.fillRect(d.x[i], d.y[i], 2.2, 2.2);
    alive++;
  }
  c.globalAlpha = 1;
  d.alive = alive;
  return alive;
}
