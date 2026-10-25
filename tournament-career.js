export function mergeTournamentCareer(career,receipts){
 const seen=new Set(),records=Object.values(receipts??{}).filter(r=>r?.version===1&&r.rounds===5&&r.playersCount>=2&&r.playersCount<=6&&Number.isFinite(r.at)&&typeof r.tournament==='string'&&r.place>=1&&r.place<=r.playersCount&&r.champion===(r.place===1)).sort((a,b)=>b.at-a.at||a.tournament.localeCompare(b.tournament)).filter(r=>{if(seen.has(r.tournament))return false;seen.add(r.tournament);return true;});
 return {...career,tournamentsFinished:records.length,tournamentWins:records.filter(r=>r.champion).length,tournamentRecords:records};
}
export async function saveTournamentResult(c,result){
 const ref=c.ref(c.db,'tournamentResults/'+result.id);let sealed=(await c.get(ref)).val();
 if(!sealed){try{await c.set(ref,result);sealed=result;}catch(error){sealed=(await c.get(ref)).val();if(!sealed)throw error;}}
 await Promise.all(Object.entries(sealed.players).map(async([uid,row])=>{const path=c.ref(c.db,`playerTournaments/${uid}/${sealed.id}`);if((await c.get(path)).exists())return;try{await c.set(path,row);}catch(error){if(!(await c.get(path)).exists())throw error;}}));
 const honor=c.ref(c.db,`tournamentHonors/${sealed.champion}/champion`);if(!(await c.get(honor)).exists())try{await c.set(honor,{version:1,tournament:sealed.id,at:sealed.at});}catch(error){if(!(await c.get(honor)).exists())throw error;}
 return sealed;
}
export async function fetchTournamentResult(c,id){
 const result=(await c.get(c.ref(c.db,'tournamentResults/'+id))).val();if(!result)throw Error('This tournament result is unavailable.');
 const ids=[...Object.values(result.regular??{}),...(result.decider?[result.decider]:[])];
 const matches=await Promise.all(ids.map(async game=>(await c.get(c.ref(c.db,'matchResults/'+game))).val()));return {result,matches};
}
