import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, wrapText, BODY_FONT, DISPLAY_FONT, type CardFormat } from "../../../shared/card-canvas";
import { bn, bucketOf, comment, heartAge, possessive, ticketNumber, type Reading } from "./moner-boyos";

// মেলার ওজন মাপার মেশিন: the magenta coin-op scale with a ring of bulbs, a big round dial and a slot that
// prints a little cardboard ticket. This one weighs the heart and prints its age.
const W = 1080;
export const INK = "#2a1420";
export const MUTED = "#7a5a66";
export const BODY = "#a8326a";
export const BODY_DEEP = "#6e1c45";
export const BULB = "#ffd34d";
export const FACE = "#fff8e7";
export const NEEDLE = "#d7263d";
const TICKET = "#fff2c2";
const BG = "#fbe3b4";
const FLAGS = ["#d7263d", "#1f8a70", "#f2a900", "#2a6fdb", "#a8326a"];

export type TicketCard = Reading & { friend?: Reading | null };

/** Dial geometry, shared with the page's SVG: ages 10–70 sweep 240° clockwise from lower left. */
export const DIAL_MIN = 10, DIAL_MAX = 70;
export const dialAngle = (age: number) => 150 + ((Math.min(Math.max(age, DIAL_MIN), DIAL_MAX + 2) - DIAL_MIN) / (DIAL_MAX - DIAL_MIN)) * 240;
const rad = (degrees: number) => (degrees * Math.PI) / 180;

function drawBackdrop(context: CanvasRenderingContext2D, height: number) {
  context.fillStyle = BG;
  context.fillRect(0, 0, W, height);
  const glow = context.createRadialGradient(W / 2, height * 0.35, 80, W / 2, height * 0.35, 760);
  glow.addColorStop(0, "rgba(255,255,255,0.55)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, W, height);
  // Mela bunting: a sagging string with paper flags.
  const sag = (x: number) => 26 + 44 * Math.sin((Math.PI * x) / W);
  context.strokeStyle = "#7a4a2a"; context.lineWidth = 3;
  context.beginPath();
  for (let x = 0; x <= W; x += 20) x ? context.lineTo(x, sag(x)) : context.moveTo(x, sag(x));
  context.stroke();
  for (let i = 0, x = 18; x < W; i++, x += 72) {
    const y1 = sag(x), y2 = sag(x + 52);
    context.fillStyle = FLAGS[i % FLAGS.length];
    context.beginPath(); context.moveTo(x, y1); context.lineTo(x + 52, y2); context.lineTo(x + 26, (y1 + y2) / 2 + 58); context.closePath(); context.fill();
  }
}

type Machine = { cx: number; top: number; r: number; dialR: number; bottom: number };

function drawMachine(context: CanvasRenderingContext2D, m: Machine, age: number) {
  const { cx, top, r, dialR, bottom } = m;
  const archY = top + r;
  const body = () => { context.beginPath(); context.arc(cx, archY, r, Math.PI, 0); context.lineTo(cx + r, bottom - 30); context.arcTo(cx + r, bottom, cx + r - 30, bottom, 30); context.lineTo(cx - r + 30, bottom); context.arcTo(cx - r, bottom, cx - r, bottom - 30, 30); context.closePath(); };
  context.save();
  context.shadowColor = "rgba(70,20,40,0.35)"; context.shadowBlur = 40; context.shadowOffsetY = 18;
  const paint = context.createLinearGradient(cx - r, 0, cx + r, 0);
  paint.addColorStop(0, BODY_DEEP); paint.addColorStop(0.18, BODY); paint.addColorStop(0.5, "#c24a84"); paint.addColorStop(0.82, BODY); paint.addColorStop(1, BODY_DEEP);
  context.fillStyle = paint; body(); context.fill();
  context.restore();
  // Chrome trim just inside the edge.
  context.strokeStyle = "#f3dbe6"; context.lineWidth = 6;
  context.beginPath(); context.arc(cx, archY, r - 18, Math.PI, 0); context.stroke();
  // Bulbs around the arch.
  for (let i = 0; i <= 10; i++) {
    const angle = Math.PI + (Math.PI * i) / 10;
    const x = cx + Math.cos(angle) * (r - 44), y = archY + Math.sin(angle) * (r - 44);
    const halo = context.createRadialGradient(x, y, 4, x, y, 30);
    halo.addColorStop(0, "rgba(255,226,120,0.9)"); halo.addColorStop(1, "rgba(255,226,120,0)");
    context.fillStyle = halo; context.beginPath(); context.arc(x, y, 30, 0, Math.PI * 2); context.fill();
    context.fillStyle = BULB; context.beginPath(); context.arc(x, y, 13, 0, Math.PI * 2); context.fill();
  }
  drawDial(context, cx, archY + 14, dialR, age);
}

function drawDial(context: CanvasRenderingContext2D, cx: number, cy: number, radius: number, age: number) {
  context.fillStyle = "#e9d3dc"; context.beginPath(); context.arc(cx, cy, radius + 16, 0, Math.PI * 2); context.fill();
  context.fillStyle = FACE; context.beginPath(); context.arc(cx, cy, radius, 0, Math.PI * 2); context.fill();
  context.strokeStyle = INK; context.lineWidth = 5; context.stroke();
  context.lineCap = "round";
  for (let value = DIAL_MIN; value <= DIAL_MAX; value += 2) {
    const angle = rad(dialAngle(value)), major = value % 10 === 0;
    const inner = radius - (major ? 34 : 20), outer = radius - 10;
    context.strokeStyle = major ? INK : MUTED; context.lineWidth = major ? 5 : 2.5;
    context.beginPath(); context.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner); context.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer); context.stroke();
    if (major) {
      context.font = `700 ${Math.round(radius * 0.15)}px ${BODY_FONT}`; context.fillStyle = INK; context.textAlign = "center"; context.textBaseline = "middle";
      context.fillText(bn(value), cx + Math.cos(angle) * (radius - 62), cy + Math.sin(angle) * (radius - 62));
    }
  }
  context.textBaseline = "alphabetic";
  fitText(context, [{ text: "মনের বয়স", color: MUTED, weight: 700 }], cx, cy + radius * 0.5, Math.round(radius * 0.13), radius, "center");
  const angle = rad(dialAngle(age));
  context.strokeStyle = NEEDLE; context.lineWidth = 9;
  context.beginPath(); context.moveTo(cx - Math.cos(angle) * radius * 0.16, cy - Math.sin(angle) * radius * 0.16); context.lineTo(cx + Math.cos(angle) * radius * 0.78, cy + Math.sin(angle) * radius * 0.78); context.stroke();
  context.fillStyle = INK; context.beginPath(); context.arc(cx, cy, radius * 0.09, 0, Math.PI * 2); context.fill();
  context.fillStyle = BULB; context.beginPath(); context.arc(cx, cy, radius * 0.035, 0, Math.PI * 2); context.fill();
}

