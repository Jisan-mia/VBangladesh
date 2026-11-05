// Original art drawn with plain canvas paths: basket-woven cane tiles in four natural dyes and gold, a bamboo frame, warp
// threads, a rolled mat, the three নকশা motifs (বরফি, লতা, শাপলা), the সুই, and the title's rolled শীতলপাটি.
// Shared by the frame, the title and the card. One palette per world.
import { COLS } from "./pieces";
import type { Look, Motif } from "./levels";

export const palette = {
  floor: "#ece0c4", floorLine: "#e0d0ad", well: "#3b2c22", warp: "#5a4535", warpLight: "#b99c64",
  bamboo: "#d8b86c", bambooLight: "#efd89f", bambooDark: "#a7843f", node: "#86642c",
  ink: "#2e2119", muted: "#6e5a46", glow: "#fff4d6", twine: "#7a5a2e", gold: "#f2b632",
};

export type Palette = {
  floor: string; floorLine: string; well: string; warp: string; aim: string; ink: string; muted: string; chip: string;
  bamboo: string; bambooLight: string; bambooDark: string; node: string; accent: string; glow: string; danger: string; hot: string;
};
export const PALETTES: Record<Look, Palette> = {
  day: { floor: "#ece0c4", floorLine: "#e0d0ad", well: "#3b2c22", warp: "#5a4535", aim: "#ffe7a8", ink: "#2e2119", muted: "#6e5a46", chip: "#f6ead0",
    bamboo: "#d8b86c", bambooLight: "#efd89f", bambooDark: "#a7843f", node: "#86642c", accent: "#4f7a28", glow: "#fff4d6", danger: "#f08a24", hot: "#d8341e" },
  dusk: { floor: "#d8b9a0", floorLine: "#cba78c", well: "#2c1d22", warp: "#5b3d3c", aim: "#ffd3a8", ink: "#2a1816", muted: "#6b4a42", chip: "#f3dccb",
    bamboo: "#cfa767", bambooLight: "#e8c98f", bambooDark: "#98703a", node: "#7a5628", accent: "#8a3517", glow: "#ffe9d6", danger: "#f08a24", hot: "#d8341e" },
  night: { floor: "#1f2742", floorLine: "#28314f", well: "#121729", warp: "#39446a", aim: "#ffe3a0", ink: "#f4ead2", muted: "#aab2cc", chip: "#3a4670",
    bamboo: "#b89a5c", bambooLight: "#d8bd80", bambooDark: "#86693a", node: "#6b5228", accent: "#ffcf5a", glow: "#fff2c8", danger: "#ff9a3c", hot: "#ff5a3c" },
};

/** Index 1 natural বেত, 2 হলুদ, 3 মেহেদি, 4 খয়েরি, 5 সোনালি. Told apart by more than colour: each strip's shape is unique. */
export const CANE = [
  { base: "", light: "", dark: "" },
  { base: "#e8cf92", light: "#f8e9c2", dark: "#a2844a" },
  { base: "#e09f24", light: "#f5c85c", dark: "#94640e" },
  { base: "#6c9033", light: "#9ebd5c", dark: "#3e5619" },
  { base: "#a4492b", light: "#cf7553", dark: "#5f240e" },
  { base: "#f3c640", light: "#fff1a8", dark: "#a8781a" },
] as const;

/** Where a tile sits in the sprite strip: colour 1–5 × slats across or down × plain, old or wet. */
export const TILE_KINDS = 3;
export const spriteIndex = (colour: number, across: boolean, variant = 0) => ((colour - 1) * 2 + (across ? 0 : 1)) * TILE_KINDS + variant;
export const TILE_COUNT = 5 * 2 * TILE_KINDS;

