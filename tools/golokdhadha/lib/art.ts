// Drawing, all in code: five worlds (brick গলি, paddy আল, mangrove খাল, a load-shedding night, the চাঁদরাত bazaar), home,
// the জিলাপির দোকান, gates and keys (colour and shape both say which), one-way lanes, রিকশা stands, the walker and the pencil.
// Static things are drawn once per board into an offscreen canvas (`buildLayers`); draw.hot.ts blits them each frame.
import { makeRng } from "../../../shared/game-core";
import type { Board } from "./board";
import { E, makeMaze, N, S, W, type Maze } from "./maze";

export type Theme = { floor: string; speck: string; wall: string; shade: string; trail: string; seen: string; roof: string; paper: string; fog: string; arrow: string };
export const THEMES: readonly Theme[] = [
  { floor: "#f6e7cc", speck: "#e9d3ad", wall: "#b04a32", shade: "#7a2c1c", trail: "#f3a443", seen: "#cfa877", roof: "#b04a32", paper: "#f7eedd", fog: "#1a1410", arrow: "#7a2c1c" },
  { floor: "#efdcab", speck: "#dcc488", wall: "#4b8b3b", shade: "#2c5a22", trail: "#ee9a3c", seen: "#bfa368", roof: "#7a5a32", paper: "#f2ead2", fog: "#141a10", arrow: "#2c5a22" },
  { floor: "#cde8e8", speck: "#b4dadb", wall: "#2f6343", shade: "#183b27", trail: "#f39a3a", seen: "#8fc3c6", roof: "#6b4a2b", paper: "#e6f2ef", fog: "#0c1a18", arrow: "#ffffff" },
  { floor: "#eadbb8", speck: "#d8c69c", wall: "#3d3b5c", shade: "#1f1e36", trail: "#f6b04a", seen: "#b9a77f", roof: "#3d3b5c", paper: "#232742", fog: "#0b0d1c", arrow: "#3d3b5c" },
  { floor: "#f6e4ef", speck: "#ecd0e2", wall: "#6b2d7a", shade: "#3e1548", trail: "#f3a443", seen: "#d6aac6", roof: "#6b2d7a", paper: "#f4e6f0", fog: "#140a18", arrow: "#ffffff" },
];
export const INK = "#2b2118";
/** Gates and keys: colour 1 is a red ring, colour 2 a blue square, so colour is never the only difference. */
export const KEY_COLOURS = ["", "#d0452b", "#2b6cb0"];
export const STAND_COLOURS = ["#2f8f4e", "#e07b16"];

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
export function shop(c: CanvasRenderingContext2D, x: number, y: number, s: number) {
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
  jilapi(c, x, y + s * 0.12, s * 0.13, Math.max(1.5, s * 0.06));
}

/** One জিলাপি: an orange spiral. */
export function jilapi(c: CanvasRenderingContext2D, x: number, y: number, r: number, line: number) {
  c.strokeStyle = "#e8890f"; c.lineWidth = line; c.lineCap = "round";
  c.beginPath();
  for (let t = 0; t <= 1; t += 0.04) {
    const angle = t * Math.PI * 4, radius = r * t;
    const px = x + Math.cos(angle) * radius, py = y + Math.sin(angle) * radius;
    if (t === 0) c.moveTo(px, py); else c.lineTo(px, py);
  }
  c.stroke();
}

/** A one-way lane: a chevron in the passage pointing the way you may go (a current's arrow, a one-way street sign). */
function oneWayMark(c: CanvasRenderingContext2D, x: number, y: number, dx: number, dy: number, cell: number, theme: Theme, world: number) {
  const s = cell * 0.2;
  if (world === 4) {
    c.fillStyle = "#2b6cb0";
    c.beginPath(); c.roundRect(x - s * 1.25, y - s * 1.25, s * 2.5, s * 2.5, s * 0.4); c.fill();
  } else if (world === 2) {
    c.fillStyle = "#4f9fb0";
    c.beginPath(); c.arc(x, y, s * 1.3, 0, Math.PI * 2); c.fill();
  }
  c.strokeStyle = world === 2 || world === 4 ? theme.arrow : theme.arrow;
  c.lineWidth = Math.max(2, cell * 0.08); c.lineCap = "round"; c.lineJoin = "round";
  c.beginPath();
  for (let k = -1; k <= 0; k++) {
    const ox = x + dx * s * (k + 0.5) * 0.9, oy = y + dy * s * (k + 0.5) * 0.9;
    c.moveTo(ox - dx * s * 0.6 - dy * s * 0.75, oy - dy * s * 0.6 + dx * s * 0.75);
    c.lineTo(ox + dx * s * 0.25, oy + dy * s * 0.25);
    c.lineTo(ox - dx * s * 0.6 + dy * s * 0.75, oy - dy * s * 0.6 - dx * s * 0.75);
  }
  c.stroke();
}

