import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, wrapText, BODY_FONT, type CardFormat } from "../../../shared/card-canvas";
import { badge, bn, humanLine, isRight, scoreLine, scoreOf, setById, type Result } from "./game";

type Palette = { wall: string; brick: string; board: string; border: string; letter: string; shadow: string; right: string; wrong: string; mark: string; ink: string; band: string; ask: string };

// Painted tin signboards: red board, yellow letters, a cream border. The Ekushe set swaps to black and white, no jokes.
const palettes: Record<"street" | "sober", Palette> = {
  street: { wall: "#efe3c8", brick: "#e2d2b0", board: "#c62828", border: "#ffe7a3", letter: "#ffd54a", shadow: "#4a0d0d", right: "#2e7d32", wrong: "#c62828", mark: "#fff6dc", ink: "#2b1d12", band: "#2b1d12", ask: "#ffd54a" },
  sober: { wall: "#ecebe6", brick: "#dddcd5", board: "#1c1c1c", border: "#f2f2ee", letter: "#ffffff", shadow: "#000000", right: "#2f5d3a", wrong: "#7a2e2e", mark: "#ffffff", ink: "#1c1c1c", band: "#1c1c1c", ask: "#ffffff" },
};

function wall(context: CanvasRenderingContext2D, width: number, height: number, p: Palette) {
  context.fillStyle = p.wall;
  context.fillRect(0, 0, width, height);
  context.strokeStyle = p.brick;
  context.lineWidth = 3;
  for (let y = 0, row = 0; y < height; y += 56, row++) {
    context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke();
    for (let x = row % 2 ? 60 : 0; x < width; x += 120) { context.beginPath(); context.moveTo(x, y); context.lineTo(x, y + 56); context.stroke(); }
  }
}

function bolt(context: CanvasRenderingContext2D, x: number, y: number, r: number) {
  context.fillStyle = "#00000040";
  context.beginPath(); context.arc(x + 2, y + 3, r, 0, Math.PI * 2); context.fill();
  context.fillStyle = "#b9b2a4";
  context.beginPath(); context.arc(x, y, r, 0, Math.PI * 2); context.fill();
  context.strokeStyle = "#6f675a"; context.lineWidth = 2;
  context.beginPath(); context.moveTo(x - r * 0.6, y); context.lineTo(x + r * 0.6, y); context.stroke();
}

/** A tin board: drop shadow, fill, an inset painted border, a bolt in each corner. */
function board(context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, border: string, scale = 1) {
  context.fillStyle = "#00000033";
  roundedRect(context, x + 8 * scale, y + 12 * scale, w, h, 10 * scale); context.fill();
  context.fillStyle = fill;
  roundedRect(context, x, y, w, h, 10 * scale); context.fill();
  const inset = 16 * scale;
  context.strokeStyle = border; context.lineWidth = 5 * scale;
  roundedRect(context, x + inset, y + inset, w - inset * 2, h - inset * 2, 6 * scale); context.stroke();
  const r = 7 * scale, b = 9 * scale;
  for (const [bx, by] of [[x + b, y + b], [x + w - b, y + b], [x + b, y + h - b], [x + w - b, y + h - b]]) bolt(context, bx, by, r);
}

/** Painted lettering: a hard offset shadow under the fill, like a sign painter's. */
function painted(context: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, maxWidth: number, fill: string, shadow: string) {
  const off = Math.max(3, size * 0.05);
  const used = fitText(context, [{ text, color: shadow, weight: 800, display: true }], x + off, y + off, size, maxWidth, "center");
  fitText(context, [{ text, color: fill, weight: 800, display: true }], x, y, used, maxWidth, "center");
}

function mark(context: CanvasRenderingContext2D, cx: number, cy: number, size: number, right: boolean, color: string) {
  context.strokeStyle = color; context.lineWidth = size * 0.16; context.lineCap = "round"; context.lineJoin = "round";
  context.beginPath();
  if (right) { context.moveTo(cx - size * 0.42, cy); context.lineTo(cx - size * 0.1, cy + size * 0.32); context.lineTo(cx + size * 0.45, cy - size * 0.36); }
  else { context.moveTo(cx - size * 0.32, cy - size * 0.32); context.lineTo(cx + size * 0.32, cy + size * 0.32); context.moveTo(cx + size * 0.32, cy - size * 0.32); context.lineTo(cx - size * 0.32, cy + size * 0.32); }
  context.stroke();
}

