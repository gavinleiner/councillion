import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const out=new URL('../../../work/court-rebuild-20261105/',import.meta.url),errors=[];
await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
try{
 const p=await browser.newPage({viewport:{width:1366,height:650}});p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/*',r=>/^http:\/\/(localhost|127\.0\.0\.1):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('http://localhost:4173/#clash');await p.locator('#cg-name').waitFor();
 await p.evaluate(async()=>{
  const {CourtGameView}=await import('/court-games-view.js'),E=await import('/court-games-engine.js'),D=await import('/court-games-data.js');
  let now=Date.now(),s,secret,view;const calls=[];
  const session={uid:'p0',host:true,code:'CREW',connected:true,meta:{host:'p0'},members:{},response:{},drafts:{},now:()=>now,close(){},pending:false,
   async ready(value){s.players.find(p=>p.id===this.uid).ready=value;view.render(s,this);},setDraft(text){this.drafts[this.uid]={text,editedAt:now,game:s.matchId,round:s.round};},
   async request(action,payload={}){calls.push({action,payload});if(action==='start'){E.startCourtGame(s,now);this.lastResult={accepted:true};}
    else if(action==='lobby-rock'){s.lobbyRock={id:crypto.randomUUID(),from:'p0',to:'p1',at:now};s.revision++;this.lastResult={accepted:true};}
    else{try{this.lastResult=E.actCourtGame(s,secret,this.uid,action,{...payload,round:s.round,matchId:s.matchId},now);}catch(e){this.lastResult={error:e.message};}}
    this.lastAck=crypto.randomUUID();view.render(s,this);}}
  const names=['Gavin','Logan','Jack','Alex','Taylor','Morgan','Riley','Jordan','Cameron','Charlie'];
  window.courtTest={E,D,session,calls,get s(){return s;},get secret(){return secret;},get view(){return view;},setNow:n=>now=n,
   make(count=10,mode='clash'){view?.destroy();s=E.createCourtGame(mode,Array.from({length:count},(_,i)=>({id:'p'+i,name:names[i],team:i%2,buddy:['krill','squid','angler','schooler'][i%4],ready:true,online:true,connected:true})));secret={};session.uid='p0';session.response={};session.drafts={};session.lastResult=null;
    view=new CourtGameView(document.querySelector('#app'),{mode,identity:()=>null,preferences:{},signIn(){}});view.render(s,session);},
   render(){view.render(s,session);},start(){E.startCourtGame(s,now);s.questionIds[0]='big-ears';view.render(s,session);},board(){for(const q of s.players)E.actCourtGame(s,secret,q.id,'briefing-ready',{},now);E.tickCourtGame(s,secret,now);now=s.deadline;E.tickCourtGame(s,secret,now);view.render(s,session);},buzz(){now=s.deadline;E.tickCourtGame(s,secret,now);E.actCourtGame(s,secret,'p0','buzz',{},++now);view.render(s,session);}
  };window.courtTest.make();
 });
 await p.evaluate(()=>document.fonts.ready);await p.emulateMedia({reducedMotion:'reduce'});
 const checks=[];
 for(const viewport of [{width:1366,height:650},{width:1280,height:600},{width:1024,height:600},{width:390,height:844}]){
  await p.setViewportSize(viewport);
  for(const count of [2,6,10]){
   await p.evaluate(n=>window.courtTest.make(n),count);
   assert.equal(await p.locator('[data-lobby-player]').count(),count);assert.equal(await p.locator('[data-podium-seat]').count(),10);
   const lobbyPlaces=await p.locator('[data-lobby-player]').evaluateAll(ns=>Object.fromEntries(ns.map(n=>[n.dataset.lobbyPlayer,n.dataset.podiumSeat])));
   await p.evaluate(()=>{window.courtTest.start();window.courtTest.board();});
   assert.equal(await p.locator('[data-cc-player]').count(),count);
   const gamePlaces=await p.locator('[data-cc-player]').evaluateAll(ns=>Object.fromEntries(ns.map(n=>[n.dataset.ccPlayer,n.dataset.podiumSeat])));
   assert.deepEqual(gamePlaces,lobbyPlaces,'same physical places in lobby and game');
   const geometry=await p.evaluate(()=>{
    const b=document.querySelector('.cc-board').getBoundingClientRect(),people=[...document.querySelectorAll('[data-cc-player]')];
    return {overflow:document.documentElement.scrollWidth>innerWidth,avatars:people.map(el=>{const a=el.querySelector('.cc-avatar').getBoundingClientRect(),name=el.querySelector('.cg-counsel-nameplate').getBoundingClientRect();return {id:el.dataset.ccPlayer,x:a.x,y:a.y,w:a.width,h:a.height,nx:name.x,nw:name.width};}),board:b.toJSON()};
   });
   assert.equal(geometry.overflow,false);for(const a of geometry.avatars){assert.ok(a.x>=0&&a.x+a.w<=viewport.width+.5,'every player fits horizontally');assert.ok(a.w>=30&&a.h>=50,'avatars stay legible');assert.ok(Math.abs(a.x+a.w/2-a.nx-a.nw/2)<3,'name is directly below its own player');}
   if(viewport.width>760)assert.ok(geometry.board.y>=75&&geometry.board.y+geometry.board.height<=viewport.height-130,'board stays above the answer dock');
   assert.equal(await p.evaluate(()=>{const role=document.querySelector('.cc-role').getBoundingClientRect(),control=document.querySelector('.cc-control').getBoundingClientRect();return control.top>=role.bottom+2;}),true,'turn instructions and buttons occupy separate dock rows');
   checks.push({viewport,count,passed:true});
   if(count===10&&(viewport.width===1366||viewport.width===1024))await p.screenshot({path:new URL('podium-'+viewport.width+'.png',out).pathname});
  }
 }
 // Validate all aired boards on the smallest supported Chromebook viewport.
 await p.setViewportSize({width:1024,height:600});
 await p.evaluate(()=>{const f=window.courtTest;for(const q of f.D.CLASH_BOARDS){f.s.board={id:q.id,prompt:q.prompt,slots:q.answers.map((a,index)=>({index,revealed:true,...a}))};f.s.round++;f.s.stage='roundResult';f.s.roundResult={winner:0};f.s.revision++;f.render();const h=document.querySelector('.cc-question').getBoundingClientRect(),rows=document.querySelector('.cc-answers').getBoundingClientRect();if(h.bottom>rows.top+.5)throw Error('Prompt overlaps answers: '+q.id);for(const el of document.querySelectorAll('.cc-answer-label'))if(el.scrollHeight>el.clientHeight+1)throw Error('Clipped answer '+q.id+': '+el.textContent);if(document.documentElement.scrollWidth>innerWidth)throw Error('Overflow: '+q.id);}});
 // Enter-only private correction, edit stability, confirmation and reveal hold.
 await p.setViewportSize({width:1366,height:650});await p.evaluate(()=>{const f=window.courtTest;f.make(6);f.start();f.board();f.buzz();});
 await p.locator('#cg-answer').fill('Elephnat');assert.equal(await p.locator('.cc-correction').isVisible(),false);
 await p.locator('#cg-answer').press('Enter');assert.equal(await p.locator('.cc-correction').isVisible(),true);assert.equal(await p.evaluate(()=>window.courtTest.s.stage),'faceAnswer');
 await p.locator('[data-cc-edit]').click();assert.equal(await p.locator('#cg-answer').inputValue(),'Elephnat');assert.equal(await p.locator('.cc-correction').isVisible(),false);
 await p.locator('#cg-answer').press('Enter');await p.locator('[data-cc-confirm]').click();assert.equal(await p.evaluate(()=>window.courtTest.s.stage),'survey');
 await p.evaluate(()=>{const f=window.courtTest;f.setNow(f.s.deadline);f.E.tickCourtGame(f.s,f.secret,f.session.now());f.render();});assert.equal(await p.evaluate(()=>window.courtTest.s.stage),'answerResult');
 assert.match(await p.locator('.cc-role>span').innerText(),/chooses whether/);
 // Secret rocks work in joined lobby; input/controls retain normal Space behavior.
 await p.evaluate(()=>{window.courtTest.make(6);document.activeElement?.blur();});const beforeThrows=await p.evaluate(()=>window.courtTest.calls.filter(c=>c.action==='lobby-rock').length);await p.keyboard.press('Space');assert.equal(await p.evaluate(()=>window.courtTest.calls.filter(c=>c.action==='lobby-rock').length),beforeThrows+1);
 const throws=await p.evaluate(()=>window.courtTest.calls.filter(c=>c.action==='lobby-rock').length);await p.locator('[data-lobby-ready]').focus();await p.keyboard.press('Space');assert.equal(await p.evaluate(()=>window.courtTest.calls.filter(c=>c.action==='lobby-rock').length),throws);
 await p.evaluate(()=>{window.courtTest.make(10);});await p.screenshot({path:new URL('podium-lobby-final.png',out).pathname});
 assert.deepEqual(errors,[]);await writeFile(new URL('podium-audit.json',out),JSON.stringify({checks,boards:200,errors},null,2));
 console.log('PASS: fixed shared podium places for 2/6/10 players at four sizes, all 200 boards on 1024×600, Enter-only corrections, reveal hold, secret rocks and keyboard controls.');
}finally{await browser.close();}
