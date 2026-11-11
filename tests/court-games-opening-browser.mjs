import {returningVisitor} from './returning-visitor.mjs';
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true}),errors=[];
try{
 const p=await browser.newPage();p.on('pageerror',e=>errors.push(e.message));await p.route('**/*',r=>/^http:\/\/(localhost|127\.0\.0\.1):/.test(r.request().url())?r.continue():r.abort());
 for(const viewport of [{width:1366,height:768},{width:1280,height:720},{width:1024,height:768},{width:390,height:844}]){
  await p.setViewportSize(viewport);await returningVisitor(p);await p.goto('http://localhost:4173/?opening='+viewport.width+'#figure');await p.locator('#cg-name').waitFor();
  await p.evaluate(async()=>{
   const {CourtGameView}=await import('/court-games-view.js'),E=await import('/court-games-engine.js');
   const s=E.createCourtGame('figure',[0,1].map(i=>({id:'p'+i,name:'Counsel '+i,ready:true,connected:true,buddy:'krill'}))),secret={},session={uid:'p0',code:'TEST',host:true,connected:true,response:{},now:()=>Date.now(),close(){},request:async()=>{}};
   const view=new CourtGameView(document.querySelector('#app'),{mode:'figure',identity:()=>null,preferences:{},signIn(){}});view.render(s,session);E.startCourtGame(s,Date.now(),()=>.3);view.render(s,session);window.opening={s,secret,session,view,E};
  });
  await p.waitForFunction(()=>window.opening.view.voyage.ocean.camera>innerHeight*.4&&window.opening.view.voyage.ocean.ready('shallow'),{},{timeout:10000});
  await p.evaluate(()=>{const f=window.opening;f.E.tickCourtGame(f.s,f.secret,f.s.deadline);f.view.render(f.s,f.session);});await p.locator('.ff-open-question h2').waitFor();await p.waitForTimeout(120);
  const read=()=>p.evaluate(()=>{
   const f=window.opening,o=f.view.voyage.ocean,h=document.querySelector('.ff-open-question h2'),r=h.getBoundingClientRect(),ink=getComputedStyle(h).color.match(/[\d.]+/g).slice(0,3).map(Number);
   const lum=c=>c.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
   const samples=[];for(const x of [.2,.5,.8])for(const y of [.25,.5,.75]){const bg=[...o.ctx.getImageData(Math.round(r.x+r.width*x),Math.round(r.y+r.height*y),1,1).data].slice(0,3),a=lum(ink),b=lum(bg);samples.push((Math.max(a,b)+.05)/(Math.min(a,b)+.05));}
   return {score:f.s.players[0].score,depth:o.displayedDepth,camera:o.camera,ink,minContrast:Math.min(...samples),overflow:h.scrollHeight>h.clientHeight+1,prompt:r.toJSON()};
  });
  const water=await read();assert.equal(water.score,0);assert.equal(water.depth,0);assert.ok(water.ink[0]>200,'First prompt must be light over underwater scene: '+JSON.stringify(water));assert.ok(water.minContrast>=3,'Large text must contrast with actual rendered water: '+JSON.stringify(water));assert.equal(water.overflow,false);
  // Same zero score, but camera physically above water: ink must adapt again.
  await p.evaluate(()=>{const o=window.opening.view.voyage.ocean;o.set('home',0);o.snap(0);window.opening.view.voyage.updateBiome();});await p.waitForTimeout(120);const sky=await read();assert.ok(sky.ink[0]<80,'Surface prompt needs dark ink even at the same score');
  // A long first prompt can end above the water while its unit falls below
  // it. The unit's position must not turn the entire heading pale on sky.
  await p.evaluate(async()=>{const f=window.opening,{FIGURE_QUESTIONS}=await import('/court-games-data.js');for(const q of FIGURE_QUESTIONS){f.s.question={id:q.id,prompt:q.prompt,unit:q.unit,category:q.category};f.s.revision++;f.view.render(f.s,f.session);const o=f.view.voyage.ocean;o.set('home',0);o.snap(0);f.view.voyage.updateBiome();const h=document.querySelector('.ff-open-question h2'),bottom=h.getBoundingClientRect().bottom-f.view.voyage.canvas.getBoundingClientRect().top;if(bottom<o.h*.48&&Number(getComputedStyle(h).color.match(/\d+/)[0])>80)throw Error('Pale text over sky for '+q.id);}});
  await p.evaluate(()=>{window.opening.view.destroy();delete window.opening;});
 }
 assert.deepEqual(errors,[]);console.log('PASS: real lobby → intro descent → first estimate at zero score; actual canvas/ink contrast at four sizes; surface and underwater ink at the same score.');
}finally{await browser.close();}
