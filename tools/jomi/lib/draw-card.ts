import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, type CardFormat } from "../../../shared/card-canvas";
import { conversions, labelText, pitchLine, plotLine, sizeText, sqftOf, type LabelId, type Plot } from "./plot";
import { bn, checked, PITCH, PITCH_SQFT } from "./units";

const NIGHT = "#1d3815";
const GRASS = "#2a4e1f";
const BAND = "#122710";
const GOLD = "#f2c94c";
const MINT = "#d2e6bb";
const AL = "#c99a5f";
const PADDY = "#8dbd45";
const PADDY_ROW = "#5e8e29";
const WATER = "#3a87ad";
const RIPPLE = "#8ec4dc";
const YARD = "#d9b285";
const ROOF = "#a9b2b7";
const TREE = "#3d7a2a";
const STEEL = "#dfe2e4";

type Box = { x: number; y: number; w: number; h: number };
const ASPECT = PITCH.length / PITCH.width;
const shrink = (frame: Box, factor: number, min: number): Box => {
  const w = Math.max(frame.w * factor, min), h = Math.max(frame.h * factor, min / ASPECT);
  return { x: frame.x + (frame.w - w) / 2, y: frame.y + (frame.h - h) / 2, w, h };
};

function drawPitch(context: CanvasRenderingContext2D, box: Box) {
  const stripes = 12;
  for (let index = 0; index < stripes; index++) {
    context.fillStyle = index % 2 ? "#3f8d3b" : "#48983f";
    context.fillRect(box.x + (box.w / stripes) * index, box.y, box.w / stripes + 0.5, box.h);
  }
  const m = box.w / PITCH.length;
  const mid = box.y + box.h / 2;
  context.strokeStyle = "#ffffffd9";
  context.lineWidth = Math.max(1.5, box.w / 240);
  context.strokeRect(box.x, box.y, box.w, box.h);
  context.beginPath(); context.moveTo(box.x + box.w / 2, box.y); context.lineTo(box.x + box.w / 2, box.y + box.h); context.stroke();
  if (box.w < 60) return;
  context.beginPath(); context.arc(box.x + box.w / 2, mid, 9.15 * m, 0, Math.PI * 2); context.stroke();
  for (const side of [0, 1]) {
    const edge = side ? box.x + box.w : box.x, dir = side ? -1 : 1;
    context.strokeRect(Math.min(edge, edge + dir * 16.5 * m), mid - 20.16 * m, 16.5 * m, 40.32 * m);
    context.strokeRect(Math.min(edge, edge + dir * 5.5 * m), mid - 9.16 * m, 5.5 * m, 18.32 * m);
    context.fillStyle = "#ffffffd9";
    context.beginPath(); context.arc(edge + dir * 11 * m, mid, Math.max(1.5, m * 0.4), 0, Math.PI * 2); context.fill();
  }
}

/** A Gunter's chain along the top edge: long wire links joined by small rings, a brass tag every tenth link, a handle at each end. */
function drawChain(context: CanvasRenderingContext2D, box: Box, ridge: number) {
  const y = box.y - ridge / 2 - 8;
  const count = Math.max(10, Math.round(box.w / 18));
  const step = box.w / count;
  context.lineCap = "round";
  for (let index = 0; index < count; index++) {
    const left = box.x + step * index;
    context.strokeStyle = STEEL; context.lineWidth = 2.5;
    context.beginPath(); context.moveTo(left + 4, y); context.lineTo(left + step - 4, y); context.stroke();
    const tag = index % 10 === 9;
    context.strokeStyle = tag ? GOLD : STEEL; context.lineWidth = tag ? 3 : 2;
    context.beginPath(); context.arc(left + step, y, tag ? 4.5 : 3, 0, Math.PI * 2); context.stroke();
  }
  context.strokeStyle = GOLD; context.lineWidth = 3.5;
  for (const x of [box.x - 6, box.x + box.w + 8]) { context.beginPath(); context.arc(x, y, 6, 0, Math.PI * 2); context.stroke(); }
}

