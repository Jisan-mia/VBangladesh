// The "আব্বু-আম্মুকে দেখাও" card: today's stories on this phone, with no name and no score. A signpost at a মোড় on top.
import { cardSizes, drawFooterBand, fitText, renderCard } from "../../../shared/card-canvas";
import { bothRead, type Progress } from "./progress";
import { storyOf } from "./stories";

const bnDigits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => bnDigits.format(value);

/** The words on the card, kept pure so tests can pin them. */
export function cardText(today: readonly string[], progress: Progress) {
  const stories = today.map(id => storyOf(id)).filter(story => story !== undefined);
  const both = stories.filter(story => bothRead(progress, story.id)).length;
  return {
    headline: stories.length ? `আজ ${bn(stories.length)}টা গল্প পড়লাম` : "আজ গল্পের মোড়ে ছিলাম",
    sub: both ? `${bn(both)}টায় দুই মোড়ই দেখলাম` : "প্রতিটা গল্পে একটা মোড়, বেছেছি আমি",
    rows: stories.slice(0, 5).map(story => ({ title: story.title, color: story.color, both: bothRead(progress, story.id) })),
  };
}

const colors = { bg: "#fff6e3", ink: "#3a2a1c", muted: "#7a6650", accent: "#9a4b12", post: "#7a4a2a", band: "#5a2c0c", ask: "#ffd98a" };

function signpost(c: CanvasRenderingContext2D, cx: number, top: number) {
  c.fillStyle = colors.post; c.fillRect(cx - 9, top, 18, 250);
  const board = (y: number, dir: 1 | -1, fill: string) => {
    c.beginPath();
    const x0 = cx - dir * 20, x1 = cx + dir * 170, x2 = cx + dir * 210;
    c.moveTo(x0, y); c.lineTo(x1, y); c.lineTo(x2, y + 34); c.lineTo(x1, y + 68); c.lineTo(x0, y + 68); c.closePath();
    c.fillStyle = fill; c.fill();
  };
  board(top + 30, -1, "#2f6f9e");
  board(top + 120, 1, "#d35400");
  c.fillStyle = "#93c66e"; c.beginPath(); c.ellipse(cx, top + 252, 150, 20, 0, 0, Math.PI * 2); c.fill();
}

export function drawCard(canvas: HTMLCanvasElement, today: readonly string[], progress: Progress, site: string) {
  const { width, height } = cardSizes.feed;
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const text = cardText(today, progress), cx = width / 2;
  c.fillStyle = colors.bg; c.fillRect(0, 0, width, height);
  fitText(c, [{ text: "গল্পের মোড়", color: colors.muted, weight: 700, display: true }], cx, 96, 44, 900, "center");
  c.save(); c.translate(cx, 150); c.scale(1.5, 1.5); signpost(c, 0, 0); c.restore();
  fitText(c, [{ text: text.headline, color: colors.ink, weight: 800, display: true }], cx, 650, 84, 960, "center");
  fitText(c, [{ text: text.sub, color: colors.accent, weight: 700 }], cx, 734, 46, 940, "center");
  text.rows.forEach((row, index) => {
    const y = 850 + index * 80;
    c.fillStyle = row.color; c.beginPath(); c.arc(170, y - 14, 16, 0, Math.PI * 2); c.fill();
    fitText(c, [{ text: row.title, color: colors.ink, weight: 700 }], 210, y, 44, row.both ? 560 : 760);
    if (row.both) fitText(c, [{ text: "দুই মোড়ই", color: colors.muted, weight: 600 }], width - 150, y, 34, 220, "right");
  });
  drawFooterBand(c, "feed", "কোন মোড়টা বেছেছিল, জিজ্ঞেস করো", site, { band: colors.band, ask: colors.ask, site: "#ffffff" });
}

export const cardBlob = (today: readonly string[], progress: Progress, site: string) => renderCard(canvas => drawCard(canvas, today, progress, site));
