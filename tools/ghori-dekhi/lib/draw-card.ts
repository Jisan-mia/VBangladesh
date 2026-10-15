// The parent card (1080×1350): a clock at the round's last time, the day's times in order, what was done, no name.
import { cardSizes, drawFooterBand, fitText, renderCard } from "../../../shared/card-canvas";
import { doneLine, levelOf, say, starsOf, type Item } from "./day";
import { bn, hands, partOf } from "./time";

const colors = { paper: "#f3f8fb", ink: "#1f2d38", muted: "#557083", accent: "#24607a", hand: "#d9480f", rim: "#24607a", star: "#f2a516", starOff: "#cbd8e0", band: "#17475b", ask: "#ffd166" };
const PART_DOT: Record<string, string> = { "ভোর": "#f2a37a", "সকাল": "#f2c230", "দুপুর": "#f08c00", "বিকেল": "#e8590c", "সন্ধ্যা": "#845ef7", "রাত": "#364fc7" };

function clock(c: CanvasRenderingContext2D, x: number, y: number, r: number, total: number) {
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = "#fff"; c.fill();
  c.lineWidth = r * 0.06; c.strokeStyle = colors.rim; c.stroke();
  for (let i = 0; i < 60; i++) {
    const a = i * Math.PI / 30, big = i % 5 === 0, out = r * 0.9, inner = r * (big ? 0.8 : 0.85);
    c.beginPath(); c.moveTo(x + Math.sin(a) * out, y - Math.cos(a) * out); c.lineTo(x + Math.sin(a) * inner, y - Math.cos(a) * inner);
    c.lineWidth = big ? 4 : 2; c.strokeStyle = big ? colors.ink : "#9fb3c1"; c.stroke();
  }
  c.textBaseline = "middle";
  for (let n = 1; n <= 12; n++) {
    const a = n * Math.PI / 6;
    fitText(c, [{ text: bn(n), color: colors.ink, weight: 700 }], x + Math.sin(a) * r * 0.66, y - Math.cos(a) * r * 0.66 + 4, r * 0.17, r * 0.4, "center");
  }
  c.textBaseline = "alphabetic";
  const { hour, minute } = hands(total);
  const hand = (deg: number, length: number, width: number, color: string) => {
    const a = deg * Math.PI / 180;
    c.beginPath(); c.moveTo(x - Math.sin(a) * r * 0.1, y + Math.cos(a) * r * 0.1); c.lineTo(x + Math.sin(a) * length, y - Math.cos(a) * length);
    c.lineWidth = width; c.lineCap = "round"; c.strokeStyle = color; c.stroke();
  };
  hand(hour, r * 0.48, r * 0.075, colors.ink);
  hand(minute, r * 0.74, r * 0.045, colors.hand);
  c.beginPath(); c.arc(x, y, r * 0.05, 0, Math.PI * 2); c.fillStyle = colors.ink; c.fill();
}

function star(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string) {
  c.beginPath();
  for (let i = 0; i < 10; i++) { const angle = -Math.PI / 2 + i * Math.PI / 5, radius = i % 2 ? r * 0.45 : r; c.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius); }
  c.closePath(); c.fillStyle = fill; c.fill();
}

export function drawCard(canvas: HTMLCanvasElement, level: number, items: readonly Item[], mistakes: number, site: string) {
  const { width, height } = cardSizes.feed;
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  c.fillStyle = colors.paper; c.fillRect(0, 0, width, height);

  fitText(c, [{ text: `ঘড়ি দেখি · লেভেল ${bn(level)} · ${levelOf(level).title}`, color: colors.muted, weight: 700, display: true }], width / 2, 104, 36, 960, "center");
  fitText(c, [{ text: doneLine(items.length), color: colors.ink, weight: 800, display: true }], width / 2, 200, 68, 980, "center");
  const stars = starsOf(mistakes);
  for (let i = 0; i < 3; i++) star(c, width / 2 + (i - 1) * 80, 280, 30, i < stars ? colors.star : colors.starOff);

  const last = items.at(-1);
  if (last) clock(c, 290, 660, 230, last.time.h * 60 + last.time.m);

  // The day, in order, beside the clock.
  const top = 450, row = Math.min(96, 540 / Math.max(1, items.length));
  items.forEach((item, i) => {
    const y = top + i * row;
    c.beginPath(); c.arc(566, y - 12, 12, 0, Math.PI * 2); c.fillStyle = PART_DOT[partOf(item.time.h)]; c.fill();
    fitText(c, [{ text: say(item.time, 5), color: colors.ink, weight: 800 }], 592, y, 38, 440);
    fitText(c, [{ text: item.activity.name, color: colors.muted, weight: 600 }], 592, y + 38, 30, 440);
  });

  fitText(c, [{ text: mistakes ? `${bn(mistakes)}বার আবার দেখে মিলিয়েছি` : "একবারও আটকাইনি", color: colors.muted, weight: 600 }], width / 2, 1090, 38, 960, "center");
  drawFooterBand(c, "feed", "আজ খাওয়ার সময় জিজ্ঞেস করো: কয়টা বাজে?", site, { band: colors.band, ask: colors.ask, site: "#ffffff" });
}

export const cardBlob = (level: number, items: readonly Item[], mistakes: number, site: string) => renderCard(canvas => drawCard(canvas, level, items, mistakes, site));