/** One cell of basket weave: three slats over a dark gap, running across or down, so neighbours look over-and-under. */
export function drawWeaveCell(c: CanvasRenderingContext2D, x: number, y: number, s: number, colour: number, across: boolean) {
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

/** Old cane: faded, with frayed dark nicks along the slats. */
function wear(c: CanvasRenderingContext2D, x: number, y: number, s: number, seed: number) {
  c.fillStyle = "#3b2c2238";
  c.fillRect(x, y, s, s);
  c.fillStyle = "#2a1d1466";
  for (let k = 0; k < 4; k++) {
    const px = ((seed * 37 + k * 53) % 100) / 100, py = ((seed * 61 + k * 29) % 100) / 100;
    c.fillRect(x + px * s * 0.8, y + py * s * 0.8, s * 0.14, s * 0.06);
  }
}
/** Wet cane: darker, with two drops of water. */
function wet(c: CanvasRenderingContext2D, x: number, y: number, s: number) {
  c.fillStyle = "#1c3a5a40";
  c.fillRect(x, y, s, s);
  c.fillStyle = "#e8f4ffd0";
  for (const [dx, dy, r] of [[0.3, 0.32, 0.11], [0.68, 0.64, 0.08]]) {
    c.beginPath(); c.moveTo(x + dx * s, y + (dy - r * 1.6) * s); c.quadraticCurveTo(x + (dx + r) * s, y + dy * s, x + dx * s, y + (dy + r) * s);
    c.quadraticCurveTo(x + (dx - r) * s, y + dy * s, x + dx * s, y + (dy - r * 1.6) * s); c.fill();
  }
}

/** A sprite strip of every tile at `size` device pixels, so a frame draws each cell with one drawImage. */
export function paintSprites(canvas: HTMLCanvasElement, size: number) {
  canvas.width = size * TILE_COUNT;
  canvas.height = size;
  const c = canvas.getContext("2d")!;
  for (let colour = 1; colour <= 5; colour++) {
    for (const across of [true, false]) {
      for (let variant = 0; variant < TILE_KINDS; variant++) {
        const x = spriteIndex(colour, across, variant) * size;
        drawWeaveCell(c, x, 0, size, colour, across);
        if (variant === 1) wear(c, x, 0, size, colour * 7 + (across ? 3 : 0));
        if (variant === 2) wet(c, x, 0, size);
        if (colour === 5 && variant === 0) { c.fillStyle = "#fffbe0"; c.fillRect(x + size * 0.7, size * 0.12, size * 0.12, size * 0.12); }
      }
    }
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
export function drawBamboo(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, p: Pick<Palette, "bamboo" | "bambooLight" | "bambooDark" | "node"> = palette) {
  const along = w >= h, thick = along ? h : w, length = along ? w : h;
  c.fillStyle = p.bamboo;
  c.fillRect(x, y, w, h);
  c.fillStyle = p.bambooLight;
  if (along) c.fillRect(x, y + thick * 0.15, w, thick * 0.25); else c.fillRect(x + thick * 0.15, y, thick * 0.25, h);
  c.fillStyle = p.bambooDark;
  if (along) c.fillRect(x, y + thick * 0.8, w, thick * 0.2); else c.fillRect(x + thick * 0.8, y, thick * 0.2, h);
  c.fillStyle = p.node;
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
 * A নকশা motif centred at (0, 0), `s` across: বরফি (a diamond in a diamond), লতা (a curling leaf on its vine), শাপলা (eight
 * petals round a gold heart). `main` and `deep` colour it; a gold row passes gold.
 */
export function drawMotif(c: CanvasRenderingContext2D, motif: Motif, s: number, main: string, deep: string) {
  const r = s / 2;
  c.lineJoin = "round";
  if (motif === "borfi") {
    c.fillStyle = main;
    c.beginPath(); c.moveTo(0, -r); c.lineTo(r, 0); c.lineTo(0, r); c.lineTo(-r, 0); c.closePath(); c.fill();
    c.fillStyle = deep;
    c.beginPath(); c.moveTo(0, -r * 0.5); c.lineTo(r * 0.5, 0); c.lineTo(0, r * 0.5); c.lineTo(-r * 0.5, 0); c.closePath(); c.fill();
    c.fillStyle = main;
    c.fillRect(-r * 0.14, -r * 0.14, r * 0.28, r * 0.28);
  } else if (motif === "lota") {
    c.strokeStyle = deep; c.lineWidth = Math.max(1, s * 0.09); c.lineCap = "round";
    c.beginPath(); c.moveTo(-r * 0.9, r * 0.55); c.quadraticCurveTo(-r * 0.1, r * 0.9, r * 0.2, r * 0.1); c.quadraticCurveTo(r * 0.4, -r * 0.35, r * 0.05, -r * 0.45); c.stroke();
    c.fillStyle = main;
    c.beginPath(); c.moveTo(-r * 0.2, r * 0.45); c.quadraticCurveTo(-r * 0.95, -r * 0.05, -r * 0.35, -r * 0.85); c.quadraticCurveTo(r * 0.05, -r * 0.2, -r * 0.2, r * 0.45); c.fill();
    c.beginPath(); c.moveTo(r * 0.25, r * 0.2); c.quadraticCurveTo(r * 0.95, r * 0.05, r * 0.85, -r * 0.7); c.quadraticCurveTo(r * 0.3, -r * 0.45, r * 0.25, r * 0.2); c.fill();
  } else {
    c.fillStyle = main;
    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4;
      c.save(); c.rotate(a);
      c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(r * 0.38, -r * 0.5, 0, -r); c.quadraticCurveTo(-r * 0.38, -r * 0.5, 0, 0); c.fill();
      c.restore();
    }
    c.fillStyle = deep;
    c.beginPath(); c.arc(0, 0, r * 0.3, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#ffd75e";
    c.beginPath(); c.arc(0, 0, r * 0.15, 0, Math.PI * 2); c.fill();
  }
}

/** Motif colours per world: [main, deep], then the gold pair. */
export const MOTIF_INK: Record<Motif, readonly [string, string]> = {
  borfi: ["#fff4d6", "#a4492b"],
  lota: ["#cfe6a0", "#3e5619"],
  shapla: ["#ffe1ec", "#c2416e"],
};
export const GOLD_INK = ["#fff6c0", "#c88a10"] as const;

/** The সুই: a steel needle, eye up, with a loose end of cane thread. Drawn in a cell `s` wide at (x, y). */
export function drawNeedle(c: CanvasRenderingContext2D, x: number, y: number, s: number) {
  const cx = x + s / 2;
  c.strokeStyle = "#e8cf92"; c.lineWidth = Math.max(1, s * 0.07); c.lineCap = "round";
  c.beginPath(); c.moveTo(cx, y + s * 0.18); c.quadraticCurveTo(cx - s * 0.42, y + s * 0.05, cx - s * 0.3, y - s * 0.35); c.stroke();
  c.fillStyle = "#dfe6ee";
  c.beginPath(); c.moveTo(cx - s * 0.08, y + s * 0.1); c.lineTo(cx + s * 0.08, y + s * 0.1); c.lineTo(cx + s * 0.03, y + s * 0.95); c.lineTo(cx - s * 0.03, y + s * 0.95); c.closePath(); c.fill();
  c.fillStyle = "#7d8a99";
  c.fillRect(cx - s * 0.02, y + s * 0.16, s * 0.04, s * 0.14);
  c.fillStyle = "#ffffff";
  c.fillRect(cx - s * 0.06, y + s * 0.36, s * 0.03, s * 0.42);
}

/** The title's start button art: a শীতলপাটি rolled and tied, half open so its নকশা shows, lying on the floor. */
export function drawStartArt(canvas: HTMLCanvasElement, width: number, height: number, motif: Motif) {
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  const c = canvas.getContext("2d")!;
  c.setTransform(ratio, 0, 0, ratio, 0, 0);
  c.clearRect(0, 0, width, height);
  const s = Math.min(width / 9.2, height / 4.6), mat = s * 8, x0 = (width - mat - s * 1.2) / 2, y0 = height * 0.12;
  // The open part of the mat: three woven rows with the motif, lying at a slight angle.
  c.save();
  c.translate(x0, y0);
  c.fillStyle = "#00000022";
  c.fillRect(s * 0.25, s * 0.35, mat, s * 3);
  const rows = [[1, 4, 1, 2, 2, 1, 4, 1], [4, 2, 3, 3, 3, 3, 2, 4], [1, 4, 1, 2, 2, 1, 4, 1]];
  rows.forEach((row, ry) => row.forEach((colour, rx) => drawWeaveCell(c, rx * s, ry * s, s, colour, (rx + ry) % 2 === 0)));
  const [main, deep] = MOTIF_INK[motif];
  for (let k = 0; k < 4; k++) { c.save(); c.translate(s * (1 + k * 2), s * 1.5); drawMotif(c, motif, s * 0.9, main, deep); c.restore(); }
  c.fillStyle = CANE[4].dark;
  c.fillRect(-s * 0.1, 0, s * 0.1, s * 3); c.fillRect(mat, 0, s * 0.1, s * 3);
  c.restore();
  // The rolled part, with twine.
  const rollY = y0 + s * 3 + s * 0.55;
  drawRoll(c, x0 - s * 0.2, rollY, mat + s * 0.9, s * 1.1);
  c.fillStyle = "#7a5a2e";
  c.fillRect(x0 + mat * 0.22, rollY - s * 0.6, s * 0.16, s * 1.2);
  c.fillRect(x0 + mat * 0.72, rollY - s * 0.6, s * 0.16, s * 1.2);
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
    for (let col = 0; col < COLS; col++) drawWeaveCell(c, x + col * cell, top, cell, ((row >> (col * 2)) & 3) + 1, (col + index) % 2 === 0);
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
