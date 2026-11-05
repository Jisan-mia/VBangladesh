// The title's big start art and the three story panels, drawn in a 1080 × 1080 space (the card's) and scaled to fit.
import { drawFood, drawHead, drawThonga, drawTin, palette, type WorldPalette } from "./art";
import type { Kind } from "./rules";

export const STORY = [
  "বিকেলের ইস্টিশন। ঝালমুড়িওয়ালা ঠোঙা ভরছে।",
  "মুড়ির ভেতর থেকে উঁকি দিল একটা ছোট্ট সাপ।",
  "সব খাবে সে। শুধু টিনে আর নিজের লেজে ধাক্কা নয়।",
] as const;

const SIZE = 1080;

function begin(canvas: HTMLCanvasElement, width: number, height: number) {
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  const c = canvas.getContext("2d");
  if (!c) return null;
  const scale = Math.min(width, height) / SIZE * ratio;
  c.setTransform(scale, 0, 0, scale, (width * ratio - SIZE * scale) / 2, (height * ratio - SIZE * scale) / 2);
  return c;
}

/** The snake rising out of the heap in an S, looking right. */
function peek(c: CanvasRenderingContext2D, baseX: number, baseY: number, rise: number, width: number) {
  c.lineCap = "round"; c.lineJoin = "round";
  for (const [line, color] of [[width * 1.26, palette.snakeEdge], [width, palette.snake]] as const) {
    c.lineWidth = line; c.strokeStyle = color;
    c.beginPath();
    for (let i = 0; i <= 30; i++) {
      const t = i / 30, x = baseX + 70 * Math.sin(t * Math.PI * 1.6), y = baseY - rise * t;
      if (i) c.lineTo(x, y); else c.moveTo(x, y);
    }
    c.stroke();
  }
  drawHead(c, baseX + 70 * Math.sin(Math.PI * 1.6), baseY - rise, width * 0.8, -0.5, false, true);
}

/** The title's start art: the ঠোঙা with the snake peeking out, on a warm glow. */
export function drawStartArt(canvas: HTMLCanvasElement, width: number, height: number) {
  const c = begin(canvas, width, height);
  if (!c) return;
  const glow = c.createRadialGradient(540, 560, 60, 540, 560, 560);
  glow.addColorStop(0, "#f8cf5a"); glow.addColorStop(1, "#f8cf5a00");
  c.fillStyle = glow; c.fillRect(0, 0, SIZE, SIZE);
  peek(c, 560, 520, 300, 64);
  drawThonga(c, 520, 560, 960, 300);
  drawFood(c, "sonali", 820, 260, 54);
  drawFood(c, "chanachur", 230, 330, 40);
}

export function drawStoryPanel(canvas: HTMLCanvasElement, width: number, height: number, index: number, colors: WorldPalette) {
  const c = begin(canvas, width, height);
  if (!c) return;
  c.save();
  c.beginPath(); c.roundRect(20, 20, SIZE - 40, SIZE - 40, 36); c.clip();
  if (index === 0) {
    // A dusky platform: the sky, a roof line, and the ঠোঙা being filled, মুড়ি falling in.
    const sky = c.createLinearGradient(0, 0, 0, SIZE);
    sky.addColorStop(0, "#f39a5b"); sky.addColorStop(0.6, "#f7cf7d"); sky.addColorStop(1, "#d9d3c2");
    c.fillStyle = sky; c.fillRect(0, 0, SIZE, SIZE);
    c.fillStyle = "#5b3b2a"; c.fillRect(0, 120, SIZE, 30);
    for (let x = 60; x < SIZE; x += 200) c.fillRect(x, 150, 18, 520);
    c.fillStyle = "#c8c2b2"; c.fillRect(0, 820, SIZE, 260);
    c.fillStyle = "#e8b730"; c.fillRect(0, 820, SIZE, 16);
    drawThonga(c, 540, 600, 960, 240);
    for (let i = 0; i < 14; i++) drawFood(c, "muri", 420 + ((i * 53) % 240), 260 + ((i * 97) % 280), 20);
  } else if (index === 1) {
    c.fillStyle = "#f2b733"; c.fillRect(0, 0, SIZE, SIZE);
    peek(c, 560, 560, 260, 70);
    drawThonga(c, 540, 600, 980, 270);
    c.fillStyle = "#2a1d14"; c.font = "800 120px sans-serif"; c.textAlign = "center";
    c.fillText("?", 860, 300);
  } else {
    // The tin tray: a stretch of board, a snake turning towards a golden chilli, tin on two sides.
    c.fillStyle = colors.board; c.fillRect(0, 0, SIZE, SIZE);
    c.fillStyle = colors.boardAlt;
    for (let y = 0; y < 9; y++) for (let x = y % 2; x < 9; x += 2) c.fillRect(60 + x * 110, 60 + y * 110, 110, 110);
    drawTin(c, 0, 0, SIZE, 60, "x"); drawTin(c, 0, 0, 60, SIZE, "y"); drawTin(c, 0, SIZE - 60, SIZE, 60, "x"); drawTin(c, SIZE - 60, 0, 60, SIZE, "y");
    drawTin(c, 280, 280, 330, 110, "x");
    const path: Array<[number, number]> = [[225, 945], [225, 835], [225, 725], [225, 615], [335, 615], [445, 615], [555, 615], [665, 615], [775, 615], [775, 505]];
    c.lineCap = "round"; c.lineJoin = "round";
    for (const [line, color] of [[96, palette.snakeEdge], [76, palette.snake]] as const) {
      c.lineWidth = line; c.strokeStyle = color; c.beginPath();
      path.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke();
    }
    drawHead(c, 775, 505, 55, -Math.PI / 2, false, true);
    drawFood(c, "sonali", 775, 280, 52);
    const foods: Kind[] = ["chanachur", "peyaj", "tetul"];
    foods.forEach((kind, i) => drawFood(c, kind, 330 + i * 230, 830, 42));
  }
  c.restore();
}
