// The screen, what holds play, the star clock and the finger on a bush, as a pure reducer: the component passes
// performance.now() in, so the statechart paths (ai_docs/statecharts/bhimruler-chak) replay exactly in node tests.
//
// Play runs only while nothing holds it: the player's menu (`menu`), another window or a hidden tab (`away`), or the level
// sheet (`sheet`). While anything holds, no bush, key or hint acts, the clock stops, the hornets' hum is silent, and a finger
// held on a bush is let go, so its long press can never tie a গামছা behind your back. Coming back (`away` ends, or the menu
// closes) starts a short guard, so the tap that brings the window back is never a move.
import { clockSeconds } from "./count.hot";

export type Screen = "title" | "play" | "over";
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
  /** The bush a finger is held on (its long press ties a গামছা), or -1. */
  hold: number;
};

/** A tap within this long of coming back only wakes the orchard. */
export const BACK_GUARD_MS = 350;
/** A key held through the last bush can't act on the result: only a fresh press this long after it appears. */
export const RESULT_GUARD_MS = 400;
/** How long a finger stays down before it ties a গামছা (longer in ধীরে খেলো, which changes nothing about stars). */
export const holdMs = (slow: boolean) => slow ? 560 : 400;

export const titleFlow = (away = false): Flow => ({ screen: "title", menu: false, away, sheet: false, base: 0, since: 0, overAt: 0, backAt: -Infinity, hold: -1 });

export const held = (f: Flow) => f.menu || f.away || f.sheet;
/** An orchard is live and nothing holds it: bushes act, the clock counts, the hum may play. */
export const running = (f: Flow) => f.screen === "play" && !held(f);
export const elapsed = (f: Flow, now: number) => clockSeconds(f.base, f.since, running(f), now);

/** Re-times the clock around a change: banks the run when play stops, restarts it when play starts. Any hold lets go of the finger. */
function retime(before: Flow, after: Flow, now: number): Flow {
  const was = running(before), is = running(after);
  const next = is ? after : { ...after, hold: -1 };
  if (was && !is) return { ...next, base: clockSeconds(before.base, before.since, true, now), since: 0 };
  if (!was && is) return { ...next, since: now };
  return next;
}

/** বাগানে ঢোকো on the start card: the path opens and the clock starts from zero. */
export const start = (f: Flow, now: number): Flow => f.screen === "title" ? retime(f, { ...f, screen: "play", base: 0, since: 0, overAt: 0 }, now) : f;
/** Back to the start card (a level picked, নতুন করে শুরু, আবার খেলো, a friend's link). Holds stay as they are; the sheet closes. */
export const toTitle = (f: Flow): Flow => ({ ...f, screen: "title", base: 0, since: 0, overAt: 0, sheet: false, hold: -1 });
/** The last safe bush, or the swarm: the clock stops for good and the result guard starts. */
export const finish = (f: Flow, now: number): Flow => f.screen === "play" ? { ...retime(f, { ...f, screen: "over" }, now), overAt: now, hold: -1 } : f;

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

/** Not right after you came back: the click that brings the window back (or closes the menu) never clears, ties or goes on. */
export const awake = (f: Flow, now: number) => now - f.backAt >= BACK_GUARD_MS;
/** A finger, mouse or key on the orchard counts only while play runs, and not right after you came back. */
export const takesPress = (f: Flow, now: number) => running(f) && awake(f, now);
/** Enter, Space or 1–3 on the result: only a fresh press (not a repeat) that arrives after the guard. */
export const takesResultKey = (f: Flow, now: number, repeat: boolean) => f.screen === "over" && !repeat && !held(f) && now - f.overAt >= RESULT_GUARD_MS;

/** A finger goes down on a bush: it is held only if the press counts. */
export const pressDown = (f: Flow, cell: number, now: number): Flow => takesPress(f, now) ? { ...f, hold: cell } : f;
/** The finger lifts, travels (a scroll) or the browser cancels it. */
export const pressUp = (f: Flow): Flow => f.hold < 0 ? f : { ...f, hold: -1 };
/** The long press's timer: it ties only a bush still held, while play runs. Returns the bush to tie, or -1. */
export const holdTies = (f: Flow, cell: number, now: number) => f.hold === cell && takesPress(f, now) ? cell : -1;

/** The hornets' hum plays exactly while this holds: sound on, a live orchard, and at least one sting. */
export const wantsHum = (sound: boolean, f: Flow, stings: number) => sound && running(f) && stings > 0;
