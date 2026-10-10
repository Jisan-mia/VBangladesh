// One drawing, two renderers: the page draws these paths as SVG, the card feeds the same strings to Path2D.
// A cheerful red-brown deshi cow with a hump, a marigold garland and a tailor's tape at the two places you measure.

export type Part = { d: string; fill?: string; stroke?: string; width?: number; dash?: readonly number[]; opacity?: number };

export const VIEW = { width: 420, height: 290 } as const;
/** The cow grows from here: the middle of its feet on the ground. */
export const ORIGIN = { x: 200, y: 248 } as const;
/** Measurements the drawing is drawn at (inches); other sizes stretch it a little. */
export const BASE = { girth: 50, length: 42 } as const;

export const colors = {
  hide: "#c4622f", hideFar: "#9b4821", line: "#5a2a12", patch: "#fff4e6", muzzle: "#f3a993", blush: "#ee8a76",
  horn: "#f4e7c6", hoof: "#4b2a19", tape: "#f7cf3d", tick: "#3b2a10", marigold: "#f08a1c", marigoldDeep: "#c9600b", yellow: "#f9c22e",
  bamboo: "#dcb56a", bambooLine: "#b08a45", shadow: "rgba(90,42,18,.18)", point: "#2f1a0c",
} as const;

const ellipse = (cx: number, cy: number, rx: number, ry: number) => `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${rx * 2} 0a${rx} ${ry} 0 1 0 ${-rx * 2} 0Z`;
const circle = (cx: number, cy: number, r: number) => ellipse(cx, cy, r, r);
const rounded = (x: number, y: number, w: number, h: number, r: number) => `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${-(w - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-(h - 2 * r)}a${r} ${r} 0 0 1 ${r} ${-r}Z`;

const outline = { stroke: colors.line, width: 3 } as const;

/** A হাটের বাঁশের বেড়া behind the cow. Not stretched with it. */
export const fence: Part[] = [
  { d: rounded(0, 150, 420, 9, 4.5), fill: colors.bamboo, stroke: colors.bambooLine, width: 1.5 },
  { d: rounded(0, 186, 420, 9, 4.5), fill: colors.bamboo, stroke: colors.bambooLine, width: 1.5 },
  ...[18, 402].map(x => ({ d: rounded(x - 7, 120, 14, 132, 6), fill: colors.bamboo, stroke: colors.bambooLine, width: 1.5 })),
  ...[18, 402].flatMap(x => [142, 176, 214].map(y => ({ d: `M${x - 7} ${y}h14`, stroke: colors.bambooLine, width: 2 }))),
];

export const shadow: Part = { d: ellipse(ORIGIN.x - 4, 248, 132, 9), fill: colors.shadow };

// Marigolds strung along a curve that hangs round the neck and dips onto the chest; the head hides its far end.
const garlandCurve = { a: [284, 84], c: [282, 230], b: [338, 124] } as const;
function curvePoint(t: number) {
  const { a, c, b } = garlandCurve;
  const u = 1 - t;
  return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]] as const;
}
const BEADS = 13;
// Beads sit at equal distances along the string, not equal steps of t, so the bottom of the loop doesn't bunch up.
const samples = Array.from({ length: 201 }, (_, i) => curvePoint(i / 200));
const along = [0];
for (let i = 1; i < samples.length; i++) along.push(along[i - 1] + Math.hypot(samples[i][0] - samples[i - 1][0], samples[i][1] - samples[i - 1][1]));
const marigolds: Part[] = Array.from({ length: BEADS }, (_, index) => {
  const [x, y] = samples[along.findIndex(distance => distance >= (along[200] * index) / (BEADS - 1) - 1e-9)];
  const gold = index % 2 === 1;
  return [
    { d: circle(x, y, 8.6), fill: gold ? colors.yellow : colors.marigold, stroke: colors.marigoldDeep, width: 1.8 },
    { d: circle(x, y, 4.2), stroke: gold ? "#e7a91c" : colors.marigoldDeep, width: 1.2, dash: [1.4, 2] },
    { d: circle(x - 2, y - 2, 2.2), fill: gold ? "#fff1b0" : "#ffc06a" },
  ];
}).flat();
/** Where the name tag hangs: the lowest point of the garland. */
export const tagAnchor = (() => {
  let low = curvePoint(0);
  for (let i = 1; i <= 40; i++) { const point = curvePoint(i / 40); if (point[1] > low[1]) low = point; }
  return { x: low[0], y: low[1] };
})();

/** The tailor's tape: a yellow band with ink ticks, as the two measuring lines. */
const tape = (d: string): Part[] => [
  { d, stroke: colors.tick, width: 15 },
  { d, stroke: colors.tape, width: 12 },
  { d, stroke: colors.tick, width: 5, dash: [1.6, 4.4] },
];
export const GIRTH = "M232 80C225 112 225 152 234 186";
export const LENGTH = "M300 138L95 112";
/** The two bony points the length runs between: point of shoulder, pin bone. */
export const points = { shoulder: { x: 300, y: 138 }, pin: { x: 95, y: 112 } } as const;