function drawPlot(context: CanvasRenderingContext2D, box: Box, label: LabelId | "", tag: string, chain: boolean) {
  const ridge = Math.min(10, Math.max(2, box.w / 45));
  context.save();
  roundedRect(context, box.x, box.y, box.w, box.h, Math.min(10, box.w / 12)); context.clip();
  const big = box.w > 40;
  if (label === "pukur") {
    context.fillStyle = WATER; context.fillRect(box.x, box.y, box.w, box.h);
    if (big) {
      context.strokeStyle = RIPPLE; context.lineWidth = Math.max(1.5, box.w / 200);
      for (const [fx, fy, fr] of [[0.3, 0.35, 0.09], [0.68, 0.6, 0.12], [0.45, 0.78, 0.06]]) {
        for (const ring of [1, 1.7]) { context.beginPath(); context.arc(box.x + box.w * fx, box.y + box.h * fy, box.w * fr * ring, Math.PI * 1.1, Math.PI * 1.9); context.stroke(); }
      }
    }
  } else if (label === "vita") {
    context.fillStyle = YARD; context.fillRect(box.x, box.y, box.w, box.h);
    if (big) {
      const hw = box.w * 0.34, hh = box.h * 0.3, hx = box.x + box.w * 0.14, hy = box.y + box.h * 0.18;
      context.fillStyle = ROOF; context.fillRect(hx, hy, hw, hh);
      context.strokeStyle = "#7d878c"; context.lineWidth = Math.max(1, box.w / 160);
      context.beginPath(); context.moveTo(hx, hy + hh / 2); context.lineTo(hx + hw, hy + hh / 2); context.stroke();
      for (let line = 1; line < 8; line++) { context.beginPath(); context.moveTo(hx + (hw / 8) * line, hy); context.lineTo(hx + (hw / 8) * line, hy + hh); context.stroke(); }
      context.fillStyle = TREE;
      for (const [fx, fy, fr] of [[0.76, 0.3, 0.1], [0.84, 0.62, 0.08], [0.26, 0.74, 0.07]]) { context.beginPath(); context.arc(box.x + box.w * fx, box.y + box.h * fy, box.w * fr, 0, Math.PI * 2); context.fill(); }
    }
  } else {
    context.fillStyle = PADDY; context.fillRect(box.x, box.y, box.w, box.h);
    if (big) {
      // Transplanted seedlings in rows, the way a field looks from a rooftop.
      const gap = Math.max(7, box.w / 26);
      context.strokeStyle = PADDY_ROW; context.lineWidth = Math.max(1.5, gap / 5); context.lineCap = "round";
      for (let row = 0, y = box.y + gap * 0.7; y < box.y + box.h; row++, y += gap) {
        for (let x = box.x + gap * (row % 2 ? 0.5 : 1); x < box.x + box.w; x += gap) {
          context.beginPath(); context.moveTo(x - gap * 0.18, y + gap * 0.16); context.lineTo(x, y - gap * 0.2); context.lineTo(x + gap * 0.18, y + gap * 0.16); context.stroke();
        }
      }
    }
  }
  context.restore();
  context.strokeStyle = AL; context.lineWidth = ridge;
  roundedRect(context, box.x, box.y, box.w, box.h, Math.min(10, box.w / 12)); context.stroke();
  if (chain && box.w >= 90) drawChain(context, box, ridge);
  if (tag && box.w >= 170 && box.h >= 70) {
    context.save();
    context.shadowColor = "#000a"; context.shadowBlur = 10;
    fitText(context, [{ text: tag, color: "#fff", weight: 800, display: true }], box.x + box.w / 2, box.y + box.h / 2 + box.h * 0.08, Math.min(64, box.h * 0.26), box.w - 30, "center");
    context.restore();
  }
}

/** The field from above: the plot and a FIFA-size pitch drawn to the same scale, whichever is bigger as the frame. */
export function drawField(context: CanvasRenderingContext2D, box: Box, ratio: number, label: LabelId | "", tag: string) {
  context.fillStyle = GRASS;
  roundedRect(context, box.x, box.y, box.w, box.h, 18); context.fill();
  const pad = Math.max(30, box.w / 22);
  const fw = Math.min(box.w - pad * 2, (box.h - pad * 2) * ASPECT);
  const frame = { x: box.x + (box.w - fw) / 2, y: box.y + (box.h - fw / ASPECT) / 2 - pad * 0.2, w: fw, h: fw / ASPECT };
  const size = Math.max(18, box.w / 32);
  if (ratio <= 1) {
    drawPitch(context, frame);
    fitText(context, [{ text: `${bn(PITCH.length)} মিটার`, color: MINT, weight: 600 }], frame.x + frame.w / 2, frame.y + frame.h + size * 1.1, size, frame.w, "center");
    context.save();
    context.translate(frame.x + frame.w + size * 0.45, frame.y + frame.h / 2); context.rotate(Math.PI / 2);
    fitText(context, [{ text: `${bn(PITCH.width)} মিটার`, color: MINT, weight: 600 }], 0, 0, size, frame.h, "center");
    context.restore();
    drawPlot(context, shrink(frame, Math.sqrt(ratio), 6), label, tag, true);
  } else {
    drawPlot(context, frame, label, tag, true);
    drawPitch(context, shrink(frame, 1 / Math.sqrt(ratio), 10));
  }
}

