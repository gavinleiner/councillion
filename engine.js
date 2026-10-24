import { PACKS, PLAY_PACKS, REVIEWED_PACKS, ORIGINAL_PLAY_PACKS, MIXED_PACKS, PARTY_PACKS, PACK_BY_ID, PARTY_IDS, canonicalQuestionId, answerCount } from './data.js';
import {normalize,matchAnswer,resolveAnswer} from './answer-matching.js';
export {normalize,matchAnswer,resolveAnswer,typoDistance} from './answer-matching.js';
import {hash,random,shuffle,varietyDeck} from './question-selection.js';
export {hash,random,shuffle} from './question-selection.js';
import {FRESH_DAILY_START,FRESH_DAILY_IDS} from './daily-schedule.js';
export const GROUP_DAILY_START='2026-10-24';
export const GROUP_DAILY_IDS=FRESH_DAILY_IDS.slice(7);
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
 if(day>=FRESH_DAILY_START){const index=Math.round((Date.parse(day+'T12:00:00Z')-Date.parse(FRESH_DAILY_START+'T12:00:00Z'))/86400000)*7;const ids=FRESH_DAILY_IDS.slice(index,index+7);return ids.length===7?ids.map(id=>PACK_BY_ID.get(id)):[];}
 const historical=day<EXPANDED_DAILY_START;
 const chosen=(historical?LEGACY_DAILY_FAMILIES:DAILY_FAMILIES).map(family=>{
  const pool=(historical?ORIGINAL_PLAY_PACKS:MIXED_PACKS).filter(p=>p.family===family);if(!pool.length)throw Error('Missing daily family: '+family);
  const offset=hash(family)%pool.length,index=ordinal+offset,cycle=Math.floor(index/pool.length);
  return familyCycle(family,cycle,pool)[index%pool.length];
 });
 return shuffle(chosen,random(hash((historical?'councillion-daily-v2:':'councillion-daily-v4:')+day)));
}
// A resumed Daily must be the published seven prompts in their published order.
export function isSharedDailyRun(run,day=dateKey()){
 if(run?.mode!=='daily'||run.day!==day||!Array.isArray(run.ids)||run.ids.length!==7)return false;
 const ids=dailyPacks(day).map(p=>p.id);return ids.length===7&&run.ids.every((id,i)=>id===ids[i]);
}
export function tier(points){return points>=100?{name:'KRILLION',icon:'✦',color:'rarity-krillion'}:points>=85?{name:'DEEP CUT',icon:'◆',color:'rarity-deepcut'}:points>=60?{name:'RARE',icon:'✧',color:'rarity-rare'}:points>=30?{name:'SCHOOLER',icon:'◈',color:'rarity-schooler'}:points>0?{name:'PLANKTON',icon:'·',color:'rarity-plankton'}:{name:'NO ECHO',icon:'×',color:'muted'};}

