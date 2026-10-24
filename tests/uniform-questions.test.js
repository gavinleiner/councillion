import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MIXED_PACKS,PARTY_PACKS,PACK_BY_ID} from '../data.js';
import {uniformQuestionDeck,random} from '../question-selection.js';
import {partyDeck,practiceDraw,reshufflePracticeQueue,dailyPacks,newParty,startParty,refreshPartyQuestions} from '../engine.js';

test('Puffer draws uniformly from the complete 5,000, without boosting small subjects or formats',()=>{
 assert.equal(PARTY_PACKS.length,5000);
 for(let seed=1;seed<=30;seed++){
  const ids=partyDeck(random(seed));
  assert.deepEqual(ids,uniformQuestionDeck(PARTY_PACKS,{rng:random(seed)}));
  assert.equal(ids.length,5000);assert.equal(new Set(ids).size,5000);
 }
 // Enumerate every possible integer draw on a toy pool: all 120 permutations
 // occur once, including each of the five questions exactly 24 times first.
 const pool=Array.from({length:5},(_,i)=>({id:'q'+i,family:i<4?'large':'small',group:'same'}));
 const permutations=new Set(),first=new Map();
 for(let a=0;a<5;a++)for(let b=0;b<4;b++)for(let c=0;c<3;c++)for(let d=0;d<2;d++){
  const draws=[(a+.5)/5,(b+.5)/4,(c+.5)/3,(d+.5)/2];let n=0;
  const ids=uniformQuestionDeck(pool,{rng:()=>draws[n++]});permutations.add(ids.join('|'));first.set(ids[0],(first.get(ids[0])??0)+1);
 }
 assert.equal(permutations.size,120);assert.deepEqual([...first.values()],[24,24,24,24,24]);
});

test('any of the 5,000 IDs can be dealt first, including the final catalog entry',()=>{
 for(const target of [0,1,19,2499,4998,4999]){
  let i=PARTY_PACKS.length;
  const deck=partyDeck(()=>{i--;return i===target?0:1-Number.EPSILON;});
  assert.equal(deck[0],PARTY_PACKS[target].id);
 }
});

test('seen IDs stay excluded, including small exhausted subjects; fresh seeds change openers',()=>{
 const pool=Array.from({length:24},(_,i)=>({id:'q'+i,family:i<20?'gaming':'food',group:i<12?'a':'b'})),seen=['q0','q23'];
 const one=uniformQuestionDeck(pool,{seen,rng:random(3)}),two=uniformQuestionDeck(pool,{seen,rng:random(9)});
 assert.equal(one.length,22);assert.equal(new Set(one).size,22);assert.ok(!one.some(id=>seen.includes(id)));assert.notDeepEqual(one,two);
 assert.deepEqual(uniformQuestionDeck(pool,{seen:pool.map(p=>p.id)}),[]);assert.deepEqual(uniformQuestionDeck([]),[]);
});

test('Practice uses the same uniform draw and migrates only unplayed saved IDs',()=>{
 const party=partyDeck(random(42)),practice=practiceDraw([],null,random(42));assert.deepEqual([...practice.ids,...practice.remaining],party);
 const pending=MIXED_PACKS.slice(30,400).map(p=>p.id),migrated=reshufflePracticeQueue(pending,random(7));assert.deepEqual(new Set(migrated),new Set(pending));assert.equal(new Set(migrated).size,pending.length);
 const next=practiceDraw(practice.remaining,null,random(9));assert.deepEqual(next.ids,party.slice(7,14));assert.ok(!next.ids.some(id=>practice.ids.includes(id)));
 const additions=MIXED_PACKS.filter(p=>p.id.startsWith('group-open-')).map(p=>p.id),legacyPending=MIXED_PACKS.filter(p=>!additions.includes(p.id)).slice(20,30).map(p=>p.id);
 const updated=reshufflePracticeQueue(legacyPending,random(8),'20261023-balanced-v1');assert.deepEqual(new Set(updated),new Set([...legacyPending,...additions]));assert.equal(additions.length,118);
});

test('an older saved room reshuffles its weighted future queue once, preserving the active question and hearts',()=>{
 const s=newParty([{id:'a',name:'A'},{id:'b',name:'B'}],random(3));startParty(s,1000,random(1));
 delete s.selectionBuild;const active=s.packIds[0],before=[...s.packIds],hearts=s.players.map(p=>p.hearts);
 assert.equal(refreshPartyQuestions(s,1100,random(9)),true);assert.equal(s.packIds[0],active);assert.equal(s.phase,'playing');assert.deepEqual(s.players.map(p=>p.hearts),hearts);
 assert.deepEqual(new Set(s.packIds),new Set(before));assert.notDeepEqual(s.packIds,before);
 const stable=[...s.packIds];assert.equal(refreshPartyQuestions(s,1200,random(10)),false);assert.deepEqual(s.packIds,stable);
});

test('future Daily is one shared uniform calendar; both published days stay fixed',()=>{
 const schedule=JSON.parse(readFileSync(new URL('../daily-schedule.json',import.meta.url)));
 const revision=schedule.revisions.findLast(r=>r.from==='2026-10-25');assert.ok(revision);assert.equal(revision.selection,'20261024-uniform-v1');
 assert.deepEqual(dailyPacks('2026-10-23').map(p=>p.id),['fun-terraria','fun-sea-life','fun-tv','occupation-titles','fun-elements','catalog-snacks','fun-water-world']);
 const published=JSON.parse(readFileSync(new URL('../data-snapshots/group/published-20261023-24.json',import.meta.url)));assert.deepEqual(schedule.ids.slice(0,14),published);
 for(let d=0;d<30;d++){const day=new Date(Date.UTC(2026,9,25+d)).toISOString().slice(0,10),draw=dailyPacks(day);assert.equal(draw.length,7);assert.equal(new Set(draw.map(p=>p.id)).size,7);assert.ok(draw.every(p=>p&&PACK_BY_ID.has(p.id)));assert.deepEqual(draw,dailyPacks(day));}
});
