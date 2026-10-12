// The result card: the shop's yellow signboard on a teal tin wall, and a cash memo with ten customer faces. Plain chits only, never real note art.
import { possessive } from '../../../shared/bangla';
import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, storySafe, wrapText, BODY_FONT, type CardFormat } from '../../../shared/card-canvas';
import { CUSTOMERS, bn, dayStars, humanLine } from './game';
import { outOf } from './link';

export const colors = { wall: '#15605a', wallLine: '#1d7068', sign: '#f6c945', signInk: '#8a1f17', paper: '#fff7e3', ink: '#2a1d12', muted: '#7a6650', face: '#f6c945', cream: '#fdf1d2' };
const BAND = { band: '#0d3d39', ask: colors.sign, site: '#ffffff' };

/** Each chit's own colour, plus the big notes customers hand over. Coins (১, ২, ৫) are round, the rest are slips. */
export const CHIT_COLORS: Record<number, string> = { 1: '#d9a27c', 2: '#cdd5dc', 5: '#e8c35a', 10: '#a6dcc7', 20: '#f4ab93', 50: '#c4b5ec', 100: '#8dc4e8', 200: '#efa6c8', 500: '#a9d48f' };
export const isCoin = (value: number) => value < 10;

/** One chit centred at (x, y), `size` its height. */
export function drawChit(context: CanvasRenderingContext2D, value: number, x: number, y: number, size: number, angle = 0) {
  context.save();
  context.translate(x, y);
  context.rotate(angle);
  context.fillStyle = CHIT_COLORS[value] ?? '#ddd';
  context.strokeStyle = '#2a1d1240';
  context.lineWidth = size * 0.04;
  const width = isCoin(value) ? size : size * 1.9;
  if (isCoin(value)) { context.beginPath(); context.arc(0, 0, size / 2, 0, Math.PI * 2); }
  else roundedRect(context, -width / 2, -size / 2, width, size, size * 0.14);
  context.fill(); context.stroke();
  context.strokeStyle = '#2a1d1226';
  if (isCoin(value)) { context.beginPath(); context.arc(0, 0, size * 0.38, 0, Math.PI * 2); context.stroke(); }
  else { roundedRect(context, -width / 2 + size * 0.1, -size / 2 + size * 0.1, width - size * 0.2, size * 0.8, size * 0.08); context.stroke(); }
  fitText(context, [{ text: bn(value), color: colors.ink, weight: 800, display: true }], 0, size * 0.2, size * 0.55, width * 0.8, 'center');
  context.restore();
}

function drawFace(context: CanvasRenderingContext2D, x: number, y: number, radius: number, happy: boolean) {
  if (!happy) {
    context.save();
    context.setLineDash([radius * 0.3, radius * 0.24]);
    context.strokeStyle = '#7a665088'; context.lineWidth = radius * 0.12;
    context.beginPath(); context.arc(x, y, radius * 0.92, 0, Math.PI * 2); context.stroke();
    context.restore();
    return;
  }
  context.fillStyle = colors.face;
  context.beginPath(); context.arc(x, y, radius, 0, Math.PI * 2); context.fill();
  context.strokeStyle = '#b8861f'; context.lineWidth = radius * 0.08; context.stroke();
  context.fillStyle = colors.ink;
  context.beginPath(); context.arc(x - radius * 0.34, y - radius * 0.16, radius * 0.11, 0, Math.PI * 2); context.arc(x + radius * 0.34, y - radius * 0.16, radius * 0.11, 0, Math.PI * 2); context.fill();
  context.strokeStyle = colors.ink; context.lineWidth = radius * 0.11; context.lineCap = 'round';
  context.beginPath(); context.arc(x, y + radius * 0.05, radius * 0.45, 0.2 * Math.PI, 0.8 * Math.PI); context.stroke();
}

const layouts = {
  feed: { sign: 56, signH: 176, kicker: 300, paper: 340, paperH: 690, line: 1112 },
  story: { sign: storySafe.top + 20, signH: 196, kicker: storySafe.top + 290, paper: storySafe.top + 340, paperH: 800, line: 1488 },
} as const;

export type CardData = { score: number; right: number; name: string; day?: number; clean?: number };

