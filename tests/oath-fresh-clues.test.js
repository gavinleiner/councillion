import test from 'node:test';
import assert from 'node:assert/strict';
import {createCourtGame,startCourtGame,tickCourtGame,actCourtGame} from '../court-games-engine.js';
import {sameOathClue,oathClueUsed,isOathTruth} from '../oath-engine.js';
import {OATH_QUESTIONS} from '../oath-data.js';
import {oathBotClue} from '../oath-bots.js';
const fixture=()=>{const s=createCourtGame('oath',Array.from({length:6},(_,i)=>({id:'p'+i,name:'Counsel '+i,ready:true,online:true,connected:true}))),secret={};startCourtGame(s,1000,()=>.3,secret);due({s,secret});due({s,secret});secret.oath.order=s.players.map(p=>p.id);s.turn='p0';return {s,secret};};
const due=f=>tickCourtGame(f.s,f.secret,f.s.deadline,()=>.3);
const act=(f,id,a,p={})=>actCourtGame(f.s,f.secret,id,a,{matchId:f.s.matchId,round:f.s.round,stageAt:f.s.stageAt,...p},f.s.stageAt+20);
function nextPlayer(f){due(f);due(f);due(f);}
function toVote(f){for(let i=0;i<80&&f.s.stage!=='oath-vote';i++){if(f.s.stage==='oath-write'&&!f.s.locked[f.s.turn])act(f,f.s.turn,'oath-bluff',{text:'Fresh clue '+f.s.turn+' lap '+f.s.clueLap});due(f);}assert.equal(f.s.stage,'oath-vote');}

test('clue comparison catches typography, spacing, articles, plurals and close long-word typos',()=>{
 for(const [a,b]of [['The shells','SHELL!'],['Café','CAFE'],['Back-pack','backpack'],['Fireworks','Firewroks'],['mushroom','mushrom'],['Berry','berries'],['Batteries','Battery'],['Cabins','Cabin']])assert.ok(sameOathClue(a,b),a+' / '+b);
 for(const [a,b]of [['glass','grass'],['water','later'],['red','red car'],['planet','planes'],['A clue p0','A clue p1'],['',''],['1984','1985']])assert.ok(!sameOathClue(a,b),a+' / '+b);
});
test('a repeat is rejected without sealing or consuming the turn, then a new clue succeeds',()=>{
 const f=fixture();act(f,'p0','oath-bluff',{text:'Mushroom'});nextPlayer(f);assert.equal(f.s.turn,'p1');
 for(const text of ['Mushroom','THE MUSHROOM!','mushrooms','Mushrom']){assert.throws(()=>act(f,'p1','oath-bluff',{text}),/already used/);assert.ok(!f.s.locked.p1);assert.equal(f.secret.oath.submissions.p1,undefined);assert.equal(f.s.stage,'oath-write');}
 act(f,'p1','oath-bluff',{text:'Forest'});assert.equal(f.secret.oath.submissions.p1.text,'Forest');
});
test('a player cannot recycle their own clue or another witness’s clue on an extra lap',()=>{
 const f=fixture();act(f,'p0','oath-bluff',{text:'Shell'});nextPlayer(f);toVote(f);for(const id of ['p0','p1','p2','p3'])act(f,id,'oath-more',{want:true});tickCourtGame(f.s,f.secret,f.s.stageAt+1600,()=>.3);assert.equal(f.s.clueLap,2);
 assert.throws(()=>act(f,'p0','oath-bluff',{text:'Shells!'}),/already used/);assert.throws(()=>act(f,'p0','oath-bluff',{text:'Fresh clue p1 lap 1'}),/already used/);act(f,'p0','oath-bluff',{text:'Ocean'});assert.ok(f.s.locked.p0);
});
test('timeout autosave cannot bypass the repeated-clue rule',()=>{
 const f=fixture();act(f,'p0','oath-bluff',{text:'Mushroom'});nextPlayer(f);act(f,'p1','oath-draft',{text:'Mushrooms'});nextPlayer(f);assert.equal(f.secret.oath.submissions.p1,undefined);assert.ok(f.s.testimonies.find(t=>t.id==='p1').missing);
});
test('clue history resets per case, and missing clues do not reserve an answer',()=>{
 const f=fixture();act(f,'p0','oath-bluff',{text:'Mushroom'});toVote(f);for(let i=0;i<10&&f.s.stage!=='oath-read';i++)due(f);assert.equal(f.s.stage,'oath-read');assert.equal(f.s.round,2);assert.deepEqual(f.s.testimonies,[]);due(f);act(f,f.s.turn,'oath-bluff',{text:'Mushroom'});assert.ok(f.s.locked[f.s.turn]);assert.equal(oathClueUsed({testimonies:[{text:'No clue submitted',missing:true}]},'No clue submitted'),false);
});
test('all 120 words have broad ten-word hint groups, safe aliases and distinct practice clues',()=>{
 assert.equal(OATH_QUESTIONS.length,120);assert.ok(OATH_QUESTIONS.filter(q=>/[ -]/.test(q.answer)).length>=95);
 for(const q of OATH_QUESTIONS){assert.equal(OATH_QUESTIONS.filter(x=>x.category===q.category&&x.hint===q.hint).length,10);assert.ok(!isOathTruth(q,q.hint));const used=[];
  for(let lap=1;lap<=2;lap++)for(let i=0;i<6;i++){const clue=oathBotClue(q,i===3,i,1,lap,used);assert.ok(clue,q.answer);assert.ok(!isOathTruth(q,clue));assert.ok(!oathClueUsed({testimonies:used},clue));used.push({text:clue});}
 }
});
