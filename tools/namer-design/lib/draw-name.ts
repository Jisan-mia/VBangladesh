import { cardSizes, DISPLAY_FONT, drawFooterBand, fitText, renderCard, roundedRect, siteLabel, wrapText, type CardFormat } from "../../../shared/card-canvas";
import { cleanName, humanLine, letters, PLACEHOLDER_NAME, possessive, type Design, type StyleId } from "./namer";

// The name is the hero: each style is a surface from Bangladeshi life (primer tiles, a clay courtyard, a wedding card, a school slate,
// a shop's neon sign, a kantha, the flag's green and red, Ekushe's black and white) and the name is lettered onto it with canvas
// effects only (stroke, shadow, gradient, texture). Fonts are the site's own Display and Bangla.
export type Format = CardFormat | "square";
export type Surface = Format | "stage";
// "stage" is the short view at the top of the page, so the controls still fit on the first phone screen; "square" is a profile picture.
export const sizes = { ...cardSizes, square: { width: 1080, height: 1080 }, stage: { width: 1080, height: 720 } } as const;

type Box = { x: number; y: number; w: number; h: number };
type Ctx = CanvasRenderingContext2D;

// Where the name sits, and how tall the surface is above the footer band.
const layouts: Record<Surface, { box: Box; content: number }> = {
  stage: { box: { x: 110, y: 110, w: 860, h: 500 }, content: 720 },
  square: { box: { x: 150, y: 230, w: 780, h: 620 }, content: 1080 },
  feed: { box: { x: 120, y: 250, w: 840, h: 620 }, content: 1350 - 96 },
  story: { box: { x: 110, y: 500, w: 860, h: 720 }, content: 1920 - 260 },
};

const ASK = "তোমার নামের প্রথম অক্ষর কী?";

