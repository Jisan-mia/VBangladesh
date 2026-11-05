// The ride, one fixed step at a time. Mutates the game in place and allocates nothing: it runs 60 times a second on
// cheap phones. The caller slows time for ধীরে খেলো; the road itself never depends on the real speed.
import {
  laneX, BIKE_LEN, BIKE_W, DELIVER_AFTER, DELIVER_BEFORE, DOG_BACK, DOG_V, GUST_T, GUST_WARN, LANE_W, LANES, LETTER, MUD_T, NEAR_T,
  RECOVER_T, SPEC, SWITCH_T, UNIT, VAN, WALK_COW, WALK_GOAT, WALK_T, DOG,
} from "./geometry";
import { speedAt } from "./course";
import { pointsOf, AHEAD, DELIVERED, DORMANT, EV, EVENT_RING, GONE, HIT, MISSED, PASSED, RUNNING, TAKEN, WAITING, type Game, type Piece } from "./game";

/** Pieces further ahead than this aren't looked at yet (a van sets off VAN_TRIG ahead). */
const SCAN = 720;
/** Pieces this far behind the back wheel are forgotten. */
const BEHIND = 260;

function emit(game: Game, kind: number, x: number, y: number, n: number) {
  const slot = game.eventCount++ % EVENT_RING;
  game.evKind[slot] = kind; game.evX[slot] = x; game.evY[slot] = y; game.evN[slot] = n;
}

/** Does the bike overlap something `w` wide at `x` sideways right now? */
const across = (game: Game, x: number, w: number) => Math.abs(game.x - x) < (BIKE_W + w) / 2;

function notch(game: Game, at: number, good: boolean) {
  if (at < 0 || game.boss[at]) return;
  game.boss[at] = good ? 1 : 2;
  game.bossDone++;
  emit(game, EV.notch, at, 0, good ? 1 : 0);
}

function bump(game: Game, kind: number, x: number, y: number) {
  game.bumps++;
  game.streak = 0;
  const lostOne = game.bag > 0 ? 1 : 0;
  if (lostOne) { game.bag--; game.lost++; }
  emit(game, EV.bump, x, y, kind * 2 + lostOne);
  if (game.bumps >= game.limit) {
    game.over = 1; game.wrecked = 1; game.hitKind = kind;
    emit(game, EV.wreck, x, y, kind);
  } else game.recover = RECOVER_T;
}

function hitPiece(game: Game, piece: Piece) {
  piece.state = HIT; piece.close = 0;
  if (piece.bossAt >= 0) notch(game, piece.bossAt, false);
  bump(game, piece.kind, piece.x, piece.y);
}

