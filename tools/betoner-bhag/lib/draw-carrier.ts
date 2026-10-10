import { DISPLAY_FONT, cardSizes, drawFooterBand, fitText, renderCard, type CardFormat, type Segment } from "../../../shared/card-canvas";
import { biggest, bn, labels, monthLine, monthTitle, type Month } from "./bhag";

// One drawing for the live carrier and the share card: a steel tiffin carrier on a turmeric wall, standing on a
// red-green গামছা, each bowl as tall as its share, with masking-tape labels on the right.
export const SCENE_WIDTH = 360;
export const LIVE_HEIGHT = 330;
const CLOTH = 40;
const FOOT = 26;
const CX = 94, HALF = 62, RIM = 7, SAG = 4.5;
const TOP = 12, HANDLE = 32, LID = 16;
const BAR = HALF + 12;
export const TAG = { x: 190, w: 160, h: 31, gap: 5 } as const;

const INK = "#2b1d12";
const RED = "#b3261e";
const WALL = ["#f8da84", "#f0c457"] as const;
const steel: Array<[number, string]> = [[0, "#646d73"], [0.1, "#a6afb5"], [0.27, "#f2f5f7"], [0.4, "#d3d9dd"], [0.63, "#959ea4"], [0.86, "#c9d0d4"], [1, "#59626a"]];
const rimSteel: Array<[number, string]> = [[0, "#7a838a"], [0.25, "#ffffff"], [0.45, "#e1e6e9"], [0.75, "#b3bbc0"], [1, "#6c757b"]];

/** Where each bowl and tag sits, in scene units (SCENE_WIDTH wide, `height` tall). `sizes` need not add to exactly 100. */
export function carrierLayout(sizes: readonly number[], height: number) {
  const bottom = height - FOOT;
  const first = TOP + HANDLE + LID;
  const room = bottom - first - RIM * sizes.length;
  const total = sizes.reduce((sum, size) => sum + Math.max(0, size), 0) || 1;
  let y = first;
  const tiers = sizes.map(size => {
    const body = (Math.max(0, size) / total) * room;
    const tier = { top: y, rim: y + RIM, bottom: y + RIM + body, mid: y + (RIM + body) / 2 + SAG / 2 };
    y += RIM + body;
    return tier;
  });
  // Tags start beside their bowl, then get nudged apart so none overlap, staying inside the scene.
  // Tags stay on the wall, above the cloth.
  const step = TAG.h + TAG.gap, low = TOP + TAG.h / 2, high = height - CLOTH - 3 - TAG.h / 2, last = tiers.length - 1;
  const tags = tiers.map(tier => Math.min(high, Math.max(low, tier.mid)));
  for (let i = 1; i <= last; i++) tags[i] = Math.max(tags[i], tags[i - 1] + step);
  tags[last] = Math.min(tags[last], high);
  for (let i = last - 1; i >= 0; i--) tags[i] = Math.min(tags[i], tags[i + 1] - step);
  return { first, bottom, tiers, tags };
}

function gradient(context: CanvasRenderingContext2D, x: number, width: number, stops: Array<[number, string]>) {
  const fill = context.createLinearGradient(x, 0, x + width, 0);
  for (const [offset, color] of stops) fill.addColorStop(offset, color);
  return fill;
}

/** The front of a cylinder seen from a little above: both edges dip in the middle. */
function band(context: CanvasRenderingContext2D, x: number, top: number, bottom: number, width: number) {
  context.beginPath();
  context.moveTo(x, top);
  context.quadraticCurveTo(x + width / 2, top + SAG * 2, x + width, top);
  context.lineTo(x + width, bottom);
  context.quadraticCurveTo(x + width / 2, bottom + SAG * 2, x, bottom);
  context.closePath();
}

function curve(context: CanvasRenderingContext2D, y: number, color: string, width: number) {
  context.strokeStyle = color; context.lineWidth = width;
  context.beginPath(); context.moveTo(CX - HALF, y); context.quadraticCurveTo(CX, y + SAG * 2, CX + HALF, y); context.stroke();
}

