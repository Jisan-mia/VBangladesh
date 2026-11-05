// Sets up the frame for one stage size and world: every still thing is painted once into offscreen canvases here (the floor,
// the bamboo frame, the warp, every tile, the weft, the motifs, the needle, the danger edges), and the strings the HUD needs
// live here too, set by the component when they change, so draw.hot.ts only stamps sprites.
import { DISPLAY_FONT } from "../../../shared/card-canvas";
import { drawBamboo, drawMotif, drawNeedle, paintSprites, paintWeft, GOLD_INK, MOTIF_INK, PALETTES, type Palette } from "./art";
import { COLS, ROWS } from "./pieces";
import type { Look, Motif } from "./levels";

export const CHIPS = 72;
export const HUD_H = 50;

export type Scene = {
  context: CanvasRenderingContext2D; k: number; width: number; height: number;
  look: Look; motif: Motif; palette: Palette;
  /** The cell size, the bamboo's thickness, and where the well (the inside of the frame) starts. */
  cell: number; bar: number; wellX: number; wellY: number; wellW: number; wellH: number;
  bg: HTMLCanvasElement; tiles: HTMLCanvasElement; tile: number; weft: HTMLCanvasElement;
  /** The world's motif, then its gold twin, side by side; `motifPx` device pixels each. */
  motifs: HTMLCanvasElement; motifPx: number;
  needle: HTMLCanvasElement; needlePx: number;
  edgeWarm: HTMLCanvasElement; edgeHot: HTMLCanvasElement;
  fontPoints: string; fontSmall: string; fontFloat: string; fontSub: string; fontName: string;
  /** HUD text, set by the component when it changes. */
  pointsText: string; floatText: string; floatSub: string; finaleText: string; riseText: string;
  /** Points needed for ★★ and ★★★ (0 in খোলা পাটি), the finale's name ("" otherwise). */
  two: number; three: number;
  /** Juice clocks (ms, performance.now), set by the component on events. */
  now: number; floatAt: number; floatY: number; turnAt: number; spawnAt: number; knockAt: number; knockDir: number;
  stuckAt: number; dropAt: number; dropX: number; dropW: number; dropTop: number; dropBottom: number; bumpAt: number;
  riseAt: number; rollAt: number; beatAt: number;
  /** Cane chips: x, y, vx, vy, life, colour per chip. */
  chips: Float32Array; chipAt: number;
};

function canvasOf(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(width)); canvas.height = Math.max(1, Math.ceil(height));
  return canvas;
}

/** The floor with broom sweeps (or the night's lantern pool), the frame's shadow, the dark well, the warp and the bamboo. */
function paintBackground(scene: Scene) {
  const { k, width, height, palette: p, cell, bar, wellX, wellY, wellW, wellH } = scene;
  const canvas = canvasOf(width * k, height * k), c = canvas.getContext("2d")!;
  c.setTransform(k, 0, 0, k, 0, 0);
  c.fillStyle = p.floor;
  c.fillRect(0, 0, width, height);
  if (scene.look === "night") {
    const pool = c.createRadialGradient(width * 0.15, height * 0.08, 0, width * 0.15, height * 0.08, Math.max(width, height) * 0.7);
    pool.addColorStop(0, "#5a4a3a"); pool.addColorStop(0.5, "#2b2d44"); pool.addColorStop(1, p.floor);
    c.fillStyle = pool; c.fillRect(0, 0, width, height);
    c.fillStyle = "#fff2c8";
    for (let i = 0; i < 26; i++) { const x = ((i * 97) % 100) / 100 * width, y = ((i * 53) % 100) / 100 * height; c.globalAlpha = 0.25 + (i % 3) * 0.15; c.fillRect(x, y, 1.6, 1.6); }
    c.globalAlpha = 1;
  } else {
    c.strokeStyle = p.floorLine; c.lineWidth = 6; c.lineCap = "round";
    for (const [x, y, r, start] of [[0.1, 0.2, 0.45, 0.2], [0.9, 0.85, 0.5, 3.4], [0.95, 0.15, 0.3, 1.7], [0.05, 0.95, 0.35, 4.6]]) {
      for (let j = 0; j < 3; j++) { c.beginPath(); c.arc(x * width, y * height, r * width + j * 14, start, start + 1.1); c.stroke(); }
    }
  }
  c.fillStyle = "#00000024";
  c.fillRect(wellX - bar + 5, wellY - bar + 7, wellW + bar * 2, wellH + bar * 2);
  c.fillStyle = p.well;
  c.fillRect(wellX, wellY, wellW, wellH);
  // Warp threads, two to a column, waiting for the weft.
  c.fillStyle = p.warp;
  for (let i = 0; i < COLS * 2; i++) c.fillRect(wellX + ((i + 0.5) * cell) / 2 - 1, wellY, 2, wellH);
  drawBamboo(c, wellX - bar, wellY - bar, wellW + bar * 2, bar, p);
  drawBamboo(c, wellX - bar, wellY + wellH, wellW + bar * 2, bar, p);
  drawBamboo(c, wellX - bar, wellY, bar, wellH, p);
  drawBamboo(c, wellX + wellW, wellY, bar, wellH, p);
  return canvas;
}

