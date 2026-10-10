import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, type CardFormat } from "../../../shared/card-canvas";
import { tariffInfo } from "./tariff";
import { applianceOf, bn, possessive, taka, wheelDigits, type Home, type Reading } from "./meter";

// The card: an old disc meter on its wooden board, and the month's bill slip pinned below it.
const INK = "#22201c";
const MUTED = "#6d665b";
const RED = "#b8322a";
const BAKELITE = "#1f1c19";
const FACE = "#f3eddf";
const PAPER = "#fffdf7";
const WALL = "#d7dde0";

const layouts = {
  feed: { board: 36, slip: 694, slipEnd: 1236, bars: 3, rowGap: 50, pad: 0 },
  story: { board: 286, slip: 958, slipEnd: 1626, bars: 4, rowGap: 56, pad: 14 },
} as const;

/** Same grain every time: a tiny seeded random, so the card never shimmers between redraws. */
function grain(seed: number) {
  let value = seed;
  return () => { value = (value * 16807) % 2147483647; return value / 2147483647; };
}

function drawBoard(context: CanvasRenderingContext2D, top: number) {
  const x = 150, width = 780, height = 628;
  // the service cables come down the wall into the board
  context.strokeStyle = "#2a2622"; context.lineWidth = 14; context.lineCap = "round";
  for (const cx of [470, 610]) { context.beginPath(); context.moveTo(cx + (cx < 540 ? -40 : 40), -20); context.quadraticCurveTo(cx, top * 0.4, cx, top + 20); context.stroke(); }
  context.save();
  context.shadowColor = "#00000040"; context.shadowBlur = 30; context.shadowOffsetY = 14;
  roundedRect(context, x, top, width, height, 26);
  context.fillStyle = "#8a5531";
  context.fill();
  context.restore();
  context.save();
  roundedRect(context, x, top, width, height, 26);
  context.clip();
  const random = grain(7);
  for (let i = 0; i < 46; i++) {
    const y = top + (i / 46) * height + random() * 8;
    context.strokeStyle = random() > 0.5 ? "#6f4224aa" : "#a46a3f88";
    context.lineWidth = 1 + random() * 2.5;
    context.beginPath();
    context.moveTo(x, y);
    context.bezierCurveTo(x + width * 0.3, y + (random() - 0.5) * 18, x + width * 0.7, y + (random() - 0.5) * 18, x + width, y + (random() - 0.5) * 10);
    context.stroke();
  }
  context.restore();
  // four brass screws hold the board to the wall
  for (const [sx, sy] of [[x + 34, top + 34], [x + width - 34, top + 34], [x + 34, top + height - 34], [x + width - 34, top + height - 34]]) screw(context, sx, sy, 11);
}

function screw(context: CanvasRenderingContext2D, x: number, y: number, r: number) {
  context.fillStyle = "#c9a24a"; context.beginPath(); context.arc(x, y, r, 0, Math.PI * 2); context.fill();
  context.strokeStyle = "#7b5c1c"; context.lineWidth = 3; context.beginPath(); context.moveTo(x - r * 0.6, y - r * 0.6); context.lineTo(x + r * 0.6, y + r * 0.6); context.stroke();
}

