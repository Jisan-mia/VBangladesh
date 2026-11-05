'use client';
// The title inside the stage: the launch picture is the start button, the biggest thing on screen. Under it, small: the
// level chip (opens the list) and one line for a parent; the grown-ups' gate sits at the foot.
import type { ReactNode } from 'react';
import { bn } from '../../../shared/kids-kit';
import { levelOf, placeOf, WORLDS } from '../lib/course';
import { PLANETS } from '../lib/planets';
import { LaunchArt, ModeIcon } from './art';

export function Title({ level, onStart, onLevels, children }: { level: number; onStart: () => void; onLevels: () => void; children?: ReactNode }) {
  const spec = levelOf(level), world = WORLDS[spec.world];
  return <div className="sj-title">
    <button type="button" className="sj-launch" onClick={event => { event.currentTarget.blur(); onStart(); }} aria-label={`খেলো: লেভেল ${bn(placeOf(level))}, ${spec.finale ?? spec.title}`}>
      <LaunchArt planets={PLANETS} />
      <span className="sj-launch-go" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 4.5v15l12.5-7.5z" /></svg>খেলো</span>
    </button>
    <button type="button" className="sj-chip" onClick={event => { event.currentTarget.blur(); onLevels(); }} aria-label={`লেভেল ${bn(placeOf(level))}, ${spec.finale ?? spec.title}। সব লেভেল দেখো`}>
      <span className="sj-chip-icon" aria-hidden="true"><ModeIcon mode={spec.mode} /></span>
      <span><b>লেভেল {bn(placeOf(level))} · {spec.finale ?? spec.title}</b><small>{world.name}</small></span>
      <svg className="sj-chip-more" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14" /></svg>
    </button>
    <p className="sj-title-line">রকেটে চড়ে সূর্য থেকে নেপচুন।</p>
    {children}
  </div>;
}
