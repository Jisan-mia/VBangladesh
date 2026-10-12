// Drawing the field: sky and far village, paddy, ponds, the আল, puddles, goats, egrets, wind and the walker.
// Everything is drawn in board units (360 × 440); static layers are painted once by makeLayers and reused every frame.
import { makeRng } from "../../../shared/game-core";
import type { Scene } from "./levels";
import { centreAt, H, HORIZON, STRIDE, W, WALKER_Y, type Field } from "./walk";

type Palette = {
  skyTop: string; skyLow: string; sun: string; glow: string; trees: string; treesFar: string; roof: string;
  paddy: string; tuft: string; tuftDark: string; glint: string; water: string; waterRim: string;
  grass: string; earth: string; earthTop: string; worn: string; road: string; yard: string; haze: string;
};

export const PALETTES: Record<Scene, Palette> = {
  morning: {
    skyTop: "#9fd0ea", skyLow: "#f4ecc8", sun: "#fff3b0", glow: "#fff8d8", trees: "#3f6b2c", treesFar: "#7fa06a", roof: "#9aa3a8",
    paddy: "#79b04a", tuft: "#4f8f2b", tuftDark: "#3c7623", glint: "#b8dccb", water: "#7fb4b8", waterRim: "#c9e6e2",
    grass: "#467a26", earth: "#8b5e36", earthTop: "#b07d4c", worn: "#c79a66", road: "#c9a274", yard: "#d9bb8c", haze: "#eef3d8",
  },
  noon: {
    skyTop: "#5fb0e6", skyLow: "#d9eef6", sun: "#fffbe0", glow: "#f6fbff", trees: "#2f5f27", treesFar: "#6c9a62", roof: "#a6aeb3",
    paddy: "#6ea83e", tuft: "#478627", tuftDark: "#356f1e", glint: "#c4e6e6", water: "#5fa3b6", waterRim: "#bfe2ea",
    grass: "#3f7222", earth: "#87592f", earthTop: "#b27c47", worn: "#cf9f68", road: "#cda575", yard: "#ddbf8e", haze: "#e8f4f0",
  },
  afternoon: {
    skyTop: "#86b9dc", skyLow: "#f6d9a6", sun: "#ffe08a", glow: "#fff0c8", trees: "#3d5a26", treesFar: "#8a9a62", roof: "#a39b8f",
    paddy: "#a3b447", tuft: "#7a9030", tuftDark: "#5f7524", glint: "#e2e3b8", water: "#79a8a6", waterRim: "#d6e3c8",
    grass: "#556f22", earth: "#875a31", earthTop: "#b47f49", worn: "#d0a06a", road: "#d1a674", yard: "#e0c08c", haze: "#f6ecd0",
  },
  evening: {
    skyTop: "#5b4f8e", skyLow: "#f6a35c", sun: "#ffcf6b", glow: "#ffd9a0", trees: "#2d2a33", treesFar: "#6a4f5c", roof: "#4a3f48",
    paddy: "#d4a23c", tuft: "#b0802a", tuftDark: "#8c6320", glint: "#f0cf8a", water: "#9a7f86", waterRim: "#f2c9a0",
    grass: "#6b6a26", earth: "#7d4f2c", earthTop: "#a56f41", worn: "#c48f5c", road: "#c89a68", yard: "#d6ad78", haze: "#f8cf9c",
  },
};

export const TILE = 192;
export const SKY_H = HORIZON + 26;