/** Same pattern every time for a style, so the background never flickers while typing. */
function random(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const font = (size: number, weight = 800) => `${weight} ${size}px ${DISPLAY_FONT}`;

/** The biggest size at which the name fits the box: one line, or two split at the space nearest the middle when that is bigger. */
function fitName(context: Ctx, name: string, box: Box, weight = 800, maxSize = box.h * 0.56) {
  const best = (lines: string[], cap: number) => {
    let size = cap;
    const fits = () => { context.font = font(size, weight); return lines.every(line => context.measureText(line).width <= box.w) && lines.length * size * 1.22 <= box.h; };
    while (!fits() && size > 20) size -= 4;
    return { lines, size };
  };
  const one = best([name], maxSize);
  const spaces = [...name.matchAll(/ /g)].map(match => match.index!);
  if (!spaces.length || one.size > maxSize * 0.72) return one;
  const cut = spaces.reduce((a, b) => Math.abs(b - name.length / 2) < Math.abs(a - name.length / 2) ? b : a);
  const two = best([name.slice(0, cut), name.slice(cut + 1)], maxSize * 0.8);
  return two.size > one.size ? two : one;
}

/** Calls draw for each fitted line, centred in the box, with textBaseline "middle". Returns the y just under the last line, for underlines. */
function eachLine(context: Ctx, fit: { lines: string[]; size: number }, box: Box, draw: (line: string, x: number, y: number) => void) {
  context.textAlign = "center";
  context.textBaseline = "middle";
  const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
  // Display Bangla sits a little high on "middle"; nudge it down so the matra line is optically centred.
  const y = (index: number) => cy + (index - (fit.lines.length - 1) / 2) * fit.size * 1.22 + fit.size * 0.06;
  fit.lines.forEach((line, index) => draw(line, cx, y(index)));
  return y(fit.lines.length - 1) + fit.size * 0.5;
}

function widest(context: Ctx, fit: { lines: string[]; size: number }, weight = 800) {
  context.font = font(fit.size, weight);
  return Math.max(...fit.lines.map(line => context.measureText(line).width));
}

function petal(context: Ctx, r: number) {
  context.moveTo(0, 0);
  context.quadraticCurveTo(r * 0.38, -r * 0.5, 0, -r);
  context.quadraticCurveTo(-r * 0.38, -r * 0.5, 0, 0);
}

function lotus(context: Ctx, x: number, y: number, r: number, count = 8) {
  context.save();
  context.translate(x, y);
  context.beginPath();
  for (let k = 0; k < count; k++) { context.rotate((Math.PI * 2) / count); petal(context, r); }
  context.restore();
}

type Look = {
  backdrop: (context: Ctx, width: number, height: number, box: Box) => void;
  name: (context: Ctx, name: string, box: Box) => void;
  /** Colour of the human line and gift tag. */
  line: string;
  band: { band: string; ask: string; site: string };
};

// বর্ণপরিচয়: each letter on its own painted primer tile.
const tilePalette = ["#e4572e", "#f0a202", "#2b7bb9", "#3a9a5b", "#d64161", "#14908f"];
const tile: Look = {
  backdrop(context, width, height) {
    context.fillStyle = "#f8eed6";
    context.fillRect(0, 0, width, height);
    const rand = random(11);
    context.fillStyle = "rgba(120,80,30,0.07)";
    for (let i = 0; i < (width * height) / 900; i++) context.fillRect(rand() * width, rand() * height, 2, 2);
    // The primer page's printed edge: a run of small coloured squares.
    const inset = 34, step = 30;
    let k = 0;
    for (let x = inset; x < width - inset; x += step) {
      context.fillStyle = tilePalette[k++ % tilePalette.length]; context.fillRect(x, inset, 18, 18);
      context.fillStyle = tilePalette[k % tilePalette.length]; context.fillRect(x, height - inset - 18, 18, 18);
    }
    for (let y = inset + step; y < height - inset - step; y += step) {
      context.fillStyle = tilePalette[k++ % tilePalette.length]; context.fillRect(inset, y, 18, 18);
      context.fillStyle = tilePalette[k % tilePalette.length]; context.fillRect(width - inset - 18, y, 18, 18);
    }
  },
  name(context, name, box) {
    const words = name.split(" ").map(letters);
    const gap = 0.12, wordGap = 0.45;
    const units = (row: string[][]) => row.reduce((sum, word) => sum + word.length * (1 + gap), 0) + (row.length - 1) * wordGap - gap;
    const sizeFor = (rows: string[][][]) => Math.min(box.h / (rows.length * 1.25), box.w / Math.max(...rows.map(units)), 300);
    let rows = [words];
    if (words.length > 1 && sizeFor(rows) < box.h * 0.3) {
      // Two rows, split where the letter counts come out most even.
      const total = words.reduce((sum, word) => sum + word.length, 0);
      let cut = 1, run = 0, bestDiff = Infinity;
      words.forEach((word, index) => { run += word.length; const diff = Math.abs(total - 2 * run); if (index < words.length - 1 && diff < bestDiff) { bestDiff = diff; cut = index + 1; } });
      const split = [words.slice(0, cut), words.slice(cut)];
      if (sizeFor(split) > sizeFor(rows)) rows = split;
    }
    const s = sizeFor(rows);
    let index = 0;
    rows.forEach((row, r) => {
      let x = box.x + (box.w - units(row) * s) / 2;
      const y = box.y + box.h / 2 + (r - (rows.length - 1) / 2) * s * 1.25 - s / 2;
      row.forEach(word => {
        for (const letter of word) {
          const color = tilePalette[index % tilePalette.length];
          const tilt = ((index * 37) % 7 - 3) * 0.018;
          context.save();
          context.translate(x + s / 2, y + s / 2);
          context.rotate(tilt);
          context.shadowColor = "rgba(60,30,0,0.28)"; context.shadowBlur = s * 0.1; context.shadowOffsetY = s * 0.06;
          context.fillStyle = color;
          roundedRect(context, -s / 2, -s / 2, s, s, s * 0.14); context.fill();
          context.shadowColor = "transparent";
          // Painted-wood edge: darker bottom lip, a lighter inner rim.
          context.fillStyle = "rgba(0,0,0,0.18)";
          roundedRect(context, -s / 2, s * 0.36, s, s * 0.14, s * 0.07); context.fill();
          context.strokeStyle = "rgba(255,255,255,0.45)"; context.lineWidth = Math.max(2, s * 0.025);
          roundedRect(context, -s * 0.42, -s * 0.42, s * 0.84, s * 0.8, s * 0.1); context.stroke();
          let size = s * 0.62;
          context.font = font(size);
          while (context.measureText(letter).width > s * 0.76 && size > 12) { size -= 2; context.font = font(size); }
          context.textAlign = "center"; context.textBaseline = "middle";
          context.fillStyle = "rgba(0,0,0,0.22)";
          context.fillText(letter, s * 0.025, s * 0.06);
          context.fillStyle = "#fffaf0";
          context.fillText(letter, 0, s * 0.035);
          context.restore();
          x += s * (1 + gap);
          index++;
        }
        x += s * (wordGap - gap);
      });
    });
  },
  line: "#7a2e1b",
  band: { band: "#2b3a67", ask: "#f0b13a", site: "#ffffff" },
};

// উঠোনের আলপনা: white rice-paste lines on a red clay floor.
const PASTE = "#fdf5e6";
const alpana: Look = {
  backdrop(context, width, height) {
    const floor = context.createRadialGradient(width / 2, height / 2, 40, width / 2, height / 2, Math.max(width, height) * 0.7);
    floor.addColorStop(0, "#c45a36"); floor.addColorStop(1, "#8a321d");
    context.fillStyle = floor;
    context.fillRect(0, 0, width, height);
    const rand = random(23);
    context.fillStyle = "rgba(60,15,0,0.12)";
    for (let i = 0; i < (width * height) / 700; i++) context.fillRect(rand() * width, rand() * height, 3, 2);
    context.strokeStyle = PASTE; context.fillStyle = PASTE; context.lineCap = "round";
    context.lineWidth = 8; roundedRect(context, 44, 44, width - 88, height - 88, 22); context.stroke();
    context.lineWidth = 3; roundedRect(context, 76, 76, width - 152, height - 152, 14); context.stroke();
    // Dots between the two lines, and a lotus on every corner.
    for (let x = 100; x < width - 90; x += 30) { context.beginPath(); context.arc(x, 60, 4, 0, Math.PI * 2); context.arc(x, height - 60, 4, 0, Math.PI * 2); context.fill(); }
    for (let y = 100; y < height - 90; y += 30) { context.beginPath(); context.arc(60, y, 4, 0, Math.PI * 2); context.arc(width - 60, y, 4, 0, Math.PI * 2); context.fill(); }
    for (const [x, y] of [[60, 60], [width - 60, 60], [60, height - 60], [width - 60, height - 60]]) {
      context.fillStyle = "#a8432a"; context.beginPath(); context.arc(x, y, 50, 0, Math.PI * 2); context.fill();
      lotus(context, x, y, 44); context.lineWidth = 4; context.stroke();
      context.fillStyle = PASTE; context.beginPath(); context.arc(x, y, 8, 0, Math.PI * 2); context.fill();
    }
    // A big faint lotus under the name.
    context.globalAlpha = 0.1;
    lotus(context, width / 2, height / 2, Math.min(width, height) * 0.36, 12); context.lineWidth = 10; context.stroke();
    context.globalAlpha = 1;
  },
  name(context, name, box) {
    const fit = fitName(context, name, { ...box, h: box.h * 0.82 });
    context.font = font(fit.size);
    const under = eachLine(context, fit, { ...box, h: box.h * 0.82 }, (line, x, y) => {
      context.fillStyle = "rgba(70,15,0,0.35)"; context.fillText(line, x + fit.size * 0.03, y + fit.size * 0.05);
      context.fillStyle = PASTE; context.fillText(line, x, y);
    });
    // A row of dots under the name with a three-petal sprig at each end, the way alpana borders end.
    const width = widest(context, fit), cx = box.x + box.w / 2, y = under + 14;
    const r = Math.max(4, fit.size * 0.035);
    context.fillStyle = PASTE;
    for (let x = cx - width / 2 + r * 6; x <= cx + width / 2 - r * 6; x += r * 5) { context.beginPath(); context.arc(x, y, r, 0, Math.PI * 2); context.fill(); }
    for (const side of [-1, 1]) {
      context.save(); context.translate(cx + side * (width / 2 - r * 2), y); context.rotate(side * Math.PI / 2);
      context.beginPath(); petal(context, r * 5); context.rotate(0.7); petal(context, r * 3.5); context.rotate(-1.4); petal(context, r * 3.5); context.fill();
      context.restore();
    }
  },
  line: "#ffe7c2",
  band: { band: "#5b1d10", ask: "#ffd9a0", site: "#ffffff" },
};

// বিয়ের কার্ড: embossed gold on deep maroon, double gold border, corner paisleys.
function goldGradient(context: Ctx, top: number, bottom: number) {
  const gradient = context.createLinearGradient(0, top, 0, bottom);
  gradient.addColorStop(0, "#fff1b8"); gradient.addColorStop(0.35, "#e2b448"); gradient.addColorStop(0.55, "#a8761c"); gradient.addColorStop(0.8, "#f3d17a"); gradient.addColorStop(1, "#9a6a16");
  return gradient;
}
const gold: Look = {
  backdrop(context, width, height) {
    const card = context.createRadialGradient(width / 2, height * 0.45, 60, width / 2, height / 2, Math.max(width, height) * 0.75);
    card.addColorStop(0, "#861a2e"); card.addColorStop(1, "#3c0611");
    context.fillStyle = card;
    context.fillRect(0, 0, width, height);
    context.fillStyle = "rgba(255,214,130,0.07)";
    for (let y = 30; y < height; y += 60) for (let x = (y / 60) % 2 ? 60 : 30; x < width; x += 60) {
      context.save(); context.translate(x, y); context.rotate(Math.PI / 4); context.fillRect(-6, -6, 12, 12); context.restore();
    }
    const edge = goldGradient(context, 0, height);
    context.strokeStyle = edge;
    context.lineWidth = 7; context.strokeRect(40, 40, width - 80, height - 80);
    context.lineWidth = 2; context.strokeRect(62, 62, width - 124, height - 124);
    // A gold fan in each corner: three arcs and a bead.
    context.lineWidth = 3;
    for (const [x, y, turn] of [[62, 62, 0], [width - 62, 62, 1], [width - 62, height - 62, 2], [62, height - 62, 3]]) {
      context.save(); context.translate(x, y); context.rotate(turn * Math.PI / 2);
      for (const r of [34, 52, 70]) { context.beginPath(); context.arc(0, 0, r, 0, Math.PI / 2); context.stroke(); }
      context.fillStyle = edge; context.beginPath(); context.arc(18, 18, 8, 0, Math.PI * 2); context.fill();
      context.restore();
    }
  },
  name(context, name, box) {
    const inner = { ...box, h: box.h * 0.84 };
    const fit = fitName(context, name, inner, 700);
    context.font = font(fit.size, 700);
    context.lineJoin = "round";
    const under = eachLine(context, fit, inner, (line, x, y) => {
      context.save();
      context.shadowColor = "rgba(20,0,5,0.6)"; context.shadowBlur = fit.size * 0.06; context.shadowOffsetY = fit.size * 0.04;
      context.fillStyle = goldGradient(context, y - fit.size * 0.55, y + fit.size * 0.45);
      context.fillText(line, x, y);
      context.restore();
    });
    // Divider: line, diamond, line.
    const width = Math.min(widest(context, fit, 700), box.w) * 0.7, cx = box.x + box.w / 2, y = under + 28;
    context.strokeStyle = context.fillStyle = goldGradient(context, y - 12, y + 12);
    context.lineWidth = 3;
    context.beginPath(); context.moveTo(cx - width / 2, y); context.lineTo(cx - 22, y); context.moveTo(cx + 22, y); context.lineTo(cx + width / 2, y); context.stroke();
    context.save(); context.translate(cx, y); context.rotate(Math.PI / 4); context.fillRect(-9, -9, 18, 18); context.restore();
  },
  line: "#f5d98b",
  band: { band: "#2a040b", ask: "#f5d98b", site: "#ffffff" },
};

// স্লেটে চক: a child's school slate in its wooden frame, the name in chalk.
const CHALK = "#f2efe3";
const chalk: Look = {
  backdrop(context, width, height) {
    context.fillStyle = "#9c6b3d";
    context.fillRect(0, 0, width, height);
    const rand = random(37);
    context.strokeStyle = "rgba(60,30,10,0.25)"; context.lineWidth = 2;
    for (let i = 0; i < 40; i++) {
      const y = rand() * height;
      context.beginPath(); context.moveTo(0, y); context.bezierCurveTo(width * 0.3, y + rand() * 12 - 6, width * 0.6, y + rand() * 12 - 6, width, y + rand() * 10 - 5); context.stroke();
    }
    const inset = 46;
    const slate = context.createRadialGradient(width / 2, height / 2, 40, width / 2, height / 2, Math.max(width, height) * 0.65);
    slate.addColorStop(0, "#36463f"); slate.addColorStop(1, "#202a26");
    context.fillStyle = "rgba(0,0,0,0.35)"; roundedRect(context, inset - 4, inset - 2, width - inset * 2 + 8, height - inset * 2 + 8, 14); context.fill();
    context.fillStyle = slate; roundedRect(context, inset, inset, width - inset * 2, height - inset * 2, 12); context.fill();
    // Old rub-outs: big soft smears of chalk dust.
    for (let i = 0; i < 16; i++) {
      context.fillStyle = `rgba(240,240,230,${0.02 + rand() * 0.035})`;
      context.beginPath(); context.ellipse(inset + rand() * (width - inset * 2), inset + rand() * (height - inset * 2), 60 + rand() * 160, 20 + rand() * 50, rand() * 0.6 - 0.3, 0, Math.PI * 2); context.fill();
    }
  },
  name(context, name, box) {
    const inner = { ...box, y: box.y + box.h * 0.1, h: box.h * 0.78 };
    const fit = fitName(context, name, inner, 600);
    // Letter onto a layer first, then rub tiny holes in it so it reads as chalk, not paint.
    const layer = document.createElement("canvas");
    layer.width = context.canvas.width; layer.height = context.canvas.height;
    const chalkContext = layer.getContext("2d")!;
    chalkContext.setTransform(context.getTransform());
    chalkContext.font = font(fit.size, 600);
    chalkContext.fillStyle = CHALK; chalkContext.strokeStyle = CHALK;
    const under = eachLine(chalkContext, fit, inner, (line, x, y) => chalkContext.fillText(line, x, y));
    chalkContext.font = font(Math.min(54, box.h * 0.12), 600);
    chalkContext.textAlign = "left"; chalkContext.globalAlpha = 0.8;
    chalkContext.fillText("নাম:", box.x, box.y + box.h * 0.04);
    chalkContext.globalAlpha = 1;
    // A wobbly underline, the way it's done in class.
    const width = widest(chalkContext, fit, 600), cx = box.x + box.w / 2, y = under + 16;
    chalkContext.lineWidth = Math.max(4, fit.size * 0.035); chalkContext.lineCap = "round";
    chalkContext.beginPath();
    for (let x = -width / 2; x <= width / 2; x += 12) chalkContext[x === -width / 2 ? "moveTo" : "lineTo"](cx + x, y + Math.sin(x / 40) * 5);
    chalkContext.stroke();
    chalkContext.globalCompositeOperation = "destination-out";
    const rand = random(41);
    chalkContext.fillStyle = "#000";
    for (let i = 0; i < 9000; i++) {
      chalkContext.globalAlpha = 0.3 + rand() * 0.7;
      chalkContext.fillRect(box.x - 20 + rand() * (box.w + 40), box.y - 40 + rand() * (box.h + 60), 1 + rand() * 3, 1 + rand() * 2);
    }
    context.save(); context.setTransform(1, 0, 0, 1, 0, 0); context.drawImage(layer, 0, 0); context.restore();
  },
  line: "#e9e4d0",
  band: { band: "#4f3218", ask: "#f3e3b3", site: "#ffffff" },
};

// নিয়ন সাইন: pink glass tubes on a brick wall at night, in a cyan frame.
const neon: Look = {
  backdrop(context, width, height) {
    context.fillStyle = "#110b15";
    context.fillRect(0, 0, width, height);
    const rand = random(53), brickH = 54, brickW = 120;
    for (let row = 0; row * brickH < height; row++) for (let x = row % 2 ? -brickW / 2 : 0; x < width; x += brickW) {
      const shade = 28 + Math.floor(rand() * 14);
      context.fillStyle = `rgb(${shade + 8},${shade - 6},${shade + 10})`;
      context.fillRect(x + 3, row * brickH + 3, brickW - 6, brickH - 6);
    }
    const dark = context.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.2, width / 2, height / 2, Math.max(width, height) * 0.7);
    dark.addColorStop(0, "rgba(10,5,12,0.1)"); dark.addColorStop(1, "rgba(10,5,12,0.85)");
    context.fillStyle = dark; context.fillRect(0, 0, width, height);
    context.lineJoin = "round";
    for (const [color, lineWidth, blur] of [["#29e3ff", 9, 34], ["#29e3ff", 9, 18], ["#dcfcff", 3, 0]] as const) {
      context.save(); context.shadowColor = "#29e3ff"; context.shadowBlur = blur; context.strokeStyle = color; context.lineWidth = lineWidth;
      roundedRect(context, 64, 64, width - 128, height - 128, 44); context.stroke(); context.restore();
    }
  },
  name(context, name, box) {
    const fit = fitName(context, name, box, 700, box.h * 0.5);
    context.font = font(fit.size, 700);
    context.lineJoin = "round";
    eachLine(context, fit, box, (line, x, y) => {
      context.save();
      context.fillStyle = "rgba(255,60,160,0.14)"; context.fillText(line, x, y);
      context.shadowColor = "#ff2d95"; context.strokeStyle = "#ff4fae"; context.lineWidth = Math.max(3, fit.size * 0.055);
      context.shadowBlur = fit.size * 0.4; context.strokeText(line, x, y);
      context.shadowBlur = fit.size * 0.15; context.strokeText(line, x, y);
      context.shadowBlur = 0; context.strokeStyle = "#ffe6f3"; context.lineWidth = Math.max(1.5, fit.size * 0.02); context.strokeText(line, x, y);
      context.restore();
    });
  },
  line: "#ffc4e3",
  band: { band: "#0a060d", ask: "#29e3ff", site: "#ffd6ec" },
};

