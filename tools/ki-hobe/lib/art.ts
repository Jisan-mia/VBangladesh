// Our own picture set, as SVG path data in a 64×64 box: the same parts draw the choice buttons (SVG) and the parent card (canvas Path2D).
export type Part = { d: string; fill?: string; stroke?: string; w?: number; alpha?: number };

const circle = (cx: number, cy: number, r: number) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
const oval = (cx: number, cy: number, rx: number, ry: number) => `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`;
const box = (x: number, y: number, w: number, h: number, r = 0) =>
  `M${x + r} ${y}h${w - 2 * r}${r ? `a${r} ${r} 0 0 1 ${r} ${r}` : ""}v${h - 2 * r}${r ? `a${r} ${r} 0 0 1 ${-r} ${r}` : ""}h${-(w - 2 * r)}${r ? `a${r} ${r} 0 0 1 ${-r} ${-r}` : ""}v${-(h - 2 * r)}${r ? `a${r} ${r} 0 0 1 ${r} ${-r}` : ""}Z`;
const rays = (cx: number, cy: number, inner: number, outer: number) => Array.from({ length: 8 }, (_, i) => {
  const a = (i * Math.PI) / 4, f = (n: number) => n.toFixed(1);
  return `M${f(cx + Math.cos(a) * inner)} ${f(cy + Math.sin(a) * inner)}L${f(cx + Math.cos(a) * outer)} ${f(cy + Math.sin(a) * outer)}`;
}).join("");

const INK = "#33415c", SUN = "#f6b93b", WATER = "#3a8fd0", SOIL = "#6b3f22", POT = "#c0643a", LEAF = "#3f8f4a";
const drop = (x: number, y: number) => ({ d: `M${x} ${y}c-3 5-5 8-5 10a5 5 0 0 0 10 0c0-2-2-5-5-10Z`, fill: WATER });
const pot: Part[] = [{ d: "M16 40H48L43 60H21Z", fill: POT }, { d: box(14, 36, 36, 6, 2), fill: SOIL }];
const cup = (x: number): Part => ({ d: `M${x} 24H${x + 22}L${x + 19} 50H${x + 3}Z`, fill: "#ffffff", stroke: INK, w: 2.5 });

