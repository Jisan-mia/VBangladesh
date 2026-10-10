import { DISPLAY_FONT, cardSizes, drawFooterBand, fitText, renderCard, wrapText, type CardFormat, type Photo } from "../../../shared/card-canvas";
import type { BackdropId, Card } from "./studio";

// Every backdrop is an original painting drawn here in code: no real monuments, no copied studio art.
type Ctx = CanvasRenderingContext2D;
type Painter = (ctx: Ctx, w: number, h: number, random: () => number) => void;
const TAU = Math.PI * 2;

/** Deterministic "random", so a print looks the same every time it's drawn. */
function seeded(seed: number) {
  return () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function vertical(ctx: Ctx, y0: number, y1: number, stops: string[]) {
  const gradient = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach((color, index) => gradient.addColorStop(index / (stops.length - 1), color));
  return gradient;
}

function polygon(ctx: Ctx, points: number[][], color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath(); ctx.fill();
}

function cloud(ctx: Ctx, x: number, y: number, s: number) {
  const puffs = [[-0.55, 0.1, 0.32], [-0.2, -0.12, 0.42], [0.25, -0.2, 0.46], [0.65, 0.02, 0.34], [0.05, 0.12, 0.4]];
  for (const [color, lift] of [["#d4e2ee", 0.07], ["#ffffff", 0]] as const) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (const [dx, dy, r] of puffs) { ctx.moveTo(x + dx * s + r * s, y + (dy + lift) * s); ctx.arc(x + dx * s, y + (dy + lift) * s, r * s, 0, TAU); }
    ctx.fill();
  }
}

/** Loose strokes over a flat colour: the backdrop painter's wide brush, never a smooth digital gradient. */
function brushwork(ctx: Ctx, w: number, h: number, random: () => number, count: number, color: string, alpha: number) {
  ctx.save();
  ctx.lineCap = "round"; ctx.strokeStyle = color;
  for (let index = 0; index < count; index++) {
    const x = random() * w, y = random() * h, length = w * (0.06 + random() * 0.14);
    ctx.globalAlpha = alpha * (0.4 + random() * 0.6);
    ctx.lineWidth = w * (0.008 + random() * 0.014);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + length / 2, y + (random() - 0.5) * w * 0.03, x + length, y + (random() - 0.5) * w * 0.015); ctx.stroke();
  }
  ctx.restore();
}

function sun(ctx: Ctx, x: number, y: number, r: number, core: string, halo: string) {
  const glow = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 3);
  glow.addColorStop(0, halo); glow.addColorStop(1, halo + "00");
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, r * 3, 0, TAU); ctx.fill();
  ctx.fillStyle = core; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
}

