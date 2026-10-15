// The "আব্বু-আম্মুকে দেখাও" card: each shadow matched today beside its object, with no name of the child. 1080×1350.
import { cardSizes, drawFooterBand, fitText, roundedRect } from "../../../shared/card-canvas";
import { shapeOf, svgDocument, type Shape } from "./shapes";

export type CardData = { label: string; title: string; stars: number; ids: string[]; footer: string };

const colors = { bg: "#f6eedd", tile: "#fffaf0", edge: "#e6d6b4", wall: "#efe0bf", shadow: "#3b3346", ink: "#2f2a3a", accent: "#7a4fb5", star: "#f2a900", starOff: "#e3d7bf", band: "#3d2a5c" };

export const FOOTER = "রাতে টর্চ জ্বেলে দেয়ালে হাতের ছায়া বানাও";

/** Decodes each object's drawing from a data: URL (nothing is fetched). */
export async function loadPictures(ids: string[]) {
  const pictures = new Map<string, HTMLImageElement>();
  await Promise.all(ids.map(async id => {
    const shape = shapeOf(id);
    if (!shape) return;
    const image = new Image();
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgDocument(shape.art))}`;
    await image.decode();
    pictures.set(id, image);
  }));
  return pictures;
}

function star(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + i * Math.PI / 5, radius = i % 2 ? r * 0.45 : r;
    c.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
  }
  c.closePath(); c.fillStyle = fill; c.fill();
}

/** The object's outline filled flat: the same trick as the wall, done with compositing so every browser draws it. */
function shadowOf(image: HTMLImageElement, size: number) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const c = canvas.getContext("2d")!;
  c.drawImage(image, 0, 0, size, size);
  c.globalCompositeOperation = "source-in";
  c.fillStyle = colors.shadow; c.fillRect(0, 0, size, size);
  return canvas;
}

export function drawCard(canvas: HTMLCanvasElement, data: CardData, pictures: Map<string, HTMLImageElement>, site: string) {
  const { width, height } = cardSizes.feed;
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  c.fillStyle = colors.bg; c.fillRect(0, 0, width, height);

  fitText(c, [{ text: data.label, color: colors.accent, weight: 700, display: true }], width / 2, 100, 40, 900, "center");
  fitText(c, [{ text: data.title, color: colors.ink, weight: 800, display: true }], width / 2, 184, 60, 960, "center");
  for (let i = 0; i < 3; i++) star(c, width / 2 + (i - 1) * 76, 254, 30, i < data.stars ? colors.star : colors.starOff);

  const shapes = data.ids.map(shapeOf).filter((shape): shape is Shape => !!shape);
  const top = 310, bottom = 1228, gap = 20, left = 60, rows = Math.ceil(shapes.length / 2);
  const tileWidth = (width - left * 2 - gap) / 2, rowHeight = (bottom - top) / rows, inner = rowHeight - gap;
  const picture = Math.min(170, inner - 70);
  shapes.forEach((shape, index) => {
    const x = left + (index % 2) * (tileWidth + gap), y = top + Math.floor(index / 2) * rowHeight;
    roundedRect(c, x, y, tileWidth, inner, 30); c.fillStyle = colors.tile; c.fill();
    c.lineWidth = 4; c.strokeStyle = colors.edge; c.stroke();
    // Left: the shadow on a patch of wall. Right: the object that cast it.
    const wallX = x + 16, wallY = y + 14, wallSize = picture + 20;
    roundedRect(c, wallX, wallY, wallSize, wallSize, 22); c.fillStyle = colors.wall; c.fill();
    const image = pictures.get(shape.id);
    if (image) {
      c.drawImage(shadowOf(image, picture), wallX + 10, wallY + 10, picture, picture);
      c.drawImage(image, x + tileWidth - picture - 22, wallY + 10, picture, picture);
    }
    fitText(c, [{ text: "→", color: colors.accent, weight: 700 }], x + tileWidth / 2 + 4, wallY + wallSize / 2 + 14, 40, 60, "center");
    fitText(c, [{ text: shape.bn, color: colors.ink, weight: 700 }], x + tileWidth / 2, y + inner - 22, 36, tileWidth - 30, "center");
  });

  drawFooterBand(c, "feed", data.footer, site, { band: colors.band, ask: "#ffd166", site: "#ffffff" });
}
