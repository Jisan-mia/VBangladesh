import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateBudget,invitation,itinerary,wholeNumber,ideas,settings} from '../lib/plans';
test('Bengali whole taka accepts zero and rejects malformed or out-of-bound input',()=>{
 assert.equal(wholeNumber(' ১২০০ ',100000),1200);assert.equal(wholeNumber('০',100000),0);
 for(const value of ['১.৫','1e2','-2','100001',''])assert.equal(wholeNumber(value,100000),null);
});
test('group total is not multiplied by group size and overspend stays visible',()=>{
 assert.deepEqual(calculateBudget({people:3,budget:100,travel:60,food:40,entry:1}),{total:101,remaining:-1,perPerson:34});
 assert.throws(()=>calculateBudget({people:0,budget:100,travel:0,food:0,entry:0}));
 assert.throws(()=>calculateBudget({people:2,budget:100,travel:-1,food:0,entry:0}));
});
test('both itineraries account for all selected minutes',()=>{
 for(const minutes of [60,120] as const)assert.equal(itinerary(minutes).reduce((sum,item)=>sum+item.minutes,0),minutes);
});
test('all settings have useful steps and invitation preserves user wording',()=>{
 for(const setting of settings){assert.equal(ideas[setting.id].steps.length,3);assert.ok(ideas[setting.id].check);}
 const text=invitation({setting:'home',place:'পরিবারের বাসা',minutes:60,people:2,total:0});
 assert.match(text,/পরিবারের বাসা/);assert.match(text,/নিশ্চিত মূল্য নয়/);assert.match(text,/০ টাকা/);
});