function drawMeter(context: CanvasRenderingContext2D, top: number, units: number) {
  const cx = 540, cy = top + 296;
  // bakelite body
  context.save();
  context.shadowColor = "#0000005c"; context.shadowBlur = 24; context.shadowOffsetY = 10;
  roundedRect(context, 262, top + 34, 556, 548, 70);
  context.fillStyle = BAKELITE; context.fill();
  context.restore();
  const sheen = context.createLinearGradient(262, top + 34, 818, top + 582);
  sheen.addColorStop(0, "#ffffff1f"); sheen.addColorStop(0.45, "#ffffff00");
  roundedRect(context, 262, top + 34, 556, 548, 70); context.fillStyle = sheen; context.fill();
  // round window
  context.fillStyle = "#0d0c0a"; context.beginPath(); context.arc(cx, cy, 236, 0, Math.PI * 2); context.fill();
  context.fillStyle = FACE; context.beginPath(); context.arc(cx, cy, 222, 0, Math.PI * 2); context.fill();
  fitText(context, [{ text: "এ মাসে প্রায়", color: MUTED, weight: 600 }], cx, cy - 104, 30, 300, "center");
  // number wheels: four black, the last one red, like the old register
  const digits = wheelDigits(units), wheelW = 70, gap = 8, wheelH = 104;
  const left = cx - (digits.length * wheelW + (digits.length - 1) * gap) / 2, wheelTop = cy - 82;
  roundedRect(context, left - 14, wheelTop - 12, digits.length * (wheelW + gap) - gap + 28, wheelH + 24, 12);
  context.fillStyle = "#2a2622"; context.fill();
  [...digits].forEach((digit, index) => {
    const x = left + index * (wheelW + gap);
    const shade = context.createLinearGradient(0, wheelTop, 0, wheelTop + wheelH);
    const base = index === digits.length - 1 ? RED : "#141210";
    shade.addColorStop(0, "#00000099"); shade.addColorStop(0.22, base); shade.addColorStop(0.78, base); shade.addColorStop(1, "#00000099");
    context.fillStyle = shade;
    context.fillRect(x, wheelTop, wheelW, wheelH);
    fitText(context, [{ text: bn(Number(digit)), color: "#ffffff", weight: 700, display: true }], x + wheelW / 2, wheelTop + 78, 74, wheelW - 6, "center");
  });
  fitText(context, [{ text: "ইউনিট (কিলোওয়াট-ঘণ্টা)", color: INK, weight: 700 }], cx, cy + 74, 28, 360, "center");
  // the disc, seen edge-on through its slot, with the red mark
  const slotX = cx - 150, slotY = cy + 100;
  roundedRect(context, slotX, slotY, 300, 34, 8); context.fillStyle = "#2a2622"; context.fill();
  const disc = context.createLinearGradient(0, slotY + 6, 0, slotY + 28);
  disc.addColorStop(0, "#8d9198"); disc.addColorStop(0.5, "#e6e8eb"); disc.addColorStop(1, "#8d9198");
  context.fillStyle = disc; context.fillRect(slotX + 8, slotY + 8, 284, 18);
  context.fillStyle = RED; context.fillRect(slotX + 178, slotY + 8, 26, 18);
  fitText(context, [{ text: "১ ফেজ · ২২০ ভোল্ট · ৫০ হার্টজ", color: MUTED, weight: 500 }], cx, cy + 162, 22, 250, "center");
  // glass glint
  context.strokeStyle = "#ffffff66"; context.lineWidth = 10; context.lineCap = "round";
  context.beginPath(); context.arc(cx, cy, 200, Math.PI * 1.08, Math.PI * 1.32); context.stroke();
  // the lead seal on its wire, hanging from the cover screws
  const sealY = top + 618;
  context.strokeStyle = "#9aa0a6"; context.lineWidth = 3;
  context.beginPath(); context.moveTo(cx - 70, top + 566); context.quadraticCurveTo(cx - 30, sealY - 6, cx, sealY); context.quadraticCurveTo(cx + 30, sealY - 6, cx + 70, top + 566); context.stroke();
  screw(context, cx - 70, top + 562, 9); screw(context, cx + 70, top + 562, 9);
  context.fillStyle = "#8b9095"; context.beginPath(); context.arc(cx, sealY + 4, 15, 0, Math.PI * 2); context.fill();
  context.strokeStyle = "#5c6166"; context.lineWidth = 2; context.beginPath(); context.arc(cx, sealY + 4, 9, 0, Math.PI * 2); context.stroke();
}

