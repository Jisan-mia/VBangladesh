import { chromium } from '/Users/jisanmia/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const out = new URL('./', import.meta.url).pathname;
const browser = await chromium.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true });
const context = await browser.newContext({viewport:{width:1440,height:1100},acceptDownloads:true});
const page = await context.newPage();
const errors=[];
page.on('pageerror',error=>errors.push({type:'pageerror',message:error.message}));
page.on('console',message=>{if(message.type()==='error'||message.type()==='warning')errors.push({type:message.type(),message:message.text()});});
const checks=[];
async function check(name,fn){try{const result=await fn();checks.push({name,pass:true,result});console.log('PASS '+name);}catch(error){checks.push({name,pass:false,error:String(error)});console.log('FAIL '+name+' '+String(error));await page.screenshot({path:out+'failure-'+checks.length+'.png',fullPage:false}).catch(()=>{});}}
async function open(slug){await page.goto('http://127.0.0.1:3100/'+slug,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);}
async function draw(locator,offset=0){await locator.scrollIntoViewIfNeeded();const b=await locator.boundingBox();await page.mouse.move(b.x+b.width*.5,b.y+b.height*.31+offset);await page.mouse.down();await page.mouse.move(b.x+b.width*.62,b.y+b.height*.35+offset,{steps:9});await page.mouse.move(b.x+b.width*.59,b.y+b.height*.45+offset,{steps:7});await page.mouse.up();}
await check('Alpana commits one mirrored stroke and one undo step',async()=>{
 await open('alpana');
 await page.getByRole('button',{name:'নিজে আঁকুন',exact:true}).click();
 const canvas=page.locator('.alpana-drawing-canvas');
 await draw(canvas);
 assert.equal(await canvas.locator('defs path').count(),1);
 assert.equal(await canvas.locator('use').count(),16);
 const path=await canvas.locator('defs path').getAttribute('d');
 await page.getByRole('button',{name:'আগের ধাপ',exact:true}).click();
 assert.equal(await canvas.locator('defs path').count(),0);
 await page.getByRole('button',{name:'পরের ধাপ',exact:true}).click();
 assert.equal(await canvas.locator('defs path').getAttribute('d'),path);
 return {copies:16,pathSamples:path.split('L').length};
});
await check('Alpana Escape cancels active stroke and export is disabled while drawing',async()=>{
 const canvas=page.locator('.alpana-drawing-canvas');
 await canvas.scrollIntoViewIfNeeded();await canvas.focus();const b=await canvas.boundingBox();
 await page.mouse.move(b.x+b.width*.45,b.y+b.height*.4);await page.mouse.down();
 await page.mouse.move(b.x+b.width*.6,b.y+b.height*.4,{steps:8});
 assert.equal(await page.getByRole('button',{name:'ছবি ডাউনলোড করুন',exact:true}).isDisabled(),true);
 await page.keyboard.press('Escape');await page.mouse.up();
 assert.equal(await canvas.locator('defs path').count(),1);
 assert.equal(await page.getByRole('button',{name:'ছবি ডাউনলোড করুন',exact:true}).isDisabled(),false);
});
await check('Alpana pointer capture commits when released outside canvas',async()=>{
 const canvas=page.locator('.alpana-drawing-canvas');await canvas.scrollIntoViewIfNeeded();const b=await canvas.boundingBox();
 await page.mouse.move(b.x+b.width*.6,b.y+b.height*.6);await page.mouse.down();
 await page.mouse.move(b.x+b.width+18,b.y+b.height*.6,{steps:14});await page.mouse.up();
 assert.equal(await canvas.locator('defs path').count(),2);
 await page.getByRole('button',{name:'আগের ধাপ',exact:true}).click();
 assert.equal(await canvas.locator('defs path').count(),1);
});
await check('Alpana clear is confirmed, cancellable, and undoable',async()=>{
 page.once('dialog',dialog=>dialog.dismiss());
 await page.getByRole('button',{name:'হাতে আঁকা মুছুন',exact:true}).click();
 assert.equal(await page.locator('.alpana-drawing-canvas defs path').count(),1);
 page.once('dialog',dialog=>dialog.accept());
 await page.getByRole('button',{name:'হাতে আঁকা মুছুন',exact:true}).click();
 assert.equal(await page.locator('.alpana-drawing-canvas defs path').count(),0);
 await page.getByRole('button',{name:'আগের ধাপ',exact:true}).click();
 assert.equal(await page.locator('.alpana-drawing-canvas defs path').count(),1);
});
await check('Alpana PNG has finished mirrored artwork in all quadrants',async()=>{
 await page.locator('.alpana-stage').screenshot({path:out+'alpana-workspace.png'});
 const downloadPromise=page.waitForEvent('download');
 await page.getByRole('button',{name:'ছবি ডাউনলোড করুন',exact:true}).click();
 const download=await downloadPromise;await download.saveAs(out+'alpana-freehand.png');
 const png=(await readFile(out+'alpana-freehand.png')).toString('base64');
 const result=await page.evaluate(async src=>{
  const img=new Image();img.src='data:image/png;base64,'+src;await img.decode();
  const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;
  const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);const data=ctx.getImageData(0,0,img.width,img.height).data;
  const quadrants=[0,0,0,0];for(let y=0;y<img.height;y++)for(let x=0;x<img.width;x++){const i=(y*img.width+x)*4;if(data[i]>230&&data[i+1]>210&&data[i+2]>160)quadrants[(y>=img.height/2?2:0)+(x>=img.width/2?1:0)]++;}
  return {width:img.width,height:img.height,quadrants};
 },png);
 assert.deepEqual([result.width,result.height],[1600,1600]);assert.ok(result.quadrants.every(count=>count>100));
 return result;
});
await check('Alpana A4 guide contains the same vectors without editing guides',async()=>{
 const path=await page.locator('.alpana-drawing-canvas defs path').getAttribute('d');
 await page.emulateMedia({media:'print'});
 const print=page.locator('.alpana-print-sheet');
 assert.equal(await print.locator('defs path').getAttribute('d'),path);
 assert.equal(await print.locator('use').count(),16);
 assert.equal(await print.locator('[data-export-ignore]').count(),0);
 await page.pdf({path:out+'alpana-freehand-a4.pdf',preferCSSPageSize:true,printBackground:true});
 await print.screenshot({path:out+'alpana-print.png'});
 await page.emulateMedia({media:'screen'});
});
await check('Bird preset and undo preserve name; no-op preset preserves redo',async()=>{
 await open('kagojer-mela');
 await page.locator('#bird-name').fill('টুনটুনি');
 await page.getByRole('button',{name:'আগের ধাপ',exact:true}).click();
 await page.getByRole('button',{name:'ফুলে সবুজ',exact:true}).click();
 assert.equal(await page.getByRole('button',{name:'পরের ধাপ',exact:true}).isEnabled(),true);
 await page.getByRole('button',{name:'পরের ধাপ',exact:true}).click();
 assert.equal(await page.locator('#bird-name').inputValue(),'টুনটুনি');
 await page.getByRole('button',{name:'হলুদে ফোঁটা',exact:true}).click();
 assert.equal(await page.locator('.paper-palette-options input').nth(1).isChecked(),true);
 await page.getByRole('button',{name:'আগের ধাপ',exact:true}).click();
 assert.equal(await page.locator('.paper-palette-options input').nth(0).isChecked(),true);
 assert.equal(await page.locator('#bird-name').inputValue(),'টুনটুনি');
 await page.locator('.paper-workbench').screenshot({path:out+'bird-history.png'});
});
await check('Language object switch is atomic and current-object click preserves edits',async()=>{
 await open('bhashar-chhobi');
 await page.locator('#word').fill('নিজের বলা নাম');await page.locator('#pronunciation').fill('নিজের উচ্চারণ');await page.locator('#area').fill('কুমিল্লা');
 await page.getByRole('button',{name:'পেয়ারা',exact:true}).click();
 assert.equal(await page.locator('#word').inputValue(),'নিজের বলা নাম');
 await page.getByRole('button',{name:'ঘুড়ি',exact:true}).click();
 assert.equal(await page.locator('#word').inputValue(),'ঘুড়ি');assert.equal(await page.locator('#pronunciation').inputValue(),'');
 await page.getByRole('button',{name:'আগের ধাপ',exact:true}).click();
 assert.equal(await page.locator('#word').inputValue(),'নিজের বলা নাম');assert.equal(await page.locator('#pronunciation').inputValue(),'নিজের উচ্চারণ');
 assert.equal(await page.locator('#area').inputValue(),'কুমিল্লা');
 await page.locator('.language-grid').screenshot({path:out+'language-history.png'});
});
await check('Memory ordering updates postcard and undo restores original order',async()=>{
 await open('amar-chhotobela');
 await page.getByRole('checkbox',{name:'কাগজের নৌকা',exact:true}).check();
 await page.getByRole('checkbox',{name:'বৃষ্টিতে ভেজা',exact:true}).check();
 await page.getByRole('button',{name:'বৃষ্টিতে ভেজা আগে আনুন',exact:true}).click();
 assert.deepEqual(await page.locator('#postcard-accessible-content li').allTextContents(),['বৃষ্টিতে ভেজা','কাগজের নৌকা']);
 await page.getByRole('button',{name:'আগের ধাপ',exact:true}).click();
 assert.deepEqual(await page.locator('#postcard-accessible-content li').allTextContents(),['কাগজের নৌকা','বৃষ্টিতে ভেজা']);
 await page.getByRole('button',{name:'পরের ধাপ',exact:true}).click();
 page.once('dialog',dialog=>dialog.accept());
 await page.getByRole('button',{name:'সব মুছে ফেলুন',exact:true}).click();
 assert.equal(await page.locator('#postcard-accessible-content li').count(),0);
 await page.getByRole('button',{name:'আগের ধাপ',exact:true}).click();
 assert.equal(await page.locator('#postcard-accessible-content li').count(),2);
 const downloadPromise=page.waitForEvent('download');
 await page.getByRole('button',{name:'ছবি ডাউনলোড করুন',exact:true}).click();
 await (await downloadPromise).saveAs(out+'memory-reordered.png');
 await page.locator('.childhood-result').screenshot({path:out+'memory-history.png'});
});
await check('Alpana real touch drawing and native touch cancel at 390px',async()=>{
 const touchContext=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 const touchPage=await touchContext.newPage();touchPage.on('pageerror',error=>errors.push({type:'touch-pageerror',message:error.message}));
 await touchPage.goto('http://127.0.0.1:3100/alpana',{waitUntil:'networkidle'});await touchPage.getByRole('button',{name:'নিজে আঁকুন',exact:true}).click();
 const canvas=touchPage.locator('.alpana-drawing-canvas');await canvas.scrollIntoViewIfNeeded();const b=await canvas.boundingBox();const cdp=await touchContext.newCDPSession(touchPage);
 const point={x:b.x+b.width*.5,y:b.y+b.height*.3,id:1};
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});
 for(let i=1;i<9;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...point,x:point.x+i*3,y:point.y+i*2}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await touchPage.waitForFunction(()=>document.querySelectorAll('.alpana-drawing-canvas defs path').length===1);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...point,id:2}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...point,x:point.x+40,id:2}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
 await touchPage.waitForFunction(()=>document.querySelectorAll('.alpana-drawing-canvas defs path').length===1);
 assert.equal(await touchPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await touchPage.screenshot({path:out+'alpana-touch-mobile.png',fullPage:false});
 await touchContext.close();
});
await writeFile(out+'results.json',JSON.stringify({checkedAt:new Date().toISOString(),checks,errors},null,2));
await browser.close();
console.log(JSON.stringify({passed:checks.filter(c=>c.pass).length,failed:checks.filter(c=>!c.pass).length,errors,results:out+'results.json'}));
