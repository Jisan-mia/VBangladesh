import { cardSizes, drawFooterBand, fitText, renderCard, type CardFormat } from "../../../shared/card-canvas";
import { banglaYear, bn, colorOf, headline, humanLine, patternOf, type Ghuri } from "./ghuri";

// Shakrain dusk over Old Dhaka: a plum-to-marigold sky, a low sun, rooftops with water tanks, and your kite on a long string.
const CREAM = "#fff1d0";
const ROOF = "#3a1a1f";
const ROOF_FAR = "#6b2d2e";
const INK = "#1f1c24";

type Kite = Pick<Ghuri, "pattern" | "color" | "text">;

function diamond(context: CanvasRenderingContext2D, r: number) {
  context.beginPath();
  context.moveTo(0, -r); context.lineTo(0.9 * r, -0.12 * r); context.lineTo(0, r); context.lineTo(-0.9 * r, -0.12 * r); context.closePath();
}

function dot(context: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  context.beginPath(); context.arc(x, y, radius, 0, Math.PI * 2); context.fill();
}

function drawPattern(context: CanvasRenderingContext2D, pattern: Kite["pattern"], paper: string, trim: string, r: number) {
  context.fillStyle = trim;
  if (pattern === "pankhiraj") {
    for (const side of [-1, 1]) {
      context.beginPath();
      context.moveTo(0, 0.12 * r);
      context.quadraticCurveTo(side * 0.45 * r, -0.7 * r, side * 0.95 * r, -0.12 * r);
      context.quadraticCurveTo(side * 0.42 * r, 0.02 * r, 0, 0.42 * r);
      context.fill();
    }
    context.fillStyle = paper;
    dot(context, 0, -0.05 * r, 0.1 * r);
  } else if (pattern === "chokhdar") {
    dot(context, 0, -0.08 * r, 0.42 * r);
    context.fillStyle = paper; dot(context, 0, -0.08 * r, 0.21 * r);
    context.fillStyle = trim; dot(context, 0.07 * r, -0.15 * r, 0.06 * r);
  } else if (pattern === "choshmadar") {
    context.strokeStyle = trim; context.lineWidth = 0.09 * r;
    for (const side of [-1, 1]) { context.beginPath(); context.arc(side * 0.32 * r, -0.12 * r, 0.2 * r, 0, Math.PI * 2); context.stroke(); }
    context.beginPath(); context.moveTo(-0.12 * r, -0.16 * r); context.quadraticCurveTo(0, -0.26 * r, 0.12 * r, -0.16 * r); context.stroke();
  } else if (pattern === "maladar") {
    for (const sag of [0.05, 0.42]) for (let i = 0; i <= 10; i++) {
      const t = i / 10, x = (t * 2 - 1) * 0.86 * r;
      dot(context, x, -0.12 * r + sag * r * (1 - (t * 2 - 1) ** 2) + sag * 0.3 * r, 0.065 * r);
    }
    context.fillRect(-r, -r, 2 * r, 0.32 * r);
  } else if (pattern === "daba") {
    const cell = 0.3 * r;
    for (let row = -4; row < 4; row++) for (let col = -4; col < 4; col++) if ((row + col) % 2 === 0) context.fillRect(col * cell, row * cell, cell, cell);
  } else {
    context.save(); context.scale(0.52, 0.52); diamond(context, r); context.fill(); context.restore();
    context.fillStyle = paper;
    context.save(); context.scale(0.2, 0.2); diamond(context, r); context.fill(); context.restore();
  }
}

