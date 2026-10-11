// Draws the classroom. The walls, window, board and the benches full of children are painted once into offscreen canvases;
// each frame only reveals chalk, poses the teacher, turns the fan and moves the chit, with no allocations in the loop.
import { DISPLAY_FONT, wrapText } from "../../../shared/card-canvas";
import { BENCHES, BOARDS, CHITS, GRACE, REPLIES, SEATS, type Game, type Klass, type Teacher } from "./game";

export const SCENE_W = 360;
export const SCENE_H = 380;

const BOARD = { x: 72, y: 30, w: 220, h: 84 };
const INK_SPEED = 28;
const SKIN = "#b97a50";
const SKIN_T = "#c68a5e";
const HAIR = "#2a211d";
const PEN = "#23408e";
const CHALK = "#f4f1e8";

/** Bench row k (0 = front): its scale and the y of the seat line. */
export const rowScale = (k: number) => 0.56 + 0.075 * k;
export const rowY = (k: number) => 40 + 300 * rowScale(k);
const GAP = 84;
/** x of a seat on the middle bench row. */
export const seatX = (k: number, seat: number) => SCENE_W / 2 + (seat - (SEATS - 1) / 2) * GAP * rowScale(k);
const FLOOR = 186;

export type Layers = { back: HTMLCanvasElement; rows: HTMLCanvasElement; board: HTMLCanvasElement; boardFor: number; lineEnds: number[]; k: number; bubble: Record<string, number> };

function layer(width: number, height: number, k: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(width * k); canvas.height = Math.ceil(height * k);
  const context = canvas.getContext("2d")!;
  context.setTransform(k, 0, 0, k, 0, 0);
  return { canvas, context };
}

