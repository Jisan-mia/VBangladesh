import { BODY_FONT, cardSizes, drawFooterBand, fitText, renderCard, wrapText, type CardFormat } from "../../../shared/card-canvas";
import { amountText, bnYear, cardTitle, giftList, payLine, sourceById, WHOLE, type FirstPay, type GiftId } from "./first-pay";

const SHEET = "#dbe7f1";
const SHEET_PRINT = "#bfd3e6";
const SHEET_EYE = "#f6efe2";
const KRAFT = "#c9945a";
const KRAFT_BACK = "#a9733f";
const KRAFT_FLAP = "#bb8650";
const KRAFT_EDGE = "#8a5a2b";
const PRINT = "#6e3f17";
const GRAPHITE = "#3f3a35";
const BAND = "#d4452d";
const INK = "#3a2412";
const RED = "#b33a26";
const MUTED = "#6b4a2e";

/** The envelope's own size at scale 1; gifts rise up to GIFT_ZONE above its top edge. */
export const ENVELOPE = { width: 760, height: 470, giftZone: 200 } as const;
const GIFT_SCALE = 1.4;

const noise = (seed: number) => { const x = Math.sin(seed * 12.9898) * 43758.5453; return x - Math.floor(x); };

/** A cotton bedsheet with a small block-printed flower, the kind the envelope gets laid on to show আম্মু. */
export function drawSheet(context: CanvasRenderingContext2D, width: number, height: number) {
  context.fillStyle = SHEET;
  context.fillRect(0, 0, width, height);
  for (let y = 40, row = 0; y < height + 60; y += 96, row++) {
    for (let x = row % 2 ? 84 : 36; x < width + 60; x += 96) {
      context.fillStyle = SHEET_PRINT;
      for (let petal = 0; petal < 6; petal++) {
        const angle = (petal / 6) * Math.PI * 2;
        context.beginPath(); context.arc(x + Math.cos(angle) * 10, y + Math.sin(angle) * 10, 6, 0, Math.PI * 2); context.fill();
      }
      context.fillStyle = SHEET_EYE;
      context.beginPath(); context.arc(x, y, 4.5, 0, Math.PI * 2); context.fill();
    }
  }
}

function box(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, fill: string, stroke: string, radius = 6) {
  context.beginPath(); context.roundRect(x, y, width, height, radius);
  context.fillStyle = fill; context.fill();
  context.lineWidth = 3; context.strokeStyle = stroke; context.stroke();
}

function dots(context: CanvasRenderingContext2D, color: string, left: number, right: number, top: number, bottom: number, step: number, radius: number) {
  context.fillStyle = color;
  for (let y = top, row = 0; y < bottom; y += step, row++) for (let x = left + (row % 2 ? step / 2 : 0); x < right; x += step) { context.beginPath(); context.arc(x, y, radius, 0, Math.PI * 2); context.fill(); }
}

