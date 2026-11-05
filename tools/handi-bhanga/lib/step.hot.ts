// One fixed step of the stall, the throw, the aim and its preview. Runs 60 times a second: no allocation here (no literals,
// closures or strings); everything lives in the Game that rules.ts createGame made. The ball moves in substeps of at most
// half its radius, one axis at a time, so even a fast ball never slips through a pot.
import { BALL_POINTS, BOSS_POINTS, MODE_INFO, potPoints } from "./levels";
import {
  AIM_SPEED, BALL_R, BLAST, bounceAngle, clampAim, E_BLAST, E_BOSS_BREAK, E_BOSS_HIT, E_BREAK, E_CATCH, E_CLEAR, E_CRACK, E_KNOT,
  E_LASTCALL, E_LOST, E_OUT, E_OVER, E_STICK, E_THROW, E_WALL, END_TIME, H, K_BAMBOO, K_BOSS, K_CRACKER, K_TOUGH, MAX_ANGLE,
  MIN_REST, potLeftAt, SHORT_TRACE, SLOW, speedOf, STICK_H, STICK_SPEED, STICK_Y, directAim, TRACE_MAX, W, WALL, windAt, createGame,
  type Game,
} from "./rules";
import type { Guide, Run } from "./levels";

const STEEP = Math.cos(MAX_ANGLE), FLAT = Math.sin(MAX_ANGLE);
/** The preview's dots sit this far apart along the path. */
const DOT_GAP = 13;
const STEP = 1 / 60;
/** Seconds of flight without a pot or the লাঠি before the awning tips the ball sideways. */
const IDLE = 6;
/** Seconds of rally without hurting a pot before the লাঠি starts to tilt the return. */
const DRY = 9;

/** Pot `i` overlaps a ball at (x, y) at `clock`. */
function overlaps(game: Game, i: number, x: number, y: number, clock: number) {
  const left = potLeftAt(game, i, clock), top = game.py[i];
  const nx = Math.max(left, Math.min(left + game.pw[i], x)) - x;
  const ny = Math.max(top, Math.min(top + game.ph[i], y)) - y;
  return nx * nx + ny * ny < BALL_R * BALL_R;
}

/** The first live pot a ball at (x, y) touches, or -1. */
function touching(game: Game, x: number, y: number, clock: number) {
  for (let i = 0; i < game.n; i++) if (game.hits[i] > 0 && overlaps(game, i, x, y, clock)) return i;
  return -1;
}

function note(game: Game, i: number) {
  if (game.hitN < game.hitList.length) game.hitList[game.hitN++] = i;
}

function endWith(game: Game, end: "clear" | "out") {
  game.phase = "end";
  game.end = end;
  game.timer = 0;
  game.events |= end === "clear" ? E_CLEAR : E_OUT;
}

function breakPot(game: Game, i: number) {
  const kind = game.kinds[i];
  game.hits[i] = 0;
  game.broken++;
  game.flight++;
  if (game.flight > game.bestFlight) game.bestFlight = game.flight;
  game.score += game.def.old ? 10 : kind === K_BOSS ? BOSS_POINTS : potPoints(game.flight);
  const r = game.rope[i];
  if (--game.ropeLeft[r] === 0) game.ropesCleared++;
  note(game, i);
  game.events |= kind === K_BOSS ? E_BOSS_BREAK | E_BREAK : E_BREAK;
  if (kind === K_CRACKER) blast(game, i);
  const remaining = game.total - game.broken;
  if (!game.catching && !game.def.old && remaining > 0 && remaining <= game.def.catchAt) { game.catching = true; game.events |= E_LASTCALL; }
  if (remaining === 0 && game.phase !== "end") {
    game.score += game.balls * BALL_POINTS;
    endWith(game, "clear");
  }
}

/** One hit on pot `i`: a knot only knocks, a thick pot or the মটকা cracks, everything else breaks. */
function damage(game: Game, i: number) {
  const kind = game.kinds[i];
  if (kind === K_BAMBOO) { game.events |= E_KNOT; return; }
  game.idle = 0;
  game.dry = 0;
  if (kind === K_BOSS || kind === K_TOUGH) {
    if (--game.hits[i] > 0) { note(game, i); game.events |= kind === K_BOSS ? E_BOSS_HIT : E_CRACK; return; }
  }
  breakPot(game, i);
}

