// All the game's art, drawn in code: a picture as cross-stitch on cloth (the end screen, the sheet's thumbnails, the title and
// the card all use this one renderer, so they agree), the title patch with its needle, and the three story panels.
// Everything is drawn once per size at up to 2× pixels and cached, never per frame.
import { roundedRect } from "../../../shared/card-canvas";
import { puzzleOf } from "./game";

export type Look = { paper: string; cloth: string; edge: string; deep: string };
/** One look per world: the stage's paper, the cloth, the thread of the running stitch and a deep shade for labels. */
export const LOOKS: readonly Look[] = [
  { paper: "#f6efe1", cloth: "#fbf5e8", edge: "#b5452b", deep: "#7a2a18" },
  { paper: "#e3efe0", cloth: "#f4f8ef", edge: "#2f7d5a", deep: "#1c5239" },
  { paper: "#1b2440", cloth: "#f3ead6", edge: "#f2c45a", deep: "#c7962a" },
];

const hex = (color: string) => [1, 3, 5].map(at => parseInt(color.slice(at, at + 2), 16));
/** `color` mixed towards white (amount > 0) or black (amount < 0). */
function shade(color: string, amount: number) {
  const target = amount < 0 ? 0 : 255, t = Math.abs(amount);
  return `rgb(${hex(color).map(part => Math.round(part + (target - part) * t)).join(",")})`;
}
const luminance = (color: string) => { const [r, g, b] = hex(color); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };

/** One cross-stitch: a faint block under two crossed, round-capped threads with a shadow and a highlight. */
function cross(c: CanvasRenderingContext2D, x: number, y: number, cell: number, color: string) {
  const m = cell * 0.14, w = cell * 0.26, lo = shade(color, -0.3), hi = shade(color, 0.4);
  c.globalAlpha = 0.5; c.fillStyle = color; roundedRect(c, x + cell * 0.05, y + cell * 0.05, cell * 0.9, cell * 0.9, cell * 0.2); c.fill(); c.globalAlpha = 1;
  c.lineCap = "round";
  c.strokeStyle = lo; c.lineWidth = w;
  c.beginPath(); c.moveTo(x + m, y + m + cell * 0.05); c.lineTo(x + cell - m, y + cell - m + cell * 0.05); c.moveTo(x + cell - m, y + m + cell * 0.05); c.lineTo(x + m, y + cell - m + cell * 0.05); c.stroke();
  c.strokeStyle = color; c.lineWidth = w * 0.82;
  c.beginPath(); c.moveTo(x + m, y + m); c.lineTo(x + cell - m, y + cell - m); c.moveTo(x + cell - m, y + m); c.lineTo(x + m, y + cell - m); c.stroke();
  c.strokeStyle = hi; c.lineWidth = Math.max(0.8, w * 0.2);
  c.beginPath(); c.moveTo(x + m, y + m - w * 0.2); c.lineTo(x + cell - m, y + cell - m - w * 0.2); c.stroke();
}

/** The cloth: a colour with a faint weave. */
function weave(c: CanvasRenderingContext2D, x: number, y: number, side: number, step: number) {
  c.save();
  c.beginPath(); c.rect(x, y, side, side); c.clip();
  c.lineWidth = 1;
  for (let at = step / 2; at < side; at += step) {
    c.strokeStyle = "rgba(255,255,255,0.2)"; c.beginPath(); c.moveTo(x + at, y); c.lineTo(x + at, y + side); c.stroke();
    c.strokeStyle = "rgba(60,40,20,0.05)"; c.beginPath(); c.moveTo(x, y + at); c.lineTo(x + side, y + at); c.stroke();
  }
  c.restore();
}

/** A running stitch round the edge of a rounded square. */
function running(c: CanvasRenderingContext2D, x: number, y: number, side: number, inset: number, radius: number, color: string, dash: number) {
  c.save();
  c.setLineDash([dash, dash * 0.8]); c.lineWidth = Math.max(1.5, dash * 0.34); c.lineCap = "round"; c.strokeStyle = color;
  roundedRect(c, x + inset, y + inset, side - inset * 2, side - inset * 2, radius); c.stroke();
  c.restore();
}

