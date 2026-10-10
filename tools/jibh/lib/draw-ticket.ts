import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, wrapText, BODY_FONT, type CardFormat } from "../../../shared/card-canvas";
import { drawDish } from "./dish-art";
import { bnDigits, pairLine, passenger, placeOf, reasonLine, type Ticket } from "./jibh";

// The card: an old cardboard train ticket (generic, no railway's logo or layout) lying on a railway-green board.
// Stub with six punched holes on the left, the destination stamped big, the place's dishes drawn at the bottom.
// A friend's link prints their ticket under yours.
const W = 1080;
export const GREEN = "#1d4636";
export const CARD = "#f1dcab";
export const INK = "#2a2016";
export const RED = "#b8321f";
export const ACCENT = "#1f6b4a";
const CARD_EDGE = "#c9a866";
const LABEL = "#86704f";
const CREAM = "#fbf1d8";
const YELLOW = "#f4c542";

export type TicketCard = Ticket & { friend?: Ticket | null };

const TICKET_W = 900;
const heights = { full: 780, half: 520 } as const;
const rows = {
  full: { passLabel: 134, pass: 192, passSize: 54, destLabel: 252, dest: 362, destSize: 112, foodsLabel: 420, foods: 470, foodsSize: 36, foodsGap: 48 },
  half: { passLabel: 122, pass: 174, passSize: 48, destLabel: 216, dest: 306, destSize: 88, foodsLabel: 350, foods: 396, foodsSize: 32, foodsGap: 40 },
} as const;
type Variant = keyof typeof heights;

/** wrapText, but with the lines evened out so a two-line text never ends on a lone word. */
function balancedLines(context: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const lines = wrapText(context, text, maxWidth, maxLines);
  if (lines.length < 2 || lines[lines.length - 1].endsWith("…")) return lines;
  let low = maxWidth / 2, high = maxWidth;
  while (high - low > 4) {
    const mid = (low + high) / 2;
    const tried = wrapText(context, text, mid, maxLines);
    if (tried.length === lines.length && !tried[tried.length - 1].endsWith("…")) high = mid; else low = mid;
  }
  return wrapText(context, text, high, maxLines);
}

function drawBoard(context: CanvasRenderingContext2D, height: number) {
  context.fillStyle = GREEN;
  context.fillRect(0, 0, W, height);
  context.strokeStyle = "rgba(255,255,255,0.045)";
  context.lineWidth = 14;
  for (let x = -height; x < W; x += 56) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x + height, height); context.stroke(); }
}

function drawStamp(context: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  context.save();
  context.translate(cx, cy); context.rotate(-0.24);
  context.globalAlpha = 0.82;
  context.strokeStyle = RED;
  context.lineWidth = r * 0.07; context.beginPath(); context.arc(0, 0, r, 0, Math.PI * 2); context.stroke();
  context.lineWidth = r * 0.03; context.beginPath(); context.arc(0, 0, r * 0.82, 0, Math.PI * 2); context.stroke();
  fitText(context, [{ text: "যাত্রা", color: RED, weight: 800, display: true }], 0, -r * 0.04, r * 0.42, r * 1.4, "center");
  fitText(context, [{ text: "শুভ", color: RED, weight: 800, display: true }], 0, r * 0.44, r * 0.46, r * 1.4, "center");
  context.restore();
}

