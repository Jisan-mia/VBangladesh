'use client';
// The title inside the stage: a postcard of the level's own scene, and the whole card is the start button, the biggest
// thing on screen. Under it, small: the level chip (opens the list) and one line for a parent.
import type { ReactNode } from 'react';
import { bn } from '../../../shared/kids-kit';
import { itemsOf, levelOf, placeOf, worldOf } from '../lib/levels';
import { Icon, SceneView } from './pictures';

export function Title({ level, onStart, onLevels, children }: { level: number; onStart: () => void; onLevels: () => void; children?: ReactNode }) {
  const spec = levelOf(level), world = worldOf(level), first = itemsOf(level)[0];
  return <div className="nt-title">
    <button type="button" className="nt-card" onClick={event => { event.currentTarget.blur(); onStart(); }} aria-label={`খেলো: লেভেল ${bn(placeOf(level))}, ${spec.title}`}>
      <span className="nt-card-art"><SceneView item={first} ring="none" answer={null} index={0} /></span>
      <span className="nt-card-go" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 4.5v15l12.5-7.5z" /></svg>খেলো</span>
    </button>
    <button type="button" className="nt-chip" onClick={event => { event.currentTarget.blur(); onLevels(); }} aria-label={`লেভেল ${bn(placeOf(level))}, ${spec.title}। সব লেভেল দেখো`}>
      <span className="nt-chip-icons" aria-hidden="true">{spec.icons.map(id => <Icon key={id} id={id} className="nt-chip-icon" />)}</span>
      <span><b>লেভেল {bn(placeOf(level))} · {spec.title}</b><small>{world.name}</small></span>
      <svg className="nt-chip-more" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14" /></svg>
    </button>
    <p className="nt-title-line">ছবি দেখো, ঠিক কাজটা বেছে নাও।</p>
    {children}
  </div>;
}
