'use client';
// What the game and the print sheet share: a word's picture, and the word with its যুক্তবর্ণ marked or left as a gap.
import { useEffect, useRef } from 'react';
import { fitCanvas } from '../../../shared/game-kit';
import { drawWordPicture } from '../lib/art';
import { splitWord, type Word } from '../lib/words';

/** The word split at grapheme boundaries only (প | ক্ষী), so the যুক্তবর্ণ is never broken into letters. */
export function WordLine({ item, gap = false }: { item: Word; gap?: boolean }) {
  const { before, cluster, after } = splitWord(item);
  return <span className="jb-word" role="img" aria-label={gap ? `${before} ফাঁকা ${after}` : item.word}>
    {before && <span aria-hidden="true">{before}</span>}
    {gap ? <span className="jb-gap" aria-hidden="true" /> : <mark aria-hidden="true">{cluster}</mark>}
    {after && <span aria-hidden="true">{after}</span>}
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
