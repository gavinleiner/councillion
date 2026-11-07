import test from 'node:test';
import assert from 'node:assert/strict';
import {OathPreviewSession,authorizeOathPreview} from '../oath-preview.js';
import {isGameAvailable} from '../game-availability.js';
const owner=()=>({id:'owner-google-id',uid:'owner',role:'super_admin',expires:Date.now()/1000+3600});
test('private preview uses current owner entitlement and checks server permission before opening',async()=>{
 assert.equal(isGameAvailable('oath',owner()),true);
 for(const identity of [null,{email:'gavin@theleiners.com'},{...owner(),role:'player'},{...owner(),expires:1}])assert.equal(isGameAvailable('oath',identity),false);
 let path,reads=0;const cloud={db:{},ref:(db,p)=>(path=p),get:async()=>{reads++;return {};}};
 const verified=await authorizeOathPreview({identity:owner,authorize:async()=>({identity:owner()}),getCloud:async()=>cloud});assert.equal(verified.role,'super_admin');assert.equal(path,'ownerPreviews/oath');assert.equal(reads,1);
 await assert.rejects(authorizeOathPreview({identity:owner,authorize:async()=>({identity:{role:'player'}}),getCloud:async()=>{throw Error('Must not read');}}),/owner-only/);
 await assert.rejects(authorizeOathPreview({identity:owner,authorize:async()=>({identity:owner()}),getCloud:async()=>({...cloud,get:async()=>{throw Error('PERMISSION_DENIED');}})}),/PERMISSION_DENIED/);
});
test('owner can play all six cases against bots with actual scoring and a replay',async()=>{
 let now=Date.now();const errors=[],phases=new Set();
 const session=new OathPreviewSession({identity:owner,verified:owner(),name:'Gavin',clock:()=>now,onState:s=>phases.add(s.stage),onError:e=>errors.push(e)});
 try{
  session.render();assert.equal(session.state.players.length,6);assert.equal(session.preview,true);await session.request('start');
  for(let i=0;i<1600&&session.state.stage!=='finish';i++){
   const s=session.state;
   if(s.stage==='oath-write'&&!s.locked[session.uid])await session.request('oath-bluff',{text:'A plausible invention'});
   if(s.stage==='oath-vote'&&!s.voted[session.uid])await session.request('oath-vote',{choice:session.secret.oath.options.find(o=>o.kind==='truth').id});
   now+=500;session.tick();
  }
  assert.deepEqual(errors,[]);assert.equal(session.state.stage,'finish');assert.equal(session.state.round,6);assert.ok(session.state.players.find(p=>p.id===session.uid).score>=7000);
  for(const phase of ['lobby','oath-intro','oath-write','oath-vote','oath-reveal','oath-standings','finish'])assert.ok(phases.has(phase));
  await session.request('start');assert.equal(session.state.stage,'oath-intro');
 }finally{await session.close();}
});
