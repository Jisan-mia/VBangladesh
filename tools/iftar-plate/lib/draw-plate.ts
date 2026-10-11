import { cardSizes, drawFooterBand, fitText, loadCardFonts, renderCard, wrapText, BODY_FONT, type CardFormat } from "../../../shared/card-canvas";
import { sceneSvg } from "./art";
import { SCENE, type CardContent, type ItemId } from "./plate";

const CLOTH = "#1d5a45";
const CLOTH_DEEP = "#123d2f";
const BORDER = "#b8322a";
const CREAM = "#fff3dc";
const SAFFRON = "#ffb54a";
const MINT = "#bfe0cf";

const scenes = new Map<string, HTMLImageElement>();

function sceneImage(picks: readonly ItemId[]) {
  const key = picks.join(",");
  let image = scenes.get(key);
  if (!image) {
    image = new Image();
    image.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(sceneSvg(picks, 1000));
    scenes.set(key, image);
    // shortcut: one image per distinct plate, never evicted; fine for a page session of taps.
  }
  return image;
}

/** Fonts plus the plate drawings, so drawCard can then paint synchronously. */
export async function prepareCard(card: CardContent) {
  const plates = [card.picks, ...(card.friend ? [card.friend.picks] : [])].map(sceneImage);
  await Promise.all([loadCardFonts(card.title), ...plates.map(image => image.decode().catch(() => undefined))]);
}

/** The দস্তরখান: bottle-green cotton with a small cream print and a red printed border. */
function drawCloth(context: CanvasRenderingContext2D, width: number, height: number) {
  context.fillStyle = CLOTH;
  context.fillRect(0, 0, width, height);
  context.fillStyle = "rgba(255,243,220,.10)";
  for (let y = 30, row = 0; y < height; y += 60, row++) {
    for (let x = row % 2 ? 60 : 30; x < width; x += 60) {
      for (let petal = 0; petal < 4; petal++) {
        context.beginPath();
        context.arc(x + Math.cos(petal * Math.PI / 2) * 6, y + Math.sin(petal * Math.PI / 2) * 6, 4, 0, Math.PI * 2);
        context.fill();
      }
    }
  }
  context.strokeStyle = BORDER; context.lineWidth = 16;
  context.strokeRect(22, 22, width - 44, height - 44);
  context.strokeStyle = SAFFRON; context.lineWidth = 3;
  context.setLineDash([4, 10]);
  context.strokeRect(40, 40, width - 80, height - 80);
  context.setLineDash([]);
}

function drawScene(context: CanvasRenderingContext2D, picks: readonly ItemId[], x: number, y: number, width: number) {
  const image = sceneImage(picks);
  if (image.complete && image.naturalWidth) context.drawImage(image, x, y, width, width * SCENE.height / SCENE.width);
}

const layouts = {
  // With a friend's plate tucked top-right, one's own plate shrinks and moves down so the two never overlap.
  feed: { titleY: 150, subY: 214, plateY: 240, plateW: 880, friendY: 300, friendW: 760, boxY: 56, line: 46, names: 30 },
  story: { titleY: 400, subY: 466, plateY: 500, plateW: 960, friendY: 570, friendW: 860, boxY: 262, line: 52, names: 32 },
} as const;

export function drawCard(canvas: HTMLCanvasElement, card: CardContent, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  drawCloth(context, width, height);
  const left = 90, textWidth = width - 180;
  // With a friend's plate tucked top-right, the title keeps to the left of it.
  const titleWidth = card.friend ? textWidth - 300 : textWidth;
  if (format === "story") fitText(context, [{ text: "ইফতারির প্লেট · একটুখানি", color: "rgba(255,243,220,.7)", weight: 600 }], left, 320, 30, titleWidth);
  fitText(context, [{ text: card.title, color: CREAM, weight: 800, display: true }], left, layout.titleY, format === "story" ? 76 : 70, titleWidth);
  fitText(context, [{ text: card.sub, color: SAFFRON, weight: 700, display: true }], left, layout.subY, 40, titleWidth);
  // Sits in the bare cloth above the thala's rim.
  if (card.day) fitText(context, [{ text: card.day, color: MINT, weight: 600 }], left, layout.subY + 50, 30, titleWidth);
  const plateY = card.friend ? layout.friendY : layout.plateY;
  const plateW = card.friend ? layout.friendW : layout.plateW;
  drawScene(context, card.picks, (width - plateW) / 2 - 10, plateY, plateW);
  if (card.friend) {
    const size = 250, x = width - size - 80, y = layout.boxY;
    context.save();
    context.translate(x + size / 2, y + size / 2);
    context.rotate(0.06);
    context.fillStyle = "rgba(255,243,220,.12)";
    context.beginPath(); context.roundRect(-size / 2 - 10, -size / 2 - 10, size + 20, size * SCENE.height / SCENE.width + 60, 18); context.fill();
    drawScene(context, card.friend.picks, -size / 2, -size / 2, size);
    fitText(context, [{ text: card.friend.label, color: CREAM, weight: 700 }], 0, -size / 2 + size * SCENE.height / SCENE.width + 34, 28, size, "center");
    context.restore();
  }
  let y = plateY + plateW * SCENE.height / SCENE.width + (format === "story" ? 80 : 52);
  fitText(context, [{ text: card.line, color: CREAM, weight: 700, display: true }], left, y, layout.line, textWidth);
  if (card.names) {
    context.font = `500 ${layout.names}px ${BODY_FONT}`;
    // One row of names once a comparison or popularity line needs the room.
    const extra = card.match || (format === "story" && card.popular);
    for (const row of wrapText(context, card.names, textWidth, extra ? 1 : 2)) {
      y += layout.names + 18;
      fitText(context, [{ text: row, color: MINT, weight: 500 }], left, y, layout.names, textWidth);
    }
  }
  if (card.match) { y += 58; fitText(context, [{ text: card.match, color: SAFFRON, weight: 700 }], left, y, 34, textWidth); }
  if (format === "story" && card.popular) { y += 70; fitText(context, [{ text: card.popular, color: SAFFRON, weight: 700, display: true }], left, y, 38, textWidth); }
  drawFooterBand(context, format, "তোমার প্লেটে আজ কী?", site, { band: CLOTH_DEEP, ask: SAFFRON, site: "#ffffff" });
}

export async function cardBlob(card: CardContent, format: CardFormat, site: string) {
  await prepareCard(card);
  return renderCard(canvas => drawCard(canvas, card, format, site));
}
