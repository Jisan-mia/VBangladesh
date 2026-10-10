// Stylised fish drawings, built from a few body measurements and the features people actually tell fish apart by
// (whiskers, a humped back, spots, stripes, tail shape). One set of SVG path strings feeds both the tiles (SVG) and the card (canvas Path2D).
import type { FishId } from "./fish";

/** One painted piece of a drawing. `clip` is a path the piece is clipped to (usually the body). */
export type Shape = { d: string; fill?: string; stroke?: string; width?: number; clip?: string; alpha?: number };

export const ART_WIDTH = 120;
export const ART_HEIGHT = 60;
export const INK = "#26333d";
const MID = 30;

type Tail = "fork" | "deep" | "uneven" | "round" | "lunate" | "rhomb" | "tri" | "none";
type FinStyle = "tri" | "round" | "long" | "spiny" | "sail";
/** [from, to] are positions along the body (0 = nose, 1 = tail base); height in drawing units. */
type Fin = [from: number, to: number, height: number, style?: FinStyle];
/** v runs from -1 (back) to 1 (belly) across the body at position t. */
type Mark =
  | { type: "spot"; t: number; v: number; r: number; color: string; ring?: string }
  | { type: "stripe"; v: number; w: number; color: string; from?: number; to?: number; alpha?: number }
  | { type: "bars"; at: number[]; w: number; color: string; wavy?: boolean; slant?: number; alpha?: number }
  | { type: "blotch"; at: Array<[t: number, v: number, r: number]>; color: string; alpha?: number }
  | { type: "zigzag"; color: string }
  | { type: "chevrons"; at: number[]; color: string }
  | { type: "dots"; rows: number[]; from: number; to: number; step: number; r: number; color: string }
  | { type: "scales"; color: string }
  | { type: "spine"; color: string }
  | { type: "finspot"; color: string };

type Art = {
  len: number; depth: number; peak?: number; back?: number; blunt?: number; ped?: number; mouth?: number; hump?: number;
  tail: Tail; tailLen?: number; tailSpan?: number;
  colors: [back: string, belly: string, fin: string];
  split?: number;
  dorsal?: Fin[]; anal?: Fin[]; adipose?: Fin; pelvic?: boolean; pectoral?: boolean;
  barbels?: number[]; mouthLen?: number; teeth?: boolean; beak?: number;
  eye?: number;
  gill?: number;
  marks?: Mark[];
  threads?: "pectoral" | "pelvic" | "tail";
  ghost?: boolean;
};

type Place = { dx: number; dy: number; s: number };

const round = (value: number) => Math.round(value * 10) / 10;
const smooth = (u: number) => u * u * (3 - 2 * u);
const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

function circle(P: (x: number, y: number) => string, s: number, cx: number, cy: number, r: number) {
  const rr = round(r * s);
  return `M ${P(cx - r, cy)} a ${rr} ${rr} 0 1 0 ${round(2 * rr)} 0 a ${rr} ${rr} 0 1 0 ${round(-2 * rr)} 0 Z`;
}

