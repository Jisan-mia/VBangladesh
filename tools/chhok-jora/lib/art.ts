// The quilt's look, shared by the live SVG board and the canvas card: colours, flower outlines as SVG path strings
// (drawn as <path d> on the board and as Path2D on the card), and the stitch geometry inside one 100-unit gap.

export const palette = {
  cloth: "#fbf3e6",
  ripple: "#eee0c8",
  thread: "#3a2c25",
  shine: "#8c776a",
  guide: "#cbb89b",
  hole: "#e6d6bd",
  border: "#c9902c",
  heart: "#f3c548",
  ink: "#3a2c25",
  muted: "#7a6656",
  highlight: "#f6d36a",
  players: ["#c23b2a", "#2457a6"] as const,
  tints: ["#c23b2a1f", "#2457a61f"] as const,
};

/** A stitch runs from 13 to 87 units along its 100-unit gap: four short dashes between two needle holes. */
export const STITCH = { from: 13, to: 87, dash: [8, 14] as const, width: 7 };
export const GUIDE = { dash: [1.5, 9.5] as const, width: 2.6 };
export const HEART = 17;

const round = (value: number) => Math.round(value * 10) / 10;
const circle = (x: number, y: number, r: number) => `M${round(x + r)} ${round(y)}a${r} ${r} 0 1 0 ${-2 * r} 0a${r} ${r} 0 1 0 ${2 * r} 0Z`;

/** Player 0's flower: five round petals. Player 1's: four pointed petals with seeds between. Shape tells them apart as well as colour. */
export const FLOWERS: readonly [string, string] = [
  Array.from({ length: 5 }, (_, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    return circle(Math.cos(angle) * 20, Math.sin(angle) * 20, 15);
  }).join(""),
  Array.from({ length: 4 }, (_, i) => {
    const angle = (i * Math.PI) / 2, cos = Math.cos(angle), sin = Math.sin(angle);
    // An almond from the heart to a tip 37 units out, bulging 15 units to each side.
    const at = (along: number, across: number) => `${round(cos * along - sin * across)} ${round(sin * along + cos * across)}`;
    return `M${at(6, 0)}Q${at(20, 17)} ${at(37, 0)}Q${at(20, -17)} ${at(6, 0)}Z`;
  }).join("") + Array.from({ length: 4 }, (_, i) => {
    const angle = Math.PI / 4 + (i * Math.PI) / 2;
    return circle(Math.cos(angle) * 25, Math.sin(angle) * 25, 5.5);
  }).join(""),
];

/** The kantha wave stitched round the cloth's edge: one continuous running line of shallow scallops, inset from a `size`-unit square. */
export function borderPath(size: number, inset = 18, wave = 25) {
  const parts: string[] = [];
  const side = size - 2 * inset, count = Math.round(side / wave), step = side / count;
  const run = (x: number, y: number, dx: number, dy: number, nx: number, ny: number) => {
    for (let i = 0; i < count; i++) {
      const sx = x + dx * step * i, sy = y + dy * step * i;
      parts.push(`Q${round(sx + dx * step / 2 + nx * 6)} ${round(sy + dy * step / 2 + ny * 6)} ${round(sx + dx * step)} ${round(sy + dy * step)}`);
    }
  };
  parts.push(`M${inset} ${inset}`);
  run(inset, inset, 1, 0, 0, 1);
  run(size - inset, inset, 0, 1, -1, 0);
  run(size - inset, size - inset, -1, 0, 0, -1);
  run(inset, size - inset, 0, -1, 1, 0);
  return parts.join("") + "Z";
}

// ---- After the rewrite: one look per world, and one motif pair per world (round for the first side, pointed for the second). ----

