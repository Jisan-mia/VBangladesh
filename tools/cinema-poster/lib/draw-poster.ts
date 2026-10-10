import { BODY_FONT, DISPLAY_FONT, cardSizes, drawFooterBand, fitText, renderCard, type CardFormat, type Photo } from "../../../shared/card-canvas";
import { NEW_FACES, type GenreId, type Poster } from "./poster";

type Ctx = CanvasRenderingContext2D;
type Ink = { fill: string; stroke: string; depth: string };
type Palette = { sky: [string, string, string]; ground: string; glow: string; title: Ink; name: Ink; ribbon: [string, string]; text: string };

// Flat, loud colours like enamel paint on a tin banner; each genre owns a sky.
const palettes: Record<GenreId, Palette> = {
  prem: { sky: ["#2b0a3d", "#a3165c", "#ff8a3d"], ground: "#1a0618", glow: "#ffd36e", title: { fill: "#ffe14d", stroke: "#5c0624", depth: "#22020f" }, name: { fill: "#ffffff", stroke: "#a3165c", depth: "#22020f" }, ribbon: ["#ffe14d", "#8e0f4c"], text: "#ffe9d6" },
  action: { sky: ["#1a0606", "#9a1010", "#ff6a00"], ground: "#120404", glow: "#ffd600", title: { fill: "#ffffff", stroke: "#b00f0f", depth: "#1f0303" }, name: { fill: "#ffd600", stroke: "#7a0a0a", depth: "#1f0303" }, ribbon: ["#ffd600", "#8e1111"], text: "#ffe2c4" },
  family: { sky: ["#0c3a2a", "#2f8040", "#f6b93b"], ground: "#06261b", glow: "#fff1a8", title: { fill: "#fff4c2", stroke: "#0e4a2a", depth: "#03170f" }, name: { fill: "#ffd23f", stroke: "#0e4a2a", depth: "#03170f" }, ribbon: ["#d7262e", "#fff4c2"], text: "#eaf6dc" },
  comedy: { sky: ["#0a2f7a", "#0b93b8", "#ffe24a"], ground: "#071d4d", glow: "#fff7b0", title: { fill: "#ff3d7f", stroke: "#ffffff", depth: "#071d4d" }, name: { fill: "#ffe24a", stroke: "#0a2f7a", depth: "#03112e" }, ribbon: ["#ff3d7f", "#ffffff"], text: "#e3f4ff" },
};

const layouts = {
  feed: { ribbon: 58, badge: [150, 292], hero: [742, 392, 205, 252], horizon: 700, title: 872, line: 950, castLabel: 1004, names: 1094, credits: 1152, strip: 1206 },
  story: { ribbon: 280, badge: [150, 520], hero: [742, 680, 225, 282], horizon: 1060, title: 1250, line: 1336, castLabel: 1398, names: 1492, credits: 1556, strip: 1612 },
} as const;
type Layout = (typeof layouts)[CardFormat];

/** Deterministic "random" so a poster looks the same every time it's drawn. */
function seeded(seed: number) {
  return () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function sky(ctx: Ctx, p: Palette, width: number, height: number, horizon: number, seed: number) {
  const gradient = ctx.createLinearGradient(0, 0, 0, horizon);
  gradient.addColorStop(0, p.sky[0]);
  gradient.addColorStop(0.55, p.sky[1]);
  gradient.addColorStop(1, p.sky[2]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, horizon);
  ctx.fillStyle = p.ground;
  ctx.fillRect(0, horizon, width, height - horizon);
  // Visible brush strokes: the banner painters' wide flat brushes, never a smooth digital gradient.
  const random = seeded(seed);
  ctx.lineCap = "round";
  for (let index = 0; index < 70; index++) {
    const x = random() * width, y = random() * horizon, length = 80 + random() * 260;
    ctx.globalAlpha = 0.05 + random() * 0.08;
    ctx.strokeStyle = random() > 0.5 ? "#ffffff" : "#000000";
    ctx.lineWidth = 18 + random() * 46;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + length / 2, y - 20 + random() * 40, x + length, y + (random() - 0.5) * 60); ctx.stroke();
  }
  ctx.strokeStyle = p.sky[1];
  for (let index = 0; index < 26; index++) {
    const x = random() * width, y = horizon + 60 + random() * (height - horizon - 60), length = 120 + random() * 300;
    ctx.globalAlpha = 0.06 + random() * 0.06;
    ctx.lineWidth = 24 + random() * 40;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + length / 2, y + (random() - 0.5) * 30, x + length, y + (random() - 0.5) * 40); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function glow(ctx: Ctx, x: number, y: number, radius: number, color: string) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, color + "00");
  ctx.fillStyle = gradient;
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
}

