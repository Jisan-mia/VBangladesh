// The screen, what holds play, and the clock, as a pure reducer: the component passes performance.now() in, so the statechart
// paths (ai_docs/statecharts/paka-kancha) replay exactly in node tests.
//
// Play runs only while nothing holds it: the player's menu (`menu`), another window or a hidden tab (`away`), or the level
// sheet (`sheet`). While anything holds, no digit, key or দেখো acts and the clock stops. Coming back (`away` ends, or the menu
// closes) starts a short guard, so the tap that brings the window back is never a move.
import { clockSeconds } from './count.hot';

export type Screen = 'title' | 'play' | 'over';
export type Flow = {
  screen: Screen;
  menu: boolean;
  away: boolean;
  sheet: boolean;
  /** Seconds banked on the clock, and when it last started running (ms). */
  base: number;
  since: number;
  /** When the result appeared, and when you last came back (ms): the guards below. */
  overAt: number;
  backAt: number;
};

/** A tap within this long of coming back only wakes the board. */
export const BACK_GUARD_MS = 350;
/** A key held through the last try can't act on the result: only a fresh press this long after it appears. */
export const RESULT_GUARD_MS = 400;

export const titleFlow = (away = false): Flow => ({ screen: 'title', menu: false, away, sheet: false, base: 0, since: 0, overAt: 0, backAt: -Infinity });

export const held = (f: Flow) => f.menu || f.away || f.sheet;
/** A game is live and nothing holds it: digits and দেখো act, the clock counts. */
export const running = (f: Flow) => f.screen === 'play' && !held(f);
export const elapsed = (f: Flow, now: number) => clockSeconds(f.base, f.since, running(f), now);

/** Re-times the clock around a change: banks the run when play stops, restarts it when play starts. */
function retime(before: Flow, after: Flow, now: number): Flow {
  const was = running(before), is = running(after);
  if (was && !is) return { ...after, base: clockSeconds(before.base, before.since, true, now), since: 0 };
  if (!was && is) return { ...after, since: now };
  return after;
}

/** শুরু করো on the start card: a fresh clock. */
export const start = (f: Flow, now: number): Flow => f.screen === 'title' ? retime(f, { ...f, screen: 'play', base: 0, since: 0, overAt: 0 }, now) : f;
/** Back to the start card (a level picked, নতুন করে শুরু, a friend's link). Holds stay as they are; the sheet closes. */
export const toTitle = (f: Flow): Flow => ({ ...f, screen: 'title', base: 0, since: 0, overAt: 0, sheet: false });
/** The result, straight away (today's code, already finished on this phone): no clock, and the guard is already over. */
export const toOver = (f: Flow, now: number): Flow => ({ ...f, screen: 'over', base: 0, since: 0, overAt: now - RESULT_GUARD_MS, sheet: false });
/** The last try is in: the clock stops for good and the result guard starts. */
export const finish = (f: Flow, now: number): Flow => f.screen === 'play' ? { ...retime(f, { ...f, screen: 'over' }, now), overAt: now } : f;

export const menu = (f: Flow, open: boolean, now: number): Flow => {
  const next = retime(f, { ...f, menu: open }, now);
  return open ? next : { ...next, backAt: now };
};
export const away = (f: Flow, gone: boolean, now: number): Flow => {
  if (f.away === gone) return f;
  const next = retime(f, { ...f, away: gone }, now);
  return gone ? next : { ...next, backAt: now };
};
export const sheet = (f: Flow, open: boolean, now: number): Flow => retime(f, { ...f, sheet: open }, now);

/** Not right after you came back: the click that brings the window back (or closes the menu) never types, starts or goes on. */
export const awake = (f: Flow, now: number) => now - f.backAt >= BACK_GUARD_MS;
/** A finger, mouse or key press on the pad counts only while play runs, and not right after you came back. */
export const takesPress = (f: Flow, now: number) => running(f) && awake(f, now);
/** Enter or Space on the result: only a fresh press (not a repeat) that arrives after the guard. */
export const takesResultKey = (f: Flow, now: number, repeat: boolean) => f.screen === 'over' && !repeat && !held(f) && now - f.overAt >= RESULT_GUARD_MS;
