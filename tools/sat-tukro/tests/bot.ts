// A headless child for সাত টুকরো: a timing model played through the real pure round (lib/game.ts). It picks pieces big first,
// turns them by taps, sometimes drops one in the wrong place, aims with a little error, and keeps a clock so the first win's
// time can be asserted. Same seed, same play.
import { makeRng } from '../../../shared/game-core';
import { drop, flipPiece, newRound, starsOf, tapPiece, type Round } from '../lib/game';
import { AREA, sameTurn, type Pose } from '../lib/tangram';
import { specOf } from '../lib/levels';

export type Skill = { name: string; wrong: number; aim: number; pace: number };
/** wrong: chance a drop goes to a wrong spot (before the picture's own difficulty); aim: units of error; pace: seconds scale. */
export const FIRST: Skill = { name: 'first-timer', wrong: 0.12, aim: 0.3, pace: 1.8 };
export const STEADY: Skill = { name: 'steady', wrong: 0.45, aim: 0.15, pace: 1 };
export const CASUAL: Skill = { name: 'casual', wrong: 1.1, aim: 0.35, pace: 1.4 };

/** Chance of a wrong spot per piece, by how much the picture helps: tinted lines, white lines, faint lines, only the shadow. */
const LINES = { colour: 0.04, plain: 0.1, faint: 0.18, none: 0.28 } as const;

export type Play = { seconds: number; misses: number; stars: number; done: boolean; turns: number };

export function play(level: number, seed: number, skill: Skill, ease = 0): Play {
  const random = makeRng(seed * 7 + level), spec = specOf(level);
  let round: Round = newRound(level, seed, ease), seconds = 0.8 * skill.pace, guard = 0;
  const chance = Math.min(0.9, LINES[spec.lines] * (spec.turns > 0 ? 1.3 : 1) * skill.wrong);
  const noise = () => (random() - 0.5) * 2 * skill.aim;
  while (!round.pieces.every(piece => piece.done) && guard++ < 200) {
    const waiting = round.pieces.filter(piece => !piece.done).sort((a, b) => AREA[b.kind] - AREA[a.kind] || a.id - b.id);
    const piece = waiting[0], spot = round.shown.find(pose => pose.kind === piece.kind);
    if (!spot) break;
    seconds += 0.6 * skill.pace;
    if (random() < chance) {
      // A wrong spot: some other empty spot of the picture, or the same one with the wrong turn forgotten.
      const others = round.shown.filter(pose => pose.kind !== piece.kind);
      const where: Pose = others.length ? others[Math.floor(random() * others.length)] : spot;
      const got = drop(round, piece.id, where.x + noise(), where.y + noise());
      round = got.round; seconds += 0.9 * skill.pace;
      if (got.outcome === 'fit' || got.outcome === 'done') continue;
      continue;
    }
    // Pick it, turn it until it matches, mirror the parallelogram, then carry it to its spot.
    round = tapPiece(round, piece.id).round;
    for (let taps = 0; taps < 10 && !sameTurn(spot, { ...spot, rot: round.pieces[piece.id].rot, flip: round.pieces[piece.id].flip }); taps++) {
      if (piece.kind === 'P' && round.pieces[piece.id].flip !== spot.flip) { round = flipPiece(round, piece.id).round; seconds += 0.7 * skill.pace; }
      else { round = tapPiece(round, piece.id).round; seconds += 0.4 * skill.pace; }
    }
    const got = drop(round, piece.id, spot.x + noise() * 0.6, spot.y + noise() * 0.6);
    round = got.round; seconds += 1.0 * skill.pace;
  }
  return { seconds, misses: round.misses, stars: starsOf(round.misses), done: round.pieces.every(piece => piece.done), turns: round.turned };
}

/** Rates over `runs` seeds: finished, 3★ and ≥2★. */
export function rates(level: number, skill: Skill, runs = 60) {
  let done = 0, three = 0, two = 0, fast = 0;
  for (let seed = 1; seed <= runs; seed++) {
    const got = play(level, seed, skill);
    if (got.done) done++;
    if (got.done && got.stars === 3) three++;
    if (got.done && got.stars >= 2) two++;
    if (got.done && got.seconds <= 10) fast++;
  }
  return { done: done / runs, three: three / runs, two: two / runs, fast: fast / runs };
}