const layouts = {
  feed: { head: { x: 70, y: 70, w: 940, h: 470 }, grid: { top: 640, cols: 5, w: 172, h: 148, gapX: 20, gapY: 40 }, legend: 1050, line: 1150 },
  story: { head: { x: 70, y: 270, w: 940, h: 560 }, grid: { top: 900, cols: 2, w: 430, h: 96, gapX: 40, gapY: 22 }, legend: 1522, line: 1585 },
} as const;

export function drawCard(canvas: HTMLCanvasElement, result: Result, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const set = setById(result.set)!;
  const p = palettes[set.sober ? "sober" : "street"];
  const score = scoreOf(result.set, result.picks);
  const layout = layouts[format];
  const story = format === "story";
  wall(context, width, height, p);

  // The big board with name, score and title.
  const { head } = layout;
  context.strokeStyle = "#6f675a"; context.lineWidth = 4;
  for (const hx of [head.x + 120, head.x + head.w - 120]) { context.beginPath(); context.moveTo(hx, head.y - 70); context.lineTo(hx, head.y); context.stroke(); }
  board(context, head.x, head.y, head.w, head.h, p.board, p.border, 1.6);
  const cx = width / 2;
  const inner = head.w - 140;
  fitText(context, [{ text: set.sober ? "একুশের ৭৫ বছর · শুদ্ধ বানান" : "শুদ্ধ বানান কোনটি?", color: p.border, weight: 700 }], cx, head.y + 96, 38, inner, "center");
  painted(context, result.name || "আমার বানান", cx, head.y + (story ? 210 : 190), story ? 88 : 76, inner, p.border, p.shadow);
  painted(context, scoreLine(score), cx, head.y + (story ? 390 : 340), story ? 160 : 140, inner, p.letter, p.shadow);
  // Title on a small plate hanging from the bottom edge.
  const title = badge(score, result.set);
  context.font = `800 40px ${BODY_FONT}`;
  const plateW = Math.min(inner, context.measureText(title).width + 90);
  const plateY = head.y + head.h - 52;
  context.fillStyle = "#00000033"; roundedRect(context, cx - plateW / 2 + 5, plateY + 7, plateW, 76, 38); context.fill();
  context.fillStyle = p.border; roundedRect(context, cx - plateW / 2, plateY, plateW, 76, 38); context.fill();
  fitText(context, [{ text: title, color: p.board, weight: 800, display: true }], cx, plateY + 52, 40, plateW - 50, "center");

  // Ten small boards: green = right, red = wrong. No words, so the card can't be copied.
  const { grid } = layout;
  const rowWidth = grid.cols * grid.w + (grid.cols - 1) * grid.gapX;
  const left = (width - rowWidth) / 2;
  set.words.forEach((word, index) => {
    const col = index % grid.cols, row = Math.floor(index / grid.cols);
    const x = left + col * (grid.w + grid.gapX), y = grid.top + row * (grid.h + grid.gapY);
    const right = result.picks[index] !== undefined && isRight(word, result.picks[index]);
    board(context, x, y, grid.w, grid.h, right ? p.right : p.wrong, p.mark + "99", 0.8);
    fitText(context, [{ text: bn(index + 1), color: p.mark, weight: 700 }], x + (story ? 58 : 36), y + grid.h / 2 + 14, 36, 60, "center");
    mark(context, x + grid.w / 2 + (story ? 30 : 12), y + grid.h / 2, story ? 58 : 54, right, p.mark);
  });

  fitText(context, [{ text: "সবুজ = ঠিক", color: p.right, weight: 700 }, { text: "   ·   ", color: p.ink, weight: 500 }, { text: "লাল = ভুল", color: p.wrong, weight: 700 }, { text: "   ·   শব্দ লুকানো, নিজে খেলে দেখো", color: p.ink, weight: 500 }], cx, layout.legend, 30, width - 160, "center");
  context.font = `600 46px ${BODY_FONT}`;
  wrapText(context, humanLine(score, result.set), width - 200, 2).forEach((line, index) => {
    fitText(context, [{ text: line, color: p.ink, weight: 600 }], cx, layout.line + index * 60, 46, width - 200, "center");
  });

  drawFooterBand(context, format, "তুমি কয়টা পারবে?", site, { band: p.band, ask: p.ask, site: "#ffffff" });
}

export const cardBlob = (result: Result, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, result, format, site));
