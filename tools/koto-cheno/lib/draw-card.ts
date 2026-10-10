import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, type CardFormat } from "../../../shared/card-canvas";
import { bn, ownerOf, questions, type Card, type Mark } from "./slambook";

const PAPER = "#e6f1fb";
const INK = "#1d2b53";
const GEL = "#1d5c8a";
const PINK = "#e0457b";
const PINK_SOFT = "#fde2ec";
const STICKER = "#ffd166";
const RIGHT = "#2b8a3e";
const WRONG = "#d6336c";
const MUTED = "#5d6886";

function star(context: CanvasRenderingContext2D, cx: number, cy: number, outer: number, inner = outer * 0.48) {
  context.beginPath();
  for (let point = 0; point < 10; point++) {
    const radius = point % 2 ? inner : outer;
    const angle = -Math.PI / 2 + (point * Math.PI) / 5;
    context.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
  }
  context.closePath();
}

/** The slam-book page: pale printed paper, a dotted pink frame, spiral wire across the top, a few printed stars. */
function drawPage(context: CanvasRenderingContext2D, width: number, height: number, frameTop: number, frameBottom: number) {
  context.fillStyle = PAPER;
  context.fillRect(0, 0, width, height);
  context.strokeStyle = "#f2a7c3";
  context.lineWidth = 6;
  context.lineCap = "round";
  context.setLineDash([0.1, 18]);
  roundedRect(context, 36, frameTop, width - 72, frameBottom - frameTop, 30);
  context.stroke();
  context.setLineDash([]);
  for (let x = 66; x < width - 30; x += 68) {
    context.fillStyle = "#c3d6ea";
    context.beginPath(); context.arc(x, 64, 11, 0, Math.PI * 2); context.fill();
    context.strokeStyle = "#7d8ea6";
    context.lineWidth = 6;
    roundedRect(context, x - 8, -24, 16, 92, 8);
    context.stroke();
  }
  const decor: Array<[number, number, number, string]> = [[width - 92, frameTop + 70, 26, STICKER], [width - 140, frameTop + 120, 14, PINK], [width - 96, frameBottom - 40, 16, STICKER], [width - 136, frameBottom - 22, 9, PINK]];
  for (const [x, y, size, color] of decor) { context.fillStyle = color; star(context, x, y, size); context.fill(); }
}

function drawTape(context: CanvasRenderingContext2D, text: string, x: number, y: number) {
  context.save();
  context.translate(x, y);
  context.rotate(-0.035);
  context.font = `700 34px "Display", "Bangla"`;
  const width = Math.min(context.measureText(text).width + 64, 760);
  context.fillStyle = "rgba(255, 209, 102, 0.85)";
  context.fillRect(0, -44, width, 62);
  fitText(context, [{ text, color: INK, weight: 700, display: true }], 32, 0, 34, width - 64);
  context.restore();
}

function drawSticker(context: CanvasRenderingContext2D, mark: Mark | "hidden", cx: number, cy: number, radius: number) {
  context.lineCap = "round";
  context.lineJoin = "round";
  if (mark === "right" || mark === "wrong") {
    context.fillStyle = mark === "right" ? "#d6f2dd" : PINK_SOFT;
    context.beginPath(); context.arc(cx, cy, radius, 0, Math.PI * 2); context.fill();
    context.strokeStyle = mark === "right" ? RIGHT : WRONG;
    context.lineWidth = radius * 0.2;
    context.beginPath();
    if (mark === "right") { context.moveTo(cx - radius * 0.45, cy + radius * 0.02); context.lineTo(cx - radius * 0.1, cy + radius * 0.38); context.lineTo(cx + radius * 0.5, cy - radius * 0.38); }
    else { const arm = radius * 0.36; context.moveTo(cx - arm, cy - arm); context.lineTo(cx + arm, cy + arm); context.moveTo(cx + arm, cy - arm); context.lineTo(cx - arm, cy + arm); }
    context.stroke();
    return;
  }
  // A hidden answer is a star sticker with a question mark, like the ones stuck over a slam-book page.
  context.save();
  context.translate(cx, cy);
  context.rotate(0.12);
  context.fillStyle = STICKER;
  star(context, 0, 0, radius * 1.18, radius * 0.78);
  context.fill();
  context.strokeStyle = "#e0a93a";
  context.lineWidth = 3;
  context.stroke();
  context.restore();
  fitText(context, [{ text: "?", color: INK, weight: 800, display: true }], cx, cy + radius * 0.36, radius * 1.1, radius * 1.4, "center");
}

