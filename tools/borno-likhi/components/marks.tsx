// SVG pieces for one letter in the 100×100 box, shared by the board and the print sheet:
// the faint guide letter in the site font, dotted strokes, numbered start dots and direction arrows.
import { bn } from "../lib/levels";
import { GLYPHS, arrowOf, faceOf, pathOf, type Stroke } from "../lib/strokes";

export function GuideLetter({ char, className = "bl-glyph" }: { char: string; className?: string }) {
  const [size, x, y] = GLYPHS[char].box;
  return <text className={className} x={x} y={y} fontSize={size} aria-hidden="true">{faceOf(char)}</text>;
}

export function StrokeLine({ stroke, className }: { stroke: Stroke; className: string }) {
  const [x, y] = stroke.line[0];
  return stroke.dot ? <circle className={`${className} bl-dot`} cx={x} cy={y} r={2.4} /> : <path className={className} d={pathOf(stroke.line)} />;
}

export function StartDot({ stroke, n, className = "bl-start" }: { stroke: Stroke; n: number; className?: string }) {
  const [x, y] = stroke.line[0];
  return <g className={className} aria-hidden="true">
    <circle cx={x} cy={y} r={4.6} />
    <text x={x} y={y + 2} textAnchor="middle">{bn(n)}</text>
  </g>;
}

export function Arrow({ stroke, className = "bl-arrow" }: { stroke: Stroke; className?: string }) {
  const arrow = arrowOf(stroke);
  if (!arrow) return null;
  return <path className={className} d="M-2.6 -2.8L2.8 0L-2.6 2.8Z" transform={`translate(${arrow.x.toFixed(1)} ${arrow.y.toFixed(1)}) rotate(${arrow.angle.toFixed(0)})`} aria-hidden="true" />;
}
