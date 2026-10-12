import assert from 'node:assert/strict';
import test from 'node:test';
import { challengeHash, cleanName, makeRng, pick, readChallenge, readLevels, recordLevel, starsFor, totalStars, unlockedLevel } from '../game-core';

test('the same seed gives the same sequence, different seeds differ', () => {
  const first = makeRng(48213), second = makeRng(48213), other = makeRng(48214);
  const a = Array.from({ length: 50 }, () => first()), b = Array.from({ length: 50 }, () => second());
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, Array.from({ length: 50 }, () => other()));
  assert.ok(a.every(value => value >= 0 && value < 1));
  const rng = makeRng(7);
  assert.ok(Array.from({ length: 200 }, () => pick(rng, 6)).every(value => Number.isInteger(value) && value >= 0 && value < 6));
});

test('challenge links round-trip, with names cleaned and extra keys kept', () => {
  const hash = challengeHash({ seed: 48213, target: 1240, name: '  রাফি‮ ', extra: { l: 3 } });
  assert.equal(hash, 's=48213&t=1240&l=3&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF');
  assert.deepEqual(readChallenge('#' + hash, { maxTarget: 99999, extraKeys: ['l'] }), { seed: 48213, target: 1240, name: 'রাফি', extra: { l: '3' } });
});

test('hostile or broken challenge links are rejected', () => {
  const read = (hash: string) => readChallenge(hash, { maxTarget: 5000 });
  assert.equal(read('#t=10'), null);
  assert.equal(read('#s=0&t=10'), null);
  assert.equal(read('#s=1.5&t=10'), null);
  assert.equal(read('#s=5&t=-1'), null);
  assert.equal(read('#s=5&t=5001'), null);
  assert.equal(read('#s=5&t=10&n=' + 'x'.repeat(700)), null);
  assert.equal(read('#s=5&t=10')?.name, '');
  assert.equal(cleanName('ক'.repeat(40)).length, 20);
});

test('level stars: parse safely, keep the best, unlock one past the highest cleared', () => {
  assert.deepEqual(readLevels('{"1":3,"2":1,"9":2,"3":7,"x":1}', 5), { 1: 3, 2: 1 });
  assert.deepEqual(readLevels('not json', 5), {});
  assert.equal(unlockedLevel({}, 5), 1);
  assert.equal(unlockedLevel({ 1: 2, 2: 1 }, 5), 3);
  assert.equal(unlockedLevel({ 5: 1 }, 5), 5);
  assert.deepEqual(recordLevel({ 1: 3 }, 1, 1), { 1: 3 });
  assert.deepEqual(recordLevel({ 1: 1 }, 1, 3), { 1: 3 });
  assert.equal(totalStars({ 1: 3, 2: 2 }), 5);
  assert.equal(starsFor(10, 12, 18, true), 3);
  assert.equal(starsFor(15, 12, 18, true), 2);
  assert.equal(starsFor(30, 12, 18, true), 1);
  assert.equal(starsFor(90, 80, 50), 3);
});
