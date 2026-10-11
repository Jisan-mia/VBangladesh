import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, wrapText, DISPLAY_FONT, type CardFormat, type Photo } from "../../../shared/card-canvas";
import { bn, englishText, seasons, type Card, type LifeSeasons } from "./boyos";

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

// The season grid ("জীবনের ঋতু"): an inside page of the same paper. Muted print inks, one per season, in `seasons` order.
export const seasonInks = ["#d9622b", "#2e6e8e", "#8fbcd4", "#c99a2e", "#6b7785", "#5f9e4a"] as const;

/** One row per Bangla year (বৈশাখ→চৈত্র, six cells), ten rows to a block so it reads in decades. Only lived seasons are filled. */
function seasonGrid(context: CanvasRenderingContext2D, ritu: LifeSeasons, x: number, y: number, width: number, height: number) {
  const firstYear = Math.floor(ritu.first / 6), years = Math.floor(ritu.now / 6) - firstYear + 1, blocks = Math.ceil(years / 10);
  // Sizes in units of the cell pitch: a block is 6 wide plus a 1.2 gap; block rows are 10 tall plus a 1.2 gap; a cell is 0.8.
  const fit = (lines: number) => {
    const across = Math.ceil(blocks / lines), tall = lines === 1 ? Math.min(years, 10) : 10;
    const w = (across - 1) * 7.2 + 5.8, h = (lines - 1) * 11.2 + tall - 0.2;
    return { across, w, h, pitch: Math.min(64, width / w, height / h) };
  };
  let best = fit(1);
  for (let lines = 2; lines <= blocks; lines++) { const next = fit(lines); if (next.pitch > best.pitch) best = next; }
  const { across, pitch } = best, size = pitch * 0.8;
  const left = x + (width - best.w * pitch) / 2, top = y + (height - best.h * pitch) / 2;
  for (let year = 0; year < years; year++) {
    const block = Math.floor(year / 10);
    const cy = top + Math.floor(block / across) * 11.2 * pitch + (year % 10) * pitch;
    for (let s = 0; s < 6; s++) {
      const number = (firstYear + year) * 6 + s;
      if (number < ritu.first) continue;
      const cx = left + (block % across) * 7.2 * pitch + s * pitch;
      roundedRect(context, cx, cy, size, size, size * 0.22);
      if (number > ritu.now) { context.strokeStyle = GREY; context.lineWidth = Math.max(1.5, size * 0.07); context.stroke(); continue; }
      context.fillStyle = seasonInks[s]; context.fill();
      if (number === ritu.first) {
        context.fillStyle = "#fff"; context.strokeStyle = INK; context.lineWidth = Math.max(1.5, size * 0.06);
        context.beginPath(); context.arc(cx + size / 2, cy + size / 2, Math.max(3, size * 0.2), 0, Math.PI * 2); context.fill(); context.stroke();
      }
      if (number === ritu.now) {
        const ring = Math.max(3, size * 0.14);
        roundedRect(context, cx - ring, cy - ring, size + ring * 2, size + ring * 2, size * 0.3);
        context.strokeStyle = INK; context.lineWidth = ring; context.stroke();
      }
    }
  }
}

const rituLayouts = {
  feed: { top: 0, kicker: 146, head: 258, sub: 328, gridTop: 384, gridBottom: 996, legend: 1058, key: 1110, line: 1190 },
  story: { top: 250, kicker: 400, head: 516, sub: 588, gridTop: 650, gridBottom: 1356, legend: 1424, key: 1480, line: 1576 },
} as const;

export function drawRituCard(canvas: HTMLCanvasElement, card: Card, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = rituLayouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  context.fillStyle = PAPER;
  context.fillRect(0, 0, width, height);
  if (format === "story") { context.fillStyle = "#e7e1d3"; context.fillRect(0, 0, width, layout.top - 20); fitText(context, [{ text: "জীবনের ঋতু · একটুখানি", color: MUTED, weight: 600 }], width / 2, 170, 30, 900, "center"); }

  const ear = layout.top + 62;
  fitText(context, [{ text: "দৈনিক একটুখানি · ঋতুর পাতা", color: MUTED, weight: 600 }], LEFT, ear, 24, 520);
  fitText(context, [{ text: "দাম: এক টুকরো কেক", color: MUTED, weight: 600 }], RIGHT, ear, 24, 400, "right");
  rule(context, ear + 18, 7);
  fitText(context, [{ text: card.rituKicker, color: RED, weight: 700 }], LEFT, layout.kicker, 36, WIDTH);
  fitText(context, [{ text: card.rituHeadline, color: INK, weight: 800, display: true }], LEFT, layout.head, 96, WIDTH);
  fitText(context, [{ text: `${card.banglaText} থেকে আজ ${card.todayText}`, color: INK, weight: 600 }], LEFT, layout.sub, 32, WIDTH);
  rule(context, layout.sub + 22, 2);

  seasonGrid(context, card.ritu, LEFT, layout.gridTop, WIDTH, layout.gridBottom - layout.gridTop);

  // Legend: each season's ink with how many of it were lived.
  rule(context, layout.legend - 44, 2);
  const slot = WIDTH / 6;
  seasons.forEach((season, index) => {
    const x = LEFT + index * slot;
    roundedRect(context, x, layout.legend - 26, 30, 30, 7);
    context.fillStyle = seasonInks[index]; context.fill();
    fitText(context, [{ text: `${season.label} `, color: INK, weight: 600 }, { text: bn(card.ritu.counts[index]), color: INK, weight: 800 }], x + 40, layout.legend, 28, slot - 48);
  });
  // Key for the two marked cells, drawn the way the grid draws them.
  const key = layout.key;
  roundedRect(context, LEFT, key - 22, 26, 26, 6); context.fillStyle = seasonInks[card.ritu.first % 6]; context.fill();
  context.fillStyle = "#fff"; context.strokeStyle = INK; context.lineWidth = 1.5;
  context.beginPath(); context.arc(LEFT + 13, key - 9, 5, 0, Math.PI * 2); context.fill(); context.stroke();
  fitText(context, [{ text: "জন্মের ঋতু", color: MUTED, weight: 600 }], LEFT + 38, key, 24, 170);
  roundedRect(context, LEFT + 234, key - 22, 26, 26, 6); context.fillStyle = seasonInks[card.ritu.now % 6]; context.fill();
  context.strokeStyle = INK; context.lineWidth = 4; context.stroke();
  fitText(context, [{ text: "এখন", color: MUTED, weight: 600 }], LEFT + 272, key, 24, 80);
  fitText(context, [{ text: "প্রতি সারি এক বাংলা বছর, বৈশাখ থেকে চৈত্র", color: MUTED, weight: 500 }], RIGHT, key, 24, WIDTH - 380, "right");

  rule(context, layout.line - 56, 2);
  fitText(context, [{ text: "“", color: RED, weight: 800, display: true }], LEFT - 6, layout.line + 30, 96, 70);
  fitText(context, [{ text: card.rituLine, color: INK, weight: 700, display: true }], LEFT + 60, layout.line, 40, WIDTH - 60);

  drawFooterBand(context, format, "তুমি কয়টা ঋতু দেখেছ?", site, { band: INK, ask: "#ffd166", site: "#ffffff" });
}

export const rituBlob = (card: Card, format: CardFormat, site: string) => renderCard(canvas => drawRituCard(canvas, card, format, site));
