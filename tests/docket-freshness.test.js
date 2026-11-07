import test from 'node:test';
import assert from 'node:assert/strict';
import {DOCKET_CATEGORIES,DOCKET_BY_ID} from '../docket-data.js';
import {drawDocket} from '../docket-deck.js';
import {readDocketHistory,rememberDocketClue} from '../docket-history.js';
import {createCourtGame,startCourtGame,actCourtGame,tickCourtGame} from '../court-games-engine.js';
import {random} from '../question-selection.js';
test('1,000 board clues give every existing category two different answers at each value',()=>{
 assert.equal(DOCKET_CATEGORIES.length,100);assert.equal(DOCKET_BY_ID.size,1024);
 for(const c of DOCKET_CATEGORIES){assert.equal(c.clues.length,10);assert.equal(new Set(c.clues.map(q=>q.answer.toLowerCase())).size,10);for(let tier=0;tier<5;tier++)assert.equal(c.clues.filter(q=>q.tier===tier).length,2);}
});
test('repeating a seeded category draw uses its unused alternatives before repeating clues',()=>{
 for(let seed=1;seed<=100;seed++){const first=drawDocket(DOCKET_CATEGORIES,[],random(seed)),second=drawDocket(DOCKET_CATEGORIES,first.questions,random(seed));assert.equal(second.questions.length,60);assert.equal(second.questions.filter(id=>first.questions.includes(id)).length,0);assert.equal(new Set(second.questions).size,60);}
});
test('Docket history survives a new lobby/browser reader and never affects another game history',()=>{
 const values=new Map([['fc:question-history:v1:friend','["party-question"]']]),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
 rememberDocketClue('friend','block-party-1',storage);rememberDocketClue('friend','block-party-alt-1',storage);rememberDocketClue('friend','block-party-1',storage);
 assert.deepEqual(readDocketHistory('friend',storage),['block-party-alt-1','block-party-1']);assert.equal(values.get('fc:question-history:v1:friend'),'["party-question"]');
});
function read(){const s=createCourtGame('docket',[{id:'a',ready:true,online:true,connected:true},{id:'b',ready:true,online:true,connected:true}]),secret={};startCourtGame(s,1000,random(5),secret);tickCourtGame(s,secret,6000);tickCourtGame(s,secret,11000);const cell=s.cells.find(c=>!secret.docket.doubles.includes(c.id));actCourtGame(s,secret,s.selector,'docket-select',{clueId:cell.id,matchId:s.matchId,round:s.round,stageAt:s.stageAt},12000);return {s,secret};}
test('the blue opening cue is unpredictable, private, and not a public countdown',()=>{
 const times=new Set();for(let n=0;n<30;n++){const {s,secret}=read();assert.equal(s.stage,'docketRead');assert.equal(s.deadline,0);assert.ok(secret.docket.buzzAt>12000);assert.ok(!JSON.stringify(s).includes('buzzAt'));times.add(secret.docket.buzzAt);assert.equal(tickCourtGame(s,secret,secret.docket.buzzAt-1),false);tickCourtGame(s,secret,secret.docket.buzzAt);assert.equal(s.stage,'docketBuzz');const r=actCourtGame(s,secret,'a','docket-buzz',{matchId:s.matchId,round:s.round,stageAt:s.stageAt},s.stageAt+160);assert.equal(r.accepted,true);assert.equal(s.turn,'a');}assert.ok(times.size>10);
});