export type Look = {
  cloth: string; ripple: string; thread: string; shine: string; guide: string; hole: string; border: string; heart: string;
  ink: string; muted: string; highlight: string; players: readonly [string, string]; tints: readonly [string, string];
  /** The stage behind the cloth, and the zari gold of a জরির ঘর. */
  ground: string; gold: string;
};
export const LOOKS: readonly Look[] = [
  // উঠোন, সকাল: the cream cloth of before.
  { ...palette, ground: "#f6ead2", gold: "#c99a1a" },
  // পুকুরঘাট, দুপুর: a pale green cloth by the water.
  { cloth: "#eef5ee", ripple: "#d4e6d6", thread: "#28463f", shine: "#6f8f86", guide: "#94b5a6", hole: "#d1e2d5", border: "#2f7d6d", heart: "#f3c548",
    ink: "#22362f", muted: "#4f6b62", highlight: "#f6d36a", players: ["#c8432f", "#2a5aa8"], tints: ["#c8432f1f", "#2a5aa81f"], ground: "#d6e9de", gold: "#b88a12" },
  // হারিকেনের রাত: the cloth under a lamp, the night around it.
  { cloth: "#f4e8d2", ripple: "#e6d4b2", thread: "#2b2440", shine: "#7d7090", guide: "#b3a184", hole: "#e3cfa9", border: "#c48a1c", heart: "#f7d26a",
    ink: "#2b2440", muted: "#6d5f78", highlight: "#f7d26a", players: ["#c23b2a", "#3a4fb0"], tints: ["#c23b2a1f", "#3a4fb01f"], ground: "#1d2236", gold: "#c9930f" },
];

const star = (points: number, outer: number, inner: number) => Array.from({ length: points * 2 }, (_, i) => {
  const angle = -Math.PI / 2 + (i * Math.PI) / points, r = i % 2 ? inner : outer;
  return `${i ? "L" : "M"}${round(Math.cos(angle) * r)} ${round(Math.sin(angle) * r)}`;
}).join("") + "Z";

/** Motif outlines per world: [first side, second side]. Shape tells them apart as well as colour. */
export const MOTIFS: readonly (readonly [string, string])[] = [
  FLOWERS,
  [
    // A plump fish swimming right, with a forked tail.
    "M-26 0Q-4 -30 30 0Q-4 30 -26 0ZM-24 0L-40 -16L-35 0L-40 16Z",
    // A নৌকা: two sails over a hull.
    "M-30 4L2 -36L2 4ZM8 4L8 -26L30 4ZM-38 10L38 10L26 30L-26 30Z",
  ],
  [
    // A full moon.
    circle(0, 0, 33),
    // A six-point star.
    star(6, 40, 20),
  ],
];
/** Where each motif carries its initial: x, y and the disc's radius. */
export const MARKS: readonly (readonly [readonly [number, number, number], readonly [number, number, number]])[] = [
  [[0, 0, HEART], [0, 0, HEART]],
  [[4, 0, 14], [0, 20, 11]],
  [[0, 0, 17], [0, 0, 15]],
];

/** The kantha wave round a `width` × `height` cloth: one running line of shallow scallops, inset from the edge. */
export function borderRect(width: number, height: number, inset = 18, wave = 25) {
  const parts: string[] = [`M${inset} ${inset}`];
  const run = (x: number, y: number, length: number, dx: number, dy: number, nx: number, ny: number) => {
    const count = Math.max(1, Math.round(length / wave)), step = length / count;
    for (let i = 0; i < count; i++) {
      const sx = x + dx * step * i, sy = y + dy * step * i;
      parts.push(`Q${round(sx + dx * step / 2 + nx * 6)} ${round(sy + dy * step / 2 + ny * 6)} ${round(sx + dx * step)} ${round(sy + dy * step)}`);
    }
  };
  const w = width - 2 * inset, h = height - 2 * inset;
  run(inset, inset, w, 1, 0, 0, 1);
  run(width - inset, inset, h, 0, 1, -1, 0);
  run(width - inset, height - inset, w, -1, 0, 0, -1);
  run(inset, height - inset, h, 0, -1, 1, 0);
  return parts.join("") + "Z";
}
