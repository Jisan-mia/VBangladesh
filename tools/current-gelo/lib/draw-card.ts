import { DISPLAY_FONT, cardSizes, drawFooterBand, fitText, renderCard, roundedRect, wrapText, type CardFormat } from "../../../shared/card-canvas";
import { CROWD_NOTE, bn, candleLeft, divisionOf, humanLine, weekdayLabel, dateLabel, whenLabel, type Crowd, type Day } from "./gelo";

export type CardData = Day & { today: string; crowd: Crowd | null };

const AMBER = "#ffc35a";
// A dark wall lit by the candle; on a day the power never went, the lime-washed wall in tube light.
const palettes = {
  dark: { wall: ["#182a31", "#27424a"], text: "#fbeedd", big: AMBER, soft: "#e9cf9f" },
  bright: { wall: ["#dcefe9", "#c2ded5"], text: "#1b2a30", big: "#24607a", soft: "#4d6168" },
} as const;

const layouts = {
  feed: { kicker: 140, when: 252, big: 424, rest: 512, times: 650, line: 738, crowd: 928, table: 1130, candle: 470, cx: 812 },
  story: { kicker: 336, when: 452, big: 640, rest: 730, times: 900, line: 990, crowd: 1236, table: 1480, candle: 600, cx: 812 },
} as const;

function drawSwitchboard(context: CanvasRenderingContext2D, x: number, y: number) {
  roundedRect(context, x, y, 160, 196, 20);
  context.fillStyle = "#efe7d6"; context.fill();
  context.strokeStyle = "#c9bc9f"; context.lineWidth = 3; context.stroke();
  context.fillStyle = "#b5a888";
  for (const [sx, sy] of [[x + 18, y + 18], [x + 142, y + 18], [x + 18, y + 178], [x + 142, y + 178]]) { context.beginPath(); context.arc(sx, sy, 6, 0, Math.PI * 2); context.fill(); }
  for (const left of [x + 30, x + 86]) {
    roundedRect(context, left, y + 40, 44, 116, 10);
    context.fillStyle = "#fbf8f1"; context.fill();
    context.strokeStyle = "#a99c7e"; context.lineWidth = 2.5; context.stroke();
    // The rocker's lower half is pressed in: switched on, but the line is dead.
    context.fillStyle = "#e3d9c3";
    roundedRect(context, left + 4, y + 100, 36, 52, 8); context.fill();
  }
}

function drawCandle(context: CanvasRenderingContext2D, cx: number, base: number, maxHeight: number, minutes: number) {
  const height = Math.round(maxHeight * candleLeft(minutes));
  const top = base - height, half = 50, lit = minutes > 0;
  // steel saucer, with the day's melted wax pooled on it
  context.fillStyle = "#8e9aa1";
  context.beginPath(); context.ellipse(cx, base + 12, 160, 34, 0, 0, Math.PI * 2); context.fill();
  context.fillStyle = "#c3ccd1";
  context.beginPath(); context.ellipse(cx, base + 4, 150, 28, 0, 0, Math.PI * 2); context.fill();
  context.fillStyle = "#f3e7cd";
  context.beginPath(); context.ellipse(cx, base + 4, half + 14 + Math.min(70, minutes / 8), 16, 0, 0, Math.PI * 2); context.fill();
  // body
  const body = context.createLinearGradient(cx - half, 0, cx + half, 0);
  body.addColorStop(0, "#fff9ee"); body.addColorStop(0.6, "#f2e6cc"); body.addColorStop(1, "#d9c8a6");
  context.fillStyle = body;
  context.fillRect(cx - half, top, half * 2, height);
  context.beginPath(); context.ellipse(cx, base, half, 12, 0, 0, Math.PI); context.fill();
  // drips grow as the candle burns
  if (lit) {
    context.fillStyle = "#fbf3e2";
    const drip = Math.min(height - 20, 30 + minutes / 6);
    for (const [x, length] of [[cx - half + 8, drip], [cx + 14, drip * 0.55], [cx + half - 10, drip * 0.8]] as const) {
      roundedRect(context, x - 8, top, 16, length, 8); context.fill();
    }
  }
  context.fillStyle = "#f8eedb";
  context.beginPath(); context.ellipse(cx, top, half, 12, 0, 0, Math.PI * 2); context.fill();
  // wick
  context.strokeStyle = "#2b211a"; context.lineWidth = 6; context.lineCap = "round";
  context.beginPath(); context.moveTo(cx, top - 2); context.quadraticCurveTo(cx + 2, top - 16, cx + 5, top - 28); context.stroke();
  if (!lit) return;
  const flameBase = top - 22;
  const glow = context.createRadialGradient(cx, flameBase - 50, 10, cx, flameBase - 50, 190);
  glow.addColorStop(0, "rgba(255,214,130,0.75)"); glow.addColorStop(1, "rgba(255,214,130,0)");
  context.fillStyle = glow;
  context.fillRect(cx - 200, flameBase - 250, 400, 400);
  const flame = context.createLinearGradient(0, flameBase - 130, 0, flameBase);
  flame.addColorStop(0, "#ff9f2e"); flame.addColorStop(0.55, "#ffd36b"); flame.addColorStop(1, "#fff6d8");
  context.fillStyle = flame;
  context.beginPath();
  context.moveTo(cx + 4, flameBase - 132);
  context.bezierCurveTo(cx + 40, flameBase - 70, cx + 34, flameBase, cx + 4, flameBase);
  context.bezierCurveTo(cx - 28, flameBase, cx - 34, flameBase - 64, cx + 4, flameBase - 132);
  context.fill();
  context.fillStyle = "rgba(120,170,255,0.55)";
  context.beginPath(); context.ellipse(cx + 3, flameBase - 10, 9, 14, 0, 0, Math.PI * 2); context.fill();
}

