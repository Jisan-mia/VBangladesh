import test from 'node:test';
import assert from 'node:assert/strict';
import { answerState, checkAnswer, newGame, nextPuzzle, pickTile, puzzles, removeLast, resultText, revealAnswer, score, tileOrder } from '../lib/puzzles';

test('each original clue has intact tile order and a unique identity', () => {
  assert.equal(puzzles.length, 12);
  assert.equal(new Set(puzzles.map(puzzle => puzzle.id)).size, puzzles.length);
  puzzles.forEach((puzzle, index) => {
    assert.ok(puzzle.clue.length > 12);
    assert.deepEqual(tileOrder(index).slice().sort(), puzzle.parts.map((_, position) => position));
    assert.notDeepEqual(tileOrder(index), puzzle.parts.map((_, position) => position));
    assert.ok(puzzle.parts.every(part => part.length > 0));
  });
});

test('a tile cannot be consumed twice, removed tiles return, and incomplete checks do not count', () => {
  const initial = newGame();
  const picked = pickTile(initial, 0);
  assert.equal(pickTile(picked, 0), picked);
  assert.equal(pickTile(picked, -1), picked);
  assert.equal(checkAnswer(picked), picked);
  assert.deepEqual(removeLast(picked).rounds[0].picked, []);
  assert.deepEqual(initial.rounds[0].picked, []);
});

test('incorrect answers allow retry while solving awards one result only', () => {
  let game = newGame();
  for (const tile of [2, 1, 0]) game = pickTile(game, tile);
  assert.equal(answerState(game), 'incorrect');
  game = checkAnswer(game);
  assert.equal(game.rounds[0].attempts, 1);
  for (let index = 0; index < 3; index++) game = removeLast(game);
  for (const tile of [0, 1, 2]) game = pickTile(game, tile);
  game = checkAnswer(game);
  assert.equal(score(game).solved, 1);
  assert.equal(checkAnswer(game), game);
  assert.equal(game.rounds[0].attempts, 2);
});

test('revealed and skipped answers never count as solved and the game ends at twelve', () => {
  let game = revealAnswer(newGame());
  assert.equal(checkAnswer(game), game);
  game = nextPuzzle(game);
  game = nextPuzzle(game);
  assert.deepEqual(score(game), { solved: 0, revealed: 1, skipped: 1 });
  for (let index = game.index; index < puzzles.length; index++) game = nextPuzzle(game);
  assert.equal(game.index, puzzles.length);
  assert.equal(nextPuzzle(game), game);
  assert.match(resultText(game), /নিজে মিলিয়েছি ০টি/);
  assert.ok(!resultText(game).includes(puzzles[0].parts.join('')));
});