/** A mountain range from (x, y) fractions; with `snow`, peaks above that line get white caps. */
function range(ctx: Ctx, w: number, h: number, base: number, points: number[][], color: string, snow?: number) {
  ctx.save();
  ctx.beginPath(); ctx.moveTo(0, base);
  for (const [x, y] of points) ctx.lineTo(x * w, y * h);
  ctx.lineTo(w, base); ctx.closePath();
  ctx.fillStyle = color; ctx.fill();
  ctx.clip();
  // the shadowed face to the right of every peak
  points.forEach(([x, y], index) => {
    const next = points[index + 1], previous = points[index - 1];
    if (!next || !previous || y > next[1] || y > previous[1]) return;
    polygon(ctx, [[x * w, y * h], [next[0] * w, next[1] * h], [next[0] * w, base], [x * w + (next[0] - x) * w * 0.25, base]], "rgba(20,28,70,.2)");
  });
  if (snow !== undefined) {
    ctx.fillStyle = "#f5f8fc";
    ctx.beginPath(); ctx.moveTo(0, 0);
    for (let step = 0; step <= 30; step++) ctx.lineTo((step / 30) * w, (snow + (step % 2 ? 0.035 : -0.005)) * h);
    ctx.lineTo(w, 0); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function pine(ctx: Ctx, x: number, base: number, height: number, color: string) {
  ctx.fillStyle = "#4a3020";
  ctx.fillRect(x - height * 0.03, base - height * 0.14, height * 0.06, height * 0.14);
  for (let tier = 0; tier < 3; tier++) {
    const apex = base - height + tier * height * 0.24, half = height * (0.13 + tier * 0.06);
    polygon(ctx, [[x, apex], [x + half, apex + height * 0.42], [x - half, apex + height * 0.42]], color);
  }
}

function palm(ctx: Ctx, x: number, base: number, height: number, lean: number, trunk = "#7a5232", leaf = "#2f7a3a") {
  const topX = x + lean * height, topY = base - height;
  ctx.strokeStyle = trunk; ctx.lineCap = "round"; ctx.lineWidth = height * 0.045;
  ctx.beginPath(); ctx.moveTo(x, base); ctx.quadraticCurveTo(x + lean * height * 0.2, base - height * 0.5, topX, topY); ctx.stroke();
  ctx.fillStyle = leaf;
  for (let index = 0; index < 7; index++) {
    const angle = -Math.PI * 0.95 + (index / 6) * Math.PI * 0.9 + (index % 2) * 0.12, length = height * (0.32 + (index % 3) * 0.05);
    ctx.save(); ctx.translate(topX, topY); ctx.rotate(angle);
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(length * 0.5, -length * 0.22, length, length * 0.18);
    ctx.quadraticCurveTo(length * 0.5, length * 0.02, 0, 0);
    ctx.fill(); ctx.restore();
  }
  ctx.fillStyle = "#5b3b20";
  for (const [dx, dy] of [[-0.02, 0.03], [0.02, 0.035], [0, 0.05]]) { ctx.beginPath(); ctx.arc(topX + dx * height, topY + dy * height, height * 0.025, 0, TAU); ctx.fill(); }
}

function flower(ctx: Ctx, x: number, y: number, r: number, petal: string, middle = "#ffd23a") {
  ctx.fillStyle = petal;
  for (let index = 0; index < 5; index++) {
    const angle = (index / 5) * TAU;
    ctx.beginPath(); ctx.arc(x + Math.cos(angle) * r * 0.6, y + Math.sin(angle) * r * 0.6, r * 0.55, 0, TAU); ctx.fill();
  }
  ctx.fillStyle = middle; ctx.beginPath(); ctx.arc(x, y, r * 0.4, 0, TAU); ctx.fill();
}

const lake: Painter = (ctx, w, h, random) => {
  const horizon = h * 0.6;
  ctx.fillStyle = vertical(ctx, 0, horizon, ["#3d8ccd", "#8cc6e8", "#e4f1ec"]); ctx.fillRect(0, 0, w, horizon);
  brushwork(ctx, w, horizon * 0.6, random, 24, "#ffffff", 0.16);
  cloud(ctx, w * 0.17, h * 0.11, w * 0.09); cloud(ctx, w * 0.82, h * 0.07, w * 0.07);
  const far = [[0, 0.4], [0.1, 0.26], [0.2, 0.35], [0.34, 0.13], [0.47, 0.31], [0.6, 0.19], [0.74, 0.33], [0.88, 0.16], [1, 0.3]];
  const near = [[0, 0.5], [0.14, 0.43], [0.3, 0.52], [0.5, 0.45], [0.7, 0.53], [0.86, 0.44], [1, 0.5]];
  range(ctx, w, h, horizon, far, "#7385bf", 0.25);
  range(ctx, w, h, horizon, near, "#3f7b68");
  ctx.fillStyle = vertical(ctx, horizon, h, ["#86c1e1", "#3b84b8", "#235d8c"]); ctx.fillRect(0, horizon, w, h - horizon);
  // the mountains again, upside down and faint: a still lake
  ctx.save();
  ctx.beginPath(); ctx.rect(0, horizon, w, h - horizon); ctx.clip();
  ctx.globalAlpha = 0.2; ctx.translate(0, horizon * 2); ctx.scale(1, -1);
  range(ctx, w, h, horizon, far, "#c7d3ee");
  ctx.restore();
  for (const [x, size, color] of [[0.03, 0.12, "#1f573b"], [0.09, 0.16, "#2a6a47"], [0.15, 0.1, "#1f573b"], [0.8, 0.11, "#2a6a47"], [0.87, 0.17, "#1f573b"], [0.95, 0.13, "#2a6a47"]] as const) pine(ctx, x * w, horizon + h * 0.012, size * h, color);
  ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineCap = "round";
  for (let index = 0; index < 22; index++) {
    const y = horizon + h * 0.04 + random() * (h - horizon), x = random() * w, length = w * (0.03 + random() * 0.08);
    ctx.lineWidth = h * 0.003 + random() * h * 0.003;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + length, y); ctx.stroke();
  }
  // a swan, because every lake backdrop had one
  const sx = w * 0.27, sy = h * 0.8, s = w * 0.05;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath(); ctx.moveTo(sx - s, sy); ctx.quadraticCurveTo(sx - s * 0.2, sy + s * 0.5, sx + s * 0.7, sy); ctx.quadraticCurveTo(sx + s * 0.1, sy - s * 0.5, sx - s, sy); ctx.fill();
  ctx.strokeStyle = "#ffffff"; ctx.lineWidth = s * 0.18;
  ctx.beginPath(); ctx.moveTo(sx + s * 0.45, sy - s * 0.1); ctx.bezierCurveTo(sx + s * 0.9, sy - s * 0.6, sx + s * 0.3, sy - s * 1.0, sx + s * 0.6, sy - s * 1.2); ctx.stroke();
  polygon(ctx, [[sx + s * 0.62, sy - s * 1.26], [sx + s * 0.95, sy - s * 1.16], [sx + s * 0.62, sy - s * 1.1]], "#f08a24");
};

const garden: Painter = (ctx, w, h, random) => {
  const horizon = h * 0.46;
  ctx.fillStyle = vertical(ctx, 0, horizon, ["#6fb6e3", "#bde1f0", "#f7efcf"]); ctx.fillRect(0, 0, w, horizon);
  brushwork(ctx, w, horizon * 0.6, random, 20, "#ffffff", 0.16);
  cloud(ctx, w * 0.15, h * 0.1, w * 0.08); cloud(ctx, w * 0.88, h * 0.14, w * 0.06);
  for (let index = 0; index <= 12; index++) {
    ctx.fillStyle = index % 2 ? "#4f8f4c" : "#62a256";
    ctx.beginPath(); ctx.arc((index / 12) * w, horizon - h * 0.02, w * (0.06 + random() * 0.04), 0, TAU); ctx.fill();
  }
  ctx.fillStyle = vertical(ctx, horizon - h * 0.02, h, ["#86c564", "#4f9b46", "#3a7d37"]); ctx.fillRect(0, horizon - h * 0.02, w, h);
  // the white garden arch frames whoever stands in the middle
  const ax = w * 0.6, base = horizon + h * 0.08, half = w * 0.27, top = h * 0.03;
  ctx.strokeStyle = "#f8f4ea"; ctx.lineWidth = w * 0.03; ctx.lineCap = "butt";
  ctx.beginPath(); ctx.moveTo(ax - half, base); ctx.lineTo(ax - half, top + half); ctx.arc(ax, top + half, half, Math.PI, TAU); ctx.lineTo(ax + half, base); ctx.stroke();
  ctx.strokeStyle = "#d8cfbd"; ctx.lineWidth = w * 0.008;
  ctx.beginPath(); ctx.moveTo(ax - half * 0.9, base); ctx.lineTo(ax - half * 0.9, top + half); ctx.arc(ax, top + half, half * 0.9, Math.PI, TAU); ctx.lineTo(ax + half * 0.9, base); ctx.stroke();
  // climbing roses: 30% up each post, 40% over the curve
  for (let index = 0; index < 34; index++) {
    const u = random(), angle = Math.PI + ((u - 0.3) / 0.4) * Math.PI, post = top + half + (u < 0.3 ? u / 0.3 : (u - 0.7) / 0.3) * (base - top - half);
    const x = u < 0.3 ? ax - half : u > 0.7 ? ax + half : ax + Math.cos(angle) * half;
    const y = u < 0.3 || u > 0.7 ? post : top + half + Math.sin(angle) * half;
    ctx.fillStyle = "#3f8a3a"; ctx.beginPath(); ctx.ellipse(x + w * 0.012, y + h * 0.008, w * 0.014, h * 0.007, 0.6, 0, TAU); ctx.fill();
    flower(ctx, x, y, w * 0.011, index % 3 ? "#e8283c" : "#ff7aa8");
  }
  // a gravel path to the arch
  polygon(ctx, [[w * 0.53, horizon + h * 0.06], [w * 0.67, horizon + h * 0.06], [w * 0.9, h], [w * 0.3, h]], "#ecdfbf");
  const petals = ["#e8283c", "#ff7aa8", "#ffd23a", "#ffffff", "#ff8c2a"];
  for (let row = 0; row < 8; row++) {
    const y = horizon + h * (0.03 + row * 0.07), r = w * (0.008 + row * 0.004), pathLeft = w * (0.53 - (row / 8) * 0.25), pathRight = w * (0.67 + (row / 8) * 0.25);
    for (let x = r + random() * r * 2; x < w; x += r * 3.2) {
      if (x > pathLeft - r && x < pathRight + r) continue;
      flower(ctx, x, y + (random() - 0.5) * r * 2, r, petals[Math.floor(random() * petals.length)]);
    }
  }
};

function airplane(ctx: Ctx, x: number, y: number, length: number, angle: number) {
  const L = length, H = length * 0.12;
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
  polygon(ctx, [[L * 0.06, -H * 0.2], [-L * 0.2, -H * 1.9], [-L * 0.29, -H * 1.9], [-L * 0.13, -H * 0.2]], "#c3ccd8");
  polygon(ctx, [[-L * 0.36, -H * 0.35], [-L * 0.46, -H * 1.85], [-L * 0.53, -H * 1.85], [-L * 0.5, -H * 0.25]], "#e9732a");
  ctx.fillStyle = "#ffffff";
  ctx.beginPath(); ctx.moveTo(-L * 0.49, -H * 1.3); ctx.lineTo(-L * 0.465, -H * 1.0); ctx.lineTo(-L * 0.5, -H * 0.85); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-L * 0.52, -H * 0.3); ctx.lineTo(L * 0.36, -H * 0.5);
  ctx.bezierCurveTo(L * 0.5, -H * 0.5, L * 0.53, H * 0.15, L * 0.42, H * 0.45);
  ctx.lineTo(-L * 0.34, H * 0.5);
  ctx.quadraticCurveTo(-L * 0.47, H * 0.45, -L * 0.52, -H * 0.3);
  ctx.closePath();
  ctx.fillStyle = "#f8f9fb"; ctx.fill();
  ctx.save(); ctx.clip();
  ctx.fillStyle = "#d3dae4"; ctx.fillRect(-L * 0.6, H * 0.18, L * 1.2, H);
  ctx.fillStyle = "#2a5db0"; ctx.fillRect(-L * 0.6, -H * 0.04, L * 1.2, H * 0.14);
  ctx.fillStyle = "#e9732a"; ctx.fillRect(-L * 0.6, H * 0.12, L * 1.2, H * 0.05);
  ctx.restore();
  ctx.fillStyle = "#2a3550";
  for (let index = 0; index < 15; index++) { ctx.beginPath(); ctx.roundRect(-L * 0.3 + index * L * 0.042, -H * 0.3, L * 0.02, H * 0.18, L * 0.01); ctx.fill(); }
  polygon(ctx, [[L * 0.4, -H * 0.36], [L * 0.46, -H * 0.3], [L * 0.47, -H * 0.12], [L * 0.39, -H * 0.16]], "#2a3550");
  polygon(ctx, [[-L * 0.4, H * 0.05], [-L * 0.52, H * 0.55], [-L * 0.47, H * 0.55], [-L * 0.33, H * 0.1]], "#c3ccd8");
  polygon(ctx, [[L * 0.06, H * 0.25], [-L * 0.22, H * 2.3], [-L * 0.32, H * 2.3], [-L * 0.14, H * 0.3]], "#e6eaf0");
  ctx.fillStyle = "#cfd6df"; ctx.beginPath(); ctx.ellipse(-L * 0.08, H * 1.05, L * 0.06, H * 0.24, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = "#59647a"; ctx.beginPath(); ctx.ellipse(-L * 0.025, H * 1.05, L * 0.012, H * 0.2, 0, 0, TAU); ctx.fill();
  ctx.restore();
}

const plane: Painter = (ctx, w, h, random) => {
  ctx.fillStyle = vertical(ctx, 0, h, ["#1d5fb0", "#4f9ad8", "#a8d8f2", "#e6f4fa"]); ctx.fillRect(0, 0, w, h);
  sun(ctx, w * 0.1, h * 0.08, w * 0.05, "#fffbe8", "#fff3c4");
  brushwork(ctx, w, h * 0.7, random, 26, "#ffffff", 0.14);
  cloud(ctx, w * 0.88, h * 0.36, w * 0.07); cloud(ctx, w * 0.1, h * 0.52, w * 0.06);
  for (let index = 0; index <= 8; index++) cloud(ctx, (index / 8) * w, h * (0.86 + random() * 0.05), w * (0.13 + random() * 0.05));
  airplane(ctx, w * 0.37, h * 0.17, w * 0.62, -0.16);
};

function house(ctx: Ctx, x: number, top: number, width: number, height: number) {
  const roof = height * 0.28, wall = top + roof;
  ctx.fillStyle = "#f6efe0"; ctx.fillRect(x, wall, width, height - roof);
  ctx.fillStyle = "#e3d6bd"; ctx.fillRect(x, wall + (height - roof) * 0.48, width, height * 0.025);
  polygon(ctx, [[x - width * 0.06, wall], [x + width * 0.18, top], [x + width * 0.82, top], [x + width * 1.06, wall]], "#c4452c");
  ctx.strokeStyle = "#9c3320"; ctx.lineWidth = Math.max(1, width * 0.008);
  for (let index = 1; index < 4; index++) { const y = top + (roof * index) / 4; ctx.beginPath(); ctx.moveTo(x + width * (0.18 - 0.06 * index), y); ctx.lineTo(x + width * (0.82 + 0.06 * index), y); ctx.stroke(); }
  const windowW = width * 0.13, windowH = (height - roof) * 0.28;
  for (const row of [0, 1]) for (let column = 0; column < 4; column++) {
    if (row === 1 && (column === 1 || column === 2)) continue;
    const wx = x + width * (0.08 + column * 0.23), wy = wall + (height - roof) * (0.1 + row * 0.5);
    ctx.fillStyle = "#ffffff"; ctx.fillRect(wx - 3, wy - 3, windowW + 6, windowH + 6);
    ctx.fillStyle = "#3b6f8f"; ctx.fillRect(wx, wy, windowW, windowH);
    ctx.fillStyle = "#ffffff"; ctx.fillRect(wx + windowW / 2 - 1.5, wy, 3, windowH);
  }
  ctx.fillStyle = "#7a4a2a"; ctx.fillRect(x + width * 0.42, wall + (height - roof) * 0.58, width * 0.16, (height - roof) * 0.42);
  ctx.fillStyle = "#ffffff";
  for (const column of [0.36, 0.62]) ctx.fillRect(x + width * column, wall + (height - roof) * 0.52, width * 0.025, (height - roof) * 0.48);
}

const villa: Painter = (ctx, w, h, random) => {
  const horizon = h * 0.5;
  ctx.fillStyle = vertical(ctx, 0, horizon, ["#5fa9dd", "#b5dbef", "#f9e2b6"]); ctx.fillRect(0, 0, w, horizon);
  brushwork(ctx, w, horizon * 0.6, random, 20, "#ffffff", 0.16);
  cloud(ctx, w * 0.74, h * 0.09, w * 0.08);
  range(ctx, w, h, horizon, [[0, 0.44], [0.2, 0.38], [0.45, 0.43], [0.7, 0.36], [1, 0.42]], "#93b9a7");
  ctx.fillStyle = vertical(ctx, horizon, h, ["#8bc46c", "#5aa24c", "#3f8a3c"]); ctx.fillRect(0, horizon, w, h - horizon);
  house(ctx, w * 0.02, h * 0.13, w * 0.36, h * 0.4);
  polygon(ctx, [[w * 0.18, horizon + h * 0.03], [w * 0.24, horizon + h * 0.03], [w * 0.5, h], [w * 0.08, h]], "#e9dcbc");
  for (let index = 0; index < 9; index++) {
    const x = w * (0.01 + index * 0.05), y = horizon + h * 0.03;
    ctx.fillStyle = "#3f8a3c"; ctx.beginPath(); ctx.arc(x, y, w * 0.032, 0, TAU); ctx.fill();
    flower(ctx, x + w * 0.008, y - h * 0.01, w * 0.009, index % 2 ? "#ff7aa8" : "#ffd23a");
  }
  palm(ctx, w * 0.95, horizon + h * 0.14, h * 0.6, -0.14);
  palm(ctx, w * 0.42, horizon + h * 0.02, h * 0.34, 0.08);
};

const sea: Painter = (ctx, w, h, random) => {
  const horizon = h * 0.44;
  ctx.fillStyle = vertical(ctx, 0, horizon, ["#3a5aa8", "#a46aa0", "#f08a6a", "#ffd27a"]); ctx.fillRect(0, 0, w, horizon);
  sun(ctx, w * 0.22, h * 0.24, w * 0.08, "#fff1b0", "#ffd98a");
  brushwork(ctx, w, horizon * 0.8, random, 20, "#ffe2c0", 0.14);
  ctx.fillStyle = vertical(ctx, horizon, h, ["#2f78a8", "#1f5b8a", "#1a4b75"]); ctx.fillRect(0, horizon, w, h - horizon);
  ctx.lineCap = "round";
  for (let index = 0; index < 30; index++) {
    const y = horizon + h * 0.01 + random() * h * 0.3, spread = (y - horizon) / h, x = w * 0.22 + (random() - 0.5) * w * (0.1 + spread * 0.9), length = w * (0.02 + random() * 0.06);
    ctx.strokeStyle = random() > 0.4 ? "rgba(255,214,140,.75)" : "rgba(255,255,255,.5)"; ctx.lineWidth = h * 0.004;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + length, y); ctx.stroke();
  }
  // sand with a line of surf
  const shore = h * 0.78;
  ctx.fillStyle = vertical(ctx, shore, h, ["#f1d7a0", "#e2bd7e"]);
  ctx.beginPath(); ctx.moveTo(0, shore);
  for (let step = 0; step <= 10; step++) ctx.quadraticCurveTo((step - 0.5) / 10 * w, shore - h * 0.02, (step / 10) * w, shore);
  ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.lineWidth = h * 0.008;
  ctx.beginPath(); ctx.moveTo(0, shore);
  for (let step = 0; step <= 10; step++) ctx.quadraticCurveTo((step - 0.5) / 10 * w, shore - h * 0.02, (step / 10) * w, shore);
  ctx.stroke();
  ctx.strokeStyle = "#3a2a3a"; ctx.lineWidth = w * 0.004;
  for (const [x, y, s] of [[0.1, 0.1, 0.025], [0.17, 0.07, 0.018], [0.36, 0.13, 0.02]]) {
    ctx.beginPath(); ctx.moveTo((x - s) * w, y * h); ctx.quadraticCurveTo((x - s / 2) * w, (y - s * 0.8) * h, x * w, y * h); ctx.quadraticCurveTo((x + s / 2) * w, (y - s * 0.8) * h, (x + s) * w, y * h); ctx.stroke();
  }
  palm(ctx, w * 1.0, h * 0.9, h * 0.75, -0.3, "#5b3b26", "#24603a");
};

