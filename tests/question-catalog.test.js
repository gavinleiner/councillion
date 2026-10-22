import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {PLAY_PACKS,ORIGINAL_PLAY_PACKS,MIXED_PACKS,answerCount} from '../data.js';
import {CATALOG_PACKS} from '../question-catalog.js';
import {dailyPacks,matchAnswer,normalize,partyDeck,random,EXPANDED_DAILY_START} from '../engine.js';
const pack=id=>PLAY_PACKS.find(p=>p.id===id);
test('the expanded pool has hundreds of substantial, distinct categories without counting aliases',async()=>{
 assert.ok(PLAY_PACKS.length>=200);assert.equal(ORIGINAL_PLAY_PACKS.length,17);
 assert.ok(CATALOG_PACKS.every(p=>answerCount(p)>=40));
 assert.ok(CATALOG_PACKS.filter(p=>answerCount(p)>=100).length>=140);
 const labels=new Set(CATALOG_PACKS.flatMap(p=>p.answers.map(a=>normalize(a.label))));assert.ok(labels.size>100000);
 const manifest=JSON.parse(await readFile(new URL('../catalog-manifest.json',import.meta.url),'utf8'));
 assert.equal(manifest.length,CATALOG_PACKS.length);assert.equal(new Set(manifest.map(p=>p.answerHash)).size,manifest.length);
 for(const p of CATALOG_PACKS){assert.equal(p.answerCount,p.answers.length,p.id);assert.ok(p.source&&p.ranking&&p.group);assert.equal(manifest.find(m=>m.id===p.id).answerCount,p.answers.length);}
});
test('a cold party deck and question library use metadata without hydrating the answer table',()=>{
 const source="import {partyDeck} from './engine.js';import{catalogAnswersReady}from'./question-bank-loader.js';import{PLAY_PACKS,answerCount}from'./data.js';console.log(JSON.stringify([catalogAnswersReady(),partyDeck().length,PLAY_PACKS.map(answerCount).length,catalogAnswersReady()]));";
 const r=spawnSync(process.execPath,['--input-type=module','-e',source],{cwd:new URL('..',import.meta.url),encoding:'utf8',env:{...process.env,NODE_OPTIONS:''}});
 assert.equal(r.status,0,r.stderr);assert.deepEqual(JSON.parse(r.stdout),[false,MIXED_PACKS.length,PLAY_PACKS.length,false]);
});
test('daily expansion keeps historical draws stable and reaches every new category',()=>{
 assert.equal(EXPANDED_DAILY_START,'2026-10-23');
 for(const p of dailyPacks('2026-10-22'))assert.ok(ORIGINAL_PLAY_PACKS.includes(p));
 const seen=new Set();let previous=[];
 for(let i=0;i<730;i++){
  const day=new Date(Date.UTC(2026,9,23+i)).toISOString().slice(0,10),chosen=dailyPacks(day);
  assert.equal(chosen.length,7);assert.equal(new Set(chosen.map(p=>p.family)).size,7);
  assert.ok(chosen.every(p=>!previous.includes(p.id)),day);chosen.forEach(p=>seen.add(p.id));previous=chosen.map(p=>p.id);
 }
 assert.equal(seen.size,MIXED_PACKS.length);
});
test('party decks cover the pool once and avoid consecutive copies of a narrow subject',()=>{
 for(let seed=0;seed<50;seed++){
  const deck=partyDeck(random(seed));assert.equal(deck.length,MIXED_PACKS.length);assert.equal(new Set(deck).size,deck.length);
  for(let i=1;i<deck.length;i++)assert.notEqual(pack(deck[i]).group??deck[i],pack(deck[i-1]).group??deck[i-1],seed+': '+i);
 }
});
test('familiar answers and difficult category boundaries are represented correctly',()=>{
 const cases=[['dog-breeds','Labrador Retriever'],['cat-breeds','Siamese'],['catalog-soups','Minestrone'],['catalog-mineral-species','Quartz'],['catalog-noodles','Spaghetti'],['programming-languages','Python'],['nobel-physics','Albert Einstein'],['animal-marsupials','Tasmanian devil'],['catalog-card-games','Poker'],['award-oscar-animation','Shrek']];
 for(const[id,text]of cases)assert.ok(matchAnswer(pack(id),text),id+': '+text);
 assert.equal(matchAnswer(pack('cat-breeds'),'Labrador Retriever'),null);
 assert.equal(matchAnswer(pack('nobel-physics'),'J. R. R. Tolkien'),null);
 assert.equal(matchAnswer(pack('award-oscar-animation'),'Toy Story'),null,'The 1995 film predates this Oscar category');
 assert.equal(matchAnswer(pack('catalog-mineral-species'),'Quartz').points,10);
});
test('Pokémon forms count by species, typing boundaries hold, and the two Nidoran stay separate',()=>{
 assert.ok(matchAnswer(pack('pokemon-type-dragon'),'Charizard'),'Mega Charizard X has Dragon typing');
 assert.equal(matchAnswer(pack('pokemon-type-water'),'Charizard'),null);
 const a=matchAnswer(pack('pokemon-type-poison'),'Nidoran F'),b=matchAnswer(pack('pokemon-type-poison'),'Nidoran M');
 assert.ok(a&&b);assert.notEqual(a.label,b.label);
 assert.ok(matchAnswer(pack('pokemon-original-151'),'Mewtwo'));assert.equal(matchAnswer(pack('pokemon-original-151'),'Lugia'),null);
});
test('new spelling puzzles satisfy their displayed constraints',()=>{
 for(const a of pack('lex-palindromes').answers)assert.equal(a.label,[...a.label].reverse().join(''));
 for(const a of pack('lex-top-row-words').answers)assert.match(a.label,/^[qwertyuiop]{5,}$/);
 for(const a of pack('lex-all-five-vowels').answers)for(const v of 'aeiou')assert.ok(a.label.includes(v));
 for(const a of pack('lex-three-double-pairs').answers)assert.ok((a.label.match(/(.)\1/g)||[]).length>=3);
});
