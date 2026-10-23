import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {PACKS,REVIEWED_PACKS,MIXED_PACKS,PARTY_PACKS,canonicalQuestionId} from '../data.js';
import {questionReview} from '../question-quality.js';
import {practiceDraw,newParty,startParty,refreshPartyQuestions,answerParty,tickParty,matchAnswer,normalize,random} from '../engine.js';
import {PartySession} from '../party.js';
import {arenaLayout} from '../party-view.js';
import {CASE_QUESTIONS} from '../case-questions.js';
const pack=id=>PACKS.find(p=>p.id===id),read=name=>readFileSync(new URL('../'+name,import.meta.url));
test('retired source families cannot re-enter automatic pools, saved practice queues or direct practice',()=>{
 const retired=PACKS.filter(p=>questionReview(p).status==='archived');assert.ok(retired.length>1000);
 for(const p of retired){assert.ok(!REVIEWED_PACKS.includes(p));assert.ok(!MIXED_PACKS.includes(p));assert.ok(!PARTY_PACKS.includes(p));}
 const ids=retired.slice(0,10).map(p=>p.id),draw=practiceDraw([...ids,...MIXED_PACKS.slice(0,10).map(p=>p.id)],null,random(1));
 assert.ok([...draw.ids,...draw.remaining].every(id=>MIXED_PACKS.some(p=>p.id===id)));assert.throws(()=>practiceDraw([],ids[0]),/retired/);
 assert.ok(!MIXED_PACKS.some(p=>p.id.startsWith('var-')&&(p.group?.startsWith('places-')||p.group==='film-casts'||p.group==='game-characters')));
});
test('old room tails are repaired without repeating history; a retired active question costs no heart',()=>{
 const s=newParty([{id:'a',name:'A'},{id:'b',name:'B'}]),old=PACKS.find(p=>questionReview(p).status==='archived'),approved=PARTY_PACKS[0];
 s.packIds=[old.id,old.id,approved.id,approved.id];startParty(s,1000,()=>0);const hearts=s.players.map(p=>p.hearts);
 assert.equal(refreshPartyQuestions(s,2000,random(1)),true);assert.equal(s.phase,'burst');assert.deepEqual(s.players.map(p=>p.hearts),hearts);assert.match(s.notice,/no heart lost/);
 assert.ok(s.packIds.slice(1).every(id=>PARTY_PACKS.some(p=>p.id===id)));assert.equal(new Set(s.packIds.map(canonicalQuestionId)).size,s.packIds.length);
 assert.equal(refreshPartyQuestions(s,2100,random(2)),false);tickParty(s,2900,()=>0);assert.equal(s.phase,'playing');assert.ok(PARTY_PACKS.some(p=>p.id===s.packIds[s.round-1]));
});
test('clockwise roster movement skips eliminated players and randomly selected starters cover every seat',()=>{
 const players=Array.from({length:6},(_,i)=>({id:'p'+i,name:'Player '+i})),positions=arenaLayout(players.map(p=>({...p,connected:true})));
 for(let first=0;first<6;first++){
  const s=newParty(players);s.packIds=['fun-elements'];startParty(s,1000,()=> (first+.1)/6);assert.equal(s.turn,first);
  const skipped=(first+1)%6;s.players[skipped].hearts=0;const a=pack('fun-elements').answers[0];assert.ok(answerParty(s,'p'+first,a.label,1100).answer);assert.equal(s.turn,(first+2)%6);
 }
 const angles=positions.map(p=>Math.atan2((p.y-49)/31,(p.x-50)/32));for(let i=0;i<6;i++){const delta=(angles[(i+1)%6]-angles[i]+Math.PI*2)%(Math.PI*2);assert.ok(delta>0&&delta<Math.PI);}
});
test('private preparation is only published after that player receives the turn',async()=>{
 const writes=[],removes=[],session=new PartySession(()=>{},()=>{});clearInterval(session.timer);
 session.myId='b';session.code='TEST';session.c={ref:(_,p)=>p,db:{},set:async(p,v)=>writes.push([p,v]),remove:async p=>removes.push(p),serverTimestamp:()=>2000};session.state=newParty([{id:'a',name:'A'},{id:'b',name:'B'}]);session.state.matchId='game';startParty(session.state,1000,()=>0);
 try{session.setDraft('prepared privately');await session.flushDraft();assert.equal(writes.length,0);assert.ok(removes.length);assert.equal(session.draftText,'prepared privately');session.state.turn=1;session.state.turnStartedAt=2000;session.snapshot();await Promise.resolve();assert.equal(writes.at(-1)[1].text,'prepared privately');session.state.turn=0;session.snapshot();await Promise.resolve();assert.equal(writes.length,1);assert.ok(removes.length>=2);}finally{clearTimeout(session.draftTimer);}
});
test('reviewed source inventories have exact coverage, rather than passing only through fuzzy matches',()=>{
 const expected={
  'fun-minecraft':JSON.parse(read('data-snapshots/rework/minecraft-official.json')).map(r=>r.displayName),
  'fun-terraria':JSON.parse(gunzipSync(read('data-snapshots/quality/terraria-items.json.gz'))).filter(r=>/^-?\d+$/.test(String(r.id))&&+r.id!==0).map(r=>r.name),
  'fun-fortnite':JSON.parse(read('data-snapshots/rework/fortnite.json')).filter(r=>['outfit','emote','glider','pickaxe'].includes(r.type)).map(r=>r.name)
 };
 for(const[id,names]of Object.entries(expected)){const keys=new Set(pack(id).answers.flatMap(a=>[a.label,...a.aliases]).map(normalize));for(const name of names)assert.ok(normalize(name)?keys.has(normalize(name)):keys.has(normalize(pack(id).literalAliases?.[name])),id+': '+name);}
 assert.equal(matchAnswer(pack('fun-fortnite'),'!').label,'Exclamation Mark');
});
test('common omissions, aliases and boundaries are corrected without duplicate canonical identities',()=>{
 for(const[id,query]of [['fun-superheroes','Superman'],['fun-superheroes','Deadpool'],['fun-video-games',"Baldur's Gate 3"],['fun-game-characters','Princess Daisy'],['fun-fictional-characters','Luna Lovegood'],['fun-sea-life','Manatee'],['fun-sea-life','Dugong'],['fun-plants','Aloe Vera'],['fun-terraria','Zenith'],['fun-terraria','Rod of Harmony'],['fun-terraria','Terraprisma'],['fun-terraria','Shellphone']])assert.ok(matchAnswer(pack(id),query),id+': '+query);
 assert.equal(matchAnswer(pack('fun-terraria'),'Copper Shortsword').points,10);
 assert.equal(normalize(matchAnswer(pack('fun-game-characters'),'Tails').label),'milestailsprower');assert.equal(pack('fun-game-characters').answers.filter(a=>normalize(a.label)==='tails').length,0);
 for(const id of ['fun-game-characters','fun-fictional-characters'])for(const q of ['Additional Voices','Voice Talent','Combat Choreography'])assert.equal(matchAnswer(pack(id),q),null);
 for(const q of ['Mushroom','Yeast','Coral','Dog'])assert.equal(matchAnswer(pack('fun-plants'),q),null,q);
});
test('the Mahanoy overstatement question has three limited supported alternatives',()=>{
 const q=CASE_QUESTIONS.find(q=>q.id==='fc-9-1');assert.match(q.answer,/never/);assert.ok(q.distractors.every(s=>!s.includes('never')&&!s.includes('always')));assert.ok(q.distractors.some(s=>/threats/i.test(s)));assert.ok(q.distractors.some(s=>/particular/i.test(s)));
});
