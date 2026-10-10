import { cardSizes, drawFooterBand, fitText, renderCard, wrapText, BODY_FONT, DISPLAY_FONT, type CardFormat } from "../../../shared/card-canvas";
import { averageLine, bn, callLine, division, humanLine, possessive, roadNote, routeLabel, tripLine, type Average, type ModeId, type Trip } from "./jatra";

// Brown paper, blue ballpoint, yellow-topped highway milestones.
const PAPER = "#d3ad7b";
const INK = "#3a2414";
const MUTED = "#6b4627";
const PEN = "#2246a6";
const STONE = "#fbf6ea";
const STONE_TOP = "#f2b705";
const CLAY = "#c27d48";
const TIN = "#7f8c92";

type Point = { x: number; y: number };
type Ctx = CanvasRenderingContext2D;

/** Small seeded generator so the paper grain never changes between redraws. */
function seeded(seed: number) {
  let value = seed >>> 0;
  return () => { value = (value * 1664525 + 1013904223) >>> 0; return value / 4294967296; };
}

export function drawPaper(context: Ctx, width: number, height: number) {
  context.fillStyle = PAPER;
  context.fillRect(0, 0, width, height);
  const random = seeded(11);
  context.lineWidth = 1.6;
  for (let index = 0; index < (width * height) / 2400; index++) {
    const x = random() * width, y = random() * height, length = 5 + random() * 15, angle = random() * Math.PI;
    context.strokeStyle = random() < 0.55 ? "#9c74404d" : "#f1dcb380";
    context.beginPath(); context.moveTo(x, y); context.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length); context.stroke();
  }
  // A soft fold down the middle, like a sheet that travelled in a shirt pocket.
  const fold = context.createLinearGradient(width / 2 - 16, 0, width / 2 + 16, 0);
  fold.addColorStop(0, "#00000000"); fold.addColorStop(0.47, "#5a3a1a1f"); fold.addColorStop(0.53, "#fff3dc33"); fold.addColorStop(1, "#00000000");
  context.fillStyle = fold;
  context.fillRect(width / 2 - 16, 0, 32, height);
  const edge = context.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.35, width / 2, height / 2, Math.max(width, height) * 0.78);
  edge.addColorStop(0, "#00000000"); edge.addColorStop(1, "#4a2a0a3d");
  context.fillStyle = edge;
  context.fillRect(0, 0, width, height);
}

// ---- the route: two cubic curves from the city to the house door, sampled so things can sit at even distances ----
type Route = { points: Point[]; lengths: number[]; total: number; start: Point; end: Point };

function routeFor(height: number): Route {
  const y = (fraction: number) => fraction * height;
  // City → over the top to the right → back left like a village road → down and across to the door.
  const segments: Point[][] = [
    [{ x: 175, y: y(0.4) }, { x: 330, y: y(0.12) }, { x: 640, y: y(0.1) }, { x: 690, y: y(0.36) }],
    [{ x: 690, y: y(0.36) }, { x: 730, y: y(0.56) }, { x: 420, y: y(0.48) }, { x: 400, y: y(0.66) }],
    [{ x: 400, y: y(0.66) }, { x: 380, y: y(0.84) }, { x: 690, y: y(0.79) }, { x: 840, y: y(0.76) }],
  ];
  const points: Point[] = [];
  for (const [a, b, c, d] of segments) {
    for (let step = points.length ? 1 : 0; step <= 120; step++) {
      const t = step / 120, u = 1 - t;
      points.push({ x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x, y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y });
    }
  }
  const lengths = [0];
  for (let index = 1; index < points.length; index++) lengths.push(lengths[index - 1] + Math.hypot(points[index].x - points[index - 1].x, points[index].y - points[index - 1].y));
  return { points, lengths, total: lengths.at(-1)!, start: points[0], end: points.at(-1)! };
}

