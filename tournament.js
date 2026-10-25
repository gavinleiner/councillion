export const TOURNAMENT_BUILD='tournament-1';
export const TOURNAMENT_ROUNDS=5;
export const list=value=>Array.isArray(value)?value:Object.values(value??{});
export const tournamentPoints=count=>Array.from({length:count},(_,i)=>i===0?count:count-i-1);
export function newTournament(now=Date.now(),id=crypto.randomUUID()){
 return {version:1,id,stage:'lobby',rounds:TOURNAMENT_ROUNDS,createdAt:now,roster:[],entrants:{},games:[],previous:[],revision:0};
}
export function tournamentStandings(t){
 const rows=list(t.roster).map((id,i)=>({id,index:i,name:t.entrants?.[id]?.name??'Counsel',buddy:t.entrants?.[id]?.buddy??'krill',points:0,wins:0,finishes:[]})),byId=new Map(rows.map(r=>[r.id,r]));
 for(const game of list(t.games))if(game.kind==='regular')for(const [id,p] of Object.entries(game.players??{})){
  const row=byId.get(id);if(!row)continue;row.points+=p.points;row.wins+=Number(p.place===1);row.finishes.push({game:game.id,place:p.place,points:p.points,delta:p.delta});
 }
 const decider=list(t.games).find(g=>g.kind==='decider');
 return rows.sort((a,b)=>b.points-a.points||b.wins-a.wins||(decider?(decider.players?.[a.id]?.place??99)-(decider.players?.[b.id]?.place??99):0)||a.index-b.index).map((r,i)=>({...r,place:i+1}));
}
export function tournamentContenders(t){const rows=tournamentStandings(t),first=rows[0];return rows.filter(r=>r.points===first?.points&&r.wins===first?.wins).map(r=>r.id);}
export const regularGames=t=>list(t.games).filter(g=>g.kind==='regular');
export function tournamentPlayers(t,players){
 const ids=t.stage==='lobby'?null:new Set(t.stage==='tiebreak'?list(t.contenders):list(t.roster));
 return players.filter(p=>p.connected&&p.ready&&(!ids||ids.has(p.id)));
}
export function prepareTournament(t,players){
 if(!['lobby','standings','tiebreak'].includes(t.stage))throw Error('This tournament is not ready for another game.');
 if(t.stage==='lobby'){
  const ready=players.filter(p=>p.connected&&p.ready);if(ready.length<2||ready.length>6)throw Error('A tournament needs two to six ready players.');
  t.roster=ready.map(p=>p.id);t.entrants=Object.fromEntries(ready.map(p=>[p.id,{name:p.name,buddy:p.buddy??'krill'}]));t.size=ready.length;
 }
 const expected=t.stage==='tiebreak'?list(t.contenders):list(t.roster),ready=tournamentPlayers(t,players);
 if(ready.length!==expected.length||!expected.every(id=>ready.some(p=>p.id===id)))throw Error('Every tournament player must reconnect and ready up before the next game.');
 return {ids:expected,kind:t.stage==='tiebreak'?'decider':'regular',round:t.stage==='tiebreak'?6:regularGames(t).length+1};
}
export function beginTournamentMatch(t,matchId,prepared){t.active={game:matchId,...prepared};t.stage='playing';t.lastReason='';t.revision++;}
export function recordTournamentMatch(t,result){
 if(t.stage!=='playing'||t.active?.game!==result.game||list(t.games).some(g=>g.id===result.game))return false;
 const active=t.active,ids=list(active.ids);
 if(!result.counted||!result.rated){t.lastReason=result.reason||'This game did not qualify. Replay it.';t.stage=active.kind==='decider'?'tiebreak':'standings';delete t.active;t.revision++;return true;}
 if(ids.some(id=>!result.players?.[id])||Object.keys(result.players).length!==ids.length)throw Error('The tournament roster changed.');
 const places=ids.map(id=>result.players[id].place);if(new Set(places).size!==ids.length||places.some(p=>!Number.isInteger(p)||p<1||p>ids.length))throw Error('The game did not produce a complete finishing order.');
 t.previous=tournamentStandings(t).map(r=>({id:r.id,points:r.points,wins:r.wins,place:r.place}));
 const points=tournamentPoints(ids.length),players=Object.fromEntries(ids.map(id=>[id,{place:result.players[id].place,points:active.kind==='regular'?points[result.players[id].place-1]:0,delta:result.players[id].delta}]));
 t.games=[...list(t.games),{id:result.game,at:result.at,kind:active.kind,winner:result.winner,players}];delete t.active;t.lastReason='';t.revision++;
 if(active.kind==='decider'){t.champion=result.winner;t.decider=result.game;t.stage='complete';t.completedAt=result.at;}
 else if(regularGames(t).length<TOURNAMENT_ROUNDS)t.stage='standings';
 else{t.contenders=tournamentContenders(t);if(t.contenders.length>1)t.stage='tiebreak';else{t.champion=t.contenders[0];t.stage='complete';t.completedAt=result.at;}}
 return true;
}
export function cancelTournament(t,reason='The host ended the tournament. Completed match ranks stay saved.'){
 if(!t||['complete','cancelled'].includes(t.stage))return false;t.stage='cancelled';t.cancelReason=reason;delete t.active;t.revision++;return true;
}

