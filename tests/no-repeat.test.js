import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {PACKS,PLAY_PACKS,MIXED_PACKS,PARTY_PACKS} from '../data.js';
import {questionReview} from '../question-quality.js';
import {FRESH_DAILY_IDS,FRESH_DAILY_START} from '../daily-schedule.js';
import {dailyPacks,GROUP_DAILY_IDS,GROUP_DAILY_START,partyDeck,newParty,startParty,tickParty,partyPack,random} from '../engine.js';
import {beginParty} from '../party-rules.js';
import {readQuestionHistory,rememberQuestions} from '../question-history.js';
import {PartySession} from '../party.js';
const manifest=JSON.parse(readFileSync(new URL('../variety-bank-manifest.json',import.meta.url)));
test('source archives retain integrity while only reviewed categories enter automatic play',()=>{
 assert.ok(PLAY_PACKS.length>=2000);assert.ok(PARTY_PACKS.length>=100);assert.ok(MIXED_PACKS.length>=100);
 assert.ok(MIXED_PACKS.every(p=>questionReview(p).status==='automatic'));
 assert.ok(PARTY_PACKS.every(p=>MIXED_PACKS.includes(p)));
 const prompts=new Set(),sets=new Set();
 for(const p of manifest.categories){
  const bytes=gunzipSync(readFileSync(new URL('../variety-banks/'+p.answerFile,import.meta.url))),rows=JSON.parse(bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),p.sha256,p.id);assert.equal(rows.length,p.answerCount);assert.ok(rows.length>=24);
  assert.ok(p.source&&p.group);assert.ok(!prompts.has(p.prompt),p.prompt);assert.ok(!sets.has(p.answerSetSha256),p.id);prompts.add(p.prompt);sets.add(p.answerSetSha256);
  assert.ok(!/Name (?:a equipment|an equipment|a furniture|a footwear)\./.test(p.prompt),p.prompt);
  if(p.partyEligible){assert.ok(p.familiarCount>=8);assert.ok(p.answerCount>=30);}
 }
});
test('published daily dates use every scheduled prompt at most once, then stop rather than wrap',()=>{
 assert.equal(new Set(FRESH_DAILY_IDS).size,FRESH_DAILY_IDS.length);assert.equal(new Set(GROUP_DAILY_IDS).size,GROUP_DAILY_IDS.length);const seen=new Set();
 for(let i=0;i<Math.floor(GROUP_DAILY_IDS.length/7);i++){
  const day=new Date(Date.parse(GROUP_DAILY_START+'T12:00:00Z')+i*86400000).toISOString().slice(0,10),draw=dailyPacks(day);
  assert.equal(draw.length,7);assert.deepEqual(draw,dailyPacks(day));for(const p of draw){assert.ok(!seen.has(p.id));seen.add(p.id);}
 }
 const end=new Date(Date.parse(GROUP_DAILY_START+'T12:00:00Z')+Math.floor(GROUP_DAILY_IDS.length/7)*86400000).toISOString().slice(0,10);assert.deepEqual(dailyPacks(end),[]);
 assert.equal(seen.size,Math.floor(GROUP_DAILY_IDS.length/7)*7);
 assert.ok(seen.size>=14*7);
});
test('puffer excludes recorded questions through rematches, host-state serialization and a new room',()=>{
 const players=[{id:'a',name:'A',ready:true},{id:'b',name:'B',ready:true}],s=newParty(players,random(4));startParty(s,1000,()=>0);const first=partyPack(s).id;assert.ok(s.seenIds.includes(first));
 s.phase='ended';assert.ok(beginParty(s,20000));assert.ok(!s.packIds.includes(first));startParty(s,23000,()=>0);const second=partyPack(s).id;assert.notEqual(second,first);
 const restored=JSON.parse(JSON.stringify(s));assert.ok(!partyDeck(random(4),restored.seenIds).includes(first));
 const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};rememberQuestions('a',s.seenIds,storage);const seen=readQuestionHistory('a',storage),next=newParty(players,random(4),seen);assert.ok(!next.packIds.includes(first));assert.ok(!next.packIds.includes(second));assert.deepEqual(readQuestionHistory('different-account',storage),[]);
});
test('puffer never indexes back to the first prompt when its remaining deck is exhausted',()=>{
 const s=newParty([{id:'a',name:'A'},{id:'b',name:'B'}]);s.packIds=s.packIds.slice(0,1);startParty(s,1000,()=>0);tickParty(s,s.deadline,()=>0);tickParty(s,s.nextAt,()=>0);assert.equal(s.phase,'ended');assert.equal(s.exhausted,true);assert.equal(partyPack(s),undefined);assert.match(s.notice,/not be recycled/);
});
test('a fresh-category vote needs active-player agreement and costs no hearts',()=>{
 const session=new PartySession(()=>{},()=>{});try{
  session.state=newParty([{id:'a',name:'A'},{id:'b',name:'B'},{id:'c',name:'C'}]);startParty(session.state,Date.now(),()=>.9);const before=session.state.players.map(p=>p.hearts);session.receiveQuestionReport('a',{skip:true,round:1});assert.equal(session.state.phase,'playing');session.receiveQuestionReport('a',{skip:true,round:1});assert.equal(session.state.skipVotes.length,1);session.receiveQuestionReport('b',{skip:true,round:1});assert.equal(session.state.phase,'burst');assert.deepEqual(session.state.players.map(p=>p.hearts),before);assert.match(session.state.notice,/No heart lost/);
 }finally{clearInterval(session.timer);}
});
test('room history reports exclude old prompts without replacing the active question or trusting unknown IDs',()=>{
 const session=new PartySession(()=>{},()=>{});try{
  session.state=newParty([{id:'a',name:'A'},{id:'b',name:'B'}]);startParty(session.state,Date.now());const active=partyPack(session.state).id,future=session.state.packIds[1];session.receiveQuestionReport('b',{seenIds:[future,active,'not-a-real-question']});assert.equal(partyPack(session.state).id,active);assert.ok(!session.state.packIds.includes(future));assert.ok(!session.state.seenIds.includes('not-a-real-question'));
 }finally{clearInterval(session.timer);}
});

test('a late history report exhausting the countdown ends cleanly instead of freezing or repeating',()=>{
 const session=new PartySession(()=>{},()=>{});try{session.state=newParty([{id:'a',name:'A',ready:true},{id:'b',name:'B',ready:true}]);beginParty(session.state,Date.now());const ids=[...session.state.packIds];session.receiveQuestionReport('b',{seenIds:ids});assert.equal(session.state.phase,'ended');assert.equal(session.state.exhausted,true);assert.equal(session.state.packIds.length,0);}finally{clearInterval(session.timer);}
});

test('a reworded inventory is not dealt as a fresh copy of the same category',()=>{
 assert.equal(new Set(MIXED_PACKS.map(p=>p.questionKey)).size,MIXED_PACKS.length);
 const furniture=PACKS.find(p=>p.id==='var-semantic-furniture-n-01'),original=PACKS.find(p=>p.id==='catalog-furniture-types');assert.equal(furniture.questionKey,original.questionKey);
 const deck=partyDeck(random(5),[furniture.id]);assert.ok(!deck.includes(original.id));assert.ok(!deck.includes(furniture.id));
});
