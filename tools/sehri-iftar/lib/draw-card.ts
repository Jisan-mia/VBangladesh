import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, type CardFormat } from "../../../shared/card-canvas";
import { bn, shortDate, type Season } from "./timetable";

/** What the pocket card shows. `times` is set only from the verified IF table. */
export type Card = { district: string; season: Season; times: { sehri: string; iftar: string; when: string } | null; line: string; source: string };

type Ctx = CanvasRenderingContext2D;
const COVER = "#7a3a0e", COVER_DEEP = "#5a2a08", GOLD = "#e9b949", CREAM = "#fbf3df", INK = "#3d1c06", BROWN = "#9a4b12", MUTED = "#8a6a4a";
const TAU = Math.PI * 2;

function crescent(ctx: Ctx, x: number, y: number, r: number) {
  ctx.save();
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.moveTo(x + r * 0.38 + r * 0.8, y - r * 0.22); ctx.arc(x + r * 0.38, y - r * 0.22, r * 0.8, 0, TAU);
  ctx.fillStyle = GOLD; ctx.fill("evenodd");
  // the small star tucked inside the curve, as on every printed Ramadan card
  ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, d = i % 2 ? r * 0.1 : r * 0.24; ctx.lineTo(x + r * 0.55 + Math.cos(a) * d, y - r * 0.05 + Math.sin(a) * d); }
  ctx.fill(); ctx.restore();
}

/** Foil frame: a double gold rule with little diamonds at the corners. */
function frame(ctx: Ctx, width: number, height: number, bottom: number) {
  ctx.strokeStyle = GOLD;
  for (const [inset, line] of [[34, 4], [46, 1.5]] as const) { ctx.lineWidth = line; ctx.strokeRect(inset, inset, width - inset * 2, bottom - inset * 2); }
  ctx.fillStyle = GOLD;
  for (const [x, y] of [[40, 40], [width - 40, 40], [40, bottom - 40], [width - 40, bottom - 40]]) {
    ctx.beginPath(); ctx.moveTo(x, y - 14); ctx.lineTo(x + 14, y); ctx.lineTo(x, y + 14); ctx.lineTo(x - 14, y); ctx.closePath(); ctx.fill();
  }
}

/** The days of the month as small moons: gone-by ones filled, today ringed, the rest outlined. */
function moons(ctx: Ctx, total: number, done: number, top: number, centre: number) {
  const gap = 62, r = 19;
  for (let i = 0; i < total; i++) {
    const row = Math.floor(i / 10), col = i % 10, inRow = Math.min(10, total - row * 10);
    const x = centre + (col - (inRow - 1) / 2) * gap, y = top + row * 58;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
    if (i < done) { ctx.fillStyle = i === done - 1 ? BROWN : "#d9a441"; ctx.fill(); }
    else { ctx.strokeStyle = "#d8c3a0"; ctx.lineWidth = 3; ctx.stroke(); }
    if (i === done - 1) { ctx.beginPath(); ctx.arc(x, y, r + 7, 0, TAU); ctx.strokeStyle = BROWN; ctx.lineWidth = 3; ctx.stroke(); }
  }
}

