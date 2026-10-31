import test from 'node:test';
import assert from 'node:assert/strict';
import {Window} from 'happy-dom';
import {PartyFocus,absenceDue,TAB_GRACE_MS} from '../party-focus.js';
import {newParty,startParty,sentenceTabSwitch} from '../engine.js';
import {enforceTabFocus,beginParty,stepParty} from '../party-rules.js';
import {PartySession} from '../party.js';
const fixture=(count=3)=>{const s=newParty(Array.from({length:count},(_,i)=>({id:'p'+i,name:'Counsel '+i,ready:true})),()=>0);beginParty(s,1000,()=>0);stepParty(s,4000);s.deadline=40000;return s;};
test('one absence removes exactly one heart, only once, and preserves the player connection',()=>{
 const s=fixture();s.focusReports={p0:{game:s.matchId,leftAt:4500,returnedAt:0}};
 assert.equal(enforceTabFocus(s,5999),false);assert.equal(enforceTabFocus(s,6000),true);
 assert.equal(s.players[0].hearts,1);assert.equal(s.players[0].connected,true);assert.equal(s.players[0].heartsLost,1);assert.equal(s.phase,'burst');assert.equal(s.executions.length,1);assert.match(s.notice,/Counsel 0 tried to cheat/);
 assert.equal(enforceTabFocus(s,9000),false);assert.equal(s.players[0].hearts,1);assert.equal(s.turn,1);
});
test('return timestamps preserve short grace and long absences even after a suspended host resumes',()=>{
 const s=fixture(),r={game:s.matchId,leftAt:4500,returnedAt:5000};assert.equal(absenceDue(s,'p0',r,20000),false);
 r.returnedAt=6500;assert.equal(absenceDue(s,'p0',r,20000),true);
 for(const patch of [{game:'old'},{leftAt:0},{leftAt:21000},{returnedAt:4400}])assert.equal(absenceDue(s,'p0',{...r,...patch},20000),false);
});
test('a last-heart hit eliminates normally, ends a duel, and gives no fake clutch bonus',()=>{
 const s=fixture(2);s.players[0].hearts=1;s.finalDuel={ids:['p0','p1']};s.clutchFinish={ids:['p0','p1']};assert.equal(sentenceTabSwitch(s,'p0',6000,4500),true);
 assert.equal(s.phase,'ended');assert.equal(s.winner,'p1');assert.equal(s.players[0].forfeit,false);assert.equal(s.players[0].hearts,0);assert.deepEqual(s.eliminations,['p0']);assert.equal(s.clutchFinish,undefined);
});
test('off-turn penalties keep the current player and a second distinct absence can cost another heart',()=>{
 const s=fixture();assert.equal(sentenceTabSwitch(s,'p2',6000,4500),true);assert.equal(s.turn,0);assert.equal(s.players[2].hearts,1);
 stepParty(s,8800);assert.equal(s.phase,'playing');assert.equal(sentenceTabSwitch(s,'p2',11000,9000),true);assert.equal(s.players[2].hearts,0);assert.equal(s.executions.length,2);
});
test('simultaneous last-heart absences do not gift the last processed player a win',()=>{
 const s=fixture(2);s.players.forEach(p=>p.hearts=1);s.focusReports=Object.fromEntries(s.players.map(p=>[p.id,{game:s.matchId,leftAt:4500,returnedAt:0}]));
 assert.equal(enforceTabFocus(s,6000),true);assert.equal(s.winner,null);assert.ok(s.players.every(p=>p.hearts===0));assert.equal(s.executions.length,2);
});
test('lobby, countdown, ended, spectators and already eliminated players are exempt; rematches clear reports',()=>{
 for(const phase of ['lobby','countdown','ended']){const s=fixture();s.phase=phase;assert.equal(sentenceTabSwitch(s,'p0',6000),false);}
 for(const patch of [{hearts:0},{spectator:true},{connected:false}]){const s=fixture();Object.assign(s.players[0],patch);assert.equal(sentenceTabSwitch(s,'p0',6000),false);}
 const s=fixture();s.focusReports={p0:{game:s.matchId,leftAt:4500,returnedAt:0}};enforceTabFocus(s,6000);s.phase='ended';beginParty(s,9000,()=>0);assert.equal(s.focusReports,undefined);assert.equal(s.focusPenalties,undefined);assert.equal(s.executions,undefined);
});
test('visibility tracker reports real hides, not blur, ignores spectators, and cleans up on leaving',()=>{
 const w=new Window(),d=w.document,reports=[];let game=null,now=10;
 Object.defineProperty(d,'visibilityState',{value:'visible',configurable:true});
 const f=new PartyFocus({document:d,eligible:()=>game,clock:()=>now,report:r=>reports.push(r)});
 w.dispatchEvent(new w.Event('blur'));f.sync();assert.equal(reports.length,0);
 game='game';f.sync();Object.defineProperty(d,'visibilityState',{value:'hidden',configurable:true});d.dispatchEvent(new w.Event('visibilitychange'));f.sync();assert.deepEqual(reports,[{game:'game',hidden:true,leftAt:10}]);
 now=50;Object.defineProperty(d,'visibilityState',{value:'visible',configurable:true});d.dispatchEvent(new w.Event('visibilitychange'));assert.deepEqual(reports[1],{game:'game',hidden:false,leftAt:10});
 f.destroy();Object.defineProperty(d,'visibilityState',{value:'hidden',configurable:true});d.dispatchEvent(new w.Event('visibilitychange'));assert.equal(reports.length,2);
});
test('self-owned reports never target another player and stale games cannot take hearts',()=>{
 const session=new PartySession(()=>{},()=>{});clearInterval(session.timer);session.state=fixture();session.clock=()=>7000;
 const game=session.state.matchId;session.receiveFocusReport('p0',{game,hidden:true,leftAt:4500,target:'p1'},4600);
 assert.equal(session.state.players[0].hearts,1);assert.equal(session.state.players[1].hearts,2);
 session.receiveFocusReport('p1',{game:'old',hidden:true,leftAt:4500},4600);assert.equal(session.state.players[1].hearts,2);
 // A host that missed the hide still gets the full absence from the return.
 session.receiveFocusReport('p2',{game,hidden:false,leftAt:4500},6500);assert.equal(session.state.players[2].hearts,1);session.focus.destroy();
});
