import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, wrapText, DISPLAY_FONT, type CardFormat, type Segment } from "../../../shared/card-canvas";
import { axisTicks, axisUnit, curvePath, moods, sportOf, wormPoints, bn, type Card } from "./worm";

export const INK = "#1b2340";
export const BLUE = "#2346b8";
export const RED = "#d63a2f";
const NAVY = "#14213d";
const MUTED = "#5f6880";

type Layout = { strip: number; title: number; summary: number; plot: number; row: number; axis: number; line: number; size: number };
const layouts: Record<CardFormat, Layout> = {
  feed: { strip: 48, title: 212, summary: 282, plot: 330, row: 128, axis: 1020, line: 1104, size: 38 },
  story: { strip: 280, title: 448, summary: 522, plot: 580, row: 164, axis: 1452, line: 1546, size: 42 },
};
const LEFT = 92, RIGHT = 800, KEYS = 858;

/** School graph paper: a fine grid with a bolder line every five squares. */
function drawPaper(context: CanvasRenderingContext2D, width: number, height: number) {
  context.fillStyle = "#fbfbf2";
  context.fillRect(0, 0, width, height);
  for (let step = 0; step * 20 <= Math.max(width, height); step++) {
    const at = step * 20;
    context.strokeStyle = step % 5 ? "rgba(38,128,98,.15)" : "rgba(38,128,98,.33)";
    context.lineWidth = step % 5 ? 1.5 : 2.5;
    context.beginPath(); context.moveTo(at, 0); context.lineTo(at, height); context.moveTo(0, at); context.lineTo(width, at); context.stroke();
  }
}

export function drawFace(context: CanvasRenderingContext2D, mood: number, cx: number, cy: number, radius: number) {
  const face = moods[mood];
  context.save();
  context.translate(cx - radius, cy - radius);
  context.scale((radius * 2) / 48, (radius * 2) / 48);
  context.lineCap = "round"; context.lineJoin = "round";
  context.beginPath(); context.arc(24, 24, 21, 0, Math.PI * 2);
  context.fillStyle = face.color; context.fill();
  context.lineWidth = 2.4; context.strokeStyle = INK; context.stroke();
  if (face.light) { context.fillStyle = "#ffffff"; context.fill(new Path2D(face.light)); }
  if (face.dark) { context.fillStyle = INK; context.fill(new Path2D(face.dark)); }
  context.lineWidth = 2.6; context.stroke(new Path2D(face.lines));
  context.restore();
}

function drawStrip(context: CanvasRenderingContext2D, card: Card, top: number) {
  context.fillStyle = NAVY;
  roundedRect(context, LEFT - 8, top, 1080 - 2 * (LEFT - 8), 66, 14);
  context.fill();
  context.fillStyle = "#ff4b3e";
  context.beginPath(); context.arc(LEFT + 24, top + 33, 10, 0, Math.PI * 2); context.fill();
  const used = fitText(context, [{ text: "ম্যাচের মন", color: "#ffffff", weight: 700, display: true }, { text: `  ·  ${sportOf(card.sport).label}`, color: "#ffd166", weight: 600 }], LEFT + 48, top + 45, 30, 420);
  if (card.label) fitText(context, [{ text: card.label, color: "#e9edf7", weight: 600 }], 1080 - LEFT - 12, top + 45, Math.min(used, 28), 430, "right");
}

function drawWorm(context: CanvasRenderingContext2D, list: number[], card: Card, plotTop: number, row: number, color: string, own: boolean) {
  const longest = Math.max(card.moods.length, card.friend?.moods.length ?? 0);
  const points = wormPoints(list, card.sport, longest).map(point => ({ x: LEFT + point.x * (RIGHT - LEFT), y: plotTop + (point.row + 0.5) * row, row: point.row }));
  context.lineCap = "round"; context.lineJoin = "round";
  context.strokeStyle = "#ffffff"; context.lineWidth = own ? 18 : 14;
  context.stroke(new Path2D(curvePath(points)));
  context.strokeStyle = color; context.lineWidth = own ? 10 : 7;
  context.stroke(new Path2D(curvePath(points)));
  const dot = own ? 9 : 7;
  points.forEach((point, index) => {
    const last = own && index === points.length - 1 && index > 0;
    if (last) return;
    context.beginPath(); context.arc(point.x, point.y, dot, 0, Math.PI * 2);
    context.fillStyle = index ? moods[point.row].color : "#ffffff"; context.fill();
    context.lineWidth = 3; context.strokeStyle = index ? "#ffffff" : color; context.stroke();
  });
  // Your worm ends in the face of how the match ended for you.
  if (own && points.length > 1) { const end = points[points.length - 1]; drawFace(context, end.row, end.x, end.y, Math.min(38, row * 0.32)); }
}

