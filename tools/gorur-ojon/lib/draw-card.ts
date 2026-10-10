import { BODY_FONT, cardSizes, drawFooterBand, fitText, renderCard, roundedRect, type CardFormat } from "../../../shared/card-canvas";
import { colors, cow as cowParts, fence, labelSpots, paint, place, shadow, stretch, tagAnchor, VIEW } from "./art";
import { bn, bowlLine, bowls, cowTitle, kgText, lbText, meatText, monText, packetLabel, packetText, possessive, shareEquation, splitMeat, toInches, unitLabel, weightLine, weightOf, type Cow } from "./ojon";

const INK = "#3a2210";
const ORANGE = "#c4560b";
const BAND = "#4a2410";
const ASK = "#ffc94a";
const SKY = "#cfe8f6";
const SKY_LOW = "#eef7fc";
const EARTH = "#e3c48d";

const sizeText = (value: number, cow: Cow) => `${bn(value)} ${unitLabel[cow.unit]}`;

function chip(context: CanvasRenderingContext2D, text: string, cx: number, cy: number, size: number) {
  context.font = `700 ${size}px ${BODY_FONT}`;
  const width = context.measureText(text).width + size * 1.1;
  const height = size * 1.75;
  context.fillStyle = "#fff";
  roundedRect(context, cx - width / 2, cy - height / 2, width, height, height / 2);
  context.fill();
  context.strokeStyle = INK; context.lineWidth = 3; context.stroke();
  fitText(context, [{ text, color: INK, weight: 700 }], cx, cy + size * 0.36, size, width, "center");
}

/** The cow with its tapes, labels and name tag, drawn into a box `width` wide with its top-left at (x, y). */
function drawArt(context: CanvasRenderingContext2D, cow: Cow, x: number, y: number, width: number) {
  const k = width / VIEW.width;
  const scale = stretch(toInches(cow.girth, cow.unit), toInches(cow.length, cow.unit));
  context.save();
  context.translate(x, y);
  context.scale(k, k);
  paint(context, fence);
  context.save();
  context.translate(200, 248); context.scale(scale.x, scale.y); context.translate(-200, -248);
  paint(context, [shadow, ...cowParts]);
  context.restore();
  context.strokeStyle = INK; context.lineWidth = 1.6; context.setLineDash([3, 4]);
  for (const spot of [labelSpots.length, labelSpots.girth]) {
    const to = place(spot.target[0], spot.target[1], scale);
    context.beginPath(); context.moveTo(spot.x, spot.y + (spot === labelSpots.length ? 10 : -9)); context.lineTo(to.x, to.y); context.stroke();
  }
  context.setLineDash([]);
  context.restore();
  const at = (px: number, py: number) => ({ x: x + px * k, y: y + py * k });
  const length = at(labelSpots.length.x, labelSpots.length.y), girth = at(labelSpots.girth.x, labelSpots.girth.y);
  chip(context, `দৈর্ঘ্য ${sizeText(cow.length, cow)}`, length.x, length.y, 15 * k);
  chip(context, `বুকের বেড় ${sizeText(cow.girth, cow)}`, girth.x, girth.y, 15 * k);
  if (cow.name) {
    const anchor = place(tagAnchor.x, tagAnchor.y, scale);
    const top = at(anchor.x, anchor.y + 6), cy = at(anchor.x, anchor.y + 28).y;
    context.strokeStyle = colors.marigoldDeep; context.lineWidth = 2.4 * k / 2;
    context.beginPath(); context.moveTo(top.x, top.y); context.lineTo(top.x, cy - 10 * k); context.stroke();
    context.font = `800 ${13 * k}px ${BODY_FONT}`;
    const w = Math.min(context.measureText(cow.name).width + 18 * k, 150 * k), h = 22 * k;
    context.fillStyle = "#fff3d1";
    roundedRect(context, top.x - w / 2, cy - h / 2, w, h, 8 * k); context.fill();
    context.strokeStyle = colors.marigoldDeep; context.lineWidth = 3; context.stroke();
    fitText(context, [{ text: cow.name, color: INK, weight: 800, display: true }], top.x, cy + 5 * k, 13 * k, w - 12 * k, "center");
  }
}

const weightLayouts = {
  feed: { kicker: 92, title: 190, titleSize: 84, big: 318, bigSize: 120, sub: 386, art: 420, line: 1128, fine: 1178 },
  story: { kicker: 318, title: 428, titleSize: 96, big: 578, bigSize: 140, sub: 654, art: 700, line: 1440, fine: 1500 },
} as const;

