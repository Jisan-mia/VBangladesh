'use client';
// The title inside the stage: the unlit lamp on its beam is the start button, the biggest thing on screen, with a shadow half in view
// behind it. Under it, small: the level chip (a tiny wall of the level; opens the list) and a line for a parent. A child who can't
// read taps the lamp: the first visit shows a ghost finger on it.
import type { ReactNode } from 'react';
import { bn } from '../../../shared/kids-kit';
import { levelOf, placeOf, worldOf } from '../lib/levels';
import { shapeOf } from '../lib/shapes';
import { Finger, Lamp, MiniWall, Shade, worldStyle } from './pieces';

export function Title({ level, fresh, onStart, onLevels, children }: { level: number; fresh: boolean; onStart: () => void; onLevels: () => void; children?: ReactNode }) {
  const spec = levelOf(level), world = worldOf(level), peek = shapeOf(spec.sample[0])!, peekTwo = shapeOf(spec.sample[1])!;
  return <div className="cs-title" style={worldStyle(spec.world)}>
    <button type="button" className="cs-stall" onClick={event => { event.currentTarget.blur(); onStart(); }} aria-label={`খেলো: লেভেল ${bn(placeOf(level))}, ${spec.title}`}>
      <span className="cs-stall-beam" aria-hidden="true" />
      <Shade shape={peek} world={spec.world} className="cs-peek cs-peek-a" />
      <Shade shape={peekTwo} world={spec.world} className="cs-peek cs-peek-b" />
      <Lamp lit={false} className="cs-stall-lamp" />
      <span className="cs-go" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 4.5v15l12.5-7.5z" /></svg>বাতি জ্বালাও</span>
      {fresh && <span className="cs-stall-finger" aria-hidden="true"><Finger /></span>}
    </button>
    <button type="button" className="cs-chip" onClick={event => { event.currentTarget.blur(); onLevels(); }} aria-label={`লেভেল ${bn(placeOf(level))}, ${spec.title}। সব লেভেল দেখো`}>
      <MiniWall level={level} className="cs-chip-wall" />
      <span><b>{spec.finale ?? spec.title}</b><small>{world.name} · {world.idea}</small></span>
      <svg className="cs-chip-more" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14" /></svg>
    </button>
    <p className="cs-title-line">ছায়া দেখো, ঠিক ছবিটা টেনে এনে বসাও।</p>
    {children}
  </div>;
}
