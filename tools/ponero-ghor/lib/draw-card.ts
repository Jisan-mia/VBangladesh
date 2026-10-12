import { cardSizes, drawFooterBand, fitText, renderCard, type CardFormat, type Segment } from "../../../shared/card-canvas";
import { cleanName } from "../../../shared/game-core";
import { drawPlate, palette } from "./art";
import { levelBoard, starsOf } from "./game";
import { bn, humanLine, sizeLabel, type Shared } from "./link";

export type CardData = Pick<Shared, "level" | "count" | "helped" | "name">;

/** The card shows the level's shuffled plate, the way the friend will meet it. */
export function drawCard(canvas: HTMLCanvasElement, data: CardData, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width;
  canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const story = format === "story", cx = width / 2;
  c.fillStyle = palette.paper;
  c.fillRect(0, 0, width, height);

  const name = cleanName(data.name);
  fitText(c, [{ text: `১৫ ঘরের ধাঁধা · লেভেল ${bn(data.level)} · ${sizeLabel(data.level)}`, color: palette.muted, weight: 700, display: true }], cx, story ? 340 : 100, story ? 44 : 40, 900, "center");
  const headline: Segment[] = [
    { text: name ? `${name} ` : "", color: palette.ink, weight: 700, display: true },
    { text: `${bn(data.count)} চালে`, color: palette.tray, weight: 800, display: true },
    { text: name ? " মিলিয়েছে" : " মেলালাম", color: palette.ink, weight: 700, display: true },
  ];
  fitText(c, headline, cx, story ? 455 : 196, story ? 96 : 86, 960, "center");
  const earned = starsOf(data.count, data.level, data.helped);
  fitText(c, [
    ...[0, 1, 2].map(index => ({ text: "★", color: index < earned ? palette.star : "#d5c9b4", weight: 700 })),
    { text: data.helped ? `  ${bn(data.helped)} বার সাহায্য নিয়ে` : "", color: palette.muted, weight: 600 },
  ], cx, story ? 535 : 266, story ? 50 : 46, 900, "center");

  const plate = story ? 860 : 820;
  drawPlate(c, levelBoard(data.level), cx - plate / 2, story ? 610 : 312, plate);
  fitText(c, [{ text: humanLine(data.count, data.level, data.helped), color: palette.ink, weight: 700 }], cx, story ? 1590 : 1210, story ? 52 : 46, 940, "center");
  drawFooterBand(c, format, "তুমি কত চালে পারবে?", site, { band: palette.trayDeep, ask: palette.trim, site: "#ffffff" });
}

export const cardBlob = (data: CardData, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, data, format, site));
