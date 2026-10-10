import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, type CardFormat } from "../../../shared/card-canvas";
import { bn, books, scoreText, shelves, type CardContent } from "./shelf";
import { spineLook, walker } from "./spines";

const CREAM = "#efe6cc";
const MOON = "#f7eecb";
const YELLOW = "#f4c430";
const MUTED = "#a3abd0";
const GHOST = "rgba(239,230,204,.32)";

const layouts = {
  feed: { kicker: 98, score: 196, tier: 236, sky: 340, moon: [930, 118, 58], walkerScale: 0.95, shelfTop: 372, pitch: 190, spine: 136, line: 1158, match: 1210 },
  story: { kicker: 318, score: 424, tier: 470, sky: 780, moon: [900, 360, 70], walkerScale: 1.5, shelfTop: 812, pitch: 184, spine: 130, line: 1588, match: 1634 },
} as const;

function drawSky(context: CanvasRenderingContext2D, format: CardFormat) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  const sky = context.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#0d1330");
  sky.addColorStop(0.5, "#1a2250");
  sky.addColorStop(1, "#141a3d");
  context.fillStyle = sky;
  context.fillRect(0, 0, width, height);
  // Fixed star field so the same picks always make the same picture.
  context.fillStyle = "rgba(247,238,203,.7)";
  for (let index = 0; index < 46; index++) {
    const x = (index * 211) % width, y = 30 + ((index * 137) % (layout.sky - 120));
    context.beginPath(); context.arc(x, y, index % 5 === 0 ? 2.6 : 1.4, 0, Math.PI * 2); context.fill();
  }
  const [mx, my, mr] = layout.moon;
  const glow = context.createRadialGradient(mx, my, mr * 0.6, mx, my, mr * 3);
  glow.addColorStop(0, "rgba(247,238,203,.35)");
  glow.addColorStop(1, "rgba(247,238,203,0)");
  context.fillStyle = glow;
  context.fillRect(mx - mr * 3, my - mr * 3, mr * 6, mr * 6);
  context.fillStyle = MOON;
  context.beginPath(); context.arc(mx, my, mr, 0, Math.PI * 2); context.fill();

  // The ground and a moonlit road running to the horizon, with the walker on it.
  const horizon = layout.sky - (format === "story" ? 120 : 64);
  context.fillStyle = "#121939";
  context.fillRect(0, horizon, width, layout.sky - horizon);
  const roadX = format === "story" ? 820 : 850;
  const road = context.createLinearGradient(0, horizon, 0, layout.sky);
  road.addColorStop(0, "rgba(247,238,203,.12)");
  road.addColorStop(1, "rgba(247,238,203,.42)");
  context.fillStyle = road;
  context.beginPath(); context.moveTo(roadX - 8, horizon); context.lineTo(roadX + 8, horizon); context.lineTo(roadX + 190, layout.sky); context.lineTo(roadX - 150, layout.sky); context.closePath(); context.fill();
  const scale = layout.walkerScale;
  context.save();
  context.translate(roadX - 50 * scale + 10, layout.sky - 140 * scale - 6);
  context.scale(scale, scale);
  context.fillStyle = "#0a0f26";
  context.fill(new Path2D(walker.skin));
  context.fillStyle = YELLOW;
  context.fill(new Path2D(walker.panjabi));
  context.restore();
}

