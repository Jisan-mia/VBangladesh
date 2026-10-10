import { BODY_FONT, DISPLAY_FONT, cardSizes, drawFooterBand, renderCard, roundedRect, type CardFormat } from "../../../shared/card-canvas";
import { bn, label, possessive, sameCount, PAIRS_PER_PACK, type Pack, type Score, type Side } from "./picks";

export type BoardCard = {
  pack: Pack;
  answers: readonly (Side | null)[];
  name: string;
  score: Score | null;
  line: string;
  friend: { name: string; answers: readonly Side[] } | null;
};

const BOARD = "#22302a";
const WOOD = "#7a4a26";
const WOOD_DARK = "#4f2e16";
const CHALK = "#f3efe4";
const YELLOW = "#ffd36b";
const PINK = "#f59ab4";

// Seeded so the same picks always draw the same chalk dust (and the same PNG).
function random(seed: string) {
  let state = [...seed].reduce((hash, char) => Math.imul(hash ^ char.charCodeAt(0), 16777619), 2166136261) >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Chalk text: shrinks to fit, returns the drawn width. */
function chalk(context: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, maxWidth: number, color: string, align: CanvasTextAlign = "left", display = false, alpha = 1) {
  const font = (px: number) => `${display ? 700 : 600} ${px}px ${display ? DISPLAY_FONT : BODY_FONT}`;
  context.font = font(size);
  while (context.measureText(text).width > maxWidth && size > 16) context.font = font(--size);
  context.save();
  context.globalAlpha = alpha;
  context.textAlign = align;
  context.fillStyle = color;
  context.shadowColor = color;
  context.shadowBlur = alpha < 1 ? 0 : 3;
  context.fillText(text, x, y);
  context.restore();
  return context.measureText(text).width;
}

function drawWood(context: CanvasRenderingContext2D, width: number, height: number, rand: () => number) {
  context.fillStyle = WOOD;
  context.fillRect(0, 0, width, height);
  context.strokeStyle = WOOD_DARK;
  context.globalAlpha = 0.35;
  for (let y = 6; y < height; y += 9 + rand() * 14) {
    context.lineWidth = 1 + rand() * 2;
    context.beginPath();
    context.moveTo(0, y);
    context.bezierCurveTo(width * 0.3, y + rand() * 8 - 4, width * 0.7, y + rand() * 8 - 4, width, y + rand() * 6 - 3);
    context.stroke();
  }
  context.globalAlpha = 1;
}

function drawSlate(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, rand: () => number) {
  context.fillStyle = BOARD;
  context.fillRect(x, y, width, height);
  // Old wiped chalk: faint smudges where yesterday's arguments were.
  for (let i = 0; i < 7; i++) {
    const cx = x + rand() * width, cy = y + rand() * height, radius = 120 + rand() * 260;
    const smudge = context.createRadialGradient(cx, cy, 0, cx, cy, radius);
    smudge.addColorStop(0, "rgba(243,239,228,0.06)");
    smudge.addColorStop(1, "rgba(243,239,228,0)");
    context.fillStyle = smudge;
    context.fillRect(x, y, width, height);
  }
  context.fillStyle = CHALK;
  for (let i = 0; i < 1800; i++) {
    context.globalAlpha = 0.03 + rand() * 0.05;
    context.fillRect(x + rand() * width, y + rand() * height, 2, 2);
  }
  context.globalAlpha = 1;
  context.strokeStyle = "rgba(0,0,0,0.35)";
  context.lineWidth = 8;
  context.strokeRect(x + 4, y + 4, width - 8, height - 8);
}

function drawTray(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  context.fillStyle = WOOD_DARK;
  context.fillRect(x, y, width, 14);
  context.fillStyle = "rgba(255,255,255,0.12)";
  context.fillRect(x, y + 14, width, 4);
  // A white and a yellow stick, and the duster.
  context.fillStyle = CHALK;
  roundedRect(context, x + width - 400, y + 26, 120, 22, 10); context.fill();
  context.fillStyle = YELLOW;
  roundedRect(context, x + width - 260, y + 30, 74, 20, 9); context.fill();
  context.fillStyle = "#a36a3c";
  roundedRect(context, x + width - 160, y + 18, 130, Math.min(height - 24, 44), 8); context.fill();
  context.fillStyle = "#8d8f92";
  context.fillRect(x + width - 160, y + 18 + Math.min(height - 24, 44) - 14, 130, 14);
}

function drawTick(context: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  context.strokeStyle = color;
  context.lineWidth = size / 6;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath(); context.moveTo(x, y - size * 0.25); context.lineTo(x + size * 0.32, y + size * 0.08); context.lineTo(x + size, y - size * 0.62); context.stroke();
}

/** The taste fingerprint: one chalk line that swings left or right through every pick. */
function drawWeave(context: CanvasRenderingContext2D, answers: readonly (Side | null)[], xs: Record<Side, number>, rowY: (index: number) => number, color: string, width: number, rand: () => number, dashed = false) {
  const points = answers.flatMap((side, index) => side ? [{ x: xs[side], y: rowY(index) }] : []);
  if (!points.length) return;
  context.save();
  context.strokeStyle = color;
  context.lineCap = "round";
  context.lineJoin = "round";
  if (dashed) context.setLineDash([2, 16]);
  // Two slightly shifted passes read as chalk, not a vector line.
  for (const [offset, alpha, line] of [[0, 0.95, width], [1.6, 0.45, width * 0.55]] as const) {
    context.globalAlpha = alpha;
    context.lineWidth = line;
    context.beginPath();
    context.moveTo(points[0].x + offset, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const previous = points[i - 1], point = points[i], middle = (previous.y + point.y) / 2;
      context.bezierCurveTo(previous.x + offset, middle, point.x + offset, middle, point.x + offset + (rand() - 0.5), point.y);
    }
    context.stroke();
  }
  context.setLineDash([]);
  context.globalAlpha = 1;
  context.fillStyle = color;
  for (const point of points) { context.beginPath(); context.arc(point.x, point.y, width * 1.15, 0, Math.PI * 2); context.fill(); }
  context.restore();
}

function drawGrain(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, rand: () => number) {
  // Board-coloured specks over everything make the chalk look rubbed onto slate.
  context.fillStyle = BOARD;
  for (let i = 0; i < 5200; i++) {
    context.globalAlpha = 0.25 + rand() * 0.45;
    const size = 1 + rand() * 2;
    context.fillRect(x + rand() * width, y + rand() * height, size, size);
  }
  context.globalAlpha = 1;
}

export function drawBoard(canvas: HTMLCanvasElement, card: BoardCard, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return;
  const story = format === "story";
  const rand = random(`${card.pack.id}${card.answers.join("")}${format}`);
  // Story text stays between storySafe.top (250) and the footer band (1660).
  const footerTop = story ? height - 260 : height - 96;
  const frame = 34;
  const boardTop = story ? 168 : frame;
  const trayHeight = story ? 92 : 78;
  const boardBottom = footerTop - trayHeight;
  const boardLeft = frame, boardWidth = width - frame * 2, boardHeight = boardBottom - boardTop;

  drawWood(context, width, footerTop, rand);
  drawSlate(context, boardLeft, boardTop, boardWidth, boardHeight, rand);
  drawTray(context, boardLeft, boardBottom, boardWidth, trayHeight);

  const left = 86, right = width - 86, center = width / 2;
  const headY = story ? 318 : 112;
  chalk(context, "আজকের তর্ক", left, headY, story ? 68 : 60, 520, YELLOW, "left", true);
  // The pack as a chalk-boxed tag on the right.
  context.font = `600 ${story ? 36 : 32}px ${BODY_FONT}`;
  const tagWidth = Math.min(context.measureText(card.pack.label).width + 44, 380);
  context.strokeStyle = CHALK; context.lineWidth = 3; context.globalAlpha = 0.8;
  roundedRect(context, right - tagWidth, headY - (story ? 46 : 42), tagWidth, story ? 62 : 56, 14); context.stroke();
  context.globalAlpha = 1;
  chalk(context, card.pack.label, right - tagWidth / 2, headY - (story ? 4 : 2), story ? 36 : 32, tagWidth - 30, CHALK, "center");

  const who = card.name ? `${possessive(card.name)} বাছাই` : "আমার বাছাই";
  const nameY = headY + (story ? 70 : 60);
  chalk(context, who, left, nameY, story ? 40 : 36, 560, CHALK);
  const answered = card.answers.filter(Boolean).length;
  if (card.friend) chalk(context, `গোলাপি দাগ: ${card.friend.name || "বন্ধু"}`, right, nameY, story ? 32 : 28, 360, PINK, "right");
  else chalk(context, `${bn(answered)}/${bn(PAIRS_PER_PACK)}টা তর্ক`, right, nameY, story ? 32 : 28, 300, CHALK, "right", false, 0.6);

  const ruleY = nameY + (story ? 34 : 28);
  context.strokeStyle = CHALK; context.globalAlpha = 0.5; context.lineWidth = 3;
  context.beginPath(); context.moveTo(left, ruleY); context.lineTo(right, ruleY + 3); context.stroke();
  context.globalAlpha = 1;

  const rowsTop = ruleY + (story ? 26 : 18);
  const rowHeight = story ? 76 : 60;
  const rowY = (index: number) => rowsTop + index * rowHeight + rowHeight / 2;
  const gutter = story ? 78 : 70;
  const xs = { L: center - gutter, R: center + gutter } as const;
  const labelSize = story ? 50 : 42;
  const labelMax = center - gutter - 40 - left - 50;

  card.pack.pairs.forEach((pair, index) => {
    const y = rowY(index);
    const side = card.answers[index];
    if (index) {
      context.strokeStyle = CHALK; context.globalAlpha = 0.09; context.lineWidth = 2;
      context.beginPath(); context.moveTo(left + 20, y - rowHeight / 2); context.lineTo(right - 20, y - rowHeight / 2); context.stroke();
      context.globalAlpha = 1;
    }
    const baseline = y + labelSize * 0.36;
    const leftEdge = xs.L - 36, rightEdge = xs.R + 36;
    const leftWidth = chalk(context, pair.left, leftEdge, baseline, labelSize, labelMax, CHALK, "right", false, side === "L" ? 1 : side ? 0.3 : 0.55);
    const rightWidth = chalk(context, pair.right, rightEdge, baseline, labelSize, labelMax, CHALK, "left", false, side === "R" ? 1 : side ? 0.3 : 0.55);
    if (side === "L") drawTick(context, leftEdge - leftWidth - labelSize * 0.8 - 18, y + 4, labelSize * 0.8, YELLOW);
    if (side === "R") drawTick(context, rightEdge + rightWidth + 18, y + 4, labelSize * 0.8, YELLOW);
    if (!side) chalk(context, "?", center, baseline, labelSize, 60, CHALK, "center", true, 0.4);
  });

  if (card.friend) drawWeave(context, card.friend.answers, { L: xs.L - 10, R: xs.R + 10 }, rowY, PINK, story ? 6 : 5, rand, true);
  drawWeave(context, card.answers, xs, rowY, YELLOW, story ? 9 : 8, rand);

  const bottomTop = rowsTop + rowHeight * PAIRS_PER_PACK;
  const space = boardBottom - bottomTop;
  const friendMatch = card.friend ? `${card.friend.name ? possessive(card.friend.name) : "বন্ধুর"} সাথে মিল ${bn(sameCount(card.answers, card.friend.answers))}/${bn(PAIRS_PER_PACK)}` : "";
  const headline = card.score ? `দেশের সাথে মিল ${bn(card.score.match)}/${bn(card.score.of)}` : friendMatch || "আমার রুচির রেখা";
  const lines: Array<[string, number, string, boolean]> = [[headline, story ? 66 : 58, YELLOW, true], [card.line, story ? 46 : 40, CHALK, false]];
  if (card.score && friendMatch) lines.push([friendMatch, story ? 38 : 32, PINK, true]);
  const step = space / (lines.length + 0.6);
  lines.forEach(([text, size, color, display], index) => chalk(context, text, center, bottomTop + step * (index + 0.95) + size * 0.3, size, right - left - 20, color, "center", display));

  drawGrain(context, boardLeft, boardTop, boardWidth, boardHeight, rand);
  drawFooterBand(context, format, "তুমি কোন দিকে?", site, { band: "#2a1a10", ask: YELLOW, site: "#ffffff" });
}

export const cardBlob = (card: BoardCard, format: CardFormat, site: string) => renderCard(canvas => drawBoard(canvas, card, format, site));
