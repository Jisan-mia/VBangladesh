'use client';
// The two things the game and the print sheet share: a word with its empty sign slot, and a word's picture.
import { useEffect, useRef } from 'react';
import { fitCanvas } from '../../../shared/game-kit';
import { drawWordPicture } from '../lib/art';
import { SIDE, spellWith, splitWord, type Item, type Kar } from '../lib/words';

/** The word with one empty slot exactly where its sign shows: left for ি ে ৈ, right for া ী, under for ু ূ ৃ, both sides for ো ৌ. */
export function WordSlot({ item, filled = false, tried = null }: { item: Item; filled?: boolean; tried?: Kar | null }) {
  if (filled) return <span className="kc-word kc-filled">{item.word}</span>;
  if (tried) return <span className="kc-word kc-tried">{spellWith(item, tried)}</span>;
  const { before, base, after } = splitWord(item), side = SIDE[item.kar];
  const slot = (key: string) => <span key={key} className="kc-slot" />;
  return <span className="kc-word" role="img" aria-label={`${before}${base} ফাঁকা ${after}`}>
    {before && <span>{before}</span>}
    <span className={`kc-akshara kc-${side}`} aria-hidden="true">
      {(side === 'left' || side === 'both') && slot('l')}
      <span className="kc-base">{base}</span>
      {(side === 'right' || side === 'both' || side === 'below') && slot('r')}
    </span>
    {after && <span>{after}</span>}
  </span>;
}

/** A word's drawing on a crisp canvas, `size` CSS px square. */
export function WordPicture({ pic, size }: { pic: string; size: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const context = fitCanvas(ref.current, size, size);
    context.clearRect(0, 0, size, size);
    drawWordPicture(context, pic, size / 2, size / 2, size * 0.94);
  }, [pic, size]);
  return <canvas ref={ref} width={size} height={size} style={{ width: size, height: size }} aria-hidden="true" />;
}
