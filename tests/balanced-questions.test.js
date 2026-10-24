import test from 'node:test';
import assert from 'node:assert/strict';
import {MIXED_PACKS,PACK_BY_ID} from '../data.js';
import {balancedQuestionDeck,questionFormatKey} from '../balanced-questions.js';
import {random} from '../question-selection.js';
import {partyDeck,practiceDraw,rebalancePracticeQueue,dailyPacks} from '../engine.js';

const tally=values=>values.reduce((out,k)=>(out[k]=(out[k]??0)+1,out),{});
test('subjects share the first 100 live draws; a huge Steam inventory cannot dominate',()=>{
 for(let seed=1;seed<=30;seed++){
  const ids=partyDeck(random(seed)),first=ids.slice(0,100).map(id=>PACK_BY_ID.get(id)),counts=Object.values(tally(first.map(p=>p.family)));
  assert.equal(ids.length,5000);assert.equal(new Set(ids).size,5000);assert.equal(counts.length,9);assert.ok(Math.max(...counts)<=13);assert.ok(Math.min(...counts)>=10);
  for(let i=0;i<90;i++)assert.equal(new Set(first.slice(i,i+7).map(p=>p.family)).size,7);
  for(const family of ['gaming','culture','music']){const groups=Object.values(tally(first.filter(p=>p.family===family).map(questionFormatKey)));assert.ok(Math.max(...groups)-Math.min(...groups)<=1);}
 }
});

test('the same balanced order powers fresh Practice and preserves unplayed saved queues',()=>{
 const party=partyDeck(random(42)),practice=practiceDraw([],null,random(42));assert.deepEqual([...practice.ids,...practice.remaining],party);
 const pending=MIXED_PACKS.slice(30,400).map(p=>p.id),migrated=rebalancePracticeQueue(pending,random(7));assert.deepEqual(new Set(migrated),new Set(pending));assert.equal(new Set(migrated).size,pending.length);
 const next=practiceDraw(practice.remaining,null,random(9));assert.deepEqual(next.ids,party.slice(7,14));assert.ok(!next.ids.some(id=>practice.ids.includes(id)));
});

test('balanced decks keep random ties, exclude history and exhaust without repeats',()=>{
 const packs=Array.from({length:24},(_,i)=>({id:'q'+i,family:i<20?'gaming':'food',group:i<12?'a':'b'})),seen=['q0','q23'];
 const one=balancedQuestionDeck(packs,{seen,rng:random(3)}),two=balancedQuestionDeck(packs,{seen,rng:random(9)});
 assert.equal(one.length,22);assert.equal(new Set(one).size,22);assert.ok(!one.some(id=>seen.includes(id)));assert.notDeepEqual(one,two);assert.deepEqual(balancedQuestionDeck(packs,{seen:packs.map(p=>p.id)}),[]);
 assert.deepEqual(balancedQuestionDeck([]),[]);
});

test('the revised shared Daily calendar starts with seven different subjects each day',()=>{
 for(let d=0;d<10;d++){const date=new Date(Date.UTC(2026,9,24+d)).toISOString().slice(0,10),draw=dailyPacks(date);assert.equal(draw.length,7);assert.equal(new Set(draw.map(p=>p.family)).size,7);assert.deepEqual(draw,dailyPacks(date));}
 assert.deepEqual(dailyPacks('2026-10-23').map(p=>p.id),['fun-terraria','fun-sea-life','fun-tv','occupation-titles','fun-elements','catalog-snacks','fun-water-world']);
});
