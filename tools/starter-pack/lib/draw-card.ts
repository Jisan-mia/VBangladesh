import { cardSizes, drawFooterBand, fitText, loadCardFonts, renderCard, roundedRect, wrapText, DISPLAY_FONT, type CardFormat } from "../../../shared/card-canvas";
import { artSvg, figureSvg } from "./art";
import { label, type CardContent, type ItemId, type Pack } from "./pack";

const INK = "#2b2135";
const WALL = "#f4ede1";
const images = new Map<string, HTMLImageElement>();

function loadImage(key: string, svg: string) {
  const cached = images.get(key);
  if (cached?.complete && cached.naturalWidth) return Promise.resolve();
  const image = new Image();
  image.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  images.set(key, image);
  return image.decode().catch(() => undefined);
}

const figureKey = (pack: Pack) => `figure:${pack.id}`;

/** Fonts plus only the drawings this card needs, so a cheap phone never decodes all 72. The card draws synchronously after this. */
export async function prepareCard(card: CardContent) {
  await Promise.all([
    loadCardFonts(card.title + card.pack.label + card.line),
    loadImage(figureKey(card.pack), figureSvg(card.pack.color, card.pack.deep, card.pack.mood, 600)),
    ...card.items.map(id => loadImage(id, artSvg(id, 256))),
  ]);
}

function drawImage(context: CanvasRenderingContext2D, key: string, x: number, y: number, width: number, height: number) {
  const image = images.get(key);
  if (image?.complete && image.naturalWidth) context.drawImage(image, x, y, width, height);
}

/** The shop's pegboard wall the pack hangs on. */
function drawWall(context: CanvasRenderingContext2D, width: number, height: number) {
  context.fillStyle = WALL;
  context.fillRect(0, 0, width, height);
  context.fillStyle = "rgba(43,33,53,.09)";
  for (let y = 30; y < height; y += 60) for (let x = 30; x < width; x += 60) { context.beginPath(); context.arc(x, y, 5, 0, Math.PI * 2); context.fill(); }
}