function drawGraph(context: CanvasRenderingContext2D, card: Card, layout: Layout) {
  const { plot: top, row } = layout;
  const bottom = top + row * 5;
  moods.forEach((mood, index) => {
    const y = top + index * row;
    context.fillStyle = mood.color + "1f";
    context.fillRect(LEFT - 20, y + 3, RIGHT - LEFT + 40, row - 6);
    const cy = y + row / 2;
    drawFace(context, index, KEYS + 30, cy, Math.min(32, row * 0.28));
    fitText(context, [{ text: mood.label, color: mood.deep, weight: 700, display: true }], KEYS + 72, cy + (card.counts[index] ? -2 : 10), 30, 1036 - KEYS - 72);
    if (card.counts[index]) fitText(context, [{ text: `${bn(card.counts[index])} বার`, color: MUTED, weight: 600 }], KEYS + 72, cy + 32, 24, 1036 - KEYS - 72);
  });
  context.strokeStyle = INK; context.lineWidth = 3;
  context.beginPath(); context.moveTo(LEFT - 20, top); context.lineTo(LEFT - 20, bottom); context.lineTo(RIGHT + 20, bottom); context.stroke();
  const longest = Math.max(card.moods.length, card.friend?.moods.length ?? 0);
  for (const tick of axisTicks(card.sport, longest)) {
    const x = LEFT + tick.x * (RIGHT - LEFT);
    context.beginPath(); context.moveTo(x, bottom); context.lineTo(x, bottom + 12); context.stroke();
    fitText(context, [{ text: tick.label, color: MUTED, weight: 600 }], x, layout.axis, 26, 200, tick.x === 0 ? "left" : tick.x === 1 ? "right" : "center");
  }
  fitText(context, [{ text: `← ${axisUnit(card.sport)}`, color: MUTED, weight: 600 }], KEYS + 4, layout.axis, 26, 1036 - KEYS - 4);
  if (card.friend) drawWorm(context, card.friend.moods, card, top, row, RED, false);
  drawWorm(context, card.moods, card, top, row, BLUE, true);
}

function legend(card: Card): Segment[] {
  const end = (list: number[]) => moods[list[list.length - 1]];
  const parts: Segment[] = [{ text: "● ", color: BLUE, weight: 700 }, { text: `${card.ownName}: শেষে `, color: INK, weight: 600 }, { text: end(card.moods).label, color: end(card.moods).deep, weight: 700 }];
  if (card.friend) parts.push({ text: "     ● ", color: RED, weight: 700 }, { text: `${card.friendName}: শেষে `, color: INK, weight: 600 }, { text: end(card.friend.moods).label, color: end(card.friend.moods).deep, weight: 700 });
  return parts;
}

export function drawCard(canvas: HTMLCanvasElement, card: Card, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  drawPaper(context, width, height);
  drawStrip(context, card, layout.strip);
  fitText(context, [{ text: card.title, color: INK, weight: 800, display: true }], LEFT - 8, layout.title, format === "story" ? 88 : 80, 900);
  const second: Segment[] = card.friend ? legend(card) : card.summary.map(part => part.mood === undefined ? { text: part.text, color: INK, weight: 600 } : { text: part.text, color: moods[part.mood].deep, weight: 800, display: true });
  fitText(context, second, LEFT - 8, layout.summary, 40, 900);
  drawGraph(context, card, layout);
  let y = layout.line;
  if (card.pair) { fitText(context, [{ text: card.pair, color: RED, weight: 800, display: true }], LEFT - 8, y, layout.size + 2, 900); y += layout.size + 20; }
  if (card.pair) fitText(context, [{ text: card.line, color: INK, weight: 600 }], LEFT - 8, y, layout.size, 900);
  else {
    context.font = `600 ${layout.size}px ${DISPLAY_FONT}`;
    for (const text of wrapText(context, card.line, 900, 2)) { fitText(context, [{ text, color: INK, weight: 600, display: true }], LEFT - 8, y, layout.size, 900); y += layout.size + 18; }
  }
  drawFooterBand(context, format, "তোমার মন কেমন দুলল?", site);
}

export const cardBlob = (card: Card, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, card, format, site));