/** The sky, the far tree line and a few tin roofs, with a soft haze where the field meets them. */
export function paintSky(c: CanvasRenderingContext2D, scene: Scene) {
  const p = PALETTES[scene], rng = makeRng(scene.length * 97 + 5);
  const sky = c.createLinearGradient(0, 0, 0, HORIZON);
  sky.addColorStop(0, p.skyTop); sky.addColorStop(1, p.skyLow);
  c.fillStyle = sky; c.fillRect(0, 0, W, HORIZON);
  const sunX = scene === "morning" ? 70 : scene === "noon" ? 280 : scene === "afternoon" ? 250 : 120;
  const sunY = scene === "noon" ? 18 : scene === "evening" ? HORIZON - 12 : 30;
  const r = scene === "evening" ? 20 : 12;
  const glow = c.createRadialGradient(sunX, sunY, r * 0.6, sunX, sunY, r * 3.2);
  glow.addColorStop(0, p.glow); glow.addColorStop(1, "rgba(255,255,255,0)");
  c.fillStyle = glow; c.fillRect(sunX - r * 4, sunY - r * 4, r * 8, r * 8);
  c.fillStyle = p.sun; c.beginPath(); c.arc(sunX, sunY, r, 0, Math.PI * 2); c.fill();
  if (scene === "noon" || scene === "afternoon") {
    c.fillStyle = "rgba(255,255,255,0.85)";
    for (const [x, y, s] of [[60, 20, 1], [190, 12, 0.8], [320, 30, 0.7]] as const) {
      c.beginPath(); c.ellipse(x, y, 20 * s, 6 * s, 0, 0, Math.PI * 2); c.ellipse(x + 12 * s, y - 4 * s, 12 * s, 6 * s, 0, 0, Math.PI * 2); c.fill();
    }
  }
  if (scene === "evening" || scene === "afternoon") {
    c.strokeStyle = scene === "evening" ? "#3a2f40" : "#55606a"; c.lineWidth = 1.2;
    for (const [x, y] of [[200, 24], [214, 30], [226, 22]] as const) { c.beginPath(); c.moveTo(x - 4, y - 2); c.quadraticCurveTo(x - 2, y - 3, x, y); c.quadraticCurveTo(x + 2, y - 3, x + 4, y - 2); c.stroke(); }
  }
  // Far trees, then nearer trees with a few roofs and a palm in between.
  c.fillStyle = p.treesFar; c.beginPath(); c.moveTo(0, HORIZON);
  for (let x = 0; x <= W; x += 14) c.lineTo(x, HORIZON - 14 - rng() * 10);
  c.lineTo(W, HORIZON); c.fill();
  for (const x of [46, 156, 292]) {
    c.fillStyle = p.roof; c.beginPath(); c.moveTo(x - 12, HORIZON - 10); c.lineTo(x, HORIZON - 19); c.lineTo(x + 12, HORIZON - 10); c.fill();
  }
  c.fillStyle = p.trees; c.beginPath(); c.moveTo(0, HORIZON);
  for (let x = 0; x <= W; x += 18) {
    const h = 6 + rng() * 9;
    c.quadraticCurveTo(x + 9, HORIZON - h * 2, x + 18, HORIZON - 2);
  }
  c.lineTo(W, HORIZON); c.fill();
  c.strokeStyle = p.trees; c.lineWidth = 2; c.beginPath(); c.moveTo(234, HORIZON); c.lineTo(236, HORIZON - 30); c.stroke();
  c.fillStyle = p.trees;
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; c.beginPath(); c.ellipse(236 + Math.cos(a) * 6, HORIZON - 31 + Math.sin(a) * 3, 7, 2, a, 0, Math.PI * 2); c.fill(); }
  const haze = c.createLinearGradient(0, HORIZON - 2, 0, SKY_H);
  haze.addColorStop(0, p.haze); haze.addColorStop(1, "rgba(255,255,255,0)");
  c.fillStyle = haze; c.fillRect(0, HORIZON - 2, W, SKY_H - HORIZON + 2);
}

