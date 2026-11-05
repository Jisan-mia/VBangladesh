// Our own code art on a 100-unit square: food, guests' faces and a রুটি cut into equal (or unequal) pieces.
// Each picture is a list of SVG path layers, so the game draws them as <svg> and the parent card as canvas Path2D.
import type { Food, Guest, Mood } from "./people";

export type Layer = { d: string; fill?: string; stroke?: string; w?: number };

const r1 = (value: number) => Math.round(value * 10) / 10;
export const circle = (x: number, y: number, r: number) => `M${r1(x - r)} ${r1(y)}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`;
const dots = (points: number[][], r: number) => points.map(([x, y]) => circle(x, y, r)).join("");

export const RUTI_R = 42;
const RUTI_SPOTS = dots([[34, 36], [62, 30], [70, 56], [44, 66], [56, 46], [30, 58], [58, 74]], 3);

export const FOOD_ART: Record<Food, Layer[]> = {
  // ভাপা পিঠা: a soft white cake with গুড় peeking out of the middle.
  pitha: [
    { d: circle(50, 52, 38), fill: "#fbf3e2", stroke: "#d9c39a", w: 3 },
    { d: "M36 50C38 40 62 38 64 50C66 60 58 64 50 62C42 64 34 60 36 50Z", fill: "#9a5420" },
    { d: dots([[30, 40], [70, 42], [28, 62], [68, 66], [48, 78], [52, 30]], 2.4), fill: "#e6d6b6" },
  ],
  // A ফজলি-ish mango: plump, a little lopsided, green near the stem.
  aam: [
    { d: "M40 20C62 10 88 26 86 54C84 76 68 90 50 88C38 87 32 80 24 76C14 70 12 58 16 48C20 36 26 26 40 20Z", fill: "#f6b733", stroke: "#c98a12", w: 3 },
    { d: "M40 20C52 15 66 17 74 24C62 26 50 30 42 38C35 33 34 25 40 20Z", fill: "#a8c84a" },
    { d: "M30 50C30 42 34 36 40 32", stroke: "#fff8", w: 5 },
    { d: "M44 18C48 8 62 4 72 8C66 16 56 20 44 18Z", fill: "#4f9a3a" },
  ],
  // মুড়ির মোয়া: a গুড়-brown ball with puffed rice showing.
  moa: [
    { d: circle(50, 54, 36), fill: "#d9952e", stroke: "#a86a14", w: 3 },
    { d: dots([[38, 40], [56, 34], [68, 48], [44, 56], [60, 64], [34, 66], [50, 76], [72, 66], [26, 52]], 3.6), fill: "#fbe7b4" },
  ],
  jilapi: [
    { d: "M47 52a6 6 0 0 1 12 0a12 12 0 0 1 -24 0a18 18 0 0 1 36 0a24 24 0 0 1 -48 0", stroke: "#e8790f", w: 9 },
    { d: "M47 52a6 6 0 0 1 12 0a12 12 0 0 1 -24 0a18 18 0 0 1 36 0a24 24 0 0 1 -48 0", stroke: "#ffc163", w: 3 },
  ],
  ruti: [
    { d: circle(50, 50, RUTI_R), fill: "#ebc584", stroke: "#b98a3e", w: 3 },
    { d: RUTI_SPOTS, fill: "#b07a36" },
  ],
};

const point = (angle: number, r = RUTI_R) => `${r1(50 + Math.cos(angle) * r)} ${r1(50 + Math.sin(angle) * r)}`;
const angleOf = (parts: number, index: number) => -Math.PI / 2 + (index * 2 * Math.PI) / parts;

/** One of `parts` equal wedges of the রুটি, the first one pointing up. */
export const wedge = (parts: number, index: number) => `M50 50L${point(angleOf(parts, index))}A${RUTI_R} ${RUTI_R} 0 0 1 ${point(angleOf(parts, index + 1))}Z`;

