import { cardSizes, drawFooterBand, fitText, renderCard, type CardFormat } from '../../../shared/card-canvas';
import type { cardText } from './postcard';

type CardText = ReturnType<typeof cardText>;
const PAPER = '#f4ead4';
const INK = '#33402f';
const MUTED = '#7d7962';
const RED = '#a8432c';
const POSTMARK = 'rgba(46,58,92,.8)';
const PHOTO = { x: 60, width: 960, height: 760 } as const;

/** Rasterises the scene SVG without the editing marks, so the card canvas can print it as the postcard's photo. */
export async function svgImage(svg: SVGSVGElement, width: number, height: number) {
  const copy = svg.cloneNode(true) as SVGSVGElement;
  copy.querySelectorAll('[data-export-ignore]').forEach(node => node.remove());
  copy.setAttribute('width', String(width));
  copy.setAttribute('height', String(height));
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(copy)], { type: 'image/svg+xml' }));
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function seeded(seed: number) {
  return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32; };
}

function drawPaper(context: CanvasRenderingContext2D, width: number, height: number) {
  context.fillStyle = PAPER;
  context.fillRect(0, 0, width, height);
  const random = seeded(5);
  // Old card stock: a few tea-coloured age patches, then fine fibre specks.
  for (let index = 0; index < 9; index++) {
    const x = random() * width, y = random() * height, radius = 160 + random() * 320;
    const stain = context.createRadialGradient(x, y, 0, x, y, radius);
    stain.addColorStop(0, 'rgba(150,110,50,.07)');
    stain.addColorStop(1, 'rgba(150,110,50,0)');
    context.fillStyle = stain;
    context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  for (let index = 0; index < 2600; index++) {
    context.fillStyle = random() > 0.4 ? 'rgba(90,70,30,.08)' : 'rgba(255,255,255,.35)';
    context.fillRect(random() * width, random() * height, 1 + random() * 2, 1 + random() * 2);
  }
}

/** A perforated stamp with a kite on it, drawn off-screen so the perforation bites are real holes. */
function stamp() {
  const canvas = document.createElement('canvas');
  canvas.width = 168; canvas.height = 200;
  const context = canvas.getContext('2d')!;
  context.fillStyle = '#fffaf0';
  context.fillRect(0, 0, 168, 200);
  context.globalCompositeOperation = 'destination-out';
  for (let x = 0; x <= 168; x += 16.8) for (const y of [0, 200]) { context.beginPath(); context.arc(x, y, 6, 0, Math.PI * 2); context.fill(); }
  for (let y = 0; y <= 200; y += 20) for (const x of [0, 168]) { context.beginPath(); context.arc(x, y, 6, 0, Math.PI * 2); context.fill(); }
  context.globalCompositeOperation = 'source-over';
  context.fillStyle = '#3f765a';
  context.fillRect(16, 16, 136, 168);
  context.fillStyle = '#f0cf86';
  context.beginPath(); context.arc(118, 66, 13, 0, Math.PI * 2); context.fill();
  context.save();
  context.translate(70, 92); context.rotate(-0.25);
  context.fillStyle = '#d9583b';
  context.beginPath(); context.moveTo(0, -36); context.lineTo(26, 0); context.lineTo(0, 40); context.lineTo(-26, 0); context.closePath(); context.fill();
  context.strokeStyle = '#fff3d6'; context.lineWidth = 2.5;
  context.beginPath(); context.moveTo(0, -36); context.lineTo(0, 40); context.moveTo(-26, 0); context.lineTo(26, 0); context.stroke();
  context.beginPath(); context.moveTo(0, 40); context.bezierCurveTo(-14, 56, 14, 66, -4, 82); context.stroke();
  context.restore();
  fitText(context, [{ text: 'বাংলাদেশ', color: '#fff3d6', weight: 700 }], 84, 48, 20, 120, 'center');
  fitText(context, [{ text: '৳২', color: '#fff3d6', weight: 800, display: true }], 140, 172, 28, 60, 'right');
  return canvas;
}

function drawPostmark(context: CanvasRenderingContext2D, x: number, y: number, text: CardText) {
  context.save();
  context.translate(x, y);
  context.rotate(-0.14);
  context.strokeStyle = POSTMARK;
  context.lineWidth = 4;
  context.beginPath(); context.arc(0, 0, 90, 0, Math.PI * 2); context.stroke();
  context.lineWidth = 2;
  context.beginPath(); context.arc(0, 0, 80, 0, Math.PI * 2); context.stroke();
  fitText(context, [{ text: 'ডাকঘর', color: POSTMARK, weight: 600 }], 0, -34, 20, 120, 'center');
  fitText(context, [{ text: text.place, color: POSTMARK, weight: 800, display: true }], 0, 12, 34, 140, 'center');
  if (text.district) fitText(context, [{ text: text.district, color: POSTMARK, weight: 600 }], 0, 48, 20, 120, 'center');
  // Cancellation waves run across the stamp.
  context.lineWidth = 3;
  for (let row = -1.5; row <= 1.5; row++) {
    context.beginPath();
    for (let dx = 96; dx <= 300; dx += 4) { const dy = row * 22 + Math.sin(dx / 14) * 6; if (dx === 96) context.moveTo(dx, dy); else context.lineTo(dx, dy); }
    context.stroke();
  }
  context.restore();
}

const layouts = {
  feed: { photoY: 64, greetY: 920, placeY: 1018, placeSize: 88, lineY: 1098, signY: 1182 },
  story: { photoY: 300, greetY: 1172, placeY: 1274, placeSize: 96, lineY: 1360, signY: 1452 },
} as const;

export function drawCard(canvas: HTMLCanvasElement, scene: CanvasImageSource, text: CardText, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('এই ব্রাউজারে ছবি বানানো যাচ্ছে না।');
  drawPaper(context, width, height);

  // The photo, printed with a white border and lifted a little off the card.
  context.save();
  context.shadowColor = 'rgba(60,45,20,.28)'; context.shadowBlur = 18; context.shadowOffsetY = 6;
  context.fillStyle = '#fffdf6';
  context.fillRect(PHOTO.x - 16, layout.photoY - 16, PHOTO.width + 32, PHOTO.height + 32);
  context.restore();
  context.drawImage(scene, PHOTO.x, layout.photoY, PHOTO.width, PHOTO.height);
  context.fillStyle = 'rgba(190,150,80,.08)';
  context.fillRect(PHOTO.x, layout.photoY, PHOTO.width, PHOTO.height);

  context.save();
  context.translate(918, layout.photoY + 86);
  context.rotate(0.06);
  context.shadowColor = 'rgba(60,45,20,.25)'; context.shadowBlur = 6; context.shadowOffsetY = 2;
  context.drawImage(stamp(), -84, -100);
  context.restore();
  drawPostmark(context, 770, layout.photoY + 150, text);

  fitText(context, [{ text: 'শুভেচ্ছা,', color: MUTED, weight: 600, display: true }], 64, layout.greetY, 46, 900);
  fitText(context, [{ text: text.greeting, color: INK, weight: 800, display: true }], 60, layout.placeY, layout.placeSize, 960);
  fitText(context, [{ text: text.line, color: INK, weight: 600, display: true }], 64, layout.lineY, 38, 950);
  if (text.signature) fitText(context, [{ text: text.signature, color: RED, weight: 700, display: true }], 1020, layout.signY, 44, 620, 'right');
  if (format === 'story') {
    context.strokeStyle = 'rgba(80,90,60,.35)'; context.lineWidth = 2; context.setLineDash([6, 8]);
    context.beginPath(); context.moveTo(64, 1572); context.lineTo(1016, 1572); context.stroke();
    context.setLineDash([]);
    fitText(context, [{ text: 'প্রাপক: ', color: MUTED, weight: 600 }, { text: 'যে বন্ধু এটা দেখছে', color: INK, weight: 700, display: true }], 64, 1548, 36, 950);
  }
  drawFooterBand(context, format, 'তোমার পাড়াটা কেমন ছিল?', site, { band: INK, ask: '#f3d27a', site: '#fffaf0' });
}

export const cardBlob = (scene: CanvasImageSource, text: CardText, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, scene, text, format, site));
