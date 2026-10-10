import { cardSizes, drawFooterBand, fitText, loadCardFonts, renderCard, roundedRect, wrapText, BODY_FONT, type CardFormat } from "../../../shared/card-canvas";
import { artSvg } from "./art";
import { bn, sweets, total, type CardContent, type SweetId } from "./box";

const BLUE = "#1f3f8a";
const BLUE_DEEP = "#152c63";
const PINK = "#d9366f";
const INK = "#1d2b53";
const PAPER = "#fffdf9";
const LINING = "#fdf3e7";

const images = new Map<SweetId, HTMLImageElement>();

/** Turns each SVG drawing into an image once; the card draws synchronously after this. */
export function loadSweetArt() {
  return Promise.all(sweets.map(sweet => {
    const cached = images.get(sweet.id);
    if (cached?.complete) return Promise.resolve();
    const image = new Image();
    image.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(artSvg(sweet.id, 192));
    images.set(sweet.id, image);
    return image.decode().catch(() => undefined);
  }));
}

export async function prepareCard(sample: string) {
  await Promise.all([loadCardFonts(sample), loadSweetArt()]);
}

/** Small repeated print along a box edge: dots and four-petal flowers, like the pink ink on a sweet-shop box. */
function drawPrint(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, inset: number) {
  context.strokeStyle = PINK;
  context.lineWidth = 5;
  roundedRect(context, x + inset, y + inset, width - inset * 2, height - inset * 2, 14);
  context.stroke();
  context.lineWidth = 2;
  context.setLineDash([2, 10]);
  context.lineCap = "round";
  roundedRect(context, x + inset + 12, y + inset + 12, width - inset * 2 - 24, height - inset * 2 - 24, 8);
  context.stroke();
  context.setLineDash([]);
  context.fillStyle = PINK;
  for (const [cx, cy] of [[x + inset, y + inset], [x + width - inset, y + inset], [x + inset, y + height - inset], [x + width - inset, y + height - inset]]) {
    for (let petal = 0; petal < 4; petal++) {
      context.beginPath();
      context.ellipse(cx + Math.cos(petal * Math.PI / 2) * 11, cy + Math.sin(petal * Math.PI / 2) * 11, 9, 5, petal * Math.PI / 2, 0, Math.PI * 2);
      context.fill();
    }
    context.beginPath(); context.arc(cx, cy, 5, 0, Math.PI * 2); context.fillStyle = "#ffd166"; context.fill(); context.fillStyle = PINK;
  }
}

function drawBackground(context: CanvasRenderingContext2D, width: number, height: number) {
  context.fillStyle = BLUE;
  context.fillRect(0, 0, width, height);
  // A faint diamond weave, like the shop counter cloth.
  context.strokeStyle = "rgba(255,255,255,.06)";
  context.lineWidth = 2;
  for (let offset = -height; offset < width; offset += 54) {
    context.beginPath(); context.moveTo(offset, 0); context.lineTo(offset + height, height); context.stroke();
    context.beginPath(); context.moveTo(offset + height, 0); context.lineTo(offset, height); context.stroke();
  }
}

function drawLid(context: CanvasRenderingContext2D, card: CardContent, x: number, y: number, width: number, height: number, tilt: number) {
  context.save();
  context.translate(x + width / 2, y + height / 2);
  context.rotate(tilt);
  context.translate(-width / 2, -height / 2);
  context.shadowColor = "rgba(0,0,0,.28)"; context.shadowOffsetY = 12; context.shadowBlur = 24;
  context.fillStyle = PAPER;
  roundedRect(context, 0, 0, width, height, 18);
  context.fill();
  context.shadowColor = "transparent";
  drawPrint(context, 0, 0, width, height, 22);
  const stamp = height * 0.36;
  fitText(context, [{ text: card.lid, color: INK, weight: 800, display: true }], 64, height * 0.42, 60, width - stamp * 2 - 110);
  fitText(context, [{ text: `${bn(total)}-এ `, color: INK, weight: 700, display: true }, { text: `${bn(card.count)}টা`, color: PINK, weight: 800, display: true }], 64, height * 0.8, 92, width - stamp * 2 - 110);
  // Round seal with the title tier, slightly askew like a rubber stamp.
  context.save();
  context.translate(width - stamp - 52, height / 2);
  context.rotate(0.12);
  context.strokeStyle = PINK; context.lineWidth = 5;
  context.beginPath(); context.arc(0, 0, stamp, 0, Math.PI * 2); context.stroke();
  context.lineWidth = 2;
  context.beginPath(); context.arc(0, 0, stamp - 11, 0, Math.PI * 2); context.stroke();
  const words = card.tier.split(" ");
  const rows = words.length > 2 ? [words.slice(0, -1).join(" "), words.at(-1)!] : words;
  rows.forEach((row, index) => fitText(context, [{ text: row, color: PINK, weight: 800, display: true }], 0, (index - (rows.length - 1) / 2) * 40 + 13, 36, stamp * 1.55, "center"));
  context.restore();
  context.restore();
}

