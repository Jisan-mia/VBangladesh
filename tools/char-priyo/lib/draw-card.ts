import { BODY_FONT, DISPLAY_FONT, cardSizes, drawFooterBand, fitText, renderCard, roundedRect, type CardFormat } from "../../../shared/card-canvas";
import { describe, headline, shelfLooks, type CatId, type Choice, type Look } from "./shelf";

export type CardContent = { cat: CatId; name: string; picks: Choice[]; line: string; match: string };

const WALL = "#efe2c8";
const WOOD_DARK = "#3a2414";
const INK = "#2b1a0e";
const CARD_INK = "#5b3a1e";
const MATCH = "#9c3b22";

const layouts = {
  feed: { sign: 64, signHeight: 226, title: 84, shelfTop: 338, board: 1058, spine: 652, line: 1168, match: 1222 },
  story: { sign: 286, signHeight: 262, title: 96, shelfTop: 618, board: 1428, spine: 744, line: 1534, match: 1598 },
} as const;

function drawWall(context: CanvasRenderingContext2D, width: number, height: number) {
  context.fillStyle = WALL;
  context.fillRect(0, 0, width, height);
  // Lime-wash streaks, the kind on a Nilkhet stall wall.
  context.globalAlpha = 0.05;
  for (let x = 0, i = 0; x < width; x += 22 + (i * 37) % 19, i++) {
    context.fillStyle = i % 2 ? "#8a6a3c" : "#ffffff";
    context.fillRect(x, 0, 6 + (i * 13) % 9, height);
  }
  context.globalAlpha = 1;
}

/** The hand-lettered cardboard sign, hung from a nail by a string. */
function drawSign(context: CanvasRenderingContext2D, card: CardContent, format: CardFormat) {
  const layout = layouts[format];
  const x = 96, y = layout.sign, width = 888, height = layout.signHeight;
  context.strokeStyle = "#7a5a3a";
  context.lineWidth = 3;
  context.beginPath(); context.moveTo(x + 70, y + 26); context.lineTo(540, y - 34); context.lineTo(x + width - 70, y + 26); context.stroke();
  context.fillStyle = "#6b6b6b";
  context.beginPath(); context.arc(540, y - 36, 8, 0, Math.PI * 2); context.fill();
  context.save();
  context.translate(540, y + height / 2);
  context.rotate(-0.018);
  context.translate(-540, -(y + height / 2));
  context.shadowColor = "rgba(60,35,10,.28)"; context.shadowBlur = 16; context.shadowOffsetY = 8;
  context.fillStyle = "#d8b47c";
  roundedRect(context, x, y, width, height, 10);
  context.fill();
  context.shadowColor = "transparent";
  // corrugation lines, very faint
  context.strokeStyle = "rgba(120,80,30,.12)";
  context.lineWidth = 2;
  for (let line = y + 18; line < y + height; line += 14) { context.beginPath(); context.moveTo(x + 6, line); context.lineTo(x + width - 6, line); context.stroke(); }
  context.fillStyle = "#f3e6cc";
  for (const hole of [x + 70, x + width - 70]) { context.beginPath(); context.arc(hole, y + 26, 7, 0, Math.PI * 2); context.fill(); }
  fitText(context, [{ text: "নীলক্ষেতের তাক থেকে", color: CARD_INK, weight: 600 }], 540, y + 80, format === "story" ? 34 : 30, 700, "center");
  fitText(context, [{ text: headline(card), color: INK, weight: 800, display: true }], 540, y + height - 52, layout.title, width - 80, "center");
  context.restore();
}

function woodGrain(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, base: string, light: string) {
  context.fillStyle = base;
  context.fillRect(x, y, width, height);
  context.strokeStyle = light;
  context.globalAlpha = 0.35;
  context.lineWidth = 2;
  for (let line = y + 6, i = 0; line < y + height - 2; line += 7 + (i % 3) * 3, i++) {
    context.beginPath();
    context.moveTo(x, line);
    context.bezierCurveTo(x + width * 0.3, line + (i % 2 ? 3 : -3), x + width * 0.7, line + (i % 2 ? -3 : 3), x + width, line);
    context.stroke();
  }
  context.globalAlpha = 1;
}

function drawFrame(context: CanvasRenderingContext2D, top: number, board: number) {
  // back panel
  const back = context.createLinearGradient(0, top, 0, board);
  back.addColorStop(0, "#2e1b0f"); back.addColorStop(1, "#4a2e1a");
  context.fillStyle = back;
  context.fillRect(84, top, 912, board - top);
  context.strokeStyle = "rgba(255,230,190,.05)";
  context.lineWidth = 3;
  for (let x = 120; x < 996; x += 64) { context.beginPath(); context.moveTo(x, top); context.lineTo(x, board); context.stroke(); }
  // the shelf above, the posts, and its shadow on the back panel
  woodGrain(context, 56, top - 34, 968, 34, "#6d4426", "#9a6a3e");
  const shade = context.createLinearGradient(0, top, 0, top + 60);
  shade.addColorStop(0, "rgba(0,0,0,.45)"); shade.addColorStop(1, "rgba(0,0,0,0)");
  context.fillStyle = shade;
  context.fillRect(84, top, 912, 60);
  woodGrain(context, 56, top - 34, 30, board - top + 34, "#7a4e2c", "#a37446");
  woodGrain(context, 994, top - 34, 30, board - top + 34, "#7a4e2c", "#a37446");
}