const painters: Record<BackdropId, Painter> = { lake, garden, plane, villa, sea };

export function paintBackdrop(ctx: Ctx, id: BackdropId, w: number, h: number) {
  painters[id](ctx, w, h, seeded(id.charCodeAt(0) * 977 + id.length));
}

/** The studio floor in front of the hanging cloth, with a rug that has seen a thousand family photos. */
function floor(ctx: Ctx, w: number, h: number, hem: number) {
  ctx.fillStyle = vertical(ctx, hem, h, ["#6b4528", "#4a2d19"]); ctx.fillRect(0, hem, w, h - hem);
  ctx.strokeStyle = "rgba(0,0,0,.18)"; ctx.lineWidth = 2;
  for (let y = hem + (h - hem) * 0.3; y < h; y += (h - hem) * 0.28) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  const rugTop = hem + (h - hem) * 0.22;
  polygon(ctx, [[w * 0.06, rugTop], [w * 0.66, rugTop], [w * 0.74, h + 2], [-w * 0.02, h + 2]], "#a3312a");
  ctx.strokeStyle = "#f1d9a0"; ctx.lineWidth = w * 0.006;
  ctx.beginPath(); ctx.moveTo(w * 0.09, rugTop + h * 0.015); ctx.lineTo(w * 0.63, rugTop + h * 0.015); ctx.lineTo(w * 0.69, h); ctx.moveTo(w * 0.03, h); ctx.lineTo(w * 0.09, rugTop + h * 0.015); ctx.stroke();
  for (let index = 0; index < 7; index++) {
    const x = w * (0.13 + index * 0.075), y = rugTop + (h - rugTop) * 0.6, s = w * 0.016;
    polygon(ctx, [[x, y - s], [x + s, y], [x, y + s], [x - s, y]], "#f2b84b");
  }
  const shade = ctx.createLinearGradient(0, hem, 0, hem + h * 0.035);
  shade.addColorStop(0, "rgba(20,10,0,.5)"); shade.addColorStop(1, "rgba(20,10,0,0)");
  ctx.fillStyle = shade; ctx.fillRect(0, hem, w, h * 0.035);
  ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, hem);
  for (let step = 1; step <= 8; step++) ctx.quadraticCurveTo((step - 0.5) / 8 * w, hem + h * 0.006, (step / 8) * w, hem);
  ctx.stroke();
}