/** A soft glow along every edge of the stage, for danger. */
function paintEdge(width: number, height: number, k: number, colour: string) {
  const canvas = canvasOf(width * k, height * k), c = canvas.getContext("2d")!, depth = Math.min(width, height) * 0.16;
  c.setTransform(k, 0, 0, k, 0, 0);
  const sides: Array<[number, number, number, number, number, number, number, number]> = [
    [0, 0, 0, depth, 0, 0, width, depth], [0, height, 0, height - depth, 0, height - depth, width, depth],
    [0, 0, depth, 0, 0, 0, depth, height], [width, 0, width - depth, 0, width - depth, 0, depth, height],
  ];
  for (const [x0, y0, x1, y1, rx, ry, rw, rh] of sides) {
    const g = c.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, colour); g.addColorStop(1, colour + "00");
    c.fillStyle = g; c.fillRect(rx, ry, rw, rh);
  }
  return canvas;
}

export function makeScene(canvas: HTMLCanvasElement, width: number, height: number, look: Look, motif: Motif, previous: Scene | null): Scene {
  const k = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(width * k); canvas.height = Math.round(height * k);
  const context = canvas.getContext("2d")!;
  const pad = 8, cell = Math.max(14, Math.floor(Math.min((width - pad * 2) / (COLS + 0.6), (height - HUD_H - pad) / (ROWS + 0.6), 46)));
  const bar = Math.max(4, Math.round(cell * 0.3)), wellW = cell * COLS, wellH = cell * ROWS;
  const wellX = Math.round((width - wellW) / 2), wellY = HUD_H + bar + Math.max(0, Math.floor((height - HUD_H - pad - wellH - bar * 2) / 3));
  const p = PALETTES[look];
  const scene: Scene = {
    context, k, width, height, look, motif, palette: p, cell, bar, wellX, wellY, wellW, wellH,
    bg: null as unknown as HTMLCanvasElement, tiles: canvasOf(1, 1), tile: Math.ceil(cell * k), weft: canvasOf(1, 1),
    motifs: canvasOf(1, 1), motifPx: Math.ceil(cell * k), needle: canvasOf(1, 1), needlePx: Math.ceil(cell * k),
    edgeWarm: paintEdge(width, height, k, p.danger), edgeHot: paintEdge(width, height, k, p.hot),
    fontPoints: `800 ${Math.round(Math.min(26, cell * 0.5 + 6))}px ${DISPLAY_FONT}`,
    fontSmall: `700 12px ${DISPLAY_FONT}`,
    fontFloat: `800 ${Math.round(cell * 0.9)}px ${DISPLAY_FONT}`,
    fontSub: `700 ${Math.round(Math.max(13, cell * 0.45))}px ${DISPLAY_FONT}`,
    fontName: `800 14px ${DISPLAY_FONT}`,
    pointsText: previous?.pointsText ?? "০", floatText: "", floatSub: "", finaleText: previous?.finaleText ?? "", riseText: "",
    two: previous?.two ?? 0, three: previous?.three ?? 0,
    now: 0, floatAt: -1, floatY: 0, turnAt: -1, spawnAt: -1, knockAt: -1, knockDir: 0, stuckAt: -1,
    dropAt: -1, dropX: 0, dropW: 0, dropTop: 0, dropBottom: 0, bumpAt: -1, riseAt: -1, rollAt: -1, beatAt: -1,
    chips: new Float32Array(CHIPS * 6), chipAt: 0,
  };
  scene.bg = paintBackground(scene);
  paintSprites(scene.tiles, scene.tile);
  paintWeft(scene.weft, cell, k);
  // The world's motif and its gold twin.
  const m = scene.motifPx;
  scene.motifs.width = m * 2; scene.motifs.height = m;
  const mc = scene.motifs.getContext("2d")!;
  for (let index = 0; index < 2; index++) {
    const [main, deep] = index ? GOLD_INK : MOTIF_INK[motif];
    mc.save(); mc.translate(m * index + m / 2, m / 2); drawMotif(mc, motif, m * 0.86, main, deep); mc.restore();
  }
  const n = scene.needlePx;
  scene.needle.width = n; scene.needle.height = Math.ceil(n * 1.5);
  const nc = scene.needle.getContext("2d")!;
  drawNeedle(nc, 0, n * 0.45, n);
  return scene;
}
