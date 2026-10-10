import { DISPLAY_FONT, cardSizes, drawFooterBand, fitText, renderCard, roundedRect, wrapText, type CardFormat } from "../../../shared/card-canvas";
import { bn, captainOf, formations, playerById, teamTitle, type Team } from "./ekadosh";

/** `score` is "৭/১১" when a friend's board is open, else "". `common` marks the players both boards share. */
export type CardContent = { team: Team; line: string; score: string; common: readonly string[] };

const BLUE = "#1e48b8";
const BLACK = "#1c1d22";
const RED = "#c42a22";
const GREEN = "#2c8a4b";
const BAND = "#1d2a20";
const ARMBAND = "#ffd23f";

type Box = { x: number; y: number; w: number; h: number };
type Layout = { board: Box; paper: Box; pitch: Box; title: number; sub: number; note: number; name: number };
const layouts: Record<CardFormat, Layout> = {
  feed: { board: { x: 50, y: 34, w: 980, h: 1200 }, paper: { x: 90, y: 116, w: 900, h: 1086 }, pitch: { x: 140, y: 296, w: 800, h: 762 }, title: 200, sub: 262, note: 1122, name: 36 },
  story: { board: { x: 50, y: 262, w: 980, h: 1382 }, paper: { x: 90, y: 344, w: 900, h: 1268 }, pitch: { x: 140, y: 548, w: 800, h: 900 }, title: 432, sub: 496, note: 1528, name: 38 },
};

const marker = (size: number, weight = 700) => `${weight} ${size}px ${DISPLAY_FONT}`;

/** Grass by the touchline, mowed in stripes, where the coach stands with the board. */
function drawGrass(context: CanvasRenderingContext2D, width: number, height: number) {
  for (let y = 0, band = 0; y < height; y += 96, band++) {
    context.fillStyle = band % 2 ? "#2f6d3d" : "#357645";
    context.fillRect(0, y, width, 96);
  }
  context.fillStyle = "rgba(255,255,255,.5)";
  context.fillRect(18, 0, 10, height);
}

/** A brown hardboard clipboard, its pressed-fibre grain running across. */
function drawBoard(context: CanvasRenderingContext2D, box: Box) {
  context.shadowColor = "rgba(0,0,0,.42)"; context.shadowBlur = 34; context.shadowOffsetY = 16;
  const wood = context.createLinearGradient(box.x, box.y, box.x + box.w, box.y + box.h);
  wood.addColorStop(0, "#ab7a4b"); wood.addColorStop(1, "#8a5b34");
  context.fillStyle = wood;
  roundedRect(context, box.x, box.y, box.w, box.h, 30);
  context.fill();
  context.shadowColor = "transparent";
  context.strokeStyle = "rgba(70,35,10,.13)"; context.lineWidth = 2;
  for (let y = box.y + 16, row = 0; y < box.y + box.h - 12; y += 12, row++) {
    const drift = ((row * 7) % 5) - 2;
    context.beginPath();
    context.moveTo(box.x + 14, y);
    context.bezierCurveTo(box.x + box.w * 0.3, y + drift, box.x + box.w * 0.7, y - drift, box.x + box.w - 14, y + 1);
    context.stroke();
  }
}

function drawPaper(context: CanvasRenderingContext2D, box: Box) {
  context.shadowColor = "rgba(40,20,5,.3)"; context.shadowBlur = 10; context.shadowOffsetY = 4;
  context.fillStyle = "#fdfcf7";
  context.fillRect(box.x, box.y, box.w, box.h);
  context.shadowColor = "transparent";
}

/** The steel clip: a plate with two rivets and the wire loop you press to open it. */
function drawClip(context: CanvasRenderingContext2D, cx: number, top: number) {
  const width = 300, height = 76;
  context.strokeStyle = "#78808b"; context.lineWidth = 11;
  context.beginPath(); context.ellipse(cx, top + 6, 72, 28, 0, Math.PI, 0); context.stroke();
  const steel = context.createLinearGradient(0, top, 0, top + height);
  steel.addColorStop(0, "#f1f3f6"); steel.addColorStop(0.5, "#bcc3cc"); steel.addColorStop(1, "#8d95a0");
  context.shadowColor = "rgba(0,0,0,.35)"; context.shadowBlur = 12; context.shadowOffsetY = 6;
  context.fillStyle = steel;
  roundedRect(context, cx - width / 2, top, width, height, 16);
  context.fill();
  context.shadowColor = "transparent";
  for (const dx of [-112, 112]) {
    context.fillStyle = "#6c747f"; context.beginPath(); context.arc(cx + dx, top + height / 2, 10, 0, Math.PI * 2); context.fill();
    context.fillStyle = "#e4e7eb"; context.beginPath(); context.arc(cx + dx - 3, top + height / 2 - 3, 3.5, 0, Math.PI * 2); context.fill();
  }
}

