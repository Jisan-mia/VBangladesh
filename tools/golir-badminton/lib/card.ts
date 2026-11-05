// The share card: the পাড়া's court drawn in code at the winning smash, the neighbour beaten, the score and the stars.
import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, type CardFormat } from "../../../shared/card-canvas";
import { cleanName } from "../../../shared/game-core";
import type { Shared } from "./challenge";
import { levelDef, starsOf } from "./levels";
import { bn, humanLine, levelLabel, pointsOf, score } from "./lines";
import { H, RIVAL_HOME, W, YOU_HOME } from "./physics";
import { drawPerson, drawShuttle, paintCourt, paintFog, YOU } from "./scene";

const colors = { bg: "#f3ede1", ink: "#1b2238", muted: "#5b5f70", accent: "#c2571a", star: "#f2a900", starOff: "#dcd3bf", band: "#1b2238", ask: "#ffd23f" };

function star(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + i * Math.PI / 5, radius = i % 2 ? r * 0.45 : r;
    c.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
  }
  c.closePath(); c.fillStyle = fill; c.fill();
}

/** The winning smash: you mid-swing, the shuttle streaking over the net, the neighbour flat-footed. Board units. */
function drawMoment(c: CanvasRenderingContext2D, level: number) {
  const def = levelDef(level);
  c.drawImage(paintCourt(def.world, W, H, 2), 0, 0, W, H);
  drawPerson(c, YOU_HOME + 6, 1, YOU.shirt, YOU.cap, 0.3, 8, 0);
  drawPerson(c, RIVAL_HOME + 20, -1, def.rival.shirt, def.rival.cap, 1.1, 0, 1);
  c.strokeStyle = "#ffd23f"; c.lineWidth = 2.5; c.globalAlpha = 0.8;
  c.beginPath(); c.moveTo(150, 214); c.lineTo(214, 236); c.stroke();
  c.globalAlpha = 1;
  drawShuttle(c, 220, 238, 0.34, 1, 1.5);
  if (def.fog) c.drawImage(paintFog(W, H, 2), 0, 0, W, H);
}

export function drawCard(canvas: HTMLCanvasElement, shared: Shared, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const story = format === "story", cx = width / 2, top = story ? 250 : 0;
  const stars = shared.old ? 0 : starsOf(shared.them, shared.level, shared.mode);
  c.fillStyle = colors.bg; c.fillRect(0, 0, width, height);

  const name = cleanName(shared.name), def = levelDef(shared.level);
  fitText(c, [{ text: `গলির ব্যাডমিন্টন · ${levelLabel(shared.level)}`, color: colors.muted, weight: 700, display: true }], cx, top + 84, 36, 960, "center");
  fitText(c, [
    { text: name ? `${name} ` : "", color: colors.ink, weight: 800, display: true },
    { text: def.rival.obj, color: colors.accent, weight: 800, display: true },
    { text: name ? " হারাল" : " হারালাম", color: colors.ink, weight: 800, display: true },
  ], cx, top + 164, 58, 980, "center");
  fitText(c, [{ text: score(pointsOf(shared), shared.them), color: colors.accent, weight: 800, display: true }], cx, top + 300, 130, 600, "center");
  if (stars) for (let i = 0; i < 3; i++) star(c, cx + (i - 1) * 76, top + 364, 28, i < stars ? colors.star : colors.starOff);

  // The court, framed: board 360 wide, y 36 to 376.
  const k = story ? 2.3 : 2.0, shownW = 360, shownH = 340, fromY = 36;
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
