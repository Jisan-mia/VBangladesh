"use client";
// One thing's picture on a small canvas (the answer buttons and the cash memo), drawn once per thing and size.
import { useEffect, useRef } from "react";
import { fitCanvas } from "../../../shared/game-kit";
import { drawItem } from "../lib/art";
import type { ItemId } from "../lib/items";

export function ItemArt({ id, width = 72, height = 56 }: { id: ItemId; width?: number; height?: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!canvas.current) return;
    const c = fitCanvas(canvas.current, width, height);
    c.clearRect(0, 0, width, height);
    drawItem(c, id, width / 2, height - 2, height * 0.98);
  }, [id, width, height]);
  return <canvas ref={canvas} width={width} height={height} style={{ width, height }} aria-hidden="true" />;
}
