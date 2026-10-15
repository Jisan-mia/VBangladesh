"use client";
// The #og demo for the site's preview image: a fixed finished day on the parent card. It reads and writes no storage.
import { useEffect, useRef } from "react";
import { loadCardFonts } from "../../../shared/card-canvas";
import { ShowParent } from "../../../shared/kids-kit";
import { cardBlob, cardFontSample, drawCard } from "../lib/draw-card";
import { cardLines, OG_TODAY } from "../lib/game";

export function OgCard({ onClose }: { onClose: () => void }) {
  const card = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let live = true;
    loadCardFonts(cardFontSample).then(() => { if (live && card.current) drawCard(card.current, OG_TODAY, location.host); });
    return () => { live = false; };
  }, []);
  return <ShowParent open onClose={onClose} picture={{ fileName: "daripalla.png", make: () => cardBlob(OG_TODAY, location.host) }}>
    <figure className="kit-card"><canvas ref={card} width={1080} height={1350} role="img" aria-label={cardLines(OG_TODAY).join("। ")} /></figure>
  </ShowParent>;
}
