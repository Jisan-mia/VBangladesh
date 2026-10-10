import { towerRows } from "./hisab";

export type Ellipse = { cx: number; cy: number; rx: number; ry: number };
export type Cup = { body: string; rim: Ellipse; tea: Ellipse; band: string; row: number };
export type Box = { x: number; y: number; width: number; height: number };

/** One clay ভাঁড় standing on (cx, bottom): wide mouth, narrow rounded foot. The body is an SVG path so canvas can reuse it via Path2D. */
function cup(cx: number, bottom: number, width: number, row: number): Cup {
  const height = width * 0.82, top = bottom - height, mouth = width / 2, foot = width * 0.36;
  const r = (value: number) => Math.round(value * 10) / 10;
  const bandY = top + width * 0.2, bandHalf = mouth - (mouth - foot) * (width * 0.2 / height);
  return {
    body: `M${r(cx - mouth)} ${r(top)}L${r(cx + mouth)} ${r(top)}L${r(cx + foot)} ${r(bottom)}Q${r(cx)} ${r(bottom + width * 0.08)} ${r(cx - foot)} ${r(bottom)}Z`,
    rim: { cx: r(cx), cy: r(top), rx: r(mouth), ry: r(width * 0.13) },
    tea: { cx: r(cx), cy: r(top + width * 0.015), rx: r(mouth * 0.8), ry: r(width * 0.085) },
    band: `M${r(cx - bandHalf)} ${r(bandY)}Q${r(cx)} ${r(bandY + width * 0.1)} ${r(cx + bandHalf)} ${r(bandY)}`,
    row,
  };
}

/** Lays `count` cups out as a pyramid that fits inside `box`, bottom-centred, in drawing order (bottom row first). */
export function towerLayout(count: number, box: Box, maxWidth: number): Cup[] {
  const rows = towerRows(count);
  if (!rows.length) return [];
  const gap = 1.04;
  // Each cup sits on the rims below it; the step is a little less than a cup's height so they nest.
  const stepPerWidth = 0.82 - 0.06, tallPerWidth = (rows.length - 1) * stepPerWidth + 0.82 + 0.13;
  const width = Math.min(maxWidth, box.width / (rows[0] * gap), box.height / tallPerWidth);
  const centre = box.x + box.width / 2, floor = box.y + box.height;
  return rows.flatMap((inRow, row) => Array.from({ length: inRow }, (_, index) => cup(centre + (index - (inRow - 1) / 2) * width * gap, floor - row * stepPerWidth * width, width, row)));
}
