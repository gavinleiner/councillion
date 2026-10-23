import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import * as sdk from 'firebase/database';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {PartySession} from '../party.js';
import {PartyProfileStore} from '../party-profile.js';
import {OWNER_EMAIL,VICE_PRESIDENT_EMAIL,PRESIDENT_EMAIL} from '../account-honors.js';
import {sendOwnerEffect,sendOwnerAction} from '../party-admin.js';
const env=await initializeTestEnvironment({projectId:'demo-councillion',database:{host:'127.0.0.1',port:9000,rules:await readFile(new URL('../database.rules.json',import.meta.url),'utf8')}}),sessions=[];let checks=0;
const db=(uid,claims={})=>env.authenticatedContext(uid,{firebase:{sign_in_provider:'google.com'},...claims}).database();
const owner={...sdk,db:db('owner',{email:OWNER_EMAIL,email_verified:true})},vice={...sdk,db:db('vice',{email:VICE_PRESIDENT_EMAIL,email_verified:true})},other={...sdk,db:db('other')};
const president={...sdk,db:db('president',{email:PRESIDENT_EMAIL,email_verified:true})};
const identity={uid:'owner',id:'google-owner',role:'super_admin',expires:Date.now()/1000+3600};
const allow=async p=>{await assertSucceeds(p);checks++;},deny=async p=>{await assertFails(p);checks++;};
const wait=async (fn,label)=>{const end=Date.now()+45000;while(Date.now()<end){if(await fn())return;await new Promise(r=>setTimeout(r,30));}throw Error(label);};
function client(uid){const c={...sdk,db:db(uid)},s=new PartySession(()=>{},()=>{},()=>({id:uid,expires:Date.now()/1000+3600}),async()=>({uid}),async()=>c);sessions.push(s);return s;}
try{
 await env.clearDatabase();
 const ownerHonor={kind:'owner',title:'super-admin'},viceHonor={kind:'vice-president',title:'vice-president'},presidentHonor={kind:'president',title:'pres'};
 await allow(sdk.set(sdk.ref(owner.db,'accountHonors/owner'),ownerHonor));await allow(sdk.set(sdk.ref(vice.db,'accountHonors/vice'),viceHonor));
 await allow(sdk.set(sdk.ref(president.db,'accountHonors/president'),presidentHonor));
 await deny(sdk.set(sdk.ref(president.db,'accountHonors/president'),ownerHonor));await deny(sdk.set(sdk.ref(president.db,'accountHonors/president'),viceHonor));await deny(sdk.set(sdk.ref(president.db,'accountHonors/owner'),presidentHonor));await deny(sdk.set(sdk.ref(other.db,'accountHonors/other'),presidentHonor));await deny(sdk.set(sdk.ref(vice.db,'accountHonors/vice'),presidentHonor));
 for(const [uid,claims] of [['pres-unverified',{email:PRESIDENT_EMAIL,email_verified:false}],['pres-lookalike',{email:PRESIDENT_EMAIL+'.invalid',email_verified:true}],['pres-password',{email:PRESIDENT_EMAIL,email_verified:true,firebase:{sign_in_provider:'password'}}]])await deny(sdk.set(sdk.ref(db(uid,claims),'accountHonors/'+uid),presidentHonor));
 await deny(sdk.set(sdk.ref(vice.db,'accountHonors/vice'),ownerHonor));await deny(sdk.set(sdk.ref(other.db,'accountHonors/other'),viceHonor));await deny(sdk.set(sdk.ref(other.db,'accountHonors/other'),ownerHonor));await deny(sdk.set(sdk.ref(owner.db,'accountHonors/vice'),ownerHonor));await deny(sdk.set(sdk.ref(vice.db,'accountHonors/owner'),ownerHonor));
 for(const [uid,claims] of [['unverified',{email:OWNER_EMAIL,email_verified:false}],['lookalike',{email:OWNER_EMAIL+'.invalid',email_verified:true}],['password',{email:OWNER_EMAIL,email_verified:true,firebase:{sign_in_provider:'password'}}]]){const c=db(uid,claims);await deny(sdk.get(sdk.ref(c,'rooms')));await deny(sdk.set(sdk.ref(c,'accountHonors/'+uid),ownerHonor));}
 const store=new PartyProfileStore(other);assert.deepEqual((await store.fetch('president')).honor,presidentHonor);checks++;assert.deepEqual((await store.fetch('vice')).honor,viceHonor);assert.deepEqual((await store.fetch('owner')).honor,ownerHonor);store.close();checks+=2;
 const host=client('host'),friend=client('friend');await host.create('Host',{mode:'ranked',isPrivate:true});await friend.join('Friend',host.code);await wait(()=>host.state.players.length===2&&friend.connected,'ready roster');const base='rooms/'+host.code;
 await deny(sdk.get(sdk.ref(president.db,'rooms')));await deny(sdk.get(sdk.ref(president.db,base+'/state')));
 await allow(sdk.get(sdk.ref(owner.db,'rooms')));await deny(sdk.get(sdk.ref(vice.db,'rooms')));await deny(sdk.get(sdk.ref(vice.db,base+'/state')));
 await sendOwnerEffect(owner,identity,host.code,'bubbles','friend');await wait(()=>friend.ownerEffect?.kind==='bubbles'&&host.ownerEffect?.kind==='bubbles','effect reaches clients');const effect=(await sdk.get(sdk.ref(owner.db,base+'/admin/effect'))).val();
 const draft={...effect,id:'forged',at:sdk.serverTimestamp(),expires:Date.now()+8000};
 await deny(sdk.set(sdk.ref(president.db,base+'/admin/effect'),{...draft,uid:'president'}));
 await deny(sdk.set(sdk.ref(host.c.db,base+'/admin/effect'),{...draft,uid:'host'}));await deny(sdk.set(sdk.ref(friend.c.db,base+'/admin/effect'),{...draft,uid:'friend'}));await deny(sdk.set(sdk.ref(vice.db,base+'/admin/effect'),{...draft,uid:'vice'}));
 await deny(sdk.set(sdk.ref(owner.db,base+'/admin/effect'),{...draft,expires:Date.now()+60000}));await deny(sdk.set(sdk.ref(owner.db,base+'/admin/effect'),{...draft,uid:'friend'}));await deny(sdk.set(sdk.ref(owner.db,base+'/admin/effect'),{...draft,kind:'fake'}));await deny(sdk.set(sdk.ref(owner.db,base+'/admin/effect'),{...draft,extra:'not allowed'}));
 await sendOwnerAction(owner,identity,host.code,'public');await wait(()=>host.meta.isPrivate===false,'owner changes another host room visibility');
 await sendOwnerAction(owner,identity,host.code,'start');await wait(()=>host.state.phase==='playing'&&friend.state.phase==='playing','owner starts another host room');
 await sendOwnerAction(owner,identity,host.code,'end');await wait(()=>host.state.resultSaved,'admin ends match without rating');assert.equal(host.state.result.rated,false);assert.equal(host.state.result.counted,false);assert.equal((await host.profileStore.fetch('host')).career.rating,1000);assert.equal((await host.profileStore.fetch('friend')).career.wins,0);checks+=4;
 await deny(sdk.set(sdk.ref(host.c.db,base+'/admin/control'),{id:'fake-control',uid:'host',action:'kick',target:'friend',at:sdk.serverTimestamp()}));
 await sendOwnerAction(owner,identity,host.code,'kick','friend');await wait(()=>!host.members.friend,'owner removes player from another host room');await friend.close();
 await allow(sdk.remove(sdk.ref(owner.db,'directory/'+host.code)));await allow(sdk.remove(sdk.ref(owner.db,base)));checks+=4;
 console.log(checks+' owner, Vice President and pres security/network checks passed: exact verified accounts, separate roles, private room controls, cosmetic sync, host forgery blocked, no-contest results and removal.');
}finally{await Promise.all(sessions.map(s=>s.close()));await env.cleanup();}
