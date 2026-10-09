import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AlpanaDrawing } from "../components/alpana-drawing";
import { defaultSettings } from "../lib/pattern";
import { addDrawingStroke, appendDrawingPoint, drawingPath, drawingPoint, DRAWING_RADIUS, MAX_STROKES, MAX_STROKE_POINTS, strokeTransforms, type DrawingStroke } from "../lib/drawing";

const stroke: DrawingStroke = { color: "#fff5d8", width: 4, symmetry: 8, mirrored: true, points: [{ x: 0, y: -40 }] };

test("pointer coordinates describe the same artwork location at different screen sizes", () => {
  assert.deepEqual(drawingPoint({ x: 180, y: 100 }, { left: 20, top: 20, width: 320, height: 320 }), drawingPoint({ x: 370, y: 210 }, { left: 50, top: 50, width: 640, height: 640 }));
});

test("letterboxing keeps the drawing centered", () => {
  assert.deepEqual(drawingPoint({ x: 250, y: 150 }, { left: 0, top: 0, width: 500, height: 300 }), { x: 0, y: 0 });
});

test("points outside the drawing area are bounded before mirrored rotation", () => {
  const point = drawingPoint({ x: 1000, y: 1000 }, { left: 0, top: 0, width: 400, height: 400 });
  assert.ok(Math.abs(Math.hypot(point.x, point.y) - DRAWING_RADIUS) < 0.001);
});

test("invalid canvas dimensions are rejected", () => {
  assert.throws(() => drawingPoint({ x: 1, y: 1 }, { left: 0, top: 0, width: 0, height: 200 }), RangeError);
});

test("nearby pointer samples do not allocate another point", () => {
  const points = [{ x: 1, y: 1 }];
  assert.equal(appendDrawingPoint(points, { x: 1.2, y: 1.2 }), points);
});

test("long strokes stay bounded while preserving their beginning and current endpoint", () => {
  let points = [{ x: 0, y: 0 }];
  for (let index = 1; index < 10000; index++) points = appendDrawingPoint(points, { x: index % 300, y: index % 100 });
  points = appendDrawingPoint(points, { x: -200, y: -200 });
  assert.ok(points.length <= MAX_STROKE_POINTS && points[0].x === 0 && points.at(-1)?.x === -200 && points.at(-1)?.y === -200);
});

test("mirroring makes two copies per sector while radial-only makes one", () => {
  assert.deepEqual([strokeTransforms(stroke).length, strokeTransforms({ ...stroke, mirrored: false }).length], [16, 8]);
});

test("all mirrored transforms use canonical angles", () => {
  assert.deepEqual(strokeTransforms({ symmetry: 6, mirrored: true }).slice(-2), ["rotate(300)", "rotate(300) scale(-1 1)"]);
});

test("a tap produces a visible round-ended path", () => {
  assert.equal(drawingPath(stroke.points), "M0 -40l0.001 0");
});

test("the stroke limit preserves existing work", () => {
  const strokes = Array.from({ length: MAX_STROKES }, () => stroke);
  assert.equal(addDrawingStroke(strokes, stroke), strokes);
});

test("committing a completed stroke does not mutate previous history", () => {
  const previous = [stroke];
  assert.ok(addDrawingStroke(previous, stroke).length === 2 && previous.length === 1);
});

test("screen and tracing artwork contain the same mirrored vectors", () => {
  const color = renderToStaticMarkup(createElement(AlpanaDrawing, { settings: defaultSettings, strokes: [stroke] }));
  const trace = renderToStaticMarkup(createElement(AlpanaDrawing, { settings: defaultSettings, strokes: [stroke], trace: true }));
  assert.ok((color.match(/<use /g) ?? []).length === 16 && (trace.match(/<use /g) ?? []).length === 16
    && color.includes('d="M0 -40l0.001 0"') && trace.includes('d="M0 -40l0.001 0"')
    && trace.includes('stroke="#161616"') && !trace.includes('data-export-ignore'));
});
