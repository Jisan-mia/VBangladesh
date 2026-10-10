import { BODY_FONT, cardSizes, drawFooterBand, fitText, renderCard, roundedRect, wrapText, type CardFormat } from "../../../shared/card-canvas";
import { bn, certificateTitle, cleanHall, moments, serial, tierFor, TOTAL, type MomentId } from "./mess";

export type CardContent = {
  name: string;
  hall: string;
  picked: readonly MomentId[];
  /** The human line, written under the grid. */
  line: string;
  /** Roommate overlay, e.g. "দুজনেরই: ম্যাগি রাত". */
  match: string;
};

// A buff meal card printed in one cheap blue, lying on a dark steel dining table; punched holes show the table through.
export const TABLE = "#26343c";
export const TABLE_DEEP = "#172127";
export const STOCK = "#f2d98d";
export const PRINT = "#1d5c8a";
export const INK = "#1b2440";
export const STAMP = "#c23a2b";
const COLUMNS = 4;
const ROWS = TOTAL / COLUMNS;
const PER_SECTION = 8;

const layouts = {
  feed: { card: { x: 44, y: 40, w: 992, h: 1180 }, kicker: 78, title: 152, titleSize: 62, hall: 212, box: { y: 44, h: 176 }, gridTop: 252, gridBottom: 196, labelSize: 23, lineSize: 40 },
  story: { card: { x: 44, y: 236, w: 992, h: 1394 }, kicker: 84, title: 166, titleSize: 70, hall: 232, box: { y: 48, h: 196 }, gridTop: 276, gridBottom: 236, labelSize: 27, lineSize: 46 },
} as const;

/** A tiny repeatable random sequence, so paper fibres and ink specks don't change between redraws. */
function random(seed: number) {
  let value = seed % 2147483647 || 1;
  return () => (value = (value * 16807) % 2147483647) / 2147483647;
}

/** Box geometry for the grid, shared with tests: 4 columns, 10 rows, one printed section every two rows. */
export function gridCells(left: number, top: number, width: number, height: number) {
  const cellW = width / COLUMNS, cellH = height / ROWS;
  return moments.map((moment, index) => ({ id: moment.id, number: index + 1, x: left + (index % COLUMNS) * cellW, y: top + Math.floor(index / COLUMNS) * cellH, w: cellW, h: cellH }));
}

function drawHole(context: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  // Fibres pressed down around the edge, then the table seen through, darker under the paper's lip.
  context.strokeStyle = "rgba(122,88,20,.35)";
  context.lineWidth = 2;
  context.beginPath(); context.arc(cx, cy, r + 1.5, 0, Math.PI * 2); context.stroke();
  const shade = context.createRadialGradient(cx, cy + r * 0.35, r * 0.2, cx, cy, r);
  shade.addColorStop(0, TABLE);
  shade.addColorStop(1, TABLE_DEEP);
  context.fillStyle = shade;
  context.beginPath(); context.arc(cx, cy, r, 0, Math.PI * 2); context.fill();
}

function drawCell(context: CanvasRenderingContext2D, cell: ReturnType<typeof gridCells>[number], punched: boolean, size: number) {
  const r = Math.min(cell.h * 0.29, 26);
  const cx = cell.x + r + 12, cy = cell.y + cell.h / 2;
  if (punched) drawHole(context, cx, cy, r);
  else {
    context.strokeStyle = PRINT;
    context.globalAlpha = 0.75;
    context.lineWidth = 2;
    context.setLineDash([4, 4]);
    context.beginPath(); context.arc(cx, cy, r, 0, Math.PI * 2); context.stroke();
    context.setLineDash([]);
    context.globalAlpha = 1;
    fitText(context, [{ text: serial(cell.number), color: PRINT, weight: 700 }], cx, cy + r * 0.36, r * 0.95, r * 1.6, "center");
  }
  const left = cx + r + 10, room = cell.x + cell.w - left - 8;
  const moment = moments[cell.number - 1];
  const weight = punched ? 700 : 500;
  let lines: string[] = [];
  for (; size >= 15; size -= 1) {
    context.font = `${weight} ${size}px ${BODY_FONT}`;
    lines = wrapText(context, moment.card, room, 2);
    if (!lines.at(-1)!.endsWith("…")) break;
  }
  const lead = size * 1.25;
  const first = cy - ((lines.length - 1) * lead) / 2 + size * 0.36;
  context.globalAlpha = punched ? 1 : 0.6;
  lines.forEach((text, index) => fitText(context, [{ text, color: punched ? INK : PRINT, weight }], left, first + index * lead, size, room));
  context.globalAlpha = 1;
}

