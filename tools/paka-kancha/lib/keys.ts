// What a key does, as a pure decision: the component passes the key, where it landed and what the game is doing, and acts on the
// answer. The statechart's "EnterChecksTheRow" lives here: with four digits typed, Enter checks the row whatever pad button last
// held focus, and never erases a digit or restarts a level.
import { asciiDigits } from './rules';
import type { Screen } from './flow';

/** field: a text box · pad: a key of the number pad · button: any other button, link or summary · page: nothing focused. */
export type Landed = 'field' | 'pad' | 'button' | 'page';
export type KeyContext = { screen: Screen; held: boolean; inView: boolean; over: boolean; typed: number; length: number };
export type KeyAction =
  | { type: 'digit'; digit: string } | { type: 'erase' } | { type: 'check' } | { type: 'pause' } | { type: 'start' } | { type: 'next' }
  | { type: 'level'; by: -1 | 1 } | null;

export function landedOn(target: Element | null): Landed {
  if (!target?.closest) return 'page';
  if (target.closest('input, textarea, select, [contenteditable]')) return 'field';
  if (target.closest('.pk-pad')) return 'pad';
  return target.closest('button, a, summary') ? 'button' : 'page';
}

export function decideKey(
  event: { key: string; repeat: boolean; altKey: boolean; ctrlKey: boolean; metaKey: boolean }, landed: Landed, c: KeyContext,
): KeyAction {
  if (event.altKey || event.ctrlKey || event.metaKey || landed === 'field' || !c.inView || c.held) return null;
  const enter = event.key === 'Enter' || event.key === ' ';
  // On the pad with four digits typed, Enter is দেখো whichever key holds focus. Any other focused button does its own job.
  if (c.screen === 'play' && event.key === 'Enter' && landed === 'pad') return c.over || event.repeat || c.typed < c.length ? null : { type: 'check' };
  if (enter && landed !== 'page') return null;
  if (c.screen === 'title') {
    if (enter) return event.repeat ? null : { type: 'start' };
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') return { type: 'level', by: event.key === 'ArrowLeft' ? -1 : 1 };
    return null;
  }
  if (c.screen === 'over') return enter ? { type: 'next' } : null;
  if (event.key === 'p' || event.key === 'P') return event.repeat ? null : { type: 'pause' };
  const digit = asciiDigits(event.key);
  if (/^\d$/.test(digit)) return c.over ? null : { type: 'digit', digit };
  if (event.key === 'Backspace') return c.over ? null : { type: 'erase' };
  if (event.key === 'Enter') return c.over || event.repeat || c.typed < c.length ? null : { type: 'check' };
  return null;
}
