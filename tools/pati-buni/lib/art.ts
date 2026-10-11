// Original art drawn with plain canvas paths: basket-woven cane tiles in four natural dyes, a bamboo frame, warp threads and a rolled mat. Shared by the board and the card.
import { COLS, type Colour } from "./weave";

export const palette = {
  floor: "#ece0c4", floorLine: "#e0d0ad", well: "#3b2c22", warp: "#5a4535", warpLight: "#b99c64",
  bamboo: "#d8b86c", bambooLight: "#efd89f", bambooDark: "#a7843f", node: "#86642c",
  ink: "#2e2119", muted: "#6e5a46", glow: "#fff4d6", twine: "#7a5a2e", gold: "#f2b632",
};

/** Index 1 natural বেত, 2 হলুদ, 3 মেহেদি, 4 খয়েরি. Told apart by more than colour: each piece's shape is unique on the board. */
export const CANE = [
  { base: "", light: "", dark: "" },
  { base: "#e8cf92", light: "#f8e9c2", dark: "#a2844a" },
  { base: "#e09f24", light: "#f5c85c", dark: "#94640e" },
  { base: "#6c9033", light: "#9ebd5c", dark: "#3e5619" },
  { base: "#a4492b", light: "#cf7553", dark: "#5f240e" },
] as const;

/** Where a tile sits in the sprite strip: two per colour, slats across first. */
export const spriteIndex = (colour: number, across: boolean) => (colour - 1) * 2 + (across ? 0 : 1);

/** One cell of basket weave: three slats over a dark gap, running across or down, so neighbours look over-and-under. */
export function drawWeaveCell(c: CanvasRenderingContext2D, x: number, y: number, s: number, colour: Colour, across: boolean) {
  const cane = CANE[colour], gap = Math.max(1, s * 0.07), slat = (s - gap * 4) / 3;
  c.fillStyle = cane.dark;
  c.fillRect(x, y, s, s);
  for (let i = 0; i < 3; i++) {
    const at = gap + i * (slat + gap);
    c.fillStyle = cane.base;
    if (across) c.fillRect(x + gap * 0.5, y + at, s - gap, slat); else c.fillRect(x + at, y + gap * 0.5, slat, s - gap);
    c.fillStyle = cane.light;
    if (across) c.fillRect(x + gap * 0.5, y + at, s - gap, slat * 0.3); else c.fillRect(x + at, y + gap * 0.5, slat * 0.3, s - gap);
  }
}

/** A sprite strip of all eight tiles at `size` device pixels, so a frame draws each cell with one drawImage. */
export function paintSprites(canvas: HTMLCanvasElement, size: number) {
  canvas.width = size * 8;
  canvas.height = size;
  const c = canvas.getContext("2d")!;
  for (let colour = 1 as Colour; colour <= 4; colour++) {
    drawWeaveCell(c, spriteIndex(colour, true) * size, 0, size, colour, true);
    drawWeaveCell(c, spriteIndex(colour, false) * size, 0, size, colour, false);
  }
}

/** The weft that threads through a finished row: a pale cane strip dipping under every other half cell. */
export function paintWeft(canvas: HTMLCanvasElement, cell: number, ratio: number) {
  const width = Math.ceil(cell * COLS * ratio), height = Math.max(4, Math.ceil(cell * 0.34 * ratio));
  canvas.width = width;
  canvas.height = height;
  const c = canvas.getContext("2d")!, step = (cell * ratio) / 2;
  c.fillStyle = CANE[1].light;
  c.fillRect(0, 0, width, height);
  c.fillStyle = CANE[1].dark;
  for (let x = step / 2; x < width; x += step * 2) c.fillRect(x, 0, step, height * 0.22);
  c.fillRect(0, height * 0.82, width, height * 0.18);
}

