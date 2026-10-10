import { BODY_FONT, cardSizes, drawFooterBand, fitText, renderCard, roundedRect, wrapText, type CardFormat } from "../../../shared/card-canvas";
import { bn, chapterById, chapters, moments, packById, TOTAL, type MomentId, type PackId } from "./probash";

export type CardContent = {
  name: string;
  city: string;
  pack: PackId | "";
  picked: readonly MomentId[];
  /** The human line, printed on the visa-style sticker. */
  line: string;
  /** Friend overlay, e.g. "দুজনেরই: এয়ারপোর্টে কান্না". */
  match: string;
};

export const COVER = "#2e2148";
export const COVER_DEEP = "#1d1530";
export const GOLD = "#e3c06a";
const CREAM = "#f6efdc";
const PAPER = "#f2f5ec";
// Rubber-stamp inks: office violet first. Invented, generic stamps: no emblems, seals, codes or airline marks.
export const inks = ["#5b3a91", "#1f4e9c", "#b3261e", "#1e6b45", "#33313d"] as const;
export const shapes = ["rect", "oval", "pill", "arch", "perf"] as const;
export type Shape = (typeof shapes)[number];

/** Each moment keeps its own ink, shape and tilt, so a stamp looks the same on the page and on every card. */
export function stampStyle(id: MomentId) {
  const { chapter } = moments.find(moment => moment.id === id)!;
  const page = chapters.findIndex(item => item.id === chapter);
  const place = moments.filter(moment => moment.chapter === chapter).findIndex(moment => moment.id === id);
  let hash = 7;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) % 9973;
  // Steps of 2 and 3 (mod 5) keep neighbours on a page apart in both ink and shape.
  return { ink: inks[(place * 2 + page * 3) % inks.length], shape: shapes[(place * 3 + page * 2) % shapes.length] as Shape, tilt: (hash % 17) - 8, seed: hash };
}

/**
 * Where the stamps go: an even number of columns, so no stamp sits on the booklet's fold, picked to make stamps as big as the area allows.
 * Returns the stamp size and each stamp's centre, in order.
 */
export function stampGrid(count: number, left: number, top: number, width: number, height: number, aspect = 1.55) {
  let best = { columns: 2, rows: 1, w: 0, h: 0 };
  for (const columns of [2, 4, 6]) {
    const rows = Math.max(1, Math.ceil(count / columns));
    const w = Math.min(width / columns * 0.92, (height / rows) * 0.92 * aspect, 400);
    if (w > best.w) best = { columns, rows, w, h: w / aspect };
  }
  const cellW = width / best.columns, cellH = height / best.rows;
  const centres = Array.from({ length: count }, (_, index) => ({ x: left + (index % best.columns + 0.5) * cellW, y: top + (Math.floor(index / best.columns) + 0.5) * cellH }));
  return { ...best, cellW, cellH, centres };
}

/** A tiny repeatable random sequence, so a card's ink specks don't change between redraws. */
function random(seed: number) {
  let value = seed % 2147483647 || 1;
  return () => (value = (value * 16807) % 2147483647) / 2147483647;
}

function shapePath(context: CanvasRenderingContext2D, shape: Shape, w: number, h: number) {
  context.beginPath();
  if (shape === "oval") context.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
  else if (shape === "pill") context.roundRect(-w / 2, -h / 2, w, h, h / 2);
  else if (shape === "arch") context.roundRect(-w / 2, -h / 2, w, h, [h * 0.42, h * 0.42, h * 0.08, h * 0.08]);
  else context.roundRect(-w / 2, -h / 2, w, h, h * 0.07);
}

