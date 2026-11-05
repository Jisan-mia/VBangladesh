'use client';
// The "আব্বু-আম্মুকে দেখাও" card, drawn on the phone once the fonts are in. No name.
import { useEffect, useRef } from 'react';
import { loadCardFonts } from '../../../shared/card-canvas';
import { drawCard } from '../lib/draw-card';
import { cardTitle, type Today } from '../lib/music';

export function CardCanvas({ today }: { today: Today }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let live = true;
    void (async () => {
      await loadCardFonts(`${cardTitle(today)} সুর বানাই সা রে গা পা ধা`);
      if (!live || !ref.current) return;
      drawCard(ref.current, today, location.host);
      ref.current.dataset.drawn = '1';
    })();
    return () => { live = false; };
  }, [today]);
  return <canvas ref={ref} width={1080} height={1350} role="img" aria-label={cardTitle(today)} />;
}
