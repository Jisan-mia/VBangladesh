import { BODY_FONT, DISPLAY_FONT, cardSizes, drawFooterBand, renderCard, wrapText, type CardFormat } from "../../../shared/card-canvas";
import { cardWords, dateParts, dateText, humanLine, occasionById, replyLine, replyTo, timeText, type Invite, type Shared } from "./invite";

type Ctx = CanvasRenderingContext2D;
type Palette = ReturnType<typeof occasionById>["palette"];
type Item = { height: number; draw: (top: number) => void };

const TAU = Math.PI * 2;
const INVITE_ASK = "তুমি আসছ তো?";
const REPLY_ASK = "তোমার দাওয়াতটা কবে?";
const noise = (seed: number) => { const value = Math.sin(seed * 12.9898) * 43758.5453; return value - Math.floor(value); };

function setup(canvas: HTMLCanvasElement, format: CardFormat) {
  const { width, height } = cardSizes[format];
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  return { ctx, width, height, story: format === "story", footerTop: format === "story" ? height - 260 : height - 96 };
}

const font = (size: number, weight = 600, display = false) => `${weight} ${size}px ${display ? DISPLAY_FONT : BODY_FONT}`;

/** Shrinks the font until the text fits, then returns the size. */
function fit(ctx: Ctx, text: string, size: number, maxWidth: number, weight: number, display: boolean) {
  ctx.font = font(size, weight, display);
  while (ctx.measureText(text).width > maxWidth && size > 18) { size -= 2; ctx.font = font(size, weight, display); }
  return size;
}

/** Centered text pressed into the card: a dark lower edge, a light upper edge, and a gold face. */
function goldText(ctx: Ctx, text: string, x: number, y: number, size: number, maxWidth: number, palette: Palette, weight = 700, display = true) {
  size = fit(ctx, text, size, maxWidth, weight, display);
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(0,0,0,.32)"; ctx.fillText(text, x + 2, y + 3);
  ctx.fillStyle = "rgba(255,255,255,.4)"; ctx.fillText(text, x - 1.5, y - 1.5);
  const [light, mid, dark] = palette.gold;
  const gradient = ctx.createLinearGradient(0, y - size * 0.85, 0, y + size * 0.15);
  gradient.addColorStop(0, light); gradient.addColorStop(0.5, mid); gradient.addColorStop(1, dark);
  ctx.fillStyle = gradient; ctx.fillText(text, x, y);
  return size;
}

function plainText(ctx: Ctx, text: string, x: number, y: number, size: number, maxWidth: number, color: string, weight = 600, display = false) {
  fit(ctx, text, size, maxWidth, weight, display);
  ctx.textAlign = "center"; ctx.fillStyle = color; ctx.fillText(text, x, y);
}

function goldFill(ctx: Ctx, palette: Palette, top: number, bottom: number) {
  const gradient = ctx.createLinearGradient(0, top, 0, bottom);
  gradient.addColorStop(0, palette.gold[0]); gradient.addColorStop(0.5, palette.gold[1]); gradient.addColorStop(1, palette.gold[2]);
  return gradient;
}

/** Thick card stock: a faint woven grain and a soft press toward the edges. */
function paper(ctx: Ctx, width: number, height: number, palette: Palette) {
  ctx.fillStyle = palette.paper; ctx.fillRect(0, 0, width, height);
  ctx.save(); ctx.globalAlpha = 0.05; ctx.strokeStyle = "#000"; ctx.lineWidth = 1;
  for (let x = -height; x < width; x += 7) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + height, height); ctx.stroke(); }
  ctx.restore();
  const vignette = ctx.createRadialGradient(width / 2, height / 2, height * 0.25, width / 2, height / 2, height * 0.75);
  vignette.addColorStop(0, "rgba(255,255,255,.07)"); vignette.addColorStop(1, "rgba(0,0,0,.2)");
  ctx.fillStyle = vignette; ctx.fillRect(0, 0, width, height);
}

