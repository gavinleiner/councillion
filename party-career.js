import {validateDisplayName} from './moderation.js';
// Founding Court: placement-first multiplayer Elo. No rarity or cosmetic bonus
// changes rating. All counters are derived from immutable completed-match receipts.
export const CAREER_VERSION=1;
export const RANKS=[
 {id:'clerk',name:'TIDE CLERK',min:0,max:800,color:'#b4c5ce',mark:'I'},
 {id:'advocate',name:'REEF ADVOCATE',min:800,max:1000,color:'#7bdbc4',mark:'II'},
 {id:'counsel',name:'COUNSEL',min:1000,max:1200,color:'#68cefa',mark:'III'},
 {id:'barrister',name:'DEEP BARRISTER',min:1200,max:1400,color:'#a294ff',mark:'IV'},
 {id:'magistrate',name:'MAGISTRATE',min:1400,max:1600,color:'#dc9cf7',mark:'V'},
 {id:'justice',name:'ABYSSAL JUSTICE',min:1600,max:1800,color:'#f68da4',mark:'VI'},
 {id:'high-court',name:'HIGH COURT',min:1800,max:2100,color:'#f1c778',mark:'VII'},
 {id:'crown',name:'THE ABYSSAL CROWN',min:2100,max:Infinity,color:'#f7e5a2',mark:'VIII'}
];
export const ACCENTS={tide:'#72cfe9',mint:'#8bdfbc',amethyst:'#b9a0fa',coral:'#f69ab0',gold:'#edc77c',ice:'#c8e9f0'};
export const PATTERNS=['currents','constellation','court','trench'];
export const TRACKERS={
 wins:{label:'WINS',value:s=>s.wins.toLocaleString()},losses:{label:'LOSSES',value:s=>s.losses.toLocaleString()},winRate:{label:'WIN RATE',value:s=>s.matches?Math.round(100*s.wins/s.matches)+'%':'—'},
 rating:{label:'COURT RATING',value:s=>s.rating.toLocaleString()},ranked:{label:'RATED MATCHES',value:s=>s.ranked.toLocaleString()},answers:{label:'VALID ANSWERS',value:s=>s.answers.toLocaleString()},points:{label:'RARITY POINTS',value:s=>s.points.toLocaleString()},
 rare:{label:'DEEP CUTS',value:s=>s.rare.toLocaleString()},krillions:{label:'KRILLIONS',value:s=>s.krillions.toLocaleString()},winStreak:{label:'BEST WIN STREAK',value:s=>s.bestWinStreak.toLocaleString()},answerStreak:{label:'BEST ANSWER RUN',value:s=>s.bestAnswerStreak.toLocaleString()},
 fastest:{label:'FASTEST ANSWER',value:s=>s.fastestMs?(s.fastestMs/1000).toFixed(1)+'s':'—'},cleanWins:{label:'FLAWLESS WINS',value:s=>s.cleanWins.toLocaleString()},podiums:{label:'PODIUMS',value:s=>s.podiums.toLocaleString()}
};
export const BADGES=[
 {id:'founder',name:'FIRST APPEARANCE',description:'Finish your first Puffer match.',icon:'spark',test:s=>s.finished>=1},
 {id:'verdict',name:'FIRST VERDICT',description:'Win a Puffer match.',icon:'gavel',test:s=>s.wins>=1},
 {id:'crown',name:'TRIPLE CROWN',description:'Win three completed matches in a row.',icon:'crown',test:s=>s.bestWinStreak>=3},
 {id:'century',name:'ON THE RECORD',description:'Land 100 accepted answers.',icon:'book',test:s=>s.answers>=100},
 {id:'deep',name:'DEEP-CUT COUNSEL',description:'Land 25 answers worth at least 85 points.',icon:'gem',test:s=>s.rare>=25},
 {id:'krillion',name:'ONE IN A COUNSEL',description:'Find three 100-point answers.',icon:'star',test:s=>s.krillions>=3},
 {id:'ironclad',name:'IRONCLAD',description:'Win without losing a heart.',icon:'shield',test:s=>s.cleanWins>=1},
 {id:'streak',name:'CLOSING ARGUMENT',description:'Land 15 valid answers between lost hearts.',icon:'bolt',test:s=>s.bestAnswerStreak>=15},
 {id:'regular',name:'COURT REGULAR',description:'Finish 25 matches.',icon:'laurel',test:s=>s.finished>=25},
 {id:'placed',name:'COURT CERTIFIED',description:'Complete your five rated placement matches.',icon:'scales',test:s=>s.ranked>=5},
 {id:'justice',name:'BELOW THE LAW',description:'Reach Abyssal Justice or higher.',icon:'trident',test:s=>s.peakRating>=1600},
 {id:'speed',name:'QUICK COUNSEL',description:'Land a valid answer in under 2 seconds.',icon:'clock',test:s=>s.fastestMs>0&&s.fastestMs<2000}
];
export function emptyCareer(){return {rating:1000,peakRating:1000,ranked:0,finished:0,matches:0,wins:0,losses:0,voids:0,podiums:0,points:0,answers:0,rare:0,krillions:0,bestWinStreak:0,currentWinStreak:0,bestAnswerStreak:0,fastestMs:0,cleanWins:0,records:[]};}
export function careerFromReceipts(receipts={}){
 const s=emptyCareer(),seen=new Set();
 const records=Object.entries(receipts??{}).filter(([,r])=>r?.version===1&&Number.isFinite(r.at)).sort((a,b)=>a[1].at-b[1].at||a[0].localeCompare(b[0]));
 for(const [id,r] of records){if(seen.has(r.game))continue;seen.add(r.game);if(r.counted)s.finished++;s.points+=r.score||0;s.answers+=r.answers||0;s.rare+=r.rare||0;s.krillions+=r.krillions||0;s.bestAnswerStreak=Math.max(s.bestAnswerStreak,r.bestStreak||0);if(r.fastestMs>0)s.fastestMs=s.fastestMs?Math.min(s.fastestMs,r.fastestMs):r.fastestMs;
  if(r.counted){s.matches++;if(r.win){s.wins++;s.currentWinStreak++;s.bestWinStreak=Math.max(s.bestWinStreak,s.currentWinStreak);if(r.heartsLost===0)s.cleanWins++;}else{s.losses++;s.currentWinStreak=0;}if(r.place<=3&&r.playersCount>=3)s.podiums++;}else s.voids++;
  if(r.rated){s.ranked++;s.rating=Math.max(0,s.rating+Math.round(r.delta||0));s.peakRating=Math.max(s.peakRating,s.rating);}
  s.records.push({...r,id});
 }
 return s;
}
export function rankFor(career){const rank=RANKS.find(r=>career.rating<r.max)??RANKS.at(-1),span=rank.max-rank.min,division=Number.isFinite(span)?Math.min(2,Math.floor(3*(career.rating-rank.min)/span)):2;return {...rank,placed:career.ranked>=5,division:['III','II','I'][division],progress:Number.isFinite(span)?Math.max(0,Math.min(1,(career.rating-rank.min)/span)):1,next:RANKS[RANKS.indexOf(rank)+1]??null};}
export const unlockedBadges=s=>BADGES.filter(b=>b.test(s));
export function appearance(value={},career=emptyCareer()){
 const unlocked=new Set(unlockedBadges(career).map(b=>b.id)),stats=[...new Set(Array.isArray(value.stats)?value.stats:[])].filter(id=>Object.hasOwn(TRACKERS,id)).slice(0,3),badges=[...new Set(Array.isArray(value.badges)?value.badges:[])].filter(id=>unlocked.has(id)).slice(0,1);
 let tag='';try{if(String(value.tag??'').trim())tag=validateDisplayName(value.tag);}catch{}
 return {tag,accent:Object.hasOwn(ACCENTS,value.accent)?value.accent:'tide',pattern:PATTERNS.includes(value.pattern)?value.pattern:'currents',stats:[...stats,...['wins','answers','krillions'].filter(id=>!stats.includes(id))].slice(0,3),badges};
}
export function rosterKey(ids){let hash=2166136261;for(const c of [...ids].sort().join('|'))hash=Math.imul(hash^c.charCodeAt(0),16777619);return (hash>>>0).toString(16).padStart(8,'0');}
export function ratingDeltas(players){
 if(players.length<2)return Object.fromEntries(players.map(p=>[p.id,0]));const out={};
 for(const p of players){let total=0;for(const q of players)if(q.id!==p.id){const actual=p.place===q.place ? .5 : p.place<q.place?1:0,expected=1/(1+10**((q.rating-p.rating)/400));total+=actual-expected;}out[p.id]=Math.round((p.ranked<5?64:40)*total/(players.length-1));}
 return out;
}
export function matchResult(state,room,careers={},now=Date.now()){
 const ids=state.matchRoster??state.players.filter(p=>!p.spectator).map(p=>p.id),n=ids.length,players=ids.map(id=>state.players.find(p=>p.id===id)).filter(Boolean),winner=state.winner;
 const counted=ids.includes(winner)&&!state.voidReason&&n>=2&&players.length===n,key=rosterKey(ids),reason=!counted?(state.voidReason||'No final survivor; no win or loss recorded.'):state.mode!=='ranked'?'Casual match':now-(state.matchStartedAt??now)<15000?'Under 15 seconds':players.reduce((sum,p)=>sum+(p.answers||0),0)<2?'Needs two accepted answers':players.filter(p=>(p.answers||0)>0).length<2?'Needs two answering players':'Rated match';
 const rated=counted&&reason==='Rated match';
 const places=players.map(p=>({id:p.id,place:p.id===winner?1:Math.max(2,n-(p.eliminationOrder??0)),rating:state.matchRatings?.[p.id]?.rating??careers[p.id]?.rating??1000,ranked:state.matchRatings?.[p.id]?.ranked??careers[p.id]?.ranked??0}));
 const deltas=rated?ratingDeltas(places):{};
 const rows=Object.fromEntries(players.map(p=>[p.id,{version:1,room,game:state.matchId,at:now,mode:state.mode??'casual',roster:key,playersCount:n,counted,rated,win:counted&&p.id===winner,forfeit:!!p.forfeit,place:places.find(q=>q.id===p.id).place,score:p.score||0,answers:p.answers||0,rare:p.rare||0,krillions:p.krillions||0,bestStreak:p.bestStreak||0,fastestMs:p.fastestMs||0,heartsLost:p.heartsLost||0,delta:deltas[p.id]??0}]));
 return {game:state.matchId,room,at:now,reason,rated,counted,winner:winner||'',players:rows};
}