/** Each gift drawn around (0,0), the point where it leaves the envelope; anything below y=0 is hidden by the envelope's front. */
const giftArt: Record<Exclude<GiftId, "pura">, (context: CanvasRenderingContext2D) => void> = {
  shari(context) {
    box(context, -86, -150, 172, 240, "#b8233a", "#7d1424");
    dots(context, "#e2b13c", -36, 62, -96, 0, 28, 4);
    // Gold border along the top fold and down the side, with a red zigzag woven in.
    context.fillStyle = "#e2b13c"; context.fillRect(-84, -148, 168, 30); context.fillRect(-84, -148, 34, 236);
    context.fillStyle = "#7d1424";
    for (let x = -50; x < 80; x += 18) { context.beginPath(); context.moveTo(x, -118); context.lineTo(x + 9, -130); context.lineTo(x + 18, -118); context.fill(); }
    for (let y = -112; y < 80; y += 18) { context.beginPath(); context.moveTo(-50, y); context.lineTo(-62, y + 9); context.lineTo(-50, y + 18); context.fill(); }
    // Stacked fold edges on the right, and the আঁচল's tassels slipping out.
    context.strokeStyle = "#8f1a2c"; context.lineWidth = 2.5;
    for (const x of [68, 75, 82]) { context.beginPath(); context.moveTo(x, -116); context.lineTo(x, 10); context.stroke(); }
    context.strokeStyle = "#e2b13c"; context.lineWidth = 3;
    for (let index = 0; index < 5; index++) { context.beginPath(); context.moveTo(84, -138 + index * 8); context.quadraticCurveTo(98, -130 + index * 9, 102 + index, -112 + index * 10); context.stroke(); }
  },
  panjabi(context) {
    box(context, -82, -132, 164, 220, "#e3edf7", "#7f95ae");
    context.strokeStyle = "#7f95ae"; context.lineWidth = 3;
    context.beginPath(); context.moveTo(-30, -136); context.lineTo(-82, -112); context.moveTo(30, -136); context.lineTo(82, -112); context.stroke();
    box(context, -12, -136, 24, 120, "#cddcec", "#7f95ae", 4);
    box(context, -32, -150, 64, 18, "#e3edf7", "#7f95ae", 8);
    context.setLineDash([5, 5]); context.strokeStyle = "#3d5f8f"; context.lineWidth = 2;
    context.beginPath(); context.moveTo(-20, -128); context.lineTo(-20, -30); context.moveTo(20, -128); context.lineTo(20, -30); context.stroke();
    context.setLineDash([]);
    for (const y of [-112, -86, -60]) { context.beginPath(); context.arc(0, y, 5, 0, Math.PI * 2); context.fillStyle = "#f7f1e1"; context.fill(); context.lineWidth = 2; context.strokeStyle = "#7f95ae"; context.stroke(); }
  },
  mishti(context) {
    box(context, -74, -116, 148, 200, "#fbf7ee", "#bfae8e");
    context.fillStyle = "#efe4cf"; context.fillRect(-72, -114, 144, 16);
    context.font = `700 28px ${BODY_FONT}`; context.fillStyle = "#d9366f"; context.textAlign = "center";
    context.fillText("মিষ্টি", -24, -46);
    context.textAlign = "left";
    context.strokeStyle = "#d6402f"; context.lineWidth = 3.5;
    context.beginPath(); context.moveTo(26, -116); context.lineTo(26, 0); context.moveTo(-74, -82); context.lineTo(74, -82); context.stroke();
    context.beginPath(); context.ellipse(14, -124, 13, 8, -0.5, 0, Math.PI * 2); context.ellipse(38, -124, 13, 8, 0.5, 0, Math.PI * 2); context.stroke();
  },
  bhaibon(context) {
    box(context, -62, -100, 124, 180, "#f2c84b", "#b48a1c");
    dots(context, "#e8698f", -48, 60, -84, 0, 26, 5);
    context.fillStyle = "#d9366f"; context.fillRect(-10, -99, 20, 110);
    context.strokeStyle = "#9c1f4c"; context.lineWidth = 3; context.fillStyle = "#d9366f";
    for (const side of [-1, 1]) { context.beginPath(); context.ellipse(side * 24, -112, 24, 13, side * -0.45, 0, Math.PI * 2); context.fill(); context.stroke(); }
    context.beginPath(); context.arc(0, -106, 9, 0, Math.PI * 2); context.fill(); context.stroke();
  },
  nanu(context) {
    box(context, -84, -128, 168, 210, "#2e6a52", "#1b4535");
    context.strokeStyle = "#ffffff22"; context.lineWidth = 2;
    for (let x = -70; x < 84; x += 20) { context.beginPath(); context.moveTo(x, -100); context.lineTo(x, 10); context.stroke(); }
    for (let y = -90; y < 10; y += 20) { context.beginPath(); context.moveTo(-82, y); context.lineTo(82, y); context.stroke(); }
    context.fillStyle = "#e7c46a"; context.fillRect(-82, -126, 164, 20);
    context.strokeStyle = "#e7c46a"; context.lineWidth = 3;
    for (let x = -78; x <= 78; x += 9) { context.beginPath(); context.moveTo(x, -128); context.lineTo(x + noise(x) * 4 - 2, -146 - noise(x + 1) * 6); context.stroke(); }
  },
  treat(context) {
    // A foil pack of কাচ্চি, still steaming.
    const pack = new Path2D("M-80 -98H80L66 60H-66Z");
    context.fillStyle = "#cfd5db"; context.fill(pack);
    context.save(); context.clip(pack); context.lineWidth = 3;
    for (let x = -76; x < 80; x += 12) { context.strokeStyle = (x + 76) % 24 ? "#eef1f4" : "#a9b1b9"; context.beginPath(); context.moveTo(x, -98); context.lineTo(x * 0.84, 60); context.stroke(); }
    context.restore();
    context.lineWidth = 3; context.strokeStyle = "#7d858e"; context.stroke(pack);
    box(context, -88, -106, 176, 12, "#e3e7eb", "#7d858e", 4);
    const lid = new Path2D("M-84 -106H84L72 -146H-72Z");
    context.fillStyle = "#f8f1e2"; context.fill(lid); context.strokeStyle = "#b9a27a"; context.stroke(lid);
    context.font = `700 30px ${BODY_FONT}`; context.fillStyle = "#8a3b12"; context.textAlign = "center"; context.fillText("কাচ্চি", 0, -115); context.textAlign = "left";
    context.strokeStyle = "rgba(107,82,64,.55)"; context.lineWidth = 3; context.lineCap = "round";
    for (const x of [-36, 0, 36]) { context.beginPath(); context.moveTo(x, -152); context.bezierCurveTo(x - 14, -166, x + 14, -178, x, -194); context.stroke(); }
    context.lineCap = "butt";
  },
  joma(context) {
    const notes: Array<[number, string, string]> = [[-0.22, "#a9cfa6", "#4d7a4a"], [-0.04, "#e8b9c6", "#94445b"], [0.16, "#bad3ea", "#3f6a96"]];
    notes.forEach(([angle, fill, ink], index) => {
      context.save();
      context.translate((index - 1) * 26, 60);
      context.rotate(angle);
      box(context, -92, -196, 184, 96, fill, ink, 4);
      context.strokeStyle = ink; context.lineWidth = 2; context.strokeRect(-82, -186, 164, 76);
      context.beginPath(); context.arc(46, -148, 22, 0, Math.PI * 2); context.stroke();
      context.font = `700 26px ${BODY_FONT}`; context.fillStyle = ink; context.textAlign = "center"; context.fillText("৳", 46, -139); context.textAlign = "left";
      for (const y of [-164, -148, -132]) { context.beginPath(); context.moveTo(-68, y); context.lineTo(4, y); context.stroke(); }
      context.restore();
    });
  },
};

