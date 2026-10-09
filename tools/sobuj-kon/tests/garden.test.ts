import test from 'node:test';
import assert from 'node:assert/strict';
import { gardenList, initialGarden, replacePlant } from '../lib/garden';
test('replacement and removal affect exactly the selected slot',()=>{
  const original=[...initialGarden];
  const next=replacePlant(original,3,'aloe');
  assert.equal(next[3],'aloe');assert.equal(original[3],null);
  assert.equal(replacePlant(next,3,null)[3],null);
  assert.deepEqual(next.slice(0,3),original.slice(0,3));
});
test('invalid indices cannot add invisible plants',()=>{
  for(const index of [-1,6,NaN,1.5])assert.equal(replacePlant(initialGarden,index,'aloe'),initialGarden);
});
test('shopping list counts actual duplicate plants and omits removed ones',()=>{
  assert.deepEqual(gardenList(['aloe',null,'aloe','basil',null,null]).map(({id,count})=>({id,count})),[{id:'basil',count:1},{id:'aloe',count:2}]);
  assert.deepEqual(gardenList([null,null,null,null,null,null]),[]);
});

test('moving to an occupied slot swaps plants without loss and keeps the source immutable', async () => {
  const { swapPlants } = await import('../lib/garden');
  const original = [...initialGarden];
  const swapped = swapPlants(original, 0, 2);
  assert.equal(swapped[0], original[2]);
  assert.equal(swapped[2], original[0]);
  assert.deepEqual(gardenList(swapped), gardenList(original));
  assert.deepEqual(original, initialGarden);
  assert.equal(swapPlants(original, 0, 0), original);
  for (const target of [-1, 6, 0.5, NaN]) assert.equal(swapPlants(original, 0, target), original);
});

test('a pot moves into an empty slot and is picked up without jumping to the pointer', async () => {
  const { swapPlants, slots, nearestSlot, draggedPotPosition } = await import('../lib/garden');
  const moved = swapPlants(initialGarden, 0, 3);
  assert.equal(moved[0], null);
  assert.equal(moved[3], 'vine');
  const origin = slots[0];
  const start = { x: origin.x - 20, y: origin.y - 100 };
  const current = { x: slots[3].x - 20, y: slots[3].y - 100 };
  const anchor = draggedPotPosition(origin, start, current);
  assert.deepEqual(anchor, { x: slots[3].x, y: slots[3].y });
  assert.equal(nearestSlot(anchor), 3);
  assert.equal(nearestSlot({ x: -1000, y: 5000 }), null);
  assert.equal(nearestSlot({ x: NaN, y: 0 }), null);
});
