import test from 'node:test';import assert from 'node:assert/strict';import {posterPosition,posterLines,posterTextLayout} from '../lib/layout';
test('poster movement is bounded for square and story',()=>{assert.deepEqual(posterPosition({x:-5,y:1500},800),{x:200,y:600});assert.deepEqual(posterPosition({x:900,y:1500},1200),{x:600,y:1000});});
test('poster text stays within four bounded lines',()=>{const lines=posterLines('আ'.repeat(60)+'\nদুই\nতিন\nচার\nপাঁচ');assert.equal(lines.length,4);assert.equal(lines[0].length,44);});

test('four large lines stay above attribution and below the top margin',()=>{for(const height of [800,1200])for(const y of [0,2000]){const layout=posterTextLayout({y,height,size:100,lines:4});assert.ok(layout.y-2.1*layout.size-layout.size>=79);assert.ok(layout.y+2.1*layout.size<=height-219);}});