const giftSpots: Record<number, Array<[number, number, number]>> = {
  1: [[0.5, 0, 0]],
  2: [[0.35, -0.07, 6], [0.65, 0.08, 0]],
  3: [[0.24, -0.1, 14], [0.76, 0.1, 14], [0.5, 0, 0]],
};

/** Pencil on kraft: a soft dark pass plus a faint offset pass for the graphite grain. */
function pencil(context: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, maxWidth: number) {
  context.save();
  context.globalAlpha = 0.9;
  const used = fitText(context, [{ text, color: GRAPHITE, weight: 600, display: true }], x, y, size, maxWidth);
  context.globalAlpha = 0.25;
  fitText(context, [{ text, color: GRAPHITE, weight: 600, display: true }], x + 1.5, y + 1, used, maxWidth);
  context.restore();
}

function printed(context: CanvasRenderingContext2D, text: string, x: number, y: number, size: number) {
  context.save();
  context.globalAlpha = 0.72;
  fitText(context, [{ text, color: PRINT, weight: 600 }], x, y, size, 200);
  context.restore();
}

function field(context: CanvasRenderingContext2D, label: string, value: string, y: number, right: number) {
  printed(context, `${label}:`, 56, y, 28);
  context.save();
  context.globalAlpha = 0.55; context.strokeStyle = PRINT; context.lineWidth = 2; context.setLineDash([3, 7]);
  context.beginPath(); context.moveTo(140, y + 8); context.lineTo(right, y + 8); context.stroke();
  context.restore();
  if (value) pencil(context, value, 150, y - 4, 40, right - 160);
}

/** The opened flap, standing up behind the gifts. */
function flap(context: CanvasRenderingContext2D) {
  const { width } = ENVELOPE;
  context.beginPath();
  context.moveTo(6, 4); context.quadraticCurveTo(40, -70, width / 2 - 150, -96); context.quadraticCurveTo(width / 2, -118, width / 2 + 150, -96); context.quadraticCurveTo(width - 40, -70, width - 6, 4);
  context.closePath();
  context.fillStyle = KRAFT_FLAP; context.fill();
  context.lineWidth = 3; context.strokeStyle = KRAFT_EDGE; context.stroke();
  // The gum strip along the flap's edge.
  context.save(); context.clip(); context.lineWidth = 16; context.strokeStyle = "rgba(255,228,180,.28)"; context.stroke(); context.restore();
}

