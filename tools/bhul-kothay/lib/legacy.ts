// The game before the rewrite, frozen: its 30 levels, which differences a seed picked, and its stars. Old challenge links
// (no `v` key) replay these exact two pictures, so a friend's old link still shows what they solved. Never change this file:
// tests/legacy.test.ts pins every level's puzzle by a hash. Pure and server-safe.
import { makeRng, pick, starsFor as starsBetween } from "../../../shared/game-core";
import { TEMPLATES, type World } from "./scenes";
import { changedShapes, colorDistance, contains, itemBox, overlaps, tapRegion, union, SCENE_H, SCENE_W, type Box, type Item, type Look } from "./shapes";

export const LEGACY_COUNT = 30;
const LEVEL_COUNT = LEGACY_COUNT;
const WORLD_OF = ["সকালের", "দুপুরের", "বিকেলের"] as const;
/** Market and village take turns, so no two levels in a row look alike. */
const ORDER = [0, 3, 5, 1, 4, 2, 6];

export const legacyWorld = (level: number) => Math.min(2, Math.floor((level - 1) / 10)) as Exclude<World, 3>;
export const isLegacyLevel = (level: number) => Number.isInteger(level) && level >= 1 && level <= LEVEL_COUNT;
/** A fixed seed per level, so a challenge link names exactly one pair of pictures. */
export const legacySeed = (level: number) => 52_000 + level * 17;
export const legacyTemplate = (level: number) => TEMPLATES[ORDER[(level - 1) % ORDER.length]];
/** "দুপুরের চায়ের দোকান" */
export const legacyPlace = (level: number) => `${WORLD_OF[legacyWorld(level)]} ${legacyTemplate(level).name}`;
/** 5 differences in the morning, 6 at noon, 7 in the evening. */
export const legacyDiffCount = (level: number) => 5 + legacyWorld(level);
/** 0 on level 1, 1 on the last: how subtle the differences get. */
const subtlety = (level: number) => (level - 1) / (LEVEL_COUNT - 1);

/** Tap regions are at least this many scene units: 44px or more on a 390px phone, where a picture is about 354px wide. */
const MIN_REGION = 48;
/** A change must cover at least this much of the picture to be fair at 320px wide. */
const MIN_FOOTPRINT = { long: 10, area: 60 };

type Kind = "missing" | "color" | "count" | "flip" | "size";
export type LegacyDiff = { item: number; kind: Kind; side: 0 | 1; look: Look; region: Box; name: string };
export type LegacyPuzzle = { level: number; seed: number; items: Item[]; looks: [Look[], Look[]]; diffs: LegacyDiff[] };

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
function hiddenShare(items: readonly Item[], looks: readonly Look[], index: number, box: Box) {
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
function fairChange(items: readonly Item[], base: readonly Look[], index: number, look: Look) {
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

function tryLegacyPuzzle(level: number, seed: number): LegacyPuzzle | null {
  const rng = makeRng(seed), items = legacyTemplate(level).build(rng, legacyWorld(level)), base = items.map(item => item.look), d = subtlety(level);
  // Big things first early on, small things first later; the random part keeps every level different.
  const order = items.map((item, index) => ({ index, box: itemBox(item, item.look) })).filter(({ index, box }) => box && items[index].can)
    .map(({ index, box }) => ({ index, score: rng() + (1 - 2 * d) * Math.min(1, (box!.w * box!.h) / 3000) - (SKY.has(items[index].id) ? 0.35 : 0) }))
    .sort((a, b) => b.score - a.score);
  const diffs: LegacyDiff[] = [], want = legacyDiffCount(level);
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

const cache = new Map<string, LegacyPuzzle>();
/** The two pictures and their differences for a level. Same level and seed, same puzzle on every phone. */
export function legacyPuzzle(level: number, seed = legacySeed(level)): LegacyPuzzle {
  const key = `${level}:${seed}`;
  let puzzle = cache.get(key);
  if (!puzzle) {
    for (let attempt = 0; attempt < 40 && !puzzle; attempt++) puzzle = tryLegacyPuzzle(level, (seed + attempt * 7919) >>> 0) ?? undefined;
    if (!puzzle) throw new Error(`no fair puzzle for level ${level}, seed ${seed}`);
    cache.set(key, puzzle);
  }
  return puzzle;
}

/** Seconds that still earn 3 stars: about 6 a difference on level 1, 12 by the last. */
export const legacyPar = (level: number) => legacyDiffCount(level) * Math.round(6 + 6 * subtlety(level));
const WRONG_FOR = { three: 2, two: 5 };

/** 3 stars: within par and at most 2 wrong taps. 2 stars: within twice par and at most 5. A hint caps it at 2. */
export function legacyStars(level: number, seconds: number, wrong: number, hinted: boolean) {
  const par = legacyPar(level);
  const earned = Math.min(starsBetween(seconds, par, par * 2, true), starsBetween(wrong, WRONG_FOR.three, WRONG_FOR.two, true));
  return hinted ? Math.min(2, earned) : earned;
}