/** A strip of masking tape with the team's name in black marker. */
function drawTape(context: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, maxWidth: number) {
  context.font = marker(size);
  const width = Math.min(context.measureText(text).width, maxWidth) + 60;
  const top = -size * 0.98, height = size * 1.42;
  context.save();
  context.translate(x, y);
  context.rotate(-0.025);
  context.fillStyle = "rgba(232,218,176,.96)";
  context.beginPath();
  context.moveTo(-26, top);
  context.lineTo(width - 26, top);
  for (let step = 1; step <= 6; step++) context.lineTo(width - 26 + (step % 2 ? 7 : 0), top + (height * step) / 6);
  context.lineTo(-26, top + height);
  for (let step = 5; step >= 0; step--) context.lineTo(-26 + (step % 2 ? 7 : 0), top + (height * step) / 6);
  context.closePath();
  context.fill();
  fitText(context, [{ text, color: BLACK, weight: 700, display: true }], 4, 0, size, maxWidth);
  context.restore();
}

/** A marker line, bowed a hair so it reads as drawn by hand. */
function stroke(context: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, seed: number) {
  const bow = ((seed * 37) % 7) - 3;
  const length = Math.hypot(x2 - x1, y2 - y1) || 1;
  context.beginPath();
  context.moveTo(x1, y1);
  context.quadraticCurveTo((x1 + x2) / 2 + (-(y2 - y1) / length) * bow, (y1 + y2) / 2 + ((x2 - x1) / length) * bow, x2, y2);
  context.stroke();
}

function drawPitch(context: CanvasRenderingContext2D, pitch: Box) {
  const { x, y, w, h } = pitch, cx = x + w / 2, cy = y + h / 2;
  context.save();
  context.strokeStyle = GREEN; context.fillStyle = GREEN; context.lineWidth = 7; context.lineCap = "round"; context.lineJoin = "round"; context.globalAlpha = 0.88;
  stroke(context, x, y, x + w, y, 1); stroke(context, x + w, y, x + w, y + h, 2); stroke(context, x + w, y + h, x, y + h, 3); stroke(context, x, y + h, x, y, 4);
  stroke(context, x, cy, x + w, cy, 5);
  context.beginPath(); context.arc(cx, cy, w * 0.13, 0, Math.PI * 2); context.stroke();
  context.beginPath(); context.arc(cx, cy, 6, 0, Math.PI * 2); context.fill();
  const box = { w: w * 0.58, h: h * 0.16 }, six = { w: w * 0.28, h: h * 0.06 }, radius = w * 0.12;
  for (const end of [0, 1]) {
    const line = end ? y + h : y, dir = end ? -1 : 1, spot = line + dir * box.h * 0.68;
    stroke(context, cx - box.w / 2, line, cx - box.w / 2, line + dir * box.h, 6 + end);
    stroke(context, cx - box.w / 2, line + dir * box.h, cx + box.w / 2, line + dir * box.h, 8 + end);
    stroke(context, cx + box.w / 2, line + dir * box.h, cx + box.w / 2, line, 10 + end);
    context.strokeRect(cx - six.w / 2, end ? line - six.h : line, six.w, six.h);
    context.beginPath(); context.arc(cx, spot, 5, 0, Math.PI * 2); context.fill();
    // the "D": only the part of the circle round the spot that lies outside the box
    const start = Math.asin(Math.min(1, (box.h - box.h * 0.68) / radius));
    context.beginPath();
    if (end) context.arc(cx, spot, radius, Math.PI + start, Math.PI * 2 - start);
    else context.arc(cx, spot, radius, start, Math.PI - start);
    context.stroke();
    context.strokeRect(cx - w * 0.07, end ? line : line - 18, w * 0.14, 18);
  }
  context.restore();
}

