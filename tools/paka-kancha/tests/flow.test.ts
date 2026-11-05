import assert from 'node:assert/strict';
import test from 'node:test';
import { readLevels, recordLevel, unlockedLevel } from '../../../shared/game-core';
import { clockSeconds, countAt, easeOut, pinShare } from '../lib/count.hot';
import * as F from '../lib/flow';
import { decideKey, landedOn, type KeyContext, type Landed } from '../lib/keys';
import { openAfter, readOpen, startLevel } from '../lib/save';

const key = (name: string, extra: Partial<{ repeat: boolean; ctrlKey: boolean }> = {}) => ({ key: name, repeat: false, altKey: false, ctrlKey: false, metaKey: false, ...extra });
const play: KeyContext = { screen: 'play', held: false, inView: true, over: false, typed: 0, length: 4 };
const at = (f: F.Flow, ...steps: ((f: F.Flow) => F.Flow)[]) => steps.reduce((state, step) => step(state), f);

// ---- bug 1 · EnterChecksTheRow ----

test('bug 1 · EnterChecksTheRow: with four digits typed, Enter checks the row whichever pad key last held focus', () => {
  const full = { ...play, typed: 4 };
  // The live replay: a level button or মুছো had focus, four digits were typed, Enter erased a digit or restarted the level.
  for (const landed of ['page', 'pad'] as Landed[]) assert.deepEqual(decideKey(key('Enter'), landed, full), { type: 'check' }, landed);
  // Not four digits yet: the page does nothing, and a focused pad key does its own job (the browser clicks it).
  assert.equal(decideKey(key('Enter'), 'page', { ...play, typed: 3 }), null);
  assert.equal(decideKey(key('Enter'), 'pad', { ...play, typed: 3 }), null);
  // A button reached with Tab that isn't on the pad does its own job; its row is not lost either way.
  assert.equal(decideKey(key('Enter'), 'button', full), null);
  assert.equal(decideKey(key(' '), 'button', full), null);
  // A held Enter never checks twice, never after the game, never in a text box, never while held.
  assert.equal(decideKey(key('Enter', { repeat: true }), 'page', full), null);
  assert.equal(decideKey(key('Enter'), 'page', { ...full, over: true }), null);
  assert.equal(decideKey(key('Enter'), 'field', full), null);
  assert.equal(decideKey(key('Enter'), 'page', { ...full, held: true }), null);
  assert.equal(decideKey(key('Enter'), 'page', { ...full, inView: false }), null);
  assert.equal(decideKey(key('Enter', { ctrlKey: true }), 'page', full), null);
});

test('keys: digits in Bangla or English, Backspace, P, the start card and the result', () => {
  assert.deepEqual(decideKey(key('4'), 'page', play), { type: 'digit', digit: '4' });
  assert.deepEqual(decideKey(key('৪'), 'page', play), { type: 'digit', digit: '4' });
  assert.deepEqual(decideKey(key('4'), 'pad', play), { type: 'digit', digit: '4' });
  assert.equal(decideKey(key('4'), 'field', play), null, 'a text box keeps its digits');
  assert.equal(decideKey(key('4'), 'page', { ...play, over: true }), null);
  assert.deepEqual(decideKey(key('Backspace'), 'page', play), { type: 'erase' });
  assert.deepEqual(decideKey(key('p'), 'page', play), { type: 'pause' });
  assert.equal(decideKey(key('p', { repeat: true }), 'page', play), null);
  const title: KeyContext = { ...play, screen: 'title' };
  assert.deepEqual(decideKey(key('Enter'), 'page', title), { type: 'start' });
  assert.deepEqual(decideKey(key(' '), 'page', title), { type: 'start' });
  assert.equal(decideKey(key('Enter', { repeat: true }), 'page', title), null);
  assert.equal(decideKey(key('Enter'), 'button', title), null, 'a focused button does its own job');
  assert.deepEqual(decideKey(key('ArrowLeft'), 'page', title), { type: 'level', by: -1 });
  assert.deepEqual(decideKey(key('ArrowRight'), 'page', title), { type: 'level', by: 1 });
  assert.equal(decideKey(key('4'), 'page', title), null, 'no digits on the start card');
  const over: KeyContext = { ...play, screen: 'over', over: true };
  assert.deepEqual(decideKey(key('Enter'), 'page', over), { type: 'next' });
  assert.equal(decideKey(key('4'), 'page', over), null);
});

test('landedOn: what a key press landed on', () => {
  const el = (selectors: string[]) => ({ closest: (selector: string) => selectors.some(item => selector.split(',').map(part => part.trim()).includes(item)) ? {} : null }) as unknown as Element;
  assert.equal(landedOn(null), 'page');
  assert.equal(landedOn(el(['input'])), 'field');
  assert.equal(landedOn(el(['.pk-pad', 'button'])), 'pad');
  assert.equal(landedOn(el(['button'])), 'button');
  assert.equal(landedOn(el([])), 'page');
});

// ---- the flow: what holds play ----

