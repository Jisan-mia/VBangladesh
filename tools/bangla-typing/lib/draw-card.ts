import { cardSizes, drawFooterBand, fitText, renderCard, wrapText, BODY_FONT, type CardFormat } from "../../../shared/card-canvas";
import { bn, gradeOf, humanLine, opening, type Shared } from "./typing";

const ENAMEL = "#262d33";
const PAPER = "#eef1f5";
const CARBON = "#27357e";
const CARBON_SOFT = "#5f6898";
const CARBON_SHEET = "#1d2450";
const STAMP = "#c0392b";

/** A carbon copy pulled from a typewriter: the result typed in blue carbon ink, an examiner's stamp beside the speed. */
export function drawCard(canvas: HTMLCanvasElement, shared: Shared, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  // Feed positions; the story stretches them into its taller safe area (paper 330–1600, clear of storySafe).
  const y = (feedY: number) => format === "feed" ? feedY : 330 + (feedY - 110) * 1.165;
  const cx = width / 2;

  const glow = context.createRadialGradient(cx, y(500), 100, cx, y(500), 900);
  glow.addColorStop(0, "#3a434b"); glow.addColorStop(1, ENAMEL);
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);

  // Paper with the carbon sheet peeking out underneath.
  const left = 130, right = 950, top = y(110), bottom = y(1200);
  context.fillStyle = CARBON_SHEET;
  context.fillRect(left + 18, top, right - left, bottom - top + 18);
  context.shadowColor = "#00000066"; context.shadowBlur = 30; context.shadowOffsetY = 12;
  context.fillStyle = PAPER;
  context.fillRect(left, top, right - left, bottom - top);
  context.shadowColor = "transparent"; context.shadowBlur = 0; context.shadowOffsetY = 0;
  // Dog-eared corner showing the carbon underside.
  context.fillStyle = CARBON_SHEET;
  context.beginPath(); context.moveTo(right - 70, bottom); context.lineTo(right, bottom - 70); context.lineTo(right, bottom); context.closePath(); context.fill();
  context.fillStyle = "#c9cfdb";
  context.beginPath(); context.moveTo(right - 70, bottom); context.lineTo(right, bottom - 70); context.lineTo(right - 70, bottom - 70); context.closePath(); context.fill();

  // The platen roller the sheet comes out of.
  const rollerY = top - 40;
  const roller = context.createLinearGradient(0, rollerY - 40, 0, rollerY + 40);
  roller.addColorStop(0, "#4a4f55"); roller.addColorStop(0.45, "#0f1113"); roller.addColorStop(1, "#2b2f33");
  context.fillStyle = roller;
  context.beginPath(); context.roundRect(70, rollerY - 38, width - 140, 76, 38); context.fill();
  for (const knobX of [56, width - 56]) {
    context.fillStyle = "#15181b"; context.beginPath(); context.arc(knobX, rollerY, 50, 0, Math.PI * 2); context.fill();
    context.strokeStyle = "#5b6168"; context.lineWidth = 4;
    for (let ring = 0; ring < 3; ring++) { context.beginPath(); context.arc(knobX, rollerY, 18 + ring * 11, 0, Math.PI * 2); context.stroke(); }
  }
  context.fillStyle = "#ffffff14";
  context.fillRect(90, rollerY - 26, width - 180, 8);

  fitText(context, [{ text: "একটুখানি টাইপ স্কুল", color: CARBON_SOFT, weight: 600 }], cx, y(232), 30, 640, "center");
  fitText(context, [{ text: "টাইপিং সার্টিফিকেট", color: CARBON, weight: 800, display: true }], cx, y(316), 78, 700, "center");
  fitText(context, [{ text: "খেলার জন্য · আসল সার্টিফিকেট না", color: CARBON_SOFT, weight: 500 }], cx, y(360), 26, 640, "center");
  dashedRule(context, 190, 890, y(400));

  // A form line: "নাম:" and the name typed onto the dots, or the dots left blank.
  fitText(context, [{ text: "নাম:", color: CARBON_SOFT, weight: 600 }], 190, y(486), 34, 120);
  if (shared.n) fitText(context, [{ text: shared.n, color: CARBON, weight: 700, display: true }], 290, y(482), 54, 580);
  context.setLineDash([3, 9]); context.strokeStyle = CARBON_SOFT; context.lineWidth = 3;
  context.beginPath(); context.moveTo(282, y(500)); context.lineTo(890, y(500)); context.stroke();
  context.setLineDash([]);

  fitText(context, [{ text: bn(shared.w), color: CARBON, weight: 800, display: true }], cx - 40, y(740), 270, 460, "center");
  fitText(context, [{ text: "শব্দ, প্রতি মিনিটে", color: CARBON, weight: 700 }], cx - 40, y(820), 46, 520, "center");
  fitText(context, [{ text: `${bn(shared.a)}% নির্ভুল`, color: CARBON, weight: 700 }, { text: "  ·  নিজের ফোনে মাপা", color: CARBON_SOFT, weight: 500 }], cx, y(900), 38, 700, "center");
  dashedRule(context, 190, 890, y(945));

  context.font = `600 42px ${BODY_FONT}`;
  wrapText(context, humanLine(shared.w, shared.a), 680, 2).forEach((line, index) => {
    fitText(context, [{ text: line, color: CARBON, weight: 600 }], cx, y(1020) + index * 60, 42, 700, "center");
  });
  fitText(context, [{ text: `লেখা: ${opening(shared.p)}`, color: CARBON_SOFT, weight: 500 }], 190, y(1160), 26, 560);

  drawStamp(context, 820, y(640), gradeOf(shared.w).stamp);
  drawFooterBand(context, format, "তুমি মিনিটে কত?", site, { band: "#14181c", ask: "#f4c95d", site: "#ffffff" });
}

function dashedRule(context: CanvasRenderingContext2D, from: number, to: number, at: number) {
  context.setLineDash([14, 10]); context.strokeStyle = "#b9c0d4"; context.lineWidth = 2;
  context.beginPath(); context.moveTo(from, at); context.lineTo(to, at); context.stroke();
  context.setLineDash([]);
}

function drawStamp(context: CanvasRenderingContext2D, x: number, y: number, word: string) {
  context.save();
  context.translate(x, y);
  context.rotate(-0.24);
  context.globalAlpha = 0.85;
  context.strokeStyle = STAMP;
  context.lineWidth = 8; context.beginPath(); context.arc(0, 0, 104, 0, Math.PI * 2); context.stroke();
  context.lineWidth = 3; context.beginPath(); context.arc(0, 0, 88, 0, Math.PI * 2); context.stroke();
  context.lineWidth = 3; context.beginPath(); context.moveTo(-80, -24); context.lineTo(80, -24); context.moveTo(-80, 34); context.lineTo(80, 34); context.stroke();
  fitText(context, [{ text: "একটুখানি", color: STAMP, weight: 700 }], 0, -40, 24, 120, "center");
  fitText(context, [{ text: word, color: STAMP, weight: 800, display: true }], 0, 20, 44, 156, "center");
  fitText(context, [{ text: "পরীক্ষিত", color: STAMP, weight: 700 }], 0, 66, 24, 120, "center");
  context.restore();
}

export const cardBlob = (shared: Shared, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, shared, format, site));
