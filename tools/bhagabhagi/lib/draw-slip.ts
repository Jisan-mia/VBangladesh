import { BODY_FONT, DISPLAY_FONT, cardSizes, drawFooterBand, fitText, renderCard, roundedRect, type CardFormat } from "../../../shared/card-canvas";
import { formatTaka, ledgerLine, perPerson, type calculateLedger } from "./ledger";

type Result = ReturnType<typeof calculateLedger>;
const INK = "#1d2b53";
const TEAL = "#1f5a52";
const MUTED = "#6c7a76";
const STAMP = "#c8452f";
export const SLIP_ASK = "তোমাদের হিসাবটা মিলেছে তো?";
const bn = (value: number) => new Intl.NumberFormat("bn-BD").format(value);

const layouts = {
  feed: { top: 52, head: 28, trip: 80, label: 26, big: 56, heading: 32, name: 36, amount: 42, row: 80, line: 36 },
  story: { top: 270, head: 30, trip: 92, label: 28, big: 64, heading: 36, name: 42, amount: 48, row: 104, line: 40 },
} as const;

/** A receipt torn from a hisab pad: zigzag top and bottom edges. */
function slipPath(context: CanvasRenderingContext2D, x0: number, x1: number, top: number, bottom: number) {
  const tooth = (x1 - x0) / (2 * Math.round((x1 - x0) / 32));
  context.beginPath();
  context.moveTo(x0, top + tooth);
  for (let x = x0; x < x1 - 1; x += tooth * 2) { context.lineTo(x + tooth, top); context.lineTo(x + tooth * 2, top + tooth); }
  context.lineTo(x1, bottom - tooth);
  for (let x = x1; x > x0 + 1; x -= tooth * 2) { context.lineTo(x - tooth, bottom); context.lineTo(x - tooth * 2, bottom - tooth); }
  context.closePath();
}

function drawArrow(context: CanvasRenderingContext2D, x: number, y: number, length: number) {
  context.strokeStyle = STAMP;
  context.lineWidth = 5;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();
  context.moveTo(x, y); context.lineTo(x + length, y);
  context.moveTo(x + length - 14, y - 12); context.lineTo(x + length, y); context.lineTo(x + length - 14, y + 12);
  context.stroke();
}

function drawStamp(context: CanvasRenderingContext2D, text: string, cx: number, cy: number) {
  context.save();
  context.translate(cx, cy);
  context.rotate(-0.16);
  context.globalAlpha = 0.85;
  context.strokeStyle = STAMP;
  context.lineWidth = 5;
  roundedRect(context, -120, -42, 240, 76, 38);
  context.stroke();
  fitText(context, [{ text, color: STAMP, weight: 800, display: true }], 0, 10, 36, 200, "center");
  context.restore();
}