/** A level's picture as a stitched patch: cloth, a cross-stitch per filled cell, a running stitch round the edge. */
export function drawPatch(c: CanvasRenderingContext2D, level: number, x: number, y: number, side: number, shadow = true) {
  const { size, picture } = puzzleOf(level), pad = side * 0.075, cell = (side - pad * 2) / size, radius = side * 0.05;
  c.save();
  if (shadow) { c.fillStyle = "rgba(60,40,20,0.2)"; roundedRect(c, x + side * 0.012, y + side * 0.03, side, side, radius); c.fill(); }
  c.fillStyle = picture.bg; roundedRect(c, x, y, side, side, radius); c.fill();
  weave(c, x, y, side, Math.max(3, cell / 4));
  picture.art.forEach((row, r) => [...row].forEach((letter, col) => {
    if (letter !== ".") cross(c, x + pad + col * cell, y + pad + r * cell, cell, picture.colors[letter]);
  }));
  running(c, x, y, side, pad * 0.42, radius * 0.7, luminance(picture.bg) < 0.4 ? "#f2d58a" : "#b5452b", Math.max(5, side * 0.035));
  c.restore();
}

const cache = new Map<string, HTMLCanvasElement>();
/** The patch pre-rendered to a square canvas of `px` pixels (cached; small sizes for thumbnails, large for the end screen). */
export function paintCanvas(level: number, px: number) {
  const size = Math.max(16, Math.round(px)), key = `${level}:${size}`;
  let canvas = cache.get(key);
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    // The patch fills the canvas; the shadow is left to the page.
    drawPatch(canvas.getContext("2d")!, level, 0, 0, size, false);
    if (cache.size > 40) cache.delete(cache.keys().next().value!);
    cache.set(key, canvas);
  }
  return canvas;
}

/** Sizes a canvas for `width × height` CSS pixels at up to 2× and returns a context in CSS pixels. */
function setup(canvas: HTMLCanvasElement, width: number, height: number) {
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  const c = canvas.getContext("2d")!;
  c.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { c, ratio };
}

/** A needle lying at an angle with its thread curling away from the eye. */
function needle(c: CanvasRenderingContext2D, x: number, y: number, length: number, angle: number, thread: string) {
  c.save();
  c.translate(x, y); c.rotate(angle);
  // the thread, from the eye back along a loose curve
  c.strokeStyle = thread; c.lineWidth = Math.max(2, length * 0.03); c.lineCap = "round";
  c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-length * 0.25, -length * 0.22, -length * 0.45, length * 0.2, -length * 0.55, -length * 0.02); c.stroke();
  const steel = c.createLinearGradient(0, -length * 0.02, 0, length * 0.02);
  steel.addColorStop(0, "#f4f6f8"); steel.addColorStop(1, "#8b95a0");
  c.fillStyle = steel;
  c.beginPath(); c.moveTo(-length * 0.02, -length * 0.018); c.lineTo(length * 0.9, 0); c.lineTo(-length * 0.02, length * 0.018); c.closePath(); c.fill();
  c.strokeStyle = "#5c6670"; c.lineWidth = 1.2;
  c.beginPath(); c.ellipse(length * 0.04, 0, length * 0.02, length * 0.009, 0, 0, Math.PI * 2); c.stroke();
  c.restore();
}

