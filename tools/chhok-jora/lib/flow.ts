// The screen, what holds play, and the game clock, as a pure reducer: the component passes performance.now() in, so the
// statechart paths (ai_docs/statecharts/chhok-jora) replay exactly in node tests.
//
// Play runs only while nothing holds it: the player's menu (`menu`), another window or a hidden tab (`away`), or the level
// sheet (`sheet`). While anything holds, no bot sews (on the quilt or in কাটাকুটি) and the clock doesn't count. The quilt's bot
// can only run on the "play" screen, and কাটাকুটি is its own screen, so the quilt never moves under it. Coming back starts a
// short guard, so the tap that brings the window back is never a stitch. Two people get the same guard when the phone changes hands.
import { clockSeconds } from "./count.hot";

export type Screen = "title" | "play" | "over" | "kata";
export type Flow = {
  screen: Screen;
  menu: boolean;
  away: boolean;
  sheet: boolean;
  /** Seconds banked on the clock, and when it last started running (ms). */
  base: number;
  since: number;
  /** When the result appeared, when you last came back, and when the phone last changed hands (ms). */
  overAt: number;
  backAt: number;
  handAt: number;
  /** The end-of-game cheer belongs to the result on screen; anything that leaves the result drops it (and cuts its notes). */
  cheer: boolean;
};

/** A tap within this long of coming back only wakes the cloth. */
export const BACK_GUARD_MS = 350;
/** Two people: a tap within this long of the turn passing is the passer's, not the next player's stitch. */
export const HAND_GUARD_MS = 350;
/** A key held through the last stitch can't act on the result: only a fresh press this long after it appears. */
export const RESULT_GUARD_MS = 400;
/** The bot's beat before a stitch, and while it takes a chain; ধীরে খেলো gives longer ones. */
export const BOT_MS = 520;
export const BOT_CHAIN_MS = 300;
export const SLOW_BOT_MS = 1100;
export const SLOW_BOT_CHAIN_MS = 700;

export const titleFlow = (away = false): Flow => ({ screen: "title", menu: false, away, sheet: false, base: 0, since: 0, overAt: 0, backAt: -Infinity, handAt: -Infinity, cheer: false });

export const held = (f: Flow) => f.menu || f.away || f.sheet;
/** The quilt is live and nothing holds it: the clock counts and its bot may sew. */
export const running = (f: Flow) => f.screen === "play" && !held(f);
/** কাটাকুটি is on screen and nothing holds it: its bot may mark. */
export const kataRunning = (f: Flow) => f.screen === "kata" && !held(f);
export const elapsed = (f: Flow, now: number) => clockSeconds(f.base, f.since, running(f), now);

/** Re-times the clock around a change: banks the run when play stops, restarts it when play starts. */
function retime(before: Flow, after: Flow, now: number): Flow {
  const was = running(before), is = running(after);
  if (was && !is) return { ...after, base: clockSeconds(before.base, before.since, true, now), since: 0 };
  if (!was && is) return { ...after, since: now };
  return after;
}

/** সেলাই শুরু on the title: a fresh clock. */
export const start = (f: Flow, now: number): Flow => f.screen === "title" ? retime(f, { ...f, screen: "play", base: 0, since: 0, overAt: 0, cheer: false }, now) : f;
/** কাটাকুটি from the title. */
export const kata = (f: Flow): Flow => f.screen === "title" ? { ...f, screen: "kata", cheer: false } : f;
/** Back to the title (a new level, নতুন করে শুরু, আবার খেলো, a friend's link). Holds stay as they are; the cheer goes. */
export const toTitle = (f: Flow, now: number): Flow => ({ ...retime(f, { ...f, screen: "title" }, now), base: 0, since: 0, overAt: 0, sheet: false, cheer: false });
/** The last stitch: the clock stops for good, the result guard starts and the cheer plays, in the same step. */
export const finish = (f: Flow, now: number): Flow => f.screen === "play" ? { ...retime(f, { ...f, screen: "over" }, now), overAt: now, cheer: true } : f;

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
/** Two people: the turn just passed to the other player. */
export const handOff = (f: Flow, now: number): Flow => ({ ...f, handAt: now });

/** Not right after you came back: the click that brings the window back (or closes the menu) never sews, starts or picks. */
export const awake = (f: Flow, now: number) => now - f.backAt >= BACK_GUARD_MS;
/** A press on the cloth counts only while play runs, not right after you came back, and not right after the phone changed hands. */
export const takesTap = (f: Flow, now: number) => running(f) && awake(f, now) && now - f.handAt >= HAND_GUARD_MS;
/** Enter or Space on the result: only a fresh press (not a repeat) that arrives after the guard. */
export const takesResultKey = (f: Flow, now: number, repeat: boolean) => f.screen === "over" && !repeat && !held(f) && now - f.overAt >= RESULT_GUARD_MS;
