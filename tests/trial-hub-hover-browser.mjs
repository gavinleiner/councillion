import {returningVisitor} from './returning-visitor.mjs';
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';

const work=new URL('../../../work/trial-hub-hover-v39/',import.meta.url);
await mkdir(work,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH??'/Users/gavin/Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell'});
const report=[],errors=[];
try{
 for(const [width,height] of [[1366,768],[1280,600],[1024,600],[390,844]]){
  const page=await browser.newPage({viewport:{width,height}});
  page.on('pageerror',error=>errors.push(error.message));
  await returningVisitor(page);await page.goto('http://localhost:4173/#trial');
  const door=page.getByRole('button',{name:'Enter the Trial by Puffer courthouse'});
  await door.waitFor();await page.evaluate(()=>document.fonts.ready);
  const before=await door.boundingBox();
  // Keep the pointer inside the original left quarter. A hover that replaces
  // the centering translation moves the button away and loops enter/leave.
  await page.mouse.move(before.x+before.width*.2,before.y+before.height*.5);
  const frames=await door.evaluate(async element=>{
   const rows=[];
   for(let i=0;i<36;i++){
    await new Promise(requestAnimationFrame);
    const r=element.getBoundingClientRect();
    rows.push({x:r.x,y:r.y,width:r.width,height:r.height,hover:element.matches(':hover')});
   }
   return rows;
  });
  await page.screenshot({path:new URL(`hover-${width}x${height}.png`,work).pathname});
  const drift=Math.max(...frames.map(r=>Math.abs(r.x-before.x)));
  const result={width,height,before,drift,settled:frames.slice(-8),horizontalOverflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)};
  report.push(result);
  await writeFile(new URL('hover-verification.json',work),JSON.stringify(report,null,2));
  assert.ok(drift<1,`Courthouse jumps horizontally by ${drift.toFixed(1)}px on hover at ${width}x${height}`);
  assert.ok(frames.slice(-8).every(r=>r.hover),'Stationary pointer must stay on the courthouse');
  assert.ok(frames.every(r=>Math.abs(r.y-before.y)<=2.5),'Hover lift must stay subtle');
  assert.equal(result.horizontalOverflow,false);
  // Both pointer activation and keyboard activation must still reach setup.
  await door.click();await page.locator('#tr-name').waitFor();
  await page.reload();await door.waitFor();
  await door.focus();await page.keyboard.press('Enter');await page.locator('#tr-name').waitFor();
  await page.close();
 }
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({viewports:report.length,maxHorizontalDrift:Math.max(...report.map(r=>r.drift)),pointerAndKeyboardEntry:true,errors}));
}finally{await browser.close();}
