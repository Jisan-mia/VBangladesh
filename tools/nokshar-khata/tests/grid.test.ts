import test from 'node:test';import assert from 'node:assert/strict';import {mirrorCells,paintCells,cellsBetween} from '../lib/grid';
test('mirrored corners stay within grid and paint does not mutate history',()=>{assert.deepEqual(mirrorCells(0,'four'),[0,11,132,143]);assert.deepEqual(mirrorCells(-1,'four'),[]);const cells=Array(144).fill('white');const painted=paintCells(cells,0,{color:'red',mirror:'four'});assert.equal(painted.filter(value=>value==='red').length,4);assert.equal(cells[0],'white');});

test('fast pointer moves fill intermediate cells in either direction',()=>{assert.deepEqual(cellsBetween(0,5),[0,1,2,3,4,5]);assert.deepEqual(cellsBetween(143,104),[143,130,117,104]);assert.deepEqual(cellsBetween(-1,10),[10]);});