function fishShapes(a: Art, place: Place = { dx: 0, dy: 0, s: 1 }): Shape[] {
  const { dx, dy, s } = place;
  const P = (x: number, y: number) => `${round(x * s + dx)} ${round(y * s + dy)}`;
  const line = (points: Array<[number, number]>) => points.map(([x, y], index) => `${index ? "L" : "M"}${P(x, y)}`).join("");
  const [backColor, bellyColor, finColor] = a.colors;

  const tl = a.tail === "none" ? 0 : a.tailLen ?? 18;
  const beak = a.beak ?? 0;
  const x0 = (ART_WIDTH - beak - a.len - tl) / 2 + beak;
  const x1 = x0 + a.len;
  const H = a.depth / 2, p = a.peak ?? 0.38, backShare = a.back ?? 0.5, pd = a.ped ?? a.depth * 0.28, e = a.blunt ?? 0.55, m = a.mouth ?? 0, hump = a.hump ?? 0;
  const half = (t: number) => t <= p ? H * Math.pow(Math.max(0, 1 - ((p - t) / p) ** 2), e) : pd / 2 + (H - pd / 2) * (1 - smooth((t - p) / (1 - p)));
  const centre = (t: number) => MID + m * (1 - t) ** 3;
  const top = (t: number) => centre(t) - 2 * half(t) * backShare - hump * Math.exp(-(((t - p) / 0.22) ** 2));
  const bot = (t: number) => centre(t) + 2 * half(t) * (1 - backShare);
  const x = (t: number) => x0 + t * a.len;
  const across = (t: number, v: number) => (top(t) + bot(t)) / 2 + (v * (bot(t) - top(t))) / 2;
  const k = clamp(a.depth / 22, 0.6, 1.4);

  const N = 26;
  const ts = Array.from({ length: N + 1 }, (_, index) => (index / N) ** 1.6);
  const topPoints = ts.map(t => [x(t), top(t)] as [number, number]);
  const botPoints = ts.map(t => [x(t), bot(t)] as [number, number]);
  const body = `${line([...topPoints, ...botPoints.slice().reverse()])} Z`;

  const fin = ([from, to, height, style = "tri"]: Fin, side: "top" | "bot"): Shape => {
    const steps = style === "spiny" ? Math.max(6, Math.round((to - from) * 22) * 2) : 12;
    const base: Array<[number, number]> = [];
    const outer: Array<[number, number]> = [];
    for (let index = 0; index <= steps; index++) {
      const u = index / steps, t = from + (to - from) * u;
      const y = side === "top" ? top(t) + 0.8 : bot(t) - 0.8;
      let f: number, sweep = 0;
      if (style === "round") f = Math.sin(Math.PI * u) ** 0.7;
      else if (style === "long") f = Math.min(1, u / 0.12, (1 - u) / 0.12);
      else if (style === "spiny") { f = (index % 2 ? 0.55 : 1) * Math.min(u / 0.12 + 0.3, 1 - u * 0.45, (1 - u) / 0.15 + 0.2); sweep = 0.25; }
      else if (style === "sail") { f = u < 0.2 ? u / 0.2 : Math.max(0.12, 1 - (u - 0.2) * 1.1); sweep = 0.6; }
      else { f = u < 0.25 ? u / 0.25 : 1 - ((u - 0.25) / 0.75) * 0.9; sweep = 0.35; }
      base.push([x(t), y]);
      outer.push([x(t) + height * sweep * f, side === "top" ? y - height * f : y + height * f]);
    }
    return { d: `${line([...base, ...outer.reverse()])} Z`, fill: finColor, stroke: INK, width: 0.8 };
  };

  const tail = (): Shape | null => {
    if (a.tail === "none") return null;
    const yt = top(1) + 0.4, yb = bot(1) - 0.4, yc = (yt + yb) / 2, span = a.tailSpan ?? Math.max(a.depth * 0.42, 7);
    const X = (f: number) => x1 - 1 + tl * f;
    const paths: Record<Exclude<Tail, "none">, string> = {
      fork: `M ${P(x1 - 1, yt)} Q ${P(X(0.5), yc - span * 0.75)} ${P(X(1), yc - span)} Q ${P(X(0.62), yc - span * 0.3)} ${P(X(0.42), yc)} Q ${P(X(0.62), yc + span * 0.3)} ${P(X(1), yc + span)} Q ${P(X(0.5), yc + span * 0.75)} ${P(x1 - 1, yb)} Z`,
      deep: `M ${P(x1 - 1, yt)} Q ${P(X(0.45), yc - span * 0.8)} ${P(X(1), yc - span * 1.1)} Q ${P(X(0.45), yc - span * 0.35)} ${P(X(0.22), yc)} Q ${P(X(0.45), yc + span * 0.35)} ${P(X(1), yc + span * 1.1)} Q ${P(X(0.45), yc + span * 0.8)} ${P(x1 - 1, yb)} Z`,
      uneven: `M ${P(x1 - 1, yt)} Q ${P(X(0.5), yc - span * 0.9)} ${P(X(1.08), yc - span * 1.15)} Q ${P(X(0.55), yc - span * 0.3)} ${P(X(0.35), yc + span * 0.1)} Q ${P(X(0.55), yc + span * 0.35)} ${P(X(0.85), yc + span * 0.85)} Q ${P(X(0.45), yc + span * 0.7)} ${P(x1 - 1, yb)} Z`,
      round: `M ${P(x1 - 1, yt)} C ${P(X(0.6), yc - span * 1.1)} ${P(X(0.95), yc - span * 0.7)} ${P(X(0.95), yc)} C ${P(X(0.95), yc + span * 0.7)} ${P(X(0.6), yc + span * 1.1)} ${P(x1 - 1, yb)} Z`,
      lunate: `M ${P(x1 - 1, yt)} Q ${P(X(0.55), yc - span * 0.5)} ${P(X(1), yc - span * 1.2)} Q ${P(X(0.7), yc - span * 0.35)} ${P(X(0.55), yc)} Q ${P(X(0.7), yc + span * 0.35)} ${P(X(1), yc + span * 1.2)} Q ${P(X(0.55), yc + span * 0.5)} ${P(x1 - 1, yb)} Z`,
      rhomb: `M ${P(x1 - 1, yt)} L ${P(X(0.55), yc - span * 0.85)} L ${P(X(1), yc)} L ${P(X(0.55), yc + span * 0.85)} L ${P(x1 - 1, yb)} Z`,
      tri: `M ${P(x1 - 1, yt)} L ${P(X(0.95), yc - span)} L ${P(X(0.55), yc - span * 0.25)} L ${P(X(0.9), yc)} L ${P(X(0.55), yc + span * 0.25)} L ${P(X(0.95), yc + span)} L ${P(x1 - 1, yb)} Z`,
    };
    return { d: paths[a.tail], fill: finColor, stroke: INK, width: 0.8 };
  };

  const shapes: Shape[] = [];
  const add = (shape: Shape | null | undefined) => { if (shape) shapes.push(shape); };

  // Fins sit behind the body.
  add(tail());
  a.dorsal?.forEach(item => add(fin(item, "top")));
  if (a.adipose) add(fin(a.adipose, "top"));
  a.anal?.forEach(item => add(fin(item, "bot")));
  if (a.pelvic !== false) add(fin([0.4, 0.48, a.depth * 0.22, "tri"], "bot"));

  if (a.beak) {
    const ny = centre(0);
    add({ d: `M ${P(x0 + 1, ny - 1.6)} L ${P(x0 - beak, ny - 0.2)} L ${P(x0 + 1, ny + 1.4)} Z`, fill: backColor, stroke: INK, width: 0.7 });
    add({ d: line([[x0 - beak + 1, ny - 0.1], [x0 + 1, ny]]), stroke: INK, width: 0.5 });
  }

  // Body: belly colour, then the darker back, then markings clipped to the body.
  add({ d: body, fill: bellyColor, alpha: a.ghost ? 0.6 : undefined });
  const split = a.split ?? -0.08;
  add({ d: `${line([...topPoints, ...ts.slice().reverse().map(t => [x(t), across(t, split)] as [number, number])])} Z`, fill: backColor, alpha: a.ghost ? 0.55 : undefined });

  for (const mark of a.marks ?? []) {
    if (mark.type === "spot") {
      if (mark.ring) add({ d: circle(P, s, x(mark.t), across(mark.t, mark.v), mark.r * 1.45), fill: mark.ring, clip: body });
      add({ d: circle(P, s, x(mark.t), across(mark.t, mark.v), mark.r), fill: mark.color, clip: body });
    } else if (mark.type === "stripe") {
      const from = mark.from ?? 0.12, to = mark.to ?? 1;
      const span = Array.from({ length: 21 }, (_, index) => from + ((to - from) * index) / 20);
      add({ d: `${line([...span.map(t => [x(t), across(t, mark.v) - mark.w / 2] as [number, number]), ...span.reverse().map(t => [x(t), across(t, mark.v) + mark.w / 2] as [number, number])])} Z`, fill: mark.color, alpha: mark.alpha, clip: body });
    } else if (mark.type === "bars") {
      for (const t of mark.at) {
        const cx = x(t), y0 = top(t) - 6, y1 = bot(t) + 6, slant = (mark.slant ?? 0) * (y1 - y0), w = mark.w / 2;
        const d = mark.wavy
          ? `M ${P(cx - w + slant / 2, y0)} Q ${P(cx + w * 2.2, (y0 * 2 + y1) / 3)} ${P(cx - w, (y0 + y1) / 2)} Q ${P(cx - w * 3, (y0 + y1 * 2) / 3)} ${P(cx - w - slant / 2, y1)} L ${P(cx + w - slant / 2, y1)} Q ${P(cx - w * 1.2, (y0 + y1 * 2) / 3)} ${P(cx + w, (y0 + y1) / 2)} Q ${P(cx + w * 4, (y0 * 2 + y1) / 3)} ${P(cx + w + slant / 2, y0)} Z`
          : `M ${P(cx - w + slant / 2, y0)} L ${P(cx + w + slant / 2, y0)} L ${P(cx + w - slant / 2, y1)} L ${P(cx - w - slant / 2, y1)} Z`;
        add({ d, fill: mark.color, alpha: mark.alpha, clip: body });
      }
    } else if (mark.type === "blotch") {
      for (const [t, v, r] of mark.at) {
        const cx = x(t), cy = across(t, v);
        add({ d: `M ${P(cx - r, cy)} Q ${P(cx - r * 0.9, cy - r * 1.1)} ${P(cx + r * 0.2, cy - r * 0.95)} Q ${P(cx + r * 1.3, cy - r * 0.8)} ${P(cx + r * 1.1, cy + r * 0.1)} Q ${P(cx + r * 0.9, cy + r * 1.1)} ${P(cx - r * 0.1, cy + r * 0.9)} Q ${P(cx - r * 1.2, cy + r * 0.8)} ${P(cx - r, cy)} Z`, fill: mark.color, alpha: mark.alpha, clip: body });
      }
    } else if (mark.type === "zigzag") {
      const points = Array.from({ length: 23 }, (_, index) => { const t = 0.12 + index * 0.038; return [x(t), across(t, index % 2 ? -0.05 : -0.65)] as [number, number]; });
      add({ d: line(points), stroke: mark.color, width: 1.3, clip: body });
      add({ d: line(points.map(([px, py], index) => [px + 1.5, py + (index % 2 ? 0.55 : 0.4) * (bot(0.5) - top(0.5))] as [number, number])), stroke: mark.color, width: 0.9, clip: body });
    } else if (mark.type === "chevrons") {
      for (const t of mark.at) add({ d: line([[x(t + 0.03), top(t) - 1], [x(t - 0.02), across(t, -0.05)], [x(t + 0.03), across(t, 0.45)]]), stroke: mark.color, width: 2.2, clip: body });
    } else if (mark.type === "dots") {
      for (const v of mark.rows) for (let t = mark.from; t <= mark.to; t += mark.step) add({ d: circle(P, s, x(t), across(t, v), mark.r), fill: mark.color, clip: body });
    } else if (mark.type === "scales") {
      [-0.55, -0.2, 0.15, 0.5].forEach((v, row) => {
        for (let t = 0.26 + (row % 2) * 0.035; t < 0.95; t += 0.07) {
          const cx = x(t), cy = across(t, v), r = clamp((bot(t) - top(t)) * 0.09, 1, 2.6);
          add({ d: `M ${P(cx, cy - r)} Q ${P(cx + r * 1.3, cy)} ${P(cx, cy + r)}`, stroke: mark.color, width: 0.7, alpha: 0.75, clip: body });
        }
      });
    } else if (mark.type === "spine") {
      add({ d: line(Array.from({ length: 11 }, (_, index) => { const t = 0.22 + index * 0.075; return [x(t), across(t, 0)] as [number, number]; })), stroke: mark.color, width: 1, clip: body });
      for (let t = 0.26; t < 0.95; t += 0.06) {
        add({ d: line([[x(t) - 1.6, across(t, -0.75)], [x(t), across(t, 0)], [x(t) - 1.6, across(t, 0.7)]]), stroke: mark.color, width: 0.5, alpha: 0.8, clip: body });
      }
    } else if (mark.type === "finspot" && a.dorsal?.[0]) {
      const [from, to, height] = a.dorsal[0], t = from + (to - from) * 0.3;
      add({ d: circle(P, s, x(t) + height * 0.15, top(t) - height * 0.35, height * 0.18), fill: mark.color });
    }
  }

  add({ d: body, stroke: INK, width: 0.9 });

  const gt = a.gill ?? 0.2;
  add({ d: `M ${P(x(gt), top(gt) + 1.2)} Q ${P(x(gt) + 3.5 * k, across(gt, 0))} ${P(x(gt), bot(gt) - 1.2)}`, stroke: INK, width: 0.7, alpha: 0.75 });
  if (a.pectoral !== false) {
    const px = x(0.25), py = across(0.25, 0.25);
    add({ d: `M ${P(px, py)} Q ${P(px + 5 * k, py - 3 * k)} ${P(px + 11 * k, py + k)} Q ${P(px + 5 * k, py + 4 * k)} ${P(px, py)} Z`, fill: finColor, stroke: INK, width: 0.7 });
  }

  // Mouth, teeth, eye.
  const ny = centre(0), ml = a.mouthLen ?? 3;
  add({ d: line([[x0 + 0.4, ny + 0.2], [x0 + ml, ny + ml * 0.2]]), stroke: INK, width: 0.8 });
  if (a.teeth) for (let index = 1; index < 5; index++) add({ d: line([[x0 + (ml * index) / 5, ny + (ml * index) / 25], [x0 + (ml * index) / 5 + 0.3, ny + (ml * index) / 25 + 1.3]]), stroke: "#ffffff", width: 0.7 });
  const et = a.eye ?? 0.075, eyeR = clamp(a.depth * 0.085, 1.5, 3.2), ex = x(et) + (a.beak ? 1 : 0), ey = top(et) + (bot(et) - top(et)) * 0.36;
  add({ d: circle(P, s, ex, ey, eyeR), fill: "#ffffff", stroke: INK, width: 0.6 });
  add({ d: circle(P, s, ex + eyeR * 0.1, ey, eyeR * 0.55), fill: INK });

  a.barbels?.forEach((length, index) => {
    const ox = x0 + 1.4, oy = ny + 0.6 + index * 0.3;
    add({ d: `M ${P(ox, oy)} Q ${P(ox + length * 0.45, oy + 1.6 + index * 1.8)} ${P(ox + length * 0.95, oy + 3.5 + index * 3)}`, stroke: INK, width: 0.7 });
  });

  if (a.threads === "pectoral") {
    const px = x(0.25), py = across(0.25, 0.8);
    for (let index = 0; index < 4; index++) add({ d: `M ${P(px, py)} Q ${P(px + 5 + index * 2, py + 6 + index)} ${P(px + 13 + index * 4, py + 7 + index * 1.4)}`, stroke: INK, width: 0.6 });
  } else if (a.threads === "pelvic") {
    const px = x(0.3), py = bot(0.3) - 0.5;
    add({ d: `M ${P(px, py)} Q ${P(px + 14, py + 9)} ${P(px + 34, py + 7)}`, stroke: "#c96d2e", width: 1.1 });
  } else if (a.threads === "tail") {
    const yc = (top(1) + bot(1)) / 2, span = a.tailSpan ?? Math.max(a.depth * 0.42, 7);
    add({ d: `M ${P(x1 + tl * 1.05, yc - span * 1.05)} L ${P(x1 + tl * 1.35, yc - span * 1.3)} M ${P(x1 + tl * 1.05, yc + span * 1.05)} L ${P(x1 + tl * 1.35, yc + span * 1.3)}`, stroke: INK, width: 0.7 });
  }
  return shapes;
}

