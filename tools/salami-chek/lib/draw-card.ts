import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, type CardFormat } from "../../../shared/card-canvas";
import { amountFigures, amountWords, bn, chequeLine, giverLabel, possessive, type Cheque } from "./cheque";
import { khataCount, khataLabel, khataLine, khataTitle, khataTotal, type Khata } from "./khata";

const NIGHT = "#0c3a2b";
const ENVELOPE = "#16864c";
const ENVELOPE_DEEP = "#0d5f35";
const GOLD = "#f2c14e";
const PAPER = "#f6fbef";
const STUB = "#e2f2dc";
const INK = "#1d2b2a";
const MUTED = "#5f6f68";
const PEN = "#2340a8";
const STAMP = "#c4283a";
const TOY = "#ffdf8a";
// Fixed star positions (fractions of the card) so every card looks the same night sky.
const stars = [[.08, .05, 3], [.2, .14, 2], [.33, .04, 2.5], [.48, .11, 2], [.62, .03, 3], [.74, .17, 2], [.9, .26, 2.5], [.05, .3, 2], [.95, .07, 2], [.4, .22, 1.8], [.15, .52, 2], [.93, .55, 2.5], [.06, .8, 2], [.94, .84, 2]] as const;

function crescent(context: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string, cut: string) {
  context.fillStyle = color;
  context.beginPath(); context.arc(cx, cy, r, 0, Math.PI * 2); context.fill();
  context.fillStyle = cut;
  context.beginPath(); context.arc(cx + r * .38, cy - r * .22, r * .84, 0, Math.PI * 2); context.fill();
}

function star(context: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  context.fillStyle = color;
  context.beginPath();
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 ? r * .45 : r, angle = -Math.PI / 2 + i * Math.PI / 5;
    context.lineTo(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
  }
  context.closePath(); context.fill();
}

function dotted(context: CanvasRenderingContext2D, x1: number, x2: number, y: number) {
  context.strokeStyle = "#9db3a6"; context.lineWidth = 2.5; context.setLineDash([3, 7]);
  context.beginPath(); context.moveTo(x1, y); context.lineTo(x2, y); context.stroke();
  context.setLineDash([]);
}

