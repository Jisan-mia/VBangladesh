// The pictures on the table: a ladder level with its seed, or an old level from a friend's old link (the frozen generator in
// lib/legacy.ts), both in the same shape so the game, the card and the bots never ask which. Pure and server-safe.
import { legacyDiffCount, legacyPar, legacyPuzzle, legacyTemplate, legacyWorld } from "./legacy";
import { stageAt, type Stage, type TemplateId } from "./levels";
import { effortOf, makePuzzle, type Puzzle } from "./puzzle";

export type Deal = { level: number; seed: number; legacy: boolean; puzzle: Puzzle };

export const ladderDeal = (level: number, seed: number): Deal => ({ level, seed, legacy: false, puzzle: makePuzzle(level, seed) });

/** The old game's worlds were morning, noon and evening: they wear the bazaar's, the village's and the town's colours. */
const LEGACY_WORLD = [0, 1, 3] as const;

/** An old level as its friend solved it: the same two pictures, the old star times (no `fresh` lesson, nothing moves). */
export function legacyDeal(level: number): Deal {
  const old = legacyPuzzle(level), par = legacyPar(level), sky = legacyWorld(level);
  const stage: Stage = {
    level, world: LEGACY_WORLD[sky], template: legacyTemplate(level).id as TemplateId, sky, count: legacyDiffCount(level), kinds: {}, must: [],
    fresh: "more", lesson: "বন্ধুর পুরোনো লিংক: আগের খেলার ঠিক সেই দুটো ছবি।", big: 0, movers: false, onMovers: 0, dark: false, bold: 0,
    three: par, two: par * 2, finale: "",
  };
  const puzzle: Puzzle = {
    level, seed: old.seed, stage, items: old.items, looks: old.looks, motion: old.items.map(() => null),
    diffs: old.diffs.map(diff => ({ ...diff, moving: false, effort: effortOf(diff.kind, diff.region, false, false, 120) })),
  };
  return { level, seed: old.seed, legacy: true, puzzle };
}

/** A level's stage, for a deal that may be an old one. */
export const stageOf = (deal: Pick<Deal, "level" | "legacy" | "puzzle">) => deal.legacy ? deal.puzzle.stage : stageAt(deal.level);
