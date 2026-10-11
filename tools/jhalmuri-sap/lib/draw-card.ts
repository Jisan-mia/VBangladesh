import { cardSizes, drawFooterBand, fitText, renderCard, BODY_FONT, DISPLAY_FONT, type CardFormat, type Segment } from "../../../shared/card-canvas";
import { drawFood, drawHead, drawThonga, palette } from "./art";
import { bn, type Shared } from "./link";
import { humanLine, type Kind } from "./snake";

/** A mustard-yellow card: the snake popping out of a ঝালমুড়ির ঠোঙা, a golden chilli at its nose, and the score in chilli red. */
export function drawCard(canvas: HTMLCanvasElement, shared: Pick<Shared, "score" | "name">, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width;
  canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  // Feed positions; the story stretches them into its taller safe area (290–1650, clear of storySafe and the footer band).
  const y = (feedY: number) => format === "feed" ? feedY : 290 + (feedY - 70) * 1.15;
  const cx = width / 2;

  const glow = c.createRadialGradient(cx, y(520), 80, cx, y(520), 900);
  glow.addColorStop(0, "#f8cf5a"); glow.addColorStop(1, "#e9a51c");
  c.fillStyle = glow;
  c.fillRect(0, 0, width, height);
  // Scattered মুড়ি on the table.
  for (const [x, at, size] of [[120, 300, 20], [960, 380, 18], [90, 760, 22], [1000, 820, 20], [180, 980, 16], [930, 1060, 18], [830, 250, 14]]) drawFood(c, "muri", x, y(at), size);
  const table: Array<[Kind, number, number, number]> = [["chanachur", 170, 470, 40], ["peyaj", 900, 560, 38], ["morich", 230, 800, 44], ["tetul", 860, 860, 42], ["chanachur", 980, 720, 30]];
  for (const [kind, x, at, size] of table) drawFood(c, kind, x, y(at), size);

  const title: Segment[] = [{ text: "ঝালমুড়ি সাপ", color: palette.ink, weight: 800, display: true }];
  if (shared.name) title.push({ text: " · ", color: palette.ink, weight: 600 }, { text: shared.name, color: palette.chilli, weight: 800, display: true });
  title.push({ text: " · ", color: palette.ink, weight: 600 }, { text: bn(shared.score), color: palette.chilli, weight: 800, display: true });
  fitText(c, title, cx, y(140), 60, 900, "center");

  drawThonga(c, cx - 30, y(560), y(880), 230);
  // The snake rises out of the heap in an S and looks at the golden chilli.
  const points: Array<[number, number]> = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    points.push([cx - 70 + 250 * t + 95 * Math.sin(t * Math.PI * 2.1), y(520) - (y(520) - y(290)) * t]);
  }
  c.lineCap = "round"; c.lineJoin = "round";
  for (const [lineWidth, color] of [[78, palette.snakeEdge], [62, palette.snake]] as const) {
    c.lineWidth = lineWidth; c.strokeStyle = color;
    c.beginPath(); points.forEach(([px, py], index) => index ? c.lineTo(px, py) : c.moveTo(px, py)); c.stroke();
  }
  c.fillStyle = palette.spot;
  for (let i = 3; i < points.length - 3; i += 4) { c.beginPath(); c.arc(points[i][0], points[i][1], 9, 0, Math.PI * 2); c.fill(); }
  const [hx, hy] = points[points.length - 1], [bx, by] = points[points.length - 3];
  drawHead(c, hx, hy, 50, Math.atan2(hy - by, hx - bx) * 0.3, false, true);
  drawFood(c, "sonali", hx + 150, hy + 10, 44);

  // The number leads; "পয়েন্ট" sits smaller beside it, the pair centred together.
  const number = bn(shared.score);
  c.font = `800 210px ${DISPLAY_FONT}`;
  const numberWidth = Math.min(700, c.measureText(number).width);
  c.font = `700 64px ${BODY_FONT}`;
  const left = cx - (numberWidth + 20 + c.measureText("পয়েন্ট").width) / 2;
  fitText(c, [{ text: number, color: palette.chilli, weight: 800, display: true }], left, y(1060), 210, 700);
  fitText(c, [{ text: "পয়েন্ট", color: palette.ink, weight: 700 }], left + numberWidth + 20, y(1060), 64, 260);
  fitText(c, [{ text: humanLine(shared.score), color: palette.ink, weight: 700 }], cx, y(1160), 50, 900, "center");
  drawFooterBand(c, format, "তুমি কত পারবে?", site, { band: palette.ink, ask: palette.gold, site: "#ffffff" });
}

export const cardBlob = (shared: Pick<Shared, "score" | "name">, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, shared, format, site));
