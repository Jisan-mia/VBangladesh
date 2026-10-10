import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, type CardFormat } from "../../../shared/card-canvas";
import { bn, humanLine, isRight, MULTIPLIERS, outOf, proudLine, scoreOf, starWord, tableName, type Shared } from "./namta";

const SLATE = "#26332e";
const CHALK = "#f3f1e7";
const CHALK_SOFT = "#b9c4bd";
const CHALK_YELLOW = "#f7d96b";
const WOOD_DARK = "#4a2a14";

// Same speckle every time the card is drawn, so a shared image matches the preview.
function seeded(seed: number) {
  return () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
}

function drawWood(context: CanvasRenderingContext2D, width: number, height: number) {
  const wood = context.createLinearGradient(0, 0, width, height);
  wood.addColorStop(0, "#c58a4c"); wood.addColorStop(0.5, "#a86a33"); wood.addColorStop(1, "#8c5426");
  context.fillStyle = wood;
  context.fillRect(0, 0, width, height);
  const random = seeded(7);
  context.strokeStyle = "rgba(74,42,20,.22)";
  for (let line = 0; line < 46; line++) {
    const y = random() * height, wave = 6 + random() * 14;
    context.lineWidth = 1 + random() * 2.5;
    context.beginPath(); context.moveTo(0, y);
    for (let x = 0; x <= width; x += 90) context.lineTo(x, y + Math.sin(x / 160 + line) * wave);
    context.stroke();
  }
}

function drawSlate(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  roundedRect(context, x, y, width, height, 22);
  context.fillStyle = SLATE;
  context.fill();
  // Old chalk that a wet cloth never quite got off.
  const random = seeded(19);
  for (let smudge = 0; smudge < 9; smudge++) {
    const cx = x + random() * width, cy = y + random() * height, radius = 120 + random() * 220;
    const haze = context.createRadialGradient(cx, cy, 10, cx, cy, radius);
    haze.addColorStop(0, "rgba(255,255,255,.07)"); haze.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = haze;
    context.fillRect(x, y, width, height);
  }
  context.save();
  roundedRect(context, x, y, width, height, 22);
  context.clip();
  context.strokeStyle = "rgba(0,0,0,.45)";
  context.lineWidth = 16;
  context.stroke();
  context.restore();
}

/** Eats tiny holes out of everything chalk inside the slate, so the type reads as chalk rather than print. */
function chalkGrain(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  const random = seeded(31);
  context.fillStyle = "rgba(38,51,46,.6)";
  const dots = Math.round(width * height / 260);
  for (let dot = 0; dot < dots; dot++) context.fillRect(x + random() * width, y + random() * height, 2 + random() * 2, 2 + random() * 2);
}

function chalkLine(context: CanvasRenderingContext2D, from: number, to: number, y: number) {
  context.strokeStyle = "rgba(243,241,231,.55)";
  context.lineWidth = 4;
  context.lineCap = "round";
  context.beginPath(); context.moveTo(from, y);
  for (let x = from; x <= to; x += 40) context.lineTo(x, y + Math.sin(x / 37) * 3);
  context.stroke();
}

function tick(context: CanvasRenderingContext2D, x: number, y: number) {
  context.strokeStyle = CHALK;
  context.lineWidth = 6;
  context.lineCap = "round"; context.lineJoin = "round";
  context.beginPath(); context.moveTo(x, y - 14); context.lineTo(x + 11, y - 2); context.lineTo(x + 32, y - 30); context.stroke();
}

