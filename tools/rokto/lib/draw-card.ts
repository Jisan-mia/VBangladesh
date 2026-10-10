import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, wrapText, DISPLAY_FONT, type CardFormat } from "../../../shared/card-canvas";
import { bn, bnPlain, type Card } from "./rokto";

const BG = "#fbefef";
const BAG = "#a8102a";
const BAG_DEEP = "#760a1c";
const LABEL = "#ffffff";
const INK = "#24161a";
const MUTED = "#6d5d62";
const RED = "#c3122f";
const GOLD = "#e3a92f";

/** A drop: pointed top, round bottom. (cx, cy) is the centre of the round part. */
export function drop(context: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(cx, cy - r * 1.9);
  context.bezierCurveTo(cx + r * 0.25, cy - r * 1.2, cx + r, cy - r * 0.6, cx + r, cy);
  context.arc(cx, cy, r, 0, Math.PI);
  context.bezierCurveTo(cx - r, cy - r * 0.6, cx - r * 0.25, cy - r * 1.2, cx, cy - r * 1.9);
  context.fill();
}

/** Thin bars that read as a printed label code at a glance; deliberately not a scannable barcode. */
function stripes(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string) {
  const pattern = [3, 1, 2, 1, 1, 3, 1, 2, 2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 2];
  context.fillStyle = color;
  let cursor = x, index = 0;
  while (cursor < x + width) {
    const bar = pattern[index % pattern.length] * 3;
    if (index % 2 === 0) context.fillRect(cursor, y, Math.min(bar, x + width - cursor), height);
    cursor += bar + 4;
    index++;
  }
}

/** The hero badge: a gold-rimmed medal with ribbon tails and the donation count. */
function badge(context: CanvasRenderingContext2D, count: number, cx: number, cy: number, r: number) {
  context.fillStyle = RED;
  for (const side of [-1, 1]) {
    context.beginPath();
    context.moveTo(cx + side * r * 0.2, cy + r * 0.4);
    context.lineTo(cx + side * r * 0.75, cy + r * 1.35);
    context.lineTo(cx + side * r * 0.45, cy + r * 1.22);
    context.lineTo(cx + side * r * 0.3, cy + r * 1.5);
    context.lineTo(cx - side * r * 0.15, cy + r * 0.5);
    context.fill();
  }
  context.fillStyle = GOLD;
  context.beginPath(); context.arc(cx, cy, r, 0, Math.PI * 2); context.fill();
  context.fillStyle = LABEL;
  context.beginPath(); context.arc(cx, cy, r * 0.82, 0, Math.PI * 2); context.fill();
  context.strokeStyle = GOLD; context.lineWidth = 3;
  context.beginPath(); context.arc(cx, cy, r * 0.74, 0, Math.PI * 2); context.stroke();
  fitText(context, [{ text: "রক্তদাতা", color: RED, weight: 700 }], cx, cy - r * 0.36, r * 0.24, r * 1.2, "center");
  fitText(context, [{ text: bn(count), color: RED, weight: 800, display: true }], cx, cy + r * 0.3, r * 0.68, r * 1.25, "center");
  fitText(context, [{ text: "বার", color: INK, weight: 700 }], cx, cy + r * 0.6, r * 0.22, r, "center");
}

function field(context: CanvasRenderingContext2D, label: string, value: string, x: number, y: number, width: number, size: number, color = INK) {
  fitText(context, [{ text: label, color: MUTED, weight: 600 }], x, y, 26, width);
  fitText(context, [{ text: value, color, weight: 700, display: true }], x, y + size + 6, size, width);
}

