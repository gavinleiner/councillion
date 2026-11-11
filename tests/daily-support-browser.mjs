import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const out=new URL('../../../work/daily-support-v48/',import.meta.url).pathname;await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH??'/Users/gavin/Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell'}),errors=[],report=[];
try{
 for(const [width,height]of [[1366,768],[1024,600],[390,844]]){
  const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  // Keep end-to-end checks local: verify the real destination URL while the
  // popup's response is a fixture rather than generating public test traffic.
  await context.route('https://futurecounsel.org/**',r=>r.fulfill({contentType:'text/html',body:'<title>Weekly case fixture</title><h1>Future Counsel weekly case</h1>'}));
  await page.goto('http://localhost:4173/#daily',{waitUntil:'domcontentloaded'});await page.locator('#daily-support').waitFor();
  assert.equal(await page.locator('script[src*="game.bundle.js"]').count(),0);assert.equal(await page.locator('#app').textContent(),'');
  assert.equal(await page.locator('#daily-support').getAttribute('href'),'https://futurecounsel.org/weekly');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:out+'notice-'+width+'.png',animations:'disabled'});
  const popupPromise=page.waitForEvent('popup');if(width===1024)await page.keyboard.press('Enter');else await page.mouse.click(15,180);const popup=await popupPromise;await popup.waitForLoadState('domcontentloaded');assert.equal(popup.url(),'https://futurecounsel.org/weekly');
  await page.bringToFront();if(await page.locator('#daily-support').count())await page.locator('#daily-support').click();
  await page.waitForSelector('.dive-controls',{timeout:30000});assert.equal(await page.locator('#daily-support').count(),0);assert.match(await page.locator('script[src*="game.bundle.js"]').getAttribute('src'),/daily-support-v48/);
  // A reload keeps the route and does not produce a second support visit.
  await page.reload({waitUntil:'domcontentloaded'});await page.waitForSelector('.dive-controls');assert.equal(await page.locator('#daily-support').count(),0);assert.equal(context.pages().length,2);
  await page.evaluate(()=>{localStorage.setItem('fc:support:visited-on','2000-01-01');sessionStorage.setItem('fc:support:visited-on','2000-01-01');});await page.reload({waitUntil:'domcontentloaded'});await page.locator('#daily-support').waitFor();assert.equal(await page.locator('script[src*="game.bundle.js"]').count(),0);
  report.push({width,height,firstArrival:true,weeklyPopup:true,keyboard:width===1024,returnStartsGame:true,sameDaySkips:true,nextDayReturns:true});await context.close();
 }
 assert.deepEqual(errors,[]);await writeFile(out+'browser-verification.json',JSON.stringify({report,errors},null,2));console.log(JSON.stringify({report,errors},null,2));
}finally{await browser.close();}
