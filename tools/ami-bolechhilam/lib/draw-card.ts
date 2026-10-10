import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, wrapText, BODY_FONT, DISPLAY_FONT, type CardFormat } from "../../../shared/card-canvas";
import { possessive } from "../../../shared/bangla";
import { sealBlob, sealMark } from "./art";
import { verdictLabel, type Card, type SportId, type Verdict } from "./seal";

// The green rexine top of an office desk, a khaki office envelope, a red lac seal, ballpoint on a chit, a violet stamp pad.
const DESK = "#1f4b42";
const DESK_BAND = "#123029";
const KRAFT = "#dcb57d";
const KRAFT_SHADE = "#c99e63";
const KRAFT_DEEP = "#a97b44";
const LAC = "#a3231b";
const LAC_HI = "#d8503f";
const LAC_LO = "#5e0f0a";
const PAPER = "#fffaf0";
const BALLPEN = "#1f3c9a";
const STAMP_RED = "#b3261e";
const STAMP_VIOLET = "#5a3b9c";
const CREAM = "#fbf3e2";
const GOLD = "#ffd98a";
const SOFT = "#bcd5cc";
const LABEL_INK = "#3a2a18";

function random(seed: number) {
  return () => (seed = (seed * 16807) % 2147483647) / 2147483647;
}

function desk(context: CanvasRenderingContext2D, width: number, height: number) {
  context.fillStyle = DESK;
  context.fillRect(0, 0, width, height);
  // The glass sheet on top catches one broad diagonal of light.
  const sheen = context.createLinearGradient(0, 0, width, height * 0.8);
  sheen.addColorStop(0, "rgba(255,255,255,0)");
  sheen.addColorStop(0.3, "rgba(255,255,255,.07)");
  sheen.addColorStop(0.38, "rgba(255,255,255,0)");
  context.fillStyle = sheen;
  context.fillRect(0, 0, width, height);
  const next = random(11);
  for (let i = 0; i < 2200; i++) {
    context.fillStyle = next() > 0.5 ? "rgba(255,255,255,.035)" : "rgba(0,0,0,.08)";
    context.fillRect(next() * width, next() * height, 2, 2);
  }
}

/** Khaki paper with a few fibres, clipped to the current path. */
function kraft(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, base = KRAFT, seed = 3) {
  context.save();
  context.clip();
  const light = context.createLinearGradient(x, y, x + width, y + height);
  light.addColorStop(0, base);
  light.addColorStop(1, KRAFT_SHADE);
  context.fillStyle = light;
  context.fillRect(x, y, width, height);
  const next = random(seed);
  context.lineWidth = 1.5;
  for (let i = 0; i < 260; i++) {
    const fx = x + next() * width, fy = y + next() * height, angle = next() * Math.PI;
    context.strokeStyle = next() > 0.5 ? "rgba(120,80,30,.16)" : "rgba(255,240,210,.22)";
    context.beginPath();
    context.moveTo(fx, fy);
    context.lineTo(fx + Math.cos(angle) * 14, fy + Math.sin(angle) * 14);
    context.stroke();
  }
  context.restore();
}

function shadow(context: CanvasRenderingContext2D, blur: number, offset: number, alpha = 0.4) {
  context.shadowColor = `rgba(0,0,0,${alpha})`;
  context.shadowBlur = blur;
  context.shadowOffsetY = offset;
}