function drawPlate(context: CanvasRenderingContext2D, cx: number, y: number) {
  roundedRect(context, cx - 250, y, 500, 64, 14);
  context.fillStyle = INK; context.fill();
  fitText(context, [{ text: "মনের বয়স মাপার যন্ত্র", color: BULB, weight: 700, display: true }], cx, y + 44, 34, 460, "center");
}

/** Draws the slot's lip over the ticket's top edge so the ticket looks like it's coming out. */
function drawSlot(context: CanvasRenderingContext2D, cx: number, y: number) {
  roundedRect(context, cx - 330, y, 660, 34, 17);
  context.fillStyle = "#1b0c14"; context.fill();
  context.fillStyle = "rgba(255,255,255,0.25)"; context.fillRect(cx - 310, y + 26, 620, 3);
}

function drawStamp(context: CanvasRenderingContext2D, x: number, y: number, label: string) {
  context.save();
  context.translate(x, y); context.rotate(rad(-12));
  context.strokeStyle = BODY; context.lineWidth = 5;
  context.beginPath(); context.arc(0, 0, 96, 0, Math.PI * 2); context.stroke();
  context.lineWidth = 2;
  context.beginPath(); context.arc(0, 0, 84, 0, Math.PI * 2); context.stroke();
  const space = label.lastIndexOf(" ");
  fitText(context, [{ text: label.slice(0, space), color: BODY, weight: 800, display: true }], 0, -2, 40, 146, "center");
  fitText(context, [{ text: label.slice(space + 1), color: BODY, weight: 800, display: true }], 0, 44, 40, 146, "center");
  context.restore();
}

