import { cardSizes, drawFooterBand, fitText, renderCard, wrapText, DISPLAY_FONT, type CardFormat, type Photo } from "../../../shared/card-canvas";
import { bn, englishText, type Card } from "./boyos";

const PAPER = "#f2eee4";
const INK = "#161412";
const RED = "#c41e2a";
const MUTED = "#5f5850";
const GREY = "#cdc6b8";
const LEFT = 64, RIGHT = 1016, WIDTH = RIGHT - LEFT;

function rule(context: CanvasRenderingContext2D, y: number, weight: number, x1 = LEFT, x2 = RIGHT) {
  context.fillStyle = INK;
  context.fillRect(x1, y, x2 - x1, weight);
}

/** Grey bars standing in for column text, so the card reads as a printed page at a glance. */
function columnText(context: CanvasRenderingContext2D, x: number, y: number, width: number, rows: number) {
  context.fillStyle = GREY;
  for (let row = 0; row < rows; row++) {
    const short = row === rows - 1 ? 0.55 : row % 3 === 1 ? 0.92 : 1;
    context.fillRect(x, y + row * 26, width * short, 9);
  }
}

function photoBox(context: CanvasRenderingContext2D, photo: Photo, x: number, y: number, width: number, height: number) {
  const scale = Math.max(width / photo.width, height / photo.height);
  const sw = width / scale, sh = height / scale;
  context.save();
  context.filter = "grayscale(1) contrast(1.08)";
  context.drawImage(photo, (photo.width - sw) / 2, (photo.height - sh) / 2, sw, sh, x, y, width, height);
  context.restore();
  context.strokeStyle = INK; context.lineWidth = 3;
  context.strokeRect(x, y, width, height);
  fitText(context, [{ text: "ছবি: পারিবারিক অ্যালবাম", color: MUTED, weight: 500 }], x, y + height + 30, 22, width);
}

function stamp(context: CanvasRenderingContext2D, card: Card, cx: number, cy: number, radius: number) {
  context.save();
  context.translate(cx, cy);
  context.rotate(-0.14);
  context.fillStyle = "rgba(242,238,228,.9)";
  context.beginPath(); context.arc(0, 0, radius, 0, Math.PI * 2); context.fill();
  context.strokeStyle = RED;
  context.lineWidth = 6;
  context.beginPath(); context.arc(0, 0, radius - 4, 0, Math.PI * 2); context.stroke();
  context.lineWidth = 2;
  context.beginPath(); context.arc(0, 0, radius - 18, 0, Math.PI * 2); context.stroke();
  fitText(context, [{ text: card.season.people.split(" ")[0], color: RED, weight: 800, display: true }], 0, radius * 0.1, radius * 0.48, radius * 1.4, "center");
  fitText(context, [{ text: "মানুষ", color: RED, weight: 700, display: true }], 0, radius * 0.52, radius * 0.3, radius * 1.2, "center");
  fitText(context, [{ text: "জন্মঋতু", color: RED, weight: 600 }], 0, -radius * 0.5, radius * 0.17, radius, "center");
  context.restore();
}

function briefs(context: CanvasRenderingContext2D, card: Card, x: number, y: number, width: number, gap: number) {
  const items: Array<[string, string]> = [
    ["বাংলা জন্মতারিখ", card.banglaText],
    ["জন্মবার", card.weekday],
    ["পরের জন্মদিন", card.next.days ? `আর ${bn(card.next.days)} দিন` : "আজই!"],
    [`${bn(card.milestone.count)} দিন পূর্ণ হবে`, englishText(card.milestone.date)],
  ];
  items.forEach(([label, value], index) => {
    const top = y + index * gap;
    fitText(context, [{ text: label, color: RED, weight: 700 }], x, top, 26, width);
    fitText(context, [{ text: value, color: INK, weight: 700, display: true }], x, top + 50, 42, width);
    if (index < items.length - 1) { context.fillStyle = GREY; context.fillRect(x, top + gap - 40, width, 2); }
  });
}

