// The ladder's puzzles: a seed and a level give two pictures and their differences, the same on every phone.
// Built on the seven scenes (lib/scenes.ts) and checked for fairness from the shapes alone. Pure and server-safe.
import { makeRng, pick } from "../../../shared/game-core";
import { TEMPLATES } from "./scenes";
import { changedShapes, colorDistance, contains, itemBox, overlaps, tapRegion, union, SCENE_H, SCENE_W, type Box, type Item, type Look, type Shape } from "./shapes";
import { stageAt, type Kind, type Stage } from "./levels";

/** How a moving thing moves: up and down, side to side, or swinging about its anchor (degrees), over `period` seconds. */
export type Motion = { kind: "bob" | "drift" | "sway"; amp: number; period: number; phase: number };
export type Diff = {
  item: number; kind: Kind; side: 0 | 1; look: Look; region: Box; name: string;
  /** Whether the thing moves (on at least one side). */
  moving: boolean;
  /** Seconds a casual eye needs to notice it, alone in the picture: the bots and the star times read this. */
  effort: number;
};
export type Puzzle = { level: number; seed: number; stage: Stage; items: Item[]; looks: [Look[], Look[]]; motion: (Motion | null)[]; diffs: Diff[] };

/** Tap regions are at least this many scene units: 48 units is 47px on a 354px phone picture. */
export const MIN_REGION = 48;
export const PHONE_SCALE = 354 / SCENE_W;
/** A tap this close to a region (scene units, about a fingertip's edge) still counts. */
export const FINGER = 9;
/** A change must cover at least this much of the picture to be fair at 320px wide. */
export const MIN_FOOTPRINT = { long: 10, area: 60 };
/** The হারিকেন's light, in scene units. */
export const LAMP = 64;

const MOVERS: Readonly<Record<string, Omit<Motion, "phase">>> = {
  cloud1: { kind: "drift", amp: 9, period: 9 }, cloud2: { kind: "drift", amp: 8, period: 11 }, birds: { kind: "drift", amp: 7, period: 6 },
  kite: { kind: "sway", amp: 10, period: 2.6 }, boat: { kind: "bob", amp: 2.8, period: 2.8 }, smallBoat: { kind: "bob", amp: 2.2, period: 2.2 },
  ducks: { kind: "drift", amp: 8, period: 5 }, fish: { kind: "bob", amp: 5, period: 1.7 }, lilies: { kind: "bob", amp: 1.4, period: 3.2 },
  shirt: { kind: "sway", amp: 9, period: 2.2 }, lungi: { kind: "sway", amp: 7, period: 2.5 }, gamchha: { kind: "sway", amp: 9, period: 2 },
  frock: { kind: "sway", amp: 9, period: 2.3 }, bananaTree: { kind: "sway", amp: 3, period: 3.4 }, palm: { kind: "sway", amp: 2.5, period: 3.8 },
  steam: { kind: "bob", amp: 2.5, period: 1.4 }, bulb: { kind: "sway", amp: 10, period: 2.4 }, lantern: { kind: "sway", amp: 9, period: 2.6 },
  scale: { kind: "sway", amp: 6, period: 3 }, bananas: { kind: "sway", amp: 5, period: 2.8 }, crow: { kind: "bob", amp: 1.6, period: 1.5 },
  bird: { kind: "bob", amp: 1.4, period: 1.8 }, hen1: { kind: "drift", amp: 3, period: 2.6 }, hen2: { kind: "drift", amp: 3, period: 3.1 },
};
/** A thing whose stillness you can see: it swings or travels far enough. */
const stillable = (motion: Motion) => motion.kind === "sway" ? motion.amp >= 5 : motion.amp >= 4;

const TURNABLE = new Set(["clock", "calendar", "radio", "kettle", "packets", "jar1", "jar2", "mora", "kolshi", "crate", "cat", "crow", "bird", "hen1", "hen2", "goat",
  "cow", "egret", "kite", "scarecrow", "haystack", "umbrella", "umbrella2", "pumpkin", "gourd", "cauli", "watermelon", "jackfruit", "scale", "lantern", "bananas",
  "mango", "malta", "litchi", "guava", "lemons", "boat", "smallBoat", "fish", "tank", "dish", "ac", "rickshaw", "bench", "pots", "well", "tree"]);
const SHIFTABLE = new Set(["cat", "crow", "bird", "hen1", "hen2", "goat", "cow", "egret", "kite", "mora", "kolshi", "crate", "watermelon", "jackfruit", "bench", "pots",
  "ducks", "lilies", "boat", "smallBoat", "fish", "sun", "cloud1", "cloud2", "birds", "pumpkin", "cauli", "lemons", "tank", "dish", "ac", "rickshaw", "scarecrow",
  "haystack", "clock", "calendar", "radio", "packets", "shirt", "lungi", "gamchha", "frock", "farHut"]);
