import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {MIXED_PACKS,PARTY_PACKS,PACK_BY_ID} from '../data.js';
import {newParty,startParty,refreshPartyQuestions,partyDeck,dailyPacks,random} from '../engine.js';
import {beginParty} from '../party-rules.js';
import {uniformQuestionDeck} from '../question-selection.js';
import {clearQuestionHistory,rememberQuestions,readQuestionHistory} from '../question-history.js';
const review=JSON.parse(readFileSync(new URL('../data-snapshots/reviewed-standard/broad-playability-review.json',import.meta.url)));
const admission=JSON.parse(readFileSync(new URL('../data-snapshots/reviewed-standard/admission.json',import.meta.url)));
const players=[{id:'a',name:'A',ready:true},{id:'b',name:'B',ready:true}],ids=PARTY_PACKS.map(p=>p.id);
test('the broader pool retires a majority of the old prompts, retaining every original Yes vote',()=>{
 assert.equal(review.previousCount,1000);assert.equal(review.normalPlayQuestions,499);assert.equal(review.removedCount,501);assert.equal(review.keptOriginalYesVotes,98);
 assert.deepEqual(new Set(ids),new Set(review.keptIds));assert.deepEqual(PARTY_PACKS,MIXED_PACKS);
 assert.equal(new Set([...review.keptIds,...review.removedIds]).size,1000);
 assert.equal(admission.archivedQuestions.length,501);
 for(const id of review.removedIds){assert.ok(PACK_BY_ID.has(id),id);assert.ok(!ids.includes(id),id);}
 assert.equal(Object.keys(review.families).length,9);for(const n of Object.values(review.families))assert.ok(n/ids.length>=.08&&n/ids.length<=.15);
 for(const id of ['group-q011','group-q015','group-q021','group-q061','authored-200-nba-coaches'])assert.ok(ids.includes(id),id);
 for(const p of MIXED_PACKS)assert.ok(!/^authored-(?:nba-franchise-|nfl-franchise-)/.test(p.id),p.id);
});
test('full saved histories and exhausted prior matches never shrink a new match',()=>{
 const empty=newParty(players,random(19)),full=newParty(players,random(19),ids);assert.deepEqual(full,empty);
 full.phase='ended';full.exhausted=true;full.seenIds=[...ids];full.players[0].hearts=0;
 assert.equal(beginParty(full,2000,random(19)),true);assert.equal(full.exhausted,false);assert.equal(full.phase,'countdown');assert.deepEqual(full.seenIds,[]);
 assert.deepEqual(full.packIds,uniformQuestionDeck(PARTY_PACKS,{rng:random(19)}));assert.equal(new Set(full.packIds).size,ids.length);
});
test('migration discards legacy account history while preserving the actual played prefix and hearts',()=>{
 const s=newParty(players,random(5));startParty(s,1000,random(7));const active=s.packIds[0],hearts=s.players.map(p=>p.hearts);
 s.seenIds=[...ids];s.selectionBuild='20261103-thousand-v1';s.packIds=s.packIds.slice(0,25);
 assert.equal(refreshPartyQuestions(s,1100,random(4)),true);assert.deepEqual(s.seenIds,[active]);assert.equal(s.packIds[0],active);assert.deepEqual(s.players.map(p=>p.hearts),hearts);assert.equal(s.phase,'playing');
 assert.deepEqual(new Set(s.packIds),new Set(ids));assert.equal(new Set(s.packIds).size,ids.length);
 const next=structuredClone(s);assert.equal(refreshPartyQuestions(s,1200,random(88)),false);assert.deepEqual(s,next);
});
test('clearing retired prompt history preserves login, profile and rank storage',()=>{
 const map=new Map([['google-auth','keep-auth'],['profile','keep-profile'],['rank','keep-rank']]),storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
 rememberQuestions('a',ids,storage);clearQuestionHistory('a',storage);assert.deepEqual(readQuestionHistory('a',storage),[]);assert.equal(map.size,3);assert.equal(map.get('rank'),'keep-rank');assert.equal(map.get('google-auth'),'keep-auth');
});
test('future shared Daily draws use only the curated pool and never depend on Puffer history',()=>{
 const tomorrow=dailyPacks('2026-11-05');assert.equal(tomorrow.length,7);assert.equal(new Set(tomorrow.map(p=>p.family)).size,7);assert.ok(tomorrow.every(p=>ids.includes(p.id)));
 partyDeck(random(99),ids);assert.deepEqual(dailyPacks('2026-11-05'),tomorrow);
 const schedule=JSON.parse(readFileSync(new URL('../daily-schedule.json',import.meta.url)));assert.equal(review.preservedDailyQuestions,91);assert.equal(createHash('sha256').update(JSON.stringify(schedule.ids.slice(0,91))).digest('hex'),review.preservedDailyPrefixSha256);assert.ok(schedule.revisions.some(r=>r.from==='2026-11-05'&&r.selection==='20261104-broad-random-v1'));
});