/** A painted head-and-shoulders silhouette; (x, y) is the base of the neck, s the head height. */
function bust(ctx: Ctx, x: number, y: number, s: number, fill: string, rim?: string, tilt = 0) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(tilt);
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(-1.05 * s, 1.2 * s);
  ctx.bezierCurveTo(-1.02 * s, 0.38 * s, -0.6 * s, 0.16 * s, -0.22 * s, 0.06 * s);
  ctx.lineTo(-0.17 * s, -0.2 * s); ctx.lineTo(0.17 * s, -0.2 * s); ctx.lineTo(0.22 * s, 0.06 * s);
  ctx.bezierCurveTo(0.6 * s, 0.16 * s, 1.02 * s, 0.38 * s, 1.05 * s, 1.2 * s);
  ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, -0.52 * s, 0.34 * s, 0.43 * s, 0, 0, Math.PI * 2); ctx.fill();
  if (rim) {
    ctx.strokeStyle = rim; ctx.lineWidth = Math.max(3, 0.05 * s); ctx.lineCap = "round";
    ctx.beginPath(); ctx.ellipse(0, -0.52 * s, 0.34 * s, 0.43 * s, 0, -1.2, 0.9); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0.3 * s, 0.12 * s); ctx.bezierCurveTo(0.7 * s, 0.22 * s, 0.98 * s, 0.45 * s, 1.02 * s, 1.1 * s); ctx.stroke();
  }
  ctx.restore();
}

function star(ctx: Ctx, x: number, y: number, outer: number, inner: number, points: number, rotation = 0) {
  ctx.beginPath();
  for (let index = 0; index < points * 2; index++) {
    const radius = index % 2 ? inner : outer, angle = rotation + (index * Math.PI) / points;
    ctx.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
  }
  ctx.closePath();
}

function heart(ctx: Ctx, x: number, y: number, s: number) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.3, y, x - s * 0.7, y - s * 0.95, x, y - s * 0.35);
  ctx.bezierCurveTo(x + s * 0.7, y - s * 0.95, x + s * 1.3, y, x, y + s * 0.9);
  ctx.closePath();
}

/** Big Bangla words the way banner painters did them: a deep extruded shadow, a thick outline, then the colour. */
function paint(ctx: Ctx, text: string, x: number, y: number, size: number, maxWidth: number, ink: Ink, rotate = 0, depth = 0.06) {
  const font = (px: number) => `800 ${px}px ${DISPLAY_FONT}`;
  ctx.font = font(size);
  while (ctx.measureText(text).width > maxWidth && size > 24) { size -= 2; ctx.font = font(size); }
  ctx.save();
  ctx.translate(x, y); ctx.rotate(rotate);
  ctx.textAlign = "center"; ctx.lineJoin = "round";
  const outline = Math.max(4, size * 0.13), steps = Math.round(size * depth);
  ctx.fillStyle = ink.depth; ctx.strokeStyle = ink.depth; ctx.lineWidth = outline;
  for (let step = steps; step > 0; step--) { ctx.strokeText(text, step * 0.8, step); ctx.fillText(text, step * 0.8, step); }
  ctx.strokeStyle = ink.stroke; ctx.lineWidth = outline;
  ctx.strokeText(text, 0, 0);
  const shine = ctx.createLinearGradient(0, -size * 0.8, 0, size * 0.1);
  shine.addColorStop(0, "#ffffff"); shine.addColorStop(0.35, ink.fill); shine.addColorStop(1, ink.fill);
  ctx.fillStyle = shine;
  ctx.fillText(text, 0, 0);
  ctx.restore();
  return size;
}