/** A raised gold rule: shadow, highlight, gold. */
function embossStroke(ctx: Ctx, path: () => void, width: number, palette: Palette, top: number, bottom: number) {
  ctx.lineWidth = width;
  ctx.save(); ctx.translate(2, 2.5); path(); ctx.strokeStyle = "rgba(0,0,0,.3)"; ctx.stroke(); ctx.restore();
  ctx.save(); ctx.translate(-1, -1); path(); ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.stroke(); ctx.restore();
  path(); ctx.strokeStyle = goldFill(ctx, palette, top, bottom); ctx.stroke();
}

/** কলকা (paisley) with its tip curling right; size is the body height. */
function kolka(ctx: Ctx, x: number, y: number, size: number, angle: number, palette: Palette) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
  const body = (s: number) => () => {
    ctx.beginPath();
    ctx.moveTo(0, s * 0.5);
    ctx.bezierCurveTo(-s * 0.55, s * 0.5, -s * 0.6, -s * 0.15, -s * 0.12, -s * 0.38);
    ctx.bezierCurveTo(s * 0.12, -s * 0.5, s * 0.32, -s * 0.62, s * 0.22, -s * 0.9);
    ctx.bezierCurveTo(s * 0.62, -s * 0.55, s * 0.55, s * 0.5, 0, s * 0.5);
    ctx.closePath();
  };
  embossStroke(ctx, body(size), 4, palette, -size, size);
  embossStroke(ctx, body(size * 0.6), 2.5, palette, -size, size);
  ctx.beginPath(); ctx.arc(-size * 0.04, size * 0.12, size * 0.1, 0, TAU); ctx.fillStyle = goldFill(ctx, palette, -size, size); ctx.fill();
  ctx.restore();
}

/** পান পাতা: a heart-shaped betel leaf pointing up from its stem at (0,0). */
function panLeaf(ctx: Ctx, x: number, y: number, length: number, angle: number, palette: Palette) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
  const L = length;
  ctx.beginPath();
  ctx.moveTo(0, -L * 0.16);
  ctx.bezierCurveTo(-L * 0.16, -L * 0.02, -L * 0.56, 0, -L * 0.56, -L * 0.32);
  ctx.bezierCurveTo(-L * 0.56, -L * 0.6, -L * 0.2, -L * 0.8, 0, -L);
  ctx.bezierCurveTo(L * 0.2, -L * 0.8, L * 0.56, -L * 0.6, L * 0.56, -L * 0.32);
  ctx.bezierCurveTo(L * 0.56, 0, L * 0.16, -L * 0.02, 0, -L * 0.16);
  ctx.closePath();
  ctx.save(); ctx.translate(2, 3); ctx.fillStyle = "rgba(0,0,0,.28)"; ctx.fill(); ctx.restore();
  ctx.fillStyle = goldFill(ctx, palette, -L, 0); ctx.fill();
  ctx.strokeStyle = palette.gold[2]; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, L * 0.12); ctx.lineTo(0, -L * 0.16); ctx.quadraticCurveTo(L * 0.04, -L * 0.55, 0, -L * 0.92); ctx.stroke();
  for (const side of [-1, 1]) for (const t of [0.3, 0.5, 0.68]) {
    ctx.beginPath(); ctx.moveTo(side * 0.01 * L, -L * t); ctx.quadraticCurveTo(side * L * 0.22, -L * (t + 0.02), side * L * 0.34, -L * (t + 0.14)); ctx.stroke();
  }
  ctx.restore();
}

