import { cardSizes, drawFooterBand, fitText, renderCard, type CardFormat } from "../../../shared/card-canvas";
import { possessive } from "../../../shared/bangla";
import { cleanName } from "../../../shared/game-core";
import { drawFruit, drawPicture, fruitFont } from "./art";
import { starsOf } from "./game";
import { levelOf } from "./levels";
import { bn, humanLine, levelLabel, shortTitle, tallyLine, type Shared } from "./link";

const colors = { bg: "#fff6dc", rule: "#f0e2b8", margin: "#e8a0a0", ink: "#3b2a17", muted: "#7a6a52", accent: "#2f7d32", star: "#f2a900", starOff: "#e3d6b3", band: "#2f5d2a", ask: "#ffd447" };

function star(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + i * Math.PI / 5, radius = i % 2 ? r * 0.45 : r;
    c.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
  }
  c.closePath(); c.fillStyle = fill; c.fill();
}

/** The level as a primer page: every letter (or number) on its fruit, or every word with its picture. */
function drawPage(c: CanvasRenderingContext2D, level: number, x0: number, y0: number, width: number, height: number) {
  const spec = levelOf(level);
  const words = spec.items.filter(item => item.word);
  if (words.length) {
    const cell = width / words.length, size = Math.min(cell * 0.8, height * 0.6), top = y0 + (height - size - 110) / 2;
    words.forEach((item, i) => {
      const cx = x0 + cell * (i + 0.5);
      drawPicture(c, item.pic, cx, top + size / 2, size);
      fitText(c, [{ text: item.word!, color: colors.ink, weight: 800, display: true }], cx, top + size + 90, 72, cell - 20, "center");
    });
    return;
  }
  const n = spec.items.length, cols = n <= 6 ? n : n <= 12 ? 6 : 5, rows = Math.ceil(n / cols);
  const cell = Math.min(width / cols, height / rows), scale = Math.min(2.8, (cell * 0.42) / 27);
  spec.items.forEach((item, i) => {
    const row = Math.floor(i / cols), inRow = Math.min(cols, n - row * cols);
    const cx = x0 + width / 2 + (i % cols - (inRow - 1) / 2) * (width / cols), cy = y0 + (row + 0.5) * (height / rows) + 10;
    drawFruit(c, cx, cy, item.text, fruitFont(c, item.text), spec.world, scale);
  });
}

export function drawCard(canvas: HTMLCanvasElement, shared: Shared, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const story = format === "story", cx = width / 2, top = story ? 250 : 0, name = cleanName(shared.name);
  const stars = starsOf(shared.level, shared.errors);

  // A খাতা page: ruled lines and a red margin.
  c.fillStyle = colors.bg; c.fillRect(0, 0, width, height);
  c.strokeStyle = colors.rule; c.lineWidth = 3;
  for (let y = 120; y < height; y += 72) { c.beginPath(); c.moveTo(0, y); c.lineTo(width, y); c.stroke(); }
  c.strokeStyle = colors.margin; c.beginPath(); c.moveTo(70, 0); c.lineTo(70, height); c.stroke();

  drawPicture(c, "snake", 170, top + 150, 170);
  fitText(c, [{ text: `অ-তে অজগর · ${levelLabel(shared.level)}`, color: colors.muted, weight: 700, display: true }], cx + 60, top + 92, 38, 640, "center");
  fitText(c, [{ text: `${name ? possessive(name) : "আমার"} ঝুড়িতে`, color: colors.ink, weight: 800, display: true }], cx + 60, top + 180, 58, 640, "center");
  fitText(c, [{ text: shortTitle(shared.level), color: colors.accent, weight: 800, display: true }], cx, top + 318, 112, 940, "center");
  for (let i = 0; i < 3; i++) star(c, cx + (i - 1) * 84, top + 392, 32, i < stars ? colors.star : colors.starOff);

  const pageTop = top + 450, pageBottom = story ? height - 560 : height - 330;
  drawPage(c, shared.level, 110, pageTop, width - 180, pageBottom - pageTop);

  fitText(c, [{ text: humanLine(shared), color: colors.ink, weight: 800, display: true }], cx, pageBottom + (story ? 110 : 80), story ? 50 : 44, 940, "center");
  fitText(c, [{ text: tallyLine(shared), color: colors.muted, weight: 600 }], cx, pageBottom + (story ? 178 : 140), story ? 38 : 32, 940, "center");
  drawFooterBand(c, format, "তুমি একটাও ভুল ছাড়া পারবে?", site, { band: colors.band, ask: colors.ask, site: "#ffffff" });
}

export const cardBlob = (shared: Shared, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, shared, format, site));
export const cardFontSample = (shared: Shared) => `অ-তে অজগর ${levelLabel(shared.level)} ${shortTitle(shared.level)} ${humanLine(shared)} ${tallyLine(shared)} ঝুড়িতে ${bn(0)} ${levelOf(shared.level).items.map(item => item.word ?? item.text).join(" ")}`;