function drawBackground(context: CanvasRenderingContext2D, width: number, height: number, clothTop: number, unit: number) {
  const wall = context.createLinearGradient(0, 0, 0, clothTop);
  wall.addColorStop(0, WALL[0]); wall.addColorStop(1, WALL[1]);
  context.fillStyle = wall; context.fillRect(0, 0, width, clothTop);
  // Window light falling on the wall.
  const light = context.createRadialGradient(width * 0.8, clothTop * 0.2, 0, width * 0.8, clothTop * 0.2, width * 0.7);
  light.addColorStop(0, "rgba(255,250,225,.55)"); light.addColorStop(1, "rgba(255,250,225,0)");
  context.fillStyle = light; context.fillRect(0, 0, width, clothTop);
  // গামছা: red field, green checks with a white thread through each.
  context.fillStyle = "#b8302a"; context.fillRect(0, clothTop, width, height - clothTop);
  const pitch = 30 * unit, stripe = 8 * unit;
  context.fillStyle = "rgba(38,104,64,.92)";
  for (let x = 10 * unit; x < width; x += pitch) context.fillRect(x, clothTop, stripe, height - clothTop);
  for (let y = clothTop + 14 * unit; y < height; y += pitch) context.fillRect(0, y, width, stripe);
  context.fillStyle = "rgba(255,247,236,.85)";
  for (let x = 10 * unit + stripe / 2; x < width; x += pitch) context.fillRect(x - 0.7 * unit, clothTop, 1.4 * unit, height - clothTop);
  for (let y = clothTop + 14 * unit + stripe / 2; y < height; y += pitch) context.fillRect(0, y - 0.7 * unit, width, 1.4 * unit);
  context.fillStyle = "rgba(60,20,10,.22)"; context.fillRect(0, clothTop, width, 3 * unit);
}

/** fitText in scene units: drawn unscaled so its shrink-to-fit floor is in real pixels, not scene units. */
function label(context: CanvasRenderingContext2D, unit: number, segments: Segment[], x: number, y: number, size: number, maxWidth: number, align: "left" | "center" | "right" = "left") {
  context.save();
  context.scale(1 / unit, 1 / unit);
  fitText(context, segments, x * unit, y * unit, size * unit, maxWidth * unit, align);
  context.restore();
}

function tape(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  // Torn ends: three little teeth on each short edge.
  const tooth = height / 3;
  context.beginPath();
  context.moveTo(x, y);
  context.lineTo(x + width, y);
  for (let i = 0; i < 3; i++) { context.lineTo(x + width - 3, y + tooth * i + tooth / 2); context.lineTo(x + width, y + tooth * (i + 1)); }
  context.lineTo(x, y + height);
  for (let i = 3; i > 0; i--) { context.lineTo(x + 3, y + tooth * i - tooth / 2); context.lineTo(x, y + tooth * (i - 1)); }
  context.closePath();
}

export type Scene = { sizes: readonly number[]; values: readonly number[]; labels: readonly string[]; name?: string };

