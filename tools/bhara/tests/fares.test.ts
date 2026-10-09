import test from 'node:test';
import assert from 'node:assert/strict';
import { metroFare, passengerCount, stations, tripTotal } from '../lib/fares';
test('published matrix matches representative near, middle and end routes',()=>{
 assert.deepEqual([[0,15],[0,2],[4,15],[5,8],[8,13],[10,15]].map(([a,b])=>metroFare(a,b)),[100,20,70,20,30,30]);
});
test('every supported route is symmetric and uses a published fare band',()=>{
 for(let a=0;a<stations.length;a++)for(let b=0;b<stations.length;b++){
   assert.equal(metroFare(a,b),metroFare(b,a));
   if(a!==b)assert.ok([20,30,40,50,60,70,80,90,100].includes(metroFare(a,b)!));
 }
});
test('same, fractional and unknown stations are not a free trip',()=>{
 assert.deepEqual([[2,2],[-1,1],[16,1],[1.5,2],[NaN,1]].map(([a,b])=>metroFare(a,b)),[null,null,null,null,null]);
});
test('Bengali counts and whole round-trip fares',()=>{
 assert.equal(passengerCount(' ১২ '),12);
 assert.equal(tripTotal({fare:70,passengers:12,journeys:2}),1680);
 for(const value of ['0','২১','১.৫','1e1','', '-1'])assert.equal(passengerCount(value),null);
 assert.throws(()=>tripTotal({fare:100,passengers:0,journeys:1}));
});
