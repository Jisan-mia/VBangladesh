// Drawings: glass bangles (each colour with its own pattern, so colour is never the only clue), the velvet tray and the stall rods on the card.
import { RAINBOW, SIZE, SPARKLE, colourOf, isSparkle } from "./board";

export const COLOUR_NAMES = ["লাল", "সবুজ", "নীল", "হলুদ", "বেগুনি", "সাদা"] as const;
/** base, light edge, deep edge for each glass colour */
export const GLASS = [
  ["#d92a3c", "#ff9a9a", "#760c1a"],
  ["#1f9a48", "#8fe8a8", "#0a4d24"],
  ["#2a66dc", "#9dc0ff", "#0e2c76"],
  ["#f0b400", "#ffe896", "#875c00"],
  ["#8d3fc8", "#d8b0f7", "#43156a"],
  ["#ece7da", "#ffffff", "#9c9583"],
] as const;
export const GOLD = "#f3cd6a";
/** The velvet of each মেলা's stall: গ্রামের মেলা, বৈশাখী মেলা, চুড়িপট্টি, রাতের মেলা. */
export const VELVET = [
  ["#5c0f26", "#2c0611"],
  ["#124a3a", "#06231b"],
  ["#1b2757", "#0b1230"],
  ["#33163f", "#14071b"],
] as const;

const TAU = Math.PI * 2;

/** One bangle seen from above, filling a `size` box at (x, y). */
export function drawBangle(c: CanvasRenderingContext2D, piece: number, x: number, y: number, size: number) {
  const cx = x + size / 2, cy = y + size / 2, outer = size * 0.43, inner = size * 0.24, mid = (outer + inner) / 2, band = outer - inner;
  const ring = () => { c.beginPath(); c.arc(cx, cy, outer, 0, TAU); c.arc(cx, cy, inner, 0, TAU, true); };

  // a soft shadow on the velvet
  c.fillStyle = "rgba(0,0,0,0.28)";
  c.beginPath(); c.arc(cx + size * 0.02, cy + size * 0.05, outer, 0, TAU); c.arc(cx + size * 0.02, cy + size * 0.05, inner, 0, TAU, true); c.fill("evenodd");

  if (piece === RAINBOW) {
    GLASS.forEach(([base], index) => {
      c.fillStyle = base;
      c.beginPath(); c.arc(cx, cy, outer, (index / 6) * TAU - 1.6, ((index + 1) / 6) * TAU - 1.6 + 0.02); c.arc(cx, cy, inner, ((index + 1) / 6) * TAU - 1.6 + 0.02, (index / 6) * TAU - 1.6, true); c.fill();
    });
  } else {
    const [base, light, deep] = GLASS[colourOf(piece)];
    const glass = c.createRadialGradient(cx, cy, inner, cx, cy, outer);
    glass.addColorStop(0, deep); glass.addColorStop(0.45, base); glass.addColorStop(0.8, base); glass.addColorStop(1, light);
    c.fillStyle = glass; ring(); c.fill("evenodd");
    pattern(c, colourOf(piece), cx, cy, outer, inner, mid, band, size);
  }

  // the gold of a ঝিকমিক bangle: a gilt rim on both edges
  if (isSparkle(piece)) {
    c.strokeStyle = GOLD; c.lineWidth = size * 0.05;
    c.beginPath(); c.arc(cx, cy, outer - size * 0.02, 0, TAU); c.stroke();
    c.lineWidth = size * 0.03;
    c.beginPath(); c.arc(cx, cy, inner + size * 0.015, 0, TAU); c.stroke();
  }

  // glass shine: a bright arc on the top left, a faint one bottom right
  c.lineCap = "round";
  c.strokeStyle = "rgba(255,255,255,0.75)"; c.lineWidth = band * 0.22;
  c.beginPath(); c.arc(cx, cy, mid + band * 0.12, Math.PI * 1.08, Math.PI * 1.42); c.stroke();
  c.strokeStyle = "rgba(255,255,255,0.3)"; c.lineWidth = band * 0.14;
  c.beginPath(); c.arc(cx, cy, mid, Math.PI * 0.1, Math.PI * 0.32); c.stroke();
  c.lineCap = "butt";
  c.strokeStyle = "rgba(0,0,0,0.35)"; c.lineWidth = Math.max(1, size * 0.012);
  ring(); c.stroke();

  if (isSparkle(piece) || piece === RAINBOW) glint(c, cx + outer * 0.62, cy - outer * 0.62, size * (piece === RAINBOW ? 0.2 : 0.16));
}

