'use client';
// The title inside the stage: the picture you are about to build, finished and in its colours, on a wooden board. The whole
// board is the start button, the biggest thing on screen. Under it, small: the picture chip (opens the list) and one line.
import type { ReactNode } from 'react';
import { bn } from '../../../shared/kids-kit';
import { figureOf, specOf, worldOf } from '../lib/levels';
import { FigureArt } from './figure-art';

export function Title({ level, size, onStart, onLevels, children }: { level: number; size: number; onStart: () => void; onLevels: () => void; children?: ReactNode }) {
  const spec = specOf(level), figure = figureOf(level), world = worldOf(level);
  return <div className="st-title">
    <button type="button" className="st-board" onClick={event => { event.currentTarget.blur(); onStart(); }} aria-label={`খেলো: ছবি ${bn(level)}, ${figure.name}`}>
      <span className="st-board-pic"><FigureArt figure={figure} size={size} label={false} /></span>
      <span className="st-board-go" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 4.5v15l12.5-7.5z" /></svg>খেলো</span>
    </button>
    <button type="button" className="st-chip" onClick={event => { event.currentTarget.blur(); onLevels(); }} aria-label={`ছবি ${bn(level)}, ${figure.name}। সব ছবি দেখো`}>
      <FigureArt figure={figure} size={40} label={false} className="st-chip-art" />
      <span><b>ছবি {bn(level)} · {figure.name}</b><small>{world.name}{spec.finale ? ' · শেষ ছবি' : ''}</small></span>
      <svg className="st-chip-more" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14" /></svg>
    </button>
    <p className="st-title-line">{spec.fresh && <em className="st-new">নতুন</em>}{spec.teach}</p>
    {children}
  </div>;
}
