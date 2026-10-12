import { cardSizes, drawFooterBand, fitText, renderCard, type CardFormat } from "../../../shared/card-canvas";
import { cleanName } from "../../../shared/game-core";
import { boardPx, drawMaze, INK, THEMES } from "./art";
import { dailyWorld, worldOf, WORLDS } from "./levels";
import { humanLine, mazeLabel, mazeOf, seconds, type Shared } from "./link";

export type CardData = Pick<Shared, "level" | "seed" | "tenths" | "stars" | "clean" | "name">;

function star(c: CanvasRenderingContext2D, x: number, y: number, r: number, on: boolean) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5, radius = i % 2 ? r * 0.45 : r;
    c.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
  }
  c.closePath();
  c.fillStyle = on ? "#f2a900" : "#dccfb6";
  c.fill();
  if (on) { c.lineWidth = r * 0.08; c.strokeStyle = "#a86f00"; c.stroke(); }
}

/** The maze the friend will meet (no line drawn on it, so the card never gives the way away), the time and the stars. */
export function drawCard(canvas: HTMLCanvasElement, data: CardData, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width;
  canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const story = format === "story", cx = width / 2;
  const world = data.level ? worldOf(data.level) : dailyWorld(data.seed), theme = THEMES[world];
  c.fillStyle = "#f7eedd";
  c.fillRect(0, 0, width, height);

  const name = cleanName(data.name);
  const where = data.level ? `${mazeLabel(data)} · ${WORLDS[world].name}` : mazeLabel(data);
  fitText(c, [{ text: `গোলকধাঁধা · ${where}`, color: "#7a6a55", weight: 700, display: true }], cx, story ? 330 : 96, story ? 44 : 38, 940, "center");
  fitText(c, [
    { text: name ? `${name} ` : "", color: INK, weight: 700, display: true },
    { text: `${seconds(data.tenths)} সেকেন্ডে`, color: theme.wall, weight: 800, display: true },
    { text: name ? " দোকানে পৌঁছেছে" : " দোকানে পৌঁছালাম", color: INK, weight: 700, display: true },
  ], cx, story ? 445 : 190, story ? 88 : 78, 980, "center");
  const starY = story ? 545 : 262, starR = story ? 44 : 36;
  for (let i = 0; i < 3; i++) star(c, cx + (i - 1) * starR * 2.5, starY, starR, i < data.stars);

  const maze = mazeOf(data), area = story ? 860 : 720, cell = Math.floor((area - 8) / maze.size), side = boardPx(maze.size, cell);
  const top = story ? 620 : 318;
  c.save();
  c.translate(cx - side / 2, top + (area - side) / 2);
  c.fillStyle = "rgba(43,33,24,0.18)";
  c.beginPath(); c.roundRect(8, 14, side, side, 18); c.fill();
  c.beginPath(); c.roundRect(0, 0, side, side, 18); c.clip();
  drawMaze(c, maze, cell, theme);
  c.restore();

  fitText(c, [{ text: humanLine(data.stars, data.clean), color: INK, weight: 700 }], cx, story ? 1580 : 1172, story ? 50 : 44, 960, "center");
  drawFooterBand(c, format, "তুমি কত সেকেন্ডে পারবে?", site, { band: theme.shade, ask: "#ffd166", site: "#ffffff" });
}

export const cardBlob = (data: CardData, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, data, format, site));
