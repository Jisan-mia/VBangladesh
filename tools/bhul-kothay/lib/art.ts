// Drawn parts for the scenes. Each draws in its own space around its anchor (0,0), usually the bottom centre, y going up as negative.
// Objects get a soft ink outline, like a printed magazine drawing; sky, hills and leaves stay flat.
import type { Look, Paint, Shape } from "./shapes";

export const INK = "#3b2a20";
const LINE = 1.1;

const r2 = (value: number) => Math.round(value * 100) / 100;
/** Builds a path string from numbers, rounded so it never prints an exponent. */
export const d = (parts: TemplateStringsArray, ...values: number[]) => parts.reduce((out, part, index) => out + part + (index < values.length ? r2(values[index]) : ""), "");

type Opt = Partial<Paint> & { rx?: number };
const FLAT: Opt = { stroke: undefined, sw: undefined };
export const rect = (x: number, y: number, w: number, h: number, fill: string, o: Opt = {}): Shape => ({ k: "r", x, y, w, h, fill, stroke: INK, sw: LINE, ...o });
export const circle = (x: number, y: number, r: number, fill: string, o: Opt = {}): Shape => ({ k: "c", x, y, r, fill, stroke: INK, sw: LINE, ...o });
export const oval = (x: number, y: number, rx: number, ry: number, fill: string, o: Opt = {}): Shape => ({ k: "e", x, y, rx, ry, fill, stroke: INK, sw: LINE, ...o });
export const path = (dd: string, fill: string, o: Opt = {}): Shape => ({ k: "p", d: dd, fill, stroke: INK, sw: LINE, ...o });
export const line = (dd: string, stroke = INK, sw = LINE): Shape => ({ k: "p", d: dd, fill: "none", stroke, sw });
export const flat = (shape: Shape): Shape => ({ ...shape, ...FLAT } as Shape);
export const text = (x: number, y: number, value: string, size: number, max: number, fill: string, weight = 700): Shape => ({ k: "t", x, y, text: value, size, max, fill, weight });

const WOOD = "#a8703f", WOOD_DARK = "#7a4b28", LEAF = "#4f8a3a", LEAF_DARK = "#3a6e2c", LEAF_LIGHT = "#76ad4c", WHITE = "#fffaf0";

// ——— sky and ground ———

/** Horizontal bands, darkest at the top: a flat printed sky. */
export const bands = (w: number, top: number, bottom: number, colors: readonly string[]) => () => {
  const step = (bottom - top) / colors.length;
  return colors.map((color, index) => flat(rect(0, top + index * step, w, step + 0.6, color)));
};

export const sun = (look: Look) => [flat(circle(0, 0, 21, look.color!, { op: 0.28 })), circle(0, 0, 14, look.color!, { stroke: "#e08a1e" })];

export const cloud = () => [
  flat(circle(-13, -6, 8, WHITE)), flat(circle(-2, -11, 11, WHITE)), flat(circle(11, -7, 9, WHITE)), flat(circle(19, -3, 5.5, WHITE)),
  flat(rect(-21, -6, 44, 7, WHITE, { rx: 3.5 })),
];

const BIRD_AT = [[0, 0], [13, -6], [24, 2], [9, 9], [-11, 6]] as const;
export const birds = (look: Look) => BIRD_AT.slice(0, look.count).map(([x, y]) => line(d`M${x - 5.5} ${y} Q${x - 2.6} ${y - 4.5} ${x} ${y} Q${x + 2.6} ${y - 4.5} ${x + 5.5} ${y}`, INK, 1.4));

/** A round village tree: trunk with an outline, leaves in two flat greens. */
export const tree = (look: Look) => [
  rect(-3.5, -26, 7, 26, WOOD_DARK),
  flat(circle(-11, -33, 13, LEAF_DARK)), flat(circle(10, -35, 14, LEAF_DARK)), flat(circle(0, -47, 14, look.color ?? LEAF)),
  flat(circle(-6, -40, 9, look.color ?? LEAF)), flat(circle(6, -30, 7, LEAF_LIGHT)), flat(circle(-3, -50, 5, LEAF_LIGHT)),
];

/** The far line of trees as one flat silhouette. */
export const treeLine = (w: number, color: string, bumps: readonly number[]) => () => {
  let dd = d`M0 0 L0 ${-bumps[0]}`;
  const step = w / (bumps.length - 1);
  bumps.forEach((height, index) => { if (index) dd += d` Q${(index - 0.5) * step} ${-Math.max(height, bumps[index - 1]) - 7} ${index * step} ${-height}`; });
  return [flat(path(`${dd} ${d`L${w} 0 Z`}`, color))];
};

// ——— the fruit stall ———

/** A striped cloth awning, 200 wide, hanging down from its top edge with a scalloped hem. */
export const awning = (look: Look) => {
  const out: Shape[] = [rect(-104, -5, 208, 6, WOOD_DARK)];
  for (let index = 0; index < 10; index++) {
    const x = -100 + index * 20, fill = index % 2 ? WHITE : look.color!;
    out.push(path(d`M${x} 0 L${x + 20} 0 L${x + 20} 20 Q${x + 10} 31 ${x} 20 Z`, fill));
  }
  return out;
};

export const signboard = (name: string, w = 124) => (look: Look) => [
  line(d`M${-w / 2 + 12} -24 L${-w / 2 + 18} -34`), line(d`M${w / 2 - 12} -24 L${w / 2 - 18} -34`),
  rect(-w / 2, -25, w, 25, look.color!, { rx: 3 }),
  rect(-w / 2 + 3, -22, w - 6, 19, "none", { stroke: "#ffffff", sw: 0.8, rx: 2, op: 0.6 }),
  text(0, -12, look.label ?? name, 12.5, w - 14, "#ffffff"),
];

type Fruit = (x: number, y: number, color: string) => Shape[];
export const mango: Fruit = (x, y, c) => [
  path(d`M${x - 5.6} ${y + 1} C${x - 6} ${y - 4} ${x - 1} ${y - 5.2} ${x + 2} ${y - 4.6} C${x + 6} ${y - 4} ${x + 6.6} ${y + 1} ${x + 3} ${y + 3.2} C${x} ${y + 4.8} ${x - 5} ${y + 4} ${x - 5.6} ${y + 1} Z`, c),
  path(d`M${x + 1} ${y - 4.6} Q${x + 4} ${y - 8.5} ${x + 6.5} ${y - 6.5} Q${x + 4} ${y - 4} ${x + 1} ${y - 4.6} Z`, LEAF, { sw: 0.7 }),
];
export const roundFruit: Fruit = (x, y, c) => [circle(x, y, 4.9, c), flat(circle(x - 1.6, y - 1.7, 1.3, "#ffffff", { op: 0.55 })), flat(circle(x + 0.4, y - 4.6, 1, LEAF_DARK))];
export const litchi: Fruit = (x, y, c) => [circle(x, y, 4.5, c), flat(circle(x - 1.5, y - 1, 0.7, "#ffe1d6")), flat(circle(x + 1.4, y + 1.2, 0.7, "#ffe1d6")), flat(circle(x + 1, y - 2, 0.6, "#ffe1d6"))];
export const guava: Fruit = (x, y, c) => [path(d`M${x - 5} ${y + 1} C${x - 5.5} ${y - 4} ${x - 1.5} ${y - 5.5} ${x} ${y - 5} C${x + 1.5} ${y - 5.5} ${x + 5.5} ${y - 4} ${x + 5} ${y + 1} C${x + 4.5} ${y + 5} ${x - 4.5} ${y + 5} ${x - 5} ${y + 1} Z`, c), flat(circle(x, y - 5, 1, INK))];

