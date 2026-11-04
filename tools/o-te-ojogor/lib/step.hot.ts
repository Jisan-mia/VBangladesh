// One fixed step of the tree (60 a second). Runs every frame: no allocation, no closures. A new round is planned by
// spawnRound (tree.ts) once per round, which is where the arrays are made.
import {
  droppedRight, landRight, landWrong, spawnRound, type Game,
  BASKET_SPEED, BOUNCE, CALM_GAP, CALM_PULL, CATCH_HALF, CATCH_Y, CAUGHT, EV_DROP, EV_NEAR, FALL, FREE, GROUND, GROUND_Y, HANG, LEAVE,
} from "./tree";

/** How long before the right fruit lands the board's edge warns that the basket isn't under it (ঝড়ো হাওয়া). */
const WARN = 0.6;

/** Advances the tree by `dt` seconds. Read `events` afterwards for what happened. */
export function step(game: Game, dt: number) {
  game.events = 0;
  if (game.over) return;
  game.t += dt;
  const calm = game.mode === "calm";
  const move = game.aimX - game.basketX, most = BASKET_SPEED * dt;
  game.basketX += Math.max(-most, Math.min(most, move));
  game.wobble = Math.max(0, game.wobble - dt);
  if (game.t >= game.nextRound) spawnRound(game);

  const speed = game.spec.speed;
  game.danger = false;
  for (let slot = 0; slot < game.fruits.length; slot++) {
    const fruit = game.fruits[slot];
    const s = fruit.state;
    if (fruit.shake > 0) fruit.shake = Math.max(0, fruit.shake - dt);
    if (s === FREE) continue;
    if (s === HANG) {
      if (game.t >= fruit.drop) { fruit.state = FALL; game.events |= EV_DROP; }
      continue;
    }
    if (s === FALL) {
      const before = fruit.y;
      if (calm) { fruit.vy += CALM_PULL * dt; fruit.y += fruit.vy * dt; }
      else fruit.y += speed * dt;
      const over = Math.abs(fruit.x - game.basketX) <= CATCH_HALF;
      if (before < CATCH_Y && fruit.y >= CATCH_Y && (over || calm)) {
        if (fruit.item === game.index) landRight(game, slot); else landWrong(game, slot);
        if (calm && game.fruits[slot].state === CAUGHT) clearRound(game, slot);
      } else if (fruit.y >= GROUND_Y) {
        fruit.y = GROUND_Y; fruit.state = GROUND; fruit.ended = game.t;
        if (fruit.item === game.index) {
          droppedRight(game);
          if (Math.abs(fruit.x - game.basketX) <= CATCH_HALF + 26) game.events |= EV_NEAR;
        }
      } else if (!calm && fruit.item === game.index && !over && (CATCH_Y - fruit.y) / speed < WARN) game.danger = true;
      if (game.over) return;
      continue;
    }
    if (s === BOUNCE) {
      fruit.vy += 900 * dt; fruit.x += fruit.vx * dt; fruit.y += fruit.vy * dt;
      if (game.t - fruit.ended > 0.7) fruit.state = FREE;
      continue;
    }
    if (game.t - fruit.ended > (s === CAUGHT ? 0.3 : s === LEAVE ? 0.4 : 0.9)) fruit.state = FREE;
  }

  // ঝড়ো হাওয়া: the round ends once its right fruit is caught or on the grass; the next waits until every fruit of this one is down.
  if (!calm && game.pending >= 0) {
    const fruit = game.fruits[game.pending];
    if ((fruit.state !== HANG && fruit.state !== FALL) || fruit.item !== game.index) {
      game.pending = -1;
      game.nextRound = Math.max(game.t, game.lastLand) + game.spec.gap;
    }
  }
}

/** গাছতলা: the right fruit is in; the wrong ones fade off the branches and the next round grows after a breath. */
function clearRound(game: Game, caught: number) {
  for (let slot = 0; slot < game.fruits.length; slot++) {
    const fruit = game.fruits[slot];
    // On the last catch the frames stop under the end screen, so the others go at once instead of freezing mid-fade.
    if (slot !== caught && fruit.state === HANG) { fruit.state = game.over ? FREE : LEAVE; fruit.ended = game.t; }
  }
  game.pending = -1;
  if (!game.over) game.nextRound = game.t + CALM_GAP;
}