export function drawCard(canvas: HTMLCanvasElement, card: Card, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  // One layout for both formats; the story just sits lower, clear of storySafe and its taller footer band.
  const dy = format === "story" ? 300 : 0;
  context.fillStyle = BG;
  context.fillRect(0, 0, width, height);
  if (format === "story") for (const [x, y, r] of [[150, 150, 26], [930, 110, 18], [820, 205, 12], [250, 1610, 14], [960, 1580, 22]]) drop(context, x, y, r, "#f2cfd3");

  // Headline and the human line above the bag.
  fitText(context, [{ text: card.headline, color: INK, weight: 800, display: true }], width / 2, dy + 118, 74, 960, "center");
  context.font = `700 36px ${DISPLAY_FONT}`;
  const quote = wrapText(context, card.line, 900, 2);
  quote.forEach((line, index) => fitText(context, [{ text: line, color: RED, weight: 700, display: true }], width / 2, dy + 182 + index * 48, 36, 940, "center"));
  const top = dy + 182 + quote.length * 48;

  // The bag: hanger tab, tubing looping off to the side, then the body with a soft shine.
  const bagX = 150, bagW = 780, bagY = top + 44, bagH = 1140 - bagY + dy;
  context.strokeStyle = BAG_DEEP; context.lineWidth = 14; context.lineCap = "round";
  context.beginPath(); context.moveTo(640, bagY + 6); context.bezierCurveTo(660, bagY - 40, 1010, bagY - 30, 1000, bagY + 160); context.lineTo(992, bagY + 520); context.stroke();
  context.fillStyle = BAG_DEEP;
  roundedRect(context, 420, bagY - 30, 240, 60, 22); context.fill();
  context.fillStyle = BG;
  roundedRect(context, 490, bagY - 16, 100, 20, 10); context.fill();
  context.fillStyle = BAG;
  roundedRect(context, bagX, bagY, bagW, bagH, 64); context.fill();
  context.fillStyle = "rgba(255,255,255,.14)";
  roundedRect(context, bagX + 26, bagY + 50, 34, bagH - 120, 17); context.fill();

  // The label stuck on the bag.
  const lx = 200, lw = 680, ly = bagY + 56, lh = bagH - 96;
  context.fillStyle = LABEL;
  roundedRect(context, lx, ly, lw, lh, 18); context.fill();
  context.fillStyle = INK;
  context.beginPath(); context.roundRect(lx, ly, lw, 74, [18, 18, 0, 0]); context.fill();
  drop(context, lx + 46, ly + 44, 15, "#ff5a6e");
  fitText(context, [{ text: "রক্তদাতা কার্ড", color: LABEL, weight: 700, display: true }], lx + 78, ly + 50, 34, 300);
  stripes(context, lx + lw - 250, ly + 18, 220, 40, LABEL);

  const inner = lx + 36, innerW = lw - 72;
  const groupTop = ly + 112;
  fitText(context, [{ text: "রক্তের গ্রুপ", color: MUTED, weight: 600 }], inner, groupTop + 6, 26, 260);
  context.strokeStyle = INK; context.lineWidth = 6;
  context.strokeRect(inner, groupTop + 24, 250, 236);
  fitText(context, [{ text: card.group.label, color: RED, weight: 800, display: true }], inner + 125, groupTop + 188, 160, 220, "center");
  fitText(context, [{ text: card.group.spoken, color: INK, weight: 600 }], inner + 125, groupTop + 240, 28, 220, "center");

  const colX = inner + 290, colW = innerW - 290;
  const rows: Array<[string, string]> = [
    ...(card.name ? [["দাতা", card.name] as [string, string]] : []),
    ["সব মিলিয়ে", `${bn(card.count)} বার`],
    ["বিরতি", `${bnPlain(card.interval)} মাস`],
  ];
  const rowGap = rows.length === 3 ? 94 : 124;
  rows.forEach(([label, value], index) => field(context, label, value, colX, groupTop + 6 + index * rowGap, colW, 44));

  const dates = groupTop + 300;
  context.strokeStyle = "#cdbfc3"; context.lineWidth = 3; context.setLineDash([12, 10]);
  context.beginPath(); context.moveTo(inner, dates); context.lineTo(inner + innerW, dates); context.stroke();
  context.setLineDash([]);
  field(context, "শেষ রক্ত দিয়েছি", card.lastText, inner, dates + 56, innerW - 120, 48);
  fitText(context, [{ text: "আবার পারব", color: RED, weight: 700 }], inner, dates + 170, 30, 400);
  fitText(context, [{ text: card.nextText, color: RED, weight: 800, display: true }, { text: " থেকে", color: INK, weight: 600 }], inner, dates + 244, 66, innerW - 130);
  fitText(context, [{ text: "রক্ত দেওয়ার আগে ব্লাড ব্যাংক পরীক্ষা করে নেয়", color: MUTED, weight: 500 }], inner, ly + lh - 26, 22, innerW - 150);

  badge(context, card.count, bagX + bagW - 40, bagY + bagH - 90, 96);
  drawFooterBand(context, format, "তুমি শেষ কবে রক্ত দিয়েছ?", site, { band: BAG_DEEP, ask: "#ffe1e5", site: "#ffffff" });
}

export const cardBlob = (card: Card, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, card, format, site));