function drawBox(context: CanvasRenderingContext2D, card: CardContent, x: number, y: number, width: number, columns: number) {
  const pad = 40, gap = 8;
  const cell = (width - pad * 2 - gap * (columns - 1)) / columns;
  const rows = Math.ceil(total / columns);
  const height = pad * 2 + rows * cell + gap * (rows - 1);
  context.save();
  context.shadowColor = "rgba(0,0,0,.3)"; context.shadowOffsetY = 14; context.shadowBlur = 26;
  context.fillStyle = PAPER;
  roundedRect(context, x, y, width, height, 16);
  context.fill();
  context.restore();
  context.fillStyle = LINING;
  roundedRect(context, x + 18, y + 18, width - 36, height - 36, 10);
  context.fill();
  context.strokeStyle = PINK; context.lineWidth = 4;
  roundedRect(context, x + 6, y + 6, width - 12, height - 12, 12);
  context.stroke();
  for (let slot = 0; slot < total; slot++) {
    const cx = x + pad + (slot % columns) * (cell + gap);
    const cy = y + pad + Math.floor(slot / columns) * (cell + gap);
    const id = card.picked[slot];
    const image = id && images.get(id);
    if (image && image.complete && image.naturalWidth) {
      context.drawImage(image, cx - cell * 0.06, cy - cell * 0.06, cell * 1.12, cell * 1.12);
    } else {
      // Empty places in the box: the "out of 40" you can see.
      context.strokeStyle = "#e7c9b8"; context.lineWidth = 3; context.setLineDash([6, 8]);
      context.beginPath(); context.arc(cx + cell / 2, cy + cell / 2 + 2, cell * 0.3, 0, Math.PI * 2); context.stroke();
      context.setLineDash([]);
    }
  }
  return height;
}

/** A loose box string trailing off the side. */
function drawString(context: CanvasRenderingContext2D, x: number, y: number) {
  context.lineCap = "round";
  for (const [color, w] of [["#b8202f", 9], ["#ffffff", 3]] as const) {
    context.strokeStyle = color; context.lineWidth = w;
    context.setLineDash(color === "#ffffff" ? [10, 14] : []);
    context.beginPath(); context.moveTo(x, y); context.bezierCurveTo(x + 60, y + 50, x - 30, y + 120, x + 40, y + 190); context.stroke();
  }
  context.setLineDash([]);
}

const layouts = {
  feed: { lidY: 46, lidH: 250, boxY: 330, columns: 8, lineGap: 70, line: 42 },
  story: { lidY: 300, lidH: 290, boxY: 650, columns: 8, lineGap: 110, line: 48 },
} as const;

export function drawCard(canvas: HTMLCanvasElement, card: CardContent, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  drawBackground(context, width, height);
  const boxX = 80, boxW = width - 160;
  if (format === "story") {
    fitText(context, [{ text: "মিষ্টির বাক্স · একটুখানি", color: "rgba(255,255,255,.75)", weight: 600 }], width / 2, 200, 30, 900, "center");
  }
  drawString(context, width - 70, layout.boxY + 60);
  if (format === "story") {
    // The fold where the propped lid meets the box.
    context.fillStyle = "#e9ddcd";
    context.beginPath();
    context.moveTo(boxX + 6, layout.lidY + layout.lidH - 20); context.lineTo(boxX + boxW - 6, layout.lidY + layout.lidH - 20);
    context.lineTo(boxX + boxW, layout.boxY + 20); context.lineTo(boxX, layout.boxY + 20);
    context.fill();
  }
  const boxH = drawBox(context, card, boxX, layout.boxY, boxW, layout.columns);
  // Story: the lid stands propped behind the box; feed: it rests just above, a little askew.
  drawLid(context, card, boxX + 6, layout.lidY, boxW - 12, layout.lidH, format === "story" ? 0 : -0.018);
  let y = layout.boxY + boxH + layout.lineGap;
  fitText(context, [{ text: card.line, color: "#ffffff", weight: 700, display: true }], boxX, y, layout.line, boxW);
  if (card.names) {
    context.font = `500 28px ${BODY_FONT}`;
    for (const row of wrapText(context, card.names, boxW, 2)) {
      y += 46;
      fitText(context, [{ text: row, color: "#c9d6f5", weight: 500 }], boxX, y, 28, boxW);
    }
  }
  if (card.match) { y += 58; fitText(context, [{ text: card.match, color: "#ffd166", weight: 700 }], boxX, y, 34, boxW); }
  drawFooterBand(context, format, "তোমার বাক্সে কয়টা?", site, { band: BLUE_DEEP, ask: "#ffd166", site: "#ffffff" });
}

export async function cardBlob(card: CardContent, format: CardFormat, site: string) {
  await loadSweetArt();
  return renderCard(canvas => drawCard(canvas, card, format, site));
}