/** The toy cheque, drawn in its own 1000×540 space, then placed, scaled and tilted. Deliberately no bank, no account numbers, no code line. */
function drawCheque(context: CanvasRenderingContext2D, cheque: Cheque, cx: number, cy: number, scale: number, tilt: number) {
  const W = 1000, H = 540, giver = giverLabel(cheque.giver);
  context.save();
  context.translate(cx, cy); context.rotate(tilt); context.scale(scale, scale); context.translate(-W / 2, -H / 2);
  context.shadowColor = "rgba(0,0,0,.35)"; context.shadowBlur = 36; context.shadowOffsetY = 14;
  roundedRect(context, 0, 0, W, H, 40); context.fillStyle = PAPER; context.fill();
  context.shadowColor = "transparent";
  context.save();
  roundedRect(context, 0, 0, W, H, 40); context.clip();
  for (let y = 40; y < H; y += 96) for (let x = 240 + (y % 192 ? 48 : 0); x < W; x += 96) crescent(context, x, y, 9, "#e3f0dc", PAPER);
  context.fillStyle = STUB; context.fillRect(0, 0, 196, H);
  context.restore();
  // The tear-off line of a cheque book, with little bites at top and bottom.
  context.strokeStyle = "#8fb59c"; context.lineWidth = 3; context.setLineDash([8, 9]);
  context.beginPath(); context.moveTo(196, 22); context.lineTo(196, H - 22); context.stroke(); context.setLineDash([]);
  roundedRect(context, 12, 12, W - 24, H - 24, 30); context.strokeStyle = GOLD; context.lineWidth = 4; context.stroke();
  crescent(context, 98, 128, 50, GOLD, STUB); star(context, 128, 104, 14, GOLD);
  fitText(context, [{ text: "ঈদ", color: ENVELOPE_DEEP, weight: 800, display: true }], 98, 290, 72, 150, "center");
  roundedRect(context, 34, 360, 128, 50, 25); context.fillStyle = TOY; context.fill();
  fitText(context, [{ text: "খেলনা", color: "#6b4300", weight: 700 }], 98, 395, 26, 110, "center");

  fitText(context, [{ text: "ঈদ সালামির চেক", color: ENVELOPE_DEEP, weight: 800, display: true }], 232, 96, 48, 470);
  fitText(context, [{ text: "তারিখ: ঈদের সকাল", color: MUTED, weight: 600 }], 958, 90, 24, 230, "right");
  fitText(context, [{ text: `প্রিয় ${giver},`, color: INK, weight: 700 }], 232, 176, 38, 480);
  fitText(context, [{ text: "সালামি পাবে:", color: MUTED, weight: 600 }], 232, 252, 28, 170);
  dotted(context, 410, 720, 262);
  if (cheque.name) fitText(context, [{ text: cheque.name, color: PEN, weight: 700 }], 418, 250, 42, 296);
  roundedRect(context, 748, 196, 212, 80, 18); context.fillStyle = "#ffffff"; context.fill(); context.strokeStyle = ENVELOPE; context.lineWidth = 3; context.stroke();
  fitText(context, [{ text: `৳ ${amountFigures(cheque.amount)}`, color: PEN, weight: 800 }], 854, 250, 42, 190, "center");
  fitText(context, [{ text: "কথায়:", color: MUTED, weight: 600 }], 232, 340, 28, 90);
  dotted(context, 322, 960, 350);
  fitText(context, [{ text: amountWords(cheque.amount), color: PEN, weight: 700 }], 330, 338, 36, 626);
  dotted(context, 630, 960, 450);
  fitText(context, [{ text: `${possessive(giver)} সই`, color: MUTED, weight: 600 }], 795, 488, 24, 320, "center");
  roundedRect(context, 232, 418, 350, 56, 28); context.fillStyle = TOY; context.fill();
  fitText(context, [{ text: "খেলনা চেক · শুধু মজার জন্য", color: "#6b4300", weight: 700 }], 407, 455, 25, 318, "center");
  if (cheque.ok) {
    context.strokeStyle = PEN; context.lineWidth = 4.5; context.lineCap = "round";
    context.beginPath(); context.moveTo(660, 438);
    context.bezierCurveTo(690, 372, 712, 470, 740, 414); context.bezierCurveTo(760, 380, 770, 452, 800, 418);
    context.bezierCurveTo(820, 396, 840, 446, 870, 412); context.quadraticCurveTo(900, 386, 930, 426); context.stroke();
    context.save();
    context.translate(800, 402); context.rotate(-.16); context.globalAlpha = .9;
    roundedRect(context, -160, -68, 320, 142, 22); context.strokeStyle = STAMP; context.lineWidth = 7; context.stroke();
    roundedRect(context, -148, -56, 296, 118, 14); context.lineWidth = 2.5; context.stroke();
    fitText(context, [{ text: "অনুমোদিত", color: STAMP, weight: 800, display: true }], 0, 0, 50, 270, "center");
    fitText(context, [{ text: `— ${giver}`, color: STAMP, weight: 700 }], 0, 44, 26, 260, "center");
    context.restore();
  }
  context.restore();
}

/** The green salami envelope: a back behind the cheque and a front pocket it is tucked into. */
function envelope(context: CanvasRenderingContext2D, top: number, mouth: number, bottom: number, part: "back" | "front") {
  const left = 100, right = 980, mid = 540;
  if (part === "back") { roundedRect(context, left, top, right - left, bottom - top, 26); context.fillStyle = ENVELOPE_DEEP; context.fill(); return; }
  context.beginPath();
  context.moveTo(left, mouth); context.quadraticCurveTo(mid, mouth + 110, right, mouth);
  context.lineTo(right, bottom - 26); context.quadraticCurveTo(right, bottom, right - 26, bottom);
  context.lineTo(left + 26, bottom); context.quadraticCurveTo(left, bottom, left, bottom - 26); context.closePath();
  context.fillStyle = ENVELOPE; context.fill();
  context.strokeStyle = GOLD; context.lineWidth = 3;
  context.beginPath();
  context.moveTo(left + 22, mouth + 26); context.quadraticCurveTo(mid, mouth + 134, right - 22, mouth + 26);
  context.lineTo(right - 22, bottom - 22); context.lineTo(left + 22, bottom - 22); context.closePath(); context.stroke();
  const textTop = mouth + (bottom - mouth) * .55;
  fitText(context, [{ text: "ঈদ সালামি", color: GOLD, weight: 800, display: true }], mid, textTop, 92, 700, "center");
  fitText(context, [{ text: "খেলনা চেক · শুধু মজার জন্য · টাকা যায় না", color: "#d8f0e0", weight: 600 }], mid, textTop + 66, 28, 760, "center");
  crescent(context, left + 70, bottom - 70, 20, GOLD, ENVELOPE); crescent(context, right - 70, bottom - 70, 20, GOLD, ENVELOPE);
}

