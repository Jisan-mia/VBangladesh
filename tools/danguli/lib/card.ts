// The result card (the same layout as before the rewrite): the score in ডাং, a line, the three hits as chips, and the same
// field (from the seed) with each hit's arc landing on it, now in its মাঠ's palette and with its name and level.
import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, type CardFormat } from "../../../shared/card-canvas";
import { cleanName } from "../../../shared/game-core";
import { LOOKS, PAL, drawBatter, drawKid } from "./art";
import { hitValue, type Shared } from "./challenge";
import { levelDef, starsOf } from "./levels";
import { bn, hitLabel, humanLine, levelLabel, ordinal } from "./lines";
import { createRound } from "./round";
import { PALETTES, SAND, WATER, WET } from "./scene";

export const HIT_COLORS = ["#b4372a", "#1f5f99", "#6b3fa0"];
const BAND = { band: "#23301c", ask: "#ffd166", site: "#ffffff" };

const layouts = {
  feed: { title: 120, score: 340, line: 450, chips: 520, horizon: 990, batterFeet: 1200, batterK: 100, kidsFeet: 1236 },
  story: { title: 330, score: 590, line: 710, chips: 790, horizon: 1420, batterFeet: 1610, batterK: 110, kidsFeet: 1648 },
} as const;

function tree(c: CanvasRenderingContext2D, x: number, base: number, size: number, color: string) {
  c.fillStyle = "#5a4630"; c.fillRect(x - 3, base - size, 6, size);
  c.fillStyle = color;
  c.beginPath(); c.arc(x, base - size * 1.15, size * 0.6, 0, Math.PI * 2); c.arc(x - size * 0.5, base - size * 0.85, size * 0.42, 0, Math.PI * 2); c.arc(x + size * 0.5, base - size * 0.9, size * 0.45, 0, Math.PI * 2); c.fill();
}

