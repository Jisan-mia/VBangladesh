// A headless player for tuning and fairness tests. It plays the way a thumb does: it can only steer while it holds টান,
// it sees the sky `reaction` seconds late, its feel for the green band is fuzzy, and it sometimes misses a tell.
import { makeRng } from "../../../shared/game-core";
import { createGame, FLY, HI, LO, steerTo, type Game, type Rival } from "../lib/kite";
import type { Mode } from "../lib/levels";
import { stepGame } from "../lib/step.hot";

export type Skill = {
  name: string;
  /** Seconds between looks at the sky (a person's reaction time). */
  reaction: number;
  /** The band it tries to hold in a প্যাঁচ, and how unsure it is of the needle. */
  low: number; high: number; noise: number;
  /** Chance of missing a yank's or a lantern's tell. */
  miss: number;
  /** How far it rubs the strings inside a প্যাঁচ. */
  rub: number;
};
export const SKILLED: Skill = { name: "skilled", reaction: 0.22, low: LO + 0.05, high: HI - 0.07, noise: 0.03, miss: 0.05, rub: 70 };
export const CASUAL: Skill = { name: "casual", reaction: 0.34, low: LO - 0.1, high: HI + 0.1, noise: 0.12, miss: 0.4, rub: 8 };
/** Holds টান the whole time and just chases. */
export const HOLDER: Skill = { name: "holder", reaction: 0.3, low: 2, high: 3, noise: 0, miss: 1, rub: 30 };

const DT = 1 / 60;

function target(game: Game): Rival | null {
  const [a, b] = game.rivals;
  const ok = (r: Rival) => r.state === FLY && r.backoff <= 0;
  if (ok(a) && ok(b)) return Math.hypot(a.x - game.you.x, a.y - game.you.y) < Math.hypot(b.x - game.you.x, b.y - game.you.y) ? a : b;
  return ok(a) ? a : ok(b) ? b : null;
}

export type Outcome = { won: boolean; time: number; lost: number; cuts: number; game: Game };

/** Plays one evening (or `idle`: never touches); null if it hasn't ended in 4 minutes. */
export function play(seed: number, level: number, mode: Mode, skill: Skill | "idle", slow = false): Outcome | null {
  const game = createGame(seed, level, mode);
  const rng = makeRng(seed * 7 + level * 131);
  let look = 0, pull = false, ignoreYank = false, ignoreLantern = false, lastWarn = 0, steps = 0, wiggle = 0;
  while (game.phase !== "over" && steps++ < 60 * 240) {
    // Idle: one touch to start the evening, then hands off.
    if (skill === "idle") { stepGame(game, steps === 1, DT, slow); continue; }
    if ((look -= DT) <= 0) {
      look = skill.reaction * (0.8 + 0.4 * rng());
      const you = game.you;
      if (game.hooked >= 0) {
        const r = game.rivals[game.hooked];
        if (r.yankWarn > 0 && r.yankWarn !== lastWarn) { lastWarn = r.yankWarn; ignoreYank = rng() < skill.miss; }
        const feel = you.t + (rng() * 2 - 1) * skill.noise;
        if (r.yankWarn > 0 && !ignoreYank) pull = false;
        else if (feel < skill.low) pull = true;
        else if (feel > skill.high) pull = false;
        wiggle = -wiggle || 1;
        steerTo(game, game.hookX + wiggle * skill.rub, game.hookY - 40);
      } else {
        const r = target(game);
        if (game.nearLantern >= 0) {
          if (rng() >= skill.miss || !ignoreLantern) {
            const lx = game.lanterns[game.nearLantern * 5];
            steerTo(game, you.x + (you.x > lx ? 80 : -80), you.y - 20); pull = true;
          }
          ignoreLantern = rng() < skill.miss;
        } else if (r && you.state === FLY) {
          // Aim past the rival's string on the far side from your kite; for a runner, low on its string near the roof.
          const along = r.def.dodge ? 0.32 : 0.55;
          const px = r.hx + (r.x - r.hx) * along, py = r.hy + (r.y - r.hy) * along;
          const lx = r.x - r.hx, ly = r.y - r.hy, length = Math.hypot(lx, ly) || 1;
          const side = Math.sign(lx * (you.y - r.hy) - ly * (you.x - r.hx)) || 1;
          steerTo(game, px - (side * -ly / length) * 60, py - (side * lx / length) * 60);
          // To steer a kite you pull; near the green is the best way to meet a প্যাঁচ.
          pull = you.t < skill.high || rng() < 0.3;
        } else pull = you.t < skill.low;
      }
    }
    stepGame(game, pull, DT, slow);
  }
  return game.phase === "over" ? { won: game.won, time: game.time, lost: game.lost, cuts: game.cuts, game } : null;
}

export const percentile = (sorted: number[], p: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
