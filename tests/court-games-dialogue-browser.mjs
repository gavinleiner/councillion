import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
try{
 const p=await browser.newPage({viewport:{width:1366,height:768}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/*',r=>/^http:\/\/(localhost|127\.0\.0\.1):/.test(r.request().url())?r.continue():r.abort());await p.goto('http://localhost:4173/#clash');await p.locator('#cg-name').waitFor();
 await p.evaluate(async()=>{
  const {CourtGameView}=await import('./court-games-view.js'),E=await import('./court-games-engine.js'),D=await import('./court-games-data.js');
  const players=Array.from({length:6},(_,i)=>({id:'p'+i,name:['Nori','Pearl','Reef','Coral','Finn','Marlin'][i],buddy:['krill','squid','angler','schooler','evil','krill'][i],team:i%2,connected:true,online:true,ready:true}));
  const s=E.createCourtGame('clash',players),secret={estimates:{},fast:{}};E.startCourtGame(s,Date.now()-4000,()=>.2);E.tickCourtGame(s,secret,Date.now());
  const session={uid:'p1',code:'TEST',connected:true,meta:{host:'p0'},members:{p0:{online:true}},response:{},drafts:{},now:()=>Date.now(),close(){},request:async()=>{}};
  const view=new CourtGameView(document.querySelector('#app'),{mode:'clash',identity:()=>null,preferences:{},signIn(){}});window.f={s,session,view,D};s.stage='faceAnswer';s.faceoffTurn='p0';s.faceoffPlayers=['p0','p1'];s.deadline=Date.now()+7000;s.revision++;view.render(s,session);
  window.edit=text=>{session.drafts={p0:{text,editedAt:Date.now(),round:s.round,game:s.matchId},p1:{text:'inactive player',editedAt:Date.now(),round:s.round,game:s.matchId}};view.updateClock();};
 });
 await p.evaluate(()=>window.edit('Blue whalex'));await p.waitForTimeout(220);assert.equal(await p.locator('.cg-answer-bubble>span').innerText(),'Blue whalex');
 await p.evaluate(()=>{window.bubble=document.querySelector('.cg-answer-bubble');window.edit('Blue whale');});await p.waitForTimeout(220);assert.equal(await p.locator('.cg-answer-bubble>span').innerText(),'Blue whale');assert.equal(await p.evaluate(()=>window.bubble===document.querySelector('.cg-answer-bubble')),true);assert.equal(await p.locator('.cg-answer-bubble').count(),1);
 const r=await p.evaluate(()=>{const b=document.querySelector('.cg-answer-bubble').getBoundingClientRect(),a=document.querySelector('.cg-board').getBoundingClientRect();return {b:b.toJSON(),a:a.toJSON()};});assert.ok(r.b.y>=r.a.bottom,'face-off draft stays below the board');
 await p.evaluate(()=>window.edit(''));assert.equal(await p.locator('.cg-answer-bubble').isVisible(),false);
 await p.evaluate(()=>{const {s,view,session}=window.f;s.stage='control';s.turn='p0';s.controlTeam=0;s.deadline=Date.now()+18000;s.revision++;view.render(s,session);window.edit('Watermelon');});await p.waitForTimeout(1200);
 const width=await p.locator('.cg-board').evaluate(el=>el.getBoundingClientRect().width);
 await p.evaluate(()=>{const {s,view,session}=window.f;s.controlTeam=1;s.turn='p1';s.revision++;view.render(s,session);});
 for(const wait of [80,450,550]){await p.waitForTimeout(wait);const geometry=await p.evaluate(()=>({scale:new DOMMatrix(getComputedStyle(document.querySelector('.cg-feud-architecture')).transform).a,width:document.querySelector('.cg-board').getBoundingClientRect().width,transition:getComputedStyle(document.querySelector('.cg-board')).transitionProperty}));assert.ok(geometry.scale>0,'the world never collapses while changing sides');assert.ok(Math.abs(geometry.width-width)<1,'board does not reflow during a move');assert.equal(geometry.transition,'transform');}
 assert.equal(await p.locator('.cg-shot-cut').count(),0,'no flash curtain');assert.equal(await p.locator('#cg-event').isVisible(),false);
 // Longest aired prompts, all main camera compositions and small laptops.
 await p.emulateMedia({reducedMotion:'reduce'});
 for(const viewport of [{width:1366,height:768},{width:1280,height:720},{width:1024,height:768}]){
  await p.setViewportSize(viewport);
  await p.evaluate(()=>{const {s,view,session,D}=window.f;for(const q of D.CLASH_BOARDS)for(const stage of ['faceoff','control','steal']){
   s.board={id:q.id,prompt:q.prompt,slots:q.answers.map((a,index)=>({index,revealed:false}))};s.stage=stage;s.turn='p0';s.controlTeam=0;s.stealTeam=0;s.round++;s.deadline=Date.now()+18000;s.revision++;view.render(s,session);
   const b=document.querySelector('.cg-host-bubble').getBoundingClientRect();if(b.left<0||b.right>innerWidth||b.top<65||b.bottom>innerHeight-10)throw Error('Clipped host bubble '+innerWidth+' '+q.id+' '+stage);
   if(document.documentElement.scrollWidth>innerWidth)throw Error('Page overflow');
  }});
 }
 // Both receiving views use the same renderer; isolated runner gets no draft.
 await p.evaluate(()=>{const {s,view,session,D}=window.f;s.stage='fast';s.fastPass=0;s.fastPlayers=['p0','p2'];s.fastIds=D.CLASH_BOARDS.slice(0,5).map(q=>q.id);s.fast={total:0};s.turn='p0';s.deadline=Date.now()+20000;s.revision++;session.uid='p1';session.response.liveAnswer={uid:'p0',matchId:s.matchId,round:s.round,pass:0,cursor:0,deadline:s.deadline,text:'Audience answer',at:Date.now()};view.render(s,session);});
 await p.waitForTimeout(220);assert.equal(await p.locator('.cg-answer-bubble>span').innerText(),'Audience answer');
 await p.evaluate(()=>{const {s,view,session}=window.f;session.uid='p2';session.response={};view.render(s,session);});assert.equal(await p.locator('.cg-answer-bubble').isVisible(),false);assert.match(await p.locator('.cg-host-bubble').innerText(),/quiet bench/);
 assert.deepEqual(errors,[]);console.log('PASS: remote live edits/deletions, stable bubble, no off-turn draft, no board overlap, transform-only camera moves without a world flip, all 200 prompts across three laptop sizes, caption removal, and Fast Money audience/isolation.');
}finally{await browser.close();}
