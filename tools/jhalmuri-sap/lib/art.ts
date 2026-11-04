// Original cartoon art, drawn with plain canvas paths: the ঠোঙা foods, a round teal snake head and a newsprint cone. Shared by the board and the card.
import { makeRng } from "../../../shared/game-core";
import type { Kind } from "./snake";

export const palette = {
  paper: "#f4ecd9", paperAlt: "#ede3cb", print: "#d8cbad",
  tin: "#97a1a6", tinLight: "#c2c9cc", tinDark: "#6c767b", rust: "#a65f37",
  snake: "#2a9d8f", snakeEdge: "#125950", spot: "#b4ecdf", hot: "#e0533e",
  tongue: "#d63a2a", ink: "#2a1d14", chilli: "#c0391b", mustard: "#e7a91f", gold: "#f4c534",
};

/** One palette per world: the board, its print or tiles, the tin fence, and the bolts or bulbs along it. */
export type WorldPalette = { board: string; boardAlt: string; marks: string; tin: string; tinLight: string; tinDark: string; bolt: string; trim: string; night: boolean; snakeHot: string };
export const worldPalettes: Record<"paper" | "station" | "fair", WorldPalette> = {
  // ঠোঙার মাঠ: newsprint on a tin tray.
  paper: { board: palette.paper, boardAlt: palette.paperAlt, marks: "#0000000c", tin: palette.tin, tinLight: palette.tinLight, tinDark: palette.tinDark, bolt: palette.rust, trim: "#4d565b", night: false, snakeHot: "#e2683b" },
  // ইস্টিশন: grey platform tiles, green-painted tin, a yellow edge line.
  station: { board: "#dddcd4", boardAlt: "#d3d2c9", marks: "#0000001a", tin: "#4f8a64", tinLight: "#7db18b", tinDark: "#336247", bolt: "#e8b730", trim: "#28473a", night: false, snakeHot: "#e2683b" },
  // রাতের মেলা: an indigo night, purple tin, warm bulbs along the fence.
  fair: { board: "#2c2f5f", boardAlt: "#323668", marks: "#ffffff0d", tin: "#8a5fae", tinLight: "#b48bd3", tinDark: "#5d3e7c", bolt: "#ffd36b", trim: "#2a1b3d", night: true, snakeHot: "#ff7a4a" },
};

/** A পাতিকাক: black with a grey neck, side on, facing right (the board mirrors it to face left). */
export function drawCrow(c: CanvasRenderingContext2D, x: number, y: number, r: number) {
  c.lineJoin = "round"; c.lineCap = "round";
  c.fillStyle = "#18171c";
  c.beginPath(); c.moveTo(x - r * 0.95, y - r * 0.05); c.lineTo(x - r * 0.35, y - r * 0.2); c.lineTo(x - r * 0.4, y + r * 0.25); c.closePath(); c.fill();
  c.beginPath(); c.ellipse(x - r * 0.05, y + r * 0.08, r * 0.62, r * 0.42, -0.15, 0, TAU); c.fill();
  c.fillStyle = "#6f6d75";
  c.beginPath(); c.ellipse(x + r * 0.38, y - r * 0.2, r * 0.32, r * 0.3, 0, 0, TAU); c.fill();
  c.fillStyle = "#18171c";
  c.beginPath(); c.arc(x + r * 0.52, y - r * 0.36, r * 0.27, 0, TAU); c.fill();
  c.fillStyle = "#3b3a40";
  c.beginPath(); c.moveTo(x + r * 0.74, y - r * 0.42); c.lineTo(x + r * 1.08, y - r * 0.3); c.lineTo(x + r * 0.74, y - r * 0.24); c.closePath(); c.fill();
  c.fillStyle = "#f5f0e0";
  c.beginPath(); c.arc(x + r * 0.56, y - r * 0.42, r * 0.09, 0, TAU); c.fill();
  c.strokeStyle = "#3b3a40"; c.lineWidth = Math.max(1.2, r * 0.1);
  c.beginPath(); c.moveTo(x - r * 0.1, y + r * 0.45); c.lineTo(x - r * 0.15, y + r * 0.8); c.moveTo(x + r * 0.15, y + r * 0.45); c.lineTo(x + r * 0.15, y + r * 0.8); c.stroke();
}

/** A clay pipe mouth seen from above: a dark hole in a rim, with three arrows round it so the pair reads as a pair, not as food. */
export function drawPipe(c: CanvasRenderingContext2D, x: number, y: number, r: number) {
  c.fillStyle = "#a65f37"; c.beginPath(); c.arc(x, y, r * 0.92, 0, TAU); c.fill();
  c.strokeStyle = "#6e3a1d"; c.lineWidth = Math.max(1.5, r * 0.12); c.stroke();
  const hole = c.createRadialGradient(x, y + r * 0.1, r * 0.05, x, y, r * 0.66);
  hole.addColorStop(0, "#050302"); hole.addColorStop(1, "#3a2414");
  c.fillStyle = hole; c.beginPath(); c.arc(x, y, r * 0.64, 0, TAU); c.fill();
  c.strokeStyle = "#f4d39b"; c.lineWidth = Math.max(1.2, r * 0.09);
  for (let i = 0; i < 3; i++) {
    const a = i * TAU / 3 - Math.PI / 2;
    c.beginPath(); c.arc(x, y, r * 0.79, a, a + 0.9); c.stroke();
  }
}

