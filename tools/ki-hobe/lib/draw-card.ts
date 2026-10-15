// The "আব্বু-আম্মুকে দেখাও" card: how many questions today, and the last round's findings with their pictures.
// No name, no photo, no score. Drawn on the phone; saving it is behind the parent gate.
import { cardSizes, drawFooterBand, fitText, renderCard } from "../../../shared/card-canvas";
import { drawPic } from "./art";
import { cardLine } from "./game";
import type { Item } from "./questions";

const colors = { bg: "#eef4fb", tile: "#ffffff", ink: "#1f2d4a", muted: "#52607a", band: "#1c4a7d", ask: "#ffd98a" };
const ASK = "আজ রাতে চাঁদটা একসাথে দেখো";

export type Today = { count: number; items: readonly Item[] };

export function drawCard(canvas: HTMLCanvasElement, today: Today, site: string) {
  const { width, height } = cardSizes.feed;
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  c.fillStyle = colors.bg; c.fillRect(0, 0, width, height);

  fitText(c, [{ text: "কী হবে বলো তো?", color: colors.muted, weight: 700, display: true }], width / 2, 110, 42, 900, "center");
  fitText(c, [{ text: cardLine(today.count), color: colors.ink, weight: 800, display: true }], width / 2, 210, 62, 980, "center");

  const rows = today.items.slice(0, 5), rowHeight = 188, top = 280 + (5 - rows.length) * rowHeight / 2;
  rows.forEach((item, i) => {
    const y = top + i * rowHeight, pics = item.choices[item.answer].pics;
    c.fillStyle = colors.tile; c.beginPath(); c.roundRect(50, y, width - 100, rowHeight - 24, 28); c.fill();
    pics.forEach((pic, k) => drawPic(c, pic, pics.length > 1 ? 112 + k * 92 : 158, y + (rowHeight - 24) / 2, pics.length > 1 ? 96 : 128));
    fitText(c, [{ text: item.card, color: colors.ink, weight: 700, display: true }], 270, y + (rowHeight - 24) / 2 + 16, 44, width - 360);
  });

  drawFooterBand(c, "feed", ASK, site, { band: colors.band, ask: colors.ask, site: "#ffffff" });
}

export const cardBlob = (today: Today, site: string) => renderCard(canvas => drawCard(canvas, today, site));
export const cardFontSample = (today: Today) => `কী হবে বলো তো? ${cardLine(today.count)} ${today.items.map(item => item.card).join(" ")} ${ASK} ০১২৩৪৫৬৭৮৯`;
