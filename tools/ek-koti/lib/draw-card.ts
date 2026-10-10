import { cardSizes, drawFooterBand, fitText, loadCardFonts, renderCard, roundedRect, wrapText, BODY_FONT, type CardFormat } from "../../../shared/card-canvas";
import { BOARD_TEXT, VIEW, vanSvg } from "./van-art";
import { BUDGET, PRICE_NOTE, taka, type CardContent } from "./van";

const INK = "#1d2b53";
const GREEN = "#0b8a5f";
const BOARD = "#0b5d43";
const SUN = "#ffd34d";
const CHILI = "#e0393e";
const MUTED = "#5d6886";

const vans = new Map<string, HTMLImageElement>();

/** Turns the van SVG for these levels into an image once; drawing the card is synchronous after this. */
async function vanImage(levels: readonly number[]) {
  const key = levels.join(",");
  let image = vans.get(key);
  if (!image) {
    image = new Image();
    image.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(vanSvg(levels, { paint: false }));
    vans.set(key, image);
  }
  await image.decode().catch(() => undefined);
  return image;
}

/** Fonts plus this card's van, ready to draw. */
export async function prepareCard(card: CardContent, sample: string) {
  const [, van] = await Promise.all([loadCardFonts(sample), vanImage(card.levels)]);
  return van;
}

function drawSky(context: CanvasRenderingContext2D, width: number, roadTop: number, sunY: number) {
  const sky = context.createLinearGradient(0, 0, 0, roadTop);
  sky.addColorStop(0, "#cfe8ff");
  sky.addColorStop(1, "#f2f9ff");
  context.fillStyle = sky;
  context.fillRect(0, 0, width, roadTop);
  context.fillStyle = "#ffe8a3";
  context.beginPath(); context.arc(width - 170, sunY, 62, 0, Math.PI * 2); context.fill();
  // Two soft clouds behind the heap, so a lightly loaded van still sits in a lived-in sky.
  context.fillStyle = "#ffffffcc";
  for (const [cx, cy, size] of [[250, sunY + 10, 1], [width - 330, sunY + 90, 0.75]]) {
    for (const [dx, dy, r] of [[-46, 8, 30], [0, -6, 42], [48, 6, 32], [0, 18, 30]]) {
      context.beginPath(); context.arc(cx + dx * size, cy + dy * size, r * size, 0, Math.PI * 2); context.fill();
    }
  }
}

function drawRoad(context: CanvasRenderingContext2D, width: number, top: number, height: number) {
  context.fillStyle = "#5b6170";
  context.fillRect(0, top, width, height);
  context.fillStyle = "#8a909d";
  context.fillRect(0, top, width, 6);
  context.fillStyle = "#ffffff";
  for (let x = 30; x < width; x += 120) context.fillRect(x, top + height / 2, 64, 7);
}

/** The green money board with a painted red-and-yellow edge, like the page counter. */
function drawBoard(context: CanvasRenderingContext2D, card: CardContent, x: number, y: number, width: number, height: number) {
  context.fillStyle = BOARD;
  roundedRect(context, x, y, width, height, 22);
  context.fill();
  context.lineWidth = 6;
  context.strokeStyle = CHILI;
  roundedRect(context, x + 8, y + 8, width - 16, height - 16, 16);
  context.stroke();
  context.setLineDash([14, 10]);
  context.strokeStyle = SUN;
  context.lineWidth = 3;
  roundedRect(context, x + 18, y + 18, width - 36, height - 36, 10);
  context.stroke();
  context.setLineDash([]);
  const mid = x + width * 0.56;
  fitText(context, [{ text: "খরচ", color: "#cfeee0", weight: 600 }], x + 44, y + height * 0.42, 30, 200);
  fitText(context, [{ text: taka(card.spent), color: SUN, weight: 800, display: true }], x + 44, y + height * 0.8, 62, mid - x - 70);
  fitText(context, [{ text: "বাকি", color: "#cfeee0", weight: 600 }], mid, y + height * 0.42, 30, 200);
  fitText(context, [{ text: taka(card.left), color: "#ffffff", weight: 700, display: true }], mid, y + height * 0.8, 48, x + width - mid - 44);
}

const layouts = {
  feed: { title: 104, board: 136, boardH: 150, line: 352, van: 330, vanW: 880, roadH: 70, text: 34, lineSize: 44, gap: 52 },
  story: { title: 372, board: 405, boardH: 160, line: 648, van: 630, vanW: 940, roadH: 84, text: 38, lineSize: 50, gap: 62 },
} as const;

export function drawCard(canvas: HTMLCanvasElement, card: CardContent, format: CardFormat, site: string, van?: HTMLImageElement) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const scale = layout.vanW / VIEW.width;
  const vanX = (width - layout.vanW) / 2;
  // The wheels (bottom of the tyres at y≈210 in the SVG) rest on the road's top edge.
  const roadTop = layout.van + 206 * scale;
  drawSky(context, width, roadTop, layout.line + 110);
  context.fillStyle = "#ffffff";
  context.fillRect(0, roadTop, width, height - roadTop);
  drawRoad(context, width, roadTop, layout.roadH);
  if (format === "story") fitText(context, [{ text: "এক কোটি টাকা খরচ করো · একটুখানি", color: MUTED, weight: 600 }], width / 2, 282, 30, 900, "center");

  fitText(context, [{ text: card.title, color: INK, weight: 800, display: true }], 84, layout.title, 62, 912);
  drawBoard(context, card, 84, layout.board, 912, layout.boardH);
  // The human line sits in the sky above the heap; a full eight-high heap still clears it.
  fitText(context, [{ text: card.line, color: GREEN, weight: 700, display: true }], 84, layout.line, layout.lineSize, 912);

  if (van?.complete && van.naturalWidth) context.drawImage(van, vanX, layout.van, layout.vanW, VIEW.height * scale);
  fitText(context, [{ text: BOARD_TEXT.text, color: "#ffffff", weight: 700, display: true }], vanX + BOARD_TEXT.x * scale, layout.van + BOARD_TEXT.y * scale, BOARD_TEXT.size * scale, 150 * scale, "center");

  let y = roadTop + layout.roadH + layout.gap + 4;
  context.font = `500 ${layout.text}px ${BODY_FONT}`;
  for (const row of wrapText(context, card.list, 912, card.match ? 3 : 4)) {
    fitText(context, [{ text: row, color: INK, weight: 500 }], 84, y, layout.text, 912);
    y += layout.text * 1.45;
  }
  if (card.match) { y += 8; fitText(context, [{ text: card.match, color: CHILI, weight: 700 }], 84, y, layout.text, 912); y += layout.text * 1.45; }
  y += 6;
  fitText(context, [{ text: `${taka(BUDGET)}-এর খেলা · দাম ${PRICE_NOTE}`, color: MUTED, weight: 500 }], 84, y, 24, 912);
  drawFooterBand(context, format, "তুমি এক কোটি টাকায় কী কিনতে?", site, { band: BOARD, ask: SUN, site: "#ffffff" });
}

export async function cardBlob(card: CardContent, format: CardFormat, site: string) {
  const van = await vanImage(card.levels);
  return renderCard(canvas => drawCard(canvas, card, format, site, van));
}
