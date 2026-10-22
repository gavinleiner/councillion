import { PACKS, PLAY_PACKS, ORIGINAL_PLAY_PACKS, answerCount } from './data.js';
export const normalize = value => String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9+#]/g,'');
export function hash(text){let n=2166136261;for(const c of text){n^=c.charCodeAt(0);n=Math.imul(n,16777619);}return n>>>0;}
export function random(seed){return()=>{seed+=0x6D2B79F5;let t=seed;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
export function shuffle(items,rng=Math.random){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function dateKey(date=new Date()){const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);return ['year','month','day'].map(k=>parts.find(p=>p.type===k).value).join('-');}
export const DAILY_FAMILIES=['words','nature','food','science','culture','world','everyday'];
export const EXPANDED_DAILY_START='2026-10-23';
function familyCycle(family,cycle,pool){
 // A stable first item anchors each cycle. Interior order changes by cycle;
 // the last item can never equal the next cycle's first item.
 const base=shuffle(pool,random(hash('councillion-pool-v2:'+family)));
 return base.length<3?base:[base[0],...shuffle(base.slice(1),random(hash(family+':'+cycle)))];
}
export function dailyPacks(day=dateKey()){
 const ordinal=Math.floor(Date.parse(day+'T12:00:00Z')/86400000);
 if(!Number.isFinite(ordinal))throw Error('Invalid daily date.');
 const chosen=DAILY_FAMILIES.map(family=>{
  const pool=(day<EXPANDED_DAILY_START?ORIGINAL_PLAY_PACKS:PLAY_PACKS).filter(p=>p.family===family);if(!pool.length)throw Error('Missing daily family: '+family);
  const offset=hash(family)%pool.length,index=ordinal+offset,cycle=Math.floor(index/pool.length);
  return familyCycle(family,cycle,pool)[index%pool.length];
 });
 return shuffle(chosen,random(hash('councillion-daily-v2:'+day)));
}
export function tier(points){return points>=100?{name:'KRILLION',icon:'✦',color:'rarity-krillion'}:points>=85?{name:'DEEP CUT',icon:'◆',color:'rarity-deepcut'}:points>=60?{name:'RARE',icon:'✧',color:'rarity-rare'}:points>=30?{name:'SCHOOLER',icon:'◈',color:'rarity-schooler'}:points>0?{name:'PLANKTON',icon:'·',color:'rarity-plankton'}:{name:'NO ECHO',icon:'×',color:'muted'};}

// Typo tolerance scales with name length. Nearby keys, doubled letters and
// adjacent swaps are cheap; competing plausible answers are never auto-picked.
const keyboard=new Map();
for(const [row,letters] of ['qwertyuiop','asdfghjkl','zxcvbnm'].entries())for(const [col,letter] of [...letters].entries())keyboard.set(letter,[col+[0,.25,.75][row],row]);
function neighbor(a,b){const x=keyboard.get(a),y=keyboard.get(b);return x&&y&&Math.abs(x[0]-y[0])<=1.1&&Math.abs(x[1]-y[1])<=1;}
export function typoDistance(a,b,limit=300){
 if(a===b)return 0;
 let older,previous=Array.from({length:b.length+1},(_,i)=>i*100);
 for(let i=1;i<=a.length;i++){
  const row=[i*100];let minimum=row[0];
  for(let j=1;j<=b.length;j++){
   const substitution=a[i-1]===b[j-1]?0:neighbor(a[i-1],b[j-1])?65:100;
   const deletion=i>1&&a[i-1]===a[i-2]?55:100,insertion=j>1&&b[j-1]===b[j-2]?55:100;
   row[j]=Math.min(previous[j]+deletion,row[j-1]+insertion,previous[j-1]+substitution);
   if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])row[j]=Math.min(row[j],older[j-2]+65);
   minimum=Math.min(minimum,row[j]);
  }
  if(minimum>limit)return Infinity;older=previous;previous=row;
 }
 return previous[b.length];
}
const stopwords=new Set(['a','an','the','of','and','to','in','for','on','at','from']);
function abbreviations(label){
 const words=String(label).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().match(/[a-z0-9]+/g)||[];
 if(words.length<2)return [];
 const initials=items=>items.map(w=>/^[ivx]+$/.test(w)&&w.length<=4?w:w[0]).join('');
 return [...new Set([initials(words),initials(words.filter(w=>!stopwords.has(w)))])].filter(k=>k.length>=2&&k.length<=10&&/[a-z]/.test(k));
}
const compiledBanks=new WeakMap();
function compileBank(pack){
 let cached=compiledBanks.get(pack);if(cached)return cached;
 const exact=new Map(),byLength=new Map(),short=new Map();
 for(const answer of pack.answers){
  for(const key of new Set([answer.label,...answer.aliases].map(normalize))){
   if(!exact.has(key))exact.set(key,answer);
   if(!byLength.has(key.length))byLength.set(key.length,[]);byLength.get(key.length).push({key,answer});
  }
  for(const key of abbreviations(answer.label)){
   if(!short.has(key))short.set(key,new Map());short.get(key).set(answer.label,answer);
  }
 }
 cached={exact,byLength,short};compiledBanks.set(pack,cached);return cached;
}
export function matchAnswer(pack,input){
 const query=normalize(input);if(!query)return null;
 const bank=compileBank(pack),exact=bank.exact.get(query);if(exact)return {...exact,corrected:false};
 const abbreviated=bank.short.get(query);
 if(abbreviated?.size===1)return {...[...abbreviated.values()][0],corrected:true,abbreviated:true};
 if(abbreviated?.size>1||query.length<5)return null;
 const limit=query.length>=18?350:query.length>=10?280:query.length>=8?180:100;
 const span=query.length>=10?3:query.length>=8?2:1,candidates=new Map();
 for(let length=Math.max(5,query.length-span);length<=query.length+span;length++)for(const {key,answer} of bank.byLength.get(length)||[]){
  const cost=typoDistance(query,key,limit);if(cost<=limit&&cost<(candidates.get(answer.label)?.cost??Infinity))candidates.set(answer.label,{answer,cost});
 }
 const ordered=[...candidates.values()].sort((a,b)=>a.cost-b.cost);
 if(!ordered.length||ordered[1]&&ordered[1].cost-ordered[0].cost<55)return null;
 return {...ordered[0].answer,corrected:true};
}

