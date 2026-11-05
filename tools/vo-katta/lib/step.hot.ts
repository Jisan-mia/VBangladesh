// The per-step rules: runs 60 times a second on a cheap phone, so it mutates the game in place and allocates nothing.
// Input arrives as the aim (steerTo/steerBy in kite.ts) and one flag: is টান held.
import {
  ATTACK_BOOST, ATTACK_TIME, BACKOFF, CHARGE_WARN, clamp, curve, distanceToLine, DRIFT, E, EASE, edge, emit, END_TIME, FALL, FALL_TIME,
  FLY, FOLLOW_MIN, FOLLOW_T, GONE, GUST_FORCE, GUST_TIME, GUST_WARN, HAND, HIT_SCALE, HIT_STOP, HOME, LANTERN_R, LANTERNS, LF, LIFT, linesCross,
  LO, PULL, REACH, RESPONSE, RISE, RISE_TIME, SAW_MAX, SAW_SPEED, SINK, SKY, SLOW, SPEED_MIN, SPEED_T, steerTo, TANGLE_TIME, TUG_RATE,
  windAt, YANK_ADD, YANK_COST, YANK_GIFT, YANK_SAFE, YANK_WARN, launchRival,
  type Game, type Kite, type Rival,
} from "./kite";
import { MODE_INFO } from "./levels";

const TAU = Math.PI * 2;
const RIVAL_FOLLOW = 8;
const DODGE_NEAR = 125;
const DODGE_AWAY = 90;
/** Even a lazy kite dives this fast. */
const ATTACK_MIN = 95;
/** How fast the strings fray in a long প্যাঁচ (× per second). */
const FRAY = 0.15;

/** Keeps a kite inside the sky (and its velocity honest at the edge). */
function inSky(k: Kite) {
  if (k.x < SKY.left) { k.x = SKY.left; if (k.vx < 0) k.vx = 0; } else if (k.x > SKY.right) { k.x = SKY.right; if (k.vx > 0) k.vx = 0; }
  if (k.y < SKY.top) { k.y = SKY.top; if (k.vy < 0) k.vy = 0; } else if (k.y > SKY.bottom) { k.y = SKY.bottom; if (k.vy > 0) k.vy = 0; }
}

/** Keeps a hooked kite within reach of the hook. */
function leash(game: Game, k: Kite) {
  const dx = k.x - game.hookX, dy = k.y - game.hookY, d = Math.hypot(dx, dy);
  if (d <= game.reach) return;
  k.x = game.hookX + (dx * game.reach) / d;
  k.y = game.hookY + (dy * game.reach) / d;
}

function fall(k: Kite, dt: number, wind: number) {
  k.vx += (wind * 1.4 - k.vx) * 0.8 * dt;
  k.vy = Math.min(k.vy + 36 * dt, 48);
  k.x += k.vx * dt;
  k.y += k.vy * dt;
  k.spin += 2.6 * dt;
  k.timer -= dt;
}

/** A fresh kite climbs from the hand to its home with an ease-out. True once it is up and flying. */
function rise(k: Kite, tx: number, ty: number, dt: number) {
  k.timer -= dt;
  const p = 1 - Math.max(0, k.timer) / RISE_TIME, e = 1 - (1 - p) * (1 - p);
  k.x = k.hx + (tx - k.hx) * e;
  k.y = k.hy + (ty - k.hy) * e;
  if (k.timer > 0) return false;
  k.state = FLY; k.vx = k.vy = 0;
  return true;
}

function cutLoose(k: Kite, fromX: number, wind: number) {
  k.state = FALL; k.timer = FALL_TIME; k.spin = 0;
  k.vx = wind * 1.2 + (k.x >= fromX ? 30 : -30);
  k.vy = -16;
}

/* ---------- your kite ---------- */

