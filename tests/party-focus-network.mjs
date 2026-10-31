import {initializeTestEnvironment,assertFails} from '@firebase/rules-unit-testing';
import * as sdk from 'firebase/database';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {PartySession} from '../party.js';
import {partyPack} from '../engine.js';
const env=await initializeTestEnvironment({projectId:'demo-councillion',database:{host:'127.0.0.1',port:9000,rules:await readFile(new URL('../database.rules.json',import.meta.url),'utf8')}});
const sessions=[],errors=[];
const wait=async(f,label)=>{const until=Date.now()+20000;while(Date.now()<until){if(await f())return;await new Promise(r=>setTimeout(r,25));}throw Error(label+' '+JSON.stringify(errors));};
function client(uid){const c={...sdk,db:env.authenticatedContext(uid,{firebase:{sign_in_provider:'google.com'}}).database()},s=new PartySession(()=>{},e=>errors.push(uid+': '+e),()=>({id:uid,expires:Date.now()/1000+3600}),async()=>({uid}),async()=>c);sessions.push(s);return s;}
try{
 await env.clearDatabase();const a=client('a'),b=client('b'),c=client('c');
 await a.create('Counsel',{mode:'ranked',isPrivate:true});await b.join('Friend',a.code);await c.join('Third',a.code);await wait(()=>a.state.players.length===3&&sessions.every(s=>s.connected),'three clients');a.start();await wait(()=>sessions.every(s=>s.state?.phase==='playing'),'playing');
 a.state.deadline=Date.now()+600000;a.state.matchStartedAt=Date.now()-20000;await a.broadcast();
 for(let i=0;i<2;i++){const who=a.state.players[a.state.turn].id,s=sessions.find(s=>s.myId===who);await wait(()=>s.state.players[s.state.turn].id===who,'turn sync');s.submit(partyPack(s.state).answers[i].label);await wait(()=>a.state.used.length===i+1,'accepted answer');}
 let leftAt=Date.now();await b.reportFocus({game:b.state.matchId,hidden:true,leftAt});await wait(()=>a.state.players.find(p=>p.id==='b').hearts===1,'first heart');
 await b.reportFocus({game:b.state.matchId,hidden:false,leftAt});await wait(()=>sessions.every(s=>s.state.players.find(p=>p.id==='b').hearts===1),'one shared hit');
 assert.equal(a.state.executions.length,1);assert.match(a.state.notice,/Friend tried to cheat/);assert.equal(a.state.players.find(p=>p.id==='b').connected,true);assert.equal(a.state.players.find(p=>p.id==='c').hearts,2);
 await wait(()=>a.state.phase==='playing','animation pause ends');
 leftAt=Date.now();await c.reportFocus({game:c.state.matchId,hidden:true,leftAt});await c.reportFocus({game:c.state.matchId,hidden:false,leftAt});await new Promise(r=>setTimeout(r,1700));assert.equal(a.state.players.find(p=>p.id==='c').hearts,2,'brief switch is exempt');
 await b.reportFocus({game:'previous-game',hidden:true,leftAt:Date.now()-2000});await new Promise(r=>setTimeout(r,250));assert.equal(a.state.players.find(p=>p.id==='b').hearts,1,'stale match ignored');
 const forged={id:crypto.randomUUID(),type:'ready',patch:{focus:{game:a.state.matchId,hidden:true,leftAt:Date.now()-2000}},at:Date.now()};await assertFails(sdk.set(sdk.ref(b.c.db,'rooms/'+a.code+'/requests/a'),forged));
 leftAt=Date.now();await b.reportFocus({game:b.state.matchId,hidden:true,leftAt});await wait(()=>a.state.players.find(p=>p.id==='b').hearts===0,'second absence costs last heart');assert.equal(a.state.players.find(p=>p.id==='b').forfeit,false);assert.equal(a.state.executions.length,2);
 await wait(()=>a.state.phase==='playing','second pause ends');
 // The host uses precisely the same authenticated self-report path.
 leftAt=Date.now();await a.reportFocus({game:a.state.matchId,hidden:true,leftAt});await wait(()=>a.state.players[0].hearts===1,'host first heart');await a.reportFocus({game:a.state.matchId,hidden:false,leftAt});await wait(()=>a.state.phase==='playing','host pause');
 leftAt=Date.now();await a.reportFocus({game:a.state.matchId,hidden:true,leftAt});await wait(()=>sessions.every(s=>s.state.resultSaved),'last-heart result saved');assert.equal(a.state.winner,'c');assert.equal(a.state.result.players.b.heartsLost,2);assert.equal(a.state.result.players.a.heartsLost,2);assert.equal(a.state.executions.length,4);assert.equal(a.state.result.players.a.forfeit,false);assert.equal(a.state.result.rated,true);
 assert.deepEqual(errors,[]);
 console.log('Three-client tab checks passed: one heart, shared event/name, no repeated penalty, short-switch grace, stale-game immunity, impersonation denied, host parity, last-heart elimination and sealed ranked result.');
}finally{await Promise.all(sessions.map(s=>s.close()));await env.cleanup();}
