import test from 'node:test';
import assert from 'node:assert/strict';
import {MIXED_PACKS} from '../data.js';
import {LEGACY_REVIEWED_POOL_IDS} from '../practice-pool-history.js';
import {reshufflePracticeQueue,practiceDraw,random} from '../engine.js';
import {QUESTION_SELECTION_BUILD} from '../question-selection.js';
const all=MIXED_PACKS.map(p=>p.id);

test('legacy queues receive genuinely new inventories without resurrecting played legacy questions or retired recipes',()=>{
 assert.equal(LEGACY_REVIEWED_POOL_IDS.length,227);
 const pending=['group-q001','group-q002','group-song-word-sun'];
 const upgraded=reshufflePracticeQueue(pending,random(21),'20261025-reviewed-standard-v1');
 assert.ok(upgraded.includes('group-q001'));assert.ok(upgraded.includes('group-q002'));
 for(const id of ['authored-formula-one-drivers','authored-smash-ultimate-fighters','authored-kitchen-hand-tools'])assert.ok(upgraded.includes(id),id);
 assert.ok(!upgraded.includes('group-q003'),'an already-played legacy question returned');
 assert.ok(!upgraded.includes('group-song-word-sun'),'a retired title-word recipe returned');
 assert.equal(new Set(upgraded).size,upgraded.length);
});

test('a pool change is detected even when the selection-algorithm version stays the same',()=>{
 const additions=['authored-formula-one-drivers','authored-sewing-kit','authored-inflatable-objects'];
 const oldPool=all.filter(id=>!additions.includes(id));
 const pending=['group-q001','group-q002'];
 const upgraded=reshufflePracticeQueue(pending,random(42),QUESTION_SELECTION_BUILD,oldPool);
 assert.deepEqual(new Set(upgraded),new Set([...pending,...additions]));
 assert.ok(!upgraded.includes('authored-dota-heroes'),'a played question already in the previous pool returned');
});

test('saved pool snapshots survive JSON persistence and another update without replaying consumed questions',()=>{
 const oldPool=all.filter(id=>id!=='authored-formula-one-drivers');
 // Keep enough pending items to avoid starting the next Unlimited cycle.
 const pending=oldPool.slice(0,20);
 const upgraded=reshufflePracticeQueue(pending,random(9),'older',oldPool);
 const draw=practiceDraw(upgraded,'authored-formula-one-drivers',random(8));
 const stored=JSON.parse(JSON.stringify({pending:draw.remaining,pool:all}));
 const next=reshufflePracticeQueue(stored.pending,random(10),'newer',stored.pool);
 assert.deepEqual(new Set(next),new Set(stored.pending));
 assert.ok(!next.includes('authored-formula-one-drivers'));
});

test('a fresh account starts a new complete draw rather than treating every question as previously played',()=>{
 assert.deepEqual(reshufflePracticeQueue([],random(12),null,null),[]);
 const draw=practiceDraw([],null,random(12));
 assert.equal(new Set([...draw.ids,...draw.remaining]).size,all.length);
 assert.equal(draw.ids.length,7);
});