export function cardTitle(cheque: Cheque) {
  if (cheque.ok) return `${giverLabel(cheque.giver)} সই করে দিয়েছে!`;
  return cheque.name ? `${possessive(cheque.name)} সালামির চেক` : "আমার সালামির চেক";
}

export function drawCard(canvas: HTMLCanvasElement, cheque: Cheque, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const story = format === "story";
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  context.fillStyle = NIGHT; context.fillRect(0, 0, width, height);
  for (const [x, y, r] of stars) star(context, x * width, y * height, r * 4, "#f2c14e99");

  if (story) {
    crescent(context, 540, 380, 84, GOLD, NIGHT); star(context, 600, 330, 22, GOLD);
    fitText(context, [{ text: "ঈদ মোবারক", color: GOLD, weight: 700 }], 540, 540, 38, 900, "center");
    fitText(context, [{ text: cardTitle(cheque), color: "#ffffff", weight: 800, display: true }], 540, 640, 82, 920, "center");
    fitText(context, [{ text: chequeLine(cheque), color: "#cfe8d8", weight: 600 }], 540, 712, 38, 920, "center");
    envelope(context, 920, 1190, 1590, "back");
    drawCheque(context, cheque, 540, 1010, .98, -.04);
    envelope(context, 920, 1190, 1590, "front");
  } else {
    crescent(context, 948, 128, 54, GOLD, NIGHT); star(context, 990, 96, 16, GOLD);
    fitText(context, [{ text: "ঈদ মোবারক", color: GOLD, weight: 700 }], 84, 116, 34, 700);
    fitText(context, [{ text: cardTitle(cheque), color: "#ffffff", weight: 800, display: true }], 84, 206, 74, 780);
    fitText(context, [{ text: chequeLine(cheque), color: "#cfe8d8", weight: 600 }], 84, 270, 36, 912);
    envelope(context, 560, 800, 1190, "back");
    drawCheque(context, cheque, 540, 588, .92, -.05);
    envelope(context, 560, 800, 1190, "front");
  }
  drawFooterBand(context, format, "তোমার সালামি কে দেবে?", site, { band: "#082a1f", ask: GOLD, site: "#ffffff" });
}

export const cardBlob = (cheque: Cheque, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, cheque, format, site));

