// The street and the vehicles, drawn top-down with plain shapes and pre-rendered into sprites. One palette a street.
// Nothing here is a picture file: the live board caches these, and the card and the title draw them big.
import { COLS, ROWS, type Car, type Kind, type Layout } from "./board";

/** Board margins in cells: footpath on three sides, and at the top the footpath plus a row of shop shutters. */
export const SIDE = 0.3, BOTTOM = 0.3, TOP = 0.8;
export const boardWidth = (cell: number) => (COLS + 2 * SIDE) * cell;
export const boardHeight = (cell: number) => (ROWS + TOP + BOTTOM) * cell;
export const cellX = (col: number, cell: number) => (SIDE + col) * cell;
export const cellY = (row: number, cell: number) => (TOP + row) * cell;

/** Vehicle colours, the same in every street. */
export const palette = {
  exit: "#ffd23f", ink: "#26221d", muted: "#6b6255",
  cng: "#2fa84f", cngRoof: "#1d6b36", cng2: "#2f7fd1", cng2Roof: "#1c4f94", star: "#ffd23f",
  rickshaw: "#d63384", van: "#c9955a", bus: "#c8372d", truck: "#f0a020", wood: "#8b5a2b",
  glass: "#bfe3f0", dark: "#2b2f36", cream: "#f3e3c3",
};

/** One look a street: the page colours (also in product.css), the road and footpath, and the shop strip along the top. */
export type Look = {
  paper: string; ink: string; muted: string; accent: string; accentDeep: string; star: string;
  road: string; lane: string; walk: string; walkLine: string; curb: string; shutters: string[]; night: boolean;
};
export const LOOKS: readonly Look[] = [
  { paper: "#f6ead2", ink: "#2b2118", muted: "#6e5f4b", accent: "#c2561e", accentDeep: "#8a3a10", star: "#f2a900",
    road: "#4b4640", lane: "rgba(255,255,255,0.16)", walk: "#d9c9a8", walkLine: "#c4b18c", curb: "#8a7c63",
    shutters: ["#3d7ea6", "#e0b33b", "#5c9c5a", "#c75d3c", "#7a6aa8", "#3d7ea6"], night: false },
  { paper: "#e4edf5", ink: "#14213d", muted: "#4f5d78", accent: "#1f6fb2", accentDeep: "#144b7b", star: "#f2a900",
    road: "#3d424b", lane: "rgba(255,255,255,0.2)", walk: "#cfd6dc", walkLine: "#b9c2c9", curb: "#7e8890",
    shutters: ["#e0b33b", "#c8372d", "#2e8b57", "#1f6fb2", "#7a6aa8", "#e0b33b"], night: false },
  { paper: "#f1e1c9", ink: "#33241a", muted: "#7a6246", accent: "#d97706", accentDeep: "#8f4a02", star: "#e09a00",
    road: "#66503b", lane: "rgba(255,255,255,0.12)", walk: "#dcc7a2", walkLine: "#c6ac82", curb: "#8c7351",
    shutters: ["#a85c32", "#d4a03a", "#6d8f5a", "#a85c32", "#8b6a3f", "#d4a03a"], night: false },
  { paper: "#1a1d36", ink: "#f4ecd8", muted: "#aab0d6", accent: "#f2b630", accentDeep: "#b57f0a", star: "#f7c948",
    road: "#232744", lane: "rgba(255,255,255,0.14)", walk: "#3a3f63", walkLine: "#2f3454", curb: "#5a6190",
    shutters: ["#5c4a8a", "#2c5f7a", "#8a4a5c", "#3e6a52", "#5c4a8a", "#2c5f7a"], night: true },
];
export const lookOf = (world: number) => LOOKS[Math.max(0, Math.min(LOOKS.length - 1, world))];

