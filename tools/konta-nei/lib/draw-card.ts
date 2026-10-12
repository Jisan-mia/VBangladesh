import { cardSizes, drawFooterBand, fitText, renderCard, type CardFormat } from "../../../shared/card-canvas";
import { cleanName } from "../../../shared/game-core";
import { drawShelf, palette } from "./art";
import { makeLevel, starsOf } from "./game";
import { worldOf } from "./levels";
import { bn, humanLine, rightOf, type Shared } from "./link";
import type { ItemId } from "./items";

export type CardData = Shared & { right: number; missed?: readonly ItemId[] };

/** The card: the level's first shelf with a "?" where the missing item stood, the score, the stars and a human line. */
export function drawCard(canvas: HTMLCanvasElement, data: CardData, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width;
  canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const story = format === "story", cx = width / 2, name = cleanName(data.name);
  c.fillStyle = palette.paper;
  c.fillRect(0, 0, width, height);

  fitText(c, [{ text: `কোনটা নেই? · লেভেল ${bn(data.level)}`, color: palette.muted, weight: 700, display: true }], cx, story ? 340 : 100, story ? 44 : 40, 900, "center");
  fitText(c, [
    { text: name ? `${name} ` : "", color: palette.ink, weight: 700, display: true },
    { text: rightOf(data.right), color: palette.awning, weight: 800, display: true },
    { text: name ? " ধরেছে" : " ধরলাম", color: palette.ink, weight: 700, display: true },
  ], cx, story ? 455 : 196, story ? 96 : 86, 960, "center");
  const stars = starsOf(data.right, data.score);
  fitText(c, [
    ...[0, 1, 2].map(index => ({ text: "★", color: index < stars ? palette.star : "#d5c9b4", weight: 700 })),
    { text: `   স্কোর ${bn(data.score)}`, color: palette.ink, weight: 700 },
  ], cx, story ? 540 : 270, story ? 52 : 46, 900, "center");

  const round = makeLevel(data.level, data.seed)[0];
  const box = { x: 70, y: story ? 610 : 310, w: width - 140, h: story ? 900 : 830 };
  c.save();
  c.translate(box.x, box.y);
  c.beginPath(); c.roundRect(0, 0, box.w, box.h, 28); c.clip();
  drawShelf(c, box.w, box.h, { items: round.shelf.map((id, index) => index === round.slot ? null : id), base: round.shelf.length, world: worldOf(data.level), keeper: "back", ask: round.slot });
  c.restore();

  fitText(c, [{ text: humanLine(data.right, data.score, data.missed), color: palette.ink, weight: 700 }], cx, story ? 1590 : 1205, story ? 46 : 40, 960, "center");
  drawFooterBand(c, format, "তুমি কয়টা ধরতে পারবে?", site, { band: "#3a2a1c", ask: "#ffd166", site: "#ffffff" });
}

export const cardBlob = (data: CardData, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, data, format, site));
