import test from 'node:test';
import assert from 'node:assert/strict';
import {PACKS} from '../data.js';
import {normalize,dateKey,dailyPacks,matchAnswer,newParty,startParty,answerParty,tickParty,partyPack,disconnectPlayer,tier} from '../engine.js';
import {AIRLINE_PACK} from '../airline-bank.js';
import {VEHICLE_PACK} from '../vehicle-bank.js';
test('daily date uses New York across UTC midnight and DST',()=>{assert.equal(dateKey(new Date('2026-10-22T02:00:00Z')),'2026-10-21');assert.equal(dateKey(new Date('2026-10-22T04:00:00Z')),'2026-10-22');assert.equal(dateKey(new Date('2026-12-22T04:00:00Z')),'2026-12-21');});
test('seven shared daily prompts are deterministic and unique',()=>{const a=dailyPacks('2026-10-21').map(p=>p.id);assert.deepEqual(a,dailyPacks('2026-10-21').map(p=>p.id));assert.equal(new Set(a).size,7);assert.notDeepEqual(a,dailyPacks('2026-10-22').map(p=>p.id));});
test('every curated alias maps unambiguously to its intended answer',()=>{for(const p of PACKS){const keys=new Set();for(const a of p.answers){assert.ok([10,15,30,60,85,100].includes(a.points));for(const alias of [a.label,...a.aliases]){const k=normalize(alias);assert.ok(k.length,`${p.id}: empty alias`);const match=matchAnswer(p,alias);assert.equal(match?.label,a.label,`${p.id}: ${alias}`);}assert.ok(!keys.has(normalize(a.label)),`${p.id}: duplicate`);keys.add(normalize(a.label));}}});
test('normalization accepts accents and punctuation without changing short answers',()=>{assert.equal(normalize('Pétanque!'),'petanque');assert.equal(matchAnswer(PACKS.find(p=>p.id==='languages'),'C++').label,'C++');assert.equal(matchAnswer(PACKS.find(p=>p.id==='languages'),'C#').label,'C#');assert.equal(matchAnswer(PACKS.find(p=>p.id==='elements'),'oxygem')?.label,'Oxygen');assert.equal(matchAnswer(PACKS[0],'totally made up'),null);});
test('closest plausible spelling wins, including short-word typos',()=>{const p={answers:[{label:'abcde',aliases:[],points:10},{label:'abcdf',aliases:[],points:30}]};assert.equal(matchAnswer(p,'abcdg')?.label,'abcdf');assert.equal(matchAnswer(PACKS.find(p=>p.id==='chess'),'kingg')?.label,'King');});
const players=()=>[{id:'host',name:'Host'},{id:'guest',name:'Guest'}];
test('party requires two players to start',()=>{const s=newParty(players().slice(0,1));assert.equal(startParty(s,1000),false);assert.equal(s.phase,'lobby');});
test('valid party answers pass the puffer without resetting the fuse',()=>{const s=newParty(players(),()=>.5);s.firstTurn=0;startParty(s,1000,()=>.5);const deadline=s.deadline;const a=partyPack(s).answers[0];assert.ok(answerParty(s,'guest',a.label,1100).error);assert.ok(answerParty(s,'host','not a valid answer',1100).error);assert.ok(answerParty(s,'host',a.label,1100).answer);assert.equal(s.turn,1);assert.equal(s.deadline,deadline);assert.ok(answerParty(s,'guest',a.aliases[0]??a.label,1200).error);assert.equal(s.turn,1);});
test('late answers cannot dodge a puffer explosion',()=>{const s=newParty(players());startParty(s,1000,()=>0);assert.ok(answerParty(s,'host',partyPack(s).answers[0].label,s.deadline).error);assert.equal(s.turn,0);tickParty(s,s.deadline,()=>0);assert.equal(s.players[0].hearts,1);assert.equal(s.phase,'burst');tickParty(s,s.nextAt,()=>0);assert.equal(s.phase,'playing');assert.equal(s.round,2);assert.equal(s.turn,1);assert.equal(s.used.length,0);});
test('rare answers restore hearts at 600 points, capped at five',()=>{const s=newParty(players());startParty(s,1000,()=>0);s.players[0].hearts=1;s.players[0].meter=590;const a=partyPack(s).answers[0];answerParty(s,'host',a.label,1100);assert.equal(s.players[0].hearts,2);assert.ok(s.players[0].meter<600);});
test('elimination ends the game and names the last player',()=>{const s=newParty(players());startParty(s,1000,()=>0);s.players[0].hearts=1;tickParty(s,s.deadline);assert.equal(s.phase,'ended');assert.equal(s.winner,'guest');});
test('disconnect removes a lobby player and does not strand an active turn',()=>{const s=newParty([...players(),{id:'third',name:'Third'}]);disconnectPlayer(s,'third');assert.equal(s.players.length,2);startParty(s,1000,()=>0);disconnectPlayer(s,'host');assert.equal(s.phase,'ended');assert.equal(s.winner,'guest');});
test('three-player disconnect advances the turn to a connected player',()=>{const s=newParty([...players(),{id:'third',name:'Third'}]);startParty(s,1000,()=>0);disconnectPlayer(s,'host');assert.equal(s.phase,'playing');assert.equal(s.players[s.turn].id,'guest');});
test('user-supplied airline bank preserves all 111 answers and score allocations',()=>{assert.equal(AIRLINE_PACK.answers.length,111);assert.deepEqual(AIRLINE_PACK.answers.reduce((o,a)=>(o[a.points]=(o[a.points]??0)+1,o),{}),{10:8,30:22,60:30,85:50,100:1});for(const [input,expected] of [['Falcon in cabin',100],['Award booking fee',85],['Airport check-in fee',60],['Alcohol',30],['Wi-Fi',10]])assert.equal(matchAnswer(AIRLINE_PACK,input)?.points,expected);});
test('visible rarity names match the supplied reference',()=>{assert.deepEqual([100,85,60,30,10].map(n=>tier(n).name),['KRILLION','DEEP CUT','RARE','SCHOOLER','PLANKTON']);});
test('legacy packs retain their top tier; finite familiar inventories do not manufacture rare answers',()=>{for(const p of PACKS){const rows=p.answers;if(p.groupProfileVersion===1&&p.predicate?.kind!=='retained-bank')continue;if(p.editorialVersion===1&&!rows.some(a=>a.points>=60))continue;if(!p.id.startsWith('discovery-')||rows.filter(a=>a.points>=85).length>=10)assert.ok(rows.some(a=>a.points===100),p.id);if(p.id.startsWith('discovery-')&&rows.some(a=>a.points===100))assert.ok(rows.some(a=>a.points===85),p.id);}assert.equal(VEHICLE_PACK.answers.filter(a=>a.points===100).length,2);assert.ok(PACKS.find(p=>p.id==='distinct-songs-lil-peep').answers.every(a=>a.points<=30));});
test('adjacent transposition is accepted for short and long names',()=>{assert.equal(matchAnswer(PACKS.find(p=>p.id==='countries'),'frnace')?.label,'France');assert.equal(matchAnswer(PACKS.find(p=>p.id==='chess'),'kign')?.label,'King');});
test('a new party turn is protected by the minimum eight seconds',()=>{const s=newParty(players(),()=>.5);startParty(s,1000,()=>0);const old=s.deadline;const a=partyPack(s).answers[0];answerParty(s,'host',a.label,old-1000);assert.equal(s.deadline,old+7000);assert.equal(s.turn,1);});
test('restoring a heart never exceeds the maximum five',()=>{const s=newParty(players(),()=>.5);startParty(s,1000,()=>0);s.players[0].hearts=5;s.players[0].meter=590;answerParty(s,'host',partyPack(s).answers[0].label,1100);assert.equal(s.players[0].hearts,5);assert.ok(s.players[0].meter<600);});