export const PICS = {
  coconut: [{ d: circle(32, 34, 22), fill: "#7a4a22" }, { d: circle(25, 22, 3) + circle(33, 19, 3) + circle(29, 28, 3), fill: "#3b2410" }, { d: "M14 40c2 6 6 10 12 12", stroke: "#a87444", w: 3 }],
  brick: [{ d: box(6, 20, 52, 26, 3), fill: "#b5452b" }, { d: "M6 33H58M24 20V33M42 33V46", stroke: "#e8c3a8", w: 2.5 }],
  leaf: [{ d: "M8 50C10 22 34 8 56 10C54 36 38 54 8 50Z", fill: "#c98a2b" }, { d: "M8 50L46 22M22 40L20 30M30 34L40 36", stroke: "#8a5a14", w: 2.5 }],
  spoon: [{ d: "M27 30L58 52L54 57L23 35Z", fill: "#aeb8c2" }, { d: oval(20, 24, 12, 15), fill: "#c5ced6", stroke: "#7b8794", w: 2 }],
  bottle: [{ d: "M26 12h12v6l6 8v30a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4V26l6-8Z", fill: "#cdeaf7", stroke: "#4a90b8", w: 2 }, { d: box(25, 5, 14, 8, 2), fill: "#2b6cb0" }, { d: box(20, 34, 24, 12), fill: "#ffffff" }],
  raft: [{ d: box(6, 20, 52, 9, 4.5) + box(6, 30, 52, 9, 4.5) + box(6, 40, 52, 9, 4.5), fill: "#a9bf55", stroke: "#5f7a22", w: 2 }, { d: "M16 18V51M48 18V51", stroke: "#7a4a22", w: 3 }],
  sun: [{ d: rays(32, 32, 17, 26), stroke: SUN, w: 4 }, { d: circle(32, 32, 13), fill: SUN }],
  shade: [{ d: oval(32, 58, 26, 4), fill: "#2f5d36" }, { d: box(28, 32, 8, 26, 2), fill: "#7a4a22" }, { d: circle(32, 24, 20), fill: LEAF }],
  stone: [{ d: "M10 44C8 30 20 18 34 20C48 20 58 32 54 44C50 54 16 56 10 44Z", fill: "#8a8f98", stroke: "#5d636b", w: 2 }],
  feather: [{ d: "M16 52C18 30 34 12 54 8C52 30 38 48 16 52Z", fill: "#f4f1ea", stroke: "#8a96a3", w: 2 }, { d: "M8 60L44 20", stroke: "#8a96a3", w: 2.5 }],
  hammer: [{ d: box(28, 22, 8, 38, 3), fill: "#b07a3e" }, { d: box(12, 8, 40, 16, 3), fill: "#6b7480" }],
  noon: [{ d: box(2, 54, 60, 8, 2), fill: "#d9c48f" }, { d: circle(32, 12, 8), fill: SUN }, { d: oval(32, 55, 7, 2.5), fill: "#4a4a4a" }, { d: box(30, 28, 4, 27), fill: "#7a4a22" }],
  evening: [{ d: box(2, 54, 60, 8, 2), fill: "#d9c48f" }, { d: circle(9, 40, 7), fill: "#f08a3c" }, { d: box(26, 53, 36, 3), fill: "#4a4a4a" }, { d: box(24, 28, 4, 27), fill: "#7a4a22" }],
  potLight: [{ d: circle(52, 12, 7), fill: SUN }, drop(14, 6), ...pot],
  potDry: [{ d: circle(52, 12, 7), fill: SUN }, ...pot, { d: "M20 39l5 2 4-2 5 2 5-2 5 2", stroke: "#3b2410", w: 1.5 }],
  potDark: [{ d: box(2, 2, 60, 60, 8), fill: "#2d3047" }, drop(14, 6), ...pot],
  paint: [{ d: "M16 22H48L43 58H21Z", fill: "#9aa3ad" }, { d: oval(32, 22, 16, 5), fill: "#2b6cb0" }, { d: "M20 22c0 8 3 8 3 14", stroke: "#2b6cb0", w: 4 }],
  sea: [{ d: box(0, 30, 64, 34, 4), fill: "#2b7bb9" }, { d: "M4 40c6-5 10 5 16 0s10 5 16 0 10 5 16 0 8 4 10 2M4 52c6-5 10 5 16 0s10 5 16 0 10 5 16 0", stroke: "#e6f2fb", w: 2.5 }],
  light: [{ d: "M18 18L46 44", stroke: "#ffe08a", w: 5 }, { d: circle(16, 16, 11), fill: SUN }, { d: "M40 40L32 54M46 44L60 40M44 38L46 24", stroke: "#3b82d6", w: 3 }, { d: circle(44, 42, 4), fill: "#3b82d6" }],
  river: [{ d: circle(52, 12, 7), fill: SUN }, { d: box(0, 48, 64, 16, 3), fill: WATER }, { d: "M20 44c-4-6 4-10 0-18M32 44c-4-6 4-10 0-18M44 44c-4-6 4-10 0-18", stroke: "#8ab9e0", w: 3 }],
  tank: [{ d: "M8 58a8 8 0 0 1 8-10a10 10 0 0 1 18-4a9 9 0 0 1 16 6a6 6 0 0 1 4 8Z", fill: "#e3eaf2", stroke: "#a7b4c2", w: 1.5 }, { d: box(18, 12, 28, 30, 6), fill: "#2d3047" }, { d: oval(32, 12, 14, 4), fill: "#4b5078" }],
  earthShadow: [{ d: "M22 22L62 26V38L22 42Z", fill: "#1f2235", alpha: 0.85 }, { d: circle(20, 32, 12), fill: WATER }, { d: "M14 26c4 0 6 4 4 8s2 6 6 4", stroke: LEAF, w: 3 }, { d: circle(52, 32, 7), fill: "#7d7d86" }],
  orbit: [{ d: circle(32, 32, 22), stroke: "#9aa3ad", w: 1.5 }, { d: circle(32, 32, 8), fill: WATER }, { d: circle(54, 32, 7), fill: "#59596a" }, { d: "M54 25A7 7 0 0 0 54 39Z", fill: "#f4e9b8" }, { d: "M2 20H10M2 32H10M2 44H10", stroke: SUN, w: 3 }],
  moonShrink: [{ d: circle(20, 34, 15), fill: "#f4e9b8", stroke: "#c9b56a", w: 1.5 }, { d: circle(52, 34, 6), fill: "#f4e9b8", stroke: "#c9b56a", w: 1.5 }, { d: "M38 34H44M41 31L44 34L41 37", stroke: INK, w: 2 }],
  clip: [{ d: "M24 54V16a8 8 0 0 1 16 0v32a5 5 0 0 1-10 0V20", stroke: "#6b7480", w: 3.5 }],
  pencil: [{ d: "M12 48L44 16L52 24L20 56Z", fill: "#f2c14e" }, { d: "M12 48L20 56L6 60Z", fill: "#e8c39e" }, { d: "M44 16L52 24L57 19L49 11Z", fill: "#e57373" }],
  plasticSpoon: [{ d: "M27 30L58 52L54 57L23 35Z", fill: "#f08a5d" }, { d: oval(20, 24, 12, 15), fill: "#f6a57f", stroke: "#c8623a", w: 2 }],
  ear: [cup(6), { d: "M36 28a10 10 0 0 1 0 16M44 22a18 18 0 0 1 0 28M52 16a26 26 0 0 1 0 40", stroke: "#2b6cb0", w: 3 }],
  quiet: [cup(6), { d: "M36 37H58", stroke: "#9aa3ad", w: 3 }],
} satisfies Record<string, Part[]>;

