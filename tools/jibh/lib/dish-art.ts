// Drawn dish chips: flat shapes in a 48×48 box, as SVG path data so the same drawing renders as an inline <svg> on
// the page and through Path2D on the share card. No photos.
export type Part = { d: string; fill?: string; stroke?: string; w?: number };

const ellipse = (cx: number, cy: number, rx: number, ry: number) => `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`;
const circle = (cx: number, cy: number, r: number) => ellipse(cx, cy, r, r);
const dots = (points: Array<[number, number]>, r: number) => points.map(([x, y]) => circle(x, y, r)).join("");

const PLATE: Part[] = [
  { d: ellipse(24, 34, 21, 9), fill: "#fbf6ec", stroke: "#b9a888", w: 1.5 },
  { d: ellipse(24, 34, 14, 5.5), fill: "none", stroke: "#e4d8c2", w: 1 },
];
const bowl = (curry: string, chunk: string): Part[] => [
  { d: "M5 25h38c0 9-8.5 15-19 15S5 34 5 25Z", fill: "#b5653a", stroke: "#6e3418", w: 1.5 },
  { d: "M9 31c4 4 26 4 30 0", fill: "none", stroke: "#d9905e", w: 1.2 },
  { d: ellipse(24, 25, 19, 5.5), fill: curry, stroke: "#6e3418", w: 1.5 },
  { d: "M12 24.5c1-2.5 6-2.5 7 0c-1 1.6-6 1.6-7 0ZM21 22.5c1-2.5 6-2.5 7 0c-1 1.6-6 1.6-7 0ZM17 27c1-2.2 5.5-2.2 6.5 0c-1 1.4-5.5 1.4-6.5 0Z", fill: chunk },
];

