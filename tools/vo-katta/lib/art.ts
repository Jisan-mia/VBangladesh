// Drawings for ভো-কাট্টা in world units (360 × 500): a winter-dusk sky, fog, Old Dhaka rooftops full of people, strings and the tension meter.
// The kites themselves come from ঘুড়ি আর ফানুস (drawKite), so a kite looks the same in both tools.
import { BODY_FONT, DISPLAY_FONT } from "../../../shared/card-canvas";
import { HAND, HI, H, LO, ROOFS, W } from "./game";

type Ctx = CanvasRenderingContext2D;

export const palette = {
  skyTop: "#221c44", skyMid: "#59345f", skyLow: "#c2603e", horizon: "#efa45c",
  sun: "#ffd79a",
  roofFar: "#6a4466", roofMid: "#38203d", roofNear: "#1f1226",
  window: "#ffc867",
  you: "#fff5df", rival: "#b8e0ff", halo: "rgba(18,8,28,0.55)",
  slack: "#6c6788", good: "#3aa565", tight: "#d0473a",
  cream: "#fff1d6", ink: "#241a2e",
} as const;

export const FONT_SMALL = `700 11px ${BODY_FONT}, sans-serif`;
export const FONT_HUD = `700 12px ${BODY_FONT}, sans-serif`;
export const FONT_POP = `800 30px ${DISPLAY_FONT}, sans-serif`;
export const FONT_POP_SMALL = `800 21px ${DISPLAY_FONT}, sans-serif`;

/** The tension meter along the bottom: a label, then three zones sized like the rules (slack, the green band, too tight). */
export const METER = { x: 58, y: 468, w: 280, h: 18 } as const;
export const meterX = (tension: number) => METER.x + tension * METER.w;
/** The wind flag's pole on your roof. */
export const POLE = { x: 238, top: 404, bottom: 448 } as const;

/** Sky gradient, a low winter sun and far-away kites of other rooftops, for any width and height. */
export function paintSky(c: Ctx, width: number, height: number, horizon: number) {
  const sky = c.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, palette.skyTop); sky.addColorStop(0.45, palette.skyMid); sky.addColorStop(0.82, palette.skyLow); sky.addColorStop(1, palette.horizon);
  c.fillStyle = sky; c.fillRect(0, 0, width, height);
  const k = width / W, sx = 84 * k, sy = horizon - 22 * k;
  const glow = c.createRadialGradient(sx, sy, 0, sx, sy, 80 * k);
  glow.addColorStop(0, "rgba(255,215,150,0.55)"); glow.addColorStop(1, "rgba(255,215,150,0)");
  c.fillStyle = glow; c.fillRect(sx - 80 * k, sy - 80 * k, 160 * k, 160 * k);
  c.fillStyle = palette.sun;
  c.beginPath(); c.arc(sx, sy, 20 * k, 0, Math.PI * 2); c.fill();
  // Tiny kites of far roofs, dim and low so nobody mistakes them for a rival.
  c.strokeStyle = "rgba(255,240,220,0.14)"; c.lineWidth = 0.6 * k;
  c.fillStyle = "rgba(40,20,50,0.3)";
  for (const [fx, fy] of [[0.12, 0.74], [0.4, 0.8], [0.66, 0.72], [0.9, 0.79]]) {
    const x = fx * width, y = fy * horizon, r = 3.5 * k;
    c.beginPath(); c.moveTo(x, y + r); c.quadraticCurveTo(x + 10 * k, y + 30 * k, x + 4 * k, y + 60 * k); c.stroke();
    c.beginPath(); c.moveTo(x, y - r); c.lineTo(x + 0.9 * r, y); c.lineTo(x, y + r); c.lineTo(x - 0.9 * r, y); c.closePath(); c.fill();
  }
}

/** A rooftop flyer: legs, a shawl, a head, both arms up to the নাটাই at the hand. */
function person(c: Ctx, x: number, feet: number, hand: { x: number; y: number } | null, scale = 1) {
  c.save();
  c.translate(x, feet); c.scale(scale, scale);
  c.fillRect(-3.4, -9, 2.6, 9); c.fillRect(0.8, -9, 2.6, 9);
  c.beginPath(); c.roundRect(-4.6, -17.5, 9.2, 10, 3); c.fill();
  c.beginPath(); c.arc(0, -20.5, 3.2, 0, Math.PI * 2); c.fill();
  c.restore();
  if (!hand) return;
  c.lineWidth = 2.2 * scale; c.lineCap = "round";
  c.beginPath(); c.moveTo(x - 3 * scale, feet - 16 * scale); c.lineTo(hand.x - 1, hand.y + 1); c.moveTo(x + 3 * scale, feet - 16 * scale); c.lineTo(hand.x + 1, hand.y + 1); c.stroke();
  // The নাটাই: a little wooden spool.
  const fill = c.fillStyle;
  c.fillStyle = "#b07a3c"; c.fillRect(hand.x - 3.5, hand.y - 1.5, 7, 4);
  c.fillStyle = fill;
}

function windows(c: Ctx, x: number, top: number, width: number, rows: number, seed: number) {
  c.fillStyle = palette.window;
  for (let row = 0; row < rows; row++) for (let col = 0; col * 14 + 10 < width; col++) {
    if ((row * 7 + col * 3 + seed) % 4 === 0) continue;
    c.fillRect(x + 6 + col * 14, top + 10 + row * 16, 5, 7);
  }
}