/** A white plaster column with a vase of very plastic flowers on top. */
function pillar(ctx: Ctx, w: number, h: number) {
  const cx = w * 0.15, half = w * 0.065, top = h * 0.6, base = h * 0.95;
  ctx.fillStyle = "rgba(20,10,0,.35)"; ctx.beginPath(); ctx.ellipse(cx + half * 0.4, base, half * 1.8, h * 0.012, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = "#e4dccb"; ctx.fillRect(cx - half * 1.4, base - h * 0.035, half * 2.8, h * 0.035);
  ctx.fillStyle = "#efe8d9"; ctx.fillRect(cx - half * 1.2, base - h * 0.058, half * 2.4, h * 0.023);
  const shaft = ctx.createLinearGradient(cx - half, 0, cx + half, 0);
  shaft.addColorStop(0, "#c9bfab"); shaft.addColorStop(0.35, "#faf6ee"); shaft.addColorStop(0.7, "#e6decd"); shaft.addColorStop(1, "#b3a892");
  ctx.fillStyle = shaft; ctx.fillRect(cx - half, top + h * 0.04, half * 2, base - h * 0.058 - top - h * 0.04);
  ctx.strokeStyle = "rgba(110,90,60,.28)"; ctx.lineWidth = Math.max(1.5, w * 0.003);
  for (let index = 1; index < 6; index++) { const x = cx - half + (index * half * 2) / 6; ctx.beginPath(); ctx.moveTo(x, top + h * 0.045); ctx.lineTo(x, base - h * 0.062); ctx.stroke(); }
  ctx.fillStyle = "#f3eee2"; ctx.fillRect(cx - half * 1.45, top, half * 2.9, h * 0.024);
  ctx.fillStyle = "#e2d9c6"; ctx.fillRect(cx - half * 1.2, top + h * 0.024, half * 2.4, h * 0.016);
  ctx.strokeStyle = "#b8ad97"; ctx.lineWidth = Math.max(2, w * 0.004);
  for (const side of [-1, 1]) { ctx.beginPath(); ctx.arc(cx + side * half * 1.25, top + h * 0.022, h * 0.014, 0, TAU); ctx.stroke(); }
  // the vase
  const neck = top - h * 0.1;
  ctx.fillStyle = "#2f63a8";
  ctx.beginPath();
  ctx.moveTo(cx - half * 0.45, neck);
  ctx.bezierCurveTo(cx - half * 0.5, neck + h * 0.03, cx - half * 1.05, neck + h * 0.045, cx - half * 0.8, top - h * 0.012);
  ctx.lineTo(cx - half * 0.5, top); ctx.lineTo(cx + half * 0.5, top); ctx.lineTo(cx + half * 0.8, top - h * 0.012);
  ctx.bezierCurveTo(cx + half * 1.05, neck + h * 0.045, cx + half * 0.5, neck + h * 0.03, cx + half * 0.45, neck);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#f4efe4"; ctx.fillRect(cx - half * 0.9, neck + h * 0.052, half * 1.8, h * 0.012);
  ctx.fillStyle = "rgba(255,255,255,.45)"; ctx.beginPath(); ctx.ellipse(cx - half * 0.4, neck + h * 0.04, half * 0.12, h * 0.02, 0, 0, TAU); ctx.fill();
  // stems, leaves, then flowers in colours no real garden has
  const heads = [[-0.95, -0.2, "#e8283c"], [-0.35, -0.27, "#ffd23a"], [0.3, -0.25, "#ff6fa8"], [0.95, -0.17, "#ff8c2a"], [-0.6, -0.12, "#ffffff"], [0.62, -0.1, "#e8283c"], [0, -0.17, "#e8283c"]] as const;
  ctx.strokeStyle = "#2e7d32"; ctx.lineWidth = Math.max(2, w * 0.004);
  for (const [dx, dy] of heads) { ctx.beginPath(); ctx.moveTo(cx, neck); ctx.quadraticCurveTo(cx + dx * half * 0.5, neck + dy * h * 0.3, cx + dx * half * 1.6, neck + dy * h * 0.55); ctx.stroke(); }
  ctx.fillStyle = "#3a9a3e";
  for (const [dx, dy, angle] of [[-1.3, -0.05, -0.6], [1.3, -0.04, 0.6], [-0.7, -0.09, -1.1], [0.8, -0.08, 1.0], [0, -0.06, 0]]) {
    ctx.save(); ctx.translate(cx + dx * half, neck + dy * h); ctx.rotate(angle);
    ctx.beginPath(); ctx.ellipse(0, 0, half * 0.5, half * 0.18, 0, 0, TAU); ctx.fill(); ctx.restore();
  }
  for (const [dx, dy, color] of heads) {
    const x = cx + dx * half * 1.6, y = neck + dy * h * 0.55, r = half * 0.42;
    if (color === "#e8283c") {
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      ctx.strokeStyle = "#9e1325"; ctx.lineWidth = Math.max(1.5, r * 0.14);
      ctx.beginPath(); ctx.arc(x, y, r * 0.55, 0.4, 4.6); ctx.stroke();
      ctx.beginPath(); ctx.arc(x + r * 0.1, y, r * 0.25, 2, 6); ctx.stroke();
    } else flower(ctx, x, y, r, color, color === "#ffd23a" ? "#e2700c" : "#ffd23a");
    ctx.fillStyle = "rgba(255,255,255,.6)"; ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.14, 0, TAU); ctx.fill();
  }
}

