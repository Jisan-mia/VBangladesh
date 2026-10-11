// The street and the vehicles, drawn top-down with plain shapes. The live board caches these as sprites; the card draws them big.
import { COLS, EXIT_COL, ROWS, type Car, type Kind } from "./board";

/** Board margins in cells: footpath on three sides, and at the top the footpath plus a row of shop shutters. */
export const SIDE = 0.3, BOTTOM = 0.3, TOP = 0.8;
export const boardWidth = (cell: number) => (COLS + 2 * SIDE) * cell;
export const boardHeight = (cell: number) => (ROWS + TOP + BOTTOM) * cell;
export const cellX = (col: number, cell: number) => (SIDE + col) * cell;
export const cellY = (row: number, cell: number) => (TOP + row) * cell;

export const palette = {
  road: "#454a53", lane: "rgba(255,255,255,0.16)", walk: "#d3cab9", walkLine: "#bfb5a2", curb: "#8d8576",
  exit: "#ffd23f", ink: "#26221d", muted: "#6b6255",
  cng: "#2fa84f", cngRoof: "#1d6b36", star: "#ffd23f",
  rickshaw: "#d63384", van: "#c9955a", bus: "#c8372d", truck: "#f0a020", wood: "#8b5a2b",
  glass: "#bfe3f0", dark: "#2b2f36", cream: "#f3e3c3",
};

const SHUTTERS = ["#3d7ea6", "#e0b33b", "#5c9c5a", "#c75d3c", "#7a6aa8", "#3d7ea6"];

/** Footpath, road, lane marks, shops along the top and the gap your CNG leaves by. Drawn once into a cached background. */
export function drawStreet(c: CanvasRenderingContext2D, cell: number) {
  const width = boardWidth(cell), height = boardHeight(cell);
  const roadX = cellX(0, cell), roadY = cellY(0, cell), shopH = (TOP - SIDE) * cell;
  c.fillStyle = palette.walk;
  c.fillRect(0, 0, width, height);
  // Footpath tiles
  c.strokeStyle = palette.walkLine; c.lineWidth = Math.max(1, cell * 0.02);
  c.beginPath();
  for (let x = cell * 0.5; x < width; x += cell * 0.5) { c.moveTo(x, shopH); c.lineTo(x, height); }
  for (let y = shopH + cell * 0.15; y < height; y += cell * 0.5) { c.moveTo(0, y); c.lineTo(width, y); }
  c.stroke();
  // Shop shutters along the top: the old street, with a গলি between two shops
  const shopW = width / SHUTTERS.length;
  SHUTTERS.forEach((color, i) => {
    c.fillStyle = color;
    c.fillRect(i * shopW + 2, 0, shopW - 4, shopH - 3);
    c.strokeStyle = "rgba(0,0,0,0.18)"; c.lineWidth = Math.max(1, cell * 0.025);
    c.beginPath();
    for (let y = shopH * 0.25; y < shopH - 4; y += shopH * 0.18) { c.moveTo(i * shopW + 4, y); c.lineTo((i + 1) * shopW - 4, y); }
    c.stroke();
  });
  // The road and its lanes
  c.fillStyle = palette.road;
  c.beginPath(); c.roundRect(roadX, roadY, COLS * cell, ROWS * cell, cell * 0.12); c.fill();
  c.strokeStyle = palette.curb; c.lineWidth = Math.max(2, cell * 0.05);
  c.stroke();
  c.strokeStyle = palette.lane; c.lineWidth = Math.max(1, cell * 0.03);
  c.setLineDash([cell * 0.22, cell * 0.2]);
  c.beginPath();
  for (let col = 1; col < COLS; col++) { c.moveTo(cellX(col, cell), roadY + 4); c.lineTo(cellX(col, cell), roadY + ROWS * cell - 4); }
  for (let row = 1; row < ROWS; row++) { c.moveTo(roadX + 4, cellY(row, cell)); c.lineTo(roadX + COLS * cell - 4, cellY(row, cell)); }
  c.stroke();
  c.setLineDash([]);
  // The way out: the road runs on through the footpath and between the shops
  const gapX = cellX(EXIT_COL, cell);
  c.fillStyle = palette.road;
  c.fillRect(gapX, 0, cell, roadY + cell * 0.2);
  c.fillStyle = palette.exit;
  for (let k = 0; k < 3; k++) {
    // Yellow-black curb ends on both sides of the gap
    const y = shopH + k * (SIDE * cell) / 3;
    c.fillStyle = k % 2 ? palette.dark : palette.exit;
    c.fillRect(gapX - cell * 0.1, y, cell * 0.1, (SIDE * cell) / 3);
    c.fillRect(gapX + cell, y, cell * 0.1, (SIDE * cell) / 3);
  }
  // Painted arrows pointing out
  c.strokeStyle = palette.exit; c.lineWidth = Math.max(2, cell * 0.07); c.lineCap = "round"; c.lineJoin = "round";
  c.beginPath();
  for (let k = 0; k < 2; k++) {
    const y = cell * (0.22 + k * 0.28);
    c.moveTo(gapX + cell * 0.3, y + cell * 0.14); c.lineTo(gapX + cell * 0.5, y); c.lineTo(gapX + cell * 0.7, y + cell * 0.14);
  }
  c.stroke();
}