function drawWeight(context: CanvasRenderingContext2D, cow: Cow, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = weightLayouts[format];
  const weight = weightOf(cow);
  const artWidth = 960, groundY = layout.art + 248 * (artWidth / VIEW.width);
  const sky = context.createLinearGradient(0, 0, 0, groundY);
  sky.addColorStop(0, SKY); sky.addColorStop(1, SKY_LOW);
  context.fillStyle = sky; context.fillRect(0, 0, width, groundY);
  context.fillStyle = EARTH; context.fillRect(0, groundY, width, height - groundY);
  context.fillStyle = "#ffe08a";
  context.beginPath(); context.arc(width - 150, layout.kicker + 60, 70, 0, Math.PI * 2); context.fill();
  const x = 84, w = 912;
  fitText(context, [{ text: "গরুর ওজন কত?", color: ORANGE, weight: 800, display: true }, { text: "  ·  ফিতার হিসাব", color: INK, weight: 500 }], x, layout.kicker, 34, w - 220);
  fitText(context, [{ text: cowTitle(cow.name), color: INK, weight: 800, display: true }], x, layout.title, layout.titleSize, w - 180);
  fitText(context, [{ text: "প্রায় ", color: INK, weight: 700, display: true }, { text: `${monText(weight.mon)} মণ`, color: ORANGE, weight: 800, display: true }], x, layout.big, layout.bigSize, w);
  fitText(context, [{ text: `${kgText(weight.kg)} কেজি  ·  ${lbText(weight.lb)} পাউন্ড`, color: INK, weight: 600 }], x, layout.sub, 40, w);
  drawArt(context, cow, 60, layout.art, artWidth);
  fitText(context, [{ text: weightLine(weight.mon, cow.name), color: INK, weight: 700, display: true }], x, layout.line, 38, w);
  fitText(context, [{ text: "আনুমানিক, ১০–২০% কমবেশি হতে পারে · বেড়² × দৈর্ঘ্য ÷ ৩০০ (ইঞ্চি → পাউন্ড) · ১ মণ = ৪০ কেজি", color: "#5d4127", weight: 500 }], x, layout.fine, 25, w);
  drawFooterBand(context, format, "তোমাদের গরুর নাম কী?", site, { band: BAND, ask: ASK, site: "#ffffff" });
}

/** শীতলপাটি: a woven mat with a red and green border. */
function drawMat(context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  context.save();
  roundedRect(context, x, y, w, h, 26); context.clip();
  context.fillStyle = "#ecc983"; context.fillRect(x, y, w, h);
  const cell = 34;
  context.strokeStyle = "#cfa257"; context.lineWidth = 3;
  for (let row = 0; row * cell < h; row++) {
    for (let col = 0; col * cell < w; col++) {
      const cx = x + col * cell, cy = y + row * cell;
      context.beginPath();
      for (let i = 1; i < 4; i++) {
        if ((row + col) % 2) { context.moveTo(cx + 4, cy + (cell / 4) * i); context.lineTo(cx + cell - 4, cy + (cell / 4) * i); }
        else { context.moveTo(cx + (cell / 4) * i, cy + 4); context.lineTo(cx + (cell / 4) * i, cy + cell - 4); }
      }
      context.stroke();
    }
  }
  context.lineWidth = 14;
  context.strokeStyle = "#b8432f"; context.strokeRect(x + 22, y + 22, w - 44, h - 44);
  context.lineWidth = 6;
  context.strokeStyle = "#3f7d4a"; context.strokeRect(x + 38, y + 38, w - 76, h - 76);
  context.restore();
}

/** A steel bowl with a domed lid and a marigold on the knob. Empty shares are drawn faint. */
function drawBowl(context: CanvasRenderingContext2D, cx: number, rimY: number, w: number, faint: boolean) {
  const h = w * 0.42;
  context.save();
  context.globalAlpha = faint ? 0.35 : 1;
  context.fillStyle = "rgba(74,36,16,.18)";
  context.beginPath(); context.ellipse(cx, rimY + h + 8, w * 0.38, 12, 0, 0, Math.PI * 2); context.fill();
  const steel = context.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0);
  steel.addColorStop(0, "#8f9aa2"); steel.addColorStop(0.35, "#e6ebee"); steel.addColorStop(1, "#7d8890");
  context.fillStyle = steel; context.strokeStyle = "#4d565c"; context.lineWidth = 4;
  context.beginPath();
  context.moveTo(cx - w / 2, rimY);
  context.bezierCurveTo(cx - w / 2, rimY + h * 0.9, cx - w * 0.28, rimY + h, cx, rimY + h);
  context.bezierCurveTo(cx + w * 0.28, rimY + h, cx + w / 2, rimY + h * 0.9, cx + w / 2, rimY);
  context.closePath(); context.fill(); context.stroke();
  const lid = context.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0);
  lid.addColorStop(0, "#a3adb4"); lid.addColorStop(0.4, "#f3f6f8"); lid.addColorStop(1, "#8d979e");
  context.fillStyle = lid;
  context.beginPath(); context.ellipse(cx, rimY, w * 0.46, w * 0.3, 0, Math.PI, Math.PI * 2); context.closePath(); context.fill(); context.stroke();
  context.fillStyle = "#dfe5e9";
  context.beginPath(); context.ellipse(cx, rimY, w / 2, w * 0.06, 0, 0, Math.PI * 2); context.fill(); context.stroke();
  context.fillStyle = "#c9d1d6";
  roundedRect(context, cx - 14, rimY - w * 0.3 - 16, 28, 20, 8); context.fill(); context.stroke();
  context.fillStyle = colors.marigold; context.strokeStyle = colors.marigoldDeep; context.lineWidth = 3;
  context.beginPath(); context.arc(cx, rimY - w * 0.3 - 26, 18, 0, Math.PI * 2); context.fill(); context.stroke();
  context.fillStyle = "#ffc06a";
  context.beginPath(); context.arc(cx - 4, rimY - w * 0.3 - 30, 6, 0, Math.PI * 2); context.fill();
  context.restore();
}