/** The wax seal, whole or as one broken half (side -1 keeps the left, 1 the right). */
function seal(context: CanvasRenderingContext2D, sport: SportId, cx: number, cy: number, radius: number, half: 0 | -1 | 1 = 0) {
  context.save();
  context.translate(cx - radius, cy - radius);
  context.scale(radius / 50, radius / 50);
  if (half) {
    context.beginPath();
    // A jagged crack down the middle, so the halves read as broken wax rather than cut.
    context.moveTo(50, -4);
    for (const [dx, y] of [[4, 18], [-3, 34], [5, 52], [-4, 70], [3, 86], [0, 104]]) context.lineTo(50 + dx, y);
    context.lineTo(half < 0 ? -4 : 104, 104);
    context.lineTo(half < 0 ? -4 : 104, -4);
    context.closePath();
    context.clip();
  }
  const blob = new Path2D(sealBlob);
  context.save();
  shadow(context, 10, 4, 0.45);
  const wax = context.createRadialGradient(38, 34, 4, 50, 50, 52);
  wax.addColorStop(0, LAC_HI);
  wax.addColorStop(0.55, LAC);
  wax.addColorStop(1, LAC_LO);
  context.fillStyle = wax;
  context.fill(blob);
  context.restore();
  context.strokeStyle = "rgba(60,8,5,.55)";
  context.lineWidth = 3;
  context.beginPath(); context.arc(50, 50, 32, 0, Math.PI * 2); context.stroke();
  context.strokeStyle = "rgba(255,170,150,.35)";
  context.lineWidth = 1.6;
  context.beginPath(); context.arc(50.8, 51, 32, 0, Math.PI * 2); context.stroke();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = "rgba(60,8,5,.6)";
  context.lineWidth = 3;
  context.stroke(new Path2D(sealMark[sport]));
  context.translate(0.8, 0.9);
  context.strokeStyle = "rgba(255,170,150,.4)";
  context.lineWidth = 1.4;
  context.stroke(new Path2D(sealMark[sport]));
  context.restore();
}