export function drawCard(canvas: HTMLCanvasElement, { score, right, name, day, clean = 0 }: CardData, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('এই ব্রাউজারে ছবি বানানো যাচ্ছে না।');

  // A painted tin wall: teal with soft corrugation lines.
  context.fillStyle = colors.wall;
  context.fillRect(0, 0, width, height);
  context.fillStyle = colors.wallLine;
  for (let x = 18; x < width; x += 54) context.fillRect(x, 0, 14, height);

  // The signboard, with two little nails.
  context.fillStyle = '#00000033';
  roundedRect(context, 66, layout.sign + 12, width - 132, layout.signH, 26); context.fill();
  context.fillStyle = colors.sign;
  roundedRect(context, 66, layout.sign, width - 132, layout.signH, 26); context.fill();
  context.strokeStyle = colors.signInk; context.lineWidth = 6;
  roundedRect(context, 84, layout.sign + 18, width - 168, layout.signH - 36, 18); context.stroke();
  context.fillStyle = '#6b4a2b';
  for (const x of [110, width - 110]) { context.beginPath(); context.arc(x, layout.sign + layout.signH / 2, 9, 0, Math.PI * 2); context.fill(); }
  fitText(context, [{ text: 'ভাংতি নাই!', color: colors.signInk, weight: 800, display: true }], width / 2, layout.sign + layout.signH * 0.7, 112, width - 300, 'center');

  const shop = name ? `${possessive(name)} দোকান` : 'আজকের দোকান';
  // A shop day names the day and its stars in place of "দশজন খদ্দের".
  const earned = dayStars(clean);
  const kicker = day
    ? [{ text: `${shop} · দিন ${bn(day)} `, color: colors.cream, weight: 600 }, ...[0, 1, 2].map(star => ({ text: '★', color: star < earned ? colors.sign : '#5f9a93', weight: 700 }))]
    : [{ text: `${shop} · দশজন খদ্দের`, color: colors.cream, weight: 600 }];
  fitText(context, kicker, width / 2, layout.kicker, 40, width - 180, 'center');

  // The cash memo.
  const left = 90, paperW = width - 180, top = layout.paper, paperH = layout.paperH, mid = width / 2;
  context.fillStyle = '#00000038';
  roundedRect(context, left + 8, top + 14, paperW, paperH, 22); context.fill();
  context.fillStyle = colors.paper;
  roundedRect(context, left, top, paperW, paperH, 22); context.fill();
  context.fillStyle = '#e7dcc0';
  for (let y = top + 70; y < top + paperH - 30; y += 70) context.fillRect(left + 40, y, paperW - 80, 2);

  const unit = paperH / 690;
  fitText(context, [{ text: outOf(right), color: colors.ink, weight: 700, display: true }], mid, top + 118 * unit, 76, paperW - 120, 'center');
  fitText(context, [{ text: 'ঠিক ভাংতি', color: colors.signInk, weight: 800, display: true }], mid, top + 250 * unit, 124, paperW - 120, 'center');
  const radius = 32, gap = (paperW - 120) / CUSTOMERS;
  for (let index = 0; index < CUSTOMERS; index++) drawFace(context, left + 60 + gap * (index + 0.5), top + 350 * unit, radius, index < right);

  context.save();
  context.setLineDash([14, 10]); context.strokeStyle = '#c9b88f'; context.lineWidth = 3;
  context.beginPath(); context.moveTo(left + 50, top + 430 * unit); context.lineTo(left + paperW - 50, top + 430 * unit); context.stroke();
  context.restore();
  fitText(context, [{ text: bn(score), color: colors.ink, weight: 800, display: true }, { text: ' পয়েন্ট', color: colors.muted, weight: 700, display: true }], mid, top + 570 * unit, 120, paperW - 160, 'center');

  // A few chits tucked at the memo's corners.
  drawChit(context, 100, left + paperW - 70, top + 8, 86, 0.22);
  drawChit(context, 5, left + 30, top + paperH - 20, 78, -0.2);
  drawChit(context, 2, left + 96, top + paperH + 8, 58, 0.3);

  context.font = `600 ${format === 'story' ? 46 : 42}px ${BODY_FONT}`;
  const lines = wrapText(context, humanLine(right, score), width - 200, 2);
  lines.forEach((line, index) => fitText(context, [{ text: line, color: colors.cream, weight: 600 }], mid, layout.line + index * (format === 'story' ? 64 : 58), format === 'story' ? 46 : 42, width - 160, 'center'));

  drawFooterBand(context, format, 'তুমি কয়জনকে পারবে?', site, BAND);
}

export const cardBlob = (data: CardData, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, data, format, site));
