// The boards and the discs, drawn in code and pre-rendered once per size. One look per world:
// the club room's honey teak, the tea stall's old blue-painted board, the tournament hall's pale maple with gold inlay.
import { BASE_MAX, BASE_MIN, BOARD, CENTRE, POCKET_R, POCKET_X, POCKET_Y, RAIL, TOTAL } from "./table";

export type Look = {
  frame: string; frameDeep: string; frameLight: string; stud: string;
  wood: string; woodLight: string; woodDeep: string; grain: string;
  paint: string; cream: string; red: string; petal: string; pocket: string;
};

export const LOOKS: readonly Look[] = [
  // পাড়ার ক্লাবঘর: dark walnut frame, honey teak, green paint, a cream alpona.
  { frame: "#3b2314", frameDeep: "#24140a", frameLight: "#5c3a22", stud: "#f6e8c8", wood: "#d9a362", woodLight: "#e8bd80", woodDeep: "#bf8547", grain: "#8a5a2b", paint: "#1d5c41", cream: "#f6e8c8", red: "#b8322a", petal: "#f6e8c8", pocket: "#1a110b" },
  // চায়ের দোকান: a frame painted stall blue, older amber varnish, maroon lines, a turmeric alpona.
  { frame: "#22536a", frameDeep: "#123747", frameLight: "#3a7690", stud: "#f2c14e", wood: "#c48a4a", woodLight: "#d6a160", woodDeep: "#9f6a34", grain: "#5e3a1c", paint: "#7a1f1f", cream: "#f3e3c0", red: "#c0392b", petal: "#f2c14e", pocket: "#160e08" },
  // টুর্নামেন্ট: black lacquer with gold, pale maple, black lines, a red-and-gold rosette.
  { frame: "#191512", frameDeep: "#070605", frameLight: "#b8913a", stud: "#e9c46a", wood: "#ead0a0", woodLight: "#f6e3bf", woodDeep: "#d1b07c", grain: "#9c7a4a", paint: "#1c1a18", cream: "#fff6e0", red: "#b3261e", petal: "#b3261e", pocket: "#0d0a08" },
];

export const accentOf = (world: number) => ["#1f6b4a", "#22536a", "#8a6a1e"][world] ?? "#1f6b4a";

export type DiscKind = "white" | "black" | "queen" | "striker";
const DISC = {
  white: { fill: "#f4ead5", edge: "#c9b68e", ring: "#d8c6a0", dot: "", shine: 0.65 },
  black: { fill: "#2e2622", edge: "#14100e", ring: "#544740", dot: "", shine: 0.22 },
  queen: { fill: "#c8302f", edge: "#861a1c", ring: "#e2857d", dot: "#f6e8c8", shine: 0.4 },
  striker: { fill: "#fbf6ea", edge: "#c3b89f", ring: "#1d5c41", dot: "#1d5c41", shine: 0.7 },
} as const;

const TAU = Math.PI * 2;

/** A flat disc with a turned ring and a soft drop shadow; pre-rendered once as a sprite. */
export function paintDisc(c: CanvasRenderingContext2D, kind: DiscKind, x: number, y: number, r: number) {
  const look = DISC[kind];
  c.fillStyle = "rgba(40,20,6,.32)";
  c.beginPath(); c.arc(x + r * 0.1, y + r * 0.16, r, 0, TAU); c.fill();
  c.fillStyle = look.fill;
  c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  c.lineWidth = r * 0.1; c.strokeStyle = look.edge;
  c.beginPath(); c.arc(x, y, r * 0.95, 0, TAU); c.stroke();
  c.lineWidth = r * (kind === "striker" ? 0.12 : 0.08); c.strokeStyle = look.ring;
  c.beginPath(); c.arc(x, y, r * (kind === "striker" ? 0.72 : 0.6), 0, TAU); c.stroke();
  if (kind === "striker") { c.lineWidth = r * 0.06; c.beginPath(); c.arc(x, y, r * 0.42, 0, TAU); c.stroke(); }
  if (look.dot) { c.fillStyle = look.dot; c.beginPath(); c.arc(x, y, r * (kind === "striker" ? 0.16 : 0.2), 0, TAU); c.fill(); }
  c.strokeStyle = `rgba(255,255,255,${look.shine})`; c.lineWidth = r * 0.12; c.lineCap = "round";
  c.beginPath(); c.arc(x, y, r * 0.78, Math.PI * 1.1, Math.PI * 1.45); c.stroke();
  c.lineCap = "butt";
}

