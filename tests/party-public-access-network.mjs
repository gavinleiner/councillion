import {initializeTestEnvironment,assertFails} from '@firebase/rules-unit-testing';
import * as sdk from 'firebase/database';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {PartySession} from '../party.js';

const env=await initializeTestEnvironment({projectId:'demo-councillion',database:{host:'127.0.0.1',port:9000,rules:await readFile(new URL('../database.rules.json',import.meta.url),'utf8')}}),sessions=[];
const wait=async fn=>{const end=Date.now()+15000;while(Date.now()<end){if(fn())return;await new Promise(r=>setTimeout(r,25));}throw Error('External-account room connection timed out');};
function client(uid,email,skew=0){
 const db=env.authenticatedContext(uid,{email,email_verified:true,firebase:{sign_in_provider:'google.com'}}).database(),isClock=p=>p.toString().endsWith('/.info/serverTimeOffset');
 const c={...sdk,db,get:async p=>{const snapshot=await sdk.get(p);return isClock(p)?{val:()=>Number(snapshot.val())-skew}:snapshot;},onValue:(p,cb,...args)=>sdk.onValue(p,snapshot=>cb(isClock(p)?{val:()=>Number(snapshot.val())-skew}:snapshot),...args)};
 const errors=[],s=new PartySession(()=>{},e=>errors.push(e),()=>({id:uid,email,expires:Date.now()/1000+3600}),async()=>({uid}),async()=>c);s.clock=()=>Date.now()+skew;sessions.push(s);return{s,c,errors};
}
try{
 await env.clearDatabase();const ordinary=client('ordinary-host','ordinary@example.com'),jack=client('jack-google','external.player@example.invalid',120000);
 await ordinary.s.create('Ordinary',{isPrivate:false,maxPlayers:6,mode:'ranked'});await wait(()=>ordinary.s.connected);
 // Reproduce the previous raw-device-clock rejection under the unchanged rules.
 const badMember={name:'Jack',buddy:'krill',protocol:4,joinedAt:Date.now()+120000,lastSeen:Date.now()+120000,online:true,ready:true,autoJoin:false};
 await assertFails(sdk.set(sdk.ref(jack.c.db,'rooms/'+ordinary.s.code+'/members/jack-google'),badMember));
 await jack.s.join('Jack',ordinary.s.code,{mode:'ranked'});await wait(()=>jack.s.connected&&ordinary.s.state.players.length===2);assert.equal(jack.s.state.players.some(p=>p.id==='jack-google'),true);assert.ok(Math.abs(jack.s.now()-Date.now())<1000);await jack.s.close();
 const host=client('jack-google','external.player@example.invalid',120000),guest=client('new-google-player','newfriend@gmail.com');
 await host.s.create('Jack',{isPrivate:false,maxPlayers:6,mode:'ranked'});await wait(()=>host.s.connected);
 const meta=(await sdk.get(sdk.ref(host.c.db,'rooms/'+host.s.code+'/meta'))).val();assert.ok(Math.abs(meta.createdAt-Date.now())<5000);
 await guest.s.join('New Friend',host.s.code,{mode:'ranked'});await wait(()=>host.s.state.players.length===2&&guest.s.connected);
 const entry=(await sdk.get(sdk.ref(guest.c.db,'directory/'+host.s.code))).val();assert.equal(entry.catalogBuild,meta.catalogBuild);
 assert.deepEqual(host.errors,[]);assert.deepEqual(guest.errors,[]);
 console.log('Public-account access passed: ordinary Google users, raw clock-skew rejection reproduced, an ordinary Google player can join and host with a two-minute device offset, another new Gmail player joins, compatible directory metadata, unchanged Google-only rules.');
}finally{await Promise.all(sessions.map(s=>s.close()));await env.cleanup();}