function drawStarburst(context: CanvasRenderingContext2D, cx: number, cy: number, radius: number, lines: readonly string[]) {
  context.save();
  context.translate(cx, cy);
  context.rotate(0.14);
  context.beginPath();
  for (let point = 0; point < 32; point++) {
    const r = point % 2 ? radius * 0.82 : radius;
    const a = point / 32 * Math.PI * 2;
    context.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  context.closePath();
  context.fillStyle = "#ffd34d";
  context.fill();
  context.lineWidth = 5; context.strokeStyle = INK; context.lineJoin = "round";
  context.stroke();
  lines.forEach((line, index) => fitText(context, [{ text: line, color: INK, weight: 800, display: true }], 0, (index - (lines.length - 1) / 2) * 40 + 12, index ? 36 : 30, radius * 1.4, "center"));
  context.restore();
}

/** One clear plastic blister: a soft drop shadow on the card, a pale dome, a white rim and a glare streak drawn last, over the toy. */
function drawBubble(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, inside: () => void) {
  context.save();
  context.shadowColor = "rgba(20,10,30,.32)"; context.shadowBlur = 22; context.shadowOffsetY = 10;
  roundedRect(context, x, y, width, height, radius);
  context.fillStyle = "#eef3f8";
  context.fill();
  context.restore();
  const dome = context.createLinearGradient(x, y, x + width, y + height);
  dome.addColorStop(0, "#ffffff"); dome.addColorStop(1, "#dfe8f1");
  roundedRect(context, x, y, width, height, radius);
  context.fillStyle = dome;
  context.fill();
  inside();
  context.save();
  roundedRect(context, x, y, width, height, radius);
  context.clip();
  context.fillStyle = "rgba(255,255,255,.5)";
  context.beginPath();
  context.moveTo(x + width * 0.16, y); context.lineTo(x + width * 0.34, y); context.lineTo(x, y + height * 0.5); context.lineTo(x, y + height * 0.3);
  context.closePath(); context.fill();
  context.fillStyle = "rgba(255,255,255,.35)";
  context.beginPath();
  context.moveTo(x + width * 0.4, y); context.lineTo(x + width * 0.45, y); context.lineTo(x + width * 0.05, y + height * 0.62); context.lineTo(x, y + height * 0.62);
  context.closePath(); context.fill();
  context.restore();
  roundedRect(context, x, y, width, height, radius);
  context.lineWidth = 5; context.strokeStyle = "#ffffff"; context.stroke();
  roundedRect(context, x + 7, y + 7, width - 14, height - 14, Math.max(radius - 6, 4));
  context.lineWidth = 2; context.strokeStyle = "rgba(43,33,53,.14)"; context.stroke();
}

function drawItemBubble(context: CanvasRenderingContext2D, id: ItemId, x: number, y: number, width: number, height: number) {
  drawBubble(context, x, y, width, height, 30, () => {
    const labelSize = Math.min(30, height * 0.14);
    const art = Math.min(width * 0.8, height - labelSize - 34);
    drawImage(context, id, x + (width - art) / 2, y + 8, art, art);
    fitText(context, [{ text: label(id), color: INK, weight: 700 }], x + width / 2, y + height - 22, labelSize, width - 28, "center");
  });
}

/** The hanging hole punched in the card's top, with the shop's hook through it. */
function drawHole(context: CanvasRenderingContext2D, cx: number, cy: number) {
  context.fillStyle = WALL;
  roundedRect(context, cx - 70, cy - 15, 140, 30, 15); context.fill();
  context.beginPath(); context.arc(cx, cy - 6, 24, 0, Math.PI * 2); context.fill();
  context.lineWidth = 3; context.strokeStyle = "rgba(0,0,0,.25)";
  roundedRect(context, cx - 70, cy - 15, 140, 30, 15); context.stroke();
  context.lineCap = "round";
  context.strokeStyle = "#8a93a3"; context.lineWidth = 12;
  context.beginPath(); context.moveTo(cx, 0); context.lineTo(cx, cy + 4); context.quadraticCurveTo(cx, cy + 22, cx + 22, cy + 10); context.stroke();
  context.strokeStyle = "#c9d0da"; context.lineWidth = 4;
  context.beginPath(); context.moveTo(cx - 3, 0); context.lineTo(cx - 3, cy); context.stroke();
}

const layouts = {
  feed: { cardY: 56, cardH: 1172, title: 82, line: 40 },
  story: { cardY: 280, cardH: 1340, title: 90, line: 44 },
} as const;

export function drawCard(canvas: HTMLCanvasElement, card: CardContent, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const { pack } = card;
  const grid = card.items.length > 6;
  drawWall(context, width, height);

  // The cardboard backing, printed in the pack's colour with a halftone dot screen.
  const cardX = 56, cardW = width - 112, cardY = layout.cardY, cardH = layout.cardH;
  context.save();
  context.shadowColor = "rgba(20,10,30,.3)"; context.shadowBlur = 30; context.shadowOffsetY = 16;
  roundedRect(context, cardX, cardY, cardW, cardH, 34);
  context.fillStyle = pack.color;
  context.fill();
  context.restore();
  context.save();
  roundedRect(context, cardX, cardY, cardW, cardH, 34);
  context.clip();
  context.fillStyle = "rgba(255,255,255,.08)";
  for (let y = cardY; y < cardY + cardH; y += 26) for (let x = cardX + ((y / 26) % 2) * 13; x < cardX + cardW; x += 26) { context.beginPath(); context.arc(x, y, 4, 0, Math.PI * 2); context.fill(); }
  context.restore();
  roundedRect(context, cardX + 18, cardY + 18, cardW - 36, cardH - 36, 22);
  context.lineWidth = 3; context.strokeStyle = "rgba(255,255,255,.45)"; context.setLineDash([14, 10]); context.stroke(); context.setLineDash([]);
  drawHole(context, width / 2, cardY + 52);

  // Header: the pack's name on a ribbon, the personal title, and a starburst badge like toy packaging.
  const left = cardX + 52;
  const titleLeft = grid ? left + 150 : left;
  const badgeR = 96;
  if (grid) drawImage(context, figureKey(pack), left - 6, cardY + 96, 140, 210);
  context.font = `700 34px ${DISPLAY_FONT}`;
  const ribbonW = Math.min(context.measureText(pack.label).width + 56, 560);
  context.fillStyle = pack.deep;
  roundedRect(context, titleLeft, cardY + 108, ribbonW, 60, 30); context.fill();
  fitText(context, [{ text: pack.label, color: "#ffffff", weight: 700, display: true }], titleLeft + 28, cardY + 150, 34, ribbonW - 56);
  context.save();
  context.shadowColor = pack.on === "#ffffff" ? "rgba(0,0,0,.28)" : "rgba(255,255,255,.4)"; context.shadowOffsetY = 4;
  fitText(context, [{ text: card.title, color: pack.on, weight: 800, display: true }], titleLeft, cardY + 252, layout.title, cardX + cardW - badgeR * 2 - 40 - titleLeft);
  context.restore();
  drawStarburst(context, cardX + cardW - badgeR - 34, cardY + 190, badgeR, pack.badge);

  // Body: the figure's tall bubble with six accessory bubbles beside it, or a 3×3 grid of nine.
  const bodyY = cardY + 300, bodyH = cardH - 300 - 230, gap = 22, right = cardX + cardW - 52;
  if (grid) {
    const cellW = (right - left - gap * 2) / 3, cellH = (bodyH - gap * 2) / 3;
    card.items.forEach((id, index) => drawItemBubble(context, id, left + (index % 3) * (cellW + gap), bodyY + Math.floor(index / 3) * (cellH + gap), cellW, cellH));
  } else {
    const figureW = 330;
    drawBubble(context, left, bodyY, figureW, bodyH, 70, () => {
      const figureH = Math.min(bodyH * 0.82, (figureW - 40) * 1.5);
      drawImage(context, figureKey(pack), left + (figureW - figureH / 1.5) / 2, bodyY + (bodyH - figureH) / 2, figureH / 1.5, figureH);
    });
    const itemsX = left + figureW + gap;
    const cellW = (right - itemsX - gap) / 2, cellH = (bodyH - gap * 2) / 3;
    card.items.forEach((id, index) => drawItemBubble(context, id, itemsX + (index % 2) * (cellW + gap), bodyY + Math.floor(index / 2) * (cellH + gap), cellW, cellH));
  }

  // Under the bubbles: the human line, a friend match, and the toy-box fine print.
  const textW = right - left;
  let y = bodyY + bodyH + (card.match ? 56 : 64);
  context.font = `700 ${layout.line}px ${DISPLAY_FONT}`;
  // With a friend match there is room for one (shrunk) line only, above the fine print.
  const lines = card.match ? [card.line] : wrapText(context, card.line, textW, 2);
  if (lines.length > 1) y -= 22;
  for (const row of lines) { fitText(context, [{ text: row, color: pack.on, weight: 700, display: true }], left, y, layout.line, textW); y += layout.line + 12; }
  if (card.match) fitText(context, [{ text: card.match, color: pack.on === "#ffffff" ? "#ffe27a" : INK, weight: 700 }], left, y - 2, 30, textW);
  const warningY = cardY + cardH - 64;
  context.strokeStyle = pack.on; context.globalAlpha = 0.75; context.lineWidth = 2;
  roundedRect(context, left, warningY - 36, textW, 52, 10); context.stroke();
  fitText(context, [{ text: "সতর্কতা: ", color: pack.on, weight: 800 }, { text: pack.warning, color: pack.on, weight: 500 }], left + 18, warningY, 26, textW - 36);
  context.globalAlpha = 1;

  drawFooterBand(context, format, "তোমার প্যাকেটে কী থাকত?", site, { band: INK, ask: "#ffd34d", site: "#ffffff" });
}

export async function cardBlob(card: CardContent, format: CardFormat, site: string) {
  await prepareCard(card);
  return renderCard(canvas => drawCard(canvas, card, format, site));
}