/** A firecracker pot cracks every live pot near it (a cracker it reaches goes off too). */
function blast(game: Game, i: number) {
  game.events |= E_BLAST;
  const cx = potLeftAt(game, i, game.clock) + game.pw[i] / 2, cy = game.py[i] + game.ph[i] / 2;
  for (let j = 0; j < game.n; j++) {
    if (j === i || game.hits[j] <= 0 || game.kinds[j] === K_BAMBOO) continue;
    const jx = Math.max(potLeftAt(game, j, game.clock), Math.min(potLeftAt(game, j, game.clock) + game.pw[j], cx));
    const jy = Math.max(game.py[j], Math.min(game.py[j] + game.ph[j], cy));
    if ((jx - cx) * (jx - cx) + (jy - cy) * (jy - cy) < BLAST * BLAST) damage(game, j);
  }
}

/** Hits every live pot the ball now overlaps; true if it touched any. */
function hitPots(game: Game) {
  let touched = false;
  for (let i = 0; i < game.n; i++) {
    if (game.hits[i] > 0 && overlaps(game, i, game.x, game.y, game.clock)) { touched = true; damage(game, i); }
  }
  return touched;
}

/** The ball comes to rest on the লাঠি: at the start, after a catch, or a fresh ball after a miss. */
function rest(game: Game, offset: number) {
  game.phase = "aim";
  game.timer = 0;
  game.flight = 0;
  const reach = game.stickW / 2 - BALL_R;
  game.offset = Math.max(-reach, Math.min(reach, offset));
  game.x = game.stick + game.offset;
  game.y = STICK_Y - BALL_R;
  suggest(game);
}

function lose(game: Game) {
  game.balls--;
  game.lost++;
  game.flight = 0;
  game.events |= E_LOST;
  if (game.balls <= 0) { endWith(game, "out"); return; }
  rest(game, 0);
}

function substep(game: Game, distance: number) {
  const mx = game.dx * distance, px = game.x;
  game.x += mx;
  if (game.x - BALL_R < WALL) { game.x = WALL + BALL_R; game.dx = Math.abs(game.dx); game.events |= E_WALL; }
  else if (game.x + BALL_R > W - WALL) { game.x = W - WALL - BALL_R; game.dx = -Math.abs(game.dx); game.events |= E_WALL; }
  if (hitPots(game)) { game.x = px; game.dx = mx > 0 ? -Math.abs(game.dx) : Math.abs(game.dx); }
  if (game.phase !== "fly") return;

  const my = game.dy * distance, py = game.y;
  game.y += my;
  if (game.y - BALL_R < game.ceiling) {
    game.y = game.ceiling + BALL_R; game.dy = Math.abs(game.dy); game.events |= E_WALL;
    // A ball that has rattled about for a long time without touching a pot or the লাঠি leans sideways, so it can't loop for ever.
    if (game.idle > IDLE && Math.abs(game.dx) < 0.4) { game.dx = game.dx < 0 ? -0.4 : 0.4; game.dy = Math.sqrt(1 - 0.16); game.idle = 0; }
  }
  if (hitPots(game)) { game.y = py; game.dy = my > 0 ? -Math.abs(game.dy) : Math.abs(game.dy); return; }
  if (game.phase !== "fly" || my <= 0) return;
  // Forgiving: the লাঠি still takes a ball a little past its top edge, and a little past either end.
  const half = game.stickW / 2;
  if (game.y + BALL_R >= STICK_Y && py + BALL_R <= STICK_Y + STICK_H / 2 && Math.abs(game.x - game.stick) <= half + BALL_R * 0.6) {
    game.flight = 0;
    game.idle = 0;
    if (game.catching) { rest(game, game.x - game.stick); game.events |= E_CATCH; return; }
    let angle = bounceAngle(game.x, game.stick, game.stickW);
    // After a long dry rally the লাঠি tilts the return a little more each time, so no loop through the gaps can last.
    if (game.dry > DRY) angle = clampAim(angle + Math.sin(game.clock * 5.1) * Math.min(0.4, (game.dry - DRY) * 0.06));
    game.dx = Math.sin(angle);
    game.dy = -Math.cos(angle);
    game.y = STICK_Y - BALL_R;
    game.events |= E_STICK;
  } else if (game.y - BALL_R > H) lose(game);
}