/** Bottom row first, top fruit last, so "one fewer" always takes a fruit you can see. */
const BASKET_SLOTS = [[-13, -15], [-4.4, -16], [4.4, -16], [13, -15], [-8.5, -22], [0.5, -23], [9, -21.5], [-1, -29.5]] as const;
export const basket = (fruit: Fruit) => (look: Look) => [
  ...BASKET_SLOTS.slice(0, look.count).flatMap(([x, y]) => fruit(x, y, look.color!)),
  path("M-20 -13 L20 -13 L16 0 L-16 0 Z", "#cf9a52"),
  line("M-19 -9 L19 -9", "#8a5a2b", 0.8), line("M-17.6 -4.5 L17.6 -4.5", "#8a5a2b", 0.8),
  line("M-9 -13 L-8 0", "#8a5a2b", 0.7), line("M0 -13 L0 0", "#8a5a2b", 0.7), line("M9 -13 L8 0", "#8a5a2b", 0.7),
  rect(-22, -15.5, 44, 4, "#b07a3c", { rx: 2 }),
];

/** A hanging bunch of bananas on a string: the last banana is the front one at the bottom. */
const BANANAS = [[-6, 14], [6, 14], [-9, 21], [9, 21], [-4, 25], [4, 25], [0, 30], [-11, 29], [11, 29]] as const;
export const bananaBunch = (string = 14) => (look: Look) => [
  line(d`M0 ${-string} L0 4`, INK, 1),
  path("M-2.2 0 L2.2 0 L2.6 30 L-2.6 30 Z", "#7c8a3a"),
  ...BANANAS.slice(0, look.count).flatMap(([x, y]) => {
    const side = x < 0 ? -1 : 1, tip = x === 0 ? 0 : side * 8;
    return [path(d`M${x - 2.4} ${y - 9} Q${x - 2.6 + tip * 0.2} ${y + 2} ${x + tip * 0.5} ${y + 5} Q${x + 3.2 + tip * 0.2} ${y + 1} ${x + 2.4} ${y - 9} Z`, look.color!)];
  }),
];

/** দাঁড়িপাল্লা hanging from a hook: a beam and two pans on strings. */
export const hangingScale = () => [
  line("M0 -14 L0 0"), rect(-20, 0, 40, 3, "#8c8c8c", { rx: 1.5 }),
  line("M-18 3 L-24 24"), line("M-18 3 L-12 24"), line("M18 3 L12 24"), line("M18 3 L24 24"),
  path("M-27 24 L-9 24 Q-18 31 -27 24 Z", "#c9a35a"), path("M9 24 L27 24 Q18 31 9 24 Z", "#c9a35a"),
  circle(0, 1.5, 2, "#8c8c8c"),
];

export const bulb = (wire = 16) => (look: Look) => [
  line(d`M0 0 L0 ${wire}`, INK, 1), rect(-2.6, wire, 5.2, 5, "#6c6c6c"),
  ...(look.color === "#ffe066" ? [flat(circle(0, wire + 10, 9, "#fff3b0", { op: 0.55 }))] : []),
  circle(0, wire + 10, 5.6, look.color!),
];

/** A plastic crate, like the ones fruit comes in. */
export const crate = (look: Look) => [
  rect(-19, -24, 38, 24, look.color!, { rx: 2 }),
  rect(-7, -21, 14, 4, INK, { op: 0.35, rx: 2, stroke: undefined }),
  line("M-19 -12 L19 -12", INK, 0.8), line("M-9.5 -12 L-9.5 0", INK, 0.7), line("M0 -12 L0 0", INK, 0.7), line("M9.5 -12 L9.5 0", INK, 0.7),
];

/** A cat sitting, facing right, its tail curled off to the left. */
export const cat = (look: Look) => [
  path("M-6 0 C-16 0 -20 -6 -14 -9 C-11 -10.5 -10 -7 -12 -5 C-14 -3 -9 -2 -6 -2 Z", look.color!),
  path("M-8 0 C-10 -10 -6 -19 2 -19 C9 -19 11 -10 9 0 Z", look.color!),
  path("M-1 -22 L0 -31 L4 -26 L8 -27 L9 -18 C7 -14 0 -14 -1 -18 Z", look.color!),
  circle(4.2, -21.5, 6.6, look.color!),
  path("M-0.5 -26 L0.6 -31.5 L3.6 -27 Z", look.color!), path("M5.6 -27.4 L9 -31 L9.6 -25.6 Z", look.color!),
  flat(circle(2.6, -22.6, 0.9, INK)), flat(circle(6.6, -22.6, 0.9, INK)), flat(circle(4.6, -20.2, 0.8, "#c05050")),
  line("M-4 0 L-4 -4", INK, 0.8), line("M4 0 L4 -4", INK, 0.8),
];

/** A whole jackfruit lying on the ground: a big green oval with bumps. */
export const jackfruit = () => [
  oval(0, -11, 17, 11, "#8fae3c"),
  ...[[-9, -14], [-2, -17], [6, -15], [-6, -8], [2, -9], [10, -8], [-12, -9], [12, -13]].map(([x, y]) => flat(circle(x, y, 1.1, "#5f7d22"))),
  rect(15, -15, 6, 3, WOOD_DARK, { rx: 1 }),
];

export const watermelon = () => [
  oval(0, -10, 15, 10, "#3f8a36"),
  line("M-11 -16 Q-6 -10 -11 -3", "#2a5e24", 1.6), line("M-3 -19.5 Q2 -10 -3 -0.6", "#2a5e24", 1.6), line("M6 -19 Q11 -10 6 -1", "#2a5e24", 1.6),
];

// ——— the tea stall ———

/** A corrugated tin roof sloping down to the front, 210 wide. */
export const tinRoof = (look: Look) => {
  const out: Shape[] = [path("M-105 0 L105 0 L98 -26 L-98 -26 Z", look.color!)];
  for (let x = -92; x <= 92; x += 12) out.push(line(d`M${x} -25 L${x * 1.06} -1`, INK, 0.6));
  out.push(rect(-108, -2, 216, 5, "#6d6d6d", { rx: 1 }));
  return out;
};

