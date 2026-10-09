import {chromium} from '/Users/jisanmia/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import{writeFile}from'node:fs/promises';import assert from'node:assert/strict';
const out=new URL('./',import.meta.url).pathname;
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true}),page=await context.newPage(),cdp=await context.newCDPSession(page),checks=[],errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error')errors.push(e.text());});
async function check(name,fn){try{await fn();checks.push({name,pass:true});console.log('PASS '+name);}catch(e){checks.push({name,pass:false,error:String(e)});console.log('FAIL '+name+' '+String(e));await page.screenshot({path:out+'touch-failure-'+checks.length+'.png'});}}
async function touch(start,end,finish='touchEnd'){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...start,id:1}]});for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start.x+(end.x-start.x)*i/8,y:start.y+(end.y-start.y)*i/8,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:finish,touchPoints:[]});}
async function pointOnObject(object){return object.evaluate(el=>{const b=el.getBoundingClientRect();for(let y=.2;y<.9;y+=.1)for(let x=.2;x<.9;x+=.1){const p={x:b.x+b.width*x,y:b.y+b.height*y};if(document.elementFromPoint(p.x,p.y)?.closest('[data-object-id]')===el)return p;}throw new Error('No painted point');});}
await check('Scene real touch drag, touch cancel, and one-step undo at 390px',async()=>{
 await page.goto('http://127.0.0.1:3100/chhotto-para',{waitUntil:'networkidle'});const svg=page.locator('.para-canvas');await svg.scrollIntoViewIfNeeded();
 const id=await svg.locator('[data-object-id]').first().getAttribute('data-object-id'),object=svg.locator('[data-object-id="'+id+'"]'),before=await object.getAttribute('transform');
 let start=await pointOnObject(object);await touch(start,{x:start.x+25,y:start.y+15});const moved=await object.getAttribute('transform');assert.notEqual(moved,before);
 start=await pointOnObject(object);await touch(start,{x:start.x+22,y:start.y+12},'touchCancel');assert.equal(await object.getAttribute('transform'),moved);
 await page.getByRole('button',{name:'আগের ধাপ',exact:true}).click();assert.equal(await object.getAttribute('transform'),before);assert.equal(await page.getByRole('button',{name:'আগের ধাপ',exact:true}).isDisabled(),true);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await svg.screenshot({path:out+'scene-touch-mobile.png'});
});
async function gardenContents(){return page.locator('.garden-stage > svg [data-garden-slot]').evaluateAll(els=>els.map(el=>{const c=el.cloneNode(true);c.querySelectorAll('[data-export-ignore]').forEach(e=>e.remove());return c.innerHTML;}));}
async function gardenGesture(from,to){return page.locator('.garden-stage > svg').evaluate((svg,{from,to})=>{const a=svg.querySelector('[data-garden-slot="'+from+'"]'),b=svg.querySelector('[data-garden-slot="'+to+'"]'),start=new DOMPoint(42,-3).matrixTransform(a.getScreenCTM()),am=a.transform.baseVal.consolidate().matrix,bm=b.transform.baseVal.consolidate().matrix,delta=new DOMPoint(bm.e-am.e,bm.f-am.f).matrixTransform(svg.getScreenCTM()),zero=new DOMPoint().matrixTransform(svg.getScreenCTM());return {start:{x:start.x,y:start.y},end:{x:start.x+delta.x-zero.x,y:start.y+delta.y-zero.y}};},{from,to});}
await check('Garden real touch move and native cancel at 390px',async()=>{
 await page.goto('http://127.0.0.1:3100/sobuj-kon',{waitUntil:'networkidle'});const svg=page.locator('.garden-stage > svg');await svg.scrollIntoViewIfNeeded();const before=await gardenContents();let gesture=await gardenGesture(0,3);await touch(gesture.start,gesture.end);const moved=await gardenContents();assert.equal(moved[0],'');assert.equal(moved[3],before[0]);
 gesture=await gardenGesture(3,1);await touch(gesture.start,gesture.end,'touchCancel');assert.deepEqual(await gardenContents(),moved);
 await page.getByRole('button',{name:'আগের ধাপ',exact:true}).click();assert.deepEqual(await gardenContents(),before);assert.equal(await page.getByRole('button',{name:'আগের ধাপ',exact:true}).isDisabled(),true);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await svg.screenshot({path:out+'garden-touch-mobile.png'});
});
await writeFile(out+'scene-garden-touch-results.json',JSON.stringify({checks,errors},null,2));await browser.close();if(checks.some(c=>!c.pass))process.exitCode=1;