/** One repeating strip of flooded paddy: rows of rice tufts, a few glints of water between them. */
export function paintPaddy(c: CanvasRenderingContext2D, scene: Scene) {
  const p = PALETTES[scene], rng = makeRng(41);
  c.fillStyle = p.paddy; c.fillRect(0, 0, W, TILE);
  c.strokeStyle = p.glint; c.lineWidth = 1;
  for (let i = 0; i < 16; i++) { const x = rng() * W, y = rng() * TILE; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 5 + rng() * 6, y); c.stroke(); }
  const ripe = scene === "evening";
  for (let row = 0; row < TILE / 12; row++) {
    const y = row * 12 + 8;
    if (y > TILE - 16) continue;
    for (let x = (row % 2) * 5; x < W + 6; x += 11) {
      const jx = x + (rng() - 0.5) * 3, jy = y + (rng() - 0.5) * 2;
      c.strokeStyle = rng() < 0.4 ? p.tuftDark : p.tuft; c.lineWidth = 1.3;
      c.beginPath();
      for (let blade = -2; blade <= 2; blade++) { c.moveTo(jx, jy); c.lineTo(jx + blade * 1.6, jy - 6 - (2 - Math.abs(blade)) * 1.5); }
      c.stroke();
      if (ripe) { c.fillStyle = "#f0c860"; c.fillRect(jx - 2.5, jy - 9, 1.6, 1.6); c.fillRect(jx + 1.5, jy - 8, 1.6, 1.6); }
    }
  }
  // A low cross-ridge between two plots, so the walk shows as the field slides by.
  c.fillStyle = p.grass; c.fillRect(0, TILE - 9, W, 7);
  c.fillStyle = p.earth; c.fillRect(0, TILE - 8, W, 4);
  c.fillStyle = p.earthTop; c.fillRect(0, TILE - 8, W, 1.5);
}

export type Layers = { sky: HTMLCanvasElement; tile: HTMLCanvasElement; scene: Scene };

/** Paints the static layers at `k` canvas pixels per board unit. */
export function makeLayers(scene: Scene, k: number, reuse?: Layers | null): Layers {
  const make = (existing: HTMLCanvasElement | undefined, height: number, paint: (c: CanvasRenderingContext2D) => void) => {
    const layer = existing ?? document.createElement("canvas");
    layer.width = Math.round(W * k); layer.height = Math.round(height * k);
    const c = layer.getContext("2d");
    if (c) { c.setTransform(k, 0, 0, k, 0, 0); paint(c); }
    return layer;
  };
  return {
    scene,
    sky: make(reuse?.sky, SKY_H, c => paintSky(c, scene)),
    tile: make(reuse?.tile, TILE, c => paintPaddy(c, scene)),
  };
}

const screenY = (D: number, d: number) => WALKER_Y - (D - d);

