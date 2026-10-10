import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, type CardFormat } from "../../../shared/card-canvas";
import { boardLine, colorOf, plateNumber, plateOwner, regions, type Board, type MotifId, type RegionId } from "./board";

// The board is one list of SVG paths in a 600×420 box: the live preview, the tap targets and the share card all draw from it.
type Paint = RegionId | keyof typeof fixed;
type Shape = { d: string; fill?: Paint; stroke?: Paint; width?: number };
const fixed = { ink: "#2a1a14", cream: "#fff6e3", wood: "#7a3e1d", orange: "#f77f00", water: "#2b86c8" };
export const BOARD = { width: 600, height: 420 };

const r1 = (value: number) => Math.round(value * 10) / 10;
const rad = (degrees: number) => (degrees * Math.PI) / 180;

function circle(cx: number, cy: number, r: number) {
  return `M${r1(cx - r)} ${r1(cy)}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`;
}

/** An almond shape (leaf, petal, feather) growing from (x, y) in a direction given in degrees. */
function petal(x: number, y: number, angle: number, length: number, width: number) {
  const ux = Math.cos(rad(angle)), uy = Math.sin(rad(angle)), vx = -uy * width, vy = ux * width;
  const at = (along: number, side: number) => `${r1(x + ux * length * along + vx * side)} ${r1(y + uy * length * along + vy * side)}`;
  return `M${at(0, 0)}C${at(0.25, 1)} ${at(0.75, 1)} ${at(1, 0)}C${at(0.75, -1)} ${at(0.25, -1)} ${at(0, 0)}Z`;
}

/** Mirrors a path drawn with absolute commands only (M L C Q S T Z) across the board's centre line. */
export function mirror(d: string) {
  let isX = true;
  return d.replace(/[A-Za-z]|-?\d*\.?\d+/g, token => {
    if (/[A-Za-z]/.test(token)) { isX = true; return token; }
    const value = isX ? BOARD.width - Number(token) : Number(token);
    isX = !isX;
    return String(r1(value));
  });
}

function flower(x: number, y: number, petals: number, length: number, width: number, fill: Paint, middle: Paint): Shape[] {
  return [
    ...Array.from({ length: petals }, (_, index) => ({ d: petal(x, y, -90 + (360 / petals) * index, length, width), fill, stroke: "ink" as const, width: 2 })),
    { d: circle(x, y, length * 0.3), fill: middle, stroke: "ink", width: 2 },
  ];
}

function vine(x0: number, side: 1 | -1): Shape[] {
  const p = [[x0, 318], [x0 + 6 * side, 252], [x0 + 34 * side, 192], [x0 + 92 * side, 150]];
  const at = (t: number) => [0, 1].map(axis => (1 - t) ** 3 * p[0][axis] + 3 * (1 - t) ** 2 * t * p[1][axis] + 3 * (1 - t) * t ** 2 * p[2][axis] + t ** 3 * p[3][axis]);
  const leaves = [0.18, 0.36, 0.54, 0.72, 0.9].flatMap((t, index) => {
    const [x, y] = at(t), [nx, ny] = at(t + 0.02);
    const heading = (Math.atan2(ny - y, nx - x) * 180) / Math.PI;
    return [{ d: petal(x, y, heading + (index % 2 ? 55 : -55), 34, 9), fill: "leaf" as const, stroke: "ink" as const, width: 2 }];
  });
  return [{ d: `M${p[0].join(" ")}C${p.slice(1).map(point => point.join(" ")).join(" ")}`, stroke: "leaf", width: 6 }, ...leaves];
}

const frame: Shape[] = [
  { d: "M36 0H564Q600 0 600 36V384Q600 420 564 420H36Q0 420 0 384V36Q0 0 36 0Z", fill: "border", stroke: "ink", width: 4 },
  ...Array.from({ length: 21 }, (_, index) => [{ d: circle(60 + index * 24, 15, 3.5), fill: "cream" as const }, { d: circle(60 + index * 24, 405, 3.5), fill: "cream" as const }]).flat(),
  ...Array.from({ length: 13 }, (_, index) => [{ d: circle(15, 66 + index * 24, 3.5), fill: "cream" as const }, { d: circle(585, 66 + index * 24, 3.5), fill: "cream" as const }]).flat(),
  { d: "M30 392V118Q30 30 118 30H482Q570 30 570 118V392Z", fill: "sky", stroke: "ink", width: 3 },
];

