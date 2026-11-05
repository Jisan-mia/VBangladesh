'use client';
// A letter's picture, drawn once at the device's pixel ratio into a canvas (the drawings are অ-তে অজগর's own).
import { useEffect, useRef } from 'react';
import { drawPic } from '../lib/draw-card';

export function PicCanvas({ pic, size, className }: { pic: string; size: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current, c = canvas?.getContext('2d');
    if (!canvas || !c) return;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(size * ratio); canvas.height = Math.round(size * ratio);
    c.setTransform(ratio, 0, 0, ratio, 0, 0);
    c.clearRect(0, 0, size, size);
    drawPic(c, pic, size / 2, size / 2, size * 0.92);
  }, [pic, size]);
  return <canvas ref={ref} className={className} style={{ width: size, height: size }} aria-hidden="true" />;
}
