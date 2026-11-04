// The game before the rewrite, kept only to check its links and move its old best: ten 45-second fields whose sparrows
// came singles → pairs → groups, 1% a peck. Server-safe (challenge.ts reaches it). Nothing here runs during play.
import { makeRng, starsFor } from "../../../shared/game-core";

const DURATION = 45, GRAIN = 100, FIRST_NIBBLE = 0.6, LAST_LANDING = 43;
const FIELD = { left: 34, right: 326, top: 232, bottom: 414 }, SCARECROW = { x: 296, base: 404, height: 178, clear: 54 };
const MIN_GAP = 66, TOGETHER = 1.2, LOOKBACK = 3.5, SPREAD = 110;

/** The old fields' gap and group multipliers and peck pace (the fourth, the flight time, didn't change the grain), and field 1's marks. */
const OLD = [
  [1, 1, 1.5, 0.8], [0.92, 1, 1.5, 0.8], [0.92, 1.3, 1.5, 0.8], [0.92, 1.3, 1.3, 0.8], [0.92, 1.3, 1.3, 0.7],
  [0.85, 1.3, 1.3, 0.7], [0.85, 1.6, 1.3, 0.7], [0.85, 1.6, 1.15, 0.7], [0.8, 1.6, 1.15, 0.62], [0.75, 2, 1.05, 0.62],
] as const;
export const OLD_LEVELS = OLD.length;
const FIELD_ONE = { pass: 30, two: 75, three: 90 };

const groupSize = (t: number, roll: number) => t < 9 ? 1 : t < 20 ? 2 : t < 31 ? 3 : roll < 0.5 ? 3 : 4;
const nearScarecrow = (x: number, y: number) => Math.abs(x - SCARECROW.x) < SCARECROW.clear && y > SCARECROW.base - SCARECROW.height - 20;

/** The old afternoon's landings (time, spot) and its peck pace, from one seed and field: the same draws as the old game. */
export function oldSchedule(seed: number, level: number) {
  const rng = makeRng(seed), [gap, ramp, every] = OLD[Math.min(OLD_LEVELS, Math.max(1, level)) - 1];
  const land: number[] = [], xs: number[] = [], ys: number[] = [];
  const add = (at: number, x: number, y: number) => { land.push(at); xs.push(x); ys.push(y); rng(); };
  const place = (at: number) => {
    let bestX = 180, bestY = (FIELD.top + FIELD.bottom) / 2, bestScore = -1;
    for (let tries = 0; tries < 40 && bestScore < 1000 + SPREAD; tries++) {
      const x = FIELD.left + rng() * (FIELD.right - FIELD.left), y = FIELD.top + rng() * (FIELD.bottom - FIELD.top);
      if (nearScarecrow(x, y)) continue;
      let near = 999, recent = 999;
      for (let i = 0; i < land.length; i++) {
        const d = Math.hypot(xs[i] - x, ys[i] - y), ago = at - land[i];
        if (ago < TOGETHER) near = Math.min(near, d);
        if (ago < LOOKBACK) recent = Math.min(recent, d);
      }
      const score = near >= MIN_GAP ? 1000 + Math.min(recent, SPREAD) : near;
      if (score > bestScore) { bestX = x; bestY = y; bestScore = score; }
    }
    return [bestX, bestY] as const;
  };
  // The old first sparrow: upper middle; then its side and its flying height were drawn.
  const firstX = 120 + rng() * 90, firstY = FIELD.top + 18 + rng() * 22;
  rng();
  add(0, firstX, firstY);
  for (let t = 1.9 + rng() * 0.4; t < LAST_LANDING;) {
    const size = groupSize(t * ramp, rng());
    rng();
    for (let index = 0, at = t; index < size && at < LAST_LANDING; index++, at += 0.1 + rng() * 0.12) {
      const [x, y] = place(at);
      add(at, x, y);
    }
    t += (size === 1 ? 1.7 + rng() * 0.6 : size === 2 ? 2.5 + rng() * 0.6 : 2.7 + rng() * 0.6) * gap;
  }
  return { land, every };
}

const nibblesBy = (land: number, every: number, t: number) => { let count = 0; while (t >= land + FIRST_NIBBLE + count * every) count++; return count; };

/** The most grain an old run that shooed `shooed` sparrows could keep (the rest sat till dusk, at best the last to land); −1 if more were shooed than came. */
export function oldMaxSaved(seed: number, level: number, shooed: number) {
  const { land, every } = oldSchedule(seed, level);
  if (shooed > land.length) return -1;
  let eaten = 0;
  for (let i = shooed; i < land.length; i++) eaten += nibblesBy(land[i], every, DURATION);
  return Math.max(0, GRAIN - eaten);
}

/** Before levels this phone kept only a best % for the one field there was. Its stars under the old field 1 marks, or 0. */
export function migrateBest(hasStars: boolean, oldBest: string | null) {
  const saved = Number(oldBest);
  if (hasStars || oldBest === null || oldBest === "" || !Number.isInteger(saved) || saved < 0 || saved > GRAIN) return 0;
  return saved < FIELD_ONE.pass ? 0 : starsFor(saved, FIELD_ONE.three, FIELD_ONE.two);
}
