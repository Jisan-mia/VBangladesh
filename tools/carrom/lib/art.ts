// The board and the discs, drawn fresh: a dark walnut frame with inlaid corner blocks, a honey-teak surface,
// green painted lines and an alpona rosette in the middle, netted pockets, and flat cartoon discs.
import { BASE_MAX, BASE_MIN, BOARD, CENTRE, POCKET_R, POCKET_X, POCKET_Y, RAIL, TOTAL } from "./physics";

export const palette = {
  frame: "#3b2314", frameDeep: "#24140a", frameLight: "#5c3a22",
  wood: "#d9a362", woodLight: "#e8bd80", woodDeep: "#bf8547", grain: "#8a5a2b",
  paint: "#1d5c41", cream: "#f6e8c8", red: "#b8322a", pocket: "#1a110b",
  ink: "#2a1a10", accent: "#1f6b4a",
};

export type DiscKind = "white" | "black" | "queen" | "striker";
const DISC = {
  white: { fill: "#f4ead5", edge: "#c9b68e", ring: "#d8c6a0", dot: "", shine: 0.65 },
  black: { fill: "#2e2622", edge: "#14100e", ring: "#544740", dot: "", shine: 0.22 },
  queen: { fill: "#c8302f", edge: "#861a1c", ring: "#e2857d", dot: "#f6e8c8", shine: 0.4 },
  striker: { fill: "#fbf6ea", edge: "#c3b89f", ring: "#1d5c41", dot: "#1d5c41", shine: 0.7 },
} as const;

const TAU = Math.PI * 2;

/** A flat disc with a turned ring and a soft drop shadow; cheap enough to pre-render once as a sprite. */
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

/** Eight alpona petals with red dots between them: symmetric when the board turns round for the other player. */
function paintAlpona(c: CanvasRenderingContext2D) {
  c.save();
  c.translate(CENTRE, CENTRE);
  c.fillStyle = palette.cream;
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
  c.fillStyle = palette.red;
  for (let k = 0; k < 8; k++) {
    const a = ((k + 0.5) * TAU) / 8;
    c.beginPath(); c.arc(Math.cos(a) * 48, Math.sin(a) * 48, 4.5, 0, TAU); c.fill();
  }
  c.fillStyle = palette.paint;
  for (let k = 0; k < 24; k++) {
    const a = (k * TAU) / 24;
    c.beginPath(); c.arc(Math.cos(a) * 77, Math.sin(a) * 77, 1.8, 0, TAU); c.fill();
  }
  c.restore();
}

