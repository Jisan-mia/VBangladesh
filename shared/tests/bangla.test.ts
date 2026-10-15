import assert from 'node:assert/strict';
import test from 'node:test';
import { possessive } from '../bangla';

test('possessive picks the right ending', () => {
  assert.equal(possessive('রাফি'), 'রাফির');
  assert.equal(possessive('জাহিদ'), 'জাহিদের');
  assert.equal(possessive('শরৎ'), 'শরতের');
  assert.equal(possessive('Rafi'), 'Rafi-এর');
  assert.equal(possessive('মং'), 'মং-এর');
});
