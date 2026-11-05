'use client';
// The round's page for "আব্বু-আম্মুকে দেখাও": drawn on the phone once the fonts are in. No name, no stars.
import { useEffect, useRef } from 'react';
import { loadCardFonts } from '../../../shared/card-canvas';
import { cardFontSample, drawCard, loadPictures } from '../lib/card';
import { entryOf } from '../lib/letters';
import { doneLine, type Result } from '../lib/play';

export function RoundCard({ result }: { result: Result }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let live = true;
    Promise.all([loadCardFonts(cardFontSample(result)).catch(() => undefined), loadPictures(result.items.map(item => item.letter))]).then(([, pictures]) => {
      if (live && ref.current) drawCard(ref.current, result, pictures, location.host);
    });
    return () => { live = false; };
  }, [result]);
  return <>
    <figure className="kit-card"><canvas ref={ref} width={1080} height={1350} role="img" aria-label={`এবিসি বাজারের কার্ড: ${doneLine(result.level, result.count)}।`} /></figure>
    <p>{doneLine(result.level, result.count)}: {result.items.map(item => entryOf(item.letter).word).join(', ')}।</p>
  </>;
}