/** A tail-less Old Dhaka fighter kite: paper diamond, bamboo spine and bow, a little tail flap, and the painted words. */
export function drawKite(context: CanvasRenderingContext2D, kite: Kite, cx: number, cy: number, r: number, tilt = -0.12) {
  const { paper, trim } = colorOf(kite.color)!;
  context.save();
  context.translate(cx, cy);
  context.rotate(tilt);
  // Tail flap first, so the paper overlaps it.
  context.fillStyle = trim;
  context.beginPath(); context.moveTo(0, 0.86 * r); context.lineTo(-0.2 * r, 1.18 * r); context.lineTo(0.2 * r, 1.18 * r); context.closePath(); context.fill();
  context.shadowColor = "rgba(40,10,10,.28)"; context.shadowBlur = r * 0.12; context.shadowOffsetY = r * 0.05;
  context.fillStyle = paper; diamond(context, r); context.fill();
  context.shadowColor = "transparent";
  context.save();
  diamond(context, r); context.clip();
  drawPattern(context, kite.pattern, paper, trim, r);
  // One half of the paper catches the light, like a real fold.
  context.fillStyle = "rgba(255,255,255,.13)";
  context.beginPath(); context.moveTo(0, -r); context.lineTo(0, r); context.lineTo(-r, 0); context.closePath(); context.fill();
  if (kite.text) {
    context.fillStyle = "#fff7e6";
    context.beginPath(); context.roundRect(-0.62 * r, 0.12 * r, 1.24 * r, 0.27 * r, 0.06 * r); context.fill();
    fitText(context, [{ text: kite.text, color: INK, weight: 700, display: true }], 0, 0.33 * r, 0.19 * r, 1.12 * r, "center");
  }
  context.restore();
  // Bamboo spine and bow.
  context.strokeStyle = "rgba(70,40,20,.75)"; context.lineCap = "round";
  context.lineWidth = Math.max(2, 0.03 * r);
  context.beginPath(); context.moveTo(0, -r); context.lineTo(0, r); context.stroke();
  context.beginPath(); context.moveTo(-0.9 * r, -0.12 * r); context.quadraticCurveTo(0, -0.62 * r, 0.9 * r, -0.12 * r); context.stroke();
  context.strokeStyle = "rgba(0,0,0,.28)"; context.lineWidth = Math.max(1.5, 0.02 * r);
  diamond(context, r); context.stroke();
  context.restore();
}

/** A paper lantern drawn as a picture: a soft glow, ribbed paper, an open ring at the bottom. No flame is drawn. */
export function drawLantern(context: CanvasRenderingContext2D, ghuri: Pick<Ghuri, "color" | "text">, cx: number, cy: number, r: number) {
  const { paper } = colorOf(ghuri.color)!;
  context.save();
  context.translate(cx, cy);
  const halo = context.createRadialGradient(0, 0.3 * r, 0, 0, 0.3 * r, 1.6 * r);
  halo.addColorStop(0, "rgba(255,214,120,.6)"); halo.addColorStop(1, "rgba(255,214,120,0)");
  context.fillStyle = halo; context.fillRect(-1.7 * r, -1.4 * r, 3.4 * r, 3.4 * r);
  const body = () => {
    context.beginPath();
    context.moveTo(-0.5 * r, -r);
    context.bezierCurveTo(-0.72 * r, -0.85 * r, -0.66 * r, 0.4 * r, -0.36 * r, 0.92 * r);
    context.lineTo(0.36 * r, 0.92 * r);
    context.bezierCurveTo(0.66 * r, 0.4 * r, 0.72 * r, -0.85 * r, 0.5 * r, -r);
    context.quadraticCurveTo(0, -1.34 * r, -0.5 * r, -r);
    context.closePath();
  };
  const fill = context.createLinearGradient(0, -r, 0, r);
  fill.addColorStop(0, paper); fill.addColorStop(0.45, paper); fill.addColorStop(1, "#ffe1a0");
  context.fillStyle = fill; body(); context.fill();
  context.save(); body(); context.clip();
  context.fillStyle = "rgba(255,240,200,.35)";
  context.beginPath(); context.ellipse(0, 0.75 * r, 0.42 * r, 0.5 * r, 0, 0, Math.PI * 2); context.fill();
  context.strokeStyle = "rgba(255,255,255,.35)"; context.lineWidth = Math.max(1.5, 0.018 * r);
  for (const x of [-0.36, -0.12, 0.12, 0.36]) { context.beginPath(); context.moveTo(x * 1.1 * r, -1.1 * r); context.quadraticCurveTo(x * 1.6 * r, 0, x * r, r); context.stroke(); }
  context.restore();
  context.strokeStyle = "rgba(60,20,10,.45)"; context.lineWidth = Math.max(2, 0.025 * r);
  context.beginPath(); context.ellipse(0, 0.92 * r, 0.36 * r, 0.07 * r, 0, 0, Math.PI * 2); context.stroke();
  if (ghuri.text) {
    context.shadowColor = "rgba(60,20,10,.55)"; context.shadowBlur = 0.06 * r;
    fitText(context, [{ text: ghuri.text, color: "#fffaf0", weight: 800, display: true }], 0, -0.02 * r, 0.2 * r, 1.05 * r, "center");
    context.shadowColor = "transparent";
  }
  context.restore();
}