const TAU = Math.PI * 2;
// Module constants, so the per-frame head drawing allocates nothing.
const SIDES = [-1, 1] as const;

function chilliPod(c: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string, edge: string) {
  c.lineWidth = Math.max(1.2, r * 0.12);
  c.strokeStyle = edge;
  c.fillStyle = fill;
  c.beginPath();
  c.moveTo(x - r * 0.62, y - r * 0.5);
  c.quadraticCurveTo(x + r * 0.75, y - r * 0.62, x + r * 0.78, y + r * 0.8);
  c.quadraticCurveTo(x + r * 0.2, y - r * 0.12, x - r * 0.62, y - r * 0.08);
  c.closePath();
  c.fill(); c.stroke();
  c.lineCap = "round";
  c.lineWidth = Math.max(1.5, r * 0.18);
  c.strokeStyle = "#5c3d1b";
  c.beginPath(); c.moveTo(x - r * 0.62, y - r * 0.3); c.lineTo(x - r * 0.92, y - r * 0.62); c.stroke();
}

/** One food at (x, y) with radius r. Each looks different by shape, not just colour: grains, sticks, a ring, a pod, a beaded pod, a starred chilli. */
export function drawFood(c: CanvasRenderingContext2D, kind: Kind | "sonali", x: number, y: number, r: number) {
  c.lineJoin = "round";
  if (kind === "muri") {
    c.fillStyle = "#fdf6e1"; c.strokeStyle = "#a88c58"; c.lineWidth = Math.max(1.2, r * 0.11);
    for (const [gx, gy, turn] of [[-0.36, 0.26, 0.5], [0.4, 0.22, -0.6], [0.02, -0.34, 0.1]]) {
      c.beginPath(); c.ellipse(x + gx * r, y + gy * r, r * 0.42, r * 0.27, turn, 0, TAU); c.fill(); c.stroke();
    }
  } else if (kind === "chanachur") {
    c.lineCap = "round";
    for (const [width, color] of [[0.42, "#6e3a10"], [0.24, "#e0913a"]] as const) {
      c.lineWidth = r * width; c.strokeStyle = color;
      c.beginPath(); c.moveTo(x - r * 0.72, y - r * 0.32); c.lineTo(x + r * 0.62, y + r * 0.42); c.moveTo(x - r * 0.42, y + r * 0.66); c.lineTo(x + r * 0.5, y - r * 0.62); c.stroke();
    }
    c.fillStyle = "#c98a4b"; c.strokeStyle = "#6e3a10"; c.lineWidth = Math.max(1.2, r * 0.1);
    c.beginPath(); c.ellipse(x + r * 0.5, y + r * 0.62, r * 0.26, r * 0.2, 0.4, 0, TAU); c.fill(); c.stroke();
  } else if (kind === "peyaj") {
    c.lineWidth = r * 0.36; c.strokeStyle = "#8a2150";
    c.beginPath(); c.arc(x, y, r * 0.6, 0, TAU); c.stroke();
    c.lineWidth = r * 0.12; c.strokeStyle = "#e7a3bf";
    c.beginPath(); c.arc(x, y, r * 0.6, 0, TAU); c.stroke();
    c.lineWidth = Math.max(1.2, r * 0.1); c.strokeStyle = "#b8467a";
    c.beginPath(); c.arc(x, y, r * 0.24, 0, TAU); c.stroke();
  } else if (kind === "morich") {
    chilliPod(c, x, y, r, "#3f8f2f", "#1d5216");
  } else if (kind === "tetul") {
    c.fillStyle = "#8d5629"; c.strokeStyle = "#4b2a0f"; c.lineWidth = Math.max(1.2, r * 0.11);
    for (const [bx, by, br] of [[-0.56, 0.3, 0.34], [0, 0, 0.4], [0.56, 0.24, 0.34]]) {
      c.beginPath(); c.arc(x + bx * r, y + by * r, br * r, 0, TAU); c.fill(); c.stroke();
    }
    c.fillStyle = "#c48a55";
    c.beginPath(); c.arc(x - r * 0.1, y - r * 0.14, r * 0.1, 0, TAU); c.fill();
  } else {
    chilliPod(c, x, y, r, palette.gold, "#93650a");
    star(c, x + r * 0.5, y - r * 0.62, r * 0.36);
  }
}

function star(c: CanvasRenderingContext2D, x: number, y: number, size: number) {
  c.fillStyle = "#fff7cf"; c.strokeStyle = "#b07d00"; c.lineWidth = Math.max(1, size * 0.18);
  c.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = i * Math.PI / 4 - Math.PI / 2, reach = i % 2 ? size * 0.36 : size;
    c.lineTo(x + Math.cos(angle) * reach, y + Math.sin(angle) * reach);
  }
  c.closePath(); c.fill(); c.stroke();
}

