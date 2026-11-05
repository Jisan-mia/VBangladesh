// The three পাড়া, drawn in code in board units (360 wide; the court's ground at y 356; extra sky above y 0 when the stage is
// tall). Static parts are painted once per size into an offscreen canvas; draw.hot.ts adds the moving parts each frame.
// IP: no racket or shuttle brand, no real player, club or broadcast look: a made-up গলি, a rooftop and a market lane.
import { BACK_L, BACK_R, GROUND, H, NET_BOTTOM, NET_TOP, NET_X, W } from "./physics";

export type Palette = {
  skyTop: string; skyLow: string; wallL: string; wallR: string; trim: string; lit: string; litDeep: string; dark: string;
  ground: string; groundFar: string; chalk: string; glow: string; net: string; rope: string;
};
export const PALETTES: readonly Palette[] = [
  { skyTop: "#0b1128", skyLow: "#1d2647", wallL: "#3b3446", wallR: "#433a3a", trim: "#2a2433", lit: "#ffcf73", litDeep: "#e59a3c", dark: "#1a1826",
    ground: "#4b4542", groundFar: "#3d3836", chalk: "#e9e2cf", glow: "#ffd98a", net: "#e9e4d6", rope: "#d8cfb8" },
  { skyTop: "#2b2552", skyLow: "#e38a5e", wallL: "#5d4f6b", wallR: "#6a5560", trim: "#3a3048", lit: "#ffd78a", litDeep: "#f0a35a", dark: "#2b2338",
    ground: "#8a7f86", groundFar: "#76696f", chalk: "#f6efe0", glow: "#ffc28a", net: "#f3ede1", rope: "#e8dcc4" },
  { skyTop: "#1a1d24", skyLow: "#3b3f48", wallL: "#4a4442", wallR: "#514846", trim: "#2e2a2a", lit: "#ffb347", litDeep: "#d9822b", dark: "#221f1f",
    ground: "#4f4a46", groundFar: "#423d3a", chalk: "#e6dcc6", glow: "#ffb35c", net: "#e6dfd1", rope: "#cfc3aa" },
];

/** Where the light hangs (the bulb in the গলি, the lamp on the rooftop pole, the market's sodium lamp). */
export const LIGHT = [{ x: 196, y: 64 }, { x: 300, y: 92 }, { x: 150, y: 70 }] as const;
/** The window where a neighbour sighs "আহা" on a lost point. */
export const SIGH_WINDOW = { x: 24, y: 150, w: 40, h: 50 } as const;
/** The washing line on the rooftop: two ends, and three cloths hanging from it. */
export const LINE = { x0: 18, y0: 132, x1: 150, y1: 140 } as const;
/** The rooftop's flag pole (it shows the wind). */
export const FLAG = { x: 340, y: 40 } as const;

const ME = "#e07a2e";
export const YOU = { shirt: ME, cap: "#2f5c8a" } as const;

/** Layout of the court in a canvas of `width` × `height` CSS px: board scale, left offset and the board units of sky above y 0. */
export function layoutFor(width: number, height: number) {
  const scale = Math.min(width / W, height / (H - 20)), shownW = W * scale;
  return { scale, ox: (width - shownW) / 2, top: Math.max(0, height / scale - H) };
}
export type Layout = ReturnType<typeof layoutFor>;

function windowBox(c: CanvasRenderingContext2D, p: Palette, x: number, y: number, w: number, h: number, lit: boolean) {
  c.fillStyle = p.trim; c.fillRect(x - 3, y - 3, w + 6, h + 6);
  c.fillStyle = lit ? p.lit : p.dark; c.fillRect(x, y, w, h);
  if (lit) { c.fillStyle = p.litDeep; c.fillRect(x, y + h * 0.62, w, h * 0.38); }
  c.strokeStyle = p.trim; c.lineWidth = 1.6;
  c.beginPath();
  for (let gx = x + w / 4; gx < x + w - 1; gx += w / 4) { c.moveTo(gx, y); c.lineTo(gx, y + h); }
  c.moveTo(x, y + h / 2); c.lineTo(x + w, y + h / 2);
  c.stroke();
  c.fillStyle = p.trim; c.fillRect(x - 5, y + h + 2, w + 10, 4);
}