// [x, width, height] of each house, left to right, on a 1080-wide skyline.
const houses: Array<[number, number, number]> = [[0, 150, 210], [140, 120, 260], [250, 170, 190], [410, 110, 280], [510, 190, 220], [690, 130, 300], [810, 150, 205], [950, 140, 250]];

function drawRooftops(context: CanvasRenderingContext2D, width: number, ground: number) {
  // Far row, lighter, for depth.
  context.fillStyle = ROOF_FAR;
  for (const [x, w, h] of houses) context.fillRect(width - x - w + 30, ground - h - 70, w - 12, h + 70);
  context.fillStyle = ROOF;
  for (const [x, w, h] of houses) {
    const top = ground - h;
    context.fillRect(x, top, w, h);
    // A parapet lip and, on every other roof, a water tank on legs.
    context.fillRect(x - 6, top - 10, w + 12, 12);
    if (x % 3 !== 0) { context.fillRect(x + w * 0.55, top - 52, 44, 36); context.fillRect(x + w * 0.55 + 6, top - 16, 6, 16); context.fillRect(x + w * 0.55 + 32, top - 16, 6, 16); }
    if (h > 240) { context.fillRect(x + 24, top - 90, 4, 80); context.fillRect(x + 8, top - 82, 36, 4); }
  }
  // Lit windows at dusk.
  context.fillStyle = "#ffcf6b";
  houses.forEach(([x, w, h], index) => {
    for (let row = 0; row < 3; row++) if ((index + row) % 2 === 0) context.fillRect(x + 22 + (row % 2) * (w / 2 - 10), ground - h + 40 + row * 62, 22, 28);
  });
}

function drawSky(context: CanvasRenderingContext2D, width: number, height: number, ground: number) {
  const sky = context.createLinearGradient(0, 0, 0, ground);
  sky.addColorStop(0, "#5b2346"); sky.addColorStop(0.42, "#d8572a"); sky.addColorStop(1, "#ffc46b");
  context.fillStyle = sky; context.fillRect(0, 0, width, height);
  context.fillStyle = "rgba(255,236,170,.9)";
  dot(context, width * 0.2, ground - 210, 70);
  // Far-away kites of the other rooftops: Shakrain's sky is never empty.
  const far: Array<[number, number, string]> = [[0.08, 0.5, "#2346a8"], [0.9, 0.36, "#f5bf1f"], [0.78, 0.6, "#1f8a4c"], [0.55, 0.5, "#1f1c24"]];
  for (const [fx, fy, color] of far) {
    context.save(); context.translate(fx * width, fy * ground); context.rotate(0.3);
    context.fillStyle = color; diamond(context, 16); context.fill(); context.restore();
  }
}

