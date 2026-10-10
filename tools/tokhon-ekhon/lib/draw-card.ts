import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, wrapText, DISPLAY_FONT, type CardFormat } from "../../../shared/card-canvas";
import { bn, bnYear, noteCount, LATEST_YEAR, type Card } from "./tokhon";
import { CHECKED } from "./cpi";

const LEATHER = "#5a3720";
const LEATHER_DEEP = "#3d2413";
const LEATHER_LIGHT = "#7a4b2b";
const THREAD = "#d9aa60";
const CREAM = "#fbefd9";
const BRASS = "#f2c66e";
const SOFT = "#dcc29b";
const OLD_NOTE = "#e6d6b2";
const OLD_INK = "#80603a";
const NEW_NOTE = "#d7e8cc";
const NEW_INK = "#3a6b42";

/** Faint dots so the brown reads as leather, not a flat fill. Seeded, so the same card always looks the same. */
function grain(context: CanvasRenderingContext2D, width: number, height: number) {
  let seed = 7;
  const next = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 2600; i++) {
    context.fillStyle = next() > 0.5 ? "rgba(255,235,200,.05)" : "rgba(0,0,0,.08)";
    context.fillRect(next() * width, next() * height, 2 + next() * 2, 2);
  }
}

function stitch(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, line = 4) {
  context.save();
  context.strokeStyle = THREAD;
  context.lineWidth = line;
  context.setLineDash([16, 11]);
  roundedRect(context, x, y, width, height, radius);
  context.stroke();
  context.restore();
}

/** A plain illustrative note (no real banknote design): a frame, a watermark oval and a ৳ mark. */
function note(context: CanvasRenderingContext2D, width: number, height: number, fill: string, ink: string, year?: string) {
  context.save();
  context.shadowColor = "rgba(0,0,0,.35)";
  context.shadowBlur = 14;
  context.shadowOffsetY = 6;
  context.fillStyle = fill;
  roundedRect(context, -width / 2, -height / 2, width, height, 10);
  context.fill();
  context.restore();
  context.strokeStyle = ink;
  context.globalAlpha = 0.55;
  context.lineWidth = 3;
  roundedRect(context, -width / 2 + 14, -height / 2 + 14, width - 28, height - 28, 6);
  context.stroke();
  context.beginPath();
  context.ellipse(width * 0.22, 0, height * 0.24, height * 0.3, 0, 0, Math.PI * 2);
  context.stroke();
  context.globalAlpha = 1;
  fitText(context, [{ text: "৳", color: ink, weight: 800, display: true }], -width / 2 + 32, -height / 2 + height * 0.5, height * 0.4, width * 0.3);
  if (year) fitText(context, [{ text: year, color: ink, weight: 700, display: true }], width / 2 - 30, -height / 2 + height * 0.36, height * 0.2, width * 0.4, "right");
}

/** Then: one faded note, a little stained, tilted into the left pocket. */
function oldNote(context: CanvasRenderingContext2D, card: Card, cx: number, cy: number, width: number, height: number) {
  context.save();
  context.translate(cx, cy);
  context.rotate(-0.09);
  note(context, width, height, OLD_NOTE, OLD_INK, bnYear(card.year));
  for (const [x, y, r] of [[-0.18, 0.18, 0.28], [0.3, -0.2, 0.2]] as const) {
    const stain = context.createRadialGradient(x * width, y * height, 0, x * width, y * height, r * width);
    stain.addColorStop(0, "rgba(140,100,50,.22)");
    stain.addColorStop(1, "rgba(140,100,50,0)");
    context.fillStyle = stain;
    context.fillRect(-width / 2, -height / 2, width, height);
  }
  context.restore();
}

/** Now: as many fresh notes as the price multiple, rounded, fanned into the right pocket. */
function noteFan(context: CanvasRenderingContext2D, card: Card, cx: number, pivot: number, width: number, height: number) {
  const count = noteCount(card.times);
  const spread = Math.min(0.75, 0.085 * (count - 1));
  for (let i = 0; i < count; i++) {
    context.save();
    context.translate(cx, pivot);
    context.rotate(count === 1 ? 0 : -spread / 2 + (spread * i) / (count - 1));
    context.translate(0, -height / 2 - 24);
    note(context, width, height, NEW_NOTE, NEW_INK);
    context.restore();
  }
}

function pocket(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, label: string, sum: string, size: number) {
  context.save();
  context.shadowColor = "rgba(0,0,0,.4)";
  context.shadowBlur = 18;
  context.shadowOffsetY = -6;
  context.fillStyle = LEATHER_DEEP;
  roundedRect(context, x, y, width, height, 22);
  context.fill();
  context.restore();
  stitch(context, x + 12, y + 12, width - 24, height - 24, 14, 3);
  fitText(context, [{ text: label, color: BRASS, weight: 700 }], x + width / 2, y + height * 0.34, size * 0.36, width - 60, "center");
  fitText(context, [{ text: sum, color: CREAM, weight: 800, display: true }], x + width / 2, y + height * 0.34 + size * 1.02, size, width - 50, "center");
}