/** The point at a fraction of the route's length, with the unit normal that points up (away from the road). */
function along(route: Route, fraction: number) {
  const target = Math.min(1, Math.max(0, fraction)) * route.total;
  let index = route.lengths.findIndex(length => length >= target);
  if (index < 1) index = 1;
  const a = route.points[index - 1], b = route.points[index];
  const span = route.lengths[index] - route.lengths[index - 1] || 1;
  const t = (target - route.lengths[index - 1]) / span;
  const dx = b.x - a.x, dy = b.y - a.y, size = Math.hypot(dx, dy) || 1;
  let nx = dy / size, ny = -dx / size;
  if (ny > 0 || (Math.abs(ny) < 0.2 && nx > 0)) { nx = -nx; ny = -ny; }
  return { x: a.x + dx * t, y: a.y + dy * t, nx, ny };
}

/** Road dots, rail sleepers or river waves, from one fraction of the route to another. */
function drawLine(context: Ctx, route: Route, how: ModeId, from: number, to: number) {
  const first = from * route.total, last = to * route.total;
  context.strokeStyle = PEN;
  context.fillStyle = PEN;
  context.lineCap = "round";
  if (how === "bus" || how === "car") {
    const random = seeded(5);
    for (let distance = first; distance <= last; distance += 24) {
      const point = along(route, distance / route.total);
      context.beginPath(); context.arc(point.x, point.y, 6 + random() * 1.6, 0, Math.PI * 2); context.fill();
    }
    return;
  }
  if (how === "train") {
    context.lineWidth = 4;
    for (const side of [-7, 7]) {
      context.beginPath();
      for (let distance = first; distance <= last; distance += 6) {
        const point = along(route, distance / route.total);
        const x = point.x + point.nx * side, y = point.y + point.ny * side;
        if (distance === first) context.moveTo(x, y); else context.lineTo(x, y);
      }
      context.stroke();
    }
    context.lineWidth = 4;
    for (let distance = first + 8; distance <= last; distance += 22) {
      const point = along(route, distance / route.total);
      context.beginPath(); context.moveTo(point.x + point.nx * 14, point.y + point.ny * 14); context.lineTo(point.x - point.nx * 14, point.y - point.ny * 14); context.stroke();
    }
    return;
  }
  // Launch: a pale river with a wavy ink line on it.
  context.save();
  context.strokeStyle = "#2246a62b";
  context.lineWidth = 56;
  context.beginPath();
  for (let distance = first; distance <= last; distance += 8) {
    const point = along(route, distance / route.total);
    if (distance === first) context.moveTo(point.x, point.y); else context.lineTo(point.x, point.y);
  }
  context.stroke();
  context.restore();
  context.lineWidth = 5;
  context.beginPath();
  for (let distance = first; distance <= last; distance += 4) {
    const point = along(route, distance / route.total), wave = Math.sin(distance / 13) * 7;
    const x = point.x + point.nx * wave, y = point.y + point.ny * wave;
    if (distance === first) context.moveTo(x, y); else context.lineTo(x, y);
  }
  context.stroke();
}

function outline(context: Ctx, fill: string, width = 4) {
  context.fillStyle = fill; context.fill();
  context.strokeStyle = INK; context.lineWidth = width; context.lineJoin = "round"; context.stroke();
}

/** A highway milestone: white post, yellow dome, the hour written on it. */
function milestone(context: Ctx, x: number, y: number, hour: number, last: boolean, text: number) {
  const width = 48, height = 62;
  context.fillStyle = "#3a241426";
  context.beginPath(); context.ellipse(x, y + 3, 30, 7, 0, 0, Math.PI * 2); context.fill();
  context.beginPath();
  context.moveTo(x - width / 2, y); context.lineTo(x - width / 2, y - height + width / 2);
  context.arc(x, y - height + width / 2, width / 2, Math.PI, 0); context.lineTo(x + width / 2, y); context.closePath();
  outline(context, STONE, 3.5);
  context.save(); context.clip();
  context.fillStyle = last ? PEN : STONE_TOP;
  context.fillRect(x - width / 2, y - height, width, width / 2 + 2);
  context.restore();
  context.beginPath();
  context.moveTo(x - width / 2, y); context.lineTo(x - width / 2, y - height + width / 2);
  context.arc(x, y - height + width / 2, width / 2, Math.PI, 0); context.lineTo(x + width / 2, y); context.closePath();
  context.strokeStyle = INK; context.lineWidth = 3.5; context.stroke();
  fitText(context, [{ text: bn(hour), color: last ? PEN : INK, weight: 800, display: true }], x, y - 9, 26 * text, width - 6, "center");
}