function stars(c: CanvasRenderingContext2D, top: number, seed: number) {
  let s = seed;
  c.fillStyle = "#ffffff";
  for (let i = 0; i < 40; i++) {
    s = (s * 9301 + 49297) % 233280;
    const x = (s / 233280) * W;
    s = (s * 9301 + 49297) % 233280;
    const y = -top + (s / 233280) * (top + 90);
    c.globalAlpha = 0.25 + (i % 4) * 0.12;
    c.fillRect(x, y, 1.2, 1.2);
  }
  c.globalAlpha = 1;
}

/** The net: posts or ropes from each side down to a narrow mesh in the middle, with a white tape on top. */
function drawNet(c: CanvasRenderingContext2D, p: Palette, ties: readonly [number, number, number, number]) {
  c.strokeStyle = p.rope; c.lineWidth = 1.4;
  c.beginPath(); c.moveTo(ties[0], ties[1]); c.quadraticCurveTo((ties[0] + NET_X) / 2, NET_TOP - 14, NET_X, NET_TOP); c.stroke();
  c.beginPath(); c.moveTo(ties[2], ties[3]); c.quadraticCurveTo((ties[2] + NET_X) / 2, NET_TOP - 12, NET_X, NET_TOP); c.stroke();
  const left = NET_X - 5, width = 10;
  c.fillStyle = "#ffffff12"; c.fillRect(left, NET_TOP, width, NET_BOTTOM - NET_TOP);
  c.strokeStyle = p.net; c.globalAlpha = 0.5; c.lineWidth = 0.8;
  c.beginPath();
  for (let y = NET_TOP + 6; y < NET_BOTTOM; y += 6) { c.moveTo(left, y); c.lineTo(left + width, y); }
  for (let x = left; x <= left + width + 0.1; x += 5) { c.moveTo(x, NET_TOP); c.lineTo(x, NET_BOTTOM); }
  c.stroke();
  c.globalAlpha = 1;
  c.fillStyle = "#f7f3ea"; c.fillRect(left - 1, NET_TOP - 2, width + 2, 4);
  // A thin pole holds the middle up from the ground.
  c.fillStyle = "#2a2430"; c.fillRect(NET_X - 1, NET_BOTTOM, 2, GROUND - NET_BOTTOM);
}

/** The court's floor with the chalk back lines and the middle line. */
function drawFloor(c: CanvasRenderingContext2D, p: Palette) {
  const ground = c.createLinearGradient(0, GROUND - 8, 0, H);
  ground.addColorStop(0, p.groundFar); ground.addColorStop(1, p.ground);
  c.fillStyle = ground; c.fillRect(0, GROUND - 6, W, H - GROUND + 6);
  c.fillStyle = "#00000033"; c.fillRect(0, GROUND - 6, W, 3);
  c.strokeStyle = p.chalk; c.lineWidth = 2.2; c.globalAlpha = 0.85;
  c.beginPath();
  c.moveTo(BACK_L, GROUND - 1); c.lineTo(BACK_L - 8, H - 4);
  c.moveTo(BACK_R, GROUND - 1); c.lineTo(BACK_R + 8, H - 4);
  c.moveTo(NET_X, GROUND - 1); c.lineTo(NET_X, H - 4);
  c.moveTo(BACK_L, GROUND + 1); c.lineTo(BACK_R, GROUND + 1);
  c.stroke();
  c.globalAlpha = 1;
}

