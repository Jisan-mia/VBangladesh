import test from 'node:test';
import assert from 'node:assert/strict';
import { answerOf, answerState, bank, checkAnswer, currentPuzzle, dailyIds, dayNumber, dhakaDate, isDate, isFinished, newGame, nextPuzzle, PER_DAY, pickTile, removeLast, removeTile, RECIPE, restoreGame, revealAnswer, score, shiftDate, takeHint, tileOrder, type Game } from '../lib/puzzles';

const DAY = '2026-10-10';
// Combining Bangla signs (hasanta, vowel signs, nukta, chandrabindu…) can't start a tile: it wouldn't render on its own.
const combining = /^[ঁ-ঃ়া-্ৗৢৣ]/;

function permutations(size: number): number[][] {
  if (size === 1) return [[0]];
  return permutations(size - 1).flatMap(rest => Array.from({ length: size }, (_, at) => [...rest.slice(0, at), size - 1, ...rest.slice(at)]));
}

/** Plays a whole puzzle by tapping the tiles shown in the pool, the way a person would. */
function solveCurrent(game: Game) {
  for (let position = game.rounds[game.index].picked.length; position < currentPuzzle(game)!.parts.length; position++) game = pickTile(game, position);
  return checkAnswer(game);
}

test('the bank has at least 60 well-formed puzzles with unique ids and answers', () => {
  assert.ok(bank.length >= 60, `only ${bank.length} puzzles`);
  assert.equal(new Set(bank.map(puzzle => puzzle.id)).size, bank.length);
  assert.equal(new Set(bank.map(answerOf)).size, bank.length);
  for (const puzzle of bank) {
    const answer = answerOf(puzzle);
    assert.ok(puzzle.parts.length >= 2 && puzzle.parts.length <= 5, `${puzzle.id}: 2–5 tiles`);
    assert.equal(new Set(puzzle.parts).size, puzzle.parts.length, `${puzzle.id}: no repeated tile`);
    assert.ok(puzzle.parts.every(part => part.length > 0 && part === part.normalize('NFC') && !combining.test(part) && /^[ঀ-৿]+$/.test(part)), `${puzzle.id}: tiles stand alone`);
    assert.ok(puzzle.clue.length > 12 && /[।!]$/.test(puzzle.clue), `${puzzle.id}: a full sentence clue`);
    assert.ok(!puzzle.clue.includes(answer), `${puzzle.id}: clue gives the answer away`);
  }
});

test('every puzzle in the bank is solvable, and only one tile order spells it', () => {
  for (const puzzle of bank) {
    const order = tileOrder(puzzle.id);
    assert.deepEqual(order.slice().sort(), puzzle.parts.map((_, index) => index), `${puzzle.id}: pool holds every tile once`);
    assert.notEqual(order.map(tile => puzzle.parts[tile]).join(''), answerOf(puzzle), `${puzzle.id}: pool already spells the answer`);
    const spelled = permutations(puzzle.parts.length).filter(perm => perm.map(tile => puzzle.parts[tile]).join('') === answerOf(puzzle));
    assert.equal(spelled.length, 1, `${puzzle.id}: exactly one correct order`);
    let game: Game = { date: DAY, ids: [puzzle.id], index: 0, rounds: [{ picked: [], attempts: 0, hint: false, outcome: 'playing' }] };
    for (const tile of order.slice().sort((a, b) => a - b)) game = pickTile(game, tile);
    assert.equal(checkAnswer(game).rounds[0].outcome, 'solved', `${puzzle.id}: solvable`);
  }
});

test('the date is Bangladesh time, whatever the phone clock zone', () => {
  assert.equal(dhakaDate(new Date('2026-10-09T17:59:59Z')), '2026-10-09');
  assert.equal(dhakaDate(new Date('2026-10-09T18:00:00Z')), '2026-10-10');
  assert.equal(dhakaDate(new Date('2026-12-31T19:30:00Z')), '2027-01-01');
  assert.equal(shiftDate('2027-01-01', -1), '2026-12-31');
  for (const bad of ['', '2026-13-01', '2026-02-30', '26-10-10', '2026-10-10T00', '1999-01-01']) assert.equal(isDate(bad), false, bad);
  assert.ok(isDate(DAY));
});

