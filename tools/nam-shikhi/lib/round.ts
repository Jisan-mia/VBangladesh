// The rules of a round, with no React: which items come up, how many pictures to show, what counts as right, and stars.
import { starsFor } from "../../../shared/game-core";
import { VIEWS, type View } from "./art";
import { HABITATS, type Choice, type Item, type Mode, type Pack } from "./packs";

export const QUESTIONS = 6;
export const BASE_CHOICES = 3;
/** How far from a part (in figure units) a tap still counts as that part. */
const NEAR = 18;

export function shuffle<T>(list: readonly T[], rng: () => number): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** The items a level can ask about: the habitat round needs a home, the colour round a thing, the symbol round a role. */
export const askable = (pack: Pack, mode: Mode) =>
  pack.items.filter(item => mode === "home" ? item.home : mode === "thing" ? item.thing : mode === "role" ? item.role : true);

/** The round's questions, in order. The habitat round spreads its homes out so it isn't six village animals. */
export function planRound(pack: Pack, mode: Mode, rng: () => number): Item[] {
  const pool = shuffle(askable(pack, mode), rng);
  if (mode !== "home") return pool.slice(0, QUESTIONS);
  const picked: Item[] = [];
  for (const home of shuffle(HABITATS, rng)) { const first = pool.find(item => item.home === home.id); if (first) picked.push(first); }
  for (const item of pool) if (picked.length < QUESTIONS && !picked.includes(item)) picked.push(item);
  return shuffle(picked.slice(0, QUESTIONS), rng);
}

/**
 * How many pictures to offer: three, two after three misses in a row (quietly easier), four after five right in a row.
 * A "miss" is a question not answered on the first tap.
 */
export function choiceCount(missRun: number, rightRun: number, base = BASE_CHOICES) {
  if (missRun >= 3) return Math.max(2, base - 1);
  if (rightRun >= 5) return Math.min(4, base + 1);
  return base;
}

/** The id of the right answer. */
export const answerOf = (mode: Mode, target: Item) => mode === "home" ? target.home! : target.id;

/** The figure is tapped, not cards, for শরীর's name levels. */
export const isSpot = (pack: Pack, mode: Mode) => pack.id === "shorir" && (mode === "bn" || mode === "en");

/** The right answer plus `count - 1` others, shuffled. Habitats the animal also lives in are never offered as wrong. */
export function choicesFor(pack: Pack, mode: Mode, target: Item, count: number, rng: () => number): Choice[] {
  if (isSpot(pack, mode)) return [];
  if (mode === "home") {
    const right = HABITATS.find(home => home.id === target.home)!;
    const wrong = HABITATS.filter(home => home.id !== target.home && !target.also?.includes(home.id));
    return shuffle([right, ...shuffle(wrong, rng).slice(0, count - 1)], rng);
  }
  const others = pack.items.filter(item => item.id !== target.id);
  return shuffle([target, ...shuffle(others, rng).slice(0, count - 1)], rng);
}

/** Stars are a record only: 3 for five or six right first time, 2 for three or four, 1 for finishing. */
export const starsOf = (firstTry: number, total = QUESTIONS) => starsFor(firstTry, total - 1, Math.ceil(total / 2));

/** The part of the figure nearest to a tap, among the parts shown in this view; null when no part is near (an arm, the shirt). */
export function spotAt(pack: Pack, view: View, x: number, y: number) {
  const [left, top, width, height] = VIEWS[view].split(" ").map(Number);
  if (x < left || y < top || x > left + width || y > top + height) return null;
  let best: Item | null = null, bestDistance = Infinity;
  for (const item of pack.items) {
    if (item.view !== view) continue;
    for (const [sx, sy] of item.spots ?? []) {
      const distance = Math.hypot(sx - x, sy - y);
      if (distance < bestDistance) { best = item; bestDistance = distance; }
    }
  }
  return bestDistance <= NEAR ? best : null;
}

/** The big word or line the child answers. */
export function promptOf(mode: Mode, target: Item, spot: boolean) {
  const ask = spot ? "কোথায়?" : "কোনটা?";
  switch (mode) {
    case "bn": return { word: target.bn, ask, latin: false };
    case "en": return { word: target.en, ask, latin: true };
    case "role": return { word: target.role!, ask, latin: false };
    case "home": return { word: target.bn, ask: "কোথায় থাকে?", latin: false };
    case "thing": return { word: target.thing!.bn, ask: "এটার রং কী?", latin: false };
    case "read": return { word: "", ask: "এটার নাম কী?", latin: false };
  }
}

/** What the child now knows, said once the answer is found: "উট থাকে মরুভূমিতে" or "আম · Mango". */
export function learnedLine(mode: Mode, target: Item) {
  if (mode === "home") return { main: `${target.bn} থাকে ${HABITATS.find(home => home.id === target.home)!.at}`, sub: target.fact ?? "" };
  if (mode === "thing") return { main: `${target.thing!.bn} ${target.bn}`, sub: target.en };
  if (mode === "role") return { main: `${target.role} ${target.bn}`, sub: target.en };
  return { main: target.bn, sub: target.en };
}

/** One cell of the parent's card: a picture (or a spot on the figure) and two lines. */
export function cardCell(mode: Mode, target: Item) {
  if (mode === "home") return { art: target.art, spot: null, top: target.bn, bottom: HABITATS.find(home => home.id === target.home)!.bn };
  if (mode === "thing") return { art: target.thing!.art, spot: null, top: `${target.thing!.bn} ${target.bn}`, bottom: target.en };
  return { art: target.art, spot: target.spots?.[0] ?? null, top: target.bn, bottom: target.en };
}

/** The card's headline. */
export function cardTitle(pack: Pack, mode: Mode, count: number, bn: (n: number) => string) {
  const n = `${bn(count)}টা`;
  if (mode === "home") return `আজ জানলাম ${n} প্রাণী কোথায় থাকে`;
  if (mode === "thing") return `আজ ${n} জিনিসের রং চিনলাম`;
  if (mode === "role") return `আজ ${n} জাতীয় প্রতীক চিনলাম`;
  if (pack.id === "shorir") return `আজ শরীরের ${n} অঙ্গের ${mode === "en" ? "ইংরেজি " : ""}নাম শিখলাম`;
  return `আজ ${n} ${pack.noun} ${mode === "en" ? "ইংরেজি " : ""}নাম শিখলাম`;
}

/** Where a pack opens: the first playable level without stars, else level 1 (every level done: start again from the top). */
export function firstOpenLevel(stars: Record<number, number>, count: number) {
  const unlocked = Math.min(count, 1 + Math.max(0, ...Object.keys(stars).map(Number)));
  for (let level = 1; level <= unlocked; level++) if (!stars[level]) return level;
  return 1;
}

/** Where a point of the figure sits inside its view, as CSS percentages (for the ghost finger). */
export function spotPercent(view: View, [x, y]: [number, number]) {
  const [left, top, width, height] = VIEWS[view].split(" ").map(Number);
  return { left: `${((x - left) / width) * 100}%`, top: `${((y - top) / height) * 100}%` };
}
