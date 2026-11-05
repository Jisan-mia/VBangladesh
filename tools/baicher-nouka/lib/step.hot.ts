// The per-step rules: runs 60 times a second on a cheap phone, so it mutates the race in place and allocates nothing.
// With every new feature off (the old plan) this is the first version's stepRace exactly, so old links replay the same.
import { BOAT_LEN, HULL_W, LANES, PATCH_W, VMAX, clamp, laneX } from "./course";
import {
  BEAT, BOOST_T, CRUISE, CURRENT_MUL, FOLLOW, GRIP, GUST, GUST_WARN, MISSED, NARROW_WARN, PATCH, SHOVED, SIDE, SLOW_LOW, SLOW_T, STREAK_STEP,
  STUMBLE_LOW, SURGE, SURGE_MUL, SURGE_T, SURGE_WARN, closed, emit, roomIn, type Race,
} from "./rowing";

const SIDE_SPEED = 60 / 0.2;
/** Seconds ahead a champion's boat shows its last pull coming, and a crosswind or the closing banks are flagged. */
const WARN_SURGE = 1.4, WARN_GUST = 1.2, WARN_NARROW = 1.3;

/** Distance from `y` to the nearest live patch in `lane` within `look` (one alongside counts as 0); `look` if none. Rivals skip rows they miss. */
function clearAhead(race: Race, lane: number, y: number, look: number, rivalIndex: number) {
  let nearest = look;
  const rival = rivalIndex > 0 ? race.boats[rivalIndex] : null;
  for (let index = race.firstPatch; index < race.patches.length; index++) {
    const patch = race.patches[index];
    if (patch.y > y + look) break;
    if (patch.lane !== lane || patch.hitBy >= 0 || patch.y + patch.len < y - BOAT_LEN) continue;
    if (rival && rival.miss[patch.row]) continue;
    nearest = Math.min(nearest, Math.max(0, patch.y - y));
  }
  return nearest;
}

/** A rival looks ahead: a patch it has seen or a slower boat in its lane sends it to the clearer side, if there's room. The champion otherwise blocks you. */
function steerRival(race: Race, index: number) {
  const rival = race.boats[index];
  if (rival.cool > 0 || rival.x !== laneX(rival.lane)) return;
  const look = rival.speed + 60;
  let here = clearAhead(race, rival.lane, rival.y, look, index);
  for (let other = 0; other < race.boats.length; other++) {
    const them = race.boats[other];
    if (other === index || Math.abs(them.x - rival.x) >= SIDE || them.y <= rival.y) continue;
    if (them.y - BOAT_LEN - rival.y < look * 0.6 && them.speed < rival.speed - 5) here = Math.min(here, them.y - BOAT_LEN - rival.y);
  }
  if (here >= look) {
    if (rival.boss) block(race, index, look);
    return;
  }
  let best = -1, bestClear = here + 1;
  for (let side = 0; side < 2; side++) {
    const lane = rival.lane + (side === 0 ? rival.pref : -rival.pref);
    if (lane < 0 || lane >= LANES || closed(race, rival.y, lane) || !roomIn(race, index, lane)) continue;
    const clear = clearAhead(race, lane, rival.y, look * 1.5, index);
    if (clear > bestClear) { best = lane; bestClear = clear; }
  }
  if (best >= 0) { rival.lane = best; rival.cool = 0.6; }
}

/** The champion drifts into your lane while you are close behind it, now and then, so passing it takes a move and a burst. */
function block(race: Race, index: number, look: number) {
  const boss = race.boats[index], you = race.boats[0];
  if (race.t < 2 || you.y >= boss.y || you.y < boss.y - BOAT_LEN - 170 || you.lane === boss.lane) return;
  if (Math.sin(race.t * 2.3 + boss.phase) < -0.4) return;
  const lane = boss.lane + (you.lane > boss.lane ? 1 : -1);
  if (closed(race, boss.y, lane) || !roomIn(race, index, lane) || clearAhead(race, lane, boss.y, look, index) < look * 0.5) return;
  boss.lane = lane; boss.cool = 1.1;
}

