import {initializeTestEnvironment,assertFails} from '@firebase/rules-unit-testing';
import * as sdk from 'firebase/database';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {PartyProfileStore} from '../party-profile.js';
import {rankFor,RANKS} from '../party-career.js';
import {OWNER_EMAIL} from '../account-honors.js';

const env=await initializeTestEnvironment({projectId:'demo-councillion',database:{host:'127.0.0.1',port:9000,rules:await readFile(new URL('../database.rules.json',import.meta.url),'utf8')}});
const client=(uid,claims={})=>({...sdk,db:env.authenticatedContext(uid,{firebase:{sign_in_provider:'google.com'},...claims}).database()});
const owner=client('owner',{email:OWNER_EMAIL,email_verified:true}),player=client('player'),friend=client('friend'),grant={version:1,rank:'highest',at:sdk.serverTimestamp()};
const wait=async fn=>{const end=Date.now()+15000;while(Date.now()<end){if(fn())return;await new Promise(r=>setTimeout(r,25));}throw Error('Rank grant did not update live');};
const store=new PartyProfileStore(friend);
try{
 await env.clearDatabase();store.watch('player');await wait(()=>store.get('player').loaded);assert.equal(rankFor(store.get('player').career).placed,false);
 await assertFails(sdk.set(sdk.ref(player.db,'rankGrants/player'),grant));await assertFails(sdk.set(sdk.ref(friend.db,'rankGrants/player'),grant));
 const fake=client('fake-owner',{email:OWNER_EMAIL,email_verified:false});await assertFails(sdk.set(sdk.ref(fake.db,'rankGrants/player'),grant));
 await sdk.set(sdk.ref(owner.db,'rankGrants/player'),grant);await wait(()=>rankFor(store.get('player').career).id===RANKS.at(-1).id&&rankFor(store.get('player').career).placed);
 const profile=await store.fetch('player');assert.equal(profile.career.rating,RANKS.at(-1).min);assert.equal(profile.career.wins,0);assert.equal(profile.career.ranked,0);assert.equal(profile.honor,null);
 assert.equal((await sdk.get(sdk.ref(player.db,'rankGrants/player'))).val().rank,'highest');
 await assertFails(sdk.get(sdk.ref(env.unauthenticatedContext().database(),'rankGrants/player')));await assertFails(sdk.get(sdk.ref(player.db,'rankGrants')));await assertFails(sdk.get(sdk.ref(player.db,'rooms')));
 await assertFails(sdk.set(sdk.ref(owner.db,'rankGrants/player'),{...grant,role:'super_admin'}));await assertFails(sdk.set(sdk.ref(owner.db,'rankGrants/player'),{...grant,rank:'fake'}));await assertFails(sdk.remove(sdk.ref(player.db,'rankGrants/player')));
 await sdk.remove(sdk.ref(owner.db,'rankGrants/player'));await wait(()=>!rankFor(store.get('player').career).placed&&store.get('player').career.rating===0);
 console.log('Rank grants passed: verified owner-only writes, ordinary-player denial, live peer update, persistent fetch, immediate revocation, no fake match records and no admin privileges.');
}finally{store.close();await env.cleanup();}
