// The per-step rules: runs 60 times a second on a cheap phone, so it mutates the game in place and allocates nothing.
import { angDiff, CELEBRATE, chooseHint, DRAIN, GUST_PUSH, GUST_WARN, isFinaleChannel, MODE_INFO, needFor, WIND_SPEED, WOBBLE_C, WOBBLE_K, wrap, type Game, type Hint } from "./antenna";

const HINT_TICK = 0.3;
const HINT_MIN = 0.8;

function say(game: Game, hint: Hint) {
  game.hint = hint;
  game.hintAge = 0;
}

/** The antenna follows the dial: at once on a firm pole, on a damped spring on a loose one. */
function follow(game: Game, dt: number) {
  if (!game.def.wobble) { game.angle = game.dial; return; }
  const pull = angDiff(game.dial, game.angle);
  game.spin += (WOBBLE_K * pull - WOBBLE_C * game.spin) * dt;
  game.angle = wrap(game.angle + game.spin * dt);
}

/** A gust: a quiet spell, a warning (the edge arrow), then a shove of the pole to one side. */
function gust(game: Game, dt: number) {
  if (game.gustLeft > 0) {
    const push = Math.min(game.gustLeft, game.gustRate * dt);
    game.gustLeft -= push;
    game.dial = wrap(game.dial + game.gustSide * push);
    if (game.gustLeft <= 0) { game.gusts++; game.gustIn = 3.5 + game.rng() * 2.5; }
  } else if (game.gustWarn > 0) {
    game.gustWarn -= dt;
    if (game.gustWarn <= 0) {
      game.gustLeft = (18 + game.rng() * 12) * MODE_INFO[game.mode].wind;
      game.gustRate = game.gustLeft / GUST_PUSH;
    }
  } else {
    game.gustIn -= dt;
    if (game.gustIn <= 0) { game.gustWarn = GUST_WARN; game.gustSide = game.rng() < 0.5 ? -1 : 1; }
  }
}

function nextChannel(game: Game) {
  game.index++;
  game.phase = "search";
  game.roundTime = 0; game.dwell = 0; game.held = false; game.approach = 0; game.hintTick = 0; game.edge = 0;
  game.need = needFor(game.def, game.index, game.mode);
  game.lastDist = Math.abs(angDiff(game.rounds[game.index].sweet, game.angle));
  say(game, "next");
}

/**
 * Advances the game by dt seconds after turning the dial by `turn` degrees (positive = right).
 * The clock runs only while searching; the first turn starts it.
 */
export function stepGame(game: Game, turn: number, dt: number, celebrateFor = CELEBRATE) {
  if (game.phase === "over") return;
  if (turn !== 0) {
    game.dial = wrap(game.dial + turn);
    game.still = 0;
    if (game.phase === "ready") game.phase = "search";
  } else game.still += dt;
  if (game.phase === "search" && game.def.gusts) gust(game, dt);
  follow(game, dt);
  if (game.phase === "ready") return;
  if (game.phase === "got") {
    game.celebrate -= dt;
    if (game.celebrate > 0) return;
    if (game.index === game.rounds.length - 1) { game.phase = "over"; say(game, "done"); return; }
    nextChannel(game);
    return;
  }
  game.time += dt;
  game.roundTime += dt;
  game.hintAge += dt;
  game.hintTick += dt;
  const round = game.rounds[game.index], quiet = game.def.quiet;
  if (round.wind) round.sweet = wrap(round.wind.home + round.wind.amp * Math.sin(game.roundTime * WIND_SPEED + round.wind.phase));
  const toward = angDiff(round.sweet, game.angle);
  const d = Math.abs(toward);
  game.approach += game.lastDist - d;
  game.lastDist = d;
  if (d <= round.half) {
    game.dwell += dt;
    game.held = true;
    game.edge = d > round.half * 0.65 ? 1 : 0;
    if (game.dwell >= game.need) {
      game.phase = "got"; game.celebrate = celebrateFor; game.edge = 0;
      game.splits[game.index] = game.roundTime;
      game.gustWarn = 0; game.gustLeft = 0; game.gustIn = 1.2 + game.rng() * 1.5;
      say(game, "got");
    } else if (!quiet && game.hint !== "hold") say(game, "hold");
    return;
  }
  game.edge = 0;
  // A finale's meter drains slowly; any other channel starts its hold again.
  game.dwell = isFinaleChannel(game.def, game.index) ? Math.max(0, game.dwell - DRAIN * dt) : 0;
  if (game.held) {
    game.held = false;
    game.slips++;
    if (!quiet) { say(game, toward > 0 ? "slip-right" : "slip-left"); return; }
  }
  if (game.hintTick < HINT_TICK) return;
  const approach = game.approach;
  game.approach = 0;
  game.hintTick = 0;
  if (game.hintAge < HINT_MIN) return;
  const next = chooseHint(round, game.angle, game.roundTime, approach, game.still, MODE_INFO[game.mode].assist, quiet);
  if (next !== game.hint) say(game, next);
}
