import test from 'node:test';
import assert from 'node:assert/strict';
import {waitForDatabaseConnection,databaseClockOffset,compatiblePublicRooms,partyConnectionError} from '../party-connection.js';
import {PartySession} from '../party.js';
import {googleIdentity} from '../account-identity.js';
import {canPlayParty} from '../party-access.js';

test('ordinary Google email addresses can play without an owner badge or email allowlist',async()=>{
 for(const email of ['external.player@example.invalid','someone@outlook.com','student@school.example']){
  const identity=await googleIdentity({uid:'firebase-user',providerData:[{providerId:'google.com',uid:'google-user'}],email,displayName:'Jack',getIdTokenResult:async()=>({signInProvider:'google.com',expirationTime:new Date(Date.now()+3600000).toISOString(),claims:{email,email_verified:true}})});
  assert.equal(identity.email,email);assert.equal(identity.honor,undefined);assert.equal(canPlayParty(identity),true);
 }
});

test('connection waits for the server, unsubscribes and fails with an actionable timeout',async t=>{
 let callback,stops=0;const c={db:{},ref:(_,p)=>p,onValue:(path,cb)=>{assert.equal(path,'.info/connected');callback=cb;return()=>stops++;}};
 const waiting=waitForDatabaseConnection(c);callback({val:()=>false});callback({val:()=>true});await waiting;assert.equal(stops,1);
 t.mock.timers.enable({apis:['setTimeout']});const timeout=waitForDatabaseConnection(c,20),rejection=assert.rejects(timeout,/Could not reach the multiplayer server/);t.mock.timers.tick(20);await rejection;assert.equal(stops,2);t.mock.timers.reset();
});

test('Host synchronizes the server clock before its first metadata/member write',async()=>{
 const writes=[],base=Date.now(),skew=120000,c={db:{},ref:(_,p)=>p,onValue:(p,cb)=>{cb({val:()=>p==='.info/connected'?true:-skew});return()=>{};},set:async(p,v)=>writes.push([p,v]),remove:async()=>{},update:async()=>{},serverTimestamp:()=>base};
 const session=new PartySession(()=>{},()=>{},()=>({id:'external-google-user',expires:base/1000+3600}),async()=>({uid:'external-player'}),async()=>c);
 session.clock=()=>base+skew;session.profileStore={watch:()=>{},close:()=>{}};session.listen=async()=>{};
 try{await session.create('Jack',{mode:'ranked',maxPlayers:6});assert.equal(writes.length,1);const room=writes[0][1];assert.equal(room.meta.createdAt,base);assert.equal(room.members['external-player'].joinedAt,base);assert.equal(room.members['external-player'].lastSeen,base);assert.equal(session.now(),base);}
 finally{await session.close();}
});

test('server clock accepts a numeric SDK offset and unsubscribes without a server get',async()=>{
 let stopped=false;const offset=await databaseClockOffset({db:{},ref:(_,p)=>p,onValue:(path,cb)=>{assert.equal(path,'.info/serverTimeOffset');cb({val:()=>-120000});return()=>{stopped=true;};},get:()=>assert.fail('Special info paths must use listeners')});assert.equal(offset,-120000);assert.equal(stopped,true);
});

test('public matchmaking excludes stale and incompatible rooms instead of looping on refresh',()=>{
 const now=500000,base={updatedAt:now,protocol:4,catalogBuild:'current',phase:'lobby',count:1,seats:6};
 const rooms=compatiblePublicRooms({GOOD:base,OLD:{...base,catalogBuild:'old'},LEGACY:{...base,catalogBuild:undefined},STALE:{...base,updatedAt:now-45001},FUTURE:{...base,updatedAt:now+6000},PROTO:{...base,protocol:3},PLAY:{...base,phase:'playing'}},'current',now);
 assert.deepEqual(rooms.map(r=>r.code),['GOOD','PLAY']);assert.deepEqual(compatiblePublicRooms(null,'current'),[]);
 assert.match(partyConnectionError({code:'PERMISSION_DENIED'}),/PUFFER_ACCESS/);assert.doesNotMatch(partyConnectionError({code:'PERMISSION_DENIED'}),/refresh/);
 assert.match(partyConnectionError({code:'auth/network-request-failed'}),/could not connect/);
});