// নকশি কাঁথা: indigo appliqué letters with cream running stitches on cotton, kantha stitch rows round the edge.
const INDIGO = "#243f7a", KANTHA_RED = "#b8322a", MUSTARD = "#d39b2a", COTTON = "#f4ead6";
const nakshi: Look = {
  backdrop(context, width, height, box) {
    context.fillStyle = COTTON;
    context.fillRect(0, 0, width, height);
    context.fillStyle = "rgba(120,90,50,0.05)";
    for (let y = 0; y < height; y += 6) context.fillRect(0, y, width, 1);
    for (let x = 0; x < width; x += 6) context.fillRect(x, 0, 1, height);
    context.lineCap = "round";
    [[KANTHA_RED, 40], [INDIGO, 60], [MUSTARD, 80]].forEach(([color, inset], row) => {
      context.strokeStyle = color as string; context.lineWidth = 6; context.setLineDash([22, 14]); context.lineDashOffset = row * 12;
      roundedRect(context, inset as number, inset as number, width - 2 * (inset as number), height - 2 * (inset as number), 18); context.stroke();
    });
    // A stitched flower on each corner and a stitched medallion behind the name.
    context.setLineDash([12, 9]); context.lineWidth = 5; context.strokeStyle = KANTHA_RED;
    for (const [x, y] of [[130, 130], [width - 130, 130], [130, height - 130], [width - 130, height - 130]]) { lotus(context, x, y, 38, 6); context.stroke(); }
    context.strokeStyle = "rgba(184,50,42,0.35)";
    const r = Math.min(box.h * 0.62, width * 0.4);
    context.beginPath(); context.arc(width / 2, box.y + box.h / 2, r, 0, Math.PI * 2); context.stroke();
    context.beginPath(); context.arc(width / 2, box.y + box.h / 2, r + 22, 0, Math.PI * 2); context.stroke();
    context.setLineDash([]); context.lineDashOffset = 0;
  },
  name(context, name, box) {
    const fit = fitName(context, name, box);
    context.font = font(fit.size);
    context.lineJoin = "round";
    eachLine(context, fit, box, (line, x, y) => {
      context.save();
      context.shadowColor = "rgba(40,30,10,0.25)"; context.shadowOffsetY = fit.size * 0.025; context.shadowBlur = fit.size * 0.03;
      // The cloth patch reaches a little past each letter, so the running stitch along the letter's edge sits wholly on indigo.
      context.fillStyle = context.strokeStyle = INDIGO; context.lineWidth = fit.size * 0.11;
      context.strokeText(line, x, y); context.fillText(line, x, y);
      context.restore();
      context.strokeStyle = COTTON; context.lineWidth = Math.max(1.5, fit.size * 0.02); context.lineCap = "round";
      context.setLineDash([fit.size * 0.045, fit.size * 0.035]); context.strokeText(line, x, y); context.setLineDash([]);
    });
  },
  line: "#8a2a22",
  band: { band: INDIGO, ask: "#f2c25b", site: "#ffffff" },
};

