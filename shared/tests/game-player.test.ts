import assert from 'node:assert/strict';
import test from 'node:test';
import { closedNav, inlineStage, navigate, parseRecent, withRecent, RECENT_LIMIT, type Nav } from '../game-player-core';

test('recently played: newest first, no repeats, at most 12', () => {
  assert.deepEqual(withRecent(null, 'sudoku'), ['sudoku']);
  assert.deepEqual(withRecent('["carrom","sudoku","baghbandi"]', 'sudoku'), ['sudoku', 'carrom', 'baghbandi']);
  const full = JSON.stringify(Array.from({ length: RECENT_LIMIT }, (_, index) => `game-${index}`));
  const next = withRecent(full, 'jhalmuri-sap');
  assert.equal(next.length, RECENT_LIMIT);
  assert.equal(next[0], 'jhalmuri-sap');
  assert.ok(!next.includes(`game-${RECENT_LIMIT - 1}`), 'the oldest falls off');
});

test('recently played survives junk in storage', () => {
  for (const raw of ['', 'not json', '{"a":1}', '42', 'null']) assert.deepEqual(parseRecent(raw), []);
  assert.deepEqual(parseRecent('["ok-slug", 7, null, "<script>", "UPPER", "ok-slug", "a--b", "-x"]'), ['ok-slug']);
  assert.deepEqual(withRecent('["x".repeat(3)]', 'carrom'), ['carrom']);
});

const run = (events: Array<'enter' | 'leave' | 'pop'>) => events.reduce<{ nav: Nav; effects: string[] }>((state, event) => {
  const step = navigate(state.nav, event);
  return { nav: step.nav, effects: [...state.effects, ...step.effects] };
}, { nav: closedNav, effects: [] });

test('Back closes immersive mode instead of leaving the page', () => {
  const { nav, effects } = run(['enter', 'pop']);
  assert.deepEqual(effects, ['push', 'enter', 'leave']);
  assert.deepEqual(nav, closedNav);
});

test('বের হও goes back over our own entry and ignores the popstate it causes', () => {
  const { nav, effects } = run(['enter', 'leave', 'pop']);
  assert.deepEqual(effects, ['push', 'enter', 'back', 'leave']);
  assert.deepEqual(nav, closedNav);
});

test('a second Back after closing is the page\'s own: the player does nothing', () => {
  const { nav, effects } = run(['enter', 'pop', 'pop']);
  assert.deepEqual(effects, ['push', 'enter', 'leave']);
  assert.deepEqual(nav, closedNav);
});

test('entering twice pushes once; leaving when closed does nothing', () => {
  assert.deepEqual(run(['enter', 'enter']).effects, ['push', 'enter']);
  assert.deepEqual(run(['leave', 'pop']).effects, []);
});

test('play, leave, play again, Back: every entry is balanced', () => {
  const { nav, effects } = run(['enter', 'leave', 'pop', 'enter', 'pop']);
  assert.deepEqual(effects, ['push', 'enter', 'back', 'leave', 'push', 'enter', 'leave']);
  assert.deepEqual(nav, closedNav);
});

test('a portrait stage is 480–560 px wide and as tall as the window allows', () => {
  const laptop = inlineStage({ viewWidth: 1440, viewHeight: 800, top: 72, bar: 72 });
  assert.equal(laptop.height, 800 - 72 - 72 - 28);
  assert.equal(laptop.width, 480);
  const tall = inlineStage({ viewWidth: 1920, viewHeight: 1300, top: 72, bar: 72 });
  assert.equal(tall.width, 560);
  assert.equal(tall.height, 1128);
});

test('the stage never gets too short to play, nor wider than the window', () => {
  const short = inlineStage({ viewWidth: 1200, viewHeight: 500, top: 140, bar: 90 });
  assert.equal(short.height, 480);
  const narrow = inlineStage({ viewWidth: 500, viewHeight: 900, top: 72, bar: 72 });
  assert.equal(narrow.width, 468);
});

test('a wide stage is 16:9 between 640 and 1024 px', () => {
  assert.equal(inlineStage({ viewWidth: 1920, viewHeight: 900, top: 72, bar: 72, shape: 'wide' }).width, 1024);
  assert.equal(inlineStage({ viewWidth: 1920, viewHeight: 600, top: 72, bar: 72, shape: 'wide' }).width, 853);
  assert.equal(inlineStage({ viewWidth: 1920, viewHeight: 400, top: 72, bar: 72, shape: 'wide' }).width, 853);
});
