import { cardSizes, drawFooterBand, fitText, renderCard, type CardFormat } from "../../../shared/card-canvas";
import { cleanName } from "../../../shared/game-core";
import { levelOf, makeQuestions, starsOf } from "./game";
import { bn, humanLine, type Shared } from "./link";

export const palette = { paper: "#fbf6e9", rule: "#c9dceb", margin: "#d0463b", ink: "#1f3550", muted: "#5d6b7a", accent: "#1d5c8a", star: "#f2a900", band: "#1f3550" };

/** A page of the shop's হিসাবের খাতা: the score and stars at the top, the level's first sums written out with a red tick. */
export function drawCard(canvas: HTMLCanvasElement, data: Shared, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width;
  canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const story = format === "story", cx = width / 2, name = cleanName(data.name), top = story ? 300 : 0;

  c.fillStyle = palette.paper;
  c.fillRect(0, 0, width, height);
  // Ruled lines under each written sum (and one under the level's name), like a খাতা.
  const rows = story ? 7 : 6, rowGap = 112, startY = top + (story ? 520 : 470);
  c.strokeStyle = palette.rule; c.lineWidth = 3;
  for (let k = -1; k < rows; k++) { const y = startY + 16 + k * rowGap; c.beginPath(); c.moveTo(0, y); c.lineTo(width, y); c.stroke(); }
  c.strokeStyle = palette.margin; c.lineWidth = 4;
  c.beginPath(); c.moveTo(110, 0); c.lineTo(110, height); c.stroke();

  fitText(c, [{ text: `মুখে মুখে হিসাব · লেভেল ${bn(data.level)}`, color: palette.muted, weight: 700, display: true }], cx, top + 100, 42, 860, "center");
  fitText(c, [
    { text: name ? `${name} ` : "", color: palette.ink, weight: 700, display: true },
    { text: `${bn(data.right)}টা`, color: palette.margin, weight: 800, display: true },
    { text: name ? " হিসাব মিলিয়েছে" : " হিসাব মেলালাম", color: palette.ink, weight: 700, display: true },
  ], cx, top + 222, 88, 900, "center");
  const stars = starsOf(data.level, data.right);
  fitText(c, [
    ...[0, 1, 2].map(index => ({ text: "★", color: index < stars ? palette.star : "#d3cbb8", weight: 700 })),
    { text: `   ${bn(data.score)} পয়েন্ট`, color: palette.ink, weight: 700 },
  ], cx, top + 300, 52, 860, "center");

  // The level's first sums, each on a ruled line, answered in blue ink with a red tick.
  fitText(c, [{ text: levelOf(data.level).label, color: palette.muted, weight: 600 }], 160, startY - rowGap + 6, 36, 800);
  makeQuestions(data.level, data.seed, rows).forEach((q, index) => {
    const y = startY + index * rowGap;
    const sum = q.bazar ? q.lines.join(", ") : `${q.lines[0]} =`;
    const answer = q.bazar ? `${bn(q.answer)} টাকা` : bn(q.answer);
    fitText(c, [{ text: sum, color: palette.ink, weight: 600 }], 160, y, q.bazar ? 40 : 54, q.bazar ? 640 : 560);
    fitText(c, [{ text: answer, color: palette.accent, weight: 800, display: true }], 900, y, 54, 200, "right");
    c.strokeStyle = palette.margin; c.lineWidth = 7; c.lineCap = "round";
    c.beginPath(); c.moveTo(930, y - 22); c.lineTo(950, y); c.lineTo(990, y - 46); c.stroke();
  });

  fitText(c, [{ text: humanLine(data.level, data.right), color: palette.ink, weight: 700 }], cx, story ? 1580 : 1195, story ? 46 : 40, 940, "center");
  drawFooterBand(c, format, "তুমি কয়টা মেলাতে পারবে?", site, { band: palette.band, ask: "#ffd166", site: "#ffffff" });
}

export const cardBlob = (data: Shared, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, data, format, site));