function paintWindow(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const sky = c.createLinearGradient(0, y, 0, y + h);
  sky.addColorStop(0, "#a9d8ee"); sky.addColorStop(0.6, "#e3f3f8");
  c.fillStyle = sky; c.fillRect(x, y, w, h);
  // The school field: grass, a tree, and a bamboo goalpost.
  c.fillStyle = "#86b862"; c.fillRect(x, y + h * 0.62, w, h * 0.38);
  c.fillStyle = "#6e9e4f"; c.fillRect(x, y + h * 0.62, w, 2);
  c.fillStyle = "#5b4330"; c.fillRect(x + w * 0.72, y + h * 0.42, 3, h * 0.24);
  c.fillStyle = "#4f8a46"; c.beginPath(); c.arc(x + w * 0.74, y + h * 0.38, 11, 0, Math.PI * 2); c.arc(x + w * 0.86, y + h * 0.44, 8, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#e1cf9b"; c.lineWidth = 1.6;
  c.beginPath(); c.moveTo(x + 8, y + h * 0.7); c.lineTo(x + 8, y + h * 0.5); c.lineTo(x + 28, y + h * 0.5); c.lineTo(x + 28, y + h * 0.7); c.stroke();
  // Blue iron grill and frame.
  c.strokeStyle = "#3d7ea6"; c.lineWidth = 1.6;
  for (let gx = x + 7; gx < x + w; gx += 7.5) { c.beginPath(); c.moveTo(gx, y); c.lineTo(gx, y + h); c.stroke(); }
  c.beginPath(); c.moveTo(x, y + h / 2); c.lineTo(x + w, y + h / 2); c.stroke();
  c.lineWidth = 4; c.strokeRect(x, y, w, h);
  c.fillStyle = "#d8cfb6"; c.fillRect(x - 4, y + h + 2, w + 8, 4);
}

function paintBack(c: CanvasRenderingContext2D) {
  // Ceiling, whitewashed wall, and the green-painted lower wall every school has.
  c.fillStyle = "#d8d0bc"; c.fillRect(0, 0, SCENE_W, 22);
  c.fillStyle = "#ebe4cf"; c.fillRect(0, 22, SCENE_W, 126);
  c.fillStyle = "#c9bfa5"; c.fillRect(0, 21, SCENE_W, 2);
  c.fillStyle = "#7fae9b"; c.fillRect(0, 146, SCENE_W, FLOOR - 146);
  c.fillStyle = "#5f8f7c"; c.fillRect(0, 144, SCENE_W, 3);
  // Cement floor with a few lines running to the board.
  const floor = c.createLinearGradient(0, FLOOR, 0, SCENE_H);
  floor.addColorStop(0, "#c9bea8"); floor.addColorStop(1, "#ab9d82");
  c.fillStyle = floor; c.fillRect(0, FLOOR, SCENE_W, SCENE_H - FLOOR);
  c.strokeStyle = "rgba(90,70,40,.12)"; c.lineWidth = 1;
  for (let i = -4; i <= 4; i++) { c.beginPath(); c.moveTo(180 + i * 40, FLOOR); c.lineTo(180 + i * 150, SCENE_H); c.stroke(); }

  paintWindow(c, 10, 36, 50, 74);

  // Blackboard with a wooden frame, chalk dust, and a tray with chalk and a duster.
  const { x, y, w, h } = BOARD;
  c.fillStyle = "#8a5a34"; c.fillRect(x - 5, y - 5, w + 10, h + 10);
  c.fillStyle = "#2f4a3e"; c.fillRect(x, y, w, h);
  c.fillStyle = "rgba(255,255,255,.05)";
  for (const [dx, dy, r] of [[40, 60, 22], [150, 30, 26], [190, 66, 18]]) { c.beginPath(); c.ellipse(x + dx, y + dy, r, r * 0.45, -0.3, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = "#74492a"; c.fillRect(x - 2, y + h + 4, w + 4, 5);
  c.fillStyle = CHALK; c.fillRect(x + 24, y + h + 2, 9, 3); c.fillRect(x + 38, y + h + 2.5, 5, 2.5);
  c.fillStyle = "#6b4b2e"; c.fillRect(x + w - 40, y + h - 1, 22, 6);
  c.fillStyle = "#9c9c94"; c.fillRect(x + w - 40, y + h + 4, 22, 2);

  // Wall clock and a pinned class routine.
  c.fillStyle = "#fffdf6"; c.beginPath(); c.arc(324, 52, 14, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#3a3a3a"; c.lineWidth = 2.4; c.stroke();
  c.lineWidth = 1.6; c.beginPath(); c.moveTo(324, 52); c.lineTo(324, 43); c.moveTo(324, 52); c.lineTo(330, 55); c.stroke();
  c.fillStyle = "#fbf7ea"; c.fillRect(306, 78, 36, 44);
  c.fillStyle = "#c0392b"; c.beginPath(); c.arc(324, 80, 2, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#9aa3ab"; for (let ly = 88; ly < 120; ly += 6) c.fillRect(310, ly, 28, 1.4);

  // The teacher's table: a register and a chalk box on it.
  c.fillStyle = "#84522c"; c.fillRect(24, 154, 82, 32);
  c.fillStyle = "#a36a3d"; c.fillRect(20, 148, 90, 7);
  c.fillStyle = "#6b4022"; c.fillRect(26, 186, 6, 7); c.fillRect(98, 186, 6, 7);
  c.fillStyle = "#2f5d8a"; c.fillRect(34, 142, 30, 6);
  c.fillStyle = "#f1ece0"; c.fillRect(34, 141, 30, 2);
  c.fillStyle = "#f7f4ec"; c.fillRect(74, 139, 16, 9);
  c.strokeStyle = "#cfc6b0"; c.lineWidth = 1; c.strokeRect(74, 139, 16, 9);

  // Fan rod (the blades turn every frame).
  c.fillStyle = "#6d7678"; c.fillRect(178.5, 0, 3, 12);
}

const SHIRTS = ["#f6f4ec", "#cfe0f1", "#f6f4ec", "#f6f4ec", "#cfe0f1"];
const SHADE = "rgba(40,50,70,.13)";
const MUTED_SHIRTS = ["#e6e2d8", "#d3dbe3"];
/** A child on a bench seen from behind; `look` picks hair (short, two plaits) and shirt from the seat, not the seed. Side rows are `muted`. */
function paintKid(c: CanvasRenderingContext2D, x: number, y: number, s: number, look: number, muted: boolean) {
  const hair = muted ? "#5b4e46" : HAIR;
  // Shoulders and back, arms resting on the desk in front.
  c.fillStyle = muted ? MUTED_SHIRTS[look % 2] : SHIRTS[look % SHIRTS.length];
  c.beginPath();
  c.moveTo(x - 9 * s, y - 27 * s);
  c.quadraticCurveTo(x - 19 * s, y - 26 * s, x - 20 * s, y - 16 * s);
  c.lineTo(x - 18 * s, y + 3 * s); c.lineTo(x + 18 * s, y + 3 * s); c.lineTo(x + 20 * s, y - 16 * s);
  c.quadraticCurveTo(x + 19 * s, y - 26 * s, x + 9 * s, y - 27 * s);
  c.closePath(); c.fill();
  c.fillStyle = SHADE;
  c.fillRect(x - 0.7 * s, y - 22 * s, 1.4 * s, 24 * s);
  c.beginPath(); c.moveTo(x - 20 * s, y - 16 * s); c.lineTo(x - 18 * s, y + 3 * s); c.lineTo(x - 14 * s, y + 3 * s); c.lineTo(x - 15 * s, y - 18 * s); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(x + 20 * s, y - 16 * s); c.lineTo(x + 18 * s, y + 3 * s); c.lineTo(x + 14 * s, y + 3 * s); c.lineTo(x + 15 * s, y - 18 * s); c.closePath(); c.fill();
  c.fillStyle = SKIN; c.fillRect(x - 3.5 * s, y - 31 * s, 7 * s, 6 * s);
  c.beginPath(); c.arc(x - 12 * s, y - 35 * s, 2.8 * s, 0, Math.PI * 2); c.arc(x + 12 * s, y - 35 * s, 2.8 * s, 0, Math.PI * 2); c.fill();
  c.fillStyle = hair; c.beginPath(); c.arc(x, y - 37 * s, 12.5 * s, 0, Math.PI * 2); c.fill();
  if (look % 3 === 1) {
    // Two plaits with white ribbons.
    for (const side of [-1, 1]) {
      c.fillStyle = hair; c.beginPath(); c.roundRect(x + side * 8.5 * s - 2.6 * s, y - 33 * s, 5.2 * s, 17 * s, 2.6 * s); c.fill();
      c.fillStyle = "#ffffff"; c.beginPath(); c.arc(x + side * 8.5 * s, y - 16 * s, 3 * s, 0, Math.PI * 2); c.fill();
    }
  } else {
    c.fillStyle = muted ? "#6b5d54" : "#43362f"; c.beginPath(); c.ellipse(x - 3 * s, y - 44 * s, 5 * s, 2.6 * s, -0.3, 0, Math.PI * 2); c.fill();
  }
}

function paintBench(c: CanvasRenderingContext2D, cx: number, y: number, s: number, seats: number, row: number, column: number) {
  const width = (seats * GAP + 12) * s;
  // The desk in front of these children, mostly hidden behind their backs.
  c.fillStyle = "#8b5a33"; c.fillRect(cx - width / 2, y - 19 * s, width, 5 * s);
  c.fillStyle = "#a46c3f"; c.fillRect(cx - width / 2, y - 20 * s, width, 1.6 * s);
  for (let seat = 0; seat < seats; seat++) paintKid(c, cx + (seat - (seats - 1) / 2) * GAP * s, y, s, row * 5 + column * 3 + seat * 7, column !== 1);
  // The bench they sit on.
  c.fillStyle = "#7a4a28"; c.fillRect(cx - width / 2, y + 2 * s, width, 6 * s);
  c.fillStyle = "#5e381e"; c.fillRect(cx - width / 2 + 4 * s, y + 8 * s, 4 * s, 12 * s); c.fillRect(cx + width / 2 - 8 * s, y + 8 * s, 4 * s, 12 * s);
}

function paintRows(c: CanvasRenderingContext2D) {
  for (let k = 0; k < BENCHES; k++) {
    const s = rowScale(k), y = rowY(k);
    // Side benches frame the room from the edges; the chit travels down the middle row, with clear aisles either side.
    paintBench(c, SCENE_W / 2 - 222 * s, y, s, 2, k, 0);
    paintBench(c, SCENE_W / 2 + 222 * s, y, s, 2, k, 2);
    paintBench(c, SCENE_W / 2, y, s, SEATS, k, 1);
  }
}

const BOARD_FONT = (size: number) => `600 ${size}px ${DISPLAY_FONT}`;
const lineY = (line: number) => BOARD.y + 22 + line * 25;

function paintBoardText(c: CanvasRenderingContext2D, board: number) {
  const lines = BOARDS[board], ends: number[] = [];
  let total = 0;
  c.fillStyle = CHALK; c.textBaseline = "alphabetic";
  lines.forEach((text, line) => {
    c.font = BOARD_FONT(line === 0 ? 16 : 15);
    c.globalAlpha = 0.9;
    c.fillText(text, 12, lineY(line) - BOARD.y);
    c.globalAlpha = 0.25;
    c.fillText(text, 12.6, lineY(line) - BOARD.y + 0.5);
    const width = c.measureText(text).width;
    if (line === 0) { c.globalAlpha = 0.7; c.fillRect(12, lineY(0) - BOARD.y + 5, width, 1.4); }
    total += width + 14;
    ends.push(total);
  });
  c.globalAlpha = 1;
  return ends;
}

/** Everything still, painted for this canvas size; the board text is redone when a new class picks another board. */
export function buildLayers(width: number, ratio: number, klass: Klass): Layers {
  const k = (width / SCENE_W) * ratio;
  const back = layer(SCENE_W, SCENE_H, k);
  paintBack(back.context);
  const rows = layer(SCENE_W, SCENE_H, k);
  paintRows(rows.context);
  const board = layer(BOARD.w, BOARD.h, k);
  const lineEnds = paintBoardText(board.context, klass.board);
  const bubble: Record<string, number> = {};
  board.context.font = BUBBLE_FONT;
  for (const text of BUBBLES) bubble[text] = board.context.measureText(text).width;
  return { back: back.canvas, rows: rows.canvas, board: board.canvas, boardFor: klass.board, lineEnds, k, bubble };
}

export function refreshBoard(layers: Layers, klass: Klass) {
  if (layers.boardFor === klass.board) return;
  const context = layers.board.getContext("2d")!;
  context.setTransform(layers.k, 0, 0, layers.k, 0, 0);
  context.clearRect(0, 0, BOARD.w, BOARD.h);
  layers.lineEnds = paintBoardText(context, klass.board);
  layers.boardFor = klass.board;
}

const BUBBLE_FONT = `700 13px ${DISPLAY_FONT}`;
const BUBBLES = ["খুক খুক", "টুক!", "এইদিকে তাকাও!"] as const;

/** Smoothed, per-screen drawing state (never part of the rules). */
export type View = { tx: number; clock: number; slow: boolean; caughtAt: number; seenCatches: number };
export const makeView = (): View => ({ tx: 220, clock: 0, slow: false, caughtAt: -9, seenCatches: 0 });

const ease = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);

// Reused every frame instead of allocating.
const pose = { turn: 0, arm: 1, bend: 0, cough: 0, brow: 0, bubble: "", drop: -1 };
const hand = { x: 0, y: 0 };

function chalkPoint(layers: Layers, ink: number) {
  const ends = layers.lineEnds, total = ends[ends.length - 1];
  // The board fills up, stays a moment, and starts fresh if a slow class outlasts it.
  const p = (ink * INK_SPEED) % (total + INK_SPEED * 3);
  let line = 0;
  while (line < ends.length - 1 && p > ends[line]) line++;
  const start = line === 0 ? 0 : ends[line - 1];
  hand.x = BOARD.x + 12 + Math.min(ends[line] - start - 14, Math.max(0, p - start));
  hand.y = lineY(line) - 5;
  return p;
}

function setPose(game: Game) {
  pose.turn = 0; pose.arm = 1; pose.bend = 0; pose.cough = 0; pose.brow = 0; pose.bubble = ""; pose.drop = -1;
  if (game.phase === "ready") return;
  if (game.phase === "over") { pose.arm = 1; return; }
  if (game.scold > 0) { pose.turn = 1; pose.arm = 0; pose.brow = 1; pose.bubble = "এইদিকে তাকাও!"; return; }
  const segment = game.klass.segments[game.seg], t = game.segT / segment.dur;
  switch (segment.kind) {
    case "write": pose.arm = clamp01(game.segT / 0.3); break;
    case "tell": pose.arm = 1 - clamp01(t / 0.4); pose.turn = 0.35 * ease(clamp01(t / 0.5)); break;
    case "peek": {
      const back = clamp01((t - 0.6) / 0.4);
      pose.arm = back > 0 ? back : 1 - clamp01(t / 0.25); pose.turn = 0.35 * ease(clamp01(t / 0.35)) * (1 - back); break;
    }
    case "look": {
      const turning = clamp01(game.segT / GRACE), leaving = clamp01((segment.dur - game.segT) / 0.2);
      pose.arm = 0; pose.turn = (0.35 + 0.65 * ease(turning)) * leaving; break;
    }
    case "cough": pose.arm = 0.35; pose.cough = t < 0.85 ? 1 : 0; pose.bubble = t < 0.75 ? "খুক খুক" : ""; break;
    case "drop":
      pose.arm = 1 - clamp01(t / 0.1); pose.drop = t < 0.14 ? t / 0.14 : -1; pose.bubble = t < 0.3 ? "টুক!" : "";
      pose.bend = 48 * ease(clamp01((t - 0.14) / 0.18)) * (1 - ease(clamp01((t - 0.72) / 0.22))); break;
  }
}

function limb(c: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, width: number, color: string) {
  c.strokeStyle = color; c.lineWidth = width;
  c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
}

function drawTeacher(c: CanvasRenderingContext2D, teacher: Teacher, tx: number, chalkX: number, chalkY: number, bob: number) {
  const top = 60 + pose.bend + bob, hx = tx, hy = top + 12, front = pose.turn >= 0.5;
  const body = teacher === "sir" ? "#9cc1e4" : "#8c2f4b", sleeve = teacher === "sir" ? "#9cc1e4" : "#d9a640";
  c.save();
  // The front bench hides everything below the desk line.
  c.beginPath(); c.rect(0, 0, SCENE_W, 198); c.clip();
  c.lineCap = "round";
  c.fillStyle = teacher === "sir" ? "#4a4f5a" : body;
  c.fillRect(hx - 20, top + 120, 40, 40);
  // Torso.
  c.fillStyle = body;
  c.beginPath(); c.moveTo(hx - 19, top + 30); c.quadraticCurveTo(hx, top + 25, hx + 19, top + 30); c.lineTo(hx + 23, top + 130); c.lineTo(hx - 23, top + 130); c.closePath(); c.fill();
  if (teacher === "madam") {
    // The saree's end over one shoulder, with its border.
    c.fillStyle = "#e0b04a";
    c.beginPath(); c.moveTo(hx - 19, top + 31); c.lineTo(hx - 9, top + 28); c.lineTo(hx + 23, top + 96); c.lineTo(hx + 23, top + 112); c.closePath(); c.fill();
    c.fillStyle = "#a63d5c";
    c.beginPath(); c.moveTo(hx - 13, top + 31); c.lineTo(hx - 9, top + 29); c.lineTo(hx + 23, top + 98); c.lineTo(hx + 23, top + 106); c.closePath(); c.fill();
  } else if (front) {
    c.fillStyle = "#e9f1f9"; c.beginPath(); c.moveTo(hx - 7, top + 27); c.lineTo(hx, top + 36); c.lineTo(hx + 7, top + 27); c.closePath(); c.fill();
    c.fillStyle = "#6c8db0"; for (let by = top + 44; by < top + 110; by += 14) { c.beginPath(); c.arc(hx, by, 1.3, 0, Math.PI * 2); c.fill(); }
  }
  // Arms: the writing arm reaches for the chalk; in a cough the other hand goes to the mouth.
  const restX = hx + 22, restY = top + 82;
  const ax = restX + (chalkX - restX) * pose.arm, ay = restY + (chalkY - restY) * pose.arm;
  const ex = (hx + 20 + ax) / 2 + 9 * pose.arm, ey = (top + 34 + ay) / 2 + 10;
  limb(c, hx + 17, top + 34, ex, ey, 8, sleeve);
  limb(c, ex, ey, ax, ay, 6, SKIN_T);
  c.fillStyle = SKIN_T; c.beginPath(); c.arc(ax, ay, 3.6, 0, Math.PI * 2); c.fill();
  if (pose.arm > 0.6 && !front) { c.fillStyle = CHALK; c.fillRect(ax - 1, ay - 5, 2.4, 4); }
  if (pose.cough) {
    limb(c, hx - 17, top + 34, hx - 22, top + 52, 8, sleeve);
    limb(c, hx - 22, top + 52, hx - 6, top + 22, 6, SKIN_T);
  } else {
    limb(c, hx - 17, top + 34, hx - 24, top + 62, 8, sleeve);
    limb(c, hx - 24, top + 62, hx - 23, top + 84, 6, SKIN_T);
  }
  // Neck and head.
  c.fillStyle = SKIN_T; c.fillRect(hx - 4, hy + 8, 8, 8);
  if (!front) {
    // Turning: the head tilts toward the class and a cheek, an ear and one eye come round the side.
    const peek = pose.turn / 0.5;
    c.save();
    c.translate(hx, hy + 10); c.rotate(peek * 0.26); c.translate(-hx, -hy - 10);
    c.fillStyle = SKIN_T;
    c.beginPath(); c.arc(hx - 12, hy + 1, 2.8, 0, Math.PI * 2); c.fill();
    if (peek > 0.05) { c.beginPath(); c.ellipse(hx + 5 + 3 * peek, hy + 2, 3 + 6 * peek, 10.5, 0, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = HAIR; c.beginPath(); c.ellipse(hx - 3 * peek, hy - 1, 12, 12.5, 0, 0, Math.PI * 2); c.fill();
    if (teacher === "madam") { c.beginPath(); c.arc(hx - 4 * peek, hy + 10, 6.5, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = SKIN_T; c.beginPath(); c.arc(hx + 11.5 - 6 * peek, hy + 2, 2.8, 0, Math.PI * 2); c.fill();
    if (peek > 0.35) {
      c.fillStyle = "#2b2b2b"; c.beginPath(); c.arc(hx + 10 + 2 * peek, hy + 2, 1.5, 0, Math.PI * 2); c.fill();
      limb(c, hx + 7 + 2 * peek, hy - 3, hx + 13 + 2 * peek, hy - 3.5, 1.5, HAIR);
      if (teacher === "sir") { c.strokeStyle = "#3d3d3d"; c.lineWidth = 1.1; c.beginPath(); c.arc(hx + 10 + 2 * peek, hy + 2, 3.2, 0, Math.PI * 2); c.stroke(); }
    }
    c.restore();
  } else {
    const off = (1 - pose.turn) * 8;
    c.fillStyle = SKIN_T; c.beginPath(); c.arc(hx + off * 0.3, hy + 1, 12, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(hx - 12 + off * 0.3, hy + 2, 2.6, 0, Math.PI * 2); c.arc(hx + 12 + off * 0.3, hy + 2, 2.6, 0, Math.PI * 2); c.fill();
    c.fillStyle = HAIR;
    if (teacher === "sir") { c.beginPath(); c.ellipse(hx + off * 0.3, hy - 8, 12.5, 6.5, 0, Math.PI, Math.PI * 2); c.fill(); c.fillRect(hx - 12 + off * 0.3, hy - 9, 24, 3); }
    else { c.beginPath(); c.ellipse(hx + off * 0.3, hy - 6, 13, 8, 0, Math.PI, Math.PI * 2); c.fill(); c.fillRect(hx - 13 + off * 0.3, hy - 7, 4, 12); c.fillRect(hx + 9 + off * 0.3, hy - 7, 4, 12); }
    const fx = hx + off;
    c.fillStyle = "#2b2b2b";
    c.beginPath(); c.arc(fx - 4.5, hy + 2, 1.5, 0, Math.PI * 2); c.arc(fx + 4.5, hy + 2, 1.5, 0, Math.PI * 2); c.fill();
    // Eyebrows: one goes up when someone is caught. That's the whole scolding.
    limb(c, fx - 7, hy - 3 - pose.brow * 3, fx - 2, hy - 3 - pose.brow * 4.5, 1.6, HAIR);
    limb(c, fx + 2, hy - 3, fx + 7, hy - 3, 1.6, HAIR);
    if (teacher === "sir") {
      c.strokeStyle = "#3d3d3d"; c.lineWidth = 1.1;
      c.beginPath(); c.arc(fx - 4.5, hy + 2, 3.4, 0, Math.PI * 2); c.moveTo(fx + 7.9, hy + 2); c.arc(fx + 4.5, hy + 2, 3.4, 0, Math.PI * 2); c.moveTo(fx - 1.1, hy + 2); c.lineTo(fx + 1.1, hy + 2); c.stroke();
      limb(c, fx - 3.5, hy + 7, fx + 3.5, hy + 7, 1.8, "#3a2a22");
    }
    c.strokeStyle = "#7a3b2a"; c.lineWidth = 1.4;
    c.beginPath(); if (pose.brow) c.arc(fx, hy + 10.5, 1.8, 0, Math.PI * 2); else { c.moveTo(fx - 2.5, hy + 9.5); c.quadraticCurveTo(fx, hy + 10.8, fx + 2.5, hy + 9.5); } c.stroke();
  }
  c.restore();
  if (pose.drop >= 0) { c.fillStyle = CHALK; c.fillRect(chalkX - 1, chalkY + pose.drop * (180 - chalkY), 3, 5); }
}

/** The teacher at the board, back turned and writing, for the card: scene units scaled by `scale` from (ox, oy). */
export function drawTeacherWriting(c: CanvasRenderingContext2D, teacher: Teacher, ox: number, oy: number, scale: number) {
  pose.turn = 0; pose.arm = 1; pose.bend = 0; pose.cough = 0; pose.brow = 0; pose.bubble = ""; pose.drop = -1;
  c.save();
  c.translate(ox, oy); c.scale(scale, scale);
  drawTeacher(c, teacher, 180, 214, 60, 0);
  c.restore();
}

function drawBubble(c: CanvasRenderingContext2D, layers: Layers, text: string, x: number, y: number) {
  const w = (layers.bubble[text] ?? 60) + 16, left = Math.min(SCENE_W - w - 4, Math.max(4, x - w / 2));
  c.fillStyle = text === "এইদিকে তাকাও!" ? "#ffd166" : "#ffffff";
  c.beginPath(); c.roundRect(left, y - 22, w, 24, 12); c.fill();
  c.beginPath(); c.moveTo(x - 4, y + 1); c.lineTo(x + 4, y + 1); c.lineTo(x - 2, y + 8); c.closePath(); c.fill();
  c.fillStyle = "#1f2a24"; c.font = BUBBLE_FONT; c.textAlign = "left"; c.textBaseline = "alphabetic";
  c.fillText(text, left + 8, y - 5.5);
}

function drawFan(c: CanvasRenderingContext2D, angle: number) {
  c.lineCap = "round";
  for (let blade = 0; blade < 3; blade++) {
    const a = angle + blade * 2.0944, dx = Math.cos(a) * 38, dy = Math.sin(a) * 38 * 0.22;
    limb(c, 180, 14, 180 + dx, 14 + dy, 6.5, dy < 0 ? "#8e999c" : "#a7b1b3");
  }
  c.fillStyle = "#5d6668"; c.beginPath(); c.ellipse(180, 14, 7, 4.5, 0, 0, Math.PI * 2); c.fill();
}

/** A still ceiling fan for the card: the scene's fan and rod, scaled from (cx, top). */
export function drawCeilingFan(c: CanvasRenderingContext2D, cx: number, top: number, scale: number) {
  c.save();
  c.translate(cx - 180 * scale, top); c.scale(scale, scale);
  c.fillStyle = "#6d7678"; c.fillRect(178.5, 0, 3, 12);
  drawFan(c, 0.6);
  c.restore();
}

/** Where the chit sits on bench k: on the holder's shoulder, where the next child can reach it. */
const restX = (klass: Klass, k: number) => seatX(k, klass.path[k]) + 14 * rowScale(k);
const restY = (k: number) => rowY(k) - 25 * rowScale(k);
const headY = (k: number) => rowY(k) - 37 * rowScale(k);

function drawChit(c: CanvasRenderingContext2D, x: number, y: number, s: number, tilt: number) {
  c.fillStyle = "rgba(255,209,102,.5)";
  c.beginPath(); c.arc(x, y, 10 * s, 0, Math.PI * 2); c.fill();
  c.save();
  c.translate(x, y); c.rotate(tilt);
  c.fillStyle = "#fff6c4"; c.strokeStyle = "#6f5f30"; c.lineWidth = 1.1;
  c.beginPath(); c.rect(-6.5 * s, -4.5 * s, 13 * s, 9 * s); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(-6.5 * s, -4.5 * s); c.lineTo(0, 0.8 * s); c.lineTo(6.5 * s, -4.5 * s); c.stroke();
  c.restore();
}

const RING_DASH = [3, 3];
const PATH_DASH = [2, 5];
const NO_DASH: number[] = [];

/** One frame; before the first press a small label points at the chit. */
export function drawFrame(c: CanvasRenderingContext2D, layers: Layers, game: Game, view: View, dt: number) {
  const klass = game.klass, k = layers.k;
  view.clock += dt;
  // Draw in scene units whatever the canvas size.
  c.setTransform(k, 0, 0, k, 0, 0);
  c.drawImage(layers.back, 0, 0, SCENE_W, SCENE_H);
  drawFan(c, view.slow ? 0.6 : view.clock * 9);

  // Chalk appears as the teacher writes.
  const ends = layers.lineEnds, p = chalkPoint(layers, game.ink);
  let start = 0;
  for (let line = 0; line < ends.length && p > start; line++) {
    const shown = Math.min(ends[line] - start, p - start);
    const sy = lineY(line) - BOARD.y - 18;
    const w = Math.min(BOARD.w, 12 + shown);
    c.drawImage(layers.board, 0, sy * k, w * k, 24 * k, BOARD.x, BOARD.y + sy, w, 24);
    start = ends[line];
  }

  setPose(game);
  const target = Math.min(262, Math.max(134, hand.x - 30));
  view.tx += (target - view.tx) * Math.min(1, dt * (pose.arm > 0.5 ? 3 : 1));
  const bob = !view.slow && pose.arm > 0.9 && game.phase !== "over" ? Math.sin(view.clock * 7) * 0.8 : 0;
  drawTeacher(c, klass.teacher, view.tx, hand.x, hand.y, bob);

  c.drawImage(layers.rows, 0, 0, SCENE_W, SCENE_H);

  // The chit's way to the friend on the last bench, who waits inside a ring.
  const last = BENCHES - 1, lastX = seatX(last, klass.path[last]), lastY = headY(last), ringR = 13 * rowScale(last) + 5;
  const bench = Math.min(last, Math.floor(game.pos + 1e-9)), f = game.pos - bench;
  const ax = restX(klass, bench), ay = restY(bench);
  const bx = bench < last ? restX(klass, bench + 1) : ax, by = bench < last ? restY(bench + 1) : ay;
  const e = ease(f), s = rowScale(bench) + (rowScale(Math.min(last, bench + 1)) - rowScale(bench)) * e;
  const cx = ax + (bx - ax) * e, cy = ay + (by - ay) * e - Math.sin(Math.PI * f) * 14 * s;
  if (game.phase !== "over") {
    c.strokeStyle = "rgba(255,255,255,.8)"; c.lineWidth = 1.8; c.setLineDash(PATH_DASH);
    c.beginPath(); c.moveTo(cx, cy);
    for (let next = bench + 1; next <= last; next++) c.lineTo(restX(klass, next), restY(next));
    c.stroke();
    c.strokeStyle = "#ffd166"; c.lineWidth = 2.4; c.setLineDash(RING_DASH);
    c.beginPath(); c.arc(lastX, lastY, ringR, 0, Math.PI * 2); c.stroke();
    c.setLineDash(NO_DASH);
  }

  // The arms passing it.
  const passing = f > 0.02 && game.scold === 0;
  c.lineCap = "round";
  if (passing && f < 0.7) {
    const ks = rowScale(bench), kx = seatX(bench, klass.path[bench]);
    limb(c, kx + 15 * ks, rowY(bench) - 22 * ks, cx, cy, 5 * ks, SHIRTS[0]);
    c.fillStyle = SKIN; c.beginPath(); c.arc(cx, cy, 3 * ks, 0, Math.PI * 2); c.fill();
  }
  if (passing && f > 0.35 && bench < last) {
    const ks = rowScale(bench + 1), kx = seatX(bench + 1, klass.path[bench + 1]);
    limb(c, kx + 15 * ks, rowY(bench + 1) - 22 * ks, cx + 2, cy + 2, 5 * ks, SHIRTS[0]);
    c.fillStyle = SKIN; c.beginPath(); c.arc(cx + 2, cy + 2, 3 * ks, 0, Math.PI * 2); c.fill();
  }
  if (game.catches !== view.seenCatches) { view.seenCatches = game.catches; view.caughtAt = view.clock; }
  const shake = !view.slow && view.clock - view.caughtAt < 0.3 ? Math.sin(view.clock * 60) * 2 : 0;
  drawChit(c, cx + shake, cy, 0.75 + 0.5 * s, game.moving ? Math.sin(view.clock * 12) * 0.25 : -0.15);

  if (game.phase === "ready") {
    c.font = BUBBLE_FONT;
    const tx = cx + 12, ty = cy - 14;
    c.fillStyle = "#ffffff"; c.beginPath(); c.roundRect(tx - 4, ty - 15, 54, 20, 10); c.fill();
    c.fillStyle = "#1f2a24"; c.fillText("চিরকুট", tx + 4, ty);
  }

  if (pose.bubble) drawBubble(c, layers, pose.bubble, view.tx + (pose.bubble === "এইদিকে তাকাও!" ? 0 : -8), 56 + pose.bend);
  if (game.phase === "over") drawOpened(c, klass, lastX, lastY, ringR);
}

/** The payoff: the friend on the last bench opens the chit and writes back. */
function drawOpened(c: CanvasRenderingContext2D, klass: Klass, x: number, y: number, r: number) {
  c.fillStyle = "rgba(31,42,36,.28)"; c.fillRect(0, 0, SCENE_W, SCENE_H);
  c.save();
  c.translate(SCENE_W / 2, 236); c.rotate(-0.04);
  paintPaper(c, -118, -58, 236, 116, 1);
  c.fillStyle = PEN; c.font = `700 19px ${DISPLAY_FONT}`; c.textAlign = "center"; c.textBaseline = "alphabetic";
  const lines = wrapText(c, CHITS[klass.chit], 200, 2);
  lines.forEach((line, index) => c.fillText(line, 0, -18 + index * 26 - (lines.length - 1) * 8));
  c.fillStyle = "#b03a2e"; c.font = `700 17px ${DISPLAY_FONT}`;
  c.fillText(`— ${REPLIES[klass.reply]}`, 40, 42);
  c.restore();
  c.strokeStyle = "#ffd166"; c.lineWidth = 2.4; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.stroke();
}

/** A page torn from a ruled exercise book, folded once: used in the game and on the card. */
export function paintPaper(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, unit: number) {
  c.fillStyle = "rgba(0,0,0,.18)"; c.fillRect(x + 3 * unit, y + 4 * unit, w, h);
  c.fillStyle = "#fffdf4"; c.fillRect(x, y, w, h);
  c.strokeStyle = "#b9cde4"; c.lineWidth = 1 * unit;
  for (let ly = y + 22 * unit; ly < y + h - 6 * unit; ly += 20 * unit) { c.beginPath(); c.moveTo(x, ly); c.lineTo(x + w, ly); c.stroke(); }
  c.strokeStyle = "#e4a5a5"; c.beginPath(); c.moveTo(x + 22 * unit, y); c.lineTo(x + 22 * unit, y + h); c.stroke();
  c.strokeStyle = "rgba(0,0,0,.08)"; c.lineWidth = 2 * unit; c.beginPath(); c.moveTo(x + w / 2, y); c.lineTo(x + w / 2, y + h); c.stroke();
}
