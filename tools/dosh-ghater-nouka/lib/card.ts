import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect } from "../../../shared/card-canvas";
import { drawBoat } from "./art";
import { bn } from "./levels";

export type Today = { games: number; counted: number; n: number; back: boolean };
export const cardLine = (today: Today) => `আজ ১ থেকে ${bn(today.n)} গুনে গুনে নৌকা চালালাম`;
export const cardSub = (today: Today) => `${bn(today.games)}টা খেলা, ${bn(today.counted)}টা ঘাট গোনা${today.back ? ", উল্টো গোনাও হলো" : ""}`;

const colors = { sky: "#eaf6f2", bank: "#9ccf73", water: "#4aa3b5", wave: "#7cc3d0", step: "#d98b5f", tile: "#fff8e8", ink: "#1f3a40", muted: "#4f6b70", accent: "#1f6f8b", goal: "#f2a900", band: "#134b5f", ask: "#ffd166" };

/** What the child did today, for the parent: the whole straight line of ghats and the boat at the last one. No name, no photo. */
export function drawCard(canvas: HTMLCanvasElement, today: Today, site: string) {
  const { width, height } = cardSizes.feed;
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const cx = width / 2, [head, tail] = cardLine(today).split(" গুনে ");

  c.fillStyle = colors.sky; c.fillRect(0, 0, width, height);
  fitText(c, [{ text: "দশ ঘাটের নৌকা", color: colors.muted, weight: 700, display: true }], cx, 120, 40, 900, "center");
  fitText(c, [{ text: head, color: colors.accent, weight: 800, display: true }], cx, 290, 120, 960, "center");
  fitText(c, [{ text: `গুনে ${tail}`, color: colors.ink, weight: 800, display: true }], cx, 390, 64, 960, "center");

  // The board: one straight row of numbered ghats on the bank, the river below.
  const left = 60, span = width - 120, cell = span / today.n, tile = Math.min(110, cell - (today.n > 10 ? 6 : 12)), bankTop = 540, tileTop = bankTop + 40;
  c.fillStyle = colors.bank; c.fillRect(0, bankTop, width, 130);
  c.fillStyle = colors.water; c.fillRect(0, bankTop + 130, width, 260);
  c.strokeStyle = colors.wave; c.lineWidth = 5;
  for (let y = bankTop + 200; y < bankTop + 380; y += 60) {
    c.beginPath();
    for (let x = 0; x <= width; x += 40) c.lineTo(x, y + (x / 40 % 2 ? 8 : -8));
    c.stroke();
  }
  for (let ghat = 1; ghat <= today.n; ghat++) {
    const x = left + (ghat - 1) * cell + (cell - tile) / 2;
    c.fillStyle = colors.step;
    for (let s = 0; s < 3; s++) c.fillRect(x + s * 3, tileTop + tile * 0.9 + s * 14, tile - s * 6, 12);
    roundedRect(c, x, tileTop, tile, tile, 12);
    c.fillStyle = ghat === today.n ? colors.goal : colors.tile; c.fill();
    fitText(c, [{ text: bn(ghat), color: colors.ink, weight: 800, display: true }], x + tile / 2, tileTop + tile * 0.7, today.n > 10 ? 30 : 48, tile - 6, "center");
  }
  drawBoat(c, left + (today.n - 0.5) * cell - 40, bankTop + 300, 260, 0);

  fitText(c, [{ text: cardSub(today), color: colors.ink, weight: 700, display: true }], cx, 1060, 52, 940, "center");
  fitText(c, [{ text: "সোজা এক সারিতে নম্বর, প্রতি ঘাটে জোরে গোনা", color: colors.muted, weight: 600 }], cx, 1140, 34, 940, "center");
  drawFooterBand(c, "feed", "সিঁড়িতে ওঠার সময়ও একসাথে গোনো", site, { band: colors.band, ask: colors.ask, site: "#ffffff" });
}

export const cardBlob = (today: Today, site: string) => renderCard(canvas => drawCard(canvas, today, site));
export const cardFontSample = (today: Today) => `দশ ঘাটের নৌকা ${cardLine(today)} ${cardSub(today)} সোজা এক সারিতে নম্বর, প্রতি ঘাটে জোরে গোনা সিঁড়িতে ওঠার সময়ও একসাথে গোনো ০১২৩৪৫৬৭৮৯`;
