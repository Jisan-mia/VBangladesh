// The stall's world: three looks (afternoon, river dusk, the night of the চড়ক), the fair behind the awning, and the special
// pots (firecracker, bamboo knot, the মটকা). Original art from plain canvas paths. Drawn once into sprites and layers
// by scene.ts, so nothing here runs per frame. All coordinates are world units unless a function says screen pixels.
import { dot, motif, palette, silhouette } from "./art";
import { CELL, COLS, H, STICK_H, STICK_Y, W, WALL } from "./rules";

const TAU = Math.PI * 2;

export type Look = {
  name: string;
  skyTop: string; skyLow: string; sun: string; sunHalo: string; moon: boolean;
  hill: string; hillFar: string; wheel: string;
  cloth: string; clothStripe: string; awning: string; awningAlt: string; awningDeep: string;
  ground: string; groundDark: string;
  /** The HUD's text over the sky. */
  hud: string;
  lanterns: boolean; river: boolean;
};

export const LOOKS: readonly Look[] = [
  {
    name: "বিকেল", skyTop: "#8fd0ea", skyLow: "#fdebc8", sun: "#f6c945", sunHalo: "rgba(255,240,190,0.7)", moon: false,
    hill: "#8db77f", hillFar: "#b4d3a6", wheel: "#c1352b",
    cloth: "#fbf0d6", clothStripe: "#f4e4c1", awning: "#b4372a", awningAlt: "#f7e6c4", awningDeep: "#7d2117",
    ground: "#d6a66c", groundDark: "#b4844e", hud: "#2b1a10", lanterns: false, river: false,
  },
  {
    name: "গোধূলি", skyTop: "#f2845c", skyLow: "#ffdcaa", sun: "#ffb23e", sunHalo: "rgba(255,200,120,0.6)", moon: false,
    hill: "#5e8a79", hillFar: "#8cb09c", wheel: "#1f7a78",
    cloth: "#f9ead0", clothStripe: "#f1dcb4", awning: "#1f7a78", awningAlt: "#f7e6c4", awningDeep: "#124f4d",
    ground: "#cf9a64", groundDark: "#a87848", hud: "#3a1d10", lanterns: false, river: true,
  },
  {
    name: "রাত", skyTop: "#10163f", skyLow: "#3d4388", sun: "#f4f1d0", sunHalo: "rgba(230,230,255,0.25)", moon: true,
    hill: "#1d2556", hillFar: "#2c3377", wheel: "#f2b84b",
    cloth: "#eed49a", clothStripe: "#e3c583", awning: "#2b3079", awningAlt: "#f2b84b", awningDeep: "#181b4f",
    ground: "#8e6d4a", groundDark: "#6d5036", hud: "#fff6e2", lanterns: true, river: false,
  },
];

export const AWNING_H = 64;

/** Bunting: small triangle flags along a sagging string, from (x0, y) to (x1, y). */
export function drawBunting(c: CanvasRenderingContext2D, x0: number, x1: number, y: number, sag: number, colors: readonly string[]) {
  c.strokeStyle = "rgba(60,30,10,0.6)"; c.lineWidth = 1.2;
  c.beginPath(); c.moveTo(x0, y); c.quadraticCurveTo((x0 + x1) / 2, y + sag * 2, x1, y); c.stroke();
  const flags = Math.max(4, Math.round((x1 - x0) / 22));
  for (let i = 0; i < flags; i++) {
    const t = (i + 0.5) / flags, fx = x0 + (x1 - x0) * t, fy = y + 4 * sag * t * (1 - t);
    c.fillStyle = colors[i % colors.length];
    c.beginPath(); c.moveTo(fx - 6, fy); c.lineTo(fx + 6, fy); c.lineTo(fx, fy + 14); c.closePath(); c.fill();
  }
}

/** A nagordola (ferris wheel) with cabins: the fair behind the stall. */
export function drawWheel(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string, dark: string) {
  c.save();
  c.strokeStyle = dark; c.lineWidth = Math.max(1.5, r * 0.035); c.lineCap = "round";
  c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.stroke();
  c.beginPath(); c.arc(cx, cy, r * 0.6, 0, TAU); c.stroke();
  c.beginPath();
  for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
  c.stroke();
  c.beginPath(); c.moveTo(cx - r * 0.5, cy + r * 1.25); c.lineTo(cx, cy); c.lineTo(cx + r * 0.5, cy + r * 1.25); c.stroke();
  c.fillStyle = color;
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * TAU + 0.2;
    c.beginPath(); c.roundRect(cx + Math.cos(a) * r - r * 0.09, cy + Math.sin(a) * r - r * 0.07, r * 0.18, r * 0.16, r * 0.04); c.fill();
  }
  c.restore();
}

