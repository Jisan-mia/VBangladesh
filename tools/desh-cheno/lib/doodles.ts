// Marker doodles for the chart paper, as SVG path data in a 100×100 box. The same strings draw the page (inline SVG)
// and the card (canvas Path2D), so the two always match.
export type DoodleKey = "doyel" | "shapla" | "kathal" | "ilish" | "thaba" | "gach" | "tara" | "potaka" | "nodi" | "rritu";
export type Stroke = { d: string; fill?: string; line?: string; width?: number };

const ink = "#183a6b";
const ellipse = (cx: number, cy: number, rx: number, ry: number) => `M${cx - rx} ${cy}A${rx} ${ry} 0 1 0 ${cx + rx} ${cy}A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z`;

/** A five-point star centred on (cx, cy). */
export function starPath(cx: number, cy: number, outer: number, inner = outer * 0.45) {
  const points = Array.from({ length: 10 }, (_, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI) / 5;
    const radius = index % 2 ? inner : outer;
    return `${(cx + radius * Math.cos(angle)).toFixed(1)} ${(cy + radius * Math.sin(angle)).toFixed(1)}`;
  });
  return `M${points.join("L")}Z`;
}

function petals(cx: number, cy: number, length: number, angles: number[]) {
  return angles.map(degrees => {
    const a = (degrees * Math.PI) / 180, side = 0.32;
    const tip = [cx + length * Math.sin(a), cy - length * Math.cos(a)];
    const left = [cx + length * 0.6 * Math.sin(a - side), cy - length * 0.6 * Math.cos(a - side)];
    const right = [cx + length * 0.6 * Math.sin(a + side), cy - length * 0.6 * Math.cos(a + side)];
    return `M${cx} ${cy}Q${left[0].toFixed(1)} ${left[1].toFixed(1)} ${tip[0].toFixed(1)} ${tip[1].toFixed(1)}Q${right[0].toFixed(1)} ${right[1].toFixed(1)} ${cx} ${cy}Z`;
  }).join("");
}

