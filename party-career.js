import {SOLO_DEFAULTS} from './solo-career.js';
// Founding Court: placement-first multiplayer Elo. No rarity or cosmetic bonus
// changes rating. All counters are derived from immutable completed-match receipts.
export const CAREER_VERSION=1;
export const RANKS=[
 {id:'bronze',name:'BRONZE',min:0,max:800,color:'#cf9967',mark:'I'},
 {id:'silver',name:'SILVER',min:800,max:1000,color:'#c7d6e3',mark:'II'},
 {id:'gold',name:'GOLD',min:1000,max:1200,color:'#efd084',mark:'III'},
 {id:'platinum',name:'PLATINUM',min:1200,max:1600,color:'#b4e0e5',mark:'IV'},
 {id:'court',name:'HIGH COURT',min:1600,max:Infinity,color:'#f8df9a',mark:'V'}
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
 {id:'founder',name:'DEBUT',description:'Finish your first Puffer match.',icon:'spark',test:s=>s.finished>=1},
 {id:'verdict',name:'FIRST WIN',description:'Win a Puffer match.',icon:'gavel',test:s=>s.wins>=1},
 {id:'crown',name:'UNBEATEN',description:'Win three completed matches in a row.',icon:'crown',test:s=>s.bestWinStreak>=3},
 {id:'century',name:'PUFFER 100',description:'Land 100 accepted answers.',icon:'book',test:s=>s.answers>=100},
 {id:'deep',name:'DEEP COUNSEL',description:'Land 25 answers worth at least 85 points.',icon:'gem',test:s=>s.rare>=25},
 {id:'krillion',name:'KRILLION CLUB',description:'Find three 100-point answers.',icon:'star',test:s=>s.krillions>=3},
 {id:'ironclad',name:'FLAWLESS',description:'Win without losing a heart.',icon:'shield',test:s=>s.cleanWins>=1},
 {id:'streak',name:'15 STREAK',description:'Land 15 valid answers between lost hearts.',icon:'bolt',test:s=>s.bestAnswerStreak>=15},
 {id:'regular',name:'REGULAR',description:'Finish 25 matches.',icon:'laurel',test:s=>s.finished>=25},
 {id:'placed',name:'PLACED',description:'Complete your five rated placement matches.',icon:'scales',test:s=>s.ranked>=5},
 {id:'justice',name:'1600 CLUB',description:'Reach High Court (1,600 Court Rating).',icon:'trident',test:s=>s.peakRating>=1600},
 {id:'speed',name:'QUICKDRAW',description:'Land a valid answer in under 2 seconds.',icon:'clock',test:s=>s.fastestMs>0&&s.fastestMs<2000}
];
// Cross-game titles use the same original achievement system, with concrete goals.
const titles=(scope,field,goals)=>goals.map(([target,name])=>({id:scope+'-'+field+'-'+target,name,scope,field,target,description:(scope==='all'?'Across all modes':scope.toUpperCase())+' · '+target.toLocaleString()+' '+({allAnswers:'valid answers',allRare:'answers worth 85+ points',allKrillions:'100-point answers',allPoints:'rarity points',dailyDives:'completed Daily Dives',dailyStreak:'consecutive Daily days',practiceDives:'completed Practice Dives',bestDive:'points in one dive',deepestDive:'metres in one dive',perfectDives:'dives with seven valid answers',caseCorrect:'correct case answers',caseClears:'five-answer case challenges cleared',wins:'Puffer wins',finished:'completed Puffer matches',peakRating:'peak Court Rating'}[field]??field),test:s=>(s[field]??0)>=target}));
BADGES.forEach(b=>{b.scope='puffer';});
BADGES.push(
 ...titles('all','allAnswers',[[100,'100 CLUB'],[250,'WELL READ'],[500,'ON RECORD'],[1000,'ENCYCLOPEDIC'],[2500,'THE ARCHIVE']]),
 ...titles('all','allRare',[[10,'OFF THE BEATEN PATH'],[25,'DEEP CUT'],[50,'HIDDEN KNOWLEDGE'],[100,'DEEP RESEARCH'],[250,'SPECIALIST']]),
 ...titles('all','allKrillions',[[1,'ONE IN A KRILLION'],[3,'RARE FIND'],[10,'COLLECTOR'],[25,'EXCEPTIONAL'],[50,'ANOMALY']]),
 ...titles('all','allPoints',[[1000,'FOUR FIGURES'],[5000,'MOMENTUM'],[10000,'FIVE FIGURES'],[25000,'HIGH OUTPUT'],[50000,'BODY OF WORK']]),
 ...titles('daily','dailyDives',[[1,'FIRST DESCENT'],[7,'WEEK ONE'],[30,'DAILY REGULAR'],[60,'ESTABLISHED'],[100,'CENTENNIAL'],[180,'LONG GAME']]),
 ...titles('daily','dailyStreak',[[3,'ON SCHEDULE'],[7,'UNBROKEN WEEK'],[14,'CONSISTENT'],[30,'MONTH STRAIGHT'],[60,'UNINTERRUPTED']]),
 ...titles('practice','practiceDives',[[1,'WARMUP'],[10,'REHEARSED'],[25,'IN PRACTICE'],[50,'DEDICATED'],[100,'PUTTING IN WORK']]),
 ...titles('all','perfectDives',[[1,'SEVEN FOR SEVEN'],[5,'CLEAN RECORD'],[10,'RELIABLE'],[25,'PRECISION']]),
 ...titles('depth','bestDive',[[250,'SOLID GROUND'],[350,'BELOW THE SURFACE'],[450,'DEEPWATER'],[550,'THE TRENCH'],[650,'ALMOST PERFECT'],[700,'THE FULL 700']]),
 ...titles('depth','deepestDive',[[2000,'OPEN WATER'],[3000,'BATHYAL'],[4000,'ABYSSAL'],[5000,'HADAL'],[6000,'SIX THOUSAND'],[7000,'SEVEN KILOMETRES']]),
 ...titles('endless','caseCorrect',[[5,'ON THE CASE'],[25,'CASE READER'],[50,'CLOSE READING'],[100,'CASE SCHOLAR'],[250,'THE CASEBOOK'],[500,'DEEP PRECEDENT']]),
 ...titles('endless','caseClears',[[1,'CASE CLOSED'],[5,'FIVE VERDICTS'],[10,'TEN FOR THE RECORD'],[25,'PREPARED'],[50,'FULL DOCKET'],[100,'COMPLETE RECORD']]),
 ...titles('puffer','wins',[[5,'FIVE WINS'],[10,'CONTENDER'],[25,'PROVEN'],[50,'FRONTRUNNER'],[100,'TRIPLE DIGITS']]),
 ...titles('puffer','finished',[[50,'FIXTURE'],[100,'VETERAN'],[250,'INSTITUTION']]),
 ...titles('puffer','peakRating',[[1200,'BARRISTER'],[1400,'MAGISTRATE'],[1800,'HIGH COURT'],[2100,'CROWNED']])
);
Object.assign(TRACKERS,{bestDive:{label:'BEST DIVE',value:s=>s.bestDive.toLocaleString()},deepestDive:{label:'DEEPEST DIVE',value:s=>s.deepestDive.toLocaleString()+'m'},dailyDives:{label:'DAILY DIVES',value:s=>s.dailyDives.toLocaleString()},dailyStreak:{label:'BEST DAILY STREAK',value:s=>s.dailyStreak.toLocaleString()},practiceDives:{label:'PRACTICE DIVES',value:s=>s.practiceDives.toLocaleString()},caseCorrect:{label:'CORRECT CASE ANSWERS',value:s=>s.caseCorrect.toLocaleString()},caseClears:{label:'CASE CHALLENGES',value:s=>s.caseClears.toLocaleString()},allAnswers:{label:'ALL MODE ANSWERS',value:s=>s.allAnswers.toLocaleString()},allKrillions:{label:'ALL KRILLIONS',value:s=>s.allKrillions.toLocaleString()}});
export function emptyCareer(){return {...SOLO_DEFAULTS,rating:1000,peakRating:1000,ranked:0,finished:0,matches:0,wins:0,losses:0,voids:0,podiums:0,points:0,answers:0,rare:0,krillions:0,bestWinStreak:0,currentWinStreak:0,bestAnswerStreak:0,fastestMs:0,cleanWins:0,records:[]};}
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
export function rankFor(career){const rank=RANKS.find(r=>career.rating<r.max)??RANKS.at(-1),span=rank.max-rank.min,division=Number.isFinite(span)?Math.min(2,Math.floor(3*(career.rating-rank.min)/span)):2;return {...rank,placed:career.ranked>=5,division:Number.isFinite(span)?['III','II','I'][division]:'',progress:Number.isFinite(span)?Math.max(0,Math.min(1,(career.rating-rank.min)/span)):1,next:RANKS[RANKS.indexOf(rank)+1]??null};}
export const unlockedBadges=s=>BADGES.filter(b=>b.test(s));
export function appearance(value={},career=emptyCareer()){
 const unlocked=new Set(unlockedBadges(career).map(b=>b.id)),stats=[...new Set(Array.isArray(value.stats)?value.stats:[])].filter(id=>Object.hasOwn(TRACKERS,id)).slice(0,3),badges=[...new Set(Array.isArray(value.badges)?value.badges:[])].filter(id=>unlocked.has(id)).slice(0,1);
 const tag='';
 return {tag,accent:Object.hasOwn(ACCENTS,value.accent)?value.accent:'tide',pattern:PATTERNS.includes(value.pattern)?value.pattern:'currents',stats:[...stats,...['wins','answers','krillions'].filter(id=>!stats.includes(id))].slice(0,3),badges};
}
export function rosterKey(ids){let hash=2166136261;for(const c of [...ids].sort().join('|'))hash=Math.imul(hash^c.charCodeAt(0),16777619);return (hash>>>0).toString(16).padStart(8,'0');}
export function rankedWinStreak(records=[]){let streak=0;for(const r of records){if(r.mode==='ranked'&&r.counted&&!r.win)streak=0;else if(r.rated&&r.win)streak++;}return streak;}
export function ratingDeltas(players){
 if(players.length<2||players.every(p=>p.place===players[0].place))return Object.fromEntries(players.map(p=>[p.id,0]));const out={};
 for(const p of players){let expected=0;for(const q of players)if(q.id!==p.id)expected+=1/(1+10**((q.rating-p.rating)/400));expected/=players.length-1;let delta;if(p.place===1){delta=40+20*(.5-expected)+Math.min(24,8*(p.streak??0))+(p.clutch?8:0);}else{const placement=players.length===2?.5:(p.place-2)/Math.max(1,players.length-2);let loss=12+12*placement+12*(expected-.5);if(p.clutch)loss*=.5;if(p.forfeit)loss=Math.max(28,loss);delta=-Math.max(6,loss);}out[p.id]=Math.max(-64,Math.min(64,Math.round(delta)));}
 return out;
}
export function matchResult(state,room,careers={},now=Date.now()){
 const ids=state.matchRoster??state.players.filter(p=>!p.spectator).map(p=>p.id),n=ids.length,players=ids.map(id=>state.players.find(p=>p.id===id)).filter(Boolean),winner=state.winner;
 const counted=ids.includes(winner)&&!state.voidReason&&n>=2&&players.length===n,key=rosterKey(ids),reason=!counted?(state.voidReason||'No final survivor; no win or loss recorded.'):state.mode!=='ranked'?'Casual match':now-(state.matchStartedAt??now)<15000?'Under 15 seconds':players.reduce((sum,p)=>sum+(p.answers||0),0)<2?'Needs two accepted answers':players.filter(p=>(p.answers||0)>0).length<2?'Needs two answering players':'Rated match';
 const rated=counted&&reason==='Rated match',clutch=!!state.clutchFinish&&state.clutchFinish.ids?.includes(winner),ratingReason=rated&&clutch?'Rated match · close final duel: +8 clutch bonus, reduced runner-up loss':reason;
 const places=players.map(p=>({id:p.id,place:p.id===winner?1:Math.max(2,n-(p.eliminationOrder??0)),rating:state.matchRatings?.[p.id]?.rating??careers[p.id]?.rating??1000,ranked:state.matchRatings?.[p.id]?.ranked??careers[p.id]?.ranked??0,streak:state.matchRatings?.[p.id]?.streak??rankedWinStreak((careers[p.id]?.records??[]).filter(r=>r.game!==state.matchId)),forfeit:!!p.forfeit,clutch:clutch&&state.clutchFinish.ids.includes(p.id)}));
 const deltas=rated?ratingDeltas(places):{};
 const rows=Object.fromEntries(players.map(p=>[p.id,{version:1,room,game:state.matchId,at:now,mode:state.mode??'casual',roster:key,playersCount:n,counted,rated,win:counted&&p.id===winner,forfeit:!!p.forfeit,place:places.find(q=>q.id===p.id).place,score:p.score||0,answers:p.answers||0,rare:p.rare||0,krillions:p.krillions||0,bestStreak:p.bestStreak||0,fastestMs:p.fastestMs||0,heartsLost:p.heartsLost||0,delta:deltas[p.id]??0}]));
 return {game:state.matchId,room,at:now,reason:ratingReason,rated,counted,winner:winner||'',players:rows};
}
