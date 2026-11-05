// Everything drawn once, never per frame: the painting, each piece cut from it (and its lift shadow), the board with its
// placed pieces, the tray's wells, the title's box lid and the story panels. All code, no image files, crisp at the
// phone's pixel ratio (capped at 2). The table's per-frame drawing is in table.hot.ts.
import { makeRng } from "../../../shared/game-core";
import { Flash, type Layout } from "./anim";
import { makePuzzle, type Puzzle } from "./game";
import { drawPainting, paintingFor } from "./painting";
import { MARGIN, tracePiece } from "./pieces";
import type { Scene } from "./table.hot";

/** One look per world: the board card, its cut lines, the tray, the ink for rings and the dust. */
export const LOOKS = [
  { board: "#efe3c8", line: "rgba(90,60,30,0.32)", frame: "#8a6a44", tray: "#e6d6b6", well: "#d9c59f", ring: "#c26a2e", dust: "#fff4d8" },
  { board: "#ecd2ae", line: "rgba(110,50,20,0.34)", frame: "#7a3f22", tray: "#e2c098", well: "#d3a978", ring: "#b4411f", dust: "#ffe6c4" },
  { board: "#1f2a44", line: "rgba(220,230,255,0.3)", frame: "#0d1428", tray: "#2a3656", well: "#1b2440", ring: "#f2c45a", dust: "#dfe8ff" },
] as const;

/** By Flash kind: a piece in (gold), a wrong cell (red), the right cell still turned (amber), knobs that fit the wrong cell (yellow). */
const FLASH_COLORS: string[] = [];
FLASH_COLORS[Flash.Good] = "#ffe58a"; FLASH_COLORS[Flash.Wrong] = "#d2452f"; FLASH_COLORS[Flash.Turn] = "#f2a21b"; FLASH_COLORS[Flash.Fits] = "#f5d06a";

function canvasOf(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(width)); canvas.height = Math.max(1, Math.ceil(height));
  return canvas;
}

/** The level's painting at board size × ratio. */
export function paintCanvas(level: number, side: number) {
  const canvas = canvasOf(side, side), c = canvas.getContext("2d");
  if (c) drawPainting(c, paintingFor(level), 0, 0, canvas.width);
  return canvas;
}

/** Cuts every piece out of the painting: a sprite with a baked bevel and small shadow, and a soft silhouette for the lift. */
function cutPieces(puzzle: Puzzle, painting: HTMLCanvasElement, l: Layout, ratio: number) {
  const { n } = puzzle, cell = l.cell, margin = MARGIN * cell, side = Math.ceil(l.piece * ratio);
  const sprites: HTMLCanvasElement[] = [], shadows: HTMLCanvasElement[] = [];
  for (let id = 0; id < n * n; id++) {
    const canvas = canvasOf(side, side), c = canvas.getContext("2d")!;
    c.scale(ratio, ratio);
    const col = id % n, row = Math.floor(id / n);
    const outline = () => { c.beginPath(); tracePiece(c, puzzle.edges, n, id, margin, margin, cell); };
    c.save(); c.shadowColor = "rgba(40,25,10,0.42)"; c.shadowBlur = 4; c.shadowOffsetY = 1.5; c.fillStyle = "#6b5a44"; outline(); c.fill(); c.restore();
    c.save(); outline(); c.clip();
    c.drawImage(painting, margin - col * cell, margin - row * cell, l.board, l.board);
    // The cardboard's cut edge: a light rim on top-left, a dark one bottom-right.
    c.lineWidth = Math.max(1.6, cell * 0.022);
    c.translate(0.8, 0.8); c.strokeStyle = "rgba(255,255,255,0.5)"; outline(); c.stroke();
    c.translate(-1.6, -1.6); c.strokeStyle = "rgba(0,0,0,0.3)"; outline(); c.stroke();
    c.restore();
    c.lineWidth = 0.8; c.strokeStyle = "rgba(40,25,10,0.55)"; outline(); c.stroke();
    sprites.push(canvas);
    const shadow = canvasOf(side, side), s = shadow.getContext("2d")!;
    s.scale(ratio, ratio);
    s.shadowColor = "rgba(20,12,4,0.7)"; s.shadowBlur = Math.max(6, cell * 0.12); s.fillStyle = "rgba(20,12,4,0.55)";
    s.beginPath(); tracePiece(s, puzzle.edges, n, id, margin, margin, cell); s.fill();
    shadows.push(shadow);
  }
  return { sprites, shadows };
}