function ribbon(ctx: Ctx, text: string, p: Palette, top: number) {
  ctx.save();
  ctx.translate(60, top); ctx.rotate(-0.05);
  ctx.font = `800 58px ${DISPLAY_FONT}`;
  const width = Math.min(620, ctx.measureText(text).width + 90), height = 96;
  ctx.fillStyle = "#00000055";
  ctx.beginPath(); ctx.moveTo(8, 10); ctx.lineTo(width + 8, 10); ctx.lineTo(width - 22, height / 2 + 10); ctx.lineTo(width + 8, height + 10); ctx.lineTo(8, height + 10); ctx.lineTo(38, height / 2 + 10); ctx.closePath(); ctx.fill();
  ctx.fillStyle = p.ribbon[0];
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(width, 0); ctx.lineTo(width - 30, height / 2); ctx.lineTo(width, height); ctx.lineTo(0, height); ctx.lineTo(30, height / 2); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.translate(60, top); ctx.rotate(-0.05);
  fitText(ctx, [{ text, color: p.ribbon[1], weight: 800, display: true }], width / 2, 66, 58, width - 90, "center");
  ctx.restore();
}

/** The proud old "সম্পূর্ণ রঙিন" starburst. */
function badge(ctx: Ctx, x: number, y: number) {
  ctx.fillStyle = "#ffffff";
  star(ctx, x, y, 92, 76, 18, 0.1); ctx.fill();
  ctx.strokeStyle = "#d7262e"; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(x, y, 64, 0, Math.PI * 2); ctx.stroke();
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.18);
  fitText(ctx, [{ text: "সম্পূর্ণ", color: "#1d2b53", weight: 700 }], 0, -6, 30, 110, "center");
  fitText(ctx, [{ text: "রঙিন", color: "#d7262e", weight: 800, display: true }], 0, 38, 46, 110, "center");
  ctx.restore();
}

