'use client';
// The note grid: five rows (high notes on top), one column per beat. A cell sounds and lights on the first finger's
// pointerdown. While a tune plays, the playing column is tinted and each sounding cell rings, so the game works fully
// silent. A gap level shows its locked notes and a dashed box where a note is missing.
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import { bn } from '../../../shared/kids-kit';
import { has, NOTES, ROW_COLORS, type Tune } from '../lib/music';
import { Finger, ROW_ORDER } from './pictures';

export type Cell = { step: number; row: number };
export type GridView = {
  shown: Tune;
  /** Locked notes of a gap level. */
  given: Tune | null;
  /** The columns a finger may change on a gap level (null: all). */
  gaps: readonly number[] | null;
  hint: Tune | null;
  wobble: Tune | null;
  head: number;
  /** The notes sounding at the head column (the tune being played, not always the one shown). */
  sounding: Tune | null;
  fresh: Cell | null;
  ghost: Cell | null;
};

const MOVES: Record<string, [number, number]> = { ArrowUp: [0, 1], ArrowDown: [0, -1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };

export function NoteGrid({ view, onTap }: { view: GridView; onTap: (step: number, row: number, viaKey: boolean) => void }) {
  const { shown, given, gaps, hint, wobble, head, sounding, fresh, ghost } = view;
  const steps = shown.length;
  const move = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const delta = MOVES[event.key], from = (event.target as HTMLElement).closest<HTMLElement>('[data-s]');
    if (!delta || !from) return;
    event.preventDefault();
    const step = Math.max(0, Math.min(steps - 1, Number(from.dataset.s) + delta[0])), row = Math.max(0, Math.min(NOTES.length - 1, Number(from.dataset.r) + delta[1]));
    event.currentTarget.querySelector<HTMLElement>(`[data-s="${step}"][data-r="${row}"]`)?.focus();
  };
  return <div className="sb-grid" style={{ '--steps': steps } as CSSProperties} role="group" aria-label={`সুরের ঘর: ${bn(steps)}টা তাল, ${bn(NOTES.length)}টা নোট`} onKeyDown={move}>
    {ROW_ORDER.map(row => shown.map((_, step) => {
      const on = has(shown, step, row), locked = !!given && has(given, step, row);
      const closed = !!gaps && !gaps.includes(step);
      const ringing = !!sounding && head === step && has(sounding, step, row);
      const cls = ['sb-cell', on && 'on', locked && 'given', closed && 'closed', gaps && !closed && !on && 'gap', head === step && 'head', ringing && 'ping',
        fresh && fresh.step === step && fresh.row === row && 'fresh', hint && has(hint, step, row) && !on && 'hint', wobble && has(wobble, step, row) && 'wobble'].filter(Boolean).join(' ');
      return <button type="button" key={`${row}-${step}`} className={cls} style={{ '--c': ROW_COLORS[row] } as CSSProperties} data-s={step} data-r={row}
        aria-pressed={on} aria-disabled={closed || undefined} tabIndex={closed ? -1 : undefined} aria-label={`${NOTES[row]}, ${bn(step + 1)} নম্বর তাল${locked ? ', আগে থেকেই আছে' : ''}`}
        onPointerDown={(event: ReactPointerEvent<HTMLButtonElement>) => {
          // Only the first finger counts (a palm or a second finger is ignored), and only the main mouse button.
          if (!event.isPrimary || event.button !== 0) return;
          event.preventDefault();
          onTap(step, row, false);
        }}
        // A key press or a screen reader's activation (a click with no pointer); a finger already acted on pointerdown.
        onClick={event => { if (event.detail === 0) onTap(step, row, true); }}>
        <span aria-hidden="true">{NOTES[row]}</span>
        {ghost && ghost.step === step && ghost.row === row && <Finger />}
      </button>;
    }))}
  </div>;
}
