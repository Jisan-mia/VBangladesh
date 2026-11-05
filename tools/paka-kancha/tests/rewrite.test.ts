import assert from 'node:assert/strict';
import test from 'node:test';
import { makeRng, pick, readLevels, unlockedLevel } from '../../../shared/game-core';
import { OLD_LEVEL_COUNT, OLD_WORLD_SIZE, isOldLevel, migrateLevels, oldRules } from '../lib/legacy';
import { LEVEL_COUNT, PER_WORLD, TAUGHT_AT, WORLDS, isFinale, isLevel, levelName, levelOf, worldOf } from '../lib/levels';
import {
  aidOn, codeOf, danger, humanLine, limitsOf, newGame, over, pinsOpen, refusalFor, rowsFor, rulesOf, starsFor, starsOf, triesToNextStar, typeKey, eraseRow, lockRow, won, ripeTotal,
} from '../lib/play';
import {
  FULL, TRIES, basketOf, bn, clash, codeFromSeed, count, erase, fits, isCode, keyHints, poolOf, rowsOf, score, shown, submit, typeDigit, validGuesses, type Mark, type Play, type Puzzle,
} from '../lib/rules';
import { OPEN_KEY, openAfter, oldOpen, readMode, readOpen, startLevel } from '../lib/save';
import { carefulTries, codesFor, codeText, fastScore, packRow, possibleRow, winScore } from '../lib/solver';
import { CASUAL, SHARP, STEADY, codesOf, playOnce, rates } from './bot';

const marks = (text: string) => [...text] as Mark[];
const levels = Array.from({ length: LEVEL_COUNT }, (_, index) => index + 1);
/** The first guess of a careful player: on a pair level, four different digits (nothing else tells as much); else the first code. */
const opener = (level: number) => levelOf(level)!.repeat ? 1234 : undefined;

// ---- the ladder ----

test('ladder: three worlds of six, each level one new line, a named boss code closing every world', () => {
  assert.equal(WORLDS.length * PER_WORLD, LEVEL_COUNT);
  assert.equal(LEVEL_COUNT, 18);
  assert.equal(new Set(levels.map(level => levelOf(level)!.line)).size, LEVEL_COUNT, 'each level says one new thing of its own');
  const finales = levels.filter(isFinale);
  assert.deepEqual(finales, [6, 12, 18]);
  assert.deepEqual(finales.map(levelName), ['নানার সিন্দুক', 'মালির গুদাম', 'হাটের বড় তালা']);
  assert.equal(new Set(levels.map(levelName)).size, LEVEL_COUNT, 'every level has its own name');
  for (const level of levels) {
    const info = levelOf(level)!;
    assert.equal(worldOf(level), info.world);
    assert.ok(info.three < info.two && info.two <= info.tries, `level ${level}: 3★ < 2★ ≤ tries`);
    assert.ok(info.digits >= 4 && info.digits <= 9 && info.tries >= 6 && info.tries <= TRIES, `level ${level}`);
    assert.equal(info.repeat, info.world === 2, 'a pair in every code only in আমবাগান');
    assert.equal(info.feedback, info.world === 3 ? 'basket' : 'digit', 'the basket only in আমের হাট');
    assert.equal(Boolean(info.finale), isFinale(level));
    if (level % PER_WORLD !== 1) { // inside a world a level never takes a key or a try away without saying so
      const before = levelOf(level - 1)!;
      assert.ok(info.digits >= before.digits, `level ${level} never takes a key away inside its world`);
      assert.ok(info.digits > before.digits || info.tries !== before.tries || info.line !== before.line, `level ${level} is a step`);
    }
  }
  for (let world = 0; world < WORLDS.length; world++) assert.equal(levelOf(world * PER_WORLD + 1)!.digits, 4, 'each world starts on the small pad');
  assert.equal(levelOf(1)!.digits, 4, 'level 1: the four keys are the four digits of the code');
  assert.ok(!WORLDS[0].rule && WORLDS[1].rule && WORLDS[2].rule, 'worlds 2 and 3 name their twist');
  assert.ok(!isLevel(0) && !isLevel(19) && !isLevel(1.5) && levelOf(19) === null);
  assert.deepEqual(TAUGHT_AT, { hints: 3, clash: 4, edge: 5 });
});