/** A hurricane lantern hanging from the awning, with a warm glow. */
export function drawLantern(c: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const glow = c.createRadialGradient(x, y + size * 0.7, 0, x, y + size * 0.7, size * 3.2);
  glow.addColorStop(0, "rgba(255,214,120,0.55)"); glow.addColorStop(1, "rgba(255,214,120,0)");
  c.fillStyle = glow; c.fillRect(x - size * 3.2, y - size * 2.5, size * 6.4, size * 6.4);
  c.strokeStyle = "#2b1a10"; c.lineWidth = 1.2;
  c.beginPath(); c.moveTo(x, y - size * 0.9); c.lineTo(x, y); c.stroke();
  c.fillStyle = "#ffd36b";
  c.beginPath(); c.roundRect(x - size * 0.45, y, size * 0.9, size * 1.3, size * 0.25); c.fill(); c.stroke();
  c.fillStyle = "#3a2a1a"; c.fillRect(x - size * 0.55, y - size * 0.12, size * 1.1, size * 0.22); c.fillRect(x - size * 0.55, y + size * 1.2, size * 1.1, size * 0.2);
  c.fillStyle = "#fff3c4"; c.beginPath(); c.ellipse(x, y + size * 0.65, size * 0.14, size * 0.3, 0, 0, TAU); c.fill();
}

/** A firecracker pot: a scarlet body, a yellow burst on its belly and a fuse out of the lip. */
export function drawCrackerPot(c: CanvasRenderingContext2D, cx: number, top: number, size: number, design: number) {
  const s = size / 40;
  c.save();
  c.translate(cx, top); c.scale(s, s);
  silhouette(c);
  c.fillStyle = "#cf3a22"; c.fill();
  c.save(); c.clip();
  motif(c, design, "#fff1c4", "#2b1a10", "#f6c945");
  c.fillStyle = "rgba(207,58,34,0.78)"; c.fillRect(-24, 9, 48, 34);
  c.fillStyle = "rgba(255,255,255,0.24)"; c.beginPath(); c.ellipse(-9, 18, 4, 7, 0.35, 0, TAU); c.fill();
  c.fillStyle = "rgba(60,20,0,0.2)"; c.beginPath(); c.ellipse(13, 30, 12, 14, 0, 0, TAU); c.fill();
  // The burst: a yellow star with a dark middle.
  c.translate(0, 25);
  c.fillStyle = "#f6c945"; c.strokeStyle = "#2b1a10"; c.lineWidth = 1.1; c.lineJoin = "round";
  c.beginPath();
  for (let k = 0; k < 16; k++) { const rr = k % 2 ? 4.2 : 9, a = (k / 16) * TAU - Math.PI / 2; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  c.closePath(); c.fill(); c.stroke();
  c.fillStyle = "#2b1a10"; c.beginPath(); dot(c, 0, 0, 2.1); c.fill();
  c.restore();
  silhouette(c);
  c.strokeStyle = palette.ink; c.lineWidth = 1.6; c.lineJoin = "round"; c.stroke();
  c.fillStyle = "#7d2117"; c.beginPath(); c.roundRect(-13, 0, 26, 5.4, 2.4); c.fill(); c.stroke();
  // The fuse and its spark.
  c.strokeStyle = "#2b1a10"; c.lineWidth = 1.6; c.lineCap = "round";
  c.beginPath(); c.moveTo(0, 1); c.quadraticCurveTo(3, -4, 8, -3); c.stroke();
  c.fillStyle = "#ffd23f"; c.beginPath(); dot(c, 8.5, -3.2, 2.2); c.fill();
  c.fillStyle = "#ff7a1a"; c.beginPath(); dot(c, 8.5, -3.2, 1); c.fill();
  c.restore();
}

/** A bamboo knot: a length of bamboo tied to the rope, with the node bands. It never breaks. */
export function drawKnot(c: CanvasRenderingContext2D, cx: number, top: number, width: number, height: number) {
  const left = cx - width / 2, y = top + height * 0.18, h = height * 0.62;
  c.strokeStyle = palette.rope; c.lineWidth = 1.6;
  c.beginPath(); c.moveTo(cx, top - 4); c.lineTo(cx, y + 1); c.stroke();
  const g = c.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, "#cfe3a2"); g.addColorStop(0.5, "#9bbf63"); g.addColorStop(1, "#5f8a35");
  c.fillStyle = g; c.strokeStyle = palette.ink; c.lineWidth = 1.5;
  c.beginPath(); c.roundRect(left, y, width, h, h / 2); c.fill(); c.stroke();
  c.strokeStyle = "#3d5a1f"; c.lineWidth = 1.6;
  c.beginPath();
  for (const at of [0.3, 0.7]) { c.moveTo(left + width * at, y + 1.5); c.lineTo(left + width * at, y + h - 1.5); }
  c.stroke();
  c.fillStyle = "#8c6a3a"; c.fillRect(cx - 3.5, y - 2, 7, 5); c.strokeRect(cx - 3.5, y - 2, 7, 5);
  c.fillStyle = "rgba(255,255,255,0.35)"; c.beginPath(); c.ellipse(cx - width * 0.2, y + h * 0.3, width * 0.16, h * 0.12, 0, 0, TAU); c.fill();
}

