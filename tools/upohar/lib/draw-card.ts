import { cardSizes, drawFooterBand, fitText, renderCard, wrapText, DISPLAY_FONT, type CardFormat } from "../../../shared/card-canvas";
import type { Card } from "./upohar";

const CLOTH = "#6b1530";
const CLOTH_DARK = "#4a0d21";
const GOLD = "#e0b04a";
const GOLD_DEEP = "#a8781f";
const PAPER = "#fbf8f0";
const FLAP = "#f1ebdd";
const EDGE = "#ddd2bc";
const PEN = "#1f3a9e";
const PRINT = "#8c8272";
const MARIGOLD = "#f39a1e";
const MARIGOLD_DEEP = "#d9690f";

const layouts = {
  feed: { kicker: 150, top: 210, w: 900, h: 650, line: 980, note: 1124, flowers: [[70, 90], [1010, 250], [60, 900], [1020, 1060]] },
  story: { kicker: 370, top: 450, w: 960, h: 720, line: 1330, note: 1500, flowers: [[80, 320], [1000, 300], [70, 1240], [1010, 1420]] },
} as const;

/** The gift-table cloth: deep maroon with a fine weave and a gold zari border. */
function tablecloth(context: CanvasRenderingContext2D, width: number, height: number) {
  context.fillStyle = CLOTH;
  context.fillRect(0, 0, width, height);
  context.strokeStyle = "#ffffff0d";
  context.lineWidth = 2;
  for (let x = -height; x < width; x += 22) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x + height, height); context.stroke(); }
  context.strokeStyle = GOLD; context.lineWidth = 6;
  context.strokeRect(26, 26, width - 52, height - 52);
  context.lineWidth = 2;
  context.strokeRect(40, 40, width - 80, height - 80);
}

/** A marigold head: rings of petals, darker at the centre. */
function marigold(context: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
  for (const [ring, color] of [[1, MARIGOLD], [0.62, MARIGOLD_DEEP], [0.3, "#b54a0a"]] as const) {
    const r = radius * ring;
    context.fillStyle = color;
    for (let index = 0; index < 12; index++) {
      const angle = (index / 12) * Math.PI * 2 + ring;
      context.beginPath(); context.arc(cx + Math.cos(angle) * r * 0.62, cy + Math.sin(angle) * r * 0.62, r * 0.42, 0, Math.PI * 2); context.fill();
    }
  }
}

/** The round gold "শুভ বিবাহ" seal printed where the flap meets. */
function seal(context: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
  context.fillStyle = GOLD;
  context.beginPath(); context.arc(cx, cy, radius, 0, Math.PI * 2); context.fill();
  context.strokeStyle = GOLD_DEEP; context.lineWidth = 3;
  context.beginPath(); context.arc(cx, cy, radius - 10, 0, Math.PI * 2); context.stroke();
  for (let index = 0; index < 24; index++) {
    const angle = (index / 24) * Math.PI * 2;
    context.fillStyle = GOLD_DEEP;
    context.beginPath(); context.arc(cx + Math.cos(angle) * (radius - 4), cy + Math.sin(angle) * (radius - 4), 2.5, 0, Math.PI * 2); context.fill();
  }
  fitText(context, [{ text: "শুভ", color: CLOTH, weight: 800, display: true }], cx, cy - 6, radius * 0.42, radius * 1.3, "center");
  fitText(context, [{ text: "বিবাহ", color: CLOTH, weight: 800, display: true }], cx, cy + radius * 0.46, radius * 0.42, radius * 1.4, "center");
}

/** A loose ballpoint underline, wobbling like a hand did it. */
function scribble(context: CanvasRenderingContext2D, x: number, y: number, width: number) {
  context.strokeStyle = PEN; context.lineWidth = 4; context.lineCap = "round";
  context.beginPath(); context.moveTo(x, y);
  context.bezierCurveTo(x + width * 0.3, y + 10, x + width * 0.6, y - 8, x + width, y + 4);
  context.stroke();
  context.lineCap = "butt";
}

export function drawCard(canvas: HTMLCanvasElement, card: Card, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  tablecloth(context, width, height);
  for (const [x, y] of layout.flowers) marigold(context, x, y, 46);

  fitText(context, [{ text: card.occasion, color: GOLD, weight: 700, display: true }], width / 2, layout.kicker, 56, 820, "center");

  // The envelope, tipped a little on the table.
  const { w, h } = layout;
  context.save();
  context.translate(width / 2, layout.top + h / 2); context.rotate(-0.035); context.translate(-w / 2, -h / 2);
  context.shadowColor = "#00000077"; context.shadowBlur = 36; context.shadowOffsetY = 18;
  context.fillStyle = PAPER; context.beginPath(); context.roundRect(0, 0, w, h, 10); context.fill();
  context.shadowColor = "transparent";

  const tip = h * 0.36;
  context.fillStyle = FLAP; context.beginPath(); context.moveTo(0, 0); context.lineTo(w, 0); context.lineTo(w / 2, tip); context.closePath(); context.fill();
  context.strokeStyle = EDGE; context.lineWidth = 3; context.stroke();
  context.strokeStyle = GOLD; context.lineWidth = 3;
  context.strokeRect(22, 22, w - 44, h - 44);
  seal(context, w / 2, tip, format === "story" ? 92 : 84);

  const left = 70, inner = w - 140;
  const nameY = tip + (format === "story" ? 160 : 140);
  fitText(context, [{ text: "নাম:", color: PRINT, weight: 600 }], left, nameY, 34, 120);
  context.strokeStyle = PRINT; context.lineWidth = 2; context.setLineDash([4, 8]);
  context.beginPath(); context.moveTo(left + 90, nameY + 12); context.lineTo(w - left, nameY + 12); context.stroke();
  context.setLineDash([]);
  if (card.name) fitText(context, [{ text: card.name, color: PEN, weight: 600, display: true }], left + 104, nameY - 4, 48, inner - 110);

  const headY = nameY + (format === "story" ? 150 : 120);
  const size = fitText(context, [{ text: card.headline, color: PEN, weight: 700, display: true }], w / 2, headY, card.mode === "cash" ? 96 : 80, inner, "center");
  context.font = `700 ${size}px ${DISPLAY_FONT}`;
  const headWidth = Math.min(inner, context.measureText(card.headline).width);
  scribble(context, (w - headWidth) / 2, headY + 22, headWidth);
  fitText(context, [{ text: card.sub, color: PRINT, weight: 600 }], w / 2, headY + 80, 34, inner, "center");
  context.restore();

  // The human line in two even lines, then the menu's note in gold.
  const lineWidth = width - 200;
  context.font = `700 46px ${DISPLAY_FONT}`;
  const full = context.measureText(card.line).width;
  const lines = wrapText(context, card.line, full > lineWidth ? Math.min(lineWidth, full / 2 + 80) : lineWidth, 2);
  lines.forEach((line, index) => fitText(context, [{ text: line, color: "#ffffff", weight: 700, display: true }], width / 2, layout.line + index * 64, 46, lineWidth, "center"));
  fitText(context, [{ text: card.note, color: GOLD, weight: 600, display: true }], width / 2, layout.note, 34, lineWidth, "center");

  drawFooterBand(context, format, "তুমি খামে কত দাও?", site, { band: CLOTH_DARK, ask: GOLD, site: "#ffffff" });
}

export const cardBlob = (card: Card, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, card, format, site));