function drawBoard(context: CanvasRenderingContext2D, board: number) {
  const drop = context.createLinearGradient(0, board + 44, 0, board + 64);
  drop.addColorStop(0, "rgba(60,35,10,.35)"); drop.addColorStop(1, "rgba(60,35,10,0)");
  context.fillStyle = drop;
  context.fillRect(40, board + 44, 1000, 20);
  woodGrain(context, 40, board, 1000, 44, "#8a5a30", "#b98550");
  context.fillStyle = "#b07a45";
  context.fillRect(40, board, 1000, 6);
}

function drawEmblem(context: CanvasRenderingContext2D, cat: CatId, cx: number, cy: number, color: string) {
  context.save();
  context.strokeStyle = color; context.fillStyle = color; context.lineWidth = 3; context.lineCap = "round"; context.lineJoin = "round";
  context.beginPath();
  if (cat === "natok") {
    context.roundRect(cx - 17, cy - 9, 34, 24, 4); context.moveTo(cx - 8, cy - 18); context.lineTo(cx, cy - 10); context.lineTo(cx + 8, cy - 18);
  } else if (cat === "cinema") {
    context.arc(cx, cy, 15, 0, Math.PI * 2);
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.6; context.moveTo(cx + Math.cos(a) * 7 + 3.5, cy + Math.sin(a) * 7); context.arc(cx + Math.cos(a) * 7, cy + Math.sin(a) * 7, 3.5, 0, Math.PI * 2); }
  } else if (cat === "boi") {
    context.moveTo(cx, cy - 8); context.lineTo(cx - 16, cy - 12); context.lineTo(cx - 16, cy + 10); context.lineTo(cx, cy + 14); context.lineTo(cx + 16, cy + 10); context.lineTo(cx + 16, cy - 12); context.closePath(); context.moveTo(cx, cy - 8); context.lineTo(cx, cy + 14);
  } else {
    context.roundRect(cx - 18, cy - 11, 36, 22, 3); context.moveTo(cx - 3, cy - 2); context.arc(cx - 7, cy - 2, 4, 0, Math.PI * 2); context.moveTo(cx + 11, cy - 2); context.arc(cx + 7, cy - 2, 4, 0, Math.PI * 2);
  }
  context.stroke();
  context.restore();
}

/** Splits a long title into two lines at the space that balances them best. */
function balancedLines(context: CanvasRenderingContext2D, text: string) {
  const words = text.split(" ");
  let best: [string, string] | null = null, bestWidth = Infinity;
  for (let i = 1; i < words.length; i++) {
    const pair: [string, string] = [words.slice(0, i).join(" "), words.slice(i).join(" ")];
    const width = Math.max(...pair.map(line => context.measureText(line).width));
    if (width < bestWidth) { best = pair; bestWidth = width; }
  }
  return best;
}

/**
 * Title (and creator) lettered along the spine, top to bottom, the way Bangla and English spines read.
 * After rotating, x runs down the spine and y points to the screen's left.
 */
function drawSpineText(context: CanvasRenderingContext2D, x: number, top: number, width: number, length: number, title: string, by: string, look: Look) {
  context.save();
  context.translate(x + width / 2, top);
  context.rotate(Math.PI / 2);
  const font = look.typed ? BODY_FONT : DISPLAY_FONT;
  const weight = look.typed ? 600 : 700;
  const cap = Math.min(width * (by ? 0.35 : 0.42), look.typed ? 52 : 66);
  context.font = `${weight} ${cap}px ${font}`;
  let lines = [title];
  let size = Math.min(cap, (cap * length) / context.measureText(title).width);
  // Too small on one line: two lines read better on a wide spine.
  if (size < cap * 0.62) {
    const pair = balancedLines(context, title);
    if (pair) {
      const two = Math.min(cap * 0.74, (cap * length) / Math.max(...pair.map(line => context.measureText(line).width)));
      if (two > size * 1.15) { lines = pair; size = two; }
    }
  }
  const bySize = Math.min(size * 0.5, width * 0.15, 30);
  const lineGap = size * 1.08;
  const block = size * 0.95 + (lines.length - 1) * lineGap + (by ? size * 0.3 + bySize * 1.1 : 0);
  let baseline = -block / 2 + size * 0.75;
  for (const line of lines) {
    fitText(context, [{ text: line, color: look.ink, weight, display: !look.typed }], length / 2, baseline, size, length, "center");
    baseline += lineGap;
  }
  if (by) fitText(context, [{ text: by, color: look.ink, weight: 500 }], length / 2, baseline - lineGap + size * 0.3 + bySize * 1.05, bySize, length, "center");
  context.restore();
}

