// The "আব্বু-আম্মুকে দেখাও" card: what was made today and the last tune drawn as its grid of lit notes. No name. 1080×1350.
import { cardSizes, drawFooterBand, fitText, roundedRect } from "../../../shared/card-canvas";
import { CARD_FOOTER, NOTES, ROWS, ROW_COLORS, cardSub, cardTitle, has, type Today } from "./music";

const colors = { bg: "#fff6ea", ink: "#2b2118", muted: "#6e5a48", accent: "#b04a1c", off: "#f1e4d2", band: "#4a2410" };

export function drawCard(canvas: HTMLCanvasElement, today: Today, site: string) {
  const { width, height } = cardSizes.feed;
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c || !today.last) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const { tune } = today.last;
  c.fillStyle = colors.bg; c.fillRect(0, 0, width, height);

  fitText(c, [{ text: "সুর বানাই", color: colors.accent, weight: 700, display: true }], width / 2, 96, 40, 900, "center");
  fitText(c, [{ text: cardTitle(today), color: colors.ink, weight: 800, display: true }], width / 2, 178, 56, 980, "center");
  fitText(c, [{ text: cardSub(today.last), color: colors.muted, weight: 600 }], width / 2, 238, 34, 900, "center");

  // The grid: note names on the left, one column per beat, high notes on top.
  const left = 170, right = 70, top = 300, bottom = 1180, gap = 16;
  const cell = Math.min((width - left - right - gap * (tune.length - 1)) / tune.length, (bottom - top - gap * (ROWS - 1)) / ROWS);
  const gridW = cell * tune.length + gap * (tune.length - 1), gridH = cell * ROWS + gap * (ROWS - 1);
  const x0 = left + (width - left - right - gridW) / 2, y0 = top + (bottom - top - gridH) / 2;
  for (let row = 0; row < ROWS; row++) {
    const y = y0 + (ROWS - 1 - row) * (cell + gap);
    fitText(c, [{ text: NOTES[row], color: ROW_COLORS[row], weight: 800, display: true }], x0 - 28, y + cell / 2 + 16, 46, 110, "right");
    tune.forEach((_, step) => {
      const x = x0 + step * (cell + gap), on = has(tune, step, row);
      roundedRect(c, x, y, cell, cell, cell * 0.22);
      c.fillStyle = on ? ROW_COLORS[row] : colors.off; c.fill();
      if (on) { c.fillStyle = "#ffffff55"; c.beginPath(); c.arc(x + cell * 0.32, y + cell * 0.3, cell * 0.1, 0, Math.PI * 2); c.fill(); }
    });
  }

  drawFooterBand(c, "feed", CARD_FOOTER, site, { band: colors.band, ask: "#ffd166", site: "#ffffff" });
}
