import { cardSizes, drawFooterBand, fitText, renderCard, wrapText, BODY_FONT, type CardFormat } from "../../../shared/card-canvas";
import { bhortaOf, bhortas, pairLine, reason, type Bhorta, type Plate } from "./bhorta";

// The card: a কাঁসার থালা on the dark শিলপাটা, a banana leaf cut to the plate, a mound of rice and a round
// ball of bhorta in the bhorta's own colour. A friend's link puts their bhorta ball on the same leaf.
const W = 1080;
export const STONE = "#3d3a36";
export const CREAM = "#fbefd6";
export const TURMERIC = "#f2b632";
export const MUTED = "#c9bfae";
const CHILI = "#b4372a";
const FOOTER = "#6e1c14";

export type PlateCard = Plate & { friend?: Plate | null };

// Seeded so a shared card draws the same flecks every time.
function seeded(seed: number) {
  let value = seed * 9301 + 49297;
  return () => (value = (value * 9301 + 49297) % 233280) / 233280;
}

function drawStone(context: CanvasRenderingContext2D, height: number) {
  context.fillStyle = STONE;
  context.fillRect(0, 0, W, height);
  const glow = context.createRadialGradient(W / 2, height * 0.42, 100, W / 2, height * 0.42, 820);
  glow.addColorStop(0, "rgba(255,240,210,0.16)");
  glow.addColorStop(1, "rgba(0,0,0,0.25)");
  context.fillStyle = glow;
  context.fillRect(0, 0, W, height);
  // The pecked surface of a শিলপাটা (শিল কাটানো).
  const random = seeded(7);
  for (let i = 0; i < 900; i++) {
    context.fillStyle = random() > 0.5 ? "rgba(0,0,0,0.28)" : "rgba(255,255,255,0.07)";
    context.beginPath();
    context.arc(random() * W, random() * height, 1.5 + random() * 3, 0, Math.PI * 2);
    context.fill();
  }
}

function drawBrass(context: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  context.save();
  context.shadowColor = "rgba(0,0,0,0.5)"; context.shadowBlur = 50; context.shadowOffsetY = 24;
  const brass = context.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.1, cx, cy, r);
  brass.addColorStop(0, "#fbe39a"); brass.addColorStop(0.55, "#d9a53e"); brass.addColorStop(0.92, "#a8762a"); brass.addColorStop(1, "#7a521a");
  context.fillStyle = brass;
  context.beginPath(); context.arc(cx, cy, r, 0, Math.PI * 2); context.fill();
  context.restore();
  context.strokeStyle = "rgba(110,70,20,0.55)"; context.lineWidth = 4;
  context.beginPath(); context.arc(cx, cy, r * 0.88, 0, Math.PI * 2); context.stroke();
  context.strokeStyle = "rgba(255,240,190,0.6)"; context.lineWidth = 3;
  context.beginPath(); context.arc(cx, cy, r * 0.97, Math.PI * 1.1, Math.PI * 1.6); context.stroke();
}

function drawLeaf(context: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  context.save();
  context.beginPath(); context.arc(cx, cy, r * 0.86, 0, Math.PI * 2); context.clip();
  context.translate(cx, cy); context.rotate(-0.38);
  const leaf = context.createLinearGradient(0, -r, 0, r);
  leaf.addColorStop(0, "#5fae3e"); leaf.addColorStop(0.5, "#3f8a2c"); leaf.addColorStop(1, "#2c6a20");
  context.fillStyle = leaf;
  context.beginPath(); context.ellipse(0, 0, r * 1.25, r * 0.62, 0, 0, Math.PI * 2); context.fill();
  context.strokeStyle = "rgba(220,240,180,0.22)"; context.lineWidth = 2.5;
  for (let x = -r * 1.2; x <= r * 1.2; x += r * 0.07) {
    context.beginPath(); context.moveTo(x, 0); context.lineTo(x + r * 0.12, -r * 0.62); context.moveTo(x, 0); context.lineTo(x + r * 0.12, r * 0.62); context.stroke();
  }
  context.strokeStyle = "#cfe6a0"; context.lineWidth = r * 0.03;
  context.beginPath(); context.moveTo(-r * 1.25, 0); context.lineTo(r * 1.25, 0); context.stroke();
  context.restore();
}

function drawRice(context: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const mound = context.createRadialGradient(cx - r * 0.3, cy - r * 0.4, r * 0.1, cx, cy, r);
  mound.addColorStop(0, "#ffffff"); mound.addColorStop(1, "#e6dfcf");
  context.fillStyle = mound;
  context.beginPath(); context.ellipse(cx, cy, r, r * 0.82, 0, 0, Math.PI * 2); context.fill();
  const random = seeded(3);
  context.strokeStyle = "rgba(170,160,140,0.55)"; context.lineWidth = 2; context.lineCap = "round";
  for (let i = 0; i < 70; i++) {
    const angle = random() * Math.PI * 2, distance = Math.sqrt(random()) * r * 0.9, tilt = random() * Math.PI;
    const x = cx + Math.cos(angle) * distance, y = cy + Math.sin(angle) * distance * 0.82;
    context.beginPath(); context.moveTo(x - Math.cos(tilt) * 8, y - Math.sin(tilt) * 4); context.lineTo(x + Math.cos(tilt) * 8, y + Math.sin(tilt) * 4); context.stroke();
  }
}

