'use client';
// The round's page for "আব্বু-আম্মুকে দেখাও": drawn on the phone once the fonts are in. No name, no stars.
import { useEffect, useRef } from 'react';
import { loadCardFonts } from '../../../shared/card-canvas';
import { cardLine, drawCard, type CardRound } from '../lib/draw-card';
import { levelOf } from '../lib/levels';

export function RoundCard({ result }: { result: CardRound }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let live = true;
    loadCardFonts(`${cardLine(result)} ${levelOf(result.level).title} ${result.items.map(item => item.word).join(' ')}`).then(() => { if (live && ref.current) drawCard(ref.current, result, location.host); });
    return () => { live = false; };
  }, [result]);
  return <>
    <div className="kit-card"><canvas ref={ref} width={1080} height={1350} aria-label={cardLine(result)} role="img" /></div>
    <p>{cardLine(result)}। {levelOf(result.level).title}।</p>
  </>;
}