/** Draws the scene into a box at (x, y), `unit` px per scene unit. With `background: false` only the carrier and tags. */
export function drawScene(context: CanvasRenderingContext2D, scene: Scene, x: number, y: number, unit: number, height: number, background = true) {
  const { tiers, tags, first, bottom } = carrierLayout(scene.sizes, height);
  context.save();
  context.translate(x, y);
  context.scale(unit, unit);
  if (background) {
    context.save(); context.scale(1 / unit, 1 / unit);
    drawBackground(context, SCENE_WIDTH * unit, height * unit, (height - CLOTH) * unit, unit);
    context.restore();
  }
  context.lineJoin = "round"; context.lineCap = "round";

  context.fillStyle = "rgba(55,12,8,.32)";
  context.beginPath(); context.ellipse(CX, bottom + 5, BAR + 10, 7, 0, 0, Math.PI * 2); context.fill();

  // Lid: a low dome with a knob.
  const lidTop = first - LID;
  context.beginPath();
  context.moveTo(CX - HALF, first);
  context.bezierCurveTo(CX - HALF, lidTop - LID / 3, CX + HALF, lidTop - LID / 3, CX + HALF, first);
  context.quadraticCurveTo(CX, first + SAG * 2, CX - HALF, first);
  context.closePath();
  context.fillStyle = gradient(context, CX - HALF, HALF * 2, steel); context.fill();
  context.strokeStyle = "#555e65"; context.lineWidth = 0.9; context.stroke();
  context.fillStyle = gradient(context, CX - 10, 20, rimSteel);
  context.beginPath(); context.ellipse(CX, lidTop + 1, 10, 4.5, 0, 0, Math.PI * 2); context.fill(); context.stroke();

  // Bowls, top to bottom, so each rim covers the dip of the bowl above.
  tiers.forEach(tier => {
    const body = tier.bottom - tier.rim;
    band(context, CX - HALF, tier.rim, tier.bottom, HALF * 2);
    context.fillStyle = gradient(context, CX - HALF, HALF * 2, steel); context.fill();
    context.strokeStyle = "#555e65"; context.lineWidth = 0.9; context.stroke();
    if (body > 16) { curve(context, tier.rim + 5, "rgba(70,78,84,.55)", 1); curve(context, tier.rim + 6.4, "rgba(255,255,255,.7)", 0.9); }
    if (body > 30) { curve(context, tier.bottom - 6, "rgba(70,78,84,.4)", 1); curve(context, tier.bottom - 4.6, "rgba(255,255,255,.55)", 0.9); }
    // The clips the side bars pass through.
    context.fillStyle = gradient(context, CX - BAR - 3, (BAR + 3) * 2, rimSteel);
    context.fillRect(CX - BAR, tier.top + 1, BAR - HALF, RIM - 2);
    context.fillRect(CX + HALF, tier.top + 1, BAR - HALF, RIM - 2);
    band(context, CX - HALF - 3, tier.top, tier.top + RIM, HALF * 2 + 6);
    context.fillStyle = gradient(context, CX - HALF - 3, HALF * 2 + 6, rimSteel); context.fill();
    context.strokeStyle = "#5c656c"; context.lineWidth = 0.8; context.stroke();
  });

  // A name scratched into the fullest bowl, the way steel tiffin boxes get engraved at the shop.
  const name = scene.name?.trim();
  if (name) {
    const index = scene.sizes.indexOf(Math.max(...scene.sizes));
    const tier = tiers[index];
    const body = tier.bottom - tier.rim;
    if (body >= 30) {
      const size = Math.min(18, body * 0.4), baseline = tier.rim + body / 2 + SAG + size * 0.36;
      label(context, unit, [{ text: name, color: "rgba(255,255,255,.7)", weight: 600, display: true }], CX + 0.6, baseline + 0.6, size, HALF * 2 - 30, "center");
      label(context, unit, [{ text: name, color: "rgba(70,78,84,.5)", weight: 600, display: true }], CX, baseline, size, HALF * 2 - 30, "center");
    }
  }

  // Side bars, joined over the lid into the handle, hooked under the last bowl.
  const handleTop = TOP + 3;
  const barPath = () => {
    context.beginPath();
    context.moveTo(CX - HALF + 16, bottom + 2.5);
    context.lineTo(CX - BAR + 7, bottom + 2.5);
    context.quadraticCurveTo(CX - BAR, bottom + 2.5, CX - BAR, bottom - 4);
    context.lineTo(CX - BAR, handleTop + 12);
    context.quadraticCurveTo(CX - BAR, handleTop, CX - BAR + 12, handleTop);
    context.lineTo(CX + BAR - 12, handleTop);
    context.quadraticCurveTo(CX + BAR, handleTop, CX + BAR, handleTop + 12);
    context.lineTo(CX + BAR, bottom - 4);
    context.quadraticCurveTo(CX + BAR, bottom + 2.5, CX + BAR - 7, bottom + 2.5);
    context.lineTo(CX + HALF - 16, bottom + 2.5);
  };
  barPath(); context.strokeStyle = "#4f585e"; context.lineWidth = 7.4; context.stroke();
  barPath(); context.strokeStyle = "#a9b2b8"; context.lineWidth = 5.4; context.stroke();
  barPath(); context.strokeStyle = "rgba(255,255,255,.75)"; context.lineWidth = 1.4; context.stroke();
  // The grip and the two latches where the handle meets the lid.
  context.fillStyle = gradient(context, CX - 26, 52, steel);
  context.beginPath(); context.roundRect(CX - 26, handleTop - 6, 52, 12, 6); context.fill();
  context.strokeStyle = "#4f585e"; context.lineWidth = 1; context.stroke();
  for (const side of [-1, 1]) {
    context.fillStyle = gradient(context, CX + side * BAR - 5, 10, rimSteel);
    context.beginPath(); context.roundRect(CX + side * BAR - 5, first - 9, 10, 9, 2); context.fill(); context.stroke();
  }

  // Tags: masking tape on the wall, a pencil line to each bowl.
  const top = scene.values.indexOf(Math.max(...scene.values));
  tiers.forEach((tier, index) => {
    const cy = tags[index];
    context.strokeStyle = "rgba(60,40,20,.7)"; context.lineWidth = 1; context.setLineDash([2.2, 2.8]);
    context.beginPath(); context.moveTo(CX + BAR + 5, tier.mid); context.lineTo(TAG.x - 1, cy); context.stroke();
    context.setLineDash([]);
    context.save();
    context.translate(TAG.x + TAG.w / 2, cy);
    context.rotate(((index % 2 ? 1 : -1) * 1.1 * Math.PI) / 180);
    context.translate(-TAG.w / 2, -TAG.h / 2);
    context.shadowColor = "rgba(80,50,10,.25)"; context.shadowBlur = 3 * unit; context.shadowOffsetY = 1 * unit;
    tape(context, 0, 0, TAG.w, TAG.h);
    context.fillStyle = index === top ? "#fff4d6" : "#efe3c3"; context.fill();
    context.shadowColor = "transparent";
    const value = `${bn(scene.values[index])}%`;
    context.font = `800 19px ${DISPLAY_FONT}`;
    const valueWidth = context.measureText(value).width;
    label(context, unit, [{ text: value, color: index === top ? RED : INK, weight: 800, display: true }], TAG.w - 9, TAG.h / 2 + 6.5, 19, 56, "right");
    label(context, unit, [{ text: scene.labels[index], color: INK, weight: 600 }], 9, TAG.h / 2 + 5, 13.5, TAG.w - 24 - valueWidth);
    context.restore();
  });
  context.restore();
}