/** A five-pointed star centred at (x, y). */
function star(c: CanvasRenderingContext2D, x: number, y: number, r: number) {
  c.beginPath();
  for (let k = 0; k < 10; k++) {
    const angle = -Math.PI / 2 + k * Math.PI / 5, radius = k % 2 ? r * 0.45 : r;
    c.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
  }
  c.closePath();
}

function rect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number | number[], fill: string) {
  c.fillStyle = fill;
  c.beginPath(); c.roundRect(x, y, w, h, r); c.fill();
}

/** The front of a rickshaw or a van: wheel, handlebar and the driver's seat. */
function pedalFront(c: CanvasRenderingContext2D, w: number, top: number, L: number) {
  c.strokeStyle = palette.dark; c.lineWidth = Math.max(1.5, w * 0.06); c.lineCap = "round";
  c.beginPath(); c.moveTo(0, top + L * 0.05); c.lineTo(0, top + L * 0.42); c.stroke();
  rect(c, -w * 0.07, top, w * 0.14, L * 0.13, w * 0.05, palette.dark);
  c.beginPath(); c.moveTo(-w * 0.3, top + L * 0.1); c.lineTo(w * 0.3, top + L * 0.1); c.stroke();
  rect(c, -w * 0.15, top + L * 0.18, w * 0.3, L * 0.09, w * 0.06, "#6b4423");
}

