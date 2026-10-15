// The "আব্বু-আম্মুকে দেখাও" card: the ছড়া said today, its rhyme word in colour, the picture that completed it, no name. 1080×1350.
import { cardSizes, drawFooterBand, fitText, roundedRect, type Segment } from "../../../shared/card-canvas";
import { pictureOf, svgDocument } from "./pictures";
import { isBlank, rhymeOf, wordsOf } from "./rhymes";

export type CardData = { label: string; title: string; stars: number; rhyme: string; drum: string; footer: string };

const colors = { bg: "#fbf3e2", tile: "#fffaf0", edge: "#ecd9b4", ink: "#3a2a1c", accent: "#b4441c", star: "#f2a900", starOff: "#e7dbc2", drum: "#b5651d", drumEdge: "#5b3510", skin: "#f3e2c0", band: "#4a2412" };

export const FOOTER = "ছড়াটা একসাথে বলো, হাতে তালি দিয়ে";

/** Decodes the answer's drawing from a data: URL (nothing is fetched). */
export async function loadPicture(id: string) {
  const picture = pictureOf(id);
  if (!picture) return null;
  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgDocument(picture.art))}`;
  await image.decode();
  return image;
}

function star(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + i * Math.PI / 5, radius = i % 2 ? r * 0.45 : r;
    c.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
  }
  c.closePath(); c.fillStyle = fill; c.fill();
}

function drum(c: CanvasRenderingContext2D, cx: number, cy: number) {
  roundedRect(c, cx - 130, cy - 70, 260, 140, 66); c.fillStyle = colors.drum; c.fill();
  c.lineWidth = 6; c.strokeStyle = colors.drumEdge; c.stroke();
  c.beginPath();
  for (let i = 0; i <= 8; i++) c.lineTo(cx - 100 + i * 25, cy + (i % 2 ? 62 : -62));
  c.strokeStyle = colors.skin; c.lineWidth = 5; c.stroke();
  for (const side of [-1, 1]) {
    c.beginPath(); c.ellipse(cx + side * 128, cy, 24, 68, 0, 0, Math.PI * 2);
    c.fillStyle = colors.skin; c.fill(); c.lineWidth = 5; c.strokeStyle = colors.drumEdge; c.stroke();
  }
}

export function drawCard(canvas: HTMLCanvasElement, data: CardData, picture: HTMLImageElement | null, site: string) {
  const { width, height } = cardSizes.feed;
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  c.fillStyle = colors.bg; c.fillRect(0, 0, width, height);
  const rhyme = rhymeOf(data.rhyme);
  if (!rhyme) return;

  fitText(c, [{ text: data.label, color: colors.accent, weight: 700, display: true }], width / 2, 100, 40, 900, "center");
  fitText(c, [{ text: data.title, color: colors.ink, weight: 800, display: true }], width / 2, 182, 56, 960, "center");
  for (let i = 0; i < 3; i++) star(c, width / 2 + (i - 1) * 76, 250, 30, i < data.stars ? colors.star : colors.starOff);

  // The ছড়া, line by line, with the rhyme word the child found in colour.
  roundedRect(c, 60, 304, width - 120, 520, 36); c.fillStyle = colors.tile; c.fill();
  c.lineWidth = 4; c.strokeStyle = colors.edge; c.stroke();
  rhyme.lines.forEach((text, line) => {
    const segments: Segment[] = [];
    wordsOf(text).forEach((word, index) => {
      if (index) segments.push({ text: " ", color: colors.ink, weight: 700 });
      segments.push({ text: word, color: isBlank(rhyme, line, index) ? colors.accent : colors.ink, weight: isBlank(rhyme, line, index) ? 800 : 700 });
    });
    fitText(c, segments, width / 2, 410 + line * 112, 62, width - 200, "center");
  });

  // The drum the child played, and the picture that finished the rhyme.
  drum(c, 300, 1000);
  fitText(c, [{ text: data.drum, color: colors.ink, weight: 700 }], 300, 1150, 38, 440, "center");
  roundedRect(c, 640, 860, 280, 280, 36); c.fillStyle = colors.tile; c.fill();
  c.lineWidth = 4; c.strokeStyle = colors.edge; c.stroke();
  if (picture) c.drawImage(picture, 660, 880, 240, 240);
  fitText(c, [{ text: `মিলের শব্দ: ${pictureOf(rhyme.answer)?.bn ?? ""}`, color: colors.accent, weight: 800, display: true }], 780, 1196, 40, 400, "center");

  drawFooterBand(c, "feed", data.footer, site, { band: colors.band, ask: "#ffd166", site: "#ffffff" });
}
