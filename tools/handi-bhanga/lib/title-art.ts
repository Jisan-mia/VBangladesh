// The first screen's art and the three story panels, drawn in code at the size they are shown.
import { DISPLAY_FONT } from "../../../shared/card-canvas";
import { drawBall, drawPot, drawStick, palette } from "./art";
import { LOOKS, drawBunting, drawCrackerPot, drawBossPot } from "./stall-art";

/** Height over width of the hanging title pot and of a story panel. */
export const TITLE_ASPECT = 1.1;
export const STORY_ASPECT = 0.74;

const prepare = (canvas: HTMLCanvasElement, width: number, height: number, ratio: number) => {
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  const c = canvas.getContext("2d")!;
  c.setTransform(ratio, 0, 0, ratio, 0, 0);
  return c;
};

/**
 * The start button's face: a painted pot hanging from a rope with `label` on its belly. `kind` picks the pot (0 the lotus
 * pot of the first stalls, 1 the firecracker pot, 2 the মটকা of a finale).
 */
export function drawTitlePot(canvas: HTMLCanvasElement, width: number, ratio: number, label: string, kind: number) {
  const height = width * TITLE_ASPECT, c = prepare(canvas, width, height, ratio);
  c.clearRect(0, 0, width, height);
  const cx = width / 2, top = height * 0.17;
  c.strokeStyle = palette.rope; c.lineWidth = Math.max(2.5, width * 0.016); c.lineCap = "round";
  c.beginPath(); c.moveTo(cx, 0); c.lineTo(cx, top + 4); c.stroke();
  c.fillStyle = palette.rope; c.beginPath(); c.arc(cx, top * 0.55, width * 0.025, 0, Math.PI * 2); c.fill();
  c.save();
  c.shadowColor = "rgba(43,26,16,0.28)"; c.shadowBlur = width * 0.04; c.shadowOffsetY = width * 0.025;
  if (kind === 2) drawBossPot(c, width * 0.06, top, width * 0.88, height * 0.78, 0);
  else if (kind === 1) drawCrackerPot(c, cx, top, width * 0.9, 4);
  else drawPot(c, cx, top, width * 0.9, 1, false, false);
  c.restore();
  // The label, on a cream plaque across the belly.
  const plaqueW = width * (kind === 2 ? 0.5 : 0.52), plaqueH = width * 0.22, py = top + height * (kind === 2 ? 0.62 : 0.43);
  c.fillStyle = "#fff6e2"; c.strokeStyle = palette.ink; c.lineWidth = Math.max(2, width * 0.012);
  c.beginPath(); c.roundRect(cx - plaqueW / 2, py - plaqueH / 2, plaqueW, plaqueH, plaqueH / 2); c.fill(); c.stroke();
  c.fillStyle = palette.awning; c.textAlign = "center"; c.textBaseline = "middle";
  c.font = `800 ${Math.round(plaqueH * 0.62)}px ${DISPLAY_FONT}`;
  c.fillText(label, cx, py + plaqueH * 0.04, plaqueW * 0.9);
}

/** A strip of the world behind the title card: bunting over a row of pots, in the look of stall `world`. */
export function drawTitleStrip(canvas: HTMLCanvasElement, width: number, ratio: number, world: number) {
  const look = LOOKS[world], height = Math.round(width * 0.3), c = prepare(canvas, width, height, ratio);
  c.clearRect(0, 0, width, height);
  const gradient = c.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "rgba(0,0,0,0)"); gradient.addColorStop(1, look.hill);
  c.fillStyle = gradient; c.fillRect(0, 0, width, height);
  c.fillStyle = look.ground; c.fillRect(0, height * 0.78, width, height);
  drawBunting(c, 0, width, 6, 7, world === 2 ? ["#f2b84b", "#e6559b", "#6fd0c4"] : world === 1 ? ["#fff1c4", "#f2845c", "#1f7a78"] : ["#f6c945", "#2f6b3a", "#fff1c4"]);
}


