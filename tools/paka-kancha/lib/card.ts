// The result card: rows of mangoes on a leaf-green board. Spoiler-free: no digit of any guess or of the code is drawn.
import { possessive } from '../../../shared/bangla';
import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, storySafe, type CardFormat } from '../../../shared/card-canvas';
import { artFor } from './art';
import { isFinale, levelName, worldOf } from './levels';
import { humanLine, rulesOf, starsOf } from './play';
import { LENGTH, bn, bnDate, type Mark } from './rules';
import { BLUSH, BODY, HALF, HALF_SKIN, LEAF, RAW_SCALE, SEED, STEM, colors } from './mango';
import { puzzleLabel, tryCount, type Shared } from './link';


/** One mango, `size` px square, top-left at (x, y). */
export function drawMango(context: CanvasRenderingContext2D, mark: Mark, x: number, y: number, size: number) {
  context.save();
  context.translate(x, y);
  context.scale(size / 40, size / 40);
  context.lineJoin = 'round';
  context.lineCap = 'round';
  if (mark === 'p') {
    const body = new Path2D(BODY);
    context.fillStyle = colors.ripe; context.fill(body);
    context.save();
    context.globalAlpha = 0.5; context.fillStyle = colors.blush;
    context.beginPath(); context.ellipse(BLUSH.cx, BLUSH.cy, BLUSH.rx, BLUSH.ry, BLUSH.angle, 0, Math.PI * 2); context.fill();
    context.restore();
    context.strokeStyle = colors.ripeEdge; context.lineWidth = 1.6; context.stroke(body);
    context.strokeStyle = colors.stem; context.lineWidth = 2; context.stroke(new Path2D(STEM));
    context.fillStyle = colors.leaf; context.fill(new Path2D(LEAF));
  } else if (mark === 'a') {
    context.fillStyle = colors.flesh; context.fill(new Path2D(HALF));
    context.fillStyle = colors.seed; context.fill(new Path2D(SEED));
    context.strokeStyle = colors.skin; context.lineWidth = 3.2; context.stroke(new Path2D(HALF_SKIN));
    context.strokeStyle = colors.fleshEdge; context.lineWidth = 1.6;
    context.beginPath(); context.moveTo(13, 5); context.lineTo(13, 37); context.stroke();
  } else {
    context.translate(20 * (1 - RAW_SCALE), 21 * (1 - RAW_SCALE));
    context.scale(RAW_SCALE, RAW_SCALE);
    const body = new Path2D(BODY);
    context.fillStyle = colors.rawFill; context.fill(body);
    context.setLineDash([3.5, 2.6]); context.strokeStyle = colors.raw; context.lineWidth = 2.4; context.stroke(body);
  }
  context.restore();
}

// Set at the start of every drawCard: the world's palette. One canvas is drawn at a time.
let BG = '', BOARD = '', CREAM = '', SOFT = '', GOLD = '', BAND = { band: '', ask: '', site: '#ffffff' };

const layouts = {
  feed: { title: 150, sub: 214, score: 390, top: 424, bottom: 1110, line: 1176 },
  story: { title: storySafe.top + 140, sub: storySafe.top + 208, score: storySafe.top + 420, top: storySafe.top + 480, bottom: 1500, line: 1584 },
} as const;

