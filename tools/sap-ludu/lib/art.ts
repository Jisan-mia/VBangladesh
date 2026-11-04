// Code-drawn art: one palette per world, the board painted once (offscreen, at the phone's pixel ratio), and the pieces
// as small pre-rendered sprites. Used by the play canvas and the share card. Nothing here runs per frame.
import { BODY_FONT } from "../../../shared/card-canvas";
import type { Board } from "./board";
import { bezierX, bezierY, snakeCurve, squareX, squareY, startY } from "./motion.hot";

/** Seat colours and shapes: pieces differ by shape too, so colour is never the only clue. */
export const SEATS = [
  { name: "গোলাপি", color: "#c2255c", deep: "#7c1239", shape: "circle" },
  { name: "নীল", color: "#1864ab", deep: "#0b3a6b", shape: "square" },
  { name: "কমলা", color: "#e8590c", deep: "#8a3205", shape: "triangle" },
  { name: "বেগুনি", color: "#6741d9", deep: "#3b2391", shape: "diamond" },
] as const;
export type Shape = (typeof SEATS)[number]["shape"];

export type Palette = {
  /** The stage behind the board, and the frame around it. */
  stage: string; frame: string; strip: string; stripInk: string;
  cells: readonly string[]; grid: string; number: string; home: string; homeInk: string;
  rails: readonly [string, string, string]; snakes: readonly { body: string; spot: string }[];
  /** Chalk lines instead of printed ones (the courtyard). */
  chalk: boolean;
};

export const PALETTES: readonly Palette[] = [
  {
    // উঠান: chalk squares on a red clay floor, swept clean.
    stage: "#e9c39b", frame: "#7a3b1c", strip: "#a9582f", stripInk: "#fff3e0",
    cells: ["#cf7d50", "#c4703f", "#d58a5d"], grid: "#fff4e2cc", number: "#fff4e2", home: "#f7d79a", homeInk: "#7a3b1c",
    rails: ["#5e3a0d", "#d4953c", "#f6cf86"],
    snakes: [{ body: "#2f6e3a", spot: "#f2e28b" }, { body: "#5a3a1a", spot: "#e8c27a" }, { body: "#3b3b3b", spot: "#d9d2c2" }],
    chalk: true,
  },
  {
    // ছাদ: the roof on a blue afternoon, kites overhead.
    stage: "#cfe6f7", frame: "#1d4f7a", strip: "#2f6a9a", stripInk: "#f1f8ff",
    cells: ["#f4fbff", "#dcefff", "#fff3d6"], grid: "#1d4f7a2e", number: "#1d4f7aa8", home: "#ffd43b", homeInk: "#7a4a00",
    rails: ["#5e3a0d", "#d4953c", "#f6cf86"],
    snakes: [{ body: "#c92a2a", spot: "#ffd43b" }, { body: "#0b7285", spot: "#c5f6fa" }, { body: "#5c940d", spot: "#e9fac8" }, { body: "#862e9c", spot: "#f3d9fa" }],
    chalk: false,
  },
  {
    // লুডু বোর্ড: the printed back of the ludo board, every square a different sweet colour.
    stage: "#f3dfb3", frame: "#7a1f2b", strip: "#e6c98f", stripInk: "#7a1f2b",
    cells: ["#ffe8a3", "#ffc9c2", "#c3f0c8", "#c5e4ff", "#ffd8a8"], grid: "#4a2f1733", number: "#4a2f17a8", home: "#ffd43b", homeInk: "#7a3d00",
    rails: ["#5e3a0d", "#d4953c", "#f6cf86"],
    snakes: [{ body: "#2f9e44", spot: "#ffe066" }, { body: "#0b7285", spot: "#c5f6fa" }, { body: "#c92a2a", spot: "#ffd43b" }, { body: "#8d5524", spot: "#ffe8cc" }, { body: "#f59f00", spot: "#5c3a00" }, { body: "#5c940d", spot: "#e9fac8" }],
    chalk: false,
  },
];

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
/** The start strip under the board, in cells. */
export const STRIP = 0.95;

