'use client';
// Today's page for "আব্বু-আম্মুকে দেখাও": drawn on the phone once the fonts are in. No name, no stars, nothing about who got the last piece.
import { useEffect, useRef } from 'react';
import { loadCardFonts } from '../../../shared/card-canvas';
import { cardFontSample, drawCard } from '../lib/card';
import { cardLines, type Today } from '../lib/round';

export function RoundCard({ today }: { today: Today }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let live = true;
    loadCardFonts(cardFontSample).catch(() => undefined).then(() => { if (live && ref.current) drawCard(ref.current, today, location.host); });
    return () => { live = false; };
  }, [today]);
  return <figure className="kit-card"><canvas ref={ref} width={1080} height={1350} role="img" aria-label={cardLines(today).join('। ') || 'সমান ভাগ'} /></figure>;
}