function city(context: Ctx, x: number, y: number) {
  const blocks = [[-92, 78, 40], [-50, 128, 46], [-2, 100, 40], [40, 150, 42], [84, 70, 34]] as const;
  for (const [left, height, width] of blocks) {
    context.beginPath(); context.rect(x + left, y - height, width, height);
    outline(context, "#ead2a4", 3.5);
    context.fillStyle = "#3a24144d";
    for (let row = y - height + 14; row < y - 16; row += 22) for (let column = x + left + 9; column < x + left + width - 10; column += 14) context.fillRect(column, row, 7, 10);
  }
  // A water tank on the tallest roof: every Dhaka skyline has one.
  context.beginPath(); context.rect(x + 50, y - 172, 22, 22); outline(context, "#ead2a4", 3);
}

function house(context: Ctx, x: number, y: number, waiting: boolean) {
  // x, y is the door's foot, where the road ends.
  context.beginPath(); context.rect(x - 52, y - 8, 200, 12); outline(context, "#a7663a", 3);
  context.beginPath(); context.rect(x - 40, y - 86, 156, 80); outline(context, CLAY);
  context.beginPath(); context.rect(x - 15, y - 62, 30, 56); outline(context, "#5a3418", 3);
  context.beginPath(); context.rect(x + 48, y - 66, 40, 30); outline(context, waiting ? "#ffd166" : "#f6c453", 3);
  context.beginPath(); context.moveTo(x + 68, y - 66); context.lineTo(x + 68, y - 36); context.strokeStyle = INK; context.lineWidth = 2.5; context.stroke();
  // Tin roof with its ridges.
  context.beginPath(); context.moveTo(x - 64, y - 84); context.lineTo(x + 140, y - 84); context.lineTo(x + 108, y - 146); context.lineTo(x - 32, y - 146); context.closePath();
  outline(context, TIN);
  context.save(); context.clip();
  context.strokeStyle = "#ffffff55"; context.lineWidth = 3;
  for (let ridge = x - 60; ridge < x + 140; ridge += 13) { context.beginPath(); context.moveTo(ridge, y - 84); context.lineTo(ridge + 10, y - 146); context.stroke(); }
  context.restore();
  // The kitchen hut, and smoke from the clay stove: someone is cooking for you.
  context.beginPath(); context.rect(x + 132, y - 52, 58, 46); outline(context, "#b06e3e", 3.5);
  context.beginPath(); context.moveTo(x + 124, y - 50); context.lineTo(x + 198, y - 50); context.lineTo(x + 180, y - 78); context.lineTo(x + 142, y - 78); context.closePath(); outline(context, "#9a8d6a", 3.5);
  context.strokeStyle = "#5c4a3a99"; context.lineWidth = 4; context.lineCap = "round";
  for (const [offset, rise] of [[0, 70], [16, 56]] as const) {
    context.beginPath(); context.moveTo(x + 160 + offset, y - 84);
    context.bezierCurveTo(x + 146 + offset, y - 100, x + 176 + offset, y - 112, x + 160 + offset, y - 84 - rise);
    context.stroke();
  }
}

