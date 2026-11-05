// The per-step rules: run 60 times a second on a cheap phone, so they mutate the game in place and allocate nothing.
// Input is one flag: is the balloon being held up (a finger on the lane, Space, ↑ or W).
import {
  BOSS_CROW, BX, CEIL, clearance, CROW, DIVE, DRAG, E, emit, END, END_TIME, FLY, FLYER, FLYING, gateY, GONE, GRAZE, GROUND, GUST_WARN,
  HIT, KICK, LIFT, MAX_RISE, MESH, OVER, PENDING, POP, POP_TIME, READY, respawn, SINK, SLOW, SPAWN, speedOf, STREET, touchesGate, WARN, WIRE,
  type Game,
} from "./belun";
import { MODE_INFO } from "./levels";

/** A crow that has gone past the balloon (dodged) but is still flying off the screen. */
export const PASSED = 4;
const LOOKAHEAD = 3;

function pop(g: Game, why: number) {
  g.phase = POP; g.popped = why; g.popAt = g.time;
  g.balloons--; g.lost++; g.streak = 0;
  emit(g, E.POP, BX, g.y);
}

const aimOf = (y: number) => y < CEIL + 20 ? CEIL + 20 : y > GROUND - 24 ? GROUND - 24 : y;

/** The wind's push here: each gust warns (an edge), blows (sin²), then counts as ridden. Gusts are sorted by `at`. */
function blow(g: Game, warnDist: number) {
  let wind = 0, soon = 0;
  const dist = g.dist;
  for (let i = 0; i < g.gusts.length; i++) {
    const state = g.gState[i];
    if (state === GONE) continue;
    const gust = g.gusts[i];
    if (dist < gust.at - warnDist) break;
    if (dist < gust.at) {
      if (state === PENDING) { g.gState[i] = WARN; emit(g, E.GUST_WARN, gust.strength > 0 ? 1 : -1, gust.boss ? 1 : 0); }
      soon = gust.strength > 0 ? 1 : -1;
      continue;
    }
    if (dist < gust.at + gust.length) {
      if (state !== FLYING) g.gState[i] = FLYING;
      const s = Math.sin(Math.PI * (dist - gust.at) / gust.length);
      wind += gust.strength * s * s;
      continue;
    }
    g.gState[i] = GONE;
    g.gustsRidden++;
    emit(g, E.GUST_END, 0, 0);
    if (gust.boss && g.bossLeft > 0) { g.bossLeft--; emit(g, E.BOSS, BX, g.y); }
  }
  g.wind = wind; g.gustSoon = soon;
}

/** Crows: called at their distance, a warning at the right edge, then in they fly. Divers aim at where you are as they launch. */
function fly(g: Game, dt: number) {
  const bx = g.dist + BX;
  for (let i = 0; i < g.crows.length; i++) {
    const state = g.cState[i];
    if (state === GONE) continue;
    const plan = g.crows[i];
    if (state === PENDING) {
      if (g.dist < plan.at) continue;
      g.cState[i] = WARN; g.cT[i] = plan.warn;
      g.cTy[i] = plan.kind === FLYER ? plan.y : aimOf(g.y);
      emit(g, E.CROW_WARN, plan.kind, g.cTy[i]);
      continue;
    }
    if (state === WARN) {
      if (plan.kind !== FLYER) g.cTy[i] = aimOf(g.y);
      g.cT[i] -= dt;
      if (g.cT[i] > 0) continue;
      g.cState[i] = FLYING;
      g.cX[i] = g.dist + SPAWN;
      g.cY[i] = plan.kind === FLYER ? g.cTy[i] : g.cTy[i] - DIVE;
      continue;
    }
    g.cX[i] -= plan.speed * dt;
    const rel = g.cX[i] - bx;
    if (plan.kind !== FLYER) {
      const p = rel <= 0 ? 1 : rel >= SPAWN - BX ? 0 : 1 - rel / (SPAWN - BX);
      g.cY[i] = g.cTy[i] - DIVE * (1 - p);
    }
    if (state === FLYING) {
      const dy = g.cY[i] - g.y, reach = HIT + plan.r;
      if (rel * rel + dy * dy < reach * reach) { pop(g, CROW); return; }
      if (rel < -reach - 2) {
        g.cState[i] = PASSED; g.crowsDodged++;
        emit(g, E.CROW_PASS, rel + BX, g.cY[i]);
        if (plan.kind === BOSS_CROW && g.bossLeft > 0) { g.bossLeft--; emit(g, E.BOSS, BX, g.y); }
      }
    } else if (g.cX[i] < g.dist - 40) g.cState[i] = GONE;
  }
}

