import assert from 'node:assert/strict';
import test from 'node:test';
import { birdPath, drawingName, foot, outlineCoordinates, paper, printedBounds, templateFaces } from '../lib/bird';

test('both mirrored cut-outs and their control points fit the A4 safe print area', () => {
  for (const face of templateFaces) {
    const bounds = printedBounds(face);
    assert.ok(bounds.left >= paper.margin && bounds.right <= paper.width - paper.margin);
    assert.ok(bounds.top >= paper.margin && bounds.bottom <= paper.height - paper.margin);
  }
});

test('the two printable shapes are exact reflections and remain separated', () => {
  const [front, back] = templateFaces;
  for (const point of outlineCoordinates()) {
    const frontX = front.x + point.x * front.direction;
    const backX = back.x + point.x * back.direction;
    assert.equal(frontX + backX, paper.width);
    assert.equal(front.y + point.y, back.y + point.y);
  }
  assert.ok(printedBounds(back).left - printedBounds(front).right >= 4);
});

test('feet stay attached at the common fold line and provide two equal base halves', () => {
  assert.match(birdPath, new RegExp(`M ${foot.left} ${foot.foldY} L ${foot.left} ${foot.bottom} L ${foot.right} ${foot.bottom} L ${foot.right} ${foot.foldY}`));
  assert.equal(foot.right - foot.left, 37);
  assert.equal(2 * (foot.bottom - foot.foldY), 30);
});

test('print captions have a short bounded name or a meaningful default', () => {
  assert.equal(drawingName('  টুনটুনি  '), 'টুনটুনি');
  assert.equal(drawingName('   '), 'আমার কাগজের পাখি');
  assert.equal(drawingName('অ'.repeat(100)).length, 24);
});
