import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import * as sdk from 'firebase/database';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {PartySession} from '../party.js';
import {partyPack} from '../engine.js';
import {list,regularGames} from '../tournament.js';
import {fetchTournamentResult} from '../tournament-career.js';
import {PartyProfileStore} from '../party-profile.js';
const env=await initializeTestEnvironment({projectId:'demo-councillion',database:{host:'127.0.0.1',port:9000,rules:await readFile(new URL('../database.rules.json',import.meta.url),'utf8')}});
const sessions=[],errors={},clients=new Map();
const wait=async(fn,label,timeout=40000)=>{const end=Date.now()+timeout;while(Date.now()<end){if(await fn())return;await new Promise(r=>setTimeout(r,25));}throw Error(label+' · '+JSON.stringify(errors));};
function client(uid){const c={...sdk,db:env.authenticatedContext(uid,{firebase:{sign_in_provider:'google.com'}}).database()};errors[uid]??=[];const s=new PartySession(()=>{},m=>errors[uid].push(m),()=>({id:uid,expires:Date.now()/1000+3600}),async()=>({uid}),async()=>c);sessions.push(s);clients.set(uid,s);return s;}
let host;
async function readyAndStart(ids){
 await Promise.all(ids.map(id=>clients.get(id).ready(true)));
 await wait(()=>ids.every(id=>host.state.players.find(p=>p.id===id)?.ready),'ready roster');host.start();await wait(()=>host.state.phase==='playing','game countdown');console.log('Started',host.state.tournament.active.round,host.myId,host.state.matchId);
}
async function finishInOrder(order){
 const game=host.state.matchId;const bank=partyPack(host.state),first=host.state.players[host.state.turn].id;
 clients.get(first).submit(bank.answers[0].label);await wait(()=>host.state.players[host.state.turn].id!==first,'first valid answer');
 const second=host.state.players[host.state.turn].id;clients.get(second).submit(bank.answers[1].label);await wait(()=>host.state.players.find(p=>p.id===second).answers>=1,'second valid answer');
 await host.processing;await new Promise(r=>setTimeout(r,200));clearInterval(host.timer);host.state.matchStartedAt=Date.now()-21000;host.state.eliminations=[...order.slice(2)].reverse();
 for(const p of host.state.players){if(!order.includes(p.id))continue;p.hearts=p.id===order[0]?2:p.id===order[1]?1:0;if(p.id===order[0]||p.id===order[1])delete p.eliminationOrder;else p.eliminationOrder=order.length-order.indexOf(p.id)-1;}
 host.state.turn=host.state.players.findIndex(p=>p.id===order[1]);host.state.deadline=Date.now()-10;await host.broadcast();await new Promise(r=>setTimeout(r,200));host.timer=setInterval(()=>host.tick(),200);
 await wait(()=>host.state.matchId===game&&host.state.phase==='ended'&&host.state.resultSaved&&list(host.state.tournament.games).some(g=>g.id===game),'saved ranked tournament game');console.log('Saved',game,host.state.tournament.stage,regularGames(host.state.tournament).length);
 assert.equal(host.state.result.rated,true);return host.state.matchId;
}
try{
 await env.clearDatabase();host=client('a');const b=client('b'),c=client('c'),watcher=client('watcher');
 await host.create('Gavin',{tournament:true,mode:'ranked',maxPlayers:6,isPrivate:false});await wait(()=>host.connected,'host connected');
 await b.join('Jack',host.code);await c.join('Logan',host.code);await wait(()=>host.state.players.length===3,'three entrants');
 assert.equal(host.meta.format,'tournament');const series=host.state.tournament.id;
 for(const [index,order]of [['a','b','c'],['b','a','c'],['c','a','b'],['a','b','c'],['b','c','a']].entries()){
  await readyAndStart(['a','b','c']);assert.equal(host.state.tournament.active.round,index+1);const active=structuredClone(host.state.tournament.active);
  if(index===0){await watcher.join('Watcher',host.code);await wait(()=>host.state.players.some(p=>p.id==='watcher'),'spectator joined');await watcher.ready(true);assert.ok(errors.watcher.some(m=>m.includes('roster is locked')));}
  await finishInOrder(order);assert.equal(regularGames(host.state.tournament).length,index+1);if(index===0){await host.finalizing;await new Promise(r=>setTimeout(r,200));host.state.tournament.games=[];host.state.tournament.active=active;host.state.tournament.stage='playing';await host.broadcast();await host.finishResult();assert.equal(regularGames(host.state.tournament).length,1,'restores saved round after interrupted series update');}
  if(index===1){
   const code=host.code,old=host;await old.close(false);await env.withSecurityRulesDisabled(ctx=>sdk.update(sdk.ref(ctx.database(),`rooms/${code}/members/a`),{online:false,lastSeen:Date.now()-31000}));
   await wait(()=>b.host||c.host||watcher.host,'tournament host transfer');host=[b,c,watcher].find(s=>s.host);assert.equal(host.state.tournament.id,series);
   const restored=client('a');await restored.join('Gavin',code);await wait(()=>host.state.players.find(p=>p.id==='a')?.connected,'old host reconnects as player');
   assert.equal(restored.state.tournament.id,series);assert.equal(regularGames(restored.state.tournament).length,2);
  }
 }
 assert.equal(host.state.tournament.stage,'tiebreak');assert.deepEqual(list(host.state.tournament.contenders),['a','b']);
 await readyAndStart(['a','b']);assert.deepEqual([...host.state.matchRoster].sort(),['a','b']);await finishInOrder(['b','a']);
 await wait(()=>host.state.tournament.resultSaved,'trophy and histories saved');assert.equal(host.state.tournament.champion,'b');
 const result=(await sdk.get(sdk.ref(host.c.db,'tournamentResults/'+series))).val();assert.equal(result.players.b.points,8);assert.equal(result.players.a.points,8);assert.equal(result.players.b.champion,true);assert.equal(result.players.a.champion,false);assert.equal(Object.keys(result.regular).length,5);assert.ok(result.decider);
 const records=(await sdk.get(sdk.ref(host.c.db,'playerTournaments/b'))).val();assert.equal(Object.keys(records).length,1);assert.equal((await sdk.get(sdk.ref(host.c.db,'tournamentHonors/b/champion'))).val().tournament,series);
 const store=new PartyProfileStore(clients.get('b').c);store.watch('b');await wait(()=>store.get('b').loaded,'profile restored');assert.equal(store.get('b').career.tournamentWins,1);assert.equal(store.get('b').career.tournamentsFinished,1);assert.equal((await store.fetch('a')).career.tournamentWins,0);
 const saved=await fetchTournamentResult(host.c,series);assert.equal(saved.matches.length,6);assert.equal(saved.matches[5].players.b.place,1);
 await store.save('b',{badges:['tournament-champion']});
 await wait(()=>store.get('b').appearance.badges[0]==='tournament-champion','champion title equipped');await store.save('b',{badges:[]});await wait(()=>store.get('b').appearance.badges.length===0,'champion title deselected');
 await assertFails(sdk.set(sdk.ref(clients.get('a').c.db,'playerBanners/a'),{tag:'',accent:'tide',pattern:'currents',stats:['wins','answers','krillions'],badges:['tournament-champion']}));
 await assertFails(sdk.set(sdk.ref(watcher.c.db,'tournamentResults/fake'),{...result,id:'fake'}));
 await assertFails(sdk.remove(sdk.ref(host.c.db,'tournamentResults/'+series)));
 await assertFails(sdk.update(sdk.ref(clients.get('b').c.db,'playerTournaments/b/'+series),{points:999}));
 // Retry after a lost acknowledgement cannot duplicate trophy or career rows.
 host.state.tournament.resultSaved=false;await host.finishTournament();assert.equal(Object.keys((await sdk.get(sdk.ref(host.c.db,'playerTournaments/b'))).val()).length,1);assert.equal(store.get('b').career.tournamentWins,1);
 store.close();
 host.tournamentNew();await wait(()=>host.state.phase==='lobby'&&host.state.tournament.id!==series,'fresh series');assert.equal(host.state.players.find(p=>p.id===host.myId).ready,true,'host can play in the next tournament');assert.equal(regularGames(host.state.tournament).length,0);
 // Fresh validation fixture reuses the trusted shapes, with separate match IDs.
 const fixture=structuredClone(result);fixture.id='validation-series';fixture.room='VALD';fixture.submittedBy=host.myId;
 const matches=structuredClone(saved.matches);fixture.regular=matches.slice(0,5).map((m,i)=>'validation-game-'+i);fixture.decider='validation-decider';
 for(const [uid,row]of Object.entries(fixture.players))Object.assign(row,{tournament:fixture.id,room:fixture.room});
 await env.withSecurityRulesDisabled(async ctx=>{
  const db=ctx.database();await sdk.set(sdk.ref(db,'rooms/VALD'),{meta:{host:host.myId,hostName:'Host',version:3,createdAt:Date.now(),isPrivate:true,seats:6,phase:'ended',format:'tournament'},state:{phase:'ended',players:[],settings:{},round:0,revision:1,tournament:{version:1,id:fixture.id,stage:'complete',rounds:5,createdAt:Date.now(),revision:1,champion:fixture.champion,completedAt:fixture.at}}});
  for(let i=0;i<matches.length;i++){const m=matches[i],game=i===5?fixture.decider:fixture.regular[i];Object.assign(m,{game,room:'VALD',tournament:fixture.id});for(const row of Object.values(m.players))Object.assign(row,{game,room:'VALD'});await sdk.set(sdk.ref(db,'matchResults/'+game),m);}
 });
 const path=sdk.ref(host.c.db,'tournamentResults/'+fixture.id);
 for(const mutate of [r=>r.players.a.points++,r=>r.players.b.wins++,r=>r.regular[4]=r.regular[0],r=>delete r.regular[4],r=>r.decider='',r=>r.players.watcher={...r.players.a}]){const bad=structuredClone(fixture);mutate(bad);await assertFails(sdk.set(path,bad));}
 await assertSucceeds(sdk.set(path,fixture));await assertFails(sdk.set(path,fixture));
 console.log('Tournament network passed: fixed roster, six ranked games including tied finale, host migration, reconnect, spectator lock, exact totals, permanent trophies, optional title, restored profile/history, forgery/reuse rejection and idempotent saving.');
}finally{await Promise.all(sessions.map(s=>s.close()));await env.cleanup();}
