import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, type CardFormat } from "../../../shared/card-canvas";
import { callLine, cleanName, humanLine, nickname, type Daknam, type Tap } from "./daknam";

// বারান্দা থেকে ডাক: an old lime-washed building, a grilled balcony with a gamchha on the clothesline and a money plant in a tin,
// a call from the doorway in a speech bubble, and the name on a marble name plate by the gate.
// The scene is drawn in its own 1080×900 box; feed and story place it at a different height.
export type Format = CardFormat | "stage";
export const sizes = { ...cardSizes, stage: { width: 1080, height: 900 } } as const;

const W = 1080;
const INK = "#2b1d16";
const MUTED = "#7a6658";
const RED = "#b83227";
const GRILL = "#17788c";
const GRILL_DARK = "#0f5562";
const WALL = "#ee9b7a";
const RECESS = "#c9765a";
const LEDGE = "#f8c9b0";
const skies: Record<Tap, [string, string]> = { 0: ["#f39c63", "#fde3c8"], 1: ["#3fa6e0", "#c4e8f8"], 2: ["#0d1736", "#2a3b70"] };
// Fixed star positions (scene coordinates; negative y reaches the taller story sky).
const stars = [[90, 60], [230, 140], [340, 40], [470, 110], [610, 30], [760, 150], [880, 220], [1030, 40], [150, -120], [420, -200], [700, -90], [960, -240], [300, -280], [820, -300]] as const;

/** Where the call bubble sits in the scene; the page overlays live text at the same place. */
export const bubble = { x: 60, y: 34, width: 840, height: 180 } as const;

// The clothesline sags from (90,380) to (990,380), 50px at the middle.
const lineY = (x: number) => { const t = (x - 90) / 900; return 380 + 100 * t * (1 - t); };

function drawSky(context: CanvasRenderingContext2D, time: Tap, oy: number) {
  const [top, bottom] = skies[time];
  const sky = context.createLinearGradient(0, -oy, 0, 260);
  sky.addColorStop(0, top);
  sky.addColorStop(1, bottom);
  context.fillStyle = sky;
  context.fillRect(0, -oy, W, oy + 260);
  if (time === 0) {
    context.fillStyle = "#ffb460";
    context.beginPath(); context.arc(985, 214, 62, 0, Math.PI * 2); context.fill();
    context.strokeStyle = "#7a4a2a"; context.lineWidth = 4; context.lineCap = "round";
    for (const [x, y] of [[960, 110], [1010, 140]]) { context.beginPath(); context.moveTo(x - 16, y); context.quadraticCurveTo(x - 8, y - 9, x, y); context.quadraticCurveTo(x + 8, y - 9, x + 16, y); context.stroke(); }
  } else if (time === 1) {
    const glow = context.createRadialGradient(985, 104, 30, 985, 104, 110);
    glow.addColorStop(0, "rgba(255,250,210,0.9)");
    glow.addColorStop(1, "rgba(255,250,210,0)");
    context.fillStyle = glow;
    context.fillRect(860, -10, 220, 230);
    context.fillStyle = "#fff6c4";
    context.beginPath(); context.arc(985, 104, 46, 0, Math.PI * 2); context.fill();
  } else {
    context.fillStyle = "rgba(255,255,255,0.8)";
    for (const [x, y] of stars) { context.beginPath(); context.arc(x, y, 3, 0, Math.PI * 2); context.fill(); }
    context.save();
    context.beginPath(); context.arc(985, 112, 44, 0, Math.PI * 2); context.clip();
    context.fillStyle = "#f6efd2"; context.fillRect(930, 60, 110, 110);
    context.fillStyle = sky;
    context.beginPath(); context.arc(1006, 96, 40, 0, Math.PI * 2); context.fill();
    context.restore();
  }
}

function drawWindow(context: CanvasRenderingContext2D, lit: boolean) {
  context.fillStyle = lit ? "#f6c766" : "#3d5873";
  context.fillRect(150, 430, 230, 200);
  if (!lit) {
    context.fillStyle = "rgba(255,255,255,0.12)";
    context.beginPath(); context.moveTo(170, 620); context.lineTo(250, 440); context.lineTo(290, 440); context.lineTo(210, 620); context.fill();
  }
  context.strokeStyle = GRILL;
  context.lineWidth = 5;
  for (let x = 178; x < 380; x += 29) { context.beginPath(); context.moveTo(x, 430); context.lineTo(x, 630); context.stroke(); }
  context.beginPath(); context.moveTo(150, 530); context.lineTo(380, 530); context.stroke();
  context.lineWidth = 12;
  context.strokeRect(150, 430, 230, 200);
}

