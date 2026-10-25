import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {DISTINCT_PACKS} from '../distinct-question-catalog.js';
import {MIXED_PACKS,PARTY_PACKS,PACK_BY_ID,canonicalQuestionId} from '../data.js';
import {resolveAnswer,normalize} from '../answer-matching.js';
import {practiceDraw,reshufflePracticeQueue,partyDeck,random,dailyPacks} from '../engine.js';
const manifest=JSON.parse(readFileSync(new URL('../distinct-bank-manifest.json',import.meta.url)));
const baseline=JSON.parse(readFileSync(new URL('../data-snapshots/distinct/baseline-pool.json',import.meta.url)));
const admission=JSON.parse(readFileSync(new URL('../data-snapshots/reviewed-standard/admission.json',import.meta.url)));
test('source expansion remains available without overriding the explicit ordinary review',()=>{
 assert.ok(DISTINCT_PACKS.length>=500);assert.equal(manifest.count,DISTINCT_PACKS.length);
 assert.deepEqual(new Set(MIXED_PACKS.map(p=>p.id)),new Set(admission.questions.map(p=>p.id)));
 assert.deepEqual(PARTY_PACKS,MIXED_PACKS);
 for(const family of ['gaming','sports','culture','music','food','nature','science','world','everyday'])assert.ok(DISTINCT_PACKS.some(p=>p.family===family),family);
 assert.ok(Math.max(...Object.values(Object.groupBy(MIXED_PACKS,p=>p.family)).map(a=>a.length))<MIXED_PACKS.length/2);
 const anchors=DISTINCT_PACKS.filter(p=>['distinct-screen-credits','distinct-castmates'].includes(p.group)).map(p=>p.id.replace(/^distinct-screen-(?:works|costars)-/,''));assert.equal(new Set(anchors).size,anchors.length);
 assert.equal(new Set(MIXED_PACKS.map(p=>p.questionKey)).size,MIXED_PACKS.length);
 const excluded=JSON.parse(readFileSync(new URL('../data-snapshots/distinct/semantic-exclusions.json',import.meta.url)));for(const key of Object.keys(excluded))assert.ok(!DISTINCT_PACKS.some(p=>p.id==='distinct-'+key),key);
});
test('new banks retain their exact declared inventory and hash, with unique labels and unambiguous explicit aliases',()=>{
 for(const p of manifest.categories){
  const raw=gunzipSync(readFileSync(new URL('../'+p.answerDirectory+'/'+p.answerFile,import.meta.url))),rows=JSON.parse(raw);
  assert.equal(createHash('sha256').update(raw).digest('hex'),p.sha256,p.id);assert.equal(rows.length,p.answerCount,p.id);assert.ok(rows.length>=(p.naturalFinite?12:24));
  const owners=new Map();assert.equal(new Set(rows.map(r=>normalize(r[0]))).size,rows.length,p.id);
  for(const [label,points,aliases]of rows){assert.ok([10,30,60,85,100].includes(points));for(const name of [label,...aliases]){const key=normalize(name);assert.ok(key);assert.ok(!owners.has(key)||owners.get(key)===label,p.id+': '+name);owners.set(key,label);}}
  for(const name of p.editorialExamples??[])assert.ok(owners.has(normalize(name)),p.id+': '+name);
  for(const name of p.editorialNegative??[])assert.ok(!owners.has(normalize(name)),p.id+': '+name);
 }
});
test('a stale Practice queue gets newly admitted IDs once; old source histories exclude their replacements',()=>{
 const pending=baseline.categories.slice(80,130).map(p=>p.id),queue=reshufflePracticeQueue(pending,random(12),'20261025-variety-v1');
 assert.deepEqual(new Set(queue),new Set(pending.filter(id=>MIXED_PACKS.some(p=>p.id===id))));assert.equal(new Set(queue).size,queue.length);
 const stable=reshufflePracticeQueue(pending,random(13),'20261025-expansion-v1');assert.deepEqual(new Set(stable),new Set(pending.filter(id=>MIXED_PACKS.some(p=>p.id===id))));
 for(const p of DISTINCT_PACKS.filter(p=>p.originId&&MIXED_PACKS.includes(p))){assert.equal(canonicalQuestionId(p.originId),p.id);assert.ok(!partyDeck(random(5),[p.originId]).includes(p.id));}
 const retained=DISTINCT_PACKS.find(p=>p.originId&&MIXED_PACKS.includes(p));for(let seed=0;seed<30;seed++)assert.notEqual(PACK_BY_ID.get(partyDeck(random(seed),[retained.originId])[0]).family,retained.family);
 const draw=practiceDraw(queue,null,random(9));assert.equal(draw.ids.length,7);assert.equal(new Set([...draw.ids,...draw.remaining]).size,queue.length);
});
test('specific new answers and deliberate negative boundaries work through the real matcher',()=>{
 const checks={
  'distinct-facts-flightless-birds':{yes:['Penguin','Kiwi','Dodo','Great auk','Kakapo','Emu'],no:['Passenger pigeon','Guam kingfisher','Laughing owl']},
  'distinct-facts-fictional-places':{yes:['Hogwarts','Bikini Bottom','Wakanda','Mordor','Night City','Hyrule'],no:['Hogwarts Express']},
  'distinct-facts-muscles':{yes:['Biceps','Triceps','Quads','Glutes','Masseter','Diaphragm'],no:['Femur']},
  'distinct-kind-solid-figure-n-01':{yes:['Cube','Sphere','Cylinder','Torus'],no:['Statue','Bronze','Sculpture']},
  'distinct-facts-lab-tools':{yes:['Microscope','Pipette','Bunsen burner','Centrifuge','PCR machine'],no:['Bicycle']},
  'distinct-airlines':{yes:['American Airlines','Delta Air Lines','Lufthansa','Air France'],no:['AA','BA','UA','DL']},
  'distinct-mc-biomes':{yes:['Desert','Badlands','Plains','Cherry Grove'],no:['Diamond Sword']},
  'distinct-elden-weapons':{yes:['Claymore','Uchigatana','Moonveil'],no:['Glintstone Pebble']}
  ,'distinct-inventory-apple-varieties':{yes:['Gala','Fuji','Honeycrisp','Granny Smith','Banana'],no:['Musa acuminata']}
  ,'distinct-inventory-animal-marsupials':{yes:['Kangaroo','Koala','Wombat','Opossum','Wallaby'],no:['Platypus']}
  ,'distinct-inventory-animal-primates':{yes:['Gorilla','Lemur','Baboon','Chimpanzee'],no:['Capybara']}
  ,'distinct-inventory-catalog-citrus':{yes:['Orange','Lemon','Mandarin','Grapefruit'],no:['Orange juice','chenpi']}
  ,'distinct-inventory-catalog-fermented-foods':{yes:['Yogurt','Kimchi','Miso','Kombucha'],no:['Brandy','Must']}
  ,'distinct-cs2-weapons':{yes:['AK-47','AWP','Glock-18','Desert Eagle'],no:['Vandal','Medi-Shot','Bloodhound Gloves']}
  ,'distinct-valorant-weapons':{yes:['Vandal','Phantom','Classic','Sheriff'],no:['AWP']}
  ,'distinct-kind-gas-n-02':{yes:['Oxygen','Helium','Carbon dioxide','Steam'],no:['Liquid nitrogen','Mackerel sky','Gasoline']}
  ,'distinct-kind-liquid-n-03':{yes:['Milk','Coffee','Oil','Water'],no:['Steam','Ice','Liquid nitrogen']}
 };
 for(const[id,c]of Object.entries(checks)){const p=PACK_BY_ID.get(id);assert.ok(p,id);for(const name of c.yes)assert.equal(resolveAnswer(p,name).status,'exact',id+': '+name);for(const name of c.no)assert.notEqual(resolveAnswer(p,name).status,'exact',id+': '+name);}
 for(const[id,inputs]of [['distinct-facts-named-bridges',['Bosporus Bridge','Bosphorus Bridge']],['distinct-facts-water-sports',['Windsurfing','Sailboarding']]]){const p=PACK_BY_ID.get(id);assert.equal(resolveAnswer(p,inputs[0]).answer.label,resolveAnswer(p,inputs[1]).answer.label,'one answer identity for '+inputs.join('/'));}
});
test('the current and future Daily use the reviewed pool while earlier dates remain fixed',()=>{
 assert.ok(dailyPacks('2026-10-25').every(p=>MIXED_PACKS.includes(p)));
 assert.ok(!dailyPacks('2026-10-25').some(p=>p.id==='group-show-word-dead'));
 const schedule=JSON.parse(readFileSync(new URL('../daily-schedule.json',import.meta.url)));assert.ok(schedule.revisions.some(r=>r.from==='2026-10-26'));
 const future=schedule.ids.slice(21);assert.ok(future.some(id=>id.startsWith('distinct-')));assert.equal(new Set(schedule.ids).size,schedule.ids.length);
});
