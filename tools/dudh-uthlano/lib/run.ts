// Which pots a run plays: a friend's seed is kept only for exactly the friend's level (ReplayIsExact), anything else gets fresh pots.
import type { Shared } from "./challenge";
import type { Mode } from "./levels";

export type Run = { seed: number; level: number; mode: Mode; old: boolean };

/** The friend whose pots this run plays, or null: same level, same old/new ladder, same seed. */
export const rivalOf = (friend: Shared | null, run: Pick<Run, "seed" | "level" | "old"> & Partial<Run>) =>
  friend && friend.level === run.level && friend.old === run.old && friend.seed === run.seed ? friend : null;

/** The same level again: a friend's seed stays (so the comparison holds), anything else gets fresh pots from `fresh`. */
export const againRun = (friend: Shared | null, run: Run, fresh: number): Run => ({ ...run, seed: rivalOf(friend, run) ? run.seed : fresh });

/** Picking a level from the list: the friend's pots only when it is the friend's level on the new ladder (and mode). */
export function pickedRun(friend: Shared | null, level: number, mode: Mode, fresh: number): Run {
  const rival = friend && !friend.old && friend.level === level && friend.mode === mode ? friend : null;
  return { seed: rival ? rival.seed : fresh, level, mode, old: false };
}
