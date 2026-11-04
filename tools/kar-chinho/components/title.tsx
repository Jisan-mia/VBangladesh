'use client';
// The title inside the stage: a slate with the level's first picture and its word waiting for a sign. The whole slate is
// the start button, the biggest thing on screen. Under it, small: the level chip (opens the list) and one line for a parent.
import type { ReactNode } from 'react';
import { bn } from '../../../shared/kids-kit';
import { levelOf, placeOf, signsOf, worldOf } from '../lib/levels';
import { dotted } from '../lib/words';
import { WordPicture, WordSlot } from './word-parts';

export function Title({ level, size, onStart, onLevels, children }: { level: number; size: number; onStart: () => void; onLevels: () => void; children?: ReactNode }) {
  const spec = levelOf(level), first = spec.items[0], world = worldOf(level);
  return <div className="kc-title">
    <button type="button" className="kc-slate" onClick={event => { event.currentTarget.blur(); onStart(); }} aria-label={`খেলো: লেভেল ${bn(placeOf(level))}, ${spec.title}`}>
      <span className="kc-slate-board">
        <span className="kc-slate-pic"><WordPicture pic={first.pic} size={size} /></span>
        <span className="kc-slate-word" aria-hidden="true"><WordSlot item={first} /></span>
      </span>
      <span className="kc-slate-go" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 4.5v15l12.5-7.5z" /></svg>খেলো</span>
    </button>
    <button type="button" className="kc-chip" onClick={event => { event.currentTarget.blur(); onLevels(); }} aria-label={`লেভেল ${bn(placeOf(level))}, ${spec.title}। সব লেভেল দেখো`}>
      <span className="kc-chip-signs" aria-hidden="true">{signsOf(level).slice(0, 4).map(dotted).join(' ')}</span>
      <span><b>লেভেল {bn(placeOf(level))} · {spec.title}</b><small>{world.name}</small></span>
      <svg className="kc-chip-more" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14" /></svg>
    </button>
    <p className="kc-title-line">ছবি দেখো, ঠিক চিহ্নটা বসাও।</p>
    {children}
  </div>;
}
