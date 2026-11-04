"use client";
// A pre-drawn art canvas (the title plate, the story panels): drawn when its box changes or its inputs do, never per frame.
import { useEffect, useRef } from "react";

export function ArtCanvas({ draw, label, className, deps }: { draw: (canvas: HTMLCanvasElement, width: number, height: number) => void; label: string; className: string; deps: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const paint = () => { if (element.clientWidth) drawRef.current(element, element.clientWidth, element.clientHeight); };
    paint();
    const observer = new ResizeObserver(paint);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => { const element = ref.current; if (element?.clientWidth) drawRef.current(element, element.clientWidth, element.clientHeight); }, [deps]);
  return <canvas ref={ref} className={className} role="img" aria-label={label} />;
}
