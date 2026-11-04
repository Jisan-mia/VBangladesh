// Finding pots: for a striker spot, every straight or one-cushion line that sends a coin into a pocket, with the power it
// needs. The page uses it for the aim snap and সহজ's suggested line; the tests' bots use it to play like a person.
// Ghost-ball geometry: to send coin C into pocket P, the striker's centre must touch C at G = C + (C − P)/|C − P| · (rs + rc).
import { firstHit, pocketOnPath, HIT } from "./physics.hot";
import { AIM_MAX, BOARD, COUNT, E_DISC, E_WALL, PER_SIDE, POCKET_R, POCKET_X, POCKET_Y, QUEEN, STRIKER, STRIKER_MASS, WALL_GRIP, powerFor, slideDistance, speedFor } from "./table";
import { angleTo, onBoard, placeStriker, shooter, sideOf, strikerSpot, whites, type Game } from "./game";

export type Plan = {
  u: number;
  angle: number;
  power: number;
  /** The coin it pots and the pocket. */
  target: number;
  pocket: number;
  /** -1 straight, 0 off the left cushion, 1 off the right (as the board is drawn for white). */
  bank: -1 | 0 | 1;
  /** A combination: the coin the striker touches first, which then sends `target` in (-1: none). */
  via: number;
  /** cos of the cut: 1 is dead straight. */
  cut: number;
  /** Higher is easier. */
  score: number;
  /** The power window: below `least` the coin stops short; above `ceiling` the striker follows it in. */
  least: number;
  ceiling: number;
};

/** Planned power sits this far above the least that drops the coin, so a hand that pulls a little short still makes it. */
const SPARE = 1.22;
/** The thinnest cut a plan may need (cos 72°). */
const THIN = 0.31;
/** Head-on, the coin leaves at this many times the striker's speed (masses 2.6 : 1, restitution 0.9). */
const TRANSFER = ((1 + E_DISC) * STRIKER_MASS) / (STRIKER_MASS + 1);
/** And the striker keeps this much of its speed along the line of centres. */
const KEEP = (1 + E_DISC) / (STRIKER_MASS + 1);

/** The pieces a strike may aim at: a board's whites and queen, every piece in দশ চাল, your own colour and the queen for two. */
export function targets(g: Game) {
  const w = g.world, list: number[] = [];
  // A board that needs the queen: with one white left and the queen still out, only the queen is worth aiming at.
  // The same once the board has all the whites it needs: only the queen is left to do.
  const queenFirst = g.mode === "level" && g.spec?.needQueen && g.queen === "board" && w.on[QUEEN] && (onBoard(w, 0) === 1 || whites(g).inside >= whites(g).need);
  for (let i = 0; i < STRIKER; i++) {
    if (!w.on[i]) continue;
    // The queen: always in দশ চাল; on a board only when it needs her; never while she waits for her cover.
    if (i === QUEEN) { if (g.mode === "board" || (g.queen === "board" && (g.mode === "duo" || g.spec?.needQueen))) list.push(i); continue; }
    if (!queenFirst && (g.mode === "board" || sideOf(i) === (g.mode === "duo" ? g.turn : 0))) list.push(i);
  }
  return list;
}

/** True when nothing but `skip` lies within `clear` of the segment A→B. */
function open(g: Game, ax: number, ay: number, bx: number, by: number, clear: number, skip: number) {
  const w = g.world, vx = bx - ax, vy = by - ay, len2 = vx * vx + vy * vy || 1;
  for (let j = 0; j < COUNT; j++) {
    if (j === skip || j === STRIKER || !w.on[j]) continue;
    const t = Math.max(0, Math.min(1, ((w.x[j] - ax) * vx + (w.y[j] - ay) * vy) / len2));
    const ox = w.x[j] - ax - t * vx, oy = w.y[j] - ay - t * vy;
    if (ox * ox + oy * oy < (clear + w.r[j]) ** 2) return false;
  }
  return true;
}

/** The power that gives the striker `touch` mm/s when it reaches the coin, `travel` mm on (after `before` mm and a cushion that leaves `loss` of its speed). */
function powerToTouch(touch: number, travel: number, loss: number, before: number) {
  const atStart = speedFor(travel + slideDistance(touch));
  return powerFor(before > 0 ? speedFor(before + slideDistance(atStart / loss)) : atStart);
}

/** Where the striker rolls after touching the coin along `n` (unit, ghost → coin): written into FOLLOW as [share of speed kept, ux, uy]. */
const FOLLOW = [0, 0, 0];
function follow(ux: number, uy: number, nx: number, ny: number) {
  const along = ux * nx + uy * ny, fx = ux - KEEP * along * nx, fy = uy - KEEP * along * ny, share = Math.sqrt(fx * fx + fy * fy);
  FOLLOW[0] = share; FOLLOW[1] = share ? fx / share : 0; FOLLOW[2] = share ? fy / share : 0;
}

