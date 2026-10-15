// Original drawings as plain path data, so the same friendly dinosaur and bones render in SVG on the page and with Path2D on the card.
// Everything is drawn from a few ellipses and strokes in a 240×160 box, facing right; bones sit in a ~60×40 box around 0,0.

export type Shape = { d: string; fill?: string; stroke?: string; width?: number; opacity?: number };
export type P = readonly [number, number];
/** cx, cy, rx, ry, rotation in degrees */
export type E = readonly [number, number, number, number, number];
export type Limb = { from: P; to: P; w: number; far?: boolean };
export type Extra =
  | { k: "frill"; e: E }
  | { k: "horn"; from: P; to: P; w: number }
  | { k: "plate"; at: P; h: number; w: number }
  | { k: "sail"; x1: number; x2: number; y: number; h: number }
  | { k: "club"; e: E }
  | { k: "bump"; at: P; r: number }
  | { k: "spot"; at: P; r: number }
  | { k: "crest"; from: P; via: P; to: P; w: number }
  | { k: "dome"; e: E }
  | { k: "feather"; from: P; to: P; w: number }
  | { k: "fan"; e: E };

export type Look = {
  color: string; shade: string; belly: string; accent: string;
  body: E; head: E; neck: { from: P; via: P; to: P; w: number }; tail: { from: P; via: P; to: P; w: number };
  legs: Limb[]; arms?: Limb[]; extras?: Extra[];
};

export const BOX = { width: 240, height: 160, ground: 148 } as const;
const INK = "#3b2a1a", BONE = "#f6ecd4", BONE_LINE = "#9a7b4f";
const f = (n: number) => Math.round(n * 10) / 10;

export function ellipse([cx, cy, rx, ry, rot]: E) {
  const a = rot * Math.PI / 180, dx = rx * Math.cos(a), dy = rx * Math.sin(a);
  return `M${f(cx - dx)} ${f(cy - dy)}A${rx} ${ry} ${rot} 1 0 ${f(cx + dx)} ${f(cy + dy)}A${rx} ${ry} ${rot} 1 0 ${f(cx - dx)} ${f(cy - dy)}Z`;
}
const circle = (x: number, y: number, r: number) => ellipse([x, y, r, r, 0]);
const curve = (from: P, via: P, to: P) => `M${f(from[0])} ${f(from[1])}Q${f(via[0])} ${f(via[1])} ${f(to[0])} ${f(to[1])}`;
const line = (from: P, to: P) => `M${f(from[0])} ${f(from[1])}L${f(to[0])} ${f(to[1])}`;

/** A tail: wide at the body, a soft point at the tip. */
function taper(from: P, via: P, to: P, w: number) {
  const dx = via[0] - from[0], dy = via[1] - from[1], length = Math.hypot(dx, dy) || 1;
  const nx = -dy / length * w / 2, ny = dx / length * w / 2;
  return `M${f(from[0] + nx)} ${f(from[1] + ny)}Q${f(via[0] + nx / 2)} ${f(via[1] + ny / 2)} ${f(to[0])} ${f(to[1])}Q${f(via[0] - nx / 2)} ${f(via[1] - ny / 2)} ${f(from[0] - nx)} ${f(from[1] - ny)}Z`;
}

/** A horn or spike: a triangle from a base centre to a tip. */
function spike(from: P, to: P, w: number) {
  const dx = to[0] - from[0], dy = to[1] - from[1], length = Math.hypot(dx, dy) || 1;
  const nx = -dy / length * w / 2, ny = dx / length * w / 2;
  return `M${f(from[0] + nx)} ${f(from[1] + ny)}Q${f(from[0] + dx * 0.6 + nx * 0.4)} ${f(from[1] + dy * 0.6 + ny * 0.4)} ${f(to[0])} ${f(to[1])}Q${f(from[0] + dx * 0.6 - nx * 0.4)} ${f(from[1] + dy * 0.6 - ny * 0.4)} ${f(from[0] - nx)} ${f(from[1] - ny)}Z`;
}

function limb(limb: Limb, color: string): Shape[] {
  const [fx, fy] = limb.to;
  return [
    { d: line(limb.from, limb.to), stroke: color, width: limb.w },
    { d: ellipse([fx + limb.w * 0.35, fy + limb.w * 0.05, limb.w * 0.8, limb.w * 0.42, 0]), fill: color },
  ];
}

