"use client";

import { useEffect, useRef, useState, type PointerEvent, type RefObject } from "react";
import { hiss, sfx } from "../../../shared/game-sound";
import { appendDrawingPoint, drawingPoint, MAX_STROKES, type DrawingStroke } from "../lib/drawing";
import { type PatternSettings } from "../lib/pattern";
import { AlpanaDrawing } from "./alpana-drawing";

type DrawingCanvasProps = {
  settings: PatternSettings;
  strokes: DrawingStroke[];
  brush: Pick<DrawingStroke, "color" | "width" | "mirrored">;
  svgRef: RefObject<SVGSVGElement | null>;
  onStroke: (stroke: DrawingStroke) => void;
  onBusyChange: (busy: boolean) => void;
  onNotice: (message: string) => void;
};

export function DrawingCanvas({ settings, strokes, brush, svgRef, onStroke, onBusyChange, onNotice }: DrawingCanvasProps) {
  const [activeStroke, setActiveStroke] = useState<DrawingStroke | null>(null);
  const active = useRef<{ pointerId: number; stroke: DrawingStroke } | null>(null);
  const frame = useRef<number | null>(null);
  const lastScratch = useRef(0);

  useEffect(() => () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
  }, []);

  function start(event: PointerEvent<SVGSVGElement>) {
    if (active.current || !event.isPrimary || event.button !== 0) return;
    if (strokes.length >= MAX_STROKES) {
      onNotice("৬০টা রেখা হয়ে গেছে। আরও আঁকতে ‘এক ধাপ পেছাও’ চেপে একটা রেখা সরাও, নয়তো আঁকা মুছে দাও।");
      return;
    }
    event.preventDefault();
    const point = drawingPoint({ x: event.clientX, y: event.clientY }, event.currentTarget.getBoundingClientRect());
    const stroke = { ...brush, symmetry: settings.symmetry, points: [point] };
    active.current = { pointerId: event.pointerId, stroke };
    event.currentTarget.setPointerCapture(event.pointerId);
    setActiveStroke(stroke);
    hiss(0.08, 0.03, 2600, "bandpass");
    onBusyChange(true);
    onNotice("");
  }

  function move(event: PointerEvent<SVGSVGElement>) {
    if (!active.current || active.current.pointerId !== event.pointerId) return;
    event.preventDefault();
    const point = drawingPoint({ x: event.clientX, y: event.clientY }, event.currentTarget.getBoundingClientRect());
    const previous = active.current.stroke;
    const points = appendDrawingPoint(previous.points, point);
    if (points === previous.points) return;
    active.current.stroke = { ...previous, points };
    // A soft chalk scratch, at most about 9 times a second.
    const now = performance.now();
    if (now - lastScratch.current > 110) { lastScratch.current = now; hiss(0.07, 0.025, 2200 + Math.random() * 900, "bandpass"); }
    if (frame.current === null) frame.current = requestAnimationFrame(() => {
      frame.current = null;
      setActiveStroke(active.current?.stroke ?? null);
    });
  }

  function finish(event: PointerEvent<SVGSVGElement>) {
    if (!active.current || active.current.pointerId !== event.pointerId) return;
    const point = drawingPoint({ x: event.clientX, y: event.clientY }, event.currentTarget.getBoundingClientRect());
    const stroke = { ...active.current.stroke, points: appendDrawingPoint(active.current.stroke.points, point) };
    active.current = null;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    setActiveStroke(null);
    onBusyChange(false);
    onStroke(stroke);
    sfx.drop();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function cancel() {
    if (!active.current) return;
    active.current = null;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    setActiveStroke(null);
    onBusyChange(false);
    onNotice("এই রেখাটা বাদ গেল। আগের আঁকা ঠিক আছে।");
  }

  return <AlpanaDrawing settings={settings} strokes={strokes} activeStroke={activeStroke} svgRef={svgRef} interaction={{
    className: "alpana-drawing-canvas",
    tabIndex: 0,
    "aria-describedby": "alpana-drawing-help",
    onPointerDown: start,
    onPointerMove: move,
    onPointerUp: finish,
    onPointerCancel: event => { if (event.pointerId === active.current?.pointerId) cancel(); },
    onLostPointerCapture: event => { if (event.pointerId === active.current?.pointerId) cancel(); },
    onKeyDown: event => { if (event.key === "Escape") cancel(); },
  }} />;
}