/** Advances the stall by dt seconds of real time; "ধীরে খেলো" runs the ball and the clock at SLOW. */
export function stepGame(game: Game, dt: number, slow = false) {
  if (game.phase === "over") return;
  const scaled = slow ? dt * SLOW : dt;
  if (game.phase === "end") {
    game.timer += dt;
    game.clock += scaled;
    if (game.timer >= (game.end === "clear" ? END_TIME.clear : END_TIME.out)) { game.phase = "over"; game.events |= E_OVER; }
    return;
  }
  game.clock += scaled;
  game.time += dt;
  game.timer += dt;
  game.idle += dt;
  game.dry += dt;
  if (game.phase === "aim") { game.x = game.stick + game.offset; game.y = STICK_Y - BALL_R; return; }
  const wind = windAt(game, game.clock);
  if (wind) {
    // The wind bends the ball's path a little; it never flattens it past the লাঠি's own steepest angle.
    const dx = game.dx + wind * dt, length = Math.hypot(dx, game.dy);
    game.dx = dx / length; game.dy /= length;
    if (Math.abs(game.dy) < STEEP) { game.dy = Math.sign(game.dy) * STEEP; game.dx = Math.sign(game.dx) * FLAT; }
  }
  const distance = speedOf(game, slow) * dt;
  const count = Math.max(1, Math.ceil(distance / (BALL_R * 0.5)));
  for (let i = 0; i < count && game.phase === "fly"; i++) substep(game, distance / count);
}

/** Throws the resting ball along the aim. False when the ball isn't resting (or has only just come to rest). */
export function throwBall(game: Game) {
  if (game.phase !== "aim" || game.timer < MIN_REST) return false;
  game.phase = "fly";
  game.timer = 0;
  game.flight = 0;
  game.dry = 0;
  game.dx = Math.sin(game.aim);
  game.dy = -Math.cos(game.aim);
  game.throws++;
  game.events |= E_THROW;
  return true;
}

/** The লাঠি's centre, kept inside the poles; a resting ball rides on it. */
export function moveStick(game: Game, x: number) {
  if (game.phase === "over") return;
  const half = game.stickW / 2;
  game.stick = Math.max(WALL + half, Math.min(W - WALL - half, x));
  if (game.phase === "aim") game.x = game.stick + game.offset;
}
/** Held arrow keys: -1 left, 1 right. They move the লাঠি while the ball flies and turn the aim while it rests. */
export function nudge(game: Game, dir: number, dt: number) {
  if (game.phase === "aim") game.aim = clampAim(game.aim + dir * AIM_SPEED * dt);
  else if (game.phase === "fly") moveStick(game, game.stick + dir * STICK_SPEED * dt);
}
export function setAim(game: Game, aim: number) { if (game.phase === "aim") game.aim = clampAim(aim); }

/**
 * The same physics run forward from the resting ball along `aim` (walls, the awning, the sway, the wind), without breaking
 * anything. Returns the first breakable pot it would hit (-1 none). With `dots`, fills game.trace with points DOT_GAP apart:
 * "first" stops at that pot, "full" follows the ball to its next pot or back down to the লাঠি, "short" is a short arrow.
 */
