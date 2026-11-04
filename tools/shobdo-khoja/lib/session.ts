// The round's phase and its clock, as a pure reducer: the component passes performance.now() in, so the tests replay
// every statechart path exactly. The clock runs exactly while the phase is "playing".
import { clockSeconds } from "./tick.hot";

export type Phase = "ready" | "playing" | "paused" | "over";
/** Why a round is paused: you went away (blur, hidden tab, the player's menu), or a sheet is open (levels, or the ask). */
export type Why = "away" | "sheet";
export type Session = { phase: Phase; base: number; since: number; why: Why | null };

/** A page on its start card, the grid still hidden. */
export const ready = (): Session => ({ phase: "ready", base: 0, since: 0, why: null });

export const elapsed = (s: Session, now: number) => clockSeconds(s.base, s.since, s.phase === "playing", now);

/** খোঁজা শুরু on the start card. */
export const begin = (s: Session, now: number): Session => s.phase === "ready" ? { phase: "playing", base: 0, since: now, why: null } : s;

/** Stops the clock. A sheet outranks an away pause: coming back from another window doesn't close the sheet. */
export function pause(s: Session, now: number, why: Why): Session {
  if (s.phase === "playing") return { phase: "paused", base: elapsed(s, now), since: 0, why };
  if (s.phase === "paused" && why === "sheet" && s.why !== "sheet") return { ...s, why };
  return s;
}

/** Starts the clock again, but only from the pause this action ends (চালিয়ে যাও ends "away", closing a sheet ends "sheet"). */
export const resume = (s: Session, now: number, why: Why): Session =>
  s.phase === "paused" && s.why === why ? { phase: "playing", base: s.base, since: now, why: null } : s;

/** The last word struck: the clock stops for good. */
export const finish = (s: Session, now: number): Session => s.phase === "playing" ? { phase: "over", base: elapsed(s, now), since: 0, why: null } : s;

/** Strokes, taps and hints count only while the clock runs. */
export const canMove = (s: Session) => s.phase === "playing";

/** A round someone has started and not finished: leaving it needs a yes. */
export const started = (s: Session) => s.phase === "playing" || s.phase === "paused";
