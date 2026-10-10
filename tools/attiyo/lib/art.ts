import { generation, isMale, type Step } from "./kin";

// Silhouette prints for the family-album strip, drawn in a 60×72 box. The same paths go into the page's SVG and the card's Path2D.
export const PRINT = { width: 60, height: 72 } as const;

const shoulders = "M6 72c0-15 10-23 24-23s24 8 24 23Z";
const neck = "M26 42h8v9h-8Z";
const face = "M20 28a10 11.5 0 1 0 20 0a10 11.5 0 1 0 -20 0Z";
const shortHair = "M19.5 27c-1-9 4-14.5 10.5-14.5S41.5 18 40.5 27c-2-4-5-6-10.5-6.5c-5.5.5-8.5 2.5-10.5 6.5Z";
const longHair = "M17 30c0-12 5.5-18.5 13-18.5S43 18 43 30v18c-4-2-8.5-3-13-3s-9 1-13 3Z";
const fringe = "M20 25c1-7 5-10.5 10-10.5s9 3.5 10 10.5c-3-3-6-4.5-10-4.5s-7 1.5-10 4.5Z";
const bun = "M25 12a5 5 0 1 0 10 0a5 5 0 1 0 -10 0Z";
const meHead = "M19 27a11 11 0 1 0 22 0a11 11 0 1 0 -22 0Z";
/** Round spectacles on the grandparents' faces. */
const glasses = "M21.5 28a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0M31.5 28a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0M28.5 28h3";

export type Sex = "m" | "f" | "me";
export type Shape = { d: string; tone: "fg" | "face"; stroke?: boolean };
export type Print = { sex: Sex; gen: number; bg: string; fg: string; face: string; shapes: Shape[]; small: boolean };

/** Older generations come out in sepia, my own in black-and-white, the children in faded colour, like a real album. */
export function tones(gen: number, sex: Sex) {
  if (sex === "me") return { bg: "#f4e2a8", fg: "#a3324f", face: "#a3324f" };
  if (gen >= 2) return { bg: "#d8bd90", fg: "#5f4126", face: "#a5815a" };
  if (gen === 1) return { bg: "#e5d3b1", fg: "#6f5236", face: "#b39470" };
  if (gen === 0) return { bg: "#d7dcdd", fg: "#3f484c", face: "#8d979b" };
  if (gen === -1) return { bg: "#f1d5c8", fg: "#7e5044", face: "#c2948a" };
  return { bg: "#d2e5da", fg: "#41695a", face: "#8db2a0" };
}

export function printFor(prefix: readonly Step[]): Print {
  const last = prefix.at(-1);
  const sex: Sex = !last ? "me" : isMale(last) ? "m" : "f";
  const gen = generation(prefix);
  const old = sex !== "me" && gen >= 2;
  const fg = (d: string): Shape => ({ d, tone: "fg" });
  const skin = (d: string): Shape => ({ d, tone: "face" });
  const shapes: Shape[] = sex === "me" ? [fg(meHead), fg(shoulders)]
    : sex === "f" ? [...(old ? [fg(bun)] : []), fg(longHair), fg(shoulders), skin(neck), skin(face), fg(fringe)]
    : [fg(shoulders), skin(neck), skin(face), fg(shortHair)];
  if (old) shapes.push({ d: glasses, tone: "fg", stroke: true });
  return { sex, gen, ...tones(gen, sex), shapes, small: gen <= -1 };
}

/** Inline SVG for one print (decorative; the caption carries the meaning). */
export function printSvg(print: Print) {
  const body = print.shapes.map(shape => shape.stroke
    ? `<path d="${shape.d}" fill="none" stroke="${print.fg}" stroke-width="1.4"/>`
    : `<path d="${shape.d}" fill="${shape.tone === "fg" ? print.fg : print.face}"/>`).join("");
  const group = print.small ? `<g transform="translate(6 10) scale(0.8)">${body}</g>` : body;
  return `<svg viewBox="0 0 ${PRINT.width} ${PRINT.height}" aria-hidden="true" focusable="false"><rect width="60" height="72" fill="${print.bg}"/>${group}</svg>`;
}
