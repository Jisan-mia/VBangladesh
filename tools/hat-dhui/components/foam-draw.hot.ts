// Draws the suds onto a transparent canvas, every frame, with no allocation: soft white bubbles with a shine, and pop rings.
import { BUBBLES, RINGS, type Foam } from "../lib/foam";
import { RING_LIFE } from "../lib/foam.hot";

const FILL = "rgba(255,255,255,0.55)", SHINE = "rgba(255,255,255,0.95)", RING = "rgba(255,255,255,0.9)";

export function drawFoam(ctx: CanvasRenderingContext2D, foam: Foam, size: number, edge: string) {
  ctx.clearRect(0, 0, size, size);
  const k = size / 200;
  ctx.lineWidth = 1.6 * k;
  for (let slot = 0; slot < BUBBLES; slot++) {
    if (!foam.alive[slot]) continue;
    const age = foam.age[slot], left = foam.life[slot] - age;
    ctx.globalAlpha = Math.min(1, age * 5, left * 3);
    const x = foam.x[slot] * k, y = foam.y[slot] * k, r = foam.r[slot] * k;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832);
    ctx.fillStyle = FILL; ctx.fill();
    ctx.strokeStyle = edge; ctx.stroke();
    ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.22, 0, 6.2832);
    ctx.fillStyle = SHINE; ctx.fill();
  }
  ctx.strokeStyle = RING;
  for (let slot = 0; slot < RINGS; slot++) {
    const age = foam.rage[slot];
    if (age < 0) continue;
    const grow = age / RING_LIFE;
    ctx.globalAlpha = 1 - grow;
    ctx.beginPath(); ctx.arc(foam.rx[slot] * k, foam.ry[slot] * k, (4 + grow * 9) * k, 0, 6.2832); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
