// Drawing the board (rainbow squares, bamboo ladders, friendly snakes) and the pieces. Used by the play canvas and the share card.
import { BODY_FONT } from "../../../shared/card-canvas";
import { JUMPS, LAST, SIZE, cellOf, isLadder } from "./board";

/** Seat colours and shapes: pieces differ by shape too, so colour is never the only clue. */
export const SEATS = [
  { name: "গোলাপি", color: "#c2255c", deep: "#7c1239", shape: "circle" },
  { name: "নীল", color: "#1864ab", deep: "#0b3a6b", shape: "square" },
  { name: "কমলা", color: "#e8590c", deep: "#8a3205", shape: "triangle" },
  { name: "বেগুনি", color: "#6741d9", deep: "#3b2391", shape: "diamond" },
] as const;

const CELLS = ["#ffe8a3", "#ffc9c2", "#c3f0c8", "#c5e4ff", "#ffd8a8"];
const INK = "#4a2f17";
const SNAKE_SKINS = [
  { body: "#2f9e44", spot: "#ffe066" }, { body: "#0b7285", spot: "#c5f6fa" }, { body: "#c92a2a", spot: "#ffd43b" },
  { body: "#8d5524", spot: "#ffe8cc" }, { body: "#f59f00", spot: "#5c3a00" }, { body: "#5c940d", spot: "#e9fac8" },
];
const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });

export type Point = { x: number; y: number };

/** Centre of a square (1–100) in a board whose top-left is (left, top). Writes into `out` so the game loop allocates nothing. */
export function centerOf(square: number, cell: number, left: number, top: number, out: Point) {
  const index = square - 1, line = Math.floor(index / SIZE), along = index % SIZE;
  out.x = left + ((line % 2 === 0 ? along : SIZE - 1 - along) + 0.5) * cell; out.y = top + (SIZE - 1 - line + 0.5) * cell;
  return out;
}

// A snake's S-curve: a cubic from head to tail, bending alternately left and right.
const curve = { hx: 0, hy: 0, ax: 0, ay: 0, bx: 0, by: 0, tx: 0, ty: 0 };
const head: Point = { x: 0, y: 0 }, tail: Point = { x: 0, y: 0 };
const BENDS = [1, -1, 1, -0.8, -1, 1, -1, 0.9];
function snakeCurve(id: number, cell: number, left: number, top: number) {
  const jump = JUMPS[id];
  centerOf(jump.from, cell, left, top, head); centerOf(jump.to, cell, left, top, tail);
  const dx = tail.x - head.x, dy = tail.y - head.y, length = Math.hypot(dx, dy) || 1, bend = BENDS[(id - 9 + BENDS.length) % BENDS.length] * cell * 0.8;
  const px = -dy / length * bend, py = dx / length * bend;
  curve.hx = head.x; curve.hy = head.y; curve.tx = tail.x; curve.ty = tail.y;
  curve.ax = head.x + dx * 0.3 + px; curve.ay = head.y + dy * 0.3 + py;
  curve.bx = head.x + dx * 0.7 - px; curve.by = head.y + dy * 0.7 - py;
  return curve;
}
function bezier(c: typeof curve, t: number, out: Point) {
  const u = 1 - t, a = u * u * u, b = 3 * u * u * t, d = 3 * u * t * t, e = t * t * t;
  out.x = a * c.hx + b * c.ax + d * c.bx + e * c.tx; out.y = a * c.hy + b * c.ay + d * c.by + e * c.ty;
  return out;
}

/** Where a piece is `t` (0–1) of the way along jump `id`: up a ladder in a line, down a snake along its body. */
export function alongJump(id: number, t: number, cell: number, left: number, top: number, out: Point) {
  const jump = JUMPS[id];
  if (isLadder(id)) {
    centerOf(jump.from, cell, left, top, head); centerOf(jump.to, cell, left, top, tail);
    out.x = head.x + (tail.x - head.x) * t; out.y = head.y + (tail.y - head.y) * t;
    return out;
  }
  return bezier(snakeCurve(id, cell, left, top), t, out);
}

