import { cardSizes, drawFooterBand, fitText, renderCard, type CardFormat, type Segment } from "../../../shared/card-canvas";
import { cleanName } from "../../../shared/game-core";
import { drawPicture, drawPlate, paletteOf, pictureSheet } from "./art";
import { levelBoard, starsOf } from "./game";
import { infoOf, worldIndex, worldOf } from "./levels";
import { bn, humanLine, sizeLabel, type Shared } from "./link";

export type CardData = Pick<Shared, "level" | "count" | "helped" | "name">;

/**
 * The card shows the level's shuffled plate the way the friend will meet it, in its world's enamel. On a picture level the
 * ঘুঁটি carry their slices, and the finished picture is pinned on the plate's corner like a photo.
 */
export function drawCard(canvas: HTMLCanvasElement, data: CardData, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width;
  canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const story = format === "story", cx = width / 2;
  const colors = paletteOf(worldIndex(data.level)), info = infoOf(data.level), world = worldOf(data.level);
  c.fillStyle = colors.paper;
  c.fillRect(0, 0, width, height);
  // faint enamel dots across the paper, so the card reads as tin even at thumbnail size
  c.fillStyle = colors.tray + "1f";
  for (let y = 40; y < height; y += 64) for (let x = (y / 64) % 2 ? 40 : 72; x < width; x += 64) { c.beginPath(); c.arc(x, y, 5, 0, Math.PI * 2); c.fill(); }

  const name = cleanName(data.name);
  fitText(c, [{ text: `১৫ ঘরের ধাঁধা · লেভেল ${bn(data.level)} · ${sizeLabel(data.level)}`, color: colors.muted, weight: 700, display: true }], cx, story ? 340 : 100, story ? 44 : 40, 900, "center");
  const headline: Segment[] = [
    { text: name ? `${name} ` : "", color: colors.ink, weight: 700, display: true },
    { text: `${bn(data.count)} চালে`, color: worldIndex(data.level) === 3 ? colors.trim : colors.tray, weight: 800, display: true },
    { text: name ? " মিলিয়েছে" : " মেলালাম", color: colors.ink, weight: 700, display: true },
  ];
  fitText(c, headline, cx, story ? 455 : 196, story ? 96 : 86, 960, "center");
  const earned = starsOf(data.count, data.level, data.helped);
  fitText(c, [
    ...[0, 1, 2].map(index => ({ text: "★", color: index < earned ? colors.star : colors.muted + "66", weight: 700 })),
    { text: data.helped ? `  ${bn(data.helped)} বার সাহায্য নিয়ে` : `  ${info.name}`, color: colors.muted, weight: 600 },
  ], cx, story ? 535 : 266, story ? 50 : 46, 900, "center");

  const plate = story ? 860 : 820, px = cx - plate / 2, py = story ? 610 : 312;
  const picture = info.look === "digits" ? null : pictureSheet(world.picture, 960);
  drawPlate(c, levelBoard(data.level), px, py, plate, colors, { picture, look: info.look });
  if (picture) {
    // the finished picture, pinned on the corner
    const side = story ? 230 : 210;
    c.save();
    c.translate(px + plate - side * 0.72, py + plate - side - (story ? 0 : 8));
    c.rotate(0.07);
    c.fillStyle = "rgba(0,0,0,0.25)"; c.fillRect(8, 10, side, side);
    c.fillStyle = "#fffdf5"; c.fillRect(-10, -10, side + 20, side + 20);
    c.save(); c.beginPath(); c.rect(0, 0, side, side); c.clip(); c.scale(side / 960, side / 960); drawPicture(c, world.picture, 960); c.restore();
    c.fillStyle = colors.trim; c.beginPath(); c.arc(side / 2, -2, 12, 0, Math.PI * 2); c.fill();
    c.restore();
  }
  fitText(c, [{ text: humanLine(data.count, data.level, data.helped), color: colors.ink, weight: 700 }], cx, story ? 1590 : 1210, story ? 52 : 46, 940, "center");
  drawFooterBand(c, format, "তুমি কত চালে পারবে?", site, { band: colors.trayDeep, ask: colors.trim, site: "#ffffff" });
}

export const cardBlob = (data: CardData, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, data, format, site));