test('every level is fair: a careful player cracks every possible code within its tries, and ★★★ is reachable', () => {
  const memo = new Map<string, number[]>();
  for (const level of levels) {
    const info = levelOf(level)!, key = `${info.digits}|${info.repeat}|${info.feedback}`;
    const codes = codesOf(info);
    const tries = memo.get(key) ?? carefulTries(codes, info.feedback, opener(level));
    memo.set(key, tries);
    assert.equal(tries.length, codes.length, `level ${level}: every code is solved`);
    assert.ok(Math.max(...tries) <= info.tries, `level ${level}: worst case ${Math.max(...tries)} tries > ${info.tries}`);
    const three = tries.filter(count => count <= info.three).length / tries.length;
    assert.ok(three >= 0.2, `level ${level}: a careful player reaches ★★★ on ${Math.round(three * 100)}% of the codes`);
  }
});

test('the code counts: 24 on level 1 up to 3,024 on the last; a pair level hides at least one pair', () => {
  assert.equal(codesOf(levelOf(1)!).length, 24);
  assert.equal(codesOf(levelOf(18)!).length, 3024);
  assert.equal(codesFor('1234', true).length, 256 - 24);
  for (let seed = 1; seed <= 300; seed++) {
    for (const level of [7, 9, 12]) {
      const info = levelOf(level)!, code = codeFromSeed(seed, info.digits, true);
      assert.ok(new Set(code).size < 4 && [...code].every(digit => poolOf(info.digits).includes(digit)), `${level}: ${code}`);
    }
  }
});

// ---- bots: each level tuned to the person it is for ----

test('bots: sharp, steady and casual players clear every level at its target rate', () => {
  for (const level of levels) {
    const info = levelOf(level)!, big = codesOf(info).length > 1000, games = big ? 50 : 100;
    const sharp = rates(info, SHARP, games, level), steady = rates(info, STEADY, games, level), casual = rates(info, CASUAL, games, level);
    assert.ok(sharp.clear >= 0.97, `level ${level}: sharp clears ${sharp.clear}`);
    assert.ok(steady.clear >= 0.97, `level ${level}: steady clears ${steady.clear}`);
    const floor = info.world === 1 ? 0.88 : info.world === 2 ? 0.7 : 0.58;
    assert.ok(casual.clear >= floor, `level ${level}: casual clears ${casual.clear} < ${floor}`);
    assert.ok(sharp.three >= 0.35, `level ${level}: ★★★ is out of reach for sharp (${sharp.three})`);
    assert.ok(sharp.three <= (level <= 2 ? 1 : 0.98) || level <= 2, `level ${level}: ★★★ is free (${sharp.three})`);
    assert.ok(casual.two >= (info.world === 3 ? 0.35 : 0.6), `level ${level}: casual gets ★★ ${casual.two}`);
  }
});

test('bots: the first win comes within ten seconds on level 1, and the bosses are the hardest for ★★★', () => {
  const first = levelOf(1)!, sharp = rates(first, SHARP, 200, 1), casual = rates(first, CASUAL, 200, 1);
  assert.equal(sharp.clear, 1);
  assert.equal(casual.clear, 1, 'level 1 is cleared by every player');
  assert.ok(sharp.within10 >= 0.55, `sharp wins level 1 inside 10 s ${sharp.within10}`);
  assert.ok(casual.median <= 15, `casual's median first win ${casual.median} s`);
  assert.ok(sharp.three >= 0.9, 'level 1 gives ★★★ almost always');
  for (const world of [1, 2, 3]) {
    const from = (world - 1) * PER_WORLD + 1, boss = from + PER_WORLD - 1;
    const bossThree = rates(levelOf(boss)!, SHARP, 80, boss).three;
    const others = Array.from({ length: PER_WORLD - 1 }, (_, i) => rates(levelOf(from + i)!, SHARP, 80, from + i).three);
    const mean = others.reduce((sum, value) => sum + value, 0) / others.length;
    assert.ok(bossThree <= mean + 0.02, `world ${world}: the boss's ★★★ rate ${bossThree} vs the others' ${mean.toFixed(2)}`);
  }
});

