import test from 'node:test';
import assert from 'node:assert/strict';
import {BENCH_QUESTIONS,benchKey} from '../bench-data.js';
import {TRIAL_QUESTIONS,TRIAL_BY_ID,trialDeck,trialOptions} from '../trial-data.js';
import {TRIAL_ORIGINAL_QUESTIONS} from '../trial-question-originals.js';
import {trialSeed} from '../trial-preview.js';
import {createCourtGame,startCourtGame,tickCourtGame,actCourtGame} from '../court-games-engine.js';

test('Trial admits a balanced, independently curated pool with one valid answer per four choices',()=>{
 assert.notEqual(TRIAL_QUESTIONS,BENCH_QUESTIONS);
 assert.ok(TRIAL_QUESTIONS.length>=128);
 assert.equal(new Set(TRIAL_QUESTIONS.map(q=>q.id)).size,TRIAL_QUESTIONS.length);
 assert.equal(new Set(TRIAL_QUESTIONS.map(q=>benchKey(q.prompt))).size,TRIAL_QUESTIONS.length);
 const counts=Object.values(Object.groupBy(TRIAL_QUESTIONS,q=>q.subject)).map(rows=>rows.length);
 assert.equal(counts.length,8);assert.equal(Math.max(...counts),Math.min(...counts));
 for(const q of TRIAL_QUESTIONS){
  assert.ok([3,4].includes(q.difficulty),q.id);
  assert.ok(q.prompt.length<=180&&q.source.startsWith('https://'),q.id);
  assert.equal(q.distractors.length,3,q.id);
  const correct=new Set([q.answer,...q.aliases].map(benchKey));
  assert.ok(q.distractors.every(d=>!correct.has(benchKey(d))),q.id);
  assert.equal(new Set([q.answer,...q.distractors].map(benchKey)).size,4,q.id);
  for(let seed=1;seed<=8;seed++){
   const options=trialOptions(q,trialSeed(seed));
   assert.equal(options.length,4);assert.equal(options.filter(o=>o.text===q.answer).length,1);
   assert.deepEqual(new Set(options.map(o=>o.text)),new Set([q.answer,...q.distractors]));
  }
 }
});

test('every eight draws cover all subjects without repeats or same-subject handoffs',()=>{
 const openings=new Set(),boards=new Set();
 for(let seed=1;seed<=200;seed++){
  const deck=trialDeck(trialSeed(seed));
  assert.deepEqual(deck,trialDeck(trialSeed(seed)));
  assert.equal(new Set(deck).size,TRIAL_QUESTIONS.length);
  openings.add(deck[0]);boards.add(deck.slice(0,8).join('|'));
  for(let i=0;i<deck.length;i+=8)
   assert.equal(new Set(deck.slice(i,i+8).map(id=>TRIAL_BY_ID.get(id).subject)).size,8);
  for(let i=1;i<deck.length;i++)assert.notEqual(TRIAL_BY_ID.get(deck[i]).subject,TRIAL_BY_ID.get(deck[i-1]).subject);
  assert.deepEqual(deck.slice(0,2).map(id=>TRIAL_BY_ID.get(id).difficulty),[3,4]);
 }
 assert.ok(openings.size>=30);assert.equal(boards.size,200);
});

test('the same question can appear in every answer position; no fixed correct-letter tell',()=>{
 for(const q of TRIAL_QUESTIONS){
  const slots=new Set(Array.from({length:80},(_,i)=>trialOptions(q,trialSeed(8993+i)).findIndex(o=>o.text===q.answer)));
  assert.equal(slots.size,4,q.id);
 }
});

test('active legacy rooms retain all old question IDs and canonical answers',()=>{
 for(const q of BENCH_QUESTIONS){assert.equal(TRIAL_BY_ID.get(q.id).answer,q.answer,q.id);}
 assert.ok(!TRIAL_QUESTIONS.some(q=>q.id==='bench-nintendo-neighbors-5')); // Tom Nook was labelled tier 5.
 assert.deepEqual(TRIAL_BY_ID.get('bench-block-party-4').distractors,['Unbreaking','Fortune','Silk Touch']);
});

test('word puzzles have exactly one mechanically verified answer',()=>{
 const anagram=TRIAL_BY_ID.get('trial-v44-schoolmaster-anagram');
 const letters=s=>benchKey(s).split('').sort().join('');
 assert.deepEqual([anagram.answer,...anagram.distractors].filter(s=>letters(s)===letters('SCHOOLMASTER')),[anagram.answer]);
 const doubled=TRIAL_BY_ID.get('trial-v44-double-triple');
 const threePairs=s=>/(.)\1(.)\2(.)\3/.test(s);
 assert.deepEqual([doubled.answer,...doubled.distractors].filter(threePairs),[doubled.answer]);
});

test('new context remains private until the answer is revealed, then survives serialization',()=>{
 assert.equal(TRIAL_ORIGINAL_QUESTIONS.length,32);
 const crew=[0,1].map(i=>({id:'p'+i,name:'Counsel '+i,buddy:'krill',ready:true,online:true,connected:true}));
 const s=createCourtGame('trial',crew),secret={};
 startCourtGame(s,1000,trialSeed(42),secret);
 const q=TRIAL_ORIGINAL_QUESTIONS[0];secret.trial.deck=[q.id];
 tickCourtGame(s,secret,s.deadline);
 assert.equal(s.question.id,q.id);assert.ok(!('explanation' in s.question));assert.ok(!('answer' in s.question));
 for(const p of s.players)actCourtGame(s,secret,p.id,'trial-answer',{matchId:s.matchId,round:s.round,stageAt:s.stageAt,choice:secret.trial.correct},s.stageAt+100);
 tickCourtGame(s,secret,s.deadline);
 assert.equal(s.stage,'trial-answer-reveal');
 assert.equal(s.answerReveal.explanation,q.explanation);
 assert.equal(JSON.parse(JSON.stringify(s)).history[0].explanation,q.explanation);
});
