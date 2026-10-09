import test from 'node:test';
import assert from 'node:assert/strict';
import { cellAt, cellPosition, editCell, grid, limitText, presetCells, swapCells } from '../lib/routine';
import { createHistory, commitHistory, undoHistory } from '../../../shared/history';

test('all 28 cells hit correctly while gaps and outside areas do not hit', () => {
  for (let index = 0; index < 28; index++) {
    const point = cellPosition(index);
    assert.equal(cellAt({ x: point.x + grid.width / 2, y: point.y + grid.height / 2 }), index);
    assert.equal(cellAt({ x: point.x + grid.width + 1, y: point.y + 5 }), null);
  }
  for (const point of [{ x: -10, y: 300 }, { x: 193, y: 200 }, { x: 800, y: 2000 }, { x: NaN, y: 300 }]) assert.equal(cellAt(point), null);
});

test('swapping preserves text and color, can move into an empty cell and undoes as one change', () => {
  const cells = presetCells('home');
  const next = swapCells(cells, 0, 1);
  assert.deepEqual(next[1], cells[0]);
  assert.deepEqual(next[0], cells[1]);
  assert.equal(cells[0].text, 'ঘর গোছানো');
  const history = commitHistory(createHistory(cells), next);
  assert.equal(history.past.length, 1);
  assert.deepEqual(undoHistory(history).present, cells);
  for (const index of [-1, 28, NaN, 2.5]) assert.equal(swapCells(cells, 0, index), cells);
});

test('editing affects one cell and Bengali grapheme limits never split a conjunct', () => {
  const cells = presetCells('empty');
  const next = editCell(cells, 6, { text: 'ক্ষ্মৌ'.repeat(40), color: 'pink' });
  assert.equal(next[6].text, 'ক্ষ্মৌ'.repeat(32));
  assert.equal(next[6].color, 'pink');
  assert.equal(cells[6].text, '');
  assert.equal(limitText('ক\nখ', 3), 'ক খ');
});