export const kettle = (look: Look) => [
  path("M-11 0 L11 0 C13 -6 12 -13 7 -16 L-7 -16 C-12 -13 -13 -6 -11 0 Z", look.color!),
  path("M10 -9 L19 -17 L20.5 -15 L12 -4 Z", look.color!),
  path("M-9 -16 C-9 -27 9 -27 9 -16", "none", { sw: 1.6 }),
  rect(-6, -19, 12, 3, look.color!, { rx: 1.2 }), circle(0, -20.5, 1.8, INK),
  flat(path("M-7 -4 L-5 -13 L-3 -13 L-5 -4 Z", "#ffffff", { op: 0.35 })),
];

export const steam = () => [line("M-2 0 Q-6 -5 -2 -10 Q2 -15 -2 -20", "#ffffff", 1.6), line("M4 -3 Q0 -8 4 -13 Q8 -18 4 -22", "#ffffff", 1.3)];

/** A clay stove (চুলা) with a little fire showing. */
export const stove = () => [
  path("M-15 0 L15 0 L13 -16 L-13 -16 Z", "#b5683a"), path("M-5 0 L-5 -7 Q0 -12 5 -7 L5 0 Z", "#3d2216"),
  flat(path("M-3 0 Q-4 -5 0 -9 Q4 -5 3 0 Z", "#ff9a2e")),
];

/** A round glass jar with a coloured lid and biscuits inside; the top biscuit goes first. */
const JAR_SLOTS = [[-5, -5], [5, -5], [0, -6.4], [-5, -12], [5, -12], [0, -13.5], [-4, -19], [4, -19.5]] as const;
export const jar = (biscuit: string) => (look: Look) => [
  rect(-11, -26, 22, 26, "#e6f4f6", { rx: 5, op: 0.95 }),
  ...JAR_SLOTS.slice(0, look.count).map(([x, y]) => circle(x, y, 4, biscuit, { sw: 0.7 })),
  rect(-11, -26, 22, 26, "none", { rx: 5 }),
  rect(-8.5, -31, 17, 6, look.color!, { rx: 1.5 }),
  flat(rect(-8, -23, 2.4, 18, "#ffffff", { op: 0.6, rx: 1.2 })),
];

/** Glasses of tea on a tray; the right-most glass goes first. */
export const teaTray = (look: Look) => [
  rect(-28, -3, 56, 3, "#b9b9b9", { rx: 1.5 }),
  ...Array.from({ length: look.count! }, (_, index) => {
    const x = -20 + index * 10;
    return [path(d`M${x - 3.8} -15 L${x + 3.8} -15 L${x + 3} -3 L${x - 3} -3 Z`, "#f6fbfb"), flat(path(d`M${x - 3.2} -11 L${x + 3.2} -11 L${x + 2.9} -3.6 L${x - 2.9} -3.6 Z`, look.color!))];
  }).flat(),
];

export const bench = (look: Look) => [
  rect(-46, -14, 92, 5, look.color!, { rx: 1.5 }),
  rect(-40, -9, 4, 9, look.color!), rect(36, -9, 4, 9, look.color!),
  line("M-38 -5 L-30 -9", INK, 0.8), line("M38 -5 L30 -9", INK, 0.8),
];

/** A small radio with an antenna leaning to one side. */
export const radio = (look: Look) => [
  line("M6 -16 L16 -30", INK, 1.2), circle(16, -30, 1.2, INK),
  rect(-14, -16, 28, 16, look.color!, { rx: 3 }),
  circle(-6, -8, 5, "#3b3b3b"), circle(-6, -8, 2, "#777777"),
  rect(3, -12, 8, 3, "#f2e6c9", { rx: 1, sw: 0.7 }), circle(7, -5, 1.8, "#f2e6c9", { sw: 0.7 }),
];

/** A wall clock; its hands are what a flip changes. */
export const clock = (look: Look) => [
  circle(0, 0, 11, look.color!), circle(0, 0, 8.6, WHITE, { sw: 0.8 }),
  ...[0, 1, 2, 3].map(index => flat(circle([0, 6.6, 0, -6.6][index], [-6.6, 0, 6.6, 0][index], 0.9, INK))),
  line("M0 0 L4.6 -2.6", INK, 1.5), line("M0 0 L-1.6 -6.4", INK, 1.1), flat(circle(0, 0, 1.1, "#c0392b")),
];

/** A crow sitting, facing right. */
export const crow = (look: Look) => [
  path("M-10 -4 L-15 -2 L-9 -9 Z", "#2b2b2b"),
  path("M-10 -6 C-9 -13 3 -15 7 -10 C9 -6 4 -1 -3 -1 C-7 -1 -10 -3 -10 -6 Z", look.color ?? "#2b2b2b"),
  circle(6.5, -13, 4.6, look.color ?? "#2b2b2b"), path("M10.5 -14 L16 -12.2 L10.4 -11 Z", "#6b6b6b"),
  flat(circle(7.8, -13.8, 0.9, "#ffffff")), line("M-1 -1 L-1 1.5", INK, 0.9), line("M2 -1 L2.5 1.5", INK, 0.9),
];

/** A string of little snack packets hanging from the roof; the bottom packet goes first. */
const PACKET_COLORS = ["#e74c3c", "#f1c40f", "#27ae60", "#2e86de", "#e67e22", "#8e44ad"];
export const packets = (look: Look) => [
  line(d`M0 0 L0 ${8 + look.count! * 10}`, INK, 0.9),
  ...Array.from({ length: look.count! }, (_, index) => [
    path(d`M-5 ${6 + index * 10} L5 ${6 + index * 10} L5.6 ${14 + index * 10} L-5.6 ${14 + index * 10} Z`, look.color && index === look.count! - 1 ? look.color : PACKET_COLORS[index % PACKET_COLORS.length], { sw: 0.8 }),
    flat(rect(-2.6, 8.4 + index * 10, 5.2, 2.6, "#ffffff", { op: 0.75, rx: 1 })),
  ]).flat(),
];

export const calendar = (look: Look) => [
  line("M0 0 L0 -3", INK, 0.8), rect(-9, 0, 18, 22, WHITE),
  rect(-9, 0, 18, 7, look.color!), ...[0, 1, 2].flatMap(row => [0, 1, 2, 3].map(col => flat(rect(-7 + col * 4, 9.5 + row * 4, 2.6, 2.4, "#9a9a9a")))),
];

// ——— the vegetable market ———