/** A round ball of bhorta, pressed by hand: shaded, with flecks of chili, onion and the bhorta's own bits. */
export function drawBall(context: CanvasRenderingContext2D, bhorta: Bhorta, cx: number, cy: number, r: number) {
  context.save();
  context.shadowColor = "rgba(20,40,10,0.45)"; context.shadowBlur = r * 0.25; context.shadowOffsetY = r * 0.12;
  context.fillStyle = bhorta.ball;
  context.beginPath(); context.ellipse(cx, cy, r, r * 0.9, 0, 0, Math.PI * 2); context.fill();
  context.restore();
  const shade = context.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r);
  shade.addColorStop(0, "rgba(255,255,255,0.28)"); shade.addColorStop(0.6, "rgba(255,255,255,0)"); shade.addColorStop(1, "rgba(40,20,0,0.35)");
  context.fillStyle = shade;
  context.beginPath(); context.ellipse(cx, cy, r, r * 0.9, 0, 0, Math.PI * 2); context.fill();
  const random = seeded(bhortas.indexOf(bhorta) + 11);
  const bits = [bhorta.fleck, bhorta.fleck, "#f3e6f0", CHILI, "#2f8a3a"];
  for (let i = 0; i < 46; i++) {
    const angle = random() * Math.PI * 2, distance = Math.sqrt(random()) * r * 0.82;
    context.fillStyle = bits[i % bits.length];
    context.beginPath();
    context.ellipse(cx + Math.cos(angle) * distance, cy + Math.sin(angle) * distance * 0.9, r * (0.03 + random() * 0.04), r * (0.02 + random() * 0.025), random() * Math.PI, 0, Math.PI * 2);
    context.fill();
  }
  // A drop of mustard oil catching the light.
  context.fillStyle = "rgba(255,236,150,0.55)";
  context.beginPath(); context.ellipse(cx - r * 0.32, cy - r * 0.42, r * 0.2, r * 0.08, -0.5, 0, Math.PI * 2); context.fill();
}

function drawChili(context: CanvasRenderingContext2D, x: number, y: number, size: number, angle: number, color: string) {
  context.save();
  context.translate(x, y); context.rotate(angle);
  context.strokeStyle = color; context.lineCap = "round"; context.lineWidth = size * 0.22;
  context.beginPath(); context.moveTo(-size, 0); context.quadraticCurveTo(0, -size * 0.35, size * 0.9, size * 0.25); context.stroke();
  context.strokeStyle = "#3d6b1c"; context.lineWidth = size * 0.1;
  context.beginPath(); context.moveTo(-size, 0); context.lineTo(-size * 1.3, -size * 0.18); context.stroke();
  context.restore();
}

function drawThala(context: CanvasRenderingContext2D, card: PlateCard, cx: number, cy: number, r: number) {
  drawBrass(context, cx, cy, r);
  drawLeaf(context, cx, cy, r);
  const mine = bhortaOf(card.answers);
  if (card.friend) {
    const theirs = bhortaOf(card.friend.answers);
    drawBall(context, theirs, cx - r * 0.3, cy + r * 0.16, r * 0.27);
    drawBall(context, mine, cx + r * 0.22, cy - r * 0.12, r * 0.32);
  } else {
    drawRice(context, cx - r * 0.36, cy + r * 0.14, r * 0.34);
    drawBall(context, mine, cx + r * 0.18, cy - r * 0.06, r * 0.34);
  }
  // A ring of onion: pink shows on the green leaf where a green chili would vanish.
  context.strokeStyle = "#d98cb0"; context.lineWidth = r * 0.025;
  for (const ring of [0.09, 0.06]) { context.beginPath(); context.ellipse(cx + r * 0.45, cy + r * 0.45, r * ring, r * ring * 0.8, 0.3, 0, Math.PI * 2); context.stroke(); }
  drawChili(context, cx - r * 0.5, cy - r * 0.4, r * 0.14, 0.7, CHILI);
}

const layouts = {
  feed: { kicker: 92, who: 166, name: 286, nameSize: 118, plateY: 640, plateR: 300, tag: 1032, line: 1094, lineGap: 50, reason: 1214 },
  story: { kicker: 320, who: 410, name: 548, nameSize: 140, plateY: 950, plateR: 350, tag: 1398, line: 1468, lineGap: 56, reason: 1612 },
} as const;

export function drawPlateCard(canvas: HTMLCanvasElement, card: PlateCard, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const bhorta = bhortaOf(card.answers);
  drawStone(context, height);
  fitText(context, [{ text: "শিলপাটায় বেটে দেখা গেল", color: MUTED, weight: 600 }], W / 2, layout.kicker, 30, 900, "center");
  fitText(context, [{ text: card.name ? `${card.name} হলো` : "আমি হলাম", color: CREAM, weight: 700, display: true }], W / 2, layout.who, 48, 900, "center");
  fitText(context, [{ text: bhorta.name, color: TURMERIC, weight: 800, display: true }], W / 2, layout.name, layout.nameSize, 960, "center");
  drawThala(context, card, W / 2, layout.plateY, layout.plateR);
  fitText(context, [{ text: bhorta.tag, color: CREAM, weight: 800, display: true }], W / 2, layout.tag, 54, 940, "center");
  context.font = `500 36px ${BODY_FONT}`;
  wrapText(context, bhorta.line, 900, 2).forEach((line, index) => fitText(context, [{ text: line, color: MUTED, weight: 500 }], W / 2, layout.line + index * layout.lineGap, 36, 940, "center"));
  const why = card.friend ? pairLine(card, card.friend) : `কেন? ${reason(card.answers)}`;
  fitText(context, [{ text: why, color: TURMERIC, weight: 700 }], W / 2, layout.reason, 32, 960, "center");
  drawFooterBand(context, format, "তুমি কোন ভর্তা?", site, { band: FOOTER, ask: TURMERIC, site: CREAM });
}

export const plateBlob = (card: PlateCard, format: CardFormat, site: string) => renderCard(canvas => drawPlateCard(canvas, card, format, site));
