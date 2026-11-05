// The marble's step, 60 times a second: the camera rises, cracked steps fall, the marble rolls with its weight, drops,
// lands, picks up marbles and loses chances. Allocation-free (npm run lint:games checks it): it only mutates the Game.
import {
  gripOf, inHole, onPot, over, safeCentre, surfacePush, surfaceY,
  AIR_ACCEL, AIR_DRAG, ACCEL, CRACK, FAST, FOLLOW, LANDING_GRIP, G, GAP, H, R, RESPAWN, REFILL, TOP, VMAX, VX, W, WIND, type Ledge,
} from "./physics";
import { BONUS, BOTTOM_HIT, CACTUS, CRACKED, GUST, HURT, LAND, OVER, PICK, SURGED, TOP_HIT, WIN, type Game } from "./game";

/** The horizontal speed after one step of a held side (`push` per second), the surface's own pull and the grip. */
function roll(v: number, dir: number, push: number, pull: number, grip: number, dt: number) {
  v += pull * dt;
  if (dir !== 0) {
    if (v * dir < VX) { v += dir * push * dt; if (v * dir > VX) v = dir * VX; }
  } else {
    const brake = grip * dt;
    v = v > brake ? v - brake : v < -brake ? v + brake : 0;
  }
  return v > FAST ? FAST : v < -FAST ? -FAST : v;
}

/** A lost chance: the marble comes back on a plain safe ledge near the middle of the board, on a row no higher than its deepest. */
function hurt(game: Game, kind: number) {
  game.events |= HURT;
  game.hurt = kind;
  game.chances--;
  game.falls++;
  game.streak = 0;
  game.vx = 0; game.vy = 0; game.wind = 0; game.skip = -1;
  if (game.chances <= 0) { game.over = 2; game.events |= OVER; game.on = -1; return; }
  const rows = game.rows, mid = game.cam + H * 0.45;
  let home = -1, plain = false;
  for (let index = game.lo; index < rows.length; index++) {
    const ledge = rows[index], screen = ledge.y - game.cam;
    if (screen > H - 50) break;
    if (ledge.row < game.deepest || ledge.gone || ledge.floor || screen < H * 0.3 || !(safeCentre(ledge) >= 0)) continue;
    const easy = !ledge.crack && !ledge.round && !ledge.wet && ledge.tilt === 0;
    if (home < 0 || (easy && !plain) || (easy === plain && Math.abs(ledge.y - mid) < Math.abs(rows[home].y - mid))) { home = index; plain = easy; }
  }
  if (home < 0) {
    for (let index = game.lo; index < rows.length; index++) {
      const ledge = rows[index];
      if (ledge.row >= game.deepest && !ledge.gone && ledge.y - game.cam > TOP + 2 * R + 40 && safeCentre(ledge) >= 0) { home = index; break; }
    }
  }
  if (home < 0) home = Math.max(0, rows.length - 2);
  const ledge = rows[home], centre = safeCentre(ledge);
  game.on = home;
  game.x = centre >= 0 ? centre : (ledge.x0 + ledge.x1) / 2;
  game.y = surfaceY(ledge, game.x) - R;
  if (ledge.crack) ledge.crackT = -1;
  game.wait = RESPAWN;
}

/** A row reached for the first time: the stairs take its speed; the landing ends the floor. */
function reach(game: Game, ledge: Ledge) {
  if (ledge.row <= game.deepest) return;
  if (ledge.speed > game.speed) game.events |= SURGED;
  game.deepest = ledge.row;
  game.speed = ledge.speed;
  if (ledge.floor) { game.over = 1; game.events |= WIN; }
}

/**
 * One fixed step. `dir` is -1 (left held), 0 or 1. Sets `game.events` (bit flags) for sounds and juice.
 * `bounded` false (the fairness probe) leaves out the awning and the bottom, so a drop can be timed on its own.
 */