test('the daily pick is deterministic, warms up from short words, and never repeats inside a cycle', () => {
  assert.deepEqual(dailyIds(DAY), dailyIds(DAY));
  assert.deepEqual(dailyIds(dhakaDate(new Date('2026-10-09T18:30:00Z'))), dailyIds(dhakaDate(new Date('2026-10-10T17:30:00Z'))));
  assert.notDeepEqual(dailyIds(DAY), dailyIds(shiftDate(DAY, 1)));
  const size = (id: string) => bank.find(puzzle => puzzle.id === id)!.parts.length;
  for (let day = 0; day < 60; day++) {
    const ids = dailyIds(shiftDate(DAY, day));
    assert.equal(new Set(ids).size, PER_DAY);
    assert.deepEqual(ids.map(size), RECIPE.flatMap(step => Array(step.count).fill(step.tiles)));
  }
  for (const { tiles, count } of RECIPE) {
    const daysPerCycle = Math.floor(bank.filter(puzzle => puzzle.parts.length === tiles).length / count);
    const cycleStart = shiftDate(DAY, daysPerCycle - (dayNumber(DAY) % daysPerCycle));
    const seen = new Set<string>();
    for (let day = 0; day < daysPerCycle; day++) {
      for (const id of dailyIds(shiftDate(cycleStart, day)).filter(id => size(id) === tiles)) { assert.ok(!seen.has(id), `${id} repeated within a cycle`); seen.add(id); }
    }
    assert.equal(seen.size, daysPerCycle * count);
  }
});

test('a tile cannot be used twice, placed tiles come back, and incomplete rows are not checked', () => {
  const initial = newGame(DAY);
  const picked = pickTile(initial, 0);
  assert.equal(pickTile(picked, 0), picked);
  assert.equal(pickTile(picked, -1), picked);
  assert.equal(pickTile(picked, 1.5), picked);
  assert.equal(checkAnswer(picked), picked);
  assert.equal(answerState(picked), 'incomplete');
  assert.deepEqual(removeLast(picked).rounds[0].picked, []);
  assert.deepEqual(removeTile(pickTile(picked, 1), 0).rounds[0].picked, [1]);
  assert.deepEqual(initial.rounds[0].picked, []);
});

test('a wrong try counts and clears the row; solving counts once', () => {
  let game = newGame(DAY);
  const size = currentPuzzle(game)!.parts.length;
  for (let tile = size - 1; tile >= 0; tile--) game = pickTile(game, tile);
  assert.equal(answerState(game), 'incorrect');
  game = checkAnswer(game);
  assert.equal(game.rounds[0].attempts, 1);
  assert.deepEqual(game.rounds[0].picked, []);
  game = solveCurrent(game);
  assert.equal(score(game).solved, 1);
  assert.equal(checkAnswer(game), game);
  assert.equal(pickTile(game, 0), game);
  assert.equal(game.rounds[0].attempts, 2);
});

test('the hint places the first tile, survives a wrong try, and marks the solve as hinted', () => {
  let game = takeHint(newGame(DAY));
  assert.deepEqual(game.rounds[0].picked, [0]);
  assert.equal(takeHint(game), game);
  assert.equal(removeLast(game), game, 'the hinted tile stays');
  game = solveCurrent(game);
  assert.deepEqual(score(game), { solved: 1, hinted: 1, revealed: 0, skipped: 0 });
});

test('revealed and skipped puzzles never count as solved, and the day ends after five', () => {
  let game = revealAnswer(newGame(DAY));
  assert.equal(checkAnswer(game), game);
  game = nextPuzzle(nextPuzzle(game));
  assert.deepEqual(score(game), { solved: 0, hinted: 0, revealed: 1, skipped: 1 });
  while (!isFinished(game)) game = nextPuzzle(game);
  assert.equal(game.index, PER_DAY);
  assert.equal(nextPuzzle(game), game);
});

test('a saved game comes back only for the same day and only if it is sane', () => {
  let game = solveCurrent(newGame(DAY));
  game = takeHint(nextPuzzle(game));
  const saved = JSON.parse(JSON.stringify(game));
  assert.deepEqual(restoreGame(saved, DAY), game);
  assert.deepEqual(restoreGame(saved, shiftDate(DAY, 1)), newGame(shiftDate(DAY, 1)));
  for (const hostile of [null, 'x', 42, { ...saved, index: 9 }, { ...saved, ids: ['kite'] }, { ...saved, rounds: [{ picked: [0, 0], attempts: 0, hint: false, outcome: 'playing' }, ...saved.rounds.slice(1)] }, { ...saved, rounds: saved.rounds.map(() => ({ picked: [], attempts: -1, hint: false, outcome: 'won' })) }]) {
    assert.deepEqual(restoreGame(hostile, DAY), newGame(DAY));
  }
});