/** How far a centre at (x, y) travels along unit (dx, dy) before it is over pocket p. */
function intoPocket(x: number, y: number, dx: number, dy: number, p: number) {
  const px = POCKET_X[p] - x, py = POCKET_Y[p] - y, along = px * dx + py * dy, off2 = px * px + py * py - along * along;
  return along - Math.sqrt(Math.max(0, POCKET_R * POCKET_R - off2));
}

/** Every pot from striker spot u (the striker is moved there and back). */
export function plansAt(g: Game, u: number, banks: boolean, out: Plan[], combos = banks) {
  const w = g.world, keepU = g.u;
  if (!placeStriker(g, u)) { placeStriker(g, keepU); return out; }
  const rs = w.r[STRIKER], sx = w.x[STRIKER], sy = w.y[STRIKER], top = shooter(g) === 1;
  for (const i of targets(g)) {
    const cx = w.x[i], cy = w.y[i], rc = w.r[i];
    for (let p = 0; p < 4; p++) {
      const px = POCKET_X[p], py = POCKET_Y[p];
      let ex = cx - px, ey = cy - py;
      const coinTravel = Math.sqrt(ex * ex + ey * ey);
      ex /= coinTravel; ey /= coinTravel;
      if (!open(g, cx, cy, px, py, rc - 2, i)) continue;
      const gx = cx + ex * (rs + rc), gy = cy + ey * (rs + rc);
      // Straight at the ghost point.
      for (let bank = -1; bank <= (banks ? 1 : -1); bank++) {
        let ax = gx, ay = gy, before = 0, loss = 1;
        if (bank >= 0) {
          // Off a side cushion at x = rs (or BOARD − rs): solve for the point that bounces onto the ghost line.
          const wall = bank === 0 ? rs : BOARD - rs, a = gx - wall, b = E_WALL * (sx - wall), denominator = b + WALL_GRIP * a;
          if (Math.abs(denominator) < 1e-6 || Math.sign(a) !== Math.sign(sx - wall)) continue;
          const yb = (gy * b + WALL_GRIP * a * sy) / denominator;
          if (yb < rs || yb > BOARD - rs || (top ? yb < sy : yb > sy)) continue;
          ax = wall; ay = yb;
        }
        let dx = ax - sx, dy = ay - sy;
        const leg = Math.sqrt(dx * dx + dy * dy);
        dx /= leg; dy /= leg;
        const angle = angleTo(g, ax, ay);
        if (Math.abs(angle) > AIM_MAX) continue;
        let ux = dx, uy = dy, travel = leg;
        if (bank >= 0) {
          firstHit(w, sx, sy, dx, dy, rs, STRIKER, -1);
          if (HIT[1] !== -1 || Math.abs(HIT[0] - leg) > 3) continue;
          const bx = -dx * E_WALL, by = dy * WALL_GRIP, speedShare = Math.sqrt(bx * bx + by * by);
          ux = bx / speedShare; uy = by / speedShare;
          before = leg; loss = speedShare;
          travel = Math.hypot(gx - ax, gy - ay);
          firstHit(w, ax, ay, ux, uy, rs, STRIKER, -1);
        } else firstHit(w, sx, sy, dx, dy, rs, STRIKER, -1);
        if (HIT[1] !== i || Math.abs(HIT[0] - travel) > 3) continue;
        const cut = -(ux * ex + uy * ey);
        if (cut < THIN) continue;
        // The least power that drops the coin; and, if the striker would roll on into a pocket, the power where it starts to.
        const least = powerToTouch(speedFor(coinTravel - POCKET_R * 0.5 + 40) / (TRANSFER * cut), travel, loss, before);
        follow(ux, uy, -ex, -ey);
        // A striker that passes near a corner slides along the cushion and drops, so the mouth counts wider here.
        const fell = FOLLOW[0] > 0.05 ? pocketOnPath(gx, gy, FOLLOW[1], FOLLOW[2], 2 * BOARD, 1.7) : -1;
        const foulAt = fell >= 0 ? powerToTouch(speedFor(intoPocket(gx, gy, FOLLOW[1], FOLLOW[2], fell)) / FOLLOW[0], travel, loss, before) : 2;
        const room = foulAt / least;
        if (room < 1.04) continue;
        // With a foul above, aim for the middle of the window; with none, comfortably above the least.
        const power = Math.min(1, fell >= 0 ? Math.max(least * 1.08, Math.sqrt(least * foulAt)) : least * SPARE);
        const score = (cut * cut * (bank >= 0 ? 0.55 : 1) * (room < 1.25 ? 0.4 + (room - 1) * 2.4 : 1) * (i === QUEEN ? 1.15 : 1)) / (1 + (before + travel + coinTravel) / 900);
        out.push({ u, angle, power, target: i, pocket: p, bank: bank as -1 | 0 | 1, via: -1, cut, score, least, ceiling: Math.min(1, foulAt) });
      }
      // A combination: strike another of your coins (j) so that it sends this one in.
      for (const j of combos ? targets(g) : []) {
        if (j === i || j === QUEEN) continue;
        const ax = cx + ex * (rc + w.r[j]), ay = cy + ey * (rc + w.r[j]);
        let bx = ax - w.x[j], by = ay - w.y[j], travelB = Math.sqrt(bx * bx + by * by);
        if (travelB < 4) {
          // Already touching, in line with the pocket: a push straight through.
          if (Math.hypot(w.x[j] - cx, w.y[j] - cy) > rc + w.r[j] + 4) continue;
          bx = -ex; by = -ey; travelB = 0;
        } else {
          bx /= travelB; by /= travelB;
          firstHit(w, w.x[j], w.y[j], bx, by, w.r[j], j, STRIKER);
          if (HIT[1] !== i || Math.abs(HIT[0] - travelB) > 3) continue;
        }
        const cutA = -(bx * ex + by * ey);
        if (cutA < 0.6) continue;
        const hx = w.x[j] - bx * (rs + w.r[j]), hy = w.y[j] - by * (rs + w.r[j]);
        let dx = hx - sx, dy = hy - sy;
        const leg = Math.sqrt(dx * dx + dy * dy);
        dx /= leg; dy /= leg;
        const angle = angleTo(g, hx, hy);
        if (Math.abs(angle) > AIM_MAX) continue;
        firstHit(w, sx, sy, dx, dy, rs, STRIKER, -1);
        if (HIT[1] !== j || Math.abs(HIT[0] - leg) > 3) continue;
        const cutB = dx * bx + dy * by;
        if (cutB < 0.6) continue;
        // Coin on coin passes (1 + e) / 2 of the speed along the line of centres.
        const touchA = speedFor(coinTravel - POCKET_R * 0.5 + 40) / (((1 + E_DISC) / 2) * cutA);
        const startB = speedFor(travelB + slideDistance(touchA));
        const power = Math.min(1, powerToTouch(startB / (TRANSFER * cutB), leg, 1, 0) * SPARE);
        const score = (0.6 * (cutA * cutB) ** 2) / (1 + (leg + travelB + coinTravel) / 900);
        out.push({ u, angle, power, target: i, pocket: p, bank: -1, via: j, cut: cutA * cutB, score, least: power / SPARE, ceiling: 1 });
      }
    }
  }
  placeStriker(g, keepU);
  return out;
}

