'use client';
// The title inside the stage: an airmail envelope with the map on it, the plane crossing it now and then, and the whole
// envelope is the start button, the biggest thing on screen. Under it, small: the level chip (opens the list), the passport
// (opens the stamps) and one line for a parent.
import type { ReactNode } from 'react';
import { bn } from '../../../shared/kids-kit';
import { levelOf, placeOf, stopIds, worldOf } from '../lib/levels';
import { LevelIcon, PlaneIcon } from './pictures';
import { WorldMap } from './world-map';

const noop = () => {};

export function Title({ level, stamped, total, slow, onStart, onLevels, onPassport, children }: { level: number; stamped: number; total: number; slow: boolean; onStart: () => void; onLevels: () => void; onPassport: () => void; children?: ReactNode }) {
  const spec = levelOf(level), world = worldOf(level);
  return <div className="pg-title">
    <button type="button" className="pg-env" onClick={event => { event.currentTarget.blur(); onStart(); }} aria-label={`উড়াল দাও: লেভেল ${bn(placeOf(level))}, ${spec.title}`}>
      <span className="pg-env-map"><WorldMap ids={stopIds(level)} visited={[]} flying={null} slow={slow} frozen={false} onLanded={noop} idle pinsLive={false} /></span>
      <span className="pg-env-go"><PlaneIcon />উড়াল দাও</span>
    </button>
    <div className="pg-chips">
      <button type="button" className="pg-chip" onClick={event => { event.currentTarget.blur(); onLevels(); }} aria-label={`লেভেল ${bn(placeOf(level))}, ${spec.title}। সব লেভেল দেখো`}>
        <LevelIcon icon={spec.icon} className="pg-chip-icon" />
        <span><b>লেভেল {bn(placeOf(level))} · {spec.title}</b><small>{world.name}</small></span>
      </button>
      <button type="button" className="pg-chip pg-chip-passport" onClick={event => { event.currentTarget.blur(); onPassport(); }} aria-label={`আমার পাসপোর্ট, ${bn(total)}টার মধ্যে ${bn(stamped)}টা সিল`}>
        <LevelIcon icon="passport" className="pg-chip-icon" />
        <span><b>পাসপোর্ট</b><small>{bn(stamped)}/{bn(total)} সিল</small></span>
      </button>
    </div>
    <p className="pg-title-line">ম্যাপে একটা দেশ বেছে নাও, প্লেনে উড়ে যাও।</p>
    {children}
  </div>;
}