/** Prawns are drawn from a curved centre line instead of a fish body. */
function prawnShapes(kind: "golda" | "bagda"): Shape[] {
  const golda = kind === "golda";
  const P = (x: number, y: number) => `${round(x)} ${round(y)}`;
  const line = (points: Array<[number, number]>) => points.map(([x, y], index) => `${index ? "L" : "M"} ${P(x, y)}`).join(" ");
  const startX = golda ? 34 : 22, length = golda ? 66 : 76;
  const cx = (t: number) => startX + length * t;
  const cy = (t: number) => (golda ? 24 : 26) + 12 * t * t;
  const half = (t: number) => t < 0.12 ? 8 * Math.sqrt(t / 0.12) : 8 - 4.6 * ((t - 0.12) / 0.88) ** 1.2;
  const top = (t: number) => cy(t) - half(t) * 1.05, bot = (t: number) => cy(t) + half(t) * 0.95;
  const ts = Array.from({ length: 33 }, (_, index) => (index / 32) ** 1.3);
  const body = `${line([...ts.map(t => [cx(t), top(t)] as [number, number]), ...ts.slice().reverse().map(t => [cx(t), bot(t)] as [number, number])])} Z`;
  const [shell, light, edge] = golda ? ["#8fa3b0", "#dde5ea", "#5d7584"] : ["#434a52", "#e8d58e", "#2c3238"];
  const shapes: Shape[] = [];
  const end: [number, number] = [cx(1), cy(1)];
  // Tail fan, legs and feelers behind the shell.
  shapes.push({ d: `M ${P(end[0] - 1, end[1] - 3)} L ${P(end[0] + 9, end[1] - 4)} Q ${P(end[0] + 13, end[1] + 2)} ${P(end[0] + 8, end[1] + 9)} L ${P(end[0] - 1, end[1] + 3)} Z`, fill: golda ? "#7f95a3" : "#3d5f8a", stroke: INK, width: 0.8 });
  shapes.push({ d: `M ${P(end[0] + 1, end[1])} L ${P(end[0] + 10, end[1] + 2)}`, stroke: INK, width: 0.5 });
  for (let t = 0.16; t <= 0.36; t += 0.05) shapes.push({ d: line([[cx(t), bot(t) - 1], [cx(t) - 2, bot(t) + 5], [cx(t) - 3.5, bot(t) + 7]]), stroke: INK, width: 0.7 });
  for (let t = 0.46; t <= 0.86; t += 0.1) shapes.push({ d: line([[cx(t), bot(t) - 0.5], [cx(t) - 1.5, bot(t) + 3]]), stroke: INK, width: 0.6 });
  shapes.push({ d: `M ${P(cx(0.04), cy(0.04) - 2)} Q ${P(cx(0.3), cy(0) - 26)} ${P(cx(0.95), cy(0) - 18)}`, stroke: INK, width: 0.6 });
  shapes.push({ d: `M ${P(cx(0.04), cy(0.04) - 1)} Q ${P(cx(0.4), cy(0) - 20)} ${P(cx(1.05), cy(0) - 9)}`, stroke: INK, width: 0.6 });
  shapes.push({ d: `M ${P(cx(0.02), cy(0.02) - 1)} Q ${P(cx(0) - 8, cy(0) - 8)} ${P(cx(0) - 14, cy(0) - 9)}`, stroke: INK, width: 0.5 });
  if (golda) {
    // The two long blue claws are what tells a গলদা from a বাগদা at a glance.
    for (const [ex, ey] of [[7, 41], [4, 49]] as const) {
      const sx = cx(0.2), sy = bot(0.2) - 1;
      const mx = (sx + ex) / 2, my = Math.max(sy, ey) + 2;
      shapes.push({ d: `M ${P(sx, sy)} Q ${P(mx, my)} ${P(ex + 6, ey)}`, stroke: "#22508f", width: 3.2 });
      shapes.push({ d: `M ${P(sx, sy)} Q ${P(mx, my)} ${P(ex + 6, ey)}`, stroke: "#3d78c8", width: 1.8 });
      shapes.push({ d: `M ${P(ex + 6, ey)} L ${P(ex, ey - 2.5)} M ${P(ex + 6, ey)} L ${P(ex, ey + 1.5)}`, stroke: "#22508f", width: 1.6 });
    }
  }
  shapes.push({ d: body, fill: shell });
  shapes.push({ d: `${line([...ts.map(t => [cx(t), top(t)] as [number, number]), ...ts.slice().reverse().map(t => [cx(t), cy(t) - half(t) * 0.25] as [number, number])])} Z`, fill: golda ? "#7d93a2" : shell });
  if (!golda) for (const t of [0.2, 0.33, 0.46, 0.56, 0.66, 0.76, 0.86]) shapes.push({ d: `M ${P(cx(t) - 1.4, top(t) - 3)} L ${P(cx(t) + 1.4, top(t) - 3)} L ${P(cx(t) + 1.4, bot(t) + 3)} L ${P(cx(t) - 1.4, bot(t) + 3)} Z`, fill: light, clip: body });
  for (const t of [0.4, 0.5, 0.6, 0.7, 0.8, 0.9]) shapes.push({ d: `M ${P(cx(t), top(t))} Q ${P(cx(t) + 1.6, cy(t))} ${P(cx(t), bot(t))}`, stroke: edge, width: 0.6, clip: body });
  shapes.push({ d: `M ${P(cx(0.05), top(0.05) + 0.5)} Q ${P(cx(0.22), cy(0.2))} ${P(cx(0.38), top(0.38) + 0.3)}`, stroke: edge, width: 0.6, alpha: 0.8 });
  shapes.push({ d: body, stroke: INK, width: 0.9 });
  // Rostrum with its little teeth, and the stalked eye.
  const rx = cx(0), ry = cy(0);
  shapes.push({ d: `M ${P(cx(0.08), top(0.08) + 1)} L ${P(rx - 10, ry - 5)} L ${P(rx - 7, ry - 3.4)} L ${P(rx - 5, ry - 4.4)} L ${P(rx - 3, ry - 2.6)} L ${P(cx(0.13), top(0.13) + 2)} Z`, fill: golda ? "#7d93a2" : "#59616a", stroke: INK, width: 0.7 });
  shapes.push({ d: circle(P, 1, cx(0.09), cy(0.09) - 2.4, 1.7), fill: INK });
  return shapes;
}

