import { cardSizes, drawFooterBand, fitText, renderCard, type CardFormat } from "../../../shared/card-canvas";
import { chitTitle, extraOf, orderLine, orderText, sideText, steam, sugars, teaOf, totalText, vessel, cups, type Line } from "./order";

const PEN = "#22408f";
const PEN_SOFT = "#5a6da0";
const RED = "#c0392b";
const PRINT = "#b8322a";
const INK = "#3a2414";
const PAPER = "#fbf5e6";
const CHIT_W = 800;

const layouts = {
  feed: { x: 44, top: 64, height: 1124, tilt: -0.022, cup: { x: 868, y: 980, size: 190 } },
  story: { x: 140, top: 300, height: 1210, tilt: -0.016, cup: { x: 820, y: 1440, size: 200 } },
} as const;

/** Planks of a টং bench: warm boards, dark gaps, wavy grain. Deterministic so a card always looks the same. */
function bench(context: CanvasRenderingContext2D, width: number, height: number) {
  const plank = 168;
  for (let y = 0, i = 0; y < height; y += plank, i++) {
    context.fillStyle = i % 2 ? "#84532d" : "#8f5e36";
    context.fillRect(0, y, width, plank);
    context.lineWidth = 2;
    for (let g = 0; g < 7; g++) {
      context.strokeStyle = g % 2 ? "#6b401f55" : "#b07a4a40";
      const base = y + 18 + g * 22, phase = (i * 7 + g) * 1.7;
      context.beginPath();
      for (let x = 0; x <= width; x += 24) context.lineTo(x, base + Math.sin(x / 140 + phase) * 5);
      context.stroke();
    }
    context.fillStyle = "#3d2412";
    context.fillRect(0, y + plank - 5, width, 5);
  }
}

/** A cup or clay cup, filled with the tea's colour, with steam. */
function drawVessel(context: CanvasRenderingContext2D, line: Pick<Line, "tea" | "cup">, x: number, y: number, size: number, withSteam = true) {
  const shape = vessel[line.cup];
  context.save();
  context.translate(x, y);
  context.scale(size / 48, size / 48);
  context.lineCap = "round"; context.lineJoin = "round";
  context.fillStyle = line.cup === "bhar" ? "#c46a3c" : "#ffffff";
  context.fill(new Path2D(shape.body));
  // The tea surface: a band at the top of the vessel in the tea's own colour.
  context.save();
  context.clip(new Path2D(shape.body));
  context.fillStyle = teaOf(line.tea).color;
  context.fillRect(0, line.cup === "bhar" ? 15 : 16, 48, line.cup === "bhar" ? 5 : 26);
  if (line.tea === "malai") { context.fillStyle = "#fff6df"; context.fillRect(0, 15, 48, 4); }
  context.restore();
  if (line.tea === "lebu") { context.fillStyle = "#e9d34f"; context.beginPath(); context.arc(33, 16, 4.5, 0, Math.PI * 2); context.fill(); }
  context.strokeStyle = INK; context.lineWidth = 2.2;
  context.stroke(new Path2D(shape.body));
  context.stroke(new Path2D(shape.rest));
  if (withSteam) { context.strokeStyle = "#8a7a6a"; context.lineWidth = 1.6; context.stroke(new Path2D(steam)); }
  context.restore();
}

function drawSketch(context: CanvasRenderingContext2D, drawing: string, x: number, y: number, size: number, color = PEN) {
  context.save();
  context.translate(x, y);
  context.scale(size / 48, size / 48);
  context.strokeStyle = color; context.lineWidth = 2.4; context.lineCap = "round"; context.lineJoin = "round";
  context.stroke(new Path2D(drawing));
  context.restore();
}

/** The memo-pad page: red glued top, printed header, a tea-glass ring someone left on it. */
function drawPaper(context: CanvasRenderingContext2D, w: number, h: number) {
  context.save();
  context.shadowColor = "#1e0f0566"; context.shadowBlur = 30; context.shadowOffsetY = 14;
  context.fillStyle = PAPER; context.fillRect(0, 0, w, h);
  context.restore();
  context.fillStyle = "#a8322a"; context.fillRect(0, 0, w, 30);
  context.fillStyle = "#00000022"; context.fillRect(0, 30, w, 3);
  context.strokeStyle = "#dde3ef"; context.lineWidth = 2;
  for (let y = 150; y < h - 20; y += 60) { context.beginPath(); context.moveTo(30, y); context.lineTo(w - 30, y); context.stroke(); }
  context.strokeStyle = "#8f4e1f2e"; context.lineWidth = 12;
  context.beginPath(); context.arc(w - 120, 150, 82, -0.3, Math.PI * 1.55); context.stroke();
  context.strokeStyle = "#8f4e1f1c"; context.lineWidth = 5;
  context.beginPath(); context.arc(w - 116, 154, 70, 0.6, Math.PI * 1.9); context.stroke();
  fitText(context, [{ text: "মামার টং", color: PRINT, weight: 800, display: true }, { text: "  ·  অর্ডারের চিরকুট", color: PRINT, weight: 600 }], 56, 84, 30, w - 300);
  fitText(context, [{ text: "নং ০০৭", color: PRINT, weight: 600 }], w - 56, 84, 26, 160, "right");
}

