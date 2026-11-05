import { cardSizes, drawFooterBand, fitText, renderCard } from "../../../shared/card-canvas";
import { drawFace, FEELINGS, ORDER } from "./faces";
import { bn, cardHead, cardLevel, cardSub, cardTail, type Today } from "./lines";

const colors = { bg: "#fff6e9", ink: "#3b2a20", muted: "#7a6650", accent: "#a2477a", band: "#4a2a40", ask: "#ffd166", star: "#f2a900", starOff: "#e8dcbc" };

/** What the card says: today's finished pictures and, for the level just played, the same stars the end screen showed. */
export type CardData = { today: Today; level: number; stars: number };

function star(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + i * Math.PI / 5, radius = i % 2 ? r * 0.45 : r;
    c.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
  }
  c.closePath(); c.fillStyle = fill; c.fill();
}

/** What the child did today, for the parent: how many pictures, the faces named each in its colour, the level and its stars. No name, no photo. */
export function drawCard(canvas: HTMLCanvasElement, data: CardData, site: string) {
  const { today } = data;
  const { width, height } = cardSizes.feed;
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const cx = width / 2;
  c.fillStyle = colors.bg; c.fillRect(0, 0, width, height);
  fitText(c, [{ text: "মনের রং", color: colors.muted, weight: 700, display: true }], cx, 120, 40, 900, "center");
  fitText(c, [{ text: cardHead(today), color: colors.accent, weight: 800, display: true }], cx, 270, 110, 960, "center");
  fitText(c, [{ text: cardTail, color: colors.ink, weight: 800, display: true }], cx, 370, 72, 960, "center");

  // The faces named today, three to a row, each with its word underneath.
  const named = ORDER.filter(feeling => today.feelings.includes(feeling));
  const rows = Math.ceil(named.length / 3) || 1, size = rows > 1 ? 200 : 290, rowHeight = size + 90;
  const top = rows > 1 ? 430 : 500;
  named.forEach((feeling, index) => {
    const row = Math.floor(index / 3), inRow = Math.min(3, named.length - row * 3), col = index % 3;
    const x = cx + (col - (inRow - 1) / 2) * 320, y = top + row * rowHeight + size / 2;
    drawFace(c, feeling, x, y, size, FEELINGS[feeling].light);
    fitText(c, [{ text: FEELINGS[feeling].word, color: FEELINGS[feeling].color, weight: 800, display: true }], x, y + size / 2 + 62, 50, 300, "center");
  });

  // The level just played, with its practice stars (one for each time it was played through, up to three).
  const base = rows > 1 ? 1085 : 1020;
  for (let i = 0; i < 3; i++) star(c, cx + (i - 1) * 70, base, 28, i < data.stars ? colors.star : colors.starOff);
  fitText(c, [{ text: `${cardLevel(data.level)}: ${data.stars ? `${bn(data.stars)} তারা` : "খেলা হয়নি"}`, color: colors.ink, weight: 700, display: true }], cx, base + 70, 40, 900, "center");
  fitText(c, [{ text: cardSub, color: colors.muted, weight: 600 }], cx, base + 130, 34, 940, "center");
  drawFooterBand(c, "feed", "রাতে জিজ্ঞেস করো: আজ তোমার মনে কোন রং?", site, { band: colors.band, ask: colors.ask, site: "#ffffff" });
}

export const cardBlob = (data: CardData, site: string) => renderCard(canvas => drawCard(canvas, data, site));
export const cardFontSample = (data: CardData) =>
  `মনের রং আজ ০১২৩৪৫৬৭৮৯টা ছবিতে ${cardTail} ${cardSub} ${cardLevel(data.level)} তারা খেলা হয়নি ${ORDER.map(feeling => FEELINGS[feeling].word).join(" ")} রাতে জিজ্ঞেস করো: আজ তোমার মনে কোন রং?`;