/** A big market umbrella: six panels, two colours, on a bamboo pole. */
export const umbrella = (look: Look) => {
  const out: Shape[] = [rect(-1.6, -58, 3.2, 58, "#a37b44")];
  const xs = [-66, -44, -22, 0, 22, 44, 66];
  for (let index = 0; index < 6; index++) {
    const a = xs[index], b = xs[index + 1], fill = index % 2 ? "#f7efe0" : look.color!;
    out.push(path(d`M0 -86 L${a} -58 Q${(a + b) / 2} -52 ${b} -58 Z`, fill));
  }
  out.push(circle(0, -87, 2.4, "#a37b44"));
  return out;
};

/** A jute mat (চট) on the ground. */
export const mat = (w: number, h: number) => () => [
  path(d`M${-w / 2} 0 L${w / 2} 0 L${w / 2 - 6} ${-h} L${-w / 2 + 6} ${-h} Z`, "#c9a46a"),
  ...[0.3, 0.6].map(at => line(d`M${-w / 2 + 3 + at * 3} ${-h * at} L${w / 2 - 3 - at * 3} ${-h * at}`, "#a3804a", 0.7)),
];

/** A heap of round vegetables (tomatoes, onions, potatoes): bottom row first, the top one last. */
const HEAP_SLOTS = [[-14, -5], [-5, -5.5], [4, -5.5], [13, -5], [-9.5, -12], [-0.5, -12.8], [8.5, -12], [-5, -19], [4, -19.5], [-0.5, -26]] as const;
export type Veg = "tomato" | "onion" | "potato";
export const heap = (veg: Veg) => (look: Look) => HEAP_SLOTS.slice(0, look.count).flatMap(([x, y]) => {
  if (veg === "tomato") return [circle(x, y, 5, look.color!), flat(path(d`M${x - 2.5} ${y - 4.4} L${x} ${y - 3} L${x + 2.5} ${y - 4.4} L${x} ${y - 5.8} Z`, LEAF_DARK))];
  if (veg === "onion") return [path(d`M${x} ${y - 6.5} C${x + 1} ${y - 4} ${x + 5.5} ${y - 3} ${x + 5} ${y + 1} C${x + 4.5} ${y + 5} ${x - 4.5} ${y + 5} ${x - 5} ${y + 1} C${x - 5.5} ${y - 3} ${x - 1} ${y - 4} ${x} ${y - 6.5} Z`, look.color!)];
  return [oval(x, y, 5.6, 4.4, look.color!), flat(circle(x - 1.5, y - 1, 0.6, "#6b4a2a")), flat(circle(x + 2, y + 1, 0.6, "#6b4a2a"))];
});

/** Eggplants lying in a pile; the top one goes first. */
const EGG_AT = [[-12, -4], [0, -4.5], [12, -4], [-6, -11], [6, -11.5], [0, -18]] as const;
export const eggplants = (look: Look) => EGG_AT.slice(0, look.count).flatMap(([x, y]) => [
  path(d`M${x - 9} ${y} C${x - 9} ${y - 4.5} ${x - 2} ${y - 4.5} ${x + 3} ${y - 3} C${x + 7} ${y - 2} ${x + 7} ${y + 3} ${x + 3} ${y + 3.4} C${x - 2} ${y + 4} ${x - 9} ${y + 4} ${x - 9} ${y} Z`, look.color!),
  path(d`M${x + 3} ${y - 3.2} L${x + 7} ${y - 4.5} L${x + 9.5} ${y - 2} L${x + 7} ${y + 0.6} L${x + 3.4} ${y + 2.6} Z`, LEAF_DARK, { sw: 0.7 }),
]);

export const pumpkin = (look: Look) => [
  oval(0, -13, 20, 13, look.color!),
  line("M-9 -24 Q-14 -13 -9 -1.4", INK, 0.8), line("M0 -26 Q-3 -13 0 0", INK, 0.8), line("M9 -24 Q14 -13 9 -1.4", INK, 0.8),
  path("M-1.5 -26 L1.5 -26 L3 -31 L0.5 -31.5 Z", "#6b5a2a"),
];

/** A pile of chillies. */
export const chillies = (look: Look) => [[-12, -4], [-4, -3], [5, -4], [12, -3], [-8, -9], [1, -9.5], [9, -8.5], [-2, -14]].flatMap(([x, y], index) => {
  const s = index % 2 ? 1 : -1;
  return [path(d`M${x - 6 * s} ${y - 1.5} Q${x} ${y - 2.6} ${x + 6 * s} ${y + 1.6} Q${x} ${y + 1} ${x - 6 * s} ${y + 0.6} Z`, look.color!, { sw: 0.7 }), line(d`M${x - 6 * s} ${y - 0.5} L${x - 8 * s} ${y - 2}`, LEAF_DARK, 1)];
});

/** A long bottle gourd (লাউ) lying on its side, neck to the right. */
export const gourd = (look: Look) => [
  path("M-22 -8 C-22 -16 -10 -18 -4 -14 C2 -11 8 -12 14 -14 C20 -15.5 23 -11 21 -7 C19 -3 12 -4 6 -2 C-2 0.5 -22 2 -22 -8 Z", look.color!),
  path("M21 -12 L26 -15 L26.6 -13 L22 -9.5 Z", "#6b5a2a", { sw: 0.7 }),
  flat(path("M-16 -12 Q-10 -15 -4 -12.6 Q-10 -12.4 -16 -10 Z", "#ffffff", { op: 0.45 })),
];

export const cauliflower = () => [
  path("M-17 -4 Q-20 -14 -10 -16 L-6 -5 Z", LEAF), path("M17 -4 Q20 -14 10 -16 L6 -5 Z", LEAF),
  ...[[-7, -13, 5.5], [0, -16, 6.4], [7, -13, 5.5], [-3.5, -9, 5], [3.5, -9, 5]].map(([x, y, rr]) => circle(x, y, rr, "#f6f0dc", { sw: 0.8 })),
  path("M-14 0 L14 0 L9 -7 L-9 -7 Z", LEAF_DARK),
];

/** A small cardboard price card on a stick: "৳৪০". */
export const priceCard = (label: string) => (look: Look) => [line("M0 0 L0 -10", WOOD_DARK, 1.4), rect(-11, -24, 22, 14, look.color!, { rx: 1.5 }), text(0, -16.5, look.label ?? label, 9, 19, INK)];

/** A hurricane lantern (হারিকেন) hanging from a hook. */
export const lantern = (look: Look) => [
  line("M0 0 L0 6", INK, 1), path("M-6 10 Q0 3 6 10", "none"), rect(-6, 10, 12, 3, "#6d6d6d", { rx: 1 }),
  ...(look.color === "#ffd76a" ? [flat(circle(0, 20, 11, "#fff0b0", { op: 0.5 }))] : []),
  path("M-5 13 C-8 17 -8 23 -5 27 L5 27 C8 23 8 17 5 13 Z", look.color!, { op: 0.95 }), flat(path("M-1.2 26 Q0 19 1.2 26 Z", "#ff8c1a")),
  rect(-7, 27, 14, 4, "#8a2b1f", { rx: 1 }),
];