/** The whole envelope handed over unopened: its back, flap stapled shut, a pencil note for the parents. */
function sealedBack(context: CanvasRenderingContext2D, pay: FirstPay) {
  const { width, height } = ENVELOPE;
  const body = new Path2D(`M0 0H${width}V${height}H0Z`);
  context.fillStyle = KRAFT; context.fill(body);
  context.save(); context.clip(body); texture(context, width, height); context.restore();
  context.strokeStyle = KRAFT_EDGE; context.lineWidth = 3;
  context.beginPath(); context.moveTo(0, height); context.lineTo(width * 0.4, height * 0.5); context.moveTo(width, height); context.lineTo(width * 0.6, height * 0.5); context.stroke();
  const closed = new Path2D(`M0 0H${width}L${width / 2 + 26} 236Q${width / 2} 252 ${width / 2 - 26} 236Z`);
  context.save(); context.shadowColor = "rgba(58,36,18,.25)"; context.shadowBlur = 10; context.shadowOffsetY = 4;
  context.fillStyle = "#c08b52"; context.fill(closed); context.restore();
  context.stroke(closed);
  context.stroke(body);
  staple(context, width / 2, 226);
  pencil(context, `${pay.style === "ma" ? "মা-বাবার" : "আম্মু-আব্বুর"} জন্য`, 70, 344, 60, width * 0.74);
  pencil(context, "না খুলেই দিয়েছি", 70, 412, 42, width * 0.6);
}

function texture(context: CanvasRenderingContext2D, width: number, height: number) {
  context.lineWidth = 1.5;
  for (let index = 0; index < 260; index++) {
    const x = noise(index) * width, y = noise(index + 500) * height, length = 6 + noise(index + 900) * 16, angle = noise(index + 1300) * Math.PI;
    context.strokeStyle = index % 3 ? "rgba(110,63,23,.13)" : "rgba(255,236,200,.22)";
    context.beginPath(); context.moveTo(x, y); context.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length); context.stroke();
  }
}

function rubberBand(context: CanvasRenderingContext2D, x: number) {
  const { height } = ENVELOPE;
  const strip = new Path2D(`M${x - 5} 8C${x - 9} ${height * 0.35} ${x + 1} ${height * 0.7} ${x - 4} ${height + 6}L${x + 7} ${height + 6}C${x + 12} ${height * 0.7} ${x + 2} ${height * 0.35} ${x + 6} 8Z`);
  context.fillStyle = BAND; context.fill(strip);
  context.lineWidth = 1.5; context.strokeStyle = "#8f2616"; context.stroke(strip);
  context.strokeStyle = "#f29a7f"; context.lineWidth = 2;
  context.beginPath(); context.moveTo(x - 2, 20); context.bezierCurveTo(x - 5, height * 0.35, x + 3, height * 0.7, x - 1, height - 8); context.stroke();
}

function staple(context: CanvasRenderingContext2D, x: number, y: number) {
  context.save();
  context.translate(x, y); context.rotate(-0.6); context.scale(1.4, 1.4);
  context.fillStyle = "#6f757c"; context.fillRect(-21, -2, 42, 7);
  context.fillStyle = "#d3d8dd"; context.fillRect(-21, -3, 42, 4);
  context.fillStyle = "#4c5157"; context.fillRect(-23, -3, 4, 9); context.fillRect(19, -3, 4, 9);
  context.restore();
}