function drawSingle(context: CanvasRenderingContext2D, line: Line, top: number, bottom: number, w: number) {
  const icon = Math.min(300, (bottom - top) * 0.45);
  const size = Math.min(160, (bottom - top) * 0.24);
  // Centre the drawing in the space so a one-cup chit doesn't leave a blank half page.
  top += Math.max(0, (bottom - top - (icon + 40 + 28 + size + 50)) / 2);
  drawVessel(context, line, 40, top, icon);
  const textX = 60 + icon;
  fitText(context, [{ text: teaOf(line.tea).label, color: PEN, weight: 800, display: true }], textX, top + icon * 0.48, 84, w - textX - 50);
  const detail = `${sugars.find(item => item.id === line.sugar)!.label} · ${cups.find(item => item.id === line.cup)!.label}`;
  fitText(context, [{ text: detail, color: PEN, weight: 600, display: true }], textX, top + icon * 0.48 + 70, 46, w - textX - 50);
  const y = top + icon + 40;
  if (!line.extras.length) { fitText(context, [{ text: "শুধু চা, আর কিছু না", color: PEN_SOFT, weight: 600, display: true }], 60, y + 40, 44, w - 120); return; }
  fitText(context, [{ text: "সাথে", color: PEN_SOFT, weight: 600 }], 60, y + 10, 34, 200);
  line.extras.forEach((id, index) => {
    const x = 60 + index * (size + 70);
    drawSketch(context, extraOf(id).drawing, x, y + 28, size);
    fitText(context, [{ text: `একটা ${extraOf(id).label}`, color: PEN, weight: 700, display: true }], x + size / 2, y + 28 + size + 42, 36, size + 60, "center");
  });
}

function drawRows(context: CanvasRenderingContext2D, lines: readonly Line[], top: number, bottom: number, w: number) {
  const row = Math.min(190, (bottom - top) / lines.length);
  const size = Math.round(Math.min(34 + row * 0.08, 50));
  lines.forEach((line, index) => {
    const y = top + index * row;
    const icon = Math.min(row * 0.72, 110);
    drawVessel(context, line, 40, y + (row - icon) / 2 - 4, icon, row > 120);
    const textX = 56 + icon;
    const first: Parameters<typeof fitText>[1] = line.name ? [{ text: `${line.name}: `, color: RED, weight: 800, display: true }] : [];
    fitText(context, [...first, { text: orderText(line), color: PEN, weight: 700, display: true }], textX, y + row / 2 - 2, size, w - textX - 40);
    fitText(context, [{ text: sideText(line), color: PEN_SOFT, weight: 600 }], textX, y + row / 2 + size + 2, size - 8, w - textX - 40);
  });
}

export function drawChit(canvas: HTMLCanvasElement, lines: readonly Line[], format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  bench(context, width, height);
  if (format === "story") fitText(context, [{ text: "টং-এর অর্ডার · একটুখানি", color: "#f6e3c4", weight: 600 }], width / 2, 220, 32, 900, "center");

  const w = CHIT_W, h = layout.height;
  context.save();
  context.translate(layout.x + w / 2, layout.top + h / 2);
  context.rotate(layout.tilt);
  context.translate(-w / 2, -h / 2);
  drawPaper(context, w, h);
  fitText(context, [{ text: chitTitle(lines), color: PEN, weight: 800, display: true }], 56, 196, 72, w - 112);
  const bodyTop = 250, bodyBottom = h - 230;
  if (lines.length === 1) drawSingle(context, lines[0], bodyTop, bodyBottom, w);
  else drawRows(context, lines, bodyTop, bodyBottom, w);
  context.strokeStyle = PEN_SOFT; context.lineWidth = 3; context.setLineDash([12, 10]);
  context.beginPath(); context.moveTo(56, h - 190); context.lineTo(w - 56, h - 190); context.stroke();
  context.setLineDash([]);
  fitText(context, [{ text: "মোট: ", color: PEN_SOFT, weight: 600 }, { text: totalText(lines), color: PEN, weight: 700, display: true }], 56, h - 132, 38, w - 112);
  fitText(context, [{ text: orderLine(lines), color: RED, weight: 700, display: true }], 56, h - 62, 42, w - 112);
  context.restore();

  // The person's own cup, set down on the bench beside the chit.
  const own = lines.at(-1);
  if (own) drawVessel(context, own, layout.cup.x, layout.cup.y, layout.cup.size);

  drawFooterBand(context, format, "মামা, তোমারটা কী?", site, { band: "#2b190c", ask: "#ffcf6e", site: "#ffffff" });
}

export const chitBlob = (lines: readonly Line[], format: CardFormat, site: string) => renderCard(canvas => drawChit(canvas, lines, format, site));
