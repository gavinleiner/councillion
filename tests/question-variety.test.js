import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MIXED_PACKS,PARTY_PACKS,PACK_BY_ID} from '../data.js';
import {GROUP_PACKS} from '../group-question-catalog.js';
import {balancedQuestionDeck,random,QUESTION_SELECTION_BUILD} from '../question-selection.js';
import {partyDeck,practiceDraw,reshufflePracticeQueue,dailyPacks,newParty,startParty,refreshPartyQuestions,tickParty,isSharedDailyRun} from '../engine.js';
const family=id=>PACK_BY_ID.get(id).family;
const steam=id=>PACK_BY_ID.get(id).predicate?.kind==='steam-tag';

test('normal games keep every approved prompt and exclude all multiple-label Steam prompts',()=>{
 assert.equal(GROUP_PACKS.length,5000);assert.deepEqual(new Set(MIXED_PACKS.map(p=>p.id)),new Set(JSON.parse(readFileSync(new URL('../data-snapshots/reviewed-standard/admission.json',import.meta.url))).questions.map(p=>p.id)));
 assert.deepEqual(PARTY_PACKS,MIXED_PACKS);
 const approved=GROUP_PACKS.filter(p=>p.reviewId);assert.equal(approved.length,98);
 for(const p of approved)assert.ok(MIXED_PACKS.includes(p),p.id);
 for(const p of MIXED_PACKS){assert.ok(!['steam-tags','steam-any-tags'].includes(p.predicate?.kind),p.id);assert.doesNotMatch(p.prompt,/Steam tagged .*”\s+(?:and|or)\s+“/i);}
});

test('500 random lobbies have seven distinct opening subjects and no Steam format flood',()=>{
 const openers=new Set();
 for(let seed=1;seed<=500;seed++){
  const ids=partyDeck(random(seed));openers.add(ids[0]);assert.deepEqual(ids,balancedQuestionDeck(PARTY_PACKS,{rng:random(seed)}));
  assert.equal(ids.length,PARTY_PACKS.length);assert.equal(new Set(ids).size,ids.length);
  for(let i=0;i<=70;i++)assert.equal(new Set(ids.slice(i,i+7).map(family)).size,7,'seed '+seed+' at '+i);
  const counts={};for(const id of ids.slice(0,100))counts[family(id)]=(counts[family(id)]??0)+1;
  assert.equal(Object.keys(counts).length,9);assert.ok(Math.max(...Object.values(counts))<=16,JSON.stringify(counts));
  assert.ok(ids.slice(0,100).filter(steam).length<=8,'Steam format balance');
 }
 assert.ok(openers.size>150,openers.size+' unique openers');
});

test('random bucket selection can open on any question and handles uneven, exhausted or seen buckets',()=>{
 const pool=Array.from({length:27},(_,i)=>({id:'q'+i,family:'f'+Math.floor(i/3),group:'format'+i%3})),first=new Set();
 for(let seed=1;seed<=1000;seed++)first.add(balancedQuestionDeck(pool,{rng:random(seed)})[0]);assert.equal(first.size,27);
 const uneven=[...pool,...Array.from({length:70},(_,i)=>({id:'extra'+i,family:'f0',group:'same'}))],seen=['q0','q26'];
 const one=balancedQuestionDeck(uneven,{seen,rng:random(3)}),two=balancedQuestionDeck(uneven,{seen,rng:random(9)});
 assert.equal(one.length,uneven.length-2);assert.equal(new Set(one).size,one.length);assert.ok(!one.some(id=>seen.includes(id)));assert.notDeepEqual(one,two);
 assert.deepEqual(balancedQuestionDeck(pool,{seen:pool.map(p=>p.id)}),[]);assert.deepEqual(balancedQuestionDeck([]),[]);
 const follow=balancedQuestionDeck(pool,{recent:['f0','f1','f2','f3','f4','f5'],rng:random(1)});assert.ok(!['f0','f1','f2','f3','f4','f5'].includes(pool.find(p=>p.id===follow[0]).family));
});