/** A রিকশা stand: a little rickshaw seen from the side, its hood in the pair's colour. */
export function rickshaw(c: CanvasRenderingContext2D, x: number, y: number, s: number, colour: string) {
  c.lineWidth = Math.max(1.2, s * 0.05);
  c.strokeStyle = INK; c.fillStyle = "#fffaf0";
  c.beginPath(); c.arc(x - s * 0.18, y + s * 0.2, s * 0.15, 0, Math.PI * 2); c.fill(); c.stroke();
  c.beginPath(); c.arc(x + s * 0.22, y + s * 0.24, s * 0.11, 0, Math.PI * 2); c.fill(); c.stroke();
  c.fillStyle = colour;
  c.beginPath(); c.moveTo(x - s * 0.34, y + s * 0.04); c.quadraticCurveTo(x - s * 0.34, y - s * 0.36, x + s * 0.04, y - s * 0.34); c.lineTo(x + s * 0.04, y + s * 0.04); c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(x + s * 0.04, y + s * 0.04); c.lineTo(x + s * 0.34, y + s * 0.1); c.stroke();
}

/** The whole maze at `cell` pixels a cell, from (0, 0): floor, seeded specks, walls with a shadow, the board's fixed pieces, home and the shop. */
export function drawMaze(c: CanvasRenderingContext2D, maze: Maze | Board, cell: number, theme: Theme) {
  const { size, open } = maze, wall = wallWidth(cell), side = boardPx(size, cell), off = wall / 2;
  const board = "oneWay" in maze ? maze : null;
  c.fillStyle = theme.floor;
  c.fillRect(0, 0, side, side);
  const rng = makeRng(maze.seed);
  c.fillStyle = theme.speck;
  for (let i = 0; i < size * size * 2; i++) c.fillRect(rng() * side, rng() * side, cell * 0.08 + 1, cell * 0.08 + 1);
  if (board?.world === 2) {
    // Ripples on the canal.
    c.strokeStyle = "#ffffff99"; c.lineWidth = 1.2;
    for (let i = 0; i < size * 2; i++) { const x = rng() * side, y = rng() * side; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + cell * 0.15, y - cell * 0.08, x + cell * 0.3, y); c.stroke(); }
  }

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

  if (board) {
    if (board.world === 4) {
      // String lights along the top wall.
      const colours = ["#ffd166", "#ef476f", "#06d6a0", "#ffffff"];
      for (let i = 0; i < size * 2; i++) { c.fillStyle = colours[i % 4]; c.beginPath(); c.arc(off + (i + 0.5) * cell / 2, off + wall * 0.2, Math.max(1.5, cell * 0.06), 0, Math.PI * 2); c.fill(); }
    }
    for (let index = 0; index < size * size; index++) {
      const cx = centerX(size, cell, index), cy = centerY(size, cell, index);
      // A one-way lane's far end has the bit for the side it came in through.
      if (board.oneWay[index] & N) oneWayMark(c, cx, cy - cell / 2, 0, 1, cell, theme, board.world);
      if (board.oneWay[index] & S) oneWayMark(c, cx, cy + cell / 2, 0, -1, cell, theme, board.world);
      if (board.oneWay[index] & W) oneWayMark(c, cx - cell / 2, cy, 1, 0, cell, theme, board.world);
      if (board.oneWay[index] & E) oneWayMark(c, cx + cell / 2, cy, -1, 0, cell, theme, board.world);
    }
    let pair = 0;
    for (let index = 0; index < size * size; index++) {
      const other = board.portal[index];
      if (other < 0 || other < index) continue;
      const colour = STAND_COLOURS[pair++ % 2];
      rickshaw(c, centerX(size, cell, index), centerY(size, cell, index), cell, colour);
      rickshaw(c, centerX(size, cell, other), centerY(size, cell, other), cell, colour);
    }
  }
  house(c, centerX(size, cell, maze.start), centerY(size, cell, maze.start), cell, theme);
  shop(c, centerX(size, cell, maze.exit), centerY(size, cell, maze.exit), cell);
}

