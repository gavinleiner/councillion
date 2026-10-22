import { PACKS, PLAY_PACKS, ORIGINAL_PLAY_PACKS, MIXED_PACKS, answerCount } from './data.js';
import {normalize,matchAnswer,resolveAnswer} from './answer-matching.js';
export {normalize,matchAnswer,resolveAnswer,typoDistance} from './answer-matching.js';
export function hash(text){let n=2166136261;for(const c of text){n^=c.charCodeAt(0);n=Math.imul(n,16777619);}return n>>>0;}
export function random(seed){return()=>{seed+=0x6D2B79F5;let t=seed;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
export function shuffle(items,rng=Math.random){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function dateKey(date=new Date()){const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);return ['year','month','day'].map(k=>parts.find(p=>p.type===k).value).join('-');}
export const DAILY_FAMILIES=['gaming','nature','food','science','culture','world','everyday'];
const LEGACY_DAILY_FAMILIES=['words','nature','food','science','culture','world','everyday'];
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
 const historical=day<EXPANDED_DAILY_START;
 const chosen=(historical?LEGACY_DAILY_FAMILIES:DAILY_FAMILIES).map(family=>{
  const pool=(historical?ORIGINAL_PLAY_PACKS:MIXED_PACKS).filter(p=>p.family===family);if(!pool.length)throw Error('Missing daily family: '+family);
  const offset=hash(family)%pool.length,index=ordinal+offset,cycle=Math.floor(index/pool.length);
  return familyCycle(family,cycle,pool)[index%pool.length];
 });
 return shuffle(chosen,random(hash((historical?'councillion-daily-v2:':'councillion-daily-v4:')+day)));
}
export function tier(points){return points>=100?{name:'KRILLION',icon:'✦',color:'rarity-krillion'}:points>=85?{name:'DEEP CUT',icon:'◆',color:'rarity-deepcut'}:points>=60?{name:'RARE',icon:'✧',color:'rarity-rare'}:points>=30?{name:'SCHOOLER',icon:'◈',color:'rarity-schooler'}:points>0?{name:'PLANKTON',icon:'·',color:'rarity-plankton'}:{name:'NO ECHO',icon:'×',color:'muted'};}

export function partyDeck(rng=Math.random){
 const groups=new Map();
 for(const p of shuffle(MIXED_PACKS.filter(p=>answerCount(p)>=18),rng)){const key=p.group??p.id;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(p);}
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
export function practiceDraw(pending=[],featured=null,rng=Math.random){
 const pool=new Set(MIXED_PACKS.map(p=>p.id));let queue=[...new Set(pending)].filter(id=>pool.has(id)),ids=featured?[featured]:[];
 if(featured)queue=queue.filter(id=>id!==featured);
 const seen=new Set(ids);
 while(ids.length<7){if(!queue.length)queue=partyDeck(rng);const id=queue.shift();if(!seen.has(id)){ids.push(id);seen.add(id);}else queue.push(id);}
 return {ids,remaining:queue};
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
