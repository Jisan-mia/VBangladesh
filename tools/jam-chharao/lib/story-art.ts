// The first-run story: three comic panels drawn in code, each a jam from the ladder with a little drama on top.
import { drawJam, lookOf, boardHeight, boardWidth, cellX, cellY, palette } from "./art";
import { COLS, type Layout } from "./board";
import { layoutOf } from "./game";

export const STORY: readonly string[] = [
  "অফিস ছুটির সময়। মোড়ে মোড়ে জ্যাম।",
  "তোমার সবুজ CNG আটকা। ওপরের ফাঁকটাই বেরোনোর পথ।",
  "গাড়ি শুধু নিজের লাইনে চলে। টেনে সরাও, পথ করে দাও।",
];
const PANEL_JAMS = [8, 3, 1] as const;

function bubble(c: CanvasRenderingContext2D, x: number, y: number, text: string, size: number) {
  c.font = `800 ${size}px var(--font-display), sans-serif`;
  const w = c.measureText(text).width + size * 0.9, h = size * 1.5;
  c.fillStyle = "#fff"; c.strokeStyle = "#2b2118"; c.lineWidth = Math.max(2, size * 0.1);
  c.beginPath(); c.roundRect(x - w / 2, y - h / 2, w, h, h / 2); c.fill(); c.stroke();
  c.fillStyle = "#2b2118"; c.textAlign = "center"; c.textBaseline = "middle";
  c.fillText(text, x, y + size * 0.05);
}

function finger(c: CanvasRenderingContext2D, x: number, y: number, r: number) {
  c.fillStyle = "rgba(255,255,255,0.55)"; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#2b2118"; c.lineWidth = Math.max(2, r * 0.14); c.stroke();
  c.fillStyle = "rgba(43,33,24,0.3)"; c.beginPath(); c.arc(x, y, r * 0.35, 0, Math.PI * 2); c.fill();
}

export function drawStoryPanel(canvas: HTMLCanvasElement, width: number, height: number, panel: number) {
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  const c = canvas.getContext("2d");
  if (!c) return;
  c.scale(ratio, ratio);
  const lay: Layout = layoutOf(PANEL_JAMS[panel]);
  const world = panel === 0 ? 1 : 0, look = lookOf(world);
  c.fillStyle = look.paper; c.fillRect(0, 0, width, height);
  const cell = Math.min((width * 0.82) / (COLS + 0.6), (height * 0.84) / 8.1);
  const x = (width - boardWidth(cell)) / 2, y = height - boardHeight(cell) - height * 0.05;
  drawJam(c, lay, world, x, y, cell);
  const fontSize = Math.max(14, cell * 0.36);
  if (panel === 0) {
    bubble(c, x + cell * 1.4, y + cellY(1.2, cell), "পিঁ পিঁ!", fontSize);
    bubble(c, x + cell * 4.6, y + cellY(4.2, cell), "ভোঁ ভোঁ!", fontSize);
    bubble(c, x + cell * 2.4, y + cellY(6.2, cell), "আরে সরো!", fontSize);
  } else if (panel === 1) {
    const hx = x + cellX(lay.cars[0].line + 0.5, cell), hy = y + cellY(lay.start[0] + 1, cell);
    c.strokeStyle = palette.exit; c.lineWidth = cell * 0.1; c.setLineDash([cell * 0.22, cell * 0.18]); c.beginPath(); c.arc(hx, hy, cell * 0.95, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
    c.strokeStyle = "#fff"; c.lineWidth = cell * 0.2; c.lineCap = "round"; c.lineJoin = "round";
    c.beginPath(); c.moveTo(hx, y + cellY(lay.start[0] - 0.2, cell)); c.lineTo(hx, y + cellY(-0.45, cell));
    c.moveTo(hx - cell * 0.28, y + cellY(-0.1, cell)); c.lineTo(hx, y + cellY(-0.5, cell)); c.lineTo(hx + cell * 0.28, y + cellY(-0.1, cell)); c.stroke();
    c.strokeStyle = palette.exit; c.lineWidth = cell * 0.09;
    c.beginPath(); c.moveTo(hx, y + cellY(lay.start[0] - 0.2, cell)); c.lineTo(hx, y + cellY(-0.45, cell));
    c.moveTo(hx - cell * 0.28, y + cellY(-0.1, cell)); c.lineTo(hx, y + cellY(-0.5, cell)); c.lineTo(hx + cell * 0.28, y + cellY(-0.1, cell)); c.stroke();
  } else {
    const car = lay.cars[1], at = lay.start[1];
    const fx = x + cellX(at + car.len / 2, cell), fy = y + cellY(car.line + 0.5, cell);
    c.strokeStyle = "#fff"; c.lineWidth = cell * 0.2; c.lineCap = "round"; c.lineJoin = "round";
    const ax = fx + cell * 0.2, bx = fx + cell * 1.7;
    c.beginPath(); c.moveTo(ax, fy); c.lineTo(bx, fy); c.moveTo(bx - cell * 0.3, fy - cell * 0.28); c.lineTo(bx, fy); c.lineTo(bx - cell * 0.3, fy + cell * 0.28); c.stroke();
    c.strokeStyle = palette.exit; c.lineWidth = cell * 0.09;
    c.beginPath(); c.moveTo(ax, fy); c.lineTo(bx, fy); c.moveTo(bx - cell * 0.3, fy - cell * 0.28); c.lineTo(bx, fy); c.lineTo(bx - cell * 0.3, fy + cell * 0.28); c.stroke();
    finger(c, fx, fy, cell * 0.42);
  }
  c.strokeStyle = look.ink; c.lineWidth = 3; c.strokeRect(1.5, 1.5, width - 3, height - 3);
}

/** The title's poster: the jam as it starts, filling the box, in its street's colours. */
export function drawPoster(canvas: HTMLCanvasElement, width: number, height: number, lay: Layout, world: number) {
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  const c = canvas.getContext("2d");
  if (!c) return;
  c.scale(ratio, ratio);
  const cell = Math.min(width / (COLS + 0.6), height / 8.1);
  drawJam(c, lay, world, (width - boardWidth(cell)) / 2, (height - boardHeight(cell)) / 2, cell);
}
