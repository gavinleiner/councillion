import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {GROUP_PACKS} from '../group-question-catalog.js';
import {PACK_BY_ID,MIXED_PACKS,PARTY_PACKS,canonicalQuestionId} from '../data.js';
import {partyDeck,practiceDraw,random,dailyPacks} from '../engine.js';
import {uniformQuestionDeck} from '../question-selection.js';
import {resolveAnswer,normalize} from '../answer-matching.js';
import {createGroupCatalog,seedFunAnswers} from '../fun-bank-loader.js';
const read=path=>readFileSync(new URL('../'+path,import.meta.url));
const manifest=JSON.parse(read('group-bank-manifest.json'));
const approved=JSON.parse(read('data-snapshots/group/approved-prompts.json'));
test('all 98 approved prompts become playable, within exactly 5,000 distinct ordinary and Puffer categories',()=>{
 assert.equal(GROUP_PACKS.length,5000);assert.equal(MIXED_PACKS.length,5000);assert.equal(PARTY_PACKS.length,5000);
 assert.equal(new Set(GROUP_PACKS.map(p=>p.id)).size,5000);assert.equal(new Set(GROUP_PACKS.map(p=>p.identityHash)).size,5000);
 assert.equal(new Set(GROUP_PACKS.map(p=>canonicalQuestionId(p.id))).size,5000);
 assert.equal(GROUP_PACKS.filter(p=>p.reviewId).length,98);
 for(const q of approved){const p=GROUP_PACKS.find(p=>p.reviewId===q.id);assert.ok(p,q.id);assert.equal(p.prompt,q.prompt);assert.ok(p.answerCount>=12,q.id);for(const name of q.examples)assert.equal(resolveAnswer(p,name).status,'exact',q.id+': '+name);}
 for(const id of ['q053','q055'])assert.ok(!GROUP_PACKS.some(p=>p.reviewId===id));
});
test('single Steam labels retain actual full memberships without a two-tag condition',()=>{
 const source=JSON.parse(gunzipSync(read('data-snapshots/discovery/steam.json.gz')));
 const tags=GROUP_PACKS.filter(p=>p.predicate?.kind==='steam-tag');assert.ok(tags.length>=150);
 for(const p of tags){const {tag}=p.predicate;assert.ok(source.tags[tag]);assert.equal(p.prompt,`Name a game on Steam tagged “${tag}”.`);const allowed=new Set(source.tags[tag].map(id=>normalize(source.games[id][0])));for(const a of p.answers)assert.ok(allowed.has(normalize(a.label)),p.id+': '+a.label);}
 for(const tag of ['Horror','Open World','RPG','Survival','Co-op'])assert.ok(tags.some(p=>p.predicate.tag===tag),tag);
 const pairs=GROUP_PACKS.filter(p=>p.predicate?.kind==='steam-tags');assert.ok(pairs.length>=40);
 for(const p of pairs){assert.equal(p.predicate.tags.length,2);assert.ok(p.answerCount>=50&&p.familiarCount>=20);const sets=p.predicate.tags.map(tag=>new Set(source.tags[tag].map(id=>normalize(source.games[id][0]))));for(const a of p.answers)assert.ok(sets.every(set=>set.has(normalize(a.label))),p.id+': '+a.label);}
});
test('every new compressed bank has unique canonical labels, unambiguous aliases and its declared content hash',()=>{
 assert.equal(manifest.count,5000);let entries=0;
 for(const m of manifest.categories){const raw=gunzipSync(read(m.answerDirectory+'/'+m.answerFile));assert.equal(createHash('sha256').update(raw).digest('hex'),m.sha256,m.id);const rows=JSON.parse(raw),owners=new Map();assert.equal(rows.length,m.answerCount);entries+=rows.length;
  assert.equal(new Set(rows.map(r=>normalize(r[0]))).size,rows.length,m.id);
  for(const [label,points,aliases] of rows){assert.ok([10,30,60,85,100].includes(points));for(const s of [label,...aliases]){const k=normalize(s);assert.ok(k);assert.ok(!owners.has(k)||owners.get(k)===label,m.id+': '+s);owners.set(k,label);}}
 }
 assert.equal(entries,manifest.canonicalEntries);
});
test('approved answers respect the question boundary and explicit aliases keep one identity',()=>{
 const exact=(id,s)=>resolveAnswer(PACK_BY_ID.get('group-'+id),s).status==='exact';
 for(const [id,s] of [['q019','Malenia'],['q021','Chiefs'],['q043','Robert Downey Jr.'],['q066','Tea'],['q071','Bat'],['q079','Sun'],['q088','Japan'],['q092','Australia'],['q093','Pencil'],['q100','Book']])assert.ok(exact(id,s),id+': '+s);
 for(const [id,s] of [['q023','Badminton'],['q029','Houston Rockets'],['q041','Dogmeat'],['q043','Thor'],['q069','Poison dart frog'],['q071','Flying squirrel'],['q077','Salt'],['q079','Voyager 1'],['q082','Mirror'],['q084','Brain'],['q088','Borneo'],['q090','Brisbane'],['q092','Japan']])assert.ok(!exact(id,s),id+': '+s);
 for(const [id,a,b] of [['q085','Aluminium','Aluminum'],['q090','Torino','Turin'],['q092','USA','United States'],['q019','Malenia','Malenia, Blade of Miquella']])assert.equal(resolveAnswer(PACK_BY_ID.get('group-'+id),a).answer.label,resolveAnswer(PACK_BY_ID.get('group-'+id),b).answer.label);
});
test('the approved athlete bank covers both complete returned NHL career indexes',()=>{
 const p=PACK_BY_ID.get('group-q022'),names=new Set(p.answers.flatMap(a=>[a.label,...a.aliases]).map(normalize));
 for(const position of ['skater','goalie']){const source=JSON.parse(gunzipSync(read('data-snapshots/group/nhl-'+position+'.json.gz')));assert.equal(source.players.length,source.total);for(const r of source.players)assert.ok(names.has(normalize(r.name)),r.name);}
 for(const s of ['Wayne Gretzky','Connor McDavid','Patrick Roy','Sachin Tendulkar','Virat Kohli','Richie McCaw','Paola Egonu'])assert.equal(resolveAnswer(p,s).status,'exact',s);
});
test('Puffer and Practice use a uniform unseen deck and Daily remains a shared, unrepeated calendar',()=>{
 const expected=uniformQuestionDeck(PARTY_PACKS,{rng:random(794)});assert.deepEqual(partyDeck(random(794)),expected);
 const seen=expected.slice(0,60),next=partyDeck(random(981),seen);assert.equal(next.length,4940);assert.ok(next.every(id=>!seen.includes(id)));
 const practice=practiceDraw([],null,random(794));assert.deepEqual([...practice.ids,...practice.remaining],uniformQuestionDeck(MIXED_PACKS,{rng:random(794)}));
 const prefixes=new Set();for(let seed=1;seed<=100;seed++)prefixes.add(partyDeck(random(seed)).slice(0,7).join('|'));assert.equal(prefixes.size,100);
 for(const id of ['discovery-steam-horror','discovery-steam-rpg-open-world']){const target=canonicalQuestionId(id);assert.notEqual(target,id);assert.ok(PARTY_PACKS.some(p=>p.id===target));assert.ok(!partyDeck(random(42),[id]).includes(target),'legacy Steam history: '+id);}
 const all=[];for(let d=0;d<100;d++){const date=new Date(Date.UTC(2026,9,24+d)).toISOString().slice(0,10),one=dailyPacks(date);assert.equal(one.length,7);assert.deepEqual(one.map(p=>p.id),dailyPacks(date).map(p=>p.id));all.push(...one.map(p=>p.id));}assert.equal(new Set(all).size,700);
});
test('a retained ID and a new bank revision cannot share stale hydrated answers',()=>{
 const one=createGroupCatalog([{id:'cache-test',answerFile:'one.gz',answerCount:1}],manifest.build)[0],two=createGroupCatalog([{id:'cache-test',answerFile:'two.gz',answerCount:1}],manifest.build)[0];
 seedFunAnswers(one,[['One',10,[]]]);seedFunAnswers(two,[['Two',30,[]]]);assert.equal(one.answers[0].label,'One');assert.equal(two.answers[0].label,'Two');
});
test('a wholly familiar source inventory does not manufacture an uncommon 100-point answer',()=>{
 const p=PACK_BY_ID.get('group-songs-by-bts');assert.ok(p.answerCount>=24);assert.ok(p.answers.every(a=>a.points<=30));
});
test('production variants, album-object artifacts and awkward title words cannot pad the pool',()=>{
 assert.ok(!GROUP_PACKS.some(p=>p.predicate?.media==='album'||p.predicate?.entity==='album'));
 for(const p of GROUP_PACKS){if(p.predicate?.kind==='title-word')assert.ok(!['com','des','slowed','reverb','scotland','remix'].includes(p.predicate.word),p.id);}
 const music=GROUP_PACKS.filter(p=>p.predicate?.kind==='artist-credit');assert.ok(music.length>20);
 for(const p of music)assert.ok(!p.answers.some(a=>/ - (?:\d{4} )?(?:remaster|slowed|radio edit)/i.test(a.label)),p.id);
});
test('new story and genre questions include familiar, playable examples',()=>{
 for(const [id,title] of [['group-movie-comedy-theme-ghosts','Ghostbusters'],['group-movie-horror-theme-sharks','Jaws'],['group-movie-genres-animation-and-comedy','Shrek'],['group-show-genre-comedy','The Office']]){const p=PACK_BY_ID.get(id);assert.ok(p,id);assert.equal(resolveAnswer(p,title).status,'exact',id+': '+title);}
 const q=PACK_BY_ID.get('group-q023');assert.equal(resolveAnswer(q,'Die').status,'missing');assert.equal(resolveAnswer(q,'Ping pong').answer.label,resolveAnswer(q,'Table tennis').answer.label);
});
