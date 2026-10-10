import test from 'node:test';
import assert from 'node:assert/strict';
import { bank, checkAnswer, newGame, nextPuzzle, pickTile, revealAnswer, takeHint, currentPuzzle, type Game } from '../lib/puzzles';
import { caption, cleanName, createCard, friendLine, humanLine, liveStreak, nextStreak, parseShareHash, possessive, readStreak, rowsOf, shareHash, solvedCount, type Shared } from '../lib/result';
import { share } from '../share';

const DAY = '2026-10-10';
const solve = (game: Game) => { for (let tile = 0; tile < currentPuzzle(game)!.parts.length; tile++) game = pickTile(game, tile); return nextPuzzle(checkAnswer(game)); };

function playedDay() {
  let game = newGame(DAY);
  game = solve(game);
  game = solve(takeHint(game));
  game = nextPuzzle(revealAnswer(game));
  game = nextPuzzle(game);
  return solve(game);
}

test('a played day turns into rows of squares with no answer in them', () => {
  const game = playedDay();
  const rows = rowsOf(game);
  assert.deepEqual(rows.map(row => row.mark), ['g', 'h', 'x', 's', 'g']);
  assert.equal(solvedCount(rows), 3);
  const shared: Shared = { date: DAY, rows, streak: 4, name: 'রাফি' };
  const text = caption(shared) + shareHash(shared) + JSON.stringify(share.preview(shareHash(shared).slice(1)));
  for (const id of game.ids) assert.ok(!text.includes(bank.find(puzzle => puzzle.id === id)!.parts.join('')), 'answer leaked');
  assert.match(caption(shared), /^আজকের শব্দজট · ১০ অক্টোবর\n৫টার মধ্যে ৩টা পেরেছি · টানা ৪ দিন\n🟩/);
  assert.ok(caption(shared).includes('🟨🟩'));
});

test('share links round-trip and reject hostile input', () => {
  const shared: Shared = { date: DAY, rows: [{ mark: 'g', tiles: 2 }, { mark: 'h', tiles: 3 }, { mark: 'x', tiles: 4 }, { mark: 's', tiles: 2 }, { mark: 'g', tiles: 4 }], streak: 3, name: '  রাফি  ' };
  const parsed = parseShareHash(shareHash(shared));
  assert.deepEqual(parsed, { ...shared, name: 'রাফি' });
  assert.equal(share.normalize(shareHash(shared).slice(1)), shareHash(shared).slice(1));
  for (const bad of ['', '#d=2026-10-10', '#d=2026-02-30&r=g2', '#d=2026-10-10&r=g9', '#d=2026-10-10&r=q2', '#d=2026-10-10&r=' + 'g2'.repeat(9), '#r=g2g2']) assert.equal(parseShareHash(bad), null, bad);
  assert.equal(share.normalize('d=nope'), null);
  const hostile = parseShareHash('#d=2026-10-10&r=g2&k=-5&n=' + encodeURIComponent('‮রা\u0000ফি' + 'ক'.repeat(80)));
  assert.equal(hostile?.streak, 0);
  assert.equal(hostile?.name.length, 30);
  assert.ok(!/[\u0000‮]/.test(hostile!.name));
  assert.equal(cleanName('রা্ফি'.normalize('NFD')), 'রা্ফি'.normalize('NFC'));
});

test('the link preview is personal and the tally only lists fixed puzzle ids', () => {
  const state = shareHash({ date: DAY, rows: [{ mark: 'g', tiles: 2 }, { mark: 's', tiles: 3 }], streak: 0, name: 'রাফি' }).slice(1);
  assert.equal(share.preview(state).title, 'রাফি ১০ অক্টোবরের শব্দজটে ২টার মধ্যে ১টা পেরেছে — তুমি কয়টা পারো?');
  assert.match(share.preview('d=2026-10-10&r=g2').title, /^এক বন্ধু/);
  assert.equal(share.tally?.length, bank.length * 2);
  assert.ok(share.tally?.includes('seen:kite') && share.tally.includes('kite'));
});

test('streaks grow on consecutive days, ignore replays, and restart after a gap', () => {
  let streak = nextStreak(null, '2026-10-09');
  assert.deepEqual(streak, { last: '2026-10-09', count: 1, best: 1 });
  streak = nextStreak(streak, DAY);
  assert.equal(streak.count, 2);
  assert.equal(nextStreak(streak, DAY), streak);
  const later = nextStreak(streak, '2026-10-13');
  assert.deepEqual(later, { last: '2026-10-13', count: 1, best: 2 });
  assert.equal(liveStreak(streak, '2026-10-11'), 2);
  assert.equal(liveStreak(streak, '2026-10-12'), 0);
  assert.deepEqual(readStreak(JSON.parse(JSON.stringify(streak))), streak);
  for (const bad of [null, 'x', { last: 'x', count: 1, best: 1 }, { last: DAY, count: 0, best: 0 }, { last: DAY, count: 3, best: 2 }]) assert.equal(readStreak(bad), null);
});

test('human lines and friend lines read naturally', () => {
  const rows = (marks: string) => [...marks].map(mark => ({ mark: mark as 'g', tiles: 3 }));
  assert.match(humanLine(rows('ggggg')), /হিন্ট লাগেনি/);
  assert.match(humanLine(rows('gghgg')), /সবগুলো মিলেছে/);
  assert.match(humanLine(rows('ggggs')), /একটা ফসকে/);
  assert.match(humanLine(rows('sssss')), /কাল নতুন পাঁচটা/);
  const friend: Shared = { date: DAY, rows: rows('ggggs'), streak: 0, name: 'রাফি' };
  assert.equal(friendLine(friend, DAY), 'রাফি আজ ৪/৫ পেরেছে');
  assert.equal(friendLine({ ...friend, name: '' }, '2026-10-11'), 'তোমার বন্ধু ১০ অক্টোবরের শব্দজটে ৪/৫ পেরেছিল');
  assert.equal(createCard({ ...friend, name: 'মিম', rows: rows('ggggg') }, friend).versus, 'রাফি পেরেছে ৪টা, আমি ৫টা');
  assert.equal(createCard({ ...friend, date: '2026-10-11' }, friend).versus, '');
  assert.equal(possessive('রাফি'), 'রাফির');
  assert.equal(possessive('জাহিদ'), 'জাহিদের');
});