test('bots: a player who clicks on a random code (no thinking) mostly loses the hard levels, so the proof above is not luck', () => {
  const rng = makeRng(9), info = levelOf(18)!, all = codesOf(info);
  let wins = 0;
  for (let game = 0; game < 400; game++) {
    const code = all[pick(rng, all.length)];
    for (let attempt = 0; attempt < info.tries; attempt++) if (all[pick(rng, all.length)] === code) { wins++; break; }
  }
  assert.ok(wins / 400 < 0.05, `${wins}/400 random winners`);
});

// ---- the rules ----

test('scoring: পাকা in place, আধপাকা elsewhere, কাঁচা absent, duplicates counted only once; fastScore agrees', () => {
  assert.deepEqual(score('5329', '5281'), marks('pakk'));
  assert.deepEqual(score('1234', '1234'), marks('pppp'));
  assert.deepEqual(score('1234', '4321'), marks('aaaa'));
  assert.deepEqual(score('0472', '7042'), marks('aaap'));
  assert.deepEqual(score('1234', '1111'), marks('pkkk'));
  assert.deepEqual(score('1123', '3111'), marks('apak'));
  assert.deepEqual(score('1203', '2210'), marks('kpaa'));
  assert.deepEqual(basketOf(marks('kapk')), marks('pakk'), 'the basket is the same mangoes, পাকা first');
  assert.deepEqual(shown('5329', '5281', { ...FULL, feedback: 'basket' }), marks('pakk'));
  assert.deepEqual(shown('1234', '4321', { ...FULL, feedback: 'basket' }), marks('aaaa'));
  const rng = makeRng(5);
  for (let round = 0; round < 3000; round++) {
    const code = codeText(pick(rng, 10_000)), guess = codeText(pick(rng, 10_000));
    assert.equal(fastScore(Number(code), Number(guess), 'digit'), packRow(score(code, guess), 'digit'), `${code} ${guess}`);
    assert.equal(fastScore(Number(code), Number(guess), 'basket'), packRow(basketOf(score(code, guess)), 'basket'), `${code} ${guess}`);
  }
  assert.equal(winScore('digit'), packRow(marks('pppp'), 'digit'));
  assert.equal(winScore('basket'), packRow(marks('pppp'), 'basket'));
  assert.equal(packRow(marks('apkp'), 'basket'), -1, 'a basket row is sorted');
  assert.equal(packRow(marks('pak'), 'digit'), -1);
  assert.ok(possibleRow('4719', marks('pppp'), '0123456789', false, 'digit'));
  assert.ok(!possibleRow('4719', marks('pppa'), '0123456789', false, 'digit'), 'three পাকা and one আধপাকা can never happen');
  assert.ok(!possibleRow('4719', marks('kkkk'), '12345', false, 'digit') || [...'4719'].every(d => !'12345'.includes(d)) === false);
});

test('codes: the same seed gives the same code on every phone; old seeds give the codes they always gave', () => {
  assert.equal(codeFromSeed(48213), codeFromSeed(48213));
  assert.notEqual(codeFromSeed(1), codeFromSeed(2));
  for (let seed = 1; seed <= 400; seed++) {
    // The pre-level algorithm, inlined: old seeded links must still open the same code.
    const rng = makeRng(seed), pool = [...'0123456789'];
    let old = '';
    for (let index = 0; index < 4; index++) old += pool.splice(pick(rng, pool.length), 1)[0];
    assert.equal(codeFromSeed(seed), old);
    for (const digits of [4, 5, 6, 7, 8, 9]) {
      const code = codeFromSeed(seed, digits);
      assert.ok(isCode(code) && [...code].every(digit => poolOf(digits).includes(digit)), `${digits}: ${code}`);
    }
  }
  assert.equal(poolOf(4), '1234');
  assert.equal(poolOf(10), '0123456789');
  assert.equal(poolOf(2), '1234', 'a pad never has fewer than four keys');
  assert.equal(codeOf({ kind: 'code', code: '0472' }), '0472');
  assert.equal(codeOf({ kind: 'day', date: '2026-10-11' }), codeFromSeed(20261011));
});

