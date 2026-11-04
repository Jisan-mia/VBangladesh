// The classroom's still parts, painted once per size and class into offscreen canvases: the walls and window in the class's
// own palette, the board, the door, the benches full of children (sleepers asleep, the captain in her sash), and the chalk text.
// draw.hot.ts reveals and poses everything else each frame.
import { DISPLAY_FONT } from "../../../shared/card-canvas";
import { BENCHES, BOARDS, SEATS, type Klass } from "./class";

/** Smoothed, per-screen drawing state (never part of the rules). */
export type View = {
  tx: number; clock: number; fan: number; slow: boolean; caughtAt: number; seenCatches: number;
  /** The opened chit's wrapped lines and the reply under them, made once per finished class (panels.ts openChit). */
  open: string[]; reply: string;
};
export const makeView = (): View => ({ tx: 220, clock: 0, fan: 0, slow: false, caughtAt: -9, seenCatches: 0, open: [], reply: "" });

export const SCENE_W = 360;
export const SCENE_H = 380;
export const BOARD = { x: 72, y: 30, w: 220, h: 84 } as const;
export const WINDOW = { x: 10, y: 36, w: 50, h: 74 } as const;
/** The door on the right wall, and its glass pane where the headmaster looks in. */
export const DOOR = { x: 318, y: 50, w: 38, h: 136 } as const;
export const PANE = { x: 326, y: 62, w: 22, h: 40 } as const;
export const FLOOR = 186;
export const SKIN = "#b97a50";
export const SKIN_T = "#c68a5e";
export const HAIR = "#2a211d";
export const PEN = "#23408e";
export const CHALK = "#f4f1e8";

/** Each class's palette: the morning, the hot afternoon, the rainy last period. */
export type Palette = {
  ceiling: string; wall: string; wallLine: string; dado: string; dadoLine: string; floorTop: string; floorBottom: string;
  skyTop: string; skyBottom: string; field: string; fieldLine: string; board: string; shirts: readonly string[]; tube: boolean; light: string;
};
export const PALETTES: readonly Palette[] = [
  { ceiling: "#d8d0bc", wall: "#ebe4cf", wallLine: "#c9bfa5", dado: "#7fae9b", dadoLine: "#5f8f7c", floorTop: "#c9bea8", floorBottom: "#ab9d82",
    skyTop: "#a9d8ee", skyBottom: "#e3f3f8", field: "#86b862", fieldLine: "#6e9e4f", board: "#2f4a3e", shirts: ["#f6f4ec", "#cfe0f1", "#f6f4ec", "#f6f4ec", "#cfe0f1"], tube: false, light: "" },
  { ceiling: "#e6cfae", wall: "#f3dcc0", wallLine: "#dbbf98", dado: "#c98a5a", dadoLine: "#a86d42", floorTop: "#d7c19c", floorBottom: "#b99f76",
    skyTop: "#fff7de", skyBottom: "#ffe1a1", field: "#b9b86a", fieldLine: "#9c9b52", board: "#2e463b", shirts: ["#f6f4ec", "#bcd7ee", "#f6f4ec", "#e9f1f7", "#bcd7ee"], tube: false, light: "rgba(255,236,190,.22)" },
  { ceiling: "#bcc6c9", wall: "#d3dcdf", wallLine: "#aab7bb", dado: "#5d7f8c", dadoLine: "#456773", floorTop: "#a9adaa", floorBottom: "#8b908d",
    skyTop: "#7d8a96", skyBottom: "#aeb8c0", field: "#5f7e5a", fieldLine: "#4c6a48", board: "#2b4238", shirts: ["#eef0ee", "#c6d3de", "#eef0ee", "#d9e2e8", "#c6d3de"], tube: true, light: "" },
];

/** Bench row k (0 = front): its scale and the y of the seat line. */
export const rowScale = (k: number) => 0.56 + 0.075 * k;
export const rowY = (k: number) => 40 + 300 * rowScale(k);
export const GAP = 84;
/** x of a seat on the middle bench row. */
export const seatX = (k: number, seat: number) => SCENE_W / 2 + (seat - (SEATS - 1) / 2) * GAP * rowScale(k);
/** The captain sits on the front bench of the left side row, in the inner seat. */
export const CAPTAIN_X = SCENE_W / 2 - 222 * rowScale(0) + 0.5 * GAP * rowScale(0);
export const CAPTAIN_Y = rowY(0);