export const doodles: Record<DoodleKey, Stroke[]> = {
  doyel: [
    { d: "M54 70L52 84M62 68L64 84M46 84L70 84", line: ink, width: 3 },
    { d: "M36 58L10 26L20 23L44 52Z", fill: "#1f2a37", line: ink, width: 2.5 },
    { d: "M30 62Q34 46 52 42Q58 30 68 30Q78 30 80 38L92 41L80 45Q78 56 66 63Q50 71 30 62Z", fill: "#1f2a37", line: ink, width: 2.5 },
    { d: "M42 63Q58 68 72 57Q66 72 50 72Q42 70 42 63Z", fill: "#ffffff" },
    { d: "M44 52L62 47", line: "#ffffff", width: 4 },
    { d: ellipse(71, 37, 2.6, 2.6), fill: "#ffffff" },
  ],
  shapla: [
    { d: ellipse(50, 80, 38, 9), fill: "#6aa84f", line: ink, width: 2.5 },
    { d: petals(50, 72, 46, [-70, -40, -14, 14, 40, 70]), fill: "#ffffff", line: ink, width: 2.5 },
    { d: petals(50, 72, 30, [-24, 0, 24]), fill: "#ffe3ec", line: ink, width: 2 },
    { d: ellipse(50, 66, 6, 4), fill: "#f2c230" },
  ],
  kathal: [
    { d: "M50 12L50 22", line: "#6b4f2a", width: 4 },
    { d: ellipse(50, 56, 30, 36), fill: "#9cc34a", line: ink, width: 2.5 },
    { d: "M34 40l3 3M46 34l3 3M58 38l3 3M30 56l3 3M42 50l3 3M54 52l3 3M66 50l3 3M36 70l3 3M48 66l3 3M60 70l3 3M46 82l3 3", line: "#4c6b1d", width: 2.5 },
  ],
  ilish: [
    { d: "M8 50Q38 24 72 44L92 30L87 50L92 70L72 56Q38 76 8 50Z", fill: "#d5dee6", line: ink, width: 2.5 },
    { d: "M30 42Q34 50 30 58", line: ink, width: 2 },
    { d: ellipse(20, 47, 2.6, 2.6), fill: ink },
    { d: "M40 46l4 4M50 44l4 4M60 46l4 4M45 54l4 4M55 54l4 4", line: "#8796a6", width: 2 },
  ],
  thaba: [
    { d: ellipse(50, 64, 20, 17), fill: "#f0a33a", line: ink, width: 2.5 },
    { d: ellipse(26, 40, 8, 10) + ellipse(42, 28, 8, 10) + ellipse(58, 28, 8, 10) + ellipse(74, 40, 8, 10), fill: "#f0a33a", line: ink, width: 2.5 },
    { d: "M42 58l6 10M54 56l4 12", line: "#1f2a37", width: 3 },
  ],
  gach: [
    { d: "M44 90L46 58L54 58L56 90Z", fill: "#8a5a2b", line: ink, width: 2.5 },
    { d: ellipse(50, 42, 34, 26), fill: "#4f9a46", line: ink, width: 2.5 },
    { d: ellipse(36, 44, 4, 5) + ellipse(60, 34, 4, 5) + ellipse(64, 52, 4, 5), fill: "#f2c230" },
  ],
  tara: [
    { d: starPath(50, 52, 40), fill: "#f5b301", line: "#9a6a00", width: 2.5 },
    { d: "M36 40Q42 34 50 34", line: "#ffffff", width: 3 },
  ],
  potaka: [
    { d: "M14 10L14 94", line: "#6b4f2a", width: 4 },
    { d: "M16 16L90 16L90 60L16 60Z", fill: "#006a4e", line: ink, width: 2.5 },
    // Circle centre at 9/20 of the length, radius one fifth of it (Banglapedia, National Flag).
    { d: ellipse(16 + 74 * 0.45, 38, 74 / 5, 74 / 5), fill: "#f42a41" },
  ],
  nodi: [
    { d: "M22 58Q50 74 80 58L72 50L30 50Z", fill: "#a0522d", line: ink, width: 2.5 },
    { d: "M50 14L50 50M50 16L74 46L50 46", fill: "#fff6d8", line: ink, width: 2.5 },
    { d: "M6 72Q16 66 26 72T46 72T66 72T86 72T96 72M10 84Q20 78 30 84T50 84T70 84T90 84", line: "#2f80c0", width: 3 },
  ],
  rritu: [
    { d: ellipse(40, 40, 16, 16), fill: "#f5b301", line: "#9a6a00", width: 2.5 },
    { d: "M40 12L40 18M40 62L40 68M12 40L18 40M62 40L68 40M20 20L24 24M56 56L60 60M20 60L24 56M56 24L60 20", line: "#d98a00", width: 3 },
    { d: "M46 74Q46 60 60 62Q64 50 76 54Q90 54 90 66Q98 68 96 76Q94 82 86 82L52 82Q44 80 46 74Z", fill: "#ffffff", line: ink, width: 2.5 },
  ],
};

/** Draws a doodle on a canvas at (x, y), size px square. */
export function drawDoodle(context: CanvasRenderingContext2D, key: DoodleKey, x: number, y: number, size: number, rotate = 0) {
  context.save();
  context.translate(x + size / 2, y + size / 2);
  context.rotate(rotate);
  context.scale(size / 100, size / 100);
  context.translate(-50, -50);
  context.lineCap = "round";
  context.lineJoin = "round";
  for (const part of doodles[key]) {
    const path = new Path2D(part.d);
    if (part.fill) { context.fillStyle = part.fill; context.fill(path); }
    if (part.line) { context.strokeStyle = part.line; context.lineWidth = part.width ?? 2.5; context.stroke(path); }
  }
  context.restore();
}
