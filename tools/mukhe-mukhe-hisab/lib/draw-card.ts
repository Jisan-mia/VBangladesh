// The share card: a page of the world's surface (slate, ledger or ফর্দ) with the round's first sums, each marked as it
// really went: a tick for right, a teacher's cross and the right answer for wrong, nothing if the round never got there.
// An old link carries no marks, so its card writes the sums with no marks at all.
import { cardSizes, drawFooterBand, fitText, renderCard, type CardFormat } from "../../../shared/card-canvas";
import { cleanName } from "../../../shared/game-core";
import { levelOf, makeQuestions, starsOf } from "./game";
import { finaleName, worldOf, WORLD } from "./levels";
import { bn, humanLine, CARD_SUMS, type Shared } from "./link";
import { paletteOf } from "./art";

function tick(c: CanvasRenderingContext2D, x: number, y: number, color: string) {
  c.strokeStyle = color; c.lineWidth = 7; c.lineCap = "round"; c.lineJoin = "round";
  c.beginPath(); c.moveTo(x, y - 22); c.lineTo(x + 20, y); c.lineTo(x + 60, y - 46); c.stroke();
}
function cross(c: CanvasRenderingContext2D, x: number, y: number, color: string) {
  c.strokeStyle = color; c.lineWidth = 7; c.lineCap = "round";
  c.beginPath(); c.moveTo(x + 6, y - 44); c.lineTo(x + 50, y); c.moveTo(x + 50, y - 44); c.lineTo(x + 6, y); c.stroke();
}

export function drawCard(canvas: HTMLCanvasElement, data: Shared, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width;
  canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const world = worldOf(data.level), p = paletteOf(world), story = format === "story", cx = width / 2, name = cleanName(data.name), top = story ? 300 : 0;
  const finale = finaleName(data.level);

  // The surface, in a frame for the slate, plain for the ledger and the ফর্দ.
  c.fillStyle = world === 0 ? p.frame : p.surface;
  c.fillRect(0, 0, width, height);
  if (world === 0) { c.fillStyle = p.surface; c.fillRect(34, 34, width - 68, height - 68 - (story ? 260 : 96)); }
  const rows = CARD_SUMS, rowGap = story ? 120 : 108, startY = top + (story ? 520 : 470);
  c.strokeStyle = p.rule; c.lineWidth = 3;
  for (let k = -1; k < rows; k++) { const y = startY + 16 + k * rowGap; c.beginPath(); c.moveTo(world === 0 ? 34 : 0, y); c.lineTo(world === 0 ? width - 34 : width, y); c.stroke(); }
  if (world === 1) { c.strokeStyle = p.margin; c.lineWidth = 4; c.beginPath(); c.moveTo(110, 0); c.lineTo(110, height); c.stroke(); }

  fitText(c, [{ text: `মুখে মুখে হিসাব · লেভেল ${bn(data.level)}${finale ? ` · ${finale}` : ""}`, color: p.muted, weight: 700, display: true }], cx, top + 110, 42, 860, "center");
  fitText(c, [
    { text: name ? `${name} ` : "", color: p.ink, weight: 700, display: true },
    { text: `${bn(data.right)}টা`, color: p.bad, weight: 800, display: true },
    { text: name ? " হিসাব মিলিয়েছে" : " হিসাব মেলালাম", color: p.ink, weight: 700, display: true },
  ], cx, top + 228, 88, 900, "center");
  const stars = starsOf(data.level, data.right);
  fitText(c, [
    ...[0, 1, 2].map(index => ({ text: "★", color: index < stars ? "#f2a900" : p.rule, weight: 700 })),
    { text: `   ${bn(data.score)} পয়েন্ট`, color: p.ink, weight: 700 },
  ], cx, top + 306, 52, 860, "center");

  fitText(c, [{ text: `${WORLD[world].name} · ${levelOf(data.level).label}`, color: p.muted, weight: 600 }], 160, startY - rowGap + 6, 36, 800);
  makeQuestions(data.level, data.seed, rows).forEach((q, index) => {
    const y = startY + index * rowGap, mark = data.marks === null ? null : data.marks[index] ?? "";
    const sumText = q.bazar ? q.lines.join(", ") : `${q.lines[0]} =`;
    const answer = q.bazar ? `${bn(q.answer)} টাকা` : bn(q.answer);
    fitText(c, [{ text: sumText, color: p.ink, weight: 600 }], 160, y, q.bazar ? 40 : 54, q.bazar ? 600 : 520);
    if (mark === "") return; // the round ended before this sum
    fitText(c, [{ text: answer, color: mark === "0" ? p.bad : p.answer, weight: 800, display: true }], 880, y, 54, 200, "right");
    if (mark === "1") tick(c, 920, y, p.bad);
    else if (mark === "0") cross(c, 920, y, p.bad);
  });

  if (finale && stars) {
    c.save();
    c.translate(width - 210, story ? 1488 : 1102); c.rotate(-0.12);
    c.strokeStyle = p.bad; c.lineWidth = 6; c.globalAlpha = 0.85;
    c.strokeRect(-120, -46, 240, 92);
    fitText(c, [{ text: `${finale} পার`, color: p.bad, weight: 800, display: true }], 0, 16, 40, 210, "center");
    c.restore();
  }
  fitText(c, [{ text: humanLine(data.level, data.right), color: p.ink, weight: 700 }], cx, story ? 1580 : 1195, story ? 46 : 40, 940, "center");
  drawFooterBand(c, format, "তুমি কয়টা মেলাতে পারবে?", site, { band: p.band, ask: p.ask, site: "#ffffff" });
}

export const cardBlob = (data: Shared, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, data, format, site));