/** Two crossed betel leaves with a bud between and a flourish either side. */
function topOrnament(ctx: Ctx, cx: number, y: number, palette: Palette) {
  embossStroke(ctx, () => { ctx.beginPath(); ctx.moveTo(cx - 300, y - 30); ctx.lineTo(cx - 110, y - 30); ctx.moveTo(cx + 110, y - 30); ctx.lineTo(cx + 300, y - 30); }, 3, palette, y - 40, y - 20);
  for (const side of [-1, 1]) { ctx.beginPath(); ctx.arc(cx + side * 312, y - 30, 7, 0, TAU); ctx.fillStyle = goldFill(ctx, palette, y - 40, y - 20); ctx.fill(); }
  panLeaf(ctx, cx - 10, y - 4, 92, -0.72, palette);
  panLeaf(ctx, cx + 10, y - 4, 92, 0.72, palette);
  ctx.beginPath(); ctx.arc(cx, y - 8, 14, 0, TAU); ctx.fillStyle = palette.ribbon; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = palette.gold[1]; ctx.stroke();
}

/** Double gold border with beads, কলকা in three corners; the fourth is under the ribbon. */
function frame(ctx: Ctx, width: number, top: number, bottom: number, palette: Palette, allCorners = false) {
  const inset = 44;
  const rect = (pad: number, radius: number) => () => { ctx.beginPath(); ctx.roundRect(inset + pad, top + pad, width - 2 * (inset + pad), bottom - top - 2 * pad, radius); };
  embossStroke(ctx, rect(0, 22), 7, palette, top, bottom);
  embossStroke(ctx, rect(20, 12), 2.5, palette, top, bottom);
  ctx.fillStyle = goldFill(ctx, palette, top, bottom);
  const left = inset + 34, right = width - inset - 34, upper = top + 34, lower = bottom - 34;
  for (let x = left + 40; x < right - 40; x += 34) for (const y of [upper, lower]) { ctx.beginPath(); ctx.arc(x, y, 3.2, 0, TAU); ctx.fill(); }
  for (let y = upper + 40; y < lower - 40; y += 34) for (const x of [left, right]) { ctx.beginPath(); ctx.arc(x, y, 3.2, 0, TAU); ctx.fill(); }
  kolka(ctx, left + 46, upper + 52, 64, -Math.PI * 0.75 + Math.PI, palette);
  kolka(ctx, left + 46, lower - 52, 64, -Math.PI * 0.25 + Math.PI, palette);
  kolka(ctx, right - 46, lower - 52, 64, Math.PI * 0.25 + Math.PI, palette);
  if (allCorners) kolka(ctx, right - 46, upper + 52, 64, Math.PI * 0.75 + Math.PI, palette);
}

/** The red satin ribbon tied across the top-right corner, with a bow. */
function ribbon(ctx: Ctx, width: number, palette: Palette) {
  const start = { x: width - 360, y: 0 }, end = { x: width, y: 360 }, half = 30;
  ctx.save();
  ctx.translate(0, 0);
  const band = ctx.createLinearGradient(start.x, start.y + half, start.x + half, start.y - half);
  band.addColorStop(0, palette.ribbon); band.addColorStop(0.45, "rgba(255,255,255,.35)"); band.addColorStop(0.55, palette.ribbon); band.addColorStop(1, "rgba(0,0,0,.35)");
  ctx.beginPath();
  ctx.moveTo(start.x - half * 1.41, start.y); ctx.lineTo(start.x + half * 1.41, start.y); ctx.lineTo(end.x, end.y - half * 1.41); ctx.lineTo(end.x, end.y + half * 1.41);
  ctx.closePath();
  ctx.shadowColor = "rgba(0,0,0,.35)"; ctx.shadowBlur = 12; ctx.shadowOffsetY = 6;
  ctx.fillStyle = palette.ribbon; ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.fillStyle = band; ctx.globalAlpha = 0.5; ctx.fill(); ctx.globalAlpha = 1;
  ctx.strokeStyle = palette.gold[1]; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(start.x - half * 1.1, start.y); ctx.lineTo(end.x, end.y - half * 1.1); ctx.moveTo(start.x + half * 1.1, start.y); ctx.lineTo(end.x, end.y + half * 1.1); ctx.stroke();
  // bow at the band's middle
  const bx = (start.x + end.x) / 2, by = (start.y + end.y) / 2;
  ctx.translate(bx, by); ctx.rotate(Math.PI / 4);
  for (const side of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(side * 26, 96); ctx.lineTo(side * 6, 84); ctx.lineTo(side * -6, 104); ctx.closePath();
    ctx.fillStyle = palette.ribbon; ctx.fill(); ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.fill();
  }
  for (const side of [-1, 1]) {
    ctx.beginPath(); ctx.ellipse(side * 52, -6, 54, 30, side * 0.25, 0, TAU);
    ctx.shadowColor = "rgba(0,0,0,.3)"; ctx.shadowBlur = 8; ctx.fillStyle = palette.ribbon; ctx.fill(); ctx.shadowColor = "transparent";
    ctx.beginPath(); ctx.ellipse(side * 50, -6, 30, 12, side * 0.25, 0, TAU); ctx.fillStyle = "rgba(0,0,0,.28)"; ctx.fill();
  }
  ctx.beginPath(); ctx.roundRect(-17, -24, 34, 36, 12); ctx.fillStyle = palette.ribbon; ctx.fill(); ctx.fillStyle = "rgba(255,255,255,.2)"; ctx.fill();
  ctx.restore();
}

