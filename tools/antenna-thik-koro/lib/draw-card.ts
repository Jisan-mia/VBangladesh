import { cardSizes, drawFooterBand, fitText, renderCard, type CardFormat } from "../../../shared/card-canvas";
import { bn, channelName, humanLine, makeRounds, ROUNDS, seconds, SHOWS, type Shared } from "./antenna";
import { drawPicture, drawRoofScene, drawTv, TV_SCREEN } from "./art";

const INK = "#1d2b2a";
const DEEP = "#1d5229";
const WALL = "#d5e8d4";

// Feed and story share one drawing; the story only moves things down into its taller safe area.
const LAYOUT = {
  feed: { roof: 540, kicker: 112, name: 198, time: 336, sub: 402, pole: 870, antenna: 176, tv: 590, tvScale: 2.7, thumbs: 1036, thumb: 136, human: 1192 },
  story: { roof: 790, kicker: 336, name: 424, time: 566, sub: 634, pole: 870, antenna: 400, tv: 856, tvScale: 3, thumbs: 1366, thumb: 150, human: 1572 },
} as const;

/** The set showing the last channel, all five channels below it, the time big in the sky. */
export function drawCard(canvas: HTMLCanvasElement, shared: Shared, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const at = LAYOUT[format];
  const rounds = makeRounds(shared.seed);
  const last = rounds[ROUNDS - 1].picture;

  drawRoofScene(ctx, width, at.roof, 3, at.pole, at.antenna, 38);
  ctx.fillStyle = WALL; ctx.fillRect(0, at.roof + 31, width, height - at.roof - 31);
  ctx.fillStyle = "#c3dcc3"; ctx.fillRect(0, at.tv + 150 * at.tvScale - 60, width, height);

  const left = 84;
  fitText(ctx, [{ text: shared.name ? "ছবি এল! · অ্যান্টেনা ঠিক করো" : "ছবি এল!", color: DEEP, weight: 700 }], left, at.kicker, 34, 560);
  fitText(ctx, [{ text: shared.name || "অ্যান্টেনা ঠিক করো", color: INK, weight: 800, display: true }], left, at.name, 72, 560);
  const number = seconds(shared.tenths);
  fitText(ctx, [{ text: number, color: INK, weight: 800, display: true }], left - 4, at.time, 150, 420);
  const numberWidth = ctx.measureText(number).width;
  fitText(ctx, [{ text: "সেকেন্ডে", color: INK, weight: 700, display: true }], left + numberWidth + 14, at.time, 50, 560 - numberWidth - 14);
  fitText(ctx, [{ text: `${bn(ROUNDS)}টা চ্যানেল, ${bn(ROUNDS)}টাই ঝকঝকে`, color: DEEP, weight: 700 }], left, at.sub, 38, 560);

  const tvWidth = 240 * at.tvScale, tvX = (width - tvWidth) / 2, s = at.tvScale;
  ctx.fillStyle = "#7a4a26"; ctx.fillRect(tvX - 60, at.tv + 148 * s, tvWidth + 120, 22);
  drawTv(ctx, tvX, at.tv, s);
  const screen = { x: tvX + TV_SCREEN.x * s, y: at.tv + TV_SCREEN.y * s, w: TV_SCREEN.w * s, h: TV_SCREEN.h * s };
  ctx.save();
  ctx.beginPath(); ctx.roundRect(screen.x, screen.y, screen.w, screen.h, TV_SCREEN.r * s); ctx.clip();
  drawPicture(ctx, last, screen.x, screen.y, screen.w, screen.h);
  const shine = ctx.createLinearGradient(screen.x, screen.y, screen.x + screen.w * 0.6, screen.y + screen.h * 0.7);
  shine.addColorStop(0, "rgba(255,255,255,.18)"); shine.addColorStop(0.5, "rgba(255,255,255,0)");
  ctx.fillStyle = shine; ctx.fillRect(screen.x, screen.y, screen.w, screen.h);
  const osd = `${channelName(ROUNDS - 1)} · ${SHOWS[last]}`;
  fitText(ctx, [{ text: osd, color: "rgba(0,0,0,.6)", weight: 700 }], screen.x + 25, screen.y + 47, 28, screen.w - 44);
  fitText(ctx, [{ text: osd, color: "#8dfca6", weight: 700 }], screen.x + 22, screen.y + 44, 28, screen.w - 44);
  ctx.restore();

  // all five channels, like a row of little sets
  const gap = 16, size = at.thumb, rowWidth = ROUNDS * size + (ROUNDS - 1) * gap;
  rounds.forEach((round, index) => {
    const x = (width - rowWidth) / 2 + index * (size + gap), h = size * 0.66;
    ctx.fillStyle = "#2a2d2e"; ctx.beginPath(); ctx.roundRect(x, at.thumbs, size, h, 14); ctx.fill();
    ctx.save();
    ctx.beginPath(); ctx.roundRect(x + 6, at.thumbs + 6, size - 12, h - 12, 9); ctx.clip();
    drawPicture(ctx, round.picture, x + 6, at.thumbs + 6, size - 12, h - 12);
    ctx.restore();
    fitText(ctx, [{ text: bn(index + 1), color: "#8dfca6", weight: 800 }], x + 14, at.thumbs + 30, 22, 40);
  });

  fitText(ctx, [{ text: humanLine(shared.tenths), color: INK, weight: 700, display: true }], width / 2, at.human, 44, width - 140, "center");
  drawFooterBand(ctx, format, "তুমি কত তাড়াতাড়ি পারবে?", site, { band: "#173d22", ask: "#ffd166", site: "#ffffff" });
}

export const cardBlob = (shared: Shared, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, shared, format, site));