function drawTable(context: CanvasRenderingContext2D, top: number, bottom: number, width: number) {
  context.fillStyle = "#5e3f27";
  context.fillRect(0, top, width, bottom - top);
  context.fillStyle = "#8a6243";
  context.fillRect(0, top, width, 8);
  context.strokeStyle = "rgba(0,0,0,0.16)"; context.lineWidth = 3;
  for (const y of [top + 40, top + 78]) { context.beginPath(); context.moveTo(0, y); context.bezierCurveTo(width * 0.3, y - 6, width * 0.6, y + 8, width, y - 2); context.stroke(); }
}

export function drawCard(canvas: HTMLCanvasElement, data: CardData, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const { minutes, times } = data;
  const footerTop = format === "story" ? height - 260 : height - 96;

  const ink = palettes[minutes > 0 ? "dark" : "bright"];
  const wall = context.createLinearGradient(0, 0, 0, height);
  wall.addColorStop(0, ink.wall[0]); wall.addColorStop(1, ink.wall[1]);
  context.fillStyle = wall;
  context.fillRect(0, 0, width, height);
  if (minutes === 0) {
    const top = format === "story" ? 250 : 28;
    const light = context.createRadialGradient(width / 2, top, 0, width / 2, top, 520);
    light.addColorStop(0, "rgba(255,255,255,0.8)"); light.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = light;
    context.fillRect(0, 0, width, top + 520);
    roundedRect(context, 300, top - 10, 420, 22, 11);
    context.fillStyle = "#ffffff"; context.fill();
    context.strokeStyle = "#b7c4bf"; context.lineWidth = 4; context.stroke();
  }
  if (minutes > 0) {
    const room = context.createRadialGradient(layout.cx, layout.table - layout.candle * candleLeft(minutes), 40, layout.cx, layout.table - 200, 900);
    room.addColorStop(0, "rgba(255,170,70,0.34)"); room.addColorStop(1, "rgba(255,170,70,0)");
    context.fillStyle = room;
    context.fillRect(0, 0, width, height);
  }
  drawSwitchboard(context, width - 220, format === "story" ? 290 : 70);
  if (format === "story") fitText(context, [{ text: "কারেন্ট গেল! · লোডশেডিংয়ের খাতা", color: ink.soft, weight: 600 }], width / 2, 200, 30, 900, "center");

  const area = divisionOf(data.division);
  const kicker = [data.date ? `${weekdayLabel(data.date)}, ${dateLabel(data.date)}` : "আজকের হিসাব", area ? `${area.label} বিভাগ` : ""].filter(Boolean).join(" · ");
  fitText(context, [{ text: kicker, color: ink.soft, weight: 600 }], 84, layout.kicker, 34, 700);

  const when = whenLabel(data.date, data.today);
  const hours = Math.floor(minutes / 60), rest = minutes % 60;
  const [first, big, after] = minutes === 0 ? [`${when} কারেন্ট`, "যায়নি!", "একবারও না"]
    : hours === 0 ? [when, `${bn(rest)} মিনিট`, "অন্ধকারে"]
    : [when, `${bn(hours)} ঘণ্টা`, rest ? `${bn(rest)} মিনিট অন্ধকারে` : "অন্ধকারে"];
  fitText(context, [{ text: first, color: ink.text, weight: 700, display: true }], 84, layout.when, 76, 600);
  fitText(context, [{ text: big, color: ink.big, weight: 800, display: true }], 84, layout.big, 180, 600);
  fitText(context, [{ text: after, color: ink.text, weight: 700, display: true }], 84, layout.rest, 62, 600);

  if (times > 0) fitText(context, [{ text: `কারেন্ট গেছে ${bn(times)} বার`, color: ink.soft, weight: 700 }], 84, layout.times, 40, 560);
  context.font = `700 46px ${DISPLAY_FONT}`;
  context.fillStyle = ink.text;
  wrapText(context, humanLine(minutes, times), 560, 3).forEach((text, index) => context.fillText(text, 84, layout.line + index * 68));

  if (data.crowd) {
    roundedRect(context, 66, layout.crowd, 590, 128, 22);
    context.fillStyle = "rgba(255,255,255,0.07)"; context.fill();
    context.strokeStyle = "rgba(255,195,90,0.55)"; context.lineWidth = 3; context.stroke();
    fitText(context, [{ text: data.crowd.line, color: ink.big, weight: 700 }], 92, layout.crowd + 56, 36, 540);
    fitText(context, [{ text: `${CROWD_NOTE} (${bn(data.crowd.count)} জন)`, color: ink.soft, weight: 500 }], 92, layout.crowd + 100, 24, 540);
  }

  drawTable(context, layout.table, footerTop, width);
  drawCandle(context, layout.cx, layout.table + 8, layout.candle, minutes);
  drawFooterBand(context, format, "তোমার এলাকায় আজ কত ঘণ্টা?", site, { band: "#10191d", ask: AMBER, site: "#ffffff" });
}

export const cardBlob = (data: CardData, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, data, format, site));
