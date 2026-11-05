// Challenge links. Server-safe: share.ts loads this. Every link is replayed from the start, so the score and the moves
// are proven, never claimed.
//
// Old links (before the rewrite, no `v`), still parsed and replayed on the old level table:
//   #s=<the level's seed>&t=<score>&l=<level>&m=<moves, two characters each>&n=<name>
// New links add v=2 (the new ladder), d=<e|h> for a mode (none: স্বাভাবিক) and p=<1..3> for the finale's gift.
import { challengeHash, cleanName, readChallenge } from "../../../shared/game-core";
import { isFinale, isLevel, isMode } from "./ladder";
import { createGame, encodeMoves, replay, specOf, starsOf, type Game, type Run } from "./rules";

export const MAX_SCORE = 999_999;

/** A cleared level, proven by replaying its moves. */
export type Shared = Run & { score: number; count: number; moves: string; stars: number; name: string };

export function parseShared(hash: string): Shared | null {
  const read = readChallenge(hash, { maxTarget: MAX_SCORE, extraKeys: ["l", "m", "v", "d", "p"] });
  if (!read) return null;
  const { l, m, v, d, p } = read.extra;
  if (v !== undefined && v !== "2") return null;
  const version = v === "2" ? 2 : 1;
  if (version === 1 && (d !== undefined || p !== undefined)) return null;
  if (d === "n" || (d !== undefined && !isMode(d)) || (p !== undefined && !/^[1-3]$/.test(p))) return null;
  if (l === undefined || !/^[1-9]\d?$/.test(l) || !isLevel(Number(l)) || m === undefined || !/^[A-Za-z0-9_-]{2,120}$/.test(m)) return null;
  const run: Run = { v: version, level: Number(l), mode: isMode(d) ? d : "n", gift: p === undefined ? 0 : Number(p) };
  if (run.gift > 0 && !isFinale(run.level)) return null;
  if (specOf(run).seed !== read.seed) return null;
  const game = replay(run, m);
  return game && game.score === read.target ? fromGame(game, read.name) : null;
}

export function sharedHash(shared: Pick<Shared, "v" | "level" | "mode" | "gift" | "score" | "moves"> & { name?: string }) {
  const { v, level, mode, gift, score, moves } = shared;
  const extra: Record<string, string | number> = v === 2 ? { v: 2, l: level, m: moves } : { l: level, m: moves };
  if (v === 2 && mode !== "n") extra.d = mode;
  if (v === 2 && gift > 0) extra.p = gift;
  return challengeHash({ seed: specOf(shared).seed, target: score, name: shared.name, extra });
}

/** Only a cleared level makes a link. */
export function fromGame(game: Game, name: string): Shared | null {
  if (!game.won || !game.moves.length) return null;
  return { ...game.run, score: game.score, count: game.moves.length, moves: encodeMoves(game.moves), stars: starsOf(game), name: cleanName(name) };
}

/** The same level, mode and gift? A friend's result belongs to a run only then. */
export const sameRun = (a: Run, b: Run) => a.v === b.v && a.level === b.level && a.mode === b.mode && a.gift === b.gift;
export { createGame };