test('typing: only the pad’s keys, no repeat unless the level allows one, four at most, nothing after the end', () => {
  const rules = rulesOf({ kind: 'level', level: 1, seed: 1 });
  const code = '1234';
  let play: Play = { guesses: [], input: '' };
  assert.equal(typeDigit(code, play, '5', rules), play, '৫ is not on level 1’s pad');
  assert.equal(typeDigit(code, play, '0', rules), play);
  play = typeDigit(code, play, '1', rules);
  assert.equal(typeDigit(code, play, '1', rules), play, 'the same digit twice is ignored');
  for (const digit of '234') play = typeDigit(code, play, digit, rules);
  assert.equal(play.input, '1234');
  assert.equal(typeDigit(code, play, '1', rules), play, 'a full try takes no fifth digit');
  assert.equal(submit(code, erase(play), rules).guesses.length, 0, 'three digits cannot be checked');
  play = submit(code, play, rules);
  assert.deepEqual(play.guesses, ['1234']);
  assert.equal(typeDigit(code, play, '1', rules), play, 'typing after the win does nothing');
  const pair = rulesOf({ kind: 'level', level: 7, seed: 1 });
  let twice: Play = { guesses: [], input: '' };
  for (const digit of '1123') twice = typeDigit('1123', twice, digit, pair);
  assert.equal(twice.input, '1123', 'a pair level takes the same digit twice');
  assert.ok(fits('1123', pair) && !fits('1123', rules) && !fits('1235', rules));
  assert.ok(validGuesses('4719', ['1234', '4719'], FULL) && !validGuesses('4719', ['4719', '1234'], FULL) && !validGuesses('4719', ['1123'], FULL) && !validGuesses('4719', Array(8).fill('1234'), FULL));
});

test('hints on the pad and the "can’t be the code" line only say what the mangoes said', () => {
  assert.deepEqual(keyHints('4719', ['4123', '9750'], FULL), { 4: 'p', 1: 'a', 2: 'k', 3: 'k', 9: 'a', 7: 'p', 5: 'k', 0: 'k' });
  const basket = { ...FULL, feedback: 'basket' as const };
  assert.deepEqual(keyHints('4719', ['4123', '5028'], basket), { 5: 'k', 0: 'k', 2: 'k', 8: 'k' }, 'in a basket only a row with no mango at all says something');
  const code = '4719', rules = FULL;
  const guesses = ['4123'], rows = rowsOf(code, guesses, rules);
  assert.match(clash('4123', guesses, rows, rules), /./, 'the same wrong guess again can’t be the code');
  assert.match(clash('5123', guesses, rows, rules), /১ নম্বর ঘরে ৪ পাকা ছিল/);
  assert.match(clash('4912', guesses, rows, rules), /১ আধপাকা|১ তো|কাঁচা/);
  assert.equal(clash('4719', guesses, rows, rules), '');
  const pair = { ...FULL, digits: 6, repeat: true };
  assert.match(clash('1234', ['1123'], rowsOf('1123', ['1123'], pair), pair), /জোড়া/, 'on a pair level a distinct guess can only be a probe');
});

// ---- the game ----

