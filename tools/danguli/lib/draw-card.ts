// The result card: the score in ডাং, a line, and the same field (from the seed) with each hit's arc landing on it.
import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, type CardFormat } from "../../../shared/card-canvas";
import { LOOKS, PAL, drawBatter, drawCow, drawKid, drawPond } from "./art";
import { makeField, starsOf } from "./game";
import { bn, hitLabel, humanLine, ordinal, type Card } from "./result";

export const HIT_COLORS = ["#b4372a", "#1f5f99", "#6b3fa0"];
const BAND = { band: "#23301c", ask: "#ffd166", site: "#ffffff" };

const layouts = {
  feed: { title: 120, score: 340, line: 450, chips: 520, horizon: 990, batterFeet: 1200, batterK: 100, kidsFeet: 1236 },
  story: { title: 330, score: 590, line: 710, chips: 790, horizon: 1420, batterFeet: 1610, batterK: 110, kidsFeet: 1648 },
} as const;

function tree(context: CanvasRenderingContext2D, x: number, base: number, size: number) {
  context.fillStyle = "#5a4630"; context.fillRect(x - 3, base - size, 6, size);
  context.fillStyle = PAL.far;
  context.beginPath(); context.arc(x, base - size * 1.15, size * 0.6, 0, Math.PI * 2); context.arc(x - size * 0.5, base - size * 0.85, size * 0.42, 0, Math.PI * 2); context.arc(x + size * 0.5, base - size * 0.9, size * 0.45, 0, Math.PI * 2); context.fill();
}