function drawPond(c: CanvasRenderingContext2D, p: Palette, x: number, y: number, r: number, clock: number, calm: boolean, flip: boolean) {
  c.fillStyle = p.grass; c.beginPath(); c.ellipse(x, y, r * 1.25 + 4, r * 0.85 + 4, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = p.water; c.beginPath(); c.ellipse(x, y, r * 1.25, r * 0.85, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = p.waterRim; c.lineWidth = 1.2;
  const ripple = calm ? 0.5 : (clock * 0.5) % 1;
  c.globalAlpha = 1 - ripple; c.beginPath(); c.ellipse(x + (flip ? -6 : 6), y - 3, 4 + ripple * 10, 2 + ripple * 5, 0, 0, Math.PI * 2); c.stroke(); c.globalAlpha = 1;
  // Two lily pads and a ghat step on the near side.
  c.fillStyle = "#4f9a4a";
  c.beginPath(); c.arc(x - r * 0.5, y + r * 0.2, 4, 0.3, Math.PI * 2 - 0.3); c.fill();
  c.beginPath(); c.arc(x + r * 0.3, y + r * 0.45, 3, 0.4, Math.PI * 2 - 0.4); c.fill();
  c.fillStyle = "#b9a78f"; c.fillRect(x - 7, y + r * 0.85 - 3, 14, 5);
}

function band(c: CanvasRenderingContext2D, field: Field, d: number, top: number, width: number, shift: number, color: string) {
  const bottom = H + 8;
  c.fillStyle = color; c.beginPath();
  for (let y = bottom; y >= top; y -= 8) c.lineTo(centreAt(field, d + WALKER_Y - y) - width + shift, y);
  c.lineTo(centreAt(field, d + WALKER_Y - top) - width + shift, top);
  for (let y = top; y <= bottom; y += 8) c.lineTo(centreAt(field, d + WALKER_Y - y) + width + shift, y);
  c.lineTo(centreAt(field, d + WALKER_Y - bottom) + width + shift, bottom);
  c.fill();
}

/** The ridge from the bottom of the board up to the horizon, or to the village road at the end of the field. */
function drawRidge(c: CanvasRenderingContext2D, p: Palette, field: Field, d: number) {
  const half = field.spec.half, top = Math.max(HORIZON - 4, screenY(field.length, d));
  band(c, field, d, top, half + 5, 3, "rgba(40,30,10,0.18)");
  band(c, field, d, top, half + 5, 0, p.grass);
  band(c, field, d, top, half, 0, p.earth);
  band(c, field, d, top, half - 3, -1, p.earthTop);
  band(c, field, d, top, half * 0.4, 0, p.worn);
}

/** The village road across the end of the field, and the yard beyond it. */
function drawRoad(c: CanvasRenderingContext2D, p: Palette, field: Field, d: number) {
  const y = screenY(field.length, d);
  if (y < HORIZON - 30 || y > H + 30) return;
  // The yard is a strip past the road; behind it a row of trees, and the next fields beyond.
  const back = Math.max(HORIZON, y - 104);
  c.fillStyle = p.yard; c.fillRect(0, back, W, Math.max(0, y - 12 - back));
  if (y - 104 > HORIZON - 40) {
    c.fillStyle = p.trees;
    for (let x = -10; x < W + 20; x += 34) { c.beginPath(); c.arc(x, y - 104, 18 + ((x * 7) % 9), 0, Math.PI * 2); c.fill(); }
    c.fillStyle = p.grass;
    for (let x = 6; x < W + 20; x += 34) { c.beginPath(); c.arc(x, y - 98, 12 + ((x * 5) % 7), 0, Math.PI * 2); c.fill(); }
  }
  c.fillStyle = p.road; c.fillRect(0, y - 14, W, 26);
  c.fillStyle = p.grass; c.fillRect(0, y + 10, W, 3); c.fillRect(0, y - 15, W, 2);
  // The yard: a mud hut with a thatched roof, a haystack and a banana plant, standing just past the road.
  const ground = y - 20;
  if (ground > HORIZON) {
    c.fillStyle = "rgba(40,30,10,0.18)"; c.fillRect(118, ground - 2, 92, 5);
    c.fillStyle = "#c08a55"; c.fillRect(124, ground - 34, 80, 34);
    c.fillStyle = "#a8743f"; c.fillRect(124, ground - 8, 80, 8);
    c.fillStyle = "#4a3020"; c.fillRect(156, ground - 26, 16, 26);
    c.fillStyle = "#b8893a"; c.beginPath(); c.moveTo(114, ground - 30); c.lineTo(164, ground - 60); c.lineTo(214, ground - 30); c.fill();
    c.strokeStyle = "#946a28"; c.lineWidth = 1.2; c.beginPath();
    for (let i = 0; i < 6; i++) { c.moveTo(124 + i * 16, ground - 32); c.lineTo(140 + i * 8, ground - 50); }
    c.stroke();
    c.fillStyle = "#d4a44c"; c.beginPath(); c.ellipse(62, ground - 2, 22, 26, 0, Math.PI, 0); c.fill();
    c.strokeStyle = "#a07a30"; c.lineWidth = 2; c.beginPath(); c.moveTo(62, ground - 28); c.lineTo(62, ground - 36); c.stroke();
    c.strokeStyle = "#5b8a2a"; c.lineWidth = 3; c.beginPath(); c.moveTo(290, ground); c.lineTo(290, ground - 26); c.stroke();
    c.fillStyle = "#5b8a2a";
    for (const a of [-0.9, -0.3, 0.4, 1]) { c.beginPath(); c.ellipse(290 + Math.sin(a) * 11, ground - 28 + Math.abs(a) * 4, 12, 4, a, 0, Math.PI * 2); c.fill(); }
  }
}

function drawPuddle(c: CanvasRenderingContext2D, p: Palette, x: number, y: number, rx: number, ry: number, clock: number, calm: boolean) {
  c.fillStyle = "#5e4128"; c.beginPath(); c.ellipse(x, y, rx + 2.5, ry + 2.5, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = p.water; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = p.waterRim; c.lineWidth = 1.2;
  c.beginPath(); c.moveTo(x - rx * 0.4, y - ry * 0.3); c.lineTo(x + rx * 0.1, y - ry * 0.3); c.stroke();
  const ripple = calm ? 0.4 : (clock * 0.7) % 1;
  c.globalAlpha = 0.9 - ripple * 0.8; c.beginPath(); c.ellipse(x, y + ry * 0.2, 2 + ripple * rx * 0.6, 1 + ripple * ry * 0.4, 0, 0, Math.PI * 2); c.stroke(); c.globalAlpha = 1;
}

/** A small white goat with a brown patch, grazing; `facing` 1 looks right. */
export function drawGoat(c: CanvasRenderingContext2D, x: number, y: number, facing: number, clock: number, calm: boolean) {
  const bob = calm ? 0 : Math.sin(clock * 3) * 1.4;
  c.fillStyle = "rgba(40,30,10,0.22)"; c.beginPath(); c.ellipse(x, y + 7, 15, 4, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#3b2d22"; c.lineWidth = 2;
  c.beginPath();
  for (const lx of [-9, -5, 6, 10]) { c.moveTo(x + lx * facing, y + 2); c.lineTo(x + lx * facing, y + 8); }
  c.stroke();
  c.fillStyle = "#f3efe4"; c.beginPath(); c.ellipse(x, y, 14, 7.5, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#9a6a3e"; c.beginPath(); c.ellipse(x - 3 * facing, y - 2, 6, 4, 0.3, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#f3efe4"; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x - 13 * facing, y - 3); c.lineTo(x - 17 * facing, y - 7); c.stroke();
  const hx = x + 15 * facing, hy = y + 1 + bob;
  c.fillStyle = "#f3efe4"; c.beginPath(); c.ellipse(hx, hy, 5.5, 4.2, 0.5 * facing, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#e8dcc8"; c.beginPath(); c.ellipse(hx - 2 * facing, hy - 4, 2, 4, -0.8 * facing, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#6b5a48"; c.lineWidth = 1.4; c.beginPath(); c.moveTo(hx - 1 * facing, hy - 4); c.quadraticCurveTo(hx - 4 * facing, hy - 9, hx - 7 * facing, hy - 8); c.stroke();
  c.fillStyle = "#2b211a"; c.beginPath(); c.arc(hx + 2 * facing, hy - 1, 0.9, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#d8ccb6"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(hx + 3 * facing, hy + 3); c.lineTo(hx + 2 * facing, hy + 6); c.stroke();
}

/** An egret: standing in the paddy, or lifting off (`fly` 0..1+), wings beating unless calm. */
export function drawBok(c: CanvasRenderingContext2D, x: number, y: number, facing: number, fly: number, clock: number, calm: boolean) {
  if (fly <= 0) {
    c.strokeStyle = "#2c2a26"; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y + 3); c.lineTo(x, y + 9); c.stroke();
    c.fillStyle = "#fbfbf6"; c.beginPath(); c.ellipse(x, y, 6, 3.6, -0.3 * facing, 0, Math.PI * 2); c.fill();
    c.strokeStyle = "#fbfbf6"; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 4 * facing, y - 1); c.quadraticCurveTo(x + 2 * facing, y - 6, x + 5 * facing, y - 9); c.stroke();
    c.strokeStyle = "#e8b830"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x + 5 * facing, y - 9); c.lineTo(x + 9 * facing, y - 8); c.stroke();
    return;
  }
  const beat = calm ? 0.4 : Math.sin(clock * 13), span = 9 + fly * 4;
  c.fillStyle = "#fbfbf6"; c.beginPath(); c.ellipse(x, y, 5, 2.6, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#fbfbf6"; c.lineWidth = 2.2; c.beginPath();
  c.moveTo(x - span, y - beat * 6); c.quadraticCurveTo(x - span / 2, y - 3 - beat * 3, x, y);
  c.quadraticCurveTo(x + span / 2, y - 3 - beat * 3, x + span, y - beat * 6); c.stroke();
  c.strokeStyle = "#e8b830"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x + 5 * facing, y - 1); c.lineTo(x + 9 * facing, y - 1); c.stroke();
}

export type WalkerPose = { x: number; d: number; slip: number; side: number; ghost: boolean; calm: boolean; still?: boolean };

/** The walker from behind: a white গেঞ্জি, a checked লুঙ্গি, a red গামছা on the shoulder. `slip` 0..1 tips them into the mud. */
export function drawWalker(c: CanvasRenderingContext2D, pose: WalkerPose) {
  const { x, slip, side, calm } = pose, y = WALKER_Y;
  const swing = pose.still || slip > 0 ? 0 : Math.sin((pose.d / STRIDE) * Math.PI) * 3;
  c.save();
  if (pose.ghost) c.globalAlpha = 0.6;
  if (slip > 0) {
    const t = Math.min(1, slip * 2.4);
    // Mud ring where the foot went in, and a few splashes flying out.
    c.fillStyle = "#4a3320"; c.beginPath(); c.ellipse(x + side * 5, y + 4, 9 + t * 3, 4 + t, 0, 0, Math.PI * 2); c.fill();
    if (!calm && slip < 0.6) {
      c.fillStyle = "#5e4128";
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI / 2 + (i - 3) * 0.42 + side * 0.3, r = slip * 60, sx = x + side * 5 + Math.cos(a) * r, sy = y + 2 + Math.sin(a) * r + slip * slip * 90;
        c.beginPath(); c.arc(sx, sy, 2.2 - slip * 2, 0, Math.PI * 2); c.fill();
      }
    }
    c.translate(x, y + 4); c.rotate(side * 0.45 * t); c.translate(-x, -(y + 4 - t * 4));
  } else {
    c.fillStyle = "rgba(40,30,10,0.25)"; c.beginPath(); c.ellipse(x, y + 5, 9, 3.5, 0, 0, Math.PI * 2); c.fill();
  }
  c.strokeStyle = "#7f4f32"; c.lineWidth = 3; c.lineCap = "round";
  c.beginPath(); c.moveTo(x - 3, y - 3); c.lineTo(x - 3.5, y + 3 + swing); c.moveTo(x + 3, y - 3); c.lineTo(x + 3.5, y + 3 - swing); c.stroke();
  // লুঙ্গি
  c.fillStyle = "#2f62a8"; c.beginPath(); c.moveTo(x - 6, y - 12); c.lineTo(x + 6, y - 12); c.lineTo(x + 7, y - 1); c.lineTo(x - 7, y - 1); c.fill();
  c.strokeStyle = "#1d3f73"; c.lineWidth = 1; c.beginPath(); c.moveTo(x - 6.5, y - 8); c.lineTo(x + 6.5, y - 8); c.moveTo(x - 7, y - 4); c.lineTo(x + 7, y - 4); c.moveTo(x - 2, y - 12); c.lineTo(x - 2, y - 1); c.moveTo(x + 2.5, y - 12); c.lineTo(x + 2.5, y - 1); c.stroke();
  // arms swing against the legs
  c.strokeStyle = "#7f4f32"; c.lineWidth = 2.6;
  c.beginPath(); c.moveTo(x - 6.5, y - 20); c.lineTo(x - 8.5, y - 12 + swing * 0.8); c.moveTo(x + 6.5, y - 20); c.lineTo(x + 8.5, y - 12 - swing * 0.8); c.stroke();
  c.fillStyle = "#f6f3ea"; c.beginPath(); c.ellipse(x, y - 17, 7, 6.5, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#c8323c"; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 5, y - 22); c.lineTo(x + 4, y - 12); c.stroke();
  c.strokeStyle = "#f6f3ea"; c.lineWidth = 1; c.setLineDash([1.5, 2]); c.beginPath(); c.moveTo(x - 5, y - 22); c.lineTo(x + 4, y - 12); c.stroke(); c.setLineDash([]);
  c.fillStyle = "#7f4f32"; c.beginPath(); c.arc(x, y - 26, 5, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#1e1a17"; c.beginPath(); c.ellipse(x, y - 27.2, 5.2, 4.4, 0, 0, Math.PI * 2); c.fill();
  c.restore();
}

/** Wind streaks across the field; they drift the way it pushes, longer when it pushes harder. */
function drawWind(c: CanvasRenderingContext2D, push: number, clock: number) {
  const strength = Math.min(1, Math.abs(push) / 24);
  if (strength < 0.08) return;
  c.strokeStyle = "rgba(255,255,255,0.7)"; c.lineWidth = 1.4; c.lineCap = "round";
  const length = 8 + 22 * strength, dir = Math.sign(push);
  c.beginPath();
  for (let i = 0; i < 9; i++) {
    const y = HORIZON + 26 + ((i * 41) % (H - HORIZON - 40));
    const x = (((i * 97 + clock * push * 6) % (W + 80)) + W + 80) % (W + 80) - 40;
    c.moveTo(x, y); c.lineTo(x - dir * length, y);
    c.moveTo(x - dir * length * 0.3, y + 5); c.lineTo(x - dir * length * 0.9, y + 5);
  }
  c.stroke();
}

export type View = { field: Field; d: number; clock: number; calm: boolean; wind: number; walker: WalkerPose | null };

/** One frame of the whole board. No allocation beyond what the canvas API does itself. */
export function drawScene(c: CanvasRenderingContext2D, layers: Layers, view: View) {
  const { field, d, clock, calm } = view, p = PALETTES[field.spec.scene];
  for (let y = ((d + WALKER_Y) % TILE) - TILE; y < H; y += TILE) c.drawImage(layers.tile, 0, y, W, TILE);
  const near = d - (H - WALKER_Y) - 60, far = d + WALKER_Y - HORIZON + 60;
  for (const item of field.decor) {
    if (item.kind !== "pond" || item.d < near || item.d > far || item.d > field.length - 30) continue;
    drawPond(c, p, item.x, screenY(item.d, d), item.r, clock, calm, item.flip);
  }
  drawRidge(c, p, field, d);
  drawRoad(c, p, field, d);
  for (const o of field.obstacles) {
    const mid = o.d + o.len / 2;
    if (mid < near || mid > far) continue;
    const x = centreAt(field, mid) + (o.lo + o.hi) / 2, y = screenY(mid, d);
    if (o.kind === "puddle") drawPuddle(c, p, x, y, (o.hi - o.lo) / 2 + 2, o.len / 2, clock, calm);
    else drawGoat(c, x, y, o.side > 0 ? -1 : 1, clock + o.d, calm);
  }
  for (const item of field.decor) {
    if (item.kind !== "bok" || item.d > field.length - 30) continue;
    const fly = (d - (item.d - 60)) / 120;
    if (fly <= 0 && (item.d < near || item.d > far)) continue;
    if (fly > 2.2) continue;
    const facing = item.flip ? -1 : 1;
    const x = item.x + (fly > 0 ? facing * fly * 60 : 0), y = screenY(item.d + (fly > 0 ? fly * 260 : 0), d) - (fly > 0 ? fly * 20 : 0);
    if (y < HORIZON - 30 || y > H + 20) continue;
    drawBok(c, x, y, facing, fly, clock, calm);
  }
  if (view.walker) drawWalker(c, view.walker);
  drawWind(c, view.wind, clock);
  c.drawImage(layers.sky, 0, 0, W, SKY_H);
}