function drawToken(context: CanvasRenderingContext2D, x: number, y: number, number: string, name: string, size: number, captain: boolean, common: boolean) {
  const ring = 40;
  context.lineWidth = 7; context.strokeStyle = BLUE; context.fillStyle = "#fffefa";
  context.beginPath(); context.arc(x, y, ring, 0, Math.PI * 2); context.fill(); context.stroke();
  fitText(context, [{ text: number, color: BLUE, weight: 700, display: true }], x, y + 14, 40, 60, "center");
  context.font = marker(size, 600);
  wrapText(context, name, 200, 2).forEach((text, index) => {
    const baseline = y + ring + size + 4 + index * (size + 4);
    if (common) {
      context.font = marker(size, 600);
      const width = Math.min(context.measureText(text).width, 204);
      context.fillStyle = "rgba(255,214,10,.62)";
      context.fillRect(x - width / 2 - 8, baseline - size * 0.82, width + 16, size * 1.08);
    }
    // A ring of paper round each letter, so a name crossing a pitch line still reads (the highlighter does that job for shared picks).
    let fit = size;
    context.font = marker(fit, 600);
    while (context.measureText(text).width > 204 && fit > 14) context.font = marker(--fit, 600);
    context.textAlign = "center";
    context.lineJoin = "round"; context.lineWidth = 10; context.strokeStyle = "#fdfcf7";
    if (!common) context.strokeText(text, x, baseline);
    context.fillStyle = BLACK;
    context.fillText(text, x, baseline);
    context.textAlign = "left";
  });
  if (!captain) return;
  context.save();
  context.translate(x + 38, y - 33);
  context.rotate(-0.18);
  context.fillStyle = ARMBAND;
  roundedRect(context, -22, -17, 44, 34, 7);
  context.fill();
  context.strokeStyle = BLACK; context.lineWidth = 3; context.stroke();
  fitText(context, [{ text: "C", color: BLACK, weight: 800, display: true }], 0, 11, 28, 30, "center");
  context.restore();
}

/** "দুজনের মিল ৭/১১", circled in red marker. */
function drawStamp(context: CanvasRenderingContext2D, score: string, x: number, y: number) {
  context.save();
  context.translate(x, y);
  context.rotate(-0.1);
  context.strokeStyle = RED; context.lineWidth = 6;
  context.beginPath(); context.ellipse(0, 0, 148, 64, 0, 0.2, Math.PI * 2.1); context.stroke();
  fitText(context, [{ text: "দুজনের মিল", color: RED, weight: 700, display: true }], 0, -10, 32, 230, "center");
  fitText(context, [{ text: score, color: RED, weight: 800, display: true }], 0, 42, 52, 230, "center");
  context.restore();
}

export function drawCard(canvas: HTMLCanvasElement, card: CardContent, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  const { board, paper, pitch } = layout;
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const { team } = card;
  drawGrass(context, width, height);
  context.save();
  context.translate(width / 2, board.y + board.h / 2);
  context.rotate(-0.01);
  context.translate(-width / 2, -(board.y + board.h / 2));
  drawBoard(context, board);
  drawPaper(context, paper);
  drawClip(context, width / 2, board.y + 28);

  const left = paper.x + 52, room = paper.w - 104 - (card.score ? 330 : 0);
  drawTape(context, teamTitle(team), left, layout.title, 54, room);
  fitText(context, [
    { text: `ছক ${formations[team.formation].label} · অধিনায়ক: `, color: BLUE, weight: 600, display: true },
    { text: captainOf(team).short, color: BLUE, weight: 800, display: true },
  ], left, layout.sub, 40, room);
  if (card.score) drawStamp(context, card.score, paper.x + paper.w - 190, layout.title + 14);

  drawPitch(context, pitch);
  formations[team.formation].spots.forEach((spot, slot) => {
    const id = team.players[slot];
    drawToken(context, pitch.x + (spot.x / 100) * pitch.w, pitch.y + (spot.y / 100) * pitch.h, bn(slot + 1), playerById(id)!.short, layout.name, team.captain === id, card.common.includes(id));
  });
  // The note wraps to two lines rather than shrinking: it's the line people read first.
  context.font = marker(40, 600);
  wrapText(context, `কোচের নোট: ${card.line}`, paper.w - 104, 2).forEach((text, index) => {
    const head = index === 0 ? "কোচের নোট: " : "";
    fitText(context, [{ text: head, color: RED, weight: 800, display: true }, { text: text.slice(head.length), color: RED, weight: 600, display: true }], left, layout.note + index * 50, 40, paper.w - 104);
  });
  context.restore();
  drawFooterBand(context, format, "তোমার একাদশে কে কে?", site, { band: BAND, ask: ARMBAND, site: "#ffffff" });
}

export const cardBlob = (card: CardContent, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, card, format, site));
