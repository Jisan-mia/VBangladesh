'use client';
// The title inside the stage: a floor mat laid for the level's guests (happy faces over plates, a basket of পিঠা) is the start
// button, the biggest thing on screen. Under it, small: the level chip (opens the list) and one line for a parent.
import type { ReactNode } from 'react';
import { bn } from '../../../shared/kids-kit';
import { levelOf, placeOf, worldOf } from '../lib/levels';
import { guestsFor } from '../lib/people';
import { FOOD_ART, faceArt } from '../lib/shapes';
import { Pic, Weave } from './pieces';

export function Title({ level, onStart, onLevels, children }: { level: number; onStart: () => void; onLevels: () => void; children?: ReactNode }) {
  const spec = levelOf(level), world = worldOf(level);
  const n = Math.min(4, Math.max(2, spec.slots[0].n || 2)), guests = guestsFor(n, 0);
  return <div className="sb-title">
    <button type="button" className="sb-mat" onClick={event => { event.currentTarget.blur(); onStart(); }} aria-label={`খেলো: লেভেল ${bn(placeOf(level))}, ${spec.title}`}>
      <Weave />
      <span className="sb-mat-basket" aria-hidden="true">{[0, 1, 2].map(at => <Pic key={at} layers={FOOD_ART.pitha} className="sb-mat-food" />)}</span>
      <span className="sb-mat-row" data-n={n} aria-hidden="true">
        {guests.map((guest, seat) => <span className="sb-mat-seat" key={seat}>
          <Pic layers={faceArt(guest, 'happy')} className={`sb-mat-face${guest.small ? ' small' : ''}`} />
          <span className="sb-mat-plate"><Pic layers={FOOD_ART.pitha} className="sb-mat-food" /></span>
        </span>)}
      </span>
      <span className="sb-mat-go" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 4.5v15l12.5-7.5z" /></svg>খেলো</span>
    </button>
    <button type="button" className="sb-chip" onClick={event => { event.currentTarget.blur(); onLevels(); }} aria-label={`লেভেল ${bn(placeOf(level))}, ${spec.title}। সব লেভেল দেখো`}>
      <span className="sb-chip-n" aria-hidden="true">{bn(placeOf(level))}</span>
      <span><b>{spec.finale ?? spec.title}</b><small>{world.name}</small></span>
      <svg className="sb-chip-more" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14" /></svg>
    </button>
    <p className="sb-title-line">সবার প্লেটে সমান করে দাও।</p>
    {children}
  </div>;
}
