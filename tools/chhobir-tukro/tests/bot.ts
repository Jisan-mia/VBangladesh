// Headless players for difficulty tuning. Each plays a level through the real rules (lib/play.ts: the tray and its queue,
// turned pieces, drops judged by judgeDrop with a real aim error, wrong cells with fitting or other knobs), and a timing
// model of a person: reaction time, time to find a piece's place (longer with more holes, a fainter picture, and the
// look-alike night sky), the carry, a tap per quarter turn, and a retry after a miss. Seeded, so every run is exact.
import { makeRng } from "../../../shared/game-core";
import { layoutFor } from "../lib/anim";
import { planOf, starsFor } from "../lib/game";
import { infoOf, worldIndex } from "../lib/levels";
import { dropPiece, startPlay, turnOne, type Play } from "../lib/play";

export type Skill = {
  /** Seconds from seeing to acting (a range). */
  react: readonly [number, number];
  /** Seconds to find where a piece goes, on a strong picture with a few holes. */
  find: number;
  /** Seconds to carry a piece from the tray to the board. */
  carry: number;
  /** Seconds per tap (picking a piece to turn it, each quarter turn). */
  tap: number;
  /** Drop error, in cells (one standard deviation). */
  aim: number;
  /** Chance to carry a piece to the wrong cell first. */
  miss: number;
  /** Picks the tray piece at random (true), or the first one (false). */
  random: boolean;
};

export const FIRST_TIMER: Skill = { react: [0.3, 0.4], find: 0.75, carry: 0.75, tap: 0.4, aim: 0.24, miss: 0.08, random: true };
export const CASUAL: Skill = { react: [0.28, 0.38], find: 0.8, carry: 0.65, tap: 0.36, aim: 0.24, miss: 0.12, random: true };
export const STEADY: Skill = { react: [0.25, 0.32], find: 0.42, carry: 0.5, tap: 0.26, aim: 0.14, miss: 0.03, random: false };

function gauss(rng: () => number) {
  const u = Math.max(1e-9, rng()), v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export type BotRun = { seconds: number; stars: number; wrong: number; drops: number; done: boolean };

/** One run of `level` by `skill`, on a phone-sized table (388 × 640). */
export function runBot(level: number, skill: Skill, seed: number): BotRun {
  const rng = makeRng(seed), { n } = planOf(level), layout = layoutFor(388, 640, n), size = layout.board, cell = size / n;
  const ghost = infoOf(level).ghost, world = worldIndex(level);
  // A fainter picture and the look-alike night sky make finding slower.
  const findScale = (1 + (1 - Math.min(1, ghost / 0.34)) * 0.9) * (world === 2 ? 1.35 : 1);
  let play: Play = startPlay(level, layout.slots), seconds = 0, drops = 0;
  const think = () => skill.react[0] + rng() * (skill.react[1] - skill.react[0]);
  for (let guard = 0; guard < 400; guard++) {
    const waiting = play.table.slots.filter(id => id >= 0);
    if (!waiting.length) break;
    const id = skill.random ? waiting[Math.floor(rng() * waiting.length)] : waiting[0];
    const holes = play.table.placed.filter(placed => !placed).length;
    seconds += think() + skill.find * (0.5 + 0.25 * Math.log2(1 + holes)) * findScale;
    // Turn it upright first: one tap to pick it, one per quarter turn.
    if (play.puzzle.rotate && play.table.turns[id] % 4) {
      seconds += skill.tap;
      while (play.table.turns[id] % 4) { play = turnOne(play, id); seconds += skill.tap; }
    }
    if (rng() < skill.miss * (world === 2 ? 1.4 : 1)) {
      const empty = play.table.placed.map((placed, cell) => (placed || cell === id ? -1 : cell)).filter(cell => cell >= 0);
      if (empty.length) {
        const other = empty[Math.floor(rng() * empty.length)];
        const result = dropPiece(play, id, (other % n + 0.5) * cell, (Math.floor(other / n) + 0.5) * cell, size);
        play = result.play; drops++;
        seconds += skill.carry + 0.5 + think();
      }
    }
    for (let attempt = 0; attempt < 6; attempt++) {
      const x = (id % n + 0.5 + gauss(rng) * skill.aim) * cell, y = (Math.floor(id / n) + 0.5 + gauss(rng) * skill.aim) * cell;
      const result = dropPiece(play, id, x, y, size);
      play = result.play; drops++;
      seconds += attempt ? 0.45 : skill.carry;
      if (result.landed === "snap") break;
    }
  }
  const done = play.table.placed.every(Boolean), whole = Math.max(1, Math.round(seconds));
  return { seconds: whole, stars: done ? starsFor(level, whole) : 0, wrong: play.wrong, drops, done };
}

/** Share of `runs` seeded runs that meet `pass`. */
export function rate(level: number, skill: Skill, runs: number, pass: (run: BotRun) => boolean) {
  let hits = 0;
  for (let seed = 1; seed <= runs; seed++) if (pass(runBot(level, skill, seed * 7919 + level))) hits++;
  return hits / runs;
}
