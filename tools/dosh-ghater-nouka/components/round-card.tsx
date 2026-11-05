"use client";
// The page for "আব্বু-আম্মুকে দেখাও": drawn on the phone once the fonts are in. What was done today, no name, no stars.
import { useEffect, useRef } from "react";
import { loadCardFonts } from "../../../shared/card-canvas";
import { bn } from "../lib/levels";
import { cardFontSample, cardLine, cardSub, drawCard, type Today } from "../lib/card";

export function RoundCard({ today }: { today: Today }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let live = true;
    loadCardFonts(cardFontSample(today)).then(() => { if (live && ref.current) drawCard(ref.current, today, location.host); });
    return () => { live = false; };
  }, [today]);
  return <>
    <figure className="kit-card"><canvas ref={ref} width={1080} height={1350} role="img" aria-label={`আজ ১ থেকে ${bn(today.n)} গুনে নৌকা চালানো হলো, ${bn(today.games)}টা খেলা, ${bn(today.counted)}টা ঘাট।`} /></figure>
    <p>{cardLine(today)}। {cardSub(today)}।</p>
  </>;
}
