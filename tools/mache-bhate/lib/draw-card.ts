import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, wrapText, BODY_FONT, type CardFormat } from "../../../shared/card-canvas";
import { paintFish } from "./fish-art";
import { bn, type CardContent } from "./fish";

const INK = "#1f2d3a";
const BLUE = "#1f5a85";
const MUTED = "#5b6b78";
/** A slot is w wide and w × SLOT_RATIO tall: the fish box (2:1) plus its name chit. */
export const SLOT_RATIO = 0.52;

export type Slot = { x: number; y: number; w: number };

/**
 * Lays `count` fish out in centred rows inside an oval tray of radii rx × ry (relative to the tray centre),
 * as big as they can be while every slot stays fully inside the oval.
 */
export function traySlots(count: number, rx: number, ry: number): Slot[] {
  if (count <= 0) return [];
  for (let w = 360; w >= 40; w -= 4) {
    const h = w * SLOT_RATIO;
    for (let rows = 1; rows * h <= 2 * ry; rows++) {
      const tops = Array.from({ length: rows }, (_, index) => -(rows * h) / 2 + index * h);
      const caps = tops.map(top => {
        const far = Math.max(Math.abs(top), Math.abs(top + h));
        return far >= ry ? 0 : Math.floor((2 * rx * Math.sqrt(1 - (far / ry) ** 2)) / w);
      });
      const room = caps.reduce((sum, cap) => sum + cap, 0);
      if (room < count) continue;
      // Share the fish out in proportion to each row's width, then settle the rounding.
      const counts = caps.map(cap => Math.min(cap, Math.floor((count * cap) / room)));
      let left = count - counts.reduce((sum, value) => sum + value, 0);
      const byWidth = caps.map((cap, index) => ({ cap, index })).sort((a, b) => b.cap - a.cap);
      while (left > 0) for (const { cap, index } of byWidth) if (left > 0 && counts[index] < cap) { counts[index]++; left--; }
      return tops.flatMap((top, row) => Array.from({ length: counts[row] }, (_, column) => ({ x: -(counts[row] * w) / 2 + column * w, y: top, w })));
    }
  }
  return [];
}

const layouts = {
  feed: { titleY: 128, tierY: 196, trayY: 662, rx: 500, ry: 412, lineY: 1128, lineSize: 36 },
  story: { titleY: 350, tierY: 422, trayY: 980, rx: 500, ry: 460, lineY: 1510, lineSize: 40 },
} as const;

function drawBackground(context: CanvasRenderingContext2D, width: number, height: number) {
  // Wet market floor: pale blue-grey with a few ripples.
  context.fillStyle = "#e5eef0";
  context.fillRect(0, 0, width, height);
  context.strokeStyle = "#d3e1e5";
  context.lineWidth = 3;
  for (let y = 60; y < height; y += 120) {
    context.beginPath();
    for (let x = -40; x <= width + 40; x += 40) context.quadraticCurveTo(x + 10, y + ((x / 40) % 2 ? 9 : -9), x + 20, y);
    context.stroke();
  }
}

function drawTray(context: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number) {
  const ellipse = (rX: number, rY: number) => { context.beginPath(); context.ellipse(cx, cy, rX, rY, 0, 0, Math.PI * 2); };
  context.save();
  context.fillStyle = "rgba(31,45,58,.16)";
  ellipse(rx + 6, ry + 6);
  context.translate(0, 14);
  context.fill();
  context.restore();
  // Woven bamboo: a checker of strips turned 45°, clipped to the tray.
  context.save();
  ellipse(rx - 30, ry - 30);
  context.clip();
  context.fillStyle = "#e9c987";
  context.fillRect(cx - rx, cy - ry, rx * 2, ry * 2);
  context.translate(cx, cy);
  context.rotate(Math.PI / 4);
  const cell = 34, reach = Math.ceil(Math.max(rx, ry) * 1.5 / cell) * cell;
  for (let gx = -reach; gx < reach; gx += cell) for (let gy = -reach; gy < reach; gy += cell) {
    const along = ((gx + gy) / cell) % 2 === 0;
    context.fillStyle = along ? "#e2bd74" : "#efd49a";
    context.fillRect(gx + 1, gy + 1, cell - 2, cell - 2);
    context.strokeStyle = "rgba(150,108,48,.35)";
    context.lineWidth = 1.5;
    context.beginPath();
    if (along) { context.moveTo(gx + 4, gy + cell / 2); context.lineTo(gx + cell - 4, gy + cell / 2); }
    else { context.moveTo(gx + cell / 2, gy + 4); context.lineTo(gx + cell / 2, gy + cell - 4); }
    context.stroke();
  }
  context.restore();
  // Inner shade so the weave dips into the rim.
  context.save();
  ellipse(rx - 30, ry - 30);
  context.clip();
  context.strokeStyle = "rgba(120,80,30,.22)";
  context.lineWidth = 26;
  ellipse(rx - 30, ry - 30);
  context.stroke();
  context.restore();
  // The bound rim.
  context.strokeStyle = "#b8894a";
  context.lineWidth = 34;
  ellipse(rx - 15, ry - 15);
  context.stroke();
  context.strokeStyle = "#d8b173";
  context.lineWidth = 6;
  ellipse(rx - 22, ry - 22);
  context.stroke();
  context.strokeStyle = "#8a6230";
  context.lineWidth = 3;
  ellipse(rx, ry);
  context.stroke();
  context.strokeStyle = "rgba(110,75,30,.55)";
  context.lineWidth = 4;
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 30) {
    const cos = Math.cos(angle), sin = Math.sin(angle);
    context.beginPath();
    context.moveTo(cx + cos * (rx - 30), cy + sin * (ry - 30));
    context.lineTo(cx + cos * (rx - 2), cy + sin * (ry - 2));
    context.stroke();
  }
}

