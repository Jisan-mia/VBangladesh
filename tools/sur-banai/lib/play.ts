// The beat loop's rules, pure: which notes sound at which beat, when a tune ends, and how long a beat is.
import { rowsAt, type Tune } from "./music";

/** free: loops over the whole grid · mine: your copy once · target: the tune to hear once · echo: your matched tune once. */
export type Playing = "none" | "free" | "mine" | "target" | "echo";

/** A tune plays to its last sounding beat (a gap level's tune plays the whole row, so the gap is a silent beat). */
export function playLength(tune: Tune) {
  for (let step = tune.length - 1; step >= 0; step--) if (tune[step]) return step + 1;
  return 1;
}

export type Beat = { rows: number[]; head: number } | null;

/** The beat at `step`: the notes to sound and where the light is. Null when a once-through tune has ended. */
export function beatAt(kind: Playing, tune: Tune, step: number, length: number): { beat: Beat; next: number } {
  if (kind === "free") {
    const head = step >= tune.length ? 0 : step;
    return { beat: { rows: rowsAt(tune[head]), head }, next: head + 1 };
  }
  if (step >= length) return { beat: null, next: step };
  return { beat: { rows: rowsAt(tune[step] ?? 0), head: step }, next: step + 1 };
}

/** Beat length in ms. ধীরে খেলো never goes faster than 600. */
export const beatMs = (ms: number, slow: boolean) => (slow ? Math.max(ms, 600) : ms);
