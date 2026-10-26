import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {AUTHORED_PACKS} from '../authored-question-catalog.js';
import {MIXED_PACKS,REVIEWED_PACKS,PACK_BY_ID} from '../data.js';
import {questionReview} from '../question-quality.js';
import {resolveAnswer,normalize} from '../answer-matching.js';
const manifest=JSON.parse(readFileSync(new URL('../authored-bank-manifest.json',import.meta.url)));
const admission=JSON.parse(readFileSync(new URL('../data-snapshots/reviewed-standard/admission.json',import.meta.url)));
const approved=new Set(admission.questions.map(p=>p.id));
const pack=id=>AUTHORED_PACKS.find(p=>p.id==='authored-'+id);

test('candidate inventories cannot count toward the live target or appear in optional play without explicit admission',()=>{
 assert.equal(AUTHORED_PACKS.length,manifest.count);
 assert.deepEqual(new Set(MIXED_PACKS.map(p=>p.id)),approved);
 for(const p of AUTHORED_PACKS){
  assert.equal(PACK_BY_ID.get(p.id),p);
  assert.equal(MIXED_PACKS.includes(p),approved.has(p.id));
  if(!approved.has(p.id)){assert.equal(questionReview(p).status,'archived');assert.ok(!REVIEWED_PACKS.includes(p));}
 }
});

test('every authored inventory has the exact bank hash and a usable unique canonical/alias index',()=>{
 for(const p of manifest.categories){
  const bytes=gunzipSync(readFileSync(new URL('../authored-banks/'+p.answerFile,import.meta.url))),rows=JSON.parse(bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),p.sha256,p.id);
  assert.equal(rows.length,p.answerCount,p.id);
  const owners=new Map();
  for(const[label,points,aliases]of rows){
   assert.ok([10,30,60,85,100].includes(points),p.id);
   for(const n of [label,...aliases]){const key=normalize(n);assert.ok(key,p.id+': empty name');assert.ok(!owners.has(key)||owners.get(key)===label,p.id+': alias collision '+n);owners.set(key,label);}
  }
 }
});

test('independent familiar inputs and wrong boundaries are checked through the same matcher as actual play',()=>{
 for(const meta of manifest.categories){const p=PACK_BY_ID.get(meta.id),guarded={...p,answers:p.answers,excludedAnswers:meta.exclude};
  assert.ok(meta.familiar.length>=6,meta.id);
  for(const s of meta.familiar)assert.equal(resolveAnswer(guarded,s).status,'exact',meta.id+': '+s);
  for(const s of meta.exclude)assert.equal(resolveAnswer(guarded,s).status,'missing',meta.id+': '+s);
 }
});

test('the released-game inventories include the whole roster and do not turn alternate costumes into extra fighters',()=>{
 assert.equal(pack('smash-ultimate-fighters').answerCount,89);
 for(const n of ['Sora','Kazuya','Pyra','Mythra','Mii Brawler','Mii Swordfighter','Mii Gunner','Squirtle','Ivysaur','Charizard'])assert.equal(resolveAnswer(pack('smash-ultimate-fighters'),n).status,'exact',n);
 assert.notEqual(resolveAnswer(pack('smash-ultimate-fighters'),'Pyra').answer.label,resolveAnswer(pack('smash-ultimate-fighters'),'Mythra').answer.label);
 assert.equal(resolveAnswer(pack('smash-ultimate-fighters'),'Steve').answer.label,resolveAnswer(pack('smash-ultimate-fighters'),'Alex').answer.label);
 assert.equal(pack('dota-heroes').answerCount,127);assert.equal(resolveAnswer(pack('dota-heroes'),'Largo').status,'exact');
 assert.equal(pack('overwatch-heroes').answerCount,54);assert.equal(resolveAnswer(pack('overwatch-heroes'),'Doctrine').status,'exact');
 assert.equal(pack('legendary-mythical-pokemon').answerCount,94);
 for(const name of ['Mew','Mewtwo','Phione','Terapagos','Pecharunt'])assert.equal(resolveAnswer(pack('legendary-mythical-pokemon'),name).status,'exact',name);
});

