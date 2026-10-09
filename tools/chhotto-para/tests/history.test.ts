import test from 'node:test';
import assert from 'node:assert/strict';
import { createHistory, commitHistory, undoHistory, redoHistory, HISTORY_LIMIT } from '../../../shared/history';
import { dragPosition, passedDragThreshold } from '../lib/drag';

test('undo and redo restore complete documents including arrays and caption', () => {
  const initial = { items: [{ id: 'a', x: 1 }], caption: 'আগে' };
  const updated = { items: [{ id: 'a', x: 8 }], caption: 'পরে' };
  const history = commitHistory(createHistory(initial), updated);
  assert.deepEqual(undoHistory(history).present, initial);
  assert.deepEqual(redoHistory(undoHistory(history)).present, updated);
  assert.deepEqual(initial, { items: [{ id: 'a', x: 1 }], caption: 'আগে' });
});

test('no-op commits preserve redo and a real new edit removes the old branch', () => {
  const history = undoHistory(commitHistory(createHistory({ x: 0 }), { x: 1 }));
  assert.equal(commitHistory(history, { x: 0 }), history);
  assert.deepEqual(commitHistory(history, { x: 2 }).future, []);
});

test('only the most recent fifty commits can be undone and empty actions do nothing', () => {
  let history = createHistory(0);
  assert.equal(undoHistory(history), history);
  assert.equal(redoHistory(history), history);
  for (let index = 1; index <= 70; index++) history = commitHistory(history, index);
  assert.equal(history.past.length, HISTORY_LIMIT);
  for (let index = 0; index < HISTORY_LIMIT; index++) history = undoHistory(history);
  assert.equal(history.present, 20);
  assert.equal(undoHistory(history), history);
  for (let index = 0; index < HISTORY_LIMIT; index++) history = redoHistory(history);
  assert.equal(history.present, 70);
});

test('a drag preserves the grabbed offset and remains inside the ground', () => {
  assert.deepEqual(dragPosition({ x: 355, y: 360 }, { x: 320, y: 280 }, { x: 360, y: 320 }), { x: 395, y: 400 });
  const bounded = dragPosition({ x: 355, y: 360 }, { x: 320, y: 280 }, { x: -3000, y: -2000 });
  assert.ok(Math.abs(bounded.x - 480) / 355 + Math.abs(bounded.y - 425) / 180 <= 1.000001);
  assert.equal(passedDragThreshold({ x: 10, y: 10 }, { x: 12, y: 12 }), false);
  assert.equal(passedDragThreshold({ x: 10, y: 10 }, { x: 14, y: 10 }), true);
});

test('many drag previews become one undo step and cancellation leaves history intact', () => {
  const initial = { x: 355, y: 360 };
  const history = createHistory(initial);
  let preview = initial;
  for (let distance = 1; distance <= 30; distance++) preview = dragPosition(initial, initial, { x: 355 + distance, y: 360 });
  assert.equal(history.past.length, 0);
  const committed = commitHistory(history, preview);
  assert.equal(committed.past.length, 1);
  assert.deepEqual(undoHistory(committed).present, initial);
});

test('unchanged large photo documents preserve redo while edits make one entry', () => {
  const photo = { src: 'data:image/jpeg;base64,' + 'a'.repeat(1_000_000), crop: { x: 0, y: 0 } };
  const initial = createHistory({ photos: [photo] });
  const changed = commitHistory(initial, { photos: [{ ...photo, crop: { x: 1, y: 0 } }] });
  const undone = undoHistory(changed);
  assert.equal(commitHistory(undone, { photos: [{ ...photo, crop: { x: 0, y: 0 } }] }), undone);
  assert.equal(changed.past.length, 1);
  assert.equal(changed.present.photos[0].src, photo.src);
});