export const STAGE = { width: 720, height: 470 } as const;
export function drawStage(canvas: HTMLCanvasElement, ratio: number, label: LabelId | "", tag: string) {
  const context = canvas.getContext("2d");
  if (!context) return;
  context.clearRect(0, 0, canvas.width, canvas.height);
  drawField(context, { x: 0, y: 0, w: STAGE.width, h: STAGE.height }, ratio, label, tag);
}

const layouts = {
  feed: { kicker: 108, head: 212, headSize: 104, tiles: 262, tileH: 122, tileGap: 18, field: 548, fieldH: 468, caption: 1078, line: 1130, source: 1180 },
  story: { kicker: 330, head: 462, headSize: 116, tiles: 512, tileH: 140, tileGap: 24, field: 860, fieldH: 530, caption: 1462, line: 1520, source: 1576 },
} as const;

export function drawCard(canvas: HTMLCanvasElement, plot: Plot, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const x = 90, w = 900;

  context.fillStyle = NIGHT;
  context.fillRect(0, 0, width, height);
  fitText(context, [{ text: "জমির মাপ", color: GOLD, weight: 700, display: true }, { text: "  ·  সরকারি মান ধরে হিসাব", color: MINT, weight: 500 }], x, layout.kicker, 34, w);
  fitText(context, [
    { text: sizeText(plot), color: "#fff", weight: 800, display: true },
    ...(plot.label ? [{ text: ` ${labelText(plot.label)}`, color: GOLD, weight: 800, display: true }] : []),
    { text: " =", color: GOLD, weight: 800, display: true },
  ], x, layout.head, layout.headSize, w);

  const tileW = (w - layout.tileGap * 2) / 3;
  conversions(plot).forEach((item, index) => {
    const tx = x + (index % 3) * (tileW + layout.tileGap), ty = layout.tiles + Math.floor(index / 3) * (layout.tileH + layout.tileGap);
    context.fillStyle = "#ffffff14"; roundedRect(context, tx, ty, tileW, layout.tileH, 16); context.fill();
    fitText(context, [{ text: item.text, color: "#fff", weight: 800, display: true }], tx + 22, ty + layout.tileH * 0.54, 56, tileW - 40);
    fitText(context, [{ text: item.label, color: MINT, weight: 600 }], tx + 22, ty + layout.tileH * 0.84, 26, tileW - 40);
  });

  drawField(context, { x, y: layout.field, w, h: layout.fieldH }, sqftOf(plot) / PITCH_SQFT, plot.label, "");
  fitText(context, [{ text: pitchLine(plot), color: GOLD, weight: 700, display: true }, { text: `  (মাঠ ${bn(PITCH.length)} × ${bn(PITCH.width)} মিটার)`, color: MINT, weight: 500 }], x, layout.caption, 42, w);
  fitText(context, [{ text: plotLine(plot), color: "#fff", weight: 600 }], x, layout.line, 32, w);
  fitText(context, [{ text: `সরকারি মান: ভূমি মন্ত্রণালয় · যাচাই ${checked}`, color: MINT, weight: 500 }], x, layout.source, 25, w);
  fitText(context, [{ text: "কাঠা-বিঘা এলাকাভেদে আলাদা হতে পারে। এটা দলিল বা জরিপ না, শুধু এককের হিসাব।", color: MINT, weight: 500 }], x, layout.source + 36, 25, w);
  drawFooterBand(context, format, "তোমার বাড়ির উঠোন কত শতাংশ?", site, { band: BAND, ask: GOLD, site: "#ffffff" });
}

export const cardBlob = (plot: Plot, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, plot, format, site));