function drawDoor(context: CanvasRenderingContext2D) {
  context.fillStyle = GRILL;
  context.fillRect(600, 400, 210, 470);
  context.strokeStyle = GRILL_DARK;
  context.lineWidth = 4;
  context.strokeRect(600, 400, 210, 470);
  context.beginPath(); context.moveTo(705, 400); context.lineTo(705, 870); context.stroke();
  // Wooden louvres in each leaf.
  context.lineWidth = 3;
  for (const left of [618, 721]) {
    context.strokeRect(left, 422, 70, 190);
    for (let y = 440; y < 612; y += 18) { context.beginPath(); context.moveTo(left + 6, y); context.lineTo(left + 64, y); context.stroke(); }
  }
  context.fillStyle = "#e3c26a";
  context.beginPath(); context.arc(692, 660, 6, 0, Math.PI * 2); context.arc(718, 660, 6, 0, Math.PI * 2); context.fill();
}

/** A gamchha: red-and-white check, hung by its top edge along the sagging line. */
function drawGamchha(context: CanvasRenderingContext2D) {
  const left = 170, right = 330, drop = 190;
  context.save();
  context.beginPath();
  context.moveTo(left, lineY(left)); context.lineTo(right, lineY(right)); context.lineTo(right, lineY(right) + drop); context.lineTo(left, lineY(left) + drop); context.closePath();
  context.fillStyle = RED;
  context.fill();
  context.clip();
  context.fillStyle = "rgba(255,255,255,0.85)";
  for (let x = left + 14; x < right; x += 34) context.fillRect(x, 360, 7, 260);
  for (let y = 400; y < 640; y += 34) context.fillRect(left, y, right - left, 7);
  context.fillStyle = "rgba(20,70,40,0.55)";
  for (let y = 412; y < 640; y += 68) context.fillRect(left, y, right - left, 3);
  context.restore();
  context.strokeStyle = RED;
  context.lineWidth = 3;
  for (let x = left + 4; x < right; x += 9) { context.beginPath(); context.moveTo(x, lineY(x) + drop); context.lineTo(x, lineY(x) + drop + 14); context.stroke(); }
}

/** A child's yellow shirt, pegged by the shoulders. */
function drawShirt(context: CanvasRenderingContext2D) {
  const top = lineY(480) + 2;
  context.fillStyle = "#f2c14e";
  context.beginPath();
  context.moveTo(430, top); context.lineTo(530, top); context.lineTo(568, top + 34); context.lineTo(548, top + 56); context.lineTo(530, top + 44);
  context.lineTo(532, top + 152); context.lineTo(428, top + 152); context.lineTo(430, top + 44); context.lineTo(412, top + 56); context.lineTo(392, top + 34); context.closePath();
  context.fill();
  context.strokeStyle = "rgba(120,80,10,0.35)"; context.lineWidth = 3;
  context.beginPath(); context.moveTo(462, top); context.quadraticCurveTo(480, top + 18, 498, top); context.stroke();
}

function drawPegs(context: CanvasRenderingContext2D) {
  context.fillStyle = "#b5835a";
  for (const x of [178, 322, 436, 524]) context.fillRect(x - 5, lineY(x) - 12, 10, 26);
}

function drawGrill(context: CanvasRenderingContext2D) {
  context.fillStyle = GRILL;
  context.fillRect(56, 640, 968, 18);
  context.fillRect(58, 846, 964, 16);
  context.fillStyle = "rgba(255,255,255,0.25)";
  context.fillRect(56, 640, 968, 4);
  context.fillStyle = GRILL;
  const step = 48;
  for (let x = 80; x <= 1000; x += step) context.fillRect(x - 3, 658, 6, 188);
  context.strokeStyle = GRILL;
  context.lineWidth = 5;
  for (let x = 80; x < 1000; x += step) {
    const cx = x + step / 2;
    context.beginPath(); context.arc(cx, 658, 20, 0, Math.PI); context.stroke();
    context.beginPath(); context.arc(cx, 752, 15, 0, Math.PI * 2); context.stroke();
    context.beginPath(); context.arc(cx, 846, 20, Math.PI, Math.PI * 2); context.stroke();
  }
}

