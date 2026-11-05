// The storm's step, 60 times a second: move the ডালা, settle every drop whose centre crossed the rim, keep score.
// Allocation-free (npm run lint:games checks it): it only mutates the Game made by game.ts.
import { clamp, isMango, reachOf, BASKET_MAX, BASKET_MIN, BIG, BRANCH, CAUGHT, GOLD, HAIL, HIT, MISSED, POINTS, RIPE } from "./physics";
import type { Game } from "./game";

/** Advances the storm by `dt` seconds. The ডালা moves toward `target`, at most `moveBy` units this step. */
export function stepGame(game: Game, dt: number, target: number, moveBy: number) {
  if (game.over) return;
  const goal = clamp(target, BASKET_MIN, BASKET_MAX);
  game.basket += clamp(goal - game.basket, -moveBy, moveBy);
  game.t = Math.min(game.storm.duration, game.t + dt);
  const drops = game.drops;
  while (game.next < drops.length && drops[game.next].tc <= game.t) {
    const drop = drops[game.next++];
    const hit = Math.abs(drop.xc - game.basket) <= reachOf(drop.kind);
    let lost = -1;
    if (drop.kind === BRANCH || drop.kind === BIG) {
      drop.state = hit ? HIT : MISSED;
      if (hit) { game.lives--; game.hits++; game.streak = 0; }
    } else if (drop.kind === HAIL) {
      drop.state = hit ? HIT : MISSED;
      if (hit && game.pileCount > 0) {
        lost = game.pile[--game.pileCount];
        game.score -= POINTS[lost]; game.caught--; game.knocked++; game.streak = 0;
        if (lost === RIPE) game.ripe--; else if (lost === GOLD) game.gold--;
      }
    } else if (hit && isMango(drop.kind)) {
      drop.state = CAUGHT;
      game.score += POINTS[drop.kind];
      game.caught++;
      if (drop.kind === RIPE) game.ripe++; else if (drop.kind === GOLD) game.gold++;
      if (game.pileCount < game.pile.length) game.pile[game.pileCount++] = drop.kind;
      game.streak++;
      if (game.streak > game.bestStreak) game.bestStreak = game.streak;
    } else { drop.state = MISSED; game.missed++; game.streak = 0; }
    const event = game.events[game.eventCount++ % game.events.length];
    event.kind = drop.kind; event.x = drop.xc; event.t = drop.tc; event.caught = hit; event.streak = game.streak; event.lost = lost;
    if (game.lives <= 0) { game.over = 2; return; }
  }
  if (game.t >= game.storm.duration) game.over = 1;
}

/** The nearest hazard about to land within reach of the ডালা in the next `ahead` seconds: its side (-1, 1), or 0. */
export function dangerSide(game: Game, ahead: number) {
  const drops = game.drops;
  for (let index = game.next; index < drops.length; index++) {
    const drop = drops[index];
    if (drop.tc > game.t + ahead) return 0;
    if ((drop.kind === BRANCH || drop.kind === BIG || drop.kind === HAIL) && Math.abs(drop.xc - game.basket) <= reachOf(drop.kind) + 6) return drop.xc < game.basket ? -1 : 1;
  }
  return 0;
}
