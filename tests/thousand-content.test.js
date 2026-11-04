import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MIXED_PACKS,PARTY_PACKS,PACK_BY_ID} from '../data.js';
import {resolveAnswer} from '../answer-matching.js';
import {newParty,startParty,refreshPartyQuestions,random} from '../engine.js';
const release=JSON.parse(readFileSync(new URL('../data-snapshots/authored/thousand-release.json',import.meta.url)));
const p=k=>PACK_BY_ID.get('authored-1000-'+k);
function exact(k,input){const r=resolveAnswer(p(k),input);assert.equal(r.status,'exact',`${k}: ${input}`);return r.answer;}
function reject(k,input){assert.equal(resolveAnswer(p(k),input).status,'missing',`${k}: ${input}`);}
test('the thousand-question release admits 321 new subjects into both balanced game pools',()=>{
 assert.equal(release.base,679);assert.equal(release.added,321);assert.ok(MIXED_PACKS.length>=release.total);
 assert.deepEqual(PARTY_PACKS.map(p=>p.id),MIXED_PACKS.map(p=>p.id));
 const ids=new Set(MIXED_PACKS.map(p=>p.id));for(const id of release.questionIds)assert.ok(ids.has(id),id);
 for(const id of release.priorQuestionIds)assert.ok(ids.has(id),id);
 const families=Object.groupBy(MIXED_PACKS,p=>p.family);assert.equal(Object.keys(families).length,9);
 for(const rows of Object.values(families))assert.ok(rows.length/MIXED_PACKS.length>=.08&&rows.length/MIXED_PACKS.length<=.15);
});
test('normal names used by players are exact aliases without invented initials',()=>{
 exact('super-bowl-winning-teams','Chiefs');exact('world-series-winning-teams','Mets');exact('stanley-cup-winning-clubs','Oilers');
 exact('soccer-players','Lewandowski');exact('soccer-players','De Bruyne');exact('aircraft-models','F-16');exact('aircraft-models','747');exact('car-models','Mustang');exact('car-models','A3');
 exact('global-national-parks','Yellowstone National Park');exact('global-national-parks','Te Urewera National Park');
 reject('marvel-characters','IM');reject('star-wars-characters','SW');reject('video-game-studios','NG');
});
test('literal public symbols and regnal numbers retain distinct identities',()=>{
 assert.notEqual(exact('all-pokemon','Nidoran♂').label,exact('all-pokemon','Nidoran♀').label);
 for(const x of ['Sprigatito','Fuecoco','Quaxly','Pecharunt'])exact('all-pokemon',x);
 assert.equal(exact('david-bowie-songs','★').label,exact('david-bowie-songs','Blackstar').label);
 assert.notEqual(exact('english-uk-monarchs','Elizabeth I').label,exact('english-uk-monarchs','Elizabeth II').label);
 assert.equal(exact('english-uk-monarchs','William I').label,exact('english-uk-monarchs','William the Conqueror').label);
});
test('the admission boundaries stop valid words being turned into a different valid word',()=>{
 reject('plant-milks','Goat milk');exact('plant-milks','Oat milk');reject('parasites','Earthworm');exact('parasites','Heartworm');
 reject('gymnastics-skills','Kickflip');exact('gymnastics-skills','Backflip');exact('skateboard-tricks','Kickflip');
 reject('christina-aguilera-songs','Espresso');exact('christina-aguilera-songs','Express');
 reject('kung-fu-panda','Donkey');exact('kung-fu-panda','Monkey');
});
test('achievements distinguish champions from famous unsuccessful candidates',()=>{
 exact('nba-finals-mvp','Jalen Brunson');reject('nba-finals-mvp','Charles Barkley');
 exact('nba-defensive-award','Victor Wembanyama');reject('nba-defensive-award','Tim Duncan');
 exact('nba-dunk-champs','Keshad Johnson');reject('nba-dunk-champs','Aaron Gordon');
 exact('heisman-winners','Fernando Mendoza');reject('heisman-winners','Peyton Manning');
 exact('cy-young-winners','Roy Halladay');reject('cy-young-winners','Nolan Ryan');
 exact('world-series-winning-teams','Milwaukee Brewers');exact('world-series-winning-teams','New York Mets');reject('world-series-winning-teams','Tampa Bay Rays');
});
test('real fictional aliases cannot earn two different character answers',()=>{
 assert.equal(exact('wednesday-characters','Slurp').label,exact('wednesday-characters','Isaac Night').label);
 assert.equal(exact('marvel-characters','Wolverine').label,exact('marvel-characters','James Howlett').label);
 assert.equal(exact('dc-characters','Batman').label,exact('dc-characters','Bruce Wayne').label);
 exact('muppets-characters','Uncle Deadly');reject('arcane-characters','Garen');reject('arcane-characters','Lux');
});
test('current official units and old-pool factual repairs remain playable',()=>{
 for(const x of ['Dragon Duke','Greedy Raven','Super Hog Rider','Ruin Knight','C.O.O.K.I.E'])exact('clash-of-clans-troops',x);
 for(const x of ['Magic Johnson','Paul Westhead','Maurice Cheeks','Earl Watson','Tyrone Corbin'])assert.equal(resolveAnswer(PACK_BY_ID.get('authored-200-nba-coaches'),x).status,'exact',x);
 const coaches=PACK_BY_ID.get('authored-200-nba-coaches');assert.equal(resolveAnswer(coaches,'Bob Weiss').answer.label,resolveAnswer(coaches,'Bobby Weiss').answer.label);
 assert.equal(resolveAnswer(PACK_BY_ID.get('authored-200-headphone-brands'),'Soundcore').status,'exact');
});
test('a room started with 679 subjects receives the new deck without resetting its current turn',()=>{
 const additions=new Set(release.questionIds),old=[...release.priorQuestionIds];assert.equal(old.length,679);
 const state=newParty([{id:'one',name:'One'},{id:'two',name:'Two'}],random(4));state.packIds=[...old];state.selectionBuild='20261103-plus200-v1';state.firstTurn=0;startParty(state,1000,random(5));
 const active=state.packIds[0],hearts=state.players.map(p=>p.hearts);assert.equal(refreshPartyQuestions(state,1100,random(6)),true);
 assert.equal(state.packIds[0],active);assert.deepEqual(state.players.map(p=>p.hearts),hearts);for(const id of additions)assert.ok(state.packIds.includes(id));
 assert.ok(state.packIds.slice(1,70).some(id=>additions.has(id)));const stable=[...state.packIds];assert.equal(refreshPartyQuestions(state,1200,random(7)),false);assert.deepEqual(state.packIds,stable);
});

test('true sago palms remain valid while shared bedding synonyms keep the common score',()=>{
 exact('palm-kinds','Sago palm');reject('palm-kinds','Cycas revoluta');
 assert.equal(exact('bedding','Counterpane').label,exact('bedding','Bedspread').label);assert.equal(exact('bedding','Counterpane').points,30);
});

test('recording versions share a song identity while real title words remain intact',()=>{
 for(const [subject,a,b]of [
  ['david-bowie-songs','Space Oddity','Space Oddity (Mono)'],
  ['one-direction-songs','One Way or Another','One Way or Another (Teenage Kicks)'],
  ['childish-gambino-songs','Sweatpants','IV. Sweatpants'],
  ['outkast-songs','B.O.B.','B.O.B. (Bombs Over Baghdad)'],
  ['whitney-houston-songs','I Wanna Dance with Somebody','I Wanna Dance with Somebody (Who Loves Me)']
 ])assert.equal(exact(subject,a).label,exact(subject,b).label,subject);
 exact('mariah-carey-songs','In the Mix');exact('bob-marley-the-wailers-songs','Mix Up, Mix Up');
 exact('frank-sinatra-songs','The House I Live In');
});