/** The snake's head facing `angle` (0 = right). `hot` turns it red-cheeked for "ঝাল লেগে গেল". */
export function drawHead(c: CanvasRenderingContext2D, x: number, y: number, r: number, angle: number, hot: boolean, tongue: boolean) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  if (tongue) {
    c.strokeStyle = palette.tongue; c.lineWidth = Math.max(1.5, r * 0.13); c.lineCap = "round";
    c.beginPath(); c.moveTo(r * 0.8, 0); c.lineTo(r * 1.45, 0); c.lineTo(r * 1.7, -r * 0.2); c.moveTo(r * 1.45, 0); c.lineTo(r * 1.7, r * 0.2); c.stroke();
  }
  c.fillStyle = hot ? palette.hot : palette.snake; c.strokeStyle = palette.snakeEdge; c.lineWidth = Math.max(1.5, r * 0.12);
  c.beginPath(); c.ellipse(0, 0, r * 1.04, r * 0.9, 0, 0, TAU); c.fill(); c.stroke();
  c.fillStyle = hot ? "#ffb1a3" : "#f6a39a";
  for (const side of SIDES) { c.beginPath(); c.ellipse(-r * 0.05, side * r * 0.6, r * 0.2, r * 0.13, 0, 0, TAU); c.fill(); }
  for (const side of SIDES) {
    c.fillStyle = "#fff"; c.strokeStyle = palette.snakeEdge; c.lineWidth = Math.max(1, r * 0.07);
    c.beginPath(); c.arc(r * 0.3, side * r * 0.36, r * 0.29, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = "#1b1712";
    if (hot) { c.lineWidth = Math.max(1.2, r * 0.1); c.strokeStyle = "#1b1712"; c.beginPath(); c.moveTo(r * 0.18, side * r * 0.36 - r * 0.12); c.lineTo(r * 0.42, side * r * 0.36); c.lineTo(r * 0.18, side * r * 0.36 + r * 0.12); c.stroke(); }
    else { c.beginPath(); c.arc(r * 0.4, side * r * 0.33, r * 0.14, 0, TAU); c.fill(); }
  }
  c.restore();
}

/** Corrugated tin, ridges running across the strip. */
export function drawTin(c: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, across: "x" | "y") {
  c.fillStyle = palette.tin;
  c.fillRect(x, y, width, height);
  const length = across === "x" ? width : height, ridge = 6;
  for (let at = 0; at < length; at += ridge) {
    c.fillStyle = (at / ridge) % 2 ? palette.tinDark : palette.tinLight;
    if (across === "x") c.fillRect(x + at, y, 2, height); else c.fillRect(x, y + at, width, 2);
  }
}

/** A newspaper ঠোঙা heaped with ঝালমুড়ি: abstract print lines only (no real paper, no words). */
export function drawThonga(c: CanvasRenderingContext2D, cx: number, rimY: number, tipY: number, half: number) {
  const cone = new Path2D();
  cone.moveTo(cx - half, rimY); cone.lineTo(cx + half, rimY); cone.lineTo(cx + 16, tipY); cone.quadraticCurveTo(cx, tipY + 14, cx - 16, tipY); cone.closePath();
  c.fillStyle = "#efe4cb"; c.fill(cone);
  c.save(); c.clip(cone);
  const rng = makeRng(11);
  c.fillStyle = "#b9a986";
  c.fillRect(cx - half, rimY + 26, half * 2, 24);
  for (let line = rimY + 74; line < tipY; line += 24) {
    for (let x = cx - half + 14; x < cx + half; ) {
      const run = 40 + rng() * 110;
      c.fillRect(x, line, Math.min(run, cx + half - x), 8);
      x += run + 16;
    }
  }
  c.fillStyle = "#00000014";
  c.beginPath(); c.moveTo(cx, rimY); c.lineTo(cx + half, rimY); c.lineTo(cx + 16, tipY); c.closePath(); c.fill();
  c.restore();
  c.lineWidth = 6; c.strokeStyle = "#6f5c3e"; c.lineJoin = "round"; c.stroke(cone);

  // The heap: a dome of মুড়ি with চানাচুর, পেঁয়াজ and মরিচ on top.
  c.fillStyle = "#d8c49a";
  c.beginPath(); c.ellipse(cx, rimY, half, half * 0.18, 0, 0, TAU); c.fill();
  const heap = makeRng(5);
  for (let i = 0; i < 110; i++) {
    const u = heap() * 2 - 1, rise = Math.sqrt(1 - u * u);
    const gx = cx + u * half * 0.94, gy = rimY + half * 0.12 - heap() * rise * half * 0.62;
    drawFood(c, "muri", gx, gy, 22);
  }
  const toppings: Array<[Kind, number, number]> = [["chanachur", -0.55, -0.12], ["peyaj", -0.15, -0.42], ["chanachur", 0.32, -0.3], ["morich", 0.62, -0.08], ["tetul", -0.78, 0.02], ["chanachur", 0.05, -0.12]];
  for (const [kind, ux, uy] of toppings) drawFood(c, kind, cx + ux * half, rimY + uy * half, 30);
}