export function drawCard(canvas: HTMLCanvasElement, result: Result, format: CardFormat, site: string) {
  const { width: w, height: h } = cardSizes[format];
  const L = layouts[format];
  canvas.width = w;
  canvas.height = h;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const { ledger, total, transfers } = result;
  const count = ledger.people.length;

  context.fillStyle = "#24524c";
  context.fillRect(0, 0, w, h);
  context.strokeStyle = "rgba(255,255,255,0.05)";
  context.lineWidth = 14;
  for (let x = -h; x < w; x += 56) { context.beginPath(); context.moveTo(x, h); context.lineTo(x + h, 0); context.stroke(); }

  // The slip is as long as its content, centred in the space above the footer.
  const rows = Math.max(1, transfers.length);
  const x0 = 84, x1 = w - 84, left = x0 + 56, right = x1 - 56;
  const footerTop = drawFooterBand(context, format, SLIP_ASK, site, { band: "#173b37", ask: "#ffd166", site: "#ffffff" });
  const slipHeight = 64 + L.head + 30 + L.trip * 1.15 + 40 + L.label + 14 + L.big + 46 + L.heading * 1.5 + rows * L.row + 44 + L.line * 2.2 + 56;
  const top = Math.max(L.top, L.top + (footerTop - 36 - L.top - slipHeight) / 2);
  const bottom = top + slipHeight;

  context.save();
  context.translate(0, 12);
  context.fillStyle = "rgba(0,0,0,0.22)";
  slipPath(context, x0, x1, top, bottom);
  context.fill();
  context.restore();
  context.fillStyle = "#fffcf3";
  slipPath(context, x0, x1, top, bottom);
  context.fill();

  let y = top + 64 + L.head;
  fitText(context, [{ text: "হিসাবের স্লিপ", color: MUTED, weight: 600 }], left, y, L.head, 400);
  y += 30 + L.trip * 1.15;
  fitText(context, [{ text: ledger.trip || "আমাদের হিসাব", color: INK, weight: 800, display: true }], left, y, L.trip, right - left - 250);
  drawStamp(context, transfers.length ? "হিসাব মিলেছে" : "সব শোধ", right - 120, y - L.trip * 0.4);

  y += 40 + L.label;
  const half = left + (right - left) / 2 + 10;
  fitText(context, [{ text: "মোট খরচ", color: MUTED, weight: 600 }], left, y, L.label, 360);
  fitText(context, [{ text: `${bn(count)} জন · জনপ্রতি`, color: MUTED, weight: 600 }], half, y, L.label, right - half);
  y += 14 + L.big;
  fitText(context, [{ text: formatTaka(total), color: INK, weight: 800, display: true }], left, y, L.big, half - left - 24);
  fitText(context, [{ text: perPerson(total, count, formatTaka), color: TEAL, weight: 800, display: true }], half, y, L.big, right - half);

  y += 46;
  context.strokeStyle = "#b9c3bf";
  context.lineWidth = 3;
  context.setLineDash([12, 10]);
  context.beginPath(); context.moveTo(left, y - 20); context.lineTo(right, y - 20); context.stroke();
  context.setLineDash([]);
  y += L.heading * 1.5;
  fitText(context, [{ text: "কে কাকে দেবে", color: TEAL, weight: 700, display: true }], left, y, L.heading, 500);

  if (!transfers.length) {
    fitText(context, [{ text: "কারও কাছে কারও পাওনা নেই", color: INK, weight: 700 }], left, y + L.row * 0.72, L.name, right - left);
  }
  transfers.forEach((transfer, index) => {
    const rowY = y + (index + 1) * L.row - L.row * 0.28;
    context.font = `800 ${L.amount}px ${DISPLAY_FONT}`;
    const amount = formatTaka(transfer.amount);
    const amountWidth = Math.min(context.measureText(amount).width, 300);
    const nameRoom = (right - left - amountWidth - 40 - 92) / 2;
    context.font = `700 ${L.name}px ${BODY_FONT}`;
    const fromWidth = Math.min(context.measureText(transfer.from.name).width, nameRoom);
    fitText(context, [{ text: transfer.from.name, color: INK, weight: 700 }], left, rowY, L.name, nameRoom);
    drawArrow(context, left + fromWidth + 18, rowY - L.name * 0.32, 56);
    fitText(context, [{ text: transfer.to.name, color: INK, weight: 700 }], left + fromWidth + 92, rowY, L.name, nameRoom);
    fitText(context, [{ text: amount, color: TEAL, weight: 800, display: true }], right, rowY, L.amount, 300, "right");
    if (index < transfers.length - 1) {
      context.strokeStyle = "#e3e7e2";
      context.lineWidth = 2;
      context.beginPath(); context.moveTo(left, rowY + L.row * 0.36); context.lineTo(right, rowY + L.row * 0.36); context.stroke();
    }
  });
  y += rows * L.row + 44;
  fitText(context, [{ text: `${bn(ledger.expenses.length)}টা খরচের পুরো হিসাব লিংকে`, color: MUTED, weight: 500 }], left, y, L.label - 2, right - left);
  y += L.line * 2.2;
  fitText(context, [{ text: ledgerLine(result), color: TEAL, weight: 700, display: true }], (left + right) / 2, y, L.line, right - left, "center");

}

export const cardBlob = (result: Result, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, result, format, site));
