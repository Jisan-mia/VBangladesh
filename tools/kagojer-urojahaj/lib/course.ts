// A flight's whole layout from its level and seed: solid shapes, wind zones, kite strings, birds, candies, checkpoints
// and the landing place, packed into flat typed arrays so the step and the drawing read them without allocating.
// The seed nudges benches, fans, birds and candies a little; the shape of the level stays the designer's.
// Pure and server-safe (link.ts checks a friend's claim against it).
import { makeRng } from "../../../shared/game-core";
import { LEVELS, WORLDS, type LevelSpec } from "./levels";
import { A, BIRD, METER, RECT, SKY_CAP, STRING, WIND, WINDF, type Course } from "./physics";

/** The fan's blades and its downdraft, as the step sees them. */
export const FAN_Y = 482, FAN_HALF = 55, FAN_PUSH = 26;
export const BENCH_H = 60, BENCH_HALF = 45, SHELF_HALF = 35;
export const RAIN_PUSH = 18;

const MAX_RECTS = 48, MAX_WINDS = 32, MAX_STRINGS = 8, MAX_BIRDS = 6, MAX_CANDIES = 40, MAX_CHECKPOINTS = 8, MAX_BEATS = 8;

export function makeCourse(seed: number, level: number): Course {
  const spec: LevelSpec = LEVELS[level - 1], world = WORLDS[spec.world];
  const rng = makeRng((seed ^ Math.imul(level, 0x9e3779b1)) >>> 0 || 1);
  const jitter = (size: number) => (rng() * 2 - 1) * size;
  const rects = new Float32Array(MAX_RECTS * RECT), winds = new Float32Array(MAX_WINDS * WINDF);
  const strings = new Float32Array(MAX_STRINGS * STRING), birds = new Float32Array(MAX_BIRDS * BIRD);
  const candies = new Float32Array(MAX_CANDIES * 2), checkpoints = new Float32Array(MAX_CHECKPOINTS * 2);
  let rectCount = 0, windCount = 0, stringCount = 0, birdCount = 0, candyCount = 0, checkpointCount = 0;
  const rect = (x0: number, y0: number, x1: number, y1: number, art: number) => {
    rects.set([x0, y0, x1, y1, art], rectCount++ * RECT);
  };
  const wind = (x0: number, y0: number, x1: number, y1: number, wx: number, wy: number, art: number, period = 0, on = 1, phase = 0) => {
    winds.set([x0, y0, x1, y1, wx, wy, period, on, phase, art], windCount++ * WINDF);
  };
  checkpoints.set([0, spec.startY], 0); checkpointCount = 1;

  for (const piece of spec.pieces) {
    switch (piece[0]) {
      case "bench": { const x = piece[1] + jitter(14), h = piece[2] ?? BENCH_H; rect(x - BENCH_HALF, 0, x + BENCH_HALF, h, A.bench); break; }
      case "shelf": { const x = piece[1] + jitter(12), h = piece[2] + jitter(8); rect(x - SHELF_HALF, 0, x + SHELF_HALF, h, A.shelf); break; }
      case "fan": {
        const x = piece[1] + jitter(10);
        rect(x - FAN_HALF, FAN_Y, x + FAN_HALF, FAN_Y + 14, A.fan);
        rect(x - 3, FAN_Y + 14, x + 3, world.ceiling, A.rod);
        wind(x - FAN_HALF - 3, 0, x + FAN_HALF + 3, FAN_Y, 0, -FAN_PUSH, WIND.fan);
        break;
      }
      case "bell": wind(piece[1], 0, piece[2], FAN_Y, 0, -piece[3], WIND.bell, piece[4], 0.45, piece[5]); break;
      case "roof": rect(piece[1], 0, piece[2], piece[3], A.roof); break;
      case "tank": rect(piece[1] - 24, piece[2], piece[1] + 24, piece[2] + 46, A.tank); break;
      case "warm": wind(piece[1] - piece[3] / 2, piece[2], piece[1] + piece[3] / 2, SKY_CAP, 0, piece[4], WIND.warm); break;
      case "kite": strings.set([piece[1] + jitter(10), piece[2] + jitter(8), piece[3], -26, piece[4], 0.55 + rng() * 0.2, rng() * Math.PI * 2, 0], stringCount++ * STRING); break;
      case "gust": wind(piece[1], 0, piece[2], 700, piece[3], 0, WIND.gust, piece[4], piece[5], piece[6] + jitter(0.3)); break;
      case "boat": rect(piece[1], 0, piece[1] + piece[2], 26, A.hull); rect(piece[1] + piece[2] * 0.3, 26, piece[1] + piece[2] * 0.72, 62, A.chhoi); break;
      case "ghat": rect(piece[1], 0, piece[2], piece[3], A.ghat); break;
      case "rain": wind(piece[1], 0, piece[2], 700, 0, -RAIN_PUSH, WIND.rain); break;
      case "bird": birds.set([piece[1] + jitter(10), piece[2] + jitter(10), piece[3], piece[4], piece[5], piece[6] + jitter(0.4), 0], birdCount++ * BIRD); break;
      case "candy": {
        const [, x, y, n, dx, arch] = piece, column = dx < 1;
        const ox = jitter(8), oy = jitter(12);
        for (let index = 0; index < n; index++) {
          const u = n > 1 ? (2 * index) / (n - 1) - 1 : 0;
          candies.set(column ? [x + ox, y + oy + index * 38] : [x + ox + index * dx, y + oy + arch * (1 - u * u)], candyCount++ * 2);
        }
        break;
      }
      case "cp": checkpoints.set([piece[1], piece[2]], checkpointCount++ * 2); break;
    }
  }

  const beats = new Float32Array(MAX_BEATS).fill(-1);
  (spec.beats ?? []).forEach((at, index) => { beats[index] = at; });
  const pad = { x0: spec.pad.x0, x1: spec.pad.x1, y: spec.pad.y, bull: spec.pad.bull, depth: spec.pad.depth, step: spec.pad.step ?? 0, every: spec.pad.every ?? 0, max: spec.length - spec.pad.x1, art: spec.world };
  return {
    seed, level, world: spec.world, length: spec.length, ceiling: world.ceiling, floor: world.floor, startX: 0, startY: spec.startY,
    rects, rectCount, winds, windCount, strings, stringCount, birds, birdCount, candies, candyCount, checkpoints, checkpointCount, beats,
    pad, goal: Math.min(spec.goal, candyCount), meters: Math.floor((pad.x0 + pad.x1) / 2 / METER),
  };
}