/** A key: a ring (round for colour 1, square for colour 2), a shaft and two teeth. */
export function drawKey(c: CanvasRenderingContext2D, x: number, y: number, s: number, colour: number) {
  c.strokeStyle = KEY_COLOURS[colour]; c.fillStyle = KEY_COLOURS[colour];
  c.lineWidth = Math.max(2, s * 0.09); c.lineCap = "round";
  c.beginPath();
  if (colour === 1) c.arc(x - s * 0.16, y, s * 0.13, 0, Math.PI * 2);
  else c.rect(x - s * 0.29, y - s * 0.13, s * 0.26, s * 0.26);
  c.stroke();
  c.beginPath(); c.moveTo(x - s * 0.03, y); c.lineTo(x + s * 0.3, y); c.moveTo(x + s * 0.22, y); c.lineTo(x + s * 0.22, y + s * 0.12); c.moveTo(x + s * 0.3, y); c.lineTo(x + s * 0.3, y + s * 0.1); c.stroke();
}

/**
 * A bamboo gate (ঝাঁপ) across a passage centred on (x, y): slats, a frame and the lock's mark (ring or square).
 * `swing` 0 is shut, 1 is open (folded against the wall); `vertical`: the bar stands upright, across an east–west passage.
 */
export function drawGate(c: CanvasRenderingContext2D, x: number, y: number, cell: number, colour: number, vertical: boolean, swing: number) {
  const half = cell * 0.46, thick = cell * 0.2;
  c.save();
  c.translate(x, y);
  if (vertical) c.rotate(Math.PI / 2);
  // Hinged at the left end; it folds back as it opens.
  c.translate(-half, 0);
  c.rotate(-swing * Math.PI * 0.45);
  c.globalAlpha = 1 - swing * 0.55;
  c.fillStyle = "#d9b26a";
  c.fillRect(0, -thick / 2, half * 2, thick);
  c.strokeStyle = "#8a6428"; c.lineWidth = Math.max(1, cell * 0.035);
  c.beginPath();
  for (let i = 1; i < 6; i++) { c.moveTo(half * 2 * i / 6, -thick / 2); c.lineTo(half * 2 * i / 6, thick / 2); }
  c.stroke();
  c.strokeRect(0, -thick / 2, half * 2, thick);
  c.fillStyle = KEY_COLOURS[colour];
  c.beginPath();
  if (colour === 1) c.arc(half, 0, thick * 0.42, 0, Math.PI * 2);
  else c.rect(half - thick * 0.38, -thick * 0.38, thick * 0.76, thick * 0.76);
  c.fill();
  c.restore();
}

/** Faint dots where you've been, then the pencil line from home to the tip (a ride lifts the pencil). Used by the card. */
export function drawTrail(c: CanvasRenderingContext2D, maze: Maze | Board, cell: number, theme: Theme, trail: ArrayLike<number>, length: number, tipX: number, tipY: number) {
  const { size } = maze;
  c.strokeStyle = theme.trail; c.lineWidth = Math.max(4, cell * 0.3); c.lineCap = "round"; c.lineJoin = "round";
  c.beginPath();
  c.moveTo(centerX(size, cell, trail[0]), centerY(size, cell, trail[0]));
  for (let i = 1; i < length; i++) {
    const from = trail[i - 1], to = trail[i], near = Math.abs(from - to) === size || (Math.abs(from - to) === 1 && Math.floor(from / size) === Math.floor(to / size));
    if (near) c.lineTo(centerX(size, cell, to), centerY(size, cell, to)); else c.moveTo(centerX(size, cell, to), centerY(size, cell, to));
  }
  c.lineTo(tipX, tipY);
  c.stroke();
}