export const sceneOf = (month: Month): Scene => ({ sizes: month.shares, values: month.shares, labels: labels(month.flex), name: month.name });

const layouts = {
  feed: { kicker: 96, title: 196, titleSize: 90, line: 262, note: 306, scene: 322 },
  story: { kicker: 330, title: 446, titleSize: 104, line: 528, note: 578, scene: 606 },
} as const;

export function drawCard(canvas: HTMLCanvasElement, month: Month, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const bandTop = format === "story" ? height - 260 : height - 96;
  const unit = 912 / SCENE_WIDTH;
  const sceneHeight = (bandTop - layout.scene) / unit;
  drawBackground(context, width, bandTop, layout.scene + (sceneHeight - CLOTH) * unit, unit);
  const top = biggest(month);
  fitText(context, [{ text: "বেতনের ভাগ", color: RED, weight: 800, display: true }, { text: "  ·  শুধু শতাংশ, টাকার অঙ্ক না", color: INK, weight: 500 }], 84, layout.kicker, 32, 912);
  fitText(context, [{ text: monthTitle(month.name), color: INK, weight: 800, display: true }], 84, layout.title, layout.titleSize, 912);
  fitText(context, [{ text: monthLine(month), color: INK, weight: 700, display: true }], 84, layout.line, 40, 912);
  fitText(context, [{ text: "সবচেয়ে বড় বাটি: ", color: "#6b4318", weight: 500 }, { text: `${top.label} ${bn(top.share)}%`, color: RED, weight: 700 }], 84, layout.note, 30, 912);
  drawScene(context, sceneOf(month), 84, layout.scene, unit, sceneHeight, false);
  drawFooterBand(context, format, "তোমার বেতনের সবচেয়ে বড় বাটি কোনটা?", site, { band: "#4a1712", ask: "#ffd166", site: "#ffffff" });
}

export const cardBlob = (month: Month, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, month, format, site));
