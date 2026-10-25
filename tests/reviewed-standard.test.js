import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MIXED_PACKS,PARTY_PACKS,PACK_BY_ID} from '../data.js';
import {resolveAnswer} from '../answer-matching.js';
import {questionReview} from '../question-quality.js';
import {partyDeck,practiceDraw,reshufflePracticeQueue,random,dailyPacks} from '../engine.js';
const admission=JSON.parse(readFileSync(new URL('../data-snapshots/reviewed-standard/admission.json',import.meta.url)));
test('ordinary play is exactly the explicit reviewed set; generator flags cannot admit a question',()=>{
 const admitted=new Set(admission.questions.map(q=>q.id));assert.deepEqual(new Set(MIXED_PACKS.map(p=>p.id)),admitted);assert.deepEqual(PARTY_PACKS,MIXED_PACKS);
 for(const q of admission.questions){const p=PACK_BY_ID.get(q.id);assert.equal(p.prompt,q.prompt,q.id);assert.equal(p.family,q.family,q.id);}
 for(const flags of [{editorialVersion:1},{groupProfileVersion:1},{qualityVersion:1,ranking:'source-familiarity-v1'}])assert.notEqual(questionReview({id:'unreviewed-generated-category',prompt:'Name a type of structural framework.',mixed:true,answerCount:10000,familiarCount:100,...flags}).status,'automatic');
 for(const id of ['distinct-kind-leather-n-01','distinct-facts-laboratory-processes','distinct-screen-costars-emma-watson','group-open-players-nfl-or-wnba','group-song-word-sun','group-show-word-dead','distinct-inventory-discovery-nfl-team-ten'])assert.ok(!admitted.has(id),id);
});
test('the original Yes prompts and independently supplied familiar answers work exactly, while wrong answers never become corrections',()=>{
 let yes=0,no=0;
 for(const q of admission.questions){const p=PACK_BY_ID.get(q.id);for(const input of q.yes){assert.equal(resolveAnswer(p,input).status,'exact',q.id+': '+input);yes++;}for(const input of q.no){assert.equal(resolveAnswer(p,input).status,'missing',q.id+': '+input);no++;}}
 assert.ok(yes>1200);assert.ok(no>130);
});
test('same-name repairs preserve one answer identity and never manufacture acronym aliases',()=>{
 for(const[id,a,b]of [['group-q012','Steak','Cooked Beef'],['group-q017','Daisy','Princess Daisy'],['group-q019','Morgott','Morgott the Omen King'],['group-q077','Zucchini','Courgette']])assert.equal(resolveAnswer(PACK_BY_ID.get(id),a).answer.label,resolveAnswer(PACK_BY_ID.get(id),b).answer.label);
 assert.equal(resolveAnswer(PACK_BY_ID.get('group-steam-open-world'),'Skyrim').answer.label,'The Elder Scrolls V: Skyrim');assert.equal(resolveAnswer(PACK_BY_ID.get('catalog-snacks'),'Pretzel').answer.label,'Pretzel');
 for(const query of ['GT','GTA V','AB','XY'])assert.notEqual(resolveAnswer(PACK_BY_ID.get('group-steam-open-world'),query).status,'exact');
});
test('retired recipes cannot survive old saved queues or randomly return in new rooms',()=>{
 const retired=['group-song-word-sun','distinct-kind-leather-n-01','distinct-facts-laboratory-processes'],pending=[...retired,...MIXED_PACKS.slice(0,30).map(p=>p.id)],queue=reshufflePracticeQueue(pending,random(4),'20261025-expansion-v1');assert.deepEqual(new Set(queue),new Set(pending.filter(id=>!retired.includes(id))));
 for(let seed=0;seed<100;seed++){const deck=partyDeck(random(seed));assert.deepEqual(new Set(deck),new Set(PARTY_PACKS.map(p=>p.id)));assert.ok(!deck.some(id=>retired.includes(id)));}
 const draw=practiceDraw(pending,null,random(8));assert.ok(![...draw.ids,...draw.remaining].some(id=>retired.includes(id)));assert.equal(new Set(dailyPacks('2026-10-25').map(p=>p.family)).size,7);
});
test('the athlete bank covers every verified first-team appearance in the official league snapshot',()=>{
 const source=JSON.parse(readFileSync(new URL('../data-snapshots/reviewed-standard/premier-league-players.json',import.meta.url))),p=PACK_BY_ID.get('group-q022');
 assert.equal(source.players.length,451);
 for(const player of source.players){assert.ok(player.minutes>0);assert.equal(resolveAnswer(p,player.first+' '+player.last).status,'exact',player.first+' '+player.last);}
 assert.equal(resolveAnswer(p,'Bruno Fernandes').answer.label,resolveAnswer(p,'Bruno Borges Fernandes').answer.label);
});