export const portraitOval = (w: number, h: number) => ({ cx: w * 0.6, cy: h * 0.46, rx: w * 0.26, ry: h * 0.3 });

/** Head and shoulders in shadow under the studio lamp, with a side parting: the sample before a photo is added. */
function silhouette(ctx: Ctx, w: number, h: number) {
  const light = ctx.createRadialGradient(w * 0.5, h * 0.4, 0, w * 0.5, h * 0.5, h * 0.62);
  light.addColorStop(0, "#fff4dc"); light.addColorStop(1, "#e6c49a");
  ctx.fillStyle = light; ctx.fillRect(0, 0, w, h);
  const x = w / 2, neck = h * 0.68, skin = "#5a3a2c";
  ctx.fillStyle = "#3c2a3f";
  ctx.beginPath();
  ctx.moveTo(x - w * 0.62, h * 1.02);
  ctx.bezierCurveTo(x - w * 0.6, neck + h * 0.1, x - w * 0.3, neck + h * 0.02, x - w * 0.11, neck);
  ctx.lineTo(x + w * 0.11, neck);
  ctx.bezierCurveTo(x + w * 0.3, neck + h * 0.02, x + w * 0.6, neck + h * 0.1, x + w * 0.62, h * 1.02);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = skin;
  ctx.fillRect(x - w * 0.085, neck - h * 0.1, w * 0.17, h * 0.12);
  ctx.beginPath(); ctx.ellipse(x, h * 0.44, w * 0.21, h * 0.2, 0, 0, TAU); ctx.fill();
  polygon(ctx, [[x - w * 0.12, neck - h * 0.005], [x, neck + h * 0.09], [x - w * 0.2, neck + h * 0.05]], "#f4ead8");
  polygon(ctx, [[x + w * 0.12, neck - h * 0.005], [x, neck + h * 0.09], [x + w * 0.2, neck + h * 0.05]], "#f4ead8");
  // hair oiled and combed to one side, the way everyone went to the studio
  ctx.fillStyle = "#24160f";
  ctx.beginPath();
  ctx.moveTo(x - w * 0.214, h * 0.47);
  ctx.ellipse(x, h * 0.43, w * 0.226, h * 0.205, 0, Math.PI * 1.06, Math.PI * 1.94);
  ctx.lineTo(x + w * 0.214, h * 0.45);
  ctx.quadraticCurveTo(x + w * 0.16, h * 0.31, x - w * 0.06, h * 0.315);
  ctx.quadraticCurveTo(x - w * 0.17, h * 0.33, x - w * 0.19, h * 0.47);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "#6b4a3a"; ctx.lineWidth = Math.max(2, w * 0.01); ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(x - w * 0.1, h * 0.25); ctx.quadraticCurveTo(x - w * 0.12, h * 0.28, x - w * 0.13, h * 0.33); ctx.stroke();
  ctx.strokeStyle = "rgba(255,226,190,.35)"; ctx.lineWidth = Math.max(2, w * 0.014);
  ctx.beginPath(); ctx.ellipse(x, h * 0.44, w * 0.21, h * 0.2, 0, -0.9, 0.6); ctx.stroke();
}

