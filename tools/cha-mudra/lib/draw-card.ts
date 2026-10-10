import { cardSizes, drawFooterBand, fitText, renderCard, type CardFormat } from "../../../shared/card-canvas";
import { amountText, bn, units, type Hisab, type Result } from "./hisab";
import { towerLayout, type Cup, type Ellipse } from "./tower";

// A lime-washed blue tea-stall wall, a wooden shelf and terracotta ভাঁড়.
export const palette = { wallTop: "#2a6a80", wallBottom: "#163f50", clay: "#c4612e", clayLight: "#e08a52", clayDark: "#8a3712", tea: "#c98a4f", teaDark: "#8a5428", plank: "#6b3f22", plankTop: "#9a6237", cream: "#fff4e0", yellow: "#ffcf5a", muted: "#c9dbe0", band: "#3b1f12" } as const;

const layouts = {
  feed: { kicker: 92, label: 76, amount: 84, cups: 118, shelf: 960 },
  story: { kicker: 320, label: 84, amount: 92, cups: 128, shelf: 1320 },
} as const;

function ellipse(context: CanvasRenderingContext2D, { cx, cy, rx, ry }: Ellipse, fill: string) {
  context.beginPath(); context.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); context.fillStyle = fill; context.fill();
}

function drawCup(context: CanvasRenderingContext2D, cup: Cup) {
  const body = new Path2D(cup.body);
  const gradient = context.createLinearGradient(cup.rim.cx - cup.rim.rx, 0, cup.rim.cx + cup.rim.rx, 0);
  gradient.addColorStop(0, palette.clayDark); gradient.addColorStop(0.38, palette.clay); gradient.addColorStop(0.62, palette.clayLight); gradient.addColorStop(1, palette.clayDark);
  context.fillStyle = gradient; context.fill(body);
  context.strokeStyle = "rgba(90,30,8,.55)"; context.lineWidth = Math.max(1, cup.rim.rx * 0.05); context.stroke(new Path2D(cup.band));
  ellipse(context, cup.rim, palette.clayLight);
  ellipse(context, cup.tea, palette.teaDark);
  ellipse(context, { ...cup.tea, rx: cup.tea.rx * 0.82, ry: cup.tea.ry * 0.7 }, palette.tea);
}

function drawSteam(context: CanvasRenderingContext2D, top: Cup) {
  const { cx, cy, rx } = top.rim;
  context.strokeStyle = "rgba(255,244,224,.55)"; context.lineWidth = Math.max(2, rx * 0.09); context.lineCap = "round";
  for (const offset of [-0.45, 0, 0.45]) {
    const x = cx + offset * rx, height = rx * 1.6;
    context.beginPath(); context.moveTo(x, cy - rx * 0.25);
    context.bezierCurveTo(x - rx * 0.3, cy - height * 0.45, x + rx * 0.3, cy - height * 0.6, x, cy - height);
    context.stroke();
  }
}

export function drawCard(canvas: HTMLCanvasElement, hisab: Hisab, result: Result, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");

  const wall = context.createLinearGradient(0, 0, 0, height);
  wall.addColorStop(0, palette.wallTop); wall.addColorStop(1, palette.wallBottom);
  context.fillStyle = wall; context.fillRect(0, 0, width, height);
  // Brush strokes of the lime wash, fixed so the same card always draws the same.
  context.fillStyle = "rgba(255,255,255,.035)";
  for (let x = 30; x < width; x += 97) context.fillRect(x, 0, 38 + (x % 5) * 6, height);

  const centre = width / 2, text = width - 168;
  let y = layout.kicker;
  fitText(context, [{ text: "চায়ের কাপে হিসাব", color: palette.muted, weight: 600 }], centre, y, 30, text, "center");
  if (hisab.label) { y += layout.label; fitText(context, [{ text: hisab.label, color: palette.cream, weight: 700, display: true }], centre, y, 50, text, "center"); }
  y += layout.amount;
  fitText(context, [{ text: amountText(hisab, result), color: palette.cream, weight: 600 }], centre, y, 58, text, "center");
  y += layout.cups;
  fitText(context, [{ text: "= ", color: palette.cream, weight: 700, display: true }, { text: `${bn(result.cups)} কাপ চা`, color: palette.yellow, weight: 800, display: true }], centre, y, 112, text, "center");

  const shelf = layout.shelf;
  context.fillStyle = palette.plank; context.fillRect(60, shelf, width - 120, 30);
  context.fillStyle = palette.plankTop; context.fillRect(60, shelf, width - 120, 8);
  context.fillStyle = "rgba(0,0,0,.22)"; context.fillRect(76, shelf + 30, width - 152, 10);
  const cups = towerLayout(result.drawn, { x: 110, y: y + 60, width: width - 220, height: shelf - y - 64 }, 150);
  cups.forEach(cup => drawCup(context, cup));
  if (cups.length) drawSteam(context, cups[cups.length - 1]);

  const priceNote = units.map(unit => `${unit.label.split(" ")[0]} ${bn(hisab.prices[unit.id])}৳`).join(" · ");
  const scaleNote = result.each > 1 ? `এক ভাঁড় = ${bn(result.each)} কাপ` : "এক ভাঁড় = এক কাপ";
  y = shelf + 62;
  fitText(context, [{ text: `${scaleNote} · ${priceNote}`, color: palette.muted, weight: 500 }], centre, y, 25, text, "center");
  y += format === "story" ? 66 : 58;
  fitText(context, [{ text: result.others.map(other => other.text).join(" · "), color: palette.cream, weight: 700 }], centre, y, 38, text, "center");
  y += format === "story" ? 58 : 50;
  fitText(context, [{ text: result.span, color: palette.cream, weight: 500 }], centre, y, 32, text, "center");
  y += format === "story" ? 76 : 66;
  fitText(context, [{ text: result.line, color: palette.yellow, weight: 700, display: true }], centre, y, 44, text, "center");

  drawFooterBand(context, format, "তোমার শখের জিনিস কত কাপ চা?", site, { band: palette.band, ask: palette.yellow, site: palette.cream });
}

export const cardBlob = (hisab: Hisab, result: Result, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, hisab, result, format, site));
