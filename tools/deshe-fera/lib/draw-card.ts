import { cardSizes, drawFooterBand, drawPhoto, fitText, renderCard, wrapText, DISPLAY_FONT, type CardFormat, type Photo } from "../../../shared/card-canvas";
import { replyLine, type Card } from "./deshe";

const CASE = "#1d3a4a";
const CASE_RIB = "#21424f";
const HANDLE = "#0f2029";
const KRAFT = "#dcb98a";
const KRAFT_EDGE = "#b98f58";
const INK = "#2b1d10";
const MUTED = "#7a5a33";
const RED = "#b3261e";
const GREEN = "#0b6b4f";
const TWINE = "#efe2c4";

const TAG_X = 150, TAG_W = 780, PAD = 64;

// Tag-local y positions; the story tag hangs longer, so everything spreads out.
const layouts = {
  feed: { handle: 40, top: 200, height: 1010, name: 220, rule1: 272, from: 342, stamp: 330, to: 512, toSize: 160, rule2: 566, abroad: 650, eid: 726, line: 818, perf: 918 },
  story: { handle: 70, top: 330, height: 1290, name: 240, rule1: 300, from: 392, stamp: 390, to: 650, toSize: 190, rule2: 730, abroad: 850, eid: 944, line: 1070, perf: 1180 },
} as const;

function suitcase(context: CanvasRenderingContext2D, width: number, height: number) {
  context.fillStyle = CASE;
  context.fillRect(0, 0, width, height);
  context.fillStyle = CASE_RIB;
  for (let x = 60; x < width; x += 140) context.fillRect(x, 0, 34, height);
  context.strokeStyle = "#e9d9b866";
  context.lineWidth = 3;
  context.setLineDash([16, 12]);
  context.strokeRect(30, 30, width - 60, height - 60);
  context.setLineDash([]);
}

function handle(context: CanvasRenderingContext2D, y: number) {
  context.fillStyle = HANDLE;
  for (const x of [330, 660]) { context.beginPath(); context.roundRect(x, y + 80, 90, 56, 14); context.fill(); }
  context.lineCap = "round";
  context.strokeStyle = HANDLE; context.lineWidth = 48;
  context.beginPath(); context.moveTo(375, y + 100); context.bezierCurveTo(375, y - 10, 705, y - 10, 705, y + 100); context.stroke();
  context.strokeStyle = "#2f566b"; context.lineWidth = 8;
  context.beginPath(); context.moveTo(370, y + 70); context.bezierCurveTo(380, y + 2, 700, y + 2, 710, y + 70); context.stroke();
  context.lineCap = "butt";
}

function tagShape(context: CanvasRenderingContext2D, height: number) {
  const cut = 96;
  context.beginPath();
  context.moveTo(cut, 0); context.lineTo(TAG_W - cut, 0); context.lineTo(TAG_W, cut);
  context.lineTo(TAG_W, height - 18); context.quadraticCurveTo(TAG_W, height, TAG_W - 18, height);
  context.lineTo(18, height); context.quadraticCurveTo(0, height, 0, height - 18);
  context.lineTo(0, cut); context.closePath();
}

/** A rubber stamp: two red rings, slightly tilted, the countdown in the middle. */
function stamp(context: CanvasRenderingContext2D, text: string, cx: number, cy: number, radius: number) {
  context.save();
  context.translate(cx, cy); context.rotate(-0.2);
  context.globalAlpha = 0.88;
  context.strokeStyle = RED;
  context.lineWidth = 7; context.beginPath(); context.arc(0, 0, radius, 0, Math.PI * 2); context.stroke();
  context.lineWidth = 2.5; context.beginPath(); context.arc(0, 0, radius - 16, 0, Math.PI * 2); context.stroke();
  const [first, ...rest] = text.split(" ");
  if (rest.length) {
    fitText(context, [{ text: first, color: RED, weight: 700, display: true }], 0, -radius * 0.28, radius * 0.3, radius * 1.3, "center");
    fitText(context, [{ text: rest.join(" "), color: RED, weight: 800, display: true }], 0, radius * 0.3, radius * 0.5, radius * 1.5, "center");
  } else fitText(context, [{ text, color: RED, weight: 800, display: true }], 0, radius * 0.15, radius * 0.45, radius * 1.5, "center");
  context.restore();
}

/** Bars like the printed strip at the foot of an airline tag; seeded by the text so a card never changes between redraws. */
function barcode(context: CanvasRenderingContext2D, seed: string, x: number, y: number, width: number, height: number) {
  let value = [...seed].reduce((total, char) => (total * 31 + char.charCodeAt(0)) >>> 0, 7);
  context.fillStyle = INK;
  for (let cursor = x; cursor < x + width;) {
    value = (value * 1103515245 + 12345) >>> 0;
    const bar = 3 + (value >> 16) % 9;
    if ((value >> 8) % 3) context.fillRect(cursor, y, Math.min(bar, x + width - cursor), height);
    cursor += bar + 4;
  }
}

