import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, wrapText, DISPLAY_FONT, type CardFormat } from "../../../shared/card-canvas";
import type { Card } from "./bhori";

const VELVET = "#a3122a";
const VELVET_DEEP = "#5c0716";
const VELVET_SHEEN = "#d42e4a";
const SATIN = "#f8eedb";
const SATIN_SHADE = "#e6d2ad";
const GOLD = "#e0ac2a";
const GOLD_LIGHT = "#fbe39a";
const GOLD_DEEP = "#8a5d07";
const MEMO = "#fffbec";
const PRINT = "#b3262c";
const PEN = "#1f3a9e";

// The open box: the lid (satin, with the memo tucked in) on top, the velvet tray holding the piece below.
const layouts = {
  feed: { kicker: 0, lid: 54, lidH: 560, tray: 634, trayH: 452, line: 1150 },
  story: { kicker: 330, lid: 380, lidH: 580, tray: 984, trayH: 480, line: 1540 },
} as const;

/** Velvet: deep red, a soft sheen where the light falls, and a fixed speckle for the pile. */
function velvet(context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, sheenX: number, sheenY: number) {
  context.fillStyle = VELVET;
  context.fillRect(x, y, w, h);
  const sheen = context.createRadialGradient(sheenX, sheenY, 10, sheenX, sheenY, Math.max(w, h) * 0.75);
  sheen.addColorStop(0, VELVET_SHEEN); sheen.addColorStop(0.45, VELVET); sheen.addColorStop(1, VELVET_DEEP);
  context.fillStyle = sheen;
  context.fillRect(x, y, w, h);
  let seed = 7;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let index = 0; index < (w * h) / 260; index++) {
    context.fillStyle = random() > 0.5 ? "#ffffff0d" : "#0000001a";
    context.fillRect(x + random() * w, y + random() * h, 2, 2);
  }
}

/** The tray's cushion with the slit the piece is pressed into. */
function tray(context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  context.save();
  roundedRect(context, x, y, w, h, 26); context.clip();
  velvet(context, x, y, w, h, x + w * 0.35, y + h * 0.3);
  context.restore();
  context.strokeStyle = GOLD; context.lineWidth = 6;
  roundedRect(context, x, y, w, h, 26); context.stroke();
  const inset = 44;
  context.save();
  roundedRect(context, x + inset, y + inset, w - inset * 2, h - inset * 2, 60); context.clip();
  velvet(context, x + inset, y + inset, w - inset * 2, h - inset * 2, x + w * 0.4, y + h * 0.35);
  context.strokeStyle = "#00000055"; context.lineWidth = 6;
  context.beginPath(); context.moveTo(x + inset + 40, y + h / 2); context.lineTo(x + w - inset - 40, y + h / 2); context.stroke();
  context.restore();
  context.shadowColor = "#00000066"; context.shadowBlur = 18;
  context.strokeStyle = VELVET_DEEP; context.lineWidth = 4;
  roundedRect(context, x + inset, y + inset, w - inset * 2, h - inset * 2, 60); context.stroke();
  context.shadowColor = "transparent";
}

/** The piece, in gold wire: a dark edge, the gold body and a thin highlight. */
export function drawJewel(context: CanvasRenderingContext2D, drawing: string, cx: number, cy: number, size: number) {
  const scale = size / 48, path = new Path2D(drawing);
  context.save();
  context.translate(cx - size / 2, cy - size / 2); context.scale(scale, scale);
  context.lineCap = "round"; context.lineJoin = "round";
  context.shadowColor = "#000000aa"; context.shadowBlur = 24; context.shadowOffsetY = 10;
  context.strokeStyle = GOLD_DEEP; context.lineWidth = 3.6; context.stroke(path);
  context.shadowColor = "transparent";
  const gold = context.createLinearGradient(0, 0, 48, 48);
  gold.addColorStop(0, GOLD_LIGHT); gold.addColorStop(0.45, GOLD); gold.addColorStop(1, "#b9820f");
  context.strokeStyle = gold; context.lineWidth = 2.4; context.stroke(path);
  context.translate(-0.35, -0.35);
  context.strokeStyle = "#fff6d0cc"; context.lineWidth = 0.6; context.stroke(path);
  context.restore();
}

/** The "দাম: অমূল্য" rubber stamp: there is no price on this memo. */
function stamp(context: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
  context.save();
  context.translate(cx, cy); context.rotate(-0.24);
  context.globalAlpha = 0.82;
  context.strokeStyle = PRINT; context.lineWidth = 5;
  context.beginPath(); context.arc(0, 0, radius, 0, Math.PI * 2); context.stroke();
  context.lineWidth = 2;
  context.beginPath(); context.arc(0, 0, radius - 11, 0, Math.PI * 2); context.stroke();
  fitText(context, [{ text: "দাম", color: PRINT, weight: 700 }], 0, -radius * 0.14, radius * 0.34, radius * 1.2, "center");
  fitText(context, [{ text: "অমূল্য", color: PRINT, weight: 800, display: true }], 0, radius * 0.4, radius * 0.46, radius * 1.5, "center");
  context.restore();
}