/** Signboards and price cards: a word or a digit changes, the kind of change a reader catches. */
export const VARIANTS: Readonly<Record<string, string>> = {
  "মায়ের দোয়া ফল ভান্ডার": "বাবার দোয়া ফল ভান্ডার", "রহিম ফল বিতান": "করিম ফল বিতান", "তাজা ফল ঘর": "তাজা ফুল ঘর", "নিউ সততা ফল ঘর": "নিউ মমতা ফল ঘর",
  "করিম ফল ভান্ডার": "রহিম ফল ভান্ডার", "মামার চা": "চাচার চা", "খালেক টি স্টল": "মালেক টি স্টল", "রহমত চা ঘর": "বরকত চা ঘর", "আড্ডা টি স্টল": "আড্ডা চা স্টল",
  "জলিলের চা": "খলিলের চা", "কদমতলী ঘাট": "বকুলতলী ঘাট", "সোনাচর ঘাট": "রুপাচর ঘাট", "বটতলা ঘাট": "আমতলা ঘাট", "নতুনহাট ঘাট": "পুরানহাট ঘাট",
  "হাসি স্টোর": "খুশি স্টোর", "রুচি হোটেল": "শুচি হোটেল", "নিউ টেইলার্স": "নিউ লন্ড্রি", "মিতা স্টোর": "মিতু স্টোর",
  "৳২০": "৳৯০", "৳৩০": "৳৮০", "৳৪০": "৳৬০", "৳৫০": "৳৭০",
};
/** The sky is easy to change, so it shouldn't fill every level. */
const SKY = new Set(["sun", "cloud1", "cloud2", "birds"]);

const textOf = (shapes: readonly Shape[]) => { for (const shape of shapes) if (shape.k === "t") return shape.text; return ""; };
const hasText = (item: Item) => Boolean(textOf(item.draw(item.look)));