function bubble(context: Ctx, text: string, x: number, y: number, size: number) {
  context.font = `700 ${size}px ${DISPLAY_FONT}`;
  const width = context.measureText(text).width + size * 1.1, height = size * 1.75;
  const left = Math.min(1060 - width, Math.max(20, x - width / 2));
  context.beginPath();
  context.roundRect(left, y - height, width, height, height / 2);
  context.moveTo(x - 12, y - 2); context.lineTo(x - 4, y + 18); context.lineTo(x + 10, y - 2);
  outline(context, STONE, 3);
  context.fillStyle = STONE; context.fillRect(x - 10, y - 6, 18, 6);
  fitText(context, [{ text, color: INK, weight: 700, display: true }], left + width / 2, y - height * 0.3, size, width - 10, "center");
}

function vehicle(context: Ctx, how: ModeId, x: number, y: number, scale: number) {
  context.save();
  context.translate(x, y); context.scale(scale, scale);
  const wheel = (cx: number, radius: number) => { context.beginPath(); context.arc(cx, -radius + 2, radius, 0, Math.PI * 2); outline(context, INK, 2); context.beginPath(); context.arc(cx, -radius + 2, radius * 0.4, 0, Math.PI * 2); context.fillStyle = PAPER; context.fill(); };
  if (how === "bus") {
    // Roof bags first, so the body overlaps their ties.
    for (const [left, top, width, height, color] of [[-60, -86, 42, 20, "#8b5a2b"], [-14, -82, 32, 16, "#c0392b"], [24, -88, 36, 22, PEN]] as const) { context.beginPath(); context.rect(left, top, width, height); outline(context, color, 3); }
    context.beginPath(); context.roundRect(-80, -68, 160, 58, 12); outline(context, "#2f7d4f");
    context.fillStyle = STONE_TOP; context.fillRect(-78, -30, 156, 8);
    for (let left = -68; left < 44; left += 27) { context.beginPath(); context.rect(left, -60, 21, 20); outline(context, "#f4ead2", 2.5); }
    context.beginPath(); context.rect(56, -60, 18, 30); outline(context, "#cfe3f0", 2.5);
    wheel(-48, 13); wheel(48, 13);
  } else if (how === "train") {
    context.beginPath(); context.roundRect(-92, -64, 112, 52, 8); outline(context, "#2a5b8f");
    context.beginPath(); context.moveTo(24, -64); context.lineTo(70, -64); context.quadraticCurveTo(92, -60, 94, -30); context.lineTo(94, -12); context.lineTo(24, -12); context.closePath(); outline(context, "#b23b2a");
    context.fillStyle = "#f4ead2";
    for (let left = -82; left < 12; left += 23) { context.beginPath(); context.rect(left, -54, 16, 16); outline(context, "#f4ead2", 2.5); }
    context.beginPath(); context.rect(56, -56, 22, 18); outline(context, "#cfe3f0", 2.5);
    for (const cx of [-72, -40, 4, 40, 74]) wheel(cx, 9);
  } else if (how === "launch") {
    context.beginPath(); context.rect(16, -112, 14, 26); outline(context, "#b23b2a", 3);
    context.beginPath(); context.rect(-56, -90, 96, 24); outline(context, STONE, 3.5);
    context.beginPath(); context.rect(-78, -66, 146, 32); outline(context, STONE, 3.5);
    for (let left = -70; left < 60; left += 18) { context.beginPath(); context.rect(left, -60, 11, 12); outline(context, "#2a5b8f", 2); }
    context.beginPath(); context.moveTo(-96, -34); context.lineTo(104, -34); context.lineTo(82, 2); context.lineTo(-84, 2); context.closePath(); outline(context, STONE);
    context.fillStyle = "#b23b2a"; context.fillRect(-88, -12, 178, 9);
  } else {
    context.beginPath(); context.moveTo(-38, -36); context.lineTo(-20, -60); context.lineTo(24, -60); context.lineTo(44, -36); context.closePath(); outline(context, "#c0392b");
    context.beginPath(); context.moveTo(-26, -38); context.lineTo(-14, -54); context.lineTo(2, -54); context.lineTo(2, -38); context.closePath(); outline(context, "#cfe3f0", 2.5);
    context.beginPath(); context.moveTo(8, -38); context.lineTo(8, -54); context.lineTo(20, -54); context.lineTo(34, -38); context.closePath(); outline(context, "#cfe3f0", 2.5);
    context.beginPath(); context.roundRect(-66, -38, 132, 28, 9); outline(context, "#c0392b");
    wheel(-36, 12); wheel(36, 12);
  }
  context.restore();
}

