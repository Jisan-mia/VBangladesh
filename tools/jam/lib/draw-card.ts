import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, wrapText, BODY_FONT, type CardFormat } from "../../../shared/card-canvas";
import { calculate, cleanRoute, habitLine, humanLine, type Commute } from "./jam";

export const colors = { sky: "#cfe3ea", haze: "#eef2ee", bus: "#15805f", busDeep: "#0d5c44", stripe: "#d8392b", trim: "#ffcc33", board: "#17191c", paint: "#ffd23f", glass: "#a9d3df", road: "#3b3f45", white: "#ffffff" } as const;

// Feed and story share the drawing; the story just starts lower (clear of storySafe.top) and gets more road.
const layouts = { feed: { top: 40, road: 1254 }, story: { top: 300, road: 1660 } } as const;

function drawWheel(context: CanvasRenderingContext2D, x: number, y: number) {
  context.fillStyle = "#1e2124";
  context.beginPath(); context.arc(x, y, 60, 0, Math.PI * 2); context.fill();
  context.fillStyle = "#9aa3a8";
  context.beginPath(); context.arc(x, y, 25, 0, Math.PI * 2); context.fill();
  context.fillStyle = "#1e2124";
  context.beginPath(); context.arc(x, y, 10, 0, Math.PI * 2); context.fill();
}

export function drawCard(canvas: HTMLCanvasElement, commute: Commute, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const { top, road } = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const result = calculate(commute);
  const route = cleanRoute(commute.route) || "আমার রোজকার রুট";

  const sky = context.createLinearGradient(0, 0, 0, road);
  sky.addColorStop(0, colors.sky); sky.addColorStop(1, colors.haze);
  context.fillStyle = sky;
  context.fillRect(0, 0, width, height);

  // The bus side: body, skirt, red stripe with a yellow trim line.
  const busTop = top + 20, busBottom = top + 950;
  context.fillStyle = colors.bus;
  roundedRect(context, 50, busTop, 980, busBottom - busTop, 56);
  context.fill();
  context.fillStyle = colors.busDeep;
  context.fillRect(50, busBottom - 70, 980, 70);
  context.fillStyle = colors.stripe;
  context.fillRect(50, top + 392, 980, 34);
  context.fillStyle = colors.trim;
  context.fillRect(50, top + 432, 980, 8);

  // Hand-painted route board.
  context.fillStyle = colors.board;
  roundedRect(context, 100, top + 60, 880, 128, 18);
  context.fill();
  context.strokeStyle = colors.paint; context.lineWidth = 4;
  roundedRect(context, 112, top + 72, 856, 104, 12);
  context.stroke();
  fitText(context, [{ text: route, color: colors.paint, weight: 800, display: true }], width / 2, top + 148, 70, 800, "center");

  // Windows, with the last one as the door.
  const paneWidth = 160, gap = 20;
  for (let index = 0; index < 4; index++) {
    const x = 100 + index * (paneWidth + gap);
    context.fillStyle = colors.glass;
    roundedRect(context, x, top + 216, paneWidth, 146, 14);
    context.fill();
    context.fillStyle = "#ffffff55";
    context.fillRect(x + 18, top + 230, 22, 118);
  }
  const door = 100 + 4 * (paneWidth + gap);
  context.fillStyle = colors.busDeep;
  roundedRect(context, door, top + 216, 980 - door, 146, 14);
  context.fill();
  context.fillStyle = colors.glass;
  roundedRect(context, door + 16, top + 230, 980 - door - 32, 56, 8);
  context.fill();
  fitText(context, [{ text: "সিটিং", color: colors.paint, weight: 700 }], door + (980 - door) / 2, top + 338, 32, 130, "center");

  // The number, painted big on the side.
  fitText(context, [{ text: "জ্যামে জীবনের", color: colors.paint, weight: 700, display: true }], width / 2, top + 505, 54, 860, "center");
  fitText(context, [{ text: result.value, color: colors.white, weight: 800, display: true }, { text: ` ${result.unit}`, color: colors.white, weight: 700, display: true }], width / 2, top + 722, 190, 900, "center");
  fitText(context, [{ text: habitLine(commute), color: "#e3f3ec", weight: 600 }], width / 2, top + 790, 36, 880, "center");

  // Equivalents as three stickers pasted on the skirt.
  const stickers = result.counts.slice(0, 3);
  const stickerWidth = 290, stickerGap = 20, stickerLeft = (width - (stickerWidth * 3 + stickerGap * 2)) / 2;
  stickers.forEach((item, index) => {
    const x = stickerLeft + index * (stickerWidth + stickerGap);
    context.fillStyle = "#fff8dc";
    roundedRect(context, x, top + 822, stickerWidth, 78, 14);
    context.fill();
    fitText(context, [{ text: "= " + item.short, color: colors.board, weight: 700 }], x + stickerWidth / 2, top + 873, 34, stickerWidth - 30, "center");
  });

  // Road, wheels, and the human line written on the tarmac.
  context.fillStyle = colors.road;
  context.fillRect(0, busBottom + 30, width, road - busBottom - 30);
  context.fillStyle = "#e9e9e9";
  for (let x = 20; x < width; x += 160) context.fillRect(x, busBottom + 66, 90, 10);
  drawWheel(context, 250, busBottom + 14);
  drawWheel(context, 830, busBottom + 14);

  const line = humanLine(commute);
  const size = format === "story" ? 50 : 44;
  context.font = `700 ${size}px ${BODY_FONT}`;
  const lines = wrapText(context, line, 960, 3);
  const lineHeight = size * 1.5;
  const roadMiddle = (busBottom + 74 + road) / 2;
  const firstBaseline = roadMiddle - ((lines.length - 1) * lineHeight) / 2 + size * 0.35;
  lines.forEach((text, index) => fitText(context, [{ text, color: colors.white, weight: 700 }], width / 2, firstBaseline + index * lineHeight, size, 940, "center"));

  drawFooterBand(context, format, "তোমার জীবনের কত দিন জ্যামে?", site, { band: colors.board, ask: colors.paint, site: colors.white });
}

export const cardBlob = (commute: Commute, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, commute, format, site));