export function stepGame(game: Game, dt: number, dir: number, bounded = true) {
  game.events = 0;
  if (game.over) return;
  if (game.wait > 0) { game.wait = Math.max(0, game.wait - dt); return; }
  game.t += dt;
  game.cam += game.speed * dt;
  if (game.squash > 0) game.squash = Math.max(0, game.squash - dt * 5);
  const rows = game.rows, instant = game.feel.instant;
  while (game.lo < rows.length - 1 && rows[game.lo].y < game.cam - 3 * GAP) game.lo++;

  // Cracked steps count down once landed on, then fall.
  const bottom = game.cam + H + GAP;
  for (let index = game.lo; index < rows.length; index++) {
    const ledge = rows[index];
    if (ledge.y > bottom) break;
    if (ledge.crackT > 0) {
      ledge.crackT -= dt;
      if (ledge.crackT <= 0) { ledge.crackT = 0; ledge.gone = true; ledge.goneAt = game.t; game.events |= CRACKED; }
    }
  }

  const before = game.x;
  if (game.on >= 0) {
    const ledge = rows[game.on];
    game.vx = instant ? dir * VX : roll(game.vx, dir, ACCEL, surfacePush(ledge, game.x), gripOf(ledge), dt);
    game.x += game.vx * dt;
    if (game.x < R) { game.x = R; game.vx = 0; } else if (game.x > W - R) { game.x = W - R; game.vx = 0; }
    game.roll += (game.x - before) / R;
    if (onPot(ledge, game.x)) { hurt(game, CACTUS); return; }
    if (!over(ledge, game.x)) {
      game.skip = ledge.gone ? -1 : game.on; game.on = -1; game.vy = 0;
      game.wind = ledge.gust * (instant ? 0 : 1);
      if (game.wind !== 0) game.events |= GUST;
    } else game.y = surfaceY(ledge, game.x) - R;
  } else {
    const fallFrom = game.y + R;
    if (instant) game.vx = dir * VX;
    else {
      game.vx = roll(game.vx, dir, AIR_ACCEL, game.wind * WIND, AIR_DRAG, dt);
    }
    game.x += game.vx * dt;
    if (game.x < R) { game.x = R; game.vx = 0; } else if (game.x > W - R) { game.x = W - R; game.vx = 0; }
    game.roll += (game.x - before) / R * 0.5;
    game.vy = Math.min(VMAX, game.vy + G * dt);
    game.y += game.vy * dt;
    const fallTo = game.y + R;
    for (let index = game.lo; index < rows.length; index++) {
      const ledge = rows[index];
      if (ledge.y - 30 > fallTo) break;
      if (index === game.skip || !over(ledge, game.x)) continue;
      const surface = surfaceY(ledge, game.x);
      if (fallFrom <= surface + 0.01 && fallTo >= surface) {
        game.on = index; game.skip = -1; game.wind = 0;
        game.impact = game.vy; game.vy = 0; game.y = surface - R;
        if (!instant) game.vx *= LANDING_GRIP;
        game.squash = Math.min(1, game.impact / VMAX + 0.15);
        game.events |= LAND;
        if (ledge.crack && ledge.crackT < 0) ledge.crackT = CRACK;
        if (onPot(ledge, game.x)) { hurt(game, CACTUS); return; }
        reach(game, ledge);
        break;
      }
    }
  }

  for (let index = game.lo; index < rows.length; index++) {
    const ledge = rows[index];
    if (ledge.y - 30 > game.y + R) break;
    if (ledge.pick < 0 || ledge.picked || ledge.gone || Math.abs(game.x - ledge.pick) > R + 6 || Math.abs(game.y - (surfaceY(ledge, ledge.pick) - 7)) > R + 7) continue;
    ledge.picked = true;
    game.picks++;
    game.streak++;
    if (game.streak > game.bestStreak) game.bestStreak = game.streak;
    game.pickX = ledge.pick; game.pickY = surfaceY(ledge, ledge.pick) - 7;
    game.events |= PICK;
    if (game.picks % REFILL === 0 && game.chances < game.most) { game.chances++; game.events |= BONUS; }
  }

  if (game.over || !bounded) return;
  // The stairs follow a marble that drops low, so a quick way down is never a fall off the bottom into rows you can't see.
  const low = game.y - game.cam - FOLLOW * H;
  if (low > 0) game.cam += low;
  const screen = game.y - R - game.cam;
  if (screen <= TOP) hurt(game, TOP_HIT);
  else if (screen > H) hurt(game, BOTTOM_HIT);
}

/** The marble's height on screen (its top edge below the awning), for the danger wash. */
export const headroom = (game: Game) => game.y - R - game.cam - TOP;
/** Steps left to the floor's landing (0 on an old link's endless stairs), for the bottom pointer. */
export const stepsLeft = (game: Game) => game.steps ? Math.max(0, game.steps - (game.deepest - game.start)) : 0;
/** Seconds before the stairs speed up (a surge row within reach below), or -1. */
export function surgeAhead(game: Game) {
  const rows = game.rows;
  for (let index = Math.max(game.lo, game.on); index < rows.length; index++) {
    const ledge = rows[index];
    if (ledge.row <= game.deepest) continue;
    if (ledge.row > game.deepest + 2) return -1;
    if (ledge.speed > game.speed) return ledge.row - game.deepest;
  }
  return -1;
}