/** A rubber stamp: bold word in a double frame, a little uneven like real ink. */
function stamp(context: CanvasRenderingContext2D, text: string, cx: number, cy: number, size: number, color: string, angle: number) {
  context.save();
  context.translate(cx, cy);
  context.rotate(angle);
  context.font = `800 ${size}px ${DISPLAY_FONT}`;
  const width = context.measureText(text).width + size * 1.1;
  const height = size * 1.7;
  context.globalAlpha = 0.86;
  context.strokeStyle = color;
  context.lineWidth = size * 0.09;
  roundedRect(context, -width / 2, -height / 2, width, height, size * 0.25);
  context.stroke();
  context.lineWidth = size * 0.04;
  roundedRect(context, -width / 2 + size * 0.17, -height / 2 + size * 0.17, width - size * 0.34, height - size * 0.34, size * 0.15);
  context.stroke();
  fitText(context, [{ text, color, weight: 800, display: true }], 0, size * 0.36, size, width, "center");
  // Ink that didn't take: a few pale specks.
  const next = random(text.length + 5);
  context.globalCompositeOperation = "destination-out";
  for (let i = 0; i < 40; i++) {
    context.beginPath();
    context.arc((next() - 0.5) * width, (next() - 0.5) * height, next() * 2.4, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}

const stampColor = (verdict: Verdict) => (verdict === "wrong" ? "#5d6470" : STAMP_VIOLET);

function sealedEnvelope(context: CanvasRenderingContext2D, card: Card, x: number, y: number, width: number, height: number) {
  const cx = x + width / 2;
  context.save();
  context.translate(cx, y + height / 2);
  context.rotate(-0.02);
  context.translate(-cx, -(y + height / 2));
  context.save();
  shadow(context, 40, 18, 0.45);
  context.fillStyle = KRAFT;
  roundedRect(context, x, y, width, height, 12);
  context.fill();
  context.restore();
  roundedRect(context, x, y, width, height, 12);
  kraft(context, x, y, width, height);
  // Side flap seams meeting the bottom flap.
  const meet = y + height * 0.52;
  context.strokeStyle = "rgba(110,70,30,.35)";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(x + 8, y + height - 6); context.lineTo(cx - width * 0.08, meet + 30);
  context.moveTo(x + width - 8, y + height - 6); context.lineTo(cx + width * 0.08, meet + 30);
  context.stroke();
  // The top flap, closed, with a soft shadow under its edges.
  const tip = y + height * 0.48;
  context.save();
  shadow(context, 18, 8, 0.3);
  context.beginPath();
  context.moveTo(x + 4, y + 4); context.lineTo(x + width - 4, y + 4); context.lineTo(cx, tip); context.closePath();
  context.fillStyle = KRAFT_SHADE;
  context.fill();
  context.restore();
  context.beginPath();
  context.moveTo(x + 4, y + 4); context.lineTo(x + width - 4, y + 4); context.lineTo(cx, tip); context.closePath();
  kraft(context, x, y, width, tip - y, "#e3c08d", 8);

  // The address label: the match, and who is inside.
  const labelW = Math.min(470, width * 0.52), labelH = 150, labelX = x + 44, labelY = y + height - labelH - 40;
  context.save();
  context.translate(labelX + labelW / 2, labelY + labelH / 2);
  context.rotate(0.012);
  shadow(context, 6, 3, 0.2);
  context.fillStyle = PAPER;
  context.fillRect(-labelW / 2, -labelH / 2, labelW, labelH);
  context.restore();
  fitText(context, [{ text: card.match, color: LABEL_INK, weight: 700, display: true }], labelX + 26, labelY + 64, 40, labelW - 52);
  fitText(context, [{ text: card.inside, color: "#7a6550", weight: 600 }], labelX + 26, labelY + 116, 28, labelW - 52);

  stamp(context, "খেলার পর খুলবে", x + width - 210, y + height - 110, 38, STAMP_RED, -0.16);
  seal(context, card.sport, cx, tip, Math.min(100, width * 0.11));
  context.restore();
}

/** The chit pulled out of the envelope. Returns where its writing ends. */
function chit(context: CanvasRenderingContext2D, card: Card, x: number, y: number, width: number, height: number, rowH: number) {
  context.save();
  context.translate(x + width / 2, y + height / 2);
  context.rotate(0.012);
  context.translate(-(x + width / 2), -(y + height / 2));
  context.save();
  shadow(context, 24, 10, 0.35);
  context.fillStyle = PAPER;
  context.fillRect(x, y, width, height);
  context.restore();
  const left = x + 44, inner = width - 88;
  if (card.rows.length === 1) {
    const row = card.rows[0];
    fitText(context, [{ text: `${row.name === "আমি" ? "আমার" : possessive(row.name)} কথা, খেলার আগে:`, color: "#7a6f60", weight: 600 }], left, y + 64, 30, inner);
    context.font = `700 78px ${DISPLAY_FONT}`;
    wrapText(context, row.text, inner, 2).forEach((text, index) => fitText(context, [{ text, color: BALLPEN, weight: 700, display: true }], left, y + 172 + index * 100, 78, inner));
    if (row.verdict) stamp(context, verdictLabel[row.verdict], x + width - 200, y + height - 140, 50, stampColor(row.verdict), -0.2);
  } else {
    fitText(context, [{ text: "খেলার আগে যা লেখা হয়েছিল", color: "#7a6f60", weight: 600 }], left, y + 56, 28, inner);
    const textWidth = card.rows.some(row => row.verdict) ? inner - 190 : inner;
    card.rows.forEach((row, index) => {
      const top = y + 84 + index * rowH, size = rowH > 90 ? 36 : 30;
      context.strokeStyle = "rgba(31,60,154,.12)";
      context.lineWidth = 2;
      context.beginPath(); context.moveTo(left, top + rowH - 4); context.lineTo(x + width - 44, top + rowH - 4); context.stroke();
      fitText(context, [{ text: row.name, color: BALLPEN, weight: 700, display: true }], left, top + rowH * 0.4, size, textWidth);
      fitText(context, [{ text: row.text, color: BALLPEN, weight: 500 }], left, top + rowH * 0.82, size, textWidth);
      if (row.verdict) stamp(context, verdictLabel[row.verdict], x + width - 140, top + rowH / 2 + 2, rowH > 90 ? 30 : 26, stampColor(row.verdict), index % 2 ? 0.08 : -0.1);
    });
  }
  context.restore();
}

function openEnvelope(context: CanvasRenderingContext2D, card: Card, x: number, top: number, width: number, height: number) {
  const cx = x + width / 2;
  context.save();
  shadow(context, 36, 16, 0.45);
  context.beginPath();
  context.moveTo(x, top); context.lineTo(cx, top + height * 0.42); context.lineTo(x + width, top); context.lineTo(x + width, top + height); context.lineTo(x, top + height); context.closePath();
  context.fillStyle = KRAFT;
  context.fill();
  context.restore();
  context.beginPath();
  context.moveTo(x, top); context.lineTo(cx, top + height * 0.42); context.lineTo(x + width, top); context.lineTo(x + width, top + height); context.lineTo(x, top + height); context.closePath();
  kraft(context, x, top, width, height, KRAFT, 5);
  context.strokeStyle = "rgba(110,70,30,.35)";
  context.lineWidth = 3;
  context.beginPath(); context.moveTo(x, top); context.lineTo(cx, top + height * 0.42); context.lineTo(x + width, top); context.stroke();
  // The broken seal, in two pieces on the desk.
  const radius = Math.min(78, width * 0.09);
  seal(context, card.sport, x + radius * 0.6, top + height - radius * 0.2, radius, -1);
  seal(context, card.sport, x + width - radius * 0.4, top + height + radius * 0.1, radius, 1);
}

const layouts = {
  feed: { kicker: 116, title: 210, titleSize: 86, envTop: 270, envH: 620, line: 985, note: 1130, bottom: 1254 },
  story: { kicker: 336, title: 438, titleSize: 96, envTop: 520, envH: 780, line: 1420, note: 1570, bottom: 1660 },
} as const;

export function drawCard(canvas: HTMLCanvasElement, card: Card, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  desk(context, width, height);
  if (format === "story") fitText(context, [{ text: "আমি বলেছিলাম! · একটুখানি", color: SOFT, weight: 600 }], width / 2, 172, 30, 900, "center");

  fitText(context, [{ text: card.kicker, color: SOFT, weight: 600 }], 84, layout.kicker, 34, 912);
  const hit = card.opened && card.rows.some(row => row.verdict && row.verdict !== "wrong");
  fitText(context, [{ text: card.title, color: hit ? GOLD : CREAM, weight: 800, display: true }], 84, layout.title, layout.titleSize, 912);

  let y: number;
  if (!card.opened) {
    sealedEnvelope(context, card, 92, layout.envTop, width - 184, layout.envH);
    y = layout.line;
  } else {
    const rows = card.rows.length;
    const chitTop = layout.envTop - 6;
    const rowH = format === "story" ? 108 : 84;
    const chitH = rows === 1 ? (format === "story" ? 520 : 460) : 104 + rows * rowH;
    const envTop = chitTop + chitH;
    const envH = Math.max(110, Math.min(format === "story" ? 440 : 220, layout.bottom - 270 - envTop));
    // The open flap stands up behind the chit.
    context.beginPath();
    context.moveTo(92, envTop); context.lineTo(width / 2, envTop - 300); context.lineTo(width - 92, envTop); context.closePath();
    kraft(context, 92, envTop - 300, width - 184, 300, KRAFT_DEEP, 9);
    chit(context, card, 140, chitTop, width - 280, chitH + 40, rowH);
    openEnvelope(context, card, 92, envTop, width - 184, envH);
    y = envTop + envH + 104;
    if (card.result) {
      fitText(context, [{ text: card.result, color: CREAM, weight: 700 }], 84, y, 38, 912);
      y += 64;
    }
  }

  context.font = `600 44px ${DISPLAY_FONT}`;
  wrapText(context, card.line, 912, 2).forEach((text, index) => fitText(context, [{ text, color: card.opened ? SOFT : CREAM, weight: 600, display: true }], 84, y + index * 58, 44, 912));
  if (!card.opened) {
    context.font = `500 30px ${BODY_FONT}`;
    fitText(context, [{ text: "সিলটা সম্মানের: খেলা শেষ হলে তবেই খোলা।", color: SOFT, weight: 500 }], 84, layout.note, 30, 912);
  }
  drawFooterBand(context, format, "তোমার ভবিষ্যদ্বাণী কী?", site, { band: DESK_BAND, ask: GOLD, site: CREAM });
}

export const cardBlob = (card: Card, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, card, format, site));
