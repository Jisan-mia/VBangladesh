import assert from 'node:assert/strict';
import test from 'node:test';
import { challengeHash, makeRng, pick, readLevels, unlockedLevel } from '../../../shared/game-core';
import {
  FULL, LEVELS, LEVEL_COUNT, TRIES, WORLD_SIZE, codeFromSeed, codeOf, humanLine, isCode, isOver, migrateLevels, poolOf, rowsOf, rulesOf, score, starsOf, startLevel, submit, triesToNextStar, typeDigit, type Mark, type Play, type Puzzle,
} from '../lib/game';
import { caption, parseShare, puzzleLabel, shareHash } from '../lib/result';

const TODAY = '2026-10-12';
const codesOf = (pool: string) => {
  const out: string[] = [];
  const grow = (start: string) => { if (start.length === 4) { out.push(start); return; } for (const digit of pool) if (!start.includes(digit)) grow(start + digit); };
  grow('');
  return out;
};

/** A careful player: only guesses codes that fit every mango so far, picking the one that leaves the fewest codes in the worst case. Returns tries per code. */
function carefulTries(pool: string) {
  const tries = new Map<string, number>();
  const solve = (candidates: string[], depth: number) => {
    let guess = candidates[0], worst = Infinity;
    if (candidates.length <= 400) for (const option of candidates) {
      const buckets = new Map<string, number>();
      for (const code of candidates) { const key = score(code, option).join(''); buckets.set(key, (buckets.get(key) ?? 0) + 1); }
      const largest = Math.max(...buckets.values());
      if (largest < worst) { worst = largest; guess = option; }
    }
    const split = new Map<string, string[]>();
    for (const code of candidates) { const key = score(code, guess).join(''); split.set(key, [...(split.get(key) ?? []), code]); }
    for (const [key, group] of split) { if (key === 'pppp') tries.set(guess, depth + 1); else solve(group, depth + 1); }
  };
  solve(codesOf(pool), 0);
  return tries;
}

test('levels: 18 in two worlds, each one changing one thing, thresholds in order', () => {
  assert.equal(LEVEL_COUNT, 18);
  assert.equal(LEVEL_COUNT, WORLD_SIZE * 2);
  assert.deepEqual(LEVELS[0], { digits: 5, tries: 7, three: 3, two: 4 }, 'level 1 is the small pad with all seven tries');
  assert.equal(LEVELS.at(-1)!.digits, 10);
  LEVELS.forEach((level, index) => {
    assert.ok(level.digits >= 5 && level.digits <= 10 && level.tries >= 4 && level.tries <= TRIES, `level ${index + 1}`);
    assert.ok(level.three < level.two && level.two <= level.tries, `level ${index + 1}: 3★ < 2★ ≤ tries`);
    if (!index) return;
    const before = LEVELS[index - 1];
    const changes = [level.digits !== before.digits, level.tries !== before.tries, level.three !== before.three || level.two !== before.two];
    assert.ok(level.digits >= before.digits, `level ${index + 1} never takes a key away`);
    assert.ok(level.digits > before.digits || level.tries < before.tries || level.three < before.three || level.two < before.two, `level ${index + 1} is a step up`);
    assert.ok(changes.some(Boolean), `level ${index + 1} changes something`);
  });
});

test('every level is fair: a careful player finds every possible code within its tries', () => {
  const byPool = new Map<number, Map<string, number>>();
  for (const [index, level] of LEVELS.entries()) {
    const tries = byPool.get(level.digits) ?? carefulTries(poolOf(level.digits));
    byPool.set(level.digits, tries);
    const counts = [...tries.values()];
    assert.equal(counts.length, codesOf(poolOf(level.digits)).length, 'every code solved');
    assert.ok(Math.max(...counts) <= level.tries, `level ${index + 1}: worst case ${Math.max(...counts)} tries > ${level.tries}`);
    const threeShare = counts.filter(count => count <= level.three).length / counts.length;
    assert.ok(threeShare >= 0.25, `level ${index + 1}: three stars reachable for a careful player on ${Math.round(threeShare * 100)}% of codes`);
  }
});

test('level codes come only from the level’s pad; full codes are the same as before levels', () => {
  for (let seed = 1; seed <= 400; seed++) {
    for (const digits of [5, 6, 7, 8, 9]) {
      const code = codeFromSeed(seed, digits);
      assert.ok(isCode(code) && [...code].every(digit => poolOf(digits).includes(digit)), `${digits}: ${code}`);
    }
    // The pre-level algorithm, inlined: old seeded links must still open the same code.
    const rng = makeRng(seed), pool = [...'0123456789'];
    let old = '';
    for (let index = 0; index < 4; index++) old += pool.splice(pick(rng, pool.length), 1)[0];
    assert.equal(codeFromSeed(seed), old);
  }
  assert.equal(poolOf(5), '12345');
  assert.equal(poolOf(10), '0123456789');
  assert.deepEqual(rulesOf({ kind: 'day', date: TODAY }), FULL);
  assert.deepEqual(rulesOf({ kind: 'level', level: 99, seed: 1 }), FULL, 'an unknown level falls back to the full rules');
});

