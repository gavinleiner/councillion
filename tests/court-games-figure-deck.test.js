import test from 'node:test';
import assert from 'node:assert/strict';
import {figureDeck} from '../court-games-figure-deck.js';
import {accuracyScore,createCourtGame,startCourtGame,tickCourtGame,actCourtGame} from '../court-games-engine.js';
import {FIGURE_QUESTIONS,FIGURE_BY_ID} from '../court-games-data.js';
import {figureNumber,rulerPositions} from '../court-games-figure.js';
import {random} from '../question-selection.js';

const subjects=['Gaming','Sports','Screen','Music','World','Nature','Everyday'];
const bank=subjects.flatMap((category,c)=>Array.from({length:140+c*4},(_,i)=>({id:category+i,category,topic:'topic-'+(i%40),kind:i%5===0?'calendar':'count',warmup:i%8===0})));
const byId=new Map(bank.map(q=>[q.id,q]));
test('fresh room draws balance subjects and avoid franchise and easy-question clusters',()=>{
 const firsts=new Set();
 for(let seed=0;seed<200;seed++){
  const ids=figureDeck(bank,random(seed)),opening=ids.slice(0,10).map(id=>byId.get(id));
  assert.equal(ids.length,bank.length);assert.equal(new Set(ids).size,bank.length);
  assert.equal(new Set(opening.slice(0,7).map(q=>q.category)).size,7);
  assert.equal(new Set(opening.map(q=>q.topic)).size,10);
  for(let i=0;i<=4;i++){
   const window=opening.slice(i,i+6);
   assert.ok(window.filter(q=>q.kind==='calendar').length<=2);
   assert.ok(window.filter(q=>q.warmup).length<=1);
  }
  firsts.add(ids[0]);
 }
 assert.ok(firsts.size>150);
});
test('an exhausted subject or a tiny same-topic bank cannot drop or duplicate questions',()=>{
 const questions=[{id:'a',category:'one',topic:'same'},{id:'b',category:'two',topic:'same'},{id:'c',category:'two',topic:'same'}];
 assert.deepEqual(new Set(figureDeck(questions,random(12))),new Set(['a','b','c']));
 assert.deepEqual(figureDeck([],random(12)),[]);
});
test('calendar scoring measures year error rather than dividing by the four-digit year',()=>{
 assert.equal(accuracyScore(1989,1989,1,50),1000);
 assert.equal(accuracyScore(1984,1989,1,50),accuracyScore(1994,1989,1,50));
 assert.ok(accuracyScore(1969,1989,1,50)<500);
 assert.ok(accuracyScore(1969,1989)>950);
 assert.equal(accuracyScore(80,100),Math.round(1000*Math.exp(-.44)));
 assert.equal(accuracyScore(0,0),1000);assert.equal(accuracyScore(0,10,1,0),0);
 for(let off=1;off<200;off++)assert.ok(accuracyScore(1989+off,1989,1,50)<=accuracyScore(1988+off,1989,1,50));
});

test('the actual admitted bank deals varied complete matches from all seven subjects',()=>{
 assert.equal(FIGURE_QUESTIONS.length,1001);
 for(const id of ['light-speed','shot-put','goal','crayons','spirited-away-runtime'])assert.ok(!FIGURE_BY_ID.has(id),'Retired technical or ambiguous fact returned: '+id);
 const firsts=new Set();
 for(let seed=0;seed<400;seed++){
  const deck=figureDeck(FIGURE_QUESTIONS,random(seed));
  assert.equal(new Set(deck).size,1001);
  const opening=deck.slice(0,30).map(id=>FIGURE_BY_ID.get(id));
  assert.equal(new Set(opening.slice(0,7).map(q=>q.category)).size,7);
  for(let i=0;i<20;i++){
   const recent=opening.slice(Math.max(0,i-10),i),q=opening[i];
   assert.ok(!recent.some(p=>p.topic===q.topic),'Topic cluster '+q.id+' seed '+seed);
   const six=opening.slice(i,i+6);
   assert.ok(six.filter(p=>p.kind==='calendar').length<=2,'Calendar cluster');
   assert.ok(six.filter(p=>p.warmup).length<=1,'Warmup cluster');
   assert.equal(new Set(six.filter(p=>p.form).map(p=>p.form)).size,six.filter(p=>p.form).length,'Repeated question form');
  }
  firsts.add(deck[0]);
 }
 assert.ok(firsts.size>280,'New rooms are biased toward a small prefix');
});

test('fresh matches transmit only their selected rounds and keep calendar scoring private until reveal',()=>{
 const players=Array.from({length:3},(_,i)=>({id:'p'+i,name:'Counsel '+i,ready:true,online:true,connected:true}));
 const s=createCourtGame('figure',players),secret={};startCourtGame(s,1000,random(20));
 assert.equal(s.questionIds.length,6);
 const q=FIGURE_QUESTIONS.find(q=>q.kind==='calendar');s.questionIds[0]=q.id;
 tickCourtGame(s,secret,s.deadline);
 assert.deepEqual(Object.keys(s.question).sort(),['category','id','prompt','unit']);
 assert.ok(!JSON.stringify(s).includes('scoringSpan'));
 for(const [i,p] of players.entries())actCourtGame(s,secret,p.id,'estimate',{text:String(q.answer+i*20),round:s.round,matchId:s.matchId},s.stageAt+100);
 tickCourtGame(s,secret,s.stageAt+200);
 assert.equal(s.roundResult.scoringSpan,50);assert.equal(s.roundResult.answer,q.answer);
 assert.equal(s.roundResult.rows.find(r=>r.id==='p1').accuracy,accuracyScore(q.answer+20,q.answer,1,50));
 assert.ok(s.roundResult.rows.find(r=>r.id==='p1').accuracy<500);
});

test('calendar displays retain the typed number and the comparison ruler uses a useful year span',()=>{
 assert.equal(figureNumber(1989,'year'),'1989');assert.equal(figureNumber(1989.5,'year'),'1989.5');
 assert.equal(figureNumber(5000,'cameras'),'5,000');
 const ruler=rulerPositions([{guess:1984},{guess:1994}],1989,50);
 assert.ok(ruler.at(1994)-ruler.at(1984)>10);
 assert.equal(ruler.at(1989),50);
});
