import { BODY_FONT, cardSizes, drawFooterBand, fitText, renderCard, roundedRect, wrapText, type CardFormat } from "../../../shared/card-canvas";
import { bn, has, SIZE, type CardContent } from "./paper";

// The card is a school test paper run off a stencil machine: indigo duplicator ink, a boxed header, red "কমন" rubber stamps and the teacher's circled mark.
const PAPER = "#fbf9f1";
const INK = "#2b2e78";
const MUTED = "#6e709c";
const FAINT = "#8f91b5";
const RED = "#cf3329";
const MARKER = "#ffeb85";

const layouts = {
  feed: { frame: 30, exam: 116, title: 196, meta: 258, rule: 284, name: 346, score: 60, grid: 396, cell: 150, gap: 14, text: 34, stamp: 40, headline: 1112, line: 1164, match: 1214 },
  story: { frame: 226, exam: 336, title: 424, meta: 492, rule: 520, name: 590, score: 66, grid: 648, cell: 186, gap: 16, text: 38, stamp: 46, headline: 1504, line: 1564, match: 1616 },
} as const;

const LEFT = 72, RIGHT = 1008, LINE = 1.3;

/** Wraps a square's text into at most 3 lines, shrinking until every line fits; never cuts the text. */
function wrapFit(context: CanvasRenderingContext2D, text: string, maxWidth: number, maxHeight: number, size: number) {
  for (let px = size; px > 18; px -= 2) {
    context.font = `700 ${px}px ${BODY_FONT}`;
    const lines = wrapText(context, text, maxWidth, 99);
    if (lines.length <= 3 && lines.length * px * LINE <= maxHeight && lines.every(line => context.measureText(line).width <= maxWidth)) return { lines, px };
  }
  context.font = `700 18px ${BODY_FONT}`;
  return { lines: wrapText(context, text, maxWidth, 3), px: 18 };
}

function drawStamp(context: CanvasRenderingContext2D, text: string, cx: number, cy: number, width: number, height: number, angle: number, filled = false) {
  context.save();
  context.translate(cx, cy);
  context.rotate(angle);
  context.globalAlpha = filled ? 1 : 0.86;
  roundedRect(context, -width / 2, -height / 2, width, height, height * 0.22);
  if (filled) { context.fillStyle = RED; context.fill(); }
  context.strokeStyle = RED;
  context.lineWidth = filled ? 0 : 6;
  if (!filled) context.stroke();
  if (!filled) { roundedRect(context, -width / 2 + 9, -height / 2 + 9, width - 18, height - 18, height * 0.16); context.lineWidth = 2; context.stroke(); }
  fitText(context, [{ text, color: filled ? "#ffffff" : RED, weight: 800, display: true }], 0, height * 0.2, height * 0.58, width - 30, "center");
  context.restore();
}

function drawScore(context: CanvasRenderingContext2D, count: number, cx: number, cy: number, radius: number) {
  context.save();
  context.strokeStyle = RED;
  context.lineWidth = 5;
  context.lineCap = "round";
  // A hand-drawn circle that doesn't quite close, like a teacher's red pen.
  context.beginPath();
  context.ellipse(cx, cy, radius, radius * 0.92, -0.2, 0.3, Math.PI * 2 + 0.05);
  context.stroke();
  context.lineWidth = 4;
  context.beginPath(); context.moveTo(cx - radius * 0.48, cy + 4); context.lineTo(cx + radius * 0.48, cy - 2); context.stroke();
  context.restore();
  fitText(context, [{ text: bn(count), color: RED, weight: 800, display: true }], cx, cy - 10, radius * 0.78, radius * 1.3, "center");
  fitText(context, [{ text: bn(SIZE), color: RED, weight: 700, display: true }], cx, cy + radius * 0.62, radius * 0.48, radius * 1.1, "center");
}

