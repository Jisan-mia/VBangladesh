// The rules of the tree, pure and seeded so a link replays the same tree and the tests can play it headless.
// Two ways to play the same levels:
//   গাছতলা ("calm", the default): a round's fruits hang and wait; the child taps the right one and it drops into the basket.
//   ঝড়ো হাওয়া ("wind", 7+): the wind shakes fruit loose at seeded times; steer the basket under the right one.
// Per-frame code is in step.hot.ts; this file holds the state, the round planning (once a round) and the input rules.
import { makeRng, pick, starsFor } from "../../../shared/game-core";
import { decoyPool, levelOf, starLimits, LEVELS, type Level } from "./levels";

export type Mode = "calm" | "wind";
export const isMode = (value: unknown): value is Mode => value === "calm" || value === "wind";

/** The board in its own units; the canvas scales it to the phone. */
export const W = 360, H = 480;
/** ঝড়ো হাওয়া: five spots on the branches where a fruit hangs, and how high each one is. */
export const LANES = [50, 115, 180, 245, 310] as const;
export const HANG_Y = [94, 76, 102, 80, 96] as const;
/** গাছতলা: a round's 1–4 fruits spread evenly, so each owns a column at least 80 units wide. */
export const CALM_X: readonly (readonly number[])[] = [[], [180], [112, 248], [72, 180, 288], [52, 136, 224, 308]];
export const CALM_Y = [100, 84, 104, 86] as const;
/** গাছতলা fruits are drawn this much bigger: fewer of them, and small fingers. */
export const CALM_SCALE = 1.3;
export const R = 27;
export const BASKET_Y = 418;
/** A fruit crossing this line over the basket lands in it. */
export const CATCH_Y = 400;
export const GROUND_Y = 452;
export const CATCH_HALF = 46;
export const BASKET_SPEED = 520;
/** গাছতলা: a picked fruit drops with this pull (units/s²), from a small start speed. */
export const CALM_PULL = 1500;
/** Time a person needs to see the right fruit and start moving (used to prove every round can be won). */
export const REACT = 0.45;
/** Two fruits of one round never reach the basket closer together than this. */
export const LAND_GAP = 0.3;
/** গাছতলা: how long a new round's fruits take to grow on the branch, and the pause after a catch. */
export const GROW = 0.3;
export const CALM_GAP = 0.35;
/** A wrong pick shakes the fruit (or rocks the basket) this long. */
export const SHAKE = 0.5;
/** Wrong picks on one letter before the right fruit glows. */
export const HINT_AFTER = 2;
const POOL = 24;

export const FREE = 0, HANG = 1, FALL = 2, CAUGHT = 3, BOUNCE = 4, GROUND = 5, LEAVE = 6;
/** What happened in the last step, as bit flags for the page to react to. */
export const EV_CATCH = 1, EV_WRONG = 2, EV_MISS = 4, EV_DONE = 8, EV_NEAR = 16, EV_DROP = 32, EV_ROUND = 64;
/** pickFruit's answer. */
export const PICK_NONE = 0, PICK_RIGHT = 1, PICK_WRONG = 2;

export type Plan = { text: string; target: boolean; lane: number; drop: number };
export type Fruit = {
  state: number; text: string; item: number; lane: number; x: number; y: number; vx: number; vy: number;
  born: number; drop: number; ended: number; shake: number; scale: number;
};

export const fallTime = (spec: Level, lane: number) => (CATCH_Y - HANG_Y[lane]) / spec.speed;

/** Wrong fruits beside the right one this round: the level's count, eased by one after a run of misses, raised by one after a run of first tries (never more than 3, so never more than 4 fruits). */
export function decoysFor(level: number, round: number, ease: number) {
  const spec = levelOf(level);
  if (level === 1 && round < 2) return 0;
  return Math.max(0, Math.min(3, spec.decoys + ease));
}

function shuffled(rng: () => number, count: number) {
  const order = Array.from({ length: count }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) { const j = pick(rng, i + 1); [order[i], order[j]] = [order[j], order[i]]; }
  return order;
}

function decoyTexts(level: number, index: number, rng: () => number, count: number) {
  const spec = levelOf(level);
  const banned = new Set(spec.items.slice(index, index + 3).map(item => item.text));
  const pool = decoyPool(spec.world).filter(text => !banned.has(text));
  return Array.from({ length: Math.min(count, pool.length) }, () => pool.splice(pick(rng, pool.length), 1)[0]);
}

const roundRng = (seed: number, round: number) => makeRng(((seed ^ Math.imul(round + 1, 0x9e3779b1)) >>> 0) || 1);

