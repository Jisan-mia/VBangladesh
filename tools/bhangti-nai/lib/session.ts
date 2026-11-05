// A shift's play as a pure reducer: the component passes performance.now() in, so the tests replay every statechart path
// exactly. Every timed thing (the bell, the customer's patience, the beat after a right answer, the walk-off after a late one)
// is one phase clock that runs only while nothing pauses it, so nothing can happen behind a hidden tab, a blur, the menu
// or a sheet. In particular the day can only close from a clock you can see run.
import { clockMs } from './tick.hot';

/**
 * ready: the bell on the counter · opening: it rings and the first customer steps in · serve: the customer waits and their
 * patience runs · right: the happy beat after the right change · late: the customer huffs off · over: the ledger.
 */
export type Phase = 'ready' | 'opening' | 'serve' | 'right' | 'late' | 'over';
/** Why play is paused: you went away (blur, a hidden tab, the player's menu), or a sheet is open (সব দিন). */
export type Why = 'away' | 'sheet';
/** `index` the customer, `dur` ms the phase lasts (0: until you act), `spent` ms banked on its clock, `since` when it last started running. */
export type Session = { phase: Phase; index: number; dur: number; spent: number; since: number; why: Why | null };
export type Timing = { open: number; right: number; late: number; breath: number };

export const TIMING: Timing = { open: 600, right: 850, late: 2000, breath: 600 };
/** ধীরে খেলো: the same patience, calmer changes, and a customer lingers a little longer. */
export const SLOW_TIMING: Timing = { open: 600, right: 1300, late: 2600, breath: 900 };

export const ready = (): Session => ({ phase: 'ready', index: 0, dur: 0, spent: 0, since: 0, why: null });

/** The clock runs: a phase that moves on its own or counts, and nothing pausing it. */
export const running = (s: Session) => s.why === null && s.phase !== 'ready' && s.phase !== 'over';
export const elapsed = (s: Session, now: number) => clockMs(s.spent, s.since, running(s), now);

const enter = (s: Session, phase: Phase, dur: number, since: number, index = s.index): Session => ({ phase, index, dur, spent: 0, since, why: null });

/** ঘণ্টা বাজাও: the bell rings and the first customer steps in. */
export const begin = (s: Session, now: number, t: Timing): Session => s.phase === 'ready' ? enter(s, 'opening', t.open, now) : s;

/** The clock moves the phase on when its time is up, carrying any overshoot so nothing drifts. `limits` is each customer's patience in ms (0: no clock). */
export function tick(s: Session, now: number, limits: readonly number[], t: Timing): Session {
  if (!running(s) || !s.dur) return s;
  const el = elapsed(s, now);
  if (el < s.dur) return s;
  const at = now - (el - s.dur), last = s.index >= limits.length - 1;
  switch (s.phase) {
    case 'opening': return enter(s, 'serve', limits[0], at, 0);
    case 'serve': return enter(s, 'late', t.late, at);
    case 'right': case 'late': return last ? enter(s, 'over', 0, at) : enter(s, 'serve', limits[s.index + 1], at, s.index + 1);
    default: return s;
  }
}

/** Handing over counts only while the customer's clock runs. */
export const canAct = (s: Session) => s.phase === 'serve' && running(s);
/** The ms the customer has been waiting: what a hand-over now is timed at. */
export const waitedMs = (s: Session, now: number) => s.phase === 'serve' ? Math.round(elapsed(s, now)) : 0;

/** The right change: a happy beat, then the next customer. */
export const served = (s: Session, now: number, t: Timing): Session => canAct(s) ? enter(s, 'right', t.right, now) : s;

/** A wrong count in a finale takes `ms` off the customer's patience (their bar jumps, their face turns). */
export const hurt = (s: Session, ms: number): Session => canAct(s) && s.dur > 0 ? { ...s, spent: s.spent + ms } : s;

/** Stops the clock. A sheet outranks an away pause: coming back from another window doesn't close the sheet. */
export function pause(s: Session, now: number, why: Why): Session {
  if (running(s)) return { ...s, spent: elapsed(s, now), why };
  if (s.why !== null && why === 'sheet' && s.why !== 'sheet') return { ...s, why };
  return s;
}

/** Starts the clock again after a short breath, but only from the pause this action ends. */
export const resume = (s: Session, now: number, why: Why, breath: number): Session =>
  s.why !== null && s.why === why ? { ...s, why: null, since: now + breath } : s;

/** A shift someone has started and not finished. */
export const started = (s: Session) => s.phase !== 'ready' && s.phase !== 'over';
/** The last customer is decided (the clock is in their right beat or their walk-off): the day's result is final. */
export const decided = (s: Session, count: number) => (s.phase === 'right' || s.phase === 'late' || s.phase === 'over') && s.index >= count - 1;
