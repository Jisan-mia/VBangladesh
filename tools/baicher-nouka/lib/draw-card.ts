import { cardSizes, drawFooterBand, fitText, renderCard, wrapText, BODY_FONT, type CardFormat } from "../../../shared/card-canvas";
import { SCHEMES, drawBoat, drawPatch, drawRope, oarPath, paintBanks, paintWater } from "./art";
import { laneX, PLAYER_LANE, W } from "./race";
import { humanLine, ordinal, secs, type Shared } from "./result";

const INK = "#1b2a33", BLUE = "#1d5c8a", DEEP = "#123f61", RED = "#b3302a";
const S = 3; // card pixels per game unit: the river fills the card's width exactly
const BOAT = 3.6;
const MEDAL = [["", ""], ["#f2b632", "#a2620f"], ["#d9dee2", "#7d8a93"], ["#d99a62", "#8a4f22"], [BLUE, DEEP]] as const;

function boatAt(context: CanvasRenderingContext2D, index: number, x: number, bow: number) {
  context.save(); context.translate(x, bow); context.scale(BOAT, BOAT);
  context.strokeStyle = "rgba(232,246,240,0.5)"; context.lineWidth = 1.4; context.lineCap = "round";
  context.beginPath(); context.moveTo(-7, 96); context.lineTo(-24, 170); context.moveTo(7, 96); context.lineTo(24, 170); context.stroke();
  context.strokeStyle = "#ead3a2"; context.lineWidth = 1.4;
  context.beginPath(); oarPath(context, 0, 0, 0.12 + index * 0.17); context.stroke();
  drawBoat(context, SCHEMES[index]);
  context.restore();
}

/** Your boat breaking the finish rope with the rivals behind (or ahead, as it went), and a festival banner with the time and place. */
export function drawCard(canvas: HTMLCanvasElement, shared: Shared, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const story = format === "story";
  const footer = story ? height - 260 : height - 96;
  const panel = story ? { y: 300, h: 470 } : { y: 52, h: 460 };
  const rope = story ? 1090 : 790;

  context.save(); context.scale(S, S);
  paintWater(context, W, footer / S); paintBanks(context, W, footer / S);
  for (const [lane, y, look] of [[0, rope + 330, 1], [4, rope - 120, 2], [3, rope + 470, 0]] as const) {
    context.save(); context.translate(laneX(lane), y / S); drawPatch(context, look); context.restore();
  }
  context.translate(0, rope / S); drawRope(context, W);
  context.restore();

  // The rivals: those who beat you are already past the rope, the rest still pulling behind.
  const lanes = [0, 1, 4];
  for (let index = 1; index <= 3; index++) {
    const ahead = index < shared.rank;
    boatAt(context, index, laneX(lanes[index - 1]) * S, rope + (ahead ? -150 - index * 50 : 120 + index * 110));
  }
  boatAt(context, 0, laneX(PLAYER_LANE) * S + 40, rope - 60);

  // The banner.
  const left = 70, right = width - 70, top = panel.y;
  context.fillStyle = "rgba(16,34,44,0.28)"; context.beginPath(); context.roundRect(left + 10, top + 14, right - left, panel.h, 28); context.fill();
  context.fillStyle = "#fff8ea"; context.beginPath(); context.roundRect(left, top, right - left, panel.h, 28); context.fill();
  context.strokeStyle = "#e9d4ae"; context.lineWidth = 4; context.beginPath(); context.roundRect(left + 14, top + 14, right - left - 28, panel.h - 28, 18); context.stroke();
  fitText(context, [{ text: "বাইচের নৌকা", color: BLUE, weight: 800, display: true }, ...(shared.name ? [{ text: ` · ${shared.name}`, color: INK, weight: 700, display: true }] : [])], left + 56, top + 100, 54, 560);
  const [fill, ring] = MEDAL[shared.rank] ?? MEDAL[4];
  const cx = right - 160, cy = top + 210, radius = 112;
  // The time and "সেকেন্ডে" share the line left of the medal.
  const size = fitText(context, [{ text: secs(shared.tenths), color: INK, weight: 800, display: true }], left + 50, top + 275, 180, 360);
  context.font = `800 ${size}px "Display", "Bangla"`;
  const timeWidth = context.measureText(secs(shared.tenths)).width;
  fitText(context, [{ text: "সেকেন্ডে", color: RED, weight: 700, display: true }], left + 66 + timeWidth, top + 275, 52, cx - radius - 30 - (left + 66 + timeWidth));
  context.fillStyle = ring; context.beginPath(); context.arc(cx, cy, radius, 0, Math.PI * 2); context.fill();
  context.fillStyle = fill; context.beginPath(); context.arc(cx, cy, radius - 16, 0, Math.PI * 2); context.fill();
  fitText(context, [{ text: ordinal(shared.rank), color: shared.rank === 4 ? "#ffffff" : INK, weight: 800, display: true }], cx, cy + 36, 104, 160, "center");
  context.font = `700 40px ${BODY_FONT}`;
  const lines = wrapText(context, humanLine(shared.rank), right - left - 120, 2);
  lines.forEach((text, index) => fitText(context, [{ text, color: INK, weight: 700 }], width / 2, top + panel.h - 50 - (lines.length - 1 - index) * 50, 40, right - left - 100, "center"));

  drawFooterBand(context, format, "তুমি কত সেকেন্ডে পারবে?", site, { band: DEEP, ask: "#ffd166", site: "#fff8ea" });
}

export const cardBlob = (shared: Shared, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, shared, format, site));
