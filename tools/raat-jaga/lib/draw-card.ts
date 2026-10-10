import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, wrapText, BODY_FONT, type CardFormat } from "../../../shared/card-canvas";
import { bn, bnYear, nights, scoreLine, yearOf, type CardContent, type NightId } from "./nights";

const SKY = "#100e2a";
const SKY_LOW = "#221c4a";
const INK = "#f4f1ff";
const MUTED = "#a9a4d0";
const GOLD = "#ffc94a";
const DIM = "#5a5688";
const FRAME = "#3b6e5c";
const GRILLE = "#26262f";

/** A five-point star, the same shape the page uses for a ticked night. */
function star(context: CanvasRenderingContext2D, cx: number, cy: number, outer: number) {
  context.beginPath();
  for (let point = 0; point < 10; point++) {
    const radius = point % 2 ? outer * 0.45 : outer;
    const angle = -Math.PI / 2 + (point * Math.PI) / 5;
    context.lineTo(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
  }
  context.closePath();
}

/** The window with its green frame and iron grille; one star per night, lit if picked. */
function drawWindow(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, selected: ReadonlySet<NightId>) {
  context.fillStyle = FRAME;
  roundedRect(context, x - 16, y - 16, width + 32, height + 32, 10);
  context.fill();
  const sky = context.createLinearGradient(0, y, 0, y + height);
  sky.addColorStop(0, "#0a0920");
  sky.addColorStop(1, "#2a2358");
  context.fillStyle = sky;
  context.fillRect(x, y, width, height);
  context.save();
  context.beginPath(); context.rect(x, y, width, height); context.clip();
  // A crescent moon low in the corner, cut by the sky colour.
  context.fillStyle = "#fdf1c4";
  context.beginPath(); context.arc(x + width * 0.22, y + height * 0.1, 26, 0, Math.PI * 2); context.fill();
  context.fillStyle = "#0d0b25";
  context.beginPath(); context.arc(x + width * 0.22 + 12, y + height * 0.1 - 8, 24, 0, Math.PI * 2); context.fill();
  nights.forEach(night => {
    const sx = x + 24 + night.star[0] * (width - 48), sy = y + 24 + night.star[1] * (height - 48);
    if (selected.has(night.id)) {
      context.shadowColor = GOLD; context.shadowBlur = 22;
      context.fillStyle = GOLD;
      star(context, sx, sy, 15);
      context.fill();
      context.shadowBlur = 0;
    } else {
      context.fillStyle = DIM;
      context.beginPath(); context.arc(sx, sy, 3, 0, Math.PI * 2); context.fill();
    }
  });
  context.restore();
  context.fillStyle = GRILLE;
  for (let bar = 1; bar < 4; bar++) context.fillRect(x + (width * bar) / 4 - 4, y, 8, height);
  context.fillRect(x, y + height * 0.55 - 4, width, 8);
}

const layouts = {
  feed: { kicker: 92, window: 72, windowHeight: 330, name: 186, head: 270, line: 346, stats: 462, grid: 512, row: 62, friend: 1196 },
  story: { kicker: 312, window: 300, windowHeight: 360, name: 420, head: 508, line: 590, stats: 724, grid: 780, row: 72, friend: 1580 },
} as const;

export function drawCard(canvas: HTMLCanvasElement, card: CardContent, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const night = context.createLinearGradient(0, 0, 0, height);
  night.addColorStop(0, SKY);
  night.addColorStop(1, SKY_LOW);
  context.fillStyle = night;
  context.fillRect(0, 0, width, height);
  context.textBaseline = "alphabetic";

  drawWindow(context, 712, layout.window, 296, layout.windowHeight, card.selected);
  const left = 72, textWidth = 590;
  fitText(context, [{ text: "রাত জেগে খেলা · বিশ্বকাপ ১৯৯০–২০২৬", color: MUTED, weight: 600 }], left, layout.kicker, 28, textWidth);
  fitText(context, [{ text: card.name || "বিশ্বকাপের রাত", color: INK, weight: 700, display: true }], left, layout.name, 58, textWidth);
  fitText(context, [{ text: `${bn(card.total)}-এ `, color: INK, weight: 700, display: true }, { text: `${bn(card.count)} রাত`, color: GOLD, weight: 800, display: true }, { text: card.name ? " জেগেছে" : " জেগেছি", color: INK, weight: 700, display: true }], left, layout.head, 70, textWidth);
  context.font = `600 34px ${BODY_FONT}`;
  wrapText(context, card.line, textWidth, 2).forEach((line, at) => fitText(context, [{ text: line, color: "#d9d4ff", weight: 600 }], left, layout.line + at * 50, 34, textWidth));

  fitText(context, [{ text: `${bn(card.cups)} কাপ চা · ${bn(card.hours)} ঘণ্টা ঘুম গেল`, color: GOLD, weight: 700, display: true }, { text: "  (মজার হিসাব)", color: MUTED, weight: 500 }], left, layout.stats, 40, 936);

  // All twenty nights in two columns: the picked ones lit, the rest dim, so "২০-এ ১৩" is visible at a glance.
  const columnWidth = 452, gap = 32;
  nights.forEach((item, at) => {
    const column = at < 10 ? 0 : 1, row = at % 10;
    const x = left + column * (columnWidth + gap), y = layout.grid + row * layout.row;
    const lit = card.selected.has(item.id);
    if (lit) {
      context.fillStyle = "rgba(255,201,74,.12)";
      roundedRect(context, x - 8, y, columnWidth + 8, layout.row - 8, 12);
      context.fill();
    }
    context.fillStyle = lit ? GOLD : DIM;
    star(context, x + 20, y + layout.row / 2 - 4, 13);
    context.fill();
    const baseline = y + layout.row / 2 + 6;
    fitText(context, [{ text: `${bnYear(yearOf(item))}  `, color: lit ? GOLD : DIM, weight: 700 }, { text: scoreLine(item), color: lit ? INK : "#6d6a96", weight: lit ? 600 : 500 }], x + 46, baseline, 25, columnWidth - 54);
  });

  if (card.match) fitText(context, [{ text: card.match, color: GOLD, weight: 700, display: true }], left, layout.friend, 36, 936);
  drawFooterBand(context, format, "তুমি কয় রাত জেগেছ?", site, { band: "#07061a", ask: GOLD, site: "#ffffff" });
}

export const cardBlob = (card: CardContent, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, card, format, site));
