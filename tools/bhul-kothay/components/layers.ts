// Builds each picture's layers once per level and size: runs of still things pre-rendered into one canvas each, and every
// moving thing as its own small sprite, so a frame is only a few blits (components/paint.hot.ts). Browser only.
import { drawItem, drawScene } from "../lib/draw";
import type { Puzzle } from "../lib/puzzle";
import { itemBox, SCENE_H, SCENE_W } from "../lib/shapes";
import { STRIDE } from "./paint.hot";

export type Layers = { width: number; height: number; scale: number; images: HTMLCanvasElement[]; data: Float64Array; count: number; moving: boolean };
const KIND = { bob: 1, drift: 2, sway: 3 } as const;

function canvasOf(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(width)); canvas.height = Math.max(1, Math.ceil(height));
  return canvas;
}

/** `scale` is device pixels per scene unit (CSS width ÷ 360 × device pixel ratio, capped at 2). */
export function buildLayers(puzzle: Puzzle, side: 0 | 1, scale: number): Layers {
  const width = Math.round(SCENE_W * scale), height = Math.round(SCENE_H * scale);
  const images: HTMLCanvasElement[] = [], rows: number[][] = [];
  let runFrom = -1;
  const flush = (to: number) => {
    if (runFrom < 0) return;
    const canvas = canvasOf(width, height), c = canvas.getContext("2d")!;
    drawScene(c, puzzle, side, 0, 0, scale, runFrom, to);
    images.push(canvas); rows.push([0, 0, 0, 0, 0, 0, 0, 0, 1, 0]);
    runFrom = -1;
  };
  puzzle.items.forEach((item, index) => {
    const look = puzzle.looks[side][index], motion = puzzle.motion[index];
    if (look.hidden) return;
    if (!motion || look.still) { if (runFrom < 0) runFrom = index; return; }
    flush(index);
    const box = itemBox(item, look)!, ax = item.x + (look.dx ?? 0), ay = item.y + (look.dy ?? 0), pad = 2;
    const sx = box.x - pad, sy = box.y - pad, sw = box.w + pad * 2, sh = box.h + pad * 2;
    const sprite = canvasOf(sw * scale, sh * scale), c = sprite.getContext("2d")!;
    c.setTransform(scale, 0, 0, scale, -sx * scale, -sy * scale);
    c.lineJoin = "round"; c.lineCap = "round";
    drawItem(c, item, look);
    images.push(sprite);
    rows.push([KIND[motion.kind], ax, ay, sx - ax, sy - ay, sw, sh, motion.amp, motion.period, motion.phase]);
  });
  flush(puzzle.items.length);
  const data = new Float64Array(rows.length * STRIDE);
  rows.forEach((row, index) => data.set(row, index * STRIDE));
  return { width, height, scale, images, data, count: rows.length, moving: rows.some(row => row[0] !== 0) };
}

/** A soft white disc for cutting the lamp's light out of the dark. */
export function lampHole() {
  const size = 256, canvas = canvasOf(size, size), c = canvas.getContext("2d")!;
  const glow = c.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  glow.addColorStop(0, "rgba(255,255,255,1)");
  glow.addColorStop(0.62, "rgba(255,255,255,0.96)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  c.fillStyle = glow;
  c.fillRect(0, 0, size, size);
  return canvas;
}