/** The hand-written cash memo tucked into the lid. */
function memo(context: CanvasRenderingContext2D, card: Card, cx: number, cy: number, w: number, h: number) {
  context.save();
  context.translate(cx, cy); context.rotate(-0.025); context.translate(-w / 2, -h / 2);
  context.shadowColor = "#5c071655"; context.shadowBlur = 22; context.shadowOffsetY = 8;
  context.fillStyle = MEMO; context.fillRect(0, 0, w, h);
  context.shadowColor = "transparent";
  fitText(context, [{ text: "ক্যাশ মেমো", color: PRINT, weight: 800, display: true }], w / 2, 68, 46, w - 80, "center");
  context.strokeStyle = PRINT; context.lineWidth = 3;
  for (const y of [92, 99]) { context.beginPath(); context.moveTo(30, y); context.lineTo(w - 30, y); context.stroke(); }
  const rows: Array<[string, string, number]> = [["গয়না", card.title, 50], ["ওজন", card.weight, 58], ["গ্রামে", `${card.grams} গ্রাম`, 58]];
  rows.forEach(([label, value, size], index) => {
    const y = 176 + index * 84;
    fitText(context, [{ text: `${label}:`, color: PRINT, weight: 600 }], 36, y, 28, 110);
    context.strokeStyle = "#b3262c66"; context.lineWidth = 2; context.setLineDash([3, 7]);
    context.beginPath(); context.moveTo(140, y + 12); context.lineTo(w - 36, y + 12); context.stroke();
    context.setLineDash([]);
    fitText(context, [{ text: value, color: PEN, weight: 700, display: true }], 150, y - 4, size, w - 340);
  });
  fitText(context, [{ text: "১ ভরি = ১৬ আনা = ৯৬ রতি = ১১.৬৬৪ গ্রাম (বাজুসের হিসাব)", color: PRINT, weight: 500 }], w / 2, h - 26, 22, w - 60, "center");
  stamp(context, w - 108, 262, 78);
  context.restore();
}

export function drawCard(canvas: HTMLCanvasElement, card: Card, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  velvet(context, 0, 0, width, height, width * 0.3, height * 0.15);
  if (layout.kicker) fitText(context, [{ text: "পুরোনো গয়নার ওজন · ভরির হিসাব", color: GOLD_LIGHT, weight: 700, display: true }], width / 2, layout.kicker, 38, 900, "center");

  const x = 66, w = width - 132;
  // Lid: satin inside a gold rim, quilted faintly.
  context.shadowColor = "#00000077"; context.shadowBlur = 30; context.shadowOffsetY = 12;
  context.fillStyle = SATIN; roundedRect(context, x, layout.lid, w, layout.lidH, 26); context.fill();
  context.shadowColor = "transparent";
  context.save();
  roundedRect(context, x, layout.lid, w, layout.lidH, 26); context.clip();
  const satin = context.createLinearGradient(x, layout.lid, x + w, layout.lid + layout.lidH);
  satin.addColorStop(0, "#fffaf0"); satin.addColorStop(0.5, SATIN); satin.addColorStop(1, SATIN_SHADE);
  context.fillStyle = satin; context.fillRect(x, layout.lid, w, layout.lidH);
  context.strokeStyle = "#d9c193aa"; context.lineWidth = 2;
  for (let offset = -layout.lidH; offset < w; offset += 64) {
    context.beginPath(); context.moveTo(x + offset, layout.lid); context.lineTo(x + offset + layout.lidH, layout.lid + layout.lidH); context.stroke();
    context.beginPath(); context.moveTo(x + offset + layout.lidH, layout.lid); context.lineTo(x + offset, layout.lid + layout.lidH); context.stroke();
  }
  context.restore();
  context.strokeStyle = GOLD; context.lineWidth = 6;
  roundedRect(context, x, layout.lid, w, layout.lidH, 26); context.stroke();
  memo(context, card, width / 2, layout.lid + layout.lidH / 2, 780, 452);

  tray(context, x, layout.tray, w, layout.trayH);
  drawJewel(context, card.item.drawing, width / 2, layout.tray + layout.trayH / 2, layout.trayH * 0.74);

  // The human line in white, in at most two even lines.
  const lineWidth = width - 180;
  context.font = `700 44px ${DISPLAY_FONT}`;
  const full = context.measureText(card.line).width;
  const lines = wrapText(context, card.line, full > lineWidth ? Math.min(lineWidth, full / 2 + 70) : lineWidth, 2);
  lines.forEach((line, index) => fitText(context, [{ text: line, color: "#ffffff", weight: 700, display: true }], width / 2, layout.line + (lines.length === 1 ? 30 : 0) + index * 60, 44, lineWidth, "center"));

  drawFooterBand(context, format, "তোমার বাড়ির পুরোনো গয়নাটা কার?", site, { band: VELVET_DEEP, ask: GOLD_LIGHT, site: "#ffffff" });
}

export const cardBlob = (card: Card, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, card, format, site));