function drawSwag(context: CanvasRenderingContext2D, width: number, top: number) {
  const beads = 19;
  for (let i = 0; i < beads; i++) {
    const t = i / (beads - 1), x = 30 + t * (width - 60), y = top + Math.sin(t * Math.PI) * 70;
    context.fillStyle = i % 2 ? colors.yellow : colors.marigold; context.strokeStyle = colors.marigoldDeep; context.lineWidth = 3;
    context.beginPath(); context.arc(x, y, 20, 0, Math.PI * 2); context.fill(); context.stroke();
  }
}

const shareLayouts = {
  feed: { swag: 20, kicker: 168, eq: 270, eqSize: 92, packets: 336, mat: 380, matH: 680, kg: 556, rim: 742, label: 940, part: 984, line: 1140, fine: 1192 },
  story: { swag: 240, kicker: 400, eq: 510, eqSize: 100, packets: 580, mat: 640, matH: 700, kg: 800, rim: 990, label: 1200, part: 1246, line: 1430, fine: 1492 },
} as const;

function drawShares(context: CanvasRenderingContext2D, cow: Cow, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = shareLayouts[format];
  context.fillStyle = "#fbe2ad"; context.fillRect(0, 0, width, height);
  if (format === "feed") drawSwag(context, width, layout.swag); else drawSwag(context, width, layout.swag - 40);
  const x = 84, w = 912;
  fitText(context, [{ text: cow.name ? `${possessive(cow.name)} ভাগ` : "মাংসের ভাগ", color: ORANGE, weight: 800, display: true }, { text: "  ·  ঈদ মোবারক", color: INK, weight: 600 }], x, layout.kicker, 40, w);
  fitText(context, [{ text: shareEquation(cow), color: INK, weight: 800, display: true }], x, layout.eq, layout.eqSize, w);
  const packets = packetText(cow);
  fitText(context, [{ text: packets ? `আত্মীয় আর অভাবীদের জন্য ${packets} (${packetLabel[cow.packet]} করে)` : "এবার সবটা এক ভাগে", color: INK, weight: 600 }], x, layout.packets, 36, w);
  drawMat(context, 60, layout.mat, 960, layout.matH);
  const parts = splitMeat(cow.meat, cow.split);
  bowls.forEach((bowl, index) => {
    const cx = 230 + index * 310;
    fitText(context, [{ text: `${meatText(parts[index])} কেজি`, color: INK, weight: 800, display: true }], cx, layout.kg, 54, 250, "center");
    drawBowl(context, cx, layout.rim, 250, parts[index] === 0);
    fitText(context, [{ text: bowl.label, color: INK, weight: 700 }], cx, layout.label, 34, 280, "center");
    fitText(context, [{ text: `${bn(cow.split[index])} ভাগ`, color: "#6b4a2c", weight: 600 }], cx, layout.part, 28, 280, "center");
  });
  fitText(context, [{ text: bowlLine(cow), color: INK, weight: 700, display: true }], x, layout.line, 38, w);
  fitText(context, [{ text: "তিন ভাগ প্রচলিত রীতি, বাধ্যতামূলক নয় · ভাগ নিজের মতো বদলানো যায়", color: "#5d4127", weight: 500 }], x, layout.fine, 26, w);
  drawFooterBand(context, format, "তোমাদের ভাগ কেমন হলো?", site, { band: BAND, ask: ASK, site: "#ffffff" });
}

export function drawCard(canvas: HTMLCanvasElement, cow: Cow, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  if (cow.card === "bhag") drawShares(context, cow, format, site);
  else drawWeight(context, cow, format, site);
}

export const cardBlob = (cow: Cow, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, cow, format, site));
