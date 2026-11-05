// Headless players for tuning the ladder. Each one reads the mangoes the way a person might:
// - sharp: keeps every row in mind and picks the guess that leaves the fewest codes in the worst case;
// - steady: keeps every row in mind and types any code that still fits;
// - casual: only checks a new guess against the last three rows, and now and then types one that doesn't fit at all.
// On a pair level the first two open with four different digits (nothing else tells as much), as the level's own line advises.
// Time is a person's: thinking before each try (longer when only the basket counts), then five taps (four digits and দেখো).
import { makeRng, pick } from '../../../shared/game-core';
import { poolOf, type Rules } from '../lib/rules';
import { codesFor, fastScore, minimaxGuess, winScore } from '../lib/solver';

export type Bot = { name: string; memory: number; slip: number; minimax: boolean; first: number; think: number; tap: number; probe: boolean };
export const SHARP: Bot = { name: 'sharp', memory: Infinity, slip: 0, minimax: true, first: 0.8, think: 1.6, tap: 0.28, probe: true };
export const STEADY: Bot = { name: 'steady', memory: Infinity, slip: 0, minimax: false, first: 0.9, think: 1.9, tap: 0.3, probe: true };
export const CASUAL: Bot = { name: 'casual', memory: 3, slip: 0.08, minimax: false, first: 1.2, think: 2.6, tap: 0.38, probe: false };

const cache = new Map<string, number[]>();
export function codesOf(rules: Rules) {
  const key = `${rules.digits}|${rules.repeat}`;
  let codes = cache.get(key);
  if (!codes) cache.set(key, codes = codesFor(poolOf(rules.digits), rules.repeat));
  return codes;
}

export type Run = { won: boolean; tries: number; seconds: number };

/** One game of `rules` against `code`, by `bot`, with its own seeded randomness. */
export function playOnce(rules: Rules, code: number, bot: Bot, seed: number): Run {
  const rng = makeRng(seed), all = codesOf(rules), { feedback } = rules, win = winScore(feedback);
  const guesses: number[] = [], scores: number[] = [];
  let candidates: readonly number[] = all, seconds = 0;
  for (let attempt = 0; attempt < rules.tries; attempt++) {
    let guess: number;
    if (bot.memory < Infinity && attempt > bot.memory) {
      const from = guesses.length - bot.memory;
      candidates = all.filter(option => { for (let k = from; k < guesses.length; k++) if (fastScore(option, guesses[k], feedback) !== scores[k]) return false; return true; });
    }
    if (attempt === 0 && bot.probe && rules.repeat) guess = 1234;
    else if (rng() < bot.slip && attempt > 0) guess = all[pick(rng, all.length)];
    else if (bot.minimax && attempt > 0 && candidates.length <= 500) guess = minimaxGuess(candidates, candidates, feedback);
    else guess = candidates[pick(rng, candidates.length)];
    seconds += (attempt ? bot.think : bot.first) * (feedback === 'basket' ? 1.5 : 1) + bot.tap * 5;
    const scored = fastScore(code, guess, feedback);
    guesses.push(guess); scores.push(scored);
    if (scored === win) return { won: true, tries: attempt + 1, seconds };
    if (bot.memory === Infinity || attempt + 1 <= bot.memory) candidates = candidates.filter(option => fastScore(option, guess, feedback) === scored);
  }
  return { won: false, tries: rules.tries, seconds };
}

export type Rates = { clear: number; three: number; two: number; within10: number; median: number };
/** How often `bot` clears, earns ★★★ / ★★ or better, and wins inside 10 s, over `games` codes drawn from the level's codes. */
export function rates(rules: Rules & { three: number; two: number }, bot: Bot, games: number, seed = 1): Rates {
  const all = codesOf(rules), rng = makeRng(seed * 7919);
  let clear = 0, three = 0, two = 0, within10 = 0;
  const times: number[] = [];
  for (let game = 0; game < games; game++) {
    const run = playOnce(rules, all[pick(rng, all.length)], bot, seed * 100_003 + game);
    if (!run.won) continue;
    clear++; times.push(run.seconds);
    if (run.tries <= rules.three) three++;
    if (run.tries <= rules.two) two++;
    if (run.seconds <= 10) within10++;
  }
  times.sort((a, b) => a - b);
  return { clear: clear / games, three: three / games, two: two / games, within10: within10 / games, median: times[Math.floor(times.length / 2)] ?? Infinity };
}
