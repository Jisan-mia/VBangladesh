'use client';
// The title inside the stage: the launch picture is the start button, the biggest thing on screen. Under it, small: the two
// paces (আরামে / চটপট) with the chosen one's promise in one line, and the level chip (opens the list). The grown-ups' gate sits at the foot.
import type { ReactNode } from 'react';
import { bn } from '../../../shared/kids-kit';
import { levelOf, placeOf, WORLDS } from '../lib/course';
import { titleLine } from '../lib/words';
import { LaunchArt, LevelIcon } from './pics';

const blur = (action: () => void) => (event: { currentTarget: HTMLButtonElement }) => { event.currentTarget.blur(); action(); };

export function Title({ level, quick, onStart, onLevels, onQuick, children }: { level: number; quick: boolean; onStart: () => void; onLevels: () => void; onQuick: (on: boolean) => void; children?: ReactNode }) {
  const spec = levelOf(level), world = WORLDS[spec.world];
  return <div className="uk-title">
    <button type="button" className="uk-launch" onClick={blur(onStart)} aria-label={`খেলো: লেভেল ${bn(placeOf(level))}, ${spec.finale ?? spec.title}`}>
      <LaunchArt />
      <span className="uk-launch-go" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 4.5v15l12.5-7.5z" /></svg>খেলো</span>
    </button>
    <div className="uk-paces" role="group" aria-label="কেমন করে খেলবে">
      <button type="button" aria-pressed={!quick} onClick={blur(() => onQuick(false))}>
        <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 30h32M12 30a12 12 0 0 1 24 0M24 12v-3M12 17l-2-2M36 17l2-2" /></svg>আরামে
      </button>
      <button type="button" aria-pressed={quick} onClick={blur(() => onQuick(true))}>
        <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="27" r="14" /><path d="M24 27V18M20 9h8M36 14l3-3" /></svg>চটপট <small>৭+</small>
      </button>
    </div>
    <p className="uk-title-line" aria-live="polite">{titleLine(quick)}</p>
    <button type="button" className="uk-chip" onClick={blur(onLevels)} aria-label={`লেভেল ${bn(placeOf(level))}, ${spec.finale ?? spec.title}। সব লেভেল দেখো`}>
      <span className="uk-chip-icon" aria-hidden="true"><LevelIcon kind={spec.kind} bell={!!spec.run} /></span>
      <span><b>লেভেল {bn(placeOf(level))} · {spec.finale ?? spec.title}</b><small>{world.name}</small></span>
      <svg className="uk-chip-more" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14" /></svg>
    </button>
    {children}
  </div>;
}
