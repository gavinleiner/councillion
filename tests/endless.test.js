import test from 'node:test';
import assert from 'node:assert/strict';
import {CASE_QUESTIONS,CASE_SOURCES} from '../case-questions.js';
import {newEndless,answerEndless,continueEndless,restoreEndless} from '../endless-engine.js';
function seeded(seed=71){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
test('all 16 case reviews have close-reading and Gavin questions with four distinct choices',()=>{
 assert.equal(CASE_SOURCES.length,16);assert.equal(CASE_QUESTIONS.length,80);assert.equal(new Set(CASE_QUESTIONS.map(q=>q.id)).size,80);
 for(let i=0;i<16;i++){const rows=CASE_QUESTIONS.filter(q=>q.caseIndex===i);assert.equal(rows.length,5);assert.ok(rows.some(q=>q.category==='GAVIN’S TAKE'));}
 for(const q of CASE_QUESTIONS){assert.equal(new Set([q.answer,...q.distractors]).size,4);assert.equal(q.distractors.length,3);assert.ok(q.source.startsWith('https://futurecounsel.org/case/'));assert.ok(q.explanation.length>40);}
});
test('only five consecutive correct answers clear a challenge; a miss resets the streak',()=>{
 const rng=seeded(),s=newEndless(CASE_QUESTIONS,rng);for(let i=0;i<3;i++){answerEndless(s,s.current.answer);assert.equal(s.phase,'feedback');continueEndless(s,CASE_QUESTIONS,rng);}assert.equal(s.streak,3);
 answerEndless(s,(s.current.answer+1)%4);assert.equal(s.streak,0);assert.equal(s.wins,0);continueEndless(s,CASE_QUESTIONS,rng);
 for(let i=0;i<5;i++){answerEndless(s,s.current.answer);if(i<4){assert.notEqual(s.phase,'won');continueEndless(s,CASE_QUESTIONS,rng);}}
 assert.equal(s.phase,'won');assert.equal(s.wins,1);assert.equal(s.streak,5);continueEndless(s,CASE_QUESTIONS,rng);assert.equal(s.phase,'question');assert.equal(s.streak,0);assert.equal(s.wins,1);
});
test('the requested five-choice shortcut wins even when normal answers are wrong',()=>{
 const rng=seeded(25),s=newEndless(CASE_QUESTIONS,rng);for(const [i,choice] of [0,1,2,3,0].entries()){answerEndless(s,choice);if(i<4)continueEndless(s,CASE_QUESTIONS,rng);}assert.equal(s.phase,'won');assert.equal(s.feedback.shortcut,true);assert.equal(s.wins,1);
});
test('the genuine answer key never contains the shortcut over 10,000 shuffled questions',()=>{
 const rng=seeded(617),s=newEndless(CASE_QUESTIONS,rng),tail=[];for(let i=0;i<10000;i++){tail.push(s.current.answer);if(tail.length>5)tail.shift();assert.notDeepEqual(tail,[0,1,2,3,0]);answerEndless(s,s.current.answer);continueEndless(s,CASE_QUESTIONS,rng);}
});
test('a complete shuffled cycle has no repeats; recycling remains unlimited',()=>{
 const rng=seeded(30),s=newEndless(CASE_QUESTIONS,rng);for(let cycle=0;cycle<3;cycle++){const seen=new Set();for(let i=0;i<80;i++){assert.ok(!seen.has(s.current.id));seen.add(s.current.id);answerEndless(s,s.current.answer);continueEndless(s,CASE_QUESTIONS,rng);}assert.equal(seen.size,80);}assert.equal(s.answered,240);
});
test('repeat clicks and out-of-range choices cannot score extra answers',()=>{
 const s=newEndless(CASE_QUESTIONS,seeded());answerEndless(s,4);answerEndless(s,-1);answerEndless(s,1.5);assert.equal(s.answered,0);answerEndless(s,s.current.answer);answerEndless(s,s.current.answer);assert.equal(s.answered,1);
});
test('saved questions keep their option order and streak; obsolete state starts cleanly',()=>{
 const rng=seeded(),s=newEndless(CASE_QUESTIONS,rng);answerEndless(s,s.current.answer);continueEndless(s,CASE_QUESTIONS,rng);const restored=restoreEndless(JSON.parse(JSON.stringify(s)),CASE_QUESTIONS,rng);assert.deepEqual(restored.current,s.current);assert.equal(restored.streak,1);assert.equal(restoreEndless({version:0},CASE_QUESTIONS,rng).streak,0);
});
