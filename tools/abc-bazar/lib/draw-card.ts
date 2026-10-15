// The parent card (1080×1350): the round's six letters as market stall tiles, picture and word, what was done, no name.
import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect } from "../../../shared/card-canvas";
import { svgDocument } from "./art";
import { entryOf, splitWord } from "./letters";
import { answerOf, bn, doneLine, levelOf, starsOf, type Item } from "./round";

const colors = { paper: "#fbf3e6", tile: "#ffffff", edge: "#ead7bd", ink: "#2b2433", muted: "#7a5a46", accent: "#b5452a", star: "#f2a516", starOff: "#e6d8c4", band: "#5e2a1c", stripe: "#f2c230" };

/** Pictures as decoded images from data: URLs (nothing is fetched). */
export async function loadPictures(letters: readonly string[]) {
  const pictures = new Map<string, HTMLImageElement>();
  await Promise.all([...new Set(letters)].map(async letter => {
    const image = new Image();
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgDocument(letter))}`;
    await image.decode();
    pictures.set(letter, image);
  }));
  return pictures;
}

function star(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string) {
  c.beginPath();
  for (let i = 0; i < 10; i++) { const angle = -Math.PI / 2 + i * Math.PI / 5, radius = i % 2 ? r * 0.45 : r; c.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius); }
  c.closePath(); c.fillStyle = fill; c.fill();
}

export const cardFontSample = (items: readonly Item[]) => `এবিসি বাজার লেভেল ${items.map(item => { const entry = entryOf(item.letter); return `${entry.letter}${entry.letter.toLowerCase()} ${entry.word} ${entry.bn}`; }).join(" ")}`;

export function drawCard(canvas: HTMLCanvasElement, level: number, items: readonly Item[], mistakes: number, pictures: Map<string, HTMLImageElement>, site: string) {
  const { width, height } = cardSizes.feed;
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  c.fillStyle = colors.paper; c.fillRect(0, 0, width, height);
  // The stall's striped awning.
  for (let x = 0; x < width; x += 90) { c.fillStyle = (x / 90) % 2 ? colors.paper : colors.accent; c.fillRect(x, 0, 90, 34); }
  c.fillStyle = colors.stripe; c.fillRect(0, 34, width, 8);

  fitText(c, [{ text: `এবিসি বাজার · লেভেল ${bn(level)} · ${levelOf(level).title}`, color: colors.muted, weight: 700, display: true }], width / 2, 116, 36, 960, "center");
  fitText(c, [{ text: doneLine(level, items.length), color: colors.ink, weight: 800, display: true }], width / 2, 206, 62, 980, "center");
  const stars = starsOf(mistakes);
  for (let i = 0; i < 3; i++) star(c, width / 2 + (i - 1) * 80, 282, 30, i < stars ? colors.star : colors.starOff);

  const cols = 3, gap = 28, left = 60, tileW = (width - left * 2 - gap * (cols - 1)) / cols, tileH = 400, top = 340;
  items.slice(0, 6).forEach((item, i) => {
    const entry = entryOf(item.letter), x = left + (i % cols) * (tileW + gap), y = top + Math.floor(i / cols) * (tileH + gap), mid = x + tileW / 2;
    roundedRect(c, x, y, tileW, tileH, 30); c.fillStyle = colors.tile; c.fill();
    c.lineWidth = 4; c.strokeStyle = colors.edge; c.stroke();
    const picture = pictures.get(entry.letter);
    if (picture) c.drawImage(picture, mid - 85, y + 18, 170, 170);
    // b d p q rounds show the small letter they practised; the others show the pair.
    const label = item.kind === "mirror" || item.kind === "same" ? answerOf(item) : `${entry.letter} ${entry.letter.toLowerCase()}`;
    fitText(c, [{ text: label, color: colors.accent, weight: 800, display: true }], mid, y + 262, 72, tileW - 30, "center");
    const [before, letter, after] = splitWord(entry);
    fitText(c, [{ text: before, color: colors.ink, weight: 700 }, { text: letter, color: colors.accent, weight: 800 }, { text: after, color: colors.ink, weight: 700 }], mid, y + 320, 42, tileW - 30, "center");
    fitText(c, [{ text: entry.bn, color: colors.muted, weight: 600 }], mid, y + 368, 32, tileW - 30, "center");
  });

  fitText(c, [{ text: mistakes ? `${bn(mistakes)}বার আবার দেখে মিলিয়েছি` : "একবারও আটকাইনি", color: colors.muted, weight: 600 }], width / 2, 1210, 36, 960, "center");
  drawFooterBand(c, "feed", "বাজারে গিয়ে খোঁজো: M দিয়ে কী আছে?", site, { band: colors.band, ask: "#ffd166", site: "#ffffff" });
}

export const cardBlob = async (level: number, items: readonly Item[], mistakes: number, site: string) => {
  const pictures = await loadPictures(items.map(item => item.letter));
  return renderCard(canvas => drawCard(canvas, level, items, mistakes, pictures, site));
};