/** Stacks items in [top, bottom], centring the block and sharing spare room as gaps (capped so a short card doesn't drift apart). */
function flow(items: Item[], top: number, bottom: number, maxGap: number) {
  const total = items.reduce((sum, item) => sum + item.height, 0);
  const gap = Math.max(0, Math.min(maxGap, (bottom - top - total) / (items.length + 1)));
  let y = top + Math.max(0, (bottom - top - total - gap * (items.length - 1)) / 2);
  for (const item of items) { item.draw(y); y += item.height + gap; }
}

function pin(ctx: Ctx, x: number, y: number, color: string) {
  ctx.save(); ctx.translate(x, y); ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(0, -14, 13, Math.PI * 0.85, Math.PI * 2.15); ctx.lineTo(0, 10); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -14, 5, 0, TAU); ctx.globalCompositeOperation = "destination-out"; ctx.fill();
  ctx.restore();
}

export function drawInvite(canvas: HTMLCanvasElement, invite: Invite, format: CardFormat, site: string) {
  const { ctx, width, story, footerTop } = setup(canvas, format);
  const occasion = occasionById(invite.occasion);
  const palette = occasion.palette;
  const cx = width / 2, maxWidth = 760;
  paper(ctx, width, canvas.height, palette);
  const frameTop = story ? 60 : 40, frameBottom = footerTop - (story ? 40 : 30);
  frame(ctx, width, frameTop, frameBottom, palette);
  ribbon(ctx, width, palette);

  const words = cardWords(invite);
  const parts = dateParts(invite.date);
  const time = timeText(invite.time);
  const items: Item[] = [
    { height: 100, draw: top => topOrnament(ctx, cx, top + 96, palette) },
    { height: 56, draw: top => goldText(ctx, occasion.heading, cx, top + 46, 46, maxWidth, palette, 700, true) },
  ];
  const nameSize = words.big.length > 1 ? 124 : 132;
  words.big.forEach((name, index) => {
    if (index) items.push({ height: 54, draw: top => goldText(ctx, "ও", cx, top + 46, 52, 200, palette, 600, true) });
    items.push({ height: nameSize * 1.12, draw: top => goldText(ctx, name, cx, top + nameSize * 0.92, nameSize, maxWidth, palette, 800, true) });
  });
  if (words.host) items.push({ height: 50, draw: top => plainText(ctx, words.host, cx, top + 38, 38, maxWidth, palette.ink, 700, true) });
  ctx.font = font(34, 500);
  const inviteLines = wrapText(ctx, occasion.invite, maxWidth - 60, 2);
  items.push({ height: inviteLines.length * 50, draw: top => inviteLines.forEach((line, index) => plainText(ctx, line, cx, top + 38 + index * 50, 34, maxWidth, palette.ink, 500)) });
  if (parts || time) items.push({
    height: parts ? 190 : 60,
    draw: top => {
      const small = [parts?.bangla, time && `${time}${invite.occasion === "khela" ? " (বাংলাদেশ সময়)" : ""}`].filter(Boolean).join("  ·  ");
      if (parts) {
        embossStroke(ctx, () => { ctx.beginPath(); ctx.moveTo(cx - 330, top); ctx.lineTo(cx + 330, top); ctx.moveTo(cx - 330, top + 128); ctx.lineTo(cx + 330, top + 128); ctx.moveTo(cx - 92, top + 22); ctx.lineTo(cx - 92, top + 106); ctx.moveTo(cx + 92, top + 22); ctx.lineTo(cx + 92, top + 106); }, 2.5, palette, top, top + 128);
        plainText(ctx, parts.weekday, cx - 210, top + 78, 38, 220, palette.ink, 700, true);
        goldText(ctx, parts.day, cx, top + 100, 104, 170, palette, 800, true);
        plainText(ctx, parts.month, cx + 210, top + 62, 36, 220, palette.ink, 700, true);
        plainText(ctx, parts.year, cx + 210, top + 104, 30, 220, palette.soft, 600);
      }
      if (small) plainText(ctx, small, cx, top + (parts ? 176 : 42), 30, maxWidth, palette.soft, 600);
    },
  });
  if (invite.place) items.push({
    height: 56,
    draw: top => {
      const size = fit(ctx, invite.place, 36, maxWidth - 60, 600, false);
      const textWidth = ctx.measureText(invite.place).width;
      pin(ctx, cx - textWidth / 2 - 26, top + 40, palette.ribbon);
      plainText(ctx, invite.place, cx + 18, top + 42, size, maxWidth - 60, palette.ink, 600);
    },
  });
  ctx.font = font(36, 700, true);
  const lineLines = wrapText(ctx, humanLine(invite), 660, 2);
  items.push({
    height: lineLines.length * 52 + 20,
    draw: top => {
      ctx.save(); ctx.globalAlpha = 0.14; ctx.fillStyle = palette.ink;
      ctx.beginPath(); ctx.roundRect(cx - 370, top, 740, lineLines.length * 52 + 20, 40); ctx.fill(); ctx.restore();
      lineLines.forEach((line, index) => plainText(ctx, line, cx, top + 50 + index * 52, 36, 680, palette.ink, 700, true));
    },
  });
  // Story text stays clear of the app bars (storySafe): the frame interior starts lower and ends at the footer band.
  flow(items, story ? 250 : frameTop + 40, frameBottom - (story ? 50 : 44), story ? 56 : 22);
  drawFooterBand(ctx, format, INVITE_ASK, site, palette.band);
}