function run(game: Game, aim: number, slow: boolean, guide: Guide, dots: boolean) {
  if (dots) game.traceN = 0;
  const limit = guide === "short" ? SHORT_TRACE : 2000;
  let x = game.x, y = game.y, dx = Math.sin(aim), dy = -Math.cos(aim), clock = game.clock, travelled = 0, nextDot = DOT_GAP, impacts = 0, first = -1;
  const speed = speedOf(game, slow), distance = speed * STEP, count = Math.max(1, Math.ceil(distance / (BALL_R * 0.5))), d = distance / count;
  for (let frame = 0; frame < 600; frame++) {
    const wind = windAt(game, clock);
    if (wind) {
      const wx = dx + wind * STEP, length = Math.hypot(wx, dy);
      dx = wx / length; dy /= length;
      if (Math.abs(dy) < STEEP) { dy = Math.sign(dy) * STEEP; dx = Math.sign(dx) * FLAT; }
    }
    for (let k = 0; k < count; k++) {
      const px = x, py = y;
      x += dx * d;
      if (x - BALL_R < WALL) { x = WALL + BALL_R; dx = Math.abs(dx); }
      else if (x + BALL_R > W - WALL) { x = W - WALL - BALL_R; dx = -Math.abs(dx); }
      let hit = touching(game, x, y, clock);
      if (hit >= 0) { x = px; dx = -dx; }
      else {
        y += dy * d;
        if (y - BALL_R < game.ceiling) { y = game.ceiling + BALL_R; dy = Math.abs(dy); }
        hit = touching(game, x, y, clock);
        if (hit >= 0) { y = py; dy = -dy; }
      }
      travelled += d;
      if (dots && travelled >= nextDot && game.traceN < TRACE_MAX) {
        game.trace[game.traceN * 2] = x; game.trace[game.traceN * 2 + 1] = y; game.traceN++;
        nextDot += DOT_GAP;
      }
      if (hit >= 0 && game.kinds[hit] !== K_BAMBOO) {
        impacts++;
        if (first < 0) first = hit;
        if (guide !== "full" || impacts > 1) return first;
      }
      if (travelled >= limit || (dy > 0 && y + BALL_R >= STICK_Y)) return first;
    }
    clock += slow ? STEP * SLOW : STEP;
  }
  return first;
}

/** The aim's preview for the mode: game.trace's dots and game.target, the first pot the throw would hit. */
export function traceAim(game: Game, slow: boolean) {
  game.traceN = 0;
  game.target = -1;
  if (game.phase !== "aim") return;
  const guide = game.def.old ? "first" : MODE_INFO[game.mode].guide;
  const target = run(game, game.aim, slow, guide, true);
  // The short arrow on কঠিন doesn't say what it will hit.
  game.target = guide === "short" ? -1 : target;
}

/** Sets the suggested aim: straight at the lowest pot if that path reaches a pot first, else the nearest aim that does
 *  (banking off a pole or round a knot). */
export function suggest(game: Game) {
  const start = directAim(game);
  game.aim = start;
  for (let k = 0; k <= 40; k++) {
    const aim = start + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.05;
    if (aim < -MAX_ANGLE || aim > MAX_ANGLE) continue;
    if (run(game, aim, false, "first", false) >= 0) { game.aim = aim; return; }
  }
}

/** A fresh stall with the suggested aim set (the component and the bots start here). */
export function newGame(run: Run) {
  const game = createGame(run);
  if (!game.def.old) suggest(game);
  return game;
}

/**
 * Where a falling ball will cross the লাঠি's line, folding the walls in (pots and wind ignored): what a player's eye judges.
 * NaN while the ball rises or rests.
 */
export function landingX(game: Game) {
  if (game.phase !== "fly" || game.dy <= 0) return NaN;
  const span = W - 2 * WALL - 2 * BALL_R, ahead = (STICK_Y - BALL_R - game.y) / game.dy;
  let x = game.x - WALL - BALL_R + game.dx * ahead;
  x = ((x % (2 * span)) + 2 * span) % (2 * span);
  if (x > span) x = 2 * span - x;
  return x + WALL + BALL_R;
}


/**
 * For a falling ball the লাঠি's keys can't bring under it in time: where it will land (landingX), else NaN. The component
 * shows a chevron on the floor there and glows the bottom edge on that side.
 */
export function unreachable(game: Game, slow: boolean) {
  const land = landingX(game);
  if (Number.isNaN(land) || game.y < 250) return NaN;
  const time = (STICK_Y - BALL_R - game.y) / (game.dy * speedOf(game, slow));
  return Math.abs(land - game.stick) - game.stickW / 2 > STICK_SPEED * time + 6 ? land : NaN;
}
