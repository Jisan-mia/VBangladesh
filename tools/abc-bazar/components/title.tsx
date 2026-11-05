'use client';
// The title inside the stage: the market stall itself is the start button, the biggest thing on screen. Its sign shows the
// level's first letter and a picture; under it, small: the level chip (opens the list) and one line for a parent.
import type { ReactNode } from 'react';
import { bn } from '../../../shared/kids-kit';
import { entryOf } from '../lib/letters';
import { isMirrorLevel, levelOf, placeOf, worldOf } from '../lib/levels';
import { Awning, Glyph, Pic } from './pieces';

/** The sign's sample for a level: the letter pair and its picture, or b and d for the mirror worlds. */
function Sample({ level }: { level: number }) {
  if (isMirrorLevel(level)) return <span className="ab-stall-glyphs"><Glyph letter="b" className="ab-glyph" /><Glyph letter="d" className="ab-glyph" /></span>;
  const letter = levelOf(level).letters[0], entry = entryOf(letter);
  return <>
    <Pic letter={letter} className="ab-pic ab-stall-pic" />
    <span className="ab-stall-letters" lang="en" aria-hidden="true">{entry.letter} <span>{entry.letter.toLowerCase()}</span></span>
  </>;
}

export function Title({ level, onStart, onLevels, children }: { level: number; onStart: () => void; onLevels: () => void; children?: ReactNode }) {
  const spec = levelOf(level), world = worldOf(level);
  return <div className="ab-title">
    <button type="button" className="ab-stall" onClick={event => { event.currentTarget.blur(); onStart(); }} aria-label={`খেলো: লেভেল ${bn(placeOf(level))}, ${spec.title}`}>
      <Awning />
      <span className="ab-stall-board"><Sample level={level} /></span>
      <span className="ab-stall-go" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 4.5v15l12.5-7.5z" /></svg>খেলো</span>
    </button>
    <button type="button" className="ab-chip" onClick={event => { event.currentTarget.blur(); onLevels(); }} aria-label={`লেভেল ${bn(placeOf(level))}, ${spec.title}। সব লেভেল দেখো`}>
      <span className="ab-chip-n" aria-hidden="true">{bn(placeOf(level))}</span>
      <span><b>{spec.finale ?? spec.title}</b><small>{world.name}</small></span>
      <svg className="ab-chip-more" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14" /></svg>
    </button>
    <p className="ab-title-line">ছবি দেখো, ঠিক জিনিসটায় চাপো।</p>
    {children}
  </div>;
}
