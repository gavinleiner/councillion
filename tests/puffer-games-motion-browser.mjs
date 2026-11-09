import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const work='/Users/gavin/Documents/Codex/2026-10-21/can-2/work/cinematic-puffer-games-20261106';
await mkdir(work,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH??'/Users/gavin/Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell'}),errors=[],report={};
const base=process.env.COUNCILLION_URL??'http://localhost:4173/';
try{
 const p=await browser.newPage({viewport:{width:1366,height:650}});p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base+'#games');await p.locator('.pg-door .game-mascot').nth(4).waitFor();await p.waitForTimeout(1700);
 const ids=await p.locator('[id]').evaluateAll(nodes=>nodes.map(n=>n.id));assert.equal(new Set(ids).size,ids.length);
 await p.getByRole('link',{name:'Play Counsel Clash',exact:true}).hover();
 assert.equal(await p.locator('.pg-hall').getAttribute('data-active'),'clash');assert.match(await p.locator('.pg-current').innerText(),/Two benches/);
 assert.equal(await p.locator('.pg-crab-claw').count(),2);assert.equal(await p.locator('.pg-turtle-book').count(),1);assert.equal(await p.locator('.pg-mascot-lids').count(),4);
 await p.mouse.move(1200,420);await p.waitForTimeout(550);const moving=await p.locator('.pg-world').evaluate(el=>getComputedStyle(el).transform);assert.notEqual(moving,'matrix(1, 0, 0, 1, 0, 0)');
 await p.getByRole('button',{name:'Let the puffer pick a game',exact:true}).click();
 assert.ok(['party','testimony','clash','figure','docket','bench'].includes(await p.locator('.pg-hall').getAttribute('data-active')));assert.match(await p.locator('.pg-current-name').innerText(),/THE JUDGE PICKS/);assert.ok(await p.locator('.pg-selected').evaluate(el=>el===document.activeElement));
 await p.getByRole('button',{name:'Pause hall animations',exact:true}).click();await p.waitForTimeout(100);
 if(await p.locator('.pg-hall').getAttribute('data-active')==='bench'){await p.getByRole('button',{name:'← PREVIOUS COVE'}).click();await p.locator('.pg-crab-claw').waitFor();}
 const freeze=()=>p.evaluate(()=>({canvas:document.querySelector('.pg-life').toDataURL(),time:document.querySelector('.pg-crab-claw').getAnimations()[0]?.currentTime,pan:getComputedStyle(document.querySelector('.pg-world')).transform}));
 const frozen=await freeze();await p.waitForTimeout(250);assert.deepEqual(await freeze(),frozen);
 await p.reload();await p.getByRole('button',{name:'Resume hall animations',exact:true}).waitFor();assert.ok(await p.locator('.pg-hall').evaluate(el=>el.classList.contains('pg-paused')));assert.equal(await p.locator('.pg-door').first().evaluate(el=>getComputedStyle(el).opacity),'1');
 await p.getByRole('button',{name:'Resume hall animations',exact:true}).click();await p.locator('.pg-door .game-mascot').nth(4).waitFor();const resumed=await freeze();await p.waitForTimeout(250);assert.notEqual((await freeze()).canvas,resumed.canvas);
 await p.emulateMedia({reducedMotion:'reduce'});await p.getByRole('button',{name:'Reduced motion enabled'}).waitFor();assert.ok(await p.getByRole('button',{name:'Reduced motion enabled'}).isDisabled());assert.equal(await p.locator('.pg-host').evaluate(el=>getComputedStyle(el).animationName),'none');
 await p.mouse.move(200,300);assert.equal(await p.locator('.pg-world').evaluate(el=>getComputedStyle(el).transform),'none');await p.getByRole('button',{name:'Let the puffer pick a game',exact:true}).click();assert.match(await p.locator('.pg-current-name').innerText(),/THE JUDGE PICKS/);
 await p.emulateMedia({reducedMotion:'no-preference'});await p.getByRole('button',{name:'Pause hall animations'}).waitFor();
 if(await p.getByRole('link',{name:'Play Puffer Party',exact:true}).count()===0)await p.getByRole('button',{name:'← PREVIOUS COVE'}).click();
 // A changed route must cancel the delayed entry instead of redirecting later.
 await p.getByRole('link',{name:'Play Puffer Party',exact:true}).click();assert.ok(await p.locator('.pg-hall').evaluate(el=>el.classList.contains('pg-exiting')));await p.evaluate(()=>location.hash='#home');await p.waitForTimeout(650);assert.equal(new URL(p.url()).hash,'#home');
 await p.goto(base+'#games');await p.getByRole('link',{name:'Play Final Figure',exact:true}).click();await p.waitForURL('**/#figure');await p.locator('.ff-hub').waitFor();
 await p.goto(base+'#oath?room=ABCD');await p.getByText('COMING SOON',{exact:true}).waitFor();assert.equal(await p.locator('[data-oath-host],#oa-join').count(),0);
 report.interactions={inlineMascots:4,pixelArtistMascot:1,uniqueSvgIds:true,hover:true,guidePick:true,parallax:true,pauseFreezesCanvasAndSprites:true,pausePersists:true,reducedMotion:true,cancelledEntry:true,animatedNavigation:true,underOathClosed:true};
 // Warm assets, then measure steady-state motion under a slower CPU profile.
 await p.goto(base+'#games');await p.locator('.pg-door .game-mascot').nth(4).waitFor();await p.waitForTimeout(1700);
 const cdp=await p.context().newCDPSession(p);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 report.slowCpu=await p.evaluate(async()=>{
  const intervals=[],longTasks=[];let last,draws=0;const canvas=document.querySelector('.pg-life'),ctx=canvas.getContext('2d'),clear=ctx.clearRect;
  ctx.clearRect=function(...args){draws++;const at=performance.now();if(last)intervals.push(at-last);last=at;return clear.apply(this,args);};
  const observer=new PerformanceObserver(list=>longTasks.push(...list.getEntries().map(e=>e.duration)));observer.observe({type:'longtask',buffered:false});
  const start=performance.now();await new Promise(resolve=>setTimeout(resolve,3500));observer.disconnect();ctx.clearRect=clear;
  const duration=performance.now()-start;intervals.sort((a,b)=>a-b);return {cpuThrottle:4,seconds:duration/1000,canvasFrames:draws,canvasFps:draws/(duration/1000),intervalP95:intervals[Math.floor(intervals.length*.95)]??0,longTasks:longTasks.length,maxLongTask:Math.max(0,...longTasks)};
 });
 await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});assert.ok(report.slowCpu.canvasFrames>=20,'Scene continues updating on slower CPU');
 await p.getByRole('link',{name:'Play Counsel Clash',exact:true}).hover();await p.waitForTimeout(700);await p.screenshot({path:work+'/cinematic-cove-laptop.png'});
 await p.close();
 const mobile=await browser.newPage({viewport:{width:390,height:667},isMobile:true,hasTouch:true});mobile.on('pageerror',e=>errors.push(e.message));await mobile.goto(base+'#games');await mobile.getByRole('button',{name:'Let the puffer pick a game',exact:true}).tap();assert.ok(['party','testimony','clash','figure','docket','bench'].includes(await mobile.locator('.pg-hall').getAttribute('data-active')));assert.equal(await mobile.locator('.pg-selected').count(),1);assert.ok(!await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight));await mobile.waitForTimeout(1600);assert.equal(await mobile.locator('.pg-selected').evaluate(el=>getComputedStyle(el).opacity),'1');await mobile.screenshot({path:work+'/cinematic-cove-phone.png'});await mobile.close();report.mobilePick=true;
 const fallback=await browser.newPage({viewport:{width:1024,height:600}});await fallback.route('**/assets/**/*.svg',route=>route.request().resourceType()==='fetch'?route.abort():route.continue());fallback.on('pageerror',e=>errors.push(e.message));await fallback.goto(base+'#games');await fallback.locator('.pg-door .game-mascot').nth(4).waitFor();await fallback.waitForTimeout(300);assert.equal(await fallback.locator('.pg-door img.game-mascot').count(),5);await fallback.getByRole('button',{name:'Let the puffer pick a game',exact:true}).click();assert.ok(['party','testimony','clash','figure','docket','bench'].includes(await fallback.locator('.pg-hall').getAttribute('data-active')));report.failedEnhancementFallback=true;await fallback.close();
 assert.deepEqual(errors,[]);report.errors=errors;await writeFile(work+'/motion-verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();}
