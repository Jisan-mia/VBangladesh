// The share card: the maze in its world's colours with the story of your run on it (the wrong turns you rubbed out, and the
// first stretch of the pencil line fading out so the way isn't given away), the time, the stars and one line.
import { cardSizes, drawFooterBand, fitText, renderCard, type CardFormat } from "../../../shared/card-canvas";
import { cleanName } from "../../../shared/game-core";
import { boardPx, centerX, centerY, drawGate, drawKey, drawMaze, INK, THEMES } from "./art";
import { boardOf } from "./levels";
import { bn, fullLabel, humanLine, seconds, whereOf, type Shared } from "./link";

/** A finished run; `trail` and `walked` come from this phone's own run (a friend's card has neither). */
export type CardData = Pick<Shared, "level" | "seed" | "tenths" | "stars" | "clean" | "name" | "old" | "mode" | "slow"> & { trail?: readonly number[]; walked?: readonly number[] };

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

const near = (size: number, a: number, b: number) => Math.abs(a - b) === size || (Math.abs(a - b) === 1 && Math.floor(a / size) === Math.floor(b / size));

/** The wrong turns: every step of the walk that isn't on the final line, as faint grey pencil. */
function wanders(c: CanvasRenderingContext2D, size: number, cell: number, walked: readonly number[], kept: Set<string>) {
  c.strokeStyle = "#8a7a6588"; c.lineWidth = Math.max(3, cell * 0.16); c.lineCap = "round"; c.setLineDash([cell * 0.18, cell * 0.22]);
  c.beginPath();
  for (let i = 1; i < walked.length; i++) {
    const a = walked[i - 1], b = walked[i];
    if (!near(size, a, b) || kept.has(`${Math.min(a, b)}-${Math.max(a, b)}`)) continue;
    c.moveTo(centerX(size, cell, a), centerY(size, cell, a));
    c.lineTo(centerX(size, cell, b), centerY(size, cell, b));
  }
  c.stroke();
  c.setLineDash([]);
}

/** The pencil line's first stretch from home, fading out with distance from home, so the way stays the friend's to find. */
function fadingLine(c: CanvasRenderingContext2D, size: number, cell: number, side: number, trail: readonly number[], colour: string) {
  const show = Math.max(2, Math.ceil(trail.length * 0.4)), layer = document.createElement("canvas");
  layer.width = side; layer.height = side;
  const l = layer.getContext("2d");
  if (!l) return;
  l.lineWidth = Math.max(4, cell * 0.3); l.lineCap = "round"; l.lineJoin = "round"; l.strokeStyle = colour;
  l.beginPath();
  l.moveTo(centerX(size, cell, trail[0]), centerY(size, cell, trail[0]));
  for (let i = 1; i < Math.min(show, trail.length); i++) {
    const x = centerX(size, cell, trail[i]), y = centerY(size, cell, trail[i]);
    if (near(size, trail[i - 1], trail[i])) l.lineTo(x, y); else l.moveTo(x, y);
  }
  l.stroke();
  const home = trail[0], fade = l.createRadialGradient(centerX(size, cell, home), centerY(size, cell, home), cell, centerX(size, cell, home), centerY(size, cell, home), side * 0.6);
  fade.addColorStop(0, "#000"); fade.addColorStop(1, "#0000");
  l.globalCompositeOperation = "destination-in";
  l.fillStyle = fade; l.fillRect(0, 0, side, side);
  c.drawImage(layer, 0, 0);
}

export function drawCard(canvas: HTMLCanvasElement, data: CardData, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width;
  canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const story = format === "story", cx = width / 2;
  const { board } = boardOf(whereOf(data)), theme = THEMES[board.world];
  c.fillStyle = "#f7eedd";
  c.fillRect(0, 0, width, height);

  const name = cleanName(data.name);
  fitText(c, [{ text: `গোলকধাঁধা · ${fullLabel(data)}`, color: "#7a6a55", weight: 700, display: true }], cx, story ? 330 : 96, story ? 44 : 38, 940, "center");
  fitText(c, [
    { text: name ? `${name} ` : "", color: INK, weight: 700, display: true },
    { text: `${seconds(data.tenths)} সেকেন্ডে`, color: theme.wall, weight: 800, display: true },
    { text: name ? " দোকানে পৌঁছেছে" : " দোকানে পৌঁছালাম", color: INK, weight: 700, display: true },
  ], cx, story ? 445 : 190, story ? 88 : 78, 980, "center");
  const starY = story ? 545 : 262, starR = story ? 44 : 36;
  for (let i = 0; i < 3; i++) star(c, cx + (i - 1) * starR * 2.5, starY, starR, i < data.stars);

  const area = story ? 860 : 720, cell = Math.floor((area - 8) / board.size), side = boardPx(board.size, cell), top = story ? 620 : 318;
  c.save();
  c.translate(cx - side / 2, top + (area - side) / 2);
  c.fillStyle = "rgba(43,33,24,0.18)";
  c.beginPath(); c.roundRect(8, 14, side, side, 18); c.fill();
  c.beginPath(); c.roundRect(0, 0, side, side, 18); c.clip();
  drawMaze(c, board, cell, theme);
  for (let index = 0; index < board.open.length; index++) {
    if (board.key[index]) drawKey(c, centerX(board.size, cell, index), centerY(board.size, cell, index), cell, board.key[index]);
    if (board.gate[index * 4 + 1]) drawGate(c, centerX(board.size, cell, index) + cell / 2, centerY(board.size, cell, index), cell, board.gate[index * 4 + 1], true, 0);
    if (board.gate[index * 4 + 2]) drawGate(c, centerX(board.size, cell, index), centerY(board.size, cell, index) + cell / 2, cell, board.gate[index * 4 + 2], false, 0);
  }
  if (data.trail && data.walked) {
    const kept = new Set<string>();
    for (let i = 1; i < data.trail.length; i++) kept.add(`${Math.min(data.trail[i - 1], data.trail[i])}-${Math.max(data.trail[i - 1], data.trail[i])}`);
    wanders(c, board.size, cell, data.walked, kept);
    fadingLine(c, board.size, cell, side, data.trail, theme.trail);
  }
  c.restore();

  const dead = data.walked ? countDeadEnds(data.walked) : 0;
  const line = data.walked && dead > 0 ? `${humanLine(data.stars, data.clean)} ${bn(dead)}টা ভুল মোড় মুছে ফেলা।` : humanLine(data.stars, data.clean);
  fitText(c, [{ text: line, color: INK, weight: 700 }], cx, story ? 1580 : 1172, story ? 46 : 40, 960, "center");
  drawFooterBand(c, format, "তুমি কত সেকেন্ডে পারবে? বাকিটা তুমি খোঁজো।", site, { band: theme.shade, ask: "#ffd166", site: "#ffffff" });
}

/** Times the walk turned straight back on itself: each is a wrong turn rubbed out. */
function countDeadEnds(walked: readonly number[]) {
  let turns = 0;
  for (let i = 2; i < walked.length; i++) if (walked[i] === walked[i - 2]) turns++;
  return turns;
}

export const cardBlob = (data: CardData, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, data, format, site));