const corners: Shape[] = [...flower(86, 86, 6, 20, 8, "banner", "cream"), ...flower(514, 86, 6, 20, 8, "banner", "cream")];

const banner: Shape[] = [
  { d: "M44 322H556L544 388H56Z", fill: "banner", stroke: "ink", width: 3 },
  { d: "M66 355L76 345L86 355L76 365Z", fill: "cream" },
  { d: "M514 355L524 345L534 355L524 365Z", fill: "cream" },
];

const peacock: Shape[] = [
  ...Array.from({ length: 11 }, (_, index) => {
    const angle = -170 + index * 16, x = 300 + Math.cos(rad(angle)) * 138, y = 262 + Math.sin(rad(angle)) * 138;
    return [
      { d: petal(300, 262, angle, 168, 24), fill: "leaf" as const, stroke: "ink" as const, width: 2.5 },
      { d: circle(x, y, 16), fill: "banner" as const, stroke: "ink" as const, width: 2 },
      { d: circle(x, y, 9), fill: "motif" as const },
      { d: circle(x, y, 4), fill: "ink" as const },
    ];
  }).flat(),
  { d: "M300 132C314 132 318 150 312 166C328 192 334 232 322 262C314 282 286 282 278 262C266 232 272 192 288 166C282 150 286 132 300 132Z", fill: "motif", stroke: "ink", width: 3 },
  { d: circle(300, 200, 4), fill: "cream" }, { d: circle(300, 222, 4), fill: "cream" }, { d: circle(300, 244, 4), fill: "cream" },
  { d: "M300 110L286 88M300 110L300 84M300 110L314 88", stroke: "ink", width: 2.5 },
  { d: circle(286, 88, 4.5), fill: "motif", stroke: "ink", width: 1.5 }, { d: circle(300, 84, 4.5), fill: "motif", stroke: "ink", width: 1.5 }, { d: circle(314, 88, 4.5), fill: "motif", stroke: "ink", width: 1.5 },
  { d: circle(300, 124, 14), fill: "motif", stroke: "ink", width: 3 },
  { d: circle(294, 121, 2.6), fill: "ink" }, { d: circle(306, 121, 2.6), fill: "ink" },
  { d: "M295 130L300 142L305 130Z", fill: "orange", stroke: "ink", width: 2 },
  { d: "M290 280L286 300M310 280L314 300", stroke: "orange", width: 5 },
];

const swan: Shape[] = [
  { d: "M134 250C166 236 204 236 230 246C204 212 196 150 226 116C242 96 276 94 290 112L306 122L288 128C272 126 254 134 250 158C244 190 264 222 296 250C302 262 298 286 270 296C228 308 166 304 134 250Z", fill: "motif", stroke: "ink", width: 3 },
  { d: "M168 262C190 240 234 240 262 266C230 278 196 280 168 262Z", fill: "cream", stroke: "ink", width: 2 },
  { d: "M290 112L306 122L288 128C286 122 286 117 290 112Z", fill: "orange", stroke: "ink", width: 2 },
  { d: circle(276, 113, 3), fill: "ink" },
];
const swans: Shape[] = [
  { d: "M104 304Q132 296 160 304T216 304T272 304", stroke: "leaf", width: 4 },
  { d: mirror("M104 304Q132 296 160 304T216 304T272 304"), stroke: "leaf", width: 4 },
  ...swan, ...swan.map(shape => ({ ...shape, d: mirror(shape.d) })),
  { d: "M300 202C300 190 286 184 279 194C272 204 284 218 300 230C316 218 328 204 321 194C314 184 300 190 300 202Z", fill: "banner", stroke: "ink", width: 2 },
];