/** The title's start button: the level's cloth patch. A cleared level wears its picture; a new one shows the pale grid and a needle. */
export function drawPatchTitle(canvas: HTMLCanvasElement, width: number, height: number, level: number, world: number, cleared: boolean) {
  const { c } = setup(canvas, width, height), look = LOOKS[world] ?? LOOKS[0];
  const { size } = puzzleOf(level), side = Math.min(width, height) * 0.86, x = (width - side) / 2, y = (height - side) / 2 - side * 0.02;
  if (cleared) {
    drawPatch(c, level, x, y, side);
  } else {
    const radius = side * 0.05, pad = side * 0.075, cell = (side - pad * 2) / size;
    c.fillStyle = "rgba(60,40,20,0.2)"; roundedRect(c, x + side * 0.012, y + side * 0.03, side, side, radius); c.fill();
    c.fillStyle = look.cloth; roundedRect(c, x, y, side, side, radius); c.fill();
    weave(c, x, y, side, Math.max(3, cell / 4));
    // the empty grid, as small pale plus-stitches at each cell's corner
    c.strokeStyle = look.edge; c.globalAlpha = 0.32; c.lineWidth = Math.max(1, cell * 0.06); c.lineCap = "round";
    const arm = cell * 0.12;
    for (let r = 0; r <= size; r++) for (let col = 0; col <= size; col++) {
      const px = x + pad + col * cell, py = y + pad + r * cell;
      c.beginPath(); c.moveTo(px - arm, py); c.lineTo(px + arm, py); c.moveTo(px, py - arm); c.lineTo(px, py + arm); c.stroke();
    }
    c.globalAlpha = 1;
    running(c, x, y, side, pad * 0.42, radius * 0.7, look.edge, Math.max(5, side * 0.035));
    needle(c, x + side * 0.28, y + side * 0.62, side * 0.62, -0.5, look.edge);
  }
}

export const STORY = [
  "নানির কাঁথা এখনো আধখানা। ত্রিশটা ঘর খালি পড়ে আছে।",
  "প্রতিটা সংখ্যা বলে দেয়, কয়টা ঘরে ফোঁড় দিতে হবে।",
  "ফোঁড়ে ফোঁড়ে ছবি ফোটাও। উঠান থেকে নদীর ঘাট।",
] as const;