/** The board: the card, the painting as a faint guide, every empty cell's cut line, and the pieces already in. */
export function paintBoard(target: HTMLCanvasElement, puzzle: Puzzle, painting: HTMLCanvasElement, l: Layout, ratio: number, placed: readonly boolean[], ghost: number, world: number) {
  const pad = 2, side = l.board + pad * 2, look = LOOKS[world] ?? LOOKS[0];
  target.width = Math.ceil(side * ratio); target.height = Math.ceil(side * ratio);
  const c = target.getContext("2d")!;
  c.setTransform(ratio, 0, 0, ratio, pad * ratio, pad * ratio);
  c.fillStyle = look.frame; c.fillRect(-pad, -pad, side, side);
  c.fillStyle = look.board; c.fillRect(0, 0, l.board, l.board);
  if (ghost > 0) { c.globalAlpha = ghost; c.drawImage(painting, 0, 0, l.board, l.board); c.globalAlpha = 1; }
  const n = puzzle.n, cell = l.cell;
  const trace = (pick: boolean) => {
    c.beginPath();
    for (let id = 0; id < n * n; id++) if (placed[id] === pick) tracePiece(c, puzzle.edges, n, id, (id % n) * cell, Math.floor(id / n) * cell, cell);
  };
  c.lineWidth = 1.2; c.strokeStyle = look.line; trace(false); c.stroke();
  if (placed.some(Boolean)) {
    c.save(); trace(true); c.clip(); c.drawImage(painting, 0, 0, l.board, l.board); c.restore();
    c.lineWidth = 1; c.strokeStyle = "rgba(30,20,10,0.24)"; trace(true); c.stroke();
  }
}

/** The tray: a row of shallow wells under the board. */
function paintTray(l: Layout, ratio: number, world: number) {
  const look = LOOKS[world] ?? LOOKS[0], pad = 2;
  const canvas = canvasOf((l.board + pad * 2) * ratio, (l.rows * l.slot + pad * 2) * ratio), c = canvas.getContext("2d")!;
  c.setTransform(ratio, 0, 0, ratio, pad * ratio, pad * ratio);
  c.fillStyle = look.tray;
  roundRect(c, -pad, -pad, l.board + pad * 2, l.rows * l.slot + pad * 2, 12); c.fill();
  for (let slot = 0; slot < l.slots; slot++) {
    const x = (slot % l.cols) * l.slot, y = Math.floor(slot / l.cols) * l.slot;
    c.fillStyle = look.well; roundRect(c, x + 3, y + 3, l.slot - 6, l.slot - 6, 9); c.fill();
    c.fillStyle = "rgba(0,0,0,0.07)"; c.fillRect(x + 6, y + 3, l.slot - 12, 2);
  }
  return canvas;
}

function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}

/** Each cell's outline as a path, for flashes. */
function cellPaths(puzzle: Puzzle, l: Layout) {
  const paths: Path2D[] = [], n = puzzle.n;
  for (let id = 0; id < n * n; id++) {
    const path = new Path2D();
    tracePiece(path, puzzle.edges, n, id, (id % n) * l.cell, Math.floor(id / n) * l.cell, l.cell);
    paths.push(path);
  }
  return paths;
}