const bloom: Shape[] = [
  { d: petal(300, 292, -150, 112, 22), fill: "leaf", stroke: "ink", width: 2 },
  { d: petal(300, 292, -30, 112, 22), fill: "leaf", stroke: "ink", width: 2 },
  ...flower(166, 250, 5, 30, 11, "banner", "motif"),
  ...flower(434, 250, 5, 30, 11, "banner", "motif"),
  ...Array.from({ length: 8 }, (_, index) => ({ d: petal(300, 180, -90 + index * 45, 98, 30), fill: "motif" as const, stroke: "ink" as const, width: 2.5 })),
  ...Array.from({ length: 8 }, (_, index) => ({ d: petal(300, 180, -67.5 + index * 45, 62, 18), fill: "banner" as const, stroke: "ink" as const, width: 2 })),
  { d: circle(300, 180, 26), fill: "border", stroke: "ink", width: 3 },
  { d: circle(300, 180, 10), fill: "cream" },
];

const boat: Shape[] = [
  ...Array.from({ length: 12 }, (_, index) => ({ d: petal(432, 116, index * 30, 58, 7), fill: "motif" as const, stroke: "ink" as const, width: 1.5 })),
  { d: circle(432, 116, 32), fill: "motif", stroke: "ink", width: 3 },
  { d: "M196 92Q205 84 212 93Q219 84 228 92M240 70Q247 64 253 71Q259 64 266 70", stroke: "ink", width: 2.5 },
  { d: "M30 254Q165 240 300 254T570 254V392H30Z", fill: "water" },
  { d: "M70 292Q85 286 100 292T130 292M420 300Q435 294 450 300T480 300M470 270Q485 264 500 270T530 270", stroke: "cream", width: 2.5 },
  { d: "M120 262C114 218 124 184 148 158", stroke: "wood", width: 8 },
  ...[-170, -130, -90, -50, -10].map(angle => ({ d: petal(148, 158, angle, 54, 12), fill: "leaf" as const, stroke: "ink" as const, width: 2 })),
  { d: "M290 268V104", stroke: "ink", width: 5 },
  { d: "M296 112Q368 158 358 256H296Z", fill: "motif", stroke: "ink", width: 3 },
  { d: "M284 138Q236 190 246 256H284Z", fill: "cream", stroke: "ink", width: 2.5 },
  { d: "M290 104L320 112L290 120Z", fill: "banner", stroke: "ink", width: 2 },
  { d: "M178 260Q290 296 402 260L386 286Q290 312 194 286Z", fill: "wood", stroke: "ink", width: 3 },
  { d: "M190 272Q290 302 390 272", stroke: "cream", width: 3 },
];

const motifShapes: Record<MotifId, Shape[]> = { peacock, swans, flower: bloom, boat };
const leaves = [...vine(60, 1), ...vine(540, -1)];
export const motifThumb = (motif: MotifId) => motifShapes[motif];
const shapesFor = (motif: MotifId) => [...frame, ...leaves, ...corners, ...motifShapes[motif], ...banner];

const paths = new Map<string, Path2D>();
const path = (d: string) => { let found = paths.get(d); if (!found) { found = new Path2D(d); paths.set(d, found); } return found; };
const isRegion = (paint: Paint | undefined): paint is RegionId => regions.some(region => region.id === paint);
export const colorFor = (board: Board, paint: Paint) => isRegion(paint) ? colorOf(board, paint) : fixed[paint as keyof typeof fixed];

