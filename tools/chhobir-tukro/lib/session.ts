// The round's phase and its clock as a pure reducer. The component passes performance.now() in, so the tests replay every
// statechart path exactly. The clock decides the stars, so it runs exactly while the phase is "playing": never on the
// title, in the story, while paused (another window, a hidden tab, the player's menu, the level sheet) or on the result.
// Drops are taken only while playing and after `hold` (the pieces flying from the broken picture into the tray).
import { clockMs } from "./table.hot";

export type Phase = "title" | "story" | "playing" | "paused" | "over";
/** Why play is paused: you went away (blur, a hidden tab, the player's menu) or you opened the level sheet. */
export type Why = "away" | "sheet";
export type Session = { phase: Phase; why: Why | null; base: number; since: number; hold: number; endedAt: number };

/** How long the pieces fly from the broken picture to the tray; the clock and drops wait for it. */
export const SCATTER_MS = 640;
/** A result-screen key must arrive this long after the result appears, and as a fresh press. */
export const RESULT_GUARD_MS = 400;

export const title = (): Session => ({ phase: "title", why: null, base: 0, since: 0, hold: 0, endedAt: 0 });

export const elapsed = (s: Session, now: number) => clockMs(s.base, s.since, s.phase === "playing", now);

const playing = (now: number, calm: boolean): Session => {
  const hold = now + (calm ? 0 : SCATTER_MS);
  return { phase: "playing", why: null, base: 0, since: hold, hold, endedAt: 0 };
};

/** খেলো on the title: the story first (first run only), else into play once the pieces land. */
export function begin(s: Session, now: number, story: boolean, calm: boolean): Session {
  if (s.phase !== "title") return s;
  return story ? { ...s, phase: "story" } : playing(now, calm);
}

/** The story's last panel, or a hold to skip it. */
export const storyDone = (s: Session, now: number, calm: boolean): Session => (s.phase === "story" ? playing(now, calm) : s);

/** A fresh table straight into play (পরের লেভেল, আবার খেলো, a level from the sheet): no title, no story. */
export const again = (now: number, calm: boolean): Session => playing(now, calm);

/** Stops the clock. A sheet pause outranks an away pause, so coming back from another window doesn't close the sheet. */
export function pause(s: Session, now: number, why: Why): Session {
  if (s.phase === "playing") return { ...s, phase: "paused", why, base: elapsed(s, now), since: 0, hold: Math.max(0, s.hold - now) };
  if (s.phase === "paused" && why === "sheet" && s.why !== "sheet") return { ...s, why };
  return s;
}

/** Starts the clock again, but only from the pause this action ends: চালিয়ে যাও ends "away", closing the sheet ends "sheet". */
export function resume(s: Session, now: number, why: Why): Session {
  if (s.phase !== "paused" || s.why !== why) return s;
  // `hold` was kept as the flight time still to go; the clock restarts when the pieces have landed.
  const hold = now + s.hold;
  return { ...s, phase: "playing", why: null, since: hold, hold };
}

/** The last piece landed: the clock stops for good. */
export const finish = (s: Session, now: number): Session =>
  s.phase === "playing" ? { ...s, phase: "over", why: null, base: elapsed(s, now), since: 0, endedAt: now } : s;

/** A drop or a pick counts only while playing, after the scatter. */
export const canPlay = (s: Session, now: number) => s.phase === "playing" && now >= s.hold;

/** Whole seconds on the clock: the HUD and the result use the same rounding, so ০:০৯ never becomes ১০ সেকেন্ড. */
export const seconds = (s: Session, now: number) => Math.max(s.phase === "over" ? 1 : 0, Math.round(elapsed(s, now) / 1000));

/** Enter or Space on the result: only a fresh press that arrives after the result appeared (a held key never skips it). */
export const resultKey = (s: Session, at: number, repeat: boolean) => s.phase === "over" && !repeat && at >= s.endedAt + RESULT_GUARD_MS;