/** A string of little triangle flags; the colour change goes to one flag in the middle. */
const FLAG_COLORS = ["#e74c3c", "#f1c40f", "#27ae60", "#2e86de", "#e67e22"];
export const bunting = (w: number, sag: number) => (look: Look) => {
  const out: Shape[] = [line(d`M${-w / 2} 0 Q0 ${sag * 2} ${w / 2} 0`, INK, 0.8)];
  const count = Math.round(w / 15), middle = Math.floor(count / 2);
  for (let index = 0; index < count; index++) {
    const t = (index + 0.5) / count, x = -w / 2 + t * w, y = 2 * t * (1 - t) * sag * 2;
    out.push(path(d`M${x - 4.5} ${y} L${x + 4.5} ${y} L${x} ${y + 9} Z`, index === middle && look.color ? look.color : FLAG_COLORS[index % FLAG_COLORS.length], { sw: 0.6 }));
  }
  return out;
};

// ——— the village courtyard ———

/** A mud hut with a thatched roof; door and window are separate items. */
export const hut = (w = 96) => () => [
  rect(-w / 2, -44, w, 44, "#c98b55"), flat(rect(-w / 2, -10, w, 10, "#b07446")),
  path(d`M${-w / 2 - 14} -40 L${-w / 2 + 14} -76 L${w / 2 - 14} -76 L${w / 2 + 14} -40 Q0 -34 ${-w / 2 - 14} -40 Z`, "#d9b45c"),
  ...[-0.36, -0.12, 0.12, 0.36].map(at => line(d`M${at * w} -75 L${at * w * 1.3} -38.5`, "#a8823a", 0.8)),
  line(d`M${-w / 2 + 14} -76 L${w / 2 - 14} -76`, "#8a6a2a", 2),
];

export const door = (look: Look) => [rect(-11, -32, 22, 32, look.color!), line("M0 -32 L0 0", INK, 0.8), flat(circle(-3, -15, 1, INK)), flat(circle(3, -15, 1, INK))];
export const hutWindow = (look: Look) => [rect(-9, -10, 18, 14, "#3d2a1d"), ...[-4.5, 0, 4.5].map(x => line(d`M${x} -10 L${x} 4`, "#9a9a9a", 1)), rect(-13, -12, 4, 18, look.color!, { sw: 0.8 }), rect(9, -12, 4, 18, look.color!, { sw: 0.8 })];

const pins = (x: number, w: number) => [rect(x - w / 2 + 2, -2, 2, 5, WOOD, { sw: 0.5 }), rect(x + w / 2 - 4, -2, 2, 5, WOOD, { sw: 0.5 })];
/** Clothes on the line, each hanging from (0,0) on the rope. */
export const shirt = (look: Look) => [
  path("M-7 0 L7 0 L15 6 L12 11 L8 8.6 L8 28 L-8 28 L-8 8.6 L-12 11 L-15 6 Z", look.color!),
  path("M-3.4 0 L0 4 L3.4 0 Z", WHITE, { sw: 0.7 }), ...[11, 16, 21].map(y => flat(circle(0, y, 0.8, WHITE))), ...pins(0, 16),
];
export const lungi = (look: Look) => [
  rect(-12, 0, 24, 34, look.color!),
  ...[8, 17, 26].map(y => line(d`M-12 ${y} L12 ${y}`, "#ffffff", 1)), ...[-6, 0, 6].map(x => line(d`M${x} 0 L${x} 34`, "#ffffff", 0.7)), ...pins(0, 24),
];
export const gamchha = (look: Look) => [
  rect(-9, 0, 18, 24, look.color!),
  ...[4, 8, 12, 16, 20].map(y => line(d`M-9 ${y} L9 ${y}`, "#ffffff", 0.7)), ...[-4.5, 0, 4.5].map(x => line(d`M${x} 0 L${x} 24`, "#ffffff", 0.7)),
  ...[-6, -2, 2, 6].map(x => line(d`M${x} 24 L${x} 27`, look.color!, 1)), ...pins(0, 18),
];
export const frock = (look: Look) => [
  path("M-5 0 L5 0 L8 7 L6 9 L13 26 L-13 26 L-6 9 L-8 7 Z", look.color!),
  line("M-11 21 L11 21", "#ffffff", 1.2), flat(circle(0, 5, 1, WHITE)), ...pins(0, 10),
];

/** A hen facing right, tail to the left. */
export const hen = (look: Look) => [
  path("M-10 -12 L-16 -21 L-12 -11 L-17 -15 L-11 -8 Z", look.color === "#f4efe2" ? "#d9cbb0" : "#3b2a20", { sw: 0.8 }),
  path("M-12 -10 C-12 -18 0 -19 5 -15 C9 -12 8 -4 2 -2 C-4 0 -12 -2 -12 -10 Z", look.color!),
  circle(6, -17, 4.6, look.color!), path("M4.6 -21.2 L6 -24.4 L7.4 -21.5 L9 -23.6 L9.4 -20 Z", "#d63c2f", { sw: 0.7 }),
  path("M10.4 -17.6 L14 -16.4 L10.4 -15.2 Z", "#f0a020", { sw: 0.6 }), path("M8 -14 Q9.5 -11 7.4 -11.4 Z", "#d63c2f", { sw: 0.6 }),
  flat(circle(7.4, -18, 0.8, INK)), path("M-6 -10 Q-1 -14 3 -9 Q-2 -6 -6 -10 Z", INK, { op: 0.18, stroke: undefined }),
  line("M-2 -2 L-3 3 M-3 3 L-5 3.5", "#e09020", 1), line("M2 -2.4 L2 3 M2 3 L0 3.5", "#e09020", 1),
];

/** A hand pump (চাপকল): handle sticks out to the left, spout to the right. */
export const tubeWell = (look: Look) => [
  rect(-14, -4, 28, 4, "#9a9a9a", { rx: 1 }),
  rect(-3.5, -38, 7, 34, look.color!), rect(-5.5, -44, 11, 7, look.color!, { rx: 2 }),
  path("M3.5 -30 L14 -30 L16 -25 L12.5 -25 L11.5 -27 L3.5 -27 Z", look.color!),
  path("M-4 -42 L-24 -52 L-25.6 -49.4 L-4.6 -39 Z", "#555555"),
];

/** A row of clay pots (কলসি); the right-most goes first. */
export const pots = (look: Look) => Array.from({ length: look.count! }, (_, index) => {
  const x = -15 + index * 13, c = look.color!;
  return [path(d`M${x - 3} -18 L${x + 3} -18 L${x + 3} -16 C${x + 8} -14 ${x + 8} -2 ${x + 4} 0 L${x - 4} 0 C${x - 8} -2 ${x - 8} -14 ${x - 3} -16 Z`, c), rect(x - 4, -20, 8, 2.6, c, { rx: 1.2, sw: 0.8 })];
}).flat();

