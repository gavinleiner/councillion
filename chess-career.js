export const CHESS_START_RATING=1000;
export function chessRank(p){if(!p||p.played<5)return {id:'unranked',name:'Unranked'};return p.rating<900?{id:'bronze',name:'Bronze'}:p.rating<1100?{id:'silver',name:'Silver'}:p.rating<1400?{id:'gold',name:'Gold'}:p.rating<1700?{id:'platinum',name:'Platinum'}:{id:'court',name:'High Court'};}
const rows=x=>Object.values(x??{});
export function chessCareers(results={}){
 const profiles=new Map(),profile=(uid,name='Counsel')=>{if(!profiles.has(uid))profiles.set(uid,{uid,name,rating:CHESS_START_RATING,played:0,wins:0,losses:0,draws:0,streak:0,best:CHESS_START_RATING});const p=profiles.get(uid);p.name=name;return p;};
 for(const r of rows(results).filter(r=>r?.version===1).sort((a,b)=>a.at-b.at||a.game.localeCompare(b.game))){
  const players=rows(r.players);if(![2,4].includes(players.length))continue;const wt=rows(r.whiteTeam).length?rows(r.whiteTeam):[r.white],bt=rows(r.blackTeam).length?rows(r.blackTeam):[r.black];if(wt.length!==players.length/2||bt.length!==players.length/2||new Set([...wt,...bt]).size!==players.length)continue;
  const white=players.filter(p=>wt.includes(p.uid)).map(p=>profile(p.uid,p.name)),black=players.filter(p=>bt.includes(p.uid)).map(p=>profile(p.uid,p.name));if(white.length!==wt.length||black.length!==bt.length||!r.rated||r.aborted)continue;
  const ws=r.draw?0.5:wt.includes(r.winner)?1:bt.includes(r.winner)?0:null;if(ws===null)continue;const average=team=>team.reduce((n,p)=>n+p.rating,0)/team.length,expected=1/(1+10**((average(black)-average(white))/400));
  for(const [team,score,chance]of [[white,ws,expected],[black,1-ws,1-expected]])for(const p of team){const delta=Math.round((p.played<5?48:32)*(score-chance));p.rating=Math.max(100,p.rating+delta);p.played++;p.wins+=Number(score===1);p.losses+=Number(score===0);p.draws+=Number(score===.5);p.streak=score===1?p.streak+1:0;p.best=Math.max(p.best,p.rating);}

 }
 return profiles;
}
export function chessRatingDelta(results,game,uid){const target=rows(results).find(r=>r.game===game);if(!target?.rated||target.aborted)return null;const prior=rows(results).filter(r=>r.at<target.at||r.at===target.at&&r.game.localeCompare(game)<0),before=chessCareers(prior).get(uid)?.rating??1000,after=chessCareers([...prior,target]).get(uid)?.rating??1000;return after-before;}
export class ChessCareerStore{
 constructor(cloud,onChange=()=>{}){this.c=cloud;this.onChange=onChange;this.results={};this.profiles=new Map();this.off=cloud.onValue(cloud.ref(cloud.db,'chessResults'),s=>{this.results=s.val()??{};this.profiles=chessCareers(this.results);this.onChange();},()=>{this.error='Chess ratings could not reconnect.';this.onChange();});}
 get(uid){return this.profiles.get(uid)??{uid,rating:1000,played:0,wins:0,losses:0,draws:0,streak:0,best:1000};}
 close(){this.off?.();}
}
