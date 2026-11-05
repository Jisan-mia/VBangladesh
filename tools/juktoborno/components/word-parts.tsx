'use client';
// What the game, the end page and the print sheet share: a word's picture, and the word with its যুক্তবর্ণ marked or left as a gap.
import { useEffect, useRef } from 'react';
import { fitCanvas } from '../../../shared/game-kit';
import { drawWordPicture } from '../lib/art';
import { splitWord, type Word } from '../lib/words';

/**
 * The word split at grapheme boundaries only (প | ক্ষী), so the যুক্তবর্ণ is never broken into letters. `gap` leaves the whole
 * akshara that holds it as a dashed seat; `fresh` pops the joined letters in when a gap has just been filled.
 */
export function WordLine({ word, gap = false, fresh = false }: { word: Word; gap?: boolean; fresh?: boolean }) {
  const { before, cluster, after } = splitWord(word);
  return <span className="jb-word" role="img" aria-label={gap ? `${before} ফাঁকা ${after}` : word.word}>
    {before && <span aria-hidden="true">{before}</span>}
    {gap ? <span className="jb-gap" aria-hidden="true" /> : <mark className={fresh ? 'jb-fresh' : undefined} aria-hidden="true">{cluster}</mark>}
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

/** The gear: turns once when two letters lock. Drawn as one path, so it stays crisp at any size. */
export function Gear({ spin = false }: { spin?: boolean }) {
  const teeth = Array.from({ length: 8 }, (_, at) => <rect key={at} x="-3.5" y="-15" width="7" height="6" rx="1.5" transform={`rotate(${at * 45})`} />);
  return <svg className={`jb-gear${spin ? ' spin' : ''}`} viewBox="-16 -16 32 32" aria-hidden="true">
    <g>{teeth}<circle r="10.5" /><circle r="4" className="hole" /></g>
  </svg>;
}
