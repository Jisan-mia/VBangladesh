'use client';
// The title inside the stage: the world's own picture is the start button, the biggest thing on screen. Under it, small:
// the level chip (opens the list) and one line for a parent. A fish world shows a pond with three fish already counted.
import type { ReactNode } from 'react';
import { bn } from '../../../shared/kids-kit';
import { levelOf, placeOf, worldOf } from '../lib/levels';
import { DotRow, Fish, ListIcon, Pattern, PlayIcon, WorldIcon } from './pictures';

function Art({ world }: { world: 0 | 1 | 2 }) {
  if (world === 1) return <span className="gd-title-art gd-title-fair">
    <span className="gd-title-die"><Pattern n={5} look="dice" /></span>
    <span className="gd-title-cover" aria-hidden="true">?</span>
  </span>;
  if (world === 2) return <span className="gd-title-art gd-title-two">
    <span className="gd-title-pond"><Fish tint={0} /><Fish tint={1} flip /><Fish tint={2} /></span>
    <span className="gd-title-pond"><Fish tint={3} flip /><Fish tint={0} /></span>
  </span>;
  return <span className="gd-title-art gd-title-ghat">
    {[[8, 10, 0, 1], [54, 6, 1, 2], [28, 46, 2, 3], [60, 56, 3, 0], [6, 68, 0, 0]].map(([x, y, tint, order], index) =>
      <span key={index} className="gd-title-fish" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${index * 160}ms` }}>
        <Fish tint={tint} flip={index % 2 === 1} />{order > 0 && order < 4 && <b>{bn(order)}</b>}
      </span>)}
  </span>;
}

export function Title({ level, onStart, onLevels, children }: { level: number; onStart: () => void; onLevels: () => void; children?: ReactNode }) {
  const spec = levelOf(level), world = worldOf(level);
  return <div className="gd-title">
    <button type="button" className="gd-start" onClick={event => { event.currentTarget.blur(); onStart(); }} aria-label={`খেলো: লেভেল ${bn(placeOf(level))}, ${spec.title}`}>
      <Art world={world.id} />
      <span className="gd-start-go" aria-hidden="true"><PlayIcon />খেলো</span>
    </button>
    <button type="button" className="gd-chip" onClick={event => { event.currentTarget.blur(); onLevels(); }} aria-label={`লেভেল ${bn(placeOf(level))}, ${spec.title}। সব লেভেল দেখো`}>
      <WorldIcon world={world.id} />
      <span><b>লেভেল {bn(placeOf(level))} · {spec.title}</b><small>{world.name}</small></span>
      <span className="gd-chip-more"><ListIcon /></span>
    </button>
    <p className="gd-title-line"><DotRow n={3} /> {spec.finale ? `${world.name}-এর শেষ: ${spec.finale}` : spec.idea}</p>
    {children}
  </div>;
}