export type Layers = {
  back: HTMLCanvasElement; rows: HTMLCanvasElement; board: HTMLCanvasElement;
  key: string; boardKey: string; lineEnds: number[]; k: number; bubble: Record<string, number>; world: number;
};

function layer(width: number, height: number, k: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(width * k); canvas.height = Math.ceil(height * k);
  const context = canvas.getContext("2d")!;
  context.setTransform(k, 0, 0, k, 0, 0);
  return { canvas, context };
}

function paintWindow(c: CanvasRenderingContext2D, p: Palette, world: number) {
  const { x, y, w, h } = WINDOW;
  const sky = c.createLinearGradient(0, y, 0, y + h);
  sky.addColorStop(0, p.skyTop); sky.addColorStop(0.6, p.skyBottom);
  c.fillStyle = sky; c.fillRect(x, y, w, h);
  if (world === 2) {
    // Rain clouds.
    c.fillStyle = "#6b7782";
    for (const [cx, cy, r] of [[x + 12, y + 12, 10], [x + 26, y + 9, 12], [x + 40, y + 14, 9]]) { c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fill(); }
  } else if (world === 1) {
    c.fillStyle = "#fffbe8"; c.beginPath(); c.arc(x + 38, y + 14, 7, 0, Math.PI * 2); c.fill();
  }
  // The school field: grass, a tree, and a bamboo goalpost.
  c.fillStyle = p.field; c.fillRect(x, y + h * 0.62, w, h * 0.38);
  c.fillStyle = p.fieldLine; c.fillRect(x, y + h * 0.62, w, 2);
  c.fillStyle = "#5b4330"; c.fillRect(x + w * 0.72, y + h * 0.42, 3, h * 0.24);
  c.fillStyle = world === 2 ? "#3f6a3c" : "#4f8a46"; c.beginPath(); c.arc(x + w * 0.74, y + h * 0.38, 11, 0, Math.PI * 2); c.arc(x + w * 0.86, y + h * 0.44, 8, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#e1cf9b"; c.lineWidth = 1.6;
  c.beginPath(); c.moveTo(x + 8, y + h * 0.7); c.lineTo(x + 8, y + h * 0.5); c.lineTo(x + 28, y + h * 0.5); c.lineTo(x + 28, y + h * 0.7); c.stroke();
  // Blue iron grill and frame.
  c.strokeStyle = "#3d7ea6"; c.lineWidth = 1.6;
  for (let gx = x + 7; gx < x + w; gx += 7.5) { c.beginPath(); c.moveTo(gx, y); c.lineTo(gx, y + h); c.stroke(); }
  c.beginPath(); c.moveTo(x, y + h / 2); c.lineTo(x + w, y + h / 2); c.stroke();
  c.lineWidth = 4; c.strokeRect(x, y, w, h);
  c.fillStyle = "#d8cfb6"; c.fillRect(x - 4, y + h + 2, w + 8, 4);
}

function paintDoor(c: CanvasRenderingContext2D) {
  const { x, y, w, h } = DOOR;
  c.fillStyle = "#6e4a2c"; c.fillRect(x - 3, y - 3, w + 6, h + 3);
  c.fillStyle = "#93653d"; c.fillRect(x, y, w, h);
  c.strokeStyle = "rgba(60,35,15,.35)"; c.lineWidth = 1.2;
  c.strokeRect(x + 4, y + 60, w - 8, 30); c.strokeRect(x + 4, y + 96, w - 8, 34);
  // The pane: the corridor beyond, a pale wall.
  c.fillStyle = "#cfd3c7"; c.fillRect(PANE.x, PANE.y, PANE.w, PANE.h);
  c.fillStyle = "rgba(255,255,255,.35)"; c.beginPath(); c.moveTo(PANE.x + 3, PANE.y + PANE.h - 4); c.lineTo(PANE.x + 12, PANE.y + 3); c.lineTo(PANE.x + 15, PANE.y + 3); c.lineTo(PANE.x + 6, PANE.y + PANE.h - 4); c.fill();
  c.strokeStyle = "#5a3b22"; c.lineWidth = 2; c.strokeRect(PANE.x, PANE.y, PANE.w, PANE.h);
  c.fillStyle = "#d9b45a"; c.beginPath(); c.arc(x + 7, y + 74, 2.2, 0, Math.PI * 2); c.fill();
}

function paintBack(c: CanvasRenderingContext2D, p: Palette, world: number) {
  // Ceiling, whitewashed wall, and the painted lower wall every school has.
  c.fillStyle = p.ceiling; c.fillRect(0, 0, SCENE_W, 22);
  c.fillStyle = p.wall; c.fillRect(0, 22, SCENE_W, 126);
  c.fillStyle = p.wallLine; c.fillRect(0, 21, SCENE_W, 2);
  c.fillStyle = p.dado; c.fillRect(0, 146, SCENE_W, FLOOR - 146);
  c.fillStyle = p.dadoLine; c.fillRect(0, 144, SCENE_W, 3);
  // Cement floor with a few lines running to the board.
  const floor = c.createLinearGradient(0, FLOOR, 0, SCENE_H);
  floor.addColorStop(0, p.floorTop); floor.addColorStop(1, p.floorBottom);
  c.fillStyle = floor; c.fillRect(0, FLOOR, SCENE_W, SCENE_H - FLOOR);
  c.strokeStyle = "rgba(90,70,40,.12)"; c.lineWidth = 1;
  for (let i = -4; i <= 4; i++) { c.beginPath(); c.moveTo(180 + i * 40, FLOOR); c.lineTo(180 + i * 150, SCENE_H); c.stroke(); }

  paintWindow(c, p, world);
  if (p.light) {
    // The afternoon sun lays a slant of light from the window across the floor.
    c.fillStyle = p.light;
    c.beginPath(); c.moveTo(WINDOW.x + 8, WINDOW.y + WINDOW.h); c.lineTo(WINDOW.x + WINDOW.w, WINDOW.y + WINDOW.h); c.lineTo(190, SCENE_H); c.lineTo(80, SCENE_H); c.closePath(); c.fill();
  }
  paintDoor(c);

  // Blackboard with a wooden frame, chalk dust, and a tray with chalk and a duster.
  const { x, y, w, h } = BOARD;
  c.fillStyle = "#8a5a34"; c.fillRect(x - 5, y - 5, w + 10, h + 10);
  c.fillStyle = p.board; c.fillRect(x, y, w, h);
  c.fillStyle = "rgba(255,255,255,.05)";
  for (const [dx, dy, r] of [[40, 60, 22], [150, 30, 26], [190, 66, 18]]) { c.beginPath(); c.ellipse(x + dx, y + dy, r, r * 0.45, -0.3, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = "#74492a"; c.fillRect(x - 2, y + h + 4, w + 4, 5);
  c.fillStyle = CHALK; c.fillRect(x + 24, y + h + 2, 9, 3); c.fillRect(x + 38, y + h + 2.5, 5, 2.5);

  // Wall clock above the door.
  c.fillStyle = "#fffdf6"; c.beginPath(); c.arc(337, 34, 10, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#3a3a3a"; c.lineWidth = 2; c.stroke();
  c.lineWidth = 1.4; c.beginPath(); c.moveTo(337, 34); c.lineTo(337, 27.5); c.moveTo(337, 34); c.lineTo(341.5, 36); c.stroke();

  // The teacher's table: a register and a chalk box on it.
  c.fillStyle = "#84522c"; c.fillRect(24, 154, 82, 32);
  c.fillStyle = "#a36a3d"; c.fillRect(20, 148, 90, 7);
  c.fillStyle = "#6b4022"; c.fillRect(26, 186, 6, 7); c.fillRect(98, 186, 6, 7);
  c.fillStyle = "#2f5d8a"; c.fillRect(34, 142, 30, 6);
  c.fillStyle = "#f1ece0"; c.fillRect(34, 141, 30, 2);
  c.fillStyle = "#f7f4ec"; c.fillRect(74, 139, 16, 9);
  c.strokeStyle = "#cfc6b0"; c.lineWidth = 1; c.strokeRect(74, 139, 16, 9);

  // Fan rod (the blades turn every frame); the rainy class has a tube light over the board.
  c.fillStyle = "#6d7678"; c.fillRect(178.5, 0, 3, 12);
  if (p.tube) { c.fillStyle = "#8a9396"; c.fillRect(146, 23, 68, 3); }
}

/** A child on a bench seen from behind; `look` picks hair (short, two plaits) and shirt from the seat. Side rows are `muted`. */
function paintKid(c: CanvasRenderingContext2D, p: Palette, x: number, y: number, s: number, look: number, muted: boolean, asleep: boolean, captain: boolean) {
  const hair = muted ? "#5b4e46" : HAIR;
  c.fillStyle = muted ? (look % 2 ? "#d3dbe3" : "#e6e2d8") : p.shirts[look % p.shirts.length];
  c.beginPath();
  c.moveTo(x - 9 * s, y - 27 * s);
  c.quadraticCurveTo(x - 19 * s, y - 26 * s, x - 20 * s, y - 16 * s);
  c.lineTo(x - 18 * s, y + 3 * s); c.lineTo(x + 18 * s, y + 3 * s); c.lineTo(x + 20 * s, y - 16 * s);
  c.quadraticCurveTo(x + 19 * s, y - 26 * s, x + 9 * s, y - 27 * s);
  c.closePath(); c.fill();
  c.fillStyle = "rgba(40,50,70,.13)";
  c.fillRect(x - 0.7 * s, y - 22 * s, 1.4 * s, 24 * s);
  if (captain) {
    // The captain's red sash and a round badge.
    c.strokeStyle = "#c0392b"; c.lineWidth = 4 * s;
    c.beginPath(); c.moveTo(x - 14 * s, y - 24 * s); c.lineTo(x + 14 * s, y + 2 * s); c.stroke();
  }
  if (asleep) {
    // Head down on folded arms, slumped forward.
    c.fillStyle = SKIN; c.beginPath(); c.ellipse(x, y - 22 * s, 15 * s, 5 * s, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = hair; c.beginPath(); c.ellipse(x + 2 * s, y - 27 * s, 11 * s, 8.5 * s, 0.2, 0, Math.PI * 2); c.fill();
    return;
  }
  c.fillStyle = SKIN; c.fillRect(x - 3.5 * s, y - 31 * s, 7 * s, 6 * s);
  c.beginPath(); c.arc(x - 12 * s, y - 35 * s, 2.8 * s, 0, Math.PI * 2); c.arc(x + 12 * s, y - 35 * s, 2.8 * s, 0, Math.PI * 2); c.fill();
  c.fillStyle = hair; c.beginPath(); c.arc(x, y - 37 * s, 12.5 * s, 0, Math.PI * 2); c.fill();
  if (look % 3 === 1 || captain) {
    for (const side of [-1, 1]) {
      c.fillStyle = hair; c.beginPath(); c.roundRect(x + side * 8.5 * s - 2.6 * s, y - 33 * s, 5.2 * s, 17 * s, 2.6 * s); c.fill();
      c.fillStyle = "#ffffff"; c.beginPath(); c.arc(x + side * 8.5 * s, y - 16 * s, 3 * s, 0, Math.PI * 2); c.fill();
    }
  } else {
    c.fillStyle = muted ? "#6b5d54" : "#43362f"; c.beginPath(); c.ellipse(x - 3 * s, y - 44 * s, 5 * s, 2.6 * s, -0.3, 0, Math.PI * 2); c.fill();
  }
}

function paintBench(c: CanvasRenderingContext2D, p: Palette, cx: number, y: number, s: number, row: number, column: number, asleep: number, captain: number) {
  const width = (SEATS * GAP + 12) * s;
  c.fillStyle = "#8b5a33"; c.fillRect(cx - width / 2, y - 19 * s, width, 5 * s);
  c.fillStyle = "#a46c3f"; c.fillRect(cx - width / 2, y - 20 * s, width, 1.6 * s);
  for (let seat = 0; seat < SEATS; seat++) paintKid(c, p, cx + (seat - (SEATS - 1) / 2) * GAP * s, y, s, row * 5 + column * 3 + seat * 7, column !== 1, seat === asleep, seat === captain);
  c.fillStyle = "#7a4a28"; c.fillRect(cx - width / 2, y + 2 * s, width, 6 * s);
  c.fillStyle = "#5e381e"; c.fillRect(cx - width / 2 + 4 * s, y + 8 * s, 4 * s, 12 * s); c.fillRect(cx + width / 2 - 8 * s, y + 8 * s, 4 * s, 12 * s);
}

function paintRows(c: CanvasRenderingContext2D, p: Palette, klass: Klass) {
  for (let k = 0; k < BENCHES; k++) {
    const s = rowScale(k), y = rowY(k);
    // Side benches frame the room; the chit travels down the middle row. The middle benches in front of the chit's first one sit empty-handed.
    paintBench(c, p, SCENE_W / 2 - 222 * s, y, s, k, 0, -1, k === 0 && klass.watcher === "monitor" ? 1 : -1);
    paintBench(c, p, SCENE_W / 2 + 222 * s, y, s, k, 2, -1, -1);
    paintBench(c, p, SCENE_W / 2, y, s, k, 1, klass.sleeper[k] ? klass.path[k] : -1, -1);
  }
}

export const BOARD_FONT = (size: number) => `600 ${size}px ${DISPLAY_FONT}`;
export const lineY = (line: number) => BOARD.y + 22 + line * 25;

function paintBoardText(c: CanvasRenderingContext2D, lines: readonly string[]) {
  const ends: number[] = [];
  let total = 0;
  c.fillStyle = CHALK; c.textBaseline = "alphabetic";
  lines.forEach((text, line) => {
    c.font = BOARD_FONT(line === 0 ? 16 : 15);
    c.globalAlpha = 0.9;
    c.fillText(text, 12, lineY(line) - BOARD.y, BOARD.w - 20);
    c.globalAlpha = 0.25;
    c.fillText(text, 12.6, lineY(line) - BOARD.y + 0.5, BOARD.w - 20);
    const width = Math.min(BOARD.w - 20, c.measureText(text).width);
    if (line === 0) { c.globalAlpha = 0.7; c.fillRect(12, lineY(0) - BOARD.y + 5, width, 1.4); }
    total += width + 14;
    ends.push(total);
  });
  c.globalAlpha = 1;
  return ends;
}

export const boardLines = (klass: Klass) => BOARDS[klass.world][klass.board % BOARDS[klass.world].length];
export const BUBBLE_FONT = `700 13px ${DISPLAY_FONT}`;
export const BUBBLES = ["খুক খুক", "টুক!", "এইদিকে তাকাও!", "উফ!", "চিরকুট", "z"] as const;

/** Everything still, painted for this canvas size and class. Rebuilt only when the size, the class's world, its room or its board change. */
export function buildLayers(width: number, ratio: number, klass: Klass, previous: Layers | null = null): Layers {
  const k = (width / SCENE_W) * ratio, p = PALETTES[klass.world];
  const key = `${k}|${klass.world}|${klass.watcher}|${klass.sleeper.join("")}|${klass.path.join("")}`, boardKey = `${k}|${klass.world}|${klass.board}`;
  if (previous && previous.key === key && previous.boardKey === boardKey) return previous;
  const back = previous && previous.key === key ? null : layer(SCENE_W, SCENE_H, k);
  if (back) paintBack(back.context, p, klass.world);
  const rows = previous && previous.key === key ? null : layer(SCENE_W, SCENE_H, k);
  if (rows) paintRows(rows.context, p, klass);
  const board = layer(BOARD.w, BOARD.h, k);
  const lineEnds = paintBoardText(board.context, boardLines(klass));
  const bubble: Record<string, number> = {};
  board.context.font = BUBBLE_FONT;
  for (const text of BUBBLES) bubble[text] = board.context.measureText(text).width;
  return { back: back?.canvas ?? previous!.back, rows: rows?.canvas ?? previous!.rows, board: board.canvas, key, boardKey, lineEnds, k, bubble, world: klass.world };
}

/** A page torn from a ruled exercise book: used in the game, on the title and on the card. */
export function paintPaper(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, unit: number) {
  c.fillStyle = "rgba(0,0,0,.18)"; c.fillRect(x + 3 * unit, y + 4 * unit, w, h);
  c.fillStyle = "#fffdf4"; c.fillRect(x, y, w, h);
  c.strokeStyle = "#b9cde4"; c.lineWidth = 1 * unit;
  for (let ly = y + 22 * unit; ly < y + h - 6 * unit; ly += 20 * unit) { c.beginPath(); c.moveTo(x, ly); c.lineTo(x + w, ly); c.stroke(); }
  c.strokeStyle = "#e4a5a5"; c.beginPath(); c.moveTo(x + 22 * unit, y); c.lineTo(x + 22 * unit, y + h); c.stroke();
  c.strokeStyle = "rgba(0,0,0,.08)"; c.lineWidth = 2 * unit; c.beginPath(); c.moveTo(x + w / 2, y); c.lineTo(x + w / 2, y + h); c.stroke();
}
