// The share card: a children's-magazine puzzle page with both pictures and no answers ringed, so friends can try spotting
// them on the card itself. The world's ink colours it; a finale gets a stamp. Browser only (canvas).
import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, type CardFormat } from "../../../shared/card-canvas";
import { cleanName } from "../../../shared/game-core";
import { bn, cardLine, countOf, levelLabel, sharedStars, type Shared } from "./challenge";
import { WORLDS } from "./levels";
import { drawScene, type Picture } from "./draw";
import { SCENE_H, SCENE_W } from "./shapes";

const PAPER = "#fbf3e2", RULE = "#efe2c6", MUTED = "#7a6650", STAR = "#f2a900", STAR_OFF = "#dccdb0";

export function drawCard(canvas: HTMLCanvasElement, shared: Shared, picture: Picture, world: number, finale: string, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const story = format === "story", cx = width / 2, top = story ? 250 : 0, ink = WORLDS[world]?.ink ?? "#c2412d", frame = WORLDS[world]?.frame ?? "#3b2a20";
  c.fillStyle = PAPER; c.fillRect(0, 0, width, height);
  c.fillStyle = RULE;
  for (let at = 40; at < height; at += 46) c.fillRect(0, at, width, 2);

  const name = cleanName(shared.name), stars = sharedStars(shared);
  fitText(c, [{ text: `ভুল কোথায়? · ${levelLabel(shared.level, shared.legacy)}`, color: MUTED, weight: 700, display: true }], cx, top + 92, 38, 960, "center");
  fitText(c, [
    ...(name ? [{ text: `${name}: `, color: ink, weight: 800, display: true }] : []),
    { text: `${bn(countOf(shared))}টা অমিলই পেয়েছি`, color: frame, weight: 800, display: true },
  ], cx, top + 172, 68, 960, "center");
  c.font = "700 56px sans-serif"; c.textAlign = "center";
  for (let index = 0; index < 3; index++) { c.fillStyle = index < stars ? STAR : STAR_OFF; c.fillText("★", cx + (index - 1) * 70, top + 242); }
  fitText(c, [{ text: cardLine(shared), color: frame, weight: 600 }], cx, top + 300, story ? 40 : 36, 940, "center");

  const pictureW = story ? 800 : 700, pictureH = (pictureW * SCENE_H) / SCENE_W, gap = story ? 22 : 14, left = cx - pictureW / 2;
  [0, 1].forEach(side => {
    const y = top + (story ? 350 : 324) + side * (pictureH + gap);
    c.fillStyle = "#e6d6b6"; roundedRect(c, left + 6, y + 8, pictureW, pictureH, 18); c.fill();
    c.save(); roundedRect(c, left, y, pictureW, pictureH, 18); c.clip();
    drawScene(c, picture, side as 0 | 1, left, y, pictureW / SCENE_W);
    c.restore();
    c.lineWidth = 4; c.strokeStyle = frame; roundedRect(c, left, y, pictureW, pictureH, 18); c.stroke();
  });
  if (finale) {
    // A round rubber stamp, tilted, in the margin beside the headline: never over the pictures, which are the puzzle.
    const sx = width - 100, sy = top + 196;
    c.save(); c.translate(sx, sy); c.rotate(-0.22);
    c.strokeStyle = ink; c.fillStyle = ink; c.globalAlpha = 0.85; c.lineWidth = 5;
    c.beginPath(); c.arc(0, 0, 70, 0, Math.PI * 2); c.stroke();
    c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 59, 0, Math.PI * 2); c.stroke();
    fitText(c, [{ text: "শেষ ছবি", color: ink, weight: 800, display: true }], 0, -10, 27, 104, "center");
    fitText(c, [{ text: finale, color: ink, weight: 700, display: true }], 0, 24, 20, 104, "center");
    c.restore();
  }
  drawFooterBand(c, format, "তুমি কত সময়ে পারবে?", site, { band: frame, ask: "#ffd8a8", site: "#ffffff" });
}

export const cardBlob = (shared: Shared, picture: Picture, world: number, finale: string, format: CardFormat, site: string) =>
  renderCard(canvas => drawCard(canvas, shared, picture, world, finale, format, site));