// লাল-সবুজ (১৬ ডিসেম্বর): the flag's green field and red disc, the name across it in white.
const bijoy: Look = {
  backdrop(context, width, height, box) {
    context.fillStyle = "#006a4e";
    context.fillRect(0, 0, width, height);
    const light = context.createLinearGradient(0, 0, width, height);
    light.addColorStop(0, "rgba(255,255,255,0.1)"); light.addColorStop(1, "rgba(0,0,0,0.15)");
    context.fillStyle = light; context.fillRect(0, 0, width, height);
    // The disc sits a little towards the hoist, as on the flag.
    context.fillStyle = "#f42a41";
    context.beginPath(); context.arc(width * 0.45, box.y + box.h / 2, Math.min(box.h * 0.6, width * 0.32), 0, Math.PI * 2); context.fill();
  },
  name(context, name, box) {
    const fit = fitName(context, name, box);
    context.font = font(fit.size);
    eachLine(context, fit, box, (line, x, y) => {
      context.save();
      context.shadowColor = "rgba(0,30,15,0.5)"; context.shadowBlur = fit.size * 0.08; context.shadowOffsetY = fit.size * 0.04;
      context.fillStyle = "#ffffff"; context.fillText(line, x, y);
      context.restore();
    });
  },
  line: "#ffffff",
  band: { band: "#00402f", ask: "#ffd166", site: "#ffffff" },
};