export type Pic = keyof typeof PICS;
export const hasPic = (pic: string): pic is Pic => Object.hasOwn(PICS, pic);

/** Draws a picture on a canvas, centred at (x, y), `size` px wide. */
export function drawPic(c: CanvasRenderingContext2D, pic: Pic, x: number, y: number, size: number) {
  c.save();
  c.translate(x - size / 2, y - size / 2);
  c.scale(size / 64, size / 64);
  c.lineCap = "round"; c.lineJoin = "round";
  for (const part of PICS[pic] as Part[]) {
    const path = new Path2D(part.d);
    c.globalAlpha = part.alpha ?? 1;
    if (part.fill) { c.fillStyle = part.fill; c.fill(path); }
    if (part.stroke) { c.strokeStyle = part.stroke; c.lineWidth = part.w ?? 2; c.stroke(path); }
  }
  c.restore();
}

/**
 * The lit part of the Moon as seen from Earth, `t` of the way through the month (0 new, 0.25 half, 0.5 full), lit on the right as in
 * Bangladesh's evening sky while it grows. Centre (0, 0), radius r. The terminator is a half-ellipse with x-radius r·|cos 2πt|.
 */
export function moonPath(t: number, r: number) {
  const phase = ((t % 1) + 1) % 1, waxing = phase <= 0.5, f = waxing ? phase : 1 - phase;
  const rx = Math.abs(Math.cos(2 * Math.PI * f)) * r, gibbous = f > 0.25 ? 1 : 0;
  // From the top, round the lit edge to the bottom (clockwise = via the right), back up along the terminator,
  // which bulges into the dark half once more than half is lit.
  return `M0 ${-r}A${r} ${r} 0 0 ${waxing ? 1 : 0} 0 ${r}A${rx.toFixed(2)} ${r} 0 0 ${waxing ? gibbous : 1 - gibbous} 0 ${-r}Z`;
}