function hex(value: number) { return Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0"); }
/** The same colour, a little lighter (dark colours) or a little darker (light ones). */
export function shadeOf(color: string, amount: number) {
  const [r, g, b] = [1, 3, 5].map(at => parseInt(color.slice(at, at + 2), 16));
  const light = 0.299 * r + 0.587 * g + 0.114 * b > 150, to = light ? 0 : 255;
  return `#${hex(r + (to - r) * amount)}${hex(g + (to - g) * amount)}${hex(b + (to - b) * amount)}`;
}

/** What a difference does to one item, or null when this kind can't apply to it here. */
function changeLook(item: Item, kind: Kind, stage: Stage, motion: Motion | null, rng: () => number): Look | null {
  const look = item.look, can = item.can ?? {};
  switch (kind) {
    case "missing": return can.missing ? { ...look, hidden: true } : null;
    case "color": {
      const options = (can.color ?? []).filter(color => look.color && colorDistance(color, look.color) >= stage.bold);
      return options.length ? { ...look, color: options[pick(rng, options.length)] } : null;
    }
    case "shade": {
      if (!look.color || !can.color) return null;
      const color = shadeOf(look.color, 0.3 + rng() * 0.08), distance = colorDistance(color, look.color);
      return distance >= 40 && distance <= 95 ? { ...look, color } : null;
    }
    case "count": {
      if (!can.count || !look.count) return null;
      const count = Math.max(can.count, look.count - (stage.bold >= 120 ? 2 : 1));
      return count < look.count ? { ...look, count } : null;
    }
    case "flip": return can.flip && !hasText(item) ? { ...look, flip: !look.flip } : null;
    case "size": return can.size ? { ...look, scale: Math.round((0.62 + rng() * 0.12) * 100) / 100 } : null;
    case "shift": {
      if (!SHIFTABLE.has(item.id)) return null;
      const box = itemBox(item, look);
      if (!box) return null;
      const by = (11 + rng() * 5) * (rng() < 0.5 ? -1 : 1), dx = box.x + by < 2 || box.x + box.w + by > SCENE_W - 2 ? -by : by;
      return box.x + dx >= 2 && box.x + box.w + dx <= SCENE_W - 2 ? { ...look, dx: Math.round(dx * 10) / 10 } : null;
    }
    case "turn": return TURNABLE.has(item.id) && !hasText(item) ? { ...look, turn: Math.round((14 + rng() * 6) * (rng() < 0.5 ? -1 : 1)) } : null;
    case "text": {
      const text = textOf(item.draw(look)), variant = VARIANTS[text];
      return variant ? { ...look, label: variant } : null;
    }
    case "still": return motion && stillable(motion) ? { ...look, still: true } : null;
  }
}

/** The share of a box hidden behind items drawn later (by their boxes; a rough, cautious guess). */
export function hiddenShare(items: readonly Item[], looks: readonly Look[], index: number, box: Box) {
  const later: Box[] = [];
  for (let at = index + 1; at < items.length; at++) {
    const found = itemBox(items[at], looks[at]);
    if (found && overlaps(found, box)) later.push(found);
  }
  if (!later.length) return 0;
  let covered = 0, total = 0;
  for (let y = box.y + 1; y < box.y + box.h; y += 2) for (let x = box.x + 1; x < box.x + box.w; x += 2) {
    total++;
    if (later.some(other => contains(other, x, y))) covered++;
  }
  return total ? covered / total : 0;
}

/** Whether one difference on its own is fair: it changes something, big enough to see, mostly not hidden. Returns its footprint. */
export function fairChange(items: readonly Item[], base: readonly Look[], index: number, look: Look): Box | null {
  const changed = base.slice();
  changed[index] = look;
  const shapes = changedShapes(items, base, changed);
  const footprint = shapes.reduce<Box | null>((box, shape) => union(box, shape.box), null);
  if (!footprint || Math.max(footprint.w, footprint.h) < MIN_FOOTPRINT.long || footprint.w * footprint.h < MIN_FOOTPRINT.area) return null;
  if (hiddenShare(items, look.hidden ? base : changed, index, footprint) > 0.4) return null;
  return footprint;
}

/** Where an item can be while it moves: its box at the ends of its motion and at rest. */
export function sweep(item: Item, look: Look, motion: Motion | null): Box | null {
  const rest = itemBox(item, look);
  if (!rest || !motion || look.still) return rest;
  if (motion.kind === "sway") {
    const turn = look.turn ?? 0;
    return union(rest, union(itemBox(item, { ...look, turn: turn + motion.amp }), itemBox(item, { ...look, turn: turn - motion.amp })));
  }
  const dx = motion.kind === "drift" ? motion.amp : 0, dy = motion.kind === "bob" ? motion.amp : 0;
  return { x: rest.x - dx, y: rest.y - dy, w: rest.w + dx * 2, h: rest.h + dy * 2 };
}

const BASE_EFFORT: Readonly<Record<Kind, number>> = { missing: 2.1, color: 3.2, count: 5.5, flip: 5.5, size: 4.8, shift: 6.5, turn: 5.5, text: 6.5, shade: 8, still: 5 };
/** Seconds a casual eye needs to notice one difference: smaller, subtler, moving and dark take longer. */
export function effortOf(kind: Kind, footprint: Box, moving: boolean, dark: boolean, distance: number) {
  const area = Math.max(1, footprint.w * footprint.h), size = Math.min(2.2, Math.max(0.6, Math.sqrt(1600 / area)));
  const subtle = kind === "color" ? Math.min(1.5, Math.max(0.8, Math.sqrt(150 / Math.max(1, distance)))) : kind === "shade" ? Math.min(1.8, Math.max(0.8, 70 / Math.max(1, distance))) : 1;
  return Math.round(BASE_EFFORT[kind] * size * subtle * (moving && kind !== "still" ? 1.3 : 1) * (dark ? 1.5 : 1) * 100) / 100;
}

function tryPuzzle(level: number, seed: number): Puzzle | null {
  const stage = stageAt(level), template = TEMPLATES.find(one => one.id === stage.template)!;
  const rng = makeRng(seed), items = template.build(rng, stage.sky), base = items.map(item => item.look);
  const motion = items.map(item => {
    const kind = stage.movers ? MOVERS[item.id] : undefined;
    return kind ? { ...kind, phase: Math.round(rng() * 628) / 100 } : null;
  });
  const candidates = items.map((item, index) => ({ index, box: itemBox(item, item.look) })).filter(({ index, box }) => box && items[index].can)
    .map(({ index, box }) => ({ index, score: rng() * (1 - Math.abs(stage.big) * 0.5) + stage.big * 1.5 * Math.min(1, (box!.w * box!.h) / 3000) - (SKY.has(items[index].id) ? 0.35 : 0) }))
    .sort((a, b) => b.score - a.score).map(({ index }) => index);
  const onMovers = Math.round(stage.count * stage.onMovers);
  const ordered = [...candidates.filter(index => motion[index]).slice(0, onMovers), ...candidates];

  const diffs: Diff[] = [], used = new Set<number>(), want = stage.count;
  const weights = Object.entries(stage.kinds) as [Kind, number][];
  const tryItem = (index: number, kinds: readonly Kind[]) => {
    const item = items[index];
    for (const kind of kinds) {
      const look = changeLook(item, kind, stage, motion[index], rng);
      if (!look) continue;
      const footprint = kind === "still" ? itemBox(item, item.look) : fairChange(items, base, index, look);
      if (!footprint) continue;
      const reach = union(sweep(item, item.look, motion[index]), sweep(item, look, motion[index]))!;
      const region = tapRegion(reach, MIN_REGION, 3);
      if (diffs.some(other => overlaps(other.region, region, 2))) continue;
      const distance = look.color && item.look.color ? colorDistance(look.color, item.look.color) : 0;
      const moving = Boolean(motion[index]);
      diffs.push({ item: index, kind, side: rng() < 0.5 ? 0 : 1, look, region, name: item.name, moving, effort: effortOf(kind, footprint, moving, stage.dark, distance) });
      used.add(index);
      return true;
    }
    return false;
  };
  // The kind this level teaches goes in first, then the rest by weight with a little chance.
  for (const kind of stage.must) {
    if (!ordered.some(index => !used.has(index) && tryItem(index, [kind]))) return null;
  }
  for (const index of ordered) {
    if (diffs.length >= want) break;
    if (used.has(index)) continue;
    tryItem(index, weights.map(([kind, weight]) => [kind, weight * (0.5 + rng())] as const).sort((a, b) => b[1] - a[1]).map(([kind]) => kind));
  }
  if (diffs.length < want) return null;
  const looks: [Look[], Look[]] = [base.slice(), base.slice()];
  for (const diff of diffs) looks[diff.side][diff.item] = diff.look;
  return { level, seed, stage, items, looks, motion, diffs };
}

const cache = new Map<string, Puzzle>();
/** The two pictures and their differences for a level and seed. Same pair on every phone. */
export function makePuzzle(level: number, seed: number): Puzzle {
  const key = `${level}:${seed}`;
  let puzzle = cache.get(key);
  if (!puzzle) {
    for (let attempt = 0; attempt < 60 && !puzzle; attempt++) puzzle = tryPuzzle(level, (seed + attempt * 7919) >>> 0) ?? undefined;
    if (!puzzle) throw new Error(`no fair puzzle for level ${level}, seed ${seed}`);
    if (cache.size > 40) cache.clear();
    cache.set(key, puzzle);
  }
  return puzzle;
}

/** The distance from a point to a box (0 inside it). */
export function distanceTo(box: Box, x: number, y: number) {
  const dx = Math.max(box.x - x, 0, x - (box.x + box.w)), dy = Math.max(box.y - y, 0, y - (box.y + box.h));
  return Math.hypot(dx, dy);
}

export type Tap = { kind: "found"; index: number } | { kind: "again"; index: number } | { kind: "miss" } | { kind: "lamp" };
/**
 * Where a tap at scene point (x, y) lands, on either picture: a new difference (a fingertip's slack around its region;
 * the nearest wins), one already found, outside the হারিকেন's light in the dark (it only moves the lamp), or nowhere.
 */
export function tapAt(puzzle: Pick<Puzzle, "diffs">, found: readonly number[], x: number, y: number, lamp?: { x: number; y: number } | null): Tap {
  if (!(x >= 0 && x <= SCENE_W && y >= 0 && y <= SCENE_H)) return { kind: "miss" };
  if (lamp && Math.hypot(x - lamp.x, y - lamp.y) > LAMP) return { kind: "lamp" };
  let best = -1, bestAt = Infinity;
  for (let index = 0; index < puzzle.diffs.length; index++) {
    const region = puzzle.diffs[index].region, away = distanceTo(region, x, y);
    if (away > FINGER) continue;
    const centre = Math.hypot(x - (region.x + region.w / 2), y - (region.y + region.h / 2)) + away * 100;
    if (centre < bestAt) { best = index; bestAt = centre; }
  }
  if (best < 0) return { kind: "miss" };
  return found.includes(best) ? { kind: "again", index: best } : { kind: "found", index: best };
}

/** The first hint's circle: about three times the region, offset a little, so it narrows the hunt without giving the spot. */
export function hintCircle(puzzle: Pick<Puzzle, "diffs" | "seed">, index: number) {
  const { region } = puzzle.diffs[index], rng = makeRng((puzzle.seed ^ (index * 2654435761)) >>> 0);
  const r = Math.max(region.w, region.h) / 2 + 34, cx = region.x + region.w / 2, cy = region.y + region.h / 2;
  const angle = rng() * Math.PI * 2, off = (r - Math.max(region.w, region.h) / 2) * 0.55 * rng();
  return { x: Math.round((cx + Math.cos(angle) * off) * 10) / 10, y: Math.round((cy + Math.sin(angle) * off) * 10) / 10, r: Math.round(r) };
}

/** The next difference a hint points at: one already hinted and not yet found, else the hardest one left (the one you're stuck on). */
export function nextHint(puzzle: Pick<Puzzle, "diffs">, found: readonly number[], hinted: readonly number[]) {
  for (const index of hinted) if (!found.includes(index)) return index;
  let best = -1;
  for (let index = 0; index < puzzle.diffs.length; index++) {
    if (found.includes(index)) continue;
    if (best < 0 || puzzle.diffs[index].effort > puzzle.diffs[best].effort) best = index;
  }
  return best;
}