/** The knife lines for `parts` equal pieces (halves, a Y for thirds, a cross for quarters). */
export const cutLines = (parts: number) => Array.from({ length: parts }, (_, index) => `M50 50L${point(angleOf(parts, index))}`).join("");

/** Off-centre cuts: two (or four) pieces that are plainly not equal. */
export function unfairLines(parts: number) {
  const chord = (offset: number) => Math.sqrt(RUTI_R ** 2 - offset ** 2);
  const v = `M32 ${r1(50 - chord(18))}V${r1(50 + chord(18))}`;
  return parts === 2 ? v : `${v}M${r1(50 - chord(16))} 34H${r1(50 + chord(16))}`;
}

export const KNIFE = "#5b3a1c";
/** The whole রুটি with its cuts drawn; `shade` lights one equal piece. */
export function cutRuti(parts: number, { shade, unfair = false }: { shade?: number; unfair?: boolean } = {}): Layer[] {
  return [
    ...FOOD_ART.ruti,
    ...(shade === undefined ? [] : [{ d: wedge(parts, shade), fill: "#e8590c", stroke: "#a63c00", w: 2 }]),
    { d: unfair ? unfairLines(parts) : cutLines(parts), stroke: KNIFE, w: 3.5 },
  ];
}

/** The cut রুটি while it's being handed out: only the pieces still on the board, then the knife lines. */
export const rutiLeft = (parts: number, given: number): Layer[] => [
  ...Array.from({ length: parts - given }, (_, index) => ({ d: wedge(parts, index + given), fill: "#ebc584", stroke: "#b98a3e", w: 3 })),
  { d: cutLines(parts), stroke: KNIFE, w: 3.5 },
];

/** A single wedge, the piece a guest gets. */
export const pieceArt = (parts: number): Layer[] => [{ d: wedge(parts, 0), fill: "#ebc584", stroke: "#b98a3e", w: 3 }];

const SKIN = ["#f0c8a0", "#d39a6a", "#9c6440"];
const HAIR = "#2b1d16";
const LINE = "#3b2418";
const SCARF = "#3f7f8c";
const SHORT = "M20 54C18 30 34 20 50 20C68 20 82 30 80 52C74 40 62 34 50 36C38 34 26 42 20 54Z";

/** Hair or scarf behind the head, and in front of it. */
const LOOKS: { back: string[]; front: string[] }[] = [
  { back: [], front: [SHORT] },
  { back: ["M18 54C16 30 34 20 50 20C66 20 84 30 82 54L84 84C76 86 72 80 72 72L72 50H28L28 72C28 80 24 86 16 84Z"], front: ["M22 52C22 32 36 22 50 22C66 22 78 32 78 50C70 40 58 32 44 34C34 36 26 42 22 52Z"] },
  { back: ["M14 60C14 32 30 16 50 16C70 16 86 32 86 60L90 98H10Z"], front: ["M22 50C22 32 34 22 50 22C66 22 78 32 78 50C70 34 30 34 22 50Z"] },
  { back: [], front: [circle(30, 34, 10) + circle(42, 26, 11) + circle(56, 25, 11) + circle(69, 31, 10) + circle(77, 43, 7) + circle(23, 46, 7)] },
  { back: [circle(50, 18, 9)], front: [SHORT] },
];

const EYES = circle(39, 56, 3.4) + circle(61, 56, 3.4);
const FACES: Record<Mood, Layer[]> = {
  wait: [{ d: EYES, fill: LINE }, { d: "M44 71H56", stroke: LINE, w: 3 }],
  smile: [{ d: EYES, fill: LINE }, { d: "M42 68Q50 76 58 68", stroke: LINE, w: 3 }],
  happy: [
    { d: "M34 57Q39 51 44 57M56 57Q61 51 66 57", stroke: LINE, w: 3 },
    { d: "M40 66Q50 82 60 66Z", fill: "#8a2c2c", stroke: LINE, w: 2 },
    { d: circle(31, 66, 4.5) + circle(69, 66, 4.5), fill: "#ee8a8a99" },
  ],
  sad: [{ d: EYES, fill: LINE }, { d: "M33 48L44 45M56 45L67 48", stroke: LINE, w: 2.5 }, { d: "M42 75Q50 67 58 75", stroke: LINE, w: 3 }],
  oh: [{ d: EYES, fill: LINE }, { d: "M33 46L44 47M56 47L67 46", stroke: LINE, w: 2.5 }, { d: circle(50, 72, 4.5), fill: "#8a2c2c" }],
};

