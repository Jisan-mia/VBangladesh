// The rule for a make level: a tune is right when it follows the rule, whichever notes the child picked. Pure.
import { noteCount, parseTune, rowsAt, type Tune } from "./music";
import type { RuleId } from "./levels";

/** How many notes each rule needs at least: the dots in the corner. */
export const NEED: Record<RuleId, number> = { rising: 4, hill: 5, own: 6 };
/** What the glow shows after two misses: one tune that follows the rule. */
export const EXAMPLE: Record<RuleId, Tune> = { rising: parseTune("0 1 2 3 . ."), hill: parseTune("0 2 4 2 0 ."), own: parseTune("0 1 2 3 4 2") };

/** Each sounding beat's single note, in order; null when any beat holds two notes together. */
function line(tune: Tune): number[] | null {
  const out: number[] = [];
  for (const mask of tune) {
    const rows = rowsAt(mask);
    if (rows.length > 1) return null;
    if (rows.length === 1) out.push(rows[0]);
  }
  return out;
}

export type Verdict = { ok: boolean; notes: number; why: "empty" | "few" | "chord" | "shape" | "same" | "ok" };

export function judge(rule: RuleId, tune: Tune): Verdict {
  const notes = noteCount(tune);
  if (!notes) return { ok: false, notes, why: "empty" };
  if (rule === "own") {
    const rows = new Set(tune.flatMap(rowsAt));
    if (notes < NEED.own) return { ok: false, notes, why: "few" };
    if (rows.size < 3) return { ok: false, notes, why: "same" };
    return { ok: true, notes, why: "ok" };
  }
  const seq = line(tune);
  if (!seq) return { ok: false, notes, why: "chord" };
  if (seq.length < NEED[rule]) return { ok: false, notes, why: "few" };
  if (rule === "rising") {
    const ok = seq.every((row, i) => i === 0 || row > seq[i - 1]);
    return { ok, notes, why: ok ? "ok" : "shape" };
  }
  // hill: strictly up to one top that is neither first nor last, then strictly down.
  const top = seq.indexOf(Math.max(...seq));
  const up = seq.slice(0, top + 1).every((row, i, all) => i === 0 || row > all[i - 1]);
  const down = seq.slice(top).every((row, i, all) => i === 0 || row < all[i - 1]);
  const ok = top > 0 && top < seq.length - 1 && up && down;
  return { ok, notes, why: ok ? "ok" : "shape" };
}
