import test from 'node:test';
import assert from 'node:assert/strict';
import {canPlayParty,requirePartyIdentity} from '../party-access.js';
import {PartySession} from '../party.js';

test('a display name or saved profile cannot substitute for a current Google identity',()=>{
 for(const identity of [null,{}, {name:'Counsel'}, {id:'user'}, {id:'',expires:2000}, {id:'user',expires:999}, {id:'user',expires:Infinity}])assert.equal(canPlayParty(identity,1000),false);
 assert.equal(canPlayParty({id:'google-user',expires:2000},1000),true);
 assert.throws(()=>requirePartyIdentity(null),/Sign in with Google/);
});

test('anonymous sessions cannot create, join, start, or submit even through session methods',async()=>{
 const errors=[],session=new PartySession(()=>{},message=>errors.push(message));
 let attempts=0;session.openPeer=async()=>{attempts++;};
 try{
  await assert.rejects(session.create('Counsel'),/Google/);
  await assert.rejects(session.join('Counsel','ABCD'),/Google/);
  assert.throws(()=>session.createLocal(['One','Two']),/Google/);
  session.start();session.submit('answer');
  assert.equal(attempts,0);assert.equal(session.state,null);assert.equal(errors.length,2);
 }finally{session.close();}
});

test('an expired identity cannot submit or keep an existing room alive',()=>{
 let identity={id:'test-user',expires:Date.now()/1000+60};const errors=[];
 const session=new PartySession(()=>{},message=>errors.push(message),()=>identity);
 try{
  session.createLocal(['One','Two']);session.start();assert.equal(session.state.phase,'playing');
  const before=session.state.players[0].score;identity={...identity,expires:1};session.submit('anything');
  assert.equal(session.state.players[0].score,before);session.tick();
  assert.equal(session.closed,true);assert.equal(session.state,null);assert.ok(errors.some(s=>s.includes('expired')));
 }finally{session.close();}
});