/** The wax seal pressed onto the reply: scalloped red disc, gold ring, "আসছি!". */
function seal(ctx: Ctx, cx: number, cy: number, radius: number, palette: Palette) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.12);
  ctx.beginPath();
  for (let i = 0; i <= 72; i++) {
    const angle = (i / 72) * TAU, r = radius * (1 + 0.045 * Math.sin(i * 1.5) + 0.03 * (noise(i) - 0.5));
    if (i) ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r); else ctx.moveTo(r, 0);
  }
  ctx.closePath();
  ctx.shadowColor = "rgba(0,0,0,.4)"; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10;
  const wax = ctx.createRadialGradient(-radius * 0.3, -radius * 0.35, radius * 0.1, 0, 0, radius * 1.05);
  // Sealing wax is red on every card, whatever the ribbon colour.
  wax.addColorStop(0, "#ff6a5c"); wax.addColorStop(0.35, "#c4161c"); wax.addColorStop(1, "#4a0508");
  ctx.fillStyle = wax; ctx.fill(); ctx.shadowColor = "transparent";
  ctx.beginPath(); ctx.arc(0, 0, radius * 0.78, 0, TAU); ctx.lineWidth = 6; ctx.strokeStyle = "rgba(0,0,0,.25)"; ctx.stroke();
  ctx.beginPath(); ctx.arc(-1, -1, radius * 0.78, 0, TAU); ctx.lineWidth = 3; ctx.strokeStyle = palette.gold[1]; ctx.stroke();
  for (let i = 0; i < 16; i++) { const angle = (i / 16) * TAU; ctx.beginPath(); ctx.arc(Math.cos(angle) * radius * 0.88, Math.sin(angle) * radius * 0.88, 4, 0, TAU); ctx.fillStyle = palette.gold[1]; ctx.fill(); }
  goldText(ctx, "আসছি!", 0, radius * 0.18, radius * 0.5, radius * 1.3, palette, 800, true);
  ctx.restore();
}

