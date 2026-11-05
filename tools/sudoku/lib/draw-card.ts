import { cardSizes, drawFooterBand, fitText, renderCard, type CardFormat } from "../../../shared/card-canvas";
import { cleanName } from "../../../shared/game-core";
import { starsEarned } from "./game";
import { paperFor } from "./art";
import { bn, duration, finaleName, humanLine, puzzleLabel, puzzleOf, type Shared } from "./link";

/** Newsprint, black print, and the blue of an ordinary ballpoint pen. */
export const palette = { paper: "#f4efe3", ink: "#1f1d1a", muted: "#6a6358", rule: "#cfc6b4", pen: "#24439a", penSoft: "#dfe5f4", star: "#f2a900", starOff: "#d6cdbb" };

function star(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + i * Math.PI / 5, radius = i % 2 ? r * 0.45 : r;
    c.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
  }
  c.closePath();
  c.fillStyle = fill;
  c.fill();
}

/** The puzzle as the friend will meet it: printed givens, and the cells the player filled shaded in pen blue (no answers given away). */
function drawGrid(c: CanvasRenderingContext2D, givens: number[], rows: number, cols: number, x: number, y: number, side: number) {
  const n = Math.sqrt(givens.length), cell = side / n;
  c.fillStyle = "#fffdf7";
  c.fillRect(x, y, side, side);
  c.font = `700 ${Math.round(cell * 0.6)}px "Display", "Bangla"`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  givens.forEach((value, index) => {
    const cx = x + (index % n) * cell, cy = y + Math.floor(index / n) * cell;
    if (!value) { c.fillStyle = palette.penSoft; c.fillRect(cx + 3, cy + 3, cell - 6, cell - 6); return; }
    c.fillStyle = palette.ink;
    c.fillText(bn(value), cx + cell / 2, cy + cell / 2 + cell * 0.04);
  });
  c.textBaseline = "alphabetic";
  for (let i = 0; i <= n; i++) {
    const thickRow = i % rows === 0, thickCol = i % cols === 0;
    c.fillStyle = thickRow ? palette.ink : palette.rule;
    c.fillRect(x, y + i * cell - (thickRow ? 3 : 1), side, thickRow ? 6 : 2);
    c.fillStyle = thickCol ? palette.ink : palette.rule;
    c.fillRect(x + i * cell - (thickCol ? 3 : 1), y, thickCol ? 6 : 2, side);
  }
}

export function drawCard(canvas: HTMLCanvasElement, data: Shared, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width;
  canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const puzzle = puzzleOf(data);
  if (!puzzle) throw new Error("ধাঁধাটা পাওয়া গেল না।");
  const story = format === "story", cx = width / 2, top = story ? 280 : 70;
  const stars = starsEarned(data.seconds, data.hints, puzzle.par);

  c.fillStyle = palette.paper;
  c.fillRect(0, 0, width, height);
  // A newspaper puzzle-page header: two rules and a section name.
  c.fillStyle = palette.ink;
  c.fillRect(80, top, width - 160, 6);
  c.fillRect(80, top + 14, width - 160, 2);
  fitText(c, [{ text: `সুডোকু বাংলায় · ${puzzleLabel(data)}`, color: palette.muted, weight: 700, display: true }], cx, top + 68, story ? 42 : 38, 900, "center");

  const name = cleanName(data.name);
  fitText(c, [
    { text: name ? `${name} ` : "", color: palette.ink, weight: 700, display: true },
    { text: `${duration(data.seconds)}ে`, color: palette.pen, weight: 800, display: true },
    { text: name ? " মিলিয়েছে" : " মেলালাম", color: palette.ink, weight: 700, display: true },
  ], cx, top + (story ? 176 : 160), story ? 84 : 76, 940, "center");

  const starY = top + (story ? 262 : 232), r = story ? 34 : 30;
  for (let i = 0; i < 3; i++) star(c, cx + (i - 1) * r * 2.5, starY, r, i < stars ? palette.star : palette.starOff);
  if (data.hints) fitText(c, [{ text: `${bn(data.hints)}টা ঘর সাহায্য নিয়ে`, color: palette.muted, weight: 600 }], cx, starY + r + 50, 34, 800, "center");
  const finale = finaleName(data.level), ink = paperFor(data.level).card;

  const side = story ? 820 : 700, gridY = story ? top + 400 : top + (data.hints ? 330 : 300);
  c.fillStyle = "rgba(31,29,26,0.16)";
  c.fillRect(cx - side / 2 + 12, gridY + 14, side, side);
  drawGrid(c, puzzle.puzzle, puzzle.shape.rows, puzzle.shape.cols, cx - side / 2, gridY, side);
  // A world's finale gets a rubber stamp across the grid's corner: "ছোট মামার ধাঁধা · মেলানো".
  if (finale) {
    c.save();
    c.translate(cx + side / 2 - 150, gridY + 70);
    c.rotate(-0.16);
    c.strokeStyle = ink; c.lineWidth = 6;
    c.globalAlpha = 0.9;
    c.strokeRect(-190, -52, 380, 104);
    fitText(c, [{ text: `${finale} · মেলানো`, color: ink, weight: 800, display: true }], 0, 14, 40, 350, "center");
    c.restore();
  }

  fitText(c, [{ text: humanLine(stars, data.hints, puzzle.empty), color: palette.ink, weight: 700 }], cx, gridY + side + (story ? 110 : 90), story ? 48 : 42, 940, "center");
  drawFooterBand(c, format, "তুমি কত মিনিটে পারবে?", site, { band: ink, ask: "#ffd166", site: "#ffffff" });
}

export const cardBlob = (data: Shared, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, data, format, site));