/** Bakes the whole scene for a level at a size: about 30–80 ms on a cheap phone, once per level or resize. */
export function bakeScene(level: number, l: Layout, ratio: number, placed: readonly boolean[], ghost: number, world: number) {
  const puzzle = makePuzzle(level), painting = paintCanvas(level, l.board * ratio), look = LOOKS[world] ?? LOOKS[0];
  const { sprites, shadows } = cutPieces(puzzle, painting, l, ratio);
  const board = document.createElement("canvas");
  paintBoard(board, puzzle, painting, l, ratio, placed, ghost, world);
  const probe = board.getContext("2d")!, sweep = probe.createLinearGradient(-l.board * 0.6, 0, 0, 0);
  sweep.addColorStop(0, "rgba(255,255,255,0)"); sweep.addColorStop(0.5, "rgba(255,250,225,0.6)"); sweep.addColorStop(1, "rgba(255,255,255,0)");
  const scene: Scene = {
    board, tray: paintTray(l, ratio, world), sprites, shadows, cells: cellPaths(puzzle, l), sweep,
    flashColors: FLASH_COLORS, dust: look.dust, ring: look.ring, cursor: world === 2 ? "#f2c45a" : "#1d2b53",
  };
  return { scene, painting, puzzle };
}

// ---- the title's box lid and the story ----

/** The level's painting framed as the lid of a cardboard jigsaw box, its seams faintly showing. Sized to its canvas. */
export function drawLid(canvas: HTMLCanvasElement, width: number, height: number, level: number, world: number) {
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  const c = canvas.getContext("2d")!;
  c.setTransform(ratio, 0, 0, ratio, 0, 0);
  const look = LOOKS[world] ?? LOOKS[0], side = Math.min(width, height), x = (width - side) / 2, y = (height - side) / 2;
  const rim = side * 0.06;
  c.fillStyle = "rgba(30,15,0,0.28)"; roundRect(c, x + 4, y + 8, side - 4, side - 4, 14); c.fill();
  c.fillStyle = world === 2 ? "#3a3f66" : "#b8834a"; roundRect(c, x, y, side - 6, side - 6, 14); c.fill();
  c.fillStyle = "rgba(255,255,255,0.18)"; c.fillRect(x + 10, y + 3, side - 26, 3);
  const inner = side - 6 - rim * 2, painting = paintCanvas(level, inner * ratio);
  c.drawImage(painting, x + rim, y + rim, inner, inner);
  const puzzle = makePuzzle(level), cell = inner / puzzle.n;
  c.save(); c.beginPath(); c.rect(x + rim, y + rim, inner, inner); c.clip();
  c.strokeStyle = "rgba(255,255,255,0.26)"; c.lineWidth = 1.2;
  c.beginPath();
  for (let id = 0; id < puzzle.n ** 2; id++) tracePiece(c, puzzle.edges, puzzle.n, id, x + rim + (id % puzzle.n) * cell, y + rim + Math.floor(id / puzzle.n) * cell, cell);
  c.stroke(); c.restore();
  c.strokeStyle = look.frame; c.lineWidth = 2; c.strokeRect(x + rim, y + rim, inner, inner);
}

export const STORY = [
  "নানুবাড়ির আলমারির ওপরে পুরোনো একটা বাক্স।",
  "ভেতরে নানার আঁকা গ্রামের ছবি, কেটে টুকরো করা।",
  "টুকরোগুলো জোড়া লাগাও। ভোর থেকে জোছনা, ৩০টা ছবি।",
] as const;