/**
 * ঝড়ো হাওয়া: one round, the right fruit plus a few wrong ones, each on its own branch, dropping at seeded times.
 * Wrong ones never carry the right letter or the next two, and no two fruits reach the basket together.
 * The same seed, round and place in the sequence always give the same round. `decoys` defaults to the level's count.
 */
export function planRound(level: number, seed: number, round: number, index: number, decoys = decoysFor(level, round, 0)): Plan[] {
  const spec = levelOf(level), rng = roundRng(seed, round);
  const lanes = shuffled(rng, 5);
  const plans: Plan[] = [{ text: spec.items[index].text, target: true, lane: lanes[0], drop: spec.ripen + rng() * 0.4 }];
  const lands = [plans[0].drop + fallTime(spec, lanes[0])];
  decoyTexts(level, index, rng, decoys).forEach((text, k) => {
    const lane = lanes[k + 1];
    let drop = 0.3 + rng() * (spec.ripen + 0.5);
    while (lands.some(land => Math.abs(land - drop - fallTime(spec, lane)) < LAND_GAP)) drop += LAND_GAP;
    plans.push({ text, target: false, lane, drop });
    lands.push(drop + fallTime(spec, lane));
  });
  return plans;
}

/** গাছতলা: one round, the right fruit and the wrong ones spread across the tree in a seeded order. `lane` is the spot, 0..count-1. */
export function planCalm(level: number, seed: number, round: number, index: number, decoys = decoysFor(level, round, 0)) {
  const spec = levelOf(level), rng = roundRng(seed, round);
  const texts = [spec.items[index].text, ...decoyTexts(level, index, rng, decoys)];
  const spots = shuffled(rng, texts.length);
  return texts.map((text, k) => ({ text, target: k === 0, lane: spots[k], drop: Infinity }));
}

export type Game = ReturnType<typeof makeGame>;

export function makeGame(level: number, seed: number, mode: Mode = "calm") {
  const spec = levelOf(level);
  return {
    mode, level: LEVELS.indexOf(spec) + 1, seed, spec,
    t: 0, index: 0, round: 0, nextRound: mode === "calm" ? 0.2 : 0.35, pending: -1, lastLand: 0,
    basketX: LANES[2] as number, aimX: LANES[2] as number, wobble: 0,
    /** Every wrong pick, fruits dropped on the grass (ঝড়ো হাওয়া), and letters that needed more than one try. */
    wrong: 0, missed: 0, slips: 0,
    /** Wrong picks on the letter now wanted (the hint glows at HINT_AFTER). */
    tries: 0,
    /** The quiet difficulty: -1 hangs one fewer wrong fruit, +1 one more. Runs of misses and of first tries move it. */
    ease: 0, missRun: 0, rightRun: 0,
    /** Right fruits caught in a row (the combo sound). */
    streak: 0,
    /** গাছতলা: the picked fruit on its way down (-1 when none); ঝড়ো হাওয়া: the right fruit will land away from the basket. */
    falling: -1, danger: false,
    over: false, events: 0, caught: -1, hit: -1,
    fruits: Array.from({ length: POOL }, (): Fruit => ({ state: FREE, text: "", item: -1, lane: 0, x: 0, y: 0, vx: 0, vy: 0, born: 0, drop: 0, ended: 0, shake: 0, scale: 1 })),
  };
}

export const errorsOf = (game: Pick<Game, "slips">) => game.slips;
/** Stars from letters that needed more than one try. A dropped fruit is not a mistake; it comes back. */
export const starsOf = (level: number, slips: number) => { const [three, two] = starLimits(level); return starsFor(slips, three, two, true); };
/** Letters picked right on the first try. */
export const firstTries = (game: Pick<Game, "slips" | "index">) => game.index - game.slips;
export const hinting = (game: Pick<Game, "tries">) => game.tries >= HINT_AFTER;

/** Where the basket heads (it glides there at BASKET_SPEED). Kept inside the outer branches. */
export const aim = (game: Game, x: number) => { game.aimX = Math.min(LANES[4], Math.max(LANES[0], x)); };
/** Let go: the basket stops where it is. In গাছতলা a picked fruit keeps the basket under it. */
export const hold = (game: Game) => { if (game.falling < 0) game.aimX = game.basketX; };

