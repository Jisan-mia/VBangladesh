import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, storySafe, type CardFormat } from "../../../shared/card-canvas";
import { ART, bankShapes, coinShapes, palette, type Shape } from "./bank-art";
import { bankLine, bn, breakText, everyWord, isBreakId, owner, progressLine, sumLine, type Bank, type Plan } from "./bank";
import { shortDate } from "../../koto-din-baki/lib/countdown";

function drawShapes(context: CanvasRenderingContext2D, shapes: Shape[]) {
  for (const shape of shapes) {
    const path = new Path2D(shape.d);
    if (shape.fill === "clay") {
      const clay = context.createRadialGradient(72, 92, 8, 100, 124, 112);
      clay.addColorStop(0, palette.clayLight); clay.addColorStop(0.55, palette.clay); clay.addColorStop(1, palette.clayDark);
      context.fillStyle = clay; context.fill(path);
    } else if (shape.fill) { context.fillStyle = shape.fill; context.fill(path); }
    if (shape.stroke) { context.strokeStyle = shape.stroke; context.lineWidth = shape.width ?? 2; context.lineCap = "round"; context.lineJoin = "round"; context.stroke(path); }
  }
}

/** The bank with its base at (cx, bottom), `scale` times the art's own size. */
function drawBank(context: CanvasRenderingContext2D, cx: number, bottom: number, scale: number, cracked: boolean) {
  context.save();
  context.translate(cx - (ART.width / 2) * scale, bottom - ART.height * scale);
  context.scale(scale, scale);
  drawShapes(context, bankShapes(cracked));
  // A coin on its way into the slot.
  if (!cracked) drawShapes(context, coinShapes(100, 60, 12));
  context.restore();
}

/** A শীতলপাটি mat under the bank: a woven check in two straw tones. */
function drawMat(context: CanvasRenderingContext2D, top: number, height: number, width: number) {
  context.fillStyle = palette.mat; context.fillRect(0, top, width, height);
  context.fillStyle = palette.matDark;
  const cell = 24;
  for (let y = 0; y < height; y += cell) for (let x = (y / cell) % 2 ? cell : 0; x < width; x += cell * 2) context.fillRect(x, top + y, cell, cell / 2);
  context.fillStyle = palette.red; context.fillRect(0, top, width, 8);
  context.fillStyle = palette.green; context.fillRect(0, top + 8, width, 5);
}

function drawTag(context: CanvasRenderingContext2D, text: string, knobX: number, knobY: number, x: number, y: number) {
  context.strokeStyle = palette.ink; context.lineWidth = 3;
  context.beginPath(); context.moveTo(knobX, knobY); context.quadraticCurveTo((knobX + x) / 2, knobY - 30, x - 10, y + 6); context.stroke();
  context.save();
  context.translate(x, y); context.rotate(-0.07);
  context.font = `700 40px "Display", "Bangla"`;
  const width = Math.min(340, context.measureText(text).width + 64);
  context.fillStyle = palette.cream; roundedRect(context, -14, -36, width, 76, 12); context.fill();
  context.strokeStyle = palette.muted; context.lineWidth = 2; context.stroke();
  context.fillStyle = palette.ink; context.beginPath(); context.arc(6, 2, 6, 0, Math.PI * 2); context.fill();
  fitText(context, [{ text, color: palette.ink, weight: 700, display: true }], 24, 16, 40, width - 50);
  context.restore();
}

export function drawCard(canvas: HTMLCanvasElement, bank: Bank, p: Plan, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const story = format === "story";
  const centre = width / 2, text = width - 160;
  const shown = bank.coins !== null;
  const full = shown && bank.coins! >= p.count;

  const sky = context.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, palette.sky); sky.addColorStop(1, palette.skyDeep);
  context.fillStyle = sky; context.fillRect(0, 0, width, height);

  // Header, top down.
  let y = story ? storySafe.top + 70 : 100;
  fitText(context, [{ text: owner(bank.name), color: palette.muted, weight: 600 }], centre, y, 36, text, "center");
  y += story ? 110 : 96;
  fitText(context, [{ text: `${everyWord(bank.every)} ${bn(bank.per)} টাকা`, color: palette.ink, weight: 800, display: true }], centre, y, story ? 104 : 92, text, "center");
  y += story ? 70 : 60;
  const until = isBreakId(bank.until) ? `${breakText(p)} · ${shortDate(p.date)} পর্যন্ত` : `${p.title} পর্যন্ত`;
  fitText(context, [{ text: until, color: palette.ink, weight: 600 }], centre, y, 36, text, "center");
  const headerBottom = y + 30;

  // Bottom block, bottom up from the footer band.
  const footerTop = story ? height - 260 : height - 96;
  let bottom = footerTop - (story ? 70 : 46);
  const lineY = bottom;
  const totalY = lineY - (story ? 100 : 86);
  const sumY = totalY - (story ? 118 : 104);
  bottom = sumY - (story ? 64 : 54);
  let barTop = 0, progressY = 0;
  if (shown) {
    progressY = bottom; barTop = progressY - (story ? 82 : 74);
    bottom = barTop - (story ? 40 : 30);
  }

  // The bank fills whatever space is left, sitting on its mat.
  const matHeight = story ? 130 : 96;
  const matTop = bottom - matHeight;
  drawMat(context, matTop, matHeight, width);
  const scale = Math.min(story ? 3.2 : 2.5, (matTop + matHeight * 0.55 - headerBottom - 10) / ART.height);
  const bankBottom = matTop + matHeight * 0.55;
  drawBank(context, centre, bankBottom, scale, full);
  if (bank.label) {
    const knobX = centre, knobY = bankBottom - (ART.height - 30) * scale;
    drawTag(context, bank.label, knobX + 10 * scale, knobY, centre + 70 * scale, knobY + 40 * scale);
  }

  if (shown) {
    const barWidth = 760, left = centre - barWidth / 2, part = Math.min(1, bank.coins! / p.count);
    context.fillStyle = "rgba(59,22,8,.16)"; roundedRect(context, left, barTop, barWidth, 28, 14); context.fill();
    if (part > 0) { context.fillStyle = full ? palette.green : palette.red; roundedRect(context, left, barTop, Math.max(28, barWidth * part), 28, 14); context.fill(); }
    fitText(context, [{ text: progressLine(bank.per, p, bank.coins!), color: palette.ink, weight: 800, display: true }], centre, progressY, story ? 54 : 48, text, "center");
  }
  fitText(context, [{ text: `${sumLine(bank, p).replace(/ = .*/, "")} =`, color: palette.muted, weight: 600 }], centre, sumY, story ? 38 : 34, text, "center");
  fitText(context, [{ text: "ভাঙলে ", color: palette.ink, weight: 700, display: true }, { text: `৳${bn(p.total)}`, color: palette.ink, weight: 800, display: true }], centre, totalY, story ? 112 : 100, text, "center");
  fitText(context, [{ text: bankLine(bank, p, bank.coins), color: palette.red, weight: 700, display: true }], centre, lineY, story ? 46 : 40, text, "center");

  drawFooterBand(context, format, "তোমার মাটির ব্যাংকে কত?", site, { band: palette.band, ask: palette.yellow, site: palette.cream });
}

export const cardBlob = (bank: Bank, p: Plan, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, bank, p, format, site));