test('a level game: keys off the pad are ignored, and it ends after its own number of tries', () => {
  const puzzle: Puzzle = { kind: 'level', level: 3, seed: 77 };
  const code = codeOf(puzzle), wrong = codesOf('12345').find(guess => guess !== code)!;
  let play: Play = { puzzle, guesses: [], input: '' };
  assert.equal(typeDigit(code, play, '9'), play, '৯ is not on level 3’s pad');
  assert.equal(typeDigit(code, play, '0'), play);
  for (let round = 0; round < LEVELS[2].tries; round++) {
    for (const digit of wrong) play = typeDigit(code, play, digit);
    play = submit(code, play);
  }
  assert.equal(play.guesses.length, 5);
  assert.ok(isOver(code, play.guesses, 5));
  assert.equal(typeDigit(code, play, '1'), play, 'nothing after the last try');
  assert.equal(humanLine(rowsOf(code, [...play.guesses.slice(0, 4), code]), 5), 'একদম শেষ বারে! শেষ মুহূর্তে আম পাকল।');
});

test('stars from tries, and the exact gap to the next star', () => {
  const won = (count: number) => [...Array.from({ length: count - 1 }, () => [...'kkap'] as Mark[]), [...'pppp'] as Mark[]];
  // Level 7: three ≤ 3, two ≤ 5.
  assert.equal(starsOf(7, won(2)), 3);
  assert.equal(starsOf(7, won(3)), 3);
  assert.equal(starsOf(7, won(4)), 2);
  assert.equal(starsOf(7, won(5)), 2);
  assert.equal(starsOf(7, won(6)), 1);
  assert.equal(starsOf(7, [[...'kkap'] as Mark[]]), 0, 'not found: no stars');
  assert.equal(triesToNextStar(7, won(6)), 1);
  assert.equal(triesToNextStar(7, won(5)), 2);
  assert.equal(triesToNextStar(7, won(3)), 0);
});

test('opening level and the one-time move of an old best', () => {
  assert.equal(startLevel({}, 1), 1);
  assert.equal(startLevel({ 1: 3, 2: 2 }, 3), 3);
  assert.equal(startLevel({ 1: 3, 2: 2, 3: 3 }, 3), 2, 'the furthest is done with three stars: the first one short of three');
  const moved = migrateLevels(null, '5');
  assert.ok(moved);
  const stars = readLevels(moved, LEVEL_COUNT);
  assert.equal(Object.keys(stars).length, WORLD_SIZE);
  assert.ok(Object.values(stars).every(count => count === 1), 'one star each, never more than was earned');
  assert.equal(unlockedLevel(stars, LEVEL_COUNT), WORLD_SIZE + 1, 'opens আমবাগান');
  assert.equal(migrateLevels('{"1":3}', '5'), null, 'only once: existing levels are left alone');
  assert.equal(migrateLevels(null, null), null, 'a new phone has nothing to move');
  assert.equal(migrateLevels(null, 'abc'), null);
  assert.equal(migrateLevels(null, '0'), null);
});

test('level links round-trip, show the level, and old links still read as before', () => {
  const puzzle: Puzzle = { kind: 'level', level: 4, seed: 4242 };
  const code = codeOf(puzzle), other = codesOf(poolOf(6)).find(guess => guess !== code && score(code, guess).includes('p'))!;
  const rows = rowsOf(code, [other, code]);
  const hash = shareHash({ puzzle, rows, name: 'রাফি' });
  assert.match(hash, /^s=4242&t=2&l=4&r=/);
  assert.deepEqual(parseShare(hash, TODAY), { puzzle, rows, name: 'রাফি' });
  assert.equal(puzzleLabel(puzzle, TODAY), 'লেভেল ৪');
  assert.match(caption({ puzzle, rows, name: '' }, TODAY), /লেভেল ৪: কোডটা ২ বারে/);
  // Old formats: a seeded code (no l), a day and a friend's code still parse exactly as they did.
  const seedRows = rowsOf(codeFromSeed(99), ['0123', codeFromSeed(99)]);
  const oldSeed = challengeHash({ seed: 99, target: 2, extra: { r: seedRows.map(row => row.join('')).join('') } });
  assert.equal(parseShare(oldSeed, TODAY)?.puzzle.kind, 'seed');
  assert.equal(parseShare(`d=${TODAY}&r=${rowsOf(codeOf({ kind: 'day', date: TODAY }), [codeOf({ kind: 'day', date: TODAY })]).flat().join('')}`, TODAY)?.puzzle.kind, 'day');
  assert.equal(parseShare('c=4719', TODAY)?.puzzle.kind, 'code');
  // A lost level game has exactly that level's number of tries.
  const lost = rowsOf(code, Array(LEVELS[3].tries).fill(other));
  assert.ok(parseShare(shareHash({ puzzle, rows: lost, name: '' }), TODAY));
  assert.equal(parseShare(shareHash({ puzzle, rows: lost.slice(1), name: '' }), TODAY), null, 'a loss one try short is not finished');
});

test('level links that could not happen are refused', () => {
  const puzzle: Puzzle = { kind: 'level', level: 1, seed: 5 };
  const code = codeOf(puzzle);
  // With only ১–৫ on the pad, four different digits always share at least three with the code: an all-কাঁচা row is impossible.
  const fake = shareHash({ puzzle, rows: [[...'kkkk'] as Mark[], [...'pppp'] as Mark[]], name: '' });
  assert.equal(parseShare(fake, TODAY), null);
  assert.ok(score(code, '6789').every(mark => mark === 'k'), 'the same row is possible with the full pad, so the level is what refuses it');
  const good = shareHash({ puzzle, rows: rowsOf(code, [code]), name: '' });
  assert.equal(parseShare(good.replace('l=1', 'l=19'), TODAY), null, 'no level 19');
  assert.equal(parseShare(good.replace('l=1', 'l=0'), TODAY), null);
  assert.equal(parseShare(good.replace('l=1', 'l=x'), TODAY), null);
  assert.equal(parseShare(good.replace('t=1', 't=2'), TODAY), null, 'the try count must match the rows');
});
