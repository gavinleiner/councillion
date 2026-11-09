import test from 'node:test';
import assert from 'node:assert/strict';
import {OathPreviewSession,authorizeOathPreview} from '../oath-preview.js';
import {isGameAvailable,isGameEntryAvailable,canPreviewOath} from '../game-availability.js';
import {PRESIDENT_EMAIL,VICE_PRESIDENT_EMAIL,canAdmin} from '../account-honors.js';
const owner=()=>({id:'owner-google-id',uid:'owner',role:'super_admin',expires:Date.now()/1000+3600});
const president=()=>({id:'pres-google-id',uid:'pres',email:PRESIDENT_EMAIL,role:'player',honor:{kind:'president',title:'pres'},expires:Date.now()/1000+3600});
test('Gavin school account retains local preview entitlement alongside public multiplayer access',async()=>{
 const identity=president();assert.equal(canAdmin(identity),false);assert.equal(canPreviewOath(identity),true);assert.equal(isGameEntryAvailable('oath',identity),true);assert.equal(isGameAvailable('oath',identity),true);
 for(const invalid of [{...identity,email:VICE_PRESIDENT_EMAIL},{...identity,email:'another.gavin@example.invalid'},{...identity,honor:null},{...identity,expires:1}])assert.equal(canPreviewOath(invalid),false);
 let reads=0;const verified=await authorizeOathPreview({identity:president,authorize:async()=>({identity}),getCloud:async()=>({db:{},ref:(_,p)=>p,get:async p=>{assert.equal(p,'ownerPreviews/oath');reads++;}})});assert.equal(verified.role,'player');assert.equal(reads,1);
 const session=new OathPreviewSession({identity:president,verified:identity,onState(){}});try{await session.request('start');assert.equal(session.state.stage,'oath-intro');assert.equal(session.state.players.length,6);}finally{await session.close();}
});
test('private preview uses current owner entitlement and checks server permission before opening',async()=>{
 assert.equal(isGameAvailable('oath',owner()),true);
 for(const identity of [null,{email:'gavin@theleiners.com'},{...owner(),role:'player'},{...owner(),expires:1}]){assert.equal(isGameAvailable('oath',identity),true);assert.equal(canPreviewOath(identity),false);}
 let path,reads=0;const cloud={db:{},ref:(db,p)=>(path=p),get:async()=>{reads++;return {};}};
 const verified=await authorizeOathPreview({identity:owner,authorize:async()=>({identity:owner()}),getCloud:async()=>cloud});assert.equal(verified.role,'super_admin');assert.equal(path,'ownerPreviews/oath');assert.equal(reads,1);
 await assert.rejects(authorizeOathPreview({identity:owner,authorize:async()=>({identity:{role:'player'}}),getCloud:async()=>{throw Error('Must not read');}}),/owner-only/);
 await assert.rejects(authorizeOathPreview({identity:owner,authorize:async()=>({identity:owner()}),getCloud:async()=>({...cloud,get:async()=>{throw Error('PERMISSION_DENIED');}})}),/PERMISSION_DENIED/);
});
test('owner can play all six impostor cases against bots and replay',async()=>{
 let now=Date.now();const errors=[],phases=new Set(),session=new OathPreviewSession({identity:owner,verified:owner(),name:'Gavin',clock:()=>now,onState:s=>phases.add(s.stage),onError:e=>errors.push(e)});
 try{session.render();await session.request('start');for(let i=0;i<2000&&session.state.stage!=='finish';i++){
  const s=session.state;if(s.stage==='oath-write'&&s.turn===session.uid&&!s.locked[session.uid])await session.request('oath-bluff',{text:'A useful clue'});
  if(s.stage==='oath-vote'&&!s.voted[session.uid])await session.request('oath-vote',{choice:s.players.find(p=>p.id!==session.uid).id});
  if(s.stage==='oath-guess'&&s.turn===session.uid&&!s.guessSealed)await session.request('oath-guess',{text:'Something else'});
  now+=500;session.tick();
 }assert.deepEqual(errors,[]);assert.equal(session.state.stage,'finish');assert.equal(session.state.history.length,6);for(const phase of ['lobby','oath-intro','oath-write','oath-share','oath-vote','oath-accuse','oath-reveal','oath-standings','finish'])assert.ok(phases.has(phase));await session.request('start');assert.equal(session.state.stage,'oath-intro');}finally{await session.close();}
});