export const haystack = () => [
  path("M-26 0 C-28 -20 -14 -36 0 -37 C14 -36 28 -20 26 0 Z", "#e2bd5c"),
  ...[-16, -6, 4, 14].map(x => line(d`M${x} -2 Q${x + 2} -16 ${x * 0.5} -30`, "#b8913a", 0.8)), line("M0 -37 L0 -46", WOOD_DARK, 2),
];

/** A banana tree, its big leaves leaning to the right. */
export const bananaTree = (look: Look) => [
  path("M-3 0 L3 0 L2.2 -40 L-2.2 -40 Z", "#9aae5a"),
  flat(path("M0 -40 Q16 -58 36 -50 Q18 -44 0 -40 Z", look.color ?? LEAF)), flat(path("M0 -40 Q-14 -60 -30 -56 Q-14 -46 0 -40 Z", LEAF_DARK)),
  flat(path("M0 -40 Q6 -66 20 -72 Q10 -54 0 -40 Z", LEAF_LIGHT)), flat(path("M0 -38 Q20 -38 30 -26 Q14 -32 0 -38 Z", LEAF_DARK)),
  line("M0 -40 Q16 -50 34 -50", LEAF_DARK, 0.7),
];

// ——— the paddy field ———

/** A tall palm (তালগাছ): a thin trunk and a round fan of stiff leaves. */
export const palm = () => {
  const leaf = (angle: number, length: number, fill: string) => {
    const a = (angle * Math.PI) / 180, tx = Math.cos(a) * length, ty = -72 + Math.sin(a) * length * 0.8;
    const nx = -Math.sin(a) * 3.4, ny = Math.cos(a) * 3.4;
    return flat(path(d`M0 -72 Q${tx / 2 + nx} ${(ty - 72) / 2 + ny} ${tx} ${ty} Q${tx / 2 - nx} ${(ty - 72) / 2 - ny} 0 -72 Z`, fill));
  };
  return [
    path("M-2.6 0 L2.6 0 L2 -70 L-2 -70 Z", "#8a6a44"), ...[-58, -44, -30, -16].map(y => line(d`M-2.4 ${y} L2.4 ${y + 1.5}`, "#6a4a2a", 0.7)),
    ...[-195, -175, -155, -135, -115, -95, -75, -55, -35, -15, 5].map(angle => leaf(angle, 24, LEAF_DARK)),
    ...[-165, -140, -115, -90, -65, -40, -15].map(angle => leaf(angle, 17, LEAF)),
    flat(circle(0, -72, 3, "#6b5a2a")),
  ];
};

/** A scarecrow (কাকতাড়ুয়া): a clay pot head, a stick frame, one arm up. */
export const scarecrow = (look: Look) => [
  rect(-1.6, -44, 3.2, 44, WOOD_DARK),
  line("M-20 -38 L0 -33 L18 -48", WOOD_DARK, 2.4),
  path("M-9 -38 L9 -38 L11 -16 L-11 -16 Z", look.color!), path("M-9 -38 L-20 -40 L-20 -34 L-9 -32 Z", look.color!), path("M9 -38 L18 -50 L22 -46 L10 -32 Z", look.color!),
  circle(0, -47, 7.4, "#2e2e2e"), flat(circle(-2.6, -48, 1.4, WHITE)), flat(circle(2.6, -48, 1.4, WHITE)), line("M-2.6 -44 Q0 -42.2 2.6 -44", WHITE, 1),
  path("M-9 -53 L9 -53 L6 -57 L-6 -57 Z", "#d9b45c"),
];

/** A cow standing, head to the right. */
export const cow = (look: Look) => [
  ...[-15, -9, 9, 15].map(x => rect(x - 1.8, -12, 3.6, 12, look.color!, { sw: 0.8 })),
  path("M-20 -24 C-20 -30 14 -30 17 -24 L17 -12 C14 -9 -18 -9 -20 -13 Z", look.color!),
  path("M-20 -22 Q-26 -18 -24 -9", "none", { sw: 1 }),
  path("M15 -27 L23 -30 C28 -29 30 -24 28 -20 L22 -18 L15 -20 Z", look.color!),
  path("M19 -30 L17 -35 L21 -31 Z", "#e8dcc0", { sw: 0.7 }), path("M24 -30 L26 -35 L26.6 -30 Z", "#e8dcc0", { sw: 0.7 }),
  flat(circle(23.4, -26, 0.9, INK)), oval(27, -21.4, 2.4, 1.8, "#e3a99a", { sw: 0.6 }),
  ...(look.color === "#f2ece0" ? [flat(oval(-6, -22, 6, 4, "#5a4636")), flat(oval(8, -17, 4, 3, "#5a4636"))] : []),
];

/** A white egret (বক) standing, beak to the right. */
export const egret = () => [
  line("M-1 0 L0 -12 M2.6 0 L1.6 -12", "#3b3b3b", 0.9),
  path("M-9 -16 C-6 -22 4 -22 5 -16 C5 -12 -2 -10 -9 -16 Z", WHITE), path("M3 -18 C5 -24 2 -26 4 -30 L6 -29 C5 -26 8 -23 5 -16 Z", WHITE, { sw: 0.8 }),
  circle(5.4, -30.6, 2.6, WHITE, { sw: 0.8 }), path("M7.6 -31.4 L14 -30.2 L7.6 -29.4 Z", "#f0b020", { sw: 0.6 }),
];

/** A kite (ঘুড়ি) on its string, the tail curling to the right. */
export const kite = (look: Look) => [
  line("M0 12 Q-20 34 -40 60", "#6b6b6b", 0.6),
  path("M0 -14 L11 0 L0 12 L-11 0 Z", look.color!), line("M0 -14 L0 12 M-11 0 L11 0", INK, 0.6),
  line("M0 12 Q6 18 2 23 Q-2 28 6 32", "#c0392b", 1.2), path("M4 30 L9 31 L6 35 Z", "#c0392b", { sw: 0.5 }),
];

export const smallHut = () => [rect(-10, -12, 20, 12, "#c98b55", { sw: 0.8 }), path("M-14 -11 L-6 -21 L6 -21 L14 -11 Z", "#d9b45c", { sw: 0.8 })];

// ——— the river ghat ———

