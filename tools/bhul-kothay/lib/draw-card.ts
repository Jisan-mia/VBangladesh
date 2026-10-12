import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, type CardFormat } from "../../../shared/card-canvas";
import { cleanName } from "../../../shared/game-core";
import { drawScene } from "./draw";
import { diffCount, makePuzzle, starsFor } from "./game";
import { cardLine, levelLabel, type Shared } from "./link";
import { SCENE_H, SCENE_W } from "./shapes";

export const palette = { paper: "#fbf3e2", rule: "#efe2c6", ink: "#3b2a20", muted: "#7a6650", pen: "#d6332a", star: "#f2a900", starOff: "#dccdb0", band: "#3b2a20", ask: "#ffd8a8" };

/** A children's-magazine puzzle page: both pictures, no answers circled, so friends can try spotting them on the card itself. */
export function drawCard(canvas: HTMLCanvasElement, shared: Shared, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const story = format === "story", cx = width / 2, top = story ? 250 : 0;
  c.fillStyle = palette.paper; c.fillRect(0, 0, width, height);
  c.fillStyle = palette.rule;
  for (let at = 40; at < height; at += 46) c.fillRect(0, at, width, 2);

  const name = cleanName(shared.name), stars = starsFor(shared.level, shared.seconds, shared.wrong, shared.hinted), puzzle = makePuzzle(shared.level);
  fitText(c, [{ text: `ভুল কোথায়? · ${levelLabel(shared.level)}`, color: palette.muted, weight: 700, display: true }], cx, top + 92, 38, 960, "center");
  fitText(c, [
    ...(name ? [{ text: `${name}: `, color: palette.pen, weight: 800, display: true }] : []),
    { text: `${new Intl.NumberFormat("bn-BD").format(diffCount(shared.level))}টা অমিলই পেয়েছি`, color: palette.ink, weight: 800, display: true },
  ], cx, top + 172, 68, 960, "center");
  c.font = "700 56px sans-serif"; c.textAlign = "center";
  for (let index = 0; index < 3; index++) { c.fillStyle = index < stars ? palette.star : palette.starOff; c.fillText("★", cx + (index - 1) * 70, top + 242); }
  fitText(c, [{ text: cardLine(shared), color: palette.ink, weight: 600 }], cx, top + 300, story ? 40 : 36, 940, "center");

  const pictureW = story ? 800 : 700, pictureH = (pictureW * SCENE_H) / SCENE_W, gap = story ? 22 : 14, left = cx - pictureW / 2;
  [0, 1].forEach(side => {
    const y = top + (story ? 350 : 324) + side * (pictureH + gap);
    c.fillStyle = "#e6d6b6"; roundedRect(c, left + 6, y + 8, pictureW, pictureH, 18); c.fill();
    c.save(); roundedRect(c, left, y, pictureW, pictureH, 18); c.clip();
    drawScene(c, puzzle, side as 0 | 1, left, y, pictureW / SCENE_W);
    c.restore();
    c.lineWidth = 4; c.strokeStyle = palette.ink; roundedRect(c, left, y, pictureW, pictureH, 18); c.stroke();
  });
  drawFooterBand(c, format, "তুমি কত সময়ে পারবে?", site, { band: palette.band, ask: palette.ask, site: "#ffffff" });
}

export const cardBlob = (shared: Shared, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, shared, format, site));