export const cow: Part[] = [
  // tail, behind everything
  { d: "M98 104C76 118 70 160 77 196", stroke: colors.line, width: 9 },
  { d: "M98 104C76 118 70 160 77 196", stroke: colors.hide, width: 4.5 },
  { d: "M77 192C66 200 68 220 78 224C88 220 90 200 77 192Z", fill: colors.line },
  // far legs
  { d: rounded(122, 160, 22, 86, 9), fill: colors.hideFar, ...outline },
  { d: rounded(266, 160, 22, 86, 9), fill: colors.hideFar, ...outline },
  { d: rounded(121, 234, 24, 13, 4), fill: colors.hoof },
  { d: rounded(265, 234, 24, 13, 4), fill: colors.hoof },
  // near legs: the back one has a thigh that disappears under the body
  { d: "M96 136C94 170 104 200 104 238L130 238C130 206 136 184 146 158Z", fill: colors.hide, ...outline },
  { d: rounded(242, 156, 26, 86, 10), fill: colors.hide, ...outline },
  { d: rounded(102, 234, 30, 14, 5), fill: colors.hoof },
  { d: rounded(240, 234, 30, 14, 5), fill: colors.hoof },
  // body with the zebu hump at the shoulder
  { d: "M100 98C112 84 140 82 170 84L236 84C246 64 276 62 288 82C298 90 306 96 314 106C320 132 314 160 298 172C270 188 160 190 132 180C104 174 92 150 92 126C92 112 94 104 100 98Z", fill: colors.hide, ...outline },
  // white patches
  { d: "M150 100C172 90 198 100 194 122C190 142 160 144 150 128C144 118 144 106 150 100Z", fill: colors.patch },
  { d: "M170 168C200 176 250 176 280 166C268 180 220 186 182 182C172 180 168 174 170 168Z", fill: colors.patch },
  { d: "M108 112C118 106 126 116 120 126C114 134 104 128 108 112Z", fill: colors.patch },
  // dewlap
  { d: "M296 140C308 160 306 182 288 186C280 178 282 160 284 150Z", fill: colors.hide, ...outline },
  // the garland goes on before the head, so its top end disappears behind it, round the neck
  ...marigolds,
  // ear, horns, head
  { d: "M318 98C302 84 288 90 290 100C298 108 310 106 320 104Z", fill: colors.hide, ...outline },
  { d: "M298 96C302 94 310 98 314 101", stroke: colors.blush, width: 3 },
  { d: "M344 86C346 74 354 68 362 70C356 76 354 82 354 90Z", fill: colors.horn, stroke: colors.line, width: 2.5 },
  { d: "M326 88C322 76 328 66 336 64C333 72 334 80 337 88Z", fill: colors.horn, stroke: colors.line, width: 2.5 },
  { d: "M312 94C326 80 352 82 364 96C374 108 380 128 374 142C366 156 340 160 326 150C312 140 306 110 312 94Z", fill: colors.hide, ...outline },
  { d: "M330 90C338 88 346 90 350 96C344 100 336 100 330 90Z", fill: colors.patch },
  { d: ellipse(360, 141, 18, 14), fill: colors.muzzle, stroke: colors.line, width: 2.5 },
  { d: ellipse(355, 139, 2.6, 3.4), fill: colors.line },
  { d: ellipse(366, 137, 2.6, 3.4), fill: colors.line },
  { d: "M345 150Q353 157 364 152", stroke: colors.line, width: 2.6 },
  // a happy closed eye and a blush
  { d: "M334 110Q341 102 348 110", stroke: colors.line, width: 3.6 },
  { d: ellipse(334, 126, 7, 4.5), fill: colors.blush, opacity: 0.55 },
  ...tape(GIRTH),
  ...tape(LENGTH),
  { d: circle(points.shoulder.x, points.shoulder.y, 5), fill: colors.point, stroke: "#fff", width: 2 },
  { d: circle(points.pin.x, points.pin.y, 5), fill: colors.point, stroke: "#fff", width: 2 },
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
/** How much the drawing stretches for these measurements (inches): longer cows get wider, rounder cows taller. */
export function stretch(girthIn: number, lengthIn: number) {
  return { x: clamp(lengthIn / BASE.length, 0.84, 1.16), y: clamp(girthIn / BASE.girth, 0.84, 1.16) };
}
/** A point on the cow after stretching. */
export const place = (x: number, y: number, scale: { x: number; y: number }) => ({ x: ORIGIN.x + (x - ORIGIN.x) * scale.x, y: ORIGIN.y + (y - ORIGIN.y) * scale.y });

/** Where the label chips sit (unstretched space) and the tape point each one points at. */
export const labelSpots = {
  length: { x: 200, y: 24, target: [200, 125] as const },
  girth: { x: 232, y: 274, target: [234, 186] as const },
} as const;

/** Draws parts on a canvas already transformed into the drawing's 420×290 space. */
export function paint(context: CanvasRenderingContext2D, parts: readonly Part[]) {
  context.lineCap = "round";
  context.lineJoin = "round";
  for (const part of parts) {
    const path = new Path2D(part.d);
    context.globalAlpha = part.opacity ?? 1;
    if (part.fill) { context.fillStyle = part.fill; context.fill(path); }
    if (part.stroke) {
      context.strokeStyle = part.stroke;
      context.lineWidth = part.width ?? 2;
      context.setLineDash(part.dash ? [...part.dash] : []);
      context.stroke(path);
    }
  }
  context.globalAlpha = 1;
  context.setLineDash([]);
}
