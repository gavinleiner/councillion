import {initializeTestEnvironment} from '@firebase/rules-unit-testing';
import * as sdk from 'firebase/database';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {CourtGameSession} from '../court-games-session.js';
import {tickCourtGame} from '../court-games-engine.js';
const env=await initializeTestEnvironment({projectId:'demo-councillion',database:{host:'127.0.0.1',port:9000,rules:await readFile(new URL('../database.rules.json',import.meta.url),'utf8')}}),sessions=[],errors=[];
const wait=async(fn,label)=>{const end=Date.now()+15000;while(Date.now()<end){if(fn())return;await new Promise(r=>setTimeout(r,25));}throw Error(label+' '+errors.join('; '));};
function owner(uid){const db=env.authenticatedContext(uid,{email:'gavin@theleiners.com',email_verified:true,firebase:{sign_in_provider:'google.com'}}).database(),s=new CourtGameSession({mode:'oath',identity:()=>({id:uid,uid,role:'super_admin',expires:Date.now()/1000+3600}),authorize:async()=>({uid}),getCloud:async()=>({...sdk,db}),onError:m=>errors.push(m)});sessions.push(s);return s;}
try{
 await env.clearDatabase();const h=owner('owner-a'),f=owner('owner-b');await h.create('Counsel','krill',true);await f.join('Witness',h.code);await wait(()=>h.state.players.length===2&&f.connected,'joined private trial');await h.request('start');await wait(()=>!!h.secret.oath,'private referee');
 await h.enqueue(async()=>{tickCourtGame(h.state,h.secret,h.state.deadline);tickCourtGame(h.state,h.secret,h.state.deadline);Object.assign(h.state,{stageAt:h.now(),focusOpenedAt:h.now(),deadline:h.now()+35000});await h.broadcast();});await wait(()=>f.state.stage==='oath-write','testimony open');
 f.setOathDraft('A privately saved invention');await wait(()=>h.secret.oath.drafts?.[f.uid]==='A privately saved invention','draft saved');await wait(()=>f.response.oath?.draft==='A privately saved invention','private receipt');assert.ok(!JSON.stringify(h.state).includes('invention'));assert.equal(h.state.locked[f.uid],undefined);
 await h.close();await wait(()=>f.host&&f.refereeReady,'referee handoff');assert.equal(f.secret.oath.drafts[f.uid],'A privately saved invention');
 await f.enqueue(async()=>{f.state.deadline=f.now()-1;await f.broadcast();});await wait(()=>f.state.stage==='oath-shuffle','clock banks draft');assert.equal(f.secret.oath.submissions[f.uid].text,'A privately saved invention');assert.ok(!JSON.stringify(f.state).includes('invention'));
 await f.enqueue(async()=>{f.state.deadline=f.now()-1;await f.broadcast();});await wait(()=>f.state.stage==='oath-vote','voting reveals statements');assert.ok(f.state.choices.some(c=>c.text==='A privately saved invention'));await wait(()=>Object.values(f.response.oath?.ownChoices??{}).length===1,'own choices protected');assert.deepEqual(errors,[]);
 console.log('PASS: owner-only private room draft saves and self receipts, no public typing leak, referee recovery, timeout submission and anonymous voting options.');
}finally{await Promise.all(sessions.map(s=>s.close()));await env.cleanup();}