function ladder(context: CanvasRenderingContext2D, id: number, cell: number, left: number, top: number) {
  const jump = JUMPS[id], a = centerOf(jump.from, cell, left, top, { x: 0, y: 0 }), b = centerOf(jump.to, cell, left, top, { x: 0, y: 0 });
  const dx = b.x - a.x, dy = b.y - a.y, length = Math.hypot(dx, dy), ux = dx / length, uy = dy / length;
  const half = cell * 0.24, nx = -uy * half, ny = ux * half;
  // Rails reach a little past both squares' centres, like a ladder leaning on the board.
  const ax = a.x - ux * cell * 0.22, ay = a.y - uy * cell * 0.22, bx = b.x + ux * cell * 0.18, by = b.y + uy * cell * 0.18;
  context.lineCap = "round";
  const rungs = Math.max(2, Math.round(length / (cell * 0.42)));
  for (let pass = 0; pass < 2; pass++) {
    context.strokeStyle = pass ? "#e0a84e" : "#5e3a0d";
    context.lineWidth = pass ? cell * 0.07 : cell * 0.12;
    for (let i = 1; i < rungs; i++) {
      const t = i / rungs, x = ax + (bx - ax) * t, y = ay + (by - ay) * t;
      context.beginPath(); context.moveTo(x + nx, y + ny); context.lineTo(x - nx, y - ny); context.stroke();
    }
  }
  for (const side of [1, -1]) {
    const sx = nx * side, sy = ny * side;
    context.strokeStyle = "#5e3a0d"; context.lineWidth = cell * 0.15;
    context.beginPath(); context.moveTo(ax + sx, ay + sy); context.lineTo(bx + sx, by + sy); context.stroke();
    context.strokeStyle = "#d4953c"; context.lineWidth = cell * 0.095;
    context.beginPath(); context.moveTo(ax + sx, ay + sy); context.lineTo(bx + sx, by + sy); context.stroke();
    context.strokeStyle = "#f6cf86"; context.lineWidth = cell * 0.03;
    context.beginPath(); context.moveTo(ax + sx, ay + sy); context.lineTo(bx + sx, by + sy); context.stroke();
    // Bamboo joints.
    context.strokeStyle = "#7a4a12"; context.lineWidth = cell * 0.035;
    const joints = Math.max(1, Math.round(length / (cell * 0.8)));
    for (let i = 1; i <= joints; i++) {
      const t = (i - 0.5) / joints, x = ax + sx + (bx - ax) * t, y = ay + sy + (by - ay) * t, j = cell * 0.06;
      context.beginPath(); context.moveTo(x - uy * j, y + ux * j); context.lineTo(x + uy * j, y - ux * j); context.stroke();
    }
  }
}

function snake(context: CanvasRenderingContext2D, id: number, cell: number, left: number, top: number) {
  const c = snakeCurve(id, cell, left, top), skin = SNAKE_SKINS[(id - 9) % SNAKE_SKINS.length], p: Point = { x: 0, y: 0 };
  const steps = 70, radius = (t: number) => cell * (0.17 - 0.12 * t);
  // Stamped discs make a smooth, tapering body: outline first, then the skin, then a light belly line and spots.
  for (const [colour, extra] of [["#00000059", cell * 0.035], [skin.body, 0]] as const) {
    context.fillStyle = colour;
    for (let i = steps; i >= 0; i--) {
      const t = i / steps; bezier(c, t, p);
      context.beginPath(); context.arc(p.x, p.y, radius(t) + extra, 0, Math.PI * 2); context.fill();
    }
  }
  context.fillStyle = skin.spot;
  for (let i = 6; i < steps - 4; i += 6) {
    const t = i / steps; bezier(c, t, p);
    context.beginPath(); context.arc(p.x, p.y, radius(t) * 0.42, 0, Math.PI * 2); context.fill();
  }
  // The head: a round face turned along the body, two big eyes, a little smile and tongue.
  const next = bezier(c, 0.06, { x: 0, y: 0 }), angle = Math.atan2(c.hy - next.y, c.hx - next.x);
  context.save();
  context.translate(c.hx, c.hy); context.rotate(angle);
  const r = cell * 0.24;
  context.strokeStyle = "#d6336c"; context.lineWidth = cell * 0.035; context.lineCap = "round";
  context.beginPath(); context.moveTo(r * 0.9, 0); context.lineTo(r * 1.45, 0); context.moveTo(r * 1.45, 0); context.lineTo(r * 1.7, -r * 0.2); context.moveTo(r * 1.45, 0); context.lineTo(r * 1.7, r * 0.2); context.stroke();
  context.fillStyle = "#00000059"; context.beginPath(); context.ellipse(0, 0, r * 1.05 + cell * 0.035, r * 0.88 + cell * 0.035, 0, 0, Math.PI * 2); context.fill();
  context.fillStyle = skin.body; context.beginPath(); context.ellipse(0, 0, r * 1.05, r * 0.88, 0, 0, Math.PI * 2); context.fill();
  for (const side of [-1, 1]) {
    context.fillStyle = "#ffffff"; context.beginPath(); context.arc(r * 0.25, side * r * 0.42, r * 0.36, 0, Math.PI * 2); context.fill();
    context.fillStyle = "#1b1b1b"; context.beginPath(); context.arc(r * 0.36, side * r * 0.4, r * 0.18, 0, Math.PI * 2); context.fill();
  }
  context.strokeStyle = "#1b1b1b"; context.lineWidth = cell * 0.025;
  context.beginPath(); context.arc(r * 0.45, 0, r * 0.35, -0.9, 0.9); context.stroke();
  context.restore();
}

