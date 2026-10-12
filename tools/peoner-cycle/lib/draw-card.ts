import { cardSizes, drawFooterBand, fitText, renderCard, wrapText, BODY_FONT, DISPLAY_FONT, type CardFormat } from "../../../shared/card-canvas";
import { C, drawBanana, drawBike, drawBush, drawCow, drawGoat, drawHay, drawLetter, drawPalm, paintRoad } from "./art";
import { bn, detailLine, humanLine, type Shared } from "./result";
import { LANE_W, LANES, ROAD_L, starsOf, W } from "./ride";

const INK = "#2b2118", TEAL = "#1d5f50", DEEP = "#174c40", RUST = "#b4532a";
const S = 3; // card pixels per game unit: the road fills the card's width exactly

function at(context: CanvasRenderingContext2D, x: number, y: number, scale: number, paint: () => void, rotate = 0) {
  context.save(); context.translate(x, y); context.rotate(rotate); context.scale(scale, scale); paint(); context.restore();
}

/** Our own stamp: a sun over a road in a perforated frame, with a wavy cancel line. No real post office's marks. */
function stamp(context: CanvasRenderingContext2D, x: number, y: number) {
  context.fillStyle = "#fffaf0";
  context.beginPath();
  for (let i = 0; i <= 10; i++) { context.moveTo(x + i * 10 + 5, y); context.arc(x + i * 10, y, 5, 0, Math.PI * 2); context.moveTo(x + i * 10 + 5, y + 120); context.arc(x + i * 10, y + 120, 5, 0, Math.PI * 2); }
  context.fill();
  context.fillStyle = C.stamp; context.fillRect(x + 6, y + 8, 88, 104);
  context.fillStyle = "#ffd98a"; context.beginPath(); context.arc(x + 50, y + 54, 22, 0, Math.PI * 2); context.fill();
  context.fillStyle = "#f6c9a0"; context.beginPath(); context.moveTo(x + 36, y + 112); context.lineTo(x + 46, y + 74); context.lineTo(x + 54, y + 74); context.lineTo(x + 64, y + 112); context.fill();
  context.strokeStyle = "#2b211866"; context.lineWidth = 4;
  context.beginPath();
  for (let row = 0; row < 3; row++) { context.moveTo(x - 70, y + 34 + row * 22); for (let i = 0; i <= 6; i++) context.quadraticCurveTo(x - 60 + i * 20, y + 24 + row * 22 + (i % 2 ? 0 : 20), x - 50 + i * 20, y + 34 + row * 22); }
  context.stroke();
}