/** One story panel, drawn like a page of a picture book: the box on the almirah, the pieces spilled, the picture whole. */
export function drawStoryPanel(canvas: HTMLCanvasElement, width: number, height: number, panel: number) {
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  const c = canvas.getContext("2d")!;
  c.setTransform(ratio, 0, 0, ratio, 0, 0);
  const w = width, h = height, rng = makeRng(4242 + panel);
  // A lime-washed wall and the almirah's wooden top.
  const wall = c.createLinearGradient(0, 0, 0, h);
  wall.addColorStop(0, "#f3e7cf"); wall.addColorStop(1, "#e4d2ad");
  c.fillStyle = wall; c.fillRect(0, 0, w, h);
  c.fillStyle = "#7a4e2c"; c.fillRect(0, h * 0.72, w, h * 0.28);
  c.fillStyle = "#94603a"; c.fillRect(0, h * 0.72, w, h * 0.035);
  c.fillStyle = "rgba(0,0,0,0.12)";
  for (let index = 0; index < 5; index++) c.fillRect(0, h * (0.78 + index * 0.045), w, 1.5);
  const puzzle = makePuzzle(1), side = Math.min(w, h) * 0.56, painting = paintCanvas(1, side * ratio);
  if (panel === 0) {
    // The closed box seen from a little above: the lid shows the first picture, a jute string ties it, dust on top.
    const bw = side * 1.05, bh = side * 0.28, depth = side * 0.32, bx = w / 2 - bw / 2, by = h * 0.72 - bh;
    c.fillStyle = "rgba(30,15,0,0.28)"; c.fillRect(bx + 10, h * 0.72 - 6, bw, 10);
    c.fillStyle = "#9a6636"; c.fillRect(bx, by, bw, bh);
    c.fillStyle = "rgba(0,0,0,0.12)"; c.fillRect(bx, by, bw, 4);
    // The lid's top face, leaning back.
    c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + bw, by); c.lineTo(bx + bw + depth * 0.5, by - depth); c.lineTo(bx + depth * 0.5, by - depth); c.closePath();
    c.fillStyle = "#c08a50"; c.fill();
    c.save();
    c.beginPath(); c.moveTo(bx + 8, by - 4); c.lineTo(bx + bw - 8, by - 4); c.lineTo(bx + bw + depth * 0.5 - 10, by - depth + 5); c.lineTo(bx + depth * 0.5 + 10, by - depth + 5); c.closePath(); c.clip();
    const lidW = bw - 16, lidH = depth - 9;
    // The picture's bottom edge sits on the lid's front edge; its top leans back and right with the lid.
    c.transform(lidW / painting.width, 0, -(depth * 0.5 - 2) / painting.height, lidH / painting.height, bx + 8 + depth * 0.5 - 2, by - 4 - lidH);
    c.drawImage(painting, 0, 0);
    c.restore();
    // The jute string, crossing the lid and down the front.
    c.strokeStyle = "#d9c08a"; c.lineWidth = 3;
    c.beginPath(); c.moveTo(bx + bw * 0.55, by + bh); c.lineTo(bx + bw * 0.55, by); c.lineTo(bx + bw * 0.55 + depth * 0.5, by - depth); c.stroke();
    c.fillStyle = "rgba(255,255,255,0.4)";
    for (let index = 0; index < 50; index++) c.fillRect(bx + depth * 0.25 + rng() * bw, by - rng() * depth, 1.5, 1.5);
  } else if (panel === 1) {
    // The lid off, pieces spilled on the almirah top.
    const cell = side / 3, margin = MARGIN * cell;
    for (let id = 0; id < 9; id++) {
      const px = w * 0.12 + rng() * w * 0.7, py = h * 0.5 + rng() * h * 0.3, angle = (rng() - 0.5) * 1.6;
      c.save(); c.translate(px, py); c.rotate(angle); c.translate(-cell / 2 - margin, -cell / 2 - margin);
      c.beginPath(); tracePiece(c, puzzle.edges, 3, id, margin, margin, cell);
      c.save(); c.shadowColor = "rgba(30,15,0,0.35)"; c.shadowBlur = 6; c.shadowOffsetY = 3; c.fillStyle = "#6b5a44"; c.fill(); c.restore();
      c.clip(); c.drawImage(painting, margin - (id % 3) * cell, margin - Math.floor(id / 3) * cell, side, side);
      c.restore();
    }
  } else {
    // The picture whole, propped against the wall.
    const px = w / 2 - side / 2, py = h * 0.72 - side - 6;
    c.fillStyle = "rgba(30,15,0,0.3)"; c.fillRect(px + 6, py + 8, side, side);
    c.fillStyle = "#b8834a"; c.fillRect(px - 8, py - 8, side + 16, side + 16);
    c.drawImage(painting, px, py, side, side);
    const glow = c.createRadialGradient(w / 2, h * 0.3, 0, w / 2, h * 0.3, w * 0.7);
    glow.addColorStop(0, "rgba(255,240,190,0.35)"); glow.addColorStop(1, "rgba(255,240,190,0)");
    c.fillStyle = glow; c.fillRect(0, 0, w, h);
  }
}