/** A country boat with a ছই (curved roof) and a patched sail on the left. */
export const boat = (look: Look) => [
  line("M-6 -16 L-6 -66", WOOD_DARK, 2),
  path("M-8 -64 L-36 -22 L-8 -20 Z", look.color!), line("M-8 -50 L-22 -42 M-8 -36 L-28 -32", INK, 0.6),
  path("M2 -16 C4 -32 26 -32 28 -16 Z", "#c99a52"), ...[8, 15, 22].map(x => line(d`M${x} -16 L${x} -28`, "#8a6a2a", 0.7)),
  path("M-48 -20 Q-44 -14 -40 -12 L40 -12 Q44 -14 48 -22 Q0 -14 -48 -20 Z", "#6b4226"),
  path("M-40 -12 Q0 0 40 -12 Z", "#4a2c18"), line("M-42 -15 Q0 -9 42 -16", "#d9a35b", 1.2),
];

export const smallBoat = () => [
  path("M-16 -5 Q0 -1 16 -6 Q12 -1 8 0 L-8 0 Q-12 -1 -16 -5 Z", "#5a3a22"),
  path("M-4 -5 C-3 -12 7 -12 8 -5 Z", "#c99a52", { sw: 0.8 }),
];

/** A few ducks swimming in a row, facing right; the last one goes first. */
export const ducks = (look: Look) => Array.from({ length: look.count! }, (_, index) => {
  const x = -18 + index * 15, y = index % 2 ? 2 : 0;
  return [
    path(d`M${x - 7} ${y - 3} C${x - 7} ${y - 8} ${x + 2} ${y - 8} ${x + 4} ${y - 5} L${x + 6} ${y - 4} C${x + 6} ${y} ${x - 3} ${y + 1} ${x - 7} ${y - 3} Z`, look.color!),
    circle(x + 4, y - 9, 3, look.color!), path(d`M${x + 6.6} ${y - 9.6} L${x + 10} ${y - 8.6} L${x + 6.6} ${y - 7.4} Z`, "#f08c1a", { sw: 0.5 }),
    flat(circle(x + 4.6, y - 9.8, 0.6, INK)),
  ];
}).flat();

export const fish = () => [
  path("M-8 0 C-4 -6 6 -6 9 0 C6 5 -4 5 -8 0 Z", "#b8c6cf"), path("M-8 0 L-14 -5 L-13 0 L-14 5 Z", "#b8c6cf"), flat(circle(5, -1, 0.9, INK)),
  ...[[-18, 8], [16, 9]].map(([x, y]) => line(d`M${x - 3} ${y} Q${x} ${y - 3} ${x + 3} ${y}`, "#ffffff", 1)),
];

/** Water lilies (শাপলা) floating with their pads; the last flower goes first. */
export const lilies = (look: Look) => [
  ...[[-14, 2], [8, 4], [22, -1], [-2, -2]].map(([x, y]) => flat(path(d`M${x - 7} ${y} C${x - 7} ${y - 4} ${x + 7} ${y - 4} ${x + 7} ${y} C${x + 7} ${y + 3} ${x - 7} ${y + 3} ${x - 7} ${y} Z`, LEAF))),
  ...[[-12, -2], [10, 0], [22, -5], [-1, -6]].slice(0, look.count).flatMap(([x, y]) => [
    path(d`M${x - 5} ${y} L${x - 3} ${y - 6} L${x - 1} ${y - 2} L${x} ${y - 8} L${x + 1} ${y - 2} L${x + 3} ${y - 6} L${x + 5} ${y} Z`, look.color!, { sw: 0.6 }),
    flat(circle(x, y - 1, 1.2, "#f2c12e")),
  ]),
];

/** A coconut palm leaning to the right. */
export const coconutTree = () => [
  path("M-3 0 L3 0 Q10 -30 20 -62 L16 -63 Q6 -30 -3 0 Z", "#8a6a44"),
  ...[[-10, -60], [0, -50], [36, -58], [40, -70], [26, -80], [6, -78]].map(([x, y]) => flat(path(d`M18 -64 Q${(x + 18) / 2} ${Math.min(y, -64) - 10} ${x} ${y} Q${(x + 18) / 2} ${Math.min(y, -64) - 4} 18 -64 Z`, LEAF_DARK))),
  ...[[16, -66], [21, -66], [18.6, -62]].map(([x, y]) => circle(x, y, 2.6, "#6b5a2a", { sw: 0.6 })),
];

/** One clay pot on the ground. */
export const kolshi = (look: Look) => [
  path("M-3.5 -21 L3.5 -21 L3.5 -18.5 C10 -16 10 -2 5 0 L-5 0 C-10 -2 -10 -16 -3.5 -18.5 Z", look.color!),
  rect(-5, -23.6, 10, 3, look.color!, { rx: 1.4, sw: 0.8 }), flat(path("M-5 -14 Q-6 -8 -4 -4 Q-3 -9 -3.4 -14 Z", "#ffffff", { op: 0.3 })),
];

export const steps = (w: number) => () => [0, 1, 2, 3].map(index => rect(-w / 2 + index * 6, -10 - index * 9, w - index * 12, 10, index % 2 ? "#b8573e" : "#c76a4d", { sw: 0.8 }));

/** The ghat's name on a post. */
export const postSign = (name: string) => (look: Look) => [rect(-1.6, -36, 3.2, 36, WOOD_DARK), rect(-30, -50, 60, 16, look.color!, { rx: 2 }), text(0, -42, look.label ?? name, 9.5, 54, "#ffffff")];

// ——— the rickshaw lane ———

/** A building front with rows of windows. */
export const building = (w: number, h: number, wall: string, rows: number, cols: number) => () => {
  const out: Shape[] = [rect(-w / 2, -h, w, h, wall), flat(rect(-w / 2, -h, w, 4, "#ffffff", { op: 0.3 }))];
  const gapX = w / cols, gapY = 26;
  for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
    const x = -w / 2 + gapX * col + gapX / 2 - 6, y = -h + 12 + row * gapY;
    out.push(rect(x, y, 12, 14, "#5d7a8c", { sw: 0.8 }), line(d`M${x + 6} ${y} L${x + 6} ${y + 14}`, "#ffffff", 0.6));
  }
  return out;
};

export const shutter = (look: Look) => [rect(-22, -30, 44, 30, look.color!), ...[-24, -18, -12, -6].map(y => line(d`M-22 ${y} L22 ${y}`, INK, 0.6)), rect(-24, -33, 48, 4, "#5a5a5a", { rx: 1 })];

