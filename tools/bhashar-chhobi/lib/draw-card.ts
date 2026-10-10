import { cardSizes, drawFooterBand, fitText, renderCard, type CardFormat } from '../../../shared/card-canvas';
import { districtName } from './districts';
import type { CardText, LanguageCard, ObjectId } from './cards';

const BG = '#2a3f86';
const CREAM = '#fff6e3';
const SOFT = '#c9d3f2';
const YELLOW = '#ffd166';
const STAMP = '#e0452f';

const images = new Map<ObjectId, Promise<HTMLImageElement>>();

/** The object's picture as an image, made from the same SVG the picker shows (an <svg data-art="id"> on the page). */
export function objectImage(id: ObjectId): Promise<HTMLImageElement> {
  const cached = images.get(id);
  if (cached) return cached;
  const svg = document.querySelector<SVGSVGElement>(`svg[data-art="${id}"]`);
  if (!svg) return Promise.reject(new Error('ছবিটা পাওয়া গেল না।'));
  const copy = svg.cloneNode(true) as SVGSVGElement;
  copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  copy.setAttribute('width', '640');
  copy.setAttribute('height', '640');
  const loading = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => { images.delete(id); reject(new Error('ছবিটা বানানো গেল না।')); };
    image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(copy));
  });
  images.set(id, loading);
  return loading;
}

/** A rubber-stamp seal with the district's name, the "proud of where I'm from" mark. */
function drawStamp(context: CanvasRenderingContext2D, name: string, x: number, y: number) {
  context.save();
  context.translate(x, y);
  context.rotate(-0.2);
  context.strokeStyle = STAMP;
  context.fillStyle = CREAM;
  context.lineWidth = 8;
  context.beginPath(); context.arc(0, 0, 112, 0, Math.PI * 2); context.fill(); context.stroke();
  context.lineWidth = 3;
  context.beginPath(); context.arc(0, 0, 96, 0, Math.PI * 2); context.stroke();
  for (let index = 0; index < 24; index++) {
    const angle = (index / 24) * Math.PI * 2;
    context.fillStyle = STAMP;
    context.beginPath(); context.arc(Math.cos(angle) * 104, Math.sin(angle) * 104, 2.5, 0, Math.PI * 2); context.fill();
  }
  fitText(context, [{ text: name, color: STAMP, weight: 800, display: true }], 0, 12, 50, 160, 'center');
  fitText(context, [{ text: 'জেলা', color: STAMP, weight: 700 }], 0, 56, 28, 120, 'center');
  fitText(context, [{ text: 'আমাদের শব্দ', color: STAMP, weight: 600 }], 0, -44, 22, 130, 'center');
  context.restore();
}

const layouts = {
  feed: { kicker: 150, art: 476, radius: 260, word: 920, stamp: 286 },
  story: { kicker: 390, art: 770, radius: 290, word: 1270, stamp: 570 },
} as const;

export function drawCard(canvas: HTMLCanvasElement, card: LanguageCard, text: CardText, format: CardFormat, site: string, art?: HTMLImageElement | null) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('এই ব্রাউজারে ছবি বানানো যাচ্ছে না।');
  context.fillStyle = BG;
  context.fillRect(0, 0, width, height);
  if (format === 'story') fitText(context, [{ text: 'আমাদের এলাকায় বলে… · একটুখানি', color: SOFT, weight: 600 }], width / 2, 200, 30, 900, 'center');

  fitText(context, [{ text: text.place, color: YELLOW, weight: 800, display: true }, { text: ' এটাকে বলে', color: CREAM, weight: 700, display: true }], width / 2, layout.kicker, 62, 940, 'center');

  context.fillStyle = CREAM;
  context.beginPath(); context.arc(width / 2, layout.art, layout.radius, 0, Math.PI * 2); context.fill();
  context.strokeStyle = YELLOW;
  context.lineWidth = 6;
  context.setLineDash([2, 16]);
  context.lineCap = 'round';
  context.beginPath(); context.arc(width / 2, layout.art, layout.radius + 22, 0, Math.PI * 2); context.stroke();
  context.setLineDash([]);
  const size = layout.radius * 1.85;
  if (art) context.drawImage(art, width / 2 - size / 2, layout.art - size / 2, size, size);
  if (card.district) drawStamp(context, districtName(card.district), 850, layout.stamp);

  fitText(context, [{ text: text.word, color: YELLOW, weight: 800, display: true }], width / 2, layout.word, 168, 940, 'center');
  // Big Bangla letters hang far below the baseline, so the first line under the word keeps a wide gap.
  let y = layout.word + 112;
  if (text.bookName) { fitText(context, [{ text: `বইয়ের ভাষায়: ${text.bookName}`, color: SOFT, weight: 500 }], width / 2, y, 34, 900, 'center'); y += 66; }
  fitText(context, [{ text: text.line, color: CREAM, weight: 600 }], width / 2, y, 36, 940, 'center');
  if (text.match) fitText(context, [{ text: text.match, color: YELLOW, weight: 700 }], width / 2, y + 64, 36, 940, 'center');
  drawFooterBand(context, format, 'তোমাদের ওখানে কী বলে?', site, { band: '#16224f', ask: YELLOW, site: CREAM });
}

export async function cardBlob(card: LanguageCard, text: CardText, format: CardFormat, site: string) {
  const art = await objectImage(card.objectId).catch(() => null);
  return renderCard(canvas => drawCard(canvas, card, text, format, site, art));
}
