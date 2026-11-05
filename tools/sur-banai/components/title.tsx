'use client';
// The title inside the stage: a card of the world's own instrument over a small grid, and the whole card is the start
// button, the biggest thing on screen. Under it two picture chips (আমার সুর, সব লেভেল), the kept tunes, and the parent gate.
import type { ReactNode } from 'react';
import { bn } from '../../../shared/kids-kit';
import { levelOf, placeOf, worldOf } from '../lib/levels';
import { noteCount, parseTune, SOUNDS, type Saved } from '../lib/music';
import { Finger, Icon, Instrument, MiniTune } from './pictures';

// Each world's card shows a little tune that is not one of its levels, so the title never gives an answer away.
const ART = ['0 1 2 3 4 .', '04 . 13 . 24 .', '0 2 4 0 2 4', '0 2 4 3 1 0'].map(parseTune);

const shown = (event: { currentTarget: HTMLButtonElement }, action: () => void) => { event.currentTarget.blur(); action(); };

export function Title({ level, first, draft, shelf, onStart, onFree, onLevels, onLoad, children }: {
  level: number; first: boolean; draft: Saved | null; shelf: Saved[]; onStart: () => void; onFree: () => void; onLevels: () => void; onLoad: (item: Saved) => void; children?: ReactNode;
}) {
  const spec = levelOf(level), world = worldOf(level);
  const sound = world.sound < 0 ? 0 : world.sound;
  return <div className="sb-title">
    <button type="button" className="sb-card" onClick={event => shown(event, onStart)} aria-label={`খেলো: লেভেল ${bn(placeOf(level))}, ${spec.title}`}>
      <span className="sb-card-art">
        <Instrument sound={sound} className="sb-card-inst" />
        <MiniTune tune={ART[world.id]} className="sb-card-grid" />
        {first && <Finger />}
      </span>
      <span className="sb-card-go" aria-hidden="true"><svg viewBox="0 0 48 48"><path d="M13 8v32l27-16z" /></svg>খেলো</span>
    </button>
    <div className="sb-chips">
      <button type="button" className="sb-chip" onClick={event => shown(event, onFree)} aria-label={draft ? 'আমার সুর: যেখানে ছিলে সেখান থেকে' : 'আমার সুর'}>
        {draft ? <MiniTune tune={draft.tune} className="sb-chip-mini" /> : <Icon id="grid" className="sb-chip-ic" />}
        <b>আমার সুর</b>
      </button>
      <button type="button" className="sb-chip" onClick={event => shown(event, onLevels)} aria-label={`সব লেভেল। এখন: লেভেল ${bn(placeOf(level))}, ${spec.title}`}>
        <Icon id="list" className="sb-chip-ic" />
        <span><b>লেভেল {bn(placeOf(level))}</b><small>{spec.title}</small></span>
      </button>
    </div>
    {shelf.length > 0 && <ul className="sb-shelf" aria-label="রাখা সুর">
      {shelf.map((item, index) => <li key={`${index}-${item.tune.join('.')}`}>
        <button type="button" onClick={event => shown(event, () => onLoad(item))} aria-label={`রাখা সুর ${bn(index + 1)}, ${bn(noteCount(item.tune))}টা নোট, ${SOUNDS[item.sound].at}`}><MiniTune tune={item.tune} /></button>
      </li>)}
    </ul>}
    {children}
  </div>;
}