test('large user-supplied vehicle bank retains every entry and score',()=>{assert.equal(VEHICLE_PACK.answers.length,1194);assert.deepEqual(VEHICLE_PACK.answers.reduce((o,a)=>(o[a.points]=(o[a.points]??0)+1,o),{}),{10:4,30:27,60:132,85:1029,100:2});assert.equal(matchAnswer(VEHICLE_PACK,'Ground-effect vehicle')?.points,100);assert.equal(matchAnswer(VEHICLE_PACK,'Iceboat')?.points,100);assert.equal(matchAnswer(VEHICLE_PACK,'Airplane')?.points,10);});

test('long-name typos tolerate swaps, neighboring keys and missed doubled letters without changing score',()=>{
 const p=PACKS.find(p=>p.id==='dinosaur-genera');
 for(const q of ['tryannosuarus','tyranasourus','tyranosaurus']){const a=matchAnswer(p,q);assert.equal(a?.label,'Tyrannosaurus',q);assert.equal(a.points,10);assert.equal(a.corrected,true);}
 assert.equal(matchAnswer(PACKS.find(p=>p.id==='cultured-dairy'),'mozarella')?.label,'Mozzarella');
});
test('only explicit familiar shorthand is accepted; initials are never invented',()=>{
 assert.equal(matchAnswer(VEHICLE_PACK,'G.E.V.'),null);
 assert.equal(matchAnswer(PACKS.find(p=>p.id==='best-picture-nominees'),'LOTR ROTK')?.label,'The Lord of the Rings: The Return of the King');
 assert.equal(matchAnswer(PACKS.find(p=>p.id==='best-picture-nominees'),'LOTR'),null);
 assert.equal(matchAnswer(PACKS.find(p=>p.id==='dinosaur-genera'),'tyran'),null);
});
test('random initials are rejected and actual short answer names retain priority',()=>{
 const a={label:'Black Bear',points:10,aliases:[]},b={label:'Brown Bear',points:85,aliases:[]};
 assert.equal(matchAnswer({answers:[a,b]},'BB'),null);
 assert.equal(matchAnswer({answers:[a,{label:'BB',points:30,aliases:[]}]},'BB').label,'BB');
 assert.equal(matchAnswer({answers:[a]},'B'),null);
});
test('close competing typo candidates automatically resolve to the best match',()=>{
 const p={answers:[{label:'abcdefghi',points:10,aliases:[]},{label:'abcdefghj',points:85,aliases:[]}]};
 assert.equal(matchAnswer(p,'abcdefghk')?.label,'abcdefghi');
});

test('every active player can be selected first and an announced draw survives starting',()=>{const roster=[...players(),{id:'third',name:'Third'}];for(let i=0;i<3;i++){const s=newParty(roster);startParty(s,1000,()=>i/3+.01);assert.equal(s.turn,i);}const s=newParty(roster);s.firstTurn=2;startParty(s,1000,()=>0);assert.equal(s.turn,2);});

test('only a played-out one-heart final duel earns clutch context',()=>{const s=newParty(players());s.players.forEach(p=>p.hearts=1);startParty(s,1000,()=>0);const pack=partyPack(s);answerParty(s,'host',pack.answers[0].label,1100);answerParty(s,'guest',pack.answers[1].label,2100);tickParty(s,s.deadline);assert.equal(s.phase,'ended');assert.deepEqual(s.clutchFinish.ids,['guest','host']);assert.equal(s.clutchFinish.exchanges,2);const idle=newParty(players());idle.players.forEach(p=>p.hearts=1);startParty(idle,1000,()=>0);tickParty(idle,idle.deadline);assert.equal(idle.clutchFinish,undefined);});