/** Money plant in an old tin on the railing, trailing down the grill. */
function drawPlant(context: CanvasRenderingContext2D) {
  context.strokeStyle = "#2e7d3a";
  context.lineWidth = 4;
  context.beginPath(); context.moveTo(930, 640); context.bezierCurveTo(1000, 690, 960, 760, 1004, 830); context.stroke();
  const leaf = (x: number, y: number, angle: number, color: string) => {
    context.save(); context.translate(x, y); context.rotate(angle);
    context.fillStyle = color;
    context.beginPath(); context.moveTo(0, 0); context.bezierCurveTo(-20, -14, -18, -40, 0, -46); context.bezierCurveTo(18, -40, 20, -14, 0, 0); context.fill();
    context.restore();
  };
  [[962, 670, 2.2], [982, 712, -2.0], [974, 752, 2.4], [990, 796, -2.2], [1004, 830, 2.8]].forEach(([x, y, a], index) => leaf(x, y, a, index % 2 ? "#3f9a4a" : "#2e7d3a"));
  [[896, 582, -0.6], [914, 572, -0.1], [934, 578, 0.5], [952, 590, 1.0]].forEach(([x, y, a], index) => leaf(x, y, a, index % 2 ? "#3f9a4a" : "#2e7d3a"));
  context.fillStyle = "#b9c0c7";
  context.fillRect(886, 586, 70, 56);
  context.fillStyle = "#e0b34a";
  context.fillRect(886, 602, 70, 20);
  context.fillStyle = "rgba(255,255,255,0.35)";
  context.fillRect(894, 586, 8, 56);
  context.fillStyle = "#8d959d";
  context.fillRect(882, 582, 78, 7);
}

/** The bubble's shape with its tail pointing at the doorway (text is drawn separately). */
function drawBubbleShape(context: CanvasRenderingContext2D) {
  const { x, y, width, height } = bubble;
  const bottom = y + height;
  context.save();
  context.shadowColor = "rgba(0,0,0,0.18)"; context.shadowOffsetY = 8; context.shadowBlur = 16;
  context.fillStyle = "#ffffff";
  roundedRect(context, x, y, width, height, height / 2); context.fill();
  context.restore();
  context.strokeStyle = INK;
  context.lineWidth = 6;
  roundedRect(context, x, y, width, height, height / 2); context.stroke();
  context.fillStyle = "#ffffff";
  context.beginPath(); context.moveTo(610, bottom - 6); context.lineTo(700, bottom + 92); context.lineTo(682, bottom - 6); context.closePath(); context.fill();
  context.lineJoin = "round";
  context.beginPath(); context.moveTo(612, bottom - 1); context.lineTo(700, bottom + 92); context.lineTo(682, bottom - 1); context.stroke();
}

export function drawBubbleText(context: CanvasRenderingContext2D, daknam: Daknam) {
  const { x, y, width, height } = bubble;
  fitText(context, [{ text: `${nickname(daknam)}! `, color: RED, weight: 800, display: true }, { text: callLine(daknam), color: INK, weight: 700, display: true }], x + width / 2, y + height / 2 + 28, 78, width - 90, "center");
}

/** Sky, wall, balcony and bubble shape, in scene coordinates with the scene's top at `oy`; the wall runs down to `bottom`. */
function drawScene(context: CanvasRenderingContext2D, daknam: Daknam, oy: number, bottom: number) {
  context.save();
  context.translate(0, oy);
  const wallBottom = bottom - oy;
  drawSky(context, daknam.time, oy);

  context.fillStyle = WALL;
  context.fillRect(0, 236, W, wallBottom - 236);
  // Lime-wash patches and rain streaks, so the wall looks lived-in.
  context.fillStyle = "rgba(255,255,255,0.08)";
  context.beginPath(); context.ellipse(180, 300, 160, 40, 0.1, 0, Math.PI * 2); context.ellipse(900, 960, 220, 70, -0.1, 0, Math.PI * 2); context.fill();
  context.fillStyle = "rgba(110,50,30,0.07)";
  for (const x of [120, 470, 860]) context.fillRect(x, 895, 14, Math.max(0, wallBottom - 895));
  context.fillStyle = LEDGE;
  context.fillRect(0, 236, W, 26);
  context.fillStyle = "rgba(0,0,0,0.12)";
  context.fillRect(0, 262, W, 8);

  // The balcony recess, its ceiling slab, the window and door on its back wall.
  context.fillStyle = RECESS;
  context.fillRect(70, 320, 940, 550);
  context.fillStyle = LEDGE;
  context.fillRect(40, 298, 1000, 32);
  const shade = context.createLinearGradient(0, 330, 0, 380);
  shade.addColorStop(0, "rgba(60,20,10,0.28)");
  shade.addColorStop(1, "rgba(60,20,10,0)");
  context.fillStyle = shade;
  context.fillRect(70, 330, 940, 50);
  drawWindow(context, false);
  drawDoor(context);

  context.strokeStyle = "#f3ead8";
  context.lineWidth = 4;
  context.beginPath(); context.moveTo(90, 380); context.quadraticCurveTo(540, 480, 990, 380); context.stroke();
  drawGamchha(context);
  drawShirt(context);
  drawPegs(context);

  drawGrill(context);
  drawPlant(context);
  context.fillStyle = LEDGE;
  context.fillRect(36, 860, 1008, 34);
  const under = context.createLinearGradient(0, 894, 0, 930);
  under.addColorStop(0, "rgba(60,20,10,0.25)");
  under.addColorStop(1, "rgba(60,20,10,0)");
  context.fillStyle = under;
  context.fillRect(36, 894, 1008, 36);

  if (daknam.time === 2) {
    // Night: the building in shadow, the window and the gap between the doors lit from inside.
    context.fillStyle = "rgba(14,22,58,0.42)";
    context.fillRect(0, 236, W, wallBottom - 236);
    drawWindow(context, true);
    const glow = context.createRadialGradient(705, 520, 10, 705, 520, 160);
    glow.addColorStop(0, "rgba(255,214,130,0.55)");
    glow.addColorStop(1, "rgba(255,214,130,0)");
    context.fillStyle = glow;
    context.fillRect(545, 400, 320, 238);
    context.fillStyle = "#ffd98a";
    context.fillRect(701, 400, 8, 238);
  } else if (daknam.time === 0) {
    context.fillStyle = "rgba(255,160,80,0.08)";
    context.fillRect(0, 236, W, wallBottom - 236);
  }

  drawBubbleShape(context);
  context.restore();
}

