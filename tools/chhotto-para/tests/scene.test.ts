import test from 'node:test';
import assert from 'node:assert/strict';
import { addObject, boundPosition, moveObject, removeObject, starterScene, MAX_OBJECTS, type SceneObject } from '../lib/scene';

test('tap positions stay on the inset diamond including all four distant edges', () => {
  for (const target of [{ x: -1000, y: 425 }, { x: 4000, y: 425 }, { x: 480, y: -900 }, { x: 480, y: 5000 }, { x: 2000, y: -500 }]) {
    const point = boundPosition(target);
    const distance = Math.abs(point.x - 480) / 355 + Math.abs(point.y - 425) / 180;
    assert.ok(distance <= 1.000001);
    assert.ok(point.x >= 125 && point.x <= 835 && point.y >= 245 && point.y <= 605);
  }
  assert.deepEqual(boundPosition({ x: 500, y: 450 }), { x: 500, y: 450 });
  assert.throws(() => boundPosition({ x: NaN, y: 0 }));
});
test('add, reposition and remove only affect the chosen object and preserve the original scene', () => {
  const original = starterScene();
  const added = addObject(original, { id: 'new', kind: 'bicycle' });
  const moved = moveObject(added, 'new', { x: 620, y: 390 });
  assert.equal(added.length, original.length + 1);
  assert.deepEqual(moved.slice(0, original.length), original);
  assert.deepEqual(moved[original.length], { id: 'new', kind: 'bicycle', x: 620, y: 390 });
  assert.deepEqual(removeObject(moved, 'new'), original);
});
test('the scene limit and duplicate IDs cannot silently overwrite artwork', () => {
  let scene: SceneObject[] = [];
  for (let index = 0; index < MAX_OBJECTS; index++) scene = addObject(scene, { id: String(index), kind: 'plant' });
  assert.throws(() => addObject(scene, { id: 'extra', kind: 'plant' }), /১৮/);
  assert.throws(() => addObject(starterScene(), { id: 'starter-1', kind: 'kite' }));
  assert.equal(scene.length, MAX_OBJECTS);
});
test('starter objects all lie inside the usable ground and have unique identities', () => {
  const starter = starterScene();
  assert.equal(new Set(starter.map(item => item.id)).size, starter.length);
  for (const item of starter) assert.deepEqual(boundPosition(item), { x: item.x, y: item.y });
});
