import {initializeTestEnvironment} from '@firebase/rules-unit-testing';
import * as sdk from 'firebase/database';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {CourtGameSession} from '../court-games-session.js';
const env=await initializeTestEnvironment({projectId:'demo-councillion',database:{host:'127.0.0.1',port:9000,rules:await readFile(new URL('../database.rules.json',import.meta.url),'utf8')}}),sessions=[],errors={};
const wait=async(fn,label,ms=20000)=>{const until=Date.now()+ms;while(Date.now()<until){if(await fn())return;await new Promise(r=>setTimeout(r,25));}throw Error(label+': '+JSON.stringify(errors));};
function client(i){const uid='feud-lobby-'+i;errors[uid]=[];const db=env.authenticatedContext(uid,{firebase:{sign_in_provider:'google.com'}}).database(),s=new CourtGameSession({mode:'clash',identity:()=>({id:uid,uid,expires:Date.now()/1000+3600}),authorize:async()=>({uid}),getCloud:async()=>({...sdk,db}),onError:e=>errors[uid].push(e)});sessions.push(s);return s;}
async function send(s,action,p={}){const before=s.lastAck;await s.request(action,p);await wait(()=>s.lastAck!==before,action+' acknowledged');return s.lastResult;}
try{
 await env.clearDatabase();const crew=Array.from({length:4},(_,i)=>client(i)),host=crew[0];await host.create('Counsel','krill',false);for(let i=1;i<4;i++)await crew[i].join('Friend '+i,host.code,'squid');await wait(()=>crew.every(s=>s.connected&&s.state?.players.length===4),'all four clients in lobby');assert.equal(host.state.stageAt,undefined,'Fresh lobby has no stage timestamp');
 await send(crew[1],'team',{team:0});await wait(()=>crew.every(s=>s.state.players.find(p=>p.id===crew[1].uid).team===0),'friend switched bench on every screen');
 await send(host,'team',{team:1});await wait(()=>crew.every(s=>s.state.players.find(p=>p.id===host.uid).team===1),'host switched bench on every screen');
 await send(host,'settings',{settings:{venue:'reef'}});await wait(()=>crew.every(s=>s.state.settings.venue==='reef'),'lobby settings before any stage timestamp');
 await crew[2].ready(false);await wait(()=>host.state.players.find(p=>p.id===crew[2].uid).ready===false,'unready reaches host');assert.match((await send(host,'start')).error,/ready/i);assert.equal(host.state.stage,'lobby');
 await crew[2].ready(true);await wait(()=>host.state.players.every(p=>p.ready),'all ready');assert.equal(host.state.players.find(p=>p.id===crew[1].uid).team,0,'ready does not undo chosen team');assert.equal(host.state.players.find(p=>p.id===host.uid).team,1);
 const started=await send(host,'start');assert.ok(!started?.error);await wait(()=>crew.every(s=>s.state.stage==='faceoff'&&s.state.board?.prompt),'briefing and countdown reach a playable board',45000);assert.equal(new Set(crew.map(s=>s.state.board.id)).size,1);
 const actor=crew.find(s=>host.state.faceoffPlayers.includes(s.uid));await send(actor,'buzz');await wait(()=>crew.every(s=>s.state.stage==='faceAnswer'&&s.state.faceoffTurn===actor.uid),'buzz is shared and answer opens');
 for(const messages of Object.values(errors))assert.ok(!messages.some(m=>/undefined|permission|denied/i.test(m)),JSON.stringify(errors));
 console.log('PASS: four Google players host/join, friend and host both switch teams, lobby settings save, readiness blocks/permits start, chosen teams persist, shared countdown reaches the same board, and buzzing opens the answer.');
}finally{await Promise.all(sessions.map(s=>s.close()));await env.cleanup();}
