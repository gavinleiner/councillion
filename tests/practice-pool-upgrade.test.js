import test from 'node:test';
import assert from 'node:assert/strict';
import {MIXED_PACKS} from '../data.js';
import {reshufflePracticeQueue,practiceDraw,random} from '../engine.js';
import {uniformQuestionDeck,QUESTION_SELECTION_BUILD} from '../question-selection.js';
const all=MIXED_PACKS.map(p=>p.id);

test('legacy practice queues are replaced by a fresh full shuffle, including previously played prompts',()=>{
 const pending=['group-q001','group-q002','group-song-word-sun'];
 const upgraded=reshufflePracticeQueue(pending,random(21),'20261025-reviewed-standard-v1');
 assert.deepEqual(upgraded,uniformQuestionDeck(MIXED_PACKS,{rng:random(21)}));
 assert.ok(upgraded.includes('group-q003'));assert.ok(!upgraded.includes('group-song-word-sun'));
 assert.deepEqual(new Set(upgraded),new Set(all));
});
test('neither a saved pool snapshot nor an algorithm version personalizes a new game',()=>{
 const oldPool=all.slice(0,100),pending=all.slice(50,70);
 const old=reshufflePracticeQueue(pending,random(42),'old',oldPool);
 const fresh=reshufflePracticeQueue([],random(42),QUESTION_SELECTION_BUILD,all);
 assert.deepEqual(old,fresh);assert.deepEqual(new Set(old),new Set(all));
});
test('featured practice starts at the selected admitted question without retaining future history',()=>{
 const draw=practiceDraw(all,'group-q001',random(8));assert.equal(draw.ids[0],'group-q001');
 assert.equal(draw.ids.length,7);assert.equal(new Set(draw.ids).size,7);assert.deepEqual(draw.remaining,[]);
 const stored=JSON.parse(JSON.stringify({pending:draw.remaining,pool:all}));
 assert.deepEqual(practiceDraw(stored.pending,null,random(8)),practiceDraw(all,null,random(8)));
});
test('fresh accounts and returning accounts get the same random sampling policy',()=>{
 assert.deepEqual(reshufflePracticeQueue([],random(12),null,null),reshufflePracticeQueue(all,random(12),'old',all));
 const draw=practiceDraw([],null,random(12));assert.equal(new Set(draw.ids).size,7);assert.deepEqual(draw.remaining,[]);
});