/** The kite's string runs down to a নাটাই on the nearest roof. */
function drawString(context: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) {
  context.strokeStyle = "rgba(255,248,230,.85)"; context.lineWidth = 2.5;
  context.beginPath(); context.moveTo(fromX, fromY); context.quadraticCurveTo((fromX + toX) / 2 + 60, (fromY + toY) / 2 + 120, toX, toY); context.stroke();
}

const layouts = {
  feed: { kicker: 104, title: 228, titleSize: 112, sub: 296, kite: [630, 640, 255], friend: [210, 520, 92], line: 1196, sky: 1100 },
  story: { kicker: 320, title: 452, titleSize: 124, sub: 528, kite: [620, 950, 300], friend: [220, 760, 110], line: 1592, sky: 1480 },
} as const;

export function drawCard(canvas: HTMLCanvasElement, ghuri: Ghuri, format: CardFormat, site: string, friend?: Ghuri | null, now = new Date()) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const footer = format === "story" ? height - 260 : height - 96;
  drawSky(context, width, height, layout.sky);
  drawRooftops(context, width, footer);
  context.fillStyle = ROOF; context.fillRect(0, layout.line - 70, width, footer - layout.line + 70);

  // On the parapet of the second roof (houses[1]).
  const spool = [200, footer - houses[1][2] - 26] as const;
  const fly = (item: Ghuri, cx: number, cy: number, r: number) => {
    if (item.mode === "kite") { drawString(context, cx + 0.03 * r, cy + 0.2 * r, spool[0], spool[1]); drawKite(context, item, cx, cy, r); }
    else drawLantern(context, item, cx, cy, r);
  };
  if (friend) fly(friend, layout.friend[0], layout.friend[1], layout.friend[2]);
  fly(ghuri, layout.kite[0], layout.kite[1], layout.kite[2]);
  // The নাটাই: a little wooden spool on the parapet.
  if (ghuri.mode === "kite" || friend?.mode === "kite") {
    context.fillStyle = "#c98a3d"; context.fillRect(spool[0] - 22, spool[1] - 6, 44, 30);
    context.fillStyle = "#7a4a1c"; context.fillRect(spool[0] - 30, spool[1] - 10, 8, 38); context.fillRect(spool[0] + 22, spool[1] - 10, 8, 38);
  }

  // With nothing written, the headline is already the pattern name; don't say it twice.
  const kind = ghuri.mode === "fanush" ? (ghuri.text ? `ফানুসের গায়ে লেখা: ${ghuri.text}` : "ফানুসে লেখা একটা চাওয়া") : `${colorOf(ghuri.color)!.label} ${ghuri.text ? `${patternOf(ghuri.pattern)!.label} ` : ""}ঘুড়ি`;
  fitText(context, [{ text: `সাকরাইন ${bn(banglaYear(now))} · পুরান ঢাকার আকাশ`, color: "#ffd9a8", weight: 600 }], 84, layout.kicker, 32, 912);
  context.shadowColor = "rgba(40,10,20,.45)"; context.shadowBlur = 14; context.shadowOffsetY = 4;
  fitText(context, [{ text: `‘${headline(ghuri)}’`, color: CREAM, weight: 800, display: true }], 80, layout.title, layout.titleSize, 920);
  context.shadowColor = "transparent";
  fitText(context, [{ text: friend ? `${kind} · পাশে বন্ধুর ‘${headline(friend)}’` : kind, color: "#ffe6c4", weight: 600 }], 84, layout.sub, 36, 912);
  fitText(context, [{ text: humanLine(ghuri), color: CREAM, weight: 600 }], width / 2, layout.line, 42, 912, "center");

  drawFooterBand(context, format, ghuri.mode === "kite" ? "তোমার ঘুড়ির নাম কী?" : "তোমার ফানুসে কী লিখবে?", site, { band: "#2a1216", ask: "#ffc46b", site: "#ffffff" });
}

export const cardBlob = (ghuri: Ghuri, format: CardFormat, site: string, friend?: Ghuri | null) => renderCard(canvas => drawCard(canvas, ghuri, format, site, friend));