export function stepGame(game: Game, dt: number) {
  if (game.over) return;
  const course = game.course;
  game.t += dt;

  // ---- speed: the route's ramp, halved after a bump and climbing back ----
  if (game.recover > 0) game.recover = Math.max(0, game.recover - dt);
  game.v = speedAt(course.spec, course.end, game.d) * (1 - 0.5 * (game.recover / RECOVER_T));
  game.d += game.v * dt;
  const front = game.d, back = game.d - BIKE_LEN;

  // ---- mud ----
  const mud = course.mud;
  while (game.mudNext < mud.length && mud[game.mudNext].y1 < back) game.mudNext++;
  const inMud = game.mudNext < mud.length && mud[game.mudNext].y0 <= front ? 1 : 0;
  if (inMud && !game.inMud) emit(game, EV.mud, game.x, front, 0);
  game.inMud = inMud;

  // ---- gusts: arrows a second ahead, then a shove one lane (two in the storm) ----
  for (let index = 0; index < course.gusts.length; index++) {
    const gust = course.gusts[index], state = game.gustState[index];
    if (state >= 2) continue;
    if (state === 0 && front >= gust.y - GUST_WARN * game.v) { game.gustState[index] = 1; emit(game, EV.gustWarn, gust.dir, gust.y, gust.lanes); }
    if (front >= gust.y) {
      game.gustState[index] = 2;
      const target = Math.max(0, Math.min(LANES - 1, game.lane + gust.dir * gust.lanes));
      game.push = GUST_T * Math.max(1, Math.abs(target - game.lane));
      game.lane = target;
      emit(game, EV.gust, gust.dir, gust.y, gust.lanes);
      notch(game, game.gustBoss[index], true);
    }
  }

  // ---- sideways: the bike slides to its lane (slower in mud, a gust shoves fast) ----
  const target = laneX(game.lane);
  const speed = game.push > 0 ? LANE_W / GUST_T : LANE_W / (inMud ? MUD_T : SWITCH_T);
  if (game.push > 0) game.push = Math.max(0, game.push - dt);
  const move = speed * dt;
  game.x = Math.abs(target - game.x) <= move ? target : game.x + Math.sign(target - game.x) * move;

  // ---- things on the road ----
  const pieces = game.pieces, near = game.v * NEAR_T;
  for (let index = game.first; index < pieces.length; index++) {
    const piece = pieces[index];
    if (piece.y0 > front + SCAN) break;
    if (piece.state !== AHEAD) continue;
    // A van rolls towards you once you are close; a crossing goat or cow walks into the next lane.
    if (piece.kind === VAN) {
      if (!piece.moving && front >= piece.y0 - piece.trigger) { piece.moving = 1; emit(game, EV.van, piece.x, piece.y, piece.lane); }
      if (piece.moving) piece.y -= piece.vy * dt;
    } else if (piece.kind === WALK_GOAT || piece.kind === WALK_COW) {
      if (!piece.moving && front >= piece.y0 - piece.trigger) { piece.moving = 1; emit(game, EV.walk, piece.x, piece.y, piece.to - piece.lane); }
      if (piece.moving) {
        const goal = laneX(piece.to), step = (LANE_W / WALK_T) * dt;
        piece.x = Math.abs(goal - piece.x) <= step ? goal : piece.x + Math.sign(goal - piece.x) * step;
      }
    }
    if (piece.y > front + near + (piece.moving && piece.kind === VAN ? piece.vy * NEAR_T : 0)) continue;
    const side = across(game, piece.x, piece.w);
    if (piece.y + piece.len < back) {
      piece.state = PASSED;
      if (piece.kind === LETTER) continue;
      if (piece.close) { game.bells++; emit(game, EV.bell, game.x, piece.y + piece.len, game.bells); }
      if (piece.bossAt >= 0) notch(game, piece.bossAt, true);
      continue;
    }
    if (piece.y > front) { if (side && piece.kind !== LETTER) piece.close = 1; continue; }
    if (!side) continue;
    if (piece.kind === LETTER) {
      piece.state = TAKEN; game.bag++; game.picked++;
      emit(game, EV.pick, piece.x, piece.y, game.picked);
      continue;
    }
    hitPiece(game, piece);
    if (game.over) return;
  }
  // Forget what has rolled well past the back wheel (the scene still draws the last of it).
  while (game.first < pieces.length) {
    const piece = pieces[game.first];
    if (piece.state === AHEAD || piece.y + piece.len >= back - BEHIND) break;
    game.first++;
  }

  // ---- dogs: bark behind you, run up your lane faster than the bike ----
  const dogs = course.dogs, dogLen = SPEC[DOG].len, dogW = SPEC[DOG].w;
  for (let index = 0; index < dogs.length; index++) {
    const state = game.dogState[index];
    if (state === GONE) continue;
    if (state === DORMANT) {
      if (front < dogs[index].at) continue;
      game.dogState[index] = RUNNING;
      game.dogX[index] = laneX(game.lane);
      game.dogY[index] = back - DOG_BACK - dogLen;
      emit(game, EV.dog, game.dogX[index], game.dogY[index], game.lane);
      continue;
    }
    game.dogY[index] += (game.v + DOG_V) * dt;
    const y = game.dogY[index];
    if (y > front + 900) { game.dogState[index] = GONE; continue; }
    if (y + dogLen >= back && y <= front && across(game, game.dogX[index], dogW)) {
      game.dogState[index] = GONE;
      bump(game, DOG, game.dogX[index], y);
      if (game.over) return;
    }
  }

  // ---- gates: ride the lane beside one as you pass it and the letter goes over ----
  const houses = course.houses;
  for (let index = game.houseNext; index < houses.length; index++) {
    const house = houses[index];
    if (house.y - DELIVER_BEFORE > front) break;
    if (game.houseState[index] !== WAITING) { if (index === game.houseNext) game.houseNext++; continue; }
    const lane = house.side ? LANES - 1 : 0;
    const beside = Math.abs(game.x - laneX(lane)) < LANE_W * 0.4;
    if (beside && game.bag > 0) {
      game.houseState[index] = DELIVERED;
      game.bag--; game.delivered++; game.streak++;
      if (game.streak > game.bestStreak) game.bestStreak = game.streak;
      emit(game, EV.deliver, index, house.y, game.streak);
      notch(game, game.houseBoss[index], true);
    } else if (front > house.y + DELIVER_AFTER) {
      game.houseState[index] = MISSED;
      game.streak = 0;
      emit(game, EV.miss, index, house.y, game.bag > 0 ? 1 : 0);
      notch(game, game.houseBoss[index], false);
    }
  }

  // ---- the place ----
  game.meters = Math.floor(Math.min(front, course.end) / UNIT);
  if (front >= course.end) {
    game.finished = 1; game.over = 1;
    emit(game, EV.finish, game.x, course.end, game.delivered);
  }
  game.score = pointsOf(game.meters, game.delivered, game.picked, game.bells);
}
