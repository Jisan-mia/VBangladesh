import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, storySafe, type CardFormat } from '../../../shared/card-canvas';
import { bn, bnDate, possessive, type CardContent, type Mark } from './result';

// The card is a newspaper puzzle corner: newsprint, black ink, a masthead between rules, and the day's squares.
const PAPER = '#f5f2ea';
const INK = '#161a1d';
const MUTED = '#6b6f73';
const GREEN = '#257466';
const YELLOW = '#e3a92b';
const BLANK = '#d9d4c7';
const STAMP = '#c0392b';

function squareColor(mark: Mark, position: number) {
  if (mark === 'g') return GREEN;
  if (mark === 'h') return position === 0 ? YELLOW : GREEN;
  return null;
}

function drawRules(context: CanvasRenderingContext2D, y: number, width: number, thickFirst: boolean) {
  context.fillStyle = INK;
  context.fillRect(70, y, width - 140, thickFirst ? 9 : 2);
  context.fillRect(70, y + (thickFirst ? 17 : 8), width - 140, thickFirst ? 2 : 9);
}

function drawStamp(context: CanvasRenderingContext2D, streak: number, cx: number, cy: number, radius: number) {
  context.save();
  context.translate(cx, cy);
  context.rotate(-0.2);
  context.globalAlpha = 0.9;
  context.strokeStyle = STAMP;
  context.lineWidth = 7;
  context.beginPath(); context.arc(0, 0, radius, 0, Math.PI * 2); context.stroke();
  context.lineWidth = 3;
  context.beginPath(); context.arc(0, 0, radius - 14, 0, Math.PI * 2); context.stroke();
  fitText(context, [{ text: 'টানা', color: STAMP, weight: 700 }], 0, -radius * 0.32, radius * 0.3, radius * 1.3, 'center');
  fitText(context, [{ text: bn(streak), color: STAMP, weight: 800, display: true }], 0, radius * 0.3, radius * 0.72, radius * 1.4, 'center');
  fitText(context, [{ text: 'দিন', color: STAMP, weight: 700 }], 0, radius * 0.66, radius * 0.3, radius * 1.3, 'center');
  context.restore();
}

const layouts = {
  feed: { top: 64, mast: 104, dateGap: 74, kicker: 394, score: 476, grid: 530, square: 96, gap: 14, line: 1128, legend: 1188 },
  story: { top: storySafe.top + 20, mast: 112, dateGap: 80, kicker: 704, score: 794, grid: 872, square: 104, gap: 18, line: 1552, legend: 1614 },
} as const;

export function drawCard(canvas: HTMLCanvasElement, card: CardContent, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('এই ব্রাউজারে ছবি বানানো যাচ্ছে না।');
  context.fillStyle = PAPER;
  context.fillRect(0, 0, width, height);

  drawRules(context, layout.top, width, true);
  fitText(context, [{ text: 'আজকের শব্দজট', color: INK, weight: 800, display: true }], width / 2, layout.top + 19 + layout.mast, layout.mast, width - 160, 'center');
  const ruleY = layout.top + 19 + layout.mast + 34;
  drawRules(context, ruleY, width, false);
  fitText(context, [{ text: bnDate(card.date, true), color: INK, weight: 600 }], width / 2, ruleY + layout.dateGap - 12, 34, width - 200, 'center');
  drawRules(context, ruleY + layout.dateGap + 8, width, false);

  if (format === 'story') fitText(context, [{ text: 'রোজ পাঁচটা বাংলা শব্দের ধাঁধা', color: MUTED, weight: 600 }], width / 2, layout.kicker - 100, 34, 800, 'center');
  fitText(context, [{ text: card.name ? `${possessive(card.name)} আজকের ফল` : 'আমার আজকের ফল', color: MUTED, weight: 600 }], width / 2, layout.kicker, 38, 760, 'center');
  fitText(context, [{ text: `${bn(card.rows.length)}টার মধ্যে `, color: INK, weight: 700, display: true }, { text: `${bn(card.solved)}টা`, color: GREEN, weight: 800, display: true }], width / 2, layout.score, 86, 900, 'center');

  // Rows of squares, one row per puzzle, left-aligned like a printed grid.
  const { square, gap } = layout;
  const widest = Math.max(...card.rows.map(row => row.tiles));
  const left = width / 2 - (widest * square + (widest - 1) * gap) / 2 + (card.streak > 1 ? -90 : 0);
  card.rows.forEach((row, rowIndex) => {
    const y = layout.grid + rowIndex * (square + gap);
    fitText(context, [{ text: bn(rowIndex + 1), color: MUTED, weight: 700, display: true }], left - 30, y + square * 0.68, square * 0.42, 60, 'right');
    for (let position = 0; position < row.tiles; position++) {
      const x = left + position * (square + gap);
      const color = squareColor(row.mark, position);
      roundedRect(context, x, y, square, square, 12);
      if (color) { context.fillStyle = color; context.fill(); }
      else { context.fillStyle = '#ffffff'; context.fill(); context.strokeStyle = BLANK; context.lineWidth = 5; context.stroke(); }
    }
  });
  if (card.streak > 1) drawStamp(context, card.streak, width - 210, layout.grid + 2.4 * (square + gap), format === 'story' ? 130 : 112);

  fitText(context, [{ text: card.line, color: INK, weight: 600, display: true }], width / 2, layout.line, format === 'story' ? 42 : 38, width - 160, 'center');
  const legend = [
    { text: '■ ', color: GREEN, weight: 700 }, { text: 'নিজে পেরেছি    ', color: INK },
    { text: '■ ', color: YELLOW, weight: 700 }, { text: 'হিন্ট নিয়ে    ', color: INK },
    { text: '■ ', color: BLANK, weight: 700 }, { text: 'এবার হলো না', color: INK },
  ];
  fitText(context, card.versus ? [{ text: card.versus, color: STAMP, weight: 700 }] : legend, width / 2, layout.legend, 32, width - 160, 'center');
  drawFooterBand(context, format, 'তুমি কয়টা পারো?', site, { band: INK, ask: '#f2c14e', site: '#ffffff' });
}

export const cardBlob = (card: CardContent, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, card, format, site));
