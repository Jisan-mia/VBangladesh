// The চালচিত্র arch as plain SVG path data, shared by the page's <svg> and the card's canvas (Path2D reads the same strings).
// Decorative panels only: শিউলি, কাশফুল, ঢাক, আলপনা and প্রদীপ. No deity, face or figure is ever drawn.

export const ARCH = { width: 1000, height: 560, cx: 500, cy: 530, outer: 490, rim: 402, panel: 262 } as const;
/** One lamp per pandal; past this the whole arch glows. */
export const LAMPS = 21;

export const ARCH_COLORS = {
  red: "#b3171f", deep: "#7a0c11", ochre: "#f1bd45", white: "#fffaf1", pale: "#fff3dc",
  orange: "#ef6a1d", stem: "#7a6a3a", flame: "#ffad1f", core: "#fff3b0", clay: "#c4622b", dark: "#5e1014",
} as const;
const C = ARCH_COLORS;

/** One drawable layer. `at` places it: translate to (x, y) and rotate by deg, both in arch units. */
export type Piece = { d: string; fill?: string; stroke?: string; width?: number; at?: readonly [number, number, number] };

const n = (value: number) => Number(value.toFixed(1));
const { cx, cy } = ARCH;
const polar = (radius: number, angle: number) => [n(cx + radius * Math.cos(angle)), n(cy - radius * Math.sin(angle))] as const;

const halfRing = (outer: number, inner: number) =>
  `M${cx - outer} ${cy}A${outer} ${outer} 0 0 1 ${cx + outer} ${cy}L${cx + inner} ${cy}A${inner} ${inner} 0 0 0 ${cx - inner} ${cy}Z`;
const halfDisc = (radius: number) => `M${cx - radius} ${cy}A${radius} ${radius} 0 0 1 ${cx + radius} ${cy}Z`;
const circle = (x: number, y: number, r: number) => `M${n(x - r)} ${n(y)}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`;
const ring = (radius: number) => `M${cx - radius} ${cy}A${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`;

/** A teardrop petal around (x, y): angle 0 points up, from `inner` to `outer` radius, `half` wide at its fattest. */
function petal(x: number, y: number, angle: number, inner: number, outer: number, half: number) {
  const a = (angle * Math.PI) / 180;
  const p = (r: number, side: number) => `${n(x + r * Math.sin(a) + side * Math.cos(a))} ${n(y - r * Math.cos(a) + side * Math.sin(a))}`;
  const mid = inner + (outer - inner) * 0.35;
  return `M${p(inner, 0)}C${p(mid, half)} ${p(outer, half * 0.5)} ${p(outer, 0)}C${p(outer, -half * 0.5)} ${p(mid, -half)} ${p(inner, 0)}Z`;
}

function shiuliFlower(x: number, y: number, size: number): Piece[] {
  const petals = [0, 60, 120, 180, 240, 300].map(angle => petal(x, y, angle + 30, 4 * size, 30 * size, 11 * size)).join("");
  return [
    { d: `M${n(x - 4 * size)} ${y}L${n(x + 4 * size)} ${y}L${n(x + 3 * size)} ${n(y + 30 * size)}L${n(x - 3 * size)} ${n(y + 30 * size)}Z`, fill: C.orange },
    { d: petals, fill: C.white },
    { d: circle(x, y, 6 * size), fill: C.orange },
  ];
}

function diya(scale: number, lit: boolean): Piece[] {
  const s = (value: number) => n(value * scale);
  const bowl = `M${s(-28)} ${s(-2)}L${s(28)} ${s(-2)}C${s(26)} ${s(14)} ${s(12)} ${s(18)} 0 ${s(18)}C${s(-12)} ${s(18)} ${s(-26)} ${s(14)} ${s(-28)} ${s(-2)}Z`;
  const oil = `M${s(-28)} ${s(-2)}C${s(-20)} ${s(-8)} ${s(20)} ${s(-8)} ${s(28)} ${s(-2)}C${s(20)} ${s(4)} ${s(-20)} ${s(4)} ${s(-28)} ${s(-2)}Z`;
  if (!lit) return [
    { d: bowl, fill: C.dark, stroke: C.ochre, width: 3 },
    { d: `M0 ${s(-3)}L0 ${s(-12)}`, stroke: C.ochre, width: 3 },
  ];
  return [
    { d: circle(0, s(-22), s(34)), fill: "rgba(255,196,77,.38)" },
    { d: bowl, fill: C.clay, stroke: C.deep, width: 2 },
    { d: oil, fill: C.deep },
    { d: `M0 ${s(-44)}C${s(8)} ${s(-30)} ${s(12)} ${s(-18)} 0 ${s(-5)}C${s(-12)} ${s(-18)} ${s(-8)} ${s(-30)} 0 ${s(-44)}Z`, fill: C.flame },
    { d: `M0 ${s(-30)}C${s(4)} ${s(-22)} ${s(5)} ${s(-15)} 0 ${s(-9)}C${s(-5)} ${s(-15)} ${s(-4)} ${s(-22)} 0 ${s(-30)}Z`, fill: C.core },
  ];
}

