// Headless players for the difficulty tests. An Oracle knows the whole jam (every position reachable from the start and how
// far each is from clear), so a bot can play thousands of jams without searching. Test-only.
import { makeRng, pick } from "../../../shared/game-core";
import { CELLS, eachSlide, pack, posIn } from "../lib/board";
import { slide, startGame, type Game } from "../lib/game";

export type Oracle = { dist: Map<number, number>; best: (key: number) => number };

const oracles = new Map<string, Oracle>();
export function oracleFor(game: Game): Oracle {
  const id = `${game.legacy}${game.level}`;
  const saved = oracles.get(id);
  if (saved) return saved;
  const { lay } = game, heroMask = (1 << (3 * lay.heroes)) - 1;
  const keys = [pack(lay.start)], index = new Map<number, number>([[keys[0], 0]]), back: number[][] = [[]];
  const pos = lay.start.slice(), grid = new Int8Array(CELLS);
  for (let i = 0; i < keys.length; i++) {
    eachSlide(lay, keys[i], pos, grid, next => {
      let to = index.get(next);
      if (to === undefined) { to = keys.length; index.set(next, to); keys.push(next); back.push([]); }
      back[to].push(i);
    });
  }
  const dist = new Map<number, number>();
  let frontier: number[] = [];
  keys.forEach((key, i) => { if ((key & heroMask) === 0) { dist.set(key, 0); frontier.push(i); } });
  for (let d = 0; frontier.length; d++) {
    const next: number[] = [];
    for (const at of frontier) for (const from of back[at]) if (!dist.has(keys[from])) { dist.set(keys[from], d + 1); next.push(from); }
    frontier = next;
  }
  const oracle: Oracle = { dist, best: key => dist.get(key) ?? Infinity };
  oracles.set(id, oracle);
  return oracle;
}

type Step = { car: number; to: number };
function legal(game: Game): Step[] {
  const found: Step[] = [], pos = game.pos, grid = new Int8Array(CELLS);
  eachSlide(game.lay, pack(pos), pos.slice(), grid, (next, car, to) => { found.push({ car, to }); void next; });
  return found;
}
/** The slide that gets one step closer to clear (any one of them). */
function closer(game: Game, oracle: Oracle, rng: () => number): Step | null {
  const here = oracle.best(pack(game.pos)), good = legal(game).filter(step => {
    const pos = game.pos.slice(); pos[step.car] = step.to;
    return oracle.best(pack(pos)) === here - 1;
  });
  return good.length ? good[pick(rng, good.length)] : null;
}

export type Style = {
  /** Chance each turn of a random legal slide instead of a good one. */
  mistake: number;
  /** Chance of taking back a bad slide at once (needs one `undo`). */
  regret?: number;
  /** Turns before giving up. */
  patience?: number;
};
export const SHARP: Style = { mistake: 0 };
export const CASUAL: Style = { mistake: 0.2, patience: 160 };
export const FIRST_TIMER: Style = { mistake: 0.5, patience: 40 };

/** Plays a jam the way a person might and returns the finished game (won or not) and how many turns it took. */
export function playAs(level: number, style: Style, seed: number, legacy = false) {
  const rng = makeRng(seed);
  let game = startGame(level, legacy);
  const oracle = oracleFor(game);
  let turns = 0;
  for (; !game.won && turns < (style.patience ?? 400); turns++) {
    const wander = rng() < style.mistake;
    const options = legal(game);
    const step = wander ? options[pick(rng, options.length)] : closer(game, oracle, rng);
    if (!step) continue;
    game = slide(game, step.car, step.to) ?? game;
  }
  return { game, turns };
}

export { posIn };