export function drawPaper(canvas: HTMLCanvasElement, card: CardContent, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const footerTop = format === "story" ? height - 260 : height - 96;

  context.fillStyle = PAPER;
  context.fillRect(0, 0, width, height);
  context.strokeStyle = INK;
  context.lineWidth = 4;
  const frameHeight = footerTop - layout.frame - 30;
  context.strokeRect(30, layout.frame, width - 60, frameHeight);
  context.lineWidth = 1.5;
  context.strokeRect(40, layout.frame + 10, width - 80, frameHeight - 20);

  const { pack } = card;
  fitText(context, [{ text: `${pack.exam} · বিষয় কোড: ${pack.code}`, color: MUTED, weight: 600 }], width / 2, layout.exam, 30, 800, "center");
  fitText(context, [{ text: pack.title, color: INK, weight: 800, display: true }], width / 2, layout.title, 76, 640, "center");
  fitText(context, [{ text: `সময়: ${pack.time}`, color: INK, weight: 600 }], LEFT + 12, layout.meta, 30, 600);
  fitText(context, [{ text: `পূর্ণমান: ${bn(SIZE)}`, color: INK, weight: 600 }], RIGHT - 12, layout.meta, 30, 300, "right");
  context.fillStyle = INK;
  context.fillRect(LEFT, layout.rule, RIGHT - LEFT, 4);
  context.fillRect(LEFT, layout.rule + 9, RIGHT - LEFT, 1.5);

  // Name field: printed label and a dotted line, filled in by hand if there's a name.
  fitText(context, [{ text: "পরীক্ষার্থী:", color: MUTED, weight: 600 }], LEFT + 12, layout.name, 30, 180);
  context.strokeStyle = FAINT;
  context.lineWidth = 2;
  context.setLineDash([3, 7]);
  context.beginPath(); context.moveTo(LEFT + 176, layout.name + 8); context.lineTo(RIGHT - 12, layout.name + 8); context.stroke();
  context.setLineDash([]);
  if (card.name) fitText(context, [{ text: card.name, color: INK, weight: 700, display: true }], LEFT + 186, layout.name - 2, 42, 700);
  // The teacher's mark sits in the paper's top-right corner, as on the page.
  drawScore(context, card.count, RIGHT - 58, layout.title - 40, layout.score);

  const cellWidth = (RIGHT - LEFT - layout.gap * 3) / 4;
  const marked = new Set(card.lines.flat());
  for (let index = 0; index < SIZE; index++) {
    const x = LEFT + (index % 4) * (cellWidth + layout.gap);
    const y = layout.grid + Math.floor(index / 4) * (layout.cell + layout.gap);
    const common = has(card.mask, index);
    if (marked.has(index)) { context.fillStyle = MARKER; context.fillRect(x, y, cellWidth, layout.cell); }
    context.strokeStyle = INK;
    context.lineWidth = 2;
    context.strokeRect(x, y, cellWidth, layout.cell);
    fitText(context, [{ text: `${bn(index + 1)}.`, color: MUTED, weight: 700 }], x + 12, y + 34, 24, 60);
    // Number and stamp share the top strip so the stamp never covers the question.
    const top = layout.cell * 0.3;
    const { lines, px } = wrapFit(context, pack.squares[index], cellWidth - 24, layout.cell - top - 8, layout.text);
    const lineHeight = px * LINE;
    const firstBaseline = y + top + (layout.cell - top - 6 - lineHeight * lines.length) / 2 + lineHeight * 0.78;
    lines.forEach((line, row) => fitText(context, [{ text: line, color: common ? INK : FAINT, weight: common ? 700 : 600 }], x + cellWidth / 2, firstBaseline + row * lineHeight, px, cellWidth - 20, "center"));
    // Each stamp lands at its own slight angle, as if pressed by hand.
    if (common) drawStamp(context, "কমন", x + cellWidth - 64, y + layout.stamp * 0.72, 112, layout.stamp * 1.25, ((index * 37) % 9 - 5) / 40);
  }

  const textWidth = card.bingo ? 700 : RIGHT - LEFT;
  fitText(context, [{ text: `${bn(SIZE)}-র মধ্যে `, color: INK, weight: 600 }, { text: `${bn(card.count)}টা`, color: RED, weight: 800, display: true }, { text: " কমন পড়েছে!", color: INK, weight: 600 }], LEFT, layout.headline, format === "story" ? 52 : 48, textWidth);
  if (card.bingo) drawStamp(context, card.bingo, RIGHT - 120, layout.headline - 22, 250, 86, -0.1, true);
  fitText(context, [{ text: card.line, color: INK, weight: 600, display: true }], LEFT, layout.line, format === "story" ? 40 : 36, RIGHT - LEFT);
  if (card.match) fitText(context, [{ text: card.match, color: RED, weight: 700 }], LEFT, layout.match, format === "story" ? 34 : 30, RIGHT - LEFT);

  drawFooterBand(context, format, "তোমার কয়টা কমন পড়ল?", site, { band: INK, ask: MARKER, site: "#ffffff" });
}

export const paperBlob = (card: CardContent, format: CardFormat, site: string) => renderCard(canvas => drawPaper(canvas, card, format, site));
