import { cardSizes, drawFooterBand, fitText, renderCard, type CardFormat } from "../../../shared/card-canvas";
import { cleanName } from "../../../shared/game-core";
import { drawShelf, palette } from "./art";
import { makeDeal } from "./shelf";
import { starsOf } from "./score";
import { finaleName, worldOf, WORLDS } from "./levels";
import { bn, humanLine, rightOf, type Shared } from "./link";
import type { ItemId } from "./items";

export type CardData = Shared & { right: number; missed?: readonly ItemId[] };

/** The card: the level's first shelf with a "?" where each gone thing stood, the score, the stars and a human line. */
export function drawCard(canvas: HTMLCanvasElement, data: CardData, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width;
  canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const story = format === "story", cx = width / 2, name = cleanName(data.name);
  const finale = data.v === 2 ? finaleName(data.level) : "";
  c.fillStyle = palette.paper;
  c.fillRect(0, 0, width, height);

  const where = finale || WORLDS[worldOf(data.level)].name;
  fitText(c, [{ text: `কোনটা নেই? · লেভেল ${bn(data.level)} · ${where}`, color: palette.muted, weight: 700, display: true }], cx, story ? 340 : 100, story ? 44 : 40, 900, "center");
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

  const deal = makeDeal(data.level, data.seed, data.v), round = deal.rounds[0];
  const box = { x: 70, y: story ? 610 : 310, w: width - 140, h: story ? 900 : 830 };
  c.save();
  c.translate(box.x, box.y);
  c.beginPath(); c.roundRect(0, 0, box.w, box.h, 28); c.clip();
  drawShelf(c, box.w, box.h, {
    items: round.shelf.map((id, index) => round.slots.includes(index) ? null : id), base: round.shelf.length,
    world: worldOf(data.level), keeper: "back", asks: round.slots, plain: deal.spec.plain,
  });
  c.restore();
  if (finale && stars) {
    // The finale's stamp, tilted over the shelf's corner.
    c.save();
    c.translate(width - 200, box.y + 26); c.rotate(-0.12);
    c.strokeStyle = palette.awning; c.lineWidth = 6; c.fillStyle = "#fffaf0e6";
    c.beginPath(); c.roundRect(-150, -46, 300, 92, 14); c.fill(); c.stroke();
    fitText(c, [{ text: `${finale} পার`, color: palette.awning, weight: 800, display: true }], 0, 14, 40, 270, "center");
    c.restore();
  }

  fitText(c, [{ text: humanLine(data.right, data.score, data.missed), color: palette.ink, weight: 700 }], cx, story ? 1590 : 1205, story ? 46 : 40, 960, "center");
  drawFooterBand(c, format, "তুমি কয়টা ধরতে পারবে?", site, { band: "#3a2a1c", ask: "#ffd166", site: "#ffffff" });
}

export const cardBlob = (data: CardData, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, data, format, site));