// Exact reachability for at most five remaining games. Giving the candidate
// first in every remaining game can only improve their position. We then test
// whether the opponents' remaining placement points can fit below that target.
// Sorted capacities merge symmetric states; this is not a guessed win percent.
export function canStillWin(t,id){
 if(t.stage==='cancelled')return false;if(t.stage==='complete')return t.champion===id;
 const rows=tournamentStandings(t),candidate=rows.find(r=>r.id===id);if(!candidate)return false;
 const remaining=TOURNAMENT_ROUNDS-regularGames(t).length;if(!remaining)return tournamentContenders(t).includes(id);
 const values=tournamentPoints(rows.length).slice(1),target=candidate.points+remaining*rows.length,wins=candidate.wins+remaining;
 const caps=rows.filter(r=>r.id!==id).map(r=>target-r.points-(r.wins>wins?1:0)),memo=new Map(),sum=values.reduce((a,b)=>a+b,0),max=values[0]??0;
 function possible(left,capacity){
  if(capacity.some(c=>c<0))return false;if(!left)return true;
  const a=capacity.map(c=>Math.min(c,max*left)).sort((a,b)=>b-a),key=left+':'+a.join(',');if(memo.has(key))return memo.get(key);
  if(a.reduce((x,y)=>x+y,0)<sum*left){memo.set(key,false);return false;}
  const used=new Set();
  function assign(i){if(i===values.length)return possible(left-1,a);
   const same=new Set();for(let j=0;j<a.length;j++){if(used.has(j)||same.has(a[j])||a[j]<values[i])continue;same.add(a[j]);a[j]-=values[i];used.add(j);const ok=assign(i+1);used.delete(j);a[j]+=values[i];if(ok)return true;}return false;
  }
  const ok=assign(0);memo.set(key,ok);return ok;
 }
 return possible(remaining,caps);
}
export function tournamentReceipt(t,room,submittedBy){
 if(t.stage!=='complete'||regularGames(t).length!==TOURNAMENT_ROUNDS||!t.champion)throw Error('Finish all five tournament games first.');
 const standings=tournamentStandings(t);if(standings[0]?.id!==t.champion)throw Error('The final standings do not match the champion.');
 return {version:1,id:t.id,room,submittedBy,at:t.completedAt,champion:t.champion,playersCount:t.size,rounds:5,decider:t.decider??'',regular:regularGames(t).map(g=>g.id),roster:list(t.roster),entrants:t.entrants,standings:standings.map(r=>r.id),players:Object.fromEntries(standings.map(r=>[r.id,{version:1,tournament:t.id,room,at:t.completedAt,playersCount:t.size,rounds:5,place:r.place,points:r.points,wins:r.wins,champion:r.id===t.champion}]))};
}