let grainTile: HTMLCanvasElement | null = null;
/** A fine speckle laid over everything so the colours sit like paint on rough cloth, not flat pixels. */
function grain(ctx: Ctx, width: number, height: number) {
  if (!grainTile) {
    grainTile = document.createElement("canvas");
    grainTile.width = grainTile.height = 160;
    const tile = grainTile.getContext("2d")!, image = tile.createImageData(160, 160), random = seeded(42);
    for (let index = 0; index < image.data.length; index += 4) { const v = random() * 255; image.data[index] = image.data[index + 1] = image.data[index + 2] = v; image.data[index + 3] = 255; }
    tile.putImageData(image, 0, 0);
  }
  ctx.save();
  ctx.globalAlpha = 0.09; ctx.globalCompositeOperation = "overlay";
  ctx.fillStyle = ctx.createPattern(grainTile, "repeat")!;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

const painted = new WeakMap<Photo, HTMLCanvasElement>();
/** Posterises the photo into a few flat tones with a warm cast, so it looks painted rather than pasted. Runs on the phone. */
function paintedPhoto(photo: Photo) {
  const cached = painted.get(photo);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = photo.width; canvas.height = photo.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(photo, 0, 0);
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = image.data, levels = 5;
  const tone = (value: number) => Math.round(Math.min(255, Math.max(0, (value - 128) * 1.25 + 128)) / 255 * (levels - 1)) / (levels - 1) * 255;
  for (let index = 0; index < data.length; index += 4) {
    data[index] = Math.min(255, tone(data[index]) * 1.04 + 14);
    data[index + 1] = tone(data[index + 1]);
    data[index + 2] = tone(data[index + 2]) * 0.88;
  }
  ctx.putImageData(image, 0, 0);
  painted.set(photo, canvas);
  return canvas;
}

/** The hero's face in a gold frame ringed with marquee bulbs: the photo if given, otherwise a painted silhouette. */
function hero(ctx: Ctx, p: Palette, [x, y, rx, ry]: readonly number[], photo?: Photo | null) {
  ctx.save();
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.clip();
  if (photo) {
    const art = paintedPhoto(photo);
    const scale = Math.max((rx * 2) / art.width, (ry * 2) / art.height);
    ctx.drawImage(art, x - (art.width * scale) / 2, y - (art.height * scale) / 2, art.width * scale, art.height * scale);
  } else {
    const back = ctx.createRadialGradient(x, y - ry * 0.3, 10, x, y, ry);
    back.addColorStop(0, p.glow); back.addColorStop(1, p.sky[2]);
    ctx.fillStyle = back; ctx.fillRect(x - rx, y - ry, rx * 2, ry * 2);
    bust(ctx, x, y + ry * 0.18, ry * 0.62, p.ground, "#ffffffaa");
  }
  ctx.restore();
  ctx.lineWidth = 26; ctx.strokeStyle = "#a8701c";
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 8; ctx.strokeStyle = "#ffe08a";
  ctx.beginPath(); ctx.ellipse(x, y, rx - 4, ry - 4, 0, 0, Math.PI * 2); ctx.stroke();
  for (let index = 0; index < 22; index++) {
    const angle = (index / 22) * Math.PI * 2;
    const bx = x + Math.cos(angle) * (rx + 26), by = y + Math.sin(angle) * (ry + 26);
    glow(ctx, bx, by, 22, "#fff3b0");
    ctx.fillStyle = "#fffbe6"; ctx.beginPath(); ctx.arc(bx, by, 8, 0, Math.PI * 2); ctx.fill();
  }
}

function hills(ctx: Ctx, color: string, horizon: number, width: number, lift: number) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(0, horizon + 20);
  for (let x = 0; x <= width; x += 120) ctx.quadraticCurveTo(x + 60, horizon - lift - ((x / 120) % 2) * lift * 0.6, x + 120, horizon + 4);
  ctx.lineTo(width, horizon + 40); ctx.lineTo(0, horizon + 40); ctx.closePath(); ctx.fill();
}

