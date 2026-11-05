import test from 'node:test';
import assert from 'node:assert/strict';
import {createCourtGame,startCourtGame,tickCourtGame,actCourtGame} from '../court-games-engine.js';
import {FIGURE_BY_ID} from '../court-games-data.js';
import {courtAppearance,courtSettings,validCourtSettings} from '../court-games-settings.js';
import {readPlayerPreferences,savePlayerPreferences} from '../player-preferences.js';
import {random} from '../question-selection.js';
const players=()=>Array.from({length:4},(_,i)=>({id:'p'+i,name:'Counsel '+i,ready:true,online:true,connected:true}));
function game(settings={}){const s=createCourtGame('figure',players()),secret={estimates:{},fast:{}};Object.assign(s.settings,settings);startCourtGame(s,1000,random(92));tickCourtGame(s,secret,s.deadline);return {s,secret};}
function sealAll(s,secret,ratios=[1,1.3,.7,1.8]){const target=FIGURE_BY_ID.get(s.question.id).answer;for(const [i,p]of s.players.entries())actCourtGame(s,secret,p.id,'estimate',{text:String(target*ratios[i]),round:s.round,matchId:s.matchId},s.stageAt+1000);tickCourtGame(s,secret,s.stageAt+1100);}
test('ten-dive custom expeditions honor shared timing, balance subjects and finish exactly at the selected length',()=>{
 const {s,secret}=game({rounds:10,seconds:45});assert.equal(s.deadline-s.stageAt,45000);const counts={};for(const id of s.questionIds.slice(0,10)){const category=FIGURE_BY_ID.get(id).category;counts[category]=(counts[category]??0)+1;}assert.equal(new Set(s.questionIds.slice(0,10)).size,10);assert.ok(Math.max(...Object.values(counts))-Math.min(...Object.values(counts))<=1);assert.ok(Object.keys(counts).length>=6);
 for(let round=1;round<=10;round++){assert.equal(s.round,round);assert.equal(s.stage,'estimate');assert.equal(s.deadline-s.stageAt,45000);sealAll(s,secret);assert.equal(s.stage,'reveal');tickCourtGame(s,secret,s.deadline);}
 assert.equal(s.stage,'finish');assert.equal(s.history.length,10);assert.equal(s.result.scores[0].score,12000);
});
test('reveal has authoritative before/after totals and ranking, including equal-error ties',()=>{
 const {s,secret}=game();s.players[0].score=500;s.players[1].score=1000;s.players[2].score=400;s.players[3].score=0;sealAll(s,secret,[.9,1.6,1.1,2]);const rows=s.roundResult.rows,a=rows.find(r=>r.id==='p0'),b=rows.find(r=>r.id==='p2');assert.equal(a.closest,true);assert.equal(b.closest,true);assert.equal(a.bonus,200);assert.equal(a.points,b.points);assert.equal(a.before,500);assert.equal(a.total,500+a.points);assert.equal(a.rankBefore,2);assert.equal(a.rankAfter,1);assert.deepEqual(s.roundResult.leaders,['p0']);
});
test('ready votes cannot bypass the reveal, cross rounds, or replace a sealed estimate',()=>{
 const {s,secret}=game();sealAll(s,secret);const at=s.stageAt,payload={round:s.round,matchId:s.matchId};assert.throws(()=>actCourtGame(s,secret,'p0','next',payload,at+4999),/reveal finish/);assert.throws(()=>actCourtGame(s,secret,'p0','next',{...payload,round:0},at+6000),/earlier/);
 for(const p of s.players.slice(0,3))actCourtGame(s,secret,p.id,'next',payload,at+6000);assert.equal(tickCourtGame(s,secret,at+6100),false,'one player can keep reading');actCourtGame(s,secret,'p3','next',payload,at+6200);assert.equal(tickCourtGame(s,secret,at+6300),true);assert.equal(s.stage,'estimate');assert.equal(s.round,2);assert.deepEqual(s.advanceReady,{});assert.throws(()=>actCourtGame(s,secret,'p0','next',payload,at+6400),/evidence reveal/);
});
test('match settings reject unsupported rules and cosmetic presets never accept arbitrary URLs or markup',()=>{
 assert.deepEqual(courtSettings('figure'),{rounds:6,seconds:30});assert.deepEqual(validCourtSettings('figure',{rounds:8,seconds:20}),{rounds:8,seconds:20});for(const value of [{rounds:500},{seconds:0},{scoreMultiplier:999},null,[]])assert.throws(()=>validCourtSettings('figure',value));assert.deepEqual(courtAppearance({palette:'<script>',seal:'https://example.com',title:'pres'}),{palette:'tide',seal:'scales',title:'none'});
});
test('saved mode settings and appearance stay scoped to the Google identity and survive ordinary name changes',()=>{
 const map=new Map(),storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)},a={id:'one'},b={id:'two'};const saved=savePlayerPreferences(storage,a,{name:'Gavin',buddy:'angler',publicRoom:false,courtAppearance:{palette:'brass',seal:'quill',title:'archivist'},courtSettings:{figure:{rounds:10,seconds:45},clash:{venue:'moon'}}});assert.deepEqual(readPlayerPreferences(storage,a).courtAppearance,saved.courtAppearance);assert.deepEqual(readPlayerPreferences(storage,a).courtSettings,saved.courtSettings);assert.deepEqual(readPlayerPreferences(storage,b).courtAppearance,courtAppearance());savePlayerPreferences(storage,a,{...saved,name:'Nori'});assert.equal(readPlayerPreferences(storage,a).courtAppearance.seal,'quill');assert.equal(readPlayerPreferences(storage,a).courtSettings.figure.rounds,10);
});