function drawFishSlots(context: CanvasRenderingContext2D, card: CardContent, cx: number, cy: number, rx: number, ry: number) {
  const slots = traySlots(card.fish.length, rx - 40, ry - 40);
  // The 2:1 drawing box is mostly air above and below the fish, so it starts a little above its slot.
  const boxOf = (slot: Slot) => { const width = slot.w * 0.98; return { x: cx + slot.x + (slot.w - width) / 2, y: cy + slot.y - slot.w * 0.1, width }; };
  slots.forEach((slot, index) => {
    const box = boxOf(slot);
    // A small tilt per fish so the tray looks laid by hand, not printed.
    const tilt = (((index * 37) % 11) - 5) * 0.012;
    context.save();
    context.translate(box.x + box.width / 2, box.y + box.width / 4);
    context.rotate(tilt);
    context.fillStyle = "rgba(60,40,15,.18)";
    context.beginPath();
    context.ellipse(4, box.width * 0.07, box.width * 0.4, box.width * 0.1, 0, 0, Math.PI * 2);
    context.fill();
    paintFish(context, card.fish[index].id, -box.width / 2, -box.width / 4, box.width);
    context.restore();
  });
  // Names go on last, on little paper chits like the price tags stuck into fish at the bazar, so no fin covers them.
  slots.forEach((slot, index) => {
    const label = card.fish[index].label;
    const size = Math.max(22, Math.min(40, slot.w * 0.14));
    context.font = `700 ${size}px ${BODY_FONT}`;
    const textWidth = Math.min(context.measureText(label).width, slot.w - 16);
    const chipW = textWidth + size * 0.8, chipH = size * 1.4, chipX = cx + slot.x + slot.w / 2 - chipW / 2, chipY = cy + slot.y + slot.w * SLOT_RATIO - chipH - 4;
    context.fillStyle = "#fffaf0";
    roundedRect(context, chipX, chipY, chipW, chipH, 8);
    context.fill();
    context.strokeStyle = "rgba(31,45,58,.35)";
    context.lineWidth = 2;
    context.stroke();
    fitText(context, [{ text: label, color: INK, weight: 700 }], cx + slot.x + slot.w / 2, chipY + chipH * 0.72, size, slot.w - 16, "center");
  });
  if (!slots.length) fitText(context, [{ text: "ডালা এখনো ফাঁকা", color: "#8a6230", weight: 700, display: true }], cx, cy + 16, 52, rx, "center");
}

function drawTag(context: CanvasRenderingContext2D, card: CardContent, x: number, y: number) {
  // A paper price tag on a string: "৪০-এ ২৩".
  context.save();
  context.translate(x, y);
  context.rotate(0.06);
  context.fillStyle = "rgba(31,45,58,.15)";
  roundedRect(context, -118, 10, 236, 150, 16);
  context.fill();
  context.fillStyle = "#ffffff";
  roundedRect(context, -118, 0, 236, 150, 16);
  context.fill();
  context.strokeStyle = INK;
  context.lineWidth = 3;
  context.stroke();
  context.beginPath(); context.arc(-86, 30, 9, 0, Math.PI * 2); context.stroke();
  fitText(context, [{ text: `${bn(card.total)}-এ`, color: MUTED, weight: 700 }], 18, 52, 32, 150, "center");
  fitText(context, [{ text: bn(card.count), color: BLUE, weight: 800, display: true }], 18, 132, 84, 190, "center");
  context.restore();
  context.strokeStyle = INK;
  context.lineWidth = 2.5;
  context.beginPath(); context.moveTo(x - 82, y + 28); context.quadraticCurveTo(x - 120, y - 30, x - 70, y - 60); context.stroke();
}

export function drawCard(canvas: HTMLCanvasElement, card: CardContent, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  drawBackground(context, width, height);
  if (format === "story") fitText(context, [{ text: "মাছে-ভাতে · একটুখানি", color: MUTED, weight: 600 }], width / 2, 170, 30, 900, "center");
  fitText(context, [{ text: card.title, color: INK, weight: 800, display: true }], 64, layout.titleY, 82, 680);
  fitText(context, [{ text: card.tier, color: BLUE, weight: 700, display: true }], 66, layout.tierY, 44, 680);
  drawTag(context, card, 880, layout.titleY - 96);
  drawTray(context, width / 2, layout.trayY, layout.rx, layout.ry);
  drawFishSlots(context, card, width / 2, layout.trayY, layout.rx, layout.ry);
  context.font = `600 ${layout.lineSize}px "Display", "Bangla"`;
  const lines = wrapText(context, card.line, 952, 2);
  let y = layout.lineY;
  for (const text of lines) { fitText(context, [{ text, color: INK, weight: 600, display: true }], 64, y, layout.lineSize, 952); y += layout.lineSize * 1.3; }
  if (card.match) fitText(context, [{ text: card.match, color: BLUE, weight: 700 }], 64, y + 6, layout.lineSize - 2, 952);
  drawFooterBand(context, format, "তোমার ডালায় কয়টা?", site, { band: "#173f5c", ask: "#ffd166", site: "#ffffff" });
}

export const cardBlob = (card: CardContent, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, card, format, site));