function drawSpine(context: CanvasRenderingContext2D, cat: CatId, pick: Choice, look: Look, x: number, y: number, width: number, height: number) {
  const { title, by } = describe(cat, pick);
  context.save();
  context.shadowColor = "rgba(0,0,0,.35)"; context.shadowBlur = 10; context.shadowOffsetX = 4;
  context.fillStyle = look.bg;
  roundedRect(context, x, y, width, height, 6);
  context.fill();
  context.restore();
  // a rounded spine: light on the left edge, shadow on the right
  const shade = context.createLinearGradient(x, 0, x + width, 0);
  shade.addColorStop(0, "rgba(255,255,255,.18)"); shade.addColorStop(0.14, "rgba(255,255,255,0)"); shade.addColorStop(0.82, "rgba(0,0,0,0)"); shade.addColorStop(1, "rgba(0,0,0,.3)");
  context.fillStyle = shade;
  roundedRect(context, x, y, width, height, 6);
  context.fill();

  if (look.typed) {
    // photocopy binding: a stuck-on paper label, hand-written in ballpoint
    context.save();
    context.translate(x + width / 2, y + height / 2);
    context.rotate(0.012);
    context.fillStyle = "#fffaf0";
    context.shadowColor = "rgba(0,0,0,.15)"; context.shadowBlur = 4;
    context.fillRect(-width / 2 + 16, -height / 2 + 56, width - 32, height - 112);
    context.restore();
    drawSpineText(context, x, y + 76, width, height - 152, title, "", look);
    return;
  }
  context.strokeStyle = look.trim;
  context.fillStyle = look.trim;
  if (look.style === 0) {
    context.lineWidth = 4;
    for (const line of [y + 30, y + 42, y + height - 30, y + height - 42]) { context.beginPath(); context.moveTo(x + 8, line); context.lineTo(x + width - 8, line); context.stroke(); }
  } else if (look.style === 1) {
    context.fillRect(x, y + 22, width, 34);
    context.fillRect(x, y + height - 56, width, 34);
  } else {
    context.lineWidth = 3;
    roundedRect(context, x + 12, y + 14, width - 24, height - 28, 4);
    context.stroke();
  }
  drawSpineText(context, x, y + 78, width, height - 200, title, by, look);
  drawEmblem(context, cat, x + width / 2, y + height - 88, look.trim);
}

/** A few old books lying flat at the end of the shelf, holding the four up. */
function drawStack(context: CanvasRenderingContext2D, left: number, right: number, board: number) {
  const colors = ["#6e3b2a", "#2e4f5e", "#b8893a", "#4a3a5e"];
  let y = board;
  [34, 28, 38, 26].forEach((height, i) => {
    const inset = (i * 11) % 17;
    y -= height;
    context.fillStyle = colors[i];
    roundedRect(context, left + inset, y, right - left - inset - (i % 2) * 8, height - 2, 4);
    context.fill();
    context.fillStyle = "rgba(255,240,210,.35)";
    context.fillRect(left + inset + 10, y + height / 2 - 2, right - left - inset - 28 - (i % 2) * 8, 3);
  });
}

function drawShelf(context: CanvasRenderingContext2D, card: CardContent, format: CardFormat) {
  const layout = layouts[format];
  drawFrame(context, layout.shelfTop, layout.board);
  const looks = shelfLooks(card.cat, card.picks);
  const gap = 10;
  const widths = looks.map(look => 196 * look.width);
  let x = 112;
  card.picks.forEach((pick, i) => {
    const height = layout.spine * looks[i].height;
    drawSpine(context, card.cat, pick, looks[i], x, layout.board - height, widths[i], height);
    x += widths[i] + gap;
  });
  if (968 - x > 70) drawStack(context, x + 14, 968, layout.board);
  drawBoard(context, layout.board);
}

export function drawCard(canvas: HTMLCanvasElement, card: CardContent, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  drawWall(context, width, height);
  if (format === "story") fitText(context, [{ text: "চার প্রিয় · একটুখানি", color: CARD_INK, weight: 600 }], width / 2, 180, 30, 900, "center");
  drawSign(context, card, format);
  drawShelf(context, card, format);
  fitText(context, [{ text: card.line, color: WOOD_DARK, weight: 700, display: true }], width / 2, layout.line, 42, 920, "center");
  if (card.match) fitText(context, [{ text: card.match, color: MATCH, weight: 700 }], width / 2, layout.match, 34, 920, "center");
  drawFooterBand(context, format, "তোমার চারটা কী?", site, { band: WOOD_DARK, ask: "#f2c14e", site: "#ffffff" });
}

export const cardBlob = (card: CardContent, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, card, format, site));
