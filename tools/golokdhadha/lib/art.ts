// Drawing: three worlds (brick গলি, paddy আল, mangrove খাল), home, the জিলাপির দোকান, the walker and the pencil line.
// The maze art is drawn once per level into an offscreen canvas; the line and the walker are the only things drawn every frame.
import { makeRng } from "../../../shared/game-core";
import { E, N, S, W, type Maze } from "./maze";

export type Theme = { floor: string; speck: string; wall: string; shade: string; trail: string; seen: string; roof: string };
export const THEMES: readonly Theme[] = [
  { floor: "#f6e7cc", speck: "#e9d3ad", wall: "#b04a32", shade: "#7a2c1c", trail: "#f3a443", seen: "#cfa877", roof: "#b04a32" },
  { floor: "#efdcab", speck: "#dcc488", wall: "#4b8b3b", shade: "#2c5a22", trail: "#ee9a3c", seen: "#bfa368", roof: "#7a5a32" },
  { floor: "#cde8e8", speck: "#b4dadb", wall: "#2f6343", shade: "#183b27", trail: "#f39a3a", seen: "#8fc3c6", roof: "#6b4a2b" },
];
export const INK = "#2b2118";

export const wallWidth = (cell: number) => Math.max(2.5, Math.round(cell * 0.14));
export const boardPx = (size: number, cell: number) => size * cell + wallWidth(cell);
/** The centre of a cell, in board pixels. */
export const centerX = (size: number, cell: number, index: number) => wallWidth(cell) / 2 + (index % size) * cell + cell / 2;
export const centerY = (size: number, cell: number, index: number) => wallWidth(cell) / 2 + Math.floor(index / size) * cell + cell / 2;

function house(c: CanvasRenderingContext2D, x: number, y: number, s: number, theme: Theme) {
  c.fillStyle = "#fffaf0";
  c.fillRect(x - s * 0.28, y - s * 0.05, s * 0.56, s * 0.34);
  c.fillStyle = theme.roof;
  c.beginPath(); c.moveTo(x - s * 0.38, y - s * 0.02); c.lineTo(x, y - s * 0.36); c.lineTo(x + s * 0.38, y - s * 0.02); c.closePath(); c.fill();
  c.fillStyle = INK;
  c.fillRect(x - s * 0.07, y + s * 0.1, s * 0.14, s * 0.19);
}

/** A sweet-shop front: a striped awning, a counter, and one orange জিলাপি curl. */
function shop(c: CanvasRenderingContext2D, x: number, y: number, s: number) {
  const left = x - s * 0.38, width = s * 0.76;
  c.fillStyle = "#fffaf0";
  c.fillRect(left + s * 0.04, y - s * 0.08, width - s * 0.08, s * 0.38);
  for (let i = 0; i < 4; i++) {
    c.fillStyle = i % 2 ? "#fffaf0" : "#d8342b";
    c.beginPath();
    c.moveTo(left + (width / 4) * i, y - s * 0.32);
    c.lineTo(left + (width / 4) * (i + 1), y - s * 0.32);
    c.lineTo(left + (width / 4) * (i + 1), y - s * 0.12);
    c.arc(left + (width / 4) * (i + 0.5), y - s * 0.12, width / 8, 0, Math.PI);
    c.closePath(); c.fill();
  }
  c.strokeStyle = "#e8890f"; c.lineWidth = Math.max(1.5, s * 0.06); c.lineCap = "round";
  c.beginPath();
  for (let t = 0; t <= 1; t += 0.04) {
    const angle = t * Math.PI * 4, r = s * 0.13 * t;
    const px = x + Math.cos(angle) * r, py = y + s * 0.12 + Math.sin(angle) * r;
    if (t === 0) c.moveTo(px, py); else c.lineTo(px, py);
  }
  c.stroke();
}

/** The whole maze at `cell` pixels a cell, from (0, 0): floor, a few seeded specks, walls with a shadow, home and the shop. */
export function drawMaze(c: CanvasRenderingContext2D, maze: Maze, cell: number, theme: Theme) {
  const { size, open } = maze, wall = wallWidth(cell), side = boardPx(size, cell), off = wall / 2;
  c.fillStyle = theme.floor;
  c.fillRect(0, 0, side, side);
  const rng = makeRng(maze.seed);
  c.fillStyle = theme.speck;
  for (let i = 0; i < size * size * 2; i++) c.fillRect(rng() * side, rng() * side, cell * 0.08 + 1, cell * 0.08 + 1);

  c.beginPath();
  for (let index = 0; index < size * size; index++) {
    const x = off + (index % size) * cell, y = off + Math.floor(index / size) * cell;
    if (!(open[index] & N)) { c.moveTo(x, y); c.lineTo(x + cell, y); }
    if (!(open[index] & W)) { c.moveTo(x, y); c.lineTo(x, y + cell); }
    if (!(open[index] & S) && index >= size * (size - 1)) { c.moveTo(x, y + cell); c.lineTo(x + cell, y + cell); }
    if (!(open[index] & E) && index % size === size - 1) { c.moveTo(x + cell, y); c.lineTo(x + cell, y + cell); }
  }
  c.lineCap = "round"; c.lineJoin = "round"; c.lineWidth = wall;
  c.save(); c.translate(0, wall * 0.35); c.strokeStyle = theme.shade; c.stroke(); c.restore();
  c.strokeStyle = theme.wall; c.stroke();

  house(c, centerX(size, cell, maze.start), centerY(size, cell, maze.start), cell, theme);
  shop(c, centerX(size, cell, maze.exit), centerY(size, cell, maze.exit), cell);
}

/** Faint dots where you've been, then the pencil line from home to the walker (ending at `tipX, tipY`). */
export function drawTrail(c: CanvasRenderingContext2D, maze: Maze, cell: number, theme: Theme, trail: readonly number[], seen: Uint8Array, tipX: number, tipY: number) {
  const { size } = maze;
  c.fillStyle = theme.seen;
  for (let index = 0; index < seen.length; index++) {
    if (!seen[index]) continue;
    c.beginPath(); c.arc(centerX(size, cell, index), centerY(size, cell, index), cell * 0.09, 0, Math.PI * 2); c.fill();
  }
  c.strokeStyle = theme.trail; c.lineWidth = Math.max(4, cell * 0.3); c.lineCap = "round"; c.lineJoin = "round";
  c.beginPath();
  c.moveTo(centerX(size, cell, trail[0]), centerY(size, cell, trail[0]));
  for (let i = 1; i < trail.length; i++) c.lineTo(centerX(size, cell, trail[i]), centerY(size, cell, trail[i]));
  c.lineTo(tipX, tipY);
  c.stroke();
}

/** The walker: a round face that looks the way it's heading (`lookX`, `lookY` in -1..1). */
export function drawWalker(c: CanvasRenderingContext2D, x: number, y: number, cell: number, lookX: number, lookY: number) {
  const r = Math.max(7, cell * 0.33);
  c.fillStyle = "#e4572e";
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  c.lineWidth = Math.max(2, r * 0.22); c.strokeStyle = "#fffaf0"; c.stroke();
  // Two eyes side by side across the heading, nudged towards it.
  const ex = x + lookX * r * 0.3, ey = y + lookY * r * 0.3, px = -lookY * r * 0.36, py = lookX * r * 0.36, eye = Math.max(1.6, r * 0.17);
  c.fillStyle = INK;
  c.beginPath(); c.arc(ex + px, ey + py, eye, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(ex - px, ey - py, eye, 0, Math.PI * 2); c.fill();
}