export function drawCard(canvas: HTMLCanvasElement, shared: Shared, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format], layout = layouts[format];
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const def = levelDef(shared.level), p = PALETTES[def.world], field = createRound(shared.seed, shared.level, shared.mode);
  const footerTop = format === "story" ? height - 260 : height - 96;

  const sky = c.createLinearGradient(0, 0, 0, layout.horizon);
  sky.addColorStop(0, p.skyTop); sky.addColorStop(1, p.skyLow);
  c.fillStyle = sky; c.fillRect(0, 0, width, layout.horizon);
  if (def.world !== 2) {
    c.fillStyle = "#fff6d880"; c.beginPath(); c.arc(width - 150, layout.horizon - 300, 120, 0, Math.PI * 2); c.fill();
    c.fillStyle = p.sun; c.beginPath(); c.arc(width - 150, layout.horizon - 300, 70, 0, Math.PI * 2); c.fill();
  }
  for (let i = 0; i < 9; i++) tree(c, 40 + i * 128 + (i % 2) * 30, layout.horizon, 46 + (i * 23) % 22, i % 3 === 1 ? p.farDark : p.far);
  c.fillStyle = p.grass; c.fillRect(0, layout.horizon, width, footerTop - layout.horizon);
  c.fillStyle = p.grassLight;
  for (let x = -60; x < width; x += 180) { c.beginPath(); c.moveTo(x, footerTop); c.lineTo(x + 90, footerTop); c.lineTo(x + 150, layout.horizon); c.lineTo(x + 110, layout.horizon); c.closePath(); c.fill(); }
  c.fillStyle = p.grassDark; c.fillRect(0, layout.horizon - 2, width, 4);

  // The far field on a small scale along the horizon; the arcs land on it.
  const numbers = shared.hits.map(hitValue);
  const reach = Math.max(36, ...numbers.map(value => value + 4));
  const left = 300, scale = (width - 60 - left) / reach, spot = (x: number) => left + x * scale, small = 34, y0 = layout.horizon + 8;
  if (field.sandTo > 0) { c.fillStyle = SAND; c.fillRect(spot(field.sandFrom), layout.horizon, (field.sandTo - field.sandFrom) * scale, 16); }
  if (field.wetTo > 0) { c.fillStyle = WET; c.fillRect(spot(field.wetFrom), layout.horizon, (field.wetTo - field.wetFrom) * scale, 10); }
  if (field.pondTo > 0) {
    c.fillStyle = WATER;
    c.beginPath(); c.ellipse((spot(field.pondFrom) + spot(field.pondTo)) / 2, y0, (field.pondTo - field.pondFrom) * scale / 2, 10, 0, 0, Math.PI * 2); c.fill();
  }
  for (let i = 0; i < field.fn; i++) drawKid(c, spot(field.fx0[i]), y0, small * (i === field.longArm ? 1.25 : 1), LOOKS[i === field.cap ? 4 : 3 + (i % 2)], "ready", 0, -1);
  c.font = `700 26px "Display", "Bangla"`; c.textAlign = "center"; c.fillStyle = "#ffffffd9";
  for (let mark = 10; mark < reach; mark += 10) c.fillText(bn(mark), spot(mark), layout.horizon + 48);

  // Each scoring hit flies from the batter's ডাং to where it stopped.
  const startX = 240, startY = layout.batterFeet - 0.95 * layout.batterK;
  c.lineCap = "round";
  const badges: number[] = [];
  numbers.forEach((value, index) => {
    if (value <= 0) return;
    // Arcs fan out a little and badges of close landings stack, so three similar hits stay readable.
    const endX = spot(value), endY = layout.horizon + 10, peak = Math.min(endY - layout.chips - 130, 120 + value * 9) * (1 - index * 0.14);
    const lift = badges.filter(x => Math.abs(x - endX) < 64).length * 66;
    badges.push(endX);
    c.strokeStyle = HIT_COLORS[index]; c.lineWidth = 8; c.setLineDash([2, 22]);
    c.beginPath(); c.moveTo(startX, startY); c.quadraticCurveTo((startX + endX) / 2, endY - peak * 2, endX, endY); c.stroke();
    c.setLineDash([]);
    c.fillStyle = PAL.stickDark; c.fillRect(endX - 3, endY - 44 - lift, 6, 48 + lift);
    c.fillStyle = HIT_COLORS[index];
    c.beginPath(); c.arc(endX, endY - 70 - lift, 30, 0, Math.PI * 2); c.fill();
    c.font = `800 30px "Display", "Bangla"`; c.fillStyle = "#ffffff"; c.fillText(bn(value), endX, endY - 59 - lift);
  });

  c.fillStyle = "#3a2a1a"; c.beginPath(); c.ellipse(startX + 10, layout.batterFeet + 4, 34, 9, 0, 0, Math.PI * 2); c.fill();
  drawBatter(c, 150, layout.batterFeet, layout.batterK, -1.05);
  const cheering = shared.total >= 25;
  for (let i = 0; i < 3; i++) drawKid(c, width - 250 + i * 80, layout.kidsFeet, 62, LOOKS[i], cheering ? "cheer" : shared.total > 0 ? "idle" : "groan", i * 0.6, -1);

  // The title row carries the মাঠ, the level and, when the neighbour was beaten, the stars.
  const earned = shared.old ? 0 : starsOf(shared.total, shared.level, shared.mode), name = cleanName(shared.name);
  fitText(c, [
    { text: "ডাংগুলি", color: PAL.accent, weight: 800, display: true },
    ...(name ? [{ text: ` · ${name}`, color: PAL.ink, weight: 700, display: true }] : []),
    { text: ` · ${levelLabel(shared.level)}`, color: PAL.ink, weight: 700, display: true },
    ...(earned ? [{ text: " ", color: PAL.ink }, ...[0, 1, 2].map(star => ({ text: "★", color: star < earned ? "#e39b00" : "#ffffffb0", weight: 700 }))] : []),
  ], width / 2, layout.title, 50, 960, "center");
  fitText(c, [{ text: bn(shared.total), color: PAL.ink, weight: 800, display: true }, { text: " ডাং", color: PAL.accent, weight: 800, display: true }], width / 2, layout.score, 210, 900, "center");
  fitText(c, [{ text: `${def.rival.short}: ${bn(def.target)} · ${humanLine(shared.total)}`, color: PAL.ink, weight: 600 }], width / 2, layout.line, 46, 960, "center");

  const chipW = 290, gap = 22, chipY = layout.chips;
  shared.hits.forEach((hit, index) => {
    const x = width / 2 + (index - 1) * (chipW + gap) - chipW / 2;
    c.fillStyle = "#fffdf6"; roundedRect(c, x, chipY, chipW, 72, 36); c.fill();
    c.fillStyle = HIT_COLORS[index]; c.beginPath(); c.arc(x + 38, chipY + 36, 14, 0, Math.PI * 2); c.fill();
    fitText(c, [{ text: `${ordinal(index)}  `, color: "#6b6b5a", weight: 600 }, { text: hitLabel(hit), color: PAL.ink, weight: 800, display: true }], x + 64, chipY + 48, 34, chipW - 84);
  });

  drawFooterBand(c, format, "তুমি কত ডাং পারবে?", site, BAND);
}

export const cardBlob = (shared: Shared, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, shared, format, site));
