import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const work='/Users/gavin/Documents/Codex/2026-10-21/can-2/work/trial-rework-v42';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH??'/Users/gavin/Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell'}),report=[],errors=[];
try{
 const p=await browser.newPage({viewport:{width:1280,height:600},reducedMotion:'reduce'});p.on('pageerror',e=>errors.push(e.message));await p.goto(process.env.TRIAL_DEMO_URL??'http://localhost:4189/__trial-bots');await p.locator('#tr-demo-play').waitFor();
 await p.evaluate(()=>{window.trDemo.view.practice({autoplay:true,seats:8});const s=window.trDemo.session;clearInterval(s.timer);let now=1000000;s.clock=()=>now;s.virtual=now;s.previous=now;window.until=(stage,kind)=>{for(let i=0;i<30000;i++){if(s.state.stage===stage&&(!kind||s.state.challenge?.kind===kind))return;now+=60;s.tick();if(s.state.stage==='finish'&&stage!=='finish')throw Error('Finished before '+stage);}throw Error('Unreached stage');};});await p.locator('#tr-demo-play').click();
 for(const [stage,kind,name]of [['trial-challenge','memory','memory6'],['trial-brief','cups','poison-brief'],['trial-verdict','mirror','verdict8'],['trial-escape-question',null,'escape8'],['finish',null,'finish8']]){
  await p.evaluate(([stage,kind])=>window.until(stage,kind),[stage,kind]);
  if(name==='memory6')await p.evaluate(()=>{const t=window.trDemo;t.secret.trial.pattern=[0,1,2,3,4,5];t.state.challenge.size=6;t.view.lastKey='';t.session.render();});
  if(name==='poison-brief')await p.evaluate(()=>{const t=window.trDemo;t.session.uid=t.secret.trial.poisoners[0];t.view.lastKey='';t.session.render();});
  for(const [width,height]of [[1280,600],[1024,600]]){
   await p.setViewportSize({width,height});await p.screenshot({path:work+'/'+name+'-'+width+'x'+height+'.png'});
   const r=await p.evaluate(()=>{const m=document.querySelector('.tr-main'),rect=m.getBoundingClientRect();return {horizontal:document.documentElement.scrollWidth>innerWidth,mainHeight:m.clientHeight,mainScroll:m.scrollHeight,mainBottom:rect.bottom,controls:[...m.querySelectorAll('button,input')].filter(b=>!b.disabled).map(b=>{const r=b.getBoundingClientRect();return {text:b.innerText||b.getAttribute('aria-label'),top:r.top,bottom:r.bottom,left:r.left,right:r.right};})};});
   assert.equal(r.horizontal,false);assert.ok(r.mainScroll<=r.mainHeight+2,name+' needs scrolling at '+width);assert.ok(r.controls.every(b=>b.bottom<=r.mainBottom+1),name+' clips a control at '+width);report.push({name,width,height,...r});
  }
  if(name==='poison-brief')await p.evaluate(()=>{window.trDemo.session.uid='p0';window.trDemo.view.lastKey='';window.trDemo.session.render();});
 }
 assert.deepEqual(errors,[]);await writeFile(work+'/layout-verification.json',JSON.stringify({report,errors},null,2));console.log(JSON.stringify(report.map(({controls,...r})=>r)));
}finally{await browser.close();}