function extra(item: Extra, look: Look): Shape[] {
  switch (item.k) {
    case "frill": return [{ d: ellipse(item.e), fill: look.accent }, { d: ellipse([item.e[0] + 3, item.e[1] + 3, item.e[2] * 0.62, item.e[3] * 0.62, item.e[4]]), fill: look.belly, opacity: 0.45 }];
    case "horn": return [{ d: spike(item.from, item.to, item.w), fill: BONE, stroke: BONE_LINE, width: 1.2 }];
    case "plate": {
      const [x, y] = item.at, { h, w } = item;
      return [{ d: `M${f(x - w / 2)} ${f(y)}Q${f(x - w / 2)} ${f(y - h * 0.6)} ${f(x)} ${f(y - h)}Q${f(x + w / 2)} ${f(y - h * 0.6)} ${f(x + w / 2)} ${f(y)}Z`, fill: look.accent }];
    }
    case "sail": {
      const { x1, x2, y, h } = item, ribs = 6;
      const shapes: Shape[] = [{ d: `M${x1} ${y}Q${f((x1 + x2) / 2)} ${f(y - h * 1.6)} ${x2} ${y}Z`, fill: look.accent }];
      for (let i = 1; i < ribs; i++) {
        const x = x1 + (x2 - x1) * i / ribs, t = i / ribs, top = y - h * 1.6 * 2 * t * (1 - t) * 0.92;
        shapes.push({ d: line([x, y], [x, top]), stroke: look.shade, width: 1.4, opacity: 0.5 });
      }
      return shapes;
    }
    case "club": return [{ d: ellipse(item.e), fill: look.shade }];
    case "bump": return [{ d: circle(item.at[0], item.at[1], item.r), fill: look.accent }];
    case "spot": return [{ d: circle(item.at[0], item.at[1], item.r), fill: look.shade, opacity: 0.55 }];
    case "crest": return [{ d: curve(item.from, item.via, item.to), stroke: look.accent, width: item.w }];
    case "dome": return [{ d: ellipse(item.e), fill: look.accent }];
    case "feather": return [{ d: line(item.from, item.to), stroke: look.accent, width: item.w }];
    case "fan": return [{ d: ellipse(item.e), fill: look.accent }];
  }
}

const UNDER = new Set<Extra["k"]>(["plate", "sail"]), MID = new Set<Extra["k"]>(["frill", "crest"]);

/** The whole friendly dinosaur: far legs, tail, body, near legs, neck, head, then a smiling face. */
export function dinoShapes(look: Look): Shape[] {
  const extras = look.extras ?? [];
  const head = look.head, [hx, hy, hrx, hry] = head;
  const eye = { x: hx + hrx * 0.12, y: hy - hry * 0.28, r: Math.max(3.4, Math.min(5.5, hry * 0.32)) };
  const nearLegs = look.legs.filter(item => !item.far), farLegs = look.legs.filter(item => item.far);
  return [
    ...farLegs.flatMap(item => limb(item, look.shade)),
    ...extras.filter(item => UNDER.has(item.k)).flatMap(item => extra(item, look)),
    { d: taper(look.tail.from, look.tail.via, look.tail.to, look.tail.w), fill: look.color },
    { d: ellipse(look.body), fill: look.color },
    { d: ellipse([look.body[0] + 4, look.body[1] + look.body[3] * 0.42, look.body[2] * 0.7, look.body[3] * 0.45, look.body[4]]), fill: look.belly },
    ...nearLegs.flatMap(item => [{ d: circle(item.from[0], item.from[1], item.w * 0.95), fill: look.color }, ...limb(item, look.color)]),
    { d: curve(look.neck.from, look.neck.via, look.neck.to), stroke: look.color, width: look.neck.w },
    ...extras.filter(item => MID.has(item.k)).flatMap(item => extra(item, look)),
    { d: ellipse(head), fill: look.color },
    ...extras.filter(item => !UNDER.has(item.k) && !MID.has(item.k)).flatMap(item => extra(item, look)),
    ...(look.arms ?? []).flatMap(item => [{ d: line(item.from, item.to), stroke: look.shade, width: item.w }]),
    // the face: a big round eye with a shine, a pink cheek and a small smile
    { d: circle(hx + hrx * 0.22, hy + hry * 0.3, hry * 0.2), fill: "#ff9a8b", opacity: 0.55 },
    { d: circle(eye.x, eye.y, eye.r), fill: "#ffffff" },
    { d: circle(eye.x + eye.r * 0.2, eye.y + eye.r * 0.05, eye.r * 0.62), fill: INK },
    { d: circle(eye.x + eye.r * 0.42, eye.y - eye.r * 0.25, eye.r * 0.22), fill: "#ffffff" },
    { d: curve([hx + hrx * 0.38, hy + hry * 0.38], [hx + hrx * 0.62, hy + hry * 0.62], [hx + hrx * 0.86, hy + hry * 0.3]), stroke: INK, width: 1.6 },
    { d: circle(hx + hrx * 0.84, hy - hry * 0.22, 1.3), fill: INK },
  ];
}