export function drawCard(canvas: HTMLCanvasElement, card: Card, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const field = makeField(card.seed, card.level);
  const footerTop = format === "story" ? height - 260 : height - 96;

  const sky = context.createLinearGradient(0, 0, 0, layout.horizon);
  sky.addColorStop(0, PAL.skyTop); sky.addColorStop(1, PAL.skyLow);
  context.fillStyle = sky; context.fillRect(0, 0, width, layout.horizon);
  context.fillStyle = "#fff6d880"; context.beginPath(); context.arc(width - 150, layout.horizon - 300, 120, 0, Math.PI * 2); context.fill();
  context.fillStyle = "#fffbe9"; context.beginPath(); context.arc(width - 150, layout.horizon - 300, 70, 0, Math.PI * 2); context.fill();
  for (let index = 0; index < 9; index++) tree(context, 40 + index * 128 + (index % 2) * 30, layout.horizon, 46 + (index * 23) % 22);
  context.fillStyle = PAL.grass; context.fillRect(0, layout.horizon, width, footerTop - layout.horizon);
  context.fillStyle = PAL.grassLight;
  for (let x = -60; x < width; x += 180) { context.beginPath(); context.moveTo(x, footerTop); context.lineTo(x + 90, footerTop); context.lineTo(x + 150, layout.horizon); context.lineTo(x + 110, layout.horizon); context.closePath(); context.fill(); }
  context.fillStyle = PAL.grassDark; context.fillRect(0, layout.horizon - 2, width, 4);

  // The far field on a small scale along the horizon; arcs land on it.
  const numbers = card.hits.map(hit => /\d/.test(hit) ? Number(hit) : 0);
  const reach = Math.max(36, field.cow + 3, ...numbers.map(value => value + 4));
  const left = 300, scale = (width - 60 - left) / reach, spot = (x: number) => left + x * scale, small = 34;
  drawPond(context, spot(field.pond.from), spot(field.pond.to), layout.horizon + 8, small);
  drawCow(context, spot(field.cow), layout.horizon + 8, small, false, 0);
  field.fielders.forEach((fielder, index) => drawKid(context, spot(fielder.x), layout.horizon + 8, small, LOOKS[3 + index], "ready", 0, -1));
  context.font = `700 26px "Display", "Bangla"`; context.textAlign = "center"; context.fillStyle = "#ffffffd9";
  for (let mark = 10; mark < reach; mark += 10) context.fillText(bn(mark), spot(mark), layout.horizon + 48);

  // Each scoring hit flies from the batter's ডাং to where it stopped.
  const startX = 240, startY = layout.batterFeet - 0.95 * layout.batterK;
  context.lineCap = "round";
  const badges: number[] = [];
  numbers.forEach((value, index) => {
    if (value <= 0) return;
    // Arcs fan out a little and badges of close landings stack, so three similar hits stay readable.
    const endX = spot(value), endY = layout.horizon + 10, peak = Math.min(endY - layout.chips - 130, 120 + value * 9) * (1 - index * 0.14);
    const lift = badges.filter(x => Math.abs(x - endX) < 64).length * 66;
    badges.push(endX);
    context.strokeStyle = HIT_COLORS[index]; context.lineWidth = 8; context.setLineDash([2, 22]);
    context.beginPath(); context.moveTo(startX, startY); context.quadraticCurveTo((startX + endX) / 2, endY - peak * 2, endX, endY); context.stroke();
    context.setLineDash([]);
    context.fillStyle = PAL.stickDark; context.fillRect(endX - 3, endY - 44 - lift, 6, 48 + lift);
    context.fillStyle = HIT_COLORS[index];
    context.beginPath(); context.arc(endX, endY - 70 - lift, 30, 0, Math.PI * 2); context.fill();
    context.font = `800 30px "Display", "Bangla"`; context.fillStyle = "#ffffff"; context.fillText(bn(value), endX, endY - 59 - lift);
  });

  context.fillStyle = "#3a2a1a"; context.beginPath(); context.ellipse(startX + 10, layout.batterFeet + 4, 34, 9, 0, 0, Math.PI * 2); context.fill();
  drawBatter(context, 150, layout.batterFeet, layout.batterK, -1.05);
  const cheering = card.total >= 25;
  for (let index = 0; index < 3; index++) drawKid(context, width - 250 + index * 80, layout.kidsFeet, 62, LOOKS[index], cheering ? "cheer" : card.total > 0 ? "idle" : "groan", index * 0.6, -1);

  // The title row also carries the level and, when the rival was beaten, its stars.
  const earned = starsOf(card.total, card.level);
  fitText(context, [
    { text: "ডাংগুলি", color: PAL.accent, weight: 800, display: true },
    ...(card.name ? [{ text: ` · ${card.name}`, color: PAL.ink, weight: 700, display: true }] : []),
    { text: ` · লেভেল ${bn(card.level)}`, color: PAL.ink, weight: 700, display: true },
    ...(earned ? [{ text: " ", color: PAL.ink }, ...[0, 1, 2].map(star => ({ text: "★", color: star < earned ? "#e39b00" : "#ffffffb0", weight: 700 }))] : []),
  ], width / 2, layout.title, 54, 940, "center");
  fitText(context, [{ text: bn(card.total), color: PAL.ink, weight: 800, display: true }, { text: " ডাং", color: PAL.accent, weight: 800, display: true }], width / 2, layout.score, 210, 900, "center");
  fitText(context, [{ text: humanLine(card.total), color: PAL.ink, weight: 600 }], width / 2, layout.line, 50, 940, "center");

  const chipW = 290, gap = 22, chipY = layout.chips;
  card.hits.forEach((hit, index) => {
    const x = width / 2 + (index - 1) * (chipW + gap) - chipW / 2;
    context.fillStyle = "#fffdf6"; roundedRect(context, x, chipY, chipW, 72, 36); context.fill();
    context.fillStyle = HIT_COLORS[index]; context.beginPath(); context.arc(x + 38, chipY + 36, 14, 0, Math.PI * 2); context.fill();
    fitText(context, [{ text: `${ordinal(index)}  `, color: "#6b6b5a", weight: 600 }, { text: hitLabel(hit), color: PAL.ink, weight: 800, display: true }], x + 64, chipY + 48, 34, chipW - 84);
  });

  drawFooterBand(context, format, "তুমি কত ডাং পারবে?", site, BAND);
}

export const cardBlob = (card: Card, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, card, format, site));
