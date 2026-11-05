// The parent card (1080×1350): what was found, the stars, the finder's book so far, with no name.
import { cardSizes, drawFooterBand, fitText, renderCard } from "../../../shared/card-canvas";
import { BOX, dinoShapes, type Shape } from "./art";
import { bn, DIET_NAME, DINOS, dinoOf } from "./dinos";
import { doneLine, type Result } from "./round";
import { placeOf } from "./worlds";

const colors = { top: "#f3e4c1", low: "#e6cf9a", ink: "#2b1d12", muted: "#6b4f2e", star: "#e59a1f", starOff: "#d8c394", ground: "#c9a96a", band: "#2b1d12", ask: "#ffc861" };

/** Draws path-data shapes (the same ones the page renders as SVG) at x, y and a scale. */
export function drawShapes(c: CanvasRenderingContext2D, shapes: readonly Shape[], x: number, y: number, scale: number) {
  c.save();
  c.translate(x, y); c.scale(scale, scale);
  c.lineCap = "round"; c.lineJoin = "round";
  for (const shape of shapes) {
    const path = new Path2D(shape.d);
    c.globalAlpha = shape.opacity ?? 1;
    if (shape.fill && shape.fill !== "none") { c.fillStyle = shape.fill; c.fill(path); }
    if (shape.stroke) { c.strokeStyle = shape.stroke; c.lineWidth = shape.width ?? 1; c.stroke(path); }
  }
  c.restore();
}

function star(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + i * Math.PI / 5, radius = i % 2 ? r * 0.45 : r;
    c.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
  }
  c.closePath(); c.fillStyle = fill; c.fill();
}

export function drawCard(canvas: HTMLCanvasElement, result: Result, bookCount: number, site: string) {
  const { width, height } = cardSizes.feed;
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const sky = c.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, colors.top); sky.addColorStop(1, colors.low);
  c.fillStyle = sky; c.fillRect(0, 0, width, height);

  fitText(c, [{ text: `ডাইনোসর খুঁজি · লেভেল ${bn(placeOf(result.level))}`, color: colors.muted, weight: 700, display: true }], width / 2, 112, 38, 960, "center");
  fitText(c, [{ text: doneLine(result.level), color: colors.ink, weight: 800, display: true }], width / 2, 228, 68, 980, "center");
  for (let i = 0; i < 3; i++) star(c, width / 2 + (i - 1) * 86, 318, 34, i < result.stars ? colors.star : colors.starOff);

  // The finds on one strip of ground: two side by side, or the finale's giant alone and bigger.
  c.fillStyle = colors.ground; c.fillRect(0, 700, width, 26);
  const found = result.dinos.map(id => dinoOf(id)!).filter(Boolean);
  const big = found.length === 1;
  found.forEach((dino, i) => {
    const scale = big ? 2.3 : 2.05, x = big ? (width - BOX.width * scale) / 2 : 30 + i * 520, y = 700 - BOX.ground * scale, mid = big ? width / 2 : x + 250, room = big ? 900 : 470;
    drawShapes(c, dinoShapes(dino.look), x, y, scale);
    fitText(c, [{ text: dino.name, color: colors.ink, weight: 800, display: true }], mid, 800, 50, room, "center");
    fitText(c, [{ text: `${DIET_NAME[dino.diet]} · ${bn(dino.lengthM)} মিটার`, color: colors.muted, weight: 600 }], mid, 860, 36, room, "center");
  });

  fitText(c, [{ text: `খোঁজার বইয়ে এখন ${bn(DINOS.length)}টার ${bn(bookCount)}টা`, color: colors.ink, weight: 700 }], width / 2, 990, 44, 960, "center");
  const gap = 66, left = width / 2 - gap * (DINOS.length - 1) / 2;
  DINOS.forEach((_, i) => { c.beginPath(); c.arc(left + i * gap, 1050, 20, 0, Math.PI * 2); c.fillStyle = i < bookCount ? colors.star : colors.starOff; c.fill(); });
  fitText(c, [{ text: "পাখিরা আসলে এখনকার ডাইনোসর", color: colors.muted, weight: 700 }], width / 2, 1160, 40, 960, "center");
  drawFooterBand(c, "feed", "আজ একসাথে একটা পাখি খুঁজে দেখো", site, { band: colors.band, ask: colors.ask, site: "#ffffff" });
}

export const cardBlob = (result: Result, bookCount: number, site: string) => renderCard(canvas => drawCard(canvas, result, bookCount, site));
