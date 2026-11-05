"use client";
// The চরকি: a round face of 2 or 3 sectors with 1, 2 (and 3) dots. The red pointer turns and stops on one. No prizes, only
// the number of ghats to count. The dots it landed on repeat beside it as pips, so the number is seen, not read.
import type { CSSProperties, MouseEvent, PointerEvent, ReactNode } from "react";
import { SECTORS, SECTOR_FILL } from "../lib/art";
import { bn } from "../lib/levels";

/** Acts on the first finger at once (a 50 ms answer), and on keyboard or scripted clicks; ignores a second finger or the palm. */
export const press = (action: (element: HTMLElement) => void) => ({
  onPointerDown: (event: PointerEvent<HTMLElement>) => { if (event.isPrimary && event.button <= 0) { event.preventDefault(); action(event.currentTarget); } },
  onClick: (event: MouseEvent<HTMLElement>) => { if (event.detail === 0) action(event.currentTarget); },
});

export function Ghost({ className = "" }: { className?: string }) {
  return <svg className={`dg-ghost ${className}`} viewBox="0 0 48 60" aria-hidden="true">
    <circle className="dg-ripple" cx="19" cy="9" r="9" />
    <path d="M14 30V8a5 5 0 0 1 10 0v16l12 2a6 6 0 0 1 5 7l-2 13a10 10 0 0 1-10 9H19a9 9 0 0 1-7-4L3 39a4.5 4.5 0 0 1 7-5z" fill="#fff" stroke="#1d2b53" strokeWidth="2.5" strokeLinejoin="round" />
  </svg>;
}

export function Face({ faces, angle, ms, slow }: { faces: 2 | 3; angle: number; ms: number; slow: boolean }) {
  return <svg viewBox="0 0 100 100" aria-hidden="true">
    {SECTORS[faces].map((sector, index) => <path key={index} d={sector.path} fill={SECTOR_FILL[index]} stroke="#1d2b53" strokeWidth="1.5" />)}
    <circle cx="50" cy="50" r="46" fill="none" stroke="#1d2b53" strokeWidth="4" />
    {SECTORS[faces].map((sector, index) => sector.dots.map(([x, y], dot) => <circle key={`${index}-${dot}`} cx={x} cy={y} r={faces === 2 ? 6.5 : 5.5} fill="#1d2b53" />))}
    <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: "50px 50px", transition: slow ? "none" : `transform ${ms}ms cubic-bezier(.2,.7,.2,1)` }}>
      <path d="M50 52V14" stroke="#c0392b" strokeWidth="6" strokeLinecap="round" /><path d="M50 5l-9 14h18z" fill="#c0392b" /><circle cx="50" cy="50" r="7" fill="#c0392b" />
    </g>
  </svg>;
}

/** The big চরকি you press. `turn` colours its rim with the boat whose hand it is. */
export function Spinner({ faces, angle, ms, slow, active, ghost, onSpin, turn }: { faces: 2 | 3; angle: number; ms: number; slow: boolean; active: boolean; ghost: boolean; onSpin: () => void; turn: 0 | 1 }) {
  return <button type="button" className="dg-spin" data-active={active || undefined} data-turn={turn} aria-label="চরকি ঘোরাও" {...press(onSpin)}>
    <Face faces={faces} angle={angle} ms={ms} slow={slow} />{ghost && <Ghost />}
  </button>;
}

/** One dot per ghat to go, big enough to count by eye. */
export function Pips({ value, who }: { value: number; who: 0 | 1 }): ReactNode {
  if (!value) return <span className="dg-pips" aria-hidden="true" />;
  return <span className={`dg-pips dg-pips-${who}`} role="img" aria-label={`${bn(value)} ঘাট যাবে`}>{Array.from({ length: value }, (_, index) => <i key={index} style={{ "--i": index } as CSSProperties} />)}</span>;
}