/**
 * The মটকা: a big painted jar, `w` × `h`, its rim at `top`. `wear` runs 0 (new) to 1 (about to break): cracks come with it.
 * It wears a painted face with a moustache, because it is রহিম চাচার.
 */
export function drawBossPot(c: CanvasRenderingContext2D, left: number, top: number, w: number, h: number, wear: number) {
  c.save();
  c.translate(left + w / 2, top); c.scale(w / 40, h / 39.6);
  silhouette(c);
  c.fillStyle = "#e6ad3e"; c.fill();
  c.save(); c.clip();
  c.fillStyle = "#b8452c"; c.fillRect(-24, 8, 48, 6.5); c.fillRect(-24, 33, 48, 8);
  c.fillStyle = "#fff4dc"; c.beginPath(); for (let x = -18; x <= 18; x += 4.5) { dot(c, x, 11.2, 0.9); dot(c, x + 2.2, 36.5, 0.9); } c.fill();
  c.fillStyle = "#2f6b3a"; c.fillRect(-24, 15, 48, 1.6); c.fillRect(-24, 31, 48, 1.6);
  // The face.
  c.fillStyle = "#fff4dc"; c.strokeStyle = palette.ink; c.lineWidth = 0.9;
  for (const side of [-1, 1]) { c.beginPath(); c.ellipse(side * 5.6, 21.5, 3, 2.3, 0, 0, TAU); c.fill(); c.stroke(); }
  c.fillStyle = palette.ink;
  for (const side of [-1, 1]) { c.beginPath(); dot(c, side * 5.6, 21.8, 1.1); c.fill(); }
  c.lineWidth = 1.2;
  c.beginPath(); c.moveTo(-3, 22.5); c.lineTo(0, 24.5); c.lineTo(3, 22.5); c.stroke();
  c.fillStyle = palette.ink;
  c.beginPath(); c.moveTo(0, 26.2); c.quadraticCurveTo(-5, 25, -10, 27.5); c.quadraticCurveTo(-5, 29.5, 0, 27.6); c.quadraticCurveTo(5, 29.5, 10, 27.5); c.quadraticCurveTo(5, 25, 0, 26.2); c.fill();
  c.fillStyle = "rgba(255,255,255,0.26)"; c.beginPath(); c.ellipse(-12, 20, 3.4, 8, 0.35, 0, TAU); c.fill();
  c.fillStyle = "rgba(60,20,0,0.18)"; c.beginPath(); c.ellipse(14, 30, 12, 14, 0, 0, TAU); c.fill();
  c.restore();
  silhouette(c);
  c.strokeStyle = palette.ink; c.lineWidth = 1.6; c.lineJoin = "round"; c.stroke();
  c.fillStyle = "#9c4a2a"; c.beginPath(); c.roundRect(-13, -1, 26, 6.4, 2.4); c.fill(); c.stroke();
  // Cracks grow with wear.
  c.lineCap = "round"; c.lineJoin = "miter";
  const cracks = Math.min(3, Math.floor(wear * 3.4));
  const paths = [
    () => { c.moveTo(-4, 6); c.lineTo(-1, 14); c.lineTo(-7, 22); c.lineTo(-2, 30); },
    () => { c.moveTo(8, 8); c.lineTo(6, 16); c.lineTo(12, 22); c.lineTo(9, 31); },
    () => { c.moveTo(-14, 16); c.lineTo(-9, 21); c.lineTo(-13, 27); c.moveTo(1, 31); c.lineTo(4, 37); },
  ];
  for (let k = 0; k < cracks; k++) {
    c.beginPath(); paths[k](); c.strokeStyle = palette.ink; c.lineWidth = 2.4; c.stroke();
    c.beginPath(); paths[k](); c.strokeStyle = "#f6dcb0"; c.lineWidth = 0.8; c.stroke();
  }
  c.restore();
}

