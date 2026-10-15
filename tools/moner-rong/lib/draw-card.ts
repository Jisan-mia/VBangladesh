import { cardSizes, drawFooterBand, fitText, renderCard } from "../../../shared/card-canvas";
import { drawFace, FEELINGS, ORDER } from "./faces";
import { cardHead, cardSub, cardTail, type Today } from "./scenes";

const colors = { bg: "#fff6e9", ink: "#3b2a20", muted: "#7a6650", accent: "#a2477a", band: "#4a2a40", ask: "#ffd166" };

/** What the child did today, for the parent: how many scenes, and the faces named, each in its colour. No name, no photo. */
export function drawCard(canvas: HTMLCanvasElement, today: Today, site: string) {
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
  const rows = Math.ceil(named.length / 3) || 1, size = rows > 1 ? 210 : 300, rowHeight = size + 90;
  const top = rows > 1 ? 450 : 530;
  named.forEach((feeling, index) => {
    const row = Math.floor(index / 3), inRow = Math.min(3, named.length - row * 3), col = index % 3;
    const x = cx + (col - (inRow - 1) / 2) * 320, y = top + row * rowHeight + size / 2;
    drawFace(c, feeling, x, y, size, FEELINGS[feeling].light);
    fitText(c, [{ text: FEELINGS[feeling].word, color: FEELINGS[feeling].color, weight: 800, display: true }], x, y + size / 2 + 62, 50, 300, "center");
  });

  fitText(c, [{ text: cardSub, color: colors.muted, weight: 600 }], cx, rows > 1 ? 1170 : 1080, 38, 940, "center");
  drawFooterBand(c, "feed", "রাতে জিজ্ঞেস করো: আজ তোমার মনে কোন রং?", site, { band: colors.band, ask: colors.ask, site: "#ffffff" });
}

export const cardBlob = (today: Today, site: string) => renderCard(canvas => drawCard(canvas, today, site));
export const cardFontSample = `মনের রং আজ ০১২৩৪৫৬৭৮৯টা ছবিতে ${cardTail} ${cardSub} ${ORDER.map(feeling => FEELINGS[feeling].word).join(" ")} রাতে জিজ্ঞেস করো: আজ তোমার মনে কোন রং?`;