function ladder(c: CanvasRenderingContext2D, board: Board, id: number, cell: number, left: number, top: number, palette: Palette) {
  const jump = board.jumps[id];
  const ax0 = left + squareX(board, jump.from) * cell, ay0 = top + squareY(board, jump.from) * cell;
  const bx0 = left + squareX(board, jump.to) * cell, by0 = top + squareY(board, jump.to) * cell;
  const dx = bx0 - ax0, dy = by0 - ay0, length = Math.hypot(dx, dy), ux = dx / length, uy = dy / length;
  const half = cell * 0.24, nx = -uy * half, ny = ux * half;
  const ax = ax0 - ux * cell * 0.22, ay = ay0 - uy * cell * 0.22, bx = bx0 + ux * cell * 0.18, by = by0 + uy * cell * 0.18;
  const [dark, mid, light] = palette.rails;
  c.lineCap = "round";
  // A soft shadow so the ladder leans on the board.
  c.strokeStyle = "#00000024"; c.lineWidth = cell * 0.2;
  for (const side of [1, -1]) { c.beginPath(); c.moveTo(ax + nx * side + cell * 0.05, ay + ny * side + cell * 0.07); c.lineTo(bx + nx * side + cell * 0.05, by + ny * side + cell * 0.07); c.stroke(); }
  const rungs = Math.max(2, Math.round(length / (cell * 0.42)));
  for (let pass = 0; pass < 2; pass++) {
    c.strokeStyle = pass ? mid : dark;
    c.lineWidth = pass ? cell * 0.07 : cell * 0.12;
    for (let i = 1; i < rungs; i++) {
      const t = i / rungs, x = ax + (bx - ax) * t, y = ay + (by - ay) * t;
      c.beginPath(); c.moveTo(x + nx, y + ny); c.lineTo(x - nx, y - ny); c.stroke();
    }
  }
  for (const side of [1, -1]) {
    const sx = nx * side, sy = ny * side;
    c.strokeStyle = dark; c.lineWidth = cell * 0.15;
    c.beginPath(); c.moveTo(ax + sx, ay + sy); c.lineTo(bx + sx, by + sy); c.stroke();
    c.strokeStyle = mid; c.lineWidth = cell * 0.095;
    c.beginPath(); c.moveTo(ax + sx, ay + sy); c.lineTo(bx + sx, by + sy); c.stroke();
    c.strokeStyle = light; c.lineWidth = cell * 0.03;
    c.beginPath(); c.moveTo(ax + sx, ay + sy); c.lineTo(bx + sx, by + sy); c.stroke();
    // Bamboo joints.
    c.strokeStyle = "#7a4a12"; c.lineWidth = cell * 0.035;
    const joints = Math.max(1, Math.round(length / (cell * 0.8)));
    for (let i = 1; i <= joints; i++) {
      const t = (i - 0.5) / joints, x = ax + sx + (bx - ax) * t, y = ay + sy + (by - ay) * t, j = cell * 0.06;
      c.beginPath(); c.moveTo(x - uy * j, y + ux * j); c.lineTo(x + uy * j, y - ux * j); c.stroke();
    }
  }
}

