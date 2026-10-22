import { PACKS } from './data.js';
export const normalize = value => String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9+#]/g,'');
export function hash(text){let n=2166136261;for(const c of text){n^=c.charCodeAt(0);n=Math.imul(n,16777619);}return n>>>0;}
export function random(seed){return()=>{seed+=0x6D2B79F5;let t=seed;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
export function shuffle(items,rng=Math.random){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function dateKey(date=new Date()){const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);return ['year','month','day'].map(k=>parts.find(p=>p.type===k).value).join('-');}
export function dailyPacks(day=dateKey()){return shuffle(PACKS,random(hash('councillion-v1:'+day))).slice(0,7);}
export function tier(points){return points>=100?{name:'KRILLION',icon:'✦',color:'rarity-krillion'}:points>=85?{name:'DEEP CUT',icon:'◆',color:'rarity-deepcut'}:points>=60?{name:'RARE',icon:'✧',color:'rarity-rare'}:points>=30?{name:'SCHOOLER',icon:'◈',color:'rarity-schooler'}:points>0?{name:'PLANKTON',icon:'·',color:'rarity-plankton'}:{name:'NO ECHO',icon:'×',color:'muted'};}

function oneEdit(a,b){if(a.length===b.length){const bad=[];for(let k=0;k<a.length;k++)if(a[k]!==b[k])bad.push(k);if(bad.length===2&&bad[1]===bad[0]+1&&a[bad[0]]===b[bad[1]]&&a[bad[1]]===b[bad[0]])return true;}if(Math.abs(a.length-b.length)>1)return false;let i=0,j=0,e=0;while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;}else {if(++e>1)return false;if(a.length>=b.length)i++;if(b.length>=a.length)j++;}}return e+(i<a.length||j<b.length?1:0)<=1;}
const compiledBanks=new WeakMap();
function compileBank(pack){let cached=compiledBanks.get(pack);if(cached)return cached;const exact=new Map(),byLength=new Map();for(const answer of pack.answers){for(const key of new Set([answer.label,...answer.aliases].map(normalize))){if(!exact.has(key))exact.set(key,answer);if(!byLength.has(key.length))byLength.set(key.length,[]);byLength.get(key.length).push({key,answer});}}cached={exact,byLength};compiledBanks.set(pack,cached);return cached;}
export function matchAnswer(pack,input){const query=normalize(input);if(!query)return null;const bank=compileBank(pack),exact=bank.exact.get(query);if(exact)return {...exact,corrected:false};if(query.length<5)return null;const near=new Map();for(const length of [query.length-1,query.length,query.length+1]){for(const entry of bank.byLength.get(length)??[]){if(entry.key.length>=5&&oneEdit(entry.key,query))near.set(entry.answer.label,entry.answer);}}return near.size===1?{...[...near.values()][0],corrected:true}:null;}

export function newParty(players,rng=Math.random){return {phase:'lobby',players:players.map(p=>({...p,hearts:2,meter:0,score:0,connected:true})),turn:0,round:0,packIds:shuffle(PACKS.filter(p=>p.answers.length>=18),rng).map(p=>p.id),used:[],log:[],settings:{lives:2,maxLives:5,meterTarget:600,minTurnMs:8000,fuseMinMs:10000,fuseMaxMs:30000,maxPlayers:6},notice:'The court is assembling.',deadline:0,startedAt:0,revision:0};}
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
 const player=s.players[s.turn];s.used.push(normalize(answer.label));player.score+=answer.points;player.meter+=answer.points;
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