/** One story panel, drawn like a page of a picture book: the folded কাঁথা, the numbers, the bloom. */
export function drawStoryPanel(canvas: HTMLCanvasElement, width: number, height: number, panel: number) {
  const { c, ratio } = setup(canvas, width, height), w = width, h = height, look = LOOKS[0];
  const wall = c.createLinearGradient(0, 0, 0, h);
  wall.addColorStop(0, "#f3e7cf"); wall.addColorStop(1, "#e6d4b0");
  c.fillStyle = wall; c.fillRect(0, 0, w, h);
  // the wooden cot the কাঁথা rests on
  c.fillStyle = "#7a4e2c"; c.fillRect(0, h * 0.8, w, h * 0.2);
  c.fillStyle = "#94603a"; c.fillRect(0, h * 0.8, w, h * 0.03);
  const side = Math.min(w, h) * 0.64, x = (w - side) / 2, y = h * 0.14;
  const rug = (px: number, py: number, s: number) => {
    c.fillStyle = "rgba(60,40,20,0.18)"; roundedRect(c, px + 3, py + 6, s, s, s * 0.04); c.fill();
    c.fillStyle = look.cloth; roundedRect(c, px, py, s, s, s * 0.04); c.fill();
    weave(c, px, py, s, 4);
  };
  if (panel === 0) {
    rug(x, y, side);
    const third = side / 3;
    for (let index = 0; index < 9; index++) {
      const px = x + (index % 3) * third + third * 0.08, py = y + Math.floor(index / 3) * third + third * 0.08, s = third * 0.84;
      if (index < 2) { const patch = paintCanvas(index + 1, s * ratio); c.drawImage(patch, px, py, s, s); }
      else {
        c.fillStyle = "rgba(181,69,43,0.07)"; roundedRect(c, px, py, s, s, s * 0.06); c.fill();
        c.strokeStyle = "rgba(181,69,43,0.45)"; c.lineWidth = 1.5; c.setLineDash([5, 4]); roundedRect(c, px, py, s, s, s * 0.06); c.stroke(); c.setLineDash([]);
      }
    }
    running(c, x, y, side, side * 0.015, side * 0.03, look.edge, side * 0.04);
    needle(c, w * 0.58, h * 0.78, side * 0.66, -0.2, look.edge);
  } else if (panel === 1) {
    rug(x, y, side);
    // a small 4×4 nonogram: beads for the numbers, a few cross-stitches in
    const n = 4, gx = x + side * 0.3, gy = y + side * 0.3, cell = (side * 0.62) / n;
    const solution = [[1, 1, 0, 1], [1, 0, 0, 1], [1, 1, 1, 1], [0, 1, 1, 0]];
    c.strokeStyle = "#b9a37b"; c.lineWidth = 1.2;
    for (let i = 0; i <= n; i++) { c.beginPath(); c.moveTo(gx + i * cell, gy); c.lineTo(gx + i * cell, gy + n * cell); c.moveTo(gx, gy + i * cell); c.lineTo(gx + n * cell, gy + i * cell); c.stroke(); }
    const beads = (bx: number, by: number, count: number, dx: number, dy: number, color: string) => {
      for (let k = 0; k < count; k++) { c.fillStyle = color; c.beginPath(); c.arc(bx + k * dx, by + k * dy, cell * 0.11, 0, Math.PI * 2); c.fill(); }
    };
    const runsOf = (line: number[]) => { const out: number[] = []; let run = 0; for (const v of line) { if (v) run++; else if (run) { out.push(run); run = 0; } } if (run) out.push(run); return out; };
    for (let r = 0; r < n; r++) { let bx = gx - cell * 0.18; for (const run of runsOf(solution[r]).reverse()) { beads(bx - (run - 1) * cell * 0.24, gy + (r + 0.5) * cell, run, cell * 0.24, 0, "#7a2a18"); bx -= run * cell * 0.24 + cell * 0.12; } }
    for (let col = 0; col < n; col++) { let by = gy - cell * 0.18; for (const run of runsOf(solution.map(row => row[col])).reverse()) { beads(gx + (col + 0.5) * cell, by - (run - 1) * cell * 0.24, run, 0, cell * 0.24, "#7a2a18"); by -= run * cell * 0.24 + cell * 0.12; } }
    for (const [r, col] of [[2, 0], [2, 1], [2, 2], [2, 3], [0, 0], [1, 0]]) cross(c, gx + col * cell, gy + r * cell, cell, "#2c3e66");
    running(c, x, y, side, side * 0.015, side * 0.03, look.edge, side * 0.04);
    needle(c, w * 0.62, h * 0.8, side * 0.6, -0.9, look.edge);
  } else {
    rug(x, y, side);
    const patch = paintCanvas(11, side * 0.74 * ratio);
    c.drawImage(patch, x + side * 0.13, y + side * 0.13, side * 0.74, side * 0.74);
    running(c, x, y, side, side * 0.015, side * 0.03, look.edge, side * 0.04);
    // sparkles where it blooms
    c.fillStyle = "#f2a900";
    for (const [sx, sy, r] of [[0.1, 0.12, 0.05], [0.9, 0.2, 0.04], [0.14, 0.86, 0.035], [0.88, 0.84, 0.05]]) {
      const cx = x + side * sx, cy = y + side * sy, rr = side * r;
      c.beginPath(); c.moveTo(cx, cy - rr * 1.5); c.lineTo(cx + rr * 0.4, cy - rr * 0.4); c.lineTo(cx + rr * 1.5, cy); c.lineTo(cx + rr * 0.4, cy + rr * 0.4); c.lineTo(cx, cy + rr * 1.5); c.lineTo(cx - rr * 0.4, cy + rr * 0.4); c.lineTo(cx - rr * 1.5, cy); c.lineTo(cx - rr * 0.4, cy - rr * 0.4); c.closePath(); c.fill();
    }
    needle(c, w * 0.6, h * 0.8, side * 0.6, -0.12, look.edge);
  }
}
