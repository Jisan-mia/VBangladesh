import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, type CardFormat } from '../../../shared/card-canvas';
import { fareSource, stations } from './fares';
import { bn, type Ticket } from './ticket';

const GREEN = '#15544b';
const DEEP = '#0c3b34';
const MINT = '#cfe5dc';
const PAPER = '#fffdf6';
const INK = '#14302a';
const MUTED = '#5b726b';
const YELLOW = '#ffd166';

function routeStrip(context: CanvasRenderingContext2D, ticket: Ticket, left: number, right: number, y: number) {
  const step = (right - left) / (stations.length - 1);
  const [low, high] = [Math.min(ticket.from, ticket.to), Math.max(ticket.from, ticket.to)];
  context.lineCap = 'round';
  context.strokeStyle = '#d5e0db'; context.lineWidth = 6;
  context.beginPath(); context.moveTo(left, y); context.lineTo(right, y); context.stroke();
  context.strokeStyle = GREEN; context.lineWidth = 12;
  context.beginPath(); context.moveTo(left + low * step, y); context.lineTo(left + high * step, y); context.stroke();
  stations.forEach((_, index) => {
    const end = index === ticket.from || index === ticket.to;
    const ridden = index > low && index < high;
    context.beginPath(); context.arc(left + index * step, y, end ? 18 : 8, 0, Math.PI * 2);
    context.fillStyle = end ? PAPER : ridden ? GREEN : '#c3d2cc'; context.fill();
    if (end) { context.lineWidth = 8; context.strokeStyle = GREEN; context.stroke(); }
  });
}

const layouts = {
  feed: { top: 150, gap: 1, label: 92, after: 92 },
  story: { top: 410, gap: 1.12, label: 340, after: 110 },
} as const;

export function drawTicket(canvas: HTMLCanvasElement, ticket: Ticket, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('এই ব্রাউজারে ছবি বানানো যাচ্ছে না।');
  const g = (value: number) => Math.round(value * layout.gap);

  context.fillStyle = GREEN;
  context.fillRect(0, 0, width, height);
  fitText(context, [{ text: 'মেট্রোরেলের ভাড়া', color: YELLOW, weight: 700, display: true }, { text: '  ·  উত্তরা উত্তর থেকে মতিঝিল', color: MINT }], 90, layout.label, 34, 900);

  const x = 90, w = 900, top = layout.top, h = g(860);
  context.save();
  context.shadowColor = '#0006'; context.shadowBlur = 40; context.shadowOffsetY = 16;
  context.fillStyle = PAPER; roundedRect(context, x, top, w, h, 30); context.fill();
  context.restore();
  context.save(); roundedRect(context, x, top, w, h, 30); context.clip();
  context.fillStyle = YELLOW; context.fillRect(x, top, w, 92);
  context.restore();
  fitText(context, [{ text: 'ভাড়ার হিসাব', color: INK, weight: 800, display: true }], x + 48, top + 62, 38, 420);
  fitText(context, [{ text: 'একক যাত্রা · একজন', color: INK, weight: 600 }], x + w - 48, top + 60, 28, 380, 'right');

  let y = top + 92 + g(80);
  fitText(context, [{ text: 'থেকে', color: MUTED, weight: 600 }], x + 60, y, 30, 300);
  fitText(context, [{ text: ticket.fromName, color: INK, weight: 800, display: true }], x + 60, y + g(78), 74, w - 120);
  y += g(150);
  routeStrip(context, ticket, x + 80, x + w - 80, y);
  y += g(90);
  fitText(context, [{ text: 'পর্যন্ত', color: MUTED, weight: 600 }], x + 60, y, 30, 300);
  fitText(context, [{ text: ticket.toName, color: INK, weight: 800, display: true }], x + 60, y + g(78), 74, w - 120);

  // Perforation: a dashed tear line with half-circle bites out of both edges.
  y += g(140);
  context.setLineDash([16, 14]); context.strokeStyle = '#b9c9c2'; context.lineWidth = 4;
  context.beginPath(); context.moveTo(x + 50, y); context.lineTo(x + w - 50, y); context.stroke();
  context.setLineDash([]);
  context.fillStyle = GREEN;
  for (const cx of [x, x + w]) { context.beginPath(); context.arc(cx, y, 28, 0, Math.PI * 2); context.fill(); }

  y += g(70);
  fitText(context, [{ text: 'একজনের ভাড়া', color: MUTED, weight: 600 }], x + 60, y, 30, 380);
  fitText(context, [{ text: `${bn(ticket.people)} জন · ${ticket.journey}`, color: MUTED, weight: 600 }], x + w - 60, y, 30, 380, 'right');
  y += g(112);
  fitText(context, [{ text: bn(ticket.fare), color: GREEN, weight: 800, display: true }, { text: ' টাকা', color: GREEN, weight: 700 }], x + 60, y, 120, 440);
  fitText(context, [{ text: 'মোট ', color: INK, weight: 600 }, { text: `${bn(ticket.total)} টাকা`, color: INK, weight: 800, display: true }], x + w - 60, y - 6, 54, 400, 'right');
  fitText(context, [{ text: 'এটা টিকিট না, ভাড়ার হিসাব। কোনো ছাড় ধরা নেই।', color: MUTED }], x + w / 2, top + h - 36, 24, w - 120, 'center');

  y = top + h + layout.after;
  fitText(context, [{ text: ticket.line, color: '#ffffff', weight: 700, display: true }], 90, y, 42, 900);
  fitText(context, [{ text: `ভাড়া: ডিএমটিসিএলের সরকারি তালিকা (${fareSource.published}), মিলিয়ে দেখা ${fareSource.checked}`, color: MINT }], 90, y + 58, 24, 900);
  drawFooterBand(context, format, 'তোমার স্টেশন থেকে কত?', site, { band: DEEP, ask: YELLOW, site: '#ffffff' });
}

export const ticketBlob = (ticket: Ticket, format: CardFormat, site: string) => renderCard(canvas => drawTicket(canvas, ticket, format, site));