// একুশের সাদা-কালো: sober. White letters on black over a faint line drawing of the Shaheed Minar and the sun behind it.
const ekushe: Look = {
  backdrop(context, width, height, box) {
    context.fillStyle = "#111111";
    context.fillRect(0, 0, width, height);
    const base = Math.min(height - 70, box.y + box.h + 40), tall = box.h * 0.9, cx = width / 2, unit = tall / 6;
    context.strokeStyle = "rgba(255,255,255,0.16)"; context.lineWidth = 4; context.lineJoin = "round";
    context.beginPath(); context.arc(cx, base - tall * 0.7, tall * 0.42, 0, Math.PI * 2); context.stroke();
    context.beginPath();
    context.moveTo(cx - unit * 6, base); context.lineTo(cx + unit * 6, base);
    // Middle pillar with its bowed head, then two smaller pairs on each side.
    context.moveTo(cx - unit, base); context.lineTo(cx - unit, base - tall * 0.78); context.lineTo(cx - unit * 0.6, base - tall); context.lineTo(cx + unit * 1.6, base - tall); context.lineTo(cx + unit, base - tall * 0.78); context.lineTo(cx + unit, base);
    context.moveTo(cx - unit * 0.33, base); context.lineTo(cx - unit * 0.33, base - tall * 0.78);
    context.moveTo(cx + unit * 0.33, base); context.lineTo(cx + unit * 0.33, base - tall * 0.78);
    for (const side of [-1, 1]) for (const [offset, height2] of [[2.2, 0.62], [3.6, 0.5]]) {
      const x = cx + side * unit * offset;
      context.moveTo(x - unit * 0.4, base); context.lineTo(x - unit * 0.4, base - tall * height2); context.lineTo(x + unit * 0.4, base - tall * height2); context.lineTo(x + unit * 0.4, base);
    }
    context.stroke();
  },
  name(context, name, box) {
    const inner = { ...box, h: box.h * 0.86 };
    const fit = fitName(context, name, inner, 700);
    context.font = font(fit.size, 700);
    eachLine(context, fit, inner, (line, x, y) => { context.fillStyle = "#f4f4f4"; context.fillText(line, x, y); });
  },
  line: "#d9d9d9",
  band: { band: "#000000", ask: "#ffffff", site: "#bdbdbd" },
};

