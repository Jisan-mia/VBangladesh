// The round's phase and its clock as a pure reducer. The component passes performance.now() in, so the tests replay every
// statechart path exactly. There is no time pressure in a traffic jam: the clock is only a stat for the end screen, and it
// runs exactly while the phase is "playing". A move is taken only while playing.
import { clockMs } from "./motion.hot";

export type Phase = "title" | "story" | "playing" | "paused" | "over";
/** Why play is paused: you went away (blur, a hidden tab, the player's menu) or you opened the level sheet. */
export type Why = "away" | "sheet";
export type Session = { phase: Phase; why: Why | null; base: number; since: number; endedAt: number };

/** A result-screen key must arrive this long after the result appears, and as a fresh press. */
export const RESULT_GUARD_MS = 400;

export const title = (): Session => ({ phase: "title", why: null, base: 0, since: 0, endedAt: 0 });
const running = (now: number): Session => ({ phase: "playing", why: null, base: 0, since: now, endedAt: 0 });

export const elapsed = (s: Session, now: number) => clockMs(s.base, s.since, s.phase === "playing", now);

/** খেলো on the title: the story first (first run only), else straight into play. */
export function begin(s: Session, now: number, story: boolean): Session {
  if (s.phase !== "title") return s;
  return story ? { ...s, phase: "story" } : running(now);
}

/** The story's last panel, or a hold to skip it. */
export const storyDone = (s: Session, now: number): Session => s.phase === "story" ? running(now) : s;

/** A fresh jam straight into play (পরের জ্যাম, আরেকবার, a jam from the sheet): no title, no story. */
export const again = (now: number): Session => running(now);

/** Stops the clock. A sheet pause outranks an away pause, so coming back from another window doesn't close the sheet. */
export function pause(s: Session, now: number, why: Why): Session {
  if (s.phase === "playing") return { ...s, phase: "paused", why, base: elapsed(s, now), since: 0 };
  if (s.phase === "paused" && why === "sheet" && s.why !== "sheet") return { ...s, why };
  return s;
}

/** Starts the clock again, but only from the pause this action ends: চালিয়ে যাও ends "away", closing the sheet ends "sheet". */
export const resume = (s: Session, now: number, why: Why): Session =>
  s.phase === "paused" && s.why === why ? { ...s, phase: "playing", why: null, since: now } : s;

/** The last vehicle left: the clock stops for good. */
export const finish = (s: Session, now: number): Session =>
  s.phase === "playing" ? { ...s, phase: "over", why: null, base: elapsed(s, now), since: 0, endedAt: now } : s;

/** A move counts only while playing. */
export const canMove = (s: Session) => s.phase === "playing";

/** Enter or Space on the result: only a fresh press that arrives after the result appeared (a held key never skips it). */
export const resultKey = (s: Session, at: number, repeat: boolean) => s.phase === "over" && !repeat && at >= s.endedAt + RESULT_GUARD_MS;
