import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import * as sdk from 'firebase/database';
import {readFile} from 'node:fs/promises';
import {newTournament,prepareTournament,beginTournamentMatch,recordTournamentMatch,tournamentReceipt} from '../tournament.js';
const env=await initializeTestEnvironment({projectId:'demo-councillion',database:{host:'127.0.0.1',port:9000,rules:await readFile(new URL('../database.rules.json',import.meta.url),'utf8')}});
try{
 const db=env.authenticatedContext('host',{firebase:{sign_in_provider:'google.com'}}).database();
 for(let n=2;n<=6;n++){
  const ids=Array.from({length:n},(_,i)=>'seat'+i),people=ids.map((id,i)=>({id,name:'Counsel '+i,buddy:'krill',connected:true,ready:true})),t=newTournament(Date.now(),'seats-'+n),room='SEAT'+n,matches={};
  for(let round=1;round<=5;round++){
   const game='seats-'+n+'-game-'+round,prepared=prepareTournament(t,people);beginTournamentMatch(t,game,prepared);
   const match={game,at:Date.now(),tournament:t.id,tournamentKind:'regular',tournamentRound:round,room,rated:true,counted:true,winner:ids[0],players:Object.fromEntries(ids.map((id,i)=>[id,{mode:'ranked',playersCount:n,place:i+1,delta:i===0?40:-18}]))};
   recordTournamentMatch(t,match);matches[game]=match;
  }
  const result=tournamentReceipt(t,room,'host');
  await env.withSecurityRulesDisabled(async ctx=>{const admin=ctx.database();await sdk.set(sdk.ref(admin,'rooms/'+room),{meta:{host:'host'},state:{tournament:t}});for(const [game,row]of Object.entries(matches))await sdk.set(sdk.ref(admin,'matchResults/'+game),row);});
  const ref=sdk.ref(db,'tournamentResults/'+t.id),bad=structuredClone(result);bad.players[ids[n-1]].points++;
  await assertFails(sdk.set(ref,bad));await assertSucceeds(sdk.set(ref,result));
  await assertSucceeds(sdk.set(sdk.ref(db,`playerTournaments/${ids[0]}/${t.id}`),result.players[ids[0]]));
 }
 console.log('Tournament receipt shapes passed for every supported size: 2, 3, 4, 5 and 6; wrong totals rejected.');
}finally{await env.cleanup();}
