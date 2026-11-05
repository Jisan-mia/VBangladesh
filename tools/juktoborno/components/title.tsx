'use client';
// The title inside the stage: the factory. A gear, the level's first picture and its যুক্তবর্ণ already taken apart into
// slots. The whole card is the start button, the biggest thing on screen. Under it, small: the level chip (opens the list)
// and one line for what to do.
import type { ReactNode } from 'react';
import { bn } from '../../../shared/kids-kit';
import { emblemOf, levelOf, placeOf, worldOf } from '../lib/levels';
import { conjunct } from '../lib/words';
import { Gear, WordPicture } from './word-parts';

export function Title({ level, size, onStart, onLevels, children }: { level: number; size: number; onStart: () => void; onLevels: () => void; children?: ReactNode }) {
  const spec = levelOf(level), first = spec.words[0], world = worldOf(level);
  const mode = spec.mode === 'juri' ? 'জুড়ি' : spec.mode === 'bhangi' ? 'ভাঙি' : 'ভাঙি আর জুড়ি';
  return <div className="jb-title">
    <button type="button" className="jb-factory" onClick={event => { event.currentTarget.blur(); onStart(); }} aria-label={`খেলো: ${bn(placeOf(level))} নম্বর, ${spec.title}`}>
      <span className="jb-factory-board">
        <Gear spin />
        <span className="jb-factory-pic"><WordPicture pic={first.pic} size={size} /></span>
        <span className="jb-factory-sum" aria-hidden="true">
          <b>{conjunct(first.parts)}</b><i>=</i>
          {first.parts.map((part, at) => <span key={at} className="jb-factory-part">{at > 0 && <i>+</i>}<u>{part}</u></span>)}
        </span>
      </span>
      <span className="jb-factory-go" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 4.5v15l12.5-7.5z" /></svg>খেলো</span>
    </button>
    <button type="button" className="jb-chip" onClick={event => { event.currentTarget.blur(); onLevels(); }} aria-label={`${bn(placeOf(level))} নম্বর লেভেল, ${spec.title}। সব লেভেল দেখো`}>
      <span className="jb-chip-signs" aria-hidden="true">{emblemOf(level).join(' ')}</span>
      <span><b>লেভেল {bn(placeOf(level))} · {mode}</b><small>{world.name}</small></span>
      <svg className="jb-chip-more" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14" /></svg>
    </button>
    <p className="jb-title-line">{spec.mode === 'juri' ? 'ছবির নাম শুনে বর্ণ জুড়ে যুক্তবর্ণ বানাও।' : 'ছবি দেখো, যুক্তবর্ণের ভেতরের বর্ণ বসাও।'}</p>
    {children}
  </div>;
}
