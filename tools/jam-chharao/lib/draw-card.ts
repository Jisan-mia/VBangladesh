import { cardSizes, drawFooterBand, fitText, renderCard, type CardFormat, type Segment } from "../../../shared/card-canvas";
import { cleanName } from "../../../shared/game-core";
import { boardHeight, boardWidth, cellX, cellY, drawStreet, drawVehicle, palette } from "./art";
import { parseLevel } from "./board";
import { fewest, starsOf } from "./game";
import { LEVELS } from "./levels";
import { bn, humanLine, type Shared } from "./link";

export type CardData = Pick<Shared, "level" | "count" | "helped" | "name">;

/** The level's starting jam, the way the friend will meet it. */
function drawJam(c: CanvasRenderingContext2D, level: number, x: number, y: number, cell: number) {
  const { cars, start } = parseLevel(LEVELS[level - 1][0]);
  c.save();
  c.translate(x, y);
  c.fillStyle = "rgba(38,34,29,0.22)";
  c.beginPath(); c.roundRect(10, 18, boardWidth(cell), boardHeight(cell), 26); c.fill();
  c.beginPath(); c.roundRect(0, 0, boardWidth(cell), boardHeight(cell), 26); c.clip();
  drawStreet(c, cell);
  cars.forEach((car, i) => drawVehicle(c, car, cellX(car.down ? car.line : start[i], cell), cellY(car.down ? start[i] : car.line, cell), cell));
  c.restore();
}

export function drawCard(canvas: HTMLCanvasElement, data: CardData, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width;
  canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const story = format === "story", cx = width / 2;
  c.fillStyle = "#f3ecdf";
  c.fillRect(0, 0, width, height);

  const name = cleanName(data.name);
  fitText(c, [{ text: `জ্যাম ছাড়াও · ${bn(data.level)} নম্বর জ্যাম`, color: palette.muted, weight: 700, display: true }], cx, story ? 340 : 100, story ? 44 : 40, 900, "center");
  const headline: Segment[] = [
    { text: name ? `${name} ` : "", color: palette.ink, weight: 700, display: true },
    { text: `${bn(data.count)} চালে`, color: palette.cngRoof, weight: 800, display: true },
    { text: name ? " জ্যাম ছাড়িয়েছে" : " জ্যাম ছাড়ালাম", color: palette.ink, weight: 700, display: true },
  ];
  fitText(c, headline, cx, story ? 455 : 196, story ? 92 : 82, 960, "center");
  const note = `  সেরা সমাধান ${bn(fewest(data.level))} চাল${data.helped ? ` · ${bn(data.helped)} বার সাহায্য নিয়ে` : ""}`;
  const earned = starsOf(data.count, data.level, data.helped);
  fitText(c, [
    ...[0, 1, 2].map(index => ({ text: "★", color: index < earned ? "#e39b00" : "#cfc4b0", weight: 700 })),
    { text: note, color: palette.muted, weight: 600 },
  ], cx, story ? 530 : 262, story ? 42 : 38, 900, "center");

  const cell = story ? 112 : 102;
  drawJam(c, data.level, cx - boardWidth(cell) / 2, story ? 590 : 300, cell);
  fitText(c, [{ text: humanLine(data.count, fewest(data.level), data.helped), color: palette.ink, weight: 700 }], cx, story ? 1590 : 1206, story ? 52 : 46, 940, "center");
  drawFooterBand(c, format, "তুমি কত চালে পারবে?", site, { band: palette.cngRoof, ask: palette.star, site: "#ffffff" });
}

export const cardBlob = (data: CardData, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, data, format, site));