/** The teacher's gold star sticker, slightly crooked. */
function drawStar(context: CanvasRenderingContext2D, cx: number, cy: number, radius: number, word: string) {
  context.save();
  context.translate(cx, cy);
  context.rotate(-0.16);
  context.beginPath();
  for (let point = 0; point < 10; point++) {
    const angle = -Math.PI / 2 + point * Math.PI / 5, r = point % 2 ? radius * 0.5 : radius;
    context.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
  }
  context.closePath();
  context.shadowColor = "rgba(0,0,0,.45)"; context.shadowBlur = 18; context.shadowOffsetY = 8;
  const gold = context.createRadialGradient(-radius * 0.3, -radius * 0.35, 6, 0, 0, radius);
  gold.addColorStop(0, "#fff1b8"); gold.addColorStop(0.45, "#f5c23b"); gold.addColorStop(1, "#c98b12");
  context.fillStyle = gold;
  context.fill();
  context.shadowColor = "transparent";
  context.strokeStyle = "#9c6a0a"; context.lineWidth = 5; context.lineJoin = "round";
  context.stroke();
  fitText(context, [{ text: word, color: "#5a3300", weight: 800, display: true }], 0, radius * 0.16, radius * 0.34, radius * 0.95, "center");
  context.restore();
}

/** A wooden-framed slate with the whole table written out in chalk: right ones ticked, the rest shown with the right answer in yellow. */
export function drawCard(canvas: HTMLCanvasElement, shared: Shared, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const story = format === "story";
  // Feed positions; the story stretches them into its taller safe area (text from 326 to ~1590, clear of storySafe).
  const y = (feedY: number) => story ? 300 + (feedY - 110) * 1.2 : feedY;
  const score = scoreOf(shared);
  const left = 110, slate = { x: 52, y: 52, width: width - 104, height: (story ? 1660 : 1254) - 40 - 52 };

  drawWood(context, width, height);
  drawSlate(context, slate.x, slate.y, slate.width, slate.height);

  fitText(context, [{ text: "নামতা চ্যালেঞ্জ · স্লেটের সার্টিফিকেট", color: CHALK_SOFT, weight: 600 }], left, y(134), 30, 600);
  fitText(context, [{ text: shared.n ? `${shared.n} · ${tableName(shared.t)}` : tableName(shared.t), color: CHALK, weight: 700, display: true }], left, y(226), 68, 620);
  fitText(context, [{ text: outOf(score), color: CHALK_YELLOW, weight: 800, display: true }], left - 4, y(392), 150, 600);
  if (shared.s) fitText(context, [{ text: `${bn(shared.s)} সেকেন্ডে`, color: CHALK_SOFT, weight: 600 }], left, y(450), 34, 400);
  chalkLine(context, left, width - left, y(496));

  // Written in the order a table is read aloud, ×১ to ×১০, whatever order the sums were asked in.
  MULTIPLIERS.forEach((m, index) => {
    const answer = shared.a[shared.q.indexOf(m)];
    const right = isRight(shared.t, m, answer);
    const x = index < 5 ? left + 20 : width / 2 + 40;
    const rowY = y(590 + (index % 5) * 84);
    fitText(context, [{ text: `${bn(shared.t)} × ${bn(m)} = `, color: right ? CHALK : CHALK_SOFT, weight: 600 }, { text: bn(shared.t * m), color: right ? CHALK : CHALK_YELLOW, weight: 800, display: true }], x, rowY, 52, 330);
    // Ticks line up in one column, the way a teacher marks a khata.
    if (right) tick(context, x + 348, rowY);
  });

  chalkLine(context, left, width / 2, y(1000));
  fitText(context, [{ text: proudLine(score, shared.w), color: CHALK, weight: 800, display: true }], left, y(1084), 64, width - left * 2);
  fitText(context, [{ text: humanLine(score, shared.t), color: CHALK_SOFT, weight: 600 }], left, y(1150), 34, width - left * 2);
  chalkGrain(context, slate.x, slate.y, slate.width, slate.height);

  drawStar(context, width - 222, y(300), story ? 150 : 132, starWord(score));
  drawFooterBand(context, format, shared.w === "ami" ? "তুমি কোন নামতা পারো?" : "তোমার বাচ্চা কোন নামতা পারে?", site, { band: WOOD_DARK, ask: CHALK_YELLOW, site: "#ffffff" });
}

export const cardBlob = (shared: Shared, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, shared, format, site));