export type BoneKind = "skull" | "dome" | "ribs" | "leg" | "arm" | "tail" | "neck" | "frill" | "plate" | "claw" | "sail" | "club" | "crest";

/** Line bones get a dark outline under a pale stroke. */
const boneLine = (d: string, w: number): Shape[] => [{ d, stroke: BONE_LINE, width: w + 3 }, { d, stroke: BONE, width: w }];
const boneFill = (d: string): Shape => ({ d, fill: BONE, stroke: BONE_LINE, width: 1.6 });
const hole = (x: number, y: number, r: number): Shape => ({ d: circle(x, y, r), fill: "#7a5c36" });

/** One fossil bone in a ~56×40 box around 0,0. */
export function boneShapes(kind: BoneKind): Shape[] {
  switch (kind) {
    case "skull": return [boneFill("M-24 4Q-26 -12 -6 -15Q14 -16 24 -3Q27 6 16 8L-16 10Z"), hole(2, -5, 4.5), { d: ellipse([18, -3, 2.4, 1.6, 0]), fill: "#7a5c36" }, ...boneLine("M-18 13Q0 18 18 11", 3)];
    case "dome": return [boneFill("M-20 8Q-24 -6 -10 -15Q4 -26 16 -12Q24 -2 20 6L-14 10Z"), hole(6, -2, 4), ...[-16, -6, 6, 16].map(x => ({ d: circle(x, x === -16 || x === 16 ? -8 : -19, 2.4), fill: BONE, stroke: BONE_LINE, width: 1.2 }))];
    case "ribs": return [...boneLine("M-26 -13Q0 -19 26 -13", 4), ...[-18, -9, 0, 9, 18].flatMap(x => boneLine(`M${x} -14Q${x + 5} 0 ${x - 1} 13`, 3))];
    case "leg": return [...boneLine("M0 -16L0 16", 7), ...[[-4, -18], [4, -18], [-4, 18], [4, 18]].map(([x, y]) => ({ d: circle(x, y, 4.6), fill: BONE, stroke: BONE_LINE, width: 1.4 }))];
    case "arm": return [...boneLine("M0 -14L0 8", 5), { d: circle(0, -15, 4.4), fill: BONE, stroke: BONE_LINE, width: 1.4 }, ...boneLine("M0 8L-6 16M0 8L0 18M0 8L6 16", 2.4)];
    case "tail": return [22, 13, 5, -3, -10, -16, -21].map((x, i) => ({ d: circle(x, i * 1.2, 7 - i * 0.8), fill: BONE, stroke: BONE_LINE, width: 1.4 }));
    case "neck": return [[-20, 12], [-11, 6], [-2, 0], [7, -6], [16, -12]].map(([x, y]) => ({ d: ellipse([x, y, 5.6, 4.6, -32]), fill: BONE, stroke: BONE_LINE, width: 1.4 }));
    case "frill": return [boneFill("M-24 12A24 24 0 0 1 24 12Z"), ...[-14, 0, 14].map(x => hole(x, 2 - (x === 0 ? 6 : 0), 3.2)), boneFill("M-10 12L-6 -14L-2 12Z")];
    case "plate": return [boneFill("M-12 14Q-14 -4 0 -20Q14 -4 12 14Z"), ...boneLine("M0 10L0 -12", 1.4)];
    case "claw": return [boneFill("M-10 14Q-14 -14 16 -18Q2 -8 4 14Z")];
    case "sail": return [...boneLine("M-26 14L26 14", 4), ...[-20, -11, -2, 7, 16].map((x, i) => boneLine(`M${x} 14L${x + 2} ${-4 - [6, 14, 18, 12, 4][i]}`, 3)).flat()];
    case "club": return [...boneLine("M-24 0L4 0", 5), boneFill("M0 0Q0 -12 14 -11Q26 -10 25 0Q26 10 14 11Q0 12 0 0Z")];
    case "crest": return [...boneLine("M-20 12Q-14 -14 22 -12", 7)];
  }
}

export type Teeth = "sharp" | "flat" | "beak";

