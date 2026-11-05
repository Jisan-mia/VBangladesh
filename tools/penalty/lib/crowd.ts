// When the crowd loop may play, and how loud. Pure, so the statechart's sound rules replay in node.
// The rule: it plays exactly while a match runs on screen (not paused, not over, the tab shown and focused) with sound on.
// A loop is made only while sound is on (the kit returns a silent stub otherwise), and turning sound off drops it, so
// turning sound back on always makes a real one: never `??=` a loop.
import { leanShown, runUp, Stage, type Game } from "./game";
import { moving, type Session } from "./session";

export const crowdWanted = (s: Session, sound: boolean) => sound && moving(s);

/** 0 calm → 1 the breath before a decisive kick. Rises through their run-up and while you line up, peaks on a decisive kick. */
export function crowdLevel(g: Game) {
  const edge = g.decisive ? 0.25 : 0;
  if (g.stage === Stage.Run) return Math.min(1, 0.25 + 0.55 * runUp(g) + 0.2 * leanShown(g) + edge);
  if (g.stage === Stage.Ready) return 0.2 + edge;
  if (g.stage === Stage.Aim) return Math.min(0.75, 0.15 + 0.12 * g.t + edge);
  if (g.stage === Stage.Fly) return 0.85;
  return 0.3;
}

export type Loop = { swell: (level: number) => void; stop: () => void };
/** One step of the crowd's owner: make, keep or drop the loop. Returns the loop to keep (or null). */
export function keepCrowd(current: Loop | null, wanted: boolean, make: () => Loop): Loop | null {
  if (wanted && !current) return make();
  if (!wanted && current) { current.stop(); return null; }
  return current;
}