export function partyDeck(rng=Math.random){
 const groups=new Map();
 for(const p of shuffle(PLAY_PACKS.filter(p=>answerCount(p)>=18),rng)){const key=p.group??p.id;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(p);}
 const ordered=[];let previous,total=[...groups.values()].reduce((n,g)=>n+g.length,0);
 while(total){
  let candidates=[...groups].filter(([key,g])=>g.length&&key!==previous);
  const feasible=candidates.filter(([key])=>[...groups].every(([other,g])=>g.length-(other===key?1:0)<=(other===key?Math.floor((total-1)/2):Math.ceil((total-1)/2))));
  if(feasible.length)candidates=feasible;if(!candidates.length)candidates=[...groups].filter(([,g])=>g.length);
  let roll=rng()*candidates.reduce((n,[,g])=>n+g.length,0),chosen=candidates.at(-1);
  for(const candidate of candidates){roll-=candidate[1].length;if(roll<0){chosen=candidate;break;}}
  previous=chosen[0];ordered.push(chosen[1].pop().id);total--;
 }
 return ordered;
}
export function newParty(players,rng=Math.random){return {phase:'lobby',players:players.map(p=>({...p,hearts:2,meter:0,score:0,connected:true})),turn:0,round:0,packIds:partyDeck(rng),used:[],log:[],settings:{lives:2,maxLives:5,meterTarget:600,minTurnMs:8000,fuseMinMs:10000,fuseMaxMs:30000,maxPlayers:6},notice:'The court is assembling.',deadline:0,startedAt:0,revision:0};}
export const partyPack=s=>PACKS.find(p=>p.id===s.packIds[(Math.max(s.round,1)-1)%s.packIds.length]);
function alive(s){return s.players.filter(p=>p.connected&&p.hearts>0);}
function nextTurn(s){for(let n=1;n<=s.players.length;n++){const i=(s.turn+n)%s.players.length;if(s.players[i].connected&&s.players[i].hearts>0){s.turn=i;return;}}}
function victory(s){if(alive(s).length<=1){s.phase='ended';s.deadline=0;s.winner=alive(s)[0]?.id??null;s.notice=alive(s)[0]?`${alive(s)[0].name} wins the verdict!`:'The room is empty.';return true;}return false;}
export function startParty(s,now=Date.now(),rng=Math.random){if(alive(s).length<2)return false;s.phase='playing';s.round=1;s.turn=s.players.findIndex(p=>p.connected&&p.hearts>0);s.deadline=now+Math.floor(s.settings.fuseMinMs+rng()*(s.settings.fuseMaxMs-s.settings.fuseMinMs));s.startedAt=now;s.notice='Court is in session. Pass the puffer!';s.revision++;return true;}
export function answerParty(s,id,text,now=Date.now()){
 if(s.phase!=='playing'||s.players[s.turn]?.id!==id)return {error:'Wait for your turn.'};
 if(now>=s.deadline)return {error:'The puffer already popped!'};
 const answer=matchAnswer(partyPack(s),String(text).slice(0,256));if(!answer)return {error:'Not in this answer bank. Try another answer.'};
 if(s.used.includes(normalize(answer.label)))return {error:'Already on the record. Try a different answer.'};
 const player=s.players[s.turn];player.lastAnswer={label:answer.label,points:answer.points,at:now};s.passed={from:player.id,at:now};s.used.push(normalize(answer.label));player.score+=answer.points;player.meter+=answer.points;
 let bonus='';if(player.meter>=s.settings.meterTarget){player.meter-=s.settings.meterTarget;if(player.hearts<s.settings.maxLives){player.hearts++;bonus=' +1 heart';}}
 s.log.unshift({name:player.name,answer:answer.label,points:answer.points});s.log=s.log.slice(0,6);s.notice=`${player.name}: ${answer.label} (+${answer.points})${bonus}`;nextTurn(s);s.deadline=Math.max(s.deadline,now+s.settings.minTurnMs);
 if(s.used.length>=partyPack(s).answers.length){s.phase='burst';s.nextAt=now+2500;s.notice='Every answer found! A new case is coming.';}
 s.revision++;return {answer};
}
export function tickParty(s,now=Date.now(),rng=Math.random){
 if(s.phase==='playing'&&now>=s.deadline){const p=s.players[s.turn];p.hearts=Math.max(0,p.hearts-1);s.notice=`POP! ${p.name} ${p.hearts?'lost a heart.':'is out of the case.'}`;s.phase='burst';s.nextAt=now+3000;s.revision++;if(!victory(s))nextTurn(s);return true;}
 if(s.phase==='burst'&&now>=s.nextAt){if(victory(s))return true;s.round++;s.used=[];s.phase='playing';s.deadline=now+Math.floor(s.settings.fuseMinMs+rng()*(s.settings.fuseMaxMs-s.settings.fuseMinMs));s.startedAt=now;s.notice='New case. New answers. Same puffer.';s.revision++;return true;}return false;
}
export function disconnectPlayer(s,id){const p=s.players.find(p=>p.id===id);if(!p)return;p.connected=false;p.hearts=0;if(s.phase==='lobby')s.players=s.players.filter(p=>p.id!==id);else if(!victory(s)&&s.players[s.turn]?.id===id)nextTurn(s);s.notice=`${p.name} left the room.`;s.revision++;}