/** Spawns the next round into free slots. Called from the step once per round; allocates, so it lives here, not in the hot file. */
export function spawnRound(game: Game) {
  const calm = game.mode === "calm", decoys = decoysFor(game.level, game.round, game.ease);
  const plans = calm ? planCalm(game.level, game.seed, game.round, game.index, decoys) : planRound(game.level, game.seed, game.round, game.index, decoys);
  const spots = CALM_X[plans.length] ?? CALM_X[4];
  plans.forEach((plan, k) => {
    const slot = game.fruits.findIndex(fruit => fruit.state === FREE);
    if (slot < 0) return;
    const fruit = game.fruits[slot];
    const x = calm ? spots[plan.lane] : LANES[plan.lane], y = calm ? CALM_Y[plan.lane] : HANG_Y[plan.lane];
    Object.assign(fruit, {
      state: HANG, text: plan.text, item: plan.target ? game.index : -1, lane: plan.lane, x, y, vx: 0, vy: 0,
      born: game.t + (calm ? k * 0.06 : 0), drop: game.t + plan.drop, ended: 0, shake: 0, scale: calm ? CALM_SCALE : 1,
    });
    if (!calm) game.lastLand = Math.max(game.lastLand, fruit.drop + fallTime(game.spec, plan.lane));
    if (plan.target) game.pending = slot;
  });
  game.round++;
  game.nextRound = Infinity;
  game.events |= EV_ROUND;
}

/** A miss (a wrong pick or catch, or the right fruit on the grass): the hint, the slip and the quiet easing. */
function wrongPick(game: Game, counts: boolean) {
  if (counts) {
    game.wrong++;
    if (game.tries === 0) game.slips++;
    game.tries++;
  }
  game.streak = 0; game.rightRun = 0; game.missRun++;
  if (game.missRun >= 3) { game.ease = Math.max(-1, game.ease - 1); game.missRun = 0; }
}

/** The right letter is in the basket. */
export function landRight(game: Game, slot: number) {
  const fruit = game.fruits[slot], items = game.spec.items;
  fruit.state = CAUGHT; fruit.ended = game.t;
  game.caught = game.index;
  game.missRun = 0;
  if (game.tries === 0) { game.rightRun++; if (game.rightRun >= 5) { game.ease = Math.min(1, game.ease + 1); game.rightRun = 0; } }
  else game.rightRun = 0;
  game.index++; game.streak++; game.tries = 0; game.falling = -1;
  game.events |= EV_CATCH;
  if (game.index >= items.length) { game.over = true; game.events |= EV_DONE; }
}

/** ঝড়ো হাওয়া: a wrong fruit hits the basket and bounces off. */
export function landWrong(game: Game, slot: number) {
  const fruit = game.fruits[slot];
  fruit.state = BOUNCE; fruit.ended = game.t;
  fruit.vx = fruit.x < game.basketX ? -110 : 110; fruit.vy = -230;
  game.wobble = SHAKE; game.hit = slot;
  wrongPick(game, true);
  game.events |= EV_WRONG;
}

/** ঝড়ো হাওয়া: the right fruit reached the grass. It costs no star; it comes back next round. */
export function droppedRight(game: Game) {
  game.missed++;
  wrongPick(game, false);
  game.events |= EV_MISS;
}

/**
 * গাছতলা: the child taps a fruit. The right one leaves its branch and drops into the basket (which glides under it);
 * a wrong one shakes and stays. Ignored while a picked fruit is still falling, before a round, and in ঝড়ো হাওয়া.
 */
export function pickFruit(game: Game, slot: number) {
  if (game.mode !== "calm" || game.over || game.falling >= 0 || slot < 0) return PICK_NONE;
  const fruit = game.fruits[slot];
  if (!fruit || fruit.state !== HANG) return PICK_NONE;
  if (fruit.item === game.index) {
    fruit.state = FALL; fruit.vy = 60; fruit.shake = 0;
    game.falling = slot; game.aimX = fruit.x;
    return PICK_RIGHT;
  }
  fruit.shake = SHAKE; game.wobble = SHAKE; game.hit = slot;
  wrongPick(game, true);
  return PICK_WRONG;
}

/** গাছতলা: the hanging fruit whose column holds `x` (each fruit owns the board's full height around it), or -1. */
export function fruitAt(game: Game, x: number) {
  let best = -1, gap = Infinity;
  for (let slot = 0; slot < game.fruits.length; slot++) {
    const fruit = game.fruits[slot];
    if (fruit.state !== HANG) continue;
    const d = Math.abs(fruit.x - x);
    if (d < gap) { gap = d; best = slot; }
  }
  return gap <= 60 ? best : -1;
}

/** গাছতলা keys: ← / → slide the basket to the next hanging fruit. */
export function nudge(game: Game, dir: -1 | 1) {
  if (game.falling >= 0) return;
  let to = -1, gap = Infinity;
  for (const fruit of game.fruits) {
    if (fruit.state !== HANG) continue;
    const d = (fruit.x - game.aimX) * dir;
    if (d > 4 && d < gap) { gap = d; to = fruit.x; }
  }
  if (to >= 0) game.aimX = to;
}

/** গাছতলা keys: Space / Enter / ↓ pick the fruit above the basket. */
export const pickAbove = (game: Game) => pickFruit(game, fruitAt(game, game.aimX));