/** Hours written on the milestones: every hour, or every 2nd, 3rd… so at most nine stones; the last stone is always the total. */
export function milestoneHours(hours: number) {
  const step = Math.ceil(hours / 9);
  const marks: number[] = [];
  for (let hour = step; hour < hours; hour += step) if (hours - hour > step / 2) marks.push(hour);
  marks.push(hours);
  return { step, marks };
}

/**
 * The sketch itself: city, one line, milestones, vehicle, home. Drawn into the box (x, y, width, height);
 * `text` enlarges the labels for the small on-page stage.
 */
export function drawSketch(context: Ctx, trip: Trip, x: number, y: number, width: number, height: number, text = 1) {
  const scale = width / 1080, local = height / scale;
  const route = routeFor(local);
  // On the way: the ink stops at the vehicle; the rest of the road is pencil-faint.
  const reach = trip.onTheWay ? 0.72 : 1;
  const stonesEnd = trip.onTheWay ? 0.64 : 0.8;
  context.save();
  context.translate(x, y); context.scale(scale, scale);

  drawLine(context, route, trip.mode, 0, reach);
  if (reach < 1) { context.save(); context.globalAlpha = 0.28; drawLine(context, route, trip.mode, reach, 1); context.restore(); }

  // The Eid moon over the city you left.
  const moonY = Math.max(44, route.start.y - 220);
  context.beginPath(); context.arc(300, moonY, 24, 0, Math.PI * 2); context.arc(312, moonY - 7, 21, 0, Math.PI * 2, true);
  context.fillStyle = "#fff3c8"; context.fill("evenodd");

  city(context, route.start.x, route.start.y - 16);
  house(context, route.end.x, route.end.y, trip.onTheWay);

  const { step, marks } = milestoneHours(trip.hours);
  marks.forEach(hour => {
    const point = along(route, 0.08 + (stonesEnd - 0.08) * (hour / trip.hours));
    milestone(context, point.x + point.nx * 26, point.y + point.ny * 26 + 26, hour, hour === trip.hours, text);
  });

  const parked = along(route, trip.onTheWay ? reach : 0.93);
  vehicle(context, trip.mode, parked.x, parked.y + (trip.mode === "launch" ? 14 : 8), 1.05);

  bubble(context, trip.onTheWay ? "কতদূর এলি?" : "আয়, খেতে বস!", route.end.x + 46, route.end.y - 162, 30 * text);

  const label = 42 * text;
  fitText(context, [{ text: division(trip.from).label, color: INK, weight: 800, display: true }], route.start.x, route.start.y + 26 + label, label, 300, "center");
  fitText(context, [{ text: "বাড়ি · ", color: MUTED, weight: 700, display: true }, { text: division(trip.to).label, color: INK, weight: 800, display: true }], route.end.x + 54, route.end.y + 26 + label, label, 360, "center");

  context.save();
  context.translate(1040, local * 0.14); context.rotate(-0.04);
  const noteSize = fitText(context, [{ text: roadNote(trip), color: INK, weight: 600, display: true }], 0, 0, 30 * text, 400, "right");
  context.font = `600 ${noteSize}px ${DISPLAY_FONT}`;
  const noteWidth = Math.min(400, context.measureText(roadNote(trip)).width);
  context.strokeStyle = PEN; context.lineWidth = 3; context.setLineDash([10, 8]);
  context.beginPath(); context.moveTo(-noteWidth, 14); context.lineTo(0, 14); context.stroke();
  context.setLineDash([]);
  context.restore();

  fitText(context, [{ text: `প্রতিটা মাইলফলক = ${bn(step)} ঘণ্টা`, color: MUTED, weight: 600 }], 40, local - 14, 24 * text, 420);
  context.restore();
}

