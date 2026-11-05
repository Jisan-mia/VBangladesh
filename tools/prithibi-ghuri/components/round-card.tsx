'use client';
// The trip's passport page for "আব্বু-আম্মুকে দেখাও": drawn on the phone once the fonts are in. No name.
import { useEffect, useRef } from 'react';
import { loadCardFonts } from '../../../shared/card-canvas';
import { countryOf } from '../lib/countries';
import { drawCard, loadPictures, type CardData } from '../lib/draw-card';
import { helloLine } from '../lib/text';

export function RoundCard({ data }: { data: CardData }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let live = true;
    void (async () => {
      const names = data.ids.map(id => { const c = countryOf(id)!; return `${c.name} ${c.hello.word} ${helloLine(c)} ${c.food.name} ${c.place.name}`; }).join(' ');
      await loadCardFonts(`${data.label} ${data.title} ${data.trip} ${names}`);
      const pictures = await loadPictures(data.ids);
      if (live && ref.current) drawCard(ref.current, data, pictures, location.host);
    })();
    return () => { live = false; };
  }, [data]);
  return <canvas ref={ref} width={1080} height={1350} aria-label={data.title} role="img" />;
}
