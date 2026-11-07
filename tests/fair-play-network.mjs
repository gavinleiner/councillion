import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import * as sdk from 'firebase/database';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {CourtGameSession} from '../court-games-session.js';
import {courtFocusKey} from '../fair-play.js';
import {DOCKET_BY_ID} from '../docket-data.js';
const env=await initializeTestEnvironment({projectId:'demo-councillion',database:{host:'127.0.0.1',port:9000,rules:await readFile(new URL('../database.rules.json',import.meta.url),'utf8')}}),sessions=[],errors=[];
const wait=async(fn,label,ms=12000)=>{const end=Date.now()+ms;while(Date.now()<end){if(await fn())return;await new Promise(r=>setTimeout(r,25));}throw Error(label+': '+JSON.stringify(errors));};
function client(uid,mode,email=uid+'@example.invalid',verified=true){const claims={email,email_verified:verified,firebase:{sign_in_provider:'google.com'}},db=env.authenticatedContext(uid,claims).database(),identity={id:uid,uid,expires:Date.now()/1000+3600,tabExempt:verified&&email.toLowerCase().includes('gavin')};const s=new CourtGameSession({mode,identity:()=>identity,authorize:async()=>({uid}),getCloud:async()=>({...sdk,db}),onError:m=>errors.push(m)});sessions.push(s);return {s,db};}
async function send(s,action,p={}){const old=s.lastAck;await s.request(action,p);await wait(()=>s.lastAck!==old,action);assert.ok(!s.lastResult?.error,JSON.stringify(s.lastResult));return s.lastResult;}
async function setup(mode){const a=client(mode+'-host',mode,'GAVIN.player@example.invalid'),b=client(mode+'-friend',mode);await sdk.set(sdk.ref(a.db,'tabExemptions/'+a.s.googleId),true);await sdk.set(sdk.ref(b.db,'tabExemptions/'+b.s.googleId),false);await a.s.create('Host','krill',true);await b.s.join('Friend',a.s.code);await wait(()=>a.s.state.players.length===2&&b.s.connected,'joined '+mode);await send(a.s,'start');return [a,b];}
async function stage(h,patch,secret){await h.enqueue(async()=>{Object.assign(h.state,patch,{stageAt:h.now(),focusOpenedAt:h.now(),deadline:h.now()+45000});if(secret)Object.assign(h.secret,secret);h.state.revision++;await h.broadcast();});}
async function report(s,extra={}){await sdk.set(s.path('tabFocus/'+s.uid),{game:s.state.matchId,question:courtFocusKey(s.state),hidden:true,leftAt:s.now()-1600,returnedAt:0,at:s.c.serverTimestamp(),...extra});}
try{
 await env.clearDatabase();const ordinary=client('ordinary','figure'),gavin=client('gavin-email','figure','SomeGAVIN@example.invalid'),fake=client('unverified','figure','gavin@example.invalid',false);
 await assertFails(sdk.set(sdk.ref(ordinary.db,'tabExemptions/ordinary'),true));await assertFails(sdk.set(sdk.ref(ordinary.db,'tabExemptions/gavin-email'),true));await assertFails(sdk.set(sdk.ref(fake.db,'tabExemptions/unverified'),true));await assertSucceeds(sdk.set(sdk.ref(gavin.db,'tabExemptions/gavin-email'),true));
 const [a,b]=await setup('figure'),h=a.s,f=b.s;await stage(h,{stage:'estimate',question:{id:h.state.questionIds[0]},locked:{}});await wait(()=>f.state.stage==='estimate','figure question');await new Promise(r=>setTimeout(r,1700));
 await assertFails(sdk.set(f.path('tabFocus/'+h.uid),{game:h.state.matchId,question:courtFocusKey(h.state),hidden:true,leftAt:h.now()-1600,returnedAt:0,at:sdk.serverTimestamp()}));
 await report(f,{question:'old'});await new Promise(r=>setTimeout(r,250));assert.ok(!h.state.locked[f.uid]);await report(f);await wait(()=>h.state.locked[f.uid],'friend guess forfeited');assert.equal(Object.values(h.state.tabSentences).length,1);await new Promise(r=>setTimeout(r,400));assert.equal(Object.values(h.state.tabSentences).length,1);
 await report(h);await new Promise(r=>setTimeout(r,350));assert.ok(!h.state.locked[h.uid],'signed Gavin exemption honored by referee');
 const [d,e]=await setup('docket'),dh=d.s,df=e.s;await stage(dh,{stage:'docketFinalAnswer',round:2,eligible:[dh.uid,df.uid],locked:{},clue:{id:'gaming-final'}},{docket:{...dh.secret.docket,finalId:'gaming-final',wagers:{[dh.uid]:10,[df.uid]:10},answers:{},drafts:{}}});await wait(()=>df.state.stage==='docketFinalAnswer','final response window');
 df.setFinalDraft('Who is Samus Aran?');await wait(()=>dh.secret.docket.drafts?.[df.uid]==='Who is Samus Aran?','final autosave reaches referee');await wait(()=>df.response.finalDraft?.text==='Who is Samus Aran?','own private saved receipt');assert.ok(!JSON.stringify(dh.state).includes('Samus'));
 await assertFails(sdk.get(sdk.ref(d.db,'rooms/'+dh.code+'/responses/'+df.uid+'/finalDraft')));await assertFails(sdk.get(sdk.ref(e.db,'rooms/'+dh.code+'/responses/'+dh.uid+'/secret')));
 await dh.close();await wait(()=>df.host&&df.refereeReady&&df.secret.docket?.drafts?.[df.uid]==='Who is Samus Aran?','draft recovers on referee handoff',45000);
 await stage(df,{deadline:df.now()+1});await df.enqueue(async()=>{df.state.deadline=df.now()-1;await df.broadcast();});await wait(()=>df.state.stage==='docketFinalReveal','timeout banks draft');assert.equal(df.secret.docket.answers[df.uid],'Who is Samus Aran?');
 console.log('PASS: verified-email exemptions cannot be forged; focus reports are self-owned, current-question and idempotent; signed Gavin is exempt; final text autosaves privately, remains hidden, survives referee handoff and banks on timeout.');
}finally{await Promise.all(sessions.map(s=>s.close()));await env.cleanup();}