/** A cycle rickshaw from the side, rider's seat on the right, painted hood on the left. */
export const rickshaw = (look: Look) => {
  const wheel = (x: number, rr: number) => [circle(x, -rr, rr, "none", { sw: 1.6 }), circle(x, -rr, rr - 2.6, "none", { stroke: "#9a9a9a", sw: 0.6 }),
    line(d`M${x - rr + 2} ${-rr} L${x + rr - 2} ${-rr} M${x} ${-2 * rr + 2} L${x} -2 M${x - (rr - 2) * 0.7} ${-rr - (rr - 2) * 0.7} L${x + (rr - 2) * 0.7} ${-rr + (rr - 2) * 0.7} M${x - (rr - 2) * 0.7} ${-rr + (rr - 2) * 0.7} L${x + (rr - 2) * 0.7} ${-rr - (rr - 2) * 0.7}`, "#9a9a9a", 0.6),
    circle(x, -rr, 1.6, INK)];
  return [
    ...wheel(-18, 13),
    line("M-18 -13 L18 -24 L34 -10 M18 -24 L22 -40 M30 -46 L36 -46 M34 -10 L33 -44", "#4a4a4a", 1.6),
    path("M-32 -30 L-4 -30 L-6 -20 L-30 -20 Z", "#2f6fb2"), path("M-29 -29 L-7 -29 L-8 -21 L-28 -21 Z", "#f3c623", { sw: 0.6 }),
    flat(circle(-18, -25, 2.6, "#e74c3c")), flat(circle(-12, -25, 1.6, "#27ae60")), flat(circle(-24, -25, 1.6, "#27ae60")),
    rect(-32, -38, 30, 8, "#c0392b", { rx: 2 }),
    path("M-34 -38 C-36 -62 -14 -70 2 -62 L-2 -38 Z", look.color!), ...[-26, -18, -10].map(x => line(d`M${x} -38 Q${x - 2} -54 ${x + 4} -66`, INK, 0.6)),
    flat(path("M-30 -44 L-6 -44 L-6 -41 L-30 -41 Z", "#ffffff", { op: 0.5 })),
    rect(19, -44, 9, 3, "#3b3b3b", { rx: 1.4 }),
    ...wheel(34, 10),
  ];
};

export const lampPost = (look: Look) => [
  rect(-1.6, -70, 3.2, 70, "#4a4a4a"), path("M0 -70 Q6 -76 14 -72", "none", { sw: 1.6 }),
  ...(look.color === "#ffe066" ? [flat(circle(15, -66, 9, "#fff3b0", { op: 0.5 }))] : []),
  path("M10 -72 L20 -72 L18 -66 L12 -66 Z", look.color!, { sw: 0.8 }),
];

/** A roof water tank. */
export const tank = (look: Look) => [rect(-11, -20, 22, 20, look.color!, { rx: 3 }), oval(0, -20, 11, 3, look.color!), line("M-11 -13 L11 -13 M-11 -6 L11 -6", INK, 0.6)];

/** A dish antenna tilted to the right. */
export const dish = () => [line("M0 0 L0 -6", INK, 1.2), path("M-8 -6 Q-10 -20 6 -22 Q2 -12 -8 -6 Z", "#e6e6e6"), line("M-2 -12 L6 -18", INK, 0.8), circle(6.4, -18.4, 1.2, INK)];

/** Flower pots on a balcony rail; the right-most goes first. */
export const balconyPots = (look: Look) => [
  rect(-24, -2, 48, 3, "#7a7a7a", { rx: 1 }),
  ...Array.from({ length: look.count! }, (_, index) => {
    const x = -16 + index * 11;
    return [flat(circle(x, -12, 5, LEAF)), flat(circle(x + 2, -14, 2, look.color ?? "#e74c3c")), path(d`M${x - 4} -8 L${x + 4} -8 L${x + 3} -2 L${x - 3} -2 Z`, "#c76a4d", { sw: 0.7 })];
  }).flat(),
];

export const acBox = () => [rect(-11, -12, 22, 12, "#e9e9e9", { rx: 1.5 }), ...[-8, -5, -2, 1, 4, 7].map(x => line(d`M${x} -10 L${x} -2`, "#9a9a9a", 0.6))];

export const pole = (h: number) => () => [rect(-2.4, -h, 4.8, h, "#8a8a8a"), rect(-12, -h + 6, 24, 3, "#6a6a6a"), ...[-10, 10].map(x => circle(x, -h + 5, 1.6, "#e8e8e8", { sw: 0.6 }))];
export const wires = (w: number, sag: number) => () => [line(d`M0 0 Q${w / 2} ${sag} ${w} 0`, "#3b3b3b", 0.9), line(d`M0 5 Q${w / 2} ${sag + 6} ${w} 5`, "#3b3b3b", 0.9)];

export const road = (w: number, y: number, h: number) => () => [
  flat(rect(0, y, w, h, "#7d7a74")), flat(rect(0, y, w, 4, "#a8a49c")),
  ...[0, 1, 2, 3, 4, 5].map(index => flat(rect(20 + index * 62, y + h / 2, 30, 2.6, "#e8e3d4"))),
];

/** A goat standing, head to the right, a little beard and two horns. */
export const goat = (look: Look) => [
  ...[-10, -6, 7, 11].map(x => rect(x - 1.4, -9, 2.8, 9, look.color!, { sw: 0.7 })),
  path("M-15 -17 C-15 -22 10 -22 12 -17 L12 -9 C9 -7 -13 -7 -15 -10 Z", look.color!),
  path("M-15 -16 L-19 -19 L-16 -14 Z", look.color!, { sw: 0.7 }),
  path("M10 -19 L15 -25 C19 -25 21 -21 20 -18 L16 -15 L11 -14 Z", look.color!),
  path("M15 -25 Q14 -30 10 -31 Q14 -28 13.4 -24.6 Z", "#8a7a6a", { sw: 0.6 }), path("M14 -22 L10 -21 L13 -19.6 Z", look.color!, { sw: 0.6 }),
  path("M18.6 -16.6 L18 -12 L16.8 -15.6 Z", "#d9d0c0", { sw: 0.5 }), flat(circle(16.6, -21.6, 0.8, INK)),
];

/** A cane stool (মোড়া): wide at top and bottom, pinched in the middle. */
export const mora = (look: Look) => [
  path("M-10 0 L10 0 L4 -9 L10 -18 L-10 -18 L-4 -9 Z", look.color!),
  line("M-7 -3 L7 -3 M-5 -6 L5 -6 M-5 -12 L5 -12 M-7 -15 L7 -15", INK, 0.6),
  oval(0, -18, 10, 2.6, look.color!, { sw: 0.9 }),
];

/** A painted strip along the stall's front: little flowers in a row. */
export const flowerStrip = (w: number) => () => Array.from({ length: Math.floor(w / 16) }, (_, index) => {
  const x = -w / 2 + 8 + index * 16, colors = ["#e74c3c", "#f1c40f", "#2e86de", "#27ae60"];
  return [flat(circle(x - 3, 0, 2.2, colors[index % 4])), flat(circle(x + 3, 0, 2.2, colors[index % 4])), flat(circle(x, -3, 2.2, colors[index % 4])), flat(circle(x, 3, 2.2, colors[index % 4])), flat(circle(x, 0, 1.6, "#fff3b0"))];
}).flat();
