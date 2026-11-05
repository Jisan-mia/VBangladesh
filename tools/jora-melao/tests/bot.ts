// A headless player for the difficulty tests. It plays the real rules (lib/play.ts) the way a person plays a memory game:
// it holds the last few cards it saw in mind (`span`), reads some of the peek, follows the birds with a chance, mixes up
// look-alikes now and then, and sometimes overlooks a pair it knew. Taps cost human time. Seeded, so the rates are exact.
import { makeRng, pick } from "../../../shared/game-core";
import { begin, endPeek, flip, newGame, settle, type Game } from "../lib/play";
import type { Spec } from "../lib/levels";
import { PICTURES } from "../lib/pictures";

/** `span` cards held in mind, `slip` chance to overlook a known pair, `read` cards read per second of peek, `follow` chance to keep track of a flown card, `mix` chance to take a twin for its look-alike, `tap` seconds a card costs. */
export type Skill = { span: number; slip: number; read: number; follow: number; mix: number; tap: number };
export const PLAYERS = {
  casual: { span: 4, slip: 0.15, read: 1.8, follow: 0.4, mix: 0.25, tap: 0.55 },
  steady: { span: 6, slip: 0.08, read: 3, follow: 0.6, mix: 0.15, tap: 0.45 },
  sharp: { span: 10, slip: 0.02, read: 5, follow: 0.85, mix: 0.05, tap: 0.35 },
} as const satisfies Record<string, Skill>;

export type Played = { game: Game; seconds: number };

/** What a twin looks like to a careless eye: its look-alike base. */
const family = (id: number) => PICTURES[id].twinOf >= 0 ? PICTURES[id].twinOf : id;

export function play(seed: number, spec: Spec, skill: Skill): Played {
  const rng = makeRng(seed * 977 + 13);
  let game = begin(newGame(seed, spec, 1));
  let memory: { place: number; saw: number }[] = [];
  // A first look can mix up a twin with its look-alike; looking again (a miss shows both) sets it straight.
  const hold = (place: number, again = false) => {
    const real = game.board[place], known = memory.find(entry => entry.place === place);
    if (known) { if (again) known.saw = real; return; }
    memory.push({ place, saw: rng() < skill.mix ? family(real) : real });
    if (memory.length > skill.span) memory.shift();
  };
  const forget = (...places: number[]) => { memory = memory.filter(entry => !places.includes(entry.place)); };
  // The face-up pair at the start, or the peek.
  if (game.demo) for (const place of game.demo) hold(place);
  if (game.phase === "peek") {
    const order = game.board.map((_, place) => place).sort(() => rng() - 0.5);
    for (const place of order.slice(0, Math.floor(skill.read * game.spec.peek))) hold(place);
    game = endPeek(game);
  }
  let flips = 0, misses = 0;
  for (let guard = 0; game.phase === "play" && guard < 4000; guard++) {
    if (game.open.length === 2) {
      game = settle(game);
      for (let i = 0; i < game.flown.length; i += 2) {
        const a = game.flown[i], b = game.flown[i + 1];
        if (rng() < skill.follow) {
          for (const entry of memory) if (entry.place === a) entry.place = b; else if (entry.place === b) entry.place = a;
        } else forget(a, b);
      }
    }
    const open = game.board.map((_, place) => place).filter(place => game.found[place] < 0);
    let first = -1, second = -1;
    if (rng() >= skill.slip) {
      outer: for (const x of memory) for (const y of memory) if (x.place < y.place && x.saw === y.saw && game.found[x.place] < 0 && game.found[y.place] < 0) { first = x.place; second = y.place; break outer; }
    }
    if (first < 0) {
      const fresh = open.filter(place => !memory.some(entry => entry.place === place));
      const pool = fresh.length ? fresh : open;
      first = pool[pick(rng, pool.length)];
    }
    game = flip(game, first); flips++;
    hold(first);
    if (second < 0) {
      const saw = memory.find(entry => entry.place === first)!.saw;
      const known = memory.find(entry => entry.place !== first && entry.saw === saw && game.found[entry.place] < 0);
      if (known) second = known.place;
      else {
        const fresh = open.filter(place => place !== first && !memory.some(entry => entry.place === place));
        const pool = fresh.length ? fresh : open.filter(place => place !== first);
        second = pool[pick(rng, pool.length)];
      }
    }
    const before = game.moves;
    game = flip(game, second); flips++;
    if (game.moves === before) throw new Error("the bot's second flip did nothing");
    hold(second);
    if (game.last === "match") forget(first, second);
    else { misses++; hold(first, true); hold(second, true); }
  }
  return { game, seconds: flips * skill.tap + misses * 0.5 };
}