/** A pile of bricks or a striped barricade with a lamp: the things in a dug-up road that never move. */
export function drawWall(c: CanvasRenderingContext2D, x: number, y: number, cell: number, variant: number) {
  const pad = cell * 0.08;
  if (variant % 2 === 0) {
    rect(c, x + pad, y + cell * 0.2, cell - pad * 2, cell * 0.72, cell * 0.08, "rgba(0,0,0,0.3)");
    const brick = (bx: number, by: number, w: number, tone: string) => rect(c, x + bx * cell, y + by * cell, w * cell, 0.2 * cell, cell * 0.03, tone);
    brick(0.12, 0.62, 0.36, "#a8442a"); brick(0.5, 0.62, 0.36, "#b5502f");
    brick(0.26, 0.42, 0.36, "#c25a36"); brick(0.64, 0.42, 0.24, "#a8442a"); brick(0.12, 0.42, 0.12, "#b5502f");
    brick(0.36, 0.22, 0.34, "#b5502f"); brick(0.16, 0.22, 0.18, "#c25a36");
    c.fillStyle = "#e6d3b0";
    c.beginPath(); c.ellipse(x + cell * 0.8, y + cell * 0.84, cell * 0.12, cell * 0.05, 0, 0, Math.PI * 2); c.fill();
    return;
  }
  rect(c, x + pad, y + cell * 0.26, cell - pad * 2, cell * 0.6, cell * 0.08, "rgba(0,0,0,0.28)");
  rect(c, x + cell * 0.12, y + cell * 0.3, cell * 0.76, cell * 0.26, cell * 0.05, "#fff");
  c.save();
  c.beginPath(); c.roundRect(x + cell * 0.12, y + cell * 0.3, cell * 0.76, cell * 0.26, cell * 0.05); c.clip();
  c.fillStyle = "#e8590c";
  for (let k = -2; k < 6; k++) { c.beginPath(); c.moveTo(x + cell * (0.12 + k * 0.17), y + cell * 0.56); c.lineTo(x + cell * (0.2 + k * 0.17), y + cell * 0.3); c.lineTo(x + cell * (0.3 + k * 0.17), y + cell * 0.3); c.lineTo(x + cell * (0.22 + k * 0.17), y + cell * 0.56); c.fill(); }
  c.restore();
  rect(c, x + cell * 0.18, y + cell * 0.56, cell * 0.06, cell * 0.22, cell * 0.02, "#2b2f36");
  rect(c, x + cell * 0.76, y + cell * 0.56, cell * 0.06, cell * 0.22, cell * 0.02, "#2b2f36");
  c.fillStyle = "#ff3b30"; c.beginPath(); c.arc(x + cell * 0.5, y + cell * 0.2, cell * 0.07, 0, Math.PI * 2); c.fill();
  c.fillStyle = "rgba(255,59,48,0.25)"; c.beginPath(); c.arc(x + cell * 0.5, y + cell * 0.2, cell * 0.14, 0, Math.PI * 2); c.fill();
}