export function drawCard(canvas: HTMLCanvasElement, card: Card, format: CardFormat, site: string, photo?: Photo | null, reply = "") {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  suitcase(context, width, height);
  handle(context, layout.handle);

  const holeX = TAG_X + TAG_W / 2, holeY = layout.top + 70;
  // The twine loops around the handle and through the tag's hole.
  context.strokeStyle = TWINE; context.lineWidth = 6;
  for (const offset of [-14, 14]) {
    context.beginPath(); context.moveTo(540 + offset * 2, layout.handle + 30); context.quadraticCurveTo(540 + offset * 3, (layout.handle + holeY) / 2, holeX + offset, holeY); context.stroke();
  }

  context.save();
  context.translate(holeX, holeY); context.rotate(-0.04); context.translate(-TAG_W / 2, -70);
  context.shadowColor = "#00000066"; context.shadowBlur = 30; context.shadowOffsetY = 14;
  tagShape(context, layout.height);
  context.fillStyle = KRAFT; context.fill();
  context.shadowColor = "transparent";
  context.strokeStyle = KRAFT_EDGE; context.lineWidth = 3; context.stroke();
  // Reinforced hole, with the suitcase showing through.
  context.fillStyle = "#efd9b0"; context.beginPath(); context.arc(TAG_W / 2, 70, 44, 0, Math.PI * 2); context.fill();
  context.strokeStyle = KRAFT_EDGE; context.stroke();
  context.fillStyle = CASE; context.beginPath(); context.arc(TAG_W / 2, 70, 24, 0, Math.PI * 2); context.fill();

  const left = PAD, inner = TAG_W - PAD * 2, beside = inner - 250;
  const nameX = photo ? left + 128 : left;
  if (photo) drawPhoto(context, photo, left + 54, layout.name - 18, 54, INK);
  fitText(context, [{ text: "যাত্রী", color: MUTED, weight: 600 }], nameX, layout.name - 54, 28, 200);
  fitText(context, [{ text: card.name || "একজন প্রবাসী", color: INK, weight: 700, display: true }], nameX, layout.name + 6, 50, beside - (nameX - left));
  context.strokeStyle = MUTED; context.lineWidth = 2; context.setLineDash([10, 8]);
  context.beginPath(); context.moveTo(left, layout.rule1); context.lineTo(TAG_W - PAD, layout.rule1); context.stroke();
  context.setLineDash([]);

  fitText(context, [{ text: "থেকে", color: MUTED, weight: 600 }], left, layout.from - 54, 28, 200);
  fitText(context, [{ text: card.from, color: INK, weight: 700, display: true }], left, layout.from + 6, 48, beside);
  stamp(context, card.stamp, TAG_W - PAD - 110, layout.stamp, 112);

  fitText(context, [{ text: "→ ", color: GREEN, weight: 800, display: true }, { text: card.to, color: INK, weight: 800, display: true }], left - 6, layout.to, layout.toSize, inner);
  context.fillStyle = INK; context.fillRect(left, layout.rule2, inner, 3);

  fitText(context, [{ text: card.abroad, color: INK, weight: 800, display: true }], left, layout.abroad, 62, inner);
  fitText(context, [{ text: card.eidText, color: GREEN, weight: 700, display: true }, ...(card.eids ? [{ text: "  (প্রায়)", color: MUTED, weight: 500 }] : [])], left, layout.eid, 48, inner);

  // The human line, or the family's reply, in two even lines.
  const text = reply ? replyLine(card, reply) : card.line;
  context.font = `700 42px ${DISPLAY_FONT}`;
  const full = context.measureText(text).width;
  const lines = wrapText(context, text, full > inner ? Math.min(inner, full / 2 + 60) : inner, 2);
  lines.forEach((line, index) => fitText(context, [{ text: line, color: reply ? RED : INK, weight: 700, display: true }], left, layout.line + index * 56, 42, inner));

  context.strokeStyle = MUTED; context.lineWidth = 2; context.setLineDash([4, 10]);
  context.beginPath(); context.moveTo(0, layout.perf); context.lineTo(TAG_W, layout.perf); context.stroke();
  context.setLineDash([]);
  barcode(context, `${card.from}${card.to}${card.abroad}`, left, layout.perf + 22, inner, layout.height - layout.perf - 52);
  context.restore();

  drawFooterBand(context, format, reply ? "তোমার মানুষটা কবে ফিরছে?" : "তুমি কত দিন দেশের বাইরে?", site, { band: HANDLE, ask: "#f2c36b", site: "#ffffff" });
}

export const cardBlob = (card: Card, format: CardFormat, site: string, photo?: Photo | null, reply = "") => renderCard(canvas => drawCard(canvas, card, format, site, photo, reply));
