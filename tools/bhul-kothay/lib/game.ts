// Game rules: levels, which differences a seed picks, where a tap lands, and stars. Pure and server-safe (share.ts reaches it through link.ts).
import { makeRng, pick, starsFor as starsBetween } from "../../../shared/game-core";
import { TEMPLATES, type World } from "./scenes";
import { changedShapes, colorDistance, contains, itemBox, overlaps, tapRegion, union, SCENE_H, SCENE_W, type Box, type Item, type Look } from "./shapes";

export const LEVEL_COUNT = 30;
export const WORLDS = ["সকাল", "দুপুর", "বিকেল"] as const;
const WORLD_OF = ["সকালের", "দুপুরের", "বিকেলের"] as const;
/** Market and village take turns, so no two levels in a row look alike. */
const ORDER = [0, 3, 5, 1, 4, 2, 6];

export const worldOf = (level: number) => Math.min(2, Math.floor((level - 1) / 10)) as World;
export const isLevel = (level: number) => Number.isInteger(level) && level >= 1 && level <= LEVEL_COUNT;
/** A fixed seed per level, so a challenge link names exactly one pair of pictures. */
export const levelSeed = (level: number) => 52_000 + level * 17;
export const templateOf = (level: number) => TEMPLATES[ORDER[(level - 1) % ORDER.length]];
/** "দুপুরের চায়ের দোকান" */
export const placeOf = (level: number) => `${WORLD_OF[worldOf(level)]} ${templateOf(level).name}`;
/** 5 differences in the morning, 6 at noon, 7 in the evening. */
export const diffCount = (level: number) => 5 + worldOf(level);
/** 0 on level 1, 1 on the last: how subtle the differences get. */
const subtlety = (level: number) => (level - 1) / (LEVEL_COUNT - 1);

/** Tap regions are at least this many scene units: 44px or more on a 390px phone, where a picture is about 354px wide. */
export const MIN_REGION = 48;
export const PHONE_SCALE = 354 / SCENE_W;
/** A change must cover at least this much of the picture to be fair at 320px wide. */
export const MIN_FOOTPRINT = { long: 10, area: 60 };

export type Kind = "missing" | "color" | "count" | "flip" | "size";
export type Diff = { item: number; kind: Kind; side: 0 | 1; look: Look; region: Box; name: string };
export type Puzzle = { level: number; seed: number; items: Item[]; looks: [Look[], Look[]]; diffs: Diff[] };

/** What a difference does to an item's look; null when this kind can't apply here (too little contrast, nothing to remove). */
function changeLook(item: Item, kind: Kind, level: number, rng: () => number): Look | null {
  const look = item.look, can = item.can ?? {}, d = subtlety(level);
  switch (kind) {
    case "missing": return can.missing ? { ...look, hidden: true } : null;
    case "flip": return can.flip && level >= 6 ? { ...look, flip: !look.flip } : null;
    case "size": return can.size && level >= 3 ? { ...look, scale: Math.round((0.62 + 0.14 * d) * 100) / 100 } : null;
    case "count": {
      if (!can.count || level < 4 || !look.count) return null;
      const count = Math.max(can.count, look.count - (level < 12 ? 2 : 1));
      return count < look.count ? { ...look, count } : null;
    }
    case "color": {
      const enough = 140 - 70 * d, options = (can.color ?? []).filter(color => look.color && colorDistance(color, look.color) >= enough);
      return options.length ? { ...look, color: options[pick(rng, options.length)] } : null;
    }
  }
}

/** How likely each kind is: plain "it's gone" and bold colours early, flips and one-fewer later. */
function kindWeights(level: number): [Kind, number][] {
  const d = subtlety(level);
  return [["missing", 3 - 2 * d], ["color", 3 - d], ["size", 1 + d], ["count", 1 + 2 * d], ["flip", 1 + 2 * d]];
}

/** The share of a box hidden behind items drawn later (by their boxes; a rough, cautious guess). */
export function hiddenShare(items: readonly Item[], looks: readonly Look[], index: number, box: Box) {
  const later = items.slice(index + 1).map((item, offset) => itemBox(item, looks[index + 1 + offset])).filter((found): found is Box => !!found && overlaps(found, box));
  if (!later.length) return 0;
  let covered = 0, total = 0;
  for (let y = box.y + 1; y < box.y + box.h; y += 2) for (let x = box.x + 1; x < box.x + box.w; x += 2) {
    total++;
    if (later.some(other => contains(other, x, y))) covered++;
  }
  return total ? covered / total : 0;
}

/** Whether one difference on its own is fair: it changes something, big enough to see, mostly not hidden behind other things. */
export function fairChange(items: readonly Item[], base: readonly Look[], index: number, look: Look) {
  const changed = base.slice();
  changed[index] = look;
  const shapes = changedShapes(items, base, changed);
  const footprint = shapes.reduce<Box | null>((box, shape) => union(box, shape.box), null);
  if (!footprint || Math.max(footprint.w, footprint.h) < MIN_FOOTPRINT.long || footprint.w * footprint.h < MIN_FOOTPRINT.area) return null;
  const shownOn = look.hidden ? base : changed;
  if (hiddenShare(items, shownOn, index, footprint) > 0.4) return null;
  return footprint;
}

