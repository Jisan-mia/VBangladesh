'use client';
// The title inside the stage: a school-notebook cover (খাতার মলাট) in the world's colour, with the set's first letter on
// its paper label in dotted strokes and a dot that draws it again and again. The whole cover is the start button, the
// biggest thing on screen. Under it, small: the set chip (opens the list) and one line for a parent.
import type { ReactNode } from 'react';
import { bn, levelOf, nextInOrder, placeOf, worldOf } from '../lib/levels';
import { pathOf, strokesOf } from '../lib/strokes';
import { GuideLetter, StartDot, StrokeLine } from './marks';

export function Title({ level, still, onStart, onLevels, children }: { level: number; still: boolean; onStart: () => void; onLevels: () => void; children?: ReactNode }) {
  const spec = levelOf(level), world = worldOf(level), letter = spec.letters[0], strokes = strokesOf(letter), first = strokes[0];
  return <div className="bl-title">
    <button type="button" className="bl-cover" onClick={event => { event.currentTarget.blur(); onStart(); }} aria-label={`খেলো: সেট ${bn(placeOf(level))}, ${spec.title}`}>
      <span className="bl-cover-label">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <GuideLetter char={letter} />
          {strokes.map((stroke, index) => <StrokeLine key={index} stroke={stroke} className={index === 0 ? 'bl-now' : 'bl-later'} />)}
          {!first.dot && <StartDot stroke={first} n={1} className="bl-start bl-glow" />}
          {!still && !first.dot && <g className="bl-title-pen">
            <circle r={2.7} className="bl-pen">
              <animateMotion dur="2.8s" repeatCount="indefinite" path={pathOf(first.line)} keyPoints="0;1;1" keyTimes="0;0.65;1" calcMode="linear" />
            </circle>
          </g>}
        </svg>
      </span>
      <span className="bl-cover-go" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 4.5v15l12.5-7.5z" /></svg>খেলো</span>
    </button>
    <button type="button" className="bl-chip" onClick={event => { event.currentTarget.blur(); onLevels(); }} aria-label={`সেট ${bn(placeOf(level))}, ${spec.title}। সব সেট দেখো`}>
      <span className="bl-chip-no" aria-hidden="true">{bn(placeOf(level))}</span>
      <span className="bl-chip-name"><b>{spec.finale ?? spec.title}</b><small>{world.name}{nextInOrder(level) ? '' : ' · শেষ সেট'}</small></span>
      <svg className="bl-chip-more" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14" /></svg>
    </button>
    <p className="bl-title-line">ডট ধরে আঙুল টানো।</p>
    {children}
  </div>;
}