/** Panel motifs, drawn upright around (0, 0) inside a box of about ±45 × ±55. */
const motifs = {
  shiuli: [...shiuliFlower(0, -14, 1), ...shiuliFlower(-27, 26, 0.5), ...shiuliFlower(27, 22, 0.5)],
  kash: [
    { d: "M0 50L-24 -18M0 50L0 -30M0 50L24 -18", stroke: C.stem, width: 4 },
    { d: [-22, 0, 22].map(angle => petal(0, 50, angle, 34, 104, 11)).join(""), fill: C.white },
  ],
  dhak: [
    { d: [-34, -12, 12, 34].map(angle => petal(0, -16, angle, 6, 46, 8)).join(""), fill: C.white },
    { d: "M-30 -12C-42 6-42 22-30 40L30 40C42 22 42 6 30-12Z", fill: C.red, stroke: C.deep, width: 3 },
    { d: "M-30 -8L-18 38L-6 -8L6 38L18 -8L30 38", stroke: C.white, width: 3 },
    { d: "M-30 -12C-30 -20 30 -20 30 -12C30 -4 -30 -4 -30 -12Z", fill: C.white, stroke: C.deep, width: 2 },
  ],
  alpana: [
    { d: circle(0, 0, 38), stroke: C.white, width: 5 },
    { d: [0, 45, 90, 135, 180, 225, 270, 315].map(angle => petal(0, 0, angle, 8, 32, 9)).join(""), fill: C.white },
    { d: circle(0, 0, 7), fill: C.red },
    { d: [0, 45, 90, 135, 180, 225, 270, 315].map(angle => circle(48 * Math.sin((angle * Math.PI) / 180), -48 * Math.cos((angle * Math.PI) / 180), 4)).join(""), fill: C.white },
  ],
  pradip: diya(1.25, true),
} satisfies Record<string, Piece[]>;

const PANEL_ORDER = ["kash", "shiuli", "dhak", "alpana", "pradip", "alpana", "dhak", "shiuli", "kash"] as const;

/** The arch without lamps: rim, panels, scallops and the base. Built once. */
export const archBody: Piece[] = (() => {
  const step = Math.PI / PANEL_ORDER.length;
  const middle = (ARCH.rim + ARCH.panel) / 2;
  const pieces: Piece[] = [
    { d: halfDisc(ARCH.panel), fill: C.pale },
    { d: Array.from({ length: 31 }, (_, index) => { const [x, y] = polar(ARCH.panel, Math.PI - (index * Math.PI) / 30); return circle(x, y, 13); }).join(""), fill: C.red },
    { d: halfRing(ARCH.rim, ARCH.panel), fill: C.ochre },
  ];
  PANEL_ORDER.forEach((motif, index) => {
    const angle = Math.PI - (index + 0.5) * step;
    const [x, y] = polar(middle, angle);
    // Turned so each motif faces outward, like the painted figures on a real চালচিত্র.
    const deg = n(90 - (angle * 180) / Math.PI);
    for (const piece of motifs[motif]) pieces.push({ ...piece, at: [x, y, deg] });
  });
  const dividers = Array.from({ length: PANEL_ORDER.length - 1 }, (_, index) => {
    const angle = Math.PI - (index + 1) * step;
    const [x1, y1] = polar(ARCH.panel, angle), [x2, y2] = polar(ARCH.rim, angle);
    return `M${x1} ${y1}L${x2} ${y2}`;
  }).join("");
  pieces.push(
    { d: dividers, stroke: C.red, width: 9 },
    { d: halfRing(ARCH.outer, ARCH.rim), fill: C.red },
    { d: `${ring(ARCH.rim)}${ring(ARCH.panel)}`, stroke: C.white, width: 5 },
    { d: [ARCH.rim + 9, ARCH.outer - 9].flatMap(radius => Array.from({ length: 41 }, (_, index) => { const [x, y] = polar(radius, Math.PI - (index * Math.PI) / 40); return circle(x, y, 3.5); })).join(""), fill: C.white },
    { d: `M0 ${cy - 8}H${ARCH.width}V${ARCH.height}H0Z`, fill: C.red },
    { d: `M0 ${cy + 4}H${ARCH.width}`, stroke: C.white, width: 4 },
    { d: Array.from({ length: 25 }, (_, index) => circle(20 + index * 40, cy + 18, 4)).join(""), fill: C.ochre },
  );
  return pieces;
})();

/** Lamp positions along the rim, left to right over the top, so lamps fill like a progress arc. */
export const lampSpots = Array.from({ length: LAMPS }, (_, index) => polar((ARCH.outer + ARCH.rim) / 2, Math.PI - ((index + 0.5) * Math.PI) / LAMPS));

export const lampPieces = { lit: diya(0.82, true), unlit: diya(0.82, false) };

/** A golden glow around the whole arch once every lamp is lit. */
export const halo: Piece[] = [
  { d: ring(ARCH.outer + 14), stroke: "rgba(255,190,60,.45)", width: 22 },
  { d: ring(ARCH.outer + 3), stroke: "#ffd166", width: 6 },
];

/** Every piece for a given count, in drawing order. */
export function archPieces(count: number): Piece[] {
  const lamps = lampSpots.flatMap(([x, y], index) => (index < count ? lampPieces.lit : lampPieces.unlit).map(piece => ({ ...piece, at: [x, y + 10, 0] as const })));
  return [...(count > LAMPS ? halo : []), ...archBody, ...lamps];
}

/** Draws pieces on a canvas whose transform already maps arch units. */
export function drawPieces(context: CanvasRenderingContext2D, pieces: readonly Piece[]) {
  for (const piece of pieces) {
    context.save();
    if (piece.at) { context.translate(piece.at[0], piece.at[1]); context.rotate((piece.at[2] * Math.PI) / 180); }
    const path = new Path2D(piece.d);
    if (piece.fill) { context.fillStyle = piece.fill; context.fill(path); }
    if (piece.stroke) { context.strokeStyle = piece.stroke; context.lineWidth = piece.width ?? 2; context.lineCap = "round"; context.lineJoin = "round"; context.stroke(path); }
    context.restore();
  }
}
