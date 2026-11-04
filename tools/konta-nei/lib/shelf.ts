// One level's three seeded shelves: what you look at, what মামা takes, the shelf when your eyes open, and the pictures
// to pick from. Pure and server-safe. `v` 1 is the pre-rewrite generator (lib/legacy.ts, for old links); 2 is this one.
import { makeRng, pick } from "../../../shared/game-core";
import { ITEM_IDS, familyOf, type ItemId } from "./items";
import { levelAt, type Spec } from "./levels";
import { legacyLevel, levelOf as legacyLevelOf } from "./legacy";

export const ROUNDS = 3;
export type Version = 1 | 2;

/**
 * `shelf` is what you look at; `gone` is what মামা took (two on a finale) and `slots` their places on it. `after` is the
 * shelf when your eyes open, and `from[i]` the shelf index the thing at after[i] came from (-1: an empty place or a
 * newcomer), so the reveal can slide everything back. `newcomers` sit in the gone places on a swap level.
 */
export type Round = { shelf: ItemId[]; gone: ItemId[]; slots: number[]; after: (ItemId | null)[]; from: number[]; newcomers: ItemId[]; choices: ItemId[] };
export type Deal = { level: number; seed: number; v: Version; spec: Spec; rounds: Round[] };

/** The rules a level plays by: the new ladder's, or the old table's for an old link. */
export function specOf(level: number, v: Version): Spec {
  if (v === 2) { const { lesson: _lesson, ...spec } = levelAt(level); return spec; }
  const old = legacyLevelOf(level);
  return { ...old, alike: false, plain: false, two: false };
}

function shuffle<T>(rng: () => number, list: readonly T[]) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) { const j = pick(rng, i + 1); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

/** Moves the first `take` items that pass `test` to the front, keeping the rest in order. */
function preferFirst<T>(list: readonly T[], test: (item: T) => boolean, take: number) {
  const front: T[] = [], rest: T[] = [];
  for (const item of list) (front.length < take && test(item) ? front : rest).push(item);
  return [...front, ...rest];
}

/** One shelf of the new ladder. `avoid` keeps a thing that already went this level from going again. */
export function makeRound(spec: Spec, rng: () => number, avoid: readonly ItemId[] = []): Round {
  const { count, choices, unseen, twist, alike, two } = spec;
  const howMany = two ? 2 : 1;
  let pool = shuffle(rng, ITEM_IDS), lead: ItemId | null = null;
  // A look-alike shelf is built round the first thing to go: up to two of its family sit on the shelf with it, and one
  // more family mate waits off the shelf as the lure.
  if (alike) {
    lead = pool.find(id => !avoid.includes(id))!;
    const family = familyOf(lead);
    const rest = preferFirst(pool.filter(id => id !== lead), id => familyOf(id) === family, 2);
    const shelf = shuffle(rng, [lead, ...rest.slice(0, count - 1)]);
    const off = preferFirst(rest.slice(count - 1), id => familyOf(id) === family, 1);
    pool = [...shelf, ...off];
  }
  const shelf = pool.slice(0, count), never = pool.slice(count);
  const open = shelf.map((_, index) => index).filter(index => !avoid.includes(shelf[index]));
  const slots: number[] = [];
  if (lead) slots.push(shelf.indexOf(lead));
  while (slots.length < howMany) {
    const left = open.filter(index => !slots.includes(index));
    slots.push(left[pick(rng, left.length)]);
  }
  slots.sort((a, b) => a - b);
  const gone = slots.map(index => shelf[index]);
  const newcomers: ItemId[] = [];
  let after: (ItemId | null)[], from: number[];
  if (twist === "gap") {
    after = shelf.map((id, index) => slots.includes(index) ? null : id);
    from = shelf.map((_, index) => slots.includes(index) ? -1 : index);
  } else if (twist === "move") {
    from = shelf.map((_, index) => index).filter(index => !slots.includes(index));
    const a = pick(rng, from.length);
    let b = pick(rng, from.length - 1);
    if (b >= a) b++;
    [from[a], from[b]] = [from[b], from[a]];
    after = from.map(index => shelf[index]);
  } else {
    // The newcomers come from off the shelf, and never from the look-alike lure kept for the pictures.
    for (let k = 0; k < howMany; k++) newcomers.push(never.splice(alike ? 1 : 0, 1)[0]);
    after = shelf.map((id, index) => slots.includes(index) ? newcomers[slots.indexOf(index)] : id);
    from = shelf.map((_, index) => slots.includes(index) ? -1 : index);
  }
  // Wrong pictures: things still on the shelf (the newcomers first, as the lure; family mates first on a look-alike
  // level), then things that were never there (the family mate first).
  const family = familyOf(lead ?? gone[0]);
  let still = shuffle(rng, shelf.filter(id => !gone.includes(id)));
  if (alike) still = preferFirst(still, id => familyOf(id) === family, 2);
  const onShelf = [...newcomers, ...still].slice(0, choices - howMany - unseen);
  return { shelf, gone, slots, after, from, newcomers, choices: shuffle(rng, [...gone, ...onShelf, ...never.slice(0, unseen)]) };
}

/** An old link's shelf, in the new shape. */
function fromLegacy(round: ReturnType<typeof legacyLevel>[number]): Round {
  const { shelf, missing, slot, after, newcomer, choices } = round;
  const from = after.map(id => id === null || id === newcomer ? -1 : shelf.indexOf(id));
  return { shelf, gone: [missing], slots: [slot], after, from, newcomers: newcomer ? [newcomer] : [], choices };
}

/** The level's three shelves: the same on every phone for the same level, seed and version. */
export function makeDeal(level: number, seed: number, v: Version = 2): Deal {
  const spec = specOf(level, v);
  if (v === 1) return { level, seed, v, spec, rounds: legacyLevel(level, seed).map(fromLegacy) };
  const rng = makeRng((Math.imul(seed, 31) + level * 7919 + 2) >>> 0), rounds: Round[] = [];
  for (let index = 0; index < ROUNDS; index++) rounds.push(makeRound(spec, rng, rounds.flatMap(round => round.gone)));
  return { level, seed, v, spec, rounds };
}

/** The pictures that are the answer: everything gone, in the order of the choices. */
export const answerOf = (round: Round) => round.choices.filter(id => round.gone.includes(id));
