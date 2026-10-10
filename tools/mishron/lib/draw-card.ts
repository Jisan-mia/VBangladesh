import { cardSizes, DISPLAY_FONT, drawFooterBand, fitText, renderCard, wrapText, type CardFormat } from "../../../shared/card-canvas";
import { bn, humanLine, madeCount, MAKEABLE, nameOf, showcase, type Shared } from "./game";
import { kindColor } from "./recipes";

// নানির রান্নাঘর: a mud-plastered wall, an earthen floor, a painted clay pot on a mud stove, and the latest find rising in its steam.
export const WALL = "#f4e4cf";
const FLOOR = "#e2c39c";
export const SOOT = "#2b1d16";
const MUTED = "#76604f";
export const CLAY = "#a8461f";
export const TURMERIC = "#f2b33d";

const layouts = {
  feed: { kicker: 76, name: 172, nameSize: 78, count: 252, countSize: 58, bar: 284, cloud: 420, pot: 682, potWidth: 320, chips: 920, line: 1160 },
  story: { kicker: 310, name: 424, nameSize: 88, count: 516, countSize: 64, bar: 552, cloud: 724, pot: 1012, potWidth: 380, chips: 1316, line: 1566 },
} as const;

/** A round-bellied হাঁড়ি on a মাটির চুলা, with a শখের হাঁড়ি-style painted band. cx/cy is the belly's centre. */
export function drawPot(context: CanvasRenderingContext2D, cx: number, cy: number, w: number) {
  const h = w * 0.78;
  const neckY = cy - h * 0.42, rim = w * 0.29;
  // Stove: a mud horseshoe with the fire showing through its mouth.
  context.fillStyle = "#b78358";
  context.beginPath();
  context.roundRect(cx - w * 0.62, cy + h * 0.18, w * 1.24, h * 0.5, [w * 0.08, w * 0.08, 10, 10]);
  context.fill();
  const fire = context.createRadialGradient(cx, cy + h * 0.6, 4, cx, cy + h * 0.55, w * 0.3);
  fire.addColorStop(0, "#fff1a8"); fire.addColorStop(0.45, "#f7a12a"); fire.addColorStop(1, "#c2410c");
  context.fillStyle = fire;
  context.beginPath();
  context.ellipse(cx, cy + h * 0.62, w * 0.24, h * 0.16, 0, Math.PI, 0);
  context.fill();
  // Pot body.
  const body = context.createRadialGradient(cx - w * 0.16, cy - h * 0.12, w * 0.05, cx, cy, w * 0.62);
  body.addColorStop(0, "#d97a49"); body.addColorStop(0.6, "#b0502a"); body.addColorStop(1, "#7a2f14");
  context.fillStyle = body;
  context.beginPath();
  context.moveTo(cx - rim * 0.86, neckY);
  context.bezierCurveTo(cx - w * 0.64, neckY + h * 0.16, cx - w * 0.62, cy + h * 0.44, cx, cy + h * 0.5);
  context.bezierCurveTo(cx + w * 0.62, cy + h * 0.44, cx + w * 0.64, neckY + h * 0.16, cx + rim * 0.86, neckY);
  context.closePath();
  context.fill();
  // Painted band: a white wave between two turmeric lines, with dots.
  context.save();
  context.clip();
  context.strokeStyle = TURMERIC; context.lineWidth = w * 0.022;
  for (const y of [cy - h * 0.1, cy + h * 0.12]) { context.beginPath(); context.moveTo(cx - w, y); context.lineTo(cx + w, y); context.stroke(); }
  context.strokeStyle = "#fff6e6"; context.lineWidth = w * 0.016;
  context.beginPath();
  for (let step = 0; step <= 40; step++) { const x = cx - w * 0.7 + (w * 1.4 * step) / 40, y = cy + Math.sin(step * 0.9) * h * 0.05; if (step) context.lineTo(x, y); else context.moveTo(x, y); }
  context.stroke();
  context.fillStyle = "#fff6e6";
  for (let step = 0; step < 9; step++) { context.beginPath(); context.arc(cx - w * 0.48 + step * w * 0.12, cy + h * 0.24, w * 0.012, 0, Math.PI * 2); context.fill(); }
  context.restore();
  // Rim and the dark mouth.
  context.fillStyle = "#7a2f14";
  context.beginPath(); context.ellipse(cx, neckY, rim, h * 0.075, 0, 0, Math.PI * 2); context.fill();
  context.fillStyle = "#3a1608";
  context.beginPath(); context.ellipse(cx, neckY + 2, rim * 0.78, h * 0.05, 0, 0, Math.PI * 2); context.fill();
}

function drawSteam(context: CanvasRenderingContext2D, cx: number, from: number, to: number) {
  context.save();
  context.lineCap = "round"; context.lineWidth = 14;
  context.shadowColor = "#a8461f33"; context.shadowBlur = 12;
  for (const [dx, phase] of [[-40, 0], [0, 2], [40, 4]] as const) {
    const fade = context.createLinearGradient(0, from, 0, to);
    fade.addColorStop(0, "#fffdf800"); fade.addColorStop(0.35, "#fffdf8"); fade.addColorStop(1, "#fffdf8");
    context.strokeStyle = fade;
    context.beginPath();
    for (let y = from; y >= to; y -= 4) { const x = cx + dx + Math.sin((from - y) / 26 + phase) * 11; if (y === from) context.moveTo(x, y); else context.lineTo(x, y); }
    context.stroke();
  }
  context.restore();
}