/** Draws one vehicle in its own frame: centred on (0, 0), front pointing up, `w` wide and `L` long. */
function drawKind(c: CanvasRenderingContext2D, kind: Kind, w: number, L: number) {
  const top = -L / 2;
  if (kind === "cng") {
    rect(c, -w * 0.08, top - w * 0.06, w * 0.16, w * 0.16, w * 0.04, palette.dark);
    rect(c, -w / 2, top, w, L, [w * 0.45, w * 0.45, w * 0.22, w * 0.22], palette.cng);
    rect(c, -w * 0.34, top + L * 0.09, w * 0.68, L * 0.13, w * 0.12, palette.glass);
    rect(c, -w * 0.43, top + L * 0.27, w * 0.86, L * 0.66, w * 0.18, palette.cngRoof);
    // White piping down the canopy and the star: this one is yours
    c.strokeStyle = "rgba(255,255,255,0.55)"; c.lineWidth = Math.max(1, w * 0.04);
    c.beginPath(); c.moveTo(-w * 0.3, top + L * 0.32); c.lineTo(-w * 0.3, top + L * 0.88); c.moveTo(w * 0.3, top + L * 0.32); c.lineTo(w * 0.3, top + L * 0.88); c.stroke();
    star(c, 0, top + L * 0.6, w * 0.24);
    c.fillStyle = palette.star; c.fill();
    c.strokeStyle = "#8a6d00"; c.lineWidth = Math.max(1, w * 0.03); c.stroke();
    return;
  }
  if (kind === "rickshaw") {
    rect(c, -w * 0.52, top + L * 0.62, w * 0.12, L * 0.2, w * 0.04, palette.dark);
    rect(c, w * 0.4, top + L * 0.62, w * 0.12, L * 0.2, w * 0.04, palette.dark);
    pedalFront(c, w, top, L);
    rect(c, -w * 0.46, top + L * 0.36, w * 0.92, L * 0.62, [w * 0.46, w * 0.46, w * 0.14, w * 0.14], palette.rickshaw);
    // Hood art: a yellow rim and white polka dots
    c.strokeStyle = "#ffd23f"; c.lineWidth = Math.max(1.5, w * 0.06);
    c.beginPath(); c.roundRect(-w * 0.4, top + L * 0.4, w * 0.8, L * 0.54, [w * 0.4, w * 0.4, w * 0.1, w * 0.1]); c.stroke();
    c.fillStyle = "#ffffff";
    for (let row = 0; row < 3; row++) for (let col = -1; col <= 1; col++) {
      if (row === 0 && col !== 0) continue;
      c.beginPath(); c.arc(col * w * 0.2, top + L * (0.52 + row * 0.13), w * 0.05, 0, Math.PI * 2); c.fill();
    }
    return;
  }
  if (kind === "van") {
    rect(c, -w * 0.52, top + L * 0.68, w * 0.12, L * 0.2, w * 0.04, palette.dark);
    rect(c, w * 0.4, top + L * 0.68, w * 0.12, L * 0.2, w * 0.04, palette.dark);
    pedalFront(c, w, top, L);
    rect(c, -w * 0.46, top + L * 0.32, w * 0.92, L * 0.66, w * 0.08, palette.van);
    // Planks across the deck, and the load: a লাউ and two pumpkins
    c.strokeStyle = "#9c6b35"; c.lineWidth = Math.max(1, w * 0.035);
    c.beginPath();
    for (let y = top + L * 0.4; y < top + L * 0.97; y += L * 0.085) { c.moveTo(-w * 0.44, y); c.lineTo(w * 0.44, y); }
    c.stroke();
    c.fillStyle = "#6aa84f"; c.beginPath(); c.ellipse(-w * 0.12, top + L * 0.62, w * 0.12, L * 0.17, 0.3, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#e67e22"; c.beginPath(); c.arc(w * 0.2, top + L * 0.52, w * 0.13, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(w * 0.16, top + L * 0.8, w * 0.12, 0, Math.PI * 2); c.fill();
    return;
  }
  if (kind === "bus") {
    rect(c, -w / 2, top, w, L, w * 0.18, palette.bus);
    rect(c, -w * 0.4, top + L * 0.025, w * 0.8, L * 0.05, w * 0.06, palette.dark);
    rect(c, -w * 0.32, top + L * 0.1, w * 0.64, L * 0.86, w * 0.1, palette.cream);
    // A row of windows down each side, a green stripe and two roof hatches
    c.fillStyle = palette.dark;
    for (let y = top + L * 0.12; y < top + L * 0.92; y += L * 0.1) {
      c.fillRect(-w * 0.46, y, w * 0.1, L * 0.065);
      c.fillRect(w * 0.36, y, w * 0.1, L * 0.065);
    }
    c.fillStyle = "#2e8b57"; c.fillRect(-w * 0.06, top + L * 0.1, w * 0.12, L * 0.86);
    rect(c, -w * 0.2, top + L * 0.25, w * 0.4, L * 0.1, 3, "#c9b993");
    rect(c, -w * 0.2, top + L * 0.66, w * 0.4, L * 0.1, 3, "#c9b993");
    return;
  }
  // truck: a painted cab and a wooden load box
  rect(c, -w / 2, top, w, L * 0.3, [w * 0.2, w * 0.2, w * 0.06, w * 0.06], palette.truck);
  rect(c, -w * 0.4, top + L * 0.025, w * 0.8, L * 0.05, w * 0.05, palette.dark);
  rect(c, -w * 0.36, top + L * 0.1, w * 0.72, L * 0.15, w * 0.08, "#f7c35f");
  rect(c, -w / 2, top + L * 0.32, w, L * 0.68, w * 0.08, palette.wood);
  c.save();
  c.beginPath(); c.roundRect(-w * 0.42, top + L * 0.36, w * 0.84, L * 0.6, w * 0.05); c.clip();
  c.strokeStyle = "#6d4422"; c.lineWidth = Math.max(1.5, w * 0.06);
  c.beginPath();
  for (let d = -w; d < L; d += w * 0.28) { c.moveTo(-w / 2, top + L * 0.36 + d); c.lineTo(w / 2, top + L * 0.36 + d - w); }
  c.stroke();
  c.restore();
  c.strokeStyle = "#2e8b57"; c.lineWidth = Math.max(1.5, w * 0.05);
  c.beginPath(); c.roundRect(-w * 0.45, top + L * 0.34, w * 0.9, L * 0.63, w * 0.06); c.stroke();
  c.strokeStyle = "#e74c3c"; c.lineWidth = Math.max(1, w * 0.03);
  c.beginPath(); c.roundRect(-w * 0.39, top + L * 0.37, w * 0.78, L * 0.57, w * 0.04); c.stroke();
}

/** A vehicle whose top-left cell corner is at (x, y). Across vehicles face right. */
export function drawVehicle(c: CanvasRenderingContext2D, car: Pick<Car, "kind" | "len" | "down">, x: number, y: number, cell: number) {
  const inset = cell * 0.08, w = cell - inset * 2.4, L = car.len * cell - inset * 2;
  c.save();
  c.translate(x + (car.down ? cell : car.len * cell) / 2, y + (car.down ? car.len * cell : cell) / 2);
  if (!car.down) c.rotate(Math.PI / 2);
  // A soft drop shadow drawn as a shape (no shadowBlur, cheap on old phones)
  rect(c, -w / 2 + cell * 0.03, -L / 2 + cell * 0.06, w, L, w * 0.25, "rgba(0,0,0,0.28)");
  drawKind(c, car.kind, w, L);
  c.restore();
}

/** The outline around the picked vehicle. */
export function drawPicked(c: CanvasRenderingContext2D, car: Car, x: number, y: number, cell: number) {
  const pad = cell * 0.02;
  c.strokeStyle = "#ffffff"; c.lineWidth = Math.max(3, cell * 0.08);
  c.beginPath(); c.roundRect(x + pad, y + pad, (car.down ? 1 : car.len) * cell - pad * 2, (car.down ? car.len : 1) * cell - pad * 2, cell * 0.2); c.stroke();
  c.strokeStyle = palette.exit; c.lineWidth = Math.max(1.5, cell * 0.035);
  c.stroke();
}