/** Is this boat's middle inside a fast lane's current right now? */
function inCurrent(race: Race, y: number, x: number) {
  const mid = y - BOAT_LEN * 0.5;
  for (let index = 0; index < race.currents.length; index++) {
    const seg = race.currents[index];
    if (mid >= seg.y0 && mid <= seg.y1 && Math.abs(x - laneX(seg.lane)) < 26) return true;
  }
  return false;
}

/** The speed a boat is rowing for right now. */
function wanted(race: Race, index: number) {
  const it = race.boats[index];
  let speed: number;
  if (it.done >= 0) speed = index === 0 ? CRUISE * 0.3 : it.base * 0.8;
  else if (index === 0) speed = (CRUISE + STREAK_STEP * race.streak + race.boost) * (race.stumble > 0 ? STUMBLE_LOW : 1);
  else speed = it.base * it.style[Math.min(2, Math.floor(it.y / (race.plan.course / 3)))] * (1 + 0.03 * Math.sin(race.t * 0.9 + it.phase));
  if (it.slow > 0) speed *= SLOW_LOW + (1 - SLOW_LOW) * (1 - it.slow / SLOW_T);
  if (it.surge > 0) speed *= SURGE_MUL;
  if (race.currents.length && inCurrent(race, it.y, it.x)) speed *= CURRENT_MUL;
  return Math.min(VMAX, speed);
}

/**
 * Advances the race by `real` seconds of real time (game time passes `race.scale` as fast). Mutates `race` and allocates nothing.
 * After you finish, the other boats keep rowing in (for the scene) but nothing counts any more.
 */