/** Light banners get dark letters, dark ones get cream, so any painted banner stays readable. */
export function textOn(hex: string) {
  const [r, g, b] = [1, 3, 5].map(start => parseInt(hex.slice(start, start + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.6 ? fixed.ink : fixed.cream;
}

/** Draws the board with its top-left corner at (x, y), `width` pixels wide. */
export function drawBoard(context: CanvasRenderingContext2D, board: Board, x: number, y: number, width: number) {
  context.save();
  context.translate(x, y);
  context.scale(width / BOARD.width, width / BOARD.width);
  context.lineJoin = "round";
  context.lineCap = "round";
  for (const shape of shapesFor(board.motif)) {
    if (shape.fill) { context.fillStyle = colorFor(board, shape.fill); context.fill(path(shape.d)); }
    if (shape.stroke) { context.strokeStyle = colorFor(board, shape.stroke); context.lineWidth = shape.width ?? 3; context.stroke(path(shape.d)); }
  }
  if (board.line) fitText(context, [{ text: board.line, color: textOn(colorOf(board, "banner")), weight: 700, display: true }], 300, 368, 40, 420, "center");
  context.restore();
}

/** Which paintable part of the board is under a point given in board units, or null for fixed details like the boat. */
export function regionAt(context: CanvasRenderingContext2D, motif: MotifId, x: number, y: number): RegionId | null {
  context.save();
  context.setTransform(1, 0, 0, 1, 0, 0);
  try {
    for (const shape of shapesFor(motif).reverse()) {
      context.lineWidth = (shape.width ?? 3) + 12;
      const hit = shape.fill ? context.isPointInPath(path(shape.d), x, y) : context.isPointInStroke(path(shape.d), x, y);
      if (hit) return isRegion(shape.fill ?? shape.stroke) ? (shape.fill ?? shape.stroke) as RegionId : null;
    }
    return null;
  } finally { context.restore(); }
}

const BG = "#f9b81b";
const METAL = "#3a3340";
const BRASS = "#e2ad22";

function drawRickshaw(context: CanvasRenderingContext2D, board: Board, top: number) {
  const ink = fixed.ink;
  const y = (value: number) => top + value;
  context.lineJoin = "round";
  context.lineCap = "round";
  // shadow on the road
  context.fillStyle = "rgba(42,26,20,.16)";
  context.beginPath(); context.ellipse(540, y(996), 480, 20, 0, 0, Math.PI * 2); context.fill();

  // wheels seen from behind: thin tyres under curved mudguards
  for (const x of [140, 940]) {
    context.fillStyle = "#211c26";
    roundedRect(context, x - 22, y(546), 44, 446, 22); context.fill();
    context.fillStyle = "#4a4352";
    roundedRect(context, x - 6, y(560), 12, 418, 6); context.fill();
    context.fillStyle = colorOf(board, "border");
    roundedRect(context, x - 34, y(522), 68, 70, 30); context.fill();
    context.strokeStyle = ink; context.lineWidth = 4; context.stroke();
  }
  // frame rods and the axle bar behind the plate
  context.fillStyle = METAL;
  for (const x of [190, 878]) { roundedRect(context, x, y(260), 12, 560, 6); context.fill(); }
  roundedRect(context, 150, y(786), 780, 16, 8); context.fill();

  // hood: black canvas with painted arches and little flowers
  const hood = new Path2D(`M180 ${y(258)}C180 ${y(92)} 330 ${y(4)} 540 ${y(4)}C750 ${y(4)} 900 ${y(92)} 900 ${y(258)}`);
  context.fillStyle = "#1f1a24";
  context.fill(hood);
  [["border", 0.86], ["motif", 0.72], ["banner", 0.58]].forEach(([region, scale]) => {
    const k = scale as number;
    context.save();
    context.translate(540, y(258)); context.scale(k, k); context.translate(-540, -y(258));
    context.strokeStyle = colorOf(board, region as RegionId); context.lineWidth = 12 / k; context.stroke(hood);
    context.restore();
  });
  for (const [x, hy, region] of [[540, 150, "leaf"], [400, 200, "motif"], [680, 200, "motif"], [300, 236, "banner"], [780, 236, "banner"]] as const) {
    for (let index = 0; index < 6; index++) { context.fillStyle = colorOf(board, region); context.fill(new Path2D(petal(x, y(hy), index * 60, 15, 6))); }
    context.fillStyle = fixed.cream; context.beginPath(); context.arc(x, y(hy), 4, 0, Math.PI * 2); context.fill();
  }
  context.fillStyle = BRASS;
  roundedRect(context, 168, y(252), 744, 18, 6); context.fill();
  context.strokeStyle = ink; context.lineWidth = 3; context.stroke();

  // the board itself, then the fringe hanging in front of its top edge
  drawBoard(context, board, 240, y(290), 600);
  const tassel: RegionId[] = ["border", "motif", "banner", "leaf"];
  for (let index = 0, x = 186; x <= 894; index++, x += 36) {
    context.strokeStyle = ink; context.lineWidth = 2;
    context.beginPath(); context.moveTo(x, y(270)); context.lineTo(x, y(290)); context.stroke();
    context.fillStyle = colorOf(board, tassel[index % tassel.length]);
    context.beginPath(); context.moveTo(x, y(288)); context.lineTo(x + 9, y(308)); context.lineTo(x, y(332)); context.lineTo(x - 9, y(308)); context.closePath(); context.fill();
    context.strokeStyle = ink; context.lineWidth = 2; context.stroke();
    context.fillStyle = fixed.cream; context.beginPath(); context.arc(x, y(336), 3.5, 0, Math.PI * 2); context.fill();
  }

  // red reflectors either side of the plate
  for (const x of [300, 780]) {
    context.fillStyle = METAL; context.beginPath(); context.arc(x, y(762), 26, 0, Math.PI * 2); context.fill();
    context.fillStyle = "#d81f2a"; context.beginPath(); context.arc(x, y(762), 19, 0, Math.PI * 2); context.fill();
    context.fillStyle = "rgba(255,255,255,.75)"; context.beginPath(); context.ellipse(x - 6, y(755), 6, 4, -0.6, 0, Math.PI * 2); context.fill();
  }

  // number plate carrying the person's name and area
  context.fillStyle = "#fffdf5";
  roundedRect(context, 372, y(728), 336, 116, 14); context.fill();
  context.strokeStyle = ink; context.lineWidth = 5; context.stroke();
  fitText(context, [{ text: "রিকশা নং ", color: ink, weight: 600 }, { text: plateNumber(board), color: "#c0202b", weight: 800, display: true }], 540, y(780), 40, 300, "center");
  fitText(context, [{ text: plateOwner(board), color: "#5a3a12", weight: 600 }], 540, y(822), 28, 300, "center");

  // a little brass bell on the left rod
  context.strokeStyle = ink; context.lineWidth = 3;
  context.beginPath(); context.moveTo(190, y(350)); context.lineTo(160, y(362)); context.stroke();
  const bell = new Path2D(`M136 ${y(410)}Q136 ${y(366)} 160 ${y(362)}Q184 ${y(366)} 184 ${y(410)}Z`);
  context.fillStyle = BRASS; context.fill(bell); context.stroke(bell);
  roundedRect(context, 130, y(406), 60, 9, 4); context.fillStyle = BRASS; context.fill(); context.stroke();
  context.fillStyle = ink; context.beginPath(); context.arc(160, y(422), 5, 0, Math.PI * 2); context.fill();
  context.lineWidth = 2.5;
  for (const offset of [0, 12]) { context.beginPath(); context.arc(160, y(392), 38 + offset, Math.PI * 1.05, Math.PI * 1.3); context.stroke(); }
}

const layouts = {
  feed: { title: 104, line: 162, rickshaw: 208 },
  story: { title: 340, line: 404, rickshaw: 500 },
} as const;

export function drawCard(canvas: HTMLCanvasElement, board: Board, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  context.fillStyle = BG;
  context.fillRect(0, 0, width, height);
  if (format === "story") fitText(context, [{ text: "রিকশার রং · একটুখানি", color: "#7a4a08", weight: 600 }], width / 2, 200, 30, 900, "center");
  fitText(context, [{ text: "ঢাকার রাস্তায় চলবে আমার বোর্ড", color: fixed.ink, weight: 800, display: true }], width / 2, layout.title, 68, 960, "center");
  fitText(context, [{ text: boardLine(board), color: "#6b3d06", weight: 600 }], width / 2, layout.line, 34, 920, "center");
  drawRickshaw(context, board, layout.rickshaw);
  if (format === "story") fitText(context, [{ text: "রিকশা পেইন্টিং · ঢাকার চলন্ত গ্যালারি", color: "#7a4a08", weight: 600 }], width / 2, 1590, 32, 900, "center");
  drawFooterBand(context, format, "তোমার রিকশার বোর্ডে কী লিখতে?", site);
}

export const cardBlob = (board: Board, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, board, format, site));