/** Tension follows your hand; the kite heads for the aim as hard as the string is taut, and the wind has the rest. */
function moveYou(game: Game, pull: boolean, dt: number) {
  const you = game.you;
  if (you.state === FALL) {
    fall(you, dt, game.wind);
    if (you.timer <= 0 && game.kites > 0) {
      you.state = RISE; you.timer = RISE_TIME; you.x = HAND.x; you.y = HAND.y; you.t = 0.3; you.spin = 0; you.vx = you.vy = 0;
      steerTo(game, HOME.x, HOME.y);
      emit(game, E.RISE, HAND.x, HAND.y);
    }
    return;
  }
  if (you.state === RISE) { rise(you, HOME.x, HOME.y, dt); return; }
  if (you.state !== FLY) return;
  if (game.tangle > 0) { game.tangle -= dt; pull = false; }
  game.pulling = pull;
  you.t = clamp(you.t + (pull ? PULL : -EASE) * dt, 0, 1);
  const t = you.t, slack = 1 - t, follow = FOLLOW_MIN + FOLLOW_T * t;
  let wantX = (game.aimX - you.x) * follow + game.wind * (1.15 - t) * DRIFT;
  let wantY = (game.aimY - you.y) * follow + SINK * slack * slack - LIFT * t;
  const speed = Math.hypot(wantX, wantY), top = SPEED_MIN + SPEED_T * t;
  if (speed > top) { wantX *= top / speed; wantY *= top / speed; }
  if (game.gustLeft > 0) wantX += game.gustSide * GUST_FORCE * 0.35;
  const k = Math.min(1, RESPONSE * dt);
  you.vx += (wantX - you.vx) * k;
  you.vy += (wantY - you.vy) * k;
  if (game.gustLeft > 0) you.vx += game.gustSide * GUST_FORCE * dt;
  you.x += you.vx * dt;
  you.y += you.vy * dt;
  inSky(you);
  if (game.hooked >= 0) leash(game, you);
}

/* ---------- the rivals ---------- */

/** Aims a dive across your string, a little past it, so the rival's own string hooks yours. */
function aimAttack(game: Game, r: Rival) {
  const you = game.you;
  const px = you.hx + (you.x - you.hx) * 0.6, py = you.hy + (you.y - you.hy) * 0.6;
  const lx = you.x - you.hx, ly = you.y - you.hy, length = Math.hypot(lx, ly) || 1;
  const side = Math.sign(lx * (r.y - you.hy) - ly * (r.x - you.hx)) || 1;
  r.ax = clamp(px - (side * -ly / length) * 48, SKY.left, SKY.right);
  r.ay = clamp(py - (side * lx / length) * 48, SKY.top, SKY.bottom);
}

/** Moves a flying rival toward a point: quick when far, gentle when close, never faster than `speed`. */
function flyTo(game: Game, r: Rival, gx: number, gy: number, speed: number, dt: number) {
  const dx = gx - r.x, dy = gy - r.y, d = Math.hypot(dx, dy);
  const move = Math.min(d, d * RIVAL_FOLLOW * dt, speed * dt);
  const px = r.x, py = r.y;
  if (d > 0) { r.x += (dx / d) * move; r.y += (dy / d) * move; }
  inSky(r);
  if (game.hooked === r.slot) leash(game, r);
  r.vx = (r.x - px) / dt;
  r.vy = (r.y - py) / dt;
}

function moveRival(game: Game, r: Rival, dt: number, slow: boolean) {
  if (r.state === GONE) return;
  if (r.state === FALL) {
    fall(r, dt, game.wind);
    if (r.timer > 0) return;
    r.state = GONE;
    // The next rival on the list rises into the freed slot.
    if (game.next < game.def.roster.length) { launchRival(game, r.slot, game.next++, true); emit(game, E.SPAWN, r.hx, r.hy, r.slot); }
    return;
  }
  if (r.state === RISE) {
    if (rise(r, r.homeX, r.homeY, dt)) { r.age = 0; r.chargeIn = r.def.charge ? 1.2 + r.def.charge * 0.45 : 0; }
    return;
  }
  const def = r.def, info = MODE_INFO[game.mode], you = game.you, hooked = game.hooked === r.slot;
  r.age += dt;
  r.t = clamp(def.mid + def.amp * Math.sin((TAU * r.age) / def.period + r.phase), 0, 1);
  if (r.yankLeft > 0) { r.yankLeft -= dt; r.t = 1; }
  let gx = r.homeX + def.wanderX * Math.sin(r.age * 0.55 + r.w1) + game.wind * 1.5;
  let gy = r.homeY + def.wanderY * Math.sin(r.age * 0.8 + r.w2);
  if (game.gustLeft > 0) gx += game.gustSide * 40;
  let speed = def.speed;
  if (r.backoff > 0) {
    r.backoff -= dt;
    speed *= 1.3;
  } else if (!hooked && game.hooked < 0 && game.phase === "fly" && you.state === FLY) {
    if (r.attackLeft > 0) {
      // The dive follows your string as it moves.
      r.attackLeft -= dt;
      aimAttack(game, r);
      gx = r.ax; gy = r.ay; speed = Math.max(speed * ATTACK_BOOST, ATTACK_MIN);
    } else if (r.chargeWarn > 0) {
      // The tell: a shimmy in place before the dive.
      r.chargeWarn -= dt;
      gx = r.x + (slow ? 0 : 7 * Math.sin(r.age * 40)); gy = r.y;
      if (r.chargeWarn <= 0) { aimAttack(game, r); r.attackLeft = ATTACK_TIME; }
    } else if (def.charge > 0) {
      r.chargeIn -= dt;
      if (r.chargeIn <= 0) {
        r.chargeWarn = CHARGE_WARN * info.warn;
        r.chargeIn = def.charge * (0.85 + 0.3 * game.rng());
        emit(game, E.CHARGE, r.x, r.y, r.slot);
      }
    }
    if (def.dodge && r.attackLeft <= 0) {
      const dx = r.x - you.x, dy = r.y - you.y, d = Math.hypot(dx, dy);
      if (d < DODGE_NEAR && d > 0) { gx = r.x + (dx / d) * DODGE_AWAY; gy = r.y + (dy / d) * DODGE_AWAY * 0.6; speed *= 1.25; r.fleeing += dt; }
      else r.fleeing = 0;
    }
  } else if (hooked && def.yank > 0) {
    if (r.yankWarn > 0) {
      r.yankWarn -= dt;
      if (r.yankWarn <= 0) yank(game, r);
    } else {
      r.yankIn -= dt;
      if (r.yankIn <= 0) { r.yankWarn = YANK_WARN * info.warn; emit(game, E.YANK_WARN, r.x, r.y, r.slot); }
    }
  }
  flyTo(game, r, gx, gy, speed, dt);
}

