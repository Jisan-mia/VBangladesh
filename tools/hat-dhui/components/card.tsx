"use client";
// The round's card for "আব্বু-আম্মুকে দেখাও": drawn on the phone once the fonts are in. No name, no photo.
import { useEffect, useRef } from "react";
import { loadCardFonts } from "../../../shared/card-canvas";
import { cardSvgs, drawCard, loadPictures, type CardData } from "../lib/draw-card";

export function CardCanvas({ data }: { data: CardData }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let live = true;
    void (async () => {
      await loadCardFonts(`${data.label} ${data.title} ${data.tiles.map(tile => tile.text).join(" ")}`);
      const pictures = await loadPictures(cardSvgs(data));
      if (live && ref.current) drawCard(ref.current, data, pictures, location.host);
    })();
    return () => { live = false; };
  }, [data]);
  return <canvas ref={ref} width={1080} height={1350} aria-label={data.title} role="img" />;
}
