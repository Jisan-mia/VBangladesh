import { cardSizes, drawFooterBand, fitText, renderCard, type CardFormat } from '../../../shared/card-canvas';
import { basketTotal, formatQuantity, units } from './basket';
import { bn, fordoLine, fordoTitle, formatTaka, pricedCount, type Fordo } from './fordo';

const PEN = '#1f3f8f';
const PEN_SOFT = '#5b6fa3';
const RED = '#c8372d';
const GREEN = '#2f7a4a';
const RULE = '#cfdcf0';
const NAVY = '#123c60';
const ROW = 50;
const ROW_MAX = 78;
const FIRST_RULE = 214;

const layouts = {
  feed: { top: 56, height: 1150, tilt: -0.018 },
  story: { top: 300, height: 1330, tilt: -0.014 },
} as const;

function jute(context: CanvasRenderingContext2D, width: number, height: number) {
  context.fillStyle = '#d3a056';
  context.fillRect(0, 0, width, height);
  context.lineWidth = 3;
  for (let x = 0; x < width; x += 10) { context.strokeStyle = x % 20 ? '#b9873f33' : '#f7d79a26'; context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke(); }
  for (let y = 0; y < height; y += 10) { context.strokeStyle = y % 20 ? '#f7d79a22' : '#9c6e2e22'; context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke(); }
}

/** A khata strip torn by hand: jagged top and bottom, deterministic so the same list always looks the same. */
function stripPath(context: CanvasRenderingContext2D, width: number, height: number) {
  const bite = (x: number) => 3 + 9 * Math.abs(Math.sin(x * 12.9898));
  context.beginPath();
  context.moveTo(0, bite(0));
  for (let x = 18; x < width; x += 18) context.lineTo(x, bite(x));
  context.lineTo(width, bite(width));
  context.lineTo(width, height - bite(width + 1));
  for (let x = width - 18; x > 0; x -= 18) context.lineTo(x, height - bite(x + 1));
  context.lineTo(0, height - bite(1));
  context.closePath();
}

export function drawFordo(canvas: HTMLCanvasElement, fordo: Fordo, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('এই ব্রাউজারে ছবি বানানো যাচ্ছে না।');
  jute(context, width, height);

  const w = 800, h = layout.height;
  context.save();
  context.translate(width / 2, layout.top + h / 2);
  context.rotate(layout.tilt);
  context.translate(-w / 2, -h / 2);

  context.save();
  context.shadowColor = '#4a2c0466'; context.shadowBlur = 34; context.shadowOffsetY = 16;
  stripPath(context, w, h); context.fillStyle = '#fffef7'; context.fill();
  context.restore();
  const money = fordo.money && (fordo.budget !== null || pricedCount(fordo.items) > 0);
  const footer = money ? 250 : 110;
  // Short lists get taller lines and bigger writing, so the card stays readable at feed size.
  const row = Math.max(ROW, Math.min(ROW_MAX, Math.floor((h - footer - FIRST_RULE) / Math.max(fordo.items.length, 1))));
  const rows = Math.floor((h - footer - FIRST_RULE) / row);
  context.save();
  stripPath(context, w, h); context.clip();
  context.strokeStyle = RULE; context.lineWidth = 2;
  for (let y = FIRST_RULE; y < h - 20; y += row) { context.beginPath(); context.moveTo(0, y); context.lineTo(w, y); context.stroke(); }
  context.strokeStyle = '#eba9a3'; context.lineWidth = 3;
  context.beginPath(); context.moveTo(84, 0); context.lineTo(84, h); context.stroke();
  context.restore();
  // A strip of tape holding it down.
  context.save();
  context.translate(w / 2, 4); context.rotate(0.05);
  context.fillStyle = '#ffffffa6'; context.fillRect(-90, -26, 180, 52);
  context.restore();

  fitText(context, [{ text: fordoTitle(fordo), color: PEN, weight: 700, display: true }], 110, 118, 58, w - 150);
  fitText(context, [{ text: `${bn(fordo.items.length)}টা জিনিস`, color: PEN_SOFT, weight: 600 }], 110, 172, 28, w - 150);

  const columns = fordo.items.length > rows ? 2 : 1;
  const capacity = rows * columns;
  const shown = fordo.items.length > capacity ? fordo.items.slice(0, capacity - 1) : fordo.items;
  const columnWidth = (w - 140) / columns;
  shown.forEach((item, index) => {
    const column = Math.floor(index / rows), line = index % rows;
    const x = 110 + column * columnWidth, y = FIRST_RULE + line * row + row - 14;
    const right = x + columnWidth - (columns === 2 && column === 0 ? 24 : 0);
    const quantity = `${formatQuantity(item.quantity)} ${units[item.unit]}`;
    const size = Math.round(row * 0.58);
    context.font = `500 ${size - 6}px "Bangla"`;
    const quantityWidth = Math.min(context.measureText(quantity).width, columnWidth * 0.42);
    fitText(context, [{ text: `${bn(index + 1)}. `, color: PEN_SOFT, weight: 500 }, { text: item.name, color: PEN, weight: 600, display: true }], x, y, size, right - x - quantityWidth - 16);
    fitText(context, [{ text: quantity, color: PEN_SOFT, weight: 500 }], right, y, size - 6, quantityWidth, 'right');
  });
  if (shown.length < fordo.items.length) {
    const index = shown.length;
    fitText(context, [{ text: `আরও ${bn(fordo.items.length - index)}টা জিনিস…`, color: PEN_SOFT, weight: 600 }], 110 + Math.floor(index / rows) * columnWidth, FIRST_RULE + (index % rows) * row + row - 14, 28, columnWidth - 24);
  }

  let y = h - footer + 30;
  if (money) {
    const priced = pricedCount(fordo.items);
    const total = basketTotal(fordo);
    context.strokeStyle = PEN; context.lineWidth = 3;
    for (const offset of [0, 7]) { context.beginPath(); context.moveTo(110, y + offset); context.lineTo(w - 40, y + offset); context.stroke(); }
    y += 56;
    if (priced) fitText(context, [{ text: 'হিসাব ', color: PEN_SOFT, weight: 500 }, { text: `${formatTaka(total)} টাকা`, color: PEN, weight: 700, display: true }], 110, y, 34, 330);
    if (fordo.budget !== null) fitText(context, [{ text: 'বাজেট ', color: PEN_SOFT, weight: 500 }, { text: `${formatTaka(fordo.budget)} টাকা`, color: PEN, weight: 700, display: true }], w - 40, y, 34, 330, 'right');
    if (priced && fordo.budget !== null) {
      const left = fordo.budget - total;
      y += 46;
      fitText(context, [{ text: left < 0 ? `${formatTaka(-left)} টাকা বেশি হয়ে যাচ্ছে` : `বাকি থাকবে ${formatTaka(left)} টাকা`, color: left < 0 ? RED : GREEN, weight: 700 }], w - 40, y, 28, 500, 'right');
    }
    y = h - 42;
  } else y = h - 52;
  fitText(context, [{ text: fordoLine(fordo), color: RED, weight: 700, display: true }], 110, y, 38, w - 150);
  context.restore();

  drawFooterBand(context, format, 'তোমাদের বাসায় বাজার কে করে?', site, { band: NAVY, ask: '#ffd166', site: '#ffffff' });
}

export const fordoBlob = (fordo: Fordo, format: CardFormat, site: string) => renderCard(canvas => drawFordo(canvas, fordo, format, site));