export function faceArt(guest: Guest, mood: Mood): Layer[] {
  const look = LOOKS[guest.look % LOOKS.length];
  return [
    ...look.back.map(d => ({ d, fill: guest.look === 2 ? SCARF : HAIR })),
    { d: circle(50, 58, 30), fill: SKIN[guest.skin % SKIN.length] },
    ...look.front.map(d => ({ d, fill: guest.look === 2 ? SCARF : HAIR })),
    ...FACES[mood],
    ...(guest.glasses ? [{ d: `${circle(39, 56, 8)}${circle(61, 56, 8)}M47 56H53`, stroke: "#1d2b53", w: 2.5 }] : []),
  ];
}

/** Paints layers on a canvas, centred at (x, y), `size` pixels across. */
export function paint(c: CanvasRenderingContext2D, layers: Layer[], x: number, y: number, size: number) {
  c.save();
  c.translate(x - size / 2, y - size / 2);
  c.scale(size / 100, size / 100);
  c.lineCap = "round"; c.lineJoin = "round";
  for (const layer of layers) {
    const path = new Path2D(layer.d);
    if (layer.fill) { c.fillStyle = layer.fill; c.fill(path); }
    if (layer.stroke) { c.strokeStyle = layer.stroke; c.lineWidth = layer.w ?? 2; c.stroke(path); }
  }
  c.restore();
}

// ---- the last-piece choices, drawn: nobody has to read "ভেঙে সবাইকে দিই" ----
const PLATE = { fill: "#ffffff", stroke: "#cdbfa8", w: 3 };
const BIT = "#fbf3e2";
/** A piece broken into three bits, one over each plate. */
const SHARE_ALL: Layer[] = [
  { d: [24, 50, 76].map(x => circle(x, 78, 14)).join(""), ...PLATE },
  { d: [24, 50, 76].map(x => circle(x, 76, 5)).join(""), fill: BIT, stroke: "#d9c39a", w: 1.5 },
  { d: circle(50, 22, 15), fill: BIT, stroke: "#d9c39a", w: 3 },
  { d: "M44 38L28 60M50 39V60M56 38L72 60", stroke: "#8a7a62", w: 3 },
];
/** A covered dish, kept back with a heart over it: for আম্মু. */
const KEEP: Layer[] = [
  { d: "M10 78H90", stroke: "#7d8a94", w: 5 },
  { d: "M18 76C18 50 34 40 50 40C66 40 82 50 82 76Z", fill: "#d5dce2", stroke: "#7d8a94", w: 3 },
  { d: circle(50, 36, 5), fill: "#7d8a94" },
  { d: "M50 28C44 14 28 18 34 30C38 38 50 44 50 44C50 44 62 38 66 30C72 18 56 14 50 28Z", fill: "#d8456b", stroke: "#a02a4a", w: 2 },
];
export const CHOICE_ART: Record<"share" | "keep", Layer[]> = { share: SHARE_ALL, keep: KEEP };

/** An arrow up and out of a plate: "take one back". */
export const BACK_ART: Layer[] = [{ d: "M50 82V22M28 44L50 22L72 44", stroke: "#8a4b00", w: 9 }];

/** The middle of wedge `index` of `parts`, where a counting number sits. */
export const wedgeCenter = (parts: number, index: number): [number, number] => {
  const angle = angleOf(parts, index + 0.5);
  return [r1(50 + Math.cos(angle) * RUTI_R * 0.58), r1(50 + Math.sin(angle) * RUTI_R * 0.58)];
};
