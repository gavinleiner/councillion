import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const errors=[];
try {
 const c=await browser.newContext({viewport:{width:1280,height:720}});
 await c.route('**/*',r=>/^http:\/\/(localhost|127\.0\.0\.1):/.test(r.request().url())?r.continue():r.abort());
 const p=await c.newPage();await p.emulateMedia({reducedMotion:'no-preference'});p.on('pageerror',e=>errors.push(e.message));
 for(const mode of ['clash','figure']){
  await p.goto('http://localhost:4173/#'+mode);await p.locator('#cg-name').waitFor();
  for(const viewport of [{width:1280,height:720},{width:1024,height:768},{width:390,height:844}]){
   await p.setViewportSize(viewport);
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,mode+' entrance overflows');
   const sizes=await p.locator('[data-cg-buddy] img,[data-cg-buddy] svg').evaluateAll(ns=>ns.map(n=>n.getBoundingClientRect().height));assert.ok(sizes.every(h=>h>=30),'all character choices remain visible');
   if(viewport.width>760){const host=await p.locator('[data-cg-host]').boundingBox(),join=await p.locator('#cg-join').boundingBox();assert.ok(host.y>50&&join.y+join.height<viewport.height-10,'host/join fit laptop');}
  }
 }
 await p.setViewportSize({width:1280,height:720});
 await p.evaluate(async()=>{
  const {CourtGameView}=await import('./court-games-view.js'),E=await import('./court-games-engine.js'),D=await import('./court-games-data.js');
  const ps=Array.from({length:8},(_,i)=>({id:'p'+i,name:['Gavin','Logan','Jack','Alex','Taylor','Morgan','Riley','Jordan'][i],buddy:['krill','squid','angler','schooler','evil'][i%5],ready:true,connected:true})),s=E.createCourtGame('figure',ps),secret={estimates:{},fast:{}};
  E.startCourtGame(s,Date.now()-4000,()=>.3);E.tickCourtGame(s,secret,Date.now());
  const session={uid:'p0',host:true,code:'TEST',connected:true,meta:{host:'p0'},members:{p0:{online:true}},response:{},now:()=>Date.now(),close(){},ready:async()=>{},request:async()=>{}};
  const view=new CourtGameView(document.querySelector('#app'),{mode:'figure',identity:()=>null,preferences:{},signIn(){}});
  window.figureFixture={view,E,D,s,secret,session};view.render(s,session);window.estimateBefore=document.querySelector('#cg-estimate');
 });
 const cpu=await c.newCDPSession(p);await cpu.send('Emulation.setCPUThrottlingRate',{rate:4});
 await p.locator('#cg-estimate').fill('12345');await p.locator('#cg-estimate').evaluate(n=>n.setSelectionRange(2,2));
 await p.evaluate(()=>{const {view,s,session}=window.figureFixture;s.locked.p1=true;s.revision++;view.render(s,session);});
 assert.equal(await p.evaluate(()=>document.querySelector('#cg-estimate')===window.estimateBefore&&document.activeElement===window.estimateBefore&&document.activeElement.selectionStart===2),true,'another sealed guess must not recreate the active input');
 assert.match(await p.locator('[data-estimate-preview]').innerText(),/12,345/);await cpu.send('Emulation.setCPUThrottlingRate',{rate:1});
 assert.equal(await p.locator('#cg-estimate').inputValue(),'12345');assert.match(await p.locator('.cg-seal-progress>span').innerText(),/1 \/ 8/);
 assert.equal(await p.locator('.cg-reveal-rows').count(),0,'other guesses stay hidden');
 for(const viewport of [{width:1366,height:768},{width:1366,height:650},{width:1280,height:720},{width:1280,height:600},{width:1024,height:768},{width:1024,height:600},{width:390,height:844}]){
  await p.setViewportSize(viewport);await p.evaluate(()=>{
   const {view,s,session,D}=window.figureFixture;
   for(const q of D.FIGURE_QUESTIONS){s.question={id:q.id,prompt:q.prompt,unit:q.unit,category:q.category};s.revision++;view.render(s,session);
    const heading=document.querySelector('.cg-figure-copy h2').getBoundingClientRect(),unit=document.querySelector('.cg-unit').getBoundingClientRect(),dock=document.querySelector('.cg-estimate-dock').getBoundingClientRect();
    if(heading.bottom>unit.top+1)throw Error('Question covers its unit: '+q.id);
    if(innerWidth>760&&unit.bottom>dock.top)throw Error('Prompt covers answer dock: '+q.id);
    if(document.documentElement.scrollWidth>innerWidth)throw Error('Overflow '+q.id);
    const button=document.querySelector('#cg-estimate-form button').getBoundingClientRect(),input=document.querySelector('#cg-estimate').getBoundingClientRect();
    if(innerWidth>760&&(button.bottom>innerHeight||input.width<150))throw Error('Unusable estimate field '+q.id);
   }
  });
 }
 await p.setViewportSize({width:1280,height:720});
 await p.evaluate(()=>{const {view,s,session}=window.figureFixture;s.players[0].score=4000;s.revision++;view.render(s,session);});
 await p.waitForFunction(()=>window.figureFixture.view.voyage.ocean.displayedDepth>0,{},{timeout:8000});const moving=await p.evaluate(()=>{const o=window.figureFixture.view.voyage.ocean;return {display:o.displayedDepth,target:o.depth,fall:!!o.fall,reduced:o.reduced,hidden:document.hidden,suspended:o.suspended,raf:o.raf};});
 assert.equal(moving.target,4000);assert.ok(moving.display>0&&moving.display<4000&&moving.fall,'camera travels through the world: '+JSON.stringify(moving));
 await p.waitForFunction(()=>window.figureFixture.view.voyage.ocean.displayedDepth===4000,{},{timeout:15000});
 assert.equal(await p.locator('.cg-current-biome').innerText(),'HADAL DEPTHS');assert.equal(await p.evaluate(()=>window.figureFixture.view.voyage.ocean.displayedDepth),4000);
 assert.equal(await p.evaluate(()=>window.figureFixture.view.voyage.ocean.ready('hadal')),true,'deep biome art is loaded');
 await p.emulateMedia({reducedMotion:'reduce'});
 await p.evaluate(()=>{const {view,s,session}=window.figureFixture;s.players[0].score=4500;s.revision++;view.render(s,session);});await p.waitForTimeout(120);
 assert.equal(await p.evaluate(()=>window.figureFixture.view.voyage.ocean.displayedDepth),4500);
 await p.evaluate(()=>{const {view}=window.figureFixture,o=view.voyage.ocean,canvas=view.voyage.canvas;view.destroy();if(!o.suspended||canvas.isConnected||o.raf!==null)throw Error('Voyage renderer leaked after leaving');});
 assert.deepEqual(errors,[]);console.log('PASS: distinct hubs at three sizes; character visibility; stable private estimate input; all 1001 prompt layouts at seven sizes; real 0–4000m descent and hadal art; reduced motion; renderer cleanup.');
 await c.close();
} finally {await browser.close();}