/** The pay envelope with what the money became peeking out. (x, y) is the top-left of the whole scene, gifts included. */
export function drawEnvelope(context: CanvasRenderingContext2D, pay: FirstPay, x: number, y: number, scale: number, tilt = -0.02) {
  const { width, height, giftZone } = ENVELOPE;
  const sealed = pay.gifts.includes(WHOLE);
  const front = new Path2D(`M0 14H${width / 2 - 46}A46 46 0 0 0 ${width / 2 + 46} 14H${width}V${height}H0Z`);
  context.save();
  context.translate(x + (width * scale) / 2, y + ((sealed ? giftZone / 2 : giftZone) + height / 2) * scale);
  context.rotate(tilt);
  context.scale(scale, scale);
  context.translate(-width / 2, -height / 2);

  // Back panel with a soft shadow on the sheet.
  context.save();
  context.shadowColor = "rgba(58,36,18,.32)"; context.shadowBlur = 30; context.shadowOffsetY = 14;
  context.fillStyle = KRAFT_BACK; context.fillRect(0, 0, width, height);
  context.restore();
  if (sealed) {
    sealedBack(context, pay);
    rubberBand(context, width * 0.88);
    context.restore();
    return;
  }
  flap(context);
  const picked = pay.gifts.filter((id): id is Exclude<GiftId, "pura"> => id !== WHOLE);
  // With three, the first pick takes the middle and is drawn last, so it sits in front.
  const drawOrder = picked.length === 3 ? [picked[1], picked[2], picked[0]] : picked;
  drawOrder.forEach((id, index) => {
    const [at, angle, drop] = giftSpots[drawOrder.length][index];
    context.save();
    context.translate(width * at, 44 + drop);
    context.rotate(angle);
    context.scale(GIFT_SCALE, GIFT_SCALE);
    giftArt[id](context);
    context.restore();
  });

  context.fillStyle = KRAFT; context.fill(front);
  context.save(); context.clip(front); texture(context, width, height);
  context.fillStyle = "rgba(110,63,23,.14)"; context.fillRect(0, height - 14, width, 14);
  context.restore();
  context.lineWidth = 3; context.strokeStyle = KRAFT_EDGE; context.stroke(front);

  // The printed form, filled in by pencil.
  const right = width * 0.8;
  printed(context, "বেতন / সম্মানী", 56, 84, 30);
  context.save(); context.globalAlpha = 0.6; context.fillStyle = PRINT; context.fillRect(56, 100, right - 56, 3); context.restore();
  printed(context, "নং", right - 92, 84, 26);
  pencil(context, "০০১", right - 56, 84, 34, 70);
  pencil(context, sourceById(pay.source).scribble, 56, 178, 58, right - 70);
  field(context, "সাল", pay.year ? bnYear(pay.year) : "", 262, right);
  field(context, "নাম", pay.name || "আমি", 332, right);
  field(context, "টাকা", pay.amount ? amountText(pay.amount) : "অমূল্য", 402, right);
  rubberBand(context, width * 0.88);
  staple(context, 34, 40);
  context.restore();
}

const layouts = {
  feed: { kicker: 104, title: 196, scene: 236, scale: 1.1, gifts: 1046, line: 1108, lineGap: 52 },
  story: { kicker: 360, title: 466, scene: 524, scale: 1.2, gifts: 1420, line: 1494, lineGap: 60 },
} as const;

export function drawCard(canvas: HTMLCanvasElement, pay: FirstPay, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  drawSheet(context, width, height);
  const kicker = [sourceById(pay.source).label, pay.year ? bnYear(pay.year) : ""].filter(Boolean).join(" · ");
  fitText(context, [{ text: kicker, color: MUTED, weight: 600 }], width / 2, layout.kicker, 34, 900, "center");
  const title = cardTitle(pay.name);
  const lead = title.slice(0, -"প্রথম আয়".length);
  fitText(context, [{ text: lead, color: INK, weight: 800, display: true }, { text: "প্রথম আয়", color: RED, weight: 800, display: true }], width / 2, layout.title, 92, 940, "center");
  drawEnvelope(context, pay, (width - ENVELOPE.width * layout.scale) / 2, layout.scene, layout.scale);
  fitText(context, [{ text: giftList(pay), color: RED, weight: 800, display: true }], width / 2, layout.gifts, 48, 940, "center");
  context.font = `600 40px ${BODY_FONT}`;
  wrapText(context, payLine(pay), 900, 2).forEach((line, index) => fitText(context, [{ text: line, color: INK, weight: 600 }], width / 2, layout.line + index * layout.lineGap, 40, 920, "center"));
  drawFooterBand(context, format, "তোমার প্রথম আয় দিয়ে কী করেছিলে?", site, { band: "#3b2414", ask: "#f6c66f", site: "#ffffff" });
}

/** The envelope alone on the sheet, for the live stage at the top of the page. */
export const STAGE = { width: 1080, height: 820, scale: 1.12 } as const;
export function drawStage(canvas: HTMLCanvasElement, pay: FirstPay) {
  canvas.width = STAGE.width;
  canvas.height = STAGE.height;
  const context = canvas.getContext("2d");
  if (!context) return;
  drawSheet(context, STAGE.width, STAGE.height);
  drawEnvelope(context, pay, (STAGE.width - ENVELOPE.width * STAGE.scale) / 2, 20, STAGE.scale);
}

export const cardBlob = (pay: FirstPay, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, pay, format, site));
