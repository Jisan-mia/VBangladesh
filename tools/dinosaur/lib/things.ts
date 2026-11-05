// What else lies in the sand besides bones: rocks the brush can't move, and three things that are not bones (a shell, a pebble, a leaf print).
// Original drawings as plain path data, in the same Shape format as art.ts, so the page and the parent card draw them the same way.
import { ellipse, type Shape } from "./art";

export type DecoyKind = "shell" | "pebble" | "leaf";
export const DECOY_KINDS: readonly DecoyKind[] = ["shell", "pebble", "leaf"];
export const DECOY_NAME: Record<DecoyKind, string> = { shell: "ঝিনুক", pebble: "নুড়ি", leaf: "পাতার ছাপ" };

const f = (n: number) => Math.round(n * 10) / 10;
const circle = (x: number, y: number, r: number) => ellipse([x, y, r, r, 0]);

/** A rock about r units across, centred on 0,0: a round grey body, a lighter top, a crack. */
export function rockShapes(r: number): Shape[] {
  return [
    { d: ellipse([0, r * 0.12, r * 1.02, r * 0.78, 0]), fill: "#00000022" },
    { d: ellipse([0, 0, r, r * 0.8, -8]), fill: "#8c8a86", stroke: "#5e5c58", width: 2 },
    { d: ellipse([-r * 0.18, -r * 0.22, r * 0.62, r * 0.4, -14]), fill: "#b3b0aa" },
    { d: `M${f(r * 0.1)} ${f(-r * 0.2)}L${f(r * 0.3)} ${f(r * 0.1)}L${f(r * 0.18)} ${f(r * 0.4)}`, stroke: "#5e5c58", width: 1.6 },
  ];
}

/** A shell, a pebble or a leaf print in a ~44×34 box around 0,0: round and plain, nothing like a bone. */
export function decoyShapes(kind: DecoyKind): Shape[] {
  if (kind === "shell") return [
    { d: "M-18 10Q-20 -14 2 -16Q22 -14 20 10Q0 16 -18 10Z", fill: "#f4cdb8", stroke: "#b5806a", width: 2 },
    ...[-9, 0, 9].map(x => ({ d: `M${x} 12Q${x * 0.9} -2 ${x * 0.3} -15`, stroke: "#c99580", width: 1.8 })),
    { d: circle(0, 12, 3.2), fill: "#b5806a" },
  ];
  if (kind === "pebble") return [
    { d: ellipse([0, 3, 17, 11, -10]), fill: "#9aa3a8", stroke: "#68737a", width: 2 },
    { d: ellipse([-5, -1, 8, 4, -14]), fill: "#c4cbcf" },
  ];
  return [
    { d: "M-18 8Q-14 -14 18 -12Q16 12 -18 8Z", fill: "#a8c58a", stroke: "#6d8f4e", width: 2 },
    { d: "M-14 6Q0 -2 14 -9", stroke: "#6d8f4e", width: 1.8 },
    ...[-4, 4, 11].map(x => ({ d: `M${x - 3} ${f(2 - (x + 14) * 0.45)}l4 -7`, stroke: "#6d8f4e", width: 1.4 })),
  ];
}

/** A little sparkle (four points) for a hint over a bone nobody has found yet. */
export const sparkleShape = (r: number): Shape => ({ d: `M0 ${-r}Q${f(r * 0.18)} ${f(-r * 0.18)} ${r} 0Q${f(r * 0.18)} ${f(r * 0.18)} 0 ${r}Q${f(-r * 0.18)} ${f(r * 0.18)} ${-r} 0Q${f(-r * 0.18)} ${f(-r * 0.18)} 0 ${-r}Z`, fill: "#fff6c9", stroke: "#e0a200", width: 1.4 });
