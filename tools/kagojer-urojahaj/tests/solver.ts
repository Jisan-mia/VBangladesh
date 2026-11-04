// A beam-search pilot that proves a flight can be done: every tenth of a second it tries holding and letting go from
// each kept state, keeps the most promising states (far, high, fast, and on the bullseye's line near the end), and
// stops at the first landing it likes. It plays the real stepGame, so what it finds a careful thumb can do.
import { createGame, type Game } from "../lib/flight";
import { G, STEP, padX, type Course } from "../lib/physics";
import { stepGame } from "../lib/step.hot";

const TICK = 6;

type Node = Game & { path: string };
function clone(game: Node, hold: boolean): Node {
  return { ...game, taken: game.taken.slice(), evKind: game.evKind, evX: game.evX, evY: game.evY, evN: game.evN, path: game.path + (hold ? "1" : "0") };
}

/** The best landing it can find with one page: 0 none, 1 landed, 2 bullseye, and the candies on that flight. */
export function solve(course: Course, { width = 28, greed = 0, bull = true } = {}) {
  let beam: Node[] = [{ ...createGame(course, 1), probe: false, path: "" }];
  const pad = course.pad;
  let best: Node | null = null, farthest: Node | null = null, far = 0;
  const value = (game: Game) => {
    const energy = game.y + (game.v * game.v) / (2 * G);
    const distance = padX(pad, game.t) + (pad.x1 - pad.x0) / 2 - game.x, reach = (game.y - pad.y + (game.v * game.v) / (2 * G) - 40) * 4.5;
    const approach = bull && distance < 900 && distance > -30 ? -Math.abs(reach - distance) * 2.5 : 0;
    return game.x + energy * 1.5 + game.candies * 60 * greed + approach;
  };
  for (let round = 0; round < 60 * 90 / TICK && beam.length; round++) {
    const next: Node[] = [];
    const seen = new Set<string>();
    for (const game of beam) for (const hold of [false, true]) {
      const child = clone(game, hold);
      for (let k = 0; k < TICK && !child.over && child.state === 0; k++) stepGame(child, hold, STEP);
      if (child.landing) {
        const score = child.landing * 1000 + child.candies;
        if (!best || score > best.landing * 1000 + best.candies) best = child;
        continue;
      }
      if (child.crashes) continue;
      const key = `${Math.round(child.x / 6)}|${Math.round(child.y / 6)}|${Math.round(child.v / 8)}|${Math.round(child.a * 8)}|${greed ? child.candies : 0}`;
      if (seen.has(key)) continue;
      seen.add(key);
      next.push(child);
      if (child.x > far) { far = child.x; farthest = child; }
    }
    if (best && (best as Node).landing === 2 && (!greed || (best as Node).candies >= course.goal)) break;
    // Half the beam is simply the best; the other half keeps the best few at every height, so it never all flies into
    // the same kite tail.
    next.sort((a, b) => value(b) - value(a));
    beam = next.slice(0, width >> 1);
    const perBand = Math.max(2, Math.ceil(width / 16)), bands = new Map<number, number>();
    for (const node of next.slice(width >> 1)) {
      const band = Math.floor(node.y / 50), used = bands.get(band) ?? 0;
      if (used >= perBand) continue;
      bands.set(band, used + 1);
      beam.push(node);
      if (beam.length >= width) break;
    }
  }
  const found = best as Node | null, end = (found ?? farthest) as Node | null;
  return { landing: found?.landing ?? 0, candies: found?.candies ?? 0, t: found?.t ?? 0, far: Math.round(far), path: end?.path ?? "" };
}