const SILVER: [string, string, string] = ["#71879a", "#eef2f4", "#c3ccd4"];

const arts: Record<Exclude<FishId, "golda" | "bagda" | "kachki">, Art> = {
  // নদী
  ilish: { len: 82, depth: 30, peak: 0.42, blunt: 0.6, tail: "deep", tailLen: 20, colors: ["#5e6b9c", "#f1f2f7", "#c1c7d9"], split: -0.15, dorsal: [[0.42, 0.55, 8]], anal: [[0.66, 0.84, 3, "long"]], marks: [{ type: "stripe", v: 0.05, w: 3, color: "#d9bfd6", alpha: 0.7 }] },
  air: { len: 84, depth: 18, peak: 0.3, back: 0.56, blunt: 0.45, tail: "uneven", colors: ["#575b62", "#e7e4df", "#7f8287"], dorsal: [[0.28, 0.36, 9]], adipose: [0.6, 0.88, 3.5, "round"], anal: [[0.7, 0.82, 4]], barbels: [44, 30, 10, 8], marks: [{ type: "spot", t: 0.86, v: -0.8, r: 1.8, color: "#2a2d33" }] },
  boal: { len: 88, depth: 20, peak: 0.28, back: 0.45, blunt: 0.6, mouth: 1, tail: "uneven", tailLen: 16, colors: ["#5a6570", "#efe9ea", "#a3a9ae"], dorsal: [[0.27, 0.31, 6]], anal: [[0.4, 0.98, 4, "long"]], barbels: [26, 7], mouthLen: 11 },
  baghair: { len: 84, depth: 22, peak: 0.3, back: 0.52, blunt: 0.4, tail: "deep", tailLen: 18, colors: ["#8a7346", "#e6d6a8", "#7b6640"], dorsal: [[0.28, 0.36, 12]], adipose: [0.7, 0.8, 4, "round"], anal: [[0.72, 0.82, 5]], barbels: [14, 6], threads: "tail", marks: [{ type: "blotch", at: [[0.32, -0.3, 4.5], [0.55, -0.2, 5], [0.78, -0.15, 4], [0.45, 0.35, 3], [0.68, 0.4, 3]], color: "#4a3a22" }] },
  chitol: { len: 92, depth: 26, peak: 0.34, back: 0.42, blunt: 0.6, hump: 6, ped: 3, tail: "round", tailLen: 9, tailSpan: 5, colors: ["#6f7c88", "#eff1f3", "#c7ccd2"], dorsal: [[0.46, 0.53, 6, "round"]], anal: [[0.38, 1, 7, "long"]], pelvic: false, marks: [0.56, 0.65, 0.74, 0.83, 0.91].map(t => ({ type: "spot" as const, t, v: 0.4, r: 2.4, color: "#2c3138", ring: "#ffffff" })) },
  foli: { len: 86, depth: 22, peak: 0.36, back: 0.45, blunt: 0.62, hump: 2, ped: 3, tail: "round", tailLen: 8, tailSpan: 4.5, colors: ["#8c7b60", "#ddd2bd", "#ab9a7e"], dorsal: [[0.45, 0.52, 5, "round"]], anal: [[0.4, 1, 6, "long"]], pelvic: false },
  baim: { len: 104, depth: 10, peak: 0.45, blunt: 0.9, ped: 3, tail: "round", tailLen: 6, tailSpan: 3.5, colors: ["#6b5036", "#d0b089", "#7f6244"], dorsal: [[0.4, 1, 2.8, "long"]], anal: [[0.62, 1, 2.6, "long"]], pelvic: false, pectoral: false, beak: 5, eye: 0.04, marks: [{ type: "zigzag", color: "#3b2a1a" }] },
  bele: { len: 82, depth: 16, peak: 0.28, blunt: 0.75, mouth: -0.5, tail: "round", tailLen: 14, colors: ["#a88f66", "#ede2ca", "#b9a582"], dorsal: [[0.32, 0.42, 8], [0.5, 0.76, 6, "long"]], anal: [[0.55, 0.78, 4, "long"]], mouthLen: 5, marks: [{ type: "blotch", at: [[0.32, 0.05, 2.6], [0.47, 0.1, 2.6], [0.62, 0.05, 2.6], [0.77, 0.1, 2.4], [0.92, 0.05, 2.2]], color: "#5c4a30" }] },
  kakila: { len: 82, depth: 9, peak: 0.5, blunt: 0.8, tail: "fork", tailLen: 10, tailSpan: 4.5, beak: 20, colors: ["#5b7d5b", "#e6eee3", "#9fb59b"], dorsal: [[0.72, 0.88, 4]], anal: [[0.7, 0.88, 4]], pelvic: false, marks: [{ type: "stripe", v: 0.05, w: 1.4, color: "#2f4430", from: 0.15 }] },
  // পুকুর-বিল
  rui: { len: 80, depth: 28, peak: 0.42, blunt: 0.62, mouth: 1, tail: "fork", colors: ["#5d6b70", "#f3e7df", "#d97b66"], dorsal: [[0.38, 0.55, 9]], anal: [[0.72, 0.84, 6]], marks: [{ type: "scales", color: "#d26b57" }] },
  katla: { len: 80, depth: 32, peak: 0.46, back: 0.55, blunt: 0.5, mouth: -3.5, tail: "fork", colors: ["#4c565b", "#e3e5e1", "#6e777b"], dorsal: [[0.42, 0.58, 10]], anal: [[0.72, 0.84, 6]], mouthLen: 5, eye: 0.12, gill: 0.3, marks: [{ type: "scales", color: "#8e979b" }] },
  mrigel: { len: 84, depth: 20, peak: 0.42, blunt: 0.7, mouth: 1.5, tail: "fork", colors: ["#7f8d89", "#f4f4ef", "#e7a253"], dorsal: [[0.38, 0.52, 8]], anal: [[0.72, 0.84, 5]] },
  kalbaush: { len: 80, depth: 26, peak: 0.42, blunt: 0.62, mouth: 1.5, tail: "fork", colors: ["#2b2c30", "#55505a", "#4a3238"], dorsal: [[0.36, 0.56, 10]], anal: [[0.72, 0.84, 6]], marks: [{ type: "scales", color: "#7a6d72" }] },
  pangash: { len: 82, depth: 22, peak: 0.33, back: 0.48, blunt: 0.55, tail: "deep", tailLen: 18, colors: ["#3f4b56", "#f4f5f6", "#57626c"], split: 0, dorsal: [[0.3, 0.38, 11]], adipose: [0.72, 0.78, 3, "round"], anal: [[0.56, 0.86, 4, "long"]], barbels: [7, 4] },
  telapia: { len: 74, depth: 32, peak: 0.45, blunt: 0.6, tail: "round", tailLen: 16, colors: ["#555f69", "#ded6d2", "#c98884"], dorsal: [[0.25, 0.92, 6, "spiny"]], anal: [[0.62, 0.9, 6, "long"]], marks: [{ type: "bars", at: [0.36, 0.5, 0.64, 0.78, 0.92], w: 3, color: "#3a414a", alpha: 0.55 }] },
  koi: { len: 70, depth: 24, peak: 0.42, blunt: 0.62, tail: "round", tailLen: 15, colors: ["#5f6c3c", "#dccb8a", "#8a8352"], dorsal: [[0.28, 0.92, 6, "spiny"]], anal: [[0.58, 0.92, 6, "spiny"]], marks: [{ type: "spot", t: 0.97, v: -0.05, r: 2.4, color: "#2e3320" }, { type: "spot", t: 0.27, v: -0.35, r: 1.8, color: "#2e3320" }] },
  shing: { len: 94, depth: 14, peak: 0.28, back: 0.52, blunt: 0.5, tail: "round", tailLen: 10, tailSpan: 6, colors: ["#3a2c3b", "#5d4a5c", "#3a2c3b"], dorsal: [[0.33, 0.38, 4, "round"]], anal: [[0.45, 0.97, 4, "long"]], barbels: [16, 13, 9, 8], marks: [{ type: "stripe", v: -0.35, w: 1, color: "#b9a46a", alpha: 0.75, from: 0.2, to: 0.95 }, { type: "stripe", v: 0.25, w: 1, color: "#b9a46a", alpha: 0.75, from: 0.2, to: 0.95 }] },
  magur: { len: 92, depth: 15, peak: 0.28, back: 0.55, blunt: 0.38, tail: "round", tailLen: 10, tailSpan: 6, colors: ["#5a5145", "#a5987f", "#4c443a"], dorsal: [[0.27, 0.98, 4.5, "long"]], anal: [[0.47, 0.98, 4, "long"]], barbels: [15, 12, 8, 7], marks: [{ type: "dots", rows: [-0.1, 0.35], from: 0.3, to: 0.95, step: 0.09, r: 0.6, color: "#e6dcc6" }] },
  shol: { len: 92, depth: 18, peak: 0.45, blunt: 0.62, tail: "round", tailLen: 12, tailSpan: 7, colors: ["#4b4a38", "#e8dfc6", "#5c5847"], dorsal: [[0.3, 0.97, 5, "long"]], anal: [[0.5, 0.97, 4, "long"]], mouthLen: 4, marks: [{ type: "chevrons", at: [0.3, 0.42, 0.54, 0.66, 0.78, 0.9], color: "#2c2b20" }] },
  taki: { len: 78, depth: 18, peak: 0.4, blunt: 0.6, tail: "round", tailLen: 13, tailSpan: 7, colors: ["#3f4334", "#b8b298", "#4b4d3c"], dorsal: [[0.32, 0.97, 5, "long"]], anal: [[0.52, 0.97, 4, "long"]], marks: [{ type: "bars", at: [0.35, 0.5, 0.65, 0.8], w: 2.6, color: "#23261c", alpha: 0.6, slant: -0.2 }, { type: "dots", rows: [-0.4, 0.3], from: 0.28, to: 0.95, step: 0.07, r: 0.7, color: "#1f2219" }] },
  pabda: { len: 84, depth: 22, peak: 0.3, back: 0.4, blunt: 0.6, tail: "fork", tailLen: 16, colors: ["#9d93a2", "#f4eeeb", "#d9cbc8"], dorsal: [[0.3, 0.34, 5]], anal: [[0.4, 0.97, 5, "long"]], barbels: [11, 5], marks: [{ type: "spot", t: 0.27, v: -0.5, r: 2.6, color: "#24242c" }, { type: "stripe", v: 0, w: 1.2, color: "#ffffff", alpha: 0.7, from: 0.2 }] },
  // সাগর
  rupchanda: { len: 66, depth: 44, peak: 0.45, blunt: 0.9, ped: 6, tail: "deep", tailLen: 16, tailSpan: 11, colors: ["#a6b0b9", "#f0f3f5", "#c7ced4"], split: -0.3, dorsal: [[0.45, 0.85, 8, "sail"]], anal: [[0.45, 0.85, 8, "sail"]], pelvic: false, eye: 0.13, mouthLen: 1.6, marks: [{ type: "dots", rows: [-0.5, -0.15, 0.2, 0.5], from: 0.25, to: 0.9, step: 0.08, r: 0.6, color: "#ffffff" }] },
  loitta: { len: 84, depth: 20, peak: 0.35, blunt: 0.5, tail: "tri", tailLen: 18, colors: ["#d9c3bf", "#f8f0ee", "#e8d5d1"], dorsal: [[0.36, 0.46, 9]], adipose: [0.75, 0.8, 3, "round"], anal: [[0.72, 0.82, 4]], mouthLen: 11, teeth: true, eye: 0.09 },
  churi: { len: 112, depth: 12, peak: 0.18, blunt: 0.5, ped: 0.4, tail: "none", colors: ["#b3c0c9", "#f0f4f7", "#d5dee4"], dorsal: [[0.12, 1, 3, "long"]], pelvic: false, mouthLen: 6, teeth: true, mouth: 0.5 },
  koral: { len: 80, depth: 30, peak: 0.42, back: 0.52, blunt: 0.42, mouth: -1, tail: "round", tailLen: 15, colors: ["#6b7b6e", "#eaede6", "#8c998e"], dorsal: [[0.3, 0.56, 10, "spiny"], [0.58, 0.8, 8]], anal: [[0.62, 0.8, 7]], mouthLen: 9 },
  surma: { len: 88, depth: 20, peak: 0.42, blunt: 0.35, tail: "lunate", tailLen: 17, tailSpan: 10, colors: ["#3f607b", "#e8eef3", "#6f8ba1"], dorsal: [[0.28, 0.46, 6, "spiny"], [0.52, 0.6, 7]], anal: [[0.56, 0.64, 6]], mouthLen: 5, marks: [{ type: "bars", at: [0.38, 0.47, 0.56, 0.65, 0.74, 0.83], w: 1.3, color: "#2e4a62", wavy: true, alpha: 0.7 }, ...[0.68, 0.76, 0.84, 0.92].map(t => ({ type: "spot" as const, t, v: -1, r: 1, color: "#6f8ba1" })), ...[0.72, 0.8, 0.88].map(t => ({ type: "spot" as const, t, v: 1, r: 1, color: "#6f8ba1" }))] },
  poa: { len: 80, depth: 26, peak: 0.38, back: 0.56, blunt: 0.55, tail: "rhomb", tailLen: 16, colors: ["#a38c54", "#efe5c8", "#d1ad5d"], dorsal: [[0.3, 0.45, 9, "spiny"], [0.46, 0.86, 6, "long"]], anal: [[0.7, 0.8, 6]], mouthLen: 5 },
  lakkha: { len: 82, depth: 26, peak: 0.38, blunt: 0.75, mouth: 3, tail: "deep", tailLen: 22, tailSpan: 12, colors: ["#788790", "#f1f2ee", "#dcc37a"], dorsal: [[0.3, 0.42, 9], [0.56, 0.68, 8]], anal: [[0.6, 0.72, 7]], threads: "pectoral", mouthLen: 5, eye: 0.1 },
  // ছোট মাছ
  puti: { len: 64, depth: 26, peak: 0.42, blunt: 0.62, tail: "fork", tailLen: 18, colors: ["#8a9a88", "#f1f3ec", "#dda25c"], dorsal: [[0.38, 0.55, 10]], anal: [[0.7, 0.82, 6]], marks: [{ type: "spot", t: 0.95, v: 0, r: 3.2, color: "#23262a" }, { type: "finspot", color: "#23262a" }] },
  mola: { len: 70, depth: 16, peak: 0.4, blunt: 0.5, tail: "fork", tailLen: 16, colors: ["#97a5a3", "#f5f7f5", "#d3dad8"], dorsal: [[0.52, 0.62, 7]], anal: [[0.66, 0.84, 4, "long"]], marks: [{ type: "stripe", v: 0.02, w: 2.6, color: "#ffffff", alpha: 0.95, from: 0.2 }, { type: "stripe", v: -0.25, w: 0.7, color: "#5f6e6c", alpha: 0.6, from: 0.25 }] },
  dhela: { len: 64, depth: 28, peak: 0.4, back: 0.55, blunt: 0.6, tail: "fork", tailLen: 17, colors: ["#8c97a0", "#f2f3f4", "#c9cfd3"], dorsal: [[0.42, 0.55, 9]], anal: [[0.5, 0.92, 6, "long"]] },
  chapila: { len: 70, depth: 22, peak: 0.38, back: 0.45, blunt: 0.6, tail: "deep", tailLen: 18, colors: SILVER, dorsal: [[0.4, 0.5, 8]], anal: [[0.62, 0.86, 4, "long"]], marks: [{ type: "spot", t: 0.24, v: -0.5, r: 2.4, color: "#2c3742" }] },
  tengra: { len: 74, depth: 15, peak: 0.32, back: 0.55, blunt: 0.5, tail: "fork", tailLen: 15, colors: ["#7e7358", "#ebe3cf", "#a69a78"], dorsal: [[0.3, 0.38, 10]], adipose: [0.62, 0.84, 3, "round"], anal: [[0.7, 0.82, 4]], barbels: [26, 18, 8, 6], marks: [{ type: "stripe", v: -0.35, w: 1.6, color: "#3b3426", from: 0.22 }, { type: "stripe", v: 0.15, w: 1.3, color: "#3b3426", from: 0.22 }] },
  gulsha: { len: 76, depth: 16, peak: 0.32, back: 0.55, blunt: 0.5, tail: "fork", tailLen: 15, colors: ["#8d8c86", "#f0eeeb", "#b4b2aa"], dorsal: [[0.3, 0.38, 13]], adipose: [0.55, 0.86, 3.2, "round"], anal: [[0.7, 0.82, 4]], barbels: [32, 20, 9, 7], marks: [{ type: "finspot", color: "#2b2b2b" }] },
  kholisha: { len: 56, depth: 28, peak: 0.4, blunt: 0.72, tail: "round", tailLen: 15, colors: ["#6d7b52", "#e6ddb9", "#d98a4a"], dorsal: [[0.35, 0.9, 6, "long"]], anal: [[0.3, 0.92, 8, "long"]], pelvic: false, threads: "pelvic", marks: [{ type: "bars", at: [0.35, 0.5, 0.65, 0.8, 0.95], w: 2.2, color: "#d9733a", slant: 0.25, alpha: 0.85 }, { type: "bars", at: [0.43, 0.58, 0.73, 0.88], w: 1.4, color: "#4f7fa6", slant: 0.25, alpha: 0.75 }] },
  chanda: { len: 62, depth: 24, peak: 0.42, blunt: 0.6, tail: "fork", tailLen: 17, colors: ["#bccaca", "#eef4f4", "#d6e0e0"], ghost: true, dorsal: [[0.35, 0.5, 9, "spiny"], [0.52, 0.74, 7]], anal: [[0.55, 0.74, 6]], marks: [{ type: "spine", color: "#6d8585" }] },
  meni: { len: 68, depth: 26, peak: 0.4, blunt: 0.5, mouth: -1, tail: "round", tailLen: 15, colors: ["#6e6a45", "#d7cfa3", "#8a7f52"], dorsal: [[0.3, 0.86, 8, "spiny"]], anal: [[0.6, 0.86, 7, "round"]], mouthLen: 7, marks: [{ type: "blotch", at: [[0.35, -0.2, 4.5], [0.6, -0.1, 5], [0.85, 0, 3.5]], color: "#3f3c25", alpha: 0.7 }] },
};

