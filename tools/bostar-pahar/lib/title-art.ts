// The title's start button (a sack on the crane hook with খেলো printed on it) and the three story panels, drawn in code.
import { LOOKS, PAL, SACK_H, WORKERS, drawBank, drawCloud, drawLampPost, drawLaunch, drawLoad, drawSack, drawTruckBack, drawTruckFront, drawWorker, tintOver } from "./art";

/** The title sack's canvas is this tall for its width. */
export const TITLE_ASPECT = 0.92;

function sized(canvas: HTMLCanvasElement, width: number, height: number, ratio: number) {
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  const c = canvas.getContext("2d")!;
  c.setTransform(ratio, 0, 0, ratio, 0, 0);
  c.clearRect(0, 0, width, height);
  return c;
}

/** Rope, hook and a big sack with `label` on it; the canvas itself sways (CSS), hinged at its top. */
export function drawTitleSack(canvas: HTMLCanvasElement, width: number, ratio: number, label: string, kind: number) {
  const height = Math.round(width * TITLE_ASPECT), c = sized(canvas, width, height, ratio);
  const cx = width / 2, sw = width * 0.72, sh = sw * SACK_H * 1.05, sackY = height - sh * 0.72, hookY = sackY - sh * 0.5 - width * 0.12;
  c.strokeStyle = PAL.rope; c.lineWidth = Math.max(2, width * 0.012); c.lineCap = "round";
  c.beginPath(); c.moveTo(cx, 0); c.lineTo(cx, hookY); c.stroke();
  c.lineWidth = Math.max(1.5, width * 0.009);
  c.beginPath(); c.moveTo(cx - sw * 0.34, sackY - sh * 0.42); c.lineTo(cx, hookY); c.lineTo(cx + sw * 0.34, sackY - sh * 0.42); c.stroke();
  c.fillStyle = "rgba(31,42,38,0.18)"; c.beginPath(); c.ellipse(cx, height - sh * 0.08, sw * 0.42, sh * 0.08, 0, 0, Math.PI * 2); c.fill();
  drawSack(c, cx, sackY, sw, sh, kind, label);
  c.fillStyle = PAL.steel; c.fillRect(cx - width * 0.03, hookY - width * 0.04, width * 0.06, width * 0.04);
  c.strokeStyle = PAL.steel; c.lineWidth = Math.max(2, width * 0.014);
  c.beginPath(); c.arc(cx, hookY + width * 0.02, width * 0.025, -Math.PI / 2, Math.PI * 0.9); c.stroke();
}

/** The title's ghat strip under the sack: the river, the truck waiting with its first sacks, two porters. */
export const GROUND_ASPECT = 0.36;
export function drawTitleGround(canvas: HTMLCanvasElement, width: number, ratio: number, world: number) {
  const height = Math.round(width * GROUND_ASPECT), c = sized(canvas, width, height, ratio), u = Math.min(width / 6.5, height / 2.3), look = LOOKS[world];
  const water = height * 0.18, ghat = height * 0.55;
  drawBank(c, width, water - u * 0.15, u * 0.4);
  c.fillStyle = look.water; c.fillRect(0, water, width, ghat - water);
  c.fillStyle = look.waterLight;
  for (let row = 0; row < 3; row++) for (let x = (row * 37) % 60; x < width; x += 70) c.fillRect(x, water + 6 + row * ((ghat - water - 8) / 3), 24, 2);
  c.fillStyle = PAL.ghatLight; c.fillRect(0, ghat, width, 4);
  c.fillStyle = PAL.ghat; c.fillRect(0, ghat + 4, width, height - ghat);
  const floor = height - 0.22 * u - 0.95 * u, cx = width / 2 + 0.2 * u;
  drawTruckBack(c, cx, floor, u);
  drawLoad(c, cx, floor, u);
  drawSack(c, cx - 0.08 * u, floor - 0.5 * u - u * SACK_H * 0.5, u, u * SACK_H, 0);
  drawTruckFront(c, cx, floor, u);
  drawWorker(c, 0.5 * u, height - 0.05 * u, 1.25 * u, WORKERS[1], "point", 0.2, 1);
  if (world === 2) drawLampPost(c, width - 0.5 * u, height - 0.1 * u, 1.4 * u);
  tintOver(c, width, height, look.tint);
}

export const STORY = [
  "বিকেলের সদরঘাট। সন্ধ্যায় লঞ্চ ছাড়বে।",
  "সর্দার: ‘ট্রাকটা ভরে দাও। একটা বস্তাও যেন নদীতে না পড়ে!’",
  "বস্তা দুলছে। নিচের বস্তার ঠিক ওপরে এলেই চাপো।",
] as const;
export const STORY_ASPECT = 2 / 3;

/** One story panel, framed like a printed page. */
export function drawStoryPanel(canvas: HTMLCanvasElement, width: number, ratio: number, index: number) {
  const height = Math.round(width * STORY_ASPECT), c = sized(canvas, width, height, ratio), u = width / 6.5, look = LOOKS[0];
  const sky = c.createLinearGradient(0, 0, 0, height * 0.6);
  sky.addColorStop(0, "#9fd0ea"); sky.addColorStop(1, "#ffdcb4");
  c.fillStyle = sky; c.fillRect(0, 0, width, height);
  const bankY = height * 0.55, ghat = height * 0.82;
  if (index === 0) {
    c.fillStyle = look.sunHalo; c.beginPath(); c.arc(width * 0.72, bankY - u * 0.5, u * 0.7, 0, Math.PI * 2); c.fill();
    c.fillStyle = look.sun; c.beginPath(); c.arc(width * 0.72, bankY - u * 0.5, u * 0.42, 0, Math.PI * 2); c.fill();
    drawCloud(c, width * 0.08, height * 0.25, u * 2.2);
  }
  drawBank(c, width, bankY - u * 0.2, u * 0.55);
  c.fillStyle = look.water; c.fillRect(0, bankY, width, ghat - bankY);
  c.fillStyle = look.waterLight;
  for (let row = 0; row < 4; row++) for (let x = (row * 37) % 60; x < width; x += 70) c.fillRect(x, bankY + 8 + row * 12, 26, 2);
  c.fillStyle = PAL.ghat; c.fillRect(0, ghat, width, height - ghat);
  c.fillStyle = PAL.ghatLight; c.fillRect(0, ghat, width, 4);
  if (index === 0) drawLaunch(c, width * 0.12, ghat - u * 0.1, width * 0.7, "এমভি একটুখানি");
  else {
    const floor = ghat + u * 0.1;
    drawTruckBack(c, width * 0.55, floor - 0.95 * u, u);
    drawLoad(c, width * 0.55, floor - 0.95 * u, u);
    if (index === 2) {
      c.strokeStyle = PAL.rope; c.lineWidth = 2;
      c.beginPath(); c.moveTo(width * 0.45, 0); c.lineTo(width * 0.52, floor - 2.6 * u); c.stroke();
      drawSack(c, width * 0.52, floor - 2.1 * u, u, u * SACK_H, 0);
      c.fillStyle = PAL.crane; c.fillRect(0, 0, width, u * 0.18);
    }
    drawTruckFront(c, width * 0.55, floor - 0.95 * u, u);
    drawWorker(c, width * 0.14, ghat + u * 0.35, u * 1.6, WORKERS[1], index === 1 ? "point" : "count", 0.3, 1);
  }
  tintOver(c, width, height, "");
  c.strokeStyle = PAL.ink; c.lineWidth = 3; c.strokeRect(1.5, 1.5, width - 3, height - 3);
}
