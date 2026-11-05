'use client';
// The round's page for "আব্বু-আম্মুকে দেখাও": drawn on the phone once the fonts are in. No name.
import { useEffect, useRef } from 'react';
import { loadCardFonts } from '../../../shared/card-canvas';
import { bn } from '../../../shared/kids-kit';
import { drawCard, FOOTER, loadPictures, type CardData } from '../lib/draw-card';
import { cardTitle } from '../lib/lines';
import { placeOf } from '../lib/levels';
import { shapesOf, type Result } from '../lib/round';

export const cardOf = (result: Result): CardData => ({ label: `ছায়া মেলাও · লেভেল ${bn(placeOf(result.level))}`, title: cardTitle(result.ids.length, bn), stars: result.stars, ids: result.ids, footer: FOOTER });

export function RoundCard({ result }: { result: Result }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let live = true;
    const data = cardOf(result);
    void (async () => {
      await loadCardFonts(`${data.label} ${data.title} ${data.footer} ${shapesOf(data.ids).map(shape => shape.bn).join(' ')}`).catch(() => undefined);
      const pictures = await loadPictures(data.ids);
      if (live && ref.current) drawCard(ref.current, data, pictures, location.host);
    })();
    return () => { live = false; };
  }, [result]);
  const data = cardOf(result);
  return <>
    <figure className="kit-card"><canvas ref={ref} width={1080} height={1350} role="img" aria-label={data.title} /></figure>
    <p><b>বড়দের জন্য:</b> আকার খেয়াল করে মেলানোর এই অভ্যাসটাই পরে ব আর র, প আর ষ আলাদা করে চিনতে কাজে লাগে। রাতে টর্চ জ্বেলে দেয়ালে হাত দিয়ে পাখির ছায়া বানাও, ছোটজনকে বলতে দাও কী হলো।</p>
  </>;
}
