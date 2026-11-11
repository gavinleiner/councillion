import test from 'node:test';
import assert from 'node:assert/strict';
import {Window} from 'happy-dom';
import {supportDay,mountDailySupport,SUPPORT_DAY_KEY,WEEKLY_CASE_URL} from '../daily-support.js';
const date=new Date('2026-11-11T12:00:00Z');
function fixture({day,hidden=false,blocked=false,motion=true}={}){
 const window=new Window({url:'https://gavinleiner.github.io/councillion/#daily'}),document=window.document;document.body.innerHTML='<main id="app"></main>';
 let visibility=hidden?'hidden':'visible',loads=0;Object.defineProperty(document,'visibilityState',{get:()=>visibility});
 if(day)window.localStorage.setItem(SUPPORT_DAY_KEY,day);if(!motion)window.localStorage.setItem('fc:settings',JSON.stringify({motion:false}));
 if(blocked)for(const key of ['localStorage','sessionStorage'])Object.defineProperty(window,key,{get(){throw Error('Storage unavailable');}});
 const gate=mountDailySupport({window,document,now:()=>date,onContinue:()=>loads++});
 const root=document.querySelector('#daily-support');root?.addEventListener('click',e=>e.preventDefault());
 return {window,document,gate,root,get loads(){return loads;},click(){root.dispatchEvent(new window.MouseEvent('click',{bubbles:true,cancelable:true,button:0}));},visibility(value){visibility=value;document.dispatchEvent(new window.Event('visibilitychange'));},close(){gate.dispose();return window.happyDOM.close();}};
}
const settled=()=>new Promise(r=>setTimeout(r,5));
test('support day uses New York midnight including daylight-saving boundaries',()=>{
 assert.equal(supportDay(new Date('2026-11-11T04:59:59Z')),'2026-11-10');assert.equal(supportDay(new Date('2026-11-11T05:00:00Z')),'2026-11-11');
 assert.equal(supportDay(new Date('2026-07-01T03:59:59Z')),'2026-06-30');assert.equal(supportDay(new Date('2026-07-01T04:00:00Z')),'2026-07-01');
 assert.equal(supportDay(new Date('2026-11-01T05:59:00Z')),'2026-11-01');assert.equal(supportDay(new Date('2026-11-01T06:01:00Z')),'2026-11-01');
});
test('first daily arrival clearly discloses the real new-tab weekly-case link and holds game startup',async()=>{const f=fixture();try{assert.equal(f.loads,0);assert.equal(f.gate.shown,true);assert.equal(f.root.href,WEEKLY_CASE_URL);assert.equal(f.root.target,'_blank');assert.equal(f.root.rel,'noopener');assert.match(f.root.textContent,/ON PURPOSE/);assert.match(f.root.textContent,/required each day to play Councillion/);assert.match(f.root.textContent,/supports our website/);assert.match(f.root.textContent,/Councillion stays open/);assert.equal(f.window.localStorage.getItem(SUPPORT_DAY_KEY),null);}finally{await f.close();}});
test('opening gesture records the day but cannot start a game before the case-tab return',async()=>{const f=fixture();try{f.click();await settled();assert.equal(f.window.localStorage.getItem(SUPPORT_DAY_KEY),'2026-11-11');assert.equal(f.loads,0);assert.equal(f.root.getAttribute('href'),null);assert.match(f.root.textContent,/YOUR SEAT/);f.visibility('hidden');assert.equal(f.loads,0);f.visibility('visible');assert.equal(f.loads,1);assert.equal(f.gate.shown,false);assert.equal(f.document.documentElement.hasAttribute('data-support'),false);f.visibility('hidden');f.visibility('visible');assert.equal(f.loads,1);}finally{await f.close();}});
test('background-tab/popup fallback offers one explicit return without reopening the case',async()=>{const f=fixture();try{f.click();await settled();assert.equal(f.root.getAttribute('target'),null);assert.equal(f.root.getAttribute('role'),'button');f.click();assert.equal(f.loads,1);assert.equal(f.gate.started,true);}finally{await f.close();}});
test('returning on the same shared day goes directly to the game; yesterday does not',async()=>{const a=fixture({day:'2026-11-11'}),b=fixture({day:'2026-11-10'});try{assert.equal(a.loads,1);assert.equal(a.gate.shown,false);assert.equal(b.loads,0);assert.equal(b.gate.shown,true);}finally{await a.close();await b.close();}});
test('an already-supported background page waits until it is visible before starting',async()=>{const f=fixture({day:'2026-11-11',hidden:true});try{assert.equal(f.loads,0);f.visibility('visible');assert.equal(f.loads,1);}finally{await f.close();}});
test('another tab completing today removes the duplicate prompt without opening another case',async()=>{const f=fixture();try{f.window.dispatchEvent(new f.window.StorageEvent('storage',{key:SUPPORT_DAY_KEY,newValue:'2026-11-10'}));assert.equal(f.loads,0);f.window.dispatchEvent(new f.window.StorageEvent('storage',{key:SUPPORT_DAY_KEY,newValue:'2026-11-11'}));assert.equal(f.loads,1);assert.equal(f.gate.shown,false);}finally{await f.close();}});
test('blocked browser storage never traps a visitor',async()=>{const f=fixture({blocked:true});try{f.click();await settled();f.click();assert.equal(f.loads,1);}finally{await f.close();}});
test('disposed or repeated interaction cannot boot the game twice',async()=>{const f=fixture();try{f.click();f.gate.dispose();await settled();f.visibility('hidden');f.visibility('visible');assert.equal(f.loads,0);assert.equal(f.gate.shown,false);}finally{await f.close();}});

test('saved reduced-motion preference applies before the game loads',async()=>{const f=fixture({motion:false});try{assert.equal(f.root.dataset.motion,'reduced');assert.equal(f.loads,0);}finally{await f.close();}});
