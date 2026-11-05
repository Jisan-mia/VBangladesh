// The round's phase and its clock, as a pure reducer: the component passes performance.now() in, so tests replay
// every statechart path exactly. The clock runs exactly while phase is "playing".
import { clockSeconds } from "./tick.hot";

export type Phase = "ready" | "playing" | "paused" | "over";
/** Why a round is paused: you went away (blur, hidden tab, the player's menu) or you opened the level sheet. */
export type Why = "away" | "sheet";
export type Session = { phase: Phase; base: number; since: number; why: Why | null };

/** A grid on its start card. `elapsed` is a saved half-done grid's time, so চালিয়ে যাও goes on from there. */
export const ready = (elapsed = 0): Session => ({ phase: "ready", base: Math.max(0, elapsed), since: 0, why: null });

export const elapsed = (s: Session, now: number) => clockSeconds(s.base, s.since, s.phase === "playing", now);

/** শুরু করো / চালিয়ে যাও on the start card. */
export const begin = (s: Session, now: number): Session => s.phase === "ready" ? { phase: "playing", base: s.base, since: now, why: null } : s;

/** Stops the clock. A sheet pause outranks an away pause: coming back from another window doesn't close the sheet. */
export function pause(s: Session, now: number, why: Why): Session {
  if (s.phase === "playing") return { phase: "paused", base: elapsed(s, now), since: 0, why };
  if (s.phase === "paused" && why === "sheet" && s.why !== "sheet") return { ...s, why };
  return s;
}

/** Starts the clock again, but only from the pause this action ended (চালিয়ে যাও ends "away", closing the sheet ends "sheet"). */
export const resume = (s: Session, now: number, why: Why): Session =>
  s.phase === "paused" && s.why === why ? { phase: "playing", base: s.base, since: now, why: null } : s;

/** The last right digit: the clock stops for good. */
export const finish = (s: Session, now: number): Session => s.phase === "playing" ? { phase: "over", base: elapsed(s, now), since: 0, why: null } : s;

/** Moves are taken only while the clock runs. */
export const canMove = (s: Session) => s.phase === "playing";
