// The static layers of the board: palettes per scene, the sky with the far village, and the paddy tile. Painted once by makeLayers
// (board units: 360 wide) and reused every frame by draw.hot.ts, which draws everything that moves.
import { makeRng } from "../../../shared/game-core";
import type { Scene } from "./levels";
import { W } from "./field";

export type Palette = {
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
/** The sky layer's height for a horizon at `horizon`: the haze runs 26 px below it. */
export const skyHeight = (horizon: number) => horizon + 26;

/** The sky, the far tree line and a few tin roofs, with a soft haze where the field meets them. */
export function paintSky(c: CanvasRenderingContext2D, scene: Scene, HORIZON: number) {
  const p = PALETTES[scene], rng = makeRng(scene.length * 97 + 5), SKY_H = skyHeight(HORIZON), t = HORIZON / 72;
  const sky = c.createLinearGradient(0, 0, 0, HORIZON);
  sky.addColorStop(0, p.skyTop); sky.addColorStop(1, p.skyLow);
  c.fillStyle = sky; c.fillRect(0, 0, W, HORIZON);
  const sunX = scene === "morning" ? 70 : scene === "noon" ? 280 : scene === "afternoon" ? 250 : 120;
  const sunY = scene === "noon" ? 18 * t : scene === "evening" ? HORIZON - 12 : 30 * t;
  const r = scene === "evening" ? 20 : 12;
  const glow = c.createRadialGradient(sunX, sunY, r * 0.6, sunX, sunY, r * 3.2);
  glow.addColorStop(0, p.glow); glow.addColorStop(1, "rgba(255,255,255,0)");
  c.fillStyle = glow; c.fillRect(sunX - r * 4, sunY - r * 4, r * 8, r * 8);
  c.fillStyle = p.sun; c.beginPath(); c.arc(sunX, sunY, r, 0, Math.PI * 2); c.fill();
  if (scene === "noon" || scene === "afternoon") {
    c.fillStyle = "rgba(255,255,255,0.85)";
    for (const [x, y0, s] of [[60, 20, 1], [190, 12, 0.8], [320, 30, 0.7]] as const) {
      const y = y0 * t;
      c.beginPath(); c.ellipse(x, y, 20 * s, 6 * s, 0, 0, Math.PI * 2); c.ellipse(x + 12 * s, y - 4 * s, 12 * s, 6 * s, 0, 0, Math.PI * 2); c.fill();
    }
  }
  if (scene === "evening" || scene === "afternoon") {
    c.strokeStyle = scene === "evening" ? "#3a2f40" : "#55606a"; c.lineWidth = 1.2;
    for (const [x, y0] of [[200, 24], [214, 30], [226, 22]] as const) { const y = y0 * t; c.beginPath(); c.moveTo(x - 4, y - 2); c.quadraticCurveTo(x - 2, y - 3, x, y); c.quadraticCurveTo(x + 2, y - 3, x + 4, y - 2); c.stroke(); }
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
export function makeLayers(scene: Scene, k: number, horizon: number, reuse?: Layers | null): Layers {
  const make = (existing: HTMLCanvasElement | undefined, height: number, paint: (c: CanvasRenderingContext2D) => void) => {
    const layer = existing ?? document.createElement("canvas");
    layer.width = Math.round(W * k); layer.height = Math.round(height * k);
    const c = layer.getContext("2d");
    if (c) { c.setTransform(k, 0, 0, k, 0, 0); paint(c); }
    return layer;
  };
  return {
    scene,
    sky: make(reuse?.sky, skyHeight(horizon), c => paintSky(c, scene, horizon)),
    tile: make(reuse?.tile, TILE, c => paintPaddy(c, scene)),
  };
}
