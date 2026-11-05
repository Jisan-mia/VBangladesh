// Stars, bests and the near-miss numbers. Pure.
import type { Deal } from "./deal";
import { maxPoints } from "./levels";
import type { Run } from "./run";

/** The share of graded notes that must land on the tal for ★★★ on a tal level. */
export const TAL_SHARE = 0.8;

export const onBeatShare = (graded: number, onBeat: number) => graded ? onBeat / graded : 1;

/** ★ for clearing; ★★ with at most one slip; ★★★ with none (and, with the tal graded, at least 80% of it on the beat). */
export function starsOf(deal: Deal, s: Run) {
  if (s.done !== "won" || deal.mode !== "ladder") return 0;
  if (s.mistakes >= 2) return 1;
  if (s.mistakes === 1) return 2;
  return !deal.spec.rhythm || onBeatShare(s.graded, s.onBeat) >= TAL_SHARE ? 3 : 2;
}

/** What the player is told they got. Endless runs count notes; the ladder counts points. */
export const scoreOf = (deal: Deal, s: Run) => deal.mode === "endless" ? s.rounds : s.points;

/** The most points a perfect run of this level can earn (for validating a friend's link). */
export const possiblePoints = (level: number) => maxPoints(level);

export type Next = { kind: "slip"; to: number } | { kind: "tal"; need: number } | null;
/** What would have made it one more star; null at three stars, on a loss and in endless runs. */
export function nextStar(deal: Deal, s: Run): Next {
  const stars = starsOf(deal, s);
  if (stars === 0 || stars === 3) return null;
  if (s.mistakes > 0) return { kind: "slip", to: stars + 1 };
  return { kind: "tal", need: Math.max(1, Math.ceil(TAL_SHARE * s.graded) - s.onBeat) };
}
