// The rules of the tree: rounds of falling fruit, the basket, catches and mistakes. Pure and seeded, so a link replays the same tree.
import { makeRng, pick, starsFor } from "../../../shared/game-core";
import { decoyPool, levelOf, starLimits, LEVELS, type Level } from "./levels";

/** The board in its own units; the canvas scales it to the phone. */
export const W = 360, H = 480;
/** Five spots on the branches where a fruit hangs, and how high each one is. */
export const LANES = [50, 115, 180, 245, 310] as const;
export const HANG_Y = [94, 76, 102, 80, 96] as const;
export const R = 27;
export const BASKET_Y = 418;
/** A fruit crossing this line over the basket lands in it. */
export const CATCH_Y = 400;
export const GROUND_Y = 452;
export const CATCH_HALF = 46;
export const BASKET_SPEED = 520;
/** Time a person needs to see the right fruit and start moving (used to prove every round can be won). */
export const REACT = 0.45;
/** Two fruits of one round never reach the basket closer together than this. */
export const LAND_GAP = 0.3;
const POOL = 24;

export const FREE = 0, HANG = 1, FALL = 2, CAUGHT = 3, BOUNCE = 4, GROUND = 5;
/** What happened in the last step, as bit flags for the page to react to. */
export const EV_CATCH = 1, EV_WRONG = 2, EV_MISS = 4, EV_DONE = 8, EV_NEAR = 16;

export type Plan = { text: string; target: boolean; lane: number; drop: number };
export type Fruit = { state: number; text: string; item: number; lane: number; x: number; y: number; vx: number; vy: number; born: number; drop: number; ended: number };

export const fallTime = (spec: Level, lane: number) => (CATCH_Y - HANG_Y[lane]) / spec.speed;

/**
 * One round: the right fruit plus a few wrong ones, each on its own branch, dropping at seeded times.
 * Wrong ones never carry the right letter or the next two, and no two fruits reach the basket together.
 * The same seed, round and place in the sequence always give the same round.
 */
export function planRound(level: number, seed: number, round: number, index: number): Plan[] {
  const spec = levelOf(level), rng = makeRng(((seed ^ Math.imul(round + 1, 0x9e3779b1)) >>> 0) || 1);
  const lanes = [0, 1, 2, 3, 4];
  for (let i = lanes.length - 1; i > 0; i--) { const j = pick(rng, i + 1); [lanes[i], lanes[j]] = [lanes[j], lanes[i]]; }
  const banned = new Set(spec.items.slice(index, index + 3).map(item => item.text));
  const pool = decoyPool(spec.world).filter(text => !banned.has(text));
  // The very first two rounds of the game have one fruit only: a win before anything can go wrong.
  const count = level === 1 && round < 2 ? 0 : Math.min(spec.decoys, pool.length);
  const plans: Plan[] = [{ text: spec.items[index].text, target: true, lane: lanes[0], drop: spec.ripen + rng() * 0.4 }];
  const lands = [plans[0].drop + fallTime(spec, lanes[0])];
  for (let k = 0; k < count; k++) {
    const text = pool.splice(pick(rng, pool.length), 1)[0], lane = lanes[k + 1];
    let drop = 0.3 + rng() * (spec.ripen + 0.5);
    while (lands.some(land => Math.abs(land - drop - fallTime(spec, lane)) < LAND_GAP)) drop += LAND_GAP;
    plans.push({ text, target: false, lane, drop });
    lands.push(drop + fallTime(spec, lane));
  }
  return plans;
}

export type Game = ReturnType<typeof makeGame>;

export function makeGame(level: number, seed: number) {
  const spec = levelOf(level);
  return {
    level: LEVELS.indexOf(spec) + 1, seed, spec,
    t: 0, index: 0, round: 0, nextRound: 0.35, pending: -1, lastLand: 0,
    basketX: LANES[2] as number, aimX: LANES[2] as number, wobble: 0,
    wrong: 0, missed: 0, streak: 0, over: false,
    events: 0, caught: -1, hit: -1,
    fruits: Array.from({ length: POOL }, (): Fruit => ({ state: FREE, text: "", item: -1, lane: 0, x: 0, y: 0, vx: 0, vy: 0, born: 0, drop: 0, ended: 0 })),
  };
}