function glow(c: CanvasRenderingContext2D, p: Palette, x: number, y: number, radius: number) {
  const g = c.createRadialGradient(x, y, 2, x, y, radius);
  g.addColorStop(0, `${p.glow}cc`); g.addColorStop(0.25, `${p.glow}55`); g.addColorStop(1, `${p.glow}00`);
  c.fillStyle = g; c.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  const pool = c.createRadialGradient(x, GROUND + 14, 4, x, GROUND + 14, 160);
  pool.addColorStop(0, `${p.glow}40`); pool.addColorStop(1, `${p.glow}00`);
  c.fillStyle = pool; c.fillRect(0, GROUND - 12, W, H - GROUND + 12);
}

function bulb(c: CanvasRenderingContext2D, x: number, y: number, color: string) {
  c.fillStyle = "#3b3330"; c.fillRect(x - 3, y - 9, 6, 5);
  c.fillStyle = color; c.beginPath(); c.ellipse(x, y, 5, 6.5, 0, 0, Math.PI * 2); c.fill();
}

/** আমাদের গলি: two old buildings, a bare bulb on a wire, the net tied between two windows. */
function paintLane(c: CanvasRenderingContext2D, p: Palette, top: number) {
  stars(c, top, 7);
  c.fillStyle = "#262a40"; c.fillRect(140, 70, 100, GROUND - 70);
  c.fillStyle = "#30354f";
  for (let y = 92; y < 300; y += 34) for (let x = 152; x < 232; x += 26) c.fillRect(x, y, 12, 16);
  c.fillStyle = p.wallL; c.fillRect(0, 30 - top, 146, GROUND - 30 + top);
  c.fillStyle = p.trim; c.fillRect(0, 26, 150, 8); c.fillRect(0, 238, 146, 5);
  for (let y = -40; y > -top; y -= 70) { windowBox(c, p, 24, y, 40, 44, (y / 70) % 2 === 0); windowBox(c, p, 96, y + 6, 34, 40, false); }
  windowBox(c, p, SIGH_WINDOW.x, SIGH_WINDOW.y, SIGH_WINDOW.w, SIGH_WINDOW.h, true);
  windowBox(c, p, 96, 112, 34, 46, false);
  windowBox(c, p, 24, 52, 40, 44, false);
  windowBox(c, p, 96, 48, 34, 40, true);
  c.fillStyle = "#57505c"; c.fillRect(14, 270, 92, GROUND - 270);
  c.strokeStyle = "#433d49"; c.lineWidth = 1.2; c.beginPath();
  for (let y = 276; y < GROUND; y += 6) { c.moveTo(14, y); c.lineTo(106, y); }
  c.stroke();
  c.fillStyle = p.wallR; c.fillRect(226, 40 - top, W - 226, GROUND - 40 + top);
  c.fillStyle = p.trim; c.fillRect(222, 36, W - 222, 8); c.fillRect(226, 244, W - 226, 5);
  for (let y = -30; y > -top; y -= 70) { windowBox(c, p, 244, y, 36, 40, false); windowBox(c, p, 302, y + 4, 40, 40, (y / 70) % 2 !== 0); }
  windowBox(c, p, 244, 118, 36, 48, true);
  windowBox(c, p, 302, 118, 40, 48, false);
  windowBox(c, p, 302, 56, 40, 40, true);
  windowBox(c, p, 244, 60, 36, 36, false);
  c.fillStyle = "#3a3236"; c.fillRect(300, 272, 44, GROUND - 272);
  c.fillStyle = "#c9a35a"; c.beginPath(); c.arc(336, 316, 2, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#2c2836"; c.fillRect(140, 30 - top, 5, GROUND - 30 + top);
  c.strokeStyle = "#151320"; c.lineWidth = 1.5;
  const L = LIGHT[0];
  c.beginPath(); c.moveTo(0, 20); c.quadraticCurveTo(180, 46, W, 24); c.stroke();
  c.beginPath(); c.moveTo(L.x, 33); c.lineTo(L.x, L.y - 6); c.stroke();
  drawFloor(c, p);
  glow(c, p, L.x, L.y, 130);
  drawNet(c, p, [128, 132, 236, 140]);
  bulb(c, L.x, L.y, "#fff4cf");
}

/** ছাদের কোর্ট: a parapet, two water tanks, an antenna with a flag, the city at dusk behind. */
function paintRoof(c: CanvasRenderingContext2D, p: Palette, top: number) {
  const sun = c.createRadialGradient(250, 250, 10, 250, 250, 220);
  sun.addColorStop(0, "#ffd29a88"); sun.addColorStop(1, "#ffd29a00");
  c.fillStyle = sun; c.fillRect(0, -top, W, GROUND + top);
  // The city: a row of roofs, a few windows lit.
  c.fillStyle = "#3b3256";
  const heights = [210, 180, 232, 196, 170, 220, 188, 240, 205];
  for (let i = 0; i < heights.length; i++) c.fillRect(i * 42 - 6, heights[i], 44, GROUND - heights[i]);
  c.fillStyle = "#ffd78a";
  for (let i = 0; i < heights.length; i++) for (let y = heights[i] + 10; y < 290; y += 22) if ((i * 7 + y) % 3 === 0) c.fillRect(i * 42 + 6, y, 6, 8);
  // A kite far off, and its string.
  c.strokeStyle = "#f3ede166"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(58, 72); c.quadraticCurveTo(20, 160, 6, 260); c.stroke();
  c.fillStyle = "#d94f3d"; c.beginPath(); c.moveTo(58, 60); c.lineTo(68, 72); c.lineTo(58, 84); c.lineTo(48, 72); c.closePath(); c.fill();
  // The parapet, our floor's edge.
  c.fillStyle = p.wallL; c.fillRect(0, 300, W, 56);
  c.fillStyle = p.trim; c.fillRect(0, 296, W, 6);
  c.fillStyle = "#00000022"; for (let x = 0; x < W; x += 24) c.fillRect(x, 302, 1, 54);
  // Two water tanks on stands, left and right, and the antenna pole with its lamp.
  const tank = (x: number) => {
    c.fillStyle = "#2a2a30"; c.fillRect(x - 4, 250, 4, 50); c.fillRect(x + 40, 250, 4, 50);
    c.fillStyle = "#1f1f24"; c.beginPath(); c.roundRect(x - 8, 206, 56, 48, 10); c.fill();
    c.fillStyle = "#34343c"; c.fillRect(x - 8, 220, 56, 3); c.fillRect(x - 8, 236, 56, 3);
    c.fillStyle = "#1f1f24"; c.fillRect(x + 14, 198, 12, 9);
  };
  tank(8); tank(304);
  c.fillStyle = "#2a2430"; c.fillRect(FLAG.x - 1.5, FLAG.y, 3, 300 - FLAG.y);
  c.strokeStyle = "#2a2430"; c.lineWidth = 1.4;
  c.beginPath(); c.moveTo(FLAG.x - 16, FLAG.y + 24); c.lineTo(FLAG.x + 6, FLAG.y + 24); c.moveTo(FLAG.x - 12, FLAG.y + 34); c.lineTo(FLAG.x + 4, FLAG.y + 34); c.stroke();
  c.strokeStyle = "#8c8478"; c.lineWidth = 1;
  c.beginPath(); c.moveTo(LINE.x0, LINE.y0); c.quadraticCurveTo((LINE.x0 + LINE.x1) / 2, LINE.y1 + 10, LINE.x1, LINE.y1); c.stroke();
  c.fillStyle = "#2a2430"; c.fillRect(LINE.x1, LINE.y1 - 2, 3, 300 - LINE.y1);
  drawFloor(c, p);
  const L = LIGHT[1];
  c.fillStyle = "#2a2430"; c.fillRect(L.x - 14, L.y - 4, 16, 2);
  glow(c, p, L.x, L.y, 120);
  drawNet(c, p, [LINE.x1 + 1, 240, 252, 230]);
  c.fillStyle = "#2a2430"; c.fillRect(250, 228, 3, 72);
  bulb(c, L.x, L.y, "#fff1d6");
}

/** বাজারের গলি: shut shop shutters, a tea stall with a kettle and a bench, a sodium lamp on a pole, fog. */
function paintMarket(c: CanvasRenderingContext2D, p: Palette, top: number) {
  c.fillStyle = "#2a2d35"; c.fillRect(0, 60 - top, W, GROUND - 60 + top);
  c.fillStyle = "#33363f";
  for (let x = 0; x < W; x += 60) c.fillRect(x + 4, 60 - top, 52, GROUND - 60 + top);
  c.fillStyle = "#3d4049"; for (let x = 0; x < W; x += 60) for (let y = 80 - top; y < 180; y += 40) c.fillRect(x + 14, y, 14, 18);
  c.fillStyle = "#ffb34744"; c.fillRect(74, 100, 14, 18); c.fillRect(254, 140, 14, 18);
  // Shutters along the ground floor, a sign board above each.
  for (let x = 0; x < W; x += 72) {
    c.fillStyle = p.wallL; c.fillRect(x + 4, 214, 64, GROUND - 214);
    c.fillStyle = "#5c5652"; c.fillRect(x + 8, 236, 56, GROUND - 236);
    c.strokeStyle = "#4a4541"; c.lineWidth = 1; c.beginPath();
    for (let y = 240; y < GROUND; y += 5) { c.moveTo(x + 8, y); c.lineTo(x + 64, y); }
    c.stroke();
    c.fillStyle = ["#7a3b2e", "#2e5a7a", "#6b7a2e", "#7a2e5e", "#2e7a6a"][(x / 72) % 5]; c.fillRect(x + 6, 216, 60, 16);
  }
  // The tea stall on the left: a bench, a kettle on the stove, a glow.
  c.fillStyle = "#6b4a2e"; c.fillRect(4, 312, 70, 6); c.fillRect(8, 318, 4, 36); c.fillRect(66, 318, 4, 36);
  c.fillStyle = "#8a5a32"; c.fillRect(10, 290, 34, 22);
  c.fillStyle = "#c7c2b8"; c.beginPath(); c.ellipse(27, 284, 9, 7, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#ffb347aa"; c.fillRect(14, 306, 26, 4);
  // A string of small bulbs across the lane, and the lamp.
  c.strokeStyle = "#151320"; c.lineWidth = 1; c.beginPath(); c.moveTo(0, 196); c.quadraticCurveTo(180, 214, W, 192); c.stroke();
  for (let i = 1; i < 12; i++) { const x = i * 30, y = 196 + Math.sin((i / 12) * Math.PI) * 16; c.fillStyle = i % 2 ? "#ffcf73" : "#ff8a5c"; c.beginPath(); c.arc(x, y + 3, 1.8, 0, Math.PI * 2); c.fill(); }
  const L = LIGHT[2];
  c.fillStyle = "#26232a"; c.fillRect(L.x - 2, L.y, 4, GROUND - L.y); c.fillRect(L.x - 2, L.y - 2, 22, 3);
  drawFloor(c, p);
  glow(c, p, L.x + 18, L.y + 6, 150);
  drawNet(c, p, [L.x + 1, 140, 300, 214]);
  c.fillStyle = "#26232a"; c.fillRect(299, 212, 3, 144);
  bulb(c, L.x + 18, L.y + 6, "#ffd08a");
}

/** Paints one world's static court for a canvas `width` × `height` CSS px at `ratio` device px. */
export function paintCourt(world: number, width: number, height: number, ratio: number, into?: HTMLCanvasElement | null) {
  const layer = into ?? document.createElement("canvas");
  layer.width = Math.round(width * ratio); layer.height = Math.round(height * ratio);
  const c = layer.getContext("2d");
  if (!c) return layer;
  const { scale, ox, top } = layoutFor(width, height), p = PALETTES[world];
  c.setTransform(ratio, 0, 0, ratio, 0, 0);
  c.fillStyle = p.skyTop; c.fillRect(0, 0, width, height);
  c.setTransform(ratio * scale, 0, 0, ratio * scale, ratio * ox, ratio * top * scale);
  const sky = c.createLinearGradient(0, -top, 0, 300);
  sky.addColorStop(0, p.skyTop); sky.addColorStop(1, p.skyLow);
  c.fillStyle = sky; c.fillRect(-ox / scale - 2, -top, W + (2 * ox) / scale + 4, H + top);
  if (world === 0) paintLane(c, p, top);
  else if (world === 1) paintRoof(c, p, top);
  else paintMarket(c, p, top);
  return layer;
}

/** The fog layer for the market lane: thick up high, thin near the ground. Drawn over the shuttle, swaying a little. */
export function paintFog(width: number, height: number, ratio: number, into?: HTMLCanvasElement | null) {
  const layer = into ?? document.createElement("canvas");
  layer.width = Math.round(width * ratio); layer.height = Math.round(height * ratio);
  const c = layer.getContext("2d");
  if (!c) return layer;
  const { scale, ox, top } = layoutFor(width, height);
  c.setTransform(ratio * scale, 0, 0, ratio * scale, ratio * ox, ratio * top * scale);
  const fog = c.createLinearGradient(0, -top, 0, 260);
  fog.addColorStop(0, "#cfd6e0e6"); fog.addColorStop(0.5, "#cfd6e0b8"); fog.addColorStop(0.8, "#cfd6e066"); fog.addColorStop(1, "#cfd6e000");
  c.fillStyle = fog; c.fillRect(-40, -top, W + 80, 260 + top);
  c.fillStyle = "#e3e8ee22";
  for (let i = 0; i < 7; i++) { c.beginPath(); c.ellipse(30 + i * 52, 200 + (i % 3) * 14, 60, 16, 0, 0, Math.PI * 2); c.fill(); }
  return layer;
}

/**
 * A player in a monkey cap and sweater. `x` is the feet; `facing` 1 looks right, −1 left. `arm` is the racket angle in radians
 * for a right-facing player (0 points forward, −π/2 straight up). `lift` raises the whole body (a jump), `crouch` bends it.
 */
export function drawPerson(c: CanvasRenderingContext2D, x: number, facing: number, shirt: string, cap: string, arm: number, lift: number, crouch: number) {
  c.save();
  c.translate(x, -lift);
  c.scale(facing, 1);
  const feet = GROUND - 2, hip = feet - 40 + crouch * 8, shoulder = hip - 36 + crouch * 4, head = shoulder - 15;
  c.strokeStyle = "#2e3446"; c.lineWidth = 8; c.lineCap = "round";
  c.beginPath(); c.moveTo(-3, hip); c.lineTo(-10 - crouch * 4, feet - 2); c.moveTo(3, hip); c.lineTo(9 + crouch * 4, feet - 2); c.stroke();
  c.fillStyle = "#1b1716"; c.fillRect(-16 - crouch * 4, feet - 3, 10, 3); c.fillRect(4 + crouch * 4, feet - 3, 10, 3);
  c.fillStyle = shirt;
  c.beginPath(); c.moveTo(-11, shoulder - 2); c.lineTo(11, shoulder - 2); c.lineTo(10, hip + 3); c.lineTo(-10, hip + 3); c.closePath(); c.fill();
  c.fillStyle = "#00000026"; c.fillRect(-10, hip - 4, 20, 3);
  c.strokeStyle = shirt; c.lineWidth = 5.5;
  c.beginPath(); c.moveTo(-6, shoulder + 2); c.lineTo(-13, shoulder + 22); c.stroke();
  c.fillStyle = cap; c.beginPath(); c.arc(0, head, 11, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#c98d63"; c.beginPath(); c.ellipse(4.5, head + 1, 5.5, 4.6, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#1b1716"; c.fillRect(6, head - 0.6, 1.7, 1.7);
  c.fillStyle = "#e0c8a0"; c.beginPath(); c.arc(-2, head - 11, 2.8, 0, Math.PI * 2); c.fill();
  const sx = 4, sy = shoulder + 2, cos = Math.cos(arm), sin = Math.sin(arm);
  const ex = sx + cos * 24, ey = sy + sin * 24, hx = sx + cos * 48, hy = sy + sin * 48;
  c.strokeStyle = shirt; c.lineWidth = 5.5;
  c.beginPath(); c.moveTo(sx, sy); c.lineTo(ex, ey); c.stroke();
  c.strokeStyle = "#d9d4c4"; c.lineWidth = 2;
  c.beginPath(); c.moveTo(ex, ey); c.lineTo(hx, hy); c.stroke();
  c.translate(sx + cos * 59, sy + sin * 59); c.rotate(arm);
  c.beginPath(); c.ellipse(0, 0, 11, 8, 0, 0, Math.PI * 2);
  c.fillStyle = "#ffffff16"; c.fill();
  c.strokeStyle = "#bfb8a6"; c.lineWidth = 0.6;
  c.beginPath(); for (let i = -6; i <= 6; i += 3) { c.moveTo(i, -6.5); c.lineTo(i, 6.5); c.moveTo(-9, i * 0.95); c.lineTo(9, i * 0.95); } c.stroke();
  c.strokeStyle = "#d9d4c4"; c.lineWidth = 2;
  c.beginPath(); c.ellipse(0, 0, 11, 8, 0, 0, Math.PI * 2); c.stroke();
  c.restore();
}

/** The shuttle: a cork with a feather skirt trailing behind, pointed where it's going. */
export function drawShuttle(c: CanvasRenderingContext2D, x: number, y: number, angle: number, alpha: number, size: number) {
  c.save();
  c.globalAlpha = alpha;
  c.translate(x, y); c.rotate(angle); c.scale(size, size);
  c.fillStyle = "#f4f1e8"; c.strokeStyle = "#1a1826"; c.lineWidth = 0.9;
  c.beginPath(); c.moveTo(-1, -2.8); c.lineTo(-12, -6); c.lineTo(-12, 6); c.lineTo(-1, 2.8); c.closePath(); c.fill(); c.stroke();
  c.strokeStyle = "#b8b2a2"; c.lineWidth = 0.6;
  c.beginPath(); c.moveTo(-5, -3.8); c.lineTo(-5, 3.8); c.moveTo(-9, -5); c.lineTo(-9, 5); c.stroke();
  c.fillStyle = "#fffdf6"; c.strokeStyle = "#1a1826"; c.lineWidth = 0.9;
  c.beginPath(); c.arc(1.2, 0, 3.6, 0, Math.PI * 2); c.fill(); c.stroke();
  c.restore();
}

// ---- the title, the story and the card ----

/** Title art: the bulb, its glow, and a big shuttlecock under it with the word across its cork. Width × width·1.05. */
export const TITLE_ASPECT = 1.05;
export function drawTitleArt(canvas: HTMLCanvasElement, width: number, ratio: number, word: string, world: number) {
  const height = Math.round(width * TITLE_ASPECT), p = PALETTES[world];
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  const c = canvas.getContext("2d");
  if (!c) return;
  const k = width / 300;
  c.setTransform(ratio * k, 0, 0, ratio * k, 0, 0);
  const g = c.createRadialGradient(150, 70, 6, 150, 120, 170);
  g.addColorStop(0, `${p.glow}d0`); g.addColorStop(0.35, `${p.glow}40`); g.addColorStop(1, `${p.glow}00`);
  c.fillStyle = g; c.fillRect(0, 0, 300, 315);
  c.strokeStyle = "#151320"; c.lineWidth = 2; c.beginPath(); c.moveTo(150, 0); c.lineTo(150, 30); c.stroke();
  bulb(c, 150, 38, "#fff4cf");
  // The shuttle, nose down, feathers up: a cone of eight feathers over a cork.
  c.save();
  c.translate(150, 190);
  c.fillStyle = "#00000030"; c.beginPath(); c.ellipse(0, 108, 70, 10, 0, 0, Math.PI * 2); c.fill();
  for (let i = 0; i < 8; i++) {
    const u = i / 7, x0 = -26 + u * 52, x1 = -92 + u * 184;
    c.fillStyle = i % 2 ? "#f7f4ec" : "#ece7da";
    c.beginPath(); c.moveTo(x0 - 4, 30); c.lineTo(x1 - 10, -110); c.quadraticCurveTo(x1, -122, x1 + 10, -110); c.lineTo(x0 + 4, 30); c.closePath(); c.fill();
    c.strokeStyle = "#1a182640"; c.lineWidth = 1.2; c.stroke();
  }
  c.strokeStyle = "#c2571a"; c.lineWidth = 5; c.beginPath(); c.moveTo(-50, -40); c.quadraticCurveTo(0, -30, 50, -40); c.stroke();
  c.strokeStyle = "#1b2238"; c.lineWidth = 3; c.beginPath(); c.moveTo(-36, 0); c.quadraticCurveTo(0, 8, 36, 0); c.stroke();
  // The cork with the word on it.
  c.fillStyle = "#fffdf6"; c.strokeStyle = "#1a1826"; c.lineWidth = 3;
  c.beginPath(); c.moveTo(-58, 30); c.lineTo(58, 30); c.quadraticCurveTo(64, 96, 0, 100); c.quadraticCurveTo(-64, 96, -58, 30); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = "#c2571a"; c.fillRect(-58, 30, 116, 12);
  c.fillStyle = "#1b2238";
  c.font = `800 40px ${getComputedStyle(document.documentElement).getPropertyValue("--font-display") || "sans-serif"}`;
  c.textAlign = "center"; c.textBaseline = "middle";
  c.fillText(word, 0, 70);
  c.restore();
  // Moths round the bulb.
  c.fillStyle = "#e8dcc0";
  c.fillRect(126, 30, 4, 1.6); c.fillRect(170, 46, 4, 1.6); c.fillRect(160, 22, 3, 1.4);
}

export const STORY_ASPECT = 0.8;
/** The three story panels, drawn in code: the bulb comes on; the net and ভাইয়া; the ring closing on the shuttle. */
export function drawStoryPanel(canvas: HTMLCanvasElement, width: number, ratio: number, index: number) {
  const height = Math.round(width * STORY_ASPECT);
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  const c = canvas.getContext("2d");
  if (!c) return;
  // The panel shows the court from just above the bulb down to the ground.
  const scale = width / W, from = Math.min(56, H - height / scale);
  c.setTransform(ratio * scale, 0, 0, ratio * scale, 0, -ratio * scale * from);
  const back = paintCourt(0, W, H, 1);
  c.drawImage(back, 0, 0, W, H);
  if (index === 0) {
    c.fillStyle = "#0b112899"; c.fillRect(0, 0, W, H);
    const g = c.createRadialGradient(LIGHT[0].x, LIGHT[0].y, 2, LIGHT[0].x, LIGHT[0].y, 90);
    g.addColorStop(0, "#fff2c2ff"); g.addColorStop(1, "#fff2c200");
    c.fillStyle = g; c.fillRect(0, 0, W, H);
  } else if (index === 1) {
    drawPerson(c, 268, -1, "#4f86c6", "#7a2e2a", -2.4, 0, 0);
    drawShuttle(c, 236, 238, Math.PI / 2, 1, 1.2);
  } else {
    drawPerson(c, 96, 1, YOU.shirt, YOU.cap, -2.6, 0, 0);
    drawPerson(c, 268, -1, "#4f86c6", "#7a2e2a", -0.6, 0, 0);
    c.strokeStyle = "#ffd23f"; c.lineWidth = 3.4;
    c.beginPath(); c.arc(118, 206, 16, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = "#ffffff88"; c.lineWidth = 2;
    c.beginPath(); c.arc(118, 206, 34, 0, Math.PI * 2); c.stroke();
    drawShuttle(c, 132, 190, 2.4, 1, 1.3);
  }
}