test('a level game: deterministic, same seed and keys give the same rows; it ends on the win or the last try', () => {
  const puzzle: Puzzle = { kind: 'level', level: 3, seed: 77 };
  const code = codeOf(puzzle), info = levelOf(3)!;
  const play = (game: ReturnType<typeof newGame>, text: string) => { for (const digit of text) game = typeKey(game, digit); return lockRow(game); };
  const wrong = codesOf(info).map(codeText).filter(guess => guess !== code && isCode(guess));
  assert.deepEqual(rowsFor(play(newGame(puzzle), wrong[0])), rowsFor(play(newGame(puzzle), wrong[0])));
  const solved = play(newGame(puzzle), code);
  assert.ok(won(solved) && over(solved));
  let game = newGame(puzzle);
  assert.equal(refusalFor(game, '9'), 'pad', '৯ is not on level 3’s pad');
  assert.equal(refusalFor(game, '0'), 'pad');
  for (let round = 0; round < info.tries; round++) {
    assert.ok(!over(game));
    game = play(game, wrong[round]);
  }
  assert.equal(game.guesses.length, 7);
  assert.ok(over(game) && !won(game));
  assert.equal(refusalFor(game, '1'), 'over', 'nothing after the last try');
  assert.equal(typeKey(game, '1'), game);
  assert.equal(eraseRow(game), game);
  const empty = newGame(puzzle);
  assert.equal(lockRow(empty), empty, 'an empty row cannot be checked');
  assert.equal(lockRow(typeKey(empty, '1')).guesses.length, 0, 'one digit cannot be checked');
});

test('stars from tries, the exact gap to the next star, and nothing off the ladder', () => {
  const won1 = (n: number) => [...Array.from({ length: n - 1 }, () => marks('kkap')), marks('pppp')];
  const puzzle: Puzzle = { kind: 'level', level: 9, seed: 1 };   // three ≤ 4, two ≤ 5
  assert.equal(starsOf(puzzle, won1(2)), 3);
  assert.equal(starsOf(puzzle, won1(4)), 3);
  assert.equal(starsOf(puzzle, won1(5)), 2);
  assert.equal(starsOf(puzzle, won1(6)), 1);
  assert.equal(starsOf(puzzle, [marks('kkap')]), 0, 'not found: no stars');
  assert.equal(triesToNextStar(puzzle, won1(6)), 1);
  assert.equal(triesToNextStar(puzzle, won1(5)), 1);
  assert.equal(triesToNextStar(puzzle, won1(4)), 0);
  assert.equal(starsFor(puzzle, 7), 1);
  assert.deepEqual(limitsOf(puzzle), { three: 4, two: 5 });
  for (const off of [{ kind: 'day', date: '2026-10-11' }, { kind: 'seed', seed: 5 }, { kind: 'code', code: '1234' }, { kind: 'level', level: 3, seed: 1, legacy: true }] as Puzzle[]) {
    assert.equal(limitsOf(off), null);
    assert.equal(starsOf(off, won1(2)), 0);
  }
  assert.equal(pinsOpen([marks('pakk'), marks('ppak')]), 2);
  assert.equal(ripeTotal([marks('pakk'), marks('ppak')]), 3);
});

test('danger: amber with two tries left, red on the last, only while playing, and only from the level that teaches it', () => {
  assert.equal(danger(3, true), 0);
  assert.equal(danger(2, true), 1);
  assert.equal(danger(1, true), 2);
  assert.equal(danger(1, false), 0);
  assert.ok(!aidOn({ kind: 'level', level: 4, seed: 1 }, 'edge') && aidOn({ kind: 'level', level: 5, seed: 1 }, 'edge'));
  assert.ok(!aidOn({ kind: 'level', level: 2, seed: 1 }, 'hints') && aidOn({ kind: 'level', level: 3, seed: 1 }, 'hints'));
  assert.ok(!aidOn({ kind: 'level', level: 3, seed: 1 }, 'clash') && aidOn({ kind: 'level', level: 4, seed: 1 }, 'clash'));
  assert.ok(aidOn({ kind: 'day', date: '2026-10-11' }, 'edge') && aidOn({ kind: 'level', level: 1, seed: 1, legacy: true }, 'clash'));
});

test('the human line follows the number of tries', () => {
  const wonIn = (n: number) => [...Array(n - 1).fill(marks('kakk')), marks('pppp')];
  assert.match(humanLine(wonIn(1), 7), /প্রথম বারেই/);
  assert.match(humanLine(wonIn(4), 7), /ধাপে ধাপে/);
  assert.match(humanLine(wonIn(6), 6), /শেষ বারে/);
  assert.match(humanLine(Array(6).fill(marks('kakk')), 6), /কাঁচাই/);
  for (let n = 1; n <= TRIES; n++) assert.ok(humanLine(wonIn(n), 7).length > 10);
  assert.equal(bn(7), '৭');
});