test('Minecraft uses real item outputs and loot transformations, not just unmodified registry names',()=>{
 for(const name of ['Diamond','Glass','Iron Ingot','Charcoal','Steak','Cooked Beef'])assert.equal(resolveAnswer(pack('minecraft-furnace-results'),name).status,'exact',name);
 for(const name of ['Water Bottle','Enchanted Book','Cod','Raw Cod','Salmon','Raw Salmon','Bamboo'])assert.equal(resolveAnswer(pack('minecraft-fishing-catches'),name).status,'exact',name);
 assert.equal(pack('minecraft-fishing-catches').answerCount,22);
 for(const n of ['Cod','Raw Cod','Salmon','Raw Salmon','Fish','Book'])assert.equal(resolveAnswer(pack('minecraft-fishing-catches'),n).answer.points,10,n);
 for(const n of ['Steak','Cooked Beef','Iron','Gold','Copper'])assert.equal(resolveAnswer(pack('minecraft-furnace-results'),n).answer.points,10,n);
 for(const name of ['Coal','Lava Bucket','Dried Kelp Block','Mangrove Propagule'])assert.equal(resolveAnswer(pack('minecraft-furnace-fuel'),name).status,'exact',name);
 assert.notEqual(resolveAnswer(pack('minecraft-furnace-fuel'),'Netherrack').status,'exact');
});

test('the constellation question retains the complete published 88-name inventory',()=>{
 const source=JSON.parse(readFileSync(new URL('../data-snapshots/authored/sources/nasa-constellations.json',import.meta.url)));
 assert.equal(source.names.length,88);assert.equal(pack('official-constellations').answerCount,88);
 for(const n of source.names)assert.equal(resolveAnswer(pack('official-constellations'),n).status,'exact',n);
 assert.equal(resolveAnswer(pack('official-constellations'),'Capricorn').answer.label,'Capricornus');
});

test('the Super Bowl inventory reconciles at game grain, so early and recent champions cannot be omitted',()=>{
 const proof=JSON.parse(readFileSync(new URL('../data-snapshots/authored/sources/super-bowl-winners-by-game.json',import.meta.url)));
 assert.equal(proof.games.length,60);assert.deepEqual(proof.games.map(g=>g.superBowl),Array.from({length:60},(_,i)=>i+1));
 const expected=new Set(proof.games.map(g=>g.winningStarter));assert.equal(expected.size,36);
 const p=pack('super-bowl-winning-starters');assert.equal(p.answerCount,expected.size);
 assert.deepEqual(new Set(p.answers.map(a=>a.label)),expected);
 for(const game of proof.games)assert.equal(resolveAnswer(p,game.winningStarter).status,'exact','Super Bowl '+game.superBowl);
});

test('the F1 inventory reconciles every driver on every source page and retains normal public names',()=>{
 const proof=JSON.parse(readFileSync(new URL('../data-snapshots/authored/sources/f1-drivers.json',import.meta.url)));
 assert.equal(proof.total,881);assert.equal(proof.drivers.length,881);assert.equal(new Set(proof.drivers.map(d=>d.driverId)).size,881);
 let offset=0;for(const page of proof.requests){assert.equal(page.offset,offset);offset+=page.returned;}assert.equal(offset,proof.total);
 const p=pack('formula-one-drivers');assert.equal(p.answerCount,881);
 for(const d of proof.drivers)assert.equal(resolveAnswer(p,d.givenName+' '+d.familyName).status,'exact',d.driverId);
 for(const n of ['Juan Manuel Fangio','Sir Lewis Hamilton','Alex Albon','Kimi Antonelli','Arvid Lindblad','Schumacher','Checo'])assert.equal(resolveAnswer(p,n).status,'exact',n);
 for(const n of ['HAM','VER'])assert.equal(resolveAnswer(p,n).status,'missing',n+': official racing codes must not become guessed-name aliases');
});

test('ordinary shorthand names keep their real identity without farming a rare spelling neighbor',()=>{
 assert.equal(resolveAnswer(pack('garden-tools'),'Shoe').answer.label,'Gardening shoes');
 assert.equal(resolveAnswer(pack('garden-tools'),'Chainsaw').status,'exact');
 assert.equal(resolveAnswer(pack('kitchen-hand-tools'),'Chopping board').answer.label,'Cutting board');
 assert.equal(resolveAnswer(pack('kitchen-hand-tools'),'Egg whisk').answer.label,'Whisk');
 assert.equal(resolveAnswer(pack('laundry-supplies'),'All').answer.label,'All');
 assert.equal(resolveAnswer(pack('laundry-supplies'),'Fabric conditioner').answer.label,'Fabric softener');
 assert.equal(resolveAnswer(pack('nba-regular-season-mvps'),'Malone').answer.label,'Karl Malone');
 assert.equal(resolveAnswer(pack('super-bowl-winning-starters'),'Manning').answer.label,'Peyton Manning');
});
