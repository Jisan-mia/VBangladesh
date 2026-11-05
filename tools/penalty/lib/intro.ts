// The title's big start art and the three story panels, drawn from the field's own pieces and scaled to fit their box.
import { GX, GY, SPOT_X, SPOT_Y } from "./swipe";
import { drawArms, drawBall, drawFan, drawField, drawKicker, PALETTES, seatCrowd, WALL_Y } from "./scene";
import { US } from "./levels";

export const STORY = [
  "বিকেলের স্কুলমাঠ। বাঁশের গোলপোস্ট, মাছ ধরার জাল।",
  "পাড়ার দলের কিপার জ্বরে কাবু। শট নেবে তুমি, ঠেকাবেও তুমি।",
  "পাড়ার কাপ থেকে জাতীয় কাপ। দেয়ালে বসা সবাই তোমাকে দেখছে।",
] as const;

/** Fits board region (x, y, w, h) into the canvas box: covering it (`cover`), or as wide as the box with the rest above and below. */
function begin(canvas: HTMLCanvasElement, width: number, height: number, x: number, y: number, w: number, h: number, cover = false) {
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  const c = canvas.getContext("2d");
  if (!c) return null;
  const k = (cover ? Math.max(width / w, height / h) : Math.min(width / w, Math.max(height / h, width / w * 0.6))) * ratio;
  c.setTransform(k, 0, 0, k, (width * ratio - w * k) / 2 - x * k, (height * ratio - h * k) / 2 - y * k);
  return c;
}

/** The title's start art: the ball on the chalk spot, the bamboo goal behind, a warm glow. */
export function drawStartArt(canvas: HTMLCanvasElement, width: number, height: number) {
  const c = begin(canvas, width, height, 70, 42, 220, 220, true);
  if (!c) return;
  drawField(c, PALETTES.school, 20, 40);
  const glow = c.createRadialGradient(SPOT_X, 212, 6, SPOT_X, 212, 110);
  glow.addColorStop(0, "#fff3c4ee"); glow.addColorStop(1, "#fff3c400");
  c.fillStyle = glow; c.fillRect(0, 100, 360, 260);
  c.fillStyle = "#f4f1e6"; c.beginPath(); c.ellipse(SPOT_X, 238, 14, 5, 0, 0, Math.PI * 2); c.fill();
  drawBall(c, SPOT_X, 212, 26, 0.6, 0);
}

export function drawStoryPanel(canvas: HTMLCanvasElement, width: number, height: number, index: number) {
  if (index === 0) {
    const c = begin(canvas, width, height, 0, 0, 360, 340);
    if (!c) return;
    drawField(c, PALETTES.school, 400, 300);
    drawBall(c, SPOT_X, SPOT_Y, 10, 0, 0);
    return;
  }
  if (index === 1) {
    const c = begin(canvas, width, height, 40, 120, 280, 260);
    if (!c) return;
    drawField(c, PALETTES.school, 400, 300);
    // The keeper's gloves left on the grass by the goal, and you at the ball.
    c.fillStyle = "#f4f1e6"; c.strokeStyle = "#5b5b55"; c.lineWidth = 1;
    for (const x of [GX - 14, GX + 6]) { c.beginPath(); c.ellipse(x, GY + 14, 7, 5, x < GX ? -0.4 : 0.4, 0, Math.PI * 2); c.fill(); c.stroke(); }
    drawBall(c, SPOT_X, SPOT_Y, 10, 0, 0);
    drawKicker(c, 0.94, 0, 0, US.kit, US.shorts, 0, 1);
    return;
  }
  const c = begin(canvas, width, height, 40, 20, 280, 110);
  if (!c) return;
  const palette = PALETTES.school;
  drawField(c, palette, 400, 300);
  const n = 40, cx = new Float32Array(n), cy = new Float32Array(n), cr = new Float32Array(n), cs = new Uint8Array(n), cp = new Float32Array(n);
  const count = seatCrowd(palette, 60, cx, cy, cr, cs, cp);
  for (let i = 0; i < count; i++) { drawFan(c, cx[i], cy[i], cr[i], palette.shirts[cs[i]], 3, i % 2 === 1); drawArms(c, cx[i], cy[i], cr[i], 3); }
  // More kids squeezed on the wall for the big day.
  for (let x = 60; x < 310; x += 17) { drawFan(c, x, WALL_Y - 8, 3.6, palette.shirts[(x / 17) % palette.shirts.length | 0], 2, x % 2 === 0); drawArms(c, x, WALL_Y - 8, 3.6, 2); }
}