export const errorsOf = (game: Pick<Game, "wrong" | "missed">) => game.wrong + game.missed;
export const starsOf = (level: number, errors: number) => { const [three, two] = starLimits(level); return starsFor(errors, three, two, true); };

/** Where the basket heads (it glides there at BASKET_SPEED). Kept inside the outer branches. */
export const aim = (game: Game, x: number) => { game.aimX = Math.min(LANES[4], Math.max(LANES[0], x)); };

function spawn(game: Game) {
  for (const plan of planRound(game.level, game.seed, game.round, game.index)) {
    const slot = game.fruits.findIndex(fruit => fruit.state === FREE);
    if (slot < 0) break;
    const fruit = game.fruits[slot];
    Object.assign(fruit, { state: HANG, text: plan.text, item: plan.target ? game.index : -1, lane: plan.lane, x: LANES[plan.lane], y: HANG_Y[plan.lane], vx: 0, vy: 0, born: game.t, drop: game.t + plan.drop, ended: 0 });
    game.lastLand = Math.max(game.lastLand, fruit.drop + fallTime(game.spec, plan.lane));
    if (plan.target) game.pending = slot;
  }
  game.round++;
  game.nextRound = Infinity;
}

function land(game: Game, slot: number) {
  const fruit = game.fruits[slot], items = game.spec.items;
  fruit.ended = game.t;
  if (fruit.text === items[game.index].text) {
    fruit.state = CAUGHT;
    game.caught = game.index;
    game.index++; game.streak++;
    game.events |= EV_CATCH;
    if (game.index >= items.length) { game.over = true; game.events |= EV_DONE; }
  } else {
    fruit.state = BOUNCE;
    fruit.vx = fruit.x < game.basketX ? -110 : 110; fruit.vy = -230;
    game.wrong++; game.streak = 0; game.wobble = 0.5; game.hit = slot;
    game.events |= EV_WRONG;
  }
}

/** Advances the tree by `dt` seconds. Read `events` afterwards for what happened. */
export function step(game: Game, dt: number) {
  game.events = 0;
  if (game.over) return;
  game.t += dt;
  const move = game.aimX - game.basketX, most = BASKET_SPEED * dt;
  game.basketX += Math.max(-most, Math.min(most, move));
  game.wobble = Math.max(0, game.wobble - dt);
  if (game.t >= game.nextRound) spawn(game);

  const speed = game.spec.speed;
  for (let slot = 0; slot < game.fruits.length; slot++) {
    const fruit = game.fruits[slot];
    const s = fruit.state;
    if (s === FREE) continue;
    if (s === HANG) { if (game.t >= fruit.drop) fruit.state = FALL; continue; }
    if (s === FALL) {
      const before = fruit.y;
      fruit.y += speed * dt;
      if (before < CATCH_Y && fruit.y >= CATCH_Y && Math.abs(fruit.x - game.basketX) <= CATCH_HALF) land(game, slot);
      else if (fruit.y >= GROUND_Y) {
        fruit.y = GROUND_Y; fruit.state = GROUND; fruit.ended = game.t;
        if (fruit.item === game.index) {
          game.missed++; game.streak = 0; game.events |= EV_MISS;
          if (Math.abs(fruit.x - game.basketX) <= CATCH_HALF + 26) game.events |= EV_NEAR;
        }
      }
      if (game.over) return;
      continue;
    }
    if (s === BOUNCE) {
      fruit.vy += 900 * dt; fruit.x += fruit.vx * dt; fruit.y += fruit.vy * dt;
      if (game.t - fruit.ended > 0.7) fruit.state = FREE;
      continue;
    }
    if (game.t - fruit.ended > (s === CAUGHT ? 0.3 : 0.9)) fruit.state = FREE;
  }

  // The round ends once its right fruit is caught or on the grass. The next one waits until every fruit of this one is down, so rounds never overlap.
  if (game.pending >= 0) {
    const fruit = game.fruits[game.pending];
    if ((fruit.state !== HANG && fruit.state !== FALL) || fruit.item !== game.index) {
      game.pending = -1;
      game.nextRound = Math.max(game.t, game.lastLand) + game.spec.gap;
    }
  }
}