/** The photo (or the sample) in an oval that fades into the painted backdrop, so no cut-out is needed. */
function portrait(ctx: Ctx, w: number, h: number, photo?: Photo | null) {
  const { cx, cy, rx, ry } = portraitOval(w, h);
  const layer = document.createElement("canvas");
  layer.width = Math.ceil(rx * 2); layer.height = Math.ceil(ry * 2);
  const art = layer.getContext("2d")!;
  if (photo) {
    // Cover the oval, cropping a little above centre: faces sit in the top half of most phone photos.
    const scale = Math.max(layer.width / photo.width, layer.height / photo.height);
    const dw = photo.width * scale, dh = photo.height * scale;
    art.drawImage(photo, (layer.width - dw) / 2, (layer.height - dh) * 0.3, dw, dh);
  } else silhouette(art, layer.width, layer.height);
  art.globalCompositeOperation = "destination-in";
  art.translate(rx, ry); art.scale(1, ry / rx);
  const fade = art.createRadialGradient(0, 0, 0, 0, 0, rx);
  fade.addColorStop(0, "#000"); fade.addColorStop(0.6, "#000"); fade.addColorStop(1, "rgba(0,0,0,0)");
  art.fillStyle = fade; art.fillRect(-rx, -rx, rx * 2, rx * 2);
  ctx.drawImage(layer, cx - rx, cy - ry);
}

