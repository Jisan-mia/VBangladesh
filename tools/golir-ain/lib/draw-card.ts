import { cardSizes, drawFooterBand, fitText, renderCard, wrapText, BODY_FONT, DISPLAY_FONT, type CardFormat } from "../../../shared/card-canvas";
import { ainLine, bn, inOrder, matchLine, type Ain } from "./ain";

const CHALK = "#fbf7ee";
const YELLOW = "#ffd977";
const CHARCOAL = "#1f1513";
const MORTAR = "#c4ad98";
const BRICKS = ["#a5432a", "#9b3c25", "#ad4b2f", "#943a21", "#a2472f", "#b0553a"];

/** Small seeded PRNG so the same wall always gets the same bricks and chalk grain. */
function random(seed: number) {
  return () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function drawBricks(context: CanvasRenderingContext2D, width: number, height: number) {
  const next = random(7), brickW = 176, brickH = 56, gap = 8;
  context.fillStyle = MORTAR;
  context.fillRect(0, 0, width, height);
  for (let row = 0, y = 0; y < height; row++, y += brickH + gap) {
    for (let x = row % 2 ? -brickW / 2 : 0; x < width; x += brickW + gap) {
      context.fillStyle = BRICKS[Math.floor(next() * BRICKS.length)];
      context.fillRect(x, y, brickW, brickH);
      context.fillStyle = "rgba(0,0,0,.08)";
      context.fillRect(x, y + brickH - 8, brickW, 8);
    }
  }
  // Soot toward the bottom keeps chalk readable and grounds the stumps.
  const soot = context.createLinearGradient(0, 0, 0, height);
  soot.addColorStop(0, "rgba(40,12,6,.22)");
  soot.addColorStop(1, "rgba(30,8,4,.5)");
  context.fillStyle = soot;
  context.fillRect(0, 0, width, height);
}

/** Charcoal stumps the way kids draw them on a wall: a box, three sticks, two bails. */
function drawStumps(context: CanvasRenderingContext2D, x: number, y: number, height: number) {
  const width = height * 0.56;
  context.strokeStyle = CHARCOAL;
  context.lineCap = "round";
  context.lineJoin = "round";
  for (const [dx, dy, lineWidth] of [[0, 0, 12], [4, -3, 5]]) {
    context.lineWidth = lineWidth;
    context.beginPath();
    for (const fraction of [0.12, 0.5, 0.88]) { context.moveTo(x + dx + width * fraction, y + dy + 14); context.lineTo(x + dx + width * fraction + 2, y + dy + height); }
    context.moveTo(x + dx + width * 0.08, y + dy + 8); context.lineTo(x + dx + width * 0.48, y + dy + 6);
    context.moveTo(x + dx + width * 0.54, y + dy + 6); context.lineTo(x + dx + width * 0.94, y + dy + 9);
    context.moveTo(x + dx - 30, y + dy + height + 4); context.lineTo(x + dx + width + 34, y + dy + height);
    context.stroke();
  }
}

/** Rubs out tiny specks so text and lines read as chalk and charcoal, not print. */
function grain(context: CanvasRenderingContext2D, width: number, height: number) {
  const next = random(11);
  context.globalCompositeOperation = "destination-out";
  context.fillStyle = "rgba(0,0,0,.55)";
  for (let index = 0; index < (width * height) / 36; index++) context.fillRect(next() * width, next() * height, 1 + next() * 2.5, 1 + next() * 2);
  context.globalCompositeOperation = "source-over";
}

const layouts = {
  feed: { title: 150, para: 226, rulesTop: 300, stumpsTop: 900, stumpsHeight: 280, maxLine: 96 },
  story: { title: 360, para: 440, rulesTop: 520, stumpsTop: 1310, stumpsHeight: 290, maxLine: 118 },
} as const;

function drawRules(context: CanvasRenderingContext2D, ain: Ain, top: number, bottom: number, maxLine: number) {
  const ticked = inOrder(ain.ticked);
  const count = ticked.length;
  if (!count) return;
  const single = (bottom - top) / count >= 60;
  const columns = single ? 1 : 2;
  const rows = Math.ceil(count / columns);
  const lineHeight = Math.min(single ? maxLine : 70, (bottom - top) / rows);
  const size = Math.round(lineHeight * (single ? 0.62 : 0.6));
  const columnWidth = (1080 - 84 * 2 - (columns - 1) * 40) / columns;
  ticked.forEach((rule, index) => {
    const column = Math.floor(index / rows), row = index % rows;
    const x = 84 + column * (columnWidth + 40), y = top + row * lineHeight + size;
    fitText(context, [{ text: `${bn(index + 1)}. `, color: YELLOW, weight: 700, display: true }, { text: rule.label, color: CHALK, weight: 600 }], x, y, size, columnWidth);
  });
}

export function drawCard(canvas: HTMLCanvasElement, ain: Ain, format: CardFormat, site: string, friend?: Ain | null) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  const chalkCanvas = document.createElement("canvas");
  chalkCanvas.width = width;
  chalkCanvas.height = height;
  const chalk = chalkCanvas.getContext("2d");
  if (!context || !chalk) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  drawBricks(context, width, height);

  chalk.shadowColor = "rgba(255,255,255,.35)";
  chalk.shadowBlur = 3;
  const titleSize = fitText(chalk, [{ text: "আমাদের পাড়ার আইন", color: CHALK, weight: 800, display: true }], 84, layout.title, 92, 912);
  chalk.font = `800 ${titleSize}px ${DISPLAY_FONT}`;
  const titleWidth = chalk.measureText("আমাদের পাড়ার আইন").width;
  chalk.strokeStyle = CHALK;
  chalk.lineWidth = 5;
  chalk.lineCap = "round";
  chalk.beginPath(); chalk.moveTo(86, layout.title + 26); chalk.quadraticCurveTo(84 + titleWidth / 2, layout.title + 12, 84 + titleWidth, layout.title + 24); chalk.stroke();
  fitText(chalk, [{ text: ain.para ? `· ${ain.para} ·` : "· গলির ক্রিকেট ·", color: YELLOW, weight: 700, display: true }], 84, layout.para, 50, 912);
  drawRules(chalk, ain, layout.rulesTop, layout.stumpsTop - 24, layout.maxLine);

  const lineWidth = 700;
  chalk.font = `700 46px ${BODY_FONT}`;
  const text = ainLine(ain.ticked);
  // A line that is only a little too wide reads better shrunk onto one line than with an orphaned last word.
  const lines = chalk.measureText(text).width <= lineWidth * 1.15 ? [text] : wrapText(chalk, text, lineWidth, 2);
  const match = matchLine(ain.ticked, friend ?? null);
  let y = layout.stumpsTop + layout.stumpsHeight - 40 - (lines.length - (match ? 0 : 1)) * 62;
  for (const line of lines) { fitText(chalk, [{ text: line, color: CHALK, weight: 700 }], 84, y, 46, lineWidth); y += 62; }
  if (match) fitText(chalk, [{ text: match, color: YELLOW, weight: 700 }], 84, y + 6, 36, lineWidth);
  chalk.shadowBlur = 0;
  drawStumps(chalk, 846, layout.stumpsTop, layout.stumpsHeight);
  grain(chalk, width, height);
  context.drawImage(chalkCanvas, 0, 0);

  drawFooterBand(context, format, "তোমার গলির আইন কী ছিল?", site, { band: "#231816", ask: YELLOW, site: CHALK });
}

export const cardBlob = (ain: Ain, format: CardFormat, site: string, friend?: Ain | null) => renderCard(canvas => drawCard(canvas, ain, format, site, friend));
