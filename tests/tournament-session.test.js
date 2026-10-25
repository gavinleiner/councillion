import test from 'node:test';
import assert from 'node:assert/strict';
import {PartySession} from '../party.js';
import {newTournament} from '../tournament.js';
test('opening the next tournament readies its host and resets the series without losing seen questions',async()=>{
 const writes=[],session=new PartySession(()=>{},()=>{});clearInterval(session.timer);
 session.host=true;session.myId='a';session.code='TEST';session.members={a:{online:true,ready:false},b:{online:true,ready:false}};
 session.c={db:{},ref:(_,path)=>path,update:async(path,value)=>writes.push([path,value]),set:async()=>{},runTransaction:async()=>{}};
 session.finishResult=async()=>{};session.broadcast=async()=>{};
 const t={...newTournament(1,'old-series'),stage:'complete',resultSaved:true};
 session.state={phase:'ended',tournament:t,settings:{lives:2},seenIds:['already-seen'],matchId:'old-match',resultSaved:true,result:{},winner:'a',players:[{id:'a',ready:false,spectator:true,hearts:0},{id:'b',ready:false,hearts:0}]};
 await session.process('a',{id:'new',type:'tournament-new',at:Date.now()});
 assert.equal(session.state.phase,'lobby');assert.notEqual(session.state.tournament.id,'old-series');assert.equal(session.state.tournament.stage,'lobby');assert.deepEqual(session.state.seenIds,['already-seen']);assert.equal(session.state.matchId,undefined);assert.equal(session.state.players[0].ready,true);assert.equal(session.state.players[0].spectator,false);assert.equal(session.state.players[1].ready,false);assert.deepEqual(writes,[['rooms/TEST/members/a',{ready:true}]]);
});
