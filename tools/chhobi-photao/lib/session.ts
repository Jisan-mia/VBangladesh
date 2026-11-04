// The round's phase and its clock as a pure reducer. The component passes performance.now() in, so the tests replay every
// statechart path exactly. The clock decides the time on the card, so it runs exactly while the phase is "playing" and
// the first stitch is in: never on the title, in the story, while paused (another window, a hidden tab, the player's menu,
// the level sheet) or on the result. Stitches are taken only while playing.
import { clockMs } from "./anim.hot";

export type Phase = "title" | "story" | "playing" | "paused" | "over";
/** Why play is paused: you went away (blur, a hidden tab, the player's menu) or you opened the level sheet. */
export type Why = "away" | "sheet";
/** `armed` is true once the first stitch is in (the clock waits for it); `since` is null while the clock is stopped. */
export type Session = { phase: Phase; why: Why | null; base: number; since: number | null; armed: boolean; endedAt: number };

/** A result-screen key must arrive this long after the result appears, and as a fresh press. */
export const RESULT_GUARD_MS = 400;

export const title = (): Session => ({ phase: "title", why: null, base: 0, since: null, armed: false, endedAt: 0 });
const playing = (): Session => ({ phase: "playing", why: null, base: 0, since: null, armed: false, endedAt: 0 });

export const elapsed = (s: Session, now: number) => clockMs(s.base, s.since, now);

/** ফোটাও on the title: the story first (first run only), else straight into play. */
export const begin = (s: Session, story: boolean): Session => (s.phase !== "title" ? s : story ? { ...s, phase: "story" } : playing());

/** The story's last panel, or a hold to skip it. */
export const storyDone = (s: Session): Session => (s.phase === "story" ? playing() : s);

/** A fresh board straight into play (পরের লেভেল, আবার খেলো, a level from the sheet): no title, no story. */
export const again = (): Session => playing();

/** The first stitch starts the clock. */
export const arm = (s: Session, now: number): Session => (s.phase === "playing" && !s.armed ? { ...s, armed: true, since: now } : s);

/** Stops the clock. A sheet pause outranks an away pause, so coming back from another window doesn't close the sheet. */
export function pause(s: Session, now: number, why: Why): Session {
  if (s.phase === "playing") return { ...s, phase: "paused", why, base: elapsed(s, now), since: null };
  if (s.phase === "paused" && why === "sheet" && s.why !== "sheet") return { ...s, why };
  return s;
}

/** Starts the clock again, but only from the pause this action ends: চালিয়ে যাও ends "away", closing the sheet ends "sheet". */
export function resume(s: Session, now: number, why: Why): Session {
  if (s.phase !== "paused" || s.why !== why) return s;
  return { ...s, phase: "playing", why: null, since: s.armed ? now : null };
}

/** The last cell went in: the clock stops for good. */
export const finish = (s: Session, now: number): Session =>
  s.phase === "playing" ? { ...s, phase: "over", why: null, base: elapsed(s, now), since: null, endedAt: now } : s;

/** A stitch or a hint counts only while playing. */
export const canPlay = (s: Session) => s.phase === "playing";

/** Whole seconds on the clock: the HUD and the result use the same rounding, so ০:০৯ never becomes ১০ সেকেন্ড. */
export const seconds = (s: Session, now: number) => Math.max(s.phase === "over" ? 1 : 0, Math.round(elapsed(s, now) / 1000));

/** Enter or Space on the result: only a fresh press that arrives after the result appeared (a held key never skips it). */
export const resultKey = (s: Session, at: number, repeat: boolean) => s.phase === "over" && !repeat && at >= s.endedAt + RESULT_GUARD_MS;
