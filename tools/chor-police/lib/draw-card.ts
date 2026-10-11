// The scoreboard card: a brass থালা of folded chits on a শীতলপাটি mat, and the evening's scores on a big paper chit. No roles.
import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, type CardFormat } from "../../../shared/card-canvas";
import { bn, standings, type Game } from "./game";
import { gameTitle, humanLine } from "./result";

export const INK = "#2a2118", PEN = "#2a48a0", BRASS = "#c8932f", PAPER = "#fffaf0";
const MAT = "#e8cd94", MAT_DARK = "#dcbb76", MUTED = "#6e5d45";
const BAND = { band: INK, ask: "#f3c969", site: "#ffffff" };

const layouts = {
  feed: { head: 176, sheetTop: 330, row: 158, line: 1170 },
  story: { head: 400, sheetTop: 560, row: 196, line: 1560 },
} as const;

function mat(context: CanvasRenderingContext2D, width: number, height: number) {
  context.fillStyle = MAT; context.fillRect(0, 0, width, height);
  // A woven look: alternating cells, each with a thin cane line.
  const cell = 30;
  context.fillStyle = MAT_DARK;
  for (let y = 0; y < height; y += cell) for (let x = ((y / cell) % 2) * cell; x < width; x += cell * 2) context.fillRect(x, y, cell, cell);
  context.strokeStyle = "#c9a35a55"; context.lineWidth = 2;
  context.beginPath();
  for (let y = 0; y < height; y += cell) for (let x = 0; x < width; x += cell) {
    if (((x + y) / cell) % 2) { context.moveTo(x + 4, y + cell / 2); context.lineTo(x + cell - 4, y + cell / 2); }
    else { context.moveTo(x + cell / 2, y + 4); context.lineTo(x + cell / 2, y + cell - 4); }
  }
  context.stroke();
  // The red border stripe a শীতলপাটি often has.
  context.fillStyle = "#b8452f"; context.fillRect(0, 22, width, 10); context.fillRect(0, 44, width, 4);
}

/** A folded paper chit, centred on (x, y). */
export function foldedChit(context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, angle: number) {
  context.save();
  context.translate(x, y); context.rotate(angle);
  context.fillStyle = "#00000022"; roundedRect(context, -w / 2 + 3, -h / 2 + 5, w, h, 4); context.fill();
  context.fillStyle = PAPER; roundedRect(context, -w / 2, -h / 2, w, h, 4); context.fill();
  context.fillStyle = "#efe4cc"; context.fillRect(-w / 2, -1.5, w, 3);
  context.strokeStyle = "#d9cba9"; context.lineWidth = 2; roundedRect(context, -w / 2, -h / 2, w, h, 4); context.stroke();
  context.restore();
}

export function thala(context: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number) {
  context.fillStyle = "#00000026"; context.beginPath(); context.ellipse(cx + 6, cy + 12, rx, ry, 0, 0, Math.PI * 2); context.fill();
  const brass = context.createRadialGradient(cx - rx * 0.2, cy - ry * 0.4, 4, cx, cy, rx);
  brass.addColorStop(0, "#f6d98a"); brass.addColorStop(0.55, "#d6a547"); brass.addColorStop(1, "#8f6118");
  context.fillStyle = brass; context.beginPath(); context.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); context.fill();
  context.strokeStyle = "#8a5d17"; context.lineWidth = 4; context.beginPath(); context.ellipse(cx, cy, rx * 0.8, ry * 0.78, 0, 0, Math.PI * 2); context.stroke();
  const spots = [[-0.42, -0.2, -0.3], [0.05, -0.38, 0.25], [0.4, -0.05, -0.15], [-0.05, 0.25, 0.4]];
  for (const [dx, dy, angle] of spots) foldedChit(context, cx + dx * rx, cy + dy * ry, rx * 0.36, ry * 0.42, angle);
}

export function drawCard(canvas: HTMLCanvasElement, game: Game, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  mat(context, width, height);

  thala(context, 180, layout.head, 120, 72);
  fitText(context, [{ text: "চোর-ডাকাত-পুলিশ-বাবু", color: PEN, weight: 700 }], 330, layout.head - 46, 32, 700);
  fitText(context, [{ text: gameTitle(game), color: INK, weight: 800, display: true }], 330, layout.head + 26, 66, 700);
  fitText(context, [{ text: `${bn(game.caught.length)} দান · চারজন`, color: MUTED, weight: 600 }], 330, layout.head + 78, 32, 700);

  // The big chit with the scores, tilted a little as if just put down.
  const rows = standings(game), sheetH = 90 + rows.length * layout.row, left = 70, sheetW = width - 140;
  context.save();
  context.translate(width / 2, layout.sheetTop + sheetH / 2); context.rotate(-0.012); context.translate(-width / 2, -(layout.sheetTop + sheetH / 2));
  context.shadowColor = "#00000033"; context.shadowBlur = 24; context.shadowOffsetY = 10;
  context.fillStyle = PAPER; roundedRect(context, left, layout.sheetTop, sheetW, sheetH, 10); context.fill();
  context.shadowColor = "transparent";
  context.fillStyle = "#f1e7cf"; context.fillRect(width / 2 - 2, layout.sheetTop, 4, sheetH);
  fitText(context, [{ text: "স্কোর", color: MUTED, weight: 700 }], left + 50, layout.sheetTop + 62, 30, 300);
  let rank = 0;
  rows.forEach((row, index) => {
    if (index === 0 || row.total !== rows[index - 1].total) rank = index + 1;
    const mid = layout.sheetTop + 90 + index * layout.row + layout.row / 2, winner = row.total === rows[0].total;
    if (index > 0) {
      context.strokeStyle = "#d8cbb0"; context.lineWidth = 3; context.setLineDash([14, 12]);
      context.beginPath(); context.moveTo(left + 40, mid - layout.row / 2); context.lineTo(left + sheetW - 40, mid - layout.row / 2); context.stroke();
      context.setLineDash([]);
    }
    context.fillStyle = winner ? BRASS : PAPER; context.strokeStyle = winner ? "#8a5d17" : "#b9a985"; context.lineWidth = 4;
    context.beginPath(); context.arc(left + 86, mid, 38, 0, Math.PI * 2); context.fill(); context.stroke();
    fitText(context, [{ text: bn(rank), color: winner ? "#ffffff" : MUTED, weight: 800, display: true }], left + 86, mid + 16, 44, 60, "center");
    fitText(context, [{ text: row.name, color: PEN, weight: 800, display: true }], left + 150, mid + 22, 64, 470);
    fitText(context, [{ text: bn(row.total), color: INK, weight: 800, display: true }], left + sheetW - 50, mid + 26, 80, 300, "right");
  });
  context.restore();

  fitText(context, [{ text: humanLine(game), color: INK, weight: 700, display: true }], width / 2, layout.line, 52, width - 120, "center");
  drawFooterBand(context, format, "তোমাদের বাসায় কে চোর হয়?", site, BAND);
}

export const cardBlob = (game: Game, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, game, format, site));