const kachki: Art = { len: 44, depth: 9, peak: 0.4, blunt: 0.5, tail: "fork", tailLen: 9, tailSpan: 4, colors: ["#b9c6c8", "#f4f7f7", "#dbe3e4"], dorsal: [[0.48, 0.58, 4]], pelvic: false, pectoral: false, marks: [{ type: "stripe", v: 0.02, w: 1.6, color: "#ffffff", alpha: 0.9, from: 0.15 }] };

const cache = new Map<FishId, Shape[]>();

/** The drawing for a fish, in a 120×60 box facing left. */
export function fishArt(id: FishId): Shape[] {
  const saved = cache.get(id);
  if (saved) return saved;
  // কাচকি is always bought in a heap, so it is drawn as a little shoal.
  const shapes = id === "golda" || id === "bagda" ? prawnShapes(id)
    : id === "kachki" ? [{ dx: -6, dy: -10, s: 0.95 }, { dx: 14, dy: 4, s: 0.95 }, { dx: -14, dy: 14, s: 0.9 }].flatMap(place => fishShapes(kachki, place))
    : fishShapes(arts[id]);
  // Neighbouring pieces with the same paint become one path: fewer DOM nodes and a much lighter page.
  const merged: Shape[] = [];
  for (const shape of shapes) {
    const last = merged.at(-1);
    if (last && last.fill === shape.fill && last.stroke === shape.stroke && last.width === shape.width && last.clip === shape.clip && last.alpha === shape.alpha) merged[merged.length - 1] = { ...last, d: `${last.d} ${shape.d}` };
    else merged.push(shape);
  }
  cache.set(id, merged);
  return merged;
}

/** Paints a drawing on a canvas with its box's top-left at (x, y), `width` pixels wide. */
export function paintFish(context: CanvasRenderingContext2D, id: FishId, x: number, y: number, width: number) {
  const scale = width / ART_WIDTH;
  context.save();
  context.translate(x, y);
  context.scale(scale, scale);
  context.lineJoin = "round";
  context.lineCap = "round";
  for (const shape of fishArt(id)) {
    const path = new Path2D(shape.d);
    context.save();
    if (shape.clip) context.clip(new Path2D(shape.clip));
    context.globalAlpha = shape.alpha ?? 1;
    if (shape.fill) { context.fillStyle = shape.fill; context.fill(path); }
    if (shape.stroke) { context.strokeStyle = shape.stroke; context.lineWidth = shape.width ?? 1; context.stroke(path); }
    context.restore();
  }
  context.restore();
}
