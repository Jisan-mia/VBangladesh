// The "আব্বু-আম্মুকে দেখাও" card: today's sharing, the last table with every plate equal, and the last রুটি cut.
// No name, no photo, no stars, and nothing about who got the last piece. Saving it is behind the parent gate.
import { cardSizes, drawFooterBand, fitText, renderCard } from "../../../shared/card-canvas";
import { bn, FRACTIONS, guestsFor } from "./people";
import { cardLines, divisionLine, type Today } from "./round";
import { cutRuti, faceArt, FOOD_ART, paint } from "./shapes";

const colors = { bg: "#fdf4e6", ink: "#3d2614", muted: "#7a5a40", accent: "#a34b12", cloth: "#f4dcc0", plate: "#ffffff", rim: "#d9c9b4", band: "#4a2410", ask: "#ffd98a" };
export const CARD_ASK = "রাতের খাবারে ভাগের ভারটা ওকে দাও";

export function drawCard(canvas: HTMLCanvasElement, today: Today, site: string) {
  const { width, height } = cardSizes.feed;
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const cx = width / 2, lines = cardLines(today);
  c.fillStyle = colors.bg; c.fillRect(0, 0, width, height);
  fitText(c, [{ text: "সমান ভাগ", color: colors.muted, weight: 700, display: true }], cx, 110, 44, 900, "center");
  fitText(c, [{ text: lines[0] ?? "আজ মেহমানদের সমান ভাগ দিলাম", color: colors.accent, weight: 800, display: true }], cx, 220, 72, 980, "center");

  // Only naming played today: no table, just the cut রুটি. Without a cut, the table moves down to fill the card.
  const table = today.table, parts = today.cuts.at(-1) ?? (table ? undefined : 4), dy = parts ? 0 : 110;
  if (table) drawTable(c, table, dy);

  // The last রুটি cut, with its piece named the school way and the home way.
  if (parts) {
    const y = table ? 975 : 640;
    paint(c, cutRuti(parts, { shade: 0 }), 330, y, table ? 210 : 360);
    fitText(c, [{ text: bn(1), color: colors.ink, weight: 800, display: true }], 600, y - 25, 72, 120, "center");
    c.fillStyle = colors.ink; c.fillRect(565, y - 5, 70, 6);
    fitText(c, [{ text: bn(parts), color: colors.ink, weight: 800, display: true }], 600, y + 70, 72, 120, "center");
    fitText(c, [{ text: FRACTIONS[parts].word, color: colors.accent, weight: 800, display: true }], 670, y + 25, 50, 360);
  }
  lines.slice(1).forEach((line, index) => fitText(c, [{ text: line, color: colors.ink, weight: 800, display: true }], cx, (parts ? 1145 : 1040) + index * 64, 46, 960, "center"));
  drawFooterBand(c, "feed", CARD_ASK, site, { band: colors.band, ask: colors.ask, site: "#ffffff" });
}

/** The last table: every face smiling over the same number on every plate, and the sum it was. */
function drawTable(c: CanvasRenderingContext2D, table: NonNullable<Today["table"]>, dy: number) {
  const n = table.plates, cell = 960 / n;
  c.fillStyle = colors.cloth; c.beginPath(); c.roundRect(40, 280 + dy, 1000, 430, 40); c.fill();
  guestsFor(n, 0).forEach((guest, seat) => {
    const x = 60 + cell * (seat + 0.5), plateW = Math.min(200, cell - 24);
    paint(c, faceArt(guest, "happy"), x, 380 + dy, guest.small ? 130 : 160);
    c.fillStyle = colors.plate; c.strokeStyle = colors.rim; c.lineWidth = 6;
    c.beginPath(); c.ellipse(x, 590 + dy, plateW / 2, 86, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    const shown = Math.min(table.per, 4), size = Math.min(84, plateW / 2.3), cols = Math.min(2, shown), rows = Math.ceil(shown / 2);
    for (let item = 0; item < shown; item++) {
      const col = item % 2, row = Math.floor(item / 2), inRow = Math.min(cols, shown - row * 2);
      paint(c, FOOD_ART[table.food], x + (col - (inRow - 1) / 2) * size * 0.95, 590 + dy + (row - (rows - 1) / 2) * size * 0.8, size);
    }
  });
  fitText(c, [{ text: divisionLine(table), color: colors.accent, weight: 800, display: true }], 540, 820 + dy, 76, 960, "center");
}

export const cardBlob = (today: Today, site: string) => renderCard(canvas => drawCard(canvas, today, site));
export const cardFontSample = `সমান ভাগ আজ ০১২৩৪৫৬৭৮৯ জন মেহমানকে দিলাম টা রুটি কেটে অর্ধেক, তিন ভাগের এক চার আর বানালাম নাম বললাম পিঠা আম মোয়া জিলাপি ÷ = করে ${CARD_ASK}`;