/** Footpath, road, lane marks, the shop strip, the gap above each hero's lane, and the walls. Drawn once into a cached background. */
export function drawStreet(c: CanvasRenderingContext2D, cell: number, world: number, exits: readonly number[], walls: readonly number[]) {
  const look = lookOf(world), width = boardWidth(cell), height = boardHeight(cell);
  const roadX = cellX(0, cell), roadY = cellY(0, cell), shopH = (TOP - SIDE) * cell;
  c.fillStyle = look.walk;
  c.fillRect(0, 0, width, height);
  c.strokeStyle = look.walkLine; c.lineWidth = Math.max(1, cell * 0.02);
  c.beginPath();
  for (let x = cell * 0.5; x < width; x += cell * 0.5) { c.moveTo(x, shopH); c.lineTo(x, height); }
  for (let y = shopH + cell * 0.15; y < height; y += cell * 0.5) { c.moveTo(0, y); c.lineTo(width, y); }
  c.stroke();
  // The shop strip along the top: shutters, a signboard, and at night a lit window
  const shopW = width / look.shutters.length;
  look.shutters.forEach((color, i) => {
    c.fillStyle = color;
    c.fillRect(i * shopW + 2, 0, shopW - 4, shopH - 3);
    c.strokeStyle = "rgba(0,0,0,0.18)"; c.lineWidth = Math.max(1, cell * 0.025);
    c.beginPath();
    for (let y = shopH * 0.25; y < shopH - 4; y += shopH * 0.18) { c.moveTo(i * shopW + 4, y); c.lineTo((i + 1) * shopW - 4, y); }
    c.stroke();
    if (look.night) { c.fillStyle = i % 2 ? "rgba(255,214,102,0.9)" : "rgba(255,170,92,0.85)"; c.fillRect(i * shopW + shopW * 0.3, shopH * 0.3, shopW * 0.4, shopH * 0.3); }
  });
  // The road
  c.fillStyle = look.road;
  c.beginPath(); c.roundRect(roadX, roadY, COLS * cell, ROWS * cell, cell * 0.12); c.fill();
  if (world === 2) {
    // dug-up earth: dark patches and tyre ruts across the road
    c.fillStyle = "rgba(40,24,10,0.35)";
    for (let k = 0; k < 7; k++) { c.beginPath(); c.ellipse(roadX + ((k * 2.7 + 0.8) % COLS) * cell, roadY + ((k * 3.1 + 0.6) % ROWS) * cell, cell * 0.55, cell * 0.26, k * 0.7, 0, Math.PI * 2); c.fill(); }
  }
  c.strokeStyle = look.curb; c.lineWidth = Math.max(2, cell * 0.05);
  c.beginPath(); c.roundRect(roadX, roadY, COLS * cell, ROWS * cell, cell * 0.12); c.stroke();
  c.strokeStyle = look.lane; c.lineWidth = Math.max(1, cell * 0.03);
  c.setLineDash([cell * 0.22, cell * 0.2]);
  c.beginPath();
  for (let col = 1; col < COLS; col++) { c.moveTo(cellX(col, cell), roadY + 4); c.lineTo(cellX(col, cell), roadY + ROWS * cell - 4); }
  for (let row = 1; row < ROWS; row++) { c.moveTo(roadX + 4, cellY(row, cell)); c.lineTo(roadX + COLS * cell - 4, cellY(row, cell)); }
  c.stroke();
  c.setLineDash([]);
  // The way out above each hero's lane: the road runs on through the footpath and between the shops
  for (const col of exits) {
    const gapX = cellX(col, cell);
    c.fillStyle = look.road;
    c.fillRect(gapX, 0, cell, roadY + cell * 0.2);
    for (let k = 0; k < 3; k++) {
      const y = shopH + k * (SIDE * cell) / 3;
      c.fillStyle = k % 2 ? palette.dark : palette.exit;
      c.fillRect(gapX - cell * 0.1, y, cell * 0.1, (SIDE * cell) / 3);
      c.fillRect(gapX + cell, y, cell * 0.1, (SIDE * cell) / 3);
    }
    c.strokeStyle = palette.exit; c.lineWidth = Math.max(2, cell * 0.07); c.lineCap = "round"; c.lineJoin = "round";
    c.beginPath();
    for (let k = 0; k < 2; k++) {
      const y = cell * (0.22 + k * 0.28);
      c.moveTo(gapX + cell * 0.3, y + cell * 0.14); c.lineTo(gapX + cell * 0.5, y); c.lineTo(gapX + cell * 0.7, y + cell * 0.14);
    }
    c.stroke();
  }
  walls.forEach(cellIndex => drawWall(c, cellX(cellIndex % COLS, cell), cellY(Math.floor(cellIndex / COLS), cell), cell, cellIndex + Math.floor(cellIndex / COLS)));
  if (look.night) {
    // street-lamp pools of light on the road
    for (const [lx, ly] of [[0.1, 0.25], [0.9, 0.7]]) {
      const g = c.createRadialGradient(roadX + lx * COLS * cell, roadY + ly * ROWS * cell, 0, roadX + lx * COLS * cell, roadY + ly * ROWS * cell, cell * 2.2);
      g.addColorStop(0, "rgba(255,214,120,0.22)"); g.addColorStop(1, "rgba(255,214,120,0)");
      c.fillStyle = g; c.fillRect(roadX, roadY, COLS * cell, ROWS * cell);
    }
  }
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
  if (kind === "cng" || kind === "cng2") {
    const body = kind === "cng" ? palette.cng : palette.cng2, roof = kind === "cng" ? palette.cngRoof : palette.cng2Roof;
    rect(c, -w * 0.08, top - w * 0.06, w * 0.16, w * 0.16, w * 0.04, palette.dark);
    rect(c, -w / 2, top, w, L, [w * 0.45, w * 0.45, w * 0.22, w * 0.22], body);
    rect(c, -w * 0.34, top + L * 0.09, w * 0.68, L * 0.13, w * 0.12, palette.glass);
    rect(c, -w * 0.43, top + L * 0.27, w * 0.86, L * 0.66, w * 0.18, roof);
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


/** Where a vehicle's sprite sits in cells: its width and height, for the live board's cache. */
export const spriteSize = (car: Pick<Car, "len" | "down">) => car.down ? [1, car.len] as const : [car.len, 1] as const;
export const KIND_NAMES: Record<Kind, string> = { cng: "সবুজ CNG", cng2: "নীল CNG", rickshaw: "রিকশা", van: "ভ্যান", bus: "বাস", truck: "ট্রাক" };

/** A whole jam as its player first meets it, with its top-left corner at (x, y): used by the title, the story and the card. */
export function drawJam(c: CanvasRenderingContext2D, lay: Layout, world: number, x: number, y: number, cell: number, pos: readonly number[] = lay.start) {
  c.save();
  c.translate(x, y);
  c.fillStyle = "rgba(38,34,29,0.22)";
  c.beginPath(); c.roundRect(cell * 0.12, cell * 0.2, boardWidth(cell), boardHeight(cell), cell * 0.26); c.fill();
  c.beginPath(); c.roundRect(0, 0, boardWidth(cell), boardHeight(cell), cell * 0.26); c.clip();
  drawStreet(c, cell, world, lay.cars.slice(0, lay.heroes).map(car => car.line), lay.walls);
  lay.cars.forEach((car, i) => {
    if (i < lay.heroes && pos[i] === 0) return;
    drawVehicle(c, car, cellX(car.down ? car.line : pos[i], cell), cellY(car.down ? pos[i] : car.line, cell), cell);
  });
  c.restore();
}
