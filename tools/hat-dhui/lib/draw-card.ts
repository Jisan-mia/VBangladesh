// The "আব্বু-আম্মুকে দেখাও" card: what was done today as picture tiles, with no name. 1080×1350.
import { BODY_FONT, cardSizes, drawFooterBand, fitText, roundedRect, wrapText } from "../../../shared/card-canvas";
import { svgDocument } from "./art";

export type Tile = { svg: string; box: number; text: string };
export type CardData = { label: string; title: string; stars: number; badge?: string; badgeSvg?: string; tiles: Tile[]; footer: string };

const colors = { bg: "#eaf7f8", tile: "#ffffff", edge: "#c4e0e4", ink: "#1d2b3a", accent: "#0f7c8c", star: "#f2a900", starOff: "#d6e3e6", band: "#0a4f59" };

/** Turns SVG markup into decoded images from data: URLs (nothing is fetched). */
export async function loadPictures(svgs: string[]) {
  const pictures = new Map<string, HTMLImageElement>();
  await Promise.all([...new Set(svgs)].map(async svg => {
    const image = new Image();
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    await image.decode();
    pictures.set(svg, image);
  }));
  return pictures;
}

export const cardSvgs = (data: CardData) => [...data.tiles.map(tile => svgDocument(tile.svg, tile.box)), ...(data.badgeSvg ? [svgDocument(data.badgeSvg, 64)] : [])];

function star(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + i * Math.PI / 5, radius = i % 2 ? r * 0.45 : r;
    c.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
  }
  c.closePath(); c.fillStyle = fill; c.fill();
}

export function drawCard(canvas: HTMLCanvasElement, data: CardData, pictures: Map<string, HTMLImageElement>, site: string) {
  const { width, height } = cardSizes.feed;
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  c.fillStyle = colors.bg; c.fillRect(0, 0, width, height);

  fitText(c, [{ text: data.label, color: colors.accent, weight: 700, display: true }], width / 2, 100, 40, 900, "center");
  fitText(c, [{ text: data.title, color: colors.ink, weight: 800, display: true }], width / 2, 184, 56, 960, "center");
  for (let i = 0; i < 3; i++) star(c, width / 2 + (i - 1) * 76, 252, 30, i < data.stars ? colors.star : colors.starOff);

  let top = 310;
  if (data.badge) {
    const moon = data.badgeSvg && pictures.get(svgDocument(data.badgeSvg, 64));
    if (moon) c.drawImage(moon, width / 2 - 190, 296, 64, 64);
    fitText(c, [{ text: data.badge, color: colors.ink, weight: 700 }], width / 2 - 112, 342, 36, 400);
    top = 380;
  }

  const rows = Math.ceil(data.tiles.length / 2), bottom = 1228, gap = 20, left = 60, tileWidth = (width - left * 2 - gap) / 2;
  const rowHeight = (bottom - top) / rows, picture = Math.min(210, rowHeight - 100), side = rows >= 4;
  data.tiles.forEach((tile, index) => {
    const lone = index === data.tiles.length - 1 && data.tiles.length % 2 === 1;
    const x = lone ? (width - tileWidth) / 2 : left + (index % 2) * (tileWidth + gap), y = top + Math.floor(index / 2) * rowHeight;
    roundedRect(c, x, y, tileWidth, rowHeight - gap, 30); c.fillStyle = colors.tile; c.fill();
    c.lineWidth = 4; c.strokeStyle = colors.edge; c.stroke();
    const image = pictures.get(svgDocument(tile.svg, tile.box));
    if (side) {
      // Four rows: picture on the left, the words beside it on up to two lines, so the picture stays big.
      const size = Math.min(rowHeight - gap - 16, 190), room = tileWidth - size - 44;
      if (image) c.drawImage(image, x + 10, y + (rowHeight - gap - size) / 2, size, size);
      c.font = `700 34px ${BODY_FONT}`;
      const lines = wrapText(c, tile.text, room, 2), middle = y + (rowHeight - gap) / 2 + 12;
      lines.forEach((line, i) => fitText(c, [{ text: line, color: colors.ink, weight: 700 }], x + size + 28, middle + (i - (lines.length - 1) / 2) * 50, 34, room));
    } else {
      if (image) c.drawImage(image, x + (tileWidth - picture) / 2, y + 10, picture, picture);
      fitText(c, [{ text: tile.text, color: colors.ink, weight: 700 }], x + tileWidth / 2, y + rowHeight - gap - 26, 34, tileWidth - 30, "center");
    }
  });

  drawFooterBand(c, "feed", data.footer, site, { band: colors.band, ask: "#ffd166", site: "#ffffff" });
}
