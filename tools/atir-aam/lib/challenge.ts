// Challenge links. Server-safe: share.ts loads this. Every link is replayed from the start, so the score, the stage and
// the move count are proven, never claimed.
//
// Old links (before the rewrite, no `v`), still parsed and replayed on the old rules:
//   the garden  #s=<seed>&t=<score>&c=<moves>&m=<moves, three a character>&n=<name>
//   a level     #l=<level>&t=<moves>&m=…&n=…
// New links add v=2, d=<e|h> for a mode (none: স্বাভাবিক), and p=<the মালির থলে picks> in the garden.
import { cleanName, MAX_SEED } from "../../../shared/game-core";
import type { Dir } from "./board";
import { isLevel, isMode, type Mode } from "./levels";
import { createGame, playMoves, starsOf, type Game, type Run } from "./rules";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
export const MAX_LINK_MOVES = 4500;

export function encodeMoves(moves: readonly Dir[]) {
  let text = "";
  for (let i = 0; i < moves.length; i += 3) text += CHARS[(moves[i] << 4) | ((moves[i + 1] ?? 0) << 2) | (moves[i + 2] ?? 0)];
  return text;
}
/** The `count` moves in `text`, or null unless it is written exactly the way encodeMoves writes it. */
export function decodeMoves(text: string, count: number): Dir[] | null {
  if (!Number.isInteger(count) || count < 1 || count > MAX_LINK_MOVES || text.length !== Math.ceil(count / 3)) return null;
  const moves: Dir[] = [];
  for (const char of text) {
    const code = CHARS.indexOf(char);
    if (code < 0) return null;
    moves.push((code >> 4) as Dir, ((code >> 2) & 3) as Dir, (code & 3) as Dir);
  }
  if (moves.slice(count).some(dir => dir !== 0)) return null;
  return moves.slice(0, count);
}

/** A finished run, proven by replay. */
export type Shared = Run & { moves: string; count: number; picks: string; score: number; top: number; stars: number; name: string };

export function parseShared(hash: string): Shared | null {
  if (hash.length > 2000) return null;
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const v = params.get("v"), level = params.get("l"), target = params.get("t") ?? "", text = params.get("m") ?? "";
  const name = cleanName(params.get("n") ?? ""), mode = params.get("d") ?? "n", picks = params.get("p") ?? "";
  if (v !== null && v !== "2") return null;
  const version = v === "2" ? 2 : 1;
  if (version === 1 && (params.has("d") || params.has("p"))) return null;
  if (!isMode(mode) || (params.has("d") && mode === "n")) return null;
  if (level !== null) {
    if (!/^[1-9]\d?$/.test(level) || !isLevel(Number(level)) || !/^[1-9]\d{0,3}$/.test(target) || params.has("p")) return null;
    const run: Run = { v: version, kind: "level", level: Number(level), seed: 0, mode };
    const dirs = decodeMoves(text, Number(target));
    const game = dirs && playMoves(createGame(run), dirs);
    return game ? fromGame(game, name) : null;
  }
  const seed = params.get("s") ?? "", count = params.get("c") ?? "";
  if (!/^[1-9]\d{0,8}$/.test(seed) || Number(seed) > MAX_SEED || !/^(0|[1-9]\d{0,6})$/.test(target) || !/^[1-9]\d{0,3}$/.test(count) || !/^[0-3]{0,5}$/.test(picks)) return null;
  const run: Run = { v: version, kind: "garden", level: 0, seed: Number(seed), mode };
  const dirs = decodeMoves(text, Number(count));
  const game = dirs && playMoves(createGame(run), dirs, picks);
  return game && game.score === Number(target) ? fromGame(game, name) : null;
}

export function sharedHash(shared: Pick<Shared, "v" | "kind" | "level" | "seed" | "mode" | "moves" | "count" | "picks" | "score"> & { name?: string }) {
  const { v, kind, level, seed, mode, moves, count, picks, score } = shared;
  const params = new URLSearchParams();
  if (v === 2) params.set("v", "2");
  if (kind === "level") { params.set("l", String(level)); params.set("t", String(count)); params.set("m", moves); }
  else { params.set("s", String(seed)); params.set("t", String(score)); params.set("c", String(count)); params.set("m", moves); if (v === 2 && picks) params.set("p", picks); }
  if (v === 2 && mode !== "n") params.set("d", mode);
  const clean = cleanName(shared.name ?? "");
  if (clean) params.set("n", clean);
  return params.toString();
}

/** What a link can carry: a cleared level, or any garden run with at least one move. */
export function fromGame(game: Game, name: string): Shared | null {
  if (!game.moves.length || game.moves.length > MAX_LINK_MOVES || (game.run.kind === "level" && !game.won)) return null;
  return {
    ...game.run, seed: game.run.kind === "garden" ? game.run.seed : 0, moves: encodeMoves(game.moves), count: game.moves.length,
    picks: game.picks, score: game.score, top: game.top, stars: starsOf(game), name: cleanName(name),
  };
}
export const sameRun = (a: Run, b: Run) => a.v === b.v && a.kind === b.kind && a.level === b.level && a.mode === b.mode && (a.kind === "level" || a.seed === b.seed);
export type { Mode };