/** The marble name plate by the gate: "রাফি → টুটুল", and the human line. */
function drawPlate(context: CanvasRenderingContext2D, daknam: Daknam, x: number, y: number, width: number, height: number, story: boolean) {
  context.save();
  context.shadowColor = "rgba(60,20,10,0.35)"; context.shadowOffsetY = 10; context.shadowBlur = 22;
  context.fillStyle = "#f4f1ea";
  roundedRect(context, x, y, width, height, 18); context.fill();
  context.restore();
  context.save();
  roundedRect(context, x, y, width, height, 18); context.clip();
  context.strokeStyle = "rgba(120,120,130,0.16)";
  context.lineWidth = 3;
  context.beginPath(); context.moveTo(x - 20, y + height * 0.3); context.bezierCurveTo(x + width * 0.3, y + height * 0.1, x + width * 0.5, y + height * 0.8, x + width + 20, y + height * 0.55); context.stroke();
  context.beginPath(); context.moveTo(x + width * 0.6, y - 10); context.bezierCurveTo(x + width * 0.7, y + height * 0.4, x + width * 0.9, y + height * 0.3, x + width * 0.95, y + height + 10); context.stroke();
  context.restore();
  context.strokeStyle = "#cfc6b4";
  context.lineWidth = 3;
  roundedRect(context, x + 16, y + 16, width - 32, height - 32, 10); context.stroke();
  context.fillStyle = "#c9a45c";
  for (const [sx, sy] of [[x + 36, y + 36], [x + width - 36, y + 36], [x + 36, y + height - 36], [x + width - 36, y + height - 36]]) {
    context.beginPath(); context.arc(sx, sy, 9, 0, Math.PI * 2); context.fill();
  }

  const name = cleanName(daknam.name);
  const nick = nickname(daknam);
  const cx = x + width / 2, maxWidth = width - 140;
  const engraved = (segments: { text: string; color: string; weight: number; display?: boolean }[], baseline: number, size: number) => {
    fitText(context, segments.map(part => ({ ...part, color: "rgba(255,255,255,0.95)" })), cx + 2, baseline + 2, size, maxWidth, "center");
    fitText(context, segments, cx, baseline, size, maxWidth, "center");
  };
  const scale = story ? 1.12 : 1;
  engraved([{ text: "ছোটবেলায় আমার ডাকনাম হতো", color: MUTED, weight: 600 }], y + 72 * scale, 34 * scale);
  engraved(name
    ? [{ text: name, color: INK, weight: 800, display: true }, { text: "  →  ", color: MUTED, weight: 600 }, { text: nick, color: RED, weight: 800, display: true }]
    : [{ text: nick, color: RED, weight: 800, display: true }], y + 182 * scale, (name ? 100 : 124) * scale);
  engraved([{ text: humanLine(daknam), color: INK, weight: 600 }], y + 254 * scale, 36 * scale);
}

export function drawDaknam(canvas: HTMLCanvasElement, daknam: Daknam, format: Format, site: string) {
  const { width, height } = sizes[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");

  if (format === "stage") {
    // The page puts the live call text over the bubble, so it can pop when the name changes.
    drawScene(context, daknam, 0, height);
    return;
  }
  const story = format === "story";
  const oy = story ? 330 : 0;
  drawScene(context, daknam, oy, height);
  context.save();
  context.translate(0, oy);
  drawBubbleText(context, daknam);
  context.restore();
  if (story) drawPlate(context, daknam, 70, 1270, 940, 336, true);
  else drawPlate(context, daknam, 80, 928, 920, 300, false);
  drawFooterBand(context, format, "তোমার আসল ডাকনাম কী?", site, { band: "#123f49", ask: "#ffd166", site: "#ffffff" });
}

export function daknamBlob(daknam: Daknam, format: CardFormat, site: string) {
  return renderCard(canvas => drawDaknam(canvas, daknam, format, site));
}