function drawTicket(context: CanvasRenderingContext2D, card: TicketCard, x: number, y: number, width: number, height: number) {
  const age = heartAge(card.answers), bucket = bucketOf(age);
  context.save();
  context.translate(x + width / 2, y + height / 2); context.rotate(rad(-1.5)); context.translate(-width / 2, -height / 2);
  context.shadowColor = "rgba(70,20,40,0.28)"; context.shadowBlur = 26; context.shadowOffsetY = 10;
  context.fillStyle = TICKET; context.fillRect(0, 0, width, height);
  context.shadowColor = "transparent";
  // Punched edge notches and a perforation line, like the cardboard tickets.
  context.fillStyle = BG;
  for (let notchY = 40; notchY < height - 20; notchY += 56) { context.beginPath(); context.arc(0, notchY, 9, 0, Math.PI * 2); context.arc(width, notchY, 9, 0, Math.PI * 2); context.fill(); }
  const pad = 56;
  fitText(context, [{ text: "মনের মাপের টিকিট", color: BODY, weight: 800, display: true }], pad, 92, 40, width - 300);
  // With a friend's link, the corner shows their age instead of the ticket number: the two tickets side by side.
  if (card.friend) fitText(context, [{ text: `${card.friend.name ? possessive(card.friend.name) : "বন্ধুর"} মন `, color: MUTED, weight: 700 }, { text: bn(heartAge(card.friend.answers)), color: BODY, weight: 800 }], width - pad, 90, 32, 260, "right");
  else fitText(context, [{ text: `নং ${ticketNumber(card.answers)}`, color: MUTED, weight: 600 }], width - pad, 90, 28, 200, "right");
  context.strokeStyle = "#d9b98a"; context.lineWidth = 3; context.setLineDash([10, 10]);
  context.beginPath(); context.moveTo(pad, 124); context.lineTo(width - pad, 124); context.stroke(); context.setLineDash([]);
  let cursor = 184;
  if (card.name) { fitText(context, [{ text: "নাম: ", color: MUTED, weight: 600 }, { text: card.name, color: INK, weight: 700 }], pad, cursor, 38, width - 320); cursor += 56; }
  fitText(context, [{ text: "মনের বয়স", color: MUTED, weight: 600 }], pad, cursor, 34, 300);
  const ageSize = fitText(context, [{ text: bn(age), color: BODY, weight: 800, display: true }], pad, cursor + 152, 180, 300);
  context.font = `800 ${ageSize}px ${DISPLAY_FONT}`;
  fitText(context, [{ text: "বছর", color: INK, weight: 700, display: true }], pad + context.measureText(bn(age)).width + 22, cursor + 152, 76, 160);
  drawStamp(context, width - 150, cursor + 66, bucket.label);
  cursor += 214;
  context.font = `600 40px ${BODY_FONT}`;
  const lines = wrapText(context, comment(card.answers), width - pad * 2 - 130, 2);
  fitText(context, [{ text: "মন্তব্য:", color: MUTED, weight: 700 }], pad, cursor, 34, 150);
  lines.forEach((line, index) => fitText(context, [{ text: line, color: INK, weight: 600 }], pad + 130, cursor + index * 54, 40, width - pad * 2 - 130));
  fitText(context, [{ text: "৮টা চেনা পছন্দে মাপা", color: MUTED, weight: 500 }], width / 2, height - 34, 26, width - pad * 2, "center");
  context.restore();
}

const layouts = {
  feed: { top: 100, r: 300, dialR: 172, ticket: 630, ticketHeight: 596 },
  story: { top: 330, r: 350, dialR: 215, ticket: 1040, ticketHeight: 596 },
} as const;

export function drawTicketCard(canvas: HTMLCanvasElement, card: TicketCard, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  drawBackdrop(context, height);
  if (format === "story") fitText(context, [{ text: "মেলার মেশিনে মনের মাপ · একটুখানি", color: MUTED, weight: 700 }], W / 2, 290, 32, 900, "center");
  const slotY = layout.ticket - 20;
  const plateY = layout.top + layout.r + 14 + layout.dialR + 28;
  drawMachine(context, { cx: W / 2, top: layout.top, r: layout.r, dialR: layout.dialR, bottom: slotY + 70 }, heartAge(card.answers));
  // Only the tall story machine has room for the name plate between dial and slot.
  if (plateY + 70 < slotY) drawPlate(context, W / 2, plateY);
  drawTicket(context, card, 160, layout.ticket, 760, layout.ticketHeight);
  drawSlot(context, W / 2, slotY);
  drawFooterBand(context, format, "তোমার মনের বয়স কত?", site, { band: "#4a1230", ask: BULB, site: "#ffffff" });
}

export const ticketBlob = (card: TicketCard, format: CardFormat, site: string) => renderCard(canvas => drawTicketCard(canvas, card, format, site));