/** A puffy cloud of steam holding the latest find. */
function drawCloud(context: CanvasRenderingContext2D, cx: number, cy: number, width: number, height: number) {
  context.save();
  context.fillStyle = "#fffaf2";
  context.shadowColor = "#7a2f1422"; context.shadowBlur = 24; context.shadowOffsetY = 8;
  context.beginPath();
  context.roundRect(cx - width / 2, cy - height / 2, width, height, height / 2);
  for (const [dx, dy, r] of [[-0.3, -0.5, 0.42], [0.05, -0.62, 0.5], [0.32, -0.45, 0.38]] as const) { context.moveTo(cx + dx * width + r * height, cy + dy * height * 0.6); context.arc(cx + dx * width, cy + dy * height * 0.6, r * height, 0, Math.PI * 2); }
  context.fill();
  context.restore();
}

function chip(context: CanvasRenderingContext2D, x: number, y: number, maxWidth: number, label: string, color: string, size = 40) {
  context.font = `700 ${size}px ${DISPLAY_FONT}`;
  let fontSize = size;
  while (fontSize > 22 && context.measureText(label).width > maxWidth - 72) { fontSize -= 1; context.font = `700 ${fontSize}px ${DISPLAY_FONT}`; }
  const width = Math.min(maxWidth, context.measureText(label).width + 76);
  context.fillStyle = "#fffaf2";
  context.beginPath(); context.roundRect(x, y, width, 80, 40); context.fill();
  context.strokeStyle = "#d9b98f"; context.lineWidth = 2; context.stroke();
  context.fillStyle = color;
  context.beginPath(); context.arc(x + 34, y + 40, 12, 0, Math.PI * 2); context.fill();
  fitText(context, [{ text: label, color: SOOT, weight: 700, display: true }], x + 56, y + 54, fontSize, width - 72);
  return width;
}

export function drawCard(canvas: HTMLCanvasElement, data: Shared, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const L = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const left = 84, inner = width - 168, count = madeCount(data.found);

  context.fillStyle = WALL;
  context.fillRect(0, 0, width, height);
  // Hand-plastered wall: soft, uneven dabs; then the earthen floor the stove sits on.
  let seed = 7;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  context.fillStyle = "#e9d3b5";
  context.globalAlpha = 0.18;
  for (let index = 0; index < 60; index++) { context.beginPath(); context.ellipse(random() * width, random() * height, 30 + random() * 60, 8 + random() * 14, random() * 3, 0, Math.PI * 2); context.fill(); }
  context.globalAlpha = 1;
  // The floor line meets the stove a little above its base, so the stove stands on it.
  const floor = L.pot + L.potWidth * 0.78 * 0.68 - 36;
  context.fillStyle = FLOOR;
  context.fillRect(0, floor, width, height - floor);
  context.fillStyle = "#cfa97c";
  context.fillRect(0, floor, width, 6);

  fitText(context, [{ text: "নানির জাদুর হাঁড়ি · দেশি মিশ্রণ", color: MUTED, weight: 600 }], left, L.kicker, 30, inner);
  fitText(context, [{ text: data.name || "আমার হাঁড়ি", color: SOOT, weight: 800, display: true }], left, L.name, L.nameSize, inner);
  fitText(context, [{ text: `${bn(count)}টা`, color: CLAY, weight: 800, display: true }, { text: ` জিনিস ${data.name ? "বানিয়েছে" : "বানিয়েছি"}`, color: SOOT, weight: 800, display: true }], left, L.count, L.countSize, inner);

  // Progress: a clay-coloured fill on a pale track, "২০০-র মধ্যে ৮৭" beside it.
  const barWidth = inner - 250;
  context.fillStyle = "#e6cfae";
  context.beginPath(); context.roundRect(left, L.bar, barWidth, 22, 11); context.fill();
  context.fillStyle = CLAY;
  context.beginPath(); context.roundRect(left, L.bar, Math.max(22, (barWidth * count) / MAKEABLE), 22, 11); context.fill();
  fitText(context, [{ text: `${bn(MAKEABLE)}টার মধ্যে`, color: MUTED, weight: 600 }], width - 84, L.bar + 20, 28, 230, "right");

  // The pot, its steam, and the latest find in a cloud.
  drawSteam(context, width / 2, L.pot - L.potWidth * 0.3, L.cloud + 60);
  drawPot(context, width / 2, L.pot, L.potWidth);
  drawCloud(context, width / 2, L.cloud, 640, 160);
  fitText(context, [{ text: "সর্বশেষ বানানো", color: MUTED, weight: 600 }], width / 2, L.cloud - 34, 30, 560, "center");
  fitText(context, [{ text: nameOf(data.latest) || "ভাত", color: CLAY, weight: 800, display: true }], width / 2, L.cloud + 48, 74, 580, "center");

  // A few more finds, laid out like cloth bundles on the floor.
  const more = showcase(data.found, data.latest, 6);
  if (more.length) {
    fitText(context, [{ text: "আরও যা বানানো হয়েছে", color: MUTED, weight: 600 }], left, L.chips - 16, 30, inner);
    let x = left, y = L.chips;
    for (const item of more) {
      context.font = `700 40px ${DISPLAY_FONT}`;
      const need = Math.min(inner, context.measureText(item.name).width + 76);
      if (x + need > left + inner) { x = left; y += 94; if (y > L.chips + 94) break; }
      x += chip(context, x, y, inner, item.name, kindColor[item.kind]) + 16;
    }
  }

  context.font = `700 44px ${DISPLAY_FONT}`;
  wrapText(context, humanLine(count), inner, 2).forEach((line, index) => fitText(context, [{ text: line, color: SOOT, weight: 700, display: true }], left, L.line + index * 58, 44, inner));

  drawFooterBand(context, format, "তুমি কয়টা বানাতে পারবে?", site, { band: SOOT, ask: TURMERIC, site: "#fffaf2" });
}

export const cardBlob = (data: Shared, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, data, format, site));
