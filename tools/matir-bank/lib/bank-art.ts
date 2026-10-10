// The painted clay bank as plain path data, so the page (SVG) and the share card (canvas Path2D) draw the very same pot.
export const palette = {
  sky: "#f6c548", skyDeep: "#eba52d", ink: "#3b1608", muted: "#7a4a22",
  clay: "#bf5a2c", clayLight: "#e0834a", clayDark: "#7d3313", slot: "#2b0f05",
  cream: "#fff3d6", green: "#1f7a52", red: "#c8302a", yellow: "#ffd84f",
  coin: "#f3c64a", coinRim: "#a87512",
  mat: "#e8cf98", matDark: "#c79a52", band: "#3b1608",
} as const;

export type Shape = { d: string; fill?: string; stroke?: string; width?: number };
/** Width and height of the art's own coordinate box. */
export const ART = { width: 200, height: 214 } as const;
/** Where a dropped coin enters. */
export const SLOT = { x: 100, y: 74 } as const;

const f = (n: number) => Math.round(n * 10) / 10;
export const ellipse = (cx: number, cy: number, rx: number, ry = rx) => `M${f(cx - rx)} ${f(cy)}a${f(rx)} ${f(ry)} 0 1 0 ${f(rx * 2)} 0a${f(rx)} ${f(ry)} 0 1 0 ${f(-rx * 2)} 0Z`;

export const coinShapes = (cx: number, cy: number, r: number): Shape[] => [
  { d: ellipse(cx, cy, r), fill: palette.coin, stroke: palette.coinRim, width: r * 0.16 },
  { d: ellipse(cx, cy, r * 0.62), stroke: palette.coinRim, width: r * 0.1 },
];

// The painted band follows the pot's curve: highest at the middle, so a dot at x sits at y(x).
const bandY = (x: number, base: number) => base + 14 * (1 - ((x - 100) / 80) ** 2);

/** The bank, back to front. "clay" in `fill` means the shaded clay gradient. */
export function bankShapes(cracked: boolean): Shape[] {
  const shapes: Shape[] = [
    { d: ellipse(100, 206, 70, 7), fill: "rgba(59,22,8,.22)" },
    { d: "M68 188h64l-5 16H73Z", fill: palette.clayDark },
    { d: "M100 44C148 44 184 80 184 124C184 166 148 196 100 196C52 196 16 166 16 124C16 80 52 44 100 44Z", fill: "clay" },
    { d: "M82 54C84 42 91 35 100 35C109 35 116 42 118 54Z", fill: palette.clay },
    { d: ellipse(100, 32, 11, 8), fill: palette.clayLight, stroke: palette.clayDark, width: 2 },
    // Painted folk bands, like the ones sold at a Boishakhi mela.
    { d: "M22 108C62 126 138 126 178 108", stroke: palette.cream, width: 5 },
    { d: "M20 142C62 160 138 160 180 142", stroke: palette.cream, width: 5 },
    { d: "M24 116C62 134 138 134 176 116", stroke: palette.green, width: 2.5 },
    { d: "M22 134C62 152 138 152 178 134", stroke: palette.green, width: 2.5 },
    { d: "M60 96c-6-10 2-18 12-16-2 8-6 14-12 16Zm80 0c6-10-2-18-12-16 2 8 6 14 12 16Z", fill: palette.green },
    ...[0, 60, 120, 180, 240, 300].map(angle => ({ d: ellipse(100 + 9 * Math.cos(angle * Math.PI / 180), 99 + 9 * Math.sin(angle * Math.PI / 180), 6), fill: palette.red })),
    { d: ellipse(100, 99, 5), fill: palette.yellow },
    { d: "M74 70h52a4.5 4.5 0 0 1 0 9H74a4.5 4.5 0 0 1 0-9Z", fill: palette.slot },
  ];
  for (let x = 36; x <= 164; x += 16) shapes.push({ d: ellipse(x, bandY(x, 125), 3.6), fill: x % 32 === 4 ? palette.yellow : palette.cream });
  for (let x = 52; x <= 148; x += 24) shapes.push({ d: ellipse(x, bandY(x, 168) - 2, 3), fill: palette.cream });
  if (cracked) {
    shapes.push(
      { d: "M54 62l14 20-10 14 20 14-8 18 18 12-4 22", stroke: palette.slot, width: 4 },
      { d: "M152 76l-14 18 12 12-16 20 10 18", stroke: palette.slot, width: 4 },
      ...coinShapes(36, 200, 12), ...coinShapes(58, 205, 11), ...coinShapes(150, 203, 12), ...coinShapes(170, 198, 10), ...coinShapes(130, 208, 9),
    );
  }
  return shapes;
}
