import { cardSizes, drawFooterBand, fitText, renderCard, wrapText, BODY_FONT, type CardFormat } from "../../../shared/card-canvas";
import type { Gate } from "./game";
import { lowWire, topWire } from "./game";
import { drawBalloon, drawGate, drawStick, makeShine, paintFar, paintShops, paintSky } from "./draw";
import { stageOf } from "./game";
import { bn, humanLine, type Card } from "./result";

const INK = "#241d1c", DEEP = "#8f1d33", ACCENT = "#c92a43", MUTED = "#6a5248";
/** Card art is drawn in play-area units, three pixels each (1080 / 360). */
const UNIT = 3;

function star(context: CanvasRenderingContext2D, x: number, y: number, r: number, on: boolean) {
  context.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, d = i % 2 ? r * 0.45 : r; context.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d); }
  context.closePath();
  context.fillStyle = on ? "#f2a900" : "#ffffff66"; context.fill();
  context.lineWidth = 4; context.strokeStyle = on ? "#a86f00" : "#6a524866"; context.stroke();
}

/**
 * The street at dusk with two crossings on the right, the balloon slipping through the first, and the score on the left.
 * `stars` is this phone's own result for a level card (never in the link), 0 for none.
 */
export function drawCard(canvas: HTMLCanvasElement, card: Card, format: CardFormat, site: string, stars = 0) {
  const { width, height } = cardSizes[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const story = format === "story";
  const band = (story ? height - 260 : height - 96) / UNIT, ground = band - 22;

  context.save();
  context.scale(UNIT, UNIT);
  paintSky(context, width / UNIT, band, ground);
  paintFar(context, width / UNIT, ground);
  paintShops(context, 720, ground);
  drawStick(context, 148, ground);
  const first: Gate = { x: 0, w: 50, y: ground - 196, gap: 124, k: -12, sagTop: 22, sagLow: 6, crows: 2, perch: 0.75, kite: 0 };
  const second: Gate = { x: 0, w: 52, y: ground - 236, gap: 118, k: 14, sagTop: 26, sagLow: 8, crows: 1, perch: 0.2, kite: -1 };
  drawGate(context, second, 352, ground, 999, 0);
  drawGate(context, first, 232, ground, 999, 0);
  const u = -0.15, mid = (topWire(first, u) + lowWire(first, u)) / 2;
  context.save();
  context.translate(232 + u * first.w, mid - 4);
  context.scale(1.55, 1.55);
  drawBalloon(context, 0, 0, 0, -0.1, 3, makeShine(context));
  context.restore();
  context.restore();

  // Text sits on the open sky at the left, clear of the hanging cables and of the story's top bar.
  const top = story ? 360 : 150, gapY = story ? 1.18 : 1;
  const at = (offset: number) => top + offset * gapY;
  fitText(context, [{ text: "তারের ফাঁকে বেলুন", color: DEEP, weight: 800, display: true }], 70, at(0), 62, 470);
  if (card.name) fitText(context, [{ text: card.name, color: INK, weight: 700, display: true }], 72, at(74), 52, 450);
  fitText(context, [{ text: `${bn(card.score)}টা`, color: ACCENT, weight: 800, display: true }], 64, at(300), 210, 470);
  fitText(context, [{ text: "ফাঁক পার করেছে", color: INK, weight: 700, display: true }], 72, at(372), 50, 450);
  context.font = `600 38px ${BODY_FONT}`;
  wrapText(context, humanLine(card.score), 450, 2).forEach((line, index) => {
    fitText(context, [{ text: line, color: INK, weight: 600 }], 72, at(450) + index * 52, 38, 450);
  });
  const settings = [card.big && "বড় ফাঁকে", card.slow && "ধীরে খেলায়"].filter(Boolean).join(", ");
  fitText(context, [{ text: `নিজের ফোনে খেলা${settings ? `, ${settings}` : ""}`, color: MUTED, weight: 600 }], 72, at(568), 26, 450);
  // Kept narrower than the text above: the balloon seller's bunch starts just right of it.
  if (card.stage) {
    fitText(context, [{ text: `লেভেল ${bn(card.stage)} · ${stageOf(card.stage).name}`, color: DEEP, weight: 700, display: true }], 72, at(630), 40, 340);
    if (stars) for (let i = 0; i < 3; i++) star(context, 104 + i * 70, at(690), 28, i < stars);
  }
  drawFooterBand(context, format, "তুমি কয়টা পার হবে?", site, { band: INK, ask: "#ffd166", site: "#ffffff" });
}

export const cardBlob = (card: Card, format: CardFormat, site: string, stars = 0) => renderCard(canvas => drawCard(canvas, card, format, site, stars));