/** The whole board at `cell` pixels a square, top-left at (left, top). Static: the play canvas renders it once, offscreen. */
export function drawBoard(context: CanvasRenderingContext2D, cell: number, left: number, top: number) {
  const p: Point = { x: 0, y: 0 };
  for (let square = 1; square <= LAST; square++) {
    const { col, row } = cellOf(square), x = left + col * cell, y = top + row * cell;
    context.fillStyle = square === LAST ? "#ffd43b" : CELLS[(col + row) % CELLS.length];
    context.fillRect(x, y, cell, cell);
  }
  context.strokeStyle = "#4a2f1733"; context.lineWidth = Math.max(1, cell * 0.025);
  context.beginPath();
  for (let i = 1; i < SIZE; i++) {
    context.moveTo(left + i * cell, top); context.lineTo(left + i * cell, top + SIZE * cell);
    context.moveTo(left, top + i * cell); context.lineTo(left + SIZE * cell, top + i * cell);
  }
  context.stroke();
  context.textAlign = "left"; context.textBaseline = "top";
  context.font = `700 ${Math.round(cell * 0.29)}px ${BODY_FONT}`;
  for (let square = 1; square <= LAST; square++) {
    const { col, row } = cellOf(square);
    context.fillStyle = square === LAST ? "#7a3d00" : "#4a2f17a8";
    context.fillText(digits.format(square), left + col * cell + cell * 0.07, top + row * cell + cell * 0.03);
  }
  // 100: a little pennant on the finishing square.
  centerOf(LAST, cell, left, top, p);
  context.strokeStyle = INK; context.lineWidth = cell * 0.04;
  context.beginPath(); context.moveTo(p.x + cell * 0.05, p.y + cell * 0.38); context.lineTo(p.x + cell * 0.05, p.y - cell * 0.12); context.stroke();
  context.fillStyle = "#e03131"; context.beginPath(); context.moveTo(p.x + cell * 0.07, p.y - cell * 0.12); context.lineTo(p.x + cell * 0.4, p.y); context.lineTo(p.x + cell * 0.07, p.y + cell * 0.1); context.closePath(); context.fill();
  context.textBaseline = "alphabetic";
  JUMPS.forEach((_, id) => { if (isLadder(id)) ladder(context, id, cell, left, top); });
  JUMPS.forEach((_, id) => { if (!isLadder(id)) snake(context, id, cell, left, top); });
}