test('flow: play runs only while nothing holds it, and the clock banks the run', () => {
  let f = F.titleFlow();
  assert.ok(!F.running(f) && !F.held(f));
  f = F.start(f, 1000);
  assert.ok(F.running(f));
  assert.equal(F.elapsed(f, 4000), 3);
  f = F.menu(f, true, 5000);
  assert.ok(F.held(f) && !F.running(f));
  assert.equal(F.elapsed(f, 90_000), 4, 'the clock stops under the menu');
  f = F.menu(f, false, 90_000);
  assert.equal(F.elapsed(f, 92_000), 6);
  f = F.sheet(f, true, 93_000);
  assert.ok(F.held(f) && F.elapsed(f, 200_000) === 7, 'সব লেভেল holds play and the clock');
  f = F.sheet(f, false, 200_000);
  f = F.away(f, true, 201_000);
  assert.ok(F.held(f));
  assert.equal(F.away(f, true, 202_000), f, 'away twice changes nothing');
  f = F.away(f, false, 300_000);
  assert.equal(F.elapsed(f, 300_000), 8);
  assert.equal(F.start(F.toTitle(f), 1).screen, 'play');
  assert.equal(F.toTitle(f).base, 0, 'a new game starts the clock from zero');
});

test('BoardFrozenWhileHeld: no digit, দেখো or key acts while the menu, the sheet or another window holds play', () => {
  const live = F.start(F.titleFlow(), 0);
  assert.ok(F.takesPress(live, 1000));
  for (const held of [F.menu(live, true, 1000), F.sheet(live, true, 1000), F.away(live, true, 1000)]) assert.ok(!F.takesPress(held, 100_000));
  assert.ok(!F.takesPress(F.titleFlow(), 1000), 'the start card takes no digits');
  assert.ok(!F.takesPress(F.finish(live, 1000), 5000), 'the result takes no digits');
});

test('ComeBackIsNotAMove: the tap that brings the window back, or closes the menu, only wakes the game', () => {
  let f = F.start(F.titleFlow(), 0);
  f = F.away(f, true, 1000);
  f = F.menu(f, true, 1000);
  f = F.away(f, false, 5000);
  assert.ok(!F.awake(f, 5100) && !F.awake(f, 5000 + F.BACK_GUARD_MS - 1));
  f = F.menu(f, false, 5200);
  assert.ok(!F.takesPress(f, 5300), 'closing the menu starts the guard again');
  assert.ok(!F.takesPress(f, 5200 + F.BACK_GUARD_MS - 1) && F.takesPress(f, 5200 + F.BACK_GUARD_MS));
  const title = F.away(F.away(F.titleFlow(), true, 0), false, 1000);
  assert.ok(!F.awake(title, 1100), 'the same guard keeps শুরু করো from being tapped by the click that wakes the page');
});

test('ResultNeedsAFreshPress: a key held through the last try can’t skip the result, and a hold can’t either', () => {
  let f = F.start(F.titleFlow(), 0);
  f = F.finish(f, 10_000);
  assert.equal(f.screen, 'over');
  assert.ok(!F.takesResultKey(f, 10_100, false), 'too soon');
  assert.ok(!F.takesResultKey(f, 12_000, true), 'a repeat never goes on');
  assert.ok(F.takesResultKey(f, 10_000 + F.RESULT_GUARD_MS, false));
  assert.ok(!F.takesResultKey(F.menu(f, true, 11_000), 20_000, false), 'not under the menu');
  assert.deepEqual(F.finish(F.titleFlow(), 5), F.titleFlow(), 'a result needs a game');
  const saved = F.toOver(F.titleFlow(), 777);
  assert.equal(saved.screen, 'over');
  assert.ok(F.takesResultKey(saved, 777, false), 'today’s finished code opens straight on its result, no guard to wait out');
  assert.equal(F.elapsed(f, 99_000), 10, 'the clock stopped at the last try');
});

test('the count-up and the boss bar: numbers in, numbers out', () => {
  assert.equal(clockSeconds(3, 1000, true, 3500), 5.5);
  assert.equal(clockSeconds(3, 1000, false, 3500), 3);
  assert.equal(easeOut(-1), 0);
  assert.equal(easeOut(2), 1);
  assert.ok(easeOut(0.5) > 0.5);
  assert.equal(countAt(7, 1), 7);
  assert.equal(countAt(7, 0), 0);
  assert.equal(pinShare(2, 4), 0.5);
  assert.equal(pinShare(9, 4), 1);
  assert.equal(pinShare(0, 0), 0);
});

// ---- bug 2 · OpenLevelsAreEarned ----

test('bug 2 · OpenLevelsAreEarned: a friend’s level 18 gives its stars and opens nothing between', () => {
  // The live replay: a link to level 18 opened all 18 levels, and after cracking it levels 1–17 listed open with no stars.
  let stars = readLevels(null, 18), open = readOpen(null, null, null, stars);
  assert.equal(open, 1);
  stars = recordLevel(stars, 18, 3);
  open = openAfter(open, 18);
  assert.equal(open, 1, 'your own open level stays where it was');
  assert.equal(stars[18], 3, 'the stars are still recorded');
  assert.equal(unlockedLevel(stars, 18), 18, 'game-core alone would open everything: that is why the game keeps its own');
  assert.equal(startLevel(stars, open), 1, 'the next visit starts at level 1');
  // Your own play opens one level at a time.
  for (let level = 1; level <= 3; level++) { stars = recordLevel(stars, level, 2); open = openAfter(open, level); assert.equal(open, level + 1); }
  assert.equal(readOpen(String(open), null, null, stars), 4, 'it is saved, so a reload keeps it');
});