function drawStamp(context: CanvasRenderingContext2D, id: MomentId, x: number, y: number, w: number, h: number) {
  const moment = moments.find(item => item.id === id)!;
  const { ink, shape, tilt, seed } = stampStyle(id);
  const line = Math.max(3, h * 0.045);
  const inset = line * 2.4;
  context.save();
  context.translate(x, y);
  context.rotate((tilt * Math.PI) / 180);
  context.globalCompositeOperation = "multiply";
  context.globalAlpha = 0.9;
  context.strokeStyle = ink;
  context.lineWidth = line;
  shapePath(context, shape, w, h);
  context.stroke();
  context.lineWidth = Math.max(1.5, line * 0.45);
  if (shape === "perf") context.setLineDash([line * 1.4, line * 1.2]);
  shapePath(context, shape, w - inset * 2, h - inset * 2);
  context.stroke();
  context.setLineDash([]);

  const room = shape === "oval" ? w * 0.6 : shape === "pill" ? w * 0.7 : w * 0.78;
  fitText(context, [{ text: `— ${chapterById(moment.chapter).stamp} —`, color: ink, weight: 600 }], 0, -h * 0.24, h * 0.13, room * 0.85, "center");
  // Shrink a little before giving up: an oval's narrow middle can't take every label at full size.
  let size = h * 0.2, lines: string[] = [];
  for (; size >= h * 0.15; size -= h * 0.01) {
    context.font = `700 ${size}px ${BODY_FONT}`;
    lines = wrapText(context, moment.card, room, 2);
    if (!lines.at(-1)!.endsWith("…")) break;
  }
  const baselines = lines.length > 1 ? [-h * 0.02, h * 0.2] : [h * 0.09];
  lines.forEach((text, index) => fitText(context, [{ text, color: ink, weight: 700 }], 0, baselines[index], size, room, "center"));
  fitText(context, [{ text: "★  ★  ★", color: ink, weight: 600 }], 0, h * 0.37, h * 0.09, room, "center");

  // Uneven ink: a few paper-coloured specks, as if the stamp pad was running dry.
  context.globalCompositeOperation = "source-over";
  context.globalAlpha = 0.6;
  context.fillStyle = PAPER;
  const next = random(seed * 131 + 17);
  for (let index = 0, specks = Math.round((w * h) / 700); index < specks; index++) {
    context.beginPath();
    context.arc((next() - 0.5) * w, (next() - 0.5) * h, 0.6 + next() * 2, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}

/** The open booklet: cover edge, two guilloché pages and the fold between them. Generic security-print waves and rosettes, no emblem. */
function drawSpread(context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  context.fillStyle = COVER_DEEP;
  roundedRect(context, x - 12, y - 10, w + 24, h + 22, 22);
  context.fill();
  context.fillStyle = PAPER;
  roundedRect(context, x, y, w, h, 10);
  context.fill();
  context.save();
  roundedRect(context, x, y, w, h, 10);
  context.clip();
  context.lineWidth = 1.4;
  [["#cfe2d6", 0], ["#f1d9c8", Math.PI / 2]].forEach(([color, phase]) => {
    context.strokeStyle = color as string;
    for (let row = y - 20; row < y + h + 20; row += 15) {
      context.beginPath();
      for (let px = x; px <= x + w; px += 8) {
        const py = row + 6 * Math.sin(px / 38 + (phase as number) + row / 60);
        if (px === x) context.moveTo(px, py); else context.lineTo(px, py);
      }
      context.stroke();
    }
  });
  // A faint rosette on each page.
  context.strokeStyle = "#bcd3c5";
  context.lineWidth = 1.2;
  for (const cx of [x + w / 4, x + (w * 3) / 4]) {
    const cy = y + h * 0.42, big = Math.min(w / 4, h / 2) * 0.8, small = big * 0.28, reach = big * 0.55;
    context.beginPath();
    for (let step = 0; step <= 720; step++) {
      const t = (step / 720) * Math.PI * 14;
      const px = cx + (big - small) * Math.cos(t) + reach * Math.cos(((big - small) / small) * t);
      const py = cy + (big - small) * Math.sin(t) - reach * Math.sin(((big - small) / small) * t);
      if (step === 0) context.moveTo(px, py); else context.lineTo(px, py);
    }
    context.stroke();
  }
  const fold = context.createLinearGradient(x + w / 2 - 46, 0, x + w / 2 + 46, 0);
  fold.addColorStop(0, "rgba(46,33,72,0)");
  fold.addColorStop(0.5, "rgba(46,33,72,.16)");
  fold.addColorStop(1, "rgba(46,33,72,0)");
  context.fillStyle = fold;
  context.fillRect(x + w / 2 - 46, y, 92, h);
  context.restore();
  context.strokeStyle = "rgba(46,33,72,.28)";
  context.lineWidth = 2;
  context.beginPath(); context.moveTo(x + w / 2, y); context.lineTo(x + w / 2, y + h); context.stroke();
}

function stickerLines(context: CanvasRenderingContext2D, card: CardContent, w: number, size: number) {
  context.font = `700 ${size}px ${BODY_FONT}`;
  const lines = wrapText(context, card.line, w - 80, 2);
  return { lines, height: 44 + lines.length * size * 1.35 + (card.match ? size * 1.15 : 0) };
}

/** The visa-style sticker that carries the human line, glued across the fold. */
function drawSticker(context: CanvasRenderingContext2D, card: CardContent, x: number, bottom: number, w: number, size: number) {
  const { lines, height } = stickerLines(context, card, w, size);
  const top = bottom - height;
  context.save();
  context.translate(x + w / 2, top + height / 2);
  context.rotate(-0.012);
  context.shadowColor = "rgba(29,21,48,.22)";
  context.shadowBlur = 14;
  context.shadowOffsetY = 4;
  context.fillStyle = "#fffdf6";
  roundedRect(context, -w / 2, -height / 2, w, height, 14);
  context.fill();
  context.shadowColor = "transparent";
  context.strokeStyle = inks[0];
  context.lineWidth = 2;
  roundedRect(context, -w / 2 + 10, -height / 2 + 10, w - 20, height - 20, 8);
  context.stroke();
  let baseline = -height / 2 + 22 + size;
  for (const text of lines) {
    fitText(context, [{ text, color: COVER, weight: 700, display: true }], 0, baseline, size, w - 80, "center");
    baseline += size * 1.35;
  }
  if (card.match) fitText(context, [{ text: card.match, color: inks[2], weight: 700 }], 0, baseline - size * 0.15, size * 0.78, w - 80, "center");
  context.restore();
  return height;
}

const layouts = {
  feed: { kicker: 74, title: 158, titleSize: 86, who: 214, spreadTop: 268, lineSize: 40 },
  story: { kicker: 320, title: 418, titleSize: 96, who: 494, spreadTop: 556, lineSize: 46 },
} as const;

export function drawCard(canvas: HTMLCanvasElement, card: CardContent, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  context.fillStyle = COVER;
  context.fillRect(0, 0, width, height);
  // Gold foil rules around the cover lettering, like a passport cover, without any emblem.
  context.strokeStyle = GOLD;
  context.globalAlpha = 0.55;
  context.lineWidth = 2.5;
  context.strokeRect(22, 22, width - 44, layout.spreadTop - 40);
  context.lineWidth = 1;
  context.strokeRect(32, 32, width - 64, layout.spreadTop - 60);
  context.globalAlpha = 1;

  fitText(context, [{ text: card.pack ? packById(card.pack).card : "পাসপোর্টের পাতা", color: CREAM, weight: 600 }], 64, layout.kicker, 30, 700);
  fitText(context, [{ text: "প্রবাস জীবন", color: GOLD, weight: 800, display: true }], 64, layout.title, layout.titleSize, 900);
  const who = [card.name, card.city].filter(Boolean).join(" · ");
  fitText(context, [...(who ? [{ text: `${who} · `, color: CREAM, weight: 600 }] : []), { text: `${bn(TOTAL)}-এ ${bn(card.picked.length)}টা সিল`, color: GOLD, weight: 800, display: true }], 64, layout.who, 44, 952);

  const footerTop = format === "story" ? height - 260 : height - 96;
  const spread = { x: 40, y: layout.spreadTop, w: width - 80, h: footerTop - 30 - layout.spreadTop };
  drawSpread(context, spread.x, spread.y, spread.w, spread.h);

  // Measure the sticker first so the stamps get the rest of the page.
  const stickerHeight = stickerLines(context, card, spread.w - 100, layout.lineSize).height;
  const area = { x: spread.x + 26, y: spread.y + 24, w: spread.w - 52, h: spread.h - stickerHeight - 64 };
  const ordered = moments.filter(moment => card.picked.includes(moment.id));
  const grid = stampGrid(ordered.length, area.x, area.y, area.w, area.h);
  ordered.forEach((moment, index) => {
    const { seed } = stampStyle(moment.id);
    // Nudge each stamp inside its cell so the page looks hand-stamped, not printed.
    const dx = ((seed % 11) / 10 - 0.5) * (grid.cellW - grid.w) * 0.8;
    const dy = (((seed >> 3) % 11) / 10 - 0.5) * (grid.cellH - grid.h) * 0.8;
    drawStamp(context, moment.id, grid.centres[index].x + dx, grid.centres[index].y + dy, grid.w, grid.h);
  });
  if (!ordered.length) fitText(context, [{ text: "এখনো কোনো সিল পড়েনি", color: "#8a8399", weight: 600 }], width / 2, area.y + area.h / 2, 40, 800, "center");

  drawSticker(context, card, spread.x + 50, spread.y + spread.h - 22, spread.w - 100, layout.lineSize);
  drawFooterBand(context, format, "তোমার পাসপোর্টে কয়টা সিল?", site, { band: COVER_DEEP, ask: GOLD, site: "#ffffff" });
}

export const cardBlob = (card: CardContent, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, card, format, site));