test('Practice uses the same balanced random draw and filters two-tag saved queues',()=>{
 const party=partyDeck(random(42)),practice=practiceDraw([],null,random(42));assert.deepEqual([...practice.ids,...practice.remaining],party);
 const pending=MIXED_PACKS.slice(30,400).map(p=>p.id),retired=GROUP_PACKS.filter(p=>p.predicate?.kind==='steam-tags').slice(0,10).map(p=>p.id),migrated=reshufflePracticeQueue([...retired,...pending],random(7),QUESTION_SELECTION_BUILD,MIXED_PACKS.map(p=>p.id));assert.deepEqual(new Set(migrated),new Set(pending));assert.equal(new Set(migrated).size,pending.length);
 const next=practiceDraw(practice.remaining,null,random(9));assert.deepEqual(next.ids,party.slice(7,14));assert.ok(!next.ids.some(id=>practice.ids.includes(id)));
 const kept=MIXED_PACKS.slice(20,30).map(p=>p.id);
 const updated=reshufflePracticeQueue([...retired,...kept],random(8),'20261023-balanced-v1',MIXED_PACKS.map(p=>p.id));assert.deepEqual(new Set(updated),new Set(kept));
});

test('old rooms refresh their future deck once, preserving valid active questions and hearts',()=>{
 const s=newParty([{id:'a',name:'A'},{id:'b',name:'B'}],random(3));startParty(s,1000,random(1));
 delete s.selectionBuild;const active=s.packIds[0],before=[...s.packIds],hearts=s.players.map(p=>p.hearts);
 assert.equal(refreshPartyQuestions(s,1100,random(9)),true);assert.equal(s.packIds[0],active);assert.equal(s.phase,'playing');assert.deepEqual(s.players.map(p=>p.hearts),hearts);
 assert.deepEqual(new Set(s.packIds),new Set(before));assert.notDeepEqual(s.packIds,before);assert.equal(new Set(s.packIds.slice(0,7).map(family)).size,7);
 const stable=[...s.packIds];assert.equal(refreshPartyQuestions(s,1200,random(10)),false);assert.deepEqual(s.packIds,stable);
 const bad=GROUP_PACKS.find(p=>p.predicate?.kind==='steam-tags');s.packIds[0]=bad.id;s.seenIds=[bad.id];s.selectionBuild='20261024-uniform-v1';
 assert.equal(refreshPartyQuestions(s,1300,random(11)),true);assert.equal(s.phase,'burst');assert.deepEqual(s.players.map(p=>p.hearts),hearts);assert.match(s.notice,/no heart lost/);
 tickParty(s,2200,random(2));assert.equal(s.phase,'playing');assert.ok(PARTY_PACKS.includes(PACK_BY_ID.get(s.packIds[s.round-1])));
});

test('the repaired shared Daily has seven different subjects each day, with no repeated IDs or hidden cycling',()=>{
 const schedule=JSON.parse(readFileSync(new URL('../daily-schedule.json',import.meta.url)));
 const revision=schedule.revisions.findLast(r=>r.from==='2026-10-25');assert.ok(revision);assert.equal(revision.selection,QUESTION_SELECTION_BUILD);
 const published=JSON.parse(readFileSync(new URL('../data-snapshots/group/published-20261023-24.json',import.meta.url)));assert.deepEqual(schedule.ids.slice(0,14),published);
 assert.equal(new Set(schedule.ids).size,schedule.ids.length);assert.equal(schedule.ids.length%7,0);assert.ok(schedule.ids.length>=21*7);
 for(let i=14;i<schedule.ids.length;i+=7){const day=new Date(Date.UTC(2026,9,23+i/7)).toISOString().slice(0,10),draw=dailyPacks(day);assert.equal(draw.length,7);assert.equal(new Set(draw.map(p=>p.family)).size,7,day);assert.ok(draw.every(p=>MIXED_PACKS.includes(p)));assert.ok(draw.filter(p=>steam(p.id)).length<=1);assert.deepEqual(draw,dailyPacks(day));}
 const after=new Date(Date.UTC(2026,9,23+schedule.ids.length/7)).toISOString().slice(0,10);assert.deepEqual(dailyPacks(after),[]);
 const old=['group-steam-alternate-history-and-war','group-steam-atmospheric-and-medieval','group-movie-adventure-theme-spies','group-steam-fantasy-and-rts','group-steam-stylized-and-third-person','group-movie-word-war','group-steam-management-and-tactical'];
 assert.equal(isSharedDailyRun({mode:'daily',day:'2026-10-25',ids:old},'2026-10-25'),false);assert.equal(isSharedDailyRun({mode:'daily',day:'2026-10-25',ids:dailyPacks('2026-10-25').map(p=>p.id)},'2026-10-25'),true);
});