/** One fixed step of `dt` seconds (slow mode runs the whole street at SLOW). */
export function stepGame(g: Game, hold: boolean, dt: number, slow: boolean) {
  const t = slow ? dt * SLOW : dt;
  g.time += t;
  const pressed = hold && !g.hold;
  g.hold = hold;
  if (g.phase === POP) {
    if (g.time - g.popAt < POP_TIME) return;
    // A spare balloon waits for a fresh press; one held through the pop doesn't count (respawn marks it held).
    if (g.balloons > 0) respawn(g);
    else { g.phase = OVER; emit(g, E.OVER, BX, g.y); }
    return;
  }
  if (g.phase === END) {
    // The last crossing is behind: the balloon floats free over the roofs.
    g.vy -= 240 * t; g.y += g.vy * t; g.dist += speedOf(g) * t;
    if (g.time - g.endAt >= END_TIME) { g.phase = OVER; emit(g, E.OVER, BX, g.y); }
    return;
  }
  if (g.phase === READY) {
    if (!pressed) return;
    g.phase = FLY; g.respawn = false;
    emit(g, E.START, BX, g.y);
  }
  if (g.phase !== FLY) return;
  g.flyTime += t;
  if (pressed) { g.vy -= KICK; g.puffAt = g.time; }
  const v = speedOf(g);
  blow(g, v * GUST_WARN * MODE_INFO[g.mode].warn);
  g.vy += (SINK + g.wind - (hold ? LIFT : 0) - DRAG * g.vy) * t;
  if (g.vy < -MAX_RISE) g.vy = -MAX_RISE;
  g.y += g.vy * t;
  g.dist += v * t;
  const from = g.next > 0 ? g.next - 1 : 0, last = g.gates.length - 1;
  for (let i = from, to = Math.min(last, g.next + LOOKAHEAD); i <= to; i++) g.cy[i] = gateY(g.gates[i], g.dist);
  fly(g, t);
  if (g.phase !== FLY) return;
  if (g.y - HIT < CEIL) { pop(g, MESH); return; }
  if (g.y + HIT > GROUND) { pop(g, STREET); return; }
  const bx = g.dist + BX;
  for (let i = from; i <= g.next && i <= last; i++) {
    const gate = g.gates[i], cy = g.cy[i];
    if (touchesGate(gate, cy, bx, g.y, HIT)) { pop(g, WIRE); return; }
    if (i > g.grazedAt && touchesGate(gate, cy, bx, g.y, GRAZE)) { g.grazedAt = i; g.grazes++; g.streak = 0; emit(g, E.SCRAPE, BX, g.y); }
  }
  while (g.next <= last && g.gates[g.next].x <= bx) {
    const gate = g.gates[g.next];
    g.streak = g.next === g.grazedAt ? 0 : g.streak + 1;
    if (g.streak > g.bestStreak) g.bestStreak = g.streak;
    g.next++; g.score++;
    emit(g, E.PASS, g.streak, g.y);
    if (gate.knot && g.bossLeft > 0) { g.bossLeft--; emit(g, E.KNOT, BX, g.y); }
    if (g.score >= g.goal) {
      g.won = true; g.phase = END; g.endAt = g.time; if (g.vy > -40) g.vy = -40;
      emit(g, E.WIN, BX, g.y);
      return;
    }
  }
  g.near = clearance(g);
}