/** The rubber stamp with the earned title, slapped across the corner of the grid. */
function drawTierStamp(context: CanvasRenderingContext2D, title: string, cx: number, cy: number, w: number, h: number) {
  context.save();
  context.translate(cx, cy);
  context.rotate(-0.12);
  context.globalCompositeOperation = "multiply";
  context.globalAlpha = 0.88;
  context.strokeStyle = STAMP;
  context.lineWidth = 5;
  roundedRect(context, -w / 2, -h / 2, w, h, 16); context.stroke();
  context.lineWidth = 2;
  roundedRect(context, -w / 2 + 10, -h / 2 + 10, w - 20, h - 20, 10); context.stroke();
  fitText(context, [{ text: "— খেতাব —", color: STAMP, weight: 700 }], 0, -h * 0.14, h * 0.17, w - 50, "center");
  fitText(context, [{ text: title, color: STAMP, weight: 800, display: true }], 0, h * 0.27, h * 0.32, w - 44, "center");
  context.globalCompositeOperation = "source-over";
  context.globalAlpha = 0.65;
  context.fillStyle = STOCK;
  const next = random(title.length * 977 + 13);
  for (let index = 0; index < 140; index++) {
    context.beginPath();
    context.arc((next() - 0.5) * w, (next() - 0.5) * h, 0.6 + next() * 2.2, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}

export function drawCard(canvas: HTMLCanvasElement, card: CardContent, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");

  // Steel table: faint brushed streaks.
  context.fillStyle = TABLE;
  context.fillRect(0, 0, width, height);
  const streak = random(42);
  context.strokeStyle = "rgba(255,255,255,.035)";
  context.lineWidth = 2;
  for (let index = 0; index < 90; index++) {
    const y = streak() * height, x = streak() * width;
    context.beginPath(); context.moveTo(x, y); context.lineTo(x + 120 + streak() * 260, y); context.stroke();
  }

  const { x, y, w, h } = layout.card;
  context.save();
  context.translate(x + w / 2, y + h / 2);
  context.rotate(-0.008);
  context.translate(-w / 2, -h / 2);
  context.shadowColor = "rgba(0,0,0,.45)";
  context.shadowBlur = 30;
  context.shadowOffsetY = 12;
  context.fillStyle = STOCK;
  roundedRect(context, 0, 0, w, h, 14);
  context.fill();
  context.shadowColor = "transparent";
  // Paper fibres.
  const fibre = random(7);
  context.strokeStyle = "rgba(140,100,30,.07)";
  context.lineWidth = 1.5;
  for (let index = 0; index < 260; index++) {
    const fx = fibre() * w, fy = fibre() * h, angle = fibre() * Math.PI;
    context.beginPath(); context.moveTo(fx, fy); context.lineTo(fx + Math.cos(angle) * 14, fy + Math.sin(angle) * 14); context.stroke();
  }
  context.strokeStyle = PRINT;
  context.lineWidth = 3;
  roundedRect(context, 18, 18, w - 36, h - 36, 8); context.stroke();
  context.lineWidth = 1.2;
  roundedRect(context, 26, 26, w - 52, h - 52, 5); context.stroke();

  // Header: the printed form, with the name and hall written in.
  const box = { w: 236, x: w - 52 - 236 };
  fitText(context, [{ text: "মিল কার্ড · হল · হোস্টেল · মেস", color: PRINT, weight: 700 }], 52, layout.kicker, 28, box.x - 80);
  fitText(context, [{ text: certificateTitle(card.name), color: INK, weight: 800, display: true }], 52, layout.title, layout.titleSize, box.x - 80);
  fitText(context, [{ text: "হল/মেস:", color: PRINT, weight: 600 }], 52, layout.hall, 28, 200);
  const hallLeft = 52 + context.measureText("হল/মেস:").width + 10;
  context.strokeStyle = PRINT;
  context.lineWidth = 2;
  context.setLineDash([2, 6]);
  context.beginPath(); context.moveTo(hallLeft, layout.hall + 8); context.lineTo(box.x - 40, layout.hall + 8); context.stroke();
  context.setLineDash([]);
  const hall = cleanHall(card.hall);
  if (hall) fitText(context, [{ text: hall, color: INK, weight: 700 }], hallLeft + 8, layout.hall - 2, 34, box.x - 56 - hallLeft);

  context.strokeStyle = PRINT;
  context.lineWidth = 3;
  roundedRect(context, box.x, layout.box.y, box.w, layout.box.h, 12); context.stroke();
  const mid = box.x + box.w / 2;
  fitText(context, [{ text: `${bn(TOTAL)}-এ`, color: PRINT, weight: 700 }], mid, layout.box.y + 42, 28, box.w - 30, "center");
  fitText(context, [{ text: bn(card.picked.length), color: STAMP, weight: 800, display: true }], mid, layout.box.y + layout.box.h * 0.72, layout.box.h * 0.52, box.w - 30, "center");
  fitText(context, [{ text: "টা ফুটো", color: PRINT, weight: 700 }], mid, layout.box.y + layout.box.h - 16, 24, box.w - 30, "center");

  // The grid: printed rules, a thicker one between sections.
  const grid = { x: 40, y: layout.gridTop, w: w - 80, h: h - layout.gridTop - layout.gridBottom };
  const cells = gridCells(grid.x, grid.y, grid.w, grid.h);
  context.strokeStyle = PRINT;
  for (let row = 0; row <= ROWS; row++) {
    context.lineWidth = row % (PER_SECTION / COLUMNS) === 0 ? 3 : 1.2;
    const ry = grid.y + (row * grid.h) / ROWS;
    context.beginPath(); context.moveTo(grid.x, ry); context.lineTo(grid.x + grid.w, ry); context.stroke();
  }
  context.lineWidth = 1.2;
  for (let column = 0; column <= COLUMNS; column++) {
    const cx = grid.x + (column * grid.w) / COLUMNS;
    context.lineWidth = column === 0 || column === COLUMNS ? 3 : 1.2;
    context.beginPath(); context.moveTo(cx, grid.y); context.lineTo(cx, grid.y + grid.h); context.stroke();
  }
  for (const cell of cells) drawCell(context, cell, card.picked.includes(cell.id), layout.labelSize);

  // Under the grid: the human line in pen, the roommate match, and the title stamp.
  const stamp = { w: 300, h: 132 };
  const lineTop = grid.y + grid.h + 30;
  const lineRoom = w - 52 - stamp.w - 70;
  context.font = `700 ${layout.lineSize}px ${BODY_FONT}`;
  const lines = wrapText(context, card.line, lineRoom, 2);
  let baseline = lineTop + layout.lineSize;
  for (const text of lines) {
    fitText(context, [{ text, color: INK, weight: 700, display: true }], 52, baseline, layout.lineSize, lineRoom);
    baseline += layout.lineSize * 1.3;
  }
  if (card.match) fitText(context, [{ text: card.match, color: STAMP, weight: 700 }], 52, baseline - layout.lineSize * 0.1, layout.lineSize * 0.72, lineRoom);
  drawTierStamp(context, tierFor(card.picked.length), w - 52 - stamp.w / 2, lineTop + stamp.h / 2 - 18, stamp.w, stamp.h);
  context.restore();

  drawFooterBand(context, format, "তোমার মিল কার্ডে কয়টা ফুটো?", site, { band: TABLE_DEEP, ask: STOCK, site: "#ffffff" });
}

export const cardBlob = (card: CardContent, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, card, format, site));
