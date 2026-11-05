"use client";
// The parent card canvas, drawn on the phone once the fonts are in. No name, nothing sent.
import { useEffect, useRef } from "react";
import { loadCardFonts } from "../../../shared/card-canvas";
import { drawCard, loadPictures } from "../lib/draw-card";
import { cardTitle, type Today } from "../lib/lines";

export function CardCanvas({ today }: { today: Today }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let live = true;
    void (async () => {
      await loadCardFonts(`${cardTitle(today)} আমার প্ল্যান লেভেল বার`);
      const pictures = await loadPictures();
      if (!live || !ref.current) return;
      drawCard(ref.current, today, pictures, location.host);
      ref.current.dataset.drawn = "1";
    })();
    return () => { live = false; };
  }, [today]);
  return <canvas ref={ref} width={1080} height={1350} role="img" aria-label={cardTitle(today)} />;
}