/** Story panel `at` (0–2), drawn at `width` pixels wide. */
export function drawStoryPanel(canvas: HTMLCanvasElement, width: number, ratio: number, at: number) {
  const height = Math.round(width * STORY_ASPECT), c = prepare(canvas, width, height, ratio);
  const look = LOOKS[0];
  const sky = c.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, look.skyTop); sky.addColorStop(1, look.skyLow);
  c.fillStyle = sky; c.fillRect(0, 0, width, height);
  c.fillStyle = look.ground; c.fillRect(0, height * 0.84, width, height);
  c.fillStyle = look.groundDark; c.fillRect(0, height * 0.84, width, 3);
  const u = width / 360;
  if (at === 0) {
    // Rahim chacha's stall at the fair: the awning, a rope of painted pots, the old man in his cap.
    c.fillStyle = look.cloth; c.fillRect(width * 0.1, height * 0.2, width * 0.8, height * 0.64);
    const band = height * 0.14;
    for (let x = width * 0.08, i = 0; x < width * 0.92; x += 24 * u, i++) { c.fillStyle = i % 2 ? look.awningAlt : look.awning; c.fillRect(x, height * 0.06, 24 * u, band); c.beginPath(); c.arc(x + 12 * u, height * 0.06 + band, 12 * u, 0, Math.PI); c.fill(); }
    c.strokeStyle = palette.rope; c.lineWidth = 2 * u;
    const ry = height * 0.4;
    c.beginPath(); c.moveTo(width * 0.1, ry); c.quadraticCurveTo(width * 0.5, ry + 8 * u, width * 0.9, ry); c.stroke();
    for (let k = 0; k < 5; k++) { const x = width * (0.2 + k * 0.15); c.beginPath(); c.moveTo(x, ry + 3 * u); c.lineTo(x, ry + 14 * u); c.stroke(); drawPot(c, x, ry + 12 * u, 38 * u, (k * 2 + 1) % 6, false, false); }
    for (const x of [width * 0.05, width * 0.9]) { c.fillStyle = palette.bamboo; c.fillRect(x, height * 0.06, 12 * u, height * 0.8); }
    // Rahim chacha.
    const mx = width * 0.78, my = height * 0.74;
    c.fillStyle = "#fff6e2"; c.beginPath(); c.roundRect(mx - 22 * u, my, 44 * u, height * 0.12, 8 * u); c.fill();
    c.fillStyle = "#b9805a"; c.beginPath(); c.arc(mx, my - 6 * u, 17 * u, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#fff6e2"; c.beginPath(); c.ellipse(mx, my - 20 * u, 17 * u, 8 * u, 0, Math.PI, 0); c.fill();
    c.fillStyle = palette.ink; c.beginPath(); c.arc(mx - 6 * u, my - 9 * u, 1.8 * u, 0, Math.PI * 2); c.arc(mx + 6 * u, my - 9 * u, 1.8 * u, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.moveTo(mx, my - 3 * u); c.quadraticCurveTo(mx - 8 * u, my - 6 * u, mx - 13 * u, my - 2 * u); c.quadraticCurveTo(mx - 6 * u, my - 1 * u, mx, my - 1 * u); c.quadraticCurveTo(mx + 6 * u, my - 1 * u, mx + 13 * u, my - 2 * u); c.quadraticCurveTo(mx + 8 * u, my - 6 * u, mx, my - 3 * u); c.fill();
  } else if (at === 1) {
    // A taka coin and three balls.
    const cx = width * 0.5, cy = height * 0.4;
    c.fillStyle = "#f0c14b"; c.strokeStyle = palette.ink; c.lineWidth = 3 * u;
    c.beginPath(); c.arc(cx, cy, 52 * u, 0, Math.PI * 2); c.fill(); c.stroke();
    c.strokeStyle = "#b8862b"; c.lineWidth = 2 * u; c.beginPath(); c.arc(cx, cy, 42 * u, 0, Math.PI * 2); c.stroke();
    c.fillStyle = palette.ink; c.textAlign = "center"; c.textBaseline = "middle"; c.font = `800 ${Math.round(46 * u)}px ${DISPLAY_FONT}`;
    c.fillText("৳", cx, cy + 2 * u);
    for (let k = 0; k < 3; k++) drawBall(c, width * (0.3 + k * 0.2), height * 0.74, 17 * u);
  } else {
    // The throw: a dotted path from the লাঠি up to a pot.
    c.fillStyle = look.cloth; c.fillRect(width * 0.1, height * 0.1, width * 0.8, height * 0.74);
    const px = width * 0.62, py = height * 0.18;
    c.strokeStyle = palette.rope; c.lineWidth = 2 * u; c.beginPath(); c.moveTo(width * 0.1, py - 4 * u); c.lineTo(width * 0.9, py - 4 * u); c.moveTo(px, py - 4 * u); c.lineTo(px, py + 8 * u); c.stroke();
    drawPot(c, px, py + 6 * u, 40 * u, 3, false, false);
    c.fillStyle = palette.ink;
    for (let k = 1; k <= 7; k++) { const t = k / 8; c.globalAlpha = 0.75; c.beginPath(); c.arc(width * (0.36 + 0.26 * t), height * (0.72 - 0.46 * t), 3.2 * u, 0, Math.PI * 2); c.fill(); }
    c.globalAlpha = 1;
    drawBall(c, width * 0.36, height * 0.72 - 6 * u, 11 * u);
    drawStick(c, width * 0.36, height * 0.74 + 4 * u, 86 * u, 13 * u);
    for (const x of [width * 0.05, width * 0.9]) { c.fillStyle = palette.bamboo; c.fillRect(x, height * 0.1, 12 * u, height * 0.76); }
  }
  c.strokeStyle = palette.ink; c.lineWidth = 3; c.strokeRect(1.5, 1.5, width - 3, height - 3);
}