/** One ticket drawn in its own 900-wide box, so the caller can place, tilt and shrink it. */
function drawTicket(context: CanvasRenderingContext2D, ticket: Ticket, variant: Variant) {
  const place = placeOf(ticket.answers);
  const h = heights[variant], full = variant === "full";
  const stub = 170, left = stub + 40, right = TICKET_W - 40;
  context.save();
  context.shadowColor = "rgba(0,0,0,0.38)"; context.shadowBlur = 40; context.shadowOffsetY = 18;
  context.fillStyle = CARD; roundedRect(context, 0, 0, TICKET_W, h, 22); context.fill();
  context.restore();
  // Cardboard grain and a darker printed border.
  context.strokeStyle = CARD_EDGE; context.lineWidth = 3; roundedRect(context, 14, 14, TICKET_W - 28, h - 28, 14); context.stroke();
  context.fillStyle = "rgba(120,90,40,0.06)";
  for (let y = 24; y < h - 20; y += 9) context.fillRect(20, y, TICKET_W - 40, 2);
  // Perforation and the two notches where the stub tears off.
  context.setLineDash([4, 12]); context.strokeStyle = CARD_EDGE; context.lineWidth = 4;
  context.beginPath(); context.moveTo(stub, 30); context.lineTo(stub, h - 30); context.stroke();
  context.setLineDash([]);
  context.fillStyle = GREEN;
  for (const y of [0, h]) { context.beginPath(); context.arc(stub, y, 18, 0, Math.PI * 2); context.fill(); }

  // Stub: six punched holes, one per answer, and the train's name running up the side.
  const gap = (h - 160) / 5;
  for (let index = 0; index < 6; index++) {
    context.fillStyle = GREEN;
    context.beginPath(); context.arc(stub / 2 - 22, 80 + index * gap, 13, 0, Math.PI * 2); context.fill();
  }
  context.save();
  context.translate(stub / 2 + 26, h / 2); context.rotate(-Math.PI / 2);
  fitText(context, [{ text: "জিভ এক্সপ্রেস", color: RED, weight: 800, display: true }], 0, 14, full ? 46 : 38, h - 90, "center");
  context.restore();

  const number = `নং ${bnDigits(ticket.answers.join(""))}`;
  fitText(context, [{ text: "এক যাত্রার টিকিট", color: LABEL, weight: 700 }], left, 64, 28, 360);
  fitText(context, [{ text: number, color: RED, weight: 800 }], right, 64, 30, 280, "right");
  context.fillStyle = CARD_EDGE; context.fillRect(left, 88, right - left, 3);

  const y = rows[variant];
  fitText(context, [{ text: "যাত্রী", color: LABEL, weight: 600 }], left, y.passLabel, 26, 300);
  fitText(context, [{ text: passenger(ticket.name), color: INK, weight: 700, display: true }], left, y.pass, y.passSize, right - left);
  fitText(context, [{ text: "গন্তব্য", color: LABEL, weight: 600 }], left, y.destLabel, 26, 300);
  fitText(context, [{ text: place.name, color: ACCENT, weight: 800, display: true }], left, y.dest, y.destSize, right - left - (full ? 0 : 150));
  fitText(context, [{ text: "যেখানকার বলে পরিচিত", color: LABEL, weight: 600 }], left, y.foodsLabel, 26, 400);
  // The half ticket keeps clear of its stamp on the right.
  const foodsWidth = right - left - (full ? 0 : 170);
  context.font = `600 ${y.foodsSize}px ${BODY_FONT}`;
  balancedLines(context, place.foods, foodsWidth, 2).forEach((line, index) => fitText(context, [{ text: line, color: INK, weight: 600 }], left, y.foods + index * y.foodsGap, y.foodsSize, foodsWidth));

  if (full) place.art.forEach((art, index) => drawDish(context, art, left - 14 + index * 196, h - 268, 190));
  drawStamp(context, right - (full ? 120 : 90), h - (full ? 150 : 118), full ? 96 : 70);
  fitText(context, [{ text: `সূত্র: ${place.source}`, color: LABEL, weight: 500 }], left, h - 40, 23, right - left - (full ? 250 : 180));
}

function placeTicket(context: CanvasRenderingContext2D, ticket: Ticket, variant: Variant, cx: number, cy: number, angle: number, scale: number) {
  context.save();
  context.translate(cx, cy); context.rotate(angle); context.scale(scale, scale);
  context.translate(-TICKET_W / 2, -heights[variant] / 2);
  drawTicket(context, ticket, variant);
  context.restore();
}

const layouts = {
  feed: { kicker: 100, ticketY: 590, line: 1068, lineGap: 50, reason: 1196, mineY: 440, friendY: 912, pair: 1196 },
  story: { kicker: 340, ticketY: 850, line: 1352, lineGap: 56, reason: 1520, mineY: 700, friendY: 1210, pair: 1540 },
} as const;

export function drawTicketCard(canvas: HTMLCanvasElement, card: TicketCard, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  drawBoard(context, height);
  if (card.friend) {
    fitText(context, [{ text: "একই ট্রেনে?", color: YELLOW, weight: 800, display: true }], W / 2, layout.kicker, 58, 900, "center");
    placeTicket(context, card.friend, "half", W / 2 + 30, layout.friendY, 0.035, 0.78);
    placeTicket(context, card, "half", W / 2, layout.mineY, -0.02, 1);
    fitText(context, [{ text: pairLine(card, card.friend), color: CREAM, weight: 700, display: true }], W / 2, layout.pair, 40, 960, "center");
  } else {
    fitText(context, [{ text: "জিভের টিকিট কাটা হলো!", color: CREAM, weight: 800, display: true }], W / 2, layout.kicker, 56, 940, "center");
    placeTicket(context, card, "full", W / 2, layout.ticketY, -0.022, 1);
    const place = placeOf(card.answers);
    context.font = `500 38px ${BODY_FONT}`;
    balancedLines(context, place.line, 940, 2).forEach((line, index) => fitText(context, [{ text: line, color: CREAM, weight: 500 }], W / 2, layout.line + index * layout.lineGap, 38, 960, "center"));
    fitText(context, [{ text: reasonLine(card.answers), color: YELLOW, weight: 700 }], W / 2, layout.reason, 34, 960, "center");
  }
  drawFooterBand(context, format, "তোমার জিভ কোন জেলার?", site, { band: "#10291f", ask: YELLOW, site: CREAM });
}

export const ticketBlob = (card: TicketCard, format: CardFormat, site: string) => renderCard(canvas => drawTicketCard(canvas, card, format, site));
