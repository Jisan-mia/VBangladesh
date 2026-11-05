// Headless players for the tests: a careful one (always the RECOMMENDED card), a coin-flip one, and a person (the
// recommended card most of the time, a quarter-second to react). Computer seats pick the way the game makes them pick.
import { makeRng, pick } from "../../../shared/game-core";
import { choose, isBot, levelSetup, makeDice, options, roll, smartPick, startGame, type Game, type Setup } from "../lib/game";
import { BOT_MS, BOT_PICK_MS, DICE_MS, HOLD_MS, HOP_MS, SETTLE_MS, travelMs } from "../lib/motion.hot";
import { rivalPick, styleOf } from "../lib/rivals";

export type Player = "smart" | "random" | "person";
/** A person's reaction before each tap, in ms. */
export const REACT_MS = 280;

/** Plays a whole race and adds up the time it takes on screen (the walk, the jumps, the computers' turns, your taps). */
export function race(setup: Setup, seed: number, player: Player = "smart") {
  const own = seed * 7919 + setup.level, dice = makeDice(own), rng = makeRng(seed * 31 + 7);
  let game: Game = startGame(own, setup), ms = 0;
  while (game.phase !== "over" && game.rolls < 2000) {
    const bot = isBot(setup, game.turn);
    if (game.phase === "choose") {
      ms += bot ? BOT_PICK_MS : REACT_MS;
      const list = options(game, game.die);
      const piece = bot ? rivalPick(game, styleOf(game.turn))
        : player === "smart" || (player === "person" && rng() < 0.85) ? smartPick(game) : list[pick(rng, list.length)];
      game = choose(game, piece);
    } else {
      ms += (bot ? BOT_MS : REACT_MS) + DICE_MS;
      game = roll(game, dice(game.rolls));
      if (game.phase === "choose") continue;
    }
    const move = game.last;
    if (!move || move.stuck) { ms += 240; continue; }
    ms += (move.to - move.from) * HOP_MS + SETTLE_MS + (move.jump >= 0 ? HOLD_MS + travelMs(setup.board, move.jump) : 0);
  }
  return { game, ms };
}

export const levelRace = (level: number, seed: number, player: Player = "smart") => race(levelSetup(level), seed, player);
