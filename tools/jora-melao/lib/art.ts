// The fair-stall toys as plain SVG paths on a 64×64 box: the cards draw them as <svg>, the share card as Path2D.
import type { ToyId } from "./game";

/** One shape: an SVG path filled, stroked (round caps), or both. */
export type Part = { d: string; fill?: string; stroke?: string; width?: number };
export type ToyArt = { name: string; tint: string; parts: Part[] };

const circle = (cx: number, cy: number, r: number) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
const ellipse = (cx: number, cy: number, rx: number, ry: number) => `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`;
const WOOD = "#7a4b1f", BAMBOO = "#d9a441";

export const ART: Record<ToyId, ToyArt> = {
  belun: { name: "বেলুন", tint: "#dff1fb", parts: [
    { d: "M32 46C27 51 37 55 31 62", stroke: "#6b5b4b", width: 1.6 },
    { d: "M28.5 47.5h7L32 42.5Z", fill: "#b02525" },
    { d: ellipse(32, 25, 15, 18), fill: "#e03131" },
    { d: "M24 14.5C21 18 20.5 23 22.5 27", stroke: "#ffffffb8", width: 3 },
  ] },
  ghuri: { name: "ঘুড়ি", tint: "#fff6cc", parts: [
    { d: "M32 50C27 54 37 57 31 63", stroke: "#e03131", width: 1.8 },
    { d: "M27 55.5l-3.5-2.5v5ZM35.5 59.5l3.5-2.5v5Z", fill: "#e03131" },
    { d: "M32 5L53 27H11Z", fill: "#2f9e44" },
    { d: "M11 27H53L32 50Z", fill: "#fcc419" },
    { d: "M32 5V50M11 27Q32 14 53 27", stroke: "#5c3d1e", width: 1.4 },
  ] },
  latim: { name: "লাটিম", tint: "#ffe8cc", parts: [
    { d: "M32 50V60", stroke: "#495057", width: 2.6 },
    { d: "M13 25C13 14 51 14 51 25C51 35 40 44 32 52C24 44 13 35 13 25Z", fill: "#f76707" },
    { d: "M14 27C24 32 40 32 50 27M19 37C27 41 37 41 45 37", stroke: "#ffe066", width: 2.6 },
    { d: ellipse(32, 18, 9, 3.2), fill: "#c2410c" },
    { d: "M29 9h6v9h-6Z", fill: WOOD },
  ] },
  bansi: { name: "বাঁশি", tint: "#e6f5dc", parts: [
    { d: "M12 52C8 56 10 60 6 62M12 52C12 57 15 59 13 63", stroke: "#e03131", width: 2 },
    { d: "M12 52L52 12", stroke: BAMBOO, width: 9 },
    { d: "M11 49L49 11", stroke: "#f5d98b", width: 2 },
    { d: "M20 37.6L26.4 44M44 13.6L50.4 20", stroke: "#a8742a", width: 1.6 },
    { d: [circle(18, 46, 1.7), circle(28, 36, 1.6), circle(32.8, 31.2, 1.6), circle(37.6, 26.4, 1.6), circle(42.4, 21.6, 1.6)].join(""), fill: "#4a3015" },
  ] },
  ektara: { name: "একতারা", tint: "#efe9fb", parts: [
    { d: "M24 41L29.5 7M40 41L34.5 7", stroke: "#c9a063", width: 4 },
    { d: "M26 10.5H38", stroke: WOOD, width: 3 },
    { d: circle(32, 47, 13), fill: "#8a4f22" },
    { d: "M20.5 43C27 47.5 37 47.5 43.5 43", stroke: "#e8b04a", width: 2.2 },
    { d: "M32 10V58", stroke: "#fdfbf5", width: 1.1 },
    { d: circle(32, 7.5, 2.4), fill: WOOD },
  ] },
  putul: { name: "মাটির পুতুল", tint: "#fff0f3", parts: [
    { d: "M24 36L16 44M40 36L48 44", stroke: "#d0582e", width: 5 },
    { d: "M18 58C20 40 26 28 32 28C38 28 44 40 46 58Z", fill: "#d0582e" },
    { d: circle(32, 19, 9), fill: "#d0582e" },
    { d: "M23 18C23.5 10 40.5 10 41 18C38 14.5 26 14.5 23 18Z", fill: "#3b2a20" },
    { d: circle(32, 9.5, 3.4), fill: "#3b2a20" },
    { d: circle(28.8, 20, 1.3) + circle(35.2, 20, 1.3), fill: "#3b2a20" },
    { d: "M21 50.5C28 46.5 36 46.5 43 50.5", stroke: "#fff3e0", width: 2.2 },
    { d: circle(27, 40, 1.5) + circle(37, 40, 1.5) + circle(32, 36, 1.5) + circle(32, 43, 1.5), fill: "#fff3e0" },
  ] },
  tomtom: { name: "টমটম গাড়ি", tint: "#e3faf1", parts: [
    { d: "M43 33L60 7", stroke: "#c9a063", width: 3.2 },
    { d: "M24 22L20 14M36 22L40 14", stroke: WOOD, width: 1.8 },
    { d: circle(20, 13.5, 2.2) + circle(40, 13.5, 2.2), fill: "#e03131" },
    { d: "M17 24H43V39a2 2 0 0 1-2 2H19a2 2 0 0 1-2-2Z", fill: "#1971c2" },
    { d: "M18 33l4-4l4 4l4-4l4 4l4-4l4 4", stroke: "#ffffff", width: 1.6 },
    { d: ellipse(30, 24, 13, 3.6), fill: "#f1e3c6", stroke: "#0f4c8a", width: 1.4 },
    { d: "M14 47H46", stroke: "#5c3d1e", width: 2 },
    { d: circle(16, 47, 8) + circle(44, 47, 8), fill: "#fcc419", stroke: WOOD, width: 2 },
    { d: circle(16, 47, 2.2) + circle(44, 47, 2.2), fill: WOOD },
  ] },
  jhunjhuni: { name: "ঝুনঝুনি", tint: "#fff4e0", parts: [
    { d: "M32 36V59", stroke: "#7048e8", width: 6.5 },
    { d: "M28.5 46H35.5M28.5 53H35.5", stroke: "#d0bfff", width: 2 },
    { d: circle(32, 22, 14), fill: "#7048e8" },
    { d: circle(32, 22, 7.5), fill: "#f3f0ff" },
    { d: circle(32, 22, 3), fill: "#7048e8" },
    { d: [circle(21.4, 11.4, 3), circle(42.6, 11.4, 3), circle(21.4, 32.6, 3), circle(42.6, 32.6, 3)].join(""), fill: "#fab005", stroke: "#a5680a", width: 1 },
  ] },
  charki: { name: "চরকি", tint: "#e3f6fb", parts: [
    { d: "M32 27V62", stroke: "#8d6e4f", width: 3 },
    { d: "M32 26L32 6C41 6 46 13 32 26ZM32 26L32 46C23 46 18 39 32 26Z", fill: "#e64980" },
    { d: "M32 26L52 26C52 35 45 40 32 26ZM32 26L12 26C12 17 19 12 32 26Z", fill: "#fcc419" },
    { d: circle(32, 26, 2.6), fill: "#2b8a3e" },
  ] },
  nouka: { name: "টিনের নৌকা", tint: "#fff5d6", parts: [
    { d: circle(47, 15, 2.6) + circle(50.5, 9.5, 2), fill: "#ced4da" },
    { d: "M43 21h5v17h-5Z", fill: "#495057" },
    { d: "M19 27h20v11H19Z", fill: "#f03e3e" },
    { d: circle(25, 32.5, 2.1) + circle(33, 32.5, 2.1), fill: "#fff9db" },
    { d: "M7 38H57L48.5 51H15.5Z", fill: "#0c8599" },
    { d: "M10.5 42.5H53.5", stroke: "#ffffff", width: 2 },
    { d: "M4 56C10 53 14 59 20 56S30 53 36 56S46 59 52 56S58 54 60 55", stroke: "#74c0fc", width: 1.8 },
  ] },
};

/** Draws a toy into a canvas, `size` pixels square with its top-left at (x, y). Browser only (Path2D). */
export function drawToy(context: CanvasRenderingContext2D, toy: ToyId, x: number, y: number, size: number) {
  context.save();
  context.translate(x, y);
  context.scale(size / 64, size / 64);
  context.lineCap = "round";
  context.lineJoin = "round";
  for (const part of ART[toy].parts) {
    const path = new Path2D(part.d);
    if (part.fill) { context.fillStyle = part.fill; context.fill(path); }
    if (part.stroke) { context.strokeStyle = part.stroke; context.lineWidth = part.width ?? 1.5; context.stroke(path); }
  }
  context.restore();
}