/** The earth floor and its pebbles, in world units from y down to `bottom`. */
export function drawGround(c: CanvasRenderingContext2D, look: Look, left: number, right: number, y: number, bottom: number) {
  c.fillStyle = look.ground; c.fillRect(left, y, right - left, bottom - y);
  c.fillStyle = look.groundDark;
  for (let x = Math.floor(left / 54) * 54; x < right; x += 54) {
    c.beginPath(); c.arc(x + ((x * 7) % 31), y + 8 + ((x * 13) % 19), 1.8, 0, TAU); c.fill();
  }
  c.fillStyle = "rgba(60,30,0,0.18)"; c.fillRect(left, y, right - left, 2);
}

/** A bamboo pole from y0 down to y1. */
export function drawPole(c: CanvasRenderingContext2D, x: number, width: number, y0: number, y1: number) {
  const g = c.createLinearGradient(x, 0, x + width, 0);
  g.addColorStop(0, palette.bambooDark); g.addColorStop(0.4, "#efd394"); g.addColorStop(1, palette.bambooDark);
  c.fillStyle = g; c.fillRect(x, y0, width, y1 - y0);
  c.fillStyle = palette.bambooNode;
  for (let y = Math.ceil(y0 / 92) * 92; y < y1; y += 92) c.fillRect(x, y, width, 2.5);
}

/** The stall's awning: stripes ending in scallops whose points reach `ceiling`. */
export function drawAwning(c: CanvasRenderingContext2D, look: Look, left: number, right: number, ceiling: number) {
  const band = ceiling - 12, top = ceiling - AWNING_H;
  for (let x = left, i = 0; x < right; x += 24, i++) {
    c.fillStyle = i % 2 ? look.awningAlt : look.awning;
    c.fillRect(x, top, 24, band - top);
    c.beginPath(); c.arc(x + 12, band, 12, 0, Math.PI); c.fill();
  }
  c.strokeStyle = look.awningDeep; c.lineWidth = 1.5;
  c.beginPath(); for (let x = left; x < right; x += 24) { c.moveTo(x + 24, band); c.arc(x + 12, band, 12, 0, Math.PI); } c.stroke();
  c.fillStyle = look.awningDeep; c.fillRect(left, top, right - left, 5);
}

/** The cloth wall behind the pots, between the poles, from the ceiling to the floor. */
export function drawCloth(c: CanvasRenderingContext2D, look: Look, ceiling: number, floor: number) {
  c.fillStyle = look.cloth; c.fillRect(WALL, ceiling - 12, W - WALL * 2, floor - ceiling + 12);
  c.fillStyle = look.clothStripe;
  for (let x = WALL; x < W - WALL; x += 48) c.fillRect(x + 24, ceiling - 12, 24, floor - ceiling + 12);
}

/** A little chevron on the floor where a falling ball will land: ▼ pointing down at the spot. */
export function drawChevron(c: CanvasRenderingContext2D, x: number, y: number, size: number) {
  c.beginPath(); c.moveTo(x - size, y - size * 0.9); c.lineTo(x, y); c.lineTo(x + size, y - size * 0.9); c.lineTo(x, y - size * 0.35); c.closePath();
}

/** The floor's y (world) and the geometry the layers share. */
export const FLOOR = STICK_Y + STICK_H + 6;
export const POLE_COLS = COLS;
export const CELL_W = CELL;
export const WORLD_H = H;