/** The close-up of the mouth for the "what did it eat?" question: knife teeth, small blunt teeth, or a beak. 100×100 box. */
export function mouthShapes(teeth: Teeth, look: Pick<Look, "color" | "shade">): Shape[] {
  const jaw: Shape[] = [
    { d: "M0 18Q40 8 92 28Q100 34 92 40L0 44Z", fill: look.color },
    { d: "M0 62L92 60Q100 66 90 72Q40 92 0 84Z", fill: look.shade },
    { d: "M0 44L92 40L90 60L0 62Z", fill: "#7a2f3a" },
  ];
  if (teeth === "sharp") {
    const top = [8, 22, 36, 50, 64, 78].map(x => ({ d: `M${x} 43L${x + 10} 43L${x + 5} 58Z`, fill: "#ffffff", stroke: BONE_LINE, width: 1 }));
    const bottom = [14, 28, 42, 56, 70].map(x => ({ d: `M${x} 62L${x + 10} 61L${x + 5} 48Z`, fill: "#ffffff", stroke: BONE_LINE, width: 1 }));
    return [...jaw, ...top, ...bottom];
  }
  const flat = [6, 18, 30, 42, 54].map(x => ({ d: `M${x} 43h10v8q0 3 -3 3h-4q-3 0 -3 -3Z`, fill: "#ffffff", stroke: BONE_LINE, width: 1 }));
  const low = [8, 20, 32, 44, 56].map(x => ({ d: `M${x} 61h10v-6q0 -3 -3 -3h-4q-3 0 -3 3Z`, fill: "#ffffff", stroke: BONE_LINE, width: 1 }));
  if (teeth === "flat") return [...jaw, ...flat, ...low];
  return [...jaw, ...flat.slice(0, 3), ...low.slice(0, 3), { d: "M66 24Q98 20 100 50Q96 62 70 62Z", fill: "#e9d7a8", stroke: BONE_LINE, width: 1.4 }];
}

/** A bus or a rickshaw, side on, in a box `length` units long with the wheels on y = 0. */
export function vehicleShapes(kind: "bus" | "rickshaw", length: number): Shape[] {
  if (kind === "bus") {
    const h = length * 0.2, windows = Array.from({ length: 6 }, (_, i) => ({ d: `M${f(length * (0.08 + i * 0.145))} ${f(-h * 0.88)}h${f(length * 0.11)}v${f(h * 0.32)}h${f(-length * 0.11)}Z`, fill: "#dff1ff" }));
    return [{ d: `M0 ${f(-h * 0.16)}V${f(-h)}H${f(length * 0.96)}Q${f(length)} ${f(-h)} ${f(length)} ${f(-h * 0.8)}V${f(-h * 0.16)}Z`, fill: "#2f8f5b" }, ...windows,
      { d: circle(length * 0.18, -h * 0.12, h * 0.15), fill: INK }, { d: circle(length * 0.8, -h * 0.12, h * 0.15), fill: INK }];
  }
  const r = length * 0.16;
  return [{ d: circle(length * 0.18, -r, r), fill: "none", stroke: INK, width: 1.6 }, { d: circle(length * 0.82, -r, r), fill: "none", stroke: INK, width: 1.6 },
    { d: `M${f(length * 0.18)} ${f(-r)}L${f(length * 0.5)} ${f(-r * 2.4)}L${f(length * 0.82)} ${f(-r)}`, stroke: INK, width: 1.6 },
    { d: `M${f(length * 0.48)} ${f(-r * 2.4)}Q${f(length * 0.5)} ${f(-r * 4.6)} ${f(length * 0.9)} ${f(-r * 4.2)}L${f(length * 0.86)} ${f(-r * 2.6)}Z`, fill: "#e8483d" }];
}

/** A শালিক (myna) on a branch, for the "birds are today's dinosaurs" page. 240×160 box. */
export function birdShapes(): Shape[] {
  return [
    { d: line([40, 128], [220, 120]), stroke: "#8a5a34", width: 7 },
    { d: "M70 92Q40 98 30 116L44 118Q62 106 84 102Z", fill: "#3f2d25" },
    { d: ellipse([110, 92, 42, 28, -12]), fill: "#6b4a3a" },
    { d: ellipse([98, 92, 22, 12, -20]), fill: "#4f362a" },
    { d: ellipse([90, 96, 8, 5, -20]), fill: "#ffffff" },
    { d: circle(150, 62, 22), fill: "#2b211c" },
    { d: "M168 58L192 64L168 70Z", fill: "#f2c230" },
    { d: ellipse([156, 60, 9, 7, 0]), fill: "#f2c230" },
    { d: circle(157, 59, 4), fill: "#2b211c" },
    { d: circle(158.4, 57.6, 1.3), fill: "#ffffff" },
    { d: line([104, 118], [102, 126]), stroke: "#f2c230", width: 3 },
    { d: line([120, 116], [122, 124]), stroke: "#f2c230", width: 3 },
  ];
}