function shapePath(context: CanvasRenderingContext2D, shape: (typeof SEATS)[number]["shape"], x: number, y: number, s: number) {
  context.beginPath();
  if (shape === "circle") context.arc(x, y, s, 0, Math.PI * 2);
  else if (shape === "square") context.roundRect(x - s * 0.9, y - s * 0.9, s * 1.8, s * 1.8, s * 0.35);
  else if (shape === "triangle") { context.moveTo(x, y - s * 1.12); context.lineTo(x + s * 1.08, y + s * 0.82); context.lineTo(x - s * 1.08, y + s * 0.82); context.closePath(); }
  else { context.moveTo(x, y - s * 1.15); context.lineTo(x + s, y); context.lineTo(x, y + s * 1.15); context.lineTo(x - s, y); context.closePath(); }
}

let labelSize = 0, labelFont = "";
/** One piece: its seat's shape and colour with a white rim, and "১"/"২" when a seat has two pieces. Allocation-free for the game loop. */
export function drawPiece(context: CanvasRenderingContext2D, seat: number, x: number, y: number, r: number, label: string) {
  const { color, deep, shape } = SEATS[seat];
  context.fillStyle = "#00000040"; shapePath(context, shape, x, y + r * 0.18, r * 1.32); context.fill();
  context.fillStyle = "#ffffff"; shapePath(context, shape, x, y, r * 1.28); context.fill();
  context.fillStyle = deep; shapePath(context, shape, x, y, r * 1.08); context.fill();
  context.fillStyle = color; shapePath(context, shape, x, y, r * 0.96); context.fill();
  context.fillStyle = "#ffffff66"; context.beginPath(); context.arc(x - r * 0.3, y - r * 0.35, r * 0.28, 0, Math.PI * 2); context.fill();
  if (!label) return;
  const size = Math.round(r * 1.05);
  if (size !== labelSize) { labelSize = size; labelFont = `800 ${size}px ${BODY_FONT}`; }
  context.fillStyle = "#ffffff"; context.textAlign = "center"; context.textBaseline = "middle"; context.font = labelFont;
  context.fillText(label, x, y + r * (shape === "triangle" ? 0.22 : 0.08));
  context.textBaseline = "alphabetic";
}

/** A ring and a ghost on the squares a waiting choice could move to. */
export function drawGhost(context: CanvasRenderingContext2D, seat: number, x: number, y: number, r: number) {
  const { color, shape } = SEATS[seat];
  context.globalAlpha = 0.45; context.fillStyle = color; shapePath(context, shape, x, y, r); context.fill();
  context.globalAlpha = 1; context.strokeStyle = "#ffffff"; context.lineWidth = Math.max(1.5, r * 0.18); context.setLineDash([r * 0.4, r * 0.3]); context.stroke(); context.setLineDash([]);
}

/** Where the `rank`-th of `count` pieces sharing a square sits, as fractions of a square (and its radius). Allocation-free. */
export function slotOffset(rank: number, count: number, out: { x: number; y: number; r: number }) {
  if (count <= 1) { out.x = 0; out.y = 0.05; out.r = 0.26; return out; }
  if (count === 2) { out.x = rank ? 0.2 : -0.2; out.y = 0.08; out.r = 0.2; return out; }
  const cols = count <= 4 ? 2 : 3, step = cols === 2 ? 0.36 : 0.28, col = rank % cols, row = Math.floor(rank / cols);
  out.x = (col - (cols - 1) / 2) * step; out.y = (row - (cols - 1) / 2) * step + 0.08; out.r = cols === 2 ? 0.17 : 0.13;
  return out;
}

/** Every piece standing on the board (the start row is left out), each sharing its square politely. For the card. */
export function drawPieces(context: CanvasRenderingContext2D, pos: readonly number[], pieces: number, cell: number, left: number, top: number) {
  const at: Point = { x: 0, y: 0 }, slot = { x: 0, y: 0, r: 0 };
  pos.forEach((square, index) => {
    if (square < 1) return;
    const sharing = pos.filter(other => other === square).length, rank = pos.slice(0, index).filter(other => other === square).length;
    centerOf(square, cell, left, top, at); slotOffset(rank, sharing, slot);
    drawPiece(context, Math.floor(index / pieces), at.x + slot.x * cell, at.y + slot.y * cell, slot.r * cell, pieces === 2 ? digits.format(index % 2 + 1) : "");
  });
}