/** The live sketch above the controls. */
export function drawStage(canvas: HTMLCanvasElement, trip: Trip) {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি আঁকা যাচ্ছে না।");
  drawPaper(context, canvas.width, canvas.height);
  drawSketch(context, trip, 0, 6, canvas.width, canvas.height - 6, 1.3);
}

const layouts = {
  feed: { kicker: 98, title: 196, titleSize: 88, sub: 266, sketch: 296, maxSketch: 720 },
  story: { kicker: 330, title: 436, titleSize: 96, sub: 512, sketch: 560, maxSketch: 900 },
} as const;

export function drawCard(canvas: HTMLCanvasElement, trip: Trip, format: CardFormat, site: string, average?: Average | null) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  drawPaper(context, width, height);

  const name = trip.name ? `${possessive(trip.name)} ঈদযাত্রা` : "ঈদযাত্রা";
  fitText(context, [{ text: name, color: MUTED, weight: 700, display: true }], 72, layout.kicker, 40, 700);
  fitText(context, [{ text: routeLabel(trip), color: INK, weight: 800, display: true }], 72, layout.title, layout.titleSize, 936);
  const how = tripLine(trip), hoursText = `${bn(trip.hours)} ঘণ্টা`, at = how.indexOf(hoursText);
  fitText(context, [{ text: how.slice(0, at), color: INK, weight: 600 }, { text: hoursText, color: PEN, weight: 800, display: true }, { text: how.slice(at + hoursText.length), color: INK, weight: 600 }], 72, layout.sub, 44, 936);

  // The words sit on the footer band; the sketch takes whatever room is left (centred, capped so it never looks stretched).
  const showAverage = Boolean(average && !trip.onTheWay);
  context.font = `700 48px ${DISPLAY_FONT}`;
  const lines = wrapText(context, humanLine(trip), 936, 2);
  const bandTop = height - (format === "story" ? 260 : 96);
  const textTop = bandTop - 44 - (lines.length * 60 + 50 + (showAverage ? 72 : 0));
  const room = textTop - layout.sketch - 10;
  const sketchHeight = Math.min(room, layout.maxSketch);
  drawSketch(context, trip, 40, layout.sketch + (room - sketchHeight) / 2, 1000, sketchHeight);

  let y = textTop + 44;
  for (const line of lines) {
    fitText(context, [{ text: line, color: INK, weight: 700, display: true }], 72, y, 48, 936);
    y += 60;
  }
  fitText(context, [{ text: callLine(trip), color: MUTED, weight: 600 }], 72, y - 6, 32, 936);
  if (average && showAverage) {
    const text = averageLine(trip, average);
    y += 62;
    context.font = `700 30px ${BODY_FONT}`;
    const pill = Math.min(936, context.measureText(text).width + 44);
    context.fillStyle = "#fbf6eacc";
    context.beginPath(); context.roundRect(60, y - 38, pill, 54, 27); context.fill();
    context.strokeStyle = PEN; context.lineWidth = 2.5; context.stroke();
    fitText(context, [{ text, color: PEN, weight: 700 }], 82, y - 2, 30, pill - 44);
  }
  drawFooterBand(context, format, "তোমার বাড়ি যেতে কত ঘণ্টা?", site, { band: INK, ask: "#ffd166", site: "#f4ead2" });
}

export const cardBlob = (trip: Trip, format: CardFormat, site: string, average?: Average | null) => renderCard(canvas => drawCard(canvas, trip, format, site, average));