const layouts = {
  feed: { kicker: 116, head: 204, headSize: 78, wallet: 248, walletH: 510, pocketTop: 486, noteW: 330, noteH: 165, sumSize: 86, growth: 850, line: 928, lineGap: 60, basis: 1112, source: 1160 },
  story: { kicker: 330, head: 424, headSize: 88, wallet: 480, walletH: 610, pocketTop: 790, noteW: 370, noteH: 185, sumSize: 96, growth: 1206, line: 1292, lineGap: 66, basis: 1484, source: 1536 },
} as const;

export function drawCard(canvas: HTMLCanvasElement, card: Card, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");

  context.fillStyle = LEATHER;
  context.fillRect(0, 0, width, height);
  const glow = context.createRadialGradient(width / 2, height * 0.4, 100, width / 2, height * 0.4, height * 0.8);
  glow.addColorStop(0, "rgba(255,210,150,.10)");
  glow.addColorStop(1, "rgba(0,0,0,.25)");
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);
  grain(context, width, height);
  const footerTop = format === "story" ? height - 260 : height - 96;
  stitch(context, 30, 30, width - 60, footerTop - 60, 34);
  if (format === "story") fitText(context, [{ text: "দাম তখন আর এখন · একটুখানি", color: SOFT, weight: 600 }], width / 2, 170, 30, 900, "center");

  fitText(context, [{ text: card.kicker, color: BRASS, weight: 700 }], 84, layout.kicker, 36, 912);
  fitText(context, [{ text: card.headline, color: CREAM, weight: 800, display: true }], 84, layout.head, layout.headSize, 912);

  // The open wallet: a lighter inner panel with a centre fold, notes peeking out of two pockets.
  const walletX = 70, walletW = width - 140, half = width / 2;
  context.fillStyle = LEATHER_LIGHT;
  roundedRect(context, walletX, layout.wallet, walletW, layout.walletH, 30);
  context.fill();
  stitch(context, walletX + 14, layout.wallet + 14, walletW - 28, layout.walletH - 28, 20, 3);
  const fold = context.createLinearGradient(half - 26, 0, half + 26, 0);
  fold.addColorStop(0, "rgba(0,0,0,0)");
  fold.addColorStop(0.5, "rgba(0,0,0,.35)");
  fold.addColorStop(1, "rgba(0,0,0,0)");
  context.fillStyle = fold;
  context.fillRect(half - 26, layout.wallet + 8, 52, layout.walletH - 16);

  const pocketW = half - walletX - 44, pocketH = layout.wallet + layout.walletH - 26 - layout.pocketTop;
  const leftX = walletX + 30, rightX = half + 14;
  oldNote(context, card, leftX + pocketW / 2, layout.pocketTop - layout.noteH * 0.16, layout.noteW * 0.92, layout.noteH * 0.92);
  noteFan(context, card, rightX + pocketW / 2, layout.pocketTop + 40, layout.noteW * 0.92, layout.noteH * 0.92);
  pocket(context, leftX, layout.pocketTop, pocketW, pocketH, `তখন · ${bnYear(card.year)}`, `${bn(card.amount)} টাকা`, layout.sumSize);
  pocket(context, rightX, layout.pocketTop, pocketW, pocketH, `এখন · ${bnYear(LATEST_YEAR)}`, `${bn(card.now)} টাকা`, layout.sumSize);

  fitText(context, [{ text: card.growth, color: BRASS, weight: 700, display: true }], 84, layout.growth, 56, 912);
  context.font = `600 44px ${DISPLAY_FONT}`;
  const full = context.measureText(card.line).width;
  // Two even lines rather than a long one and an orphan.
  wrapText(context, card.line, full > 912 ? Math.min(912, full / 2 + 60) : 912, 2).forEach((text, index) =>
    fitText(context, [{ text, color: CREAM, weight: 600, display: true }], 84, layout.line + index * layout.lineGap, 44, 912));

  context.fillStyle = THREAD;
  context.globalAlpha = 0.5;
  context.fillRect(84, layout.basis - 52, 912, 2);
  context.globalAlpha = 1;
  fitText(context, [{ text: `${card.basis} · যাচাই করা: ${CHECKED}`, color: SOFT, weight: 600 }], 84, layout.basis, 30, 912);
  fitText(context, [{ text: "সূত্র: বিবিএসের ভোক্তা মূল্যসূচক, বিশ্বব্যাংকের তথ্যভান্ডার থেকে", color: SOFT, weight: 500 }], 84, layout.source, 28, 912);

  drawFooterBand(context, format, `তোমার জন্মসালের ${bn(card.amount)} টাকা আজ কত?`, site, { band: "#2a180b", ask: BRASS, site: CREAM });
}

export const cardBlob = (card: Card, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, card, format, site));
