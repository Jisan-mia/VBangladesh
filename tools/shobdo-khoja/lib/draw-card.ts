import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, DISPLAY_FONT, type CardFormat } from "../../../shared/card-canvas";
import { type Puzzle } from "./grid";
import { clock, detail, humanLine, kicker, type Shared } from "./link";
import { finaleName } from "./levels";
import { FINALE, INKS, LETTER, MUTED, PALETTES } from "./art";

export { INKS } from "./art";

/** A pen stroke's two ends in cell units: the centres of the first and last cell, pushed a little past each. */
export function strokeEnds(cells: readonly number[], size = 7) {
  const [first, last] = [cells[0], cells[cells.length - 1]];
  const x1 = first % size + 0.5, y1 = Math.floor(first / size) + 0.5, x2 = last % size + 0.5, y2 = Math.floor(last / size) + 0.5;
  const length = Math.hypot(x2 - x1, y2 - y1) || 1, push = 0.3;
  const ux = (x2 - x1) / length, uy = (y2 - y1) / length;
  return { x1: x1 - ux * push, y1: y1 - uy * push, x2: x2 + ux * push, y2: y2 + uy * push, bend: ((first * 7 + last) % 3 - 1) * 0.06 };
}

/** The solved puzzle page: printed grid, letters, and a pen line through each word. */
export function drawGrid(c: CanvasRenderingContext2D, puzzle: Puzzle, x: number, y: number, size: number) {
  const n = puzzle.size, cell = size / n, palette = PALETTES[puzzle.pack];
  c.save();
  c.translate(x, y);
  c.save();
  c.shadowColor = "rgba(60,40,20,0.22)"; c.shadowBlur = 26; c.shadowOffsetY = 12;
  c.fillStyle = palette.sheet; roundedRect(c, -cell * 0.18, -cell * 0.18, size + cell * 0.36, size + cell * 0.36, 14); c.fill();
  c.restore();
  c.strokeStyle = "rgba(42,33,27,0.28)"; c.lineWidth = 2;
  for (let k = 0; k <= n; k++) {
    c.beginPath(); c.moveTo(k * cell, 0); c.lineTo(k * cell, size); c.stroke();
    c.beginPath(); c.moveTo(0, k * cell); c.lineTo(size, k * cell); c.stroke();
  }
  c.fillStyle = LETTER; c.textAlign = "center"; c.textBaseline = "middle";
  c.font = `600 ${Math.round(cell * 0.44)}px ${DISPLAY_FONT}`;
  puzzle.grid.forEach((letter, at) => c.fillText(letter, (at % n + 0.5) * cell, (Math.floor(at / n) + 0.56) * cell));
  c.lineCap = "round"; c.lineWidth = cell * 0.12; c.globalAlpha = 0.82;
  puzzle.words.forEach((word, index) => {
    const { x1, y1, x2, y2, bend } = strokeEnds(word.cells, n);
    c.strokeStyle = INKS[index % INKS.length];
    c.beginPath(); c.moveTo(x1 * cell, y1 * cell);
    c.quadraticCurveTo(((x1 + x2) / 2 - (y2 - y1) * bend) * cell, ((y1 + y2) / 2 + (x2 - x1) * bend) * cell, x2 * cell, y2 * cell);
    c.stroke();
  });
  c.restore();
}

/** A small stopwatch, drawn beside the time. */
function stopwatch(c: CanvasRenderingContext2D, x: number, y: number, r: number, ink: string) {
  c.save();
  c.strokeStyle = ink; c.fillStyle = ink; c.lineWidth = r * 0.18; c.lineCap = "round";
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.stroke();
  c.fillRect(x - r * 0.25, y - r * 1.5, r * 0.5, r * 0.32);
  c.beginPath(); c.moveTo(x, y); c.lineTo(x + r * 0.45, y - r * 0.5); c.stroke();
  c.restore();
}

/** The red rubber stamp a finale's card gets: its name in a tilted double ring. */
function stamp(c: CanvasRenderingContext2D, x: number, y: number, name: string) {
  c.save();
  c.translate(x, y); c.rotate(-0.16);
  c.strokeStyle = FINALE; c.fillStyle = FINALE; c.globalAlpha = 0.86;
  c.lineWidth = 7; c.beginPath(); c.arc(0, 0, 118, 0, Math.PI * 2); c.stroke();
  c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 100, 0, Math.PI * 2); c.stroke();
  c.textAlign = "center"; c.textBaseline = "middle";
  fitText(c, [{ text: "শেষ পাতা", color: FINALE, weight: 800, display: true }], 0, -26, 40, 170, "center");
  fitText(c, [{ text: name, color: FINALE, weight: 700, display: true }], 0, 28, 30, 180, "center");
  c.restore();
}

/** The card: whose grid, the time, the solved page, the kind line; a stamp on a finale. */
export function drawCard(canvas: HTMLCanvasElement, data: Shared, puzzle: Puzzle, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width;
  canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const story = format === "story", palette = PALETTES[data.pack];
  const cx = width / 2;
  c.fillStyle = palette.paper;
  c.fillRect(0, 0, width, height);
  // Faint ruled lines, like the cheap puzzle booklets sold on the bus.
  c.strokeStyle = "rgba(42,33,27,0.06)"; c.lineWidth = 3;
  for (let at = 40; at < height; at += 56) { c.beginPath(); c.moveTo(0, at); c.lineTo(width, at); c.stroke(); }

  fitText(c, [{ text: kicker(data), color: MUTED, weight: 700, display: true }], cx, story ? 340 : 100, story ? 46 : 42, 940, "center");
  const time = clock(data.time), timeSize = story ? 150 : 128, timeY = story ? 500 : 232;
  c.font = `800 ${timeSize}px ${DISPLAY_FONT}`;
  const half = c.measureText(time).width / 2;
  stopwatch(c, cx - half - timeSize * 0.42 + timeSize * 0.12, timeY - timeSize * 0.3, timeSize * 0.24, palette.ink);
  fitText(c, [{ text: time, color: palette.ink, weight: 800, display: true }], cx + timeSize * 0.12, timeY, timeSize, 700, "center");
  fitText(c, [{ text: detail(data), color: LETTER, weight: 600 }], cx, story ? 578 : 300, story ? 42 : 38, 940, "center");
  const size = story ? 840 : 700, top = story ? 660 : 352;
  drawGrid(c, puzzle, cx - size / 2, top, size);
  const finale = data.page ? finaleName(data.page) : "";
  if (finale) stamp(c, cx + size / 2 - 40, top + size - 30, finale);
  fitText(c, [{ text: humanLine(data), color: LETTER, weight: 700, display: true }], cx, story ? 1610 : 1176, story ? 56 : 50, 940, "center");
  drawFooterBand(c, format, "তুমি কত সময়ে পারবে?", site, { band: palette.deep, ask: "#ffd36b", site: "#ffffff" });
}

export const cardBlob = (data: Shared, puzzle: Puzzle, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, data, puzzle, format, site));