export const looks: Record<StyleId, Look> = { tile, alpana, gold, chalk, neon, nakshi, bijoy, ekushe };

// Chip previews redraw on every keystroke: keep their small backgrounds instead of repainting textures eight times.
const backdropCache = new Map<string, HTMLCanvasElement>();

function paintBackdrop(context: Ctx, look: Look, style: StyleId, surface: Surface, scale: number) {
  const { width } = sizes[surface];
  const { box, content } = layouts[surface];
  if (scale === 1) { look.backdrop(context, width, content, box); return; }
  const key = `${style}|${surface}|${scale}`;
  let cached = backdropCache.get(key);
  if (!cached) {
    cached = document.createElement("canvas");
    cached.width = Math.round(width * scale); cached.height = Math.round(content * scale);
    const cacheContext = cached.getContext("2d")!;
    cacheContext.scale(scale, scale);
    look.backdrop(cacheContext, width, content, box);
    backdropCache.set(key, cached);
  }
  context.drawImage(cached, 0, 0, width, content);
}

/** Draws the design onto a canvas: the stage view, a chip preview (scale < 1), or a share card. */
export function drawDesign(canvas: HTMLCanvasElement, design: Design, surface: Surface, site: string, scale = 1) {
  const { width, height } = sizes[surface];
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  context.scale(scale, scale);
  const look = looks[design.style] ?? tile;
  const { box } = layouts[surface];
  const name = cleanName(design.name) || PLACEHOLDER_NAME;
  const from = cleanName(design.from);

  context.save(); paintBackdrop(context, look, design.style, surface, scale); context.restore();
  context.save(); look.name(context, name, box); context.restore();
  context.textBaseline = "alphabetic";

  if (surface === "stage") return;
  if (surface === "square") {
    // Kept inside the circle a profile picture is cropped to.
    fitText(context, [{ text: siteLabel(site), color: look.line, weight: 600 }], width / 2, height - 112, 26, 380, "center");
    return;
  }
  const story = surface === "story";
  if (from) fitText(context, [{ text: `উপহার · ${possessive(from)} পক্ষ থেকে`, color: look.line, weight: 700, display: true }], width / 2, story ? 400 : 200, story ? 44 : 40, 760, "center");
  const lineSize = story ? 54 : 50;
  context.font = font(lineSize, 700);
  const lines = wrapText(context, humanLine({ name, style: design.style }), 820, 2);
  const lineTop = layouts[surface].content - (story ? 250 : 190);
  lines.forEach((line, index) => fitText(context, [{ text: line, color: look.line, weight: 700, display: true }], width / 2, lineTop + index * lineSize * 1.45, lineSize, 860, "center"));
  drawFooterBand(context, surface, ASK, site, look.band);
}

export function designBlob(design: Design, format: Format, site: string) {
  return renderCard(canvas => drawDesign(canvas, design, format, site));
}
