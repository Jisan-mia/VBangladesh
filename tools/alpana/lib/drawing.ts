import { roundSvgValue, type PatternSettings } from "./pattern";

export const MAX_STROKES = 60;
export const MAX_STROKE_POINTS = 256;
export const DRAWING_RADIUS = 388;
export type DrawingPoint = { x: number; y: number };
export type DrawingStroke = {
  points: DrawingPoint[];
  color: string;
  width: number;
  symmetry: PatternSettings["symmetry"];
  mirrored: boolean;
};
type CanvasBounds = { left: number; top: number; width: number; height: number };

export function drawingPoint(client: DrawingPoint, bounds: CanvasBounds): DrawingPoint {
  const size = Math.min(bounds.width, bounds.height);
  if (!Number.isFinite(size) || size <= 0 || !Number.isFinite(client.x) || !Number.isFinite(client.y)) {
    throw new RangeError("আঁকার জায়গাটা মাপা গেল না।");
  }
  const x = (client.x - bounds.left - bounds.width / 2) * 800 / size;
  const y = (client.y - bounds.top - bounds.height / 2) * 800 / size;
  const distance = Math.hypot(x, y);
  const scale = distance > DRAWING_RADIUS ? DRAWING_RADIUS / distance : 1;
  return { x: roundSvgValue(x * scale), y: roundSvgValue(y * scale) };
}

export function appendDrawingPoint(points: DrawingPoint[], next: DrawingPoint): DrawingPoint[] {
  const last = points.at(-1);
  if (last && Math.hypot(next.x - last.x, next.y - last.y) < 1.5) return points;
  const retained = points.length < MAX_STROKE_POINTS ? points : points.filter((_, index) => index % 2 === 0);
  return [...retained, next];
}

export function drawingPath(points: DrawingPoint[]) {
  if (!points.length) return "";
  const first = points[0];
  if (points.length === 1) return "M" + first.x + " " + first.y + "l0.001 0";
  return points.map((point, index) => (index ? "L" : "M") + point.x + " " + point.y).join(" ");
}

export function strokeTransforms(stroke: Pick<DrawingStroke, "symmetry" | "mirrored">) {
  return Array.from({ length: stroke.symmetry }, (_, index) => {
    const rotation = "rotate(" + roundSvgValue(index * 360 / stroke.symmetry) + ")";
    return stroke.mirrored ? [rotation, rotation + " scale(-1 1)"] : [rotation];
  }).flat();
}

export function addDrawingStroke(strokes: DrawingStroke[], stroke: DrawingStroke) {
  if (strokes.length >= MAX_STROKES || !stroke.points.length) return strokes;
  if (stroke.points.length > MAX_STROKE_POINTS) throw new RangeError("রেখাটা অনেক লম্বা হয়ে গেছে।");
  return [...strokes, stroke];
}
