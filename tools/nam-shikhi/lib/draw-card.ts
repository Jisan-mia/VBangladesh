// The "আব্বু-আম্মুকে দেখাও" card: what was learned today, picture by picture, with no name. 1080×1350.
import { cardSizes, drawFooterBand, fitText, roundedRect } from "../../../shared/card-canvas";
import { bodyDocument, svgDocument } from "./art";
import type { cardCell } from "./round";

export type Cell = ReturnType<typeof cardCell>;
export type CardData = { label: string; title: string; stars: number; cells: Cell[] };

const colors = { bg: "#fff8e8", tile: "#ffffff", edge: "#efdcb4", ink: "#2b2416", muted: "#7a6a52", accent: "#1f6f5c", star: "#f2a900", starOff: "#e8dcbc", ring: "#f59e0b" };
const BODY_SCALE = 5;

/** Turns picture ids into decoded images from data: URLs (nothing is fetched). */
export async function loadPictures(ids: string[]) {
  const pictures = new Map<string, HTMLImageElement>();
  await Promise.all([...new Set(ids)].map(async id => {
    const image = new Image();
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(id === "body" ? bodyDocument(BODY_SCALE) : svgDocument(id))}`;
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

export function drawCard(canvas: HTMLCanvasElement, data: CardData, pictures: Map<string, HTMLImageElement>, site: string) {
  const { width, height } = cardSizes.feed;
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  c.fillStyle = colors.bg; c.fillRect(0, 0, width, height);

  fitText(c, [{ text: data.label, color: colors.accent, weight: 700, display: true }], width / 2, 104, 40, 900, "center");
  fitText(c, [{ text: data.title, color: colors.ink, weight: 800, display: true }], width / 2, 194, 62, 960, "center");
  for (let i = 0; i < 3; i++) star(c, width / 2 + (i - 1) * 76, 262, 30, i < data.stars ? colors.star : colors.starOff);

  const columns = 3, cellWidth = 320, tile = 252, left = (width - columns * cellWidth) / 2;
  data.cells.slice(0, 6).forEach((cell, index) => {
    const cx = left + cellWidth * (index % columns + 0.5), top = 330 + Math.floor(index / columns) * 448, x = cx - tile / 2;
    roundedRect(c, x, top, tile, tile, 36); c.fillStyle = colors.tile; c.fill();
    c.lineWidth = 5; c.strokeStyle = colors.edge; c.stroke();
    const picture = pictures.get(cell.art);
    if (picture && cell.spot) {
      // A close-up of the figure around the part, with a ring on it.
      const side = 56, [sx, sy] = cell.spot;
      c.save(); roundedRect(c, x + 6, top + 6, tile - 12, tile - 12, 30); c.clip();
      c.drawImage(picture, (sx - side / 2) * BODY_SCALE, (sy - side / 2) * BODY_SCALE, side * BODY_SCALE, side * BODY_SCALE, x, top, tile, tile);
      c.restore();
      c.beginPath(); c.arc(cx, top + tile / 2, 46, 0, Math.PI * 2); c.lineWidth = 9; c.strokeStyle = colors.ring; c.stroke();
    } else if (picture) c.drawImage(picture, x + 16, top + 16, tile - 32, tile - 32);
    fitText(c, [{ text: cell.top, color: colors.ink, weight: 800, display: true }], cx, top + tile + 72, 52, cellWidth - 24, "center");
    fitText(c, [{ text: cell.bottom, color: colors.muted, weight: 600 }], cx, top + tile + 128, 40, cellWidth - 24, "center");
  });

  drawFooterBand(c, "feed", "ছবি দেখে নাম শেখা, বাংলা আর ইংরেজিতে", site, { band: "#1f4f45", ask: "#ffd166", site: "#ffffff" });
}
