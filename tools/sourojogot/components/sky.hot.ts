// Per-frame code for the sky canvas: the rocket's flight along its curve, the puff trail, and the drawing of both.
// Allocation-free: everything lives in the preallocated Sky (lib/flight.ts); constants are module-level.
import { PUFFS, PUFF_EVERY, PUFF_LIFE, type Sky } from "../lib/flight";

const BODY = "#f4f1ea", EDGE = "#2c3768", GLASS = "#7cc6ff", FIN = "#e5533d", FLAME = "#ffb238", FLAME_CORE = "#fff3b0", PUFF = "#ffe9b8";

/** Ease in and out, so the rocket leaves gently, swoops, and settles. */
function ease(t: number) {
  if (t < 0.5) return 4 * t * t * t;
  const u = -2 * t + 2;
  return 1 - u * u * u / 2;
}

function emit(sky: Sky) {
  const slot = sky.puffNext;
  sky.puffNext = (slot + 1) % PUFFS;
  // xorshift32 for a little sideways jitter
  let r = sky.rng;
  r ^= r << 13; r ^= r >>> 17; r ^= r << 5;
  sky.rng = r >>> 0;
  const jitter = ((r >>> 0) % 1000) / 1000 - 0.5;
  // behind the rocket: the opposite of its heading, from the engine
  sky.puffX[slot] = sky.x - Math.sin(sky.heading) * 15 + jitter * 6;
  sky.puffY[slot] = sky.y + Math.cos(sky.heading) * 15 + jitter * 3;
  sky.puffAge[slot] = 0;
  sky.puffSize[slot] = 3.4 + (((r >>> 8) % 100) / 100) * 2.4;
}

/** Moves everything on by `dt` ms. Returns true while the rocket or a puff is still moving. */
export function stepSky(sky: Sky, dt: number): boolean {
  if (sky.flying) {
    sky.t += dt / sky.dur;
    if (sky.t >= 1) { sky.t = 1; sky.flying = false; }
    const e = ease(sky.t), u = 1 - e;
    sky.x = u * u * sky.fx + 2 * u * e * sky.cx + e * e * sky.tx;
    sky.y = u * u * sky.fy + 2 * u * e * sky.cy + e * e * sky.ty;
    // heading follows the curve's direction (not the speed), and the last bit of the flight keeps it
    const dx = 2 * u * (sky.cx - sky.fx) + 2 * e * (sky.tx - sky.cx), dy = 2 * u * (sky.cy - sky.fy) + 2 * e * (sky.ty - sky.cy);
    if (dx * dx + dy * dy > 0.01) sky.heading = Math.atan2(dx, -dy);
    sky.since += dt;
    while (sky.since >= PUFF_EVERY) { sky.since -= PUFF_EVERY; emit(sky); }
  }
  let live = false;
  const fade = dt / PUFF_LIFE;
  for (let slot = 0; slot < PUFFS; slot++) {
    if (sky.puffAge[slot] >= 1) continue;
    sky.puffAge[slot] += fade;
    if (sky.puffAge[slot] < 1) live = true;
  }
  return sky.flying || live;
}

/** Draws the trail and the rocket. `k` = canvas pixels per board unit; the board is `w` × `h` units. */
export function drawSky(ctx: CanvasRenderingContext2D, sky: Sky, k: number, w: number, h: number) {
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = PUFF;
  for (let slot = 0; slot < PUFFS; slot++) {
    const age = sky.puffAge[slot];
    if (age >= 1) continue;
    ctx.globalAlpha = (1 - age) * 0.7;
    ctx.beginPath();
    ctx.arc(sky.puffX[slot], sky.puffY[slot], sky.puffSize[slot] * (1 - age * 0.5), 0, 6.2832);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.save();
  ctx.translate(sky.x, sky.y);
  ctx.rotate(sky.heading);
  // flame: long and flickering while flying, a small pilot light when parked
  const flame = sky.flying ? 15 + Math.sin(sky.t * 160) * 3 : 5;
  ctx.fillStyle = FLAME;
  ctx.beginPath(); ctx.moveTo(-5, 12); ctx.quadraticCurveTo(0, 12 + flame * 1.5, 5, 12); ctx.closePath(); ctx.fill();
  ctx.fillStyle = FLAME_CORE;
  ctx.beginPath(); ctx.moveTo(-2.6, 12); ctx.quadraticCurveTo(0, 12 + flame, 2.6, 12); ctx.closePath(); ctx.fill();
  // fins
  ctx.fillStyle = FIN; ctx.strokeStyle = EDGE; ctx.lineWidth = 1.4; ctx.lineJoin = "round";
  ctx.beginPath(); ctx.moveTo(-6, 2); ctx.lineTo(-13, 14); ctx.lineTo(-5, 12); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(6, 2); ctx.lineTo(13, 14); ctx.lineTo(5, 12); ctx.closePath(); ctx.fill(); ctx.stroke();
  // body
  ctx.fillStyle = BODY;
  ctx.beginPath(); ctx.moveTo(0, -17); ctx.bezierCurveTo(9, -9, 8, 6, 6, 13); ctx.lineTo(-6, 13); ctx.bezierCurveTo(-8, 6, -9, -9, 0, -17); ctx.closePath(); ctx.fill(); ctx.stroke();
  // nose cap and window
  ctx.fillStyle = FIN;
  ctx.beginPath(); ctx.moveTo(0, -17); ctx.bezierCurveTo(4, -13, 5.4, -10.5, 5.8, -9); ctx.lineTo(-5.8, -9); ctx.bezierCurveTo(-5.4, -10.5, -4, -13, 0, -17); ctx.closePath(); ctx.fill();
  ctx.fillStyle = GLASS;
  ctx.beginPath(); ctx.arc(0, -2, 4, 0, 6.2832); ctx.fill(); ctx.stroke();
  ctx.restore();
}
