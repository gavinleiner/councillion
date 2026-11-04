import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MIXED_PACKS,PARTY_PACKS,PACK_BY_ID} from '../data.js';
import {resolveAnswer} from '../answer-matching.js';
import {newParty,startParty,refreshPartyQuestions,random} from '../engine.js';
const release=JSON.parse(readFileSync(new URL('../data-snapshots/authored/plus200-release.json',import.meta.url)));
const p=k=>PACK_BY_ID.get('authored-200-'+k);
function exact(k,input){const r=resolveAnswer(p(k),input);assert.equal(r.status,'exact',`${k}: ${input}`);return r.answer;}
function reject(k,input){assert.equal(resolveAnswer(p(k),input).status,'missing',`${k}: ${input}`);}
test('the 200-question release is playable in both shared pools with balanced families',()=>{
 assert.equal(release.added,200);assert.equal(release.total,679);assert.ok(MIXED_PACKS.length>=release.total);
 assert.equal(new Set(release.questionIds).size,200);
 for(const id of release.questionIds){assert.ok(MIXED_PACKS.some(p=>p.id===id),id);assert.ok(PARTY_PACKS.some(p=>p.id===id),id);}
 const counts={};for(const q of MIXED_PACKS)counts[q.family]=(counts[q.family]??0)+1;
 assert.equal(Object.keys(counts).length,9);for(const n of Object.values(counts))assert.ok(n/MIXED_PACKS.length<0.15);
});
test('head-coach questions exclude famous players and college-only coaches',()=>{
 for(const n of ['Nick Nurse','Rick Carlisle','Chris Finch','Mitch Johnson'])exact('nba-coaches',n);
 for(const n of ['Ron Harper','Tim Cone','Tom Crean','Roy Rogers'])reject('nba-coaches',n);
 for(const n of ['Bill Belichick','Nick Saban'])exact('nfl-coaches',n);
 for(const n of ['Bill Yoast','Bill McCartney','Frank Leahy'])reject('nfl-coaches',n);
});
test('football stadium history retains baseball parks with real NFL games',()=>{
 for(const n of ['Fenway Park','Wrigley Field','Frank Youell Field','Husky Stadium','Stanford Stadium'])exact('nfl-stadiums',n);
 for(const n of ['Tokyo Dome','BC Place','BMO Field','Old Trafford'])reject('nfl-stadiums',n);
});
test('championship questions distinguish singles, majors, divisional titles and nominations',()=>{
 for(const n of ['Rex Hartwig','Pam Shriver','Elena Dementieva','Anna Kournikova'])reject('tennis-slam-champions',n);
 for(const n of ['Alexander Zverev','Jannik Sinner','Diede de Groot'])exact('tennis-slam-champions',n);
 for(const n of ['Ryan Fox','J.J. Spaun','Michelle Wie'])exact('golf-major-champions',n);
 for(const n of ['Kenny Perry','Judy Rankin','Bobby Cruickshank'])reject('golf-major-champions',n);
 for(const n of ['Brian Ortega','Brandon Royval','Chad Mendes'])reject('ufc-champions',n);
 for(const n of ['Tom Aspinall','Ken Shamrock','Dustin Poirier'])exact('ufc-champions',n);
});
test('whole-subject gaming inventories preserve common omissions and real boundaries',()=>{
 for(const n of ['Shino','Cephalobot','Kappn','Tom Nook'])exact('animal-crossing-characters',n);
 for(const n of ['Moss Soup','Triple Shot Espresso','Seafoam Pudding'])exact('stardew-recipes',n);
 reject('minecraft-job-blocks','Crafting Table');exact('minecraft-job-blocks','Cauldron');
 exact('minecraft-music-discs','13');reject('minecraft-music-discs','1.3');
 reject('street-fighter-fighters','Retsu');exact('street-fighter-fighters','Skullomania');
 reject('pokemon-ball-types','Pester Ball');exact('pokemon-ball-types','Origin Ball');
});
test('public names are accepted without generated two-letter shortcuts or duplicate personas',()=>{
 assert.equal(exact('fairly-oddparents-characters','Poof').label,exact('fairly-oddparents-characters','Peri').label);
 assert.equal(exact('jay-z-songs','Public Service Announcement').label,exact('jay-z-songs','Public Service Announcement (Interlude)').label);
 assert.equal(exact('jay-z-songs','Hard Knock Life').label,exact('jay-z-songs','Hard Knock Life (Ghetto Anthem)').label);
 exact('us-national-parks','Yellowstone National Park');exact('naval-ships','Nimitz');
 reject('animal-crossing-characters','TN');reject('elden-ring-weapons','MV');
});
test('natural-history and everyday subjects retain plausible but invalid boundaries',()=>{
 reject('ant-kinds','Termite');reject('bee-kinds','Yellowjacket');reject('bear-kinds','Red panda');
 exact('bear-kinds','Giant panda');reject('frog-kinds','Axolotl');
});

test('rooms from the 479-question release mix new subjects into unplayed turns',()=>{
 const additions=new Set(release.questionIds),old=MIXED_PACKS.filter(p=>!additions.has(p.id)).map(p=>p.id);
 const state=newParty([{id:'one',name:'One'},{id:'two',name:'Two'}],random(41));state.packIds=[...old];state.selectionBuild='20261025-reviewed-standard-v1';state.firstTurn=0;startParty(state,1000,random(4));
 const active=state.packIds[0],hearts=state.players.map(p=>p.hearts);assert.equal(refreshPartyQuestions(state,1100,random(49)),true);
 assert.equal(state.packIds[0],active);assert.deepEqual(state.players.map(p=>p.hearts),hearts);assert.equal(state.phase,'playing');
 for(const id of additions)assert.ok(state.packIds.includes(id),id);assert.ok(state.packIds.slice(1,100).some(id=>additions.has(id)));
 const stable=[...state.packIds];assert.equal(refreshPartyQuestions(state,1200,random(22)),false);assert.deepEqual(state.packIds,stable);
});
