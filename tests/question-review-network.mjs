import {initializeTestEnvironment,assertFails} from '@firebase/rules-unit-testing';
import * as sdk from 'firebase/database';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {QuestionReviewStore} from '../question-review-state.js';
const env=await initializeTestEnvironment({projectId:'demo-councillion',database:{host:'127.0.0.1',port:9000,rules:await readFile(new URL('../database.rules.json',import.meta.url),'utf8')}}),stores=[];
const token=email=>({firebase:{sign_in_provider:'google.com'},email,email_verified:true});
const google=(uid,email=uid+'@example.com')=>env.authenticatedContext(uid,token(email)).database();
const until=async fn=>{const end=Date.now()+15000;while(Date.now()<end){if(await fn())return;await new Promise(r=>setTimeout(r,25));}throw Error('Review sync timed out');};
try{
 await env.clearDatabase();const a=google('a'),b=google('b'),owner=google('owner','gavin@theleiners.com'),anon=env.unauthenticatedContext().database(),base='questionReviews/a/group-100-v1';
 const data={version:1,updatedAt:sdk.serverTimestamp(),items:{q001:{vote:'yes',note:'good for the group',at:sdk.serverTimestamp()}}};await sdk.set(sdk.ref(a,base),data);
 assert.equal((await sdk.get(sdk.ref(a,base))).val().items.q001.vote,'yes');assert.equal((await sdk.get(sdk.ref(owner,'questionReviews'))).val().a['group-100-v1'].items.q001.vote,'yes');
 await assertFails(sdk.get(sdk.ref(b,base)));await assertFails(sdk.get(sdk.ref(anon,base)));await assertFails(sdk.set(sdk.ref(b,base),data));await assertFails(sdk.set(sdk.ref(anon,base),data));
 const fake=env.authenticatedContext('fake',{...token('gavin@theleiners.com'),email_verified:false}).database();await assertFails(sdk.get(sdk.ref(fake,'questionReviews')));
 for(const [id,item]of [['q000',{vote:'yes'}],['q101',{vote:'yes'}],['q002',{vote:'maybe'}],['q003',{vote:'yes',note:'x'.repeat(501)}],['q004',{vote:'yes',rating:5000}]])await assertFails(sdk.update(sdk.ref(a,base+'/items'),{[id]:{note:'',at:sdk.serverTimestamp(),...item}}));
 await assertFails(sdk.set(sdk.ref(a,'questionReviews/a/other-version'),data));await assertFails(sdk.update(sdk.ref(a,base),{admin:true}));
 const memory=()=>{const m=new Map();return{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};};
 const make=()=>{const db=google('a'),c={...sdk,db,currentSession:async()=>({uid:'a'})},s=new QuestionReviewStore({uid:'a',storage:memory(),getCloud:async()=>c});stores.push(s);s.connect();return s;};
 const one=make(),two=make();await until(()=>one.loaded&&two.loaded);one.edit('q002','no','too narrow');await until(()=>two.items.q002?.vote==='no'&&!Object.keys(one.pending).length);two.edit('q003','yes','friends know this');await until(()=>one.items.q003?.vote==='yes'&&!Object.keys(two.pending).length);
 one.edit('q002','unset');await until(()=>two.items.q002?.vote==='unset');assert.equal(two.items.q001.vote,'yes');
 // An offline device's pending choice merges without deleting another device's vote.
 const cached=memory(),offline=new QuestionReviewStore({uid:'a',storage:cached});offline.edit('q004','no','offline note');offline.destroy();const restored=new QuestionReviewStore({uid:'a',storage:cached,getCloud:async()=>({...sdk,db:google('a'),currentSession:async()=>({uid:'a'})})});stores.push(restored);await restored.connect();await until(()=>restored.items.q001?.vote==='yes'&&restored.items.q004?.vote==='no'&&!Object.keys(restored.pending).length);assert.equal(restored.items.q003.vote,'yes');
 console.log('Private review storage passes: own-account and owner reads, other-player/anonymous denials, schema validation, two-device updates, clear votes, offline merge and reconnect.');
}finally{stores.forEach(s=>s.destroy());await env.cleanup();}