export function drawCard(canvas: HTMLCanvasElement, card: Card, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const story = format === "story";
  // Story keeps the same card, moved down out of the top 250px that Facebook covers.
  const dy = story ? 320 : 0;
  const bandTop = story ? height - 260 : height - 96;
  const cx = width / 2;

  ctx.fillStyle = COVER; ctx.fillRect(0, 0, width, height);
  const sheen = ctx.createLinearGradient(0, 0, width, height);
  sheen.addColorStop(0, "#ffffff14"); sheen.addColorStop(0.5, "#ffffff00"); sheen.addColorStop(1, "#00000022");
  ctx.fillStyle = sheen; ctx.fillRect(0, 0, width, height);
  frame(ctx, width, height, bandTop);
  if (story) fitText(ctx, [{ text: "রোজার দিন গোনা · একটুখানি", color: GOLD, weight: 600 }], cx, 300, 30, 800, "center");

  const { season, times } = card;
  crescent(ctx, cx, 128 + dy, 54);
  fitText(ctx, [{ text: season.phase === "unknown" ? "রমজান" : `রমজান ${bn(season.hijri)}`, color: GOLD, weight: 800, display: true }], cx, 262 + dy, 76, 800, "center");
  fitText(ctx, [{ text: "রোজার দিন গোনা", color: CREAM, weight: 600 }], cx, 312 + dy, 30, 800, "center");
  ctx.font = `700 38px "Bangla"`;
  const pill = Math.min(700, ctx.measureText(card.district).width + 80);
  roundedRect(ctx, cx - pill / 2, 340 + dy, pill, 62, 31); ctx.fillStyle = GOLD; ctx.fill();
  fitText(ctx, [{ text: card.district, color: INK, weight: 700 }], cx, 384 + dy, 38, pill - 40, "center");

  // the cream insert, with the fold crease of a pocket card across it
  const top = 430 + dy, bottom = 1140 + dy;
  roundedRect(ctx, 90, top, width - 180, bottom - top, 22); ctx.fillStyle = CREAM; ctx.fill();
  const crease = ctx.createLinearGradient(0, top + 316, 0, top + 336);
  crease.addColorStop(0, "#00000000"); crease.addColorStop(0.5, "#5a2a0814"); crease.addColorStop(1, "#00000000");
  ctx.fillStyle = crease; ctx.fillRect(90, top + 316, width - 180, 20);

  const maybe = season.phase !== "unknown" && season.likely ? "সম্ভাব্য " : "";
  if (season.phase === "unknown") {
    fitText(ctx, [{ text: "পরের রমজানের তারিখ আসছে", color: INK, weight: 700, display: true }], cx, top + 260, 56, 820, "center");
  } else {
    const before = season.phase === "before";
    fitText(ctx, [{ text: before ? `রমজান আসতে ${maybe}আর` : `আজ ${maybe}`, color: MUTED, weight: 600 }], cx, top + 70, 34, 820, "center");
    fitText(ctx, [{ text: bn(before ? season.days : season.day), color: BROWN, weight: 800, display: true }], cx, top + 240, 190, 820, "center");
    fitText(ctx, [{ text: before ? "দিন" : "রমজান", color: INK, weight: 700, display: true }], cx, top + 298, 46, 820, "center");
    moons(ctx, season.total, before ? 0 : season.day, top + 366, cx);
  }

  const lower = top + 506;
  if (times) {
    const box = 380, gap = 24;
    [["সেহরির শেষ", times.sehri], ["ইফতার", times.iftar]].forEach(([label, time], i) => {
      const x = cx - box - gap / 2 + i * (box + gap);
      roundedRect(ctx, x, lower, box, 100, 16); ctx.fillStyle = i ? "#f3dfb4" : "#efe5d0"; ctx.fill();
      fitText(ctx, [{ text: label, color: MUTED, weight: 600 }], x + box / 2, lower + 36, 26, box - 30, "center");
      fitText(ctx, [{ text: time, color: INK, weight: 800, display: true }], x + box / 2, lower + 86, 52, box - 30, "center");
    });
    fitText(ctx, [{ text: times.when, color: MUTED, weight: 500 }], cx, lower + 130, 24, 820, "center");
  } else if (season.phase !== "unknown") {
    const left = season.total - (season.phase === "during" ? season.day : 0);
    const note = season.phase === "before" ? `${maybe}প্রথম রোজা · ${shortDate(season.start)}` : left > 0 ? `রমজানের আর ${maybe}${bn(left)} দিন বাকি` : "রমজানের শেষ দিন";
    fitText(ctx, [{ text: note, color: INK, weight: 600 }], cx, lower + 60, 36, 820, "center");
  }
  fitText(ctx, [{ text: card.line, color: BROWN, weight: 700, display: true }], cx, bottom - 30, 40, 820, "center");

  fitText(ctx, [{ text: "সৌজন্যে: একটুখানি", color: GOLD, weight: 700 }, { text: `  ·  ${card.source}`, color: "#f1dcc0", weight: 500 }], cx, bottom + 46, 24, 860, "center");
  drawFooterBand(ctx, format, "তোমার জেলায় ইফতার কখন?", site, { band: COVER_DEEP, ask: GOLD, site: CREAM });
}

export const cardBlob = (card: Card, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, card, format, site));
