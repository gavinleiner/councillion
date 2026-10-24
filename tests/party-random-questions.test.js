import test from 'node:test';
import assert from 'node:assert/strict';
import {PARTY_PACKS,MIXED_PACKS,PACK_BY_ID} from '../data.js';
import {partyDeck,newParty,startParty,partyPack,random,dailyPacks,GROUP_DAILY_IDS} from '../engine.js';
import {beginParty} from '../party-rules.js';
import {rememberQuestions,readQuestionHistory} from '../question-history.js';
test('ordinary play excludes marketplace-tag, roster-position and specialist facets',()=>{
 for(const p of MIXED_PACKS)assert.ok(!/^(discovery-steam-|discovery-console-|discovery-(nfl|mlb)-(team-|quarterback|cornerback|1b|2b|3b|ss|p$)|discovery-.*-award-)/.test(p.id),p.id);
 for(const id of ['fun-minecraft','fun-fortnite','fun-video-games','fun-food','discovery-nba-players','discovery-nfl-players'])assert.ok(PARTY_PACKS.some(p=>p.id===id),id);
 for(const id of GROUP_DAILY_IDS)assert.ok(MIXED_PACKS.includes(PACK_BY_ID.get(id)),id);
});
test('fresh random seeds produce varied openers and do not replay the catalog prefix',()=>{
 const openers=new Set(),prefixes=new Set();for(let seed=1;seed<=200;seed++){const deck=partyDeck(random(seed));openers.add(deck[0]);prefixes.add(deck.slice(0,10).join('|'));assert.equal(new Set(deck).size,PARTY_PACKS.length);}
 assert.ok(openers.size>90,openers.size+' unique openers');assert.equal(prefixes.size,200);
});
test('a new lobby and a rematch respect seen history while independently shuffling the rest',()=>{
 const players=[{id:'a',name:'A',ready:true},{id:'b',name:'B',ready:true}],data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
 const one=newParty(players,random(3));startParty(one,1000,()=>0);const first=partyPack(one).id;rememberQuestions('a',[first],storage);
 const two=newParty(players,random(9),readQuestionHistory('a',storage));assert.ok(!two.packIds.includes(first));assert.notDeepEqual(two.packIds,one.packIds.filter(id=>id!==first));two.phase='ended';const a=structuredClone(two),b=structuredClone(two);beginParty(a,2000,random(88));beginParty(b,2000,random(88));assert.deepEqual(a.packIds,b.packIds);assert.equal(a.firstTurn,b.firstTurn);
});
test('published days stay preserved while future days use the shared pool',()=>{
 assert.deepEqual(dailyPacks('2026-10-23').map(p=>p.id),['fun-terraria','fun-sea-life','fun-tv','occupation-titles','fun-elements','catalog-snacks','fun-water-world']);
 assert.deepEqual(dailyPacks('2026-10-24'),dailyPacks('2026-10-24'));assert.equal(dailyPacks('2026-10-24').length,7);assert.ok(dailyPacks('2026-10-24').every(p=>MIXED_PACKS.includes(p)));
});
