// The "আব্বু-আম্মুকে দেখাও" card: how many experiments today, and the last round's findings with their pictures.
// No name, no photo, no score. Drawn on the phone; saving it is behind the parent gate.
import { cardSizes, drawFooterBand, fitText, renderCard } from "../../../shared/card-canvas";
import { drawPic } from "./art";
import type { Item } from "./items";
import { bn, cardLine, type Today } from "./lines";
import { levelOf } from "./levels";

const colors = { bg: "#eaf5fc", tile: "#ffffff", ink: "#1f2d4a", muted: "#52607a", band: "#1c4a7d", ask: "#ffd98a", star: "#f2a900", starOff: "#cfdcea" };
const ASK = "আজ রাতে চাঁদটা একসাথে দেখো";

/** What the card says: today's finished experiments and, for the level just played, the stars the end screen showed. */
export type CardData = { today: Today; level: number; stars: number };

function star(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + i * Math.PI / 5, radius = i % 2 ? r * 0.45 : r;
    c.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
  }
  c.closePath(); c.fillStyle = fill; c.fill();
}

export function drawCard(canvas: HTMLCanvasElement, data: CardData, site: string) {
  const { today } = data;
  const { width, height } = cardSizes.feed;
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  c.fillStyle = colors.bg; c.fillRect(0, 0, width, height);

  fitText(c, [{ text: "কী হবে বলো তো?", color: colors.muted, weight: 700, display: true }], width / 2, 100, 42, 900, "center");
  fitText(c, [{ text: cardLine(today.count), color: colors.ink, weight: 800, display: true }], width / 2, 200, 60, 980, "center");

  const rows = today.items.slice(0, 5), rowHeight = 164, top = 260 + (5 - rows.length) * rowHeight / 2;
  rows.forEach((item: Item, i) => {
    const y = top + i * rowHeight, pics = item.choices[item.answer].pics;
    c.fillStyle = colors.tile; c.beginPath(); c.roundRect(50, y, width - 100, rowHeight - 20, 8); c.fill();
    pics.forEach((pic, k) => drawPic(c, pic, pics.length > 1 ? 112 + k * 92 : 158, y + (rowHeight - 20) / 2, pics.length > 1 ? 90 : 112));
    fitText(c, [{ text: item.card, color: colors.ink, weight: 700, display: true }], 270, y + (rowHeight - 20) / 2 + 14, 42, width - 360);
  });

  const base = top + rows.length * rowHeight + 24;
  for (let i = 0; i < 3; i++) star(c, width / 2 + (i - 1) * 64, base + 22, 24, i < data.stars ? colors.star : colors.starOff);
  fitText(c, [{ text: `${levelOf(data.level).name}: ${bn(data.stars)} তারা`, color: colors.ink, weight: 700, display: true }], width / 2, base + 84, 36, 900, "center");
  drawFooterBand(c, "feed", ASK, site, { band: colors.band, ask: colors.ask, site: "#ffffff" });
}

export const cardBlob = (data: CardData, site: string) => renderCard(canvas => drawCard(canvas, data, site));
export const cardFontSample = (data: CardData) => `কী হবে বলো তো? ${cardLine(data.today.count)} ${data.today.items.map(item => item.card).join(" ")} ${levelOf(data.level).name} তারা ${ASK} ০১২৩৪৫৬৭৮৯`;