function drawRows(context: CanvasRenderingContext2D, card: Card, top: number, rowHeight: number, gap: number) {
  const left = 84, columns = 2, width = 912, columnGap = 24;
  const cellWidth = (width - columnGap) / columns;
  questions.forEach((question, index) => {
    const x = left + (index % columns) * (cellWidth + columnGap);
    const y = top + Math.floor(index / columns) * (rowHeight + gap);
    const mid = y + rowHeight / 2;
    context.fillStyle = "#ffffff";
    roundedRect(context, x, y, cellWidth, rowHeight, 22);
    context.fill();
    context.strokeStyle = "#c6dbef";
    context.lineWidth = 3;
    context.stroke();
    context.fillStyle = PINK_SOFT;
    context.beginPath(); context.arc(x + 44, mid, 25, 0, Math.PI * 2); context.fill();
    fitText(context, [{ text: bn(index + 1), color: PINK, weight: 800, display: true }], x + 44, mid + 12, 34, 40, "center");
    fitText(context, [{ text: question.mine, color: INK, weight: 600 }], x + 84, mid + 13, 36, cellWidth - 84 - 96);
    const mark = card.kind === "score" ? card.marks[index] : null;
    drawSticker(context, mark ?? "hidden", x + cellWidth - 52, mid, Math.min(32, rowHeight * 0.3));
  });
  return top + 4 * rowHeight + 3 * gap;
}

const layouts = {
  feed: { frame: 104, tape: 176, title: 306, titleSize: 92, titleGap: 104, rows: 466, row: 128, gap: 18, after: 80 },
  story: { frame: 104, tape: 330, title: 488, titleSize: 100, titleGap: 118, rows: 676, row: 156, gap: 22, after: 104 },
} as const;

export function drawCard(canvas: HTMLCanvasElement, card: Card, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const bandTop = format === "story" ? height - 260 : height - 96;
  drawPage(context, width, height, layout.frame, bandTop - 24);
  drawTape(context, `${card.kind === "challenge" && !card.owner ? "আমার" : ownerOf(card.owner)} স্লাম বুক`, 84, layout.tape);

  const maxTitle = 900;
  if (card.kind === "challenge") {
    fitText(context, [{ text: "তুমি আমাকে", color: INK, weight: 800, display: true }], 84, layout.title, layout.titleSize, maxTitle);
    fitText(context, [{ text: "কতটা চেনো?", color: GEL, weight: 800, display: true }], 84, layout.title + layout.titleGap, layout.titleSize, maxTitle);
  } else {
    const { who, whom, score, verb } = card.knows;
    fitText(context, [{ text: `${who} ${whom}`, color: INK, weight: 800, display: true }], 84, layout.title, layout.titleSize, maxTitle);
    fitText(context, card.done
      ? [{ text: score, color: PINK, weight: 800, display: true }, { text: ` ${verb}`, color: GEL, weight: 800, display: true }]
      : [{ text: "কতটা চেনে?", color: GEL, weight: 800, display: true }], 84, layout.title + layout.titleGap, layout.titleSize, maxTitle);
  }

  let y = drawRows(context, card, layout.rows, layout.row, layout.gap) + layout.after;
  if (card.kind === "challenge") {
    fitText(context, [{ text: "কঠিনতা", color: MUTED, weight: 600 }], 84, y, 32, 200);
    for (let index = 0; index < 5; index++) {
      context.fillStyle = index < card.stars ? STICKER : "#ffffff";
      star(context, 240 + index * 50, y - 11, 20);
      context.fill();
      context.strokeStyle = index < card.stars ? "#e0a93a" : "#c6dbef";
      context.lineWidth = 3;
      context.stroke();
    }
    y += format === "story" ? 84 : 66;
  }
  fitText(context, [{ text: card.line, color: GEL, weight: 700, display: true }], 84, y, format === "story" ? 50 : 44, 912);
  drawFooterBand(context, format, "তোমাকে কে বেশি চেনে?", site, { band: "#16466b", ask: STICKER, site: "#ffffff" });
}

export const cardBlob = (card: Card, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, card, format, site));