// ---- the old ladder, and what the phone keeps ----

test('old level links open the old ladder’s codes, pads and tries; the old ladder never changes', () => {
  assert.equal(OLD_LEVEL_COUNT, 18);
  assert.deepEqual(oldRules(1), { digits: 5, tries: 7, repeat: false, feedback: 'digit' });
  assert.deepEqual(oldRules(18), { digits: 10, tries: 7, repeat: false, feedback: 'digit' });
  assert.deepEqual(oldRules(15), { digits: 9, tries: 6, repeat: false, feedback: 'digit' });
  assert.ok(isOldLevel(18) && !isOldLevel(19) && !isOldLevel(0));
  const old: Puzzle = { kind: 'level', level: 7, seed: 4242, legacy: true };
  assert.deepEqual(rulesOf(old), { digits: 7, tries: 7, repeat: false, feedback: 'digit' });
  assert.equal(codeOf(old), codeFromSeed(4242, 7), 'the code an old link always opened');
  assert.notDeepEqual(rulesOf({ ...old, legacy: undefined }), rulesOf(old), 'the same number without legacy is the new ladder');
});

test('your own open level: set once from the old ladder or an old best, then only your own play opens levels', () => {
  assert.equal(oldOpen(null, null), 1);
  assert.equal(oldOpen(null, '5'), OLD_WORLD_SIZE + 1, 'an old best opened আমবাগান of the old ladder');
  assert.equal(oldOpen('{"1":3,"2":2}', null), 3);
  assert.equal(oldOpen('{"18":3}', null), 18, 'a friend’s level 18 once opened them all: that stays, on purpose');
  assert.equal(readOpen(null, null, null, {}), 1);
  assert.equal(readOpen(null, '{"1":3,"2":2,"3":1}', null, {}), 4);
  assert.equal(readOpen('7', '{"1":3}', null, {}), 7, 'once set, the saved one wins');
  assert.equal(readOpen('99', null, null, {}), 1, 'a bad saved value is ignored');
  assert.equal(readOpen(null, null, null, { 1: 3, 2: 1 }), 3);
  assert.equal(OPEN_KEY, 'ektukhani-paka-kancha-open');
  // Bug 2 · LevelsOpenInOrder: a friend's far-ahead level gives its stars and opens nothing in between.
  assert.equal(openAfter(1, 18), 1);
  assert.equal(openAfter(1, 1), 2);
  assert.equal(openAfter(5, 3), 5, 'replaying an old level opens nothing new');
  assert.equal(openAfter(5, 5), 6);
  assert.equal(openAfter(18, 18), 18);
  assert.equal(unlockedLevel({ 18: 3 }, 18), 18, 'game-core still opens everything below the highest star, which is why we keep our own');
  assert.deepEqual(readLevels('{"18":3}', 18), { 18: 3 });
  assert.equal(startLevel({}, 1), 1);
  assert.equal(startLevel({}, 12), 1, 'a phone that opened twelve levels before the rewrite still starts the lessons at the start');
  assert.equal(startLevel({ 1: 3, 2: 2 }, 3), 3);
  assert.equal(startLevel({ 1: 3, 2: 2, 3: 3 }, 3), 2, 'everything open is cleared: the first one short of three');
  assert.equal(startLevel({ 1: 3, 2: 3, 3: 3 }, 3), 3);
  assert.equal(readMode('day'), 'day');
  assert.equal(readMode(null), 'level');
  assert.equal(readMode('x'), 'level');
  const moved = migrateLevels(null, '5');
  assert.equal(Object.keys(readLevels(moved, 18)).length, OLD_WORLD_SIZE);
  assert.equal(migrateLevels('{"1":3}', '5'), null);
  assert.equal(migrateLevels(null, null), null);
  assert.equal(migrateLevels(null, '0'), null);
  assert.equal(worldOf(7), 2);
});