/** Each colour's own pattern, so two colours never look alike in grey. */
function pattern(c: CanvasRenderingContext2D, colour: number, cx: number, cy: number, outer: number, inner: number, mid: number, band: number, size: number) {
  c.save();
  c.beginPath(); c.arc(cx, cy, outer, 0, TAU); c.arc(cx, cy, inner, 0, TAU, true); c.clip("evenodd");
  const at = (angle: number, radius: number) => [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius] as const;
  if (colour === 0) {
    // লাল: two thin gold lines along the band
    c.strokeStyle = GOLD; c.lineWidth = size * 0.022;
    for (const radius of [inner + band * 0.28, outer - band * 0.28]) { c.beginPath(); c.arc(cx, cy, radius, 0, TAU); c.stroke(); }
  } else if (colour === 1) {
    // সবুজ: twisted, slanted white stripes
    c.strokeStyle = "rgba(255,255,255,0.7)"; c.lineWidth = size * 0.028;
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; const [x1, y1] = at(a, inner - 1), [x2, y2] = at(a + 0.35, outer + 1); c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); }
  } else if (colour === 2) {
    // নীল: a ring of white beads
    c.fillStyle = "rgba(255,255,255,0.88)";
    for (let i = 0; i < 9; i++) { const [x, y] = at((i / 9) * TAU, mid); c.beginPath(); c.arc(x, y, band * 0.17, 0, TAU); c.fill(); }
  } else if (colour === 3) {
    // হলুদ: a deep groove, so it reads as two bangles worn together
    c.strokeStyle = "#7a5200"; c.lineWidth = size * 0.03;
    c.beginPath(); c.arc(cx, cy, mid, 0, TAU); c.stroke();
  } else if (colour === 4) {
    // বেগুনি: a gold zigzag
    c.strokeStyle = GOLD; c.lineWidth = size * 0.024; c.lineJoin = "round";
    c.beginPath();
    for (let i = 0; i <= 20; i++) { const [x, y] = at((i / 20) * TAU, i % 2 ? outer - band * 0.2 : inner + band * 0.2); if (i) c.lineTo(x, y); else c.moveTo(x, y); }
    c.stroke();
  } else {
    // সাদা: little coloured stones set in the glass
    const stones = [GLASS[0][0], GLASS[1][0], GLASS[2][0]];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + 0.3, [x, y] = at(a, mid), r = band * 0.24;
      c.fillStyle = stones[i % 3];
      c.beginPath(); c.moveTo(x, y - r); c.lineTo(x + r, y); c.lineTo(x, y + r); c.lineTo(x - r, y); c.closePath(); c.fill();
    }
  }
  c.restore();
}

/** A four-point gold glint. */
export function glint(c: CanvasRenderingContext2D, x: number, y: number, r: number) {
  c.fillStyle = "#fff6cf";
  c.beginPath();
  c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r); c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r);
  c.fill();
  c.fillStyle = GOLD;
  c.beginPath(); c.arc(x, y, r * 0.18, 0, TAU); c.fill();
}

/** The tray: tufted velvet, a dimple for each bangle and a thin gold frame. Drawn once per size into an offscreen canvas. */
export function drawTray(c: CanvasRenderingContext2D, size: number, world: number) {
  const [light, dark] = VELVET[Math.max(0, Math.min(3, world))];
  const cell = size / SIZE;
  const velvet = c.createRadialGradient(size * 0.4, size * 0.3, size * 0.1, size / 2, size / 2, size * 0.8);
  velvet.addColorStop(0, light); velvet.addColorStop(1, dark);
  c.fillStyle = velvet;
  c.beginPath(); c.roundRect(0, 0, size, size, size * 0.035); c.fill();
  // tufting: diagonal seams with a button where they cross
  c.save();
  c.beginPath(); c.roundRect(0, 0, size, size, size * 0.035); c.clip();
  c.strokeStyle = "rgba(0,0,0,0.18)"; c.lineWidth = 1;
  for (let k = -SIZE; k <= SIZE; k++) {
    c.beginPath(); c.moveTo(k * cell, 0); c.lineTo(k * cell + size, size); c.stroke();
    c.beginPath(); c.moveTo(k * cell + size, 0); c.lineTo(k * cell, size); c.stroke();
  }
  for (let row = 0; row < SIZE; row++) for (let col = 0; col < SIZE; col++) {
    const x = (col + 0.5) * cell, y = (row + 0.5) * cell;
    const dip = c.createRadialGradient(x, y - cell * 0.05, cell * 0.1, x, y, cell * 0.46);
    dip.addColorStop(0, "rgba(0,0,0,0.3)"); dip.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = dip; c.beginPath(); c.arc(x, y, cell * 0.46, 0, TAU); c.fill();
  }
  c.restore();
  c.strokeStyle = GOLD; c.lineWidth = Math.max(2, size * 0.008);
  c.beginPath(); c.roundRect(1.5, 1.5, size - 3, size - 3, size * 0.03); c.stroke();
}

/** Bangles on a stall rod, seen from the side: a stack of `count` glass rings on a wooden stick. */
export function drawRod(c: CanvasRenderingContext2D, piece: number, x: number, bottom: number, width: number, count: number) {
  const rx = width / 2, ry = width * 0.16, gap = ry * 0.95, top = bottom - (count - 1) * gap - ry * 3;
  c.fillStyle = "#8a5a2b";
  c.fillRect(x - width * 0.05, top - ry * 2, width * 0.1, bottom - top + ry * 3);
  c.fillStyle = "#5e3a17";
  c.beginPath(); c.ellipse(x, bottom + ry * 1.4, rx * 0.7, ry * 0.6, 0, 0, TAU); c.fill();
  for (let i = 0; i < count; i++) {
    const y = bottom - i * gap;
    const rainbow = piece === RAINBOW, colour = rainbow ? i % 6 : colourOf(piece);
    const [base, light, deep] = GLASS[colour];
    c.lineWidth = ry * 0.9;
    c.strokeStyle = deep; c.beginPath(); c.ellipse(x, y + ry * 0.12, rx, ry, 0, 0, TAU); c.stroke();
    c.strokeStyle = base; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.stroke();
    c.strokeStyle = light; c.lineWidth = ry * 0.25; c.beginPath(); c.ellipse(x, y - ry * 0.18, rx * 0.92, ry * 0.8, 0, Math.PI * 1.1, Math.PI * 1.6); c.stroke();
    if (isSparkle(piece) || (piece >= 0 && piece < SPARKLE && (colour === 0 || colour === 4) && i % 2)) {
      c.strokeStyle = GOLD; c.lineWidth = ry * 0.2; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI); c.stroke();
    }
  }
}