export function partyDeck(rng=Math.random,seen=[]){const excluded=new Set(seen.map(canonicalQuestionId));return shuffle(PARTY_PACKS.filter(p=>!excluded.has(canonicalQuestionId(p.id))).map(p=>p.id),rng);}
export function practiceDraw(pending=[],featured=null,rng=Math.random){
 if(featured&&!REVIEWED_PACKS.some(p=>p.id===featured))throw Error('This category has been retired. Choose a reviewed question.');
 const pool=new Set(MIXED_PACKS.map(p=>p.id));let queue=[...new Set(pending)].filter(id=>pool.has(id)),ids=featured?[featured]:[];
 if(featured)queue=queue.filter(id=>id!==featured);
 const seen=new Set(ids);
 while(ids.length<7){if(!queue.length)queue=varietyDeck(MIXED_PACKS,{rng});const id=queue.shift();if(!seen.has(id)){ids.push(id);seen.add(id);}else queue.push(id);}
 return {ids,remaining:queue};
}
export function refreshPartyQuestions(state,now=Date.now(),rng=Math.random){
 const allowed=PARTY_IDS,keep=['lobby','countdown'].includes(state.phase)?0:state.round,
 prefix=state.packIds.slice(0,keep),seen=new Set([...(state.seenIds??[]).map(canonicalQuestionId),...prefix.map(canonicalQuestionId)]),tail=[];
 for(const id of state.packIds.slice(keep)){const key=canonicalQuestionId(id);if(allowed.has(id)&&!seen.has(key)){tail.push(id);seen.add(key);}}
 const next=[...prefix,...tail,...partyDeck(rng,[...seen])],retired=state.phase==='playing'&&!allowed.has(state.packIds[state.round-1]);
 const changed=next.length!==state.packIds.length||next.some((id,i)=>id!==state.packIds[i]);if(changed)state.packIds=next;
 if(retired){state.phase='burst';state.nextAt=now+900;state.used=[];state.players.forEach(p=>delete p.lastAnswer);state.notice='Reviewed question refreshed · no heart lost.';}
 if(changed||retired)state.revision++;return changed||retired;
}
export function newParty(players,rng=Math.random,seenIds=[]){return {exhausted:false,seenIds:[...new Set(seenIds)],phase:'lobby',mode:'casual',players:players.map(p=>({...p,hearts:2,meter:0,score:0,connected:true,answers:0,rare:0,krillions:0,answerStreak:0,bestStreak:0,fastestMs:0,heartsLost:0,forfeit:false})),eliminations:[],turn:0,round:0,packIds:partyDeck(rng,seenIds),used:[],log:[],settings:{lives:2,maxLives:5,meterTarget:600,minTurnMs:8000,fuseMinMs:10000,fuseMaxMs:30000,maxPlayers:6},notice:'The court is assembling.',deadline:0,startedAt:0,revision:0};}
export const partyPack=s=>PACK_BY_ID.get(s.packIds[Math.max(s.round,1)-1]);
function alive(s){return s.players.filter(p=>p.connected&&p.hearts>0);}
function trackFinalDuel(s,now){const active=alive(s);if(active.length===2&&active.every(p=>p.hearts===1)){const ids=active.map(p=>p.id).sort();if(!s.finalDuel||s.finalDuel.ids.join('|')!==ids.join('|'))s.finalDuel={ids,startedAt:now,answers:Object.fromEntries(ids.map(id=>[id,0]))};}else if(active.length>1)delete s.finalDuel;}
function nextTurn(s){for(let n=1;n<=s.players.length;n++){const i=(s.turn+n)%s.players.length;if(s.players[i].connected&&s.players[i].hearts>0){s.turn=i;return;}}}
function victory(s,now=Date.now()){if(alive(s).length<=1){s.phase='ended';s.endedAt=now;s.deadline=0;s.winner=alive(s)[0]?.id??null;s.notice=alive(s)[0]?`${alive(s)[0].name} wins the verdict!`:'The room is empty.';return true;}return false;}
export function startParty(s,now=Date.now(),rng=Math.random){if(alive(s).length<2||!partyPack(s))return false;delete s.finalDuel;delete s.clutchFinish;s.phase='playing';s.skipVotes=[];s.round=1;s.seenIds=[...new Set([...(s.seenIds??[]),partyPack(s).id])];const eligible=s.players.map((p,i)=>p.connected&&p.hearts>0?i:-1).filter(i=>i>=0);s.turn=eligible.includes(s.firstTurn)?s.firstTurn:eligible[Math.min(eligible.length-1,Math.floor(rng()*eligible.length))];s.firstTurn=s.turn;s.deadline=now+Math.floor(s.settings.fuseMinMs+rng()*(s.settings.fuseMaxMs-s.settings.fuseMinMs));s.startedAt=now;s.turnStartedAt=now;s.matchStartedAt=now;s.notice='Court is in session. Pass the puffer!';s.revision++;return true;}
export function answerParty(s,id,text,now=Date.now()){
 if(s.phase!=='playing'||s.players[s.turn]?.id!==id)return {error:'Wait for your turn.'};
 if(now>=s.deadline)return {error:'The puffer already popped!'};
 const answer=matchAnswer(partyPack(s),String(text).slice(0,256));if(!answer)return {error:'Not in this answer bank. Try another answer.'};
 if(s.used.includes(normalize(answer.label)))return {error:'Already on the record. Try a different answer.'};
 trackFinalDuel(s,now);if(s.finalDuel)s.finalDuel.answers[id]=(s.finalDuel.answers[id]||0)+1;const player=s.players[s.turn];player.lastAnswer={label:answer.label,points:answer.points,at:now};s.passed={from:player.id,at:now};s.used.push(normalize(answer.label));player.score+=answer.points;player.meter+=answer.points;player.answers=(player.answers||0)+1;player.rare=(player.rare||0)+(answer.points>=85?1:0);player.krillions=(player.krillions||0)+(answer.points>=100?1:0);player.answerStreak=(player.answerStreak||0)+1;player.bestStreak=Math.max(player.bestStreak||0,player.answerStreak);const responseMs=Math.max(1,now-(s.turnStartedAt||s.startedAt));player.fastestMs=player.fastestMs?Math.min(player.fastestMs,responseMs):responseMs;
 let bonus='';if(player.meter>=s.settings.meterTarget){player.meter-=s.settings.meterTarget;if(player.hearts<s.settings.maxLives){player.hearts++;bonus=' +1 heart';}}
 trackFinalDuel(s,now);s.log.unshift({name:player.name,answer:answer.label,points:answer.points});s.log=s.log.slice(0,6);s.notice=`${player.name}: ${answer.label} (+${answer.points})${bonus}`;nextTurn(s);s.turnStartedAt=now;s.deadline=Math.max(s.deadline,now+s.settings.minTurnMs);
 if(s.used.length>=partyPack(s).answers.length){s.phase='burst';s.nextAt=now+2500;s.notice='Every answer found! A new case is coming.';}
 s.revision++;return {answer};
}
export function tickParty(s,now=Date.now(),rng=Math.random){
 if(s.phase==='playing'&&now>=s.deadline){trackFinalDuel(s,now);const duel=s.finalDuel,clutch=duel&&duel.ids.every(id=>(duel.answers[id]??0)>=1)&&now-duel.startedAt>=8000;const p=s.players[s.turn];p.hearts=Math.max(0,p.hearts-1);p.heartsLost=(p.heartsLost||0)+1;p.answerStreak=0;if(!p.hearts){s.eliminations??=[];p.eliminationOrder=s.eliminations.length;s.eliminations.push(p.id);}s.notice=`POP! ${p.name} ${p.hearts?'lost a heart.':'is out of the case.'}`;s.phase='burst';s.nextAt=now+3000;s.revision++;if(victory(s,now)){if(clutch&&duel.ids.includes(s.winner)&&!p.forfeit)s.clutchFinish={ids:duel.ids,exchanges:Object.values(duel.answers).reduce((a,b)=>a+b,0)};}else nextTurn(s);return true;}
 if(s.phase==='burst'&&now>=s.nextAt){if(victory(s,now))return true;s.round++;if(!partyPack(s)){s.phase='ended';s.exhausted=true;s.deadline=0;s.notice='You reached the end of the unseen questions. Earlier prompts will not be recycled.';s.revision++;return true;}s.seenIds=[...new Set([...(s.seenIds??[]),partyPack(s).id])];s.used=[];s.skipVotes=[];s.phase='playing';s.deadline=now+Math.floor(s.settings.fuseMinMs+rng()*(s.settings.fuseMaxMs-s.settings.fuseMinMs));s.startedAt=now;s.turnStartedAt=now;s.notice='New case. New answers. Same puffer.';s.revision++;return true;}return false;
}
export function disconnectPlayer(s,id,now=Date.now()){
 const p=s.players.find(p=>p.id===id);if(!p)return;p.connected=false;
 if(s.phase==='countdown')s.voidReason='A player left before the countdown finished.';
 if(s.phase!=='lobby'&&s.phase!=='ended'&&!p.spectator&&p.hearts>0){s.eliminations??=[];p.eliminationOrder=s.eliminations.length;s.eliminations.push(p.id);p.forfeit=true;}
 p.hearts=0;if(s.phase==='lobby')s.players=s.players.filter(p=>p.id!==id);else if(s.phase!=='ended'&&!victory(s,now)&&s.players[s.turn]?.id===id){nextTurn(s);s.turnStartedAt=now;}s.notice=`${p.name} left the room.`;s.revision++;
}
