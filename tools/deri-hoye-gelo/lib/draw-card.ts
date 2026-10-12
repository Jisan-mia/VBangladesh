import { cardSizes, drawFooterBand, fitText, renderCard, wrapText, BODY_FONT, type CardFormat } from "../../../shared/card-canvas";
import { drawCow, drawGate, drawKid, drawMilestone, jumpUpPose } from "./art";
import { paintBrick, paintLane, FAR_H, TILE } from "./draw-scene";
import { bn, headline, humanLine, type Shared } from "./result";
import { dayOf, girlFor, GATE_M } from "./road";

const NAVY = "#1f2a44", RED = "#b23a2e", CREAM = "#fff7e6";

function star(context: CanvasRenderingContext2D, x: number, y: number, r: number, on: boolean) {
  context.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, d = i % 2 ? r * 0.45 : r; context.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d); }
  context.closePath();
  context.fillStyle = on ? "#ffc93c" : "#ffffff88"; context.fill();
  context.lineWidth = 4; context.strokeStyle = on ? "#a86f00" : "#1f2a4455"; context.stroke();
}

/**
 * The kid mid-leap over a cow on the brick lane, the মিটার big in the morning sky, a road stone (or the gate) ahead.
 * `stars` is this phone's own result for a day (never in the link), 0 for none.
 */
export function drawCard(canvas: HTMLCanvasElement, shared: Shared, format: CardFormat, site: string, stars = 0) {
  const { width, height } = cardSizes[format];
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const story = format === "story";
  const top = story ? 250 : 0, ground = story ? 1390 : 980, footer = story ? height - 260 : height - 96;
  const cx = width / 2, gate = shared.day ? dayOf(shared.day).gate : GATE_M;

  // A clean morning sky (the text sits on it), a kite low on the left, then the lane's houses and the brick road.
  const sky = context.createLinearGradient(0, 0, 0, ground - 100);
  sky.addColorStop(0, "#8ccbe9"); sky.addColorStop(0.6, "#cde8f0"); sky.addColorStop(1, "#fff0cf");
  context.fillStyle = sky; context.fillRect(0, 0, width, ground - 90);
  const sun = context.createRadialGradient(920, ground - 470, 20, 920, ground - 470, 170);
  sun.addColorStop(0, "#fffbe8"); sun.addColorStop(0.3, "#fff6cf"); sun.addColorStop(0.31, "#fffbe8aa"); sun.addColorStop(1, "#fffbe800");
  context.fillStyle = sun; context.fillRect(700, ground - 660, 380, 380);
  context.save(); context.translate(150, ground - 470); context.rotate(0.2); context.scale(3.4, 3.4);
  context.fillStyle = "#e5483b"; context.beginPath(); context.moveTo(0, -9); context.lineTo(7, 0); context.lineTo(0, 9); context.lineTo(-7, 0); context.closePath(); context.fill();
  context.fillStyle = "#ffd166"; context.beginPath(); context.moveTo(0, -9); context.lineTo(7, 0); context.lineTo(0, 0); context.closePath(); context.fill();
  context.strokeStyle = "#7a2b22"; context.lineWidth = 0.6; context.beginPath(); context.moveTo(0, 9); context.quadraticCurveTo(-4, 16, 2, 22); context.stroke();
  context.restore();
  const far = 3.4;
  context.save(); context.translate(-260, ground - 92 - FAR_H * far); context.scale(far, far); paintLane(context); context.restore();
  const tile = 5;
  for (let x = 0; x < width; x += TILE * tile) { context.save(); context.translate(x, ground - 90); context.scale(tile, tile); paintBrick(context); context.restore(); }
  context.fillStyle = "#6f9440"; context.fillRect(0, ground - 90 + 62 * tile - 2, width, Math.max(0, footer - (ground - 90 + 62 * tile - 2)));

  if (shared.meters >= gate) {
    context.save(); context.translate(860, ground - 70); context.scale(3.2, 3.2); drawGate(context, "স্কুল", `700 9px ${BODY_FONT}`); context.restore();
  } else {
    context.save(); context.translate(905, ground - 64); context.scale(7, 7); drawMilestone(context); context.restore();
    fitText(context, [{ text: "গেট", color: "#3a3226", weight: 700 }], 905, ground - 64 - 60, 34, 90, "center");
    fitText(context, [{ text: `${bn(gate - shared.meters)} মি`, color: "#3a3226", weight: 800, display: true }], 905, ground - 64 - 18, 30, 92, "center");
  }

  // Speed lines behind the kid, the cow below, the kid at the top of the leap.
  context.strokeStyle = "#ffffffb3"; context.lineCap = "round";
  for (const [x, y, w] of [[300, ground - 300, 64], [280, ground - 252, 80]] as const) { context.lineWidth = 7; context.beginPath(); context.moveTo(x, y); context.lineTo(x + w, y); context.stroke(); }
  context.save(); context.translate(560, ground); context.scale(5.6, 5.6); drawCow(context); context.restore();
  context.fillStyle = "#3a2a1a22"; context.beginPath(); context.ellipse(470, ground + 6, 70, 12, 0, 0, Math.PI * 2); context.fill();
  context.save(); context.translate(470, ground - 236); context.scale(7.2, 7.2); drawKid(context, jumpUpPose, girlFor(shared.seed)); context.restore();

  fitText(context, [{ text: "দেরি হয়ে গেল!", color: RED, weight: 800, display: true }, ...(shared.day ? [{ text: ` · ${dayOf(shared.day).name}`, color: RED, weight: 700, display: true }] : []), ...(shared.name ? [{ text: ` · ${shared.name}`, color: NAVY, weight: 700, display: true }] : [])], cx, top + 120, 54, 920, "center");
  fitText(context, [{ text: bn(shared.meters), color: NAVY, weight: 800, display: true }, { text: " মিটার", color: NAVY, weight: 700, display: true }], cx, top + 282, 168, 940, "center");
  fitText(context, [{ text: headline(shared.meters, gate), color: RED, weight: 700, display: true }], cx, top + 366, 52, 900, "center");
  // The stars sit in the sky on the right, clear of the kid mid-leap on the left.
  if (stars) for (let i = 0; i < 3; i++) star(context, 800 + i * 76, top + 450, 30, i < stars);

  const panelY = footer - (story ? 190 : 150), panelH = story ? 160 : 130;
  context.fillStyle = "#fff7e6eb";
  context.beginPath(); context.roundRect(70, panelY, width - 140, panelH, 28); context.fill();
  context.font = `700 44px ${BODY_FONT}`;
  const lines = wrapText(context, humanLine(shared.meters, gate), 860, 2);
  lines.forEach((line, index) => fitText(context, [{ text: line, color: NAVY, weight: 700 }], cx, panelY + panelH / 2 + 15 + (index - (lines.length - 1) / 2) * 56, 44, 880, "center"));
  drawFooterBand(context, format, "তুমি কত দূর যাবে?", site, { band: NAVY, ask: "#ffd166", site: CREAM });
}

export const cardBlob = (shared: Shared, format: CardFormat, site: string, stars = 0) => renderCard(canvas => drawCard(canvas, shared, format, site, stars));
