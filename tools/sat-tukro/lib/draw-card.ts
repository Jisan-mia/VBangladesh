// The "আব্বু-আম্মুকে দেখাও" card: the pictures built this visit, drawn in their seven colours, with their names.
// No name of the child, no photo, no stars (what was made, never a grade). Saving it is behind the parent gate.
import { cardSizes, drawFooterBand, fitText, renderCard } from "../../../shared/card-canvas";
import { FIGURES, type Figure } from "./figures";
import { figureView } from "./game";

const colors = { bg: "#fdf6e9", tile: "#ffffff", ink: "#2e2a3a", muted: "#6f6a5c", band: "#1f4d49", ask: "#ffe9a8" };
const bn = (value: number) => new Intl.NumberFormat("bn-BD", { useGrouping: false }).format(value);

/** Today's pictures, newest last; the card shows the last six. */
export const cardFigures = (ids: readonly string[]) => ids.slice(-6).map(id => FIGURES.find(f => f.id === id)).filter((f): f is Figure => Boolean(f));
export const cardLine = (ids: readonly string[]) => `আজ সাত টুকরোয় ${bn(ids.length)}টা ছবি বানালাম`;

function drawFigure(c: CanvasRenderingContext2D, figure: Figure, cx: number, cy: number, maxW: number, maxH: number) {
  const view = figureView(figure), scale = Math.min(maxW / view.width, maxH / view.height);
  const ox = cx - (view.width * scale) / 2, oy = cy - (view.height * scale) / 2;
  c.lineJoin = "round"; c.lineWidth = Math.max(3, scale * 0.06); c.strokeStyle = colors.tile;
  for (const shape of view.shapes) {
    c.beginPath();
    shape.points.forEach(([x, y], index) => (index ? c.lineTo : c.moveTo).call(c, ox + x * scale, oy + y * scale));
    c.closePath(); c.fillStyle = shape.color; c.fill(); c.stroke();
  }
}

export function drawCard(canvas: HTMLCanvasElement, ids: readonly string[], site: string) {
  const { width, height } = cardSizes.feed;
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  c.fillStyle = colors.bg; c.fillRect(0, 0, width, height);
  fitText(c, [{ text: "সাত টুকরো", color: colors.muted, weight: 700, display: true }], width / 2, 104, 40, 900, "center");
  fitText(c, [{ text: cardLine(ids), color: colors.ink, weight: 800, display: true }], width / 2, 206, 70, 960, "center");

  const figures = cardFigures(ids), count = figures.length;
  const cols = count <= 1 ? 1 : count <= 4 ? 2 : 3, rows = Math.ceil(count / cols) || 1;
  const top = 270, bottom = height - 130, cellW = (width - 80) / cols, cellH = (bottom - top) / rows;
  figures.forEach((figure, index) => {
    const col = index % cols, row = Math.floor(index / cols);
    // The last row is centred when it isn't full.
    const inRow = row === rows - 1 ? count - row * cols : cols, x = 40 + cellW * (col + 0.5) + ((cols - inRow) * cellW) / 2, y = top + cellH * row;
    c.fillStyle = colors.tile; c.beginPath(); c.roundRect(x - cellW / 2 + 12, y + 12, cellW - 24, cellH - 24, 28); c.fill();
    const label = Math.min(64, cellH * 0.16);
    drawFigure(c, figure, x, y + (cellH - label) / 2, cellW - 90, cellH - label - 80);
    fitText(c, [{ text: figure.name, color: colors.ink, weight: 800, display: true }], x, y + cellH - 44, label * 0.8, cellW - 60, "center");
  });

  drawFooterBand(c, "feed", "কাগজে টুকরো কেটে ওর সাথে নতুন ছবি বানাও", site, { band: colors.band, ask: colors.ask, site: "#ffffff" });
}

export const cardBlob = (ids: readonly string[], site: string) => renderCard(canvas => drawCard(canvas, ids, site));
