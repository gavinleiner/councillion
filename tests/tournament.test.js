import test from 'node:test';
import assert from 'node:assert/strict';
import {newTournament,prepareTournament,beginTournamentMatch,recordTournamentMatch,tournamentStandings,tournamentContenders,tournamentReceipt,tournamentPoints,canStillWin,cancelTournament,regularGames} from '../tournament.js';
import {mergeTournamentCareer} from '../tournament-career.js';
import {emptyCareer,appearance,BADGES} from '../party-career.js';
const players=ids=>ids.map(id=>({id,name:id.toUpperCase(),buddy:'krill',connected:true,ready:true}));
function play(t,order,{rated=true,id='game-'+(Object.keys(t.games??{}).length+1)}={}){
 const prepared=prepareTournament(t,players(t.roster.length?t.roster:order));beginTournamentMatch(t,id,prepared);
 const result={game:id,at:10000+Object.keys(t.games??{}).length*10000,rated,counted:true,winner:order[0],reason:rated?'Rated match':'Under 15 seconds',players:Object.fromEntries(order.map((id,i)=>[id,{place:i+1,delta:i===0?40:-18}]))};recordTournamentMatch(t,result);return result;
}
test('five-game scoring rewards every placement, without using or changing Court Rating',()=>{
 assert.deepEqual(tournamentPoints(2),[2,0]);assert.deepEqual(tournamentPoints(6),[6,4,3,2,1,0]);
 const t=newTournament(1000,'series');for(let i=0;i<5;i++)play(t,['a','b','c','d','e','f']);
 assert.equal(t.stage,'complete');assert.equal(t.champion,'a');assert.equal(regularGames(t).length,5);assert.deepEqual(tournamentStandings(t).map(r=>r.points),[30,20,15,10,5,0]);
 const receipt=tournamentReceipt(t,'ROOM','host');assert.equal(receipt.players.a.champion,true);assert.equal(receipt.players.f.place,6);assert.equal(receipt.players.a.points,30);assert.equal(receipt.regular.length,5);assert.equal(receipt.decider,'');
 assert.throws(()=>prepareTournament(t,players(['a','b'])),/not ready/);
});
test('a points tie uses game wins, then a single decider restricted to tied contenders',()=>{
 const wins=newTournament(1000,'wins');for(const order of [['a','b','c'],['a','b','c'],['a','b','c'],['b','c','a'],['b','c','a']])play(wins,order);
 assert.equal(wins.stage,'complete');assert.equal(wins.champion,'a');assert.equal(tournamentStandings(wins)[1].points,9);assert.equal(wins.decider,undefined);
 const t=newTournament(1000,'tie');for(const order of [['a','b','c'],['b','a','c'],['c','a','b'],['a','b','c'],['b','c','a']])play(t,order);
 assert.equal(t.stage,'tiebreak');assert.deepEqual(tournamentContenders(t),['a','b']);assert.equal(canStillWin(t,'c'),false);assert.equal(canStillWin(t,'b'),true);
 const prepared=prepareTournament(t,players(['a','b','c','spectator']));assert.deepEqual(prepared.ids,['a','b']);assert.equal(prepared.kind,'decider');assert.equal(prepared.round,6);
 play(t,['b','a']);assert.equal(t.stage,'complete');assert.equal(t.champion,'b');assert.equal(tournamentStandings(t)[0].points,8);assert.equal(tournamentReceipt(t,'ROOM','a').decider,'game-6');
});
test('readiness/reconnection and fixed roster are required; spectator seats cannot join midway',()=>{
 const t=newTournament();play(t,['a','b','c']);const p=players(['a','b','c','spectator']);p[1].ready=false;assert.throws(()=>prepareTournament(t,p),/Every tournament player/);p[1].ready=true;p[1].connected=false;assert.throws(()=>prepareTournament(t,p),/reconnect/);p[1].connected=true;assert.deepEqual(prepareTournament(t,p).ids,['a','b','c']);
});
test('invalid games replay, persisted Firebase object arrays restore, and duplicate receipts never count twice',()=>{
 const t=newTournament(1000,'restart');const first=play(t,['a','b'],{rated:false});assert.equal(t.stage,'standings');assert.equal(regularGames(t).length,0);assert.ok(t.lastReason);
 const result=play(t,['a','b'],{id:'valid'});assert.equal(recordTournamentMatch(t,result),false);assert.equal(tournamentStandings(t)[0].points,2);
 const restored=JSON.parse(JSON.stringify(t));restored.roster={0:'a',1:'b'};restored.games=Object.fromEntries(restored.games.map((g,i)=>[i,g]));restored.previous=Object.fromEntries(restored.previous.map((g,i)=>[i,g]));assert.deepEqual(tournamentStandings(restored),tournamentStandings(t));
 assert.equal(cancelTournament(restored),true);assert.equal(canStillWin(restored,'a'),false);assert.throws(()=>tournamentReceipt(restored,'ROOM','a'),/Finish all five/);assert.equal(first.rated,false);
});
const permutations=a=>a.length?a.flatMap((x,i)=>permutations(a.filter((_,j)=>j!==i)).map(rest=>[x,...rest])):[[]];
test('who can still win agrees with exhaustive future finishing orders, including tiebreak eligibility',()=>{
 const orders=permutations(['a','b','c']);
 for(let seed=0;seed<18;seed++){
  const t=newTournament(1000,'math'+seed);for(let i=0;i<3;i++)play(t,orders[(seed+i*3)%orders.length]);
  const possible=new Set();
  for(const a of orders)for(const b of orders){const future=structuredClone(t);play(future,a);play(future,b);for(const id of future.stage==='complete'?[future.champion]:tournamentContenders(future))possible.add(id);}
  for(const id of ['a','b','c'])assert.equal(canStillWin(t,id),possible.has(id),'seed '+seed+' '+id);
 }
 const duel=newTournament();for(let i=0;i<3;i++)play(duel,['a','b']);assert.equal(canStillWin(duel,'b'),false);assert.equal(canStillWin(duel,'a'),true);
});
test('permanent tournament records derive trophies and an optional single champion title without changing rank',()=>{
 const t=newTournament(1000,'trophy');for(let i=0;i<5;i++)play(t,['a','b']);const receipt=tournamentReceipt(t,'ROOM','a'),base={...emptyCareer(),rating:321,wins:4};
 const career=mergeTournamentCareer(base,{one:receipt.players.a,duplicate:receipt.players.a,invalid:{version:1,rounds:4}});assert.equal(career.tournamentWins,1);assert.equal(career.tournamentsFinished,1);assert.equal(career.rating,321);assert.equal(career.wins,4);
 assert.equal(BADGES.find(b=>b.id==='tournament-champion').test(career),true);assert.deepEqual(appearance({badges:['tournament-champion']},career).badges,['tournament-champion']);assert.deepEqual(appearance({badges:[]},career).badges,[]);assert.deepEqual(appearance({badges:['tournament-champion']},base).badges,[]);
});