/** The yank lands: your tension jumps. Already tight, and your string pays for it; given ঢিল, it comes to nothing. */
function yank(game: Game, r: Rival) {
  const you = game.you, before = you.t;
  you.t = Math.min(1, you.t + YANK_ADD);
  r.yankLeft = 0.3;
  r.yankIn = r.def.yank * (0.8 + 0.4 * game.rng());
  if (before > YANK_SAFE) { game.tug -= YANK_COST; game.yankHits++; emit(game, E.YANK_HIT, game.hookX, game.hookY); }
  else { game.tug += YANK_GIFT; game.yanks++; emit(game, E.YANK_OK, game.hookX, game.hookY); }
}

/* ---------- the প্যাঁচ ---------- */

function unhook(game: Game) {
  const r = game.hooked >= 0 ? game.rivals[game.hooked] : null;
  if (r) { r.yankWarn = 0; r.yankLeft = 0; }
  game.hooked = -1;
  game.tug = 0;
  game.tugTime = 0;
}

function tug(game: Game, dt: number, slow: boolean) {
  const you = game.you, r = game.rivals[game.hooked], info = MODE_INFO[game.mode];
  const saw = you.t >= LO && game.tangle <= 0 ? Math.min(SAW_MAX, Math.hypot(you.vx, you.vy) / SAW_SPEED) : 0;
  const theirs = edge(r.t) * r.def.strength * game.def.pull * info.strength;
  // Both strings fray as a প্যাঁচ drags on, so the one ahead pulls away and no fight lasts for ever.
  game.tug += (edge(game.tangle > 0 ? 0 : you.t) + saw - theirs) * TUG_RATE * (1 + game.tugTime * FRAY) * dt;
  game.tugTime += dt;
  game.hookX = clamp(game.hookX + game.wind * 0.25 * dt, SKY.left, SKY.right);
  if (game.tug >= 1) {
    const time = game.tugTime, x = game.hookX, y = game.hookY;
    if (time < game.fastest) game.fastest = time;
    unhook(game);
    if (r.notches > 1) {
      // A champion's string holds: it loses a notch, breaks away and comes again.
      r.notches--;
      r.backoff = BACKOFF;
      r.chargeIn = Math.max(r.chargeIn, 1.4);
      emit(game, E.NOTCH, x, y, r.slot);
      return;
    }
    r.notches = 0;
    game.cuts++;
    game.streak++;
    if (game.streak > game.bestStreak) game.bestStreak = game.streak;
    cutLoose(r, x, game.wind);
    if (!slow) game.slowmo = HIT_STOP;
    emit(game, E.CUT, x, y, r.slot);
    if (game.cuts >= game.def.roster.length) { game.phase = "end"; game.won = true; game.endLeft = END_TIME; }
  } else if (game.tug <= -1) {
    const x = game.hookX, y = game.hookY;
    unhook(game);
    game.lost++;
    game.kites--;
    game.streak = 0;
    cutLoose(you, x, game.wind);
    // The winners back off for a moment before coming again.
    for (let i = 0; i < 2; i++) { const other = game.rivals[i]; other.attackLeft = 0; other.chargeWarn = 0; other.backoff = BACKOFF; }
    emit(game, E.LOST, x, y, r.slot);
    if (game.kites <= 0) { game.phase = "end"; game.won = false; game.endLeft = END_TIME; }
  }
}