/** Marigold and rose petals thrown around the seal. */
function petals(ctx: Ctx, cx: number, cy: number, spread: number) {
  const colors = ["#f7a21b", "#f4c430", "#e8590c", "#d6336c", "#fff3bf"];
  for (let i = 0; i < 46; i++) {
    const angle = noise(i + 1) * TAU, distance = spread * (0.62 + noise(i + 50) * 0.75);
    const x = cx + Math.cos(angle) * distance * 1.5, y = cy + Math.sin(angle) * distance * 0.9;
    ctx.save(); ctx.translate(x, y); ctx.rotate(noise(i + 90) * TAU);
    ctx.beginPath(); ctx.ellipse(0, 0, 9 + noise(i + 7) * 8, 5 + noise(i + 3) * 4, 0, 0, TAU);
    ctx.fillStyle = colors[i % colors.length]; ctx.globalAlpha = 0.9; ctx.fill();
    ctx.restore();
  }
}

export function drawReply(canvas: HTMLCanvasElement, shared: Shared, format: CardFormat, site: string) {
  const { ctx, width, story, footerTop } = setup(canvas, format);
  const palette = occasionById(shared.occasion).palette;
  const cx = width / 2, maxWidth = 800;
  paper(ctx, width, canvas.height, palette);
  const frameTop = story ? 60 : 40, frameBottom = footerTop - (story ? 40 : 30);
  frame(ctx, width, frameTop, frameBottom, palette, true);
  const sealRadius = story ? 240 : 180;
  const when = dateText(shared.date);
  const guest = shared.guest ?? "";
  ctx.font = font(64, 800, true);
  const pickLines = wrapText(ctx, replyLine(shared), maxWidth, 2);
  const items: Item[] = [
    { height: 44, draw: top => goldText(ctx, "দাওয়াতের উত্তর", cx, top + 36, 36, maxWidth, palette, 700, true) },
    { height: 64, draw: top => plainText(ctx, replyTo(shared), cx, top + 50, 50, maxWidth, palette.ink, 700, true) },
    { height: sealRadius * 2 + 40, draw: top => { petals(ctx, cx, top + sealRadius + 20, sealRadius); seal(ctx, cx, top + sealRadius + 20, sealRadius, palette); } },
    { height: pickLines.length * 80, draw: top => pickLines.forEach((line, index) => plainText(ctx, line, cx, top + 64 + index * 80, 64, maxWidth, palette.ink, 800, true)) },
  ];
  if (when) items.push({ height: 50, draw: top => plainText(ctx, `${when}, দেখা হচ্ছে`, cx, top + 40, 36, maxWidth, palette.soft, 600) });
  if (guest) items.push({ height: 84, draw: top => goldText(ctx, `— ${guest}`, cx, top + 66, 66, maxWidth, palette, 800, true) });
  flow(items, story ? 250 : frameTop + 30, frameBottom - (story ? 50 : 30), story ? 80 : 26);
  drawFooterBand(ctx, format, REPLY_ASK, site, palette.band);
}

export const inviteBlob = (invite: Invite, format: CardFormat, site: string) => renderCard(canvas => drawInvite(canvas, invite, format, site));
export const replyBlob = (shared: Shared, format: CardFormat, site: string) => renderCard(canvas => drawReply(canvas, shared, format, site));