/** An envelope with the score written on it, the bike below slipping past a cow with the bell ringing, letters in the air. */
export function drawCard(canvas: HTMLCanvasElement, shared: Shared, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const story = format === "story";
  const footer = story ? height - 260 : height - 96;
  const env = story ? { y: 300, h: 520 } : { y: 70, h: 480 };
  const bikeY = story ? 1010 : 700;

  context.save(); context.scale(S, S); paintRoad(context, W, footer / S, ROAD_L, LANE_W, LANES); context.restore();
  const light = context.createLinearGradient(0, 0, 0, height * 0.45);
  light.addColorStop(0, "rgba(255,206,160,0.8)"); light.addColorStop(1, "rgba(255,236,210,0)");
  context.fillStyle = light; context.fillRect(0, 0, width, height * 0.45);
  for (const [x, y, paint, scale] of [[70, env.y + env.h + 120, drawPalm, 3.4], [1010, env.y + env.h + 60, drawBanana, 3.2], [60, bikeY + 330, drawHay, 3], [1030, bikeY + 300, drawBush, 3.4], [1000, env.y - 30, drawPalm, 3], [60, env.y + 120, drawBush, 3]] as const)
    at(context, x, y, scale, () => paint(context));

  // The ride: a goat to the left, a cow to the right, the bike squeezing between with its bell ringing.
  const lane = (index: number) => (ROAD_L + LANE_W * (index + 0.5)) * S;
  at(context, lane(0), bikeY + 200, 3.3, () => drawGoat(context, 0));
  at(context, lane(2), bikeY + 330, 3.1, () => drawCow(context, 0));
  at(context, lane(1), bikeY - 20, 5.4, () => drawBike(context, 1), -0.08);
  context.strokeStyle = RUST; context.lineWidth = 8; context.lineCap = "round";
  for (const r of [60, 100]) { context.beginPath(); context.arc(lane(1) + 50, bikeY + 52, r, -1.2, 0.3); context.stroke(); }
  context.font = `800 60px ${DISPLAY_FONT}`; context.textAlign = "left"; context.lineJoin = "round";
  context.lineWidth = 12; context.strokeStyle = C.paper; context.strokeText("ক্রিং!", lane(1) + 96, bikeY - 4);
  context.fillStyle = RUST; context.fillText("ক্রিং!", lane(1) + 96, bikeY - 4);
  for (const [dx, dy, r, s] of [[-210, -40, -0.4, 3.6], [-120, -170, 0.2, 2.8], [250, -150, 0.35, 3.2], [-260, 110, 0.5, 2.6], [90, -230, -0.25, 3]] as const)
    at(context, lane(1) + dx, bikeY + dy, s, () => drawLetter(context, 1), r);

  // The envelope: the name of the game, the score, the details.
  const left = 100, right = width - 100, top = env.y, bottom = env.y + env.h;
  context.fillStyle = "#2b211833"; context.beginPath(); context.roundRect(left + 10, top + 14, right - left, env.h, 22); context.fill();
  context.fillStyle = C.paper; context.beginPath(); context.roundRect(left, top, right - left, env.h, 22); context.fill();
  context.strokeStyle = "#f1e4cc"; context.lineWidth = 5; context.lineJoin = "round";
  context.beginPath(); context.moveTo(left + 14, top + 14); context.lineTo(width / 2, top + env.h * 0.44); context.lineTo(right - 14, top + 14); context.stroke();
  context.strokeStyle = "#c9a77a"; context.lineWidth = 4; context.beginPath(); context.roundRect(left, top, right - left, env.h, 22); context.stroke();
  stamp(context, right - 140, top + 34);
  // The title row also carries the route and, once its letters were delivered, its stars.
  const earned = starsOf(shared.meters, shared.level);
  fitText(context, [
    { text: "পিয়নের সাইকেল", color: TEAL, weight: 800, display: true },
    ...(shared.name ? [{ text: ` · ${shared.name}`, color: INK, weight: 700, display: true }] : []),
    { text: ` · রুট ${bn(shared.level)}`, color: INK, weight: 700, display: true },
    ...(earned ? [{ text: " ", color: INK }, ...[0, 1, 2].map(star => ({ text: "★", color: star < earned ? "#e39b00" : "#d8c7a6", weight: 700 }))] : []),
  ], left + 50, top + 110, 56, right - left - 250);
  fitText(context, [{ text: bn(shared.score), color: INK, weight: 800, display: true }], width / 2, top + env.h * 0.66, 200, 760, "center");
  fitText(context, [{ text: detailLine(shared), color: RUST, weight: 700 }], width / 2, top + env.h - 50, 42, right - left - 80, "center");

  const panelH = story ? 170 : 128, panelY = footer - panelH - (story ? 40 : 26);
  context.fillStyle = "#fffaf0ee"; context.beginPath(); context.roundRect(70, panelY, width - 140, panelH, 28); context.fill();
  context.font = `700 44px ${BODY_FONT}`;
  const lines = wrapText(context, humanLine(shared.score), 860, 2);
  lines.forEach((text, index) => fitText(context, [{ text, color: INK, weight: 700 }], width / 2, panelY + panelH / 2 + 15 + (index - (lines.length - 1) / 2) * 56, 44, 880, "center"));
  drawFooterBand(context, format, "তুমি কত দূর যেতে পারবে?", site, { band: DEEP, ask: "#ffd166", site: "#fffaf0" });
}

export const cardBlob = (shared: Shared, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, shared, format, site));