/** The সালামি খাতা leaf, drawn in its own w×h space: a green cloth spine, ruled lines, a red margin. Past nine rows it splits into two columns so all eighteen relations fit. */
function drawLeaf(context: CanvasRenderingContext2D, khata: Khata, x: number, y: number, w: number, h: number, tilt: number) {
  const { rows } = khata, total = khataTotal(rows);
  const cols = rows.length > 9 ? 2 : 1, perCol = Math.ceil(rows.length / cols), colW = w / cols;
  const top = 104, bottom = h - 100 - (total ? 76 : 0);
  const slots = Math.max(perCol, 7), rowH = Math.min(84, (bottom - top) / slots), size = Math.min(44, rowH * .56);
  context.save();
  context.translate(x + w / 2, y + h / 2); context.rotate(tilt); context.translate(-w / 2, -h / 2);
  context.shadowColor = "rgba(0,0,0,.35)"; context.shadowBlur = 36; context.shadowOffsetY = 14;
  roundedRect(context, 0, 0, w, h, 28); context.fillStyle = PAPER; context.fill();
  context.shadowColor = "transparent";
  context.save();
  roundedRect(context, 0, 0, w, h, 28); context.clip();
  context.fillStyle = ENVELOPE; context.fillRect(0, 0, w, 88);
  context.strokeStyle = "#cfe0d3"; context.lineWidth = 2;
  for (let i = 1; i <= slots; i++) { context.beginPath(); context.moveTo(0, top + i * rowH); context.lineTo(w, top + i * rowH); context.stroke(); }
  context.strokeStyle = "#e59aa3"; context.lineWidth = 3;
  for (let c = 0; c < cols; c++) { context.beginPath(); context.moveTo(c * colW + 84, 88); context.lineTo(c * colW + 84, h); context.stroke(); }
  context.restore();
  fitText(context, [{ text: "এবার কে কে দিল", color: GOLD, weight: 800, display: true }], 40, 60, 44, w - 160);
  crescent(context, w - 64, 44, 24, GOLD, ENVELOPE); star(context, w - 46, 32, 8, GOLD);
  rows.forEach((row, i) => {
    const left = Math.floor(i / perCol) * colW, baseline = top + (i % perCol + 1) * rowH - rowH * .26;
    fitText(context, [{ text: `${bn(i + 1)}.`, color: MUTED, weight: 600 }], left + 66, baseline, size * .8, 56, "right");
    fitText(context, [{ text: khataLabel(row.giver), color: PEN, weight: 700 }], left + 104, baseline, size, colW - 140 - (row.amount ? colW * .4 : 40));
    if (row.amount) fitText(context, [{ text: `৳${amountFigures(row.amount)}`, color: PEN, weight: 800 }], left + colW - 30, baseline, size, colW * .4, "right");
    else crescent(context, left + colW - 46, baseline - size * .36, size * .34, ENVELOPE, PAPER);
  });
  if (total) {
    // A খাতা's যোগ line: small, under the rows, with the bookkeeper's double rule.
    const line = bottom + 54, text = `৳${amountFigures(total)}`;
    fitText(context, [{ text: "যোগ", color: MUTED, weight: 700 }], 104, line, 34, 120);
    fitText(context, [{ text, color: PEN, weight: 800 }], w - 30, line, 36, 360, "right");
    const width = context.measureText(text).width;
    context.strokeStyle = PEN; context.lineWidth = 2.5;
    for (const offset of [14, 21]) { context.beginPath(); context.moveTo(w - 30 - width, line + offset); context.lineTo(w - 30, line + offset); context.stroke(); }
  }
  fitText(context, [{ text: khataLine(khata), color: MUTED, weight: 600 }], w / 2, h - 42, 32, w - 80, "center");
  context.restore();
}

export function drawKhataCard(canvas: HTMLCanvasElement, khata: Khata, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const story = format === "story";
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  context.fillStyle = NIGHT; context.fillRect(0, 0, width, height);
  for (const [x, y, r] of stars) star(context, x * width, y * height, r * 4, "#f2c14e99");
  const title = khataTitle(khata.name), count = khataCount(khata.rows);
  if (story) {
    crescent(context, 540, 360, 74, GOLD, NIGHT); star(context, 594, 316, 20, GOLD);
    fitText(context, [{ text: "ঈদ মোবারক", color: GOLD, weight: 700 }], 540, 500, 38, 900, "center");
    fitText(context, [{ text: title, color: "#ffffff", weight: 800, display: true }], 540, 594, 82, 920, "center");
    fitText(context, [{ text: count, color: "#cfe8d8", weight: 600 }], 540, 664, 40, 920, "center");
    drawLeaf(context, khata, 100, 730, 880, 880, -.02);
  } else {
    crescent(context, 948, 128, 54, GOLD, NIGHT); star(context, 990, 96, 16, GOLD);
    fitText(context, [{ text: "ঈদ মোবারক", color: GOLD, weight: 700 }], 84, 116, 34, 700);
    fitText(context, [{ text: title, color: "#ffffff", weight: 800, display: true }], 84, 206, 74, 780);
    fitText(context, [{ text: count, color: "#cfe8d8", weight: 600 }], 84, 270, 36, 912);
    drawLeaf(context, khata, 100, 326, 880, 890, -.018);
  }
  drawFooterBand(context, format, "এবার তোমাকে কে কে দিল?", site, { band: "#082a1f", ask: GOLD, site: "#ffffff" });
}

export const khataBlob = (khata: Khata, format: CardFormat, site: string) => renderCard(canvas => drawKhataCard(canvas, khata, format, site));