/** The walker: a round face that looks the way it's heading (`lookX`, `lookY` in -1..1), squashed by `squash` (0–1) on a bump. */
export function drawWalker(c: CanvasRenderingContext2D, x: number, y: number, cell: number, lookX: number, lookY: number, squash = 0) {
  const r = Math.max(7, cell * 0.33), sx = 1 + squash * 0.18 * Math.abs(lookY) - squash * 0.12 * Math.abs(lookX), sy = 1 + squash * 0.18 * Math.abs(lookX) - squash * 0.12 * Math.abs(lookY);
  c.fillStyle = "#e4572e";
  c.beginPath(); c.ellipse(x, y, r * sx, r * sy, 0, 0, Math.PI * 2); c.fill();
  c.lineWidth = Math.max(2, r * 0.22); c.strokeStyle = "#fffaf0"; c.stroke();
  // Two eyes side by side across the heading, nudged towards it.
  const ex = x + lookX * r * 0.3, ey = y + lookY * r * 0.3, px = -lookY * r * 0.36, py = lookX * r * 0.36, eye = Math.max(1.6, r * 0.17);
  c.fillStyle = INK;
  c.beginPath(); c.arc(ex + px, ey + py, eye, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(ex - px, ey - py, eye, 0, Math.PI * 2); c.fill();
}

/** Everything drawn once per board and cell size: the static maze, the key sprites, the lantern and the shop's glow. */
export type Layers = {
  cell: number; px: number; ratio: number;
  maze: HTMLCanvasElement;
  keys: HTMLCanvasElement[];
  /** Dark runs: what's still hidden (rebuilt as cells are lit), the frame's fog, the lantern hole and the shop's lamp. */
  memory: HTMLCanvasElement | null; fog: HTMLCanvasElement | null; lantern: HTMLCanvasElement | null; glow: HTMLCanvasElement | null;
  memoryContext: CanvasRenderingContext2D | null; fogContext: CanvasRenderingContext2D | null;
  drawnLit: Uint8Array;
  /** Each gate once, as cell, side pairs; and the cells holding keys. */
  gateList: Int16Array; keyCells: Int16Array;
};

const offscreen = (width: number, height: number, ratio: number) => {
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(width * ratio); canvas.height = Math.ceil(height * ratio);
  const c = canvas.getContext("2d")!;
  c.scale(ratio, ratio);
  return [canvas, c] as const;
};

export function buildLayers(board: Board, cell: number, ratio: number, dark: number): Layers {
  const theme = THEMES[board.world], px = boardPx(board.size, cell);
  const [maze, m] = offscreen(px, px, ratio);
  drawMaze(m, board, cell, theme);
  const keys = [1, 2].map(colour => { const [k, kc] = offscreen(cell, cell, ratio); drawKey(kc, cell / 2, cell / 2, cell, colour); return k; });
  let memory: HTMLCanvasElement | null = null, fog: HTMLCanvasElement | null = null, lantern: HTMLCanvasElement | null = null, glow: HTMLCanvasElement | null = null;
  let memoryContext: CanvasRenderingContext2D | null = null, fogContext: CanvasRenderingContext2D | null = null;
  if (dark > 0) {
    const [mem, mc] = offscreen(px, px, ratio);
    mc.fillStyle = theme.fog; mc.globalAlpha = 0.95; mc.fillRect(0, 0, px, px); mc.globalAlpha = 1;
    memory = mem; memoryContext = mc;
    [fog, fogContext] = offscreen(px, px, ratio);
    const radius = (dark + 0.6) * cell, [lamp, lc] = offscreen(radius * 2, radius * 2, ratio);
    const light = lc.createRadialGradient(radius, radius, radius * 0.15, radius, radius, radius);
    light.addColorStop(0, "#000"); light.addColorStop(0.62, "#000000e0"); light.addColorStop(1, "#0000");
    lc.fillStyle = light; lc.fillRect(0, 0, radius * 2, radius * 2);
    lantern = lamp;
    const g = cell * 1.3, [shine, sc] = offscreen(g * 2, g * 2, ratio);
    const warm = sc.createRadialGradient(g, g, 0, g, g, g);
    warm.addColorStop(0, "#ffd36ecc"); warm.addColorStop(1, "#ffd36e00");
    sc.fillStyle = warm; sc.fillRect(0, 0, g * 2, g * 2);
    shop(sc, g, g, cell);
    glow = shine;
  }
  const gates: number[] = [], keyCells: number[] = [];
  for (let index = 0; index < board.open.length; index++) {
    // East and south sides only, so each gate is listed once.
    if (board.gate[index * 4 + 1]) gates.push(index, E);
    if (board.gate[index * 4 + 2]) gates.push(index, S);
    if (board.key[index]) keyCells.push(index);
  }
  return { cell, px, ratio, maze, keys, memory, fog, lantern, glow, memoryContext, fogContext, drawnLit: new Uint8Array(board.open.length), gateList: Int16Array.from(gates), keyCells: Int16Array.from(keyCells) };
}

/* ---------- the title and the story ---------- */

/** The title's start button: the level's own maze on a paper card, with home, the walker, the shop and খেলো on a banner. */
export function drawTitle(canvas: HTMLCanvasElement, board: Board, width: number, ratio: number, label: string, dark: number) {
  const theme = THEMES[board.world], pad = width * 0.06, cell = (width - pad * 2) / (board.size + 0.2), side = boardPx(board.size, cell);
  const height = width;
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  const c = canvas.getContext("2d")!;
  c.setTransform(ratio, 0, 0, ratio, 0, 0);
  c.fillStyle = theme.paper;
  c.beginPath(); c.roundRect(0, 0, width, height, width * 0.05); c.fill();
  c.save();
  c.translate((width - side) / 2, (height - side) / 2);
  c.beginPath(); c.roundRect(0, 0, side, side, cell * 0.3); c.clip();
  drawMaze(c, board, cell, theme);
  for (let index = 0; index < board.key.length; index++) if (board.key[index]) drawKey(c, centerX(board.size, cell, index), centerY(board.size, cell, index), cell, board.key[index]);
  if (dark > 0) {
    // Night over the far lanes; the house and the shop's lamp still show.
    const shade = c.createRadialGradient(cell, cell, cell, cell, cell, side * 0.9);
    shade.addColorStop(0, "#0b0d1c00"); shade.addColorStop(0.45, "#0b0d1cd0"); shade.addColorStop(1, "#0b0d1cf2");
    c.fillStyle = shade; c.fillRect(0, 0, side, side);
    shop(c, centerX(board.size, cell, board.exit), centerY(board.size, cell, board.exit), cell);
  }
  drawWalker(c, centerX(board.size, cell, board.start) + cell * 0.32, centerY(board.size, cell, board.start) + cell * 0.32, cell * 0.8, 1, 0.4);
  c.restore();
  // The banner: a strip of paper across the middle.
  const bandH = Math.max(54, width * 0.2), y = height / 2 - bandH / 2;
  c.save();
  c.translate(width / 2, height / 2); c.rotate(-0.035); c.translate(-width / 2, -height / 2);
  c.fillStyle = "#2b211833"; c.fillRect(width * 0.1 + 4, y + 6, width * 0.8, bandH);
  c.fillStyle = "#fffaf0"; c.fillRect(width * 0.1, y, width * 0.8, bandH);
  c.fillStyle = theme.wall; c.fillRect(width * 0.1, y, width * 0.8, bandH * 0.09); c.fillRect(width * 0.1, y + bandH * 0.91, width * 0.8, bandH * 0.09);
  c.fillStyle = INK; c.textAlign = "center"; c.textBaseline = "middle";
  c.font = `800 ${Math.round(bandH * 0.5)}px Display, Bangla, sans-serif`;
  c.fillText(label, width / 2 - bandH * 0.3, height / 2 + bandH * 0.04);
  // A play triangle after the word.
  const tx = width / 2 + c.measureText(label).width / 2 + bandH * 0.05;
  c.fillStyle = theme.wall;
  c.beginPath(); c.moveTo(tx, height / 2 - bandH * 0.2); c.lineTo(tx + bandH * 0.34, height / 2); c.lineTo(tx, height / 2 + bandH * 0.2); c.closePath(); c.fill();
  c.restore();
}

/** The three story panels: আম্মু at the door, the knot of lanes, and the walker on its way. Framed like a printed page. */
export function drawStoryPanel(canvas: HTMLCanvasElement, width: number, ratio: number, panel: number) {
  const height = Math.round(width * 2 / 3);
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  const c = canvas.getContext("2d")!;
  c.setTransform(ratio, 0, 0, ratio, 0, 0);
  const theme = THEMES[0], u = width / 30;
  c.fillStyle = "#f9e9c8"; c.fillRect(0, 0, width, height);
  if (panel === 0) {
    // A house front, a door, আম্মু in a green saree, and a speech bubble with a জিলাপি.
    c.fillStyle = "#e8c9a0"; c.fillRect(u * 3, u * 6, u * 15, u * 14);
    c.fillStyle = theme.wall; c.beginPath(); c.moveTo(u * 2, u * 6.5); c.lineTo(u * 10.5, u * 1.5); c.lineTo(u * 19, u * 6.5); c.closePath(); c.fill();
    c.fillStyle = INK; c.fillRect(u * 8, u * 11, u * 5, u * 9);
    c.fillStyle = "#2f8f4e"; c.beginPath(); c.moveTo(u * 10.5, u * 12.5); c.lineTo(u * 8.4, u * 20); c.lineTo(u * 12.6, u * 20); c.closePath(); c.fill();
    c.fillStyle = "#8a5a3a"; c.beginPath(); c.arc(u * 10.5, u * 11.7, u * 1.3, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#fffaf0"; c.strokeStyle = INK; c.lineWidth = 2;
    c.beginPath(); c.ellipse(u * 23, u * 7, u * 5.5, u * 4, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(u * 19, u * 9.5); c.lineTo(u * 14, u * 11.5); c.lineTo(u * 20.5, u * 10.3); c.fill();
    jilapi(c, u * 23, u * 7, u * 2.6, u * 0.7);
  } else if (panel === 1) {
    // A knot of brick lanes with a question mark.
    const cell = u * 3.2, size = 6, ox = (width - cell * size) / 2, oy = (height - cell * size) / 2;
    c.save(); c.translate(ox, oy);
    drawMaze(c, makeMaze(size, 41), cell, theme);
    c.restore();
    c.fillStyle = INK; c.font = `800 ${Math.round(u * 6)}px Display, Bangla, sans-serif`; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText("?", width - u * 3, u * 4);
  } else {
    // The walker on the pencil line, the shop ahead, and a finger's swipe.
    c.strokeStyle = theme.trail; c.lineWidth = u * 1.4; c.lineCap = "round"; c.lineJoin = "round";
    c.beginPath(); c.moveTo(u * 3, u * 15); c.lineTo(u * 10, u * 15); c.lineTo(u * 10, u * 8); c.lineTo(u * 17, u * 8); c.stroke();
    drawWalker(c, u * 17, u * 8, u * 4, 1, 0);
    shop(c, u * 25, u * 8, u * 7);
    c.strokeStyle = INK; c.lineWidth = u * 0.5; c.setLineDash([u * 0.8, u * 0.8]);
    c.beginPath(); c.moveTo(u * 12, u * 16); c.lineTo(u * 20, u * 16); c.stroke(); c.setLineDash([]);
    c.beginPath(); c.moveTo(u * 20, u * 16); c.lineTo(u * 18.6, u * 15); c.moveTo(u * 20, u * 16); c.lineTo(u * 18.6, u * 17); c.stroke();
    c.fillStyle = "#e8c9a0"; c.beginPath(); c.ellipse(u * 21.5, u * 17.8, u * 1.3, u * 1.8, -0.4, 0, Math.PI * 2); c.fill();
  }
  c.strokeStyle = INK; c.lineWidth = 3; c.strokeRect(1.5, 1.5, width - 3, height - 3);
}