export function stepRace(race: Race, real: number) {
  const dt = real * race.scale;
  race.t += dt;
  if (race.t < 0) return;
  const boats = race.boats, you = boats[0], course = race.plan.course;
  const window = race.window * race.scale, lag = race.lag * race.scale;

  if (!race.over) {
    // The drum: a beat sounds, and a beat whose window has passed uncaught is a miss.
    while (race.tick < race.beats.length && race.t >= race.beats[race.tick]) emit(race, BEAT, race.tick++, 0);
    while (race.next < race.beats.length && race.t - lag > race.beats[race.next] + window) {
      if (race.marks[race.next] === 0) { race.marks[race.next] = -1; race.streak = 0; emit(race, MISSED, race.next, 0); }
      race.next++;
    }
    race.boost *= Math.exp(-dt / BOOST_T);
    if (race.stumble > 0) race.stumble -= dt;
    for (let index = 1; index < boats.length; index++) { if (boats[index].cool > 0) boats[index].cool -= dt; if (boats[index].done < 0) steerRival(race, index); }

    // The champion's last pull is flagged before it comes, then it comes.
    if (race.boss >= 0 && race.surgeNext < race.surgeAt.length) {
      const boss = boats[race.boss], at = race.surgeAt[race.surgeNext];
      if (!race.surgeWarned && boss.y >= at - boss.speed * WARN_SURGE) { race.surgeWarned = true; emit(race, SURGE_WARN, race.surgeNext, 0); }
      if (boss.y >= at) { boss.surge = SURGE_T; race.surgeNext++; race.surgeWarned = false; emit(race, SURGE, race.surgeNext, 0); }
    }
    // A crosswind: flagged on the side it comes from, then it shoves you one lane over (if there is room).
    if (race.gustNext < race.gusts.length) {
      const gust = race.gusts[race.gustNext];
      if (race.gustWarned < race.gustNext && you.y >= gust.y - you.speed * WARN_GUST - 40) { race.gustWarned = race.gustNext; emit(race, GUST_WARN, gust.dir, 0); }
      if (you.y >= gust.y) {
        const lane = clamp(you.lane + gust.dir, 0, LANES - 1);
        race.gustNext++; race.gustsFaced++;
        if (lane !== you.lane && !closed(race, you.y, lane) && roomIn(race, 0, lane)) { you.lane = lane; emit(race, GUST, gust.dir, 0); }
      }
    }
    // The banks close ahead: flagged, then the edge lanes' boats are squeezed in.
    if (you.nar < race.narrows.length && race.narrowWarned < you.nar && you.y >= race.narrows[you.nar].y0 - you.speed * WARN_NARROW - 20) { race.narrowWarned = you.nar; emit(race, NARROW_WARN, you.nar, 0); }
  }

  for (let index = 0; index < boats.length; index++) {
    const it = boats[index];
    while (it.nar < race.narrows.length && it.y >= race.narrows[it.nar].y0) {
      it.nar++;
      if (it.lane === 0) { it.lane = 1; if (index === 0) emit(race, SHOVED, 1, 0); }
      else if (it.lane === LANES - 1) { it.lane = LANES - 2; if (index === 0) emit(race, SHOVED, -1, 0); }
    }
  }

  const grip = Math.min(1, GRIP * dt);
  for (let index = 0; index < boats.length; index++) {
    const it = boats[index];
    if (it.slow > 0) it.slow -= dt;
    if (it.surge > 0) it.surge -= dt;
    it.speed += (wanted(race, index) - it.speed) * grip;
    it.y += it.speed * dt;
    const target = laneX(it.lane), move = SIDE_SPEED * dt;
    it.x = Math.abs(target - it.x) <= move ? target : it.x + Math.sign(target - it.x) * move;
  }

  // Front boat first; a boat that would run into the stern ahead of it waits there (and so must row around it).
  const order = race.order;
  for (let i = 1; i < order.length; i++) for (let j = i; j > 0 && boats[order[j]].y > boats[order[j - 1]].y; j--) { const swap = order[j]; order[j] = order[j - 1]; order[j - 1] = swap; }
  for (let i = 0; i < order.length; i++) {
    const it = boats[order[i]];
    let held = false;
    for (let j = 0; j < i; j++) {
      const ahead = boats[order[j]];
      if (Math.abs(ahead.x - it.x) < SIDE && it.y > ahead.y - BOAT_LEN - FOLLOW) { it.y = ahead.y - BOAT_LEN - FOLLOW; it.speed = Math.min(it.speed, ahead.speed); held = true; }
    }
    it.held = held ? it.held + dt : 0;
  }

  if (race.over) return;
  if (order[order.length - 1] === 0) race.lastFor += dt;

  // কচুরিপানা: the first boat into a patch is dragged down and scatters it.
  const front = boats[order[0]].y;
  for (let index = race.firstPatch; index < race.patches.length; index++) {
    const patch = race.patches[index];
    if (patch.y > front) break;
    if (patch.hitBy >= 0) continue;
    for (let who = 0; who < boats.length; who++) {
      const it = boats[who];
      if (it.y <= patch.y || it.y - BOAT_LEN >= patch.y + patch.len || Math.abs(it.x - patch.x) >= (HULL_W + PATCH_W) / 2) continue;
      patch.hitBy = who; patch.hitAt = race.t; patch.side = it.x >= patch.x ? -1 : 1;
      it.slow = SLOW_T; it.speed *= SLOW_LOW;
      if (who === 0) { race.boost = 0; race.streak = 0; race.patchHits++; }
      emit(race, PATCH, who, index);
      break;
    }
  }
  const rear = boats[order[order.length - 1]].y - BOAT_LEN;
  while (race.firstPatch < race.patches.length && race.patches[race.firstPatch].y + race.patches[race.firstPatch].len < rear - 200) race.firstPatch++;

  // The finish rope: the exact moment each bow crossed it, so two boats in the same step are still told apart.
  for (let index = 0; index < boats.length; index++) {
    const it = boats[index];
    if (it.done < 0 && it.y >= course) it.done = race.t - (it.y - course) / Math.max(1, it.speed);
  }
  if (you.done >= 0) {
    let rank = 1;
    for (let index = 1; index < boats.length; index++) if (boats[index].done >= 0 && boats[index].done < you.done) rank++;
    race.rank = rank;
    race.tenths = Math.round(you.done * 10);
    race.over = true;
  }
}