const layouts = {
  feed: { top: 0, mast: 186, mastSize: 112, head: 410, headSize: 120, sub: 478, body: 560, bodyHeight: 476, gap: 116 },
  story: { top: 250, mast: 430, mastSize: 116, head: 670, headSize: 128, sub: 746, body: 840, bodyHeight: 600, gap: 148 },
} as const;

export function drawCard(canvas: HTMLCanvasElement, card: Card, format: CardFormat, site: string, photo?: Photo | null) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  context.fillStyle = PAPER;
  context.fillRect(0, 0, width, height);
  if (format === "story") { context.fillStyle = "#e7e1d3"; context.fillRect(0, 0, width, layout.top - 20); fitText(context, [{ text: "জন্মদিনের খবর · একটুখানি", color: MUTED, weight: 600 }], width / 2, 170, 30, 900, "center"); }

  // Ears and masthead: a made-up paper, never a real daily's look.
  const ear = layout.top + 62;
  fitText(context, [{ text: "প্রথম পাতা · জন্মদিন সংখ্যা", color: MUTED, weight: 600 }], LEFT, ear, 24, 460);
  fitText(context, [{ text: "দাম: এক টুকরো কেক", color: MUTED, weight: 600 }], RIGHT, ear, 24, 400, "right");
  rule(context, ear + 18, 2);
  fitText(context, [{ text: "দৈনিক একটুখানি", color: INK, weight: 800, display: true }], width / 2, layout.mast, layout.mastSize, WIDTH, "center");
  rule(context, layout.mast + 30, 7);
  fitText(context, [{ text: card.dateline, color: INK, weight: 600 }], width / 2, layout.mast + 78, 30, WIDTH, "center");
  rule(context, layout.mast + 98, 2);

  fitText(context, [{ text: card.headline, color: INK, weight: 800, display: true }], LEFT, layout.head, layout.headSize, WIDTH);
  fitText(context, [{ text: card.subhead, color: INK, weight: 600 }], LEFT, layout.sub, 38, WIDTH);
  rule(context, layout.sub + 32, 2);

  // Body: news briefs on the left; the photo (or column text) and the season stamp on the right.
  const split = 560;
  context.fillStyle = GREY; context.fillRect(split + 20, layout.body - 10, 2, layout.bodyHeight);
  briefs(context, card, LEFT, layout.body + 34, split - LEFT - 10, layout.gap);
  const colX = split + 44, colW = RIGHT - colX;
  if (photo) {
    photoBox(context, photo, colX, layout.body, colW, layout.bodyHeight - 70);
    stamp(context, card, colX + colW - 72, layout.body + layout.bodyHeight - 120, 88);
  } else {
    stamp(context, card, colX + colW / 2, layout.body + 130, 122);
    columnText(context, colX, layout.body + 290, colW, Math.floor((layout.bodyHeight - 300) / 26));
  }

  // The human line as a pull quote, wrapped into two even lines rather than a long one and an orphan.
  const quoteRule = layout.body + layout.bodyHeight + 16;
  rule(context, quoteRule, 2);
  fitText(context, [{ text: "“", color: RED, weight: 800, display: true }], LEFT - 6, quoteRule + 96, 110, 80);
  context.font = `700 44px ${DISPLAY_FONT}`;
  const full = context.measureText(card.line).width;
  const lines = wrapText(context, card.line, full > WIDTH - 80 ? Math.min(WIDTH - 80, full / 2 + 60) : WIDTH - 80, 2);
  lines.forEach((line, index) => fitText(context, [{ text: line, color: INK, weight: 700, display: true }], LEFT + 70, quoteRule + 64 + index * 58, 44, WIDTH - 80));
  if (card.match) fitText(context, [{ text: card.match, color: RED, weight: 700 }], LEFT + 70, quoteRule + 64 + lines.length * 58 - 4, 34, WIDTH - 80);

  drawFooterBand(context, format, "তোমার জন্ম কোন ঋতুতে?", site, { band: INK, ask: "#ffd166", site: "#ffffff" });
}

export const cardBlob = (card: Card, format: CardFormat, site: string, photo?: Photo | null) => renderCard(canvas => drawCard(canvas, card, format, site, photo));