let grainTile: HTMLCanvasElement | null = null;
function grain() {
  if (grainTile) return grainTile;
  grainTile = document.createElement("canvas");
  grainTile.width = grainTile.height = 256;
  const tile = grainTile.getContext("2d")!;
  const image = tile.createImageData(256, 256), random = seeded(90);
  for (let index = 0; index < image.data.length; index += 4) {
    const value = 128 + (random() - 0.5) * 150;
    image.data[index] = image.data[index + 1] = image.data[index + 2] = value; image.data[index + 3] = 255;
  }
  tile.putImageData(image, 0, 0);
  return grainTile;
}

/** Warm, faded 90s film: less colour, a cream cast, lifted brown blacks, grain and dark corners. All on the phone, no pixel loops per draw. */
export function filmGrade(ctx: Ctx, w: number, h: number, withGrain = true) {
  ctx.save();
  ctx.globalCompositeOperation = "saturation"; ctx.globalAlpha = 0.22; ctx.fillStyle = "#808080"; ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = "multiply"; ctx.globalAlpha = 1; ctx.fillStyle = "#ffe9c4"; ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = "screen"; ctx.globalAlpha = 0.5; ctx.fillStyle = "#4a2c16"; ctx.fillRect(0, 0, w, h);
  if (withGrain) {
    ctx.globalCompositeOperation = "overlay"; ctx.globalAlpha = 0.16;
    ctx.fillStyle = ctx.createPattern(grain(), "repeat")!; ctx.fillRect(0, 0, w, h);
  }
  ctx.globalCompositeOperation = "multiply"; ctx.globalAlpha = 1;
  const corners = ctx.createRadialGradient(w / 2, h * 0.45, Math.min(w, h) * 0.38, w / 2, h / 2, Math.hypot(w, h) * 0.56);
  corners.addColorStop(0, "#ffffff"); corners.addColorStop(1, "#b8875f");
  ctx.fillStyle = corners; ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

const SEGMENTS: Record<string, string> = { "0": "abcdef", "1": "bc", "2": "abged", "3": "abgcd", "4": "fgbc", "5": "afgcd", "6": "afgedc", "7": "abc", "8": "abcdefg", "9": "abcdfg" };

/** Seven-segment digits glowing orange, like the date a point-and-shoot burned into the film. Right-aligned at (right, baseline). */
function dateStamp(ctx: Ctx, text: string, right: number, baseline: number, size: number) {
  const width = size * 0.52, thick = size * 0.13, gap = size * 0.2, apostrophe = size * 0.25, space = size * 0.4;
  const advance = (char: string) => char === "'" ? apostrophe : char === " " ? space : width + gap;
  let x = right - [...text].reduce((sum, char) => sum + advance(char), 0);
  ctx.save();
  ctx.translate(0, baseline); ctx.transform(1, 0, -0.1, 1, 0, 0);
  ctx.fillStyle = "#ffb04a"; ctx.shadowColor = "#ff5a00"; ctx.shadowBlur = size * 0.35;
  const bar = (left: number, top: number, w: number, h: number) => { ctx.beginPath(); ctx.roundRect(left, top, w, h, thick / 2); ctx.fill(); };
  for (const char of text) {
    const y = -size;
    if (char === "'") bar(x, y, thick, size * 0.32);
    for (const segment of SEGMENTS[char] ?? "") {
      const across = width - thick * 1.2, down = size / 2 - thick * 0.9;
      if (segment === "a") bar(x + thick * 0.6, y, across, thick);
      if (segment === "g") bar(x + thick * 0.6, y + size / 2 - thick / 2, across, thick);
      if (segment === "d") bar(x + thick * 0.6, y + size - thick, across, thick);
      if (segment === "f") bar(x, y + thick * 0.6, thick, down);
      if (segment === "b") bar(x + width - thick, y + thick * 0.6, thick, down);
      if (segment === "e") bar(x, y + size / 2 + thick * 0.3, thick, down);
      if (segment === "c") bar(x + width - thick, y + size / 2 + thick * 0.3, thick, down);
    }
    x += advance(char);
  }
  ctx.restore();
}

/** The violet rubber stamp the studio pressed on every print, a little worn. */
function rubberStamp(ctx: Ctx, cx: number, cy: number, w: number, h: number, angle: number) {
  const ink = "#5c3d8e";
  const pad = document.createElement("canvas");
  pad.width = Math.ceil(w + 20); pad.height = Math.ceil(h + 20);
  const stamp = pad.getContext("2d")!;
  stamp.translate(pad.width / 2, pad.height / 2);
  stamp.strokeStyle = ink;
  stamp.lineWidth = 5; stamp.beginPath(); stamp.ellipse(0, 0, w / 2, h / 2, 0, 0, TAU); stamp.stroke();
  stamp.lineWidth = 2; stamp.beginPath(); stamp.ellipse(0, 0, w / 2 - 9, h / 2 - 9, 0, 0, TAU); stamp.stroke();
  fitText(stamp, [{ text: "একটুখানি স্টুডিও", color: ink, weight: 800, display: true }], 0, -h * 0.02, h * 0.3, w * 0.72, "center");
  fitText(stamp, [{ text: "রঙিন ছবি · ২ ঘণ্টায় ডেলিভারি", color: ink, weight: 600 }], 0, h * 0.26, h * 0.15, w * 0.66, "center");
  stamp.globalCompositeOperation = "destination-out";
  const random = seeded(7);
  for (let index = 0; index < 140; index++) { stamp.globalAlpha = 0.3 + random() * 0.7; stamp.beginPath(); stamp.arc((random() - 0.5) * w, (random() - 0.5) * h, 0.6 + random() * 2.2, 0, TAU); stamp.fill(); }
  ctx.save();
  ctx.translate(cx, cy); ctx.rotate(angle); ctx.globalAlpha = 0.85;
  ctx.drawImage(pad, -pad.width / 2, -pad.height / 2);
  ctx.restore();
}

const BORDER = 30, BOTTOM = 150, PEN = "#22409a";

/** One white-bordered print, drawn with its top-left at (0, 0) of the current transform. */
function drawPrint(ctx: Ctx, card: Card, w: number, h: number, photo?: Photo | null) {
  const imageW = w - BORDER * 2, imageH = h - BORDER - BOTTOM;
  ctx.save();
  ctx.shadowColor = "rgba(70,40,10,.38)"; ctx.shadowBlur = 36; ctx.shadowOffsetY = 14;
  ctx.fillStyle = "#fbf8f0"; ctx.fillRect(0, 0, w, h);
  ctx.restore();
  ctx.save();
  ctx.translate(BORDER, BORDER);
  ctx.beginPath(); ctx.rect(0, 0, imageW, imageH); ctx.clip();
  const hem = imageH * 0.86;
  paintBackdrop(ctx, card.backdrop.id, imageW, hem + 4);
  floor(ctx, imageW, imageH, hem);
  portrait(ctx, imageW, imageH, photo);
  pillar(ctx, imageW, imageH);
  filmGrade(ctx, imageW, imageH);
  // the faint sheen of a lustre print
  const sheen = ctx.createLinearGradient(0, 0, imageW, imageH);
  sheen.addColorStop(0.36, "rgba(255,255,255,0)"); sheen.addColorStop(0.44, "rgba(255,255,255,.09)"); sheen.addColorStop(0.52, "rgba(255,255,255,0)");
  ctx.fillStyle = sheen; ctx.fillRect(0, 0, imageW, imageH);
  if (card.stamp) dateStamp(ctx, card.stamp, imageW * 0.95, imageH * 0.955, imageW * 0.052);
  ctx.restore();
  // pen on the white border
  const maxWidth = w - 40 - 236, top = BORDER + imageH;
  ctx.save();
  ctx.translate(40, top); ctx.rotate(-0.012);
  if (card.name) {
    fitText(ctx, [{ text: card.name, color: PEN, weight: 700, display: true }], 0, 60, 48, maxWidth);
    fitText(ctx, [{ text: card.line, color: PEN, weight: 500, display: true }], 0, 112, 36, maxWidth);
  } else {
    // one line if it stays big enough to read on a phone, otherwise two
    ctx.font = `500 34px ${DISPLAY_FONT}`;
    const lines = ctx.measureText(card.line).width <= maxWidth ? [card.line] : wrapText(ctx, card.line, maxWidth, 2);
    lines.forEach((line, index) => fitText(ctx, [{ text: line, color: PEN, weight: 500, display: true }], 0, (lines.length === 1 ? 90 : 66) + index * 50, lines.length === 1 ? 44 : 40, maxWidth));
  }
  ctx.restore();
  rubberStamp(ctx, w - 96, h - 40, 240, 112, 0.12);
}

/** The studio's paper envelope the print came home in. */
function envelope(ctx: Ctx, width: number, height: number, header: number, services: number) {
  ctx.fillStyle = "#f2d78f"; ctx.fillRect(0, 0, width, height);
  const random = seeded(31);
  ctx.strokeStyle = "#8a5a1e"; ctx.lineWidth = 1.5;
  for (let index = 0; index < 220; index++) {
    const x = random() * width, y = random() * height, length = 10 + random() * 40;
    ctx.globalAlpha = 0.05 + random() * 0.07;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + length, y + (random() - 0.5) * 6); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  const red = "#b2301d";
  ctx.strokeStyle = red; ctx.lineWidth = 4; ctx.strokeRect(26, 26, width - 52, height - 52);
  ctx.lineWidth = 1.5; ctx.strokeRect(36, 36, width - 72, height - 72);
  fitText(ctx, [{ text: "এখানে রঙিন ছবি তোলা হয়", color: red, weight: 800, display: true }], width / 2, header, 58, 780, "center");
  fitText(ctx, [{ text: "পাসপোর্ট সাইজ · বিয়ে-জন্মদিন · ফিল্ম ওয়াশ", color: "#7a3a1c", weight: 600 }], width / 2, services, 26, 760, "center");
  for (const x of [96, width - 96]) camera(ctx, x, header - 20, red);
}

function camera(ctx: Ctx, x: number, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.roundRect(x - 34, y - 20, 68, 44, 8); ctx.fill();
  ctx.fillRect(x - 24, y - 28, 18, 10);
  ctx.fillStyle = "#f2d78f"; ctx.beginPath(); ctx.arc(x + 2, y + 2, 14, 0, TAU); ctx.fill();
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x + 2, y + 2, 8, 0, TAU); ctx.fill();
}