/** A bamboo pole with nodes, lying along whichever side of the box is longer. */
export function drawBamboo(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const along = w >= h, thick = along ? h : w, length = along ? w : h;
  c.fillStyle = palette.bamboo;
  c.fillRect(x, y, w, h);
  c.fillStyle = palette.bambooLight;
  if (along) c.fillRect(x, y + thick * 0.15, w, thick * 0.25); else c.fillRect(x + thick * 0.15, y, thick * 0.25, h);
  c.fillStyle = palette.bambooDark;
  if (along) c.fillRect(x, y + thick * 0.8, w, thick * 0.2); else c.fillRect(x + thick * 0.8, y, thick * 0.2, h);
  c.fillStyle = palette.node;
  const nodes = Math.max(2, Math.round(length / (thick * 7)));
  for (let i = 1; i < nodes; i++) {
    const at = (length * i) / nodes;
    if (along) c.fillRect(x + at, y, Math.max(1.5, thick * 0.16), h); else c.fillRect(x, y + at, w, Math.max(1.5, thick * 0.16));
  }
}

/** A rolled-up mat lying on its side: woven body, spiral end. */
export function drawRoll(c: CanvasRenderingContext2D, x: number, y: number, length: number, diameter: number) {
  const r = diameter / 2, end = r * 0.42;
  c.fillStyle = CANE[1].dark;
  c.fillRect(x, y - r, length - end, diameter);
  c.fillStyle = CANE[1].base;
  c.fillRect(x, y - r * 0.82, length - end, r * 1.5);
  c.fillStyle = CANE[1].light;
  c.fillRect(x, y - r * 0.7, length - end, r * 0.32);
  c.fillStyle = CANE[4].base;
  c.fillRect(x + length * 0.12, y - r, Math.max(2, length * 0.05), diameter);
  c.fillRect(x + length * 0.7, y - r, Math.max(2, length * 0.05), diameter);
  c.fillStyle = CANE[1].dark;
  c.beginPath(); c.ellipse(x + length - end, y, end, r, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = CANE[1].light;
  c.lineWidth = Math.max(1, r * 0.1);
  for (let k = 1; k <= 3; k++) { c.beginPath(); c.ellipse(x + length - end, y, (end * k) / 4, (r * k) / 4, 0, 0, Math.PI * 2); c.stroke(); }
}

/**
 * The mat on the card: warp threads tied to a bamboo stick, the newest woven rows from the bottom up (oldest first in `pattern`),
 * and a roll underneath when more rows were woven than fit.
 */
export function drawMat(c: CanvasRenderingContext2D, pattern: readonly number[], rows: number, x: number, y: number, cell: number, tall: number) {
  const width = cell * COLS, height = cell * tall;
  c.fillStyle = palette.warpLight;
  for (let i = 0; i < COLS * 2; i++) c.fillRect(x + ((i + 0.5) * cell) / 2 - cell * 0.03, y, cell * 0.06, height);
  pattern.forEach((row, index) => {
    const top = y + height - (index + 1) * cell;
    for (let col = 0; col < COLS; col++) drawWeaveCell(c, x + col * cell, top, cell, (((row >> (col * 2)) & 3) + 1) as Colour, (col + index) % 2 === 0);
  });
  if (pattern.length) {
    // A খয়েরি binding down both woven edges.
    c.fillStyle = CANE[4].dark;
    c.fillRect(x - cell * 0.12, y + height - pattern.length * cell, cell * 0.12, pattern.length * cell);
    c.fillRect(x + width, y + height - pattern.length * cell, cell * 0.12, pattern.length * cell);
  }
  drawBamboo(c, x - cell * 0.5, y - cell * 0.45, width + cell, cell * 0.45);
  if (rows <= pattern.length) return;
  const diameter = Math.min(cell * 1.6, cell * 0.7 + (rows - pattern.length) * cell * 0.02);
  drawRoll(c, x - cell * 0.3, y + height + diameter * 0.4, width + cell * 0.6, diameter);
}
