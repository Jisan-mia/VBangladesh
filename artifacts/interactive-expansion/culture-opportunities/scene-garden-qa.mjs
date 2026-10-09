import { chromium } from '/Users/jisanmia/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const out=new URL('./',import.meta.url).pathname;
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1100}});
const page=await context.newPage(), errors=[], checks=[];
page.on('pageerror',e=>errors.push({type:'pageerror',message:e.message}));
page.on('console',e=>{if(e.type()==='error'||e.type()==='warning')errors.push({type:e.type(),message:e.text()});});
async function check(name,fn){try{const result=await fn();checks.push({name,pass:true,result});console.log('PASS '+name);}catch(e){checks.push({name,pass:false,error:String(e)});console.log('FAIL '+name+' '+String(e));await page.screenshot({path:out+'scene-failure-'+checks.length+'.png'}).catch(()=>{});}}
async function open(slug){await page.goto('http://127.0.0.1:3100/'+slug,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);}
async function paintedPoint(locator){return locator.evaluate(el=>{const box=el.getBoundingClientRect();for(let y=.2;y<.9;y+=.1)for(let x=.2;x<.9;x+=.1){const p={x:box.x+box.width*x,y:box.y+box.height*y};if(document.elementFromPoint(p.x,p.y)?.closest('[data-object-id]')===el)return p;}throw new Error('No painted point');});}
async function move(start,end){await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(end.x,end.y,{steps:12});await page.mouse.up();}
let sceneId,sceneInitial,sceneMoved;
await check('Scene one drag is one history step; click is not history',async()=>{
 await open('chhotto-para');const canvas=page.locator('.para-canvas');await canvas.scrollIntoViewIfNeeded();
 sceneId=await canvas.locator('[data-object-id]').first().getAttribute('data-object-id');const object=canvas.locator('[data-object-id="'+sceneId+'"]');sceneInitial=await object.getAttribute('transform');
 const point=await paintedPoint(object);await page.mouse.click(point.x,point.y);assert.equal(await page.getByRole('button',{name:'আগের ধাপ',exact:true}).isDisabled(),true);
 await move(point,{x:point.x+45,y:point.y+25});sceneMoved=await object.getAttribute('transform');assert.notEqual(sceneMoved,sceneInitial);
 await page.getByRole('button',{name:'আগের ধাপ',exact:true}).click();assert.equal(await object.getAttribute('transform'),sceneInitial);assert.equal(await page.getByRole('button',{name:'আগের ধাপ',exact:true}).isDisabled(),true);
 await page.getByRole('button',{name:'পরের ধাপ',exact:true}).click();assert.equal(await object.getAttribute('transform'),sceneMoved);
 return {sceneInitial,sceneMoved};
});
await check('Scene Escape cancels drag; keyboard move and delete are undoable',async()=>{
 const canvas=page.locator('.para-canvas'),object=canvas.locator('[data-object-id="'+sceneId+'"]');await canvas.scrollIntoViewIfNeeded();let point=await paintedPoint(object);
 await page.mouse.move(point.x,point.y);await page.mouse.down();await page.mouse.move(point.x+60,point.y+35,{steps:8});await page.keyboard.press('Escape');await page.mouse.up();assert.equal(await object.getAttribute('transform'),sceneMoved);
 await page.locator('#selected-object').selectOption(sceneId);await canvas.focus();await page.keyboard.press('ArrowRight');assert.notEqual(await object.getAttribute('transform'),sceneMoved);await page.keyboard.press('Control+z');assert.equal(await object.getAttribute('transform'),sceneMoved);
 await page.locator('#selected-object').selectOption(sceneId);const count=await canvas.locator('[data-object-id]').count();await canvas.focus();await page.keyboard.press('Delete');assert.equal(await canvas.locator('[data-object-id]').count(),count-1);await page.keyboard.press('Control+z');assert.equal(await canvas.locator('[data-object-id]').count(),count);
 await canvas.screenshot({path:out+'scene-drag-keyboard.png'});
});
async function slotContents(){return page.locator('.garden-stage > svg [data-garden-slot]').evaluateAll(els=>els.map(el=>{const copy=el.cloneNode(true);copy.querySelectorAll('[data-export-ignore]').forEach(item=>item.remove());return copy.innerHTML;}));}
async function slotPoint(index){return page.locator('.garden-stage > svg [data-garden-slot="'+index+'"]').evaluate(el=>{const p=new DOMPoint(42,-3).matrixTransform(el.getScreenCTM());return {x:p.x,y:p.y};});}
async function gardenDestination(from,to,start){return page.locator('.garden-stage > svg').evaluate((svg,{from,to,start})=>{const a=svg.querySelector('[data-garden-slot="'+from+'"]').transform.baseVal.consolidate().matrix,b=svg.querySelector('[data-garden-slot="'+to+'"]').transform.baseVal.consolidate().matrix;const delta=new DOMPoint(b.e-a.e,b.f-a.f).matrixTransform(svg.getScreenCTM()),zero=new DOMPoint(0,0).matrixTransform(svg.getScreenCTM());return {x:start.x+delta.x-zero.x,y:start.y+delta.y-zero.y};},{from,to,start});}
let gardenInitial;
await check('Garden drag into empty slot commits once and undo restores contents',async()=>{
 await open('sobuj-kon');const svg=page.locator('.garden-stage > svg');await svg.scrollIntoViewIfNeeded();gardenInitial=await slotContents();const start=await slotPoint(0);const end=await gardenDestination(0,3,start);await move(start,end);
 let next=await slotContents();assert.equal(next[0],'');assert.equal(next[3],gardenInitial[0]);
 await page.getByRole('button',{name:'আগের ধাপ',exact:true}).click();assert.deepEqual(await slotContents(),gardenInitial);assert.equal(await page.getByRole('button',{name:'আগের ধাপ',exact:true}).isDisabled(),true);
 await page.getByRole('button',{name:'পরের ধাপ',exact:true}).click();assert.equal((await slotContents())[3],gardenInitial[0]);await page.getByRole('button',{name:'আগের ধাপ',exact:true}).click();
 return {from:0,to:3};
});
await check('Garden swaps occupied slots and Escape cancels active drag',async()=>{
 const svg=page.locator('.garden-stage > svg');await svg.scrollIntoViewIfNeeded();let start=await slotPoint(0),end=await gardenDestination(0,1,start);await move(start,end);
 const swapped=await slotContents();assert.equal(swapped[0],gardenInitial[1]);assert.equal(swapped[1],gardenInitial[0]);
 start=await slotPoint(1);end=await gardenDestination(1,3,start);await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(end.x,end.y,{steps:12});await page.keyboard.press('Escape');await page.mouse.up();assert.deepEqual(await slotContents(),swapped);
 await page.getByRole('button',{name:'আগের ধাপ',exact:true}).click();assert.deepEqual(await slotContents(),gardenInitial);
});
await check('Garden keyboard move/delete and no-op preset preserve history correctly',async()=>{
 const svg=page.locator('.garden-stage > svg');await page.getByRole('button',{name:'১ — বাঁ দিকের তাক',exact:true}).click();await svg.focus();await page.keyboard.press('Shift+ArrowRight');
 const shifted=await slotContents();assert.equal(shifted[0],gardenInitial[1]);assert.equal(shifted[1],gardenInitial[0]);await page.keyboard.press('Control+z');assert.deepEqual(await slotContents(),gardenInitial);
 await page.getByRole('button',{name:'শুরুর সাজ',exact:true}).click();assert.equal(await page.getByRole('button',{name:'পরের ধাপ',exact:true}).isEnabled(),true);
 await page.getByRole('button',{name:'১ — বাঁ দিকের তাক',exact:true}).click();await svg.focus();await page.keyboard.press('Delete');assert.equal((await slotContents())[0],'');await page.keyboard.press('Control+z');assert.deepEqual(await slotContents(),gardenInitial);
 await svg.screenshot({path:out+'garden-drag-keyboard.png'});
});
await writeFile(out+'scene-garden-results.json',JSON.stringify({checks,errors},null,2));
await browser.close();if(checks.some(c=>!c.pass))process.exitCode=1;