/** Each genre's painted scene on the left, in front of the horizon. Stylised on purpose: hearts, bursts and houses, never weapons. */
function scene(ctx: Ctx, genre: GenreId, p: Palette, layout: Layout, width: number) {
  const h = layout.horizon, cx = 280;
  if (genre === "prem") {
    glow(ctx, cx, h - 210, 230, p.glow);
    ctx.fillStyle = "#ffe9a8"; ctx.beginPath(); ctx.arc(cx, h - 210, 80, 0, Math.PI * 2); ctx.fill();
    hills(ctx, "#3d0a2e", h, width, 50);
    ctx.fillStyle = "#e0245e"; heart(ctx, cx, h - 330, 70); ctx.fill();
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 6; ctx.stroke();
    bust(ctx, cx - 78, h - 100, 82, p.ground, "#ffd36e", 0.18);
    bust(ctx, cx + 78, h - 100, 76, p.ground, "#ffd36e", -0.18);
    // A river catching the moonlight, and a little country boat on it.
    const water = ctx.createLinearGradient(0, h - 6, 0, h + 70);
    water.addColorStop(0, "#ffb36baa"); water.addColorStop(1, "#ffb36b00");
    ctx.fillStyle = water; ctx.fillRect(0, h - 6, width, 76);
    ctx.strokeStyle = "#ffffff44"; ctx.lineWidth = 5;
    for (let row = 0; row < 3; row++) { ctx.beginPath(); for (let x = 20; x < 520; x += 60) { ctx.moveTo(x, h + 18 + row * 18); ctx.quadraticCurveTo(x + 15, h + 10 + row * 18, x + 30, h + 18 + row * 18); } ctx.stroke(); }
    ctx.fillStyle = "#2a0820";
    ctx.beginPath(); ctx.moveTo(380, h - 14); ctx.quadraticCurveTo(450, h + 16, 520, h - 14); ctx.lineTo(500, h - 4); ctx.lineTo(400, h - 4); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(430, h - 12); ctx.quadraticCurveTo(450, h - 50, 470, h - 12); ctx.fill();
  } else if (genre === "action") {
    // A Dhaka skyline against a comic-book burst.
    ctx.fillStyle = "#ffd600"; star(ctx, cx, h - 300, 210, 120, 12, 0.2); ctx.fill();
    ctx.fillStyle = "#ff3d00"; star(ctx, cx, h - 300, 150, 92, 12, 0.45); ctx.fill();
    ctx.fillStyle = "#2a0606";
    for (const [x, w, t] of [[0, 90, 160], [80, 70, 230], [140, 110, 120], [240, 60, 270], [290, 100, 180], [380, 80, 140], [450, 90, 210], [530, 120, 100], [640, 80, 170], [710, 140, 130], [840, 90, 220], [920, 160, 150]] as const) ctx.fillRect(x, h - t, w, t + 40);
    ctx.fillStyle = "#ffd60066";
    for (let index = 0; index < 30; index++) ctx.fillRect(20 + ((index * 97) % 1000), h - 30 - ((index * 53) % 150), 12, 16);
    paint(ctx, "ঢিশুম!", cx, h - 278, 84, 300, { fill: "#ffffff", stroke: "#1f0303", depth: "#1f0303" }, -0.16, 0.04);
    bust(ctx, cx + 10, h - 70, 96, "#0e0202", "#ffd600");
    // A red gamchha tied round the head: every banner hero had one.
    ctx.fillStyle = "#d7262e"; ctx.fillRect(cx + 10 - 34, h - 70 - 70, 68, 14);
    ctx.beginPath(); ctx.moveTo(cx + 40, h - 132); ctx.lineTo(cx + 92, h - 150); ctx.lineTo(cx + 84, h - 122); ctx.closePath(); ctx.fill();
  } else if (genre === "family") {
    glow(ctx, cx + 60, h - 250, 260, p.glow);
    ctx.fillStyle = "#ffe066"; ctx.beginPath(); ctx.arc(cx + 60, h - 250, 90, 0, Math.PI * 2); ctx.fill();
    hills(ctx, "#174d2f", h, width, 40);
    // A tin-roofed village house and a coconut tree.
    ctx.fillStyle = "#7a3b1d"; ctx.fillRect(cx - 120, h - 150, 220, 130);
    ctx.fillStyle = "#9fb3bf"; ctx.beginPath(); ctx.moveTo(cx - 150, h - 145); ctx.lineTo(cx - 10, h - 240); ctx.lineTo(cx + 130, h - 145); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#6f8591"; ctx.lineWidth = 4;
    for (let x = -120; x <= 100; x += 22) { ctx.beginPath(); ctx.moveTo(cx - 10, h - 236); ctx.lineTo(cx + x, h - 147); ctx.stroke(); }
    ctx.fillStyle = "#2b1407"; ctx.fillRect(cx - 30, h - 100, 44, 80);
    ctx.strokeStyle = "#3b2410"; ctx.lineWidth = 14; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(70, h); ctx.quadraticCurveTo(50, h - 160, 90, h - 300); ctx.stroke();
    ctx.fillStyle = "#123d23";
    for (let leaf = 0; leaf < 7; leaf++) { ctx.save(); ctx.translate(90, h - 300); ctx.rotate(-Math.PI / 2 + (leaf - 3) * 0.55); ctx.beginPath(); ctx.ellipse(70, 0, 80, 16, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    for (const [x, s] of [[cx - 130, 62], [cx - 30, 70], [cx + 60, 46], [cx + 130, 40]] as const) bust(ctx, x, h - s * 0.4, s, p.ground, "#fff1a8");
  } else {
    // Comedy: sunburst rays and a laughing painted face.
    ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = "#ffffff";
    for (let ray = 0; ray < 18; ray++) { const a = (ray / 18) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(cx, h - 300); ctx.arc(cx, h - 300, 1400, a, a + 0.09); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    hills(ctx, "#0b2a66", h, width, 40);
    // The banner comedian: a laughing painted face with a big moustache.
    const fx = cx + 10, fy = h - 290;
    ctx.fillStyle = "#1a1a2e"; ctx.beginPath(); ctx.ellipse(fx, fy - 40, 128, 118, 0, Math.PI, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#e9a46a"; ctx.beginPath(); ctx.ellipse(fx, fy + 6, 116, 132, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(fx - 118, fy + 6, 22, 34, 0, 0, Math.PI * 2); ctx.ellipse(fx + 118, fy + 6, 22, 34, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#1a1a2e"; ctx.beginPath(); ctx.ellipse(fx, fy - 92, 112, 44, 0, Math.PI, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#f7c08f"; ctx.beginPath(); ctx.ellipse(fx - 40, fy - 40, 34, 22, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#1a1a2e"; ctx.lineCap = "round"; ctx.lineWidth = 11;
    ctx.beginPath(); ctx.arc(fx - 44, fy - 14, 22, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    ctx.beginPath(); ctx.arc(fx + 44, fy - 14, 22, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    ctx.fillStyle = "#6e0b25"; ctx.beginPath(); ctx.arc(fx, fy + 44, 60, 0.08, Math.PI - 0.08); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#ffffff"; ctx.fillRect(fx - 44, fy + 46, 88, 14);
    ctx.fillStyle = "#1a1a2e";
    ctx.beginPath(); ctx.moveTo(fx, fy + 28); ctx.bezierCurveTo(fx - 40, fy + 6, fx - 84, fy + 20, fx - 96, fy + 46); ctx.bezierCurveTo(fx - 60, fy + 36, fx - 30, fy + 44, fx, fy + 40);
    ctx.bezierCurveTo(fx + 30, fy + 44, fx + 60, fy + 36, fx + 96, fy + 46); ctx.bezierCurveTo(fx + 84, fy + 20, fx + 40, fy + 6, fx, fy + 28); ctx.fill();
    paint(ctx, "হা হা হা!", fx + 120, fy - 168, 64, 300, { fill: "#ffffff", stroke: "#ff3d7f", depth: "#071d4d" }, 0.14, 0.04);
    bust(ctx, 120, h - 30, 58, p.ground, "#fff7b0", 0.1);
    bust(ctx, 440, h - 30, 54, p.ground, "#fff7b0", -0.1);
  }
}

function cast(ctx: Ctx, poster: Poster, p: Palette, y: number, width: number) {
  if (!poster.name) { paint(ctx, NEW_FACES, width / 2, y, 70, 900, p.name, 0, 0.04); return; }
  const parts: Array<{ text: string; size: number; paint: boolean }> = [{ text: poster.name, size: 88, paint: true }];
  if (poster.costar) parts.push({ text: " ও ", size: 48, paint: false }, { text: poster.costar, size: 74, paint: true });
  const measure = (scale: number) => parts.map(part => { ctx.font = `800 ${part.size * scale}px ${DISPLAY_FONT}`; return ctx.measureText(part.text).width + (part.paint ? part.size * scale * 0.2 : 0); });
  let scale = 1, widths = measure(scale);
  while (widths.reduce((a, b) => a + b, 0) > 940 && scale > 0.4) { scale -= 0.04; widths = measure(scale); }
  let cursor = width / 2 - widths.reduce((a, b) => a + b, 0) / 2;
  parts.forEach((part, index) => {
    const center = cursor + widths[index] / 2;
    if (part.paint) paint(ctx, part.text, center, y, part.size * scale, 2000, p.name, 0, 0.05);
    else fitText(ctx, [{ text: part.text.trim(), color: p.text, weight: 700 }], center, y - 8, part.size * scale, 200, "center");
    cursor += widths[index];
  });
}

/** Splits a long title into the two most even lines, so it never ends on one lonely word. */
function balancedLines(ctx: Ctx, text: string) {
  const words = text.split(" ");
  let best = [text], widest = Infinity;
  for (let cut = 1; cut < words.length; cut++) {
    const lines = [words.slice(0, cut).join(" "), words.slice(cut).join(" ")];
    const width = Math.max(...lines.map(line => ctx.measureText(line).width));
    if (width < widest) { widest = width; best = lines; }
  }
  return best;
}

export function drawPoster(canvas: HTMLCanvasElement, poster: Poster, format: CardFormat, site: string, photo?: Photo | null) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  const p = palettes[poster.genre];
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");

  sky(ctx, p, width, height, layout.horizon, poster.genre.length * 7919 + poster.title.length);
  scene(ctx, poster.genre, p, layout, width);
  // Darken the ground into a backdrop for the lettering.
  const fade = ctx.createLinearGradient(0, layout.horizon, 0, layout.horizon + 120);
  fade.addColorStop(0, p.ground + "00"); fade.addColorStop(1, p.ground);
  ctx.fillStyle = fade; ctx.fillRect(0, layout.horizon, width, height - layout.horizon);
  hero(ctx, p, layout.hero, photo);
  badge(ctx, layout.badge[0], layout.badge[1]);
  ribbon(ctx, poster.ribbon, p, layout.ribbon);

  // Title: one huge line if it fits, otherwise two.
  ctx.font = `800 132px ${DISPLAY_FONT}`;
  if (ctx.measureText(poster.title).width <= 960 * 1.18) paint(ctx, poster.title, width / 2, layout.title, 132, 960, p.title, -0.03);
  else {
    ctx.font = `800 108px ${DISPLAY_FONT}`;
    const lines = balancedLines(ctx, poster.title);
    lines.forEach((line, index) => paint(ctx, line, width / 2, layout.title - (lines.length - 1 - index) * 112, 108, 960, p.title, -0.03));
  }

  fitText(ctx, [{ text: `“${poster.line}”`, color: p.text, weight: 700 }], width / 2, layout.line, 40, 960, "center");
  fitText(ctx, [{ text: "অভিনয়ে", color: "#ffd166", weight: 700 }], width / 2, layout.castLabel, 32, 400, "center");
  cast(ctx, poster, p, layout.names, width);
  ctx.globalAlpha = 0.85;
  fitText(ctx, [{ text: poster.credits, color: p.text, weight: 500 }], width / 2, layout.credits, 28, 940, "center");
  ctx.globalAlpha = 1;

  ctx.fillStyle = p.ribbon[0];
  ctx.fillRect(0, layout.strip - 42, width, 56);
  ctx.font = `700 30px ${BODY_FONT}`;
  fitText(ctx, [{ text: `${poster.stamp}  ★  আপনার নিকটস্থ প্রেক্ষাগৃহে`, color: p.ribbon[1], weight: 700 }], width / 2, layout.strip, 30, 980, "center");

  grain(ctx, width, height);
  // A thin gold rule inside the edge, like the painted border on a hall banner.
  const footerTop = format === "story" ? height - 260 : height - 96;
  ctx.strokeStyle = "#f2b632"; ctx.lineWidth = 4;
  ctx.strokeRect(16, 16, width - 32, footerTop - 32);

  drawFooterBand(ctx, format, "তোমার ছবির নাম কী হবে?", site, { band: "#120708", ask: "#ffd166", site: "#ffffff" });
}

export const posterBlob = (poster: Poster, format: CardFormat, site: string, photo?: Photo | null) => renderCard(canvas => drawPoster(canvas, poster, format, site, photo));