export const dishArt = {
  bakarkhani: [...PLATE,
    { d: circle(19, 31, 10.5), fill: "#e2ae5a", stroke: "#a8722a", w: 1.5 },
    { d: "M13 28l5 5M17 25l7 7M13 33l3 3M22 26l4 4", fill: "none", stroke: "#b07a2c", w: 1.4 },
    { d: dots([[16, 30], [20, 28], [23, 33], [18, 35], [14, 27]], 0.6), fill: "#5a3a1a" },
    { d: "M32 16h11l-1.6 18h-7.8Z", fill: "#fff", stroke: "#8a8070", w: 1.2 },
    { d: "M32.6 20h9.8l-1.2 14h-7.4Z", fill: "#a8481a" },
  ],
  kalai: [...PLATE,
    { d: circle(21, 31, 13), fill: "#d6c08e", stroke: "#a38650", w: 1.5 },
    { d: dots([[15, 27], [20, 25], [26, 28], [17, 34], [24, 36], [28, 33], [13, 31]], 0.9), fill: "#9c7c48" },
    { d: ellipse(37, 33, 6, 4), fill: "#7d5636", stroke: "#4f3420", w: 1 },
    { d: "M30 22c4-4 9-4 12-1", fill: "none", stroke: "#c62f1f", w: 3 },
    { d: "M42 21l2-2", fill: "none", stroke: "#3f7a2a", w: 1.6 },
  ],
  ponir: [...PLATE,
    { d: ellipse(18, 32, 12, 7), fill: "#e8bd66", stroke: "#b08432", w: 1.5 },
    { d: "M10 32c2-4 13-5 16 0M13 33c2-2 8-3 10 0", fill: "none", stroke: "#c2913c", w: 1.2 },
    { d: "M29 23h11v10H29Z", fill: "#fbf9f0", stroke: "#a9a28a", w: 1.2 },
    { d: "M29 23l3-3h11l-3 3Z", fill: "#efebdc", stroke: "#a9a28a", w: 1.2 },
    { d: "M40 23l3-3v10l-3 3Z", fill: "#ddd6c0", stroke: "#a9a28a", w: 1.2 },
    { d: dots([[32, 27], [36, 29.5], [34, 31]], 0.9), fill: "#d8d0b8" },
  ],
  rosh: [
    { d: "M13 18h14l-1.5-3h-11Z", fill: "#8a4423", stroke: "#5c2a12", w: 1.2 },
    { d: circle(20, 30, 12), fill: "#a5532e", stroke: "#5c2a12", w: 1.5 },
    { d: "M10 27c5 3 15 3 20 0", fill: "none", stroke: "#c8774c", w: 1.2 },
    { d: ellipse(20, 15, 5.5, 1.8), fill: "#fff8e6", stroke: "#c9b48a", w: 0.8 },
    { d: "M30 35h14c0 4-3 6.5-7 6.5S30 39 30 35Z", fill: "#c99a5e", stroke: "#8a6232", w: 1.2 },
    { d: dots([[32.5, 33.5], [35.5, 32.5], [38.5, 33], [41.5, 33.6], [34, 34.8], [37.2, 34.6], [40, 34.8], [36.8, 31.4], [39.8, 31.8]], 1.3), fill: "#fff3d2" },
  ],
  ilish: [...PLATE,
    { d: ellipse(24, 33, 16, 6), fill: "#e0a527" },
    { d: "M9 31c6-6 18-6 24-1l6-4v10l-6-4c-6 5-18 5-24-1Z", fill: "#d5dbe2", stroke: "#6f7c8a", w: 1.3 },
    { d: "M12 29c6-3 14-3 20 0", fill: "none", stroke: "#a9b5c2", w: 1 },
    { d: circle(13.5, 30.5, 1.1), fill: "#2b2f36" },
    { d: "M33 38c3-1 6 0 8 2", fill: "none", stroke: "#3f7a2a", w: 2.2 },
  ],
  mezbani: [...bowl("#9e2a14", "#5a1c0e"),
    { d: ellipse(29, 23.5, 5, 1.2), fill: "#f0a03c" },
    { d: dots([[14, 22], [33, 26], [26, 27.5]], 0.9), fill: "#e8482a" },
  ],
  satkora: [...bowl("#8a4a1c", "#4f260c"),
    { d: "M28 21a8 8 0 0 1 16 0Z", fill: "#76a83a", stroke: "#466e1a", w: 1.3 },
    { d: "M30.5 21a5.5 5.5 0 0 1 11 0Z", fill: "#e6f09c" },
    { d: "M36 21v-5M36 21l-3.8-3.6M36 21l3.8-3.6", fill: "none", stroke: "#a8c060", w: 0.9 },
  ],
  chui: [...bowl("#7a4419", "#45220a"),
    { d: "M27 22.5l11-3M30 26l10-2.4", fill: "none", stroke: "#c49a68", w: 3.6 },
    { d: "M31 21.4v2M35 20.4v2M34 24.6v2M37.5 23.8v2", fill: "none", stroke: "#8a6238", w: 0.9 },
  ],
  shutki: [
    { d: "M3 8h42", fill: "none", stroke: "#7a5b3a", w: 1.5 },
    { d: "M15 8v3M33 8v3", fill: "none", stroke: "#7a5b3a", w: 1.2 },
    { d: "M15 11c5 6 5 18 0 25c-5-7-5-19 0-25Z", fill: "#c8a06a", stroke: "#86663a", w: 1.2 },
    { d: "M15 36l-3.5 6h7Z", fill: "#b08a52", stroke: "#86663a", w: 1 },
    { d: "M12.5 18h5M12 23h6M12.5 28h5", fill: "none", stroke: "#9a7a48", w: 0.9 },
    { d: "M33 11c5 6 5 18 0 25c-5-7-5-19 0-25Z", fill: "#d6b07a", stroke: "#86663a", w: 1.2 },
    { d: "M33 36l-3.5 6h7Z", fill: "#bf9862", stroke: "#86663a", w: 1 },
    { d: "M30.5 18h5M30 23h6M30.5 28h5", fill: "none", stroke: "#a8885a", w: 0.9 },
  ],
  chingri: [...PLATE,
    { d: "M13 32c0-9 11-13 18-8c4 3 3 8 0 9", fill: "none", stroke: "#e2683a", w: 6.5 },
    { d: "M16 26l3 3M20 22.6l2 4M25 21.6l.4 4.4M29.6 23l-1.6 4", fill: "none", stroke: "#f6b48a", w: 1.1 },
    { d: "M30 33l6 1.5-3 4.5Z", fill: "#e2683a", stroke: "#b0441e", w: 1 },
    { d: "M13 28c-3-6-6-9-8-10M14 27c-1-6-3-10-5-12", fill: "none", stroke: "#b0441e", w: 0.9 },
    { d: circle(13.6, 30.6, 0.9), fill: "#2b1a12" },
  ],
  chal: [...PLATE,
    { d: "M10 33c0-10 28-10 28 0c-6 3-22 3-28 0Z", fill: "#fffdf6", stroke: "#d4cbb4", w: 1.3 },
    { d: "M15 28l2-1M20 25.4l2 .6M26 25.6l2-.8M31 28l2 .8M18 31l2-.6M24 29l2 .6M29 31.4l2-.4", fill: "none", stroke: "#ddd2b8", w: 1.2 },
    { d: "M30 24c4-4 9-3 11 0c-4 3-8 3-11 0Z", fill: "#5b8a3a", stroke: "#3c6224", w: 0.9 },
    { d: "M17 17c-2 2 2 4 0 6M24 14c-2 2 2 4 0 6", fill: "none", stroke: "#b8b0a0", w: 1.4 },
  ],
  ghee: [...PLATE,
    { d: "M8 34c0-9 22-9 22 0c-5 2.6-17 2.6-22 0Z", fill: "#fffdf6", stroke: "#d4cbb4", w: 1.3 },
    { d: ellipse(19, 29, 5.5, 2), fill: "#f2c94c" },
    { d: "M32 19h10v3c2 1 2 3 2 5v8c0 2-2 3-4 3h-6c-2 0-4-1-4-3v-8c0-2 0-4 2-5Z", fill: "#e8b838", stroke: "#9a6e10", w: 1.3 },
    { d: "M31 15h12v4H31Z", fill: "#8a5a2a", stroke: "#5c3a18", w: 1 },
    { d: "M33 27v6", fill: "none", stroke: "#fbe08a", w: 1.4 },
  ],
  aam: [
    { d: "M15 13c10-4 22 6 20 20c-1 9-10 12-16 9c-7-3-12-12-10-20c1-5 3-8 6-9Z", fill: "#f2b51f", stroke: "#a96e0a", w: 1.5 },
    { d: "M28 34c3-3 5-7 5-12c2 6 0 13-6 15c-2 .6-1-1.4 1-3Z", fill: "#e8842a" },
    { d: "M19 12l-1-5", fill: "none", stroke: "#6b4a2a", w: 2 },
    { d: "M19 8c5-5 13-4 15-1c-5 3-11 4-15 1Z", fill: "#4f8f2f", stroke: "#2f6418", w: 1 },
  ],
  lichu: [
    { d: "M24 6L17 21M24 6l6 12M24 6v22", fill: "none", stroke: "#6b4a2a", w: 1.6 },
    { d: "M24 7c-6-3-12-1-13 2c5 2 10 1 13-2Z", fill: "#4f8f2f", stroke: "#2f6418", w: 0.9 },
    { d: circle(16.5, 27, 7.5), fill: "#d0342c", stroke: "#8e1d18", w: 1.3 },
    { d: circle(31, 25, 7.5), fill: "#c72e27", stroke: "#8e1d18", w: 1.3 },
    { d: circle(24, 36, 7.5), fill: "#d83a30", stroke: "#8e1d18", w: 1.3 },
    { d: dots([[14, 25], [18, 29], [15, 30], [29, 23], [33, 27], [30, 28], [22, 34], [26, 38], [23, 39], [27, 34]], 0.8), fill: "#f28a78" },
  ],
  kathal: [
    { d: "M24 11V5", fill: "none", stroke: "#6b4a2a", w: 3 },
    { d: ellipse(24, 27, 15, 17), fill: "#9cb83c", stroke: "#5c771a", w: 1.5 },
    { d: dots([[17, 18], [24, 16], [31, 18], [14, 24], [21, 22], [28, 22], [34, 25], [17, 29], [24, 28], [31, 30], [14, 33], [21, 34], [28, 35], [34, 34], [19, 40], [26, 41], [31, 39]], 1.1), fill: "#6e8c22" },
    { d: "M15 20c-2 5-2 11 0 16", fill: "none", stroke: "#c4d86a", w: 1.6 },
  ],
  kola: [
    { d: "M24 5v7", fill: "none", stroke: "#5c771a", w: 3 },
    { d: "M22 11c-8 6-12 18-8 28c1-8 5-17 10-24Z", fill: "#f0cc35", stroke: "#a8861a", w: 1.2 },
    { d: "M24 11c-3 9-3 21 2 30c1-9 1-19 0-28Z", fill: "#f5d640", stroke: "#a8861a", w: 1.2 },
    { d: "M26 11c7 6 12 16 10 27c-2-8-6-17-11-24Z", fill: "#efc832", stroke: "#a8861a", w: 1.2 },
    { d: "M13.6 39l1 2M25.6 41l1 1.6M35.6 38l.4 2", fill: "none", stroke: "#5a4012", w: 1.6 },
  ],
  amra: [
    { d: ellipse(16, 25, 9, 12), fill: "#a8c83e", stroke: "#668a1c", w: 1.5 },
    { d: "M13 18c-2 4-2 10 0 14", fill: "none", stroke: "#d2e480", w: 1.6 },
    { d: "M26 31c3-6 11-6 15 0c-4 2.4-11 2.4-15 0Z", fill: "#e2ec9c", stroke: "#86a63a", w: 1.2 },
    { d: "M24 39c3-6 11-6 15 0c-4 2.4-11 2.4-15 0Z", fill: "#e6efa6", stroke: "#86a63a", w: 1.2 },
    { d: dots([[30, 30], [34, 29.4], [37, 31], [28, 38], [32, 37.4], [35, 39], [32, 32], [29.6, 40]], 0.75), fill: "#c62f1f" },
  ],
  peyara: [
    { d: "M17 15l-2.4-3.4M17 15l2.4-3.4M17 15v-4", fill: "none", stroke: "#5a4a2a", w: 1.3 },
    { d: circle(17, 27, 11.5), fill: "#8cbf48", stroke: "#4c8a1e", w: 1.5 },
    { d: "M11 21c-2 4-2 9 0 12", fill: "none", stroke: "#bfe07a", w: 1.6 },
    { d: circle(33, 33, 9), fill: "#f6f3e6", stroke: "#78ad38", w: 2.6 },
    { d: dots([[33, 29.4], [36.2, 31.4], [36, 35], [33, 37], [29.8, 35], [30, 31.4]], 0.9), fill: "#dcc08e" },
  ],
  lotkon: [
    { d: "M24 4c0 10 1 20 0 36", fill: "none", stroke: "#6b4a2a", w: 2 },
    { d: [[18.5, 14], [29.5, 16], [24, 21], [17.5, 25], [30.5, 27], [24, 31.5], [18.5, 36], [29.5, 37.5]].map(([x, y]) => circle(x, y, 5.2)).join(""), fill: "#e6c048", stroke: "#a3801a", w: 1.1 },
    { d: dots([[17, 12.5], [28, 14.5], [22.5, 19.5], [16, 23.5], [29, 25.5], [22.5, 30], [17, 34.5], [28, 36]], 1.1), fill: "#f6e08a" },
  ],
  achar: [
    { d: "M13 10h22v5H13Z", fill: "#c0392b", stroke: "#7a1f16", w: 1 },
    { d: "M14 15h20v3c2 2 3 4 3 7v12c0 3-2 5-5 5H16c-3 0-5-2-5-5V25c0-3 1-5 3-7Z", fill: "#eef3ec", stroke: "#8aa0a0", w: 1.4 },
    { d: "M11.5 27h25v10c0 3-2 4.5-4.5 4.5h-16c-2.5 0-4.5-1.5-4.5-4.5Z", fill: "#b8872a" },
    { d: "M15 31l4-2 3 3-4 2ZM24 30l5-1 1 4-5 1ZM18 37l4-1 2 3-5 1ZM28 36l4 0 0 3-4 0Z", fill: "#7aa83a" },
    { d: "M16 20v4", fill: "none", stroke: "#ffffff", w: 2 },
  ],
  cha: [
    { d: ellipse(24, 41, 13, 3), fill: "#e6ddd0", stroke: "#a89a86", w: 1 },
    { d: "M14 12h20l-2.5 28h-15Z", fill: "#f4f6f6", stroke: "#8a9090", w: 1.3 },
    { d: "M15 18h18l-2 22H17Z", fill: "#8a2c0e" },
    { d: "M17 19.5h14", fill: "none", stroke: "#c45a2a", w: 1.2 },
    { d: "M34 28c4-6 10-6 11-3c-3 4-8 5-11 3ZM35 33c5-3 9-1 9 1c-3 2-7 2-9-1Z", fill: "#3f7a2a", stroke: "#2a5a18", w: 0.8 },
  ],
  modhu: [
    { d: "M12 14h20v4H12Z", fill: "#8a5a2a", stroke: "#5c3a18", w: 1 },
    { d: "M13 18h18v18c0 3-2 5-5 5h-8c-3 0-5-2-5-5Z", fill: "#e9a51e", stroke: "#93630a", w: 1.4 },
    { d: "M13 25h18v6H13Z", fill: "#fbe7b0" },
    { d: "M16 20v3", fill: "none", stroke: "#fbd77a", w: 1.6 },
    { d: "M30 5l8 14", fill: "none", stroke: "#8a5a2a", w: 2.4 },
    { d: ellipse(38.5, 22, 3.5, 4.5), fill: "#c88a3a", stroke: "#8a5a2a", w: 1 },
    { d: "M38.5 26.5c0 3 1.4 5 1.4 6.4a1.4 1.4 0 0 1-2.8 0c0-1.4 1.4-3.4 1.4-6.4Z", fill: "#e9a51e" },
  ],
  chini: [
    { d: "M9 30c3-10 27-10 30 0Z", fill: "#9a4a26", stroke: "#6a2e14", w: 1 },
    { d: dots([[15, 27], [19, 24.5], [24, 23.5], [29, 24.5], [33, 27], [22, 27.4], [27, 27.6], [17.6, 28.6], [30.4, 28.6]], 0.9), fill: "#d08a5a" },
    { d: "M7 30h34c0 7-7.5 12-17 12S7 37 7 30Z", fill: "#efe8d6", stroke: "#a39a84", w: 1.4 },
    { d: "M12 35c5 3 19 3 24 0", fill: "none", stroke: "#d4cab2", w: 1.1 },
  ],
  gur: [
    { d: "M9 32v4c0 3 7 5 15 5s15-2 15-5v-4Z", fill: "#5e2c0e" },
    { d: ellipse(24, 32, 15, 5), fill: "#7a3a14", stroke: "#4a220a", w: 1.2 },
    { d: "M13 23v4c0 2.4 5 4 11 4s11-1.6 11-4v-4Z", fill: "#6a3210" },
    { d: ellipse(24, 23, 11, 4), fill: "#8e4818", stroke: "#4a220a", w: 1.2 },
    { d: "M17 22c3-1.4 8-1.6 12-.6", fill: "none", stroke: "#c07a40", w: 1.3 },
    { d: "M14 31c4-1.6 10-1.8 15-.8", fill: "none", stroke: "#a8602e", w: 1.3 },
  ],
} satisfies Record<string, Part[]>;

export type ArtId = keyof typeof dishArt;
export const artIds = Object.keys(dishArt) as ArtId[];

/** Draws a dish into a size×size square at (x, y) on a canvas. */
export function drawDish(context: CanvasRenderingContext2D, art: ArtId, x: number, y: number, size: number) {
  context.save();
  context.translate(x, y);
  context.scale(size / 48, size / 48);
  context.lineCap = "round";
  context.lineJoin = "round";
  for (const part of dishArt[art] as Part[]) {
    const path = new Path2D(part.d);
    if (part.fill && part.fill !== "none") { context.fillStyle = part.fill; context.fill(path); }
    if (part.stroke) { context.strokeStyle = part.stroke; context.lineWidth = part.w ?? 1; context.stroke(path); }
  }
  context.restore();
}