export function drawCard(canvas: HTMLCanvasElement, shared: Shared, today: string, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('এই ব্রাউজারে ছবি বানানো যাচ্ছে না।');
  const { puzzle, rows, name } = shared;
  const art = artFor(puzzle.kind === 'level' && !puzzle.legacy ? worldOf(puzzle.level) - 1 : 0);
  BG = art.cardBg; BOARD = art.cardBoard; CREAM = art.cream; SOFT = art.soft; GOLD = art.gold;
  BAND = { band: art.band, ask: art.gold, site: '#ffffff' };

  context.fillStyle = BG;
  context.fillRect(0, 0, width, height);
  // Two big faint leaves in the corners, like looking up through a mango tree.
  context.save();
  context.globalAlpha = 0.13; context.fillStyle = '#9fd18a';
  context.translate(width - 430, -40); context.scale(13, 13); context.fill(new Path2D(LEAF));
  context.restore();
  context.save();
  context.globalAlpha = 0.1; context.fillStyle = '#9fd18a';
  context.translate(380, height - 120); context.rotate(Math.PI); context.scale(11, 11); context.fill(new Path2D(LEAF));
  context.restore();

  fitText(context, [{ text: 'পাকা-কাঁচা', color: CREAM, weight: 800, display: true }], width / 2, layout.title, 96, width - 160, 'center');
  const finale = puzzle.kind === 'level' && !puzzle.legacy && isFinale(puzzle.level) ? ` · ${levelName(puzzle.level)}` : '';
  const label = rows.length ? `${puzzleLabel(puzzle, today)}${finale}` : 'বন্ধুর জন্য কোড';
  const kicker = `${name && rows.length ? `${possessive(name)} ` : ''}${label}${puzzle.kind === 'day' ? ` · ${bnDate(puzzle.date)}` : ''}`;
  // A level's card also shows its stars, after the label.
  const stars = rows.length ? starsOf(puzzle, rows) : 0;
  const starRun = stars ? [{ text: '  ', color: SOFT, weight: 600 }, ...[0, 1, 2].map(index => ({ text: '★', color: index < stars ? GOLD : '#5f8a66', weight: 700 }))] : [];
  fitText(context, [{ text: kicker, color: SOFT, weight: 600 }, ...starRun], width / 2, layout.sub, 38, width - 180, 'center');
  const { tries } = rulesOf(puzzle);

  if (!rows.length) drawInvite(context, name, format);
  else {
    const won = rows[rows.length - 1].every(mark => mark === 'p');
    fitText(context, [{ text: tryCount(rows, tries), color: won ? GOLD : CREAM, weight: 800, display: true }], width / 2, layout.score, won ? 156 : 104, width - 200, 'center');
    drawBoard(context, rows, width, layout.top, layout.bottom);
    fitText(context, [{ text: humanLine(rows, tries), color: CREAM, weight: 600, display: true }], width / 2, layout.line, format === 'story' ? 44 : 40, width - 150, 'center');
  }
  drawFooterBand(context, format, 'তুমি কয়বারে পারবে?', site, BAND);
}

function drawBoard(context: CanvasRenderingContext2D, rows: readonly Mark[][], width: number, top: number, bottom: number) {
  const pad = 36, gap = 34, numberColumn = 64;
  const pitch = Math.min(152, (bottom - top - pad * 2) / rows.length);
  const size = Math.round(pitch - 20);
  const boardWidth = pad * 2 + numberColumn + LENGTH * size + (LENGTH - 1) * gap;
  const boardHeight = pad * 2 + rows.length * pitch - (pitch - size);
  const left = (width - boardWidth) / 2, y0 = top + (bottom - top - boardHeight) / 2;
  context.fillStyle = BOARD;
  roundedRect(context, left, y0, boardWidth, boardHeight, 36);
  context.fill();
  rows.forEach((row, index) => {
    const y = y0 + pad + index * pitch;
    fitText(context, [{ text: bn(index + 1), color: SOFT, weight: 700, display: true }], left + pad + numberColumn - 24, y + size * 0.66, Math.min(44, size * 0.45), numberColumn, 'right');
    row.forEach((mark, column) => drawMango(context, mark, left + pad + numberColumn + column * (size + gap), y, size));
  });
}

function drawInvite(context: CanvasRenderingContext2D, name: string, format: CardFormat) {
  const { width } = cardSizes[format];
  const layout = layouts[format];
  fitText(context, [{ text: `${name || 'এক বন্ধু'} তোমার জন্য`, color: CREAM, weight: 700, display: true }], width / 2, layout.score - 70, 72, width - 160, 'center');
  fitText(context, [{ text: 'একটা কোড রেখেছে', color: GOLD, weight: 800, display: true }], width / 2, layout.score + 20, 84, width - 160, 'center');
  // Four closed slots and one mango of each kind: what's waiting, without the code.
  const size = 170, gap = 28, left = (width - (LENGTH * size + (LENGTH - 1) * gap)) / 2, y = layout.top + 110;
  for (let index = 0; index < LENGTH; index++) {
    const x = left + index * (size + gap);
    context.fillStyle = CREAM; roundedRect(context, x, y, size, size * 1.1, 28); context.fill();
    fitText(context, [{ text: '?', color: BG, weight: 800, display: true }], x + size / 2, y + size * 0.8, 120, size, 'center');
  }
  (['p', 'a', 'k'] as const).forEach((mark, index) => drawMango(context, mark, width / 2 - 240 + index * 180, y + size * 1.1 + 90, 120));
  fitText(context, [{ text: '৭ বারে ধরতে পারবে?', color: CREAM, weight: 600, display: true }], width / 2, layout.line, format === 'story' ? 48 : 44, width - 160, 'center');
}

export const cardBlob = (shared: Shared, today: string, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, shared, today, format, site));