/** Eight alpona petals with dots between them: symmetric when the board turns round for the other player. */
function paintAlpona(c: CanvasRenderingContext2D, look: Look) {
  c.save();
  c.translate(CENTRE, CENTRE);
  c.fillStyle = look.petal;
  c.globalAlpha = 0.9;
  for (let k = 0; k < 8; k++) {
    c.save();
    c.rotate((k * TAU) / 8);
    c.beginPath();
    c.moveTo(0, -22);
    c.bezierCurveTo(13, -36, 11, -60, 0, -70);
    c.bezierCurveTo(-11, -60, -13, -36, 0, -22);
    c.fill();
    c.restore();
  }
  c.globalAlpha = 1;
  c.fillStyle = look.red;
  for (let k = 0; k < 8; k++) {
    const a = ((k + 0.5) * TAU) / 8;
    c.beginPath(); c.arc(Math.cos(a) * 48, Math.sin(a) * 48, 4.5, 0, TAU); c.fill();
  }
  c.fillStyle = look.paint;
  for (let k = 0; k < 24; k++) {
    const a = (k * TAU) / 24;
    c.beginPath(); c.arc(Math.cos(a) * 77, Math.sin(a) * 77, 1.8, 0, TAU); c.fill();
  }
  c.restore();
}

/** The whole board, frame included, in a TOTAL × TOTAL box at the origin. Drawn once per size and world, then reused. */
export function paintBoard(c: CanvasRenderingContext2D, look: Look = LOOKS[0]) {
  c.fillStyle = look.frameDeep;
  c.beginPath(); c.roundRect(0, 0, TOTAL, TOTAL, 22); c.fill();
  c.fillStyle = look.frame;
  c.beginPath(); c.roundRect(4, 4, TOTAL - 8, TOTAL - 8, 19); c.fill();
  c.strokeStyle = "rgba(255,220,170,.08)"; c.lineWidth = 2;
  for (let k = 0; k < 5; k++) {
    const o = 12 + k * 7;
    c.beginPath(); c.moveTo(RAIL, o); c.lineTo(TOTAL - RAIL, o + 2); c.stroke();
    c.beginPath(); c.moveTo(RAIL, TOTAL - o); c.lineTo(TOTAL - RAIL, TOTAL - o - 2); c.stroke();
    c.beginPath(); c.moveTo(o, RAIL); c.lineTo(o + 2, TOTAL - RAIL); c.stroke();
    c.beginPath(); c.moveTo(TOTAL - o, RAIL); c.lineTo(TOTAL - o - 2, TOTAL - RAIL); c.stroke();
  }
  for (const [cx, cy] of [[0, 0], [TOTAL - RAIL, 0], [0, TOTAL - RAIL], [TOTAL - RAIL, TOTAL - RAIL]]) {
    c.fillStyle = look.frameLight;
    c.beginPath(); c.roundRect(cx + 6, cy + 6, RAIL - 12, RAIL - 12, 8); c.fill();
    c.fillStyle = look.stud;
    c.beginPath(); c.arc(cx + RAIL / 2, cy + RAIL / 2, 5, 0, TAU); c.fill();
  }

  c.save();
  c.translate(RAIL, RAIL);
  const glow = c.createRadialGradient(CENTRE, CENTRE, 60, CENTRE, CENTRE, BOARD * 0.75);
  glow.addColorStop(0, look.woodLight); glow.addColorStop(0.6, look.wood); glow.addColorStop(1, look.woodDeep);
  c.fillStyle = glow;
  c.fillRect(0, 0, BOARD, BOARD);
  c.strokeStyle = look.grain; c.lineWidth = 1.2;
  for (let k = 0; k < 46; k++) {
    const y = 8 + k * 16 + ((k * 37) % 9);
    c.globalAlpha = 0.06 + ((k * 13) % 5) * 0.015;
    c.beginPath(); c.moveTo(0, y);
    for (let x = 0; x <= BOARD; x += 74) c.quadraticCurveTo(x + 37, y + Math.sin(k * 1.7 + x * 0.013) * 5, x + 74, y);
    c.stroke();
  }
  c.globalAlpha = 1;
  const shade = 14;
  for (const [x, y, w, h, x0, y0, x1, y1] of [[0, 0, BOARD, shade, 0, 0, 0, shade], [0, BOARD - shade, BOARD, shade, 0, BOARD, 0, BOARD - shade], [0, 0, shade, BOARD, 0, 0, shade, 0], [BOARD - shade, 0, shade, BOARD, BOARD, 0, BOARD - shade, 0]]) {
    const g = c.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, "rgba(60,30,8,.28)"); g.addColorStop(1, "rgba(60,30,8,0)");
    c.fillStyle = g; c.fillRect(x, y, w, h);
  }

  c.strokeStyle = look.paint; c.fillStyle = look.paint; c.lineWidth = 2.6;
  for (let side = 0; side < 4; side++) {
    c.save();
    c.translate(CENTRE, CENTRE); c.rotate((side * TAU) / 4); c.translate(-CENTRE, -CENTRE);
    const yIn = BOARD - 134, yOut = BOARD - 102, yMid = (yIn + yOut) / 2;
    c.beginPath(); c.moveTo(BASE_MIN, yIn); c.lineTo(BASE_MAX, yIn); c.moveTo(BASE_MIN, yOut); c.lineTo(BASE_MAX, yOut); c.stroke();
    for (const x of [BASE_MIN, BASE_MAX]) {
      c.fillStyle = look.paint; c.beginPath(); c.arc(x, yMid, 16, 0, TAU); c.fill();
      c.fillStyle = look.cream; c.beginPath(); c.arc(x, yMid, 5, 0, TAU); c.fill();
    }
    c.beginPath(); c.moveTo(92, 92); c.lineTo(236, 236); c.stroke();
    c.beginPath(); c.moveTo(92, 92); c.lineTo(110, 94); c.moveTo(92, 92); c.lineTo(94, 110); c.stroke();
    c.fillStyle = look.paint;
    c.beginPath(); c.arc(236, 236, 5, 0, TAU); c.fill();
    c.restore();
  }
  c.lineWidth = 2.6;
  c.beginPath(); c.arc(CENTRE, CENTRE, 85, 0, TAU); c.stroke();
  paintAlpona(c, look);
  c.strokeStyle = look.paint;
  c.beginPath(); c.arc(CENTRE, CENTRE, 16, 0, TAU); c.stroke();

  for (let p = 0; p < 4; p++) {
    const px = POCKET_X[p], py = POCKET_Y[p];
    c.save();
    c.beginPath(); c.arc(px, py, POCKET_R, 0, TAU);
    c.fillStyle = look.pocket; c.fill();
    c.clip();
    c.strokeStyle = "rgba(236,214,180,.3)"; c.lineWidth = 1;
    c.beginPath();
    for (let o = -POCKET_R * 2; o <= POCKET_R * 2; o += 6) {
      c.moveTo(px + o - POCKET_R, py - POCKET_R); c.lineTo(px + o + POCKET_R, py + POCKET_R);
      c.moveTo(px + o + POCKET_R, py - POCKET_R); c.lineTo(px + o - POCKET_R, py + POCKET_R);
    }
    c.stroke();
    const hole = c.createRadialGradient(px, py, 2, px, py, POCKET_R);
    hole.addColorStop(0, "rgba(0,0,0,.65)"); hole.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = hole; c.fillRect(px - POCKET_R, py - POCKET_R, POCKET_R * 2, POCKET_R * 2);
    c.restore();
    c.strokeStyle = look.frameDeep; c.lineWidth = 3;
    c.beginPath(); c.arc(px, py, POCKET_R, 0, TAU); c.stroke();
  }
  c.restore();
}