const byScore = (a: Plan, b: Plan) => b.score - a.score;

/** The pots from the striker's current spot, easiest first. */
export function plansHere(g: Game, banks = true) {
  return plansAt(g, g.u, banks, []).sort(byScore);
}

/** The pots from every spot along the baseline, easiest first. */
export function plansAll(g: Game, steps = 24, banks = true) {
  const out: Plan[] = [];
  for (let k = 0; k <= steps; k++) plansAt(g, k / steps, banks, out);
  return out.sort(byScore);
}

/** No pot anywhere: a firm strike into the nearest piece it may aim at (a break opens the pack). */
export function smash(g: Game): Plan {
  const w = g.world, side = shooter(g);
  let best: Plan | undefined;
  for (let k = 0; k <= 12; k++) {
    const u = k / 12, s = strikerSpot(side, u);
    if (!placeStriker(g, u)) continue;
    for (const i of targets(g).length ? targets(g) : [QUEEN]) {
      if (!w.on[i]) continue;
      const angle = angleTo(g, w.x[i], w.y[i]);
      if (Math.abs(angle) > AIM_MAX) continue;
      const d = Math.hypot(w.x[i] - s.x, w.y[i] - s.y);
      const score = -d / 1000;
      if (!best || score > best.score) best = { u, angle, power: 0.72, target: i, pocket: -1, bank: -1, via: -1, cut: 0, score, least: 0, ceiling: 1 };
    }
  }
  // Nothing reachable at all (a piece tucked beside you): a firm strike straight up the board stirs things.
  best ??= { u: g.u, angle: 0, power: 0.6, target: -1, pocket: -1, bank: -1, via: -1, cut: 0, score: -1, least: 0, ceiling: 1 };
  placeStriker(g, best.u);
  return best;
}

/** The pack's middle (for the opening break). */
export function packCentre(g: Game) {
  const w = g.world;
  let x = 0, y = 0, n = 0;
  for (let i = 0; i < PER_SIDE * 2 + 1; i++) if (w.on[i]) { x += w.x[i]; y += w.y[i]; n++; }
  return n ? { x: x / n, y: y / n } : { x: BOARD / 2, y: BOARD / 2 };
}