/** The whole board, frame included, in a TOTAL × TOTAL box at the origin. Drawn once per size, then reused. */
export function paintBoard(c: CanvasRenderingContext2D) {
  // The frame.
  c.fillStyle = palette.frameDeep;
  c.beginPath(); c.roundRect(0, 0, TOTAL, TOTAL, 22); c.fill();
  c.fillStyle = palette.frame;
  c.beginPath(); c.roundRect(4, 4, TOTAL - 8, TOTAL - 8, 19); c.fill();
  c.strokeStyle = "rgba(255,220,170,.08)"; c.lineWidth = 2;
  for (let k = 0; k < 5; k++) {
    const o = 12 + k * 7;
    c.beginPath(); c.moveTo(RAIL, o); c.lineTo(TOTAL - RAIL, o + 2); c.stroke();
    c.beginPath(); c.moveTo(RAIL, TOTAL - o); c.lineTo(TOTAL - RAIL, TOTAL - o - 2); c.stroke();
    c.beginPath(); c.moveTo(o, RAIL); c.lineTo(o + 2, TOTAL - RAIL); c.stroke();
    c.beginPath(); c.moveTo(TOTAL - o, RAIL); c.lineTo(TOTAL - o - 2, TOTAL - RAIL); c.stroke();
  }
  // Inlaid corner blocks, each with a little cream stud.
  for (const [cx, cy] of [[0, 0], [TOTAL - RAIL, 0], [0, TOTAL - RAIL], [TOTAL - RAIL, TOTAL - RAIL]]) {
    c.fillStyle = palette.frameLight;
    c.beginPath(); c.roundRect(cx + 6, cy + 6, RAIL - 12, RAIL - 12, 8); c.fill();
    c.fillStyle = palette.cream;
    c.beginPath(); c.arc(cx + RAIL / 2, cy + RAIL / 2, 5, 0, TAU); c.fill();
  }

  // The surface: honey teak, lighter in the middle, with a little grain.
  c.save();
  c.translate(RAIL, RAIL);
  const glow = c.createRadialGradient(CENTRE, CENTRE, 60, CENTRE, CENTRE, BOARD * 0.75);
  glow.addColorStop(0, palette.woodLight); glow.addColorStop(0.6, palette.wood); glow.addColorStop(1, palette.woodDeep);
  c.fillStyle = glow;
  c.fillRect(0, 0, BOARD, BOARD);
  c.strokeStyle = palette.grain; c.lineWidth = 1.2;
  for (let k = 0; k < 46; k++) {
    const y = 8 + k * 16 + ((k * 37) % 9);
    c.globalAlpha = 0.06 + ((k * 13) % 5) * 0.015;
    c.beginPath(); c.moveTo(0, y);
    for (let x = 0; x <= BOARD; x += 74) c.quadraticCurveTo(x + 37, y + Math.sin(k * 1.7 + x * 0.013) * 5, x + 74, y);
    c.stroke();
  }
  c.globalAlpha = 1;
  // A soft shadow under the cushions.
  const shade = 14;
  for (const [x, y, w, h, x0, y0, x1, y1] of [[0, 0, BOARD, shade, 0, 0, 0, shade], [0, BOARD - shade, BOARD, shade, 0, BOARD, 0, BOARD - shade], [0, 0, shade, BOARD, 0, 0, shade, 0], [BOARD - shade, 0, shade, BOARD, BOARD, 0, BOARD - shade, 0]]) {
    const g = c.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, "rgba(60,30,8,.28)"); g.addColorStop(1, "rgba(60,30,8,0)");
    c.fillStyle = g; c.fillRect(x, y, w, h);
  }

  // Painted lines: four baselines with their end circles, the corner arrows, the centre circles.
  c.strokeStyle = palette.paint; c.fillStyle = palette.paint; c.lineWidth = 2.6;
  for (let side = 0; side < 4; side++) {
    c.save();
    c.translate(CENTRE, CENTRE); c.rotate((side * TAU) / 4); c.translate(-CENTRE, -CENTRE);
    const yIn = BOARD - 134, yOut = BOARD - 102, yMid = (yIn + yOut) / 2;
    c.beginPath(); c.moveTo(BASE_MIN, yIn); c.lineTo(BASE_MAX, yIn); c.moveTo(BASE_MIN, yOut); c.lineTo(BASE_MAX, yOut); c.stroke();
    for (const x of [BASE_MIN, BASE_MAX]) {
      c.fillStyle = palette.paint; c.beginPath(); c.arc(x, yMid, 16, 0, TAU); c.fill();
      c.fillStyle = palette.cream; c.beginPath(); c.arc(x, yMid, 5, 0, TAU); c.fill();
    }
    // The corner arrow, pointing at the pocket.
    c.beginPath(); c.moveTo(92, 92); c.lineTo(236, 236); c.stroke();
    c.beginPath(); c.moveTo(92, 92); c.lineTo(110, 94); c.moveTo(92, 92); c.lineTo(94, 110); c.stroke();
    c.beginPath(); c.arc(236, 236, 5, 0, TAU); c.fill();
    c.restore();
  }
  c.lineWidth = 2.6;
  c.beginPath(); c.arc(CENTRE, CENTRE, 85, 0, TAU); c.stroke();
  paintAlpona(c);
  c.beginPath(); c.arc(CENTRE, CENTRE, 16, 0, TAU); c.stroke();

  // Netted pockets.
  for (let p = 0; p < 4; p++) {
    const px = POCKET_X[p], py = POCKET_Y[p];
    c.save();
    c.beginPath(); c.arc(px, py, POCKET_R, 0, TAU);
    c.fillStyle = palette.pocket; c.fill();
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
    c.strokeStyle = palette.frameDeep; c.lineWidth = 3;
    c.beginPath(); c.arc(px, py, POCKET_R, 0, TAU); c.stroke();
  }
  c.restore();
}
