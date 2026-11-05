import { cardSizes, drawFooterBand, fitText, renderCard, type CardFormat, type Segment } from "../../../shared/card-canvas";
import { cleanName } from "../../../shared/game-core";
import { boardWidth, drawJam, lookOf } from "./art";
import { layoutOf, parOf, starsOf } from "./game";
import { bn, humanLine, type Shared } from "./link";
import { isFinale, worldIndex, worldOf } from "./worlds";

export type CardData = Pick<Shared, "level" | "legacy" | "count" | "helped" | "name">;

/** The card shows the jam's start the way the friend will meet it, in its street's colours. A finale carries a stamp. */
export function drawCard(canvas: HTMLCanvasElement, data: CardData, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width;
  canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const story = format === "story", cx = width / 2;
  const world = data.legacy ? 0 : worldIndex(data.level), look = lookOf(world), par = parOf(data.level, data.legacy);
  c.fillStyle = look.paper;
  c.fillRect(0, 0, width, height);

  const name = cleanName(data.name);
  const where = data.legacy ? `পুরোনো জ্যাম ${bn(data.level)}` : `${bn(data.level)} নম্বর জ্যাম · ${worldOf(data.level).name}`;
  fitText(c, [{ text: `জ্যাম ছাড়াও · ${where}`, color: look.muted, weight: 700, display: true }], cx, story ? 340 : 100, story ? 44 : 40, 900, "center");
  const headline: Segment[] = [
    { text: name ? `${name} ` : "", color: look.ink, weight: 700, display: true },
    { text: `${bn(data.count)} চালে`, color: look.accent, weight: 800, display: true },
    { text: name ? " জ্যাম ছাড়িয়েছে" : " জ্যাম ছাড়ালাম", color: look.ink, weight: 700, display: true },
  ];
  fitText(c, headline, cx, story ? 455 : 196, story ? 92 : 82, 960, "center");
  const earned = starsOf(data.count, par, data.helped, data.legacy);
  const note = `  সেরা সমাধান ${bn(par)} চাল${data.helped ? ` · ${bn(data.helped)} বার সাহায্য নিয়ে` : ""}`;
  fitText(c, [
    ...[0, 1, 2].map(index => ({ text: "★", color: index < earned ? look.star : look.muted + "66", weight: 700 })),
    { text: note, color: look.muted, weight: 600 },
  ], cx, story ? 530 : 262, story ? 42 : 38, 900, "center");

  const cell = story ? 112 : 102, bx = cx - boardWidth(cell) / 2, by = story ? 590 : 300;
  drawJam(c, layoutOf(data.level, data.legacy), world, bx, by, cell);
  if (!data.legacy && isFinale(data.level)) {
    // a round stamp on the street's corner, like a rubber stamp on a ticket
    c.save();
    c.translate(bx + boardWidth(cell) - 96, by + 92);
    c.rotate(-0.22);
    c.strokeStyle = look.accent; c.lineWidth = 7;
    c.fillStyle = look.paper + "ee";
    c.beginPath(); c.arc(0, 0, 84, 0, Math.PI * 2); c.fill(); c.stroke();
    c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 72, 0, Math.PI * 2); c.stroke();
    c.restore();
    fitText(c, [{ text: "শেষ", color: look.accent, weight: 800, display: true }], bx + boardWidth(cell) - 96 + 4, by + 88, 40, 120, "center");
    fitText(c, [{ text: "জ্যাম", color: look.accent, weight: 800, display: true }], bx + boardWidth(cell) - 96 + 6, by + 124, 34, 120, "center");
  }
  fitText(c, [{ text: humanLine(data.count, par, data.helped), color: look.ink, weight: 700 }], cx, story ? 1590 : 1206, story ? 52 : 46, 940, "center");
  drawFooterBand(c, format, "তুমি কত চালে পারবে?", site, { band: look.accentDeep, ask: look.star, site: "#ffffff" });
}

export const cardBlob = (data: CardData, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, data, format, site));
