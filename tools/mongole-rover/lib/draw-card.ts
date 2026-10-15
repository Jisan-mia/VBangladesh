// The "আব্বু-আম্মুকে দেখাও" card: today's count, the last map with the rover's path, and the plan as blocks. No name. 1080×1350.
import { BODY_FONT, cardSizes, drawFooterBand, fitText, roundedRect } from "../../../shared/card-canvas";
import { ARROW_PATH, CRATER, ROVER, SAMPLE, TURN, svgDocument } from "./art";
import { levelOf } from "./levels";
import { CARD_FOOTER, bn, cardSub, cardTitle, levelLabel, type Today } from "./lines";
import { pathOf } from "./rover";

const colors = { bg: "#fbefe4", ink: "#2d1f1a", muted: "#6d554a", accent: "#b8461f", ground: "#e9a06d", line: "#dc8a57", path: "#fffaf2", tile: "#ffffff", edge: "#e7cdb9", star: "#f2a900", starOff: "#ecd9ca", band: "#5a2412" };
export const PICTURES = [ROVER, SAMPLE, CRATER].map(svg => svgDocument(svg));

/** Turns our SVG markup (with a width and height, or decode fails) into decoded images from data: URLs (nothing is fetched). */
export async function loadPictures() {
  return Promise.all(PICTURES.map(async svg => {
    const image = new Image();
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    await image.decode();
    return image;
  }));
}

function star(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + i * Math.PI / 5, radius = i % 2 ? r * 0.45 : r;
    c.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
  }
  c.closePath(); c.fillStyle = fill; c.fill();
}

export function drawCard(canvas: HTMLCanvasElement, today: Today, [rover, sample, crater]: HTMLImageElement[], site: string) {
  const { width, height } = cardSizes.feed;
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c || !today.last) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const level = levelOf(today.last.n), plan = today.last.plan;
  c.fillStyle = colors.bg; c.fillRect(0, 0, width, height);

  fitText(c, [{ text: `মঙ্গলে রোভার · ${levelLabel(level.n)}`, color: colors.accent, weight: 700, display: true }], width / 2, 92, 38, 900, "center");
  fitText(c, [{ text: cardTitle(today), color: colors.ink, weight: 800, display: true }], width / 2, 170, 54, 980, "center");
  fitText(c, [{ text: cardSub(today), color: colors.muted, weight: 600 }], width / 2, 228, 34, 900, "center");
  for (let i = 0; i < 3; i++) star(c, width / 2 + (i - 1) * 70, 280, 26, i < today.last.stars ? colors.star : colors.starOff);

  // The map, as big as fits between the stars and the plan; map and plan together sit in the middle of the space left.
  const size = 96, gap = 14, perRow = 8, planRows = Math.ceil(plan.length / perRow);
  const cell = Math.floor(Math.min(620 / level.w, 560 / level.h)), mapW = cell * level.w, mapH = cell * level.h;
  const left = (width - mapW) / 2, top = 330 + Math.max(0, (900 - (mapH + 76 + planRows * (size + gap))) / 2);
  roundedRect(c, left, top, mapW, mapH, 24); c.fillStyle = colors.ground; c.fill();
  c.save(); roundedRect(c, left, top, mapW, mapH, 24); c.clip();
  c.strokeStyle = colors.line; c.lineWidth = 3;
  for (let x = 1; x < level.w; x++) { c.beginPath(); c.moveTo(left + x * cell, top); c.lineTo(left + x * cell, top + mapH); c.stroke(); }
  for (let y = 1; y < level.h; y++) { c.beginPath(); c.moveTo(left, top + y * cell); c.lineTo(left + mapW, top + y * cell); c.stroke(); }
  c.restore();
  const place = (image: HTMLImageElement, x: number, y: number, scale = 0.86, alpha = 1) => {
    const size = cell * scale;
    c.globalAlpha = alpha;
    c.drawImage(image, left + x * cell + (cell - size) / 2, top + y * cell + (cell - size) / 2, size, size);
    c.globalAlpha = 1;
  };
  for (const at of level.craters) place(crater, at.x, at.y, 0.92);
  for (const at of level.samples) place(sample, at.x, at.y, 0.7, 0.45);
  const path = pathOf(level, plan), centre = (v: number) => (v + 0.5) * cell;
  c.strokeStyle = colors.path; c.lineWidth = Math.max(6, cell * 0.08); c.lineCap = "round"; c.lineJoin = "round";
  c.setLineDash([2, cell * 0.16]);
  c.beginPath();
  path.forEach((at, i) => (i ? c.lineTo : c.moveTo).call(c, left + centre(at.x), top + centre(at.y)));
  c.stroke(); c.setLineDash([]);
  c.fillStyle = colors.path;
  c.beginPath(); c.arc(left + centre(level.start.x), top + centre(level.start.y), cell * 0.12, 0, Math.PI * 2); c.fill();
  const end = path.at(-1)!;
  place(rover, end.x, end.y, 0.9);

  // The plan, as the blocks the child placed: up to eight a row.
  const planTop = top + mapH + 76;
  fitText(c, [{ text: "আমার প্ল্যান", color: colors.muted, weight: 700 }], width / 2, planTop - 22, 32, 600, "center");
  const arrow = new Path2D(ARROW_PATH);
  plan.forEach((block, i) => {
    const row = Math.floor(i / perRow), inRow = Math.min(perRow, plan.length - row * perRow);
    const x = width / 2 - (inRow * size + (inRow - 1) * gap) / 2 + (i % perRow) * (size + gap), y = planTop + row * (size + gap);
    roundedRect(c, x, y, size, size, 20); c.fillStyle = colors.tile; c.fill();
    c.lineWidth = 4; c.strokeStyle = colors.edge; c.stroke();
    c.save();
    const repeat = block.times > 1, art = repeat ? 52 : 70;
    c.translate(x + size / 2, y + (repeat ? 60 : size / 2));
    c.rotate(TURN[block.dir] * Math.PI / 180);
    c.scale(art / 64, art / 64); c.translate(-32, -32);
    c.fillStyle = colors.accent; c.fill(arrow);
    c.restore();
    if (repeat) {
      c.font = `700 26px ${BODY_FONT}`;
      fitText(c, [{ text: `${bn(block.times)} বার`, color: colors.ink, weight: 700 }], x + size / 2, y + 30, 26, size - 10, "center");
    }
  });

  drawFooterBand(c, "feed", CARD_FOOTER, site, { band: colors.band, ask: "#ffd166", site: "#ffffff" });
}