function drawSlip(context: CanvasRenderingContext2D, top: number, bottom: number) {
  const x = 60, width = 960, tooth = 16;
  context.save();
  context.shadowColor = "#0000002e"; context.shadowBlur = 18; context.shadowOffsetY = 8;
  context.beginPath();
  context.moveTo(x, top + tooth);
  for (let px = x; px < x + width; px += tooth * 2) { context.lineTo(px + tooth, top); context.lineTo(px + tooth * 2, top + tooth); }
  context.lineTo(x + width, bottom); context.lineTo(x, bottom); context.closePath();
  context.fillStyle = PAPER; context.fill();
  context.restore();
  context.strokeStyle = "#e7dfcf"; context.lineWidth = 2; context.setLineDash([10, 10]);
  context.beginPath(); context.moveTo(x + 40, top + 76); context.lineTo(x + width - 40, top + 76); context.stroke();
  context.setLineDash([]);
}

export function drawCard(canvas: HTMLCanvasElement, home: Home, reading: Reading, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  context.fillStyle = WALL;
  context.fillRect(0, 0, width, height);
  drawBoard(context, layout.board);
  drawMeter(context, layout.board, reading.units);
  drawSlip(context, layout.slip, layout.slipEnd);

  const left = 112, right = 968, pad = layout.pad;
  let y = layout.slip + 58;
  fitText(context, [{ text: `${home.name ? possessive(home.name) : "আমাদের"} বাসার বিল`, color: INK, weight: 700 }, { text: " · আনুমানিক", color: MUTED, weight: 500 }], left, y, 28, right - left);
  y += 96 + pad;
  const top = reading.shares[0];
  const name = top ? applianceOf(top.use.id).name : "";
  fitText(context, top
    ? [{ text: "এ মাসে ", color: INK, weight: 700, display: true }, { text: name, color: RED, weight: 800, display: true }, { text: " খেল ", color: INK, weight: 700, display: true }, { text: `${bn(top.percent)}%`, color: RED, weight: 800, display: true }]
    : [{ text: reading.headline, color: INK, weight: 700, display: true }], left, y, 76, right - left);
  y += 68 + pad;
  fitText(context, [{ text: `প্রায় ${bn(reading.units)} ইউনিট · `, color: INK, weight: 600 }, { text: `প্রায় ${taka(reading.bill.total)} টাকা`, color: INK, weight: 800 }], left, y, 46, right - left);
  y += 30 + pad;
  const barLeft = 420, barRight = 880;
  for (const share of reading.shares.slice(0, layout.bars)) {
    y += layout.rowGap;
    const item = applianceOf(share.use.id);
    const label = share.use.count > 1 ? `${item.name} ×${bn(share.use.count)}` : item.name;
    fitText(context, [{ text: label, color: INK, weight: 600 }], left, y, 32, barLeft - left - 20);
    roundedRect(context, barLeft, y - 26, barRight - barLeft, 26, 13); context.fillStyle = "#ece5d6"; context.fill();
    roundedRect(context, barLeft, y - 26, Math.max(26, ((barRight - barLeft) * share.percent) / 100), 26, 13);
    context.fillStyle = share === top ? RED : "#4a443d"; context.fill();
    fitText(context, [{ text: `${bn(share.percent)}%`, color: INK, weight: 700 }], right, y, 30, 80, "right");
  }
  y += 62 + pad;
  fitText(context, [{ text: reading.line, color: INK, weight: 700, display: true }], left, y, 38, right - left);
  fitText(context, [{ text: `আনুমানিক — তোমার মিটারের বিলই আসল · ${tariffInfo.short}`, color: MUTED, weight: 500 }], left, layout.slipEnd - 30, 22, right - left);
  drawFooterBand(context, format, "তোমার বাসায় কোন যন্ত্র সবচেয়ে বেশি খায়?", site, { band: BAKELITE, ask: "#ffd166", site: "#ffffff" });
}

export const cardBlob = (home: Home, reading: Reading, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, home, reading, format, site));