function building(c: Ctx, x: number, top: number, width: number, color: string, lit: number) {
  c.fillStyle = color;
  c.fillRect(x, top, width, H - top);
  c.fillRect(x - 2, top - 3, width + 4, 4);
  windows(c, x, top + 4, width, 4, lit);
  c.fillStyle = color;
}

function tank(c: Ctx, x: number, top: number) {
  c.fillRect(x, top - 16, 18, 11);
  c.fillRect(x + 2, top - 6, 2, 6); c.fillRect(x + 14, top - 6, 2, 6);
}

/** Every rooftop in world units: a far hazy row, the three rival roofs with their flyers, and your roof up front. */
export function paintRoofs(c: Ctx) {
  c.fillStyle = palette.roofFar;
  for (const [x, top, width] of [[0, 360, 40], [34, 348, 50], [80, 364, 46], [120, 342, 40], [156, 356, 58], [206, 338, 42], [242, 354, 50], [286, 344, 38], [318, 358, 42]]) {
    c.fillRect(x, top, width, H - top);
    if (x % 3 === 0) tank(c, x + width * 0.4, top);
  }
  c.fillStyle = palette.roofFar;
  person(c, 140, 342, null, 0.65); person(c, 300, 344, null, 0.6); person(c, 60, 348, null, 0.62);
  // Fog settles over the far roofs.
  const fog = c.createLinearGradient(0, 320, 0, 420);
  fog.addColorStop(0, "rgba(255,232,218,0)"); fog.addColorStop(0.55, "rgba(255,232,218,0.32)"); fog.addColorStop(1, "rgba(255,232,218,0.08)");
  c.fillStyle = fog; c.fillRect(0, 320, W, 100);

  const [r1, r2, r3] = ROOFS;
  building(c, 214, r3.y + 16, 70, palette.roofMid, 1);
  tank(c, 260, r3.y + 16);
  person(c, r3.x - 2, r3.y + 16, r3);
  building(c, -4, r2.y + 16, 104, palette.roofMid, 2);
  person(c, r2.x - 2, r2.y + 16, r2);
  person(c, 84, r2.y + 16, null, 0.85);
  building(c, 252, r1.y + 16, 112, palette.roofMid, 3);
  person(c, r1.x - 2, r1.y + 16, r1);
  person(c, 336, r1.y + 16, null, 0.85);
  c.strokeStyle = palette.roofMid; c.lineWidth = 1;
  for (const [x0, x1, y] of [[256, 362, r1.y + 10], [-2, 100, r2.y + 10]]) {
    c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y);
    for (let x = x0; x <= x1; x += 8) { c.moveTo(x, y); c.lineTo(x, y + 6); }
    c.stroke();
  }

  // Your roof and the dark faces of the nearest houses.
  c.fillStyle = palette.roofNear;
  c.fillRect(0, 458, W, H - 458);
  c.fillRect(92, 448, 166, 12);
  c.fillRect(88, 444, 174, 5);
  person(c, HAND.x - 2, 448, HAND, 1);
  c.fillStyle = palette.roofNear;
  person(c, 118, 448, null, 0.9);
  c.fillRect(POLE.x - 1, POLE.top, 2.4, POLE.bottom - POLE.top);
}

/** The meter's fixed parts, painted once: the label, three zones with their names. */
export function paintMeter(c: Ctx) {
  const { x, y, w, h } = METER;
  c.font = FONT_HUD; c.textBaseline = "middle"; c.textAlign = "left";
  c.fillStyle = palette.cream;
  c.fillText("টান", 22, y + h / 2 + 1);
  const zones: Array<[number, number, string, string]> = [[0, LO, palette.slack, "ঢিল"], [LO, HI, palette.good, "ঠিক টান"], [HI, 1, palette.tight, "বেশি"]];
  for (const [from, to, color, label] of zones) {
    c.fillStyle = color;
    c.beginPath(); c.roundRect(x + from * w + 1, y, (to - from) * w - 2, h, 5); c.fill();
    c.fillStyle = "#fff";
    c.font = FONT_SMALL; c.textAlign = "center";
    c.fillText(label, x + ((from + to) / 2) * w, y + h / 2 + 1);
  }
  c.textAlign = "left"; c.textBaseline = "alphabetic";
}

/** The full static scene for the game canvas. */
export function paintScene(c: Ctx) {
  paintSky(c, W, H, 390);
  paintRoofs(c);
  paintMeter(c);
}

/** A strip of soft fog wisps, W wide, drawn twice side by side so it can drift and wrap. */
export function paintFog(c: Ctx) {
  for (const [x, y, rx, ry, a] of [[40, 30, 70, 14, 0.2], [150, 22, 90, 12, 0.16], [262, 34, 80, 15, 0.2], [330, 18, 60, 10, 0.12]]) {
    const g = c.createRadialGradient(x, y, 0, x, y, rx);
    g.addColorStop(0, `rgba(255,236,224,${a})`); g.addColorStop(1, "rgba(255,236,224,0)");
    c.fillStyle = g;
    c.save(); c.translate(x, y); c.scale(1, ry / rx); c.translate(-x, -y);
    c.beginPath(); c.arc(x, y, rx, 0, Math.PI * 2); c.fill();
    c.restore();
  }
}

/** A string stroked twice: a dark halo under a light line, so it reads on both the dark and the orange sky. */
export function strokeString(c: Ctx, color: string, width: number) {
  c.strokeStyle = palette.halo; c.lineWidth = width + 2.2; c.stroke();
  c.strokeStyle = color; c.lineWidth = width; c.stroke();
}