function drawSpine(context: CanvasRenderingContext2D, index: number, read: boolean, x: number, bottom: number, width: number, tallest: number) {
  const look = spineLook(index);
  const height = tallest - look.lift * 2.5;
  const top = bottom - height;
  roundedRect(context, x, top, width, height, 5);
  if (read) {
    context.fillStyle = look.color;
    context.fill();
    context.fillStyle = "rgba(0,0,0,.18)";
    context.fillRect(x, top + 14, width, 4);
    context.fillRect(x, bottom - 18, width, 4);
  } else {
    context.strokeStyle = GHOST;
    context.lineWidth = 2;
    context.setLineDash([8, 7]);
    context.stroke();
    context.setLineDash([]);
  }
  context.save();
  context.translate(x + width / 2, top + height / 2);
  context.rotate(Math.PI / 2);
  fitText(context, [{ text: books[index].short, color: read ? look.ink : GHOST, weight: read ? 700 : 500 }], 0, 9, 25, height - 44, "center");
  context.restore();
  if (read) {
    // A ribbon bookmark hanging out of every book that's been read.
    const ribbonX = x + width - 22;
    context.fillStyle = books[index].shelf === "himu" ? "#c8352a" : YELLOW;
    context.beginPath(); context.moveTo(ribbonX, top); context.lineTo(ribbonX + 12, top); context.lineTo(ribbonX + 12, top - 22); context.lineTo(ribbonX + 6, top - 16); context.lineTo(ribbonX, top - 22); context.closePath(); context.fill();
  }
}

function drawShelves(context: CanvasRenderingContext2D, card: CardContent, format: CardFormat) {
  const layout = layouts[format];
  const left = 72, right = 1008, gap = 8, plank = 30;
  shelves.forEach((shelf, row) => {
    const items = books.map((book, index) => ({ book, index })).filter(item => item.book.shelf === shelf.id);
    const bottom = layout.shelfTop + row * layout.pitch + layout.spine;
    const width = Math.min(84, (right - left - gap * (items.length - 1)) / items.length);
    items.forEach(({ book, index }, position) => drawSpine(context, index, card.read.has(book.id), left + position * (width + gap), bottom, width, layout.spine));
    context.fillStyle = "#5a3820";
    context.fillRect(left - 24, bottom, right - left + 48, plank);
    context.fillStyle = "#7a4e2c";
    context.fillRect(left - 24, bottom, right - left + 48, 6);
    const done = items.filter(item => card.read.has(item.book.id)).length;
    fitText(context, [{ text: shelf.label, color: CREAM, weight: 700 }, { text: `  ${bn(items.length)}-এ ${bn(done)}`, color: done ? YELLOW : MUTED, weight: 600 }], left, bottom + 25, 21, 500);
  });
}

export function drawCard(canvas: HTMLCanvasElement, card: CardContent, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  drawSky(context, format);
  const textWidth = format === "story" ? 640 : 680;
  fitText(context, [{ text: "হুমায়ূন আহমেদের বই · কয়টা পড়েছি", color: MUTED, weight: 600 }], 72, layout.kicker, 30, textWidth);
  const score = scoreText(card.count);
  fitText(context, card.name
    ? [{ text: `${card.name} · `, color: CREAM, weight: 800, display: true }, { text: score, color: YELLOW, weight: 800, display: true }]
    : [{ text: score, color: YELLOW, weight: 800, display: true }, { text: " পড়েছি", color: CREAM, weight: 800, display: true }], 72, layout.score, format === "story" ? 84 : 76, textWidth);
  context.font = `700 34px "Display", "Bangla"`;
  const pill = Math.min(textWidth, context.measureText(card.tier).width + 56);
  roundedRect(context, 72, layout.tier, pill, 62, 31);
  context.fillStyle = YELLOW;
  context.fill();
  fitText(context, [{ text: card.tier, color: "#1a1606", weight: 700, display: true }], 72 + pill / 2, layout.tier + 44, 34, pill - 40, "center");
  drawShelves(context, card, format);
  fitText(context, [{ text: card.line, color: CREAM, weight: 700, display: true }], 72, layout.line, 40, 936);
  if (card.match) fitText(context, [{ text: card.match, color: YELLOW, weight: 700 }], 72, layout.match, 32, 936);
  drawFooterBand(context, format, "তুমি কয়টা পড়েছ?", site, { band: "#0a0f26", ask: YELLOW, site: CREAM });
}

export const cardBlob = (card: CardContent, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, card, format, site));
