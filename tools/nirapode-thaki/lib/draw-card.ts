// The "আব্বু-আম্মুকে দেখাও" card: the rules learned today, one per row, with no name. 1080×1350.
import { cardSizes, drawFooterBand, fitText, roundedRect } from "../../../shared/card-canvas";
import { svgDocument } from "./art";

export type CardData = { label: string; title: string; stars: number; rows: { icon: string; text: string }[] };

const colors = { bg: "#f2f7fc", tile: "#ffffff", edge: "#cfdcea", ink: "#1f2a3a", accent: "#2459a8", star: "#f2a900", starOff: "#dfe6ee", tick: "#2e9e44" };

/** Turns icon ids into decoded images from data: URLs (nothing is fetched). */
export async function loadPictures(ids: string[]) {
  const pictures = new Map<string, HTMLImageElement>();
  await Promise.all([...new Set(ids)].map(async id => {
    const image = new Image();
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgDocument(id))}`;
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

  fitText(c, [{ text: data.label, color: colors.accent, weight: 700, display: true }], width / 2, 100, 40, 900, "center");
  fitText(c, [{ text: data.title, color: colors.ink, weight: 800, display: true }], width / 2, 186, 58, 960, "center");
  for (let i = 0; i < 3; i++) star(c, width / 2 + (i - 1) * 76, 256, 30, i < data.stars ? colors.star : colors.starOff);

  const left = 70, rowHeight = 176, top = 316, tile = 144;
  data.rows.slice(0, 5).forEach((row, index) => {
    const y = top + index * rowHeight;
    roundedRect(c, left, y, width - left * 2, rowHeight - 20, 34); c.fillStyle = colors.tile; c.fill();
    c.lineWidth = 4; c.strokeStyle = colors.edge; c.stroke();
    const picture = pictures.get(row.icon);
    if (picture) c.drawImage(picture, left + 12, y + 6, tile, tile);
    fitText(c, [{ text: row.text, color: colors.ink, weight: 700 }], left + tile + 36, y + rowHeight / 2 + 4, 46, width - left * 2 - tile - 160);
    // A green tick at the row's end: done, not graded.
    c.strokeStyle = colors.tick; c.lineWidth = 9; c.lineCap = "round"; c.lineJoin = "round";
    c.beginPath(); c.moveTo(width - left - 74, y + 80); c.lineTo(width - left - 56, y + 98); c.lineTo(width - left - 26, y + 62); c.stroke();
  });

  drawFooterBand(c, "feed", "রাস্তা, পুকুর, চুলা, ঝড়: নিরাপদে থাকার খেলা", site, { band: "#1d3f73", ask: "#ffd166", site: "#ffffff" });
}