function tryHook(game: Game) {
  const you = game.you;
  if (you.state !== FLY) return;
  for (let i = 0; i < 2; i++) {
    const r = game.rivals[i];
    if (r.state !== FLY || r.backoff > 0 || !linesCross(you.line, r.line, game.at)) continue;
    game.hooked = i;
    game.hookX = game.at[0];
    game.hookY = game.at[1];
    game.reach = Math.max(REACH, Math.hypot(you.x - game.hookX, you.y - game.hookY), Math.hypot(r.x - game.hookX, r.y - game.hookY));
    game.tug = 0;
    game.tugTime = 0;
    r.attackLeft = 0; r.chargeWarn = 0;
    r.yankIn = r.def.yank ? 1 + 0.8 * game.rng() : 0;
    // The other rival waits its turn.
    const other = game.rivals[1 - i];
    other.attackLeft = 0; other.chargeWarn = 0;
    emit(game, E.HOOK, game.hookX, game.hookY, i);
    return;
  }
}

/* ---------- weather ---------- */

function gusts(game: Game, dt: number, warn: number) {
  if (game.gustLeft > 0) {
    game.gustLeft -= dt;
    if (game.gustLeft <= 0) { game.gusts++; game.gustIn = 4.5 + game.rng() * 3; emit(game, E.GUST, 0, 0); }
  } else if (game.gustWarn > 0) {
    game.gustWarn -= dt;
    if (game.gustWarn <= 0) {
      game.gustLeft = GUST_TIME;
      const you = game.you;
      if (you.state === FLY) you.t = Math.min(1, you.t + 0.25);
    }
  } else {
    game.gustIn -= dt;
    if (game.gustIn <= 0) { game.gustWarn = GUST_WARN * warn; game.gustSide = game.rng() < 0.5 ? -1 : 1; emit(game, E.GUST_WARN, game.gustSide, 0); }
  }
}

function lanterns(game: Game, dt: number) {
  const list = game.lanterns, you = game.you;
  game.lanternIn -= dt;
  if (game.lanternIn <= 0) {
    game.lanternIn = 4.5 + game.rng() * 2.5;
    for (let i = 0; i < LANTERNS; i++) {
      const at = i * LF;
      if (list[at + 4] !== 0) continue;
      list[at] = 70 + game.rng() * 220; list[at + 1] = 440; list[at + 2] = 0; list[at + 3] = -(15 + game.rng() * 9); list[at + 4] = 1;
      break;
    }
  }
  game.nearLantern = -1;
  let nearest = 34;
  for (let i = 0; i < LANTERNS; i++) {
    const at = i * LF;
    if (list[at + 4] === 0) continue;
    list[at] += game.wind * 0.55 * dt;
    list[at + 1] += list[at + 3] * dt;
    if (list[at + 1] < 18) { list[at + 4] = 0; continue; }
    if (list[at + 4] !== 1 || you.state !== FLY) continue;
    const d = distanceToLine(you.line, list[at], list[at + 1]);
    if (d < LANTERN_R) {
      list[at + 4] = 2;
      game.tangle = TANGLE_TIME;
      game.tangles++;
      emit(game, E.TANGLE, list[at], list[at + 1]);
    } else if (d < nearest) { nearest = d; game.nearLantern = i; }
  }
}

/* ---------- one step ---------- */

/**
 * Advances the game by dt seconds with টান held or not. Slow mode plays the same game at SLOW speed with calmer wind.
 * The clock starts with the first টান; events for sound and juice are left in game.ev.
 */
export function stepGame(game: Game, pull: boolean, dt: number, slow = false) {
  if (game.phase === "over") return;
  if (slow) dt *= SLOW;
  if (game.slowmo > 0) { game.slowmo -= dt; dt *= HIT_SCALE; }
  if (game.phase === "ready" && pull) { game.phase = "fly"; emit(game, E.START, game.you.x, game.you.y); }
  const info = MODE_INFO[game.mode], def = game.def;
  game.total += dt;
  if (game.phase === "fly") game.time += dt;
  game.wind = windAt(game, game.total, slow);
  if (game.phase === "fly" && def.gusts) gusts(game, dt, info.warn);
  moveYou(game, pull && game.phase !== "end", dt);
  moveRival(game, game.rivals[0], dt, slow);
  moveRival(game, game.rivals[1], dt, slow);
  curve(game.you, game.wind, game.you.line);
  for (let i = 0; i < 2; i++) { const r = game.rivals[i]; if (r.state !== GONE) curve(r, game.wind, r.line); }
  if (def.lanterns && game.phase !== "ready") lanterns(game, dt);
  if (game.phase === "end") {
    game.endLeft -= dt;
    if (game.endLeft <= 0) { game.phase = "over"; emit(game, game.won ? E.WIN : E.FAIL, 0, 0); }
    return;
  }
  if (game.phase !== "fly") return;
  if (game.hooked >= 0) tug(game, dt, slow);
  else tryHook(game);
}