function snake(c: CanvasRenderingContext2D, board: Board, id: number, cell: number, left: number, top: number, palette: Palette, boss: boolean) {
  const curve = snakeCurve(board, id), index = id - board.ladders;
  const skin = boss ? { body: "#1f1f1f", spot: "#e03131" } : palette.snakes[index % palette.snakes.length];
  const fat = boss ? 1.4 : 1, steps = 80;
  const radius = (t: number) => cell * (0.17 - 0.12 * t) * fat;
  const px = (t: number) => left + bezierX(curve, t) * cell, py = (t: number) => top + bezierY(curve, t) * cell;
  // Stamped discs make a smooth, tapering body: a shadow, an outline, the skin, then the belly line and spots.
  for (const [colour, extra, shift] of [["#0000002a", cell * 0.02, cell * 0.06], ["#00000066", cell * 0.035, 0], [skin.body, 0, 0]] as const) {
    c.fillStyle = colour;
    for (let i = steps; i >= 0; i--) {
      const t = i / steps;
      c.beginPath(); c.arc(px(t) + shift * 0.6, py(t) + shift, radius(t) + extra, 0, Math.PI * 2); c.fill();
    }
  }
  c.fillStyle = "#ffffff30";
  for (let i = steps; i >= 0; i--) { const t = i / steps; c.beginPath(); c.arc(px(t) - radius(t) * 0.3, py(t) - radius(t) * 0.35, radius(t) * 0.38, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = skin.spot;
  for (let i = 6; i < steps - 4; i += boss ? 5 : 7) {
    const t = i / steps;
    if (boss) { c.beginPath(); c.moveTo(px(t), py(t) - radius(t) * 0.5); c.lineTo(px(t) + radius(t) * 0.45, py(t)); c.lineTo(px(t), py(t) + radius(t) * 0.5); c.lineTo(px(t) - radius(t) * 0.45, py(t)); c.closePath(); c.fill(); }
    else { c.beginPath(); c.arc(px(t), py(t), radius(t) * 0.42, 0, Math.PI * 2); c.fill(); }
  }
  // The head: a round face turned along the body, two big eyes, a smile and a forked tongue.
  const hx = px(0), hy = py(0), angle = Math.atan2(hy - py(0.06), hx - px(0.06));
  c.save();
  c.translate(hx, hy); c.rotate(angle);
  const r = cell * 0.24 * (boss ? 1.25 : 1);
  c.strokeStyle = "#d6336c"; c.lineWidth = cell * 0.035; c.lineCap = "round";
  c.beginPath(); c.moveTo(r * 0.9, 0); c.lineTo(r * 1.45, 0); c.moveTo(r * 1.45, 0); c.lineTo(r * 1.7, -r * 0.2); c.moveTo(r * 1.45, 0); c.lineTo(r * 1.7, r * 0.2); c.stroke();
  c.fillStyle = "#00000066"; c.beginPath(); c.ellipse(0, 0, r * 1.05 + cell * 0.035, r * 0.88 + cell * 0.035, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = skin.body; c.beginPath(); c.ellipse(0, 0, r * 1.05, r * 0.88, 0, 0, Math.PI * 2); c.fill();
  for (const side of [-1, 1]) {
    c.fillStyle = "#ffffff"; c.beginPath(); c.arc(r * 0.25, side * r * 0.42, r * 0.36, 0, Math.PI * 2); c.fill();
    c.fillStyle = boss ? "#e03131" : "#1b1b1b"; c.beginPath(); c.arc(r * 0.36, side * r * 0.4, r * 0.18, 0, Math.PI * 2); c.fill();
    if (boss) { c.strokeStyle = "#1b1b1b"; c.lineWidth = cell * 0.04; c.beginPath(); c.moveTo(r * 0.0, side * r * 0.85); c.lineTo(r * 0.55, side * r * 0.55); c.stroke(); }
  }
  c.strokeStyle = "#1b1b1b"; c.lineWidth = cell * 0.025;
  c.beginPath(); c.arc(r * 0.45, 0, r * 0.35, -0.9, 0.9); c.stroke();
  c.restore();
}

/** The little house on the last square: ঘর. */
function home(c: CanvasRenderingContext2D, x: number, y: number, cell: number, palette: Palette) {
  const s = cell * 0.36;
  c.fillStyle = "#00000022"; c.fillRect(x - s * 0.72 + cell * 0.04, y - s * 0.05 + cell * 0.05, s * 1.44, s * 0.9);
  c.fillStyle = "#fff8e6"; c.fillRect(x - s * 0.72, y - s * 0.05, s * 1.44, s * 0.9);
  c.fillStyle = "#c92a2a"; c.beginPath(); c.moveTo(x - s * 0.95, y); c.lineTo(x, y - s * 0.8); c.lineTo(x + s * 0.95, y); c.closePath(); c.fill();
  c.fillStyle = palette.homeInk; c.fillRect(x - s * 0.2, y + s * 0.3, s * 0.4, s * 0.55);
}

/**
 * The whole board at `cell` px a square, top-left at (left, top), with the start strip under it. Static: the play canvas
 * paints it once, offscreen. `boss` is the finale's boss snake (drawn bigger), or -1.
 */
export function paintBoard(c: CanvasRenderingContext2D, board: Board, palette: Palette, cell: number, left: number, top: number, boss = -1, strip = true) {
  const width = board.cols * cell, height = board.rows * cell;
  for (let square = 1; square <= board.last; square++) {
    const x = left + (squareX(board, square) - 0.5) * cell, y = top + (squareY(board, square) - 0.5) * cell;
    const col = Math.round(squareX(board, square) - 0.5), row = Math.round(squareY(board, square) - 0.5);
    c.fillStyle = square === board.last ? palette.home : palette.cells[(col + row) % palette.cells.length];
    c.fillRect(x, y, cell + 0.5, cell + 0.5);
  }
  if (palette.chalk) {
    // Chalk: a wobbly double line, slightly uneven, like a hand drew it on the floor.
    c.strokeStyle = palette.grid; c.lineCap = "round";
    for (let i = 0; i <= board.cols; i++) for (const shift of [0, 1.5]) {
      c.lineWidth = Math.max(1, cell * (shift ? 0.012 : 0.03));
      c.beginPath(); c.moveTo(left + i * cell + shift, top); c.quadraticCurveTo(left + i * cell + (i % 2 ? 2 : -2), top + height / 2, left + i * cell - shift, top + height); c.stroke();
    }
    for (let i = 0; i <= board.rows; i++) for (const shift of [0, 1.5]) {
      c.lineWidth = Math.max(1, cell * (shift ? 0.012 : 0.03));
      c.beginPath(); c.moveTo(left, top + i * cell + shift); c.quadraticCurveTo(left + width / 2, top + i * cell + (i % 2 ? -2 : 2), left + width, top + i * cell - shift); c.stroke();
    }
  } else {
    c.strokeStyle = palette.grid; c.lineWidth = Math.max(1, cell * 0.025);
    c.beginPath();
    for (let i = 1; i < board.cols; i++) { c.moveTo(left + i * cell, top); c.lineTo(left + i * cell, top + height); }
    for (let i = 1; i < board.rows; i++) { c.moveTo(left, top + i * cell); c.lineTo(left + width, top + i * cell); }
    c.stroke();
  }
  c.textAlign = "left"; c.textBaseline = "top";
  c.font = `700 ${Math.round(cell * (board.cols > 7 ? 0.29 : 0.24))}px ${BODY_FONT}`;
  for (let square = 1; square <= board.last; square++) {
    const x = left + (squareX(board, square) - 0.5) * cell, y = top + (squareY(board, square) - 0.5) * cell;
    c.fillStyle = square === board.last ? palette.homeInk : palette.number;
    c.fillText(digits.format(square), x + cell * 0.07, y + cell * 0.04);
  }
  home(c, left + squareX(board, board.last) * cell, top + squareY(board, board.last) * cell + cell * 0.06, cell, palette);
  c.textBaseline = "alphabetic";
  for (let id = 0; id < board.ladders; id++) ladder(c, board, id, cell, left, top, palette);
  for (let id = board.ladders; id < board.jumps.length; id++) if (id !== boss) snake(c, board, id, cell, left, top, palette, false);
  if (boss >= 0) snake(c, board, boss, cell, left, top, palette, true);
  if (!strip) return;
  c.fillStyle = palette.strip; c.fillRect(left, top + height, width, cell * STRIP);
  c.fillStyle = "#00000022"; c.fillRect(left, top + height, width, Math.max(1, cell * 0.05));
  c.fillStyle = palette.stripInk; c.font = `700 ${Math.round(cell * (board.cols > 7 ? 0.36 : 0.3))}px ${BODY_FONT}`;
  c.textBaseline = "middle";
  c.fillText("শুরু", left + cell * 0.18, top + startY(board) * cell);
  c.textBaseline = "alphabetic";
}

export function shapePath(c: CanvasRenderingContext2D, shape: Shape, x: number, y: number, s: number) {
  c.beginPath();
  if (shape === "circle") c.arc(x, y, s, 0, Math.PI * 2);
  else if (shape === "square") c.roundRect(x - s * 0.9, y - s * 0.9, s * 1.8, s * 1.8, s * 0.35);
  else if (shape === "triangle") { c.moveTo(x, y - s * 1.12); c.lineTo(x + s * 1.08, y + s * 0.82); c.lineTo(x - s * 1.08, y + s * 0.82); c.closePath(); }
  else { c.moveTo(x, y - s * 1.15); c.lineTo(x + s, y); c.lineTo(x, y + s * 1.15); c.lineTo(x - s, y); c.closePath(); }
}

/** One piece drawn at (x, y) with radius r: its seat's shape and colour, a white rim, a shine, and "১"/"২" when it has a twin. */
export function paintPiece(c: CanvasRenderingContext2D, seat: number, x: number, y: number, r: number, label: string) {
  const { color, deep, shape } = SEATS[seat];
  c.fillStyle = "#ffffff"; shapePath(c, shape, x, y, r * 1.28); c.fill();
  c.fillStyle = deep; shapePath(c, shape, x, y, r * 1.08); c.fill();
  c.fillStyle = color; shapePath(c, shape, x, y, r * 0.96); c.fill();
  c.fillStyle = "#ffffff66"; c.beginPath(); c.arc(x - r * 0.3, y - r * 0.35, r * 0.28, 0, Math.PI * 2); c.fill();
  if (!label) return;
  c.fillStyle = "#ffffff"; c.textAlign = "center"; c.textBaseline = "middle"; c.font = `800 ${Math.round(r * 1.05)}px ${BODY_FONT}`;
  c.fillText(label, x, y + r * (shape === "triangle" ? 0.22 : 0.08));
  c.textBaseline = "alphabetic";
}

/** A piece as a sprite: `size` CSS px square, drawn at `ratio`. The game loop only calls drawImage on these. */
export function pieceSprite(seat: number, label: string, size: number, ratio: number) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = Math.max(2, Math.round(size * ratio));
  const c = canvas.getContext("2d");
  if (c) { c.setTransform(ratio, 0, 0, ratio, 0, 0); paintPiece(c, seat, size / 2, size / 2, size * 0.36, label); }
  return canvas;
}

/** Every piece standing on the board (the start strip is left out), each sharing its square politely. For the card. */
export function paintPieces(c: CanvasRenderingContext2D, board: Board, pos: readonly number[], pieces: number, cell: number, left: number, top: number) {
  pos.forEach((square, index) => {
    if (square < 1) return;
    const sharing = pos.filter(other => other === square).length, rank = pos.slice(0, index).filter(other => other === square).length;
    const spread = sharing > 1 ? 0.22 : 0, angle = (rank / Math.max(1, sharing)) * Math.PI * 2;
    const x = left + (squareX(board, square) + Math.cos(angle) * spread) * cell, y = top + (squareY(board, square) + Math.sin(angle) * spread + 0.05) * cell;
    paintPiece(c, Math.floor(index / pieces), x, y, cell * (sharing > 1 ? 0.18 : 0.25), pieces === 2 ? digits.format(index % 2 + 1) : "");
  });
}
