import { BODY_FONT, cardSizes, drawFooterBand, fitText, renderCard, wrapText, type CardFormat } from "../../../shared/card-canvas";
import { bn, colors, items, possessive, TOTAL, type Color, type ItemId } from "./eid";
import { HAND, handPath, slots } from "./hand";

export type CardContent = {
  name: string;
  /** "ঈদুল ফিতর ২০২৭" or "ঈদ". */
  title: string;
  color: Color;
  picked: readonly ItemId[];
  line: string;
  /** Friend overlay, e.g. "দুজনেরই: সেমাই, দুপুরের ঘুম". */
  match: string;
  /** The colour most people wore, once there's enough data. */
  top: Color | null;
};

export const SKIN = "#e7b48a";
export const SKIN_EDGE = "#a8693f";
export const HENNA = "#7a2a0d";

export function cardHeadline(card: Pick<CardContent, "name" | "picked">) {
  return `${card.name ? possessive(card.name) : "আমার"} ঈদ`;
}

function drawBackground(context: CanvasRenderingContext2D, width: number, height: number, color: Color) {
  context.fillStyle = color.bg;
  context.fillRect(0, 0, width, height);
  // A faint jali of tiny four-point stars, like the print on an Eid panjabi or kameez.
  context.fillStyle = color.ink;
  context.globalAlpha = 0.07;
  for (let y = 30, row = 0; y < height; y += 60, row++) {
    for (let x = row % 2 ? 60 : 30; x < width; x += 60) {
      context.beginPath();
      context.moveTo(x, y - 7); context.lineTo(x + 2, y - 2); context.lineTo(x + 7, y); context.lineTo(x + 2, y + 2);
      context.lineTo(x, y + 7); context.lineTo(x - 2, y + 2); context.lineTo(x - 7, y); context.lineTo(x - 2, y - 2);
      context.fill();
    }
  }
  context.globalAlpha = 1;
}

function drawMoon(context: CanvasRenderingContext2D, x: number, y: number, r: number, color: Color) {
  context.save();
  context.fillStyle = color.hl;
  context.beginPath();
  context.arc(x, y, r, 0, Math.PI * 2);
  context.arc(x + r * 0.45, y - r * 0.2, r * 0.85, 0, Math.PI * 2, true);
  context.fill("evenodd");
  context.restore();
}

/** The hand, scaled so its viewBox bottom sits on `bottom`, right-aligned to `right`. */
function drawHand(context: CanvasRenderingContext2D, picked: readonly ItemId[], right: number, bottom: number, scale: number) {
  context.save();
  context.translate(right - HAND.width * scale, bottom - HAND.height * scale);
  context.scale(scale, scale);
  context.translate(-HAND.x, -HAND.y);
  const hand = new Path2D(handPath);
  context.shadowColor = "rgba(0,0,0,.25)";
  context.shadowBlur = 18;
  context.shadowOffsetY = 6;
  context.fillStyle = SKIN;
  context.fill(hand);
  context.shadowColor = "transparent";
  context.strokeStyle = SKIN_EDGE;
  context.lineWidth = 6;
  context.lineJoin = "round";
  context.stroke(hand);
  context.fill(hand);
  for (const item of items) {
    const motif = new Path2D(slots[item.id]);
    if (picked.includes(item.id)) {
      context.fillStyle = HENNA;
      context.fill(motif, "evenodd");
    } else {
      context.strokeStyle = "rgba(122,42,13,.22)";
      context.lineWidth = 1;
      context.setLineDash([2.5, 2.5]);
      context.stroke(motif);
      context.setLineDash([]);
    }
  }
  context.restore();
}

function drawPalette(context: CanvasRenderingContext2D, card: CardContent, x: number, y: number) {
  const label = card.top ? `এবার ঈদে ${card.top.label} এগিয়ে` : `আমার ঈদের রং: ${card.color.label}`;
  fitText(context, [{ text: label, color: card.color.ink, weight: 700 }], x, y, 30, 380);
  colors.forEach((color, index) => {
    const cx = x + 20 + index * 47, cy = y + 48, mine = color.id === card.color.id, lead = card.top?.id === color.id;
    context.beginPath();
    context.arc(cx, cy, mine ? 21 : 16, 0, Math.PI * 2);
    context.fillStyle = color.bg;
    context.fill();
    context.lineWidth = mine ? 4 : 2;
    context.strokeStyle = mine ? card.color.hl : card.color.ink + "55";
    context.stroke();
    if (lead && !mine) { context.lineWidth = 3; context.strokeStyle = card.color.ink; context.stroke(); }
  });
}

const layouts = {
  feed: { kicker: 110, title: 222, titleSize: 100, count: 326, column: 430, columnWidth: 380, palette: 1150, handScale: 2.2, handRight: 1062, moonY: 120 },
  story: { kicker: 330, title: 446, titleSize: 108, count: 556, column: 680, columnWidth: 330, palette: 1556, handScale: 2.35, handRight: 1062, moonY: 340 },
} as const;

export function drawCard(canvas: HTMLCanvasElement, card: CardContent, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const { ink, hl } = card.color;
  drawBackground(context, width, height, card.color);
  const footerTop = format === "story" ? height - 260 : height - 96;
  drawHand(context, card.picked, layout.handRight, footerTop, layout.handScale);
  drawMoon(context, width - 120, layout.moonY, 36, card.color);

  fitText(context, [{ text: `${card.title} · মেহেদি রাঙা হাত`, color: ink, weight: 600 }], 84, layout.kicker, 32, 760);
  fitText(context, [{ text: cardHeadline(card), color: ink, weight: 800, display: true }], 84, layout.title, layout.titleSize, 760);
  fitText(context, [{ text: `${bn(TOTAL)}-এ `, color: ink, weight: 700, display: true }, { text: `${bn(card.picked.length)}টা`, color: hl, weight: 800, display: true }, { text: " হলো", color: ink, weight: 700, display: true }], 84, layout.count, 72, 640);

  let y = layout.column;
  context.font = `700 46px ${BODY_FONT}`;
  for (const line of wrapText(context, card.line, layout.columnWidth, 3)) {
    fitText(context, [{ text: line, color: ink, weight: 700, display: true }], 84, y, 46, layout.columnWidth);
    y += 62;
  }
  y += 18;
  // Wrap by whole items, so a "·" never starts a line.
  const done = items.filter(item => card.picked.includes(item.id)).map(item => item.label);
  context.font = `500 31px ${BODY_FONT}`;
  const room = Math.max(2, Math.floor((layout.palette - 60 - y - (card.match ? 60 : 0)) / 46));
  const lines: string[] = [];
  for (const label of done) {
    const last = lines.at(-1);
    if (last !== undefined && context.measureText(`${last} · ${label}`).width <= layout.columnWidth) lines[lines.length - 1] = `${last} · ${label}`;
    else lines.push(label);
  }
  if (lines.length > room) { lines.length = room; lines[room - 1] += " …"; }
  for (const line of lines) {
    fitText(context, [{ text: line, color: ink, weight: 500 }], 84, y, 31, layout.columnWidth);
    y += 46;
  }
  if (card.match) fitText(context, [{ text: card.match, color: hl, weight: 700 }], 84, y + 16, 34, layout.columnWidth);
  drawPalette(context, card, 84, layout.palette);
  drawFooterBand(context, format, "তোমার ঈদে কয়টা হলো?", site, { band: card.color.deep, ask: "#ffd166", site: "#ffffff" });
}

export const cardBlob = (card: CardContent, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, card, format, site));