/** The sky is easy to change, so it shouldn't fill every level. */
const SKY = new Set(["sun", "cloud1", "cloud2", "birds"]);

function tryPuzzle(level: number, seed: number): Puzzle | null {
  const rng = makeRng(seed), items = templateOf(level).build(rng, worldOf(level)), base = items.map(item => item.look), d = subtlety(level);
  // Big things first early on, small things first later; the random part keeps every level different.
  const order = items.map((item, index) => ({ index, box: itemBox(item, item.look) })).filter(({ index, box }) => box && items[index].can)
    .map(({ index, box }) => ({ index, score: rng() + (1 - 2 * d) * Math.min(1, (box!.w * box!.h) / 3000) - (SKY.has(items[index].id) ? 0.35 : 0) }))
    .sort((a, b) => b.score - a.score);
  const diffs: Diff[] = [], want = diffCount(level);
  for (const { index } of order) {
    if (diffs.length === want) break;
    const item = items[index], weights = kindWeights(level).map(([kind, weight]) => [kind, weight * (0.5 + rng())] as const).sort((a, b) => b[1] - a[1]);
    for (const [kind] of weights) {
      const look = changeLook(item, kind, level, rng);
      if (!look || !fairChange(items, base, index, look)) continue;
      const region = tapRegion(union(itemBox(item, item.look), itemBox(item, look))!, MIN_REGION, 3);
      if (diffs.some(other => overlaps(other.region, region))) continue;
      diffs.push({ item: index, kind, side: rng() < 0.5 ? 0 : 1, look, region, name: item.name });
      break;
    }
  }
  if (diffs.length < want) return null;
  const looks: [Look[], Look[]] = [base.slice(), base.slice()];
  for (const diff of diffs) looks[diff.side][diff.item] = diff.look;
  return { level, seed, items, looks, diffs };
}

const cache = new Map<string, Puzzle>();
/** The two pictures and their differences for a level. Same level and seed, same puzzle on every phone. */
export function makePuzzle(level: number, seed = levelSeed(level)): Puzzle {
  const key = `${level}:${seed}`;
  let puzzle = cache.get(key);
  if (!puzzle) {
    for (let attempt = 0; attempt < 40 && !puzzle; attempt++) puzzle = tryPuzzle(level, (seed + attempt * 7919) >>> 0) ?? undefined;
    if (!puzzle) throw new Error(`no fair puzzle for level ${level}, seed ${seed}`);
    cache.set(key, puzzle);
  }
  return puzzle;
}

export type Tap = { kind: "found"; index: number } | { kind: "again"; index: number } | { kind: "miss" };
/** Where a tap at scene point (x, y) lands, on either picture: a new difference, one already found, or nowhere. */
export function tapAt(puzzle: Puzzle, found: readonly number[], x: number, y: number): Tap {
  if (!(x >= 0 && x <= SCENE_W && y >= 0 && y <= SCENE_H)) return { kind: "miss" };
  const index = puzzle.diffs.findIndex(diff => contains(diff.region, x, y, 2));
  if (index < 0) return { kind: "miss" };
  return found.includes(index) ? { kind: "again", index } : { kind: "found", index };
}

/** A hint points at the first difference not found yet. */
export const hintFor = (puzzle: Puzzle, found: readonly number[]) => puzzle.diffs.findIndex((_, index) => !found.includes(index));

/** Seconds that still earn 3 stars: about 6 a difference on level 1, 12 by the last. */
export const parFor = (level: number) => diffCount(level) * Math.round(6 + 6 * subtlety(level));
export const WRONG_FOR = { three: 2, two: 5 };

/** 3 stars: within par and at most 2 wrong taps. 2 stars: within twice par and at most 5. A hint caps it at 2. */
export function starsFor(level: number, seconds: number, wrong: number, hinted: boolean) {
  const par = parFor(level);
  const earned = Math.min(starsBetween(seconds, par, par * 2, true), starsBetween(wrong, WRONG_FOR.three, WRONG_FOR.two, true));
  return hinted ? Math.min(2, earned) : earned;
}

/** What stood between this result and one more star: seconds over, wrong taps over, or the hint. */
export function shortBy(level: number, seconds: number, wrong: number, hinted: boolean) {
  const earned = starsFor(level, seconds, wrong, hinted);
  if (earned === 3) return null;
  if (earned === 2 && hinted) return { stars: 3, seconds: 0, wrong: 0, hint: true };
  const par = parFor(level) * (earned === 1 ? 2 : 1), limit = earned === 1 ? WRONG_FOR.two : WRONG_FOR.three;
  return { stars: earned + 1, seconds: Math.max(0, seconds - par), wrong: Math.max(0, wrong - limit), hint: false };
}

/** The furthest open level not yet three-starred, so nobody replays what they've mastered. */
export function startLevel(stars: Record<number, number>, unlocked: number) {
  for (let level = unlocked; level >= 1; level--) if ((stars[level] ?? 0) < 3) return level;
  return unlocked;
}
