import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, type CardFormat } from "../../../shared/card-canvas";
import { cleanName } from "../../../shared/game-core";
import { drawAlley, drawFog, drawMoths, drawNeighbour, drawPlayer, drawShadow, drawShuttle, drawWashing } from "./art";
import { nightOf, opponentOf } from "./levels";
import { bn, humanLine, levelLabel, score, type Shared } from "./link";
import { starsOf, BOT_HOME, PLAYER_HOME, POINTS } from "./rally";

const colors = { bg: "#f3ede1", ink: "#1b2238", muted: "#5b5f70", accent: "#c2571a", star: "#f2a900", starOff: "#dcd3bf", band: "#1b2238", ask: "#ffd23f" };
export const ME = "#e07a2e";

function star(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + i * Math.PI / 5, radius = i % 2 ? r * 0.45 : r;
    c.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
  }
  c.closePath(); c.fillStyle = fill; c.fill();
}

/** The winning smash: you mid-swing, the shuttle flying over the net, the neighbour watching from the window. */
function drawMoment(c: CanvasRenderingContext2D, level: number) {
  const night = nightOf(level);
  drawAlley(c, night);
  if (night === "wind") drawWashing(c, 0.6);
  drawNeighbour(c, 1);
  drawMoths(c, 0, true);
  drawPlayer(c, PLAYER_HOME + 4, 1, ME, 0.1);
  drawPlayer(c, BOT_HOME + 6, -1, opponentOf(level).shirt, -2.3);
  drawShadow(c, 206, 184);
  drawShuttle(c, 206, 184, 0.1, night === "fog" ? 0.9 : 1, 1.3);
  if (night === "fog") drawFog(c);
}

export function drawCard(canvas: HTMLCanvasElement, shared: Shared, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const story = format === "story", cx = width / 2, top = story ? 250 : 0, stars = starsOf(POINTS, shared.them);
  c.fillStyle = colors.bg; c.fillRect(0, 0, width, height);

  const name = cleanName(shared.name), opp = opponentOf(shared.level);
  fitText(c, [{ text: `গলির ব্যাডমিন্টন · ${levelLabel(shared.level)}`, color: colors.muted, weight: 700, display: true }], cx, top + 84, 36, 960, "center");
  fitText(c, [
    { text: name ? `${name} ` : "", color: colors.ink, weight: 800, display: true },
    { text: opp.object, color: colors.accent, weight: 800, display: true },
    { text: name ? " হারাল" : " হারালাম", color: colors.ink, weight: 800, display: true },
  ], cx, top + 164, 58, 980, "center");
  fitText(c, [{ text: score(shared.them), color: colors.accent, weight: 800, display: true }], cx, top + 300, 130, 600, "center");
  for (let i = 0; i < 3; i++) star(c, cx + (i - 1) * 76, top + 364, 28, i < stars ? colors.star : colors.starOff);

  // The whole গলি, framed: board 360×340 from y 30.
  const k = story ? 2.3 : 2.0, shownW = 360, shownH = 340, fromY = 30;
  const sceneW = shownW * k, sceneH = shownH * k, sx = (width - sceneW) / 2, sy = top + 410;
  c.save();
  roundedRect(c, sx, sy, sceneW, sceneH, 28); c.clip();
  c.translate(sx, sy - fromY * k); c.scale(k, k);
  drawMoment(c, shared.level);
  c.restore();

  const after = sy + sceneH;
  fitText(c, [{ text: humanLine(shared), color: colors.ink, weight: 800, display: true }], cx, after + (story ? 96 : 60), story ? 52 : 42, 960, "center");
  fitText(c, [{ text: `এক র‍্যালিতে সবচেয়ে বেশি ${bn(shared.rally)} বার`, color: colors.muted, weight: 600 }], cx, after + (story ? 156 : 110), story ? 36 : 30, 900, "center");
  drawFooterBand(c, format, "তুমি কয় পয়েন্টে জিতবে?", site, { band: colors.band, ask: colors.ask, site: "#ffffff" });
}

export const cardBlob = (shared: Shared, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, shared, format, site));
