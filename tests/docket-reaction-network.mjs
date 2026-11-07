import {initializeTestEnvironment,assertFails} from '@firebase/rules-unit-testing';
import * as sdk from 'firebase/database';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {CourtGameSession} from '../court-games-session.js';
const env=await initializeTestEnvironment({projectId:'demo-councillion',database:{host:'127.0.0.1',port:9000,rules:await readFile(new URL('../database.rules.json',import.meta.url),'utf8')}}),sessions=[],errors=[];
const wait=async(fn,label)=>{const end=Date.now()+15000;while(Date.now()<end){if(fn())return;await new Promise(r=>setTimeout(r,20));}throw Error(label+' '+errors.join('; '));};
function client(uid){const db=env.authenticatedContext(uid,{firebase:{sign_in_provider:'google.com'}}).database(),s=new CourtGameSession({mode:'docket',identity:()=>({id:uid,uid,expires:Date.now()/1000+3600}),authorize:async()=>({uid}),getCloud:async()=>({...sdk,db}),onError:m=>errors.push(m)});sessions.push(s);return s;}
try{
 await env.clearDatabase();const host=client('cue-host'),friend=client('cue-friend');await host.create('Counsel','krill',true);await friend.join('Friend',host.code);await wait(()=>host.state.players.length===2&&friend.connected,'two clients');await host.request('start');await wait(()=>!!host.secret.docket,'private referee created');
 const cueAt=host.now()+3500;await host.enqueue(async()=>{Object.assign(host.state,{round:1,stage:'docketRead',phase:'playing',stageAt:host.now(),deadline:0,clue:{id:'block-party-1',prompt:'This green Minecraft mob hisses before it explodes.',category:'BLOCK PARTY',value:200,double:false},attempts:{},lockouts:{}});host.secret.docket.buzzAt=cueAt;host.state.revision++;await host.broadcast();});
 await wait(()=>friend.state.stage==='docketRead','shared reading');assert.equal(friend.state.deadline,0);assert.ok(!JSON.stringify(friend.state).includes('buzzAt'));await assertFails(sdk.get(friend.path('responses/'+host.uid+'/secret')));
 await host.close();await wait(()=>friend.host&&friend.refereeReady,'referee transfer');assert.equal(friend.secret.docket.buzzAt,cueAt);if(friend.now()<cueAt)assert.equal(friend.state.stage,'docketRead');await wait(()=>friend.state.stage==='docketBuzz','same hidden cue opens after transfer');assert.ok(friend.state.stageAt>=cueAt);await friend.request('docket-buzz');await wait(()=>friend.state.stage==='docketAnswer','fresh reaction accepted');assert.equal(friend.state.turn,friend.uid);assert.deepEqual(errors,[]);
 console.log('PASS: the opening cue is private, has no public countdown, survives referee transfer and accepts a fresh blue-light reaction.');
}finally{await Promise.all(sessions.map(s=>s.close()));await env.cleanup();}
