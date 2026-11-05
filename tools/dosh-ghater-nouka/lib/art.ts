// One নৌকা drawing (viewBox 0 0 100 60) shared by the page's SVG and the card's canvas, so both look the same.
export const BOAT = {
  hull: "M2 26 Q12 36 50 38 Q88 36 98 26 Q92 52 50 54 Q8 52 2 26Z",
  roof: "M32 37 Q32 16 50 16 Q68 16 68 37Z",
  pole: "M80 36 L80 6",
  flag: "M80 6 L95 11 L80 16Z",
} as const;

export const BOATS = [
  { hull: "#b5562b", roof: "#e9b949", flag: "#e63946" },
  { hull: "#2f5d8a", roof: "#c9a66b", flag: "#2a9d8f" },
] as const;

export function drawBoat(c: CanvasRenderingContext2D, cx: number, bottom: number, width: number, player: 0 | 1) {
  const scale = width / 100, colors = BOATS[player];
  c.save();
  c.translate(cx - width / 2, bottom - 56 * scale);
  c.scale(scale, scale);
  c.fillStyle = colors.roof; c.fill(new Path2D(BOAT.roof));
  c.fillStyle = colors.hull; c.fill(new Path2D(BOAT.hull));
  c.strokeStyle = "#5b4636"; c.lineWidth = 2.5; c.stroke(new Path2D(BOAT.pole));
  c.fillStyle = colors.flag; c.fill(new Path2D(BOAT.flag));
  c.restore();
}

// ---- the চরকি: a round face of 2 or 3 equal sectors, sector i showing i + 1 dots; the red pointer turns to the landed one ----
const pointAt = (angle: number, radius: number): [number, number] => [50 + radius * Math.sin(angle), 50 - radius * Math.cos(angle)];
const r1 = (value: number) => Math.round(value * 10) / 10;

export type Sector = { path: string; dots: [number, number][] };
function makeSectors(faces: number): Sector[] {
  return Array.from({ length: faces }, (_, index) => {
    const a0 = (index / faces) * Math.PI * 2, a1 = ((index + 1) / faces) * Math.PI * 2, mid = (a0 + a1) / 2;
    const [x0, y0] = pointAt(a0, 46), [x1, y1] = pointAt(a1, 46);
    const dots: [number, number][] = [];
    const count = index + 1, spread = 0.2;
    for (let dot = 0; dot < count; dot++) { const [x, y] = pointAt(mid + (dot - (count - 1) / 2) * spread * (faces === 2 ? 1.3 : 1), faces === 2 ? 27 : 28); dots.push([r1(x), r1(y)]); }
    return { path: `M50 50L${r1(x0)} ${r1(y0)}A46 46 0 ${faces === 2 ? 1 : 0} 1 ${r1(x1)} ${r1(y1)}Z`, dots };
  });
}
export const SECTORS: Record<2 | 3, Sector[]> = { 2: makeSectors(2), 3: makeSectors(3) };
export const SECTOR_FILL = ["#ffe3a3", "#bfe3ea", "#f6c9d6"] as const;

/** The pointer's angle (degrees, clockwise from the top) when it stops on `face`: the middle of its sector, a little off. */
export const landAngle = (face: number, faces: number, wobble: number) => ((face - 0.5) / faces) * 360 + wobble * (360 / faces) * 0.5;
