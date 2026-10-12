import { cardSizes, drawFooterBand, fitText, renderCard, type CardFormat } from "../../../shared/card-canvas";
import { cleanName } from "../../../shared/game-core";
import { GH, GW, GX, GY } from "./aim";
import { drawBall, drawField, drawGoalFrame, drawKeeper, drawNet, drawRipple } from "./art";
import { humanLine, levelLabel, score, type Shared } from "./link";
import { starsOf } from "./match";
import { opponentOf } from "./teams";

const colors = { bg: "#f4ecd6", ink: "#1f2a1c", muted: "#5d6b4f", accent: "#1f6f43", star: "#f2a900", starOff: "#ddd3b8", band: "#173d27", ask: "#ffd23f" };

function star(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + i * Math.PI / 5, radius = i % 2 ? r * 0.45 : r;
    c.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
  }
  c.closePath(); c.fillStyle = fill; c.fill();
}

/** The winning kick: ball in the top corner, the net rippling, their keeper flat on the grass the other way. */
function drawMoment(c: CanvasRenderingContext2D, level: number) {
  drawField(c);
  drawNet(c);
  drawKeeper(c, GX - 58, GY + 2, -1.4, -15, 0, opponentOf(level).keeperKit);
  drawGoalFrame(c);
  const bx = GX + 0.78 * GW, by = GY - 0.74 * GH;
  drawRipple(c, bx, by, 0.55);
  drawBall(c, bx, by, 6, 0.4);
}

export function drawCard(canvas: HTMLCanvasElement, shared: Shared, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const story = format === "story", cx = width / 2, top = story ? 250 : 0, stars = starsOf(shared.us, shared.them);
  c.fillStyle = colors.bg; c.fillRect(0, 0, width, height);

  const name = cleanName(shared.name), team = opponentOf(shared.level).name;
  fitText(c, [{ text: `পেনাল্টি কিক · ${levelLabel(shared.level)}`, color: colors.muted, weight: 700, display: true }], cx, top + 92, 38, 960, "center");
  fitText(c, [
    { text: name ? `${name} ` : "", color: colors.ink, weight: 800, display: true },
    { text: `${team}কে`, color: colors.accent, weight: 800, display: true },
    { text: name ? " হারাল" : " হারালাম", color: colors.ink, weight: 800, display: true },
  ], cx, top + 178, 62, 980, "center");
  fitText(c, [{ text: score(shared.us, shared.them), color: colors.accent, weight: 800, display: true }], cx, top + 330, 150, 700, "center");
  for (let i = 0; i < 3; i++) star(c, cx + (i - 1) * 80, top + 398, 30, i < stars ? colors.star : colors.starOff);

  // The goal mouth, zoomed: board x 30–330, y 40–196.
  const fromX = 30, fromY = 40, shownW = 300, shownH = 156, k = width / shownW, sceneTop = top + 450;
  c.save();
  c.beginPath(); c.rect(0, sceneTop, width, shownH * k); c.clip();
  c.translate(-fromX * k, sceneTop - fromY * k); c.scale(k, k);
  drawMoment(c, shared.level);
  c.restore();

  const after = sceneTop + shownH * k;
  fitText(c, [{ text: humanLine(shared), color: colors.ink, weight: 800, display: true }], cx, after + (story ? 120 : 70), story ? 56 : 46, 960, "center");
  drawFooterBand(c, format, "তুমি কয় গোলে জিতবে?", site, { band: colors.band, ask: colors.ask, site: "#ffffff" });
}

export const cardBlob = (shared: Shared, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, shared, format, site));