const layouts = {
  feed: { header: 86, services: 128, print: { x: 120, y: 158, w: 840, h: 1060 } },
  story: { header: 326, services: 372, print: { x: 90, y: 414, w: 900, h: 1194 } },
} as const;

export function drawCard(canvas: HTMLCanvasElement, card: Card, format: CardFormat, site: string, photo?: Photo | null) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  envelope(ctx, width, height, layout.header, layout.services);
  const { x, y, w, h } = layout.print;
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2); ctx.rotate(-0.02); ctx.translate(-w / 2, -h / 2);
  drawPrint(ctx, card, w, h, photo);
  ctx.restore();
  drawFooterBand(ctx, format, "তোমার ছোটবেলার স্টুডিওর ছবিটা কোথায়?", site, { band: "#3b2416", ask: "#ffcf6e", site: "#ffffff" });
}

/** A small painted swatch of a backdrop for its chip. */
export function drawSwatch(canvas: HTMLCanvasElement, id: BackdropId) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  paintBackdrop(ctx, id, canvas.width, canvas.height);
  filmGrade(ctx, canvas.width, canvas.height, false);
}

export const cardBlob = (card: Card, format: CardFormat, site: string, photo?: Photo | null) => renderCard(canvas => drawCard(canvas, card, format, site, photo));
