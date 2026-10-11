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
