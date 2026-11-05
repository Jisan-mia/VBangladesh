// One fixed step of the walk. Runs 60 times a second: no allocation here (see scripts/lint-games.mjs).
import { centreAt, obstacleAt, safeOffset, slipAt, windAt, EDGE_FROM, PX_PER_M, SLIP_NONE } from "./field";
import {
  DRAG_SPEED, E_BACK, E_BIRDS, E_BLEAT, E_DONE, E_FELL, E_GUST, E_GUST_WARN, E_NEAR, E_PASS, E_SLIP, E_STEP, E_STREAK, E_WOBBLE, GRACE, GUST_WARN,
  KICK, PH_DONE, PH_FELL, PH_SLIP, PH_WALK, SLIP_TIME, SLOW_DOWN, SLOW_DOWN_RAIN, SPEED_UP, STRIDE, STREAK, TAP_SPEED, type Game,
} from "./rules";

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

/** The feet's sideways speed right now: full, less the tiredness that builds up over a tiring field. */
export function steerSpeed(game: Game) {
  const tired = game.spec.tired;
  return tired > 0 ? TAP_SPEED * (1 - tired * Math.min(1, game.d / game.field.length)) : TAP_SPEED;
}

/** The edge's outward push at `offset` from the middle, px per second (0 inside 65% of the half-width). */
export function pullAt(game: Game, offset: number) {
  const reach = (Math.abs(offset) / game.spec.half - EDGE_FROM) / (1 - EDGE_FROM);
  if (reach <= 0) return 0;
  const push = game.spec.pull * Math.min(1.3, reach) * Math.min(1.3, reach);
  return offset < 0 ? -push : push;
}

/**
 * Moves the walk on by `dt` seconds. `pace` < 1 is slow mode: the walk, the wind and the pull slow down, the feet keep their speed.
 * What happened collects as bits in `game.events`; the caller reads and clears them.
 */
export function stepGame(game: Game, dt: number, pace: number) {
  game.clock += dt;
  const field = game.field, spec = game.spec;
  if (game.phase === PH_SLIP) {
    if (game.clock - game.slipAt < SLIP_TIME) return;
    if (game.slips >= game.lives) { game.phase = PH_FELL; game.events |= E_FELL; return; }
    game.x = centreAt(field, game.d) + safeOffset(field, game.d);
    game.target = game.x;
    game.graceTo = game.d + GRACE;
    game.dryFrom = game.d;
    game.phase = PH_WALK;
    game.events |= E_BACK;
    return;
  }
  if (game.phase !== PH_WALK) return;

  game.d = Math.min(field.length, game.d + spec.speed * pace * dt);
  const centre = centreAt(field, game.d), steer = steerSpeed(game);
  const wind = windAt(field, game.d) * pace, pull = pullAt(game, game.x - centre) * pace;
  if (game.dragging) {
    game.target = clamp(game.target + (wind + pull) * dt, 4, 356);
    const most = Math.min(DRAG_SPEED, DRAG_SPEED * (steer / TAP_SPEED)) * dt;
    game.x += clamp(game.target - game.x, -most, most);
    game.vel = 0;
    game.lean += (clamp((game.target - game.x) / 18, -1, 1) - game.lean) * Math.min(1, dt / 0.05);
  } else {
    // A press answers on this very step: the feet already move, and the lean shows it.
    if (game.dir !== 0 && game.vel * game.dir < KICK) game.vel = game.dir * KICK;
    game.vel += (game.dir * steer - game.vel) * Math.min(1, dt / (game.dir !== 0 ? SPEED_UP : spec.rain ? SLOW_DOWN_RAIN : SLOW_DOWN));
    game.x += (game.vel + wind + pull) * dt;
    game.lean += (clamp(game.vel / TAP_SPEED, -1, 1) - game.lean) * Math.min(1, dt / 0.05);
  }
  game.x = clamp(game.x, 4, 356);

  while (game.d >= game.nextStep) { game.foot = game.foot ? 0 : 1; game.nextStep += STRIDE; game.events |= E_STEP; }
  while (game.nextGoat < field.obstacles.length && field.obstacles[game.nextGoat].kind !== "goat") game.nextGoat++;
  const goat = field.obstacles[game.nextGoat];
  if (goat && game.d >= goat.d - 130) { game.nextGoat++; game.events |= E_BLEAT; }
  const bok = field.decor[game.nextBok];
  if (bok && game.d >= bok.d - 60) {
    game.nextBok++;
    if (bok.kind === "bok") game.events |= E_BIRDS;
  }
  const passing = field.obstacles[game.nextPass];
  if (passing && game.d > passing.d + passing.len) {
    if (game.slipObs !== game.nextPass) { game.passed++; game.events |= E_PASS; }
    game.nextPass++;
  }

  // Gusts: the arrow lights a second ahead, the whoosh sounds as it hits, and it counts as ridden once it has passed.
  const gust = field.gusts[game.nextGust];
  if (gust) {
    if (game.gustWarn === 0 && game.d >= gust.d - GUST_WARN && game.d < gust.d) { game.gustWarn = gust.push > 0 ? 1 : -1; game.events |= E_GUST_WARN; }
    if (game.gustNow === 0 && game.d >= gust.d && game.d < gust.d + gust.len) { game.gustNow = gust.push > 0 ? 1 : -1; game.gustWarn = 0; game.events |= E_GUST; }
    if (game.d >= gust.d + gust.len) { game.nextGust++; game.gustNow = 0; game.gustWarn = 0; game.gustsRidden++; }
  }

  game.bestDry = Math.max(game.bestDry, game.d - game.dryFrom);
  if (game.d >= field.length) { game.phase = PH_DONE; game.events |= E_DONE; game.edge = 0; return; }

  if (game.d - game.dryFrom >= (game.streak + 1) * STREAK) { game.streak++; game.streakM = (game.streak * STREAK) / PX_PER_M; game.events |= E_STREAK; }

  const offset = game.x - centre;
  game.edge = clamp(offset / spec.half, -1.2, 1.2);
  const reason = game.d >= game.graceTo ? slipAt(field, game.d, offset) : SLIP_NONE;
  if (reason !== SLIP_NONE) {
    game.slips++;
    game.phase = PH_SLIP; game.slipAt = game.clock; game.slipX = game.x; game.slipReason = reason; game.streak = 0; game.close = false; game.dir = 0; game.vel = 0; game.dragging = false;
    game.slipSide = offset >= 0 ? 1 : -1;
    const o = obstacleAt(field, game.d);
    game.slipObs = o ? field.obstacles.indexOf(o) : -1;
    game.events |= E_SLIP;
    return;
  }
  // The wobble: the feet pass 80% of the ridge (the body flaps, a creak sounds); a near miss: out there, then back to the middle dry.
  const reach = Math.abs(game.edge);
  if (reach > 0.8) {
    game.close = true;
    if (!game.wobbling && game.clock - game.wobbleAt > 1.2) { game.wobbling = true; game.wobbleAt = game.clock; game.events |= E_WOBBLE; }
  } else {
    if (reach < 0.6) game.wobbling = false;
    if (reach < 0.4 && game.close) {
      game.close = false;
      if (game.clock - game.nearAt > 3) { game.nearAt = game.clock; game.nears++; game.events |= E_NEAR; }
    }
  }
}
